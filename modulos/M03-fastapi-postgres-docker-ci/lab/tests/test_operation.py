"""Operação local: saúde, correlação e degradação (AT-024/029/030).

Executável sem Docker, contra banco transacional local:

- `/health` responde 200 com banco acessível e 503 estruturado com banco
  inacessível — degradação com sinal, sem travar e sem vazar detalhe;
- toda resposta carrega `x-request-id` (preservado quando válido,
  substituído quando forjado);
- o fluxo final mostra criação, consulta, conflito e correlação juntos.
"""

from __future__ import annotations

from collections.abc import AsyncIterator
from pathlib import Path

from fastapi import FastAPI
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncEngine, AsyncSession, async_sessionmaker

from link_shortener.api.app import create_app
from link_shortener.api.deps import get_request_session
from link_shortener.db import create_engine, session_factory
from link_shortener.models import Base


async def _open_client(
    factory: async_sessionmaker[AsyncSession],
) -> tuple[AsyncClient, FastAPI]:
    app = create_app(factory)

    async def override() -> AsyncIterator[AsyncSession]:
        async with factory() as session:
            yield session
            await session.commit()

    app.dependency_overrides[get_request_session] = override
    client = AsyncClient(transport=ASGITransport(app=app), base_url="http://test")
    return client, app


async def _sqlite_factory(
    tmp_path: Path, name: str
) -> tuple[async_sessionmaker[AsyncSession], AsyncEngine]:
    url = f"sqlite+aiosqlite:///{tmp_path}/{name}.db"
    engine = create_engine(url)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    return session_factory(engine), engine


async def test_fluxo_final_com_correlacao(tmp_path: Path) -> None:
    factory, engine = await _sqlite_factory(tmp_path, "ops")
    client, app = await _open_client(factory)
    try:
        created = await client.post("/links", json={"slug": "op-1", "url": "https://o.com"})
        assert created.status_code == 201
        assert "x-request-id" in created.headers

        health = await client.get("/health")
        assert health.status_code == 200
        assert health.json() == {"status": "ok"}

        valid_id = "123e4567-e89b-12d3-a456-426614174000"
        echoed = await client.get("/links/op-1", headers={"x-request-id": valid_id})
        assert echoed.headers["x-request-id"] == valid_id

        forged = await client.get("/links/op-1", headers={"x-request-id": "lixo"})
        assert forged.headers["x-request-id"] != "lixo"

        conflict = await client.post("/links", json={"slug": "op-1", "url": "https://o.com"})
        assert conflict.status_code == 409
        assert "x-request-id" in conflict.headers
    finally:
        await client.aclose()
        app.dependency_overrides.clear()
        await engine.dispose()


async def test_health_degradado_sem_banco(tmp_path: Path) -> None:
    engine = create_engine("sqlite+aiosqlite:///nao-existe/muralha.db")
    factory = session_factory(engine)
    client, app = await _open_client(factory)
    try:
        health = await client.get("/health")
        assert health.status_code == 503
        body = health.json()
        assert body["status"] == 503 and body["title"] == "banco indisponível"
        assert "x-request-id" in health.headers
    finally:
        await client.aclose()
        app.dependency_overrides.clear()
        await engine.dispose()
