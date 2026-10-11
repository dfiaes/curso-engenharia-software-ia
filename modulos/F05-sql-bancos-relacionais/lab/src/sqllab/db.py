"""Connection, migrations and explicit transactions on top of the stdlib ``sqlite3``."""

from __future__ import annotations

import re
import sqlite3
from collections.abc import Iterator
from contextlib import contextmanager
from importlib import resources
from pathlib import Path

_MIGRATION_NAME = re.compile(r"^(\d{3})_[a-z0-9_]+\.sql$")


def connect(
    path: str | Path = ":memory:", *, timeout: float = 5.0, foreign_keys: bool = True
) -> sqlite3.Connection:
    """Open a connection in autocommit mode with rows addressable by column name.

    ``autocommit=True`` (Python 3.12+) leaves transaction control to explicit
    ``BEGIN``/``COMMIT``, which is what ``transaction`` below does. SQLite ships with
    foreign-key enforcement OFF for historical reasons; it is a per-connection pragma.
    """
    conn = sqlite3.connect(path, timeout=timeout, autocommit=True)
    conn.row_factory = sqlite3.Row
    if foreign_keys:
        conn.execute("PRAGMA foreign_keys = ON")
    return conn


@contextmanager
def transaction(
    conn: sqlite3.Connection, *, immediate: bool = False
) -> Iterator[sqlite3.Connection]:
    """Run a block atomically: COMMIT on success, ROLLBACK on any exception.

    ``immediate=True`` issues ``BEGIN IMMEDIATE``, which takes the write lock up front
    instead of at the first write. Use it for read-then-write blocks.
    """
    conn.execute("BEGIN IMMEDIATE" if immediate else "BEGIN")
    try:
        yield conn
        conn.execute("COMMIT")
    except BaseException:
        if conn.in_transaction:
            conn.execute("ROLLBACK")
        raise


def migration_files() -> list[tuple[int, str, str]]:
    """Return ``(version, filename, sql)`` for every packaged migration, ordered."""
    found: list[tuple[int, str, str]] = []
    for entry in resources.files("sqllab").joinpath("migrations").iterdir():
        match = _MIGRATION_NAME.match(entry.name)
        if match:
            found.append((int(match.group(1)), entry.name, entry.read_text(encoding="utf-8")))
    return sorted(found)


def schema_version(conn: sqlite3.Connection) -> int:
    row = conn.execute("PRAGMA user_version").fetchone()
    return int(row[0])


def migrate(conn: sqlite3.Connection, target: int | None = None) -> int:
    """Apply pending migrations up to ``target`` (default: all) and return the version.

    Each migration runs in its own transaction together with the bump of
    ``PRAGMA user_version``: SQLite DDL is transactional, so a failing script leaves
    the database at the previous version.
    """
    current = schema_version(conn)
    for version, name, sql in migration_files():
        if version <= current or (target is not None and version > target):
            continue
        script = f"BEGIN;\n{sql}\nPRAGMA user_version = {version};\nCOMMIT;"
        try:
            conn.executescript(script)
        except sqlite3.Error as exc:
            if conn.in_transaction:
                conn.execute("ROLLBACK")
            raise RuntimeError(f"migration {name} failed: {exc}") from exc
        current = version
    return current
