"""Every .sql file against a data set whose answers were worked out by hand."""

from __future__ import annotations

import sqlite3

import pytest

from sqllab.queries import list_queries, load_query, run_query
from sqllab.seed import TODAY


def names(rows: list[dict[str, object]], key: str) -> list[object]:
    return [r[key] for r in rows]


def test_every_query_file_runs(conn: sqlite3.Connection) -> None:
    for name in list_queries():
        run_query(conn, name, {"today": TODAY, "member_id": 5})


def test_unknown_query_is_an_error(conn: sqlite3.Connection) -> None:
    with pytest.raises(KeyError, match="unknown query"):
        run_query(conn, "does_not_exist")


def test_inner_join_returns_one_row_per_loan(conn: sqlite3.Connection) -> None:
    rows = run_query(conn, "q01_loans_with_titles")
    assert len(rows) == 9
    assert rows[0] == {
        "loan_id": 1,
        "member": "Ana",
        "title": "Dom Casmurro",
        "loaned_on": "2026-05-01",
    }


def test_inner_join_drops_members_without_loans(conn: sqlite3.Connection) -> None:
    assert "Fábio" not in names(run_query(conn, "q01_loans_with_titles"), "member")


def test_left_join_anti_join_finds_author_without_books(conn: sqlite3.Connection) -> None:
    assert run_query(conn, "q02_authors_without_books") == [{"id": 5, "name": "Conceição Evaristo"}]


def test_not_exists_finds_books_never_loaned(conn: sqlite3.Connection) -> None:
    assert names(run_query(conn, "q03_books_never_loaned"), "id") == [7, 8]


def test_group_by_having_counts_overdue_loans(conn: sqlite3.Connection) -> None:
    assert run_query(conn, "q04_overdue_by_member", {"today": TODAY}) == [
        {"member": "Bruno", "overdue_loans": 1, "max_days_late": 27},
        {"member": "Carla", "overdue_loans": 1, "max_days_late": 15},
        {"member": "Diego", "overdue_loans": 1, "max_days_late": 4},
    ]


def test_overdue_depends_on_the_parameter_not_the_clock(conn: sqlite3.Connection) -> None:
    assert run_query(conn, "q04_overdue_by_member", {"today": "2026-05-01"}) == []


def test_recursive_cte_walks_the_category_tree(conn: sqlite3.Connection) -> None:
    rows = run_query(conn, "q05_category_tree")
    assert names(rows, "path") == [
        "Literatura",
        "Literatura > Conto",
        "Literatura > Romance",
        "Literatura > Romance > Romance histórico",
        "Não ficção",
        "Não ficção > Ciência",
        "Não ficção > Ciência > Computação",
    ]
    assert max(int(str(d)) for d in names(rows, "depth")) == 2


def test_recursive_cte_climbs_the_referral_chain(conn: sqlite3.Connection) -> None:
    rows = run_query(conn, "q06_referral_chain", {"member_id": 5})
    assert names(rows, "name") == ["Elisa", "Diego", "Bruno", "Ana"]
    assert names(run_query(conn, "q06_referral_chain", {"member_id": 6}), "name") == ["Fábio"]


def test_recursive_cte_terminates_with_a_cycle_when_union_is_used(conn: sqlite3.Connection) -> None:
    """Control negative for cycles: UNION (not UNION ALL) dedups rows and stops the loop."""
    conn.execute("PRAGMA foreign_keys = OFF")
    conn.execute("UPDATE member SET referred_by = 5 WHERE id = 1")  # Ana <- Elisa: cycle
    rows = conn.execute(
        "WITH RECURSIVE chain (id) AS ("
        " SELECT 5 UNION SELECT m.referred_by FROM member AS m JOIN chain AS c ON m.id = c.id"
        " WHERE m.referred_by IS NOT NULL) SELECT id FROM chain ORDER BY id"
    ).fetchall()
    assert [r[0] for r in rows] == [1, 2, 4, 5]


def test_window_running_count_and_lag(conn: sqlite3.Connection) -> None:
    rows = run_query(conn, "q07_running_loans")
    ana = [r for r in rows if r["member_id"] == 1]
    assert names(ana, "loans_so_far") == [1, 2, 3, 4]
    assert names(ana, "days_since_previous") == [None, 11, 34, 11]


def test_row_number_picks_the_latest_loan_per_member(conn: sqlite3.Connection) -> None:
    rows = run_query(conn, "q08_latest_loan_per_member")
    assert names(rows, "loan_id") == [9, 3, 5, 6, 8]


def test_correlated_subquery_gives_the_same_answer_as_row_number(conn: sqlite3.Connection) -> None:
    rows = conn.execute(
        "SELECT l.id FROM loan AS l WHERE l.loaned_on ="
        " (SELECT MAX(l2.loaned_on) FROM loan AS l2 WHERE l2.member_id = l.member_id)"
        " ORDER BY l.member_id"
    ).fetchall()
    assert [r[0] for r in rows] == [9, 3, 5, 6, 8]


def test_rank_ties_leave_gaps_dense_rank_does_not(conn: sqlite3.Connection) -> None:
    rows = run_query(conn, "q09_book_popularity")
    assert names(rows, "row_number") == [1, 2, 3, 4, 5, 6, 7, 8]
    assert names(rows, "rank") == [1, 1, 1, 4, 4, 4, 7, 7]
    assert names(rows, "dense_rank") == [1, 1, 1, 2, 2, 2, 3, 3]


def test_self_join(conn: sqlite3.Connection) -> None:
    rows = run_query(conn, "q10_referrals_self_join")
    assert rows[0] == {"member": "Ana", "referred_by": None}
    assert rows[4] == {"member": "Elisa", "referred_by": "Diego"}


def test_where_filters_rows_having_filters_groups(conn: sqlite3.Connection) -> None:
    rows = conn.execute(
        "SELECT member_id, COUNT(*) AS n FROM loan WHERE returned_on IS NOT NULL"
        " GROUP BY member_id HAVING COUNT(*) >= 2 ORDER BY member_id"
    ).fetchall()
    assert [(r["member_id"], r["n"]) for r in rows] == [(1, 3)]


def test_query_files_are_plain_sql() -> None:
    assert "SELECT" in load_query("q01_loans_with_titles")
