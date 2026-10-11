"""INTENTIONALLY VULNERABLE code, kept only to show SQL injection in the lab.

Nothing outside the lab demo and its tests imports this module.
"""

from __future__ import annotations

import sqlite3


def find_member_unsafe(conn: sqlite3.Connection, email: str) -> list[tuple[object, ...]]:
    """Build SQL by string concatenation: the input becomes part of the program."""
    sql = "SELECT id, email, name FROM member WHERE email = '" + email + "'"
    return [tuple(row) for row in conn.execute(sql).fetchall()]
