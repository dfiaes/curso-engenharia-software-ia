"""M12-B09-L: ponte final (fatia local, sem rede).

Reexecuta as superfícies congeladas de B01-B08 por importação (sem
duplicar implementação) e congela o contrato de exclusão:
``TenantDataPlanes.delete_tenant(context, *, now, backup_retention)``
remove o tenant de cache, objetos, vetores, grafo e fila, devolve
``DeletionReport`` com ``removed_by_store`` por store,
``active_records_remaining`` zero e ``backups_expire_at`` igual ao
instante somado à retenção; ``count_tenant_records(context)``
confirma zero registro restante.

Limites (não executados aqui, evidências seguintes detêm): PostgreSQL
real com RLS, coordenação distribuída, adapter Stripe em test-mode,
telemetria do Capstone, Capstone E2E, game day com timeline/postmortem,
restore de backup e reintrodução indevida. ``test_tenancy_postgres.py``
segue BLOCKED sem Docker; contagens abaixo são exemplo variável.
"""

from __future__ import annotations

import inspect
from datetime import UTC, datetime, timedelta
from uuid import uuid4

from m12_lab import authorization, billing, reliability, runtime, security, sre, telemetry
from m12_lab.tenancy import DeletionReport, TenantContext, TenantDataPlanes, VectorDocument


def test_b09_frozen_contract_surface() -> None:
    assert list(inspect.signature(TenantDataPlanes.delete_tenant).parameters) == [
        "self",
        "context",
        "now",
        "backup_retention",
    ]
    params = inspect.signature(TenantDataPlanes.delete_tenant).parameters
    assert params["now"].kind is inspect.Parameter.KEYWORD_ONLY
    assert params["backup_retention"].kind is inspect.Parameter.KEYWORD_ONLY
    assert list(inspect.signature(TenantDataPlanes.count_tenant_records).parameters) == [
        "self",
        "context",
    ]
    assert list(DeletionReport.__dataclass_fields__) == [
        "tenant_id",
        "removed_by_store",
        "active_records_remaining",
        "backups_expire_at",
    ]


def test_b09_prior_surfaces_still_importable() -> None:
    assert callable(authorization.LocalPolicy)
    assert callable(security.ContentPolicy)
    assert callable(runtime.SafeAgentRuntime)
    assert callable(telemetry.SafeSpanExporter)
    assert callable(reliability.IdempotencyService)
    assert callable(billing.UsageLedger)
    assert callable(sre.burn_rate)


def test_at060_coordinated_deletion_clears_five_stores() -> None:
    planes = TenantDataPlanes()
    tenant_a = TenantContext(uuid4())
    tenant_b = TenantContext(uuid4())
    for context, marker in ((tenant_a, "A"), (tenant_b, "B")):
        planes.cache_put(context, "same-key", f"cache-{marker}")
        planes.object_put(context, "same-name.pdf", f"object-{marker}".encode())
        planes.vector_add(context, VectorDocument("same-id", f"shared query {marker}"))
        planes.graph_add_edge(context, "shared-source", f"target-{marker}")
        planes.enqueue(context, f"message-{marker}")
    now = datetime(2026, 9, 12, tzinfo=UTC)

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
    assert planes.cache_get(tenant_b, "same-key") == "cache-B"
