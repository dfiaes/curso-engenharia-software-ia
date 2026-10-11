from __future__ import annotations

import sqlite3

import pytest

from sqllab.db import connect, migrate, migration_files, schema_version


def test_migrations_are_numbered_without_gaps() -> None:
    assert [v for v, _, _ in migration_files()] == [1, 2]


def test_migrate_reaches_latest_and_is_idempotent() -> None:
    conn = connect()
    assert schema_version(conn) == 0
    assert migrate(conn) == 2
    assert migrate(conn) == 2  # nothing pending: no error, no change


def test_migrate_can_stop_at_a_target_version() -> None:
    conn = connect()
    assert migrate(conn, target=1) == 1
    indexes = conn.execute(
        "SELECT name FROM sqlite_master WHERE type = 'index' AND name LIKE 'idx_%'"
    ).fetchall()
    assert indexes == []
    assert migrate(conn) == 2


def test_failing_migration_rolls_back_ddl_and_version(monkeypatch: pytest.MonkeyPatch) -> None:
    """Failure injected: a migration with a valid CREATE followed by a broken statement."""
    broken = (3, "003_broken.sql", "CREATE TABLE half_done (x INTEGER);\nCREATE TABL oops;")
    monkeypatch.setattr("sqllab.db.migration_files", lambda: [*migration_files(), broken])
    conn = connect()
    with pytest.raises(RuntimeError, match=r"003_broken\.sql"):
        migrate(conn)
    assert schema_version(conn) == 2
    tables = {r[0] for r in conn.execute("SELECT name FROM sqlite_master WHERE type = 'table'")}
    assert "half_done" not in tables
    assert not conn.in_transaction


def test_connection_requires_explicit_foreign_keys_pragma() -> None:
    conn: sqlite3.Connection = connect()
    assert conn.execute("PRAGMA foreign_keys").fetchone()[0] == 1
