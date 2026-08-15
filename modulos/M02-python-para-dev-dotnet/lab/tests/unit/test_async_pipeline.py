import asyncio
import contextvars
import threading
from collections.abc import Callable, Coroutine
from typing import Any

import pytest

from python_senior_lab.async_pipeline import run_bounded, run_sync_limited, with_timeout


def run[T](coroutine: Coroutine[Any, Any, T]) -> T:
    return asyncio.run(coroutine)


def test_bounded_pipeline_preserves_order_and_observes_pressure() -> None:
    async def scenario() -> None:
        release = asyncio.Event()

        async def worker(value: int) -> int:
            await release.wait()
            return value * 2

        task = asyncio.create_task(run_bounded(range(8), worker, concurrency=1, queue_size=2))
        await asyncio.sleep(0)
        await asyncio.sleep(0)
        release.set()
        result = await task

        assert result.values == tuple(value * 2 for value in range(8))
        assert result.metrics.peak_queue_size <= 2
        assert result.metrics.producer_waits >= 1
        assert result.metrics.cleanup_count == 2

    run(scenario())


def test_removing_backpressure_admits_all_work_before_release() -> None:
    async def scenario() -> None:
        bounded_release = asyncio.Event()
        bounded_started: set[int] = set()

        async def bounded_worker(value: int) -> int:
            bounded_started.add(value)
            await bounded_release.wait()
            return value

        bounded = asyncio.create_task(
            run_bounded(range(20), bounded_worker, concurrency=2, queue_size=2)
        )
        await asyncio.sleep(0)
        await asyncio.sleep(0)
        assert len(bounded_started) == 2
        bounded.cancel()
        with pytest.raises(asyncio.CancelledError):
            await bounded

        unbounded_release = asyncio.Event()
        unbounded_started: set[int] = set()

        async def unbounded_worker(value: int) -> int:
            unbounded_started.add(value)
            await unbounded_release.wait()
            return value

        unbounded = asyncio.gather(*(unbounded_worker(value) for value in range(20)))
        await asyncio.sleep(0)
        assert len(unbounded_started) == 20
        unbounded_release.set()
        assert await unbounded == list(range(20))

    run(scenario())


def test_taskgroup_failure_cancels_sibling_and_runs_cleanup() -> None:
    async def scenario() -> None:
        sibling_cleaned = asyncio.Event()

        async def worker(value: int) -> int:
            if value == 0:
                raise RuntimeError("boom")
            try:
                await asyncio.Event().wait()
            finally:
                sibling_cleaned.set()
            return value

        with pytest.raises(ExceptionGroup) as captured:
            await run_bounded([1, 0], worker, concurrency=2, queue_size=2)

        assert any(isinstance(exc, RuntimeError) for exc in captured.value.exceptions)
        assert sibling_cleaned.is_set()

    run(scenario())


def test_external_cancellation_is_propagated_after_cleanup() -> None:
    async def scenario() -> None:
        cleaned = asyncio.Event()

        async def worker(value: int) -> int:
            del value
            try:
                await asyncio.Event().wait()
            finally:
                cleaned.set()
            return 0

        task = asyncio.create_task(run_bounded([1], worker, concurrency=1, queue_size=1))
        await asyncio.sleep(0)
        task.cancel()
        with pytest.raises(asyncio.CancelledError):
            await task
        assert cleaned.is_set()

    run(scenario())


def test_timeout_does_not_leave_owned_task_pending() -> None:
    async def scenario() -> None:
        cleaned = asyncio.Event()

        async def operation() -> None:
            try:
                await asyncio.Event().wait()
            finally:
                cleaned.set()

        factory: Callable[[], Coroutine[Any, Any, None]] = operation
        with pytest.raises(TimeoutError):
            await with_timeout(factory, timeout_seconds=0.001)
        assert cleaned.is_set()
        current = asyncio.current_task()
        pending = [task for task in asyncio.all_tasks() if task is not current and not task.done()]
        assert pending == []

    run(scenario())


def test_task_without_structured_owner_is_visible_as_pending() -> None:
    async def scenario() -> None:
        release = asyncio.Event()

        async def unowned_work() -> None:
            await release.wait()

        task = asyncio.create_task(unowned_work(), name="unowned-demo")
        await asyncio.sleep(0)
        current = asyncio.current_task()
        pending_names = {
            candidate.get_name()
            for candidate in asyncio.all_tasks()
            if candidate is not current and not candidate.done()
        }
        assert "unowned-demo" in pending_names
        task.cancel()
        with pytest.raises(asyncio.CancelledError):
            await task

    run(scenario())


def test_sync_adapter_preserves_context_and_limits_threads() -> None:
    correlation_id = contextvars.ContextVar("correlation_id", default="missing")

    async def scenario() -> None:
        active = 0
        peak = 0
        lock = threading.Lock()

        def blocking(value: int) -> tuple[int, str]:
            nonlocal active, peak
            with lock:
                active += 1
                peak = max(peak, active)
            try:
                return value * 2, correlation_id.get()
            finally:
                with lock:
                    active -= 1

        token = correlation_id.set("run-42")
        try:
            values = await run_sync_limited(range(8), blocking, concurrency=2)
        finally:
            correlation_id.reset(token)

        assert values == tuple((value * 2, "run-42") for value in range(8))
        assert peak <= 2

    run(scenario())
