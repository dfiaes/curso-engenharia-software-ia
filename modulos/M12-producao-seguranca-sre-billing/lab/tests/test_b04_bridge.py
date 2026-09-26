"""M12-B04-L: executable bridge for M12-AT-010/011 (local slice, no network).

Proves the frozen B04 contracts without a database: every data-plane
operation takes the tenant from ``TenantContext`` (never from a caller
argument), the five fakes isolate by tenant, ``delete_tenant`` clears
only the requested tenant, and the migration holds the RLS reference
(USING + WITH CHECK, roles without bypass).

Limits (not executed here, PostgreSQL 18 real required): M12-AT-010/011
against a live database, M12-AT-012 role/table catalog assertions
(``pg_roles``/``pg_class``), M12-AT-013 pool reuse A->B with rollback,
M12-AT-014 native filters per real provider. ``test_tenancy_postgres.py``
stays BLOCKED without Docker; counts below are example variables.
"""

from __future__ import annotations

import inspect
import typing
from datetime import UTC, datetime, timedelta
from pathlib import Path
from uuid import uuid4

from m12_lab.tenancy import TenantContext, TenantDataPlanes, VectorDocument

MIGRATION = Path(__file__).parents[1] / "migrations" / "001_security_ledgers.sql"


def _seed(planes: TenantDataPlanes, context: TenantContext, marker: str) -> None:
    planes.cache_put(context, "same-key", f"cache-{marker}")
    planes.object_put(context, "same-name.pdf", f"object-{marker}".encode())
    planes.vector_add(context, VectorDocument("same-id", f"shared query {marker}"))
    planes.graph_add_edge(context, "shared-source", f"target-{marker}")
    planes.enqueue(context, f"message-{marker}")


def test_tenant_comes_from_context_only() -> None:
    for name, method in inspect.getmembers(TenantDataPlanes, inspect.isfunction):
        if name.startswith("_"):
            continue
        params = list(inspect.signature(method).parameters.values())
        assert params[1].name == "context"
        assert typing.get_type_hints(method)["context"] is TenantContext
        assert "tenant_id" not in inspect.signature(method).parameters
        assert "tenant" not in inspect.signature(method).parameters


def test_at010_fake_read_is_scoped_and_fail_closed() -> None:
    planes = TenantDataPlanes()
    tenant_a = TenantContext(uuid4())
    tenant_b = TenantContext(uuid4())
    unknown = TenantContext(uuid4())
    _seed(planes, tenant_a, "A")
    _seed(planes, tenant_b, "B")

    assert planes.cache_get(tenant_a, "same-key") == "cache-A"
    assert planes.cache_get(tenant_b, "same-key") == "cache-B"
    assert planes.cache_get(unknown, "same-key") is None
    assert planes.object_get(unknown, "same-name.pdf") is None
    assert [d.text for d in planes.vector_search(tenant_a, "shared query B")] == ["shared query A"]
    assert planes.vector_search(unknown, "shared query") == []
    assert planes.graph_edges(unknown) == frozenset()
    assert planes.dequeue(unknown) is None


def test_at011_fake_write_cannot_cross_tenant() -> None:
    planes = TenantDataPlanes()
    tenant_a = TenantContext(uuid4())
    tenant_b = TenantContext(uuid4())
    _seed(planes, tenant_a, "A")

    planes.cache_put(tenant_b, "same-key", "cache-B")
    planes.object_put(tenant_b, "same-name.pdf", b"object-B")

    assert planes.cache_get(tenant_a, "same-key") == "cache-A"
    assert planes.object_get(tenant_a, "same-name.pdf") == b"object-A"
    assert planes.count_tenant_records(tenant_a) == 5
    assert planes.count_tenant_records(tenant_b) == 2


def test_b04_delete_and_count_cover_five_planes() -> None:
    planes = TenantDataPlanes()
    tenant_a = TenantContext(uuid4())
    tenant_b = TenantContext(uuid4())
    _seed(planes, tenant_a, "A")
    _seed(planes, tenant_b, "B")
    now = datetime(2026, 8, 14, tzinfo=UTC)

    report = planes.delete_tenant(tenant_a, now=now, backup_retention=timedelta(days=30))

    assert report.tenant_id == tenant_a.tenant_id
    assert report.removed_by_store == {
        "cache": 1,
        "objects": 1,
        "vectors": 1,
        "graph": 1,
        "queue": 1,
    }
    assert report.active_records_remaining == 0
    assert report.backups_expire_at == now + timedelta(days=30)
    assert planes.count_tenant_records(tenant_a) == 0
    assert planes.count_tenant_records(tenant_b) == 5


def test_migration_holds_rls_reference_without_executing_pg() -> None:
    sql = MIGRATION.read_text(encoding="utf-8")

    assert sql.count("NOBYPASSRLS") == 2
    assert "BYPASSRLS" in sql
    assert "FORCE ROW LEVEL SECURITY" in sql
    assert "USING (tenant_id = current_setting('app.tenant_id', true)::uuid)" in sql
    assert "WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid)" in sql
    assert "FOR ALL TO course_m12_app" in sql
    assert "CREATE ROLE course_m12_app" in sql
    assert "CREATE ROLE course_m12_migrator" in sql
