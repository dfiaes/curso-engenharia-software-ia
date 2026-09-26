"""M12-B06-L: executable bridge for M12-AT-040/041 (local slice, no network).

Proves the frozen B06 contracts: ``LimitExceeded`` is the limit-denial error;
``QuotaPolicy(limit, window)`` with ``consume(tenant_id, *, now)`` keeps a
sliding window per tenant on a controlled clock, returns the remainder as an
integer, denies with ``QUOTA_EXCEEDED`` past the ceiling, isolates tenants,
and resets after the window; ``Reservation(maximum, committed)`` is the
budget row; ``BudgetLedger(limit)`` with ``reserve(key, maximum)`` denies
with ``BUDGET_EXCEEDED`` when confirmed spend plus open exposure plus the new
maximum exceeds the ceiling, ``commit(key, actual)`` denies with
``ACTUAL_COST_EXCEEDS_RESERVATION`` when actual exceeds the reservation,
``release(key)`` frees a reservation at no cost, and ``spent`` sums the
confirmed amounts.

Limits (not executed here, later evidence owns them): distributed
request/token/concurrency limits across processes, per-call and per-flow
token budgets in the adapter, circuit breaker, deadline and retry budget in
the Capstone, plus cancellation with provider-measured usage and ledger
reconciliation. ``test_tenancy_postgres.py`` stays BLOCKED without Docker;
counts below are example variables.
"""

from __future__ import annotations

import inspect
from datetime import UTC, datetime, timedelta
from decimal import Decimal
from uuid import uuid4

import pytest

from m12_lab.reliability import BudgetLedger, LimitExceeded, QuotaPolicy, Reservation


def test_b06_frozen_contract_surface() -> None:
    assert issubclass(LimitExceeded, RuntimeError)
    assert list(inspect.signature(QuotaPolicy.__init__).parameters) == ["self", "limit", "window"]
    assert list(inspect.signature(QuotaPolicy.consume).parameters) == ["self", "tenant_id", "now"]
    assert (
        inspect.signature(QuotaPolicy.consume).parameters["now"].kind
        is inspect.Parameter.KEYWORD_ONLY
    )
    assert list(inspect.signature(Reservation).parameters) == ["maximum", "committed"]
    assert list(inspect.signature(BudgetLedger.__init__).parameters) == ["self", "limit"]
    assert list(inspect.signature(BudgetLedger.reserve).parameters) == ["self", "key", "maximum"]
    assert list(inspect.signature(BudgetLedger.commit).parameters) == ["self", "key", "actual"]
    assert list(inspect.signature(BudgetLedger.release).parameters) == ["self", "key"]
    assert isinstance(inspect.getattr_static(BudgetLedger, "spent"), property)
    assert Reservation(maximum=Decimal("3.00")).committed is None


def test_at040_burst_denies_at_ceiling_isolated_and_windowed() -> None:
    first_tenant = uuid4()
    second_tenant = uuid4()
    now = datetime(2026, 1, 1, tzinfo=UTC)
    quota = QuotaPolicy(limit=2, window=timedelta(minutes=1))

    assert quota.consume(first_tenant, now=now) == 1
    assert quota.consume(first_tenant, now=now) == 0
    assert quota.consume(second_tenant, now=now) == 1
    with pytest.raises(LimitExceeded, match="QUOTA_EXCEEDED"):
        quota.consume(first_tenant, now=now)
    assert quota.consume(first_tenant, now=now + timedelta(minutes=1)) == 1


def test_at041_reserve_commit_release_close_consistently() -> None:
    ledger = BudgetLedger(Decimal("10.00"))

    ledger.reserve("operation-1", Decimal("7.00"))
    with pytest.raises(LimitExceeded, match="BUDGET_EXCEEDED"):
        ledger.reserve("operation-2", Decimal("4.00"))
    ledger.commit("operation-1", Decimal("2.50"))
    ledger.reserve("operation-2", Decimal("7.50"))

    assert ledger.spent == Decimal("2.50")


def test_at041_actual_above_reservation_and_cancelled_release() -> None:
    ledger = BudgetLedger(Decimal("10.00"))
    ledger.reserve("operation", Decimal("3.00"))

    with pytest.raises(LimitExceeded, match="ACTUAL_COST_EXCEEDS_RESERVATION"):
        ledger.commit("operation", Decimal("3.01"))
    ledger.release("cancelled")

    assert ledger.spent == Decimal("0")
