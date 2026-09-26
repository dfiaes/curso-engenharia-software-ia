"""Repositório de links: protocolo e implementação SQLAlchemy (lote B04).

O ``LinkRepository`` é um ``Protocol`` — o contrato que o service usa.
A implementação SQLAlchemy traduz persistência; um fake em memória com
o mesmo comportamento serve aos testes sem banco (AT-015). Nenhuma
decisão de aplicação mora aqui: validar e mapear erro de domínio é
trabalho do service e de ``errors``.
"""

from __future__ import annotations

from typing import Protocol

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from link_shortener.domain import LinkCreate
from link_shortener.errors import translate_conflict
from link_shortener.models import Link


class LinkRepository(Protocol):
    """Contrato de persistência consumido pelo service."""

    async def get(self, slug: str) -> LinkCreate | None:
        """Devolve o link ou ``None`` quando o slug não existe."""
        ...

    async def add(self, link: LinkCreate) -> LinkCreate:
        """Persiste e descarrega (``flush``); conflito vira ``SlugConflictError``."""
        ...


class SqlAlchemyLinkRepository:
    """Implementação sobre ``AsyncSession`` (transação gerida pela borda)."""

    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def get(self, slug: str) -> LinkCreate | None:
        result = await self._session.execute(select(Link).where(Link.slug == slug))
        found = result.scalar_one_or_none()
        if found is None:
            return None
        return LinkCreate(slug=found.slug, url=found.url)

    async def add(self, link: LinkCreate) -> LinkCreate:
        self._session.add(Link(slug=link.slug, url=link.url, meta={}))
        try:
            await self._session.flush()
        except IntegrityError as exc:
            # O flush falhou: a unidade de trabalho está condenada.
            # Desfaz antes de traduzir para a sessão continuar utilizável.
            await self._session.rollback()
            conflict = translate_conflict(exc, link.slug)
            if conflict is not None:
                raise conflict from exc
            raise
        return link
