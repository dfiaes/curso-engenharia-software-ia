"""Oraculo LT01-AT-040: knee point e recurso limitante identificados.

Dois relogios sobre o mesmo trabalho (cpu_s x parede_s), vazao,
Little e p95 por degrau: espera domina na parede do I/O-bound, os
dois andam juntos no CPU-bound; acima do joelho a oferta vira fila,
nao conclusao. Numeros: exemplo variavel (medicao local, relogio
monotonico com margem larga, sem assert de tempo exato; degraus
simulados com semente fixa 20260920 e N = 200 amostras por degrau).
So stdlib (time, random); sem rede.
"""

from __future__ import annotations

import random
import time

import carga_tempo as ct
import percentis_cardinalidade as pc

ESPERA = 0.05
TETO_PAREDE = 5.0
SEMENTE = 20260920
AMOSTRA = 200


def _trabalho_espera() -> None:
    time.sleep(ESPERA)


def _trabalho_conta() -> int:
    total = 0
    fim = time.perf_counter() + ESPERA
    while time.perf_counter() < fim:
        total += 1
    return total


def test_medir_publica_dois_relogios_nao_negativos() -> None:
    medida = ct.medir_tempos(lambda: None)
    assert set(medida) == {"cpu_s", "parede_s"}
    assert medida["cpu_s"] >= 0.0
    assert medida["parede_s"] >= 0.0


def test_espera_domina_parede_e_poupanca_cpu() -> None:
    medida = ct.medir_tempos(_trabalho_espera)
    assert ESPERA <= medida["parede_s"] < TETO_PAREDE
    assert medida["cpu_s"] < medida["parede_s"] / 2


def test_conta_anda_junta_nos_dois_relogios() -> None:
    medida = ct.medir_tempos(_trabalho_conta)
    assert medida["parede_s"] >= ESPERA
    assert medida["parede_s"] < TETO_PAREDE
    assert medida["cpu_s"] > medida["parede_s"] / 2


def test_taxa_vazao_deterministica_e_vedacoes() -> None:
    assert ct.taxa_vazao(100, 2.0) == 50.0
    assert ct.taxa_vazao(0, 1.5) == 0.0
    for concluidas, parede in [(-1, 1.0), (10, 0.0), (10, -2.0)]:
        try:
            ct.taxa_vazao(concluidas, parede)
        except ValueError:
            continue
        raise AssertionError("taxa_vazao devia vedar entrada invalida")


def test_lei_little_deterministica_e_vedacoes() -> None:
    assert ct.lei_little(10.0, 0.5) == 5.0
    assert ct.lei_little(0.0, 1.0) == 0.0
    for vazao, latencia in [(-1.0, 0.5), (10.0, -0.5)]:
        try:
            ct.lei_little(vazao, latencia)
        except ValueError:
            continue
        raise AssertionError("lei_little devia vedar entrada negativa")


def _amostras_degrau(rng: random.Random, base: float, fila_extra: float) -> list[float]:
    amostras = [base + rng.random() * 0.01 for _ in range(AMOSTRA)]
    atingidos = int(AMOSTRA * 0.1)
    for i in range(atingidos):
        amostras[i] += fila_extra
    return amostras


def test_joelho_ofeta_vira_fila_e_p95_acusa() -> None:
    rng = random.Random(SEMENTE)
    oferecidas = [10.0, 20.0, 40.0]
    vazao_medida = [9.8, 19.5, 21.0]
    degraus = [
        _amostras_degrau(rng, 0.05, 0.0),
        _amostras_degrau(rng, 0.05, 0.02),
        _amostras_degrau(rng, 0.05, 0.5),
    ]
    p95s = [pc.resumo(d)["p95"] for d in degraus]
    joelho = next(i for i in range(1, len(oferecidas)) if vazao_medida[i] < oferecidas[i] * 0.9)
    assert joelho == 2
    assert p95s[2] > p95s[1] * 2
    assert p95s[1] >= p95s[0]
    concorrencias = [ct.lei_little(v, p) for v, p in zip(vazao_medida, p95s, strict=True)]
    assert concorrencias[2] > concorrencias[1] > concorrencias[0]
    for degrau in degraus:
        assert pc.resumo(degrau)["contagem"] == float(AMOSTRA)
