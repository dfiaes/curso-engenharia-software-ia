"""Raiz de composição: o único lugar que conhece implementações (lote B04).

Todas as camadas dependem de contratos; este módulo escolhe os objetos.
Por isso ele é isento do guardrail de imports — a isenção é a exceção
documentada, não um precedente: qualquer outro módulo que importar
implementação de outra camada quebra a suíte.
"""

from __future__ import annotations

from sqlalchemy.ext.asyncio import AsyncSession

from link_shortener.repositories.link_repository import LinkRepository, SqlAlchemyLinkRepository


def build_repository(session: AsyncSession) -> LinkRepository:
    """Liga a sessão do request ao repositório SQLAlchemy."""
    return SqlAlchemyLinkRepository(session)
