"""Load the packaged ``.sql`` files and run them with named parameters."""

from __future__ import annotations

import sqlite3
from collections.abc import Mapping
from importlib import resources

Row = dict[str, object]


def list_queries() -> list[str]:
    folder = resources.files("sqllab").joinpath("queries")
    return sorted(p.name.removesuffix(".sql") for p in folder.iterdir() if p.name.endswith(".sql"))


def load_query(name: str) -> str:
    path = resources.files("sqllab").joinpath("queries", f"{name}.sql")
    if not path.is_file():
        raise KeyError(f"unknown query: {name}")
    return path.read_text(encoding="utf-8")


def run_query(
    conn: sqlite3.Connection, name: str, params: Mapping[str, object] | None = None
) -> list[Row]:
    cursor = conn.execute(load_query(name), dict(params or {}))
    return [dict(row) for row in cursor.fetchall()]
