"""Pipeline com ownership, concorrência estruturada e backpressure observável."""

from __future__ import annotations

import asyncio
import contextvars
from collections.abc import Awaitable, Callable, Iterable
from dataclasses import dataclass


@dataclass(slots=True)
class PipelineMetrics:
    produced: int = 0
    processed: int = 0
    producer_waits: int = 0
    peak_queue_size: int = 0
    cleanup_count: int = 0


@dataclass(frozen=True, slots=True)
class PipelineResult[R]:
    values: tuple[R, ...]
    metrics: PipelineMetrics


async def run_bounded[T, R](
    items: Iterable[T],
    worker: Callable[[T], Awaitable[R]],
    *,
    concurrency: int = 4,
    queue_size: int = 8,
) -> PipelineResult[R]:
    """Processa itens com fila bounded; qualquer falha cancela os siblings do TaskGroup."""

    if concurrency < 1:
        raise ValueError("concurrency deve ser >= 1")
    if queue_size < 1:
        raise ValueError("queue_size deve ser >= 1")

    queue: asyncio.Queue[tuple[int, T] | None] = asyncio.Queue(maxsize=queue_size)
    metrics = PipelineMetrics()
    results: dict[int, R] = {}

    async def produce() -> None:
        try:
            for index, item in enumerate(items):
                if queue.full():
                    metrics.producer_waits += 1
                await queue.put((index, item))
                metrics.produced += 1
                metrics.peak_queue_size = max(metrics.peak_queue_size, queue.qsize())
            for _ in range(concurrency):
                await queue.put(None)
        finally:
            metrics.cleanup_count += 1

    async def consume() -> None:
        try:
            while True:
                entry = await queue.get()
                try:
                    if entry is None:
                        return
                    index, item = entry
                    results[index] = await worker(item)
                    metrics.processed += 1
                finally:
                    queue.task_done()
        finally:
            metrics.cleanup_count += 1

    async with asyncio.TaskGroup() as group:
        group.create_task(produce(), name="producer")
        for worker_index in range(concurrency):
            group.create_task(consume(), name=f"worker-{worker_index}")

    ordered = tuple(results[index] for index in sorted(results))
    return PipelineResult(values=ordered, metrics=metrics)


async def with_timeout[R](operation: Callable[[], Awaitable[R]], *, timeout_seconds: float) -> R:
    """Timeout cancela a operação e aguarda seu cleanup antes de retornar."""

    async with asyncio.timeout(timeout_seconds):
        return await operation()


async def run_sync_limited[T, R](
    items: Iterable[T],
    operation: Callable[[T], R],
    *,
    concurrency: int,
) -> tuple[R, ...]:
    """Adapta I/O síncrono sem bloquear o loop, preservando ContextVars e limite."""

    if concurrency < 1:
        raise ValueError("concurrency deve ser >= 1")
    semaphore = asyncio.Semaphore(concurrency)

    async def invoke(item: T) -> R:
        async with semaphore:
            return await asyncio.to_thread(operation, item)

    tasks: list[asyncio.Task[R]] = []
    async with asyncio.TaskGroup() as group:
        for index, item in enumerate(items):
            context = contextvars.copy_context()
            tasks.append(
                group.create_task(invoke(item), name=f"sync-adapter-{index}", context=context)
            )
    return tuple(task.result() for task in tasks)
