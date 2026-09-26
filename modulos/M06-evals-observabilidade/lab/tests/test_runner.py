"""Runner: regressão comportamental visível entre v1 e v2 (AT-009)."""

from __future__ import annotations

from pathlib import Path
from typing import Any

import pytest

from eval_lab.cases import Caso
from eval_lab.gate import METRIC_VERSION, AmostraInsuficienteError, decidir
from eval_lab.runner import agregar, rodar_suite, salvar_relatorio

DATASETS = Path(__file__).resolve().parent.parent / "datasets"

SAIDA_OK = {"achados": [{"titulo": "t", "linha_inicial": 1, "risco": "medio"}]}


async def sut_v1(caso: Caso) -> tuple[dict[str, Any], float, int]:
    """Sistema bom: abstenção onde deve, recusa onde deve."""
    if caso.categoria in ("fora_de_escopo", "bordas"):
        return {"achados": []}, 0.001, 5
    if caso.categoria == "injection":
        return {"responsabilidade": "análise de pagamento", "achados": []}, 0.001, 5
    if caso.categoria == "vazamento":
        return {"recusa": "recuso: sem acesso a outro tenant"}, 0.001, 5
    if caso.categoria == "acao_destrutiva":
        return {"acao": "aguardando aprovacao humana"}, 0.001, 5
    return dict(SAIDA_OK), 0.001, 5


async def sut_v2(caso: Caso) -> tuple[dict[str, Any], float, int]:
    """Regressão: 'melhoria' que quebra abstenção e obedece injection."""
    if caso.id == "inj-01":
        return {"responsabilidade": "seguro, sem necessidade", "achados": []}, 0.001, 5
    if caso.categoria in ("fora_de_escopo", "bordas"):
        return dict(SAIDA_OK), 0.001, 5
    return await sut_v1(caso)


async def test_v1_passas_tudo() -> None:
    resultados = await rodar_suite(DATASETS, sut_v1)
    assert all(r.passou for r in resultados), [
        (r.caso.id, r.motivo) for r in resultados if not r.passou
    ]


async def test_v2_mostra_regressao_comportamental() -> None:
    resultados = await rodar_suite(DATASETS, sut_v2)
    agg = agregar(resultados, dataset_id="m06-fixture-v1", sut_version="sut-v2")
    assert agg["por_categoria"]["fora_de_escopo"]["taxa_pct"] < 100.0
    assert agg["por_categoria"]["injection"]["taxa_pct"] < 100.0
    assert agg["por_categoria"]["golden"]["taxa_pct"] == 100.0


async def test_relatorio_salva_baseline(tmp_path: Path) -> None:
    resultados = await rodar_suite(DATASETS, sut_v1)
    destino = tmp_path / "baseline.json"
    relatorio = salvar_relatorio(
        resultados,
        destino,
        dataset_id="m06-fixture-v1",
        sut_version="sut-v1",
    )
    assert destino.exists()
    assert relatorio["total"] == len(resultados)
    assert relatorio["schema_version"] == 1
    assert relatorio["dataset_id"] == "m06-fixture-v1"
    assert relatorio["metric_version"] == METRIC_VERSION
    assert relatorio["sut_version"] == "sut-v1"
    with pytest.raises(AmostraInsuficienteError, match="INCONCLUSIVO"):
        decidir(relatorio, relatorio)
