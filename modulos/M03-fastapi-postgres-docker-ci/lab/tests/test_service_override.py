"""Override de infraestrutura sem mudar a regra (AT-015).

Dois níveis, ambos executáveis sem Docker:

- service: o mesmo ``create_link``/``get_link`` roda contra o repositório
  SQLAlchemy (SQLite local) e contra um fake em memória — mesmos
  resultados, incluindo conflito e ausência;
- HTTP: o app real atende via ``dependency_overrides`` com a sessão de
  outro banco, sem startup alternativo (cliente ASGI, sem porta).
"""

from __future__ import annotations

from collections.abc import AsyncIterator
from pathlib import Path

import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from link_shortener.api.app import create_app
from link_shortener.api.deps import get_request_session
from link_shortener.db import create_engine, session_factory
from link_shortener.domain import DomainError, LinkCreate, LinkNotFoundError, SlugConflictError
from link_shortener.models import Base
from link_shortener.repositories.link_repository import LinkRepository, SqlAlchemyLinkRepository
from link_shortener.services import link_service


class FakeLinkRepository:
    """Fake em memória com o mesmo contrato do repositório real."""

    def __init__(self) -> None:
        self._store: dict[str, LinkCreate] = {}

    async def get(self, slug: str) -> LinkCreate | None:
        return self._store.get(slug)

    async def add(self, link: LinkCreate) -> LinkCreate:
        if link.slug in self._store:
            raise SlugConflictError(f"slug já existe: {link.slug!r}")
        self._store[link.slug] = link
        return link


@pytest.fixture
async def factory(tmp_path: Path) -> AsyncIterator[async_sessionmaker[AsyncSession]]:
    url = f"sqlite+aiosqlite:///{tmp_path}/b04.db"
    engine = create_engine(url)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    try:
        yield session_factory(engine)
    finally:
        await engine.dispose()


async def _behaviors(repo: LinkRepository) -> None:
    link = await link_service.create_link(repo, "demo-1", "https://exemplo.com/1")
    assert link.slug == "demo-1"
    assert await link_service.get_link(repo, "demo-1") == link
    with pytest.raises(SlugConflictError):
        await link_service.create_link(repo, "demo-1", "https://exemplo.com/outra")
    with pytest.raises(LinkNotFoundError):
        await link_service.get_link(repo, "ausente")
    with pytest.raises(DomainError):
        await link_service.create_link(repo, "demo-2", "ftp://invalida")


async def test_service_com_repositorio_real(factory: async_sessionmaker[AsyncSession]) -> None:
    async with factory() as session:
        await _behaviors(SqlAlchemyLinkRepository(session))


async def test_service_com_fake() -> None:
    await _behaviors(FakeLinkRepository())


async def test_http_com_override_de_dependencia(tmp_path: Path) -> None:
    url_main = f"sqlite+aiosqlite:///{tmp_path}/main.db"
    url_other = f"sqlite+aiosqlite:///{tmp_path}/other.db"
    engine_main = create_engine(url_main)
    engine_other = create_engine(url_other)
    for engine in (engine_main, engine_other):
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
    app = create_app(session_factory(engine_main))
    other_factory = session_factory(engine_other)

    async def override_session() -> AsyncIterator[AsyncSession]:
        async with other_factory() as session:
            yield session
            await session.commit()

    app.dependency_overrides[get_request_session] = override_session
    try:
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            created = await client.post(
                "/links", json={"slug": "demo-9", "url": "https://exemplo.com/9"}
            )
            assert created.status_code == 201, created.text
            assert created.json() == {"slug": "demo-9", "url": "https://exemplo.com/9"}
            conflict = await client.post(
                "/links", json={"slug": "demo-9", "url": "https://exemplo.com/9"}
            )
            assert conflict.status_code == 409
            assert conflict.json()["status"] == 409
            missing = await client.get("/links/ausente")
            assert missing.status_code == 404
            invalid = await client.post("/links", json={"slug": "demo-10", "url": "ftp://x"})
            assert invalid.status_code == 422
        # A escrita foi parar no banco do override, não no original.
        async with session_factory(engine_main)() as session:
            assert await SqlAlchemyLinkRepository(session).get("demo-9") is None
        async with other_factory() as session:
            assert await SqlAlchemyLinkRepository(session).get("demo-9") is not None
    finally:
        await engine_main.dispose()
        await engine_other.dispose()
        app.dependency_overrides.clear()
