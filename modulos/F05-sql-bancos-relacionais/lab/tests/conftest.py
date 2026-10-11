from __future__ import annotations

import sqlite3
from collections.abc import Iterator

import pytest

from sqllab.db import connect, migrate
from sqllab.seed import seed_small


@pytest.fixture
def empty() -> Iterator[sqlite3.Connection]:
    """Migrated schema, no rows."""
    conn = connect()
    migrate(conn)
    yield conn
    conn.close()


@pytest.fixture
def conn(empty: sqlite3.Connection) -> sqlite3.Connection:
    """Migrated schema plus the hand-checked small data set."""
    seed_small(empty)
    return empty
