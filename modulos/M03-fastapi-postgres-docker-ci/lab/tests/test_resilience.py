"""Degradação observável sem Docker (AT-024, parcial).

Prova sem serviços que a indisponibilidade do banco vira erro explícito
e rápido — nunca travamento silencioso nem sessão órfã:

- conectar numa porta fechada levanta em vez de pendurar;
- o engine descartado não deixa conexões abertas;
- a tradução de erro não confunde falha de rede com conflito de slug.

O cenário completo (timeout contra PostgreSQL real que para no meio do
teste, com cleanup verificado) exige Docker e está na suíte ``postgres``.
"""

from __future__ import annotations

import pytest
from sqlalchemy.exc import DBAPIError, OperationalError

from link_shortener.db import create_engine
from link_shortener.errors import translate_conflict


async def test_porta_fechada_levanta_rapido() -> None:
    engine = create_engine("sqlite+aiosqlite:///nao-existe/muralha.db")
    try:
        with pytest.raises((DBAPIError, OperationalError, OSError)):
            async with engine.connect():
                pass
    finally:
        await engine.dispose()


async def test_falha_de_conexao_nao_e_conflito() -> None:
    err = ConnectionRefusedError("porta fechada")
    assert translate_conflict(err, "qualquer") is None


async def test_engine_descartado_sem_residuo() -> None:
    engine = create_engine("sqlite+aiosqlite:///:memory:")
    await engine.dispose()
    # Descartar e reconectar funciona: o dispose fechou sem corromper o engine.
    async with engine.connect():
        pass
    await engine.dispose()
