"""Oraculo LT01-AT-002: SIGTERM sob carga — shutdown dentro do grace period.

Sem envio real de sinal ao pytest (flaky/global): testa a ordem contratada
(fechar entrada -> cancelar no prazo -> exit code) com tarefas reais, e o
registro de handlers via mock + smoke em loop real POSIX com restauracao.
Numeros: exemplo variavel (medicao local). Sem rede, sem subprocesso.
"""

from __future__ import annotations

import asyncio
import signal
import sys
import time
from typing import Any
from unittest.mock import MagicMock

import pytest

import shutdown_gracioso as sg


def test_codigos_de_saida_contratados() -> None:
    assert sg.CODIGO_SAIDA_LIMPA == 0
    assert sg.CODIGO_SAIDA_INTERROMPIDA == 130


def test_estado_inicial_aceita_trabalho() -> None:
    servidor = sg.Servidor()
    assert servidor.aceitando is True
    assert servidor.concluidas == 0
    assert servidor.canceladas == 0


def test_atender_conclui_trabalho_breve() -> None:
    async def _corpo() -> None:
        servidor = sg.Servidor()
        assert await servidor.atender(0.0) == "concluida"
        assert servidor.concluidas == 1
        assert servidor.canceladas == 0

    asyncio.run(_corpo())


def test_fechar_entrada_recusa_trabalho_novo() -> None:
    async def _corpo() -> None:
        servidor = sg.Servidor()
        servidor.fechar_entrada()
        assert servidor.aceitando is False
        with pytest.raises(RuntimeError, match="entrada fechada"):
            await servidor.atender(0.0)
        assert servidor.concluidas == 0

    asyncio.run(_corpo())


def test_desligar_cancela_em_curso_dentro_do_prazo() -> None:
    async def _trabalho(servidor: sg.Servidor) -> object:
        return await servidor.atender(30.0)

    async def _corpo() -> float:
        servidor = sg.Servidor()
        em_curso: set[asyncio.Task[object]] = {
            asyncio.create_task(_trabalho(servidor)),
            asyncio.create_task(_trabalho(servidor)),
        }
        try:
            # Deixa as tarefas entrarem no sleep de atender (trabalho em curso
            # real): sem isso, fechar_entrada as recusaria antes de iniciar.
            await asyncio.sleep(0.1)
            inicio = time.monotonic()
            codigo = await sg.desligar(servidor, em_curso, prazo=5.0)
            decorrido = time.monotonic() - inicio
        finally:
            # Cleanup provado: nenhum task possuido fica pendente.
            for tarefa in em_curso:
                if not tarefa.done():
                    tarefa.cancel()
            await asyncio.gather(*em_curso, return_exceptions=True)
        assert codigo == sg.CODIGO_SAIDA_LIMPA
        assert servidor.aceitando is False
        assert servidor.canceladas == 2
        assert servidor.concluidas == 0
        return decorrido

    decorrido = asyncio.run(_corpo())
    assert decorrido < 5.0


def test_instalar_handlers_registra_sigterm_e_sigint() -> None:
    loop: Any = MagicMock()
    chamadas: list[str] = []

    def _ao_sinal() -> None:
        chamadas.append("sinal")

    sg.instalar_handlers(loop, _ao_sinal)
    registrados = [chamada.args[0] for chamada in loop.add_signal_handler.call_args_list]
    assert registrados == [signal.SIGTERM, signal.SIGINT]
    assert all(chamada.args[1] is _ao_sinal for chamada in loop.add_signal_handler.call_args_list)


def test_instalar_handlers_em_loop_real() -> None:
    if sys.platform == "win32":
        pytest.skip("BLOCKED: add_signal_handler com semantica POSIX indisponivel no Windows")
    anterior_term = signal.getsignal(signal.SIGTERM)
    anterior_int = signal.getsignal(signal.SIGINT)
    loop = asyncio.new_event_loop()
    try:
        sg.instalar_handlers(loop, lambda: None)
    finally:
        loop.remove_signal_handler(signal.SIGTERM)
        loop.remove_signal_handler(signal.SIGINT)
        signal.signal(signal.SIGTERM, anterior_term)
        signal.signal(signal.SIGINT, anterior_int)
        loop.close()
