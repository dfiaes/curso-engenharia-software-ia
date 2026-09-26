"""Modelo de persistência do encurtador (lote B02).

``Link`` é a entidade SQLAlchemy — o vocabulário do banco. Ela nunca
atravessa a fronteira HTTP diretamente: a tradução para contrato de
resposta pertence à camada de aplicação (bloco 4 do módulo).
"""

from __future__ import annotations

from datetime import datetime
from typing import Any

from sqlalchemy import DateTime, Index, String, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column
from sqlalchemy.types import JSON


class Base(DeclarativeBase):
    """Base declarativa de todos os modelos do laboratório."""


class Link(Base):
    """Link encurtado persistido."""

    __tablename__ = "links"

    id: Mapped[int] = mapped_column(primary_key=True)
    slug: Mapped[str] = mapped_column(String(16), unique=True, index=True)
    url: Mapped[str] = mapped_column(String(2048))
    hits: Mapped[int] = mapped_column(default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    # Cauda variável (bloco 3): JSONB no PostgreSQL, JSON genérico onde o
    # dialeto não oferece JSONB (ex.: SQLite dos testes de mecânica).
    # O que se consulta sempre é coluna; o schema do documento mora no
    # Pydantic da fronteira.
    meta: Mapped[dict[str, Any]] = mapped_column(
        JSONB().with_variant(JSON(), "sqlite"), nullable=False, default=dict
    )


Index("ix_links_created_at", Link.created_at)
