"""B5: migrations forward/rollback, integridade e isolamento por tenant."""

import sqlite3

import pytest

from capstone_lab.db import (
    MIGRATIONS,
    add_repository,
    applied_versions,
    connect,
    insert_tenant,
    list_tenant_repositories,
    migrate,
    rollback,
    upsert_job,
)


def test_migrate_applies_all_versions() -> None:
    conn = connect()
    applied = migrate(conn)
    assert applied == [m[0] for m in MIGRATIONS]
    assert applied_versions(conn) == applied


def test_rollback_restores_prior_schema() -> None:
    conn = connect()
    migrate(conn)
    rolled = rollback(conn, steps=1)
    assert rolled == [MIGRATIONS[-1][0]]
    with pytest.raises(sqlite3.OperationalError):
        conn.execute("SELECT 1 FROM job").fetchall()  # tabela removida no down
    assert applied_versions(conn) == [m[0] for m in MIGRATIONS[:-1]]


def test_foreign_key_integrity_is_enforced() -> None:
    conn = connect()
    migrate(conn)
    with pytest.raises(sqlite3.IntegrityError):
        add_repository(conn, tenant_id=999, name="orfao")


def test_tenant_scoping_isolates_data_between_tenants() -> None:
    conn = connect()
    migrate(conn)
    a = insert_tenant(conn, "tenant-a")
    b = insert_tenant(conn, "tenant-b")
    add_repository(conn, a, "repo-a1")
    add_repository(conn, a, "repo-a2")
    add_repository(conn, b, "repo-b1")
    assert list_tenant_repositories(conn, a) == ["repo-a1", "repo-a2"]
    assert list_tenant_repositories(conn, b) == ["repo-b1"]  # zero vazamento A→B


def test_job_upsert_is_idempotent_by_key() -> None:
    conn = connect()
    migrate(conn)
    t = insert_tenant(conn, "t")
    upsert_job(conn, t, "ing:abc", "queued")
    upsert_job(conn, t, "ing:abc", "done")  # mesma chave: atualiza, não duplica
    rows = conn.execute("SELECT status FROM job WHERE idempotency_key = 'ing:abc'").fetchall()
    assert rows == [("done",)]


def test_invalid_job_status_is_rejected_by_check_constraint() -> None:
    conn = connect()
    migrate(conn)
    t = insert_tenant(conn, "t")
    with pytest.raises(sqlite3.IntegrityError):
        upsert_job(conn, t, "k1", "invented-status")
