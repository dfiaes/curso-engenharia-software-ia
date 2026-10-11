"""Tipos compartilhados: severidade e achado."""

from dataclasses import dataclass
from enum import StrEnum


class Severity(StrEnum):
    ERROR = "error"
    WARN = "warn"


@dataclass(frozen=True, slots=True)
class Finding:
    rule: str
    severity: Severity
    file: str
    line: int
    message: str

    def render(self) -> str:
        return f"{self.file}:{self.line}: {self.severity.value} {self.rule} {self.message}"
