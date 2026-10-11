"""Diagnósticos serializáveis e acionáveis."""

from __future__ import annotations

import traceback
from dataclasses import asdict, dataclass
from typing import Any


@dataclass(frozen=True, slots=True)
class ErrorDiagnostic:
    error_type: str
    message: str
    cause_type: str | None
    cause_message: str | None

    def as_dict(self) -> dict[str, Any]:
        return asdict(self)


def diagnose(exc: BaseException) -> ErrorDiagnostic:
    cause = exc.__cause__
    return ErrorDiagnostic(
        error_type=type(exc).__name__,
        message=str(exc),
        cause_type=type(cause).__name__ if cause is not None else None,
        cause_message=str(cause) if cause is not None else None,
    )


def traceback_text(exc: BaseException) -> str:
    return "".join(traceback.format_exception(exc))
