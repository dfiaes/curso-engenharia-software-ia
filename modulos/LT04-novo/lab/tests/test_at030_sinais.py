"""Oraculos LT04-T1-AT-030..032: cauda de raw samples, erro e regressao por slice.

Numeros: exemplo variavel (listas em memoria, N=100 e N=20).
Carga e trafego reais = trilha externa BLOCKED; aqui aritmetica sobre dados.
"""

from __future__ import annotations

import pytest

import sinais_release as s

CAUDA = [10.0] * 95 + [900.0] * 5


def test_p99_revela_cauda_que_media_esconde() -> None:
    r = s.resumo(CAUDA)
    assert r["n"] == 100.0
    assert r["media"] == pytest.approx(54.5)
    assert r["p99"] == 900.0
    assert r["p50"] == 10.0


def test_percentil_sem_amostra_e_erro() -> None:
    with pytest.raises(ValueError):
        s.percentil([], 95.0)
    with pytest.raises(ValueError):
        s.percentil([1.0], 0.0)


def test_taxa_erro_e_total_zero_e_erro() -> None:
    assert s.taxa_erro(5, 100) == pytest.approx(0.05)
    with pytest.raises(ValueError):
        s.taxa_erro(0, 0)


def test_slice_ruim_nao_se_esconde_no_agregado() -> None:
    p99 = {"checkout": 120.0, "busca": 950.0, "login": 200.0}
    assert s.slices_piores(p99, 800.0) == ["busca"]
    assert s.slices_piores(p99, 1000.0) == []
