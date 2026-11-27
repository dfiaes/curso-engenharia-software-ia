"""Schema do relatório: positivos, bordas, controles negativos e CLI (FIX-01)."""

from __future__ import annotations

import copy
import json
import subprocess
import sys
from pathlib import Path
from typing import Any

import pytest

from eval_lab.gate import (
    METRIC_VERSION,
    MIN_AMOSTRA_POR_CATEGORIA,
    AmostraInsuficienteError,
    decidir,
)

CATEGORIAS = ("golden", "fora_de_escopo", "injection", "vazamento", "acao_destrutiva", "bordas")
GATE = Path(__file__).resolve().parents[1] / "src" / "eval_lab" / "gate.py"


def relatorio(
    por_categoria: dict[str, dict[str, Any]] | None = None,
    *,
    amostra_por_categoria: int = MIN_AMOSTRA_POR_CATEGORIA,
) -> dict[str, Any]:
    categorias = por_categoria or {
        categoria: {
            "passou": amostra_por_categoria,
            "total": amostra_por_categoria,
            "taxa_pct": 100.0,
        }
        for categoria in CATEGORIAS
    }
    return {
        "schema_version": 1,
        "dataset_id": "m06-fixture-v1",
        "metric_version": METRIC_VERSION,
        "sut_version": "sut-v1",
        "total": sum(metrica["total"] for metrica in categorias.values()),
        "custo_total": 0.0,
        "por_categoria": categorias,
    }


def test_relatorio_valido_e_borda_de_tolerancia() -> None:
    base = relatorio(amostra_por_categoria=100)
    atual = copy.deepcopy(base)
    atual["por_categoria"]["golden"] = {"passou": 98, "total": 100, "taxa_pct": 98.0}
    atual["total"] = 600
    assert decidir(atual, base) == ([], [])


def test_relatorio_atual_vazio_contra_baseline_de_seguranca_e_rejeitado() -> None:
    atual = relatorio()
    base = relatorio()
    atual["por_categoria"] = {}
    atual["total"] = 0

    with pytest.raises(ValueError, match="categorias obrigatórias ausentes"):
        decidir(atual, base)


def test_contagens_inteiras_grandes_nao_estouram_calculo_da_taxa() -> None:
    atual = relatorio()
    base = relatorio()
    amostra = 10**1000
    grande = {"passou": amostra, "total": amostra, "taxa_pct": 100.0}
    atual["por_categoria"]["golden"] = grande.copy()
    base["por_categoria"]["golden"] = grande.copy()
    atual["total"] += amostra - MIN_AMOSTRA_POR_CATEGORIA
    base["total"] += amostra - MIN_AMOSTRA_POR_CATEGORIA

    assert decidir(atual, base) == ([], [])


@pytest.mark.parametrize(
    ("mutador", "mensagem"),
    [
        (lambda r: r.clear(), "campos obrigatórios ausentes"),
        (lambda r: r.pop("por_categoria"), "campos obrigatórios ausentes"),
        (lambda r: (r.pop("por_categoria"), r.__setitem__("categories", {})), "por_categoria"),
        (
            lambda r: r["por_categoria"].pop("bordas"),
            "categorias obrigatórias ausentes",
        ),
        (
            lambda r: r["por_categoria"]["golden"].update(taxa_pct=float("nan")),
            "finita",
        ),
        (
            lambda r: r["por_categoria"]["golden"].update(taxa_pct=float("inf")),
            "finita",
        ),
        (
            lambda r: r["por_categoria"]["golden"].update(taxa_pct=100.1),
            "entre 0 e 100",
        ),
        (
            lambda r: r["por_categoria"]["golden"].update(total=0, passou=0, taxa_pct=0.0),
            "total > 0",
        ),
        (
            lambda r: r["por_categoria"]["golden"].pop("passou"),
            "campos ausentes",
        ),
        (
            lambda r: r.update(total=0),
            "inteiro maior que zero",
        ),
    ],
)
def test_relatorio_invalido_rejeitado_antes_do_gate(
    mutador: Any, mensagem: str
) -> None:
    atual = relatorio()
    mutador(atual)
    with pytest.raises(ValueError, match=mensagem):
        decidir(atual, relatorio())


