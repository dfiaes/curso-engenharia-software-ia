"""The N+1 query problem, measured by counting the statements the driver executes."""

from __future__ import annotations

import sqlite3
from dataclasses import dataclass, field


@dataclass
class StatementCounter:
    """Count statements that reach SQLite (``set_trace_callback`` sees each one)."""

    conn: sqlite3.Connection
    statements: list[str] = field(default_factory=list)

    def __enter__(self) -> StatementCounter:
        self.conn.set_trace_callback(self.statements.append)
        return self

    def __exit__(self, *exc: object) -> None:
        self.conn.set_trace_callback(None)

    @property
    def count(self) -> int:
        return len(self.statements)


def titles_with_authors_n_plus_1(conn: sqlite3.Connection) -> list[tuple[str, str]]:
    """One query for the books, then one more per book for its author: 1 + N statements."""
    result: list[tuple[str, str]] = []
    for book in conn.execute("SELECT title, author_id FROM book ORDER BY id").fetchall():
        author = conn.execute("SELECT name FROM author WHERE id = ?", (book["author_id"],))
        result.append((str(book["title"]), str(author.fetchone()["name"])))
    return result


def titles_with_authors_join(conn: sqlite3.Connection) -> list[tuple[str, str]]:
    """The same answer in a single statement."""
    rows = conn.execute(
        "SELECT b.title, a.name FROM book AS b JOIN author AS a ON a.id = b.author_id ORDER BY b.id"
    ).fetchall()
    return [(str(row["title"]), str(row["name"])) for row in rows]
