import asyncio
from collections.abc import Awaitable, Callable, Iterable


async def run_all(items: Iterable[int], worker: Callable[[int], Awaitable[int]]) -> list[int]:
    # Defeito: sem limite, ownership operacional ou política de falha explícita.
    return await asyncio.gather(*(worker(item) for item in items))