def test_taxa_deve_corresponder_as_contagens() -> None:
    atual = relatorio()
    atual["por_categoria"]["golden"]["taxa_pct"] = 99.0
    with pytest.raises(ValueError, match="diverge da taxa derivada"):
        decidir(atual, relatorio())


def test_dataset_da_baseline_deve_corresponder() -> None:
    base = relatorio()
    atual = relatorio()
    atual["dataset_id"] = "outro-dataset"
    with pytest.raises(ValueError, match="mesmo dataset_id"):
        decidir(atual, base)


def test_metric_version_da_baseline_deve_corresponder() -> None:
    base = relatorio()
    atual = relatorio()
    atual["metric_version"] = "outra-metrica-v2"
    with pytest.raises(ValueError, match="mesma metric_version"):
        decidir(atual, base)


def test_denominadores_por_categoria_devem_corresponder() -> None:
    base = relatorio()
    atual = relatorio(amostra_por_categoria=MIN_AMOSTRA_POR_CATEGORIA + 1)
    with pytest.raises(ValueError, match="denominador incompatível"):
        decidir(atual, base)


def test_amostra_abaixo_da_politica_retorna_inconclusivo() -> None:
    amostra_curta = relatorio(amostra_por_categoria=MIN_AMOSTRA_POR_CATEGORIA - 1)
    with pytest.raises(AmostraInsuficienteError, match="INCONCLUSIVO"):
        decidir(amostra_curta, amostra_curta)


@pytest.mark.parametrize(
    ("lado", "mensagem"),
    [
        ("atual", "somente em atual: categoria_nova"),
        ("baseline", "somente em baseline: categoria_legada"),
    ],
)
def test_categoria_extra_em_apenas_um_relatorio_tem_diagnostico(
    lado: str, mensagem: str
) -> None:
    atual = relatorio()
    base = relatorio()
    relatorio_alvo = atual if lado == "atual" else base
    nome = "categoria_nova" if lado == "atual" else "categoria_legada"
    relatorio_alvo["por_categoria"][nome] = {
        "passou": 1,
        "total": 1,
        "taxa_pct": 100.0,
    }
    relatorio_alvo["total"] += 1

    with pytest.raises(ValueError, match=mensagem):
        decidir(atual, base)


def test_mesma_categoria_extra_nos_dois_relatorios_e_compativel() -> None:
    atual = relatorio()
    base = relatorio()
    metrica_extra = {
        "passou": MIN_AMOSTRA_POR_CATEGORIA,
        "total": MIN_AMOSTRA_POR_CATEGORIA,
        "taxa_pct": 100.0,
    }
    atual["por_categoria"]["extensao_compartilhada"] = metrica_extra.copy()
    base["por_categoria"]["extensao_compartilhada"] = metrica_extra.copy()
    atual["total"] += MIN_AMOSTRA_POR_CATEGORIA
    base["total"] += MIN_AMOSTRA_POR_CATEGORIA

    assert decidir(atual, base) == ([], [])


def test_categoria_zero_amostras_nao_e_evidencia() -> None:
    atual = relatorio()
    atual["por_categoria"]["injection"] = {"passou": 0, "total": 0, "taxa_pct": 0.0}
    atual["total"] -= MIN_AMOSTRA_POR_CATEGORIA
    with pytest.raises(ValueError, match="total > 0"):
        decidir(atual, relatorio())


def test_cli_retorna_codigo_nao_zero_com_diagnostico(tmp_path: Path) -> None:
    atual_path = tmp_path / "atual.json"
    base_path = tmp_path / "base.json"
    atual_path.write_text(json.dumps({"schema_version": 1}), encoding="utf-8")
    base_path.write_text(json.dumps(relatorio()), encoding="utf-8")

    resultado = subprocess.run(
        [sys.executable, str(GATE), str(atual_path), str(base_path)],
        check=False,
        capture_output=True,
        text=True,
    )

    assert resultado.returncode == 2
    assert "ERRO DE ENTRADA" in resultado.stderr
    assert "campos obrigatórios ausentes" in resultado.stderr


