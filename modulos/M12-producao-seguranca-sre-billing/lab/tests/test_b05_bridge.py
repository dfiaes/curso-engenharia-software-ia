"""M12-B05-L: executable bridge for M12-AT-020/021/022/023 (local slice, no network).

Proves the frozen B05 contracts: ``ToolRequest`` carries ``request_id`` and
``intent_hash`` (tenant + tool + canonicalized arguments); ``IdempotencyConflict``
is the conflict/denial error; ``ExecutionState`` holds ``STARTED``/``SUCCEEDED``/
``UNKNOWN``; ``ExecutionRecord(intent_hash, state, result)`` is the ledger row;
``IdempotencyService().execute_once(tenant_id, key, request, effect)`` returns
the recorded response for same key + same intent with a single effect, denies
with ``IDEMPOTENCY_INTENT_MISMATCH`` on divergent intent, denies with
``IDEMPOTENCY_EXECUTION_IN_PROGRESS_OR_UNKNOWN`` on repeat over a started or
unknown state, and marks ``UNKNOWN`` on ambiguous failure;
``reconcile_unknown(tenant_id, key, request, lookup)`` confirms the provider
receipt without a new effect (or frees a safe retry on confirmed absence).
The migration holds the durable-ledger reference
(``idempotency_ledger`` with ``intent_hash``, five states, PK on
tenant + key).

Limits (not executed here, later evidence owns them): durable PostgreSQL
repository with unique constraint, concurrency across distinct connections and
processes, real crash matrix, key forwarding to the provider, and outbox.
``test_tenancy_postgres.py`` stays BLOCKED without Docker; counts below are
example variables.
"""

from __future__ import annotations

import asyncio
import inspect
from pathlib import Path
from uuid import UUID, uuid4

import pytest

from m12_lab.models import ToolRequest
from m12_lab.reliability import (
    ExecutionRecord,
    ExecutionState,
    IdempotencyConflict,
    IdempotencyService,
)

MIGRATION = Path(__file__).parents[1] / "migrations" / "001_security_ledgers.sql"


def _request(tenant_id: UUID, amount: int = 10) -> ToolRequest:
    return ToolRequest(
        tenant_id=tenant_id,
        tool_name="send_payment",
        arguments={"amount": amount, "currency": "BRL"},
    )


def test_b05_frozen_contract_surface() -> None:
    assert [s.value for s in ExecutionState] == ["started", "succeeded", "unknown"]
    assert list(inspect.signature(ExecutionRecord).parameters) == [
        "intent_hash",
        "state",
        "result",
    ]
    assert list(inspect.signature(IdempotencyService.execute_once).parameters) == [
        "self",
        "tenant_id",
        "key",
        "request",
        "effect",
    ]
    assert list(inspect.signature(IdempotencyService.reconcile_unknown).parameters) == [
        "self",
        "tenant_id",
        "key",
        "request",
        "lookup",
    ]
    assert issubclass(IdempotencyConflict, RuntimeError)
    operation = _request(uuid4())
    assert isinstance(operation.request_id, UUID)
    assert operation.intent_hash == _request(operation.tenant_id).intent_hash
    assert operation.intent_hash != _request(operation.tenant_id, amount=11).intent_hash


def test_b05_migration_holds_durable_ledger_reference() -> None:
    sql = MIGRATION.read_text(encoding="utf-8")
    assert "CREATE TABLE idempotency_ledger" in sql
    assert "intent_hash text NOT NULL" in sql
    assert "PRIMARY KEY (tenant_id, idempotency_key)" in sql
    for state in ("received", "started", "succeeded", "failed", "unknown"):
        assert f"'{state}'" in sql


@pytest.mark.asyncio
async def test_at020_same_key_same_intent_reuses_single_execution() -> None:
    tenant_id = uuid4()
    operation = _request(tenant_id)
    service: IdempotencyService[str] = IdempotencyService()
    calls = 0

    async def effect() -> str:
        nonlocal calls
        calls += 1
        return "provider-receipt-1"

    first = await service.execute_once(tenant_id, "key-020", operation, effect)
    second = await service.execute_once(tenant_id, "key-020", operation, effect)

    assert first == second == "provider-receipt-1"
    assert calls == 1


@pytest.mark.asyncio
async def test_at021_same_key_divergent_intent_conflicts_without_effect() -> None:
    tenant_id = uuid4()
    service: IdempotencyService[str] = IdempotencyService()
    calls = 0

    async def effect() -> str:
        nonlocal calls
        calls += 1
        return "ok"

    await service.execute_once(tenant_id, "key-021", _request(tenant_id), effect)
    with pytest.raises(IdempotencyConflict, match="IDEMPOTENCY_INTENT_MISMATCH"):
        await service.execute_once(tenant_id, "key-021", _request(tenant_id, 999), effect)
    assert calls == 1


@pytest.mark.asyncio
async def test_at022_concurrent_instances_produce_one_external_effect() -> None:
    tenant_id = uuid4()
    operation = _request(tenant_id)
    service: IdempotencyService[str] = IdempotencyService()
    calls = 0

    async def effect() -> str:
        nonlocal calls
        calls += 1
        await asyncio.sleep(0)
        return "provider-receipt-1"

    first, second = await asyncio.gather(
        service.execute_once(tenant_id, "key-022", operation, effect),
        service.execute_once(tenant_id, "key-022", operation, effect),
    )

    assert first == second == "provider-receipt-1"
    assert calls == 1


@pytest.mark.asyncio
async def test_at023_ambiguous_crash_reconciles_never_blind_retries() -> None:
    tenant_id = uuid4()
    operation = _request(tenant_id)
    service: IdempotencyService[str] = IdempotencyService()
    calls = 0
    receipt: str | None = None

    async def lost_after_effect() -> str:
        nonlocal calls, receipt
        calls += 1
        receipt = "provider-receipt-1"
        raise TimeoutError("response lost after effect")

    async def lookup() -> str | None:
        return receipt

    with pytest.raises(TimeoutError, match="response lost after effect"):
        await service.execute_once(tenant_id, "key-023", operation, lost_after_effect)
    with pytest.raises(IdempotencyConflict, match="IDEMPOTENCY_EXECUTION_IN_PROGRESS_OR_UNKNOWN"):
        await service.execute_once(tenant_id, "key-023", operation, lost_after_effect)

    assert await service.reconcile_unknown(tenant_id, "key-023", operation, lookup) == (
        "provider-receipt-1"
    )
    assert (
        await service.execute_once(tenant_id, "key-023", operation, lost_after_effect)
        == "provider-receipt-1"
    )
    assert calls == 1


@pytest.mark.asyncio
async def test_at023_confirmed_absence_frees_safe_retry() -> None:
    tenant_id = uuid4()
    operation = _request(tenant_id)
    service: IdempotencyService[str] = IdempotencyService()

    async def never_sent() -> str:
        raise ConnectionError("request was not sent")

    async def confirmed_absent() -> str | None:
        return None

    async def retry() -> str:
        return "receipt-after-safe-retry"

    with pytest.raises(ConnectionError, match="request was not sent"):
        await service.execute_once(tenant_id, "key-023b", operation, never_sent)
    assert (
        await service.reconcile_unknown(tenant_id, "key-023b", operation, confirmed_absent) is None
    )
    assert await service.execute_once(tenant_id, "key-023b", operation, retry) == (
        "receipt-after-safe-retry"
    )
