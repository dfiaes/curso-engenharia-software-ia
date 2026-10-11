"""JSON export with an all-or-nothing file write."""

from __future__ import annotations

import json
import os
from decimal import Decimal
from pathlib import Path
from types import TracebackType
from typing import TextIO

from expenses.errors import ExportError


class AtomicWriter:
    """Context manager: write to ``<target>.tmp``, then rename over ``target`` on success.

    On any exception the temporary file is removed and ``target`` stays untouched.
    The exception is never suppressed.
    """

    def __init__(self, target: Path, *, encoding: str = "utf-8") -> None:
        self.target = target
        self.encoding = encoding
        self._tmp = target.with_name(target.name + ".tmp")
        self._handle: TextIO | None = None

    def __enter__(self) -> TextIO:
        self._handle = self._tmp.open("w", encoding=self.encoding, newline="\n")
        return self._handle

    def __exit__(
        self,
        exc_type: type[BaseException] | None,
        exc: BaseException | None,
        tb: TracebackType | None,
    ) -> None:
        if self._handle is not None:
            self._handle.close()
        if exc_type is None:
            os.replace(self._tmp, self.target)
        else:
            self._tmp.unlink(missing_ok=True)


def report_payload(
    totals: dict[str, Decimal], monthly: dict[str, Decimal], rejected: int
) -> dict[str, object]:
    """Decimals travel as strings: JSON numbers are binary floats in most readers."""
    return {
        "total": str(sum(totals.values(), start=Decimal(0))),
        "by_category": {name: str(value) for name, value in totals.items()},
        "by_month": {name: str(value) for name, value in monthly.items()},
        "rejected_rows": rejected,
    }


def write_report(path: Path, payload: dict[str, object]) -> None:
    """Write the payload as UTF-8 JSON, atomically."""
    try:
        with AtomicWriter(path) as handle:
            json.dump(payload, handle, ensure_ascii=False, indent=2)
            handle.write("\n")
    except OSError as err:
        raise ExportError(f"não foi possível gravar {path}: {err.strerror}") from err
