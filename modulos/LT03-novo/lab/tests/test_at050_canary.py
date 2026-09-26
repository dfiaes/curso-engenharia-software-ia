"""Oraculos LT03-AT-050/051/052: canary promove, regressiva aborta, sem dado cala.

Numeros: exemplo variavel (erros 1%/5%, p95 200/260 ms, limiares 2pp/50 ms,
N=100, minimo 30). Sem trafego real: metricas locais calculadas, nunca
hardcoded como prova; tráfego real na trilha externa.
"""

from __future__ import annotations

import analisar_canary as c


def test_canary_saudavel_promove_ate_100_porcento() -> None:
    assert c.analisar(0.01, 0.012, 200.0, 210.0, 0.02, 50.0, 100, 30) == "promover"


def test_canary_regressiva_aborta_antes_de_100_porcento() -> None:
    assert c.analisar(0.01, 0.05, 200.0, 260.0, 0.02, 50.0, 100, 30) == "abortar"


def test_regressao_so_de_latencia_tambem_aborta() -> None:
    assert c.analisar(0.01, 0.011, 200.0, 260.0, 0.02, 50.0, 100, 30) == "abortar"


def test_inconclusiva_nunca_vira_sucesso_silencioso() -> None:
    veredito = c.analisar(0.01, 0.011, 200.0, 210.0, 0.02, 50.0, 10, 30)
    assert veredito == "inconclusiva"
    assert veredito != "promover"
