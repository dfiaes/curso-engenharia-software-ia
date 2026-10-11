"""All join kinds and three-valued logic, on data where the right answer is known."""

from __future__ import annotations

import sqlite3

import pytest

needs_full_join = pytest.mark.skipif(
    sqlite3.sqlite_version_info < (3, 39, 0),
    reason="RIGHT and FULL JOIN need SQLite 3.39+",
)


def scalar(conn: sqlite3.Connection, sql: str) -> object:
    return conn.execute(sql).fetchone()[0]


def test_inner_vs_left_join_row_counts(conn: sqlite3.Connection) -> None:
    inner = scalar(conn, "SELECT COUNT(*) FROM author a JOIN book b ON b.author_id = a.id")
    left = scalar(conn, "SELECT COUNT(*) FROM author a LEFT JOIN book b ON b.author_id = a.id")
    assert (inner, left) == (8, 9)  # author 5 survives only in the LEFT JOIN


@needs_full_join
def test_right_and_full_join(conn: sqlite3.Connection) -> None:
    right = scalar(
        conn, "SELECT COUNT(*) FROM category c RIGHT JOIN book b ON b.category_id = c.id"
    )
    full = scalar(conn, "SELECT COUNT(*) FROM category c FULL JOIN book b ON b.category_id = c.id")
    assert right == 8  # every book, with or without category
    assert full == 13  # 7 matches + book without category + 5 categories without books


def test_cross_join_is_the_cartesian_product(conn: sqlite3.Connection) -> None:
    assert scalar(conn, "SELECT COUNT(*) FROM author CROSS JOIN category") == 5 * 7


def test_on_vs_where_in_a_left_join(conn: sqlite3.Connection) -> None:
    """A filter on the right table in WHERE turns LEFT JOIN into INNER JOIN."""
    in_on = scalar(
        conn,
        "SELECT COUNT(*) FROM author a LEFT JOIN book b ON b.author_id = a.id AND b.copies > 1",
    )
    in_where = scalar(
        conn,
        "SELECT COUNT(*) FROM author a LEFT JOIN book b ON b.author_id = a.id WHERE b.copies > 1",
    )
    assert (in_on, in_where) == (5, 2)


def test_null_comparisons_are_unknown_not_false(conn: sqlite3.Connection) -> None:
    assert scalar(conn, "SELECT NULL = NULL") is None
    assert scalar(conn, "SELECT COUNT(*) FROM book WHERE category_id = NULL") == 0
    assert scalar(conn, "SELECT COUNT(*) FROM book WHERE category_id IS NULL") == 1
    assert scalar(conn, "SELECT COUNT(*) FROM book WHERE category_id <> 2") == 2  # NULL row lost


def test_count_star_vs_count_column(conn: sqlite3.Connection) -> None:
    assert scalar(conn, "SELECT COUNT(*) FROM book") == 8
    assert scalar(conn, "SELECT COUNT(category_id) FROM book") == 7


def test_not_in_with_a_null_returns_nothing(conn: sqlite3.Connection) -> None:
    """The trap: one NULL in the subquery makes every NOT IN comparison UNKNOWN."""
    rows = conn.execute(
        "SELECT name FROM category WHERE id NOT IN (SELECT category_id FROM book)"
    ).fetchall()
    assert rows == []


def test_not_exists_and_filtered_not_in_return_the_right_rows(conn: sqlite3.Connection) -> None:
    expected = [(1,), (4,), (5,), (6,), (7,)]
    not_exists = conn.execute(
        "SELECT c.id FROM category c WHERE NOT EXISTS"
        " (SELECT 1 FROM book b WHERE b.category_id = c.id) ORDER BY c.id"
    ).fetchall()
    filtered = conn.execute(
        "SELECT id FROM category WHERE id NOT IN"
        " (SELECT category_id FROM book WHERE category_id IS NOT NULL) ORDER BY id"
    ).fetchall()
    assert [tuple(r) for r in not_exists] == expected
    assert [tuple(r) for r in filtered] == expected


def test_in_with_a_null_still_finds_matches(conn: sqlite3.Connection) -> None:
    """IN only needs one TRUE; the NULL costs nothing. NOT IN needs all non-FALSE."""
    found = scalar(conn, "SELECT 2 IN (SELECT category_id FROM book)")
    assert found == 1


def test_aggregates_ignore_null_and_empty_sum_is_null(conn: sqlite3.Connection) -> None:
    assert scalar(conn, "SELECT SUM(copies) FROM book WHERE id > 100") is None
    assert scalar(conn, "SELECT COALESCE(SUM(copies), 0) FROM book WHERE id > 100") == 0
    assert scalar(conn, "SELECT COUNT(DISTINCT category_id) FROM book") == 2


def test_where_runs_before_select_so_filter_aliases_need_a_subquery(
    conn: sqlite3.Connection,
) -> None:
    """Portable SQL filters on a SELECT alias through a subquery (PostgreSQL rejects the
    alias in WHERE; SQLite happens to accept it)."""
    doubled = scalar(
        conn, "SELECT COUNT(*) FROM (SELECT copies * 2 AS doubled FROM book) WHERE doubled > 2"
    )
    assert doubled == 2  # books with 2 and 3 copies
