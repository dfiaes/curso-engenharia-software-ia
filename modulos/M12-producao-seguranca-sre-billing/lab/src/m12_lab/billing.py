"""Billing domain ports, deterministic adapter, and convergent usage ledger."""

from __future__ import annotations

import hashlib
import hmac
from datetime import datetime
from decimal import Decimal
from typing import Literal, Protocol
from uuid import UUID, uuid4

from pydantic import Field

from m12_lab.models import StrictModel


class UsageEvent(StrictModel):
    event_id: UUID = Field(default_factory=uuid4)
    tenant_id: UUID
    meter: str
    quantity: Decimal = Field(gt=0)
    occurred_at: datetime
    source_id: str = Field(min_length=1)


class BillingProvider(Protocol):
    async def report_usage(self, event: UsageEvent) -> str: ...

    async def fetch_total(self, tenant_id: UUID, meter: str) -> Decimal: ...


class FakeBillingProvider:
    def __init__(self) -> None:
        self._events: dict[UUID, UsageEvent] = {}

    async def report_usage(self, event: UsageEvent) -> str:
        self._events.setdefault(event.event_id, event)
        return str(event.event_id)

    async def fetch_total(self, tenant_id: UUID, meter: str) -> Decimal:
        return sum(
            (
                item.quantity
                for item in self._events.values()
                if item.tenant_id == tenant_id and item.meter == meter
            ),
            start=Decimal(0),
        )


class UsageLedger:
    def __init__(self) -> None:
        self._events: dict[UUID, UsageEvent] = {}

    def append(self, event: UsageEvent) -> bool:
        if event.event_id in self._events:
            return False
        self._events[event.event_id] = event
        return True

    def total(self, tenant_id: UUID, meter: str) -> Decimal:
        return sum(
            (
                item.quantity
                for item in self._events.values()
                if item.tenant_id == tenant_id and item.meter == meter
            ),
            start=Decimal(0),
        )

    def unit_margin(
        self, tenant_id: UUID, meter: str, revenue: Decimal, allocated_cost: Decimal
    ) -> Decimal:
        direct = self.total(tenant_id, meter)
        return revenue - direct - allocated_cost


class ReconciliationIssue(StrictModel):
    tenant_id: UUID
    meter: str
    expected: Decimal
    observed: Decimal
    status: Literal["open"] = "open"


class EntitlementEvent(StrictModel):
    event_id: UUID = Field(default_factory=uuid4)
    tenant_id: UUID
    subscription_id: str = Field(min_length=1)
    version: int = Field(ge=1)
    status: Literal["active", "grace", "suspended", "cancelled"]


class EntitlementProjection:
    """Converges duplicate and out-of-order provider events by domain version."""

    def __init__(self) -> None:
        self._event_ids: set[UUID] = set()
        self._states: dict[tuple[UUID, str], tuple[int, str]] = {}

    def apply(self, event: EntitlementEvent) -> bool:
        if event.event_id in self._event_ids:
            return False
        self._event_ids.add(event.event_id)
        identity = (event.tenant_id, event.subscription_id)
        current = self._states.get(identity)
        if current is not None and event.version <= current[0]:
            return False
        self._states[identity] = (event.version, event.status)
        return True

    def status(self, tenant_id: UUID, subscription_id: str) -> str | None:
        state = self._states.get((tenant_id, subscription_id))
        return state[1] if state is not None else None


async def reconcile_usage(
    ledger: UsageLedger,
    provider: BillingProvider,
    tenant_id: UUID,
    meter: str,
) -> ReconciliationIssue | None:
    expected = ledger.total(tenant_id, meter)
    observed = await provider.fetch_total(tenant_id, meter)
    if expected == observed:
        return None
    return ReconciliationIssue(
        tenant_id=tenant_id,
        meter=meter,
        expected=expected,
        observed=observed,
    )


def verify_webhook(payload: bytes, timestamp: int, signature: str, secret: bytes, now: int) -> None:
    if abs(now - timestamp) > 300:
        raise ValueError("WEBHOOK_OUTSIDE_REPLAY_WINDOW")
    signed = f"{timestamp}.".encode() + payload
    expected = hmac.new(secret, signed, hashlib.sha256).hexdigest()
    if not hmac.compare_digest(expected, signature):
        raise ValueError("WEBHOOK_INVALID_SIGNATURE")
