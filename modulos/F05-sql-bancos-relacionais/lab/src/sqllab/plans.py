"""Read SQLite's query plan (the SQLite counterpart of PostgreSQL's ``EXPLAIN``)."""

from __future__ import annotations

import sqlite3
from collections.abc import Sequence


def explain(conn: sqlite3.Connection, sql: str, params: Sequence[object] = ()) -> list[str]:
    """Return the ``detail`` column of ``EXPLAIN QUERY PLAN`` for ``sql``."""
    rows = conn.execute(f"EXPLAIN QUERY PLAN {sql}", tuple(params)).fetchall()
    return [str(row["detail"]) for row in rows]


def uses_index(plan: Sequence[str], index: str | None = None) -> bool:
    """True if some step searches or scans through an index (optionally a named one)."""
    for step in plan:
        if "USING" in step and "INDEX" in step and (index is None or index in step):
            return True
    return False


def is_full_scan(plan: Sequence[str], table: str) -> bool:
    """True if the plan reads every row of ``table`` without an index."""
    return any(step == f"SCAN {table}" for step in plan)
