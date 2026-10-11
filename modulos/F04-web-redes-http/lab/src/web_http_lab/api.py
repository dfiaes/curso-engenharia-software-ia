"""API REST em memória sobre http.server.

Recursos (/notes), Problem Details (RFC 9457), ETag com If-None-Match (304) e If-Match (412),
paginação por cursor e Idempotency-Key no POST.
"""

from __future__ import annotations

import hashlib
import json
import re
import threading
from collections.abc import Iterator, Mapping
from contextlib import contextmanager
from dataclasses import dataclass, field
from http import HTTPStatus
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from typing import Any
from urllib.parse import parse_qs, quote, urlsplit

MAX_BODY = 64 * 1024
DEFAULT_LIMIT = 20
MAX_LIMIT = 100
NOTE_PATH = re.compile(r"/notes/([0-9]+)")
PROBLEM_JSON = "application/problem+json"


class ApiError(Exception):
    """Erro com representação HTTP: vira um documento application/problem+json."""

    def __init__(
        self,
        status: int,
        slug: str,
        title: str,
        detail: str = "",
        *,
        errors: list[dict[str, str]] | None = None,
        headers: Mapping[str, str] | None = None,
        close: bool = False,
    ) -> None:
        super().__init__(f"{status} {slug}: {detail or title}")
        self.status = status
        self.slug = slug
        self.title = title
        self.detail = detail
        self.errors = errors or []
        self.headers = dict(headers or {})
        self.close = close


def canonical_json(payload: object) -> bytes:
    return json.dumps(payload, sort_keys=True, ensure_ascii=False, separators=(",", ":")).encode()


def etag_of(payload: object) -> str:
    """ETag forte: hash do conteúdo canônico da representação."""
    return '"' + hashlib.sha256(canonical_json(payload)).hexdigest()[:16] + '"'


def _tags(header: str) -> list[str]:
    return [part.strip() for part in header.split(",") if part.strip()]


def etag_matches_weak(if_none_match: str | None, etag: str) -> bool:
    """Comparação fraca (If-None-Match): ignora o prefixo W/. '*' casa com qualquer."""
    if if_none_match is None:
        return False
    return any(tag == "*" or tag.removeprefix("W/") == etag for tag in _tags(if_none_match))


def etag_matches_strong(if_match: str, etag: str) -> bool:
    """Comparação forte (If-Match): validador fraco nunca casa. '*' casa com qualquer."""
    return any(tag == "*" or (not tag.startswith("W/") and tag == etag) for tag in _tags(if_match))


def validate_note(data: object) -> tuple[str, str]:
    errors: list[dict[str, str]] = []
    if not isinstance(data, dict):
        raise ApiError(
            422,
            "validation",
            "Dados inválidos",
            "O corpo deve ser um objeto JSON.",
            errors=[{"field": "", "message": "esperado objeto JSON"}],
        )
    title = data.get("title")
    body = data.get("body", "")
    if not isinstance(title, str) or not 1 <= len(title.strip()) <= 100:
        errors.append({"field": "title", "message": "texto de 1 a 100 caracteres"})
    if not isinstance(body, str) or len(body) > 1000:
        errors.append({"field": "body", "message": "texto de até 1000 caracteres"})
    errors.extend(
        {"field": str(key), "message": "campo desconhecido"}
        for key in data
        if key not in ("title", "body")
    )
    if errors:
        raise ApiError(422, "validation", "Dados inválidos", "Corrija os campos.", errors=errors)
    assert isinstance(title, str)
    assert isinstance(body, str)
    return title.strip(), body


def representation(note_id: int, title: str, body: str) -> dict[str, Any]:
    return {"id": note_id, "title": title, "body": body, "href": f"/notes/{note_id}"}


@dataclass(slots=True)
class StoredResponse:
    fingerprint: str
    payload: dict[str, Any]


