"""Data access with DB-API parameters and explicit transactions."""

from __future__ import annotations

import sqlite3
from dataclasses import dataclass
from datetime import date, timedelta

from sqllab.db import transaction


class OutOfStock(Exception):
    """No copy of the book is available."""


class LoanNotOpen(Exception):
    """The loan does not exist or was already returned."""


@dataclass(frozen=True, slots=True)
class Member:
    id: int
    email: str
    name: str


BOOK_ORDER_COLUMNS = {"title": "title", "year": "published_year", "copies": "copies"}
"""Identifiers cannot be bound as parameters, so they go through an allow-list."""


class LibraryRepository:
    """Every public method owns its transaction; do not call them inside another one."""

    def __init__(self, conn: sqlite3.Connection) -> None:
        self._conn = conn

    def add_member(
        self, email: str, name: str, joined_on: str, referred_by: int | None = None
    ) -> int:
        with transaction(self._conn):
            row = self._conn.execute(
                "INSERT INTO member (email, name, joined_on, referred_by)"
                " VALUES (?, ?, ?, ?) RETURNING id",
                (email, name, joined_on, referred_by),
            ).fetchone()
        return int(row["id"])

    def get_member_by_email(self, email: str) -> Member | None:
        row = self._conn.execute(
            "SELECT id, email, name FROM member WHERE email = ?", (email,)
        ).fetchone()
        return None if row is None else Member(row["id"], row["email"], row["name"])

    def upsert_book(self, isbn: str, title: str, author_id: int, copies: int) -> tuple[int, int]:
        """Insert the book or, if the ISBN exists, add ``copies`` to the stock."""
        with transaction(self._conn):
            row = self._conn.execute(
                "INSERT INTO book (isbn, title, author_id, copies) VALUES (?, ?, ?, ?)"
                " ON CONFLICT (isbn) DO UPDATE SET copies = copies + excluded.copies"
                " RETURNING id, copies",
                (isbn, title, author_id, copies),
            ).fetchone()
        return int(row["id"]), int(row["copies"])

    def list_books(self, order_by: str = "title") -> list[str]:
        column = BOOK_ORDER_COLUMNS.get(order_by)
        if column is None:
            raise ValueError(f"cannot order by {order_by!r}")
        rows = self._conn.execute(f"SELECT title FROM book ORDER BY {column}, id").fetchall()
        return [str(row["title"]) for row in rows]

    def checkout(self, member_id: int, book_id: int, on: date, days: int = 14) -> int:
        """Lend a copy: insert the loan and decrement the stock, or do neither."""
        with transaction(self._conn, immediate=True):
            loan = self._conn.execute(
                "INSERT INTO loan (book_id, member_id, loaned_on, due_on) VALUES (?, ?, ?, ?)"
                " RETURNING id",
                (book_id, member_id, on.isoformat(), (on + timedelta(days=days)).isoformat()),
            ).fetchone()
            stock = self._conn.execute(
                "UPDATE book SET copies = copies - 1 WHERE id = ? AND copies > 0", (book_id,)
            )
            if stock.rowcount == 0:
                raise OutOfStock(f"book {book_id} has no copy available")
        return int(loan["id"])

    def return_loan(self, loan_id: int, on: date) -> None:
        with transaction(self._conn, immediate=True):
            closed = self._conn.execute(
                "UPDATE loan SET returned_on = ? WHERE id = ? AND returned_on IS NULL",
                (on.isoformat(), loan_id),
            )
            if closed.rowcount == 0:
                raise LoanNotOpen(f"loan {loan_id} is not open")
            self._conn.execute(
                "UPDATE book SET copies = copies + 1"
                " WHERE id = (SELECT book_id FROM loan WHERE id = ?)",
                (loan_id,),
            )
