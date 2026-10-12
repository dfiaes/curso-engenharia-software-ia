"""A single result type shared by every check, so CI can print and count them uniformly."""

from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True, slots=True)
class Finding:
    """One violation: a stable ``code``, a human message and where it happened."""

    code: str
    message: str
    path: str = ""
    line: int = 0

    def render(self) -> str:
        where = self.path
        if self.path and self.line:
            where = f"{self.path}:{self.line}"
        prefix = f"{where}: " if where else ""
        return f"{prefix}[{self.code}] {self.message}"