def test_cli_marca_amostra_curta_como_inconclusiva(tmp_path: Path) -> None:
    amostra_curta = relatorio(amostra_por_categoria=MIN_AMOSTRA_POR_CATEGORIA - 1)
    atual_path = tmp_path / "atual.json"
    base_path = tmp_path / "base.json"
    atual_path.write_text(json.dumps(amostra_curta), encoding="utf-8")
    base_path.write_text(json.dumps(amostra_curta), encoding="utf-8")

    resultado = subprocess.run(
        [sys.executable, str(GATE), str(atual_path), str(base_path)],
        check=False,
        capture_output=True,
        text=True,
    )

    assert resultado.returncode == 2
    assert "INCONCLUSIVO" in resultado.stderr
    assert "Traceback" not in resultado.stderr


def test_cli_rejeita_categoria_extra_so_no_atual_com_diagnostico(
    tmp_path: Path,
) -> None:
    atual = relatorio()
    atual["por_categoria"]["categoria_nova"] = {
        "passou": 1,
        "total": 1,
        "taxa_pct": 100.0,
    }
    atual["total"] += 1
    atual_path = tmp_path / "atual.json"
    base_path = tmp_path / "base.json"
    atual_path.write_text(json.dumps(atual), encoding="utf-8")
    base_path.write_text(json.dumps(relatorio()), encoding="utf-8")

    resultado = subprocess.run(
        [sys.executable, str(GATE), str(atual_path), str(base_path)],
        check=False,
        capture_output=True,
        text=True,
    )

    assert resultado.returncode == 2
    assert "ERRO DE ENTRADA" in resultado.stderr
    assert "somente em atual: categoria_nova" in resultado.stderr
    assert "Traceback" not in resultado.stderr


@pytest.mark.parametrize(
    ("local", "mensagem"),
    [
        (("custo_total",), "custo_total deve ser número finito"),
        (("por_categoria", "golden", "taxa_pct"), "taxa_pct deve ser finita"),
    ],
)
def test_cli_rejeita_inteiro_fora_do_intervalo_float_sem_traceback(
    tmp_path: Path, local: tuple[str, ...], mensagem: str
) -> None:
    atual = relatorio()
    valor: dict[str, Any] = atual
    for chave in local[:-1]:
        valor = valor[chave]
    valor[local[-1]] = 10**1000
    atual_path = tmp_path / "atual.json"
    base_path = tmp_path / "base.json"
    atual_path.write_text(json.dumps(atual), encoding="utf-8")
    base_path.write_text(json.dumps(relatorio()), encoding="utf-8")

    resultado = subprocess.run(
        [sys.executable, str(GATE), str(atual_path), str(base_path)],
        check=False,
        capture_output=True,
        text=True,
    )

    assert resultado.returncode == 2
    assert "ERRO DE ENTRADA" in resultado.stderr
    assert mensagem in resultado.stderr
    assert "Traceback" not in resultado.stderr


def test_cli_aceita_relatorios_validos(tmp_path: Path) -> None:
    atual_path = tmp_path / "atual.json"
    base_path = tmp_path / "base.json"
    atual_path.write_text(json.dumps(relatorio()), encoding="utf-8")
    base_path.write_text(json.dumps(relatorio()), encoding="utf-8")

    resultado = subprocess.run(
        [sys.executable, str(GATE), str(atual_path), str(base_path)],
        check=False,
        capture_output=True,
        text=True,
    )

    assert resultado.returncode == 0
    assert "## Eval gate" in resultado.stdout


def test_cli_aceita_contagens_inteiras_grandes(tmp_path: Path) -> None:
    atual = relatorio()
    base = relatorio()
    amostra = 10**1000
    grande = {"passou": amostra, "total": amostra, "taxa_pct": 100.0}
    atual["por_categoria"]["golden"] = grande.copy()
    base["por_categoria"]["golden"] = grande.copy()
    atual["total"] += amostra - MIN_AMOSTRA_POR_CATEGORIA
    base["total"] += amostra - MIN_AMOSTRA_POR_CATEGORIA
    atual_path = tmp_path / "atual.json"
    base_path = tmp_path / "base.json"
    atual_path.write_text(json.dumps(atual), encoding="utf-8")
    base_path.write_text(json.dumps(base), encoding="utf-8")

    resultado = subprocess.run(
        [sys.executable, str(GATE), str(atual_path), str(base_path)],
        check=False,
        capture_output=True,
        text=True,
    )

    assert resultado.returncode == 0
    assert "## Eval gate" in resultado.stdout
    assert "Traceback" not in resultado.stderr
