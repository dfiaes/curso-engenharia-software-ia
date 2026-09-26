"""Mecânica de sessão: commit/rollback e escopo por tarefa (AT-003/AT-007).

Estes testes executam de verdade contra um banco transacional local
(SQLite em arquivo temporário). Eles provam a MECÂNICA da fronteira —
sucesso confirma, exceção desfaz, sessões não se misturam — e NÃO
provam garantias do PostgreSQL (concorrência real, MVCC, DDL
transacional). A prova contra PostgreSQL real está no teste marcado
com ``postgres``, bloqueado sem Docker.
"""

from __future__ import annotations

import asyncio
from collections.abc import AsyncIterator
from pathlib import Path

import pytest
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from link_shortener import db as db_module
from link_shortener.db import SessionSharedError, create_engine, run_in_session, session_factory
from link_shortener.models import Base, Link


@pytest.fixture
async def factory(tmp_path: Path) -> AsyncIterator[async_sessionmaker[AsyncSession]]:
    url = f"sqlite+aiosqlite:///{tmp_path}/b02.db"
    engine = create_engine(url)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    try:
        yield session_factory(engine)
    finally:
        await engine.dispose()


async def _count(factory: async_sessionmaker[AsyncSession]) -> int:
    async with factory() as session:
        result = await session.execute(select(Link))
        return len(result.scalars().all())


async def test_sucesso_confirma(factory: async_sessionmaker[AsyncSession]) -> None:
    async def work(session: AsyncSession) -> str:
        session.add(Link(slug="demo-1", url="https://exemplo.com/1"))
        return "ok"

    assert await run_in_session(factory, work) == "ok"
    assert await _count(factory) == 1


async def test_excecao_desfaz_tudo(factory: async_sessionmaker[AsyncSession]) -> None:
    class Boom(Exception):
        pass

    async def work(session: AsyncSession) -> None:
        session.add(Link(slug="demo-2", url="https://exemplo.com/2"))
        raise Boom()

    with pytest.raises(Boom):
        await run_in_session(factory, work)
    assert await _count(factory) == 0  # AT-003: rollback, sem resíduo


async def test_sessoes_distintas_por_fluxo(factory: async_sessionmaker[AsyncSession]) -> None:
    async def work(session: AsyncSession, slug: str) -> None:
        session.add(Link(slug=slug, url=f"https://exemplo.com/{slug}"))

    await asyncio.gather(
        run_in_session(factory, lambda s: work(s, "tarefa-a")),
        run_in_session(factory, lambda s: work(s, "tarefa-b")),
    )
    assert await _count(factory) == 2


async def test_mesma_sessao_em_duas_tarefas_e_rejeitada(
    factory: async_sessionmaker[AsyncSession],
) -> None:
    guard = db_module.SessionGuard()
    barrier = asyncio.Event()

    async def intrusa() -> None:
        await barrier.wait()
        with guard:  # deve levantar: a sessão já pertence à tarefa principal
            pass

    attacker = asyncio.create_task(intrusa())
    try:
        with guard:
            barrier.set()
            with pytest.raises(SessionSharedError):
                await attacker
    finally:
        if not attacker.done():
            attacker.cancel()
