"""Bloqueio do event loop: time.sleep contra await.

Referencia executavel do Bloco 1.
Implementacao verbatim na folha B01-L. So STDLIB (asyncio, time).
Roda em qualquer plataforma; a coleta de zombies e POSIX e mora em coleta_zumbis.py.
"""

from __future__ import annotations

import asyncio
import time


async def tarefa_cooperativa(duracao: float, nome: str) -> str:
    """Cede o loop durante a espera; libera as demais tarefas."""
    await asyncio.sleep(duracao)
    return f"{nome}: cedeu o loop por {duracao}s"


def etapa_bloqueante(duracao: float) -> str:
    """Pausa a thread inteira; o loop fica parado junto."""
    time.sleep(duracao)
    return f"etapa sincrona de {duracao}s concluida"


async def cenario_cooperativo(duracao: float = 1.0) -> dict[str, float]:
    """Duas tarefas cooperativas; mede o tempo de relogio do conjunto."""
    inicio = time.monotonic()
    await asyncio.gather(
        tarefa_cooperativa(duracao, "a"),
        tarefa_cooperativa(duracao, "b"),
    )
    return {"tarefas": 2.0, "relógio_s": time.monotonic() - inicio}


async def cenario_com_bloqueio(duracao: float = 1.0) -> dict[str, float]:
    """Etapa bloqueante no meio do loop; mede o atraso da tarefa inocente."""
    inicio = time.monotonic()
    tarefa = asyncio.create_task(tarefa_cooperativa(0.0, "inocente"))
    etapa_bloqueante(duracao)  # o loop fica parado aqui; a inocente espera
    await tarefa
    return {"tarefas": 2.0, "relógio_s": time.monotonic() - inicio}
