"""Oraculo LT01-AT-061: faults desligados e verificacao verde.

Restaurado so com as duas metades publicadas lado a lado: cada
degradacao declarada desligada e cada sonda injetada verde sobre o
ambiente limpo. Faults desligados sem verificacao e fe; verificacao
verde com residual e teatro — ambos pendente. Numeros: exemplo
variavel (baseline saudavel p95 80.0 ms/erro 0.001 contra degradado
900.0/0.01; amostra seedada 20260601 com N = 50 sondagens). So stdlib;
sem rede, sem container.
"""

from __future__ import annotations

import random

import pytest

import exercicio_runbook as er
import restauracao_baseline as rb

SEMENTE = 20260601
AMOSTRA = 50


def _sondas_verdes() -> dict[str, bool]:
    return {"p95_no_contrato": True, "erros_no_patamar": True, "fila_sem_residuo": True}


def test_desligar_faults_apaga_cada_degradacao_declarada() -> None:
    faults = {"latencia_injetada": True, "erros_altos": True, "mudanca_pendente": True}
    desligados = rb.desligar_faults(faults)
    assert desligados == {
        "latencia_injetada": False,
        "erros_altos": False,
        "mudanca_pendente": False,
    }
    assert faults == {
        "latencia_injetada": True,
        "erros_altos": True,
        "mudanca_pendente": True,
    }


def test_desligar_mapa_vazio_publica_vazio() -> None:
    assert rb.desligar_faults({}) == {}


def test_smoke_verde_executa_sondas_injetadas() -> None:
    resultados = rb.smoke_verde(
        {
            "a": lambda: True,
            "b": lambda: 2 > 1,
            "c": lambda: not True,
        }
    )
    assert resultados == {"a": True, "b": True, "c": False}
    todos_verdes = rb.smoke_verde({nome: (lambda: True) for nome in ("s1", "s2")})
    assert todos_verdes == {"s1": True, "s2": True}


def test_smoke_sem_sondas_veda_verificacao() -> None:
    with pytest.raises(ValueError, match="sem sondas"):
        rb.smoke_verde({})


def test_veredito_sem_resultados_veda() -> None:
    with pytest.raises(ValueError, match="sem resultados"):
        rb.veredito_restauracao({"f": False}, {})


def test_restaurado_exige_as_duas_metades() -> None:
    assert rb.veredito_restauracao({"f1": False, "f2": False}, _sondas_verdes()) == "restaurado"
    assert rb.veredito_restauracao({"f1": True, "f2": False}, _sondas_verdes()) == "pendente"
    assert (
        rb.veredito_restauracao({"f1": False}, {"p95_no_contrato": True, "erros_no_patamar": False})
        == "pendente"
    )
    assert rb.veredito_restauracao({"f1": True}, {"s": False}) == "pendente"


def test_calma_sem_prova_reprova_fe_e_teatro() -> None:
    fe = rb.veredito_restauracao({"f": False}, {"s": False})
    assert fe == "pendente"
    teatro = rb.veredito_restauracao({"latencia_injetada": True}, _sondas_verdes())
    assert teatro == "pendente"


def test_cadeia_completa_baseline_lado_a_lado() -> None:
    baseline = er.AlvoLocal("saudavel").observar()
    assert baseline == {"p95_ms": 80.0, "taxa_erro": 0.001}
    degradado = er.AlvoLocal("latencia_alta").observar()
    assert degradado["p95_ms"] > baseline["p95_ms"] * 2
    faults = rb.desligar_faults({"latencia_injetada": True, "erros_altos": True})
    assert all(desligado is False for desligado in faults.values())
    restaurado_alvo = er.AlvoLocal("saudavel")
    resultados = rb.smoke_verde(
        {
            "p95_no_contrato": lambda: restaurado_alvo.observar()["p95_ms"] <= 100.0,
            "erros_no_patamar": lambda: restaurado_alvo.observar()["taxa_erro"] <= 0.01,
        }
    )
    assert resultados == {"p95_no_contrato": True, "erros_no_patamar": True}
    assert rb.veredito_restauracao(faults, resultados) == "restaurado"
    atual = restaurado_alvo.observar()
    assert atual == baseline


def test_amostra_seedada_verde_estavel() -> None:
    rng = random.Random(SEMENTE)
    esperados = [rng.random() for _ in range(AMOSTRA)]
    rng = random.Random(SEMENTE)
    repetidos = [rng.random() for _ in range(AMOSTRA)]
    assert esperados == repetidos
    alvo = er.AlvoLocal("saudavel")
    verdes = [
        rb.smoke_verde({"p95": lambda: alvo.observar()["p95_ms"] == 80.0}) for _ in range(AMOSTRA)
    ]
    assert len(verdes) == AMOSTRA
    assert all(resultado == {"p95": True} for resultado in verdes)