@dataclass(slots=True)
class NoteStore:
    """Estado em memória. Um lock protege checagem e escrita juntas (sem lost update)."""

    lock: threading.Lock = field(default_factory=threading.Lock)
    notes: dict[int, tuple[str, str]] = field(default_factory=dict)
    next_id: int = 1
    idempotency: dict[str, StoredResponse] = field(default_factory=dict)

    def _repr(self, note_id: int) -> dict[str, Any]:
        title, body = self.notes[note_id]
        return representation(note_id, title, body)

    def create(
        self, title: str, body: str, key: str | None, fingerprint: str
    ) -> tuple[dict[str, Any], bool]:
        """Devolve (representação, replay). Mesma chave + mesmo corpo = a resposta guardada."""
        with self.lock:
            if key is not None and key in self.idempotency:
                stored = self.idempotency[key]
                if stored.fingerprint != fingerprint:
                    raise ApiError(
                        422,
                        "idempotency-key-reuse",
                        "Chave de idempotência reutilizada",
                        "A mesma Idempotency-Key chegou com um corpo diferente.",
                    )
                return stored.payload, True
            note_id = self.next_id
            self.next_id += 1
            self.notes[note_id] = (title, body)
            payload = self._repr(note_id)
            if key is not None:
                self.idempotency[key] = StoredResponse(fingerprint, payload)
            return payload, False

    def get(self, note_id: int) -> dict[str, Any]:
        with self.lock:
            if note_id not in self.notes:
                raise ApiError(
                    404, "not-found", "Nota não encontrada", f"Não existe /notes/{note_id}."
                )
            return self._repr(note_id)

    def list_after(self, after: int, limit: int, q: str) -> tuple[list[dict[str, Any]], bool]:
        """Paginação por cursor (keyset): ids maiores que `after`, em ordem crescente."""
        with self.lock:
            ids = [
                i for i in sorted(self.notes) if i > after and q.lower() in self.notes[i][0].lower()
            ]
            return [self._repr(i) for i in ids[:limit]], len(ids) > limit

    def replace(self, note_id: int, title: str, body: str, if_match: str) -> dict[str, Any]:
        with self.lock:
            if note_id not in self.notes:
                raise ApiError(
                    404, "not-found", "Nota não encontrada", f"Não existe /notes/{note_id}."
                )
            if not etag_matches_strong(if_match, etag_of(self._repr(note_id))):
                raise ApiError(
                    412,
                    "precondition-failed",
                    "Versão desatualizada",
                    "A nota mudou desde a leitura; busque de novo e reaplique a edição.",
                )
            self.notes[note_id] = (title, body)
            return self._repr(note_id)

    def delete(self, note_id: int) -> None:
        with self.lock:
            if note_id not in self.notes:
                raise ApiError(
                    404, "not-found", "Nota não encontrada", f"Não existe /notes/{note_id}."
                )
            del self.notes[note_id]


class LabServer(ThreadingHTTPServer):
    def __init__(
        self,
        address: tuple[str, int] = ("127.0.0.1", 0),
        store: NoteStore | None = None,
        verbose: bool = False,
    ) -> None:
        super().__init__(address, Handler)
        self.store = NoteStore() if store is None else store
        self.verbose = verbose

    @property
    def port(self) -> int:
        return int(self.server_address[1])


