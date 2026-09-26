from __future__ import annotations

import asyncio

import pytest
from work_intake.application.bounded_batch import BatchResult, call_with_deadline, run_bounded_batch


def test_bounded_queue_never_exceeds_capacity_and_rejects_overload() -> None:
    gate = asyncio.Event()
    started = asyncio.Event()

    async def slow_worker(_: int) -> None:
        started.set()
        await gate.wait()

    async def scenario() -> BatchResult:
        batch = asyncio.create_task(
            run_bounded_batch([1, 2, 3], capacity=1, admission_timeout=0.01, worker=slow_worker)
        )
        await started.wait()
        await asyncio.sleep(0.02)
        gate.set()
        return await batch

    result = asyncio.run(scenario())
    assert result.max_queue_depth <= 1
    assert result.rejected >= 1
    assert result.cleanup_ran is True


def test_external_cancellation_runs_consumer_cleanup() -> None:
    started = asyncio.Event()
    stopped = asyncio.Event()

    async def blocking_worker(_: int) -> None:
        started.set()
        try:
            await asyncio.Event().wait()
        finally:
            stopped.set()

    async def scenario() -> None:
        batch = asyncio.create_task(
            run_bounded_batch([1], capacity=1, admission_timeout=1, worker=blocking_worker)
        )
        await started.wait()
        batch.cancel()
        with pytest.raises(asyncio.CancelledError):
            await batch

    asyncio.run(scenario())
    assert stopped.is_set()


def test_timeout_cancels_owned_operation_without_orphan() -> None:
    cleaned = asyncio.Event()

    async def operation() -> None:
        try:
            await asyncio.Event().wait()
        finally:
            cleaned.set()

    async def scenario() -> None:
        with pytest.raises(TimeoutError):
            await call_with_deadline(operation, seconds=0.01)

    asyncio.run(scenario())
    assert cleaned.is_set()
