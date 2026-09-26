"""Ingestão segura com job assíncrono idempotente (M13 B3).

Modelo:
- ``SnapshotStore``: conteúdo endereçado por hash (SHA-256); o mesmo arquivo
  ingerido duas vezes não duplica bytes nem entradas — idempotência estrutural.
- ``JobStore``: estado de jobs persistido em JSON; ``submit`` com a mesma
  ``idempotency_key`` retorna o job existente em vez de criar outro.
- ``IngestionWorker``: processa arquivos um a um com checkpoint após cada um;
  cancelamento é um flag cooperativo verificado entre arquivos; após crash,
  ``recover_interrupted`` devolve o job a ``queued`` e ``run`` retoma do
  checkpoint (cada arquivo é gravado de forma idempotente).

Limites aplicados: tamanho máximo por arquivo, total de arquivos, detecção de
binário (byte nulo) e ignore rules (``.git``, ``.env*``, ``__pycache__``).
"""

from __future__ import annotations

import hashlib
import json
import threading
from collections.abc import Callable
from dataclasses import dataclass, field
from pathlib import Path, PurePosixPath
from typing import Any

IGNORED_PARTS = {".git", "__pycache__", ".mypy_cache", ".ruff_cache"}
SECRET_LIKE_PREFIX = (".env",)

MAX_FILE_BYTES = 1_000_000
MAX_FILES = 10_000

QUEUED = "queued"
RUNNING = "running"
DONE = "done"
FAILED = "failed"
CANCELLED = "cancelled"


class IngestionError(Exception):
    """Erro de ingestão limitado por política."""


def _is_binary(data: bytes) -> bool:
    return b"\x00" in data


def _is_ignored(rel: PurePosixPath) -> bool:
    return any(part in IGNORED_PARTS or part.startswith(SECRET_LIKE_PREFIX) for part in rel.parts)


@dataclass
class JobRecord:
    idempotency_key: str
    status: str = QUEUED
    processed: list[str] = field(default_factory=list)
    skipped: list[str] = field(default_factory=list)
    error: str | None = None
    cancel_requested: bool = False


class SnapshotStore:
    """Armazena snapshots por tenant/repo com deduplicação por hash."""

    def __init__(self, root: Path) -> None:
        self.root = root
        root.mkdir(parents=True, exist_ok=True)

    def _repo_dir(self, tenant: str, repo: str) -> Path:
        return self.root / tenant / repo

    def store_file(self, tenant: str, repo: str, rel_path: str, content: bytes) -> str:
        """Grava conteúdo de forma atômica e retorna o sha256. Idempotente."""
        digest = hashlib.sha256(content).hexdigest()
        dest = self._repo_dir(tenant, repo) / "files" / digest
        dest.parent.mkdir(parents=True, exist_ok=True)
        if not dest.exists():
            tmp = dest.with_suffix(".tmp")
            tmp.write_bytes(content)
            tmp.replace(dest)  # rename atômico dentro do mesmo filesystem
        index = self._repo_dir(tenant, repo) / "index.json"
        entries: dict[str, str] = {}
        if index.exists():
            entries = json.loads(index.read_text(encoding="utf-8"))
        entries[rel_path] = digest
        tmp_index = index.with_suffix(".tmp")
        tmp_index.write_text(json.dumps(entries, sort_keys=True), encoding="utf-8")
        tmp_index.replace(index)
        return digest


class JobStore:
    """Estado de jobs persistido em arquivo JSON (escopo do lab: processo único)."""

    def __init__(self, path: Path) -> None:
        self.path = path
        self._lock = threading.Lock()

    def _load(self) -> dict[str, dict[str, Any]]:
        if self.path.exists():
            result: dict[str, dict[str, Any]] = json.loads(self.path.read_text(encoding="utf-8"))
            return result
        return {}

    def _save(self, data: dict[str, dict[str, Any]]) -> None:
        tmp = self.path.with_suffix(".tmp")
        tmp.write_text(json.dumps(data, indent=2, sort_keys=True), encoding="utf-8")
        tmp.replace(self.path)

    def get(self, key: str) -> JobRecord | None:
        raw = self._load().get(key)
        if raw is None:
            return None
        return JobRecord(
            idempotency_key=key,
            status=str(raw["status"]),
            processed=[str(p) for p in raw.get("processed", [])],
            skipped=[str(p) for p in raw.get("skipped", [])],
            error=None if raw.get("error") is None else str(raw["error"]),
            cancel_requested=bool(raw.get("cancel_requested", False)),
        )

    def upsert(self, rec: JobRecord) -> None:
        with self._lock:
            data = self._load()
            data[rec.idempotency_key] = {
                "status": rec.status,
                "processed": rec.processed,
                "skipped": rec.skipped,
                "error": rec.error,
                "cancel_requested": rec.cancel_requested,
            }
            self._save(data)

    def recover_interrupted(self) -> list[str]:
        """Jobs 'running' após um crash voltam a 'queued' para retomada."""
        with self._lock:
            data = self._load()
            recovered: list[str] = []
            for key, raw in data.items():
                if raw["status"] == RUNNING:
                    raw["status"] = QUEUED
                    recovered.append(key)
            self._save(data)
            return recovered


