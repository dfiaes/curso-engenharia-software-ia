"""Oraculo LT01-AT-041: leak, cache e baseline distinguidos.

Tres leituras com tolerancia contratada: baseline em repouso, pico
sob carga, patamar apos limpeza. Pico alto que reverte e cache;
patamar que nao volta e vazamento; o veredito mora na terceira
leitura, nunca na segunda. Numeros: exemplo variavel (bytes medidos
nesta maquina; ru_maxrss e pico do processo e nunca decresce, por
isso os tres vereditos usam numeros injetados e a leitura viva
cobre sanidade do instrumento e crescimento sob carga real com
alocacao de 8 MB). So stdlib (os, resource via modulo); sem rede.
"""

from __future__ import annotations

import memoria_rss as mr

BASELINE_FIXA = 100_000_000
PICO_FIXO = 150_000_000
TOLERANCIA = 1_000_000
ALOCACAO = 8_000_000


def test_rss_vivo_e_inteiro_positivo() -> None:
    leitura = mr.rss_bytes()
    assert isinstance(leitura, int)
    assert leitura > 0


def test_pico_nao_decresce_sob_carga_real() -> None:
    antes = mr.rss_bytes()
    ocupacao = bytearray(ALOCACAO)
    assert len(ocupacao) == ALOCACAO
    pico = mr.rss_bytes()
    assert pico >= antes
    assert mr.crescimento_bytes(antes, pico) == pico - antes >= 0


def test_crescimento_subtrai_duas_leituras() -> None:
    assert mr.crescimento_bytes(100, 150) == 50
    assert mr.crescimento_bytes(100, 100) == 0
    assert mr.crescimento_bytes(150, 100) == -50


def test_crescimento_veda_leitura_negativa() -> None:
    for antes, depois in [(-1, 10), (10, -1)]:
        try:
            mr.crescimento_bytes(antes, depois)
        except ValueError:
            continue
        raise AssertionError("crescimento_bytes devia vedar leitura negativa")


def test_veredito_vazamento_patamar_nao_volta() -> None:
    assert (
        mr.classificar_crescimento(BASELINE_FIXA, PICO_FIXO, 149_000_000, TOLERANCIA) == "vazamento"
    )


def test_veredito_cache_pico_reverte() -> None:
    assert mr.classificar_crescimento(BASELINE_FIXA, PICO_FIXO, 100_500_000, TOLERANCIA) == "cache"


def test_veredito_baseline_sem_crescimento() -> None:
    assert (
        mr.classificar_crescimento(BASELINE_FIXA, 100_500_000, 100_200_000, TOLERANCIA)
        == "baseline"
    )


def test_veredito_fronteira_terceira_leitura_decide() -> None:
    patamar_no_limite = BASELINE_FIXA + TOLERANCIA
    assert (
        mr.classificar_crescimento(BASELINE_FIXA, PICO_FIXO, patamar_no_limite, TOLERANCIA)
        == "cache"
    )
    assert (
        mr.classificar_crescimento(BASELINE_FIXA, patamar_no_limite, patamar_no_limite, TOLERANCIA)
        == "baseline"
    )


def test_veredito_veda_negativos() -> None:
    for baseline, pico, apos, tolerancia in [
        (-1, 10, 10, 1),
        (10, -1, 10, 1),
        (10, 10, -1, 1),
        (10, 10, 10, -1),
    ]:
        try:
            mr.classificar_crescimento(baseline, pico, apos, tolerancia)
        except ValueError:
            continue
        raise AssertionError("classificar_crescimento devia vedar negativo")
