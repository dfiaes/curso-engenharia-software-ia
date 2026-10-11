"""Two connections interleaved by hand, so every anomaly is deterministic.

SQLite serializes writers, so some anomalies that PostgreSQL permits at lower isolation
levels are impossible here; the demos show what SQLite does instead.
"""

from __future__ import annotations

import sqlite3
from dataclasses import dataclass
from pathlib import Path

from sqllab.db import connect, migrate, schema_version


def _prepare(path: Path) -> sqlite3.Connection:
    conn = connect(path, timeout=0)
    conn.execute("PRAGMA journal_mode = WAL")
    if schema_version(conn) == 0:
        migrate(conn)
    return conn


def _stock(conn: sqlite3.Connection, book_id: int) -> int:
    return int(conn.execute("SELECT copies FROM book WHERE id = ?", (book_id,)).fetchone()[0])


def _seed_book(conn: sqlite3.Connection, copies: int) -> None:
    conn.execute("INSERT INTO author (id, name) VALUES (1, 'Autor')")
    conn.execute(
        "INSERT INTO book (id, isbn, title, author_id, copies) VALUES (1, 'x', 'Livro', 1, ?)",
        (copies,),
    )


def lost_update(path: Path) -> tuple[int, int]:
    """Read-modify-write in the application loses one decrement; one atomic UPDATE does not.

    Returns ``(stock_with_read_modify_write, stock_with_atomic_update)`` starting from 3
    copies and two checkouts.
    """
    a, b = _prepare(path), connect(path, timeout=0)
    _seed_book(a, 3)
    seen_a, seen_b = _stock(a, 1), _stock(b, 1)  # both read 3
    a.execute("UPDATE book SET copies = ? WHERE id = 1", (seen_a - 1,))
    b.execute("UPDATE book SET copies = ? WHERE id = 1", (seen_b - 1,))  # overwrites with 2
    unsafe = _stock(a, 1)

    a.execute("UPDATE book SET copies = 3 WHERE id = 1")
    a.execute("UPDATE book SET copies = copies - 1 WHERE id = 1")
    b.execute("UPDATE book SET copies = copies - 1 WHERE id = 1")
    safe = _stock(a, 1)
    a.close()
    b.close()
    return unsafe, safe


@dataclass(frozen=True, slots=True)
class SnapshotResult:
    first_read: int
    second_read_same_txn: int
    read_after_commit: int


def snapshot_read(path: Path) -> SnapshotResult:
    """A reader inside a transaction keeps its snapshot while a writer commits."""
    reader, writer = _prepare(path), connect(path, timeout=0)
    _seed_book(reader, 1)
    reader.execute("BEGIN")
    first = int(reader.execute("SELECT COUNT(*) FROM book").fetchone()[0])
    writer.execute(
        "INSERT INTO book (isbn, title, author_id, copies) VALUES ('y', 'Outro', 1, 1)"
    )  # autocommit: committed immediately
    second = int(reader.execute("SELECT COUNT(*) FROM book").fetchone()[0])
    reader.execute("COMMIT")
    after = int(reader.execute("SELECT COUNT(*) FROM book").fetchone()[0])
    reader.close()
    writer.close()
    return SnapshotResult(first, second, after)


@dataclass(frozen=True, slots=True)
class SkewResult:
    second_writer_error: str
    on_call_after: int


def write_skew_blocked(path: Path) -> SkewResult:
    """The classic 'at least one doctor on call' race, attempted on SQLite.

    Both sessions read 2 doctors on call and each removes a different one. Under
    PostgreSQL REPEATABLE READ both commits succeed and nobody is left. SQLite refuses
    the second writer because its snapshot is stale.
    """
    a, b = _prepare(path), connect(path, timeout=0)
    a.execute("CREATE TABLE doctor (name TEXT PRIMARY KEY, on_call INTEGER NOT NULL)")
    a.executemany("INSERT INTO doctor VALUES (?, 1)", [("Ana",), ("Bia",)])
    a.execute("BEGIN")
    b.execute("BEGIN")
    seen_a = a.execute("SELECT COUNT(*) FROM doctor WHERE on_call = 1").fetchone()[0]
    seen_b = b.execute("SELECT COUNT(*) FROM doctor WHERE on_call = 1").fetchone()[0]
    assert seen_a == 2 and seen_b == 2
    a.execute("UPDATE doctor SET on_call = 0 WHERE name = 'Ana'")
    a.execute("COMMIT")
    error = ""
    try:
        b.execute("UPDATE doctor SET on_call = 0 WHERE name = 'Bia'")
        b.execute("COMMIT")
    except sqlite3.OperationalError as exc:
        error = str(exc)
        b.execute("ROLLBACK")
    remaining = int(a.execute("SELECT COUNT(*) FROM doctor WHERE on_call = 1").fetchone()[0])
    a.close()
    b.close()
    return SkewResult(error, remaining)


def writer_blocks_writer(path: Path) -> str:
    """With ``BEGIN IMMEDIATE`` the second writer is refused up front instead of at commit."""
    a, b = _prepare(path), connect(path, timeout=0)
    a.execute("BEGIN IMMEDIATE")
    error = ""
    try:
        b.execute("BEGIN IMMEDIATE")
    except sqlite3.OperationalError as exc:
        error = str(exc)
    a.execute("ROLLBACK")
    a.close()
    b.close()
    return error
