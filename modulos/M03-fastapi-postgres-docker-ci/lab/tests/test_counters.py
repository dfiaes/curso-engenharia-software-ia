"""Lost update: falha determinística e conserto concorrente (AT-010).

Limite honesto: sem PostgreSQL (Docker ausente), a corrida real com
dezenas de tarefas simultâneas está no teste ``postgres`` (BLOCKED).
Estes oráculos provam, com banco transacional local:

- o padrão ler-somar-gravar perde updates com intercalamento explícito
  e determinístico (duas leituras do mesmo valor, duas escritas -> +1);
- a versão atômica preserva o total exato sob tarefas concorrentes.
"""

from __future__ import annotations

from collections.abc import AsyncIterator
from pathlib import Path

import pytest
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from link_shortener.counters import increment_hits_atomic, increment_hits_naive, read_hits
from link_shortener.db import create_engine, session_factory
from link_shortener.models import Base, Link


@pytest.fixture
async def factory(tmp_path: Path) -> AsyncIterator[async_sessionmaker[AsyncSession]]:
    url = f"sqlite+aiosqlite:///{tmp_path}/b03.db"
    engine = create_engine(url)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    async with session_factory(engine)() as session:
        session.add(Link(slug="contado", url="https://exemplo.com/c", meta={"origem": "teste"}))
        await session.commit()
    try:
        yield session_factory(engine)
    finally:
        await engine.dispose()


async def test_ler_somar_gravar_perde_com_intercalamento(
    factory: async_sessionmaker[AsyncSession],
) -> None:
    async with factory() as s1, factory() as s2:
        r1 = await s1.execute(select(Link).where(Link.slug == "contado"))
        r2 = await s2.execute(select(Link).where(Link.slug == "contado"))
        link1 = r1.scalar_one()
        link2 = r2.scalar_one()
        assert link1.hits == link2.hits == 0  # ambas leram o mesmo valor
        link1.hits += 1
        await s1.commit()  # banco = 1
        link2.hits += 1  # 0 + 1: não viu o commit de s1
        await s2.commit()  # banco = 1 — um incremento perdido, sem erro
    async with factory() as session:
        assert await read_hits(session, "contado") == 1


async def test_naive_sequencial_confirma_o_padrao(
    factory: async_sessionmaker[AsyncSession],
) -> None:
    async with factory() as session:
        assert await increment_hits_naive(session, "contado") == 1
        await session.commit()
    async with factory() as session:
        assert await read_hits(session, "contado") == 1


async def test_atomico_preserva_total_sob_concorrencia(
    factory: async_sessionmaker[AsyncSession],
) -> None:
    import asyncio

    async def one() -> None:
        async with factory() as session:
            await increment_hits_atomic(session, "contado")
            await session.commit()

    await asyncio.gather(*(one() for _ in range(20)))
    async with factory() as session:
        assert await read_hits(session, "contado") == 20
