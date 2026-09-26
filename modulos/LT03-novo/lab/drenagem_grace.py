"""Drenagem e grace: fechar a entrada, concluir ou cancelar, sair no prazo.

Referencia executavel do Bloco 1.
Implementacao verbatim na folha B01-L. So STDLIB (asyncio, signal, time).
Ponte com o LT01-B01: mesmo shutdown cooperativo, com a drenagem a frente.
"""

from __future__ import annotations

import asyncio
import signal
import time
from collections.abc import Callable

CODIGO_SAIDA_LIMPA = 0


class ServicoDrenavel:
    """Guarda o estado da drenagem: entrada aberta ou fechada."""

    def __init__(self) -> None:
        self.aceitando = True
        self.concluidas = 0
        self.canceladas = 0

    def fechar_entrada(self) -> None:
        """Passo 1: nenhum trafego novo depois do sinal."""
        self.aceitando = False

    async def atender(self, duracao: float) -> str:
        """Trabalho cooperativo: responde a cancelamento."""
        if not self.aceitando:
            raise RuntimeError("entrada fechada: trafego novo recusado")
        try:
            await asyncio.sleep(duracao)
        except asyncio.CancelledError:
            self.canceladas += 1
            raise
        self.concluidas += 1
        return "concluida"


async def drenar(
    servico: ServicoDrenavel,
    em_curso: set[asyncio.Task[object]],
    prazo: float,
) -> dict[str, float]:
    """Fecha a entrada, aguarda ate o prazo, cancela o restante, publica a timeline."""
    inicio = time.monotonic()
    servico.fechar_entrada()
    _, pendentes = await asyncio.wait(em_curso, timeout=prazo)
    for tarefa in pendentes:
        tarefa.cancel()
    await asyncio.gather(*pendentes, return_exceptions=True)
    return {
        "concluidas": float(servico.concluidas),
        "canceladas": float(servico.canceladas),
        "relógio_s": time.monotonic() - inicio,
        "codigo_saida": float(CODIGO_SAIDA_LIMPA),
    }


def instalar_handlers(
    loop: asyncio.AbstractEventLoop,
    ao_sinal: Callable[[], None],
) -> None:
    """SIGTERM e SIGINT pedem drenagem; SIGKILL nao passa por aqui."""
    for numero in (signal.SIGTERM, signal.SIGINT):
        loop.add_signal_handler(numero, ao_sinal)
