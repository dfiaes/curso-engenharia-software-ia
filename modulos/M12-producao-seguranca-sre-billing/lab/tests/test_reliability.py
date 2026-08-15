import asyncio
from datetime import UTC, datetime, timedelta
from decimal import Decimal
from uuid import UUID, uuid4

import pytest

from m12_lab.models import ToolRequest
from m12_lab.reliability import (
    BudgetLedger,
    IdempotencyConflict,
    IdempotencyService,
    LimitExceeded,
    QuotaPolicy,
)


def tool_request(tenant_id: UUID, amount: int = 10) -> ToolRequest:
    return ToolRequest(
        tenant_id=tenant_id,
        tool_name="send_payment",
        arguments={"amount": amount},
    )


@pytest.mark.asyncio
async def test_concurrent_retries_execute_external_effect_once() -> None:
    tenant_id = uuid4()
    request = tool_request(tenant_id)
    service: IdempotencyService[str] = IdempotencyService()
    calls = 0

    async def effect() -> str:
        nonlocal calls
        calls += 1
        await asyncio.sleep(0)
        return "provider-operation-42"

    first, second = await asyncio.gather(
        service.execute_once(tenant_id, "same-key", request, effect),
        service.execute_once(tenant_id, "same-key", request, effect),
    )

    assert first == second == "provider-operation-42"
    assert calls == 1


@pytest.mark.asyncio
async def test_same_key_with_different_intent_is_rejected() -> None:
    tenant_id = uuid4()
    service: IdempotencyService[str] = IdempotencyService()

    async def effect() -> str:
        return "ok"

    await service.execute_once(tenant_id, "key", tool_request(tenant_id, 10), effect)
    with pytest.raises(IdempotencyConflict, match="IDEMPOTENCY_INTENT_MISMATCH"):
        await service.execute_once(tenant_id, "key", tool_request(tenant_id, 11), effect)


@pytest.mark.asyncio
async def test_ambiguous_failure_requires_reconciliation() -> None:
    tenant_id = uuid4()
    operation = tool_request(tenant_id)
    service: IdempotencyService[str] = IdempotencyService()

    async def uncertain_effect() -> str:
        raise TimeoutError("provider result unknown")

    with pytest.raises(TimeoutError):
        await service.execute_once(tenant_id, "key", operation, uncertain_effect)
    with pytest.raises(IdempotencyConflict, match="IDEMPOTENCY_EXECUTION_IN_PROGRESS_OR_UNKNOWN"):
        await service.execute_once(tenant_id, "key", operation, uncertain_effect)


@pytest.mark.asyncio
async def test_reconciliation_recovers_provider_receipt_without_duplicate_effect() -> None:
    tenant_id = uuid4()
    operation = tool_request(tenant_id)
    service: IdempotencyService[str] = IdempotencyService()
    external_receipt: str | None = None
    calls = 0

    async def effect_with_lost_response() -> str:
        nonlocal calls, external_receipt
        calls += 1
        external_receipt = "provider-receipt-42"
        raise TimeoutError("response lost after effect")

    async def lookup() -> str | None:
        return external_receipt

    with pytest.raises(TimeoutError):
        await service.execute_once(tenant_id, "key", operation, effect_with_lost_response)

    assert await service.reconcile_unknown(tenant_id, "key", operation, lookup) == (
        "provider-receipt-42"
    )
    assert (
        await service.execute_once(tenant_id, "key", operation, effect_with_lost_response)
        == "provider-receipt-42"
    )
    assert calls == 1


@pytest.mark.asyncio
async def test_confirmed_absent_effect_can_be_retried_after_reconciliation() -> None:
    tenant_id = uuid4()
    operation = tool_request(tenant_id)
    service: IdempotencyService[str] = IdempotencyService()

    async def failed_before_effect() -> str:
        raise ConnectionError("request was not sent")

    async def confirmed_absent() -> str | None:
        return None

    async def successful_retry() -> str:
        return "receipt-after-safe-retry"

    with pytest.raises(ConnectionError):
        await service.execute_once(tenant_id, "key", operation, failed_before_effect)
    assert await service.reconcile_unknown(tenant_id, "key", operation, confirmed_absent) is None
    assert await service.execute_once(tenant_id, "key", operation, successful_retry) == (
        "receipt-after-safe-retry"
    )


def test_quota_isolated_by_tenant_and_resets_after_window() -> None:
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


def test_budget_reserves_maximum_before_execution_and_commits_actual() -> None:
    ledger = BudgetLedger(Decimal("10.00"))

    ledger.reserve("operation-1", Decimal("7.00"))
    with pytest.raises(LimitExceeded, match="BUDGET_EXCEEDED"):
        ledger.reserve("operation-2", Decimal("4.00"))
    ledger.commit("operation-1", Decimal("2.50"))
    ledger.reserve("operation-2", Decimal("7.50"))

    assert ledger.spent == Decimal("2.50")


def test_budget_rejects_actual_cost_above_reservation() -> None:
    ledger = BudgetLedger(Decimal("10.00"))
    ledger.reserve("operation", Decimal("3.00"))

    with pytest.raises(LimitExceeded, match="ACTUAL_COST_EXCEEDS_RESERVATION"):
        ledger.commit("operation", Decimal("3.01"))
