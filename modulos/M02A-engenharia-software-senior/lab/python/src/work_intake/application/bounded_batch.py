"""Batch local com backpressure e ownership explícito de tarefas."""

from __future__ import annotations

import asyncio
from collections.abc import Awaitable, Callable, Sequence
from dataclasses import dataclass


@dataclass(frozen=True)
class BatchResult:
    completed: int
    rejected: int
    max_queue_depth: int
    cleanup_ran: bool


async def run_bounded_batch[T, R](
    items: Sequence[T],
    *,
    capacity: int,
    admission_timeout: float,
    worker: Callable[[T], Awaitable[R]],
) -> BatchResult:
    """Processa itens sem crescer a fila além de ``capacity``.

    Itens cuja admissão excede o timeout são rejeitados explicitamente. A task
    consumidora pertence ao TaskGroup e sempre sinaliza cleanup no ``finally``.
    """
    if capacity < 1:
        raise ValueError("capacity deve ser positiva")
    if admission_timeout <= 0:
        raise ValueError("admission_timeout deve ser positivo")

    queue: asyncio.Queue[T | None] = asyncio.Queue(maxsize=capacity)
    completed = 0
    rejected = 0
    max_queue_depth = 0
    cleanup_ran = False

    async def consume() -> None:
        nonlocal cleanup_ran, completed
        try:
            while True:
                item = await queue.get()
                try:
                    if item is None:
                        return
                    await worker(item)
                    completed += 1
                finally:
                    queue.task_done()
        finally:
            cleanup_ran = True

    async with asyncio.TaskGroup() as group:
        group.create_task(consume(), name="bounded-batch-consumer")
        for item in items:
            try:
                await asyncio.wait_for(queue.put(item), timeout=admission_timeout)
            except TimeoutError:
                rejected += 1
            else:
                max_queue_depth = max(max_queue_depth, queue.qsize())
        await queue.put(None)
        await queue.join()

    return BatchResult(
        completed=completed,
        rejected=rejected,
        max_queue_depth=max_queue_depth,
        cleanup_ran=cleanup_ran,
    )


async def call_with_deadline[R](operation: Callable[[], Awaitable[R]], *, seconds: float) -> R:
    """Mantém a task sob ownership e propaga timeout/cancelamento ao chamador."""
    async with asyncio.timeout(seconds):
        return await operation()
