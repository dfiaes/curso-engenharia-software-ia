from __future__ import annotations

from collections.abc import Callable
from pathlib import Path

import pytest

HEADER = "date,category,amount,description\n"
CsvFactory = Callable[..., Path]


@pytest.fixture
def make_csv(tmp_path: Path) -> CsvFactory:
    """Write a CSV file with the given data lines; encoding is explicit and overridable."""

    def factory(
        *lines: str, name: str = "d.csv", encoding: str = "utf-8", header: str = HEADER
    ) -> Path:
        path = tmp_path / name
        path.write_bytes((header + "".join(line + "\n" for line in lines)).encode(encoding))
        return path

    return factory
