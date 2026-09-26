"""Modelo de dados local em SQLite + runner de migrations (M13 B5).

Decisões:
- SQLite ``:memory:``/arquivo local para o Tier 1; PostgreSQL + RLS ficam
  BLOCKED ambiental (sem Postgres/contêiner no ambiente) — ver RASTREABILIDADE.
- Migrations são pares (up, down) versionados em sequência; o runner aplica e
  faz rollback em transação por passo, registrando em ``schema_migrations``.
- Isolamento por tenant nesta camada é **scoping obrigatório nas queries**
  (toda consulta carrega ``tenant_id``). O ``WITH CHECK`` de RLS do Postgres é
  o mecanismo de defesa em profundidade que entra no adapter PG (documentado em
  ``docs/migrations-design.md``); aqui o contrato é: nenhuma função pública
  aceita consulta sem tenant.
"""

from __future__ import annotations

import sqlite3
from collections.abc import Callable

Migration = tuple[str, str, str]  # (versão, sql up, sql down)

PRAGMAS = ("PRAGMA foreign_keys = ON;",)

MIGRATIONS: list[Migration] = [
    (
        "0001_tenants_repos",
        """
        CREATE TABLE tenant (
            id INTEGER PRIMARY KEY,
            slug TEXT NOT NULL UNIQUE
        );
        CREATE TABLE repository (
            id INTEGER PRIMARY KEY,
            tenant_id INTEGER NOT NULL REFERENCES tenant(id) ON DELETE CASCADE,
            name TEXT NOT NULL,
            UNIQUE (tenant_id, name)
        );
        """,
        "DROP TABLE repository; DROP TABLE tenant;",
    ),
    (
        "0002_snapshots_files_symbols",
        """
        CREATE TABLE snapshot (
            id INTEGER PRIMARY KEY,
            tenant_id INTEGER NOT NULL REFERENCES tenant(id) ON DELETE CASCADE,
            repository_id INTEGER NOT NULL REFERENCES repository(id) ON DELETE CASCADE,
            content_hash TEXT NOT NULL,
            status TEXT NOT NULL CHECK (status IN ('queued','running','done','failed','cancelled'))
        );
        CREATE TABLE file (
            id INTEGER PRIMARY KEY,
            snapshot_id INTEGER NOT NULL REFERENCES snapshot(id) ON DELETE CASCADE,
            rel_path TEXT NOT NULL,
            sha256 TEXT NOT NULL,
            UNIQUE (snapshot_id, rel_path)
        );
        CREATE TABLE symbol (
            id INTEGER PRIMARY KEY,
            file_id INTEGER NOT NULL REFERENCES file(id) ON DELETE CASCADE,
            kind TEXT NOT NULL,
            name TEXT NOT NULL,
            line INTEGER NOT NULL
        );
        CREATE TABLE edge (
            id INTEGER PRIMARY KEY,
            file_id INTEGER NOT NULL REFERENCES file(id) ON DELETE CASCADE,
            kind TEXT NOT NULL,
            target TEXT NOT NULL,
            line INTEGER NOT NULL
        );
        """,
        "DROP TABLE edge; DROP TABLE symbol; DROP TABLE file; DROP TABLE snapshot;",
    ),
    (
        "0003_jobs_usage",
        """
        CREATE TABLE job (
            id INTEGER PRIMARY KEY,
            tenant_id INTEGER NOT NULL REFERENCES tenant(id) ON DELETE CASCADE,
            idempotency_key TEXT NOT NULL UNIQUE,
            status TEXT NOT NULL CHECK (status IN ('queued','running','done','failed','cancelled')),
            error TEXT
        );
        CREATE TABLE usage_event (
            id INTEGER PRIMARY KEY,
            tenant_id INTEGER NOT NULL REFERENCES tenant(id) ON DELETE CASCADE,
            kind TEXT NOT NULL,
            quantity INTEGER NOT NULL CHECK (quantity >= 0)
        );
        """,
        "DROP TABLE usage_event; DROP TABLE job;",
    ),
]


def connect(path: str = ":memory:") -> sqlite3.Connection:
    conn = sqlite3.connect(path)
    for pragma in PRAGMAS:
        conn.execute(pragma)
    return conn


def applied_versions(conn: sqlite3.Connection) -> list[str]:
    try:
        rows = conn.execute("SELECT version FROM schema_migrations ORDER BY version").fetchall()
    except sqlite3.OperationalError:
        return []
    return [str(v[0]) for v in rows]


def migrate(conn: sqlite3.Connection, target: int | None = None) -> list[str]:
    """Aplica migrations até ``target`` (ou todas). Retorna versões aplicadas."""
    conn.execute("CREATE TABLE IF NOT EXISTS schema_migrations (version TEXT PRIMARY KEY)")
    done = set(applied_versions(conn))
    applied: list[str] = []
    pending = [m for m in MIGRATIONS if m[0] not in done]
    if target is not None:
        pending = pending[:target]
    for version, up_sql, _down in pending:
        with conn:
            conn.executescript(up_sql)
            conn.execute("INSERT INTO schema_migrations (version) VALUES (?)", (version,))
        applied.append(version)
    return applied


def rollback(conn: sqlite3.Connection, steps: int = 1) -> list[str]:
    """Reverte as ``steps`` últimas migrations, em ordem inversa."""
    versions = applied_versions(conn)
    to_undo = versions[-steps:] if steps else []
    rolled_back: list[str] = []
    for version in reversed(to_undo):
        down = next(d for v, _u, d in MIGRATIONS if v == version)
        with conn:
            conn.executescript(down)
            conn.execute("DELETE FROM schema_migrations WHERE version = ?", (version,))
        rolled_back.append(version)
    return rolled_back


def insert_tenant(conn: sqlite3.Connection, slug: str) -> int:
    with conn:
        cur = conn.execute("INSERT INTO tenant (slug) VALUES (?)", (slug,))
    assert cur.lastrowid is not None
    return cur.lastrowid


def list_tenant_repositories(conn: sqlite3.Connection, tenant_id: int) -> list[str]:
    """Consulta escopada por tenant — contrato de isolamento desta camada."""
    rows = conn.execute(
        "SELECT name FROM repository WHERE tenant_id = ? ORDER BY name", (tenant_id,)
    ).fetchall()
    return [str(r[0]) for r in rows]


def add_repository(conn: sqlite3.Connection, tenant_id: int, name: str) -> int:
    with conn:
        cur = conn.execute(
            "INSERT INTO repository (tenant_id, name) VALUES (?, ?)", (tenant_id, name)
        )
    assert cur.lastrowid is not None
    return cur.lastrowid


def upsert_job(conn: sqlite3.Connection, tenant_id: int, key: str, status: str) -> int:
    """Job por ``(tenant, idempotency_key)``: repetir a chave não duplica linha."""
    with conn:
        cur = conn.execute(
            """
            INSERT INTO job (tenant_id, idempotency_key, status)
            VALUES (?, ?, ?)
            ON CONFLICT (idempotency_key) DO UPDATE SET status = excluded.status
            RETURNING id
            """,
            (tenant_id, key, status),
        )
        row = cur.fetchone()
    return int(row[0])


ApplyFn = Callable[[sqlite3.Connection], None]
