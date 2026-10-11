"""Constraints are the database's own tests: they hold for every writer."""

from __future__ import annotations

import sqlite3

import pytest

from sqllab.db import connect, migrate


def test_valid_rows_are_accepted(conn: sqlite3.Connection) -> None:
    assert conn.execute("SELECT COUNT(*) FROM book").fetchone()[0] == 8


@pytest.mark.parametrize(
    ("sql", "message"),
    [
        ("INSERT INTO author (name) VALUES (NULL)", "NOT NULL constraint failed: author.name"),
        (
            "INSERT INTO author (name) VALUES ('Ada'), ('Ada')",
            "UNIQUE constraint failed: author.name",
        ),
        (
            "INSERT INTO author (name, born_year) VALUES ('Antigo', 12)",
            "CHECK constraint failed",
        ),
        (
            "INSERT INTO book (isbn, title, author_id, copies) VALUES ('z', 't', 999, 1)",
            "FOREIGN KEY constraint failed",
        ),
        (
            "INSERT INTO book (isbn, title, author_id, copies) VALUES ('z', 't', 1, -1)",
            "CHECK constraint failed",
        ),
        (
            "INSERT INTO loan (book_id, member_id, loaned_on, due_on)"
            " VALUES (1, 1, '2026-06-10', '2026-06-01')",
            "CHECK constraint failed",
        ),
    ],
)
def test_constraint_violations_are_rejected(
    empty: sqlite3.Connection, sql: str, message: str
) -> None:
    empty.execute("INSERT INTO author (id, name) VALUES (1, 'Base')")
    with pytest.raises(sqlite3.IntegrityError, match=message):
        empty.execute(sql)


def test_deleting_a_referenced_row_is_blocked(conn: sqlite3.Connection) -> None:
    with pytest.raises(sqlite3.IntegrityError, match="FOREIGN KEY"):
        conn.execute("DELETE FROM author WHERE id = 1")


def test_control_negative_without_foreign_key_pragma_orphans_are_accepted() -> None:
    """SQLite does not enforce FKs unless asked: the constraint exists but is silent."""
    conn = connect(foreign_keys=False)
    migrate(conn)
    conn.execute("INSERT INTO book (isbn, title, author_id, copies) VALUES ('z', 'orfao', 999, 1)")
    orphans = conn.execute(
        "SELECT COUNT(*) FROM book WHERE author_id NOT IN (SELECT id FROM author)"
    ).fetchone()[0]
    assert orphans == 1


def test_update_anomaly_in_a_flat_table_but_not_in_the_normalized_one(
    conn: sqlite3.Connection,
) -> None:
    conn.execute("CREATE TABLE loan_flat (loan_id INTEGER, title TEXT, author_name TEXT)")
    conn.executemany(
        "INSERT INTO loan_flat VALUES (?, ?, ?)",
        [(1, "Dom Casmurro", "Machado de Assis"), (4, "Dom Casmurro", "Machado de Assis")],
    )
    conn.execute("UPDATE loan_flat SET author_name = 'M. de Assis' WHERE loan_id = 1")
    flat_names = conn.execute(
        "SELECT COUNT(DISTINCT author_name) FROM loan_flat WHERE title = 'Dom Casmurro'"
    ).fetchone()[0]
    assert flat_names == 2  # same book, two authors' names: the data contradicts itself

    conn.execute("UPDATE author SET name = 'M. de Assis' WHERE id = 1")
    normalized_names = conn.execute(
        "SELECT COUNT(DISTINCT a.name) FROM loan AS l JOIN book AS b ON b.id = l.book_id"
        " JOIN author AS a ON a.id = b.author_id WHERE b.title = 'Dom Casmurro'"
    ).fetchone()[0]
    assert normalized_names == 1


def test_check_and_unique_let_null_through(empty: sqlite3.Connection) -> None:
    """CHECK rejects only FALSE, so NULL passes; UNIQUE treats NULLs as distinct."""
    empty.execute("INSERT INTO author (name, born_year) VALUES ('Sem ano', NULL)")
    empty.execute("INSERT INTO author (name, born_year) VALUES ('Outro sem ano', NULL)")
    empty.execute("CREATE TABLE doc (code TEXT UNIQUE)")
    empty.executemany("INSERT INTO doc VALUES (?)", [(None,), (None,)])
    assert empty.execute("SELECT COUNT(*) FROM doc").fetchone()[0] == 2
