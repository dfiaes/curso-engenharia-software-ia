"""Oraculo LT01-AT-042: sintoma separado da causa externa.

Breakdown publica local, upstream e total lado a lado: latencia
local saudavel com total degradado acusa espera externa presa em
slot local (fila interna como sintoma). Numeros: exemplo variavel
(medicao local, relogio monotonico com margem larga, sem assert de
tempo exato; atraso lento 0.2 s, teto 2.0 s). So stdlib (time);
sem rede.
"""

from __future__ import annotations

import time

import pytest

import carga_tempo as ct

ESPERA_LENTA = 0.2
TETO_PAREDE = 2.0


def _causa(local_s: float, upstream_s: float) -> str:
    if upstream_s > local_s:
        return "upstream"
    return "local"


def test_breakdown_publica_tres_lados() -> None:
    partes = ct.dividir_latencias(0.02, 0.8)
    assert set(partes) == {"local_s", "upstream_s", "total_s"}
    assert partes["total_s"] == pytest.approx(0.82)
    assert partes["upstream_s"] / partes["total_s"] > 0.9
    assert partes["local_s"] / partes["total_s"] < 0.1


def test_causa_no_upstream_quando_local_saudavel() -> None:
    partes = ct.dividir_latencias(0.02, 0.8)
    assert _causa(partes["local_s"], partes["upstream_s"]) == "upstream"


def test_causa_local_quando_proprio_lento() -> None:
    partes = ct.dividir_latencias(0.8, 0.02)
    assert _causa(partes["local_s"], partes["upstream_s"]) == "local"


def test_breakdown_veda_negativos() -> None:
    for local, upstream in [(-0.1, 0.5), (0.5, -0.1)]:
        try:
            ct.dividir_latencias(local, upstream)
        except ValueError:
            continue
        raise AssertionError("dividir_latencias devia vedar negativo")


def test_parede_separa_trabalho_local_de_upstream_lento() -> None:
    rapida = ct.medir_tempos(lambda: None)
    assert 0.0 <= rapida["parede_s"] < TETO_PAREDE
    lenta = ct.medir_tempos(lambda: time.sleep(ESPERA_LENTA))
    assert ESPERA_LENTA <= lenta["parede_s"] < TETO_PAREDE
    partes = ct.dividir_latencias(rapida["parede_s"], lenta["parede_s"])
    assert partes["total_s"] == pytest.approx(rapida["parede_s"] + lenta["parede_s"])
    assert _causa(partes["local_s"], partes["upstream_s"]) == "upstream"
