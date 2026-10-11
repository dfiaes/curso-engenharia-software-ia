"""SQL injection shown and defeated. ``unsafe`` is deliberately vulnerable."""

from __future__ import annotations

import sqlite3

import pytest

from sqllab.repository import LibraryRepository
from sqllab.unsafe import find_member_unsafe

TAUTOLOGY = "' OR '1'='1"
UNION = "' UNION SELECT id, isbn, title FROM book --"


def test_normal_input_works_in_both(conn: sqlite3.Connection) -> None:
    assert len(find_member_unsafe(conn, "ana@example.com")) == 1
    assert LibraryRepository(conn).get_member_by_email("ana@example.com") is not None


def test_concatenation_is_injectable_with_a_tautology(conn: sqlite3.Connection) -> None:
    assert len(find_member_unsafe(conn, TAUTOLOGY)) == 6  # every member leaks


def test_concatenation_leaks_other_tables_with_union(conn: sqlite3.Connection) -> None:
    rows = find_member_unsafe(conn, UNION)
    assert (1, "978-0-00-000001-1", "Dom Casmurro") in rows


def test_parameters_treat_the_payload_as_data(conn: sqlite3.Connection) -> None:
    repo = LibraryRepository(conn)
    assert repo.get_member_by_email(TAUTOLOGY) is None
    assert repo.get_member_by_email(UNION) is None


def test_a_quote_breaks_concatenation_but_not_parameters(conn: sqlite3.Connection) -> None:
    """Even without malice: an apostrophe in a name or e-mail is a syntax error."""
    with pytest.raises(sqlite3.OperationalError, match="syntax error"):
        find_member_unsafe(conn, "o'brien@example.com")
    assert LibraryRepository(conn).get_member_by_email("o'brien@example.com") is None


def test_driver_refuses_stacked_statements_but_that_is_not_a_defense(
    conn: sqlite3.Connection,
) -> None:
    """sqlite3 executes one statement per call; PostgreSQL drivers may not be so strict."""
    with pytest.raises(sqlite3.ProgrammingError, match="one statement"):
        find_member_unsafe(conn, "x'; DROP TABLE member; --")
    assert conn.execute("SELECT COUNT(*) FROM member").fetchone()[0] == 6
