"""Fixtures PostgreSQL descartável (lote B06).

Contrato: um container por sessão, schema por migration, isolamento por
transação-envelope, API real via override. Sem Docker Engine (e sem
``M03_PG_URL`` apontando para um PostgreSQL existente), as fixtures
pulam com motivo BLOCKED — o pulo registra o bloqueio e não aprova nada.
"""

from __future__ import annotations

import os
import shutil
from collections.abc import AsyncIterator, Iterator
from pathlib import Path

import pytest
from sqlalchemy.ext.asyncio import AsyncEngine, AsyncSession, async_sessionmaker

LAB = Path(__file__).resolve().parent.parent

BLOCKED_REASON = (
    "BLOCKED: Docker/PostgreSQL indisponível — exige Docker Engine/Compose "
    "ou M03_PG_URL. Ver rastreabilidade do M03."
)


@pytest.fixture(scope="session")
def pg_url() -> Iterator[str]:
    """URL asyncpg do PostgreSQL descartável (ou pulo BLOCKED)."""
    direct = os.environ.get("M03_PG_URL", "")
    if direct:
        yield (
            direct
            if "+asyncpg" in direct
            else direct.replace("postgresql://", "postgresql+asyncpg://")
        )
        return
    if shutil.which("docker") is None:
        pytest.skip(BLOCKED_REASON)
    from testcontainers.postgres import PostgresContainer

    with PostgresContainer("postgres:16") as pg:
        url: str = pg.get_connection_url()
        yield url if "+asyncpg" in url else url.replace("postgresql://", "postgresql+asyncpg://")


@pytest.fixture(scope="session")
def pg_migrated(pg_url: str) -> Iterator[str]:
    """Aplica `alembic upgrade head` uma vez; o schema nasce de migration."""
    from alembic import command
    from alembic.config import Config

    previous = os.environ.get("APP_DATABASE_URL")
    os.environ["APP_DATABASE_URL"] = pg_url
    try:
        cfg = Config(str(LAB / "alembic.ini"))
        cfg.set_main_option("script_location", str(LAB / "migrations"))
        command.upgrade(cfg, "head")
    finally:
        if previous is None:
            os.environ.pop("APP_DATABASE_URL", None)
        else:
            os.environ["APP_DATABASE_URL"] = previous
    yield pg_url


@pytest.fixture(scope="session")
async def pg_engine(pg_migrated: str) -> AsyncIterator[AsyncEngine]:
    """Engine da sessão de testes, descartado no teardown (cleanup)."""
    from link_shortener.db import create_engine

    engine = create_engine(pg_migrated)
    try:
        yield engine
    finally:
        await engine.dispose()


@pytest.fixture
async def pg_session(pg_engine: AsyncEngine) -> AsyncIterator[AsyncSession]:
    """Transação-envelope por teste: tudo é desfeito no teardown."""
    async with pg_engine.connect() as conn:
        trans = await conn.begin()
        session = async_sessionmaker(bind=conn, expire_on_commit=False)()
        try:
            yield session
        finally:
            await session.close()
            await trans.rollback()
