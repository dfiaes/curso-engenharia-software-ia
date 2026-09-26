"""M12-B07-L: executable bridge for M12-AT-030/031/032 (local slice, no network).

Proves the frozen B07 contracts: ``UsageEvent`` carries
``event_id/tenant_id/meter/quantity/occurred_at/source_id``; ``BillingProvider``
is the port with ``report_usage(event)`` and ``fetch_total(tenant_id, meter)``;
``FakeBillingProvider`` is the deterministic fake behind the port (deduplicating
by ``event_id``); ``UsageLedger`` with ``append(event)`` deduplicating by
``event_id``, ``total(tenant_id, meter)`` summing quantities, and
``unit_margin(tenant_id, meter, revenue, allocated_cost)`` as revenue minus
measured direct cost minus allocated cost; ``EntitlementEvent`` carries
``event_id/tenant_id/subscription_id/version/status``;
``EntitlementProjection`` with ``apply(event)`` converging duplicates and stale
versions by domain ``version`` and ``status(tenant_id, subscription_id)``;
``reconcile_usage(ledger, provider, tenant_id, meter)`` opening an issue on
divergence and closing (None) on convergence; ``verify_webhook`` rejecting bad
signatures and out-of-window timestamps locally before any mutation.

Limits (not executed here, later evidence owns them): ledger/projection
persistence in PostgreSQL, real concurrency across connections/processes,
Stripe test-mode adapter, periodic reconciliation job, invoice state, and
per-tenant margin dashboard. ``test_tenancy_postgres.py`` stays BLOCKED
without Docker; counts below are example variables.
"""

from __future__ import annotations

import hashlib
import hmac
import inspect
from datetime import UTC, datetime
from decimal import Decimal
from uuid import UUID, uuid4

import pytest

from m12_lab.billing import (
    BillingProvider,
    EntitlementEvent,
    EntitlementProjection,
    FakeBillingProvider,
    UsageEvent,
    UsageLedger,
    reconcile_usage,
    verify_webhook,
)


def usage_event(tenant_id: UUID, source_id: str, quantity: str) -> UsageEvent:
    return UsageEvent(
        tenant_id=tenant_id,
        meter="inference_tokens",
        quantity=Decimal(quantity),
        occurred_at=datetime(2026, 1, 1, tzinfo=UTC),
        source_id=source_id,
    )


def webhook_signature(payload: bytes, timestamp: int, secret: bytes) -> str:
    return hmac.new(secret, f"{timestamp}.".encode() + payload, hashlib.sha256).hexdigest()


def test_b07_frozen_contract_surface() -> None:
    assert set(UsageEvent.model_fields) == {
        "event_id",
        "tenant_id",
        "meter",
        "quantity",
        "occurred_at",
        "source_id",
    }
    assert set(EntitlementEvent.model_fields) == {
        "event_id",
        "tenant_id",
        "subscription_id",
        "version",
        "status",
    }
    assert list(inspect.signature(BillingProvider.report_usage).parameters) == ["self", "event"]
    assert list(inspect.signature(BillingProvider.fetch_total).parameters) == [
        "self",
        "tenant_id",
        "meter",
    ]
    assert list(inspect.signature(FakeBillingProvider.report_usage).parameters) == ["self", "event"]
    assert list(inspect.signature(UsageLedger.append).parameters) == ["self", "event"]
    assert list(inspect.signature(UsageLedger.total).parameters) == ["self", "tenant_id", "meter"]
    assert list(inspect.signature(UsageLedger.unit_margin).parameters) == [
        "self",
        "tenant_id",
        "meter",
        "revenue",
        "allocated_cost",
    ]
    assert list(inspect.signature(EntitlementProjection.apply).parameters) == ["self", "event"]
    assert list(inspect.signature(EntitlementProjection.status).parameters) == [
        "self",
        "tenant_id",
        "subscription_id",
    ]
    assert list(inspect.signature(reconcile_usage).parameters) == [
        "ledger",
        "provider",
        "tenant_id",
        "meter",
    ]
    assert list(inspect.signature(verify_webhook).parameters) == [
        "payload",
        "timestamp",
        "signature",
        "secret",
        "now",
    ]


def test_at030_webhook_rejects_bad_signature_and_replay_without_mutation() -> None:
    tenant_id = uuid4()
    ledger = UsageLedger()
    ledger.append(usage_event(tenant_id, "request-1", "2.00"))
    before = ledger.total(tenant_id, "inference_tokens")
    payload = b'{"event":"entitlement.updated"}'
    secret = b"bridge-secret"
    timestamp = 1_800_000_000
    signature = webhook_signature(payload, timestamp, secret)

    verify_webhook(payload, timestamp, signature, secret, now=timestamp + 30)
    with pytest.raises(ValueError, match="WEBHOOK_INVALID_SIGNATURE"):
        verify_webhook(payload, timestamp, "0" * 64, secret, now=timestamp + 30)
    with pytest.raises(ValueError, match="WEBHOOK_OUTSIDE_REPLAY_WINDOW"):
        verify_webhook(payload, timestamp, signature, secret, now=timestamp + 301)

    assert ledger.total(tenant_id, "inference_tokens") == before == Decimal("2.00")


def test_at031_duplicate_and_out_of_order_converge() -> None:
    tenant_id = uuid4()
    ledger = UsageLedger()
    later = usage_event(tenant_id, "request-2", "2.00")
    earlier = usage_event(tenant_id, "request-1", "1.25")

    assert ledger.append(later)
    assert ledger.append(earlier)
    assert not ledger.append(earlier)
    assert ledger.total(tenant_id, "inference_tokens") == Decimal("3.25")

    projection = EntitlementProjection()
    cancelled = EntitlementEvent(
        tenant_id=tenant_id,
        subscription_id="subscription-1",
        version=3,
        status="cancelled",
    )
    stale_active = EntitlementEvent(
        tenant_id=tenant_id,
        subscription_id="subscription-1",
        version=2,
        status="active",
    )

    assert projection.apply(cancelled)
    assert not projection.apply(cancelled)
    assert not projection.apply(stale_active)
    assert projection.status(tenant_id, "subscription-1") == "cancelled"


@pytest.mark.asyncio
async def test_at032_divergence_detected_then_closed_and_margin_from_ledger() -> None:
    tenant_id = uuid4()
    ledger = UsageLedger()
    provider = FakeBillingProvider()
    event = usage_event(tenant_id, "request-1", "2.00")
    ledger.append(event)

    issue = await reconcile_usage(ledger, provider, tenant_id, "inference_tokens")
    assert issue is not None
    assert issue.expected == Decimal("2.00")
    assert issue.observed == Decimal(0)
    assert issue.status == "open"

    await provider.report_usage(event)
    assert await reconcile_usage(ledger, provider, tenant_id, "inference_tokens") is None
    assert ledger.unit_margin(
        tenant_id,
        "inference_tokens",
        revenue=Decimal("10.00"),
        allocated_cost=Decimal("3.00"),
    ) == Decimal("5.00")
