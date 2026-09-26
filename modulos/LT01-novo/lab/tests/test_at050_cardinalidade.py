"""Oraculo LT01-AT-050: serie problematica removida, diagnostico preservado.

Guarda com teto declarado: acima do teto recusa explicita com
contador, sem expulsar as existentes; remocao cirurgica derruba a
serie explosiva e o agregado bem rotulado (p95 por fase e desfecho,
contagem) sobrevive. Numeros: exemplo variavel (amostra seedada
20260707 com N = 500 latencias; explosao simulada com N = 200
series contra teto 16). So stdlib (threading via modulo); sem rede.
"""

from __future__ import annotations

import random
import threading

import pytest

import percentis_cardinalidade as pc

SEMENTE = 20260707
AMOSTRA = 500
TETO = 16
EXPLOSAO = 200


def _amostras() -> list[float]:
    rng = random.Random(SEMENTE)
    return [0.02 + rng.random() * 0.08 for _ in range(AMOSTRA)]


def test_percentil_faixas_fixas() -> None:
    dados = [float(i) for i in range(1, 101)]
    assert pc.percentil(dados, 0) == 1.0
    assert pc.percentil(dados, 50) == 50.0
    assert pc.percentil(dados, 95) == 95.0
    assert pc.percentil(dados, 100) == 100.0
    assert dados == [float(i) for i in range(1, 101)]


def test_percentil_veda_vazia_e_faixa() -> None:
    with pytest.raises(ValueError):
        pc.percentil([], 50)
    with pytest.raises(ValueError):
        pc.percentil([1.0], -1.0)
    with pytest.raises(ValueError):
        pc.percentil([1.0], 101.0)


def test_resumo_publica_contagem_p50_p95_maximo() -> None:
    resumido = pc.resumo(_amostras())
    assert resumido["contagem"] == float(AMOSTRA)
    assert 0.0 < resumido["p50"] < resumido["p95"] < resumido["maximo"]
    assert pc.resumo(_amostras()) == resumido


def test_guarda_teto_recusa_sem_expulsar() -> None:
    guarda = pc.GuardaCardinalidade(3)
    assert guarda.registrar("http", {"rota": "/a"}) is True
    assert guarda.registrar("http", {"rota": "/b"}) is True
    assert guarda.registrar("http", {"rota": "/c"}) is True
    assert guarda.registrar("http", {"rota": "/d"}) is False
    assert guarda.contagem() == 3
    assert guarda.recusadas() == 1
    assert guarda.registrar("http", {"rota": "/a"}) is True
    assert guarda.contagem() == 3
    assert guarda.recusadas() == 1


def test_guarda_veda_teto_menor_que_um() -> None:
    with pytest.raises(ValueError):
        pc.GuardaCardinalidade(0)


def test_remocao_cirurgica_preserva_diagnostico() -> None:
    guarda = pc.GuardaCardinalidade(TETO)
    for i in range(EXPLOSAO):
        guarda.registrar("http", {"rota": f"/pedido/{i}"})
    assert guarda.contagem() == TETO
    assert guarda.recusadas() == EXPLOSAO - TETO
    guarda.remover("http", {"rota": "/pedido/0"})
    assert guarda.contagem() == TETO - 1
    assert guarda.recusadas() == EXPLOSAO - TETO
    assert guarda.registrar("http", {"rota": "/pedido/{id}"}) is True
    assert guarda.contagem() == TETO
    resumido = pc.resumo(_amostras())
    assert resumido["contagem"] == float(AMOSTRA)
    assert resumido["p95"] > resumido["p50"] > 0.0


def test_registro_concorrente_respeita_teto() -> None:
    guarda = pc.GuardaCardinalidade(TETO)
    fios = [
        threading.Thread(target=guarda.registrar, args=("http", {"rota": f"/r/{i}"}), daemon=True)
        for i in range(EXPLOSAO)
    ]
    for fio in fios:
        fio.start()
    for fio in fios:
        fio.join(timeout=5.0)
    assert all(not fio.is_alive() for fio in fios)
    assert guarda.contagem() == TETO
    assert guarda.recusadas() == EXPLOSAO - TETO
