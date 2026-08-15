"""Tenant-aware deterministic data planes and coordinated active-store deletion."""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timedelta
from uuid import UUID


@dataclass(frozen=True, slots=True)
class TenantContext:
    tenant_id: UUID


@dataclass(frozen=True, slots=True)
class VectorDocument:
    document_id: str
    text: str


@dataclass(frozen=True, slots=True)
class DeletionReport:
    tenant_id: UUID
    removed_by_store: dict[str, int]
    active_records_remaining: int
    backups_expire_at: datetime


class TenantDataPlanes:
    """A fake for contract tests; it does not replace provider-native isolation."""

    def __init__(self) -> None:
        self._cache: dict[tuple[UUID, str], str] = {}
        self._objects: dict[tuple[UUID, str], bytes] = {}
        self._vectors: dict[UUID, dict[str, VectorDocument]] = {}
        self._graph_edges: dict[UUID, set[tuple[str, str]]] = {}
        self._queues: dict[UUID, list[str]] = {}

    def cache_put(self, context: TenantContext, key: str, value: str) -> None:
        self._cache[(context.tenant_id, key)] = value

    def cache_get(self, context: TenantContext, key: str) -> str | None:
        return self._cache.get((context.tenant_id, key))

    def object_put(self, context: TenantContext, key: str, value: bytes) -> None:
        self._objects[(context.tenant_id, key)] = value

    def object_get(self, context: TenantContext, key: str) -> bytes | None:
        return self._objects.get((context.tenant_id, key))

    def vector_add(self, context: TenantContext, document: VectorDocument) -> None:
        self._vectors.setdefault(context.tenant_id, {})[document.document_id] = document

    def vector_search(self, context: TenantContext, query: str) -> list[VectorDocument]:
        terms = frozenset(query.casefold().split())
        documents = self._vectors.get(context.tenant_id, {}).values()
        return sorted(
            documents,
            key=lambda item: len(terms.intersection(item.text.casefold().split())),
            reverse=True,
        )

    def graph_add_edge(self, context: TenantContext, source: str, target: str) -> None:
        self._graph_edges.setdefault(context.tenant_id, set()).add((source, target))

    def graph_edges(self, context: TenantContext) -> frozenset[tuple[str, str]]:
        return frozenset(self._graph_edges.get(context.tenant_id, set()))

    def enqueue(self, context: TenantContext, message: str) -> None:
        self._queues.setdefault(context.tenant_id, []).append(message)

    def dequeue(self, context: TenantContext) -> str | None:
        queue = self._queues.get(context.tenant_id, [])
        return queue.pop(0) if queue else None

    def delete_tenant(
        self,
        context: TenantContext,
        *,
        now: datetime,
        backup_retention: timedelta,
    ) -> DeletionReport:
        tenant_id = context.tenant_id
        cache_keys = [key for key in self._cache if key[0] == tenant_id]
        object_keys = [key for key in self._objects if key[0] == tenant_id]
        for key in cache_keys:
            del self._cache[key]
        for key in object_keys:
            del self._objects[key]
        vectors = len(self._vectors.pop(tenant_id, {}))
        edges = len(self._graph_edges.pop(tenant_id, set()))
        messages = len(self._queues.pop(tenant_id, []))
        removed = {
            "cache": len(cache_keys),
            "objects": len(object_keys),
            "vectors": vectors,
            "graph": edges,
            "queue": messages,
        }
        return DeletionReport(
            tenant_id=tenant_id,
            removed_by_store=removed,
            active_records_remaining=self.count_tenant_records(context),
            backups_expire_at=now + backup_retention,
        )

    def count_tenant_records(self, context: TenantContext) -> int:
        tenant_id = context.tenant_id
        return sum(
            (
                sum(1 for key in self._cache if key[0] == tenant_id),
                sum(1 for key in self._objects if key[0] == tenant_id),
                len(self._vectors.get(tenant_id, {})),
                len(self._graph_edges.get(tenant_id, set())),
                len(self._queues.get(tenant_id, [])),
            )
        )
