"""Concurrency-safe reference fakes for idempotency, quotas, and budgets."""

from __future__ import annotations

import asyncio
from collections.abc import Awaitable, Callable
from dataclasses import dataclass
from datetime import datetime, timedelta
from decimal import Decimal
from enum import StrEnum
from uuid import UUID

from m12_lab.models import ToolRequest, utc_now


class IdempotencyConflict(RuntimeError):
    pass


class ExecutionState(StrEnum):
    STARTED = "started"
    SUCCEEDED = "succeeded"
    UNKNOWN = "unknown"


@dataclass(slots=True)
class ExecutionRecord[T]:
    intent_hash: str
    state: ExecutionState
    result: T | None = None


class IdempotencyService[T]:
    """Deterministic fake; PostgreSQL migration supplies the durable implementation contract."""

    def __init__(self) -> None:
        self._records: dict[tuple[UUID, str], ExecutionRecord[T]] = {}
        self._locks: dict[tuple[UUID, str], asyncio.Lock] = {}
        self._locks_guard = asyncio.Lock()

    async def _lock_for(self, identity: tuple[UUID, str]) -> asyncio.Lock:
        async with self._locks_guard:
            return self._locks.setdefault(identity, asyncio.Lock())

    async def execute_once(
        self,
        tenant_id: UUID,
        key: str,
        request: ToolRequest,
        effect: Callable[[], Awaitable[T]],
    ) -> T:
        identity = (tenant_id, key)
        key_lock = await self._lock_for(identity)
        async with key_lock:
            current = self._records.get(identity)
            if current is not None:
                if current.intent_hash != request.intent_hash:
                    raise IdempotencyConflict("IDEMPOTENCY_INTENT_MISMATCH")
                if current.state is ExecutionState.SUCCEEDED and current.result is not None:
                    return current.result
                raise IdempotencyConflict("IDEMPOTENCY_EXECUTION_IN_PROGRESS_OR_UNKNOWN")
            self._records[identity] = ExecutionRecord(request.intent_hash, ExecutionState.STARTED)
            try:
                result = await effect()
            except BaseException:
                self._records[identity].state = ExecutionState.UNKNOWN
                raise
            self._records[identity] = ExecutionRecord(
                request.intent_hash, ExecutionState.SUCCEEDED, result
            )
            return result

    async def reconcile_unknown(
        self,
        tenant_id: UUID,
        key: str,
        request: ToolRequest,
        lookup: Callable[[], Awaitable[T | None]],
    ) -> T | None:
        """Resolve UNKNOWN from provider evidence; None means confirmed absent."""
        identity = (tenant_id, key)
        key_lock = await self._lock_for(identity)
        async with key_lock:
            current = self._records.get(identity)
            if current is None or current.intent_hash != request.intent_hash:
                raise IdempotencyConflict("IDEMPOTENCY_RECONCILIATION_MISMATCH")
            if current.state is not ExecutionState.UNKNOWN:
                raise IdempotencyConflict("IDEMPOTENCY_NOT_UNKNOWN")
            result = await lookup()
            if result is None:
                del self._records[identity]
                return None
            self._records[identity] = ExecutionRecord(
                request.intent_hash, ExecutionState.SUCCEEDED, result
            )
            return result


class LimitExceeded(RuntimeError):
    pass


class QuotaPolicy:
    def __init__(self, limit: int, window: timedelta) -> None:
        self._limit = limit
        self._window = window
        self._events: dict[UUID, list[datetime]] = {}

    def consume(self, tenant_id: UUID, *, now: datetime | None = None) -> int:
        instant = now or utc_now()
        active = [x for x in self._events.get(tenant_id, []) if instant - x < self._window]
        if len(active) >= self._limit:
            raise LimitExceeded("QUOTA_EXCEEDED")
        active.append(instant)
        self._events[tenant_id] = active
        return self._limit - len(active)


@dataclass(slots=True)
class Reservation:
    maximum: Decimal
    committed: Decimal | None = None


class BudgetLedger:
    def __init__(self, limit: Decimal) -> None:
        self._limit = limit
        self._reservations: dict[str, Reservation] = {}

    def reserve(self, key: str, maximum: Decimal) -> None:
        exposure = sum(
            item.maximum for item in self._reservations.values() if item.committed is None
        )
        spent = sum(item.committed or Decimal(0) for item in self._reservations.values())
        if spent + exposure + maximum > self._limit:
            raise LimitExceeded("BUDGET_EXCEEDED")
        self._reservations[key] = Reservation(maximum=maximum)

    def commit(self, key: str, actual: Decimal) -> None:
        reservation = self._reservations[key]
        if actual > reservation.maximum:
            raise LimitExceeded("ACTUAL_COST_EXCEEDS_RESERVATION")
        reservation.committed = actual

    def release(self, key: str) -> None:
        self._reservations.pop(key, None)

    @property
    def spent(self) -> Decimal:
        return sum(
            (item.committed or Decimal(0) for item in self._reservations.values()),
            start=Decimal(0),
        )
