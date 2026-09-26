"""Incremento do contador de acessos (lote B03).

Duas formas de somar 1, com garantias distintas sob concorrência em
READ COMMITTED:

- ``increment_hits_naive``: lê, soma em Python, grava. Duas transações
  concorrentes leem o mesmo valor e uma sobrescreve a outra — update
  perdido sem nenhum erro (AT-010, lado da falha);
- ``increment_hits_atomic``: um único UPDATE que soma no banco. A
  operação é atômica: nenhum intercalamento perde increments (AT-010,
  lado do conserto).
"""

from __future__ import annotations

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from link_shortener.models import Link


async def increment_hits_naive(session: AsyncSession, slug: str) -> int:
    """Lê-soma-grava em Python. Correto sozinho; perde sob concorrência."""
    result = await session.execute(select(Link).where(Link.slug == slug))
    link = result.scalar_one()
    link.hits += 1
    await session.flush()
    return link.hits


async def increment_hits_atomic(session: AsyncSession, slug: str) -> None:
    """Soma no banco num único UPDATE. Atômico por construção."""
    await session.execute(update(Link).where(Link.slug == slug).values(hits=Link.hits + 1))


async def read_hits(session: AsyncSession, slug: str) -> int:
    """Lê o total atual do contador."""
    result = await session.execute(select(Link.hits).where(Link.slug == slug))
    return result.scalar_one()
