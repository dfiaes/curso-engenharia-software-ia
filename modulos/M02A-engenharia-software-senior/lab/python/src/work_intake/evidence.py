"""Manifest mínimo derivado da execução, sem conteúdo sensível da solicitação."""

from __future__ import annotations

import hashlib
import importlib.metadata
import json
import platform
from datetime import UTC, datetime
from pathlib import Path
from time import perf_counter
from typing import Any

from work_intake.domain.models import EvaluationResult, WorkRequest


def sha256_bytes(value: bytes) -> str:
    return hashlib.sha256(value).hexdigest()


def _version(distribution: str) -> str:
    try:
        return importlib.metadata.version(distribution)
    except importlib.metadata.PackageNotFoundError:
        return "not-installed"


class EvidenceTimer:
    def __init__(self) -> None:
        self._started_at = datetime.now(UTC)
        self._start = perf_counter()

    def finish(
        self,
        *,
        input_bytes: bytes,
        output_bytes: bytes,
        request: WorkRequest,
        result: EvaluationResult,
    ) -> dict[str, Any]:
        return {
            "schema_version": "1.0",
            "started_at": self._started_at.isoformat(),
            "duration_ms": round((perf_counter() - self._start) * 1000, 3),
            "runtime": {
                "implementation": platform.python_implementation(),
                "python": platform.python_version(),
                "work_intake": _version("work-intake"),
                "pydantic": _version("pydantic"),
            },
            "input_sha256": sha256_bytes(input_bytes),
            "output_sha256": sha256_bytes(output_bytes),
            "policy_version": result.decision.policy_version,
            "budget": {
                "request": format(request.budget, "f"),
                "advisor_call_limit": 1,
                "advisor_calls": result.advisor_calls,
            },
            "adapter": {
                "name": result.advisor_identity.adapter,
                "version": result.advisor_identity.version,
                "digest": result.advisor_identity.digest,
                "status": result.advisor_status.value,
            },
            "outcome": result.decision.outcome.value,
            "reused": result.reused,
        }


def write_evidence(path: Path, payload: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(
        json.dumps(payload, ensure_ascii=False, indent=2, sort_keys=True) + "\n",
        encoding="utf-8",
        newline="\n",
    )
