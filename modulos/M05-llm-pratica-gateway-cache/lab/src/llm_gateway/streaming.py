"""Streaming: montar a resposta por partes, sem ilusão (lote M05).

O stream entrega deltas de texto; o programa monta, detecta corte e
respeita backpressure. JSON parcial nunca é parseado: ou a montagem
fecha válida, ou o corte vira erro explícito.
"""

from __future__ import annotations

import asyncio
import json
from collections.abc import AsyncIterator
from dataclasses import dataclass


@dataclass(frozen=True, slots=True)
class SseChunk:
    text_delta: str
    done: bool = False


class StreamTruncated(RuntimeError):
    """O stream acabou no meio de um JSON: montar seria inventar fim."""


async def collect(stream: AsyncIterator[SseChunk]) -> str:
    """Monta o texto completo a partir dos deltas, em ordem."""
    parts: list[str] = []
    async for chunk in stream:
        parts.append(chunk.text_delta)
        if chunk.done:
            break
    return "".join(parts)


def parse_json_stream(text: str, finished: bool) -> object:
    """Parseia o texto montado; corte sem `done` vira `StreamTruncated`."""
    if not finished:
        raise StreamTruncated(f"stream interrompido com {len(text)} caracteres montados")
    try:
        return json.loads(text)
    except json.JSONDecodeError as exc:
        raise StreamTruncated(f"montagem não é JSON válido: {exc}") from exc


async def bounded_pipe(
    chunks: list[SseChunk], maxsize: int
) -> tuple[AsyncIterator[SseChunk], asyncio.Task[None]]:
    """Tubo com teto: o produtor trava quando o consumidor atrasa.

    Prova backpressure sem rede: `maxsize` limita quantos deltas ficam
    enfileirados; o total entregue é sempre integral.
    """
    queue: asyncio.Queue[SseChunk | None] = asyncio.Queue(maxsize=maxsize)

    async def produce() -> None:
        for chunk in chunks:
            await queue.put(chunk)
        await queue.put(None)

    async def consume() -> AsyncIterator[SseChunk]:
        while (item := await queue.get()) is not None:
            yield item

    task = asyncio.create_task(produce())
    return consume(), task
