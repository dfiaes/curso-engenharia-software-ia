"""Evidência reproduzível da execução local."""

from __future__ import annotations

import hashlib
import importlib.metadata
import json
import platform
import sys
from dataclasses import asdict, dataclass
from datetime import UTC, datetime
from pathlib import Path
from time import perf_counter
from typing import Any

from python_senior_lab.parallelism import runtime_capabilities


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for chunk in iter(lambda: stream.read(64 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def installed_version(distribution: str) -> str:
    try:
        return importlib.metadata.version(distribution)
    except importlib.metadata.PackageNotFoundError:
        return "not-installed"


@dataclass(frozen=True, slots=True)
class RunEvidence:
    schema_version: str
    started_at: str
    duration_ms: float
    command: str
    runtime: dict[str, Any]
    tools: dict[str, str]
    input: dict[str, Any]
    output: dict[str, Any]

    def as_dict(self) -> dict[str, Any]:
        return asdict(self)


class EvidenceTimer:
    def __init__(self) -> None:
        self.started_at = datetime.now(UTC)
        self._start = perf_counter()

    def finish(self, *, input_path: Path, output_path: Path, rows: int) -> RunEvidence:
        return RunEvidence(
            schema_version="1.0",
            started_at=self.started_at.isoformat(),
            duration_ms=round((perf_counter() - self._start) * 1000, 3),
            command="csv-cleaner",
            runtime={
                **asdict(runtime_capabilities()),
                "executable": sys.executable,
                "platform": platform.platform(),
            },
            tools={
                "csv-cleaner": installed_version("csv-cleaner"),
                "pydantic": installed_version("pydantic"),
            },
            input={
                "path": str(input_path),
                "sha256": sha256_file(input_path),
            },
            output={
                "path": str(output_path),
                "sha256": sha256_file(output_path),
                "rows": rows,
            },
        )


def write_evidence(path: Path, evidence: RunEvidence) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(
        json.dumps(evidence.as_dict(), ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
        newline="\n",
    )
