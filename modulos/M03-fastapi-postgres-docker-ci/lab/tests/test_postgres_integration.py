"""Suíte contra PostgreSQL real (AT-005/006/009/010/011/012/021/022).

Corpos genuínos, não placeholders: migration como setup, CRUD pela API,
isolamento por envelope, concorrência atômica e contencão JSONB. Sem
Docker Engine (e sem ``M03_PG_URL``), as fixtures de ``conftest.py``
pulam com motivo BLOCKED — o pulo registra o bloqueio e não aprova nada.
"""

from __future__ import annotations

import asyncio
import os
from collections.abc import AsyncIterator
from pathlib import Path

import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncEngine, AsyncSession, async_sessionmaker

from link_shortener.api.app import create_app
from link_shortener.api.deps import get_request_session
from link_shortener.counters import increment_hits_atomic
from link_shortener.db import session_factory
from link_shortener.repositories.link_repository import SqlAlchemyLinkRepository
from link_shortener.services import link_service

pytestmark = pytest.mark.postgres

LAB = Path(__file__).resolve().parent.parent


async def test_upgrade_downgrade_em_banco_limpo(pg_url: str) -> None:
    """AT-005: downgrade desfaz, upgrade refaz (ida e volta declaradas)."""
    from alembic import command
    from alembic.config import Config

    previous = os.environ.get("APP_DATABASE_URL")
    os.environ["APP_DATABASE_URL"] = pg_url
    try:
        cfg = Config(str(LAB / "alembic.ini"))
        cfg.set_main_option("script_location", str(LAB / "migrations"))
        command.downgrade(cfg, "-1")
        command.upgrade(cfg, "head")
    finally:
        if previous is None:
            os.environ.pop("APP_DATABASE_URL", None)
        else:
            os.environ["APP_DATABASE_URL"] = previous


async def test_crud_pela_api(pg_engine: AsyncEngine) -> None:
    """AT-021/022: criação, consulta, inválido, inexistente e conflito."""
    factory = session_factory(pg_engine)
    app = create_app(factory)

    async def override() -> AsyncIterator[AsyncSession]:
        async with factory() as session:
            yield session
            await session.commit()

    app.dependency_overrides[get_request_session] = override
    try:
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            created = await client.post(
                "/links", json={"slug": "pg-1", "url": "https://exemplo.com/1"}
            )
            assert created.status_code == 201
            assert (await client.get("/links/pg-1")).status_code == 200
            assert (await client.get("/links/ausente")).status_code == 404
            assert (
                await client.post("/links", json={"slug": "x", "url": "ftp://y"})
            ).status_code == 422
            assert (
                await client.post("/links", json={"slug": "pg-1", "url": "https://exemplo.com/1"})
            ).status_code == 409
    finally:
        app.dependency_overrides.clear()


async def _cria_e_conta_envelope(pg_engine: AsyncEngine) -> tuple[int, int]:
    async with pg_engine.connect() as conn:
        trans = await conn.begin()
        session = async_sessionmaker(bind=conn, expire_on_commit=False)()
        try:
            await link_service.create_link(
                SqlAlchemyLinkRepository(session), "envelope", "https://e.com"
            )
            result = await session.execute(text("select count(*) from links where slug='envelope'"))
            inside = int(result.scalar_one())
        finally:
            await session.close()
            await trans.rollback()
    async with session_factory(pg_engine)() as check:
        result = await check.execute(text("select count(*) from links where slug='envelope'"))
        outside = int(result.scalar_one())
    return inside, outside


async def test_isolamento_por_envelope_a(pg_engine: AsyncEngine) -> None:
    """AT-012: visível dentro, apagado fora — em qualquer ordem."""
    assert await _cria_e_conta_envelope(pg_engine) == (1, 0)


async def test_isolamento_por_envelope_b(pg_engine: AsyncEngine) -> None:
    """AT-012: repetição do mesmo slug prova independência de ordem."""
    assert await _cria_e_conta_envelope(pg_engine) == (1, 0)


async def test_concorrencia_atomica_no_postgres(pg_engine: AsyncEngine) -> None:
    """AT-010: 30 increments concorrentes totalizam exatamente 30."""
    factory = session_factory(pg_engine)
    async with factory() as session:
        await link_service.create_link(
            SqlAlchemyLinkRepository(session), "race-pg", "https://r.com"
        )
        await session.commit()

    async def one() -> None:
        async with factory() as session:
            await increment_hits_atomic(session, "race-pg")
            await session.commit()

    await asyncio.gather(*(one() for _ in range(30)))
    async with factory() as session:
        result = await session.execute(text("select hits from links where slug='race-pg'"))
        assert int(result.scalar_one()) == 30


async def test_jsonb_contencao_usa_indice(pg_engine: AsyncEngine) -> None:
    """AT-009/011: plano da contenção não é varredura sequencial."""
    factory = session_factory(pg_engine)
    async with factory() as session:
        await link_service.create_link(SqlAlchemyLinkRepository(session), "j-pg", "https://j.com")
        await session.execute(
            text("update links set meta='{\"campanha\":\"c9\"}' where slug='j-pg'")
        )
        await session.commit()
    async with factory() as session:
        plan = await session.execute(
            text('explain select * from links where meta @> \'{"campanha":"c9"}\'')
        )
        text_plan = "\n".join(str(row[0]) for row in plan.all())
        assert "Seq Scan" not in text_plan, text_plan
        found = await session.execute(
            text('select slug from links where meta @> \'{"campanha":"c9"}\'')
        )
        assert "j-pg" in [row[0] for row in found.all()]