class Handler(BaseHTTPRequestHandler):
    protocol_version = "HTTP/1.1"
    server_version = "web-http-lab/0.1"
    sys_version = ""

    def version_string(self) -> str:
        return self.server_version

    _head_only = False

    @property
    def store(self) -> NoteStore:
        server = self.server
        if not isinstance(server, LabServer):
            raise TypeError("Handler só funciona com LabServer")
        return server.store

    def log_message(self, format: str, *args: Any) -> None:
        server = self.server
        if isinstance(server, LabServer) and server.verbose:
            super().log_message(format, *args)

    # ---- entrada ------------------------------------------------------------------------
    def do_GET(self) -> None:
        self._handle()

    def do_HEAD(self) -> None:
        self._handle(head_only=True)

    def do_POST(self) -> None:
        self._handle()

    def do_PUT(self) -> None:
        self._handle()

    def do_DELETE(self) -> None:
        self._handle()

    def do_PATCH(self) -> None:
        self._handle()

    def do_OPTIONS(self) -> None:
        self._handle()

    def _handle(self, head_only: bool = False) -> None:
        self._head_only = head_only
        try:
            self._route()
        except ApiError as err:
            self._send_problem(err)
        except Exception:
            self._send_problem(ApiError(500, "internal", "Erro interno", close=True))

    def send_error(self, code: int, message: str | None = None, explain: str | None = None) -> None:
        """Erros do próprio http.server (linha malformada, 501...) também viram Problem Details."""
        phrase = HTTPStatus(code).phrase
        self._head_only = getattr(self, "command", None) == "HEAD"
        slug = phrase.lower().replace(" ", "-")
        self._send_problem(ApiError(code, slug, phrase, message or "", close=True))

    # ---- rotas --------------------------------------------------------------------------
    def _route(self) -> None:
        parts = urlsplit(self.path)
        path, method = parts.path, self.command
        reads = method in ("GET", "HEAD")
        if path == "/health":
            if not reads:
                raise self._not_allowed("GET, HEAD")
            self._send_json(200, {"status": "ok"}, cache="no-store")
        elif path == "/notes":
            if reads:
                self._list(parts.query)
            elif method == "POST":
                self._create()
            else:
                raise self._not_allowed("GET, HEAD, POST")
        elif match := NOTE_PATH.fullmatch(path):
            note_id = int(match.group(1))
            if reads:
                self._send_json(200, self.store.get(note_id), conditional=True)
            elif method == "PUT":
                self._replace(note_id)
            elif method == "DELETE":
                self.store.delete(note_id)
                self._send(204, b"", {})
            else:
                raise self._not_allowed("GET, HEAD, PUT, DELETE")
        else:
            raise ApiError(404, "not-found", "Recurso não encontrado", f"Não existe {path}.")

    @staticmethod
    def _not_allowed(allow: str) -> ApiError:
        return ApiError(405, "method-not-allowed", "Método não permitido", headers={"Allow": allow})

    def _list(self, query: str) -> None:
        params = parse_qs(query, keep_blank_values=True)
        errors: list[dict[str, str]] = []

        def number(name: str, default: int, low: int, high: int) -> int:
            raw = params.get(name, [str(default)])[-1]
            if not raw.isascii() or not raw.isdigit() or not low <= int(raw) <= high:
                errors.append({"field": name, "message": f"inteiro entre {low} e {high}"})
                return default
            return int(raw)

        limit = number("limit", DEFAULT_LIMIT, 1, MAX_LIMIT)
        after = number("after", 0, 0, 2**53)
        q = params.get("q", [""])[-1]
        if errors:
            raise ApiError(400, "bad-query", "Parâmetros inválidos", errors=errors)
        items, more = self.store.list_after(after, limit, q)
        next_url = None
        if more:
            next_url = f"/notes?limit={limit}&after={items[-1]['id']}"
            if q:
                next_url += f"&q={quote(q)}"
        self._send_json(200, {"items": items, "next": next_url}, conditional=True)

    def _create(self) -> None:
        data = self._parse_json(self._read_body())
        title, body = validate_note(data)
        key = self.headers.get("Idempotency-Key")
        if key is not None and not 1 <= len(key) <= 255:
            raise ApiError(400, "bad-idempotency-key", "Idempotency-Key inválida")
        fingerprint = hashlib.sha256(canonical_json({"title": title, "body": body})).hexdigest()
        payload, replayed = self.store.create(title, body, key, fingerprint)
        extra = {"Location": payload["href"]}
        if replayed:
            extra["Idempotency-Replayed"] = "true"
        self._send_json(201, payload, headers=extra)

    def _replace(self, note_id: int) -> None:
        raw = self._read_body()
        if_match = self.headers.get("If-Match")
        if if_match is None:
            raise ApiError(
                428,
                "precondition-required",
                "If-Match obrigatório",
                "Leia a nota, guarde o ETag e envie-o em If-Match.",
            )
        title, body = validate_note(self._parse_json(raw))
        self._send_json(200, self.store.replace(note_id, title, body, if_match))

    # ---- corpo da requisição ------------------------------------------------------------
    def _read_body(self) -> bytes:
        if "Transfer-Encoding" in self.headers:
            raise ApiError(501, "not-implemented", "Corpo chunked não suportado", close=True)
        values = self.headers.get_all("Content-Length") or []
        if not values:
            raise ApiError(411, "length-required", "Content-Length obrigatório", close=True)
        if len(set(values)) != 1 or not values[0].isascii() or not values[0].isdigit():
            raise ApiError(400, "bad-content-length", "Content-Length inválido", close=True)
        length = int(values[0])
        if length > MAX_BODY:
            raise ApiError(413, "payload-too-large", "Corpo grande demais", close=True)
        raw = self.rfile.read(length)
        if len(raw) < length:
            raise ApiError(400, "truncated-body", "Corpo truncado", close=True)
        return raw

    def _parse_json(self, raw: bytes) -> object:
        media = self.headers.get("Content-Type", "").split(";", 1)[0].strip().lower()
        if media != "application/json":
            raise ApiError(
                415,
                "unsupported-media-type",
                "Use Content-Type: application/json",
                media or "ausente",
            )
        try:
            return json.loads(raw)
        except ValueError as exc:
            raise ApiError(400, "invalid-json", "JSON inválido", str(exc)) from exc

    # ---- saída --------------------------------------------------------------------------
    def _send(self, status: int, body: bytes, headers: Mapping[str, str]) -> None:
        self.send_response(status)
        for name, value in headers.items():
            self.send_header(name, value)
        bodiless = status in (204, 304)
        if not bodiless:
            self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        if not bodiless and not self._head_only:
            self.wfile.write(body)

    def _send_json(
        self,
        status: int,
        payload: object,
        *,
        headers: Mapping[str, str] | None = None,
        conditional: bool = False,
        cache: str = "no-cache",
    ) -> None:
        etag = etag_of(payload)
        out = {"ETag": etag, "Cache-Control": cache, **(headers or {})}
        if conditional and etag_matches_weak(self.headers.get("If-None-Match"), etag):
            self._send(304, b"", out)
            return
        body = json.dumps(payload, ensure_ascii=False, separators=(",", ":")).encode()
        self._send(status, body, {"Content-Type": "application/json; charset=utf-8", **out})

    def _send_problem(self, err: ApiError) -> None:
        document: dict[str, Any] = {
            "type": f"/problems/{err.slug}",
            "title": err.title,
            "status": err.status,
            "instance": getattr(self, "path", ""),
        }
        if err.detail:
            document["detail"] = err.detail
        if err.errors:
            document["errors"] = err.errors
        headers = {"Content-Type": PROBLEM_JSON, "Cache-Control": "no-store", **err.headers}
        if err.close:
            self.close_connection = True
            headers["Connection"] = "close"
        self._send(err.status, json.dumps(document, ensure_ascii=False).encode(), headers)


@contextmanager
def running_server(store: NoteStore | None = None) -> Iterator[LabServer]:
    """Sobe o servidor numa thread, em porta efêmera, e o derruba na saída."""
    server = LabServer(("127.0.0.1", 0), store)
    thread = threading.Thread(target=server.serve_forever, kwargs={"poll_interval": 0.05})
    thread.start()
    try:
        yield server
    finally:
        server.shutdown()
        server.server_close()
        thread.join(timeout=5)
