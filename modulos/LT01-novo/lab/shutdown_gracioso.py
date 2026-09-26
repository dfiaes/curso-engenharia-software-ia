"""Shutdown gracioso: fechar a entrada, cancelar, sair no prazo.

Referencia executavel do Bloco 1.
Implementacao verbatim na folha B01-L. So STDLIB (asyncio, signal).
Sinais com semantica POSIX; em Windows, SIGTERM nao tem o mesmo
significado — ver a nota de plataforma do bloco.
"""

from __future__ import annotations

import asyncio
import signal
from collections.abc import Callable

CODIGO_SAIDA_LIMPA = 0
CODIGO_SAIDA_INTERROMPIDA = 130


class Servidor:
    """Guarda o estado do shutdown: entrada aberta ou fechada."""

    def __init__(self) -> None:
        self.aceitando = True
        self.concluidas = 0
        self.canceladas = 0

    def fechar_entrada(self) -> None:
        """Passo 1: nenhum trabalho novo depois do sinal."""
        self.aceitando = False

    async def atender(self, duracao: float) -> str:
        """Trabalho cooperativo: responde a cancelamento."""
        if not self.aceitando:
            raise RuntimeError("entrada fechada: trabalho novo recusado")
        try:
            await asyncio.sleep(duracao)
        except asyncio.CancelledError:
            self.canceladas += 1
            raise
        self.concluidas += 1
        return "concluida"


async def desligar(
    servidor: Servidor,
    em_curso: set[asyncio.Task[object]],
    prazo: float,
) -> int:
    """Passos 2 e 3: cancela, aguarda ate o prazo, devolve o exit code."""
    servidor.fechar_entrada()
    for tarefa in em_curso:
        tarefa.cancel()
    decurso, pendentes = await asyncio.wait(em_curso, timeout=prazo)
    _ = (decurso, pendentes)
    return CODIGO_SAIDA_LIMPA


def instalar_handlers(
    loop: asyncio.AbstractEventLoop,
    ao_sinal: Callable[[], None],
) -> None:
    """SIGTERM e SIGINT pedem shutdown; SIGKILL nao passa por aqui."""
    for numero in (signal.SIGTERM, signal.SIGINT):
        loop.add_signal_handler(numero, ao_sinal)
