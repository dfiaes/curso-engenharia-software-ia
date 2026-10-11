from __future__ import annotations

import sqlite3
from datetime import date

import pytest

from sqllab.db import transaction
from sqllab.repository import LibraryRepository, LoanNotOpen, OutOfStock


def stock(conn: sqlite3.Connection, book_id: int) -> int:
    return int(conn.execute("SELECT copies FROM book WHERE id = ?", (book_id,)).fetchone()[0])


def loans(conn: sqlite3.Connection) -> int:
    return int(conn.execute("SELECT COUNT(*) FROM loan").fetchone()[0])


def test_add_and_find_member(conn: sqlite3.Connection) -> None:
    repo = LibraryRepository(conn)
    new_id = repo.add_member("gil@example.com", "Gil", "2026-06-30", referred_by=1)
    member = repo.get_member_by_email("gil@example.com")
    assert member is not None
    assert (member.id, member.name) == (new_id, "Gil")


def test_unknown_member_is_none(conn: sqlite3.Connection) -> None:
    assert LibraryRepository(conn).get_member_by_email("nobody@example.com") is None


def test_duplicate_email_is_rejected_and_leaves_no_trace(conn: sqlite3.Connection) -> None:
    repo = LibraryRepository(conn)
    with pytest.raises(sqlite3.IntegrityError, match="UNIQUE"):
        repo.add_member("ana@example.com", "Outra Ana", "2026-06-30")
    assert not conn.in_transaction


def test_upsert_inserts_then_adds_copies(conn: sqlite3.Connection) -> None:
    repo = LibraryRepository(conn)
    first = repo.upsert_book("978-new", "Livro Novo", 1, 2)
    second = repo.upsert_book("978-new", "Título ignorado", 1, 3)
    assert first[0] == second[0]  # same row
    assert (first[1], second[1]) == (2, 5)
    title = conn.execute("SELECT title FROM book WHERE id = ?", (first[0],)).fetchone()[0]
    assert title == "Livro Novo"  # the conflict branch only touched copies


def test_checkout_inserts_loan_and_decrements_stock(conn: sqlite3.Connection) -> None:
    repo = LibraryRepository(conn)
    before = stock(conn, 5)
    loan_id = repo.checkout(member_id=6, book_id=5, on=date(2026, 7, 1))
    assert stock(conn, 5) == before - 1
    row = conn.execute("SELECT due_on, returned_on FROM loan WHERE id = ?", (loan_id,)).fetchone()
    assert (row["due_on"], row["returned_on"]) == ("2026-07-15", None)


def test_checkout_without_stock_rolls_back_the_loan(conn: sqlite3.Connection) -> None:
    """Failure path: the INSERT already ran when the stock check fails; it must vanish."""
    repo = LibraryRepository(conn)
    before = loans(conn)
    with pytest.raises(OutOfStock):
        repo.checkout(member_id=6, book_id=7, on=date(2026, 7, 1))  # book 7 has 0 copies
    assert loans(conn) == before
    assert stock(conn, 7) == 0
    assert not conn.in_transaction


def test_checkout_for_unknown_member_rolls_back(conn: sqlite3.Connection) -> None:
    repo = LibraryRepository(conn)
    before, copies = loans(conn), stock(conn, 5)
    with pytest.raises(sqlite3.IntegrityError, match="FOREIGN KEY"):
        repo.checkout(member_id=999, book_id=5, on=date(2026, 7, 1))
    assert (loans(conn), stock(conn, 5)) == (before, copies)


def test_return_restores_stock_and_cannot_repeat(conn: sqlite3.Connection) -> None:
    repo = LibraryRepository(conn)
    loan_id = repo.checkout(member_id=6, book_id=5, on=date(2026, 7, 1))
    after_checkout = stock(conn, 5)
    repo.return_loan(loan_id, date(2026, 7, 3))
    assert stock(conn, 5) == after_checkout + 1
    with pytest.raises(LoanNotOpen):
        repo.return_loan(loan_id, date(2026, 7, 4))
    assert stock(conn, 5) == after_checkout + 1  # the second attempt changed nothing


def test_transaction_context_manager_rolls_back_on_error(conn: sqlite3.Connection) -> None:
    with pytest.raises(RuntimeError), transaction(conn):
        conn.execute("UPDATE book SET copies = 99 WHERE id = 1")
        raise RuntimeError("boom")
    assert stock(conn, 1) == 2


def test_transaction_commits_on_success(conn: sqlite3.Connection) -> None:
    with transaction(conn):
        conn.execute("UPDATE book SET copies = 99 WHERE id = 1")
    assert stock(conn, 1) == 99


def test_order_by_goes_through_an_allow_list(conn: sqlite3.Connection) -> None:
    repo = LibraryRepository(conn)
    assert repo.list_books("year")[0] == "Memórias Póstumas de Brás Cubas"
    with pytest.raises(ValueError, match="cannot order by"):
        repo.list_books("title; DROP TABLE book")
    assert stock(conn, 1) == 2
