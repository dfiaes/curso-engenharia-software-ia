"""Lazy CSV reading. Nothing here touches the disk until the first item is requested."""

from __future__ import annotations

import csv
from collections.abc import Iterator
from pathlib import Path

from expenses.errors import EncodingMismatchError, InvalidRowError, MissingColumnError
from expenses.model import Expense
from expenses.parsing import REQUIRED_COLUMNS, parse_row


def scan(path: Path, *, encoding: str = "utf-8") -> Iterator[Expense | InvalidRowError]:
    """Yield an Expense per good row and an InvalidRowError (as a value) per bad one.

    This is a generator: the file is opened on the first ``next()`` and closed when the
    generator is exhausted, closed or garbage-collected.
    """
    try:
        with path.open(encoding=encoding, newline="") as handle:
            reader = csv.DictReader(handle)
            missing = [c for c in REQUIRED_COLUMNS if c not in (reader.fieldnames or [])]
            if missing:
                raise MissingColumnError(missing)
            for row in reader:
                try:
                    item: Expense | InvalidRowError = parse_row(reader.line_num, row)
                except InvalidRowError as err:
                    item = err
                yield item
    except UnicodeDecodeError as err:
        raise EncodingMismatchError(
            f"{path.name} não é {encoding} válido (byte {err.start}: {err.reason})"
        ) from err


def read_expenses(path: Path, *, encoding: str = "utf-8") -> Iterator[Expense]:
    """Strict variant: yield good rows and raise on the first bad one."""
    for item in scan(path, encoding=encoding):
        if isinstance(item, InvalidRowError):
            raise item
        yield item
