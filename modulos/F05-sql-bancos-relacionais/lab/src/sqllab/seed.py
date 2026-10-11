"""Deterministic data: a tiny hand-checked set and a bulk generator for index demos."""

from __future__ import annotations

import sqlite3
from collections.abc import Iterator
from datetime import date, timedelta

from sqllab.db import transaction

TODAY = "2026-06-30"
"""The fixed 'now' used by the small data set, so results never depend on the clock."""


def seed_small(conn: sqlite3.Connection) -> None:
    """Insert a small data set whose query results are verified by hand in the tests."""
    with transaction(conn):
        _insert_small(conn)


def _insert_small(conn: sqlite3.Connection) -> None:
    conn.executemany(
        "INSERT INTO author (id, name, born_year) VALUES (?, ?, ?)",
        [
            (1, "Machado de Assis", 1839),
            (2, "Clarice Lispector", 1920),
            (3, "Jorge Amado", 1912),
            (4, "Graciliano Ramos", 1892),
            (5, "Conceição Evaristo", 1946),
        ],
    )
    conn.executemany(
        "INSERT INTO category (id, name, parent_id) VALUES (?, ?, ?)",
        [
            (1, "Literatura", None),
            (2, "Romance", 1),
            (3, "Conto", 1),
            (4, "Romance histórico", 2),
            (5, "Não ficção", None),
            (6, "Ciência", 5),
            (7, "Computação", 6),
        ],
    )
    conn.executemany(
        "INSERT INTO book (id, isbn, title, author_id, category_id, published_year, copies)"
        " VALUES (?, ?, ?, ?, ?, ?, ?)",
        [
            (1, "978-0-00-000001-1", "Dom Casmurro", 1, 2, 1899, 2),
            (2, "978-0-00-000002-2", "Memórias Póstumas de Brás Cubas", 1, 2, 1881, 1),
            (3, "978-0-00-000003-3", "A Hora da Estrela", 2, 2, 1977, 1),
            (4, "978-0-00-000004-4", "Laços de Família", 2, 3, 1960, 1),
            (5, "978-0-00-000005-5", "Gabriela, Cravo e Canela", 3, 2, 1958, 3),
            (6, "978-0-00-000006-6", "Vidas Secas", 4, 2, 1938, 1),
            (7, "978-0-00-000007-7", "Capitães da Areia", 3, None, 1937, 0),
            (8, "978-0-00-000008-8", "O Alienista", 1, 3, 1882, 1),
        ],
    )
    conn.executemany(
        "INSERT INTO member (id, email, name, joined_on, referred_by) VALUES (?, ?, ?, ?, ?)",
        [
            (1, "ana@example.com", "Ana", "2026-01-05", None),
            (2, "bruno@example.com", "Bruno", "2026-01-20", 1),
            (3, "carla@example.com", "Carla", "2026-02-10", 1),
            (4, "diego@example.com", "Diego", "2026-03-01", 2),
            (5, "elisa@example.com", "Elisa", "2026-03-15", 4),
            (6, "fabio@example.com", "Fábio", "2026-04-02", None),
        ],
    )
    conn.executemany(
        "INSERT INTO loan (id, book_id, member_id, loaned_on, due_on, returned_on)"
        " VALUES (?, ?, ?, ?, ?, ?)",
        [
            (1, 1, 1, "2026-05-01", "2026-05-15", "2026-05-10"),
            (2, 2, 1, "2026-05-12", "2026-05-26", "2026-06-02"),
            (3, 3, 2, "2026-05-20", "2026-06-03", None),
            (4, 1, 3, "2026-06-01", "2026-06-15", None),
            (5, 5, 3, "2026-06-10", "2026-06-24", "2026-06-20"),
            (6, 5, 4, "2026-06-12", "2026-06-26", None),
            (7, 6, 1, "2026-06-15", "2026-06-29", "2026-06-25"),
            (8, 4, 5, "2026-06-25", "2026-07-09", None),
            (9, 3, 1, "2026-06-26", "2026-07-10", None),
        ],
    )


def _lcg(seed: int) -> Iterator[int]:
    """Tiny linear congruential generator: same seed, same data on every machine."""
    state = seed
    while True:
        state = (1664525 * state + 1013904223) % 2**32
        yield state


def seed_bulk(
    conn: sqlite3.Connection, *, loans: int = 20_000, members: int = 1_000, books: int = 500
) -> None:
    """Fill an empty database with a larger, reproducible data set (no ``random``)."""
    with transaction(conn):
        _insert_bulk(conn, loans=loans, members=members, books=books)


def _insert_bulk(conn: sqlite3.Connection, *, loans: int, members: int, books: int) -> None:
    rng = _lcg(42)
    conn.executemany(
        "INSERT INTO author (id, name, born_year) VALUES (?, ?, ?)",
        [(i, f"Autor {i:03d}", 1800 + i) for i in range(1, 51)],
    )
    conn.executemany(
        "INSERT INTO book (id, isbn, title, author_id, published_year, copies)"
        " VALUES (?, ?, ?, ?, ?, ?)",
        [
            (i, f"isbn-{i:05d}", f"Livro {i:04d}", 1 + i % 50, 1900 + i % 120, 3)
            for i in range(1, books + 1)
        ],
    )
    conn.executemany(
        "INSERT INTO member (id, email, name, joined_on) VALUES (?, ?, ?, ?)",
        [(i, f"m{i}@example.com", f"Membro {i}", "2024-01-01") for i in range(1, members + 1)],
    )
    start = date(2025, 1, 1)

    def rows() -> Iterator[tuple[int, int, str, str, str | None]]:
        for _ in range(loans):
            book_id = 1 + next(rng) % books
            member_id = 1 + next(rng) % members
            loaned = start + timedelta(days=next(rng) % 365)
            due = loaned + timedelta(days=14)
            open_loan = next(rng) % 20 == 0  # about 5% still open
            returned = None if open_loan else (loaned + timedelta(days=1 + next(rng) % 20))
            yield (
                book_id,
                member_id,
                loaned.isoformat(),
                due.isoformat(),
                returned.isoformat() if returned else None,
            )

    conn.executemany(
        "INSERT INTO loan (book_id, member_id, loaned_on, due_on, returned_on)"
        " VALUES (?, ?, ?, ?, ?)",
        rows(),
    )
