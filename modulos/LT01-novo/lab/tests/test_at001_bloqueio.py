"""Oraculo LT01-AT-001: time.sleep no event loop — degradacao reproduzida e corrigida.

Numeros: exemplo variavel (medicao local). Amostra fixa: duracao 0,2 s,
n = 2 tarefas; margens 2x contra flake. Sem rede, sem subprocesso, qualquer plataforma.
"""

from __future__ import annotations

import asyncio
import time

import bloqueio_event_loop as bel

DURACAO = 0.2


def test_tarefa_cooperativa_retorna_mensagem() -> None:
    assert asyncio.run(bel.tarefa_cooperativa(0.0, "x")) == "x: cedeu o loop por 0.0s"


def test_etapa_bloqueante_retorna_mensagem() -> None:
    assert bel.etapa_bloqueante(0.0) == "etapa sincrona de 0.0s concluida"


def test_cooperativo_conclui_em_pouco_mais_que_uma_duracao() -> None:
    inicio = time.monotonic()
    resultado = asyncio.run(bel.cenario_cooperativo(DURACAO))
    relogio = time.monotonic() - inicio
    assert resultado["tarefas"] == 2.0
    assert resultado["relógio_s"] < 2.0 * DURACAO
    assert relogio < 2.0 * DURACAO


def test_bloqueio_atrasa_a_tarefa_inocente_e_correcao_remove() -> None:
    cooperativo = asyncio.run(bel.cenario_cooperativo(DURACAO))
    com_bloqueio = asyncio.run(bel.cenario_com_bloqueio(DURACAO))
    assert com_bloqueio["tarefas"] == 2.0
    # A etapa bloqueante segura o loop: o relogio cobre a duracao cheia.
    assert com_bloqueio["relógio_s"] >= DURACAO
    # Correcao (cenario cooperativo) remove a degradacao.
    assert com_bloqueio["relógio_s"] >= cooperativo["relógio_s"]
