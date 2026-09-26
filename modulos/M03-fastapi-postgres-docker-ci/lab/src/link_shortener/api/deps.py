"""Dependência de sessão do app (lote B04).

Lê a fábrica em ``app.state`` e delega à fronteira transacional de
``db``: sucesso confirma, exceção desfaz (bloco 2). Em teste, esta
dependência é substituída por ``dependency_overrides`` sem tocar na
regra (AT-015).
"""

from __future__ import annotations

from collections.abc import AsyncIterator
from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession

from link_shortener.db import get_session


async def get_request_session(request: Any) -> AsyncIterator[AsyncSession]:
    """Sessão de escopo de request construída da fábrica do app."""
    async for session in get_session(request.app.state.session_factory):
        yield session
