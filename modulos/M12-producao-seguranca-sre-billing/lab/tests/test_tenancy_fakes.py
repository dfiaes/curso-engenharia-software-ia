from datetime import UTC, datetime, timedelta
from uuid import uuid4

from m12_lab.tenancy import TenantContext, TenantDataPlanes, VectorDocument


def seed_all_planes(planes: TenantDataPlanes, context: TenantContext, marker: str) -> None:
    planes.cache_put(context, "same-key", f"cache-{marker}")
    planes.object_put(context, "same-name.pdf", f"object-{marker}".encode())
    planes.vector_add(context, VectorDocument("same-id", f"shared query {marker}"))
    planes.graph_add_edge(context, "shared-source", f"target-{marker}")
    planes.enqueue(context, f"message-{marker}")


def test_every_fake_data_plane_is_scoped_by_tenant() -> None:
    planes = TenantDataPlanes()
    tenant_a = TenantContext(uuid4())
    tenant_b = TenantContext(uuid4())
    seed_all_planes(planes, tenant_a, "A")
    seed_all_planes(planes, tenant_b, "B")

    assert planes.cache_get(tenant_a, "same-key") == "cache-A"
    assert planes.cache_get(tenant_b, "same-key") == "cache-B"
    assert planes.object_get(tenant_a, "same-name.pdf") == b"object-A"
    assert planes.object_get(tenant_b, "same-name.pdf") == b"object-B"
    assert [item.text for item in planes.vector_search(tenant_a, "shared query B")] == [
        "shared query A"
    ]
    assert planes.graph_edges(tenant_a) == frozenset({("shared-source", "target-A")})
    assert planes.dequeue(tenant_a) == "message-A"
    assert planes.dequeue(tenant_b) == "message-B"


def test_tenant_deletion_clears_active_stores_without_touching_another_tenant() -> None:
    planes = TenantDataPlanes()
    tenant_a = TenantContext(uuid4())
    tenant_b = TenantContext(uuid4())
    seed_all_planes(planes, tenant_a, "A")
    seed_all_planes(planes, tenant_b, "B")
    now = datetime(2026, 8, 14, tzinfo=UTC)

    report = planes.delete_tenant(
        tenant_a,
        now=now,
        backup_retention=timedelta(days=30),
    )

    assert report.active_records_remaining == 0
    assert report.removed_by_store == {
        "cache": 1,
        "objects": 1,
        "vectors": 1,
        "graph": 1,
        "queue": 1,
    }
    assert report.backups_expire_at == now + timedelta(days=30)
    assert planes.count_tenant_records(tenant_b) == 5
