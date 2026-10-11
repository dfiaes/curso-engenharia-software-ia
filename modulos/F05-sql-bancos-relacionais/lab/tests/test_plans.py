"""EXPLAIN QUERY PLAN before and after indexes, on 20 000 reproducible loans."""

from __future__ import annotations

import sqlite3
from collections.abc import Iterator

import pytest

from sqllab.db import connect, migrate
from sqllab.nplus1 import StatementCounter, titles_with_authors_join, titles_with_authors_n_plus_1
from sqllab.plans import explain, is_full_scan, uses_index
from sqllab.seed import seed_bulk

BY_MEMBER = "SELECT id, book_id, loaned_on FROM loan WHERE member_id = ? ORDER BY loaned_on DESC"


@pytest.fixture(scope="module")
def bulk_without_index() -> Iterator[sqlite3.Connection]:
    conn = connect()
    migrate(conn, target=1)
    seed_bulk(conn)
    yield conn
    conn.close()


@pytest.fixture
def bulk(bulk_without_index: sqlite3.Connection) -> sqlite3.Connection:
    """Fresh copy of the bulk database at the latest migration."""
    conn = connect()
    bulk_without_index.backup(conn)
    migrate(conn)
    return conn


def test_bulk_data_is_reproducible(bulk_without_index: sqlite3.Connection) -> None:
    row = bulk_without_index.execute(
        "SELECT COUNT(*), SUM(returned_on IS NULL) FROM loan"
    ).fetchone()
    assert (row[0], row[1]) == (20000, 1192)


def test_before_index_the_lookup_scans_the_table_and_sorts(
    bulk_without_index: sqlite3.Connection,
) -> None:
    plan = explain(bulk_without_index, BY_MEMBER, (7,))
    assert is_full_scan(plan, "loan")
    assert "USE TEMP B-TREE FOR ORDER BY" in plan


def test_after_index_the_lookup_searches_and_needs_no_sort(bulk: sqlite3.Connection) -> None:
    plan = explain(bulk, BY_MEMBER, (7,))
    assert plan == ["SEARCH loan USING INDEX idx_loan_member_loaned (member_id=?)"]


def test_index_does_not_change_the_answer(
    bulk_without_index: sqlite3.Connection, bulk: sqlite3.Connection
) -> None:
    before = bulk_without_index.execute(BY_MEMBER, (7,)).fetchall()
    after = bulk.execute(BY_MEMBER, (7,)).fetchall()
    assert [tuple(r) for r in before] == [tuple(r) for r in after]
    assert len(after) > 0


def test_leftmost_prefix_rule_second_column_alone_cannot_search(bulk: sqlite3.Connection) -> None:
    plan = explain(bulk, "SELECT * FROM loan WHERE loaned_on = ?", ("2025-03-01",))
    assert plan == ["SCAN loan"]


def test_composite_index_serves_equality_then_range(bulk: sqlite3.Connection) -> None:
    plan = explain(
        bulk, "SELECT id FROM loan WHERE member_id = ? AND loaned_on >= ?", (3, "2025-06-01")
    )
    assert any("member_id=? AND loaned_on>?" in step for step in plan)


def test_covering_index_answers_without_touching_the_table(bulk: sqlite3.Connection) -> None:
    plan = explain(bulk, "SELECT loaned_on FROM loan WHERE member_id = ?", (7,))
    assert plan == ["SEARCH loan USING COVERING INDEX idx_loan_member_loaned (member_id=?)"]


def test_function_on_the_indexed_column_defeats_the_index(bulk: sqlite3.Connection) -> None:
    plan = explain(bulk, "SELECT id FROM loan WHERE substr(loaned_on, 1, 7) = ?", ("2025-03",))
    assert not any(step.startswith("SEARCH") for step in plan)
    ok = explain(bulk, "SELECT id FROM loan WHERE member_id = ?", (7,))
    assert any(step.startswith("SEARCH") for step in ok)


def test_arithmetic_on_the_indexed_column_defeats_the_index(bulk: sqlite3.Connection) -> None:
    plan = explain(bulk, "SELECT id FROM loan WHERE member_id + 0 = ?", (7,))
    assert not any(step.startswith("SEARCH") for step in plan)


def test_leading_wildcard_like_scans(bulk: sqlite3.Connection) -> None:
    plan = explain(bulk, "SELECT id FROM book WHERE title LIKE ?", ("%123",))
    assert plan == ["SCAN book"]


def test_partial_index_serves_only_open_loans(bulk: sqlite3.Connection) -> None:
    plan = explain(
        bulk, "SELECT id FROM loan WHERE returned_on IS NULL AND due_on < ?", ("2025-06-01",)
    )
    assert uses_index(plan, "idx_loan_open")
    closed = explain(
        bulk, "SELECT id FROM loan WHERE returned_on IS NOT NULL AND due_on < ?", ("2025-06-01",)
    )
    assert not uses_index(closed, "idx_loan_open")


def test_unique_constraint_creates_its_own_index(bulk: sqlite3.Connection) -> None:
    plan = explain(bulk, "SELECT id FROM book WHERE isbn = ?", ("isbn-00010",))
    assert uses_index(plan, "sqlite_autoindex_book_1")


def test_n_plus_1_runs_one_statement_per_row(conn: sqlite3.Connection) -> None:
    with StatementCounter(conn) as bad:
        slow = titles_with_authors_n_plus_1(conn)
    with StatementCounter(conn) as good:
        fast = titles_with_authors_join(conn)
    assert slow == fast
    assert bad.count == 1 + 8
    assert good.count == 1