class IngestionWorker:
    """Executa ingestão arquivo a arquivo, com checkpoint e cancelamento."""

    def __init__(self, store: SnapshotStore, jobs: JobStore) -> None:
        self.store = store
        self.jobs = jobs
        self.on_file_processed: Callable[[str], None] | None = None

    def submit(self, idempotency_key: str) -> JobRecord:
        """Mesma chave devolve o job existente — submissão é idempotente."""
        existing = self.jobs.get(idempotency_key)
        if existing is not None and existing.status in {QUEUED, RUNNING, DONE}:
            return existing
        rec = existing or JobRecord(idempotency_key=idempotency_key)
        rec.status = QUEUED
        rec.error = None
        self.jobs.upsert(rec)
        return rec

    def cancel(self, idempotency_key: str) -> None:
        rec = self.jobs.get(idempotency_key)
        if rec is None:
            raise IngestionError(f"job desconhecido: {idempotency_key}")
        rec.cancel_requested = True
        self.jobs.upsert(rec)

    def retry(self, idempotency_key: str) -> JobRecord:
        """Retomada explícita de job cancelado/falho: limpa o flag de cancelamento."""
        rec = self.jobs.get(idempotency_key)
        if rec is None:
            raise IngestionError(f"job desconhecido: {idempotency_key}")
        rec.cancel_requested = False
        rec.error = None
        rec.status = QUEUED
        self.jobs.upsert(rec)
        return rec

    def run(self, idempotency_key: str, tenant: str, repo: str, source_dir: Path) -> JobRecord:
        """Executa ou retoma o job; arquivos já processados não são reprocessados."""
        rec = self.submit(idempotency_key)
        if rec.status in {DONE, CANCELLED}:
            return rec
        rec.status = RUNNING
        self.jobs.upsert(rec)
        try:
            for f in sorted(source_dir.rglob("*")):
                if not f.is_file():
                    continue
                rel = f.relative_to(source_dir).as_posix()
                if _is_ignored(PurePosixPath(rel)) or f.name.startswith(SECRET_LIKE_PREFIX):
                    if rel not in rec.skipped:
                        rec.skipped.append(rel)
                        self.jobs.upsert(rec)
                    continue
                if rel in rec.processed or rel in rec.skipped:
                    continue
                if len(rec.processed) >= MAX_FILES:
                    raise IngestionError(f"limite de arquivos excedido ({MAX_FILES})")
                rec = self.jobs.get(idempotency_key) or rec  # re-lê cancel_requested
                if rec.cancel_requested:
                    rec.status = CANCELLED
                    self.jobs.upsert(rec)
                    return rec
                data = f.read_bytes()
                if len(data) > MAX_FILE_BYTES or _is_binary(data):
                    rec.skipped.append(rel)
                    self.jobs.upsert(rec)
                    continue
                self.store.store_file(tenant, repo, rel, data)
                rec.processed.append(rel)
                self.jobs.upsert(rec)
                if self.on_file_processed is not None:
                    self.on_file_processed(rel)
            rec.status = DONE
        except Exception as exc:  # falha vira estado observável do job, não traceback solto
            rec.status = FAILED
            rec.error = f"{type(exc).__name__}: {exc}"
        self.jobs.upsert(rec)
        return rec

    def run_async(self, key: str, tenant: str, repo: str, source_dir: Path) -> JobHandle:
        """Dispara o job em thread de fundo; a chamada retorna imediatamente."""
        self.submit(key)  # registra o job antes de soltar o caller
        thread = threading.Thread(
            target=self.run, args=(key, tenant, repo, source_dir), daemon=True
        )
        thread.start()
        return JobHandle(key=key, thread=thread, jobs=self.jobs)


@dataclass
class JobHandle:
    """Handle de polling do job — substitui uma request HTTP presa."""

    key: str
    thread: threading.Thread
    jobs: JobStore

    def status(self) -> str:
        rec = self.jobs.get(self.key)
        return rec.status if rec is not None else "unknown"

    def wait(self, timeout: float | None = None) -> str:
        self.thread.join(timeout)
        return self.status()
