"""Streaming: montar, detectar corte, respeitar teto (AT-009/010)."""

from __future__ import annotations

from collections.abc import AsyncIterator

import pytest

from llm_gateway.streaming import (
    SseChunk,
    StreamTruncated,
    bounded_pipe,
    collect,
    parse_json_stream,
)


async def _stream(text: str, size: int = 7, done: bool = True) -> AsyncIterator[SseChunk]:
    for i in range(0, len(text), size):
        yield SseChunk(text[i : i + size])
    if done:
        yield SseChunk("", done=True)


async def test_monta_em_ordem() -> None:
    assert await collect(_stream('{"a": 1}')) == '{"a": 1}'


async def test_json_completo_parseia() -> None:
    assert parse_json_stream('{"a": 1}', finished=True) == {"a": 1}


async def test_corte_vira_erro_explicito() -> None:
    parcial = await collect(_stream('{"a": 1', done=False))
    with pytest.raises(StreamTruncated, match="interrompido"):
        parse_json_stream(parcial, finished=False)


async def test_teto_sem_perda() -> None:
    chunks = [SseChunk(f"p{i} ") for i in range(50)] + [SseChunk("", done=True)]
    stream, task = await bounded_pipe(chunks, maxsize=3)
    texto = await collect(stream)
    await task
    assert texto == "".join(f"p{i} " for i in range(50))
