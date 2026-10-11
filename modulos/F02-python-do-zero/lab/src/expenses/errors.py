"""Exception hierarchy: one base class so callers can catch the whole family."""

from __future__ import annotations


class ExpensesError(Exception):
    """Base class for every error this package raises on purpose."""


class MissingColumnError(ExpensesError):
    """The CSV header lacks one or more required columns."""

    def __init__(self, columns: list[str]) -> None:
        self.columns = columns
        super().__init__("colunas obrigatórias ausentes: " + ", ".join(columns))


class EncodingMismatchError(ExpensesError):
    """The file bytes are not valid in the declared encoding."""


class InvalidRowError(ExpensesError):
    """One data row failed validation. Carries where and why, as attributes."""

    def __init__(self, line: int, field: str, message: str) -> None:
        self.line = line
        self.field = field
        self.message = message
        super().__init__(f"linha {line}, campo {field!r}: {message}")


class ExportError(ExpensesError):
    """The report could not be written."""
