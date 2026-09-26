"""Service de links: a regra de aplicação (lote B04).

Recebe um ``LinkRepository`` (protocolo) e nunca uma sessão, um request
ou um modelo do banco. Por isso a mesma função roda contra PostgreSQL,
SQLite ou fake em memória sem mudar uma linha (AT-015):

- entrada inválida -> ``DomainError`` (422 na fronteira);
- slug duplicado -> ``SlugConflictError`` (409 na fronteira);
- slug ausente na leitura -> ``LinkNotFoundError`` (404 na fronteira).
"""

from __future__ import annotations

from link_shortener.domain import LinkCreate, LinkNotFoundError, make_link
from link_shortener.repositories.link_repository import LinkRepository


async def create_link(repo: LinkRepository, slug: str, url: str) -> LinkCreate:
    """Valida e persiste. A constraint decide a corrida; o service traduz."""
    return await repo.add(make_link(slug, url))


async def get_link(repo: LinkRepository, slug: str) -> LinkCreate:
    """Busca ou declara ausência com erro de domínio tipado."""
    found = await repo.get(slug)
    if found is None:
        raise LinkNotFoundError(f"slug não encontrado: {slug!r}")
    return found
