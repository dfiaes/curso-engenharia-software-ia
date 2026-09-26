"""Engine, sessões e fronteira transacional (lote B02).

Regras que este módulo implementa, vindas do bloco 2:

- o engine (com seu pool) é criado uma vez por processo;
- cada request ganha uma ``AsyncSession`` nova via ``get_session``;
- a dependência confirma (``commit``) no sucesso e desfaz (``rollback``)
  quando a aplicação levanta exceção (AT-003);
- uma sessão nunca é compartilhada por tarefas concorrentes: o
  ``SessionGuard`` (via ``contextvars``) rejeita reentrada da mesma
  sessão em outra tarefa (AT-007).
"""

from __future__ import annotations

import asyncio
import contextvars
from collections.abc import AsyncIterator
from typing import Any

from sqlalchemy.ext.asyncio import (
    AsyncEngine,
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)

from link_shortener.models import Base

_current_session: contextvars.ContextVar[int] = contextvars.ContextVar("link_shortener_session")


class SessionSharedError(RuntimeError):
    """Uma sessão foi usada fora da tarefa que a abriu (AT-007)."""


class SessionGuard:
    """Prova que uma sessão pertence a uma única tarefa.

    O mecanismo real de isolamento é o banco + uma sessão por fluxo;
    este guardião torna a violação observável em teste: entrar com a
    mesma sessão em duas tarefas distintas levanta ``SessionSharedError``.
    """

    def __init__(self) -> None:
        self._owner: int | None = None
        self._token: contextvars.Token[int] | None = None

    def __enter__(self) -> SessionGuard:
        me = id(asyncio.current_task())
        if self._owner is not None and self._owner != me:
            raise SessionSharedError("sessão compartilhada entre tarefas concorrentes")
        self._owner = me
        self._token = _current_session.set(id(self))
        return self

    def __exit__(self, *exc: Any) -> None:
        if self._token is not None:
            _current_session.reset(self._token)
            self._token = None


def create_engine(database_url: str) -> AsyncEngine:
    """Cria o engine do processo (pool compartilhado, sessões não).

    Dimensionamento de pool é assunto de banco servidor; SQLite usa o
    pool estático do dialeto e rejeita o parâmetro.
    """
    if database_url.startswith("sqlite"):
        return create_async_engine(database_url, echo=False)
    return create_async_engine(database_url, pool_size=10, echo=False)


def session_factory(engine: AsyncEngine) -> async_sessionmaker[AsyncSession]:
    """Fábrica de sessões de escopo curto sobre o engine do processo."""
    return async_sessionmaker(engine, expire_on_commit=False)


async def run_in_session(factory: async_sessionmaker[AsyncSession], work: Any) -> Any:
    """Executa ``work(session)`` numa sessão nova com commit/rollback.

    É a forma testável da dependência com ``yield`` do bloco 2: sucesso
    confirma, exceção desfaz e re-levanta (AT-003).
    """
    guard = SessionGuard()
    async with factory() as session:
        with guard:
            try:
                result = await work(session)
            except Exception:
                await session.rollback()
                raise
            else:
                await session.commit()
                return result


async def get_session(
    factory: async_sessionmaker[AsyncSession],
) -> AsyncIterator[AsyncSession]:
    """Dependência FastAPI: escopo de request, commit/rollback na borda."""
    guard = SessionGuard()
    async with factory() as session:
        with guard:
            try:
                yield session
            except Exception:
                await session.rollback()
                raise
            else:
                await session.commit()


async def create_all(engine: AsyncEngine) -> None:
    """Cria o schema a partir dos modelos — USO RESTRITO A TESTES.

    Produção usa exclusivamente migrations Alembic (AT-008). Qualquer
    outro chamador deve passar por ``migrations/``.
    """
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
