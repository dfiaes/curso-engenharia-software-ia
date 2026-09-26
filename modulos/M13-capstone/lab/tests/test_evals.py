"""B11: datasets versionados, métricas derivadas e gate de regressão."""

import copy
import json
from pathlib import Path

import pytest

from capstone_lab.evals import (
    load_evalset,
    regression_gate,
    run_eval,
    token_f1,
)

FIX = Path(__file__).resolve().parent.parent / "fixtures" / "evals"


def load_all() -> dict[str, dict[str, object]]:
    return {
        name: run_eval(load_evalset(FIX / f"{name}_v1.json"))
        for name in ("golden", "out_of_scope", "injection")
    }


def test_datasets_versionados_carregam_e_validam() -> None:
    for name, kind in (
        ("golden", "golden"),
        ("out_of_scope", "out_of_scope"),
        ("injection", "injection"),
    ):
        ds = load_evalset(FIX / f"{name}_v1.json")
        assert ds["kind"] == kind and ds["version"] and ds["cases"]
    with pytest.raises(ValueError, match="kind desconhecido"):
        load_evalset(FIX / "broken_kind.json")


def test_token_f1_extremos_e_parcial() -> None:
    assert token_f1("a busca hibrida", "a busca hibrida") == 1.0
    assert token_f1("nada igual aqui", "busca hibrida") == 0.0
    assert token_f1("", "") == 1.0
    assert 0.0 < token_f1("a busca", "a busca hibrida") < 1.0


def test_golden_f1_e_structural_no_piso() -> None:
    rep = run_eval(load_evalset(FIX / "golden_v1.json"))
    assert rep["metrics"]["answer_f1"] >= 0.5  # piso pré-registrado
    assert rep["metrics"]["structural"] == 1.0


def test_out_of_scope_abstem_sempre() -> None:
    rep = run_eval(load_evalset(FIX / "out_of_scope_v1.json"))
    assert rep["metrics"]["abstention_accuracy"] == 1.0


def test_injection_nao_vaza_marcador() -> None:
    rep = run_eval(load_evalset(FIX / "injection_v1.json"))
    assert rep["metrics"]["injection_resistance"] == 1.0
    # resposta real não contém o marcador em nenhum caso
    ds = load_evalset(FIX / "injection_v1.json")
    from capstone_lab.evals import build_index, extractive_answer

    index = build_index(ds["chunks"])
    for case in ds["cases"]:
        assert case["marker"] not in str(extractive_answer(index, case)["answer"] or "")


def test_gate_reprova_regressao_semeada() -> None:
    baseline = json.loads((FIX / "baseline_reports.json").read_text(encoding="utf-8"))
    current = copy.deepcopy(baseline)
    current["golden"]["metrics"]["answer_f1"] -= 0.4  # regressão real semeada
    violations = regression_gate(baseline["golden"], current["golden"])
    assert violations and "answer_f1" in violations[0]
    # e o baseline atual bate com a execução real (suite não regrediu)
    live = load_all()
    for key, rep in live.items():
        assert regression_gate(baseline[key], rep) == []


def test_veredito_derivado_ignora_flag_passed() -> None:
    baseline = json.loads((FIX / "baseline_reports.json").read_text(encoding="utf-8"))
    forged = copy.deepcopy(baseline["golden"])
    forged["metrics"]["answer_f1"] = 0.0
    forged["passed"] = True  # tentativa de forjar aprovação no dado
    assert regression_gate(baseline["golden"], forged) != []


def test_execucao_deterministica() -> None:
    assert load_all() == load_all()  # mesma entrada, mesmo relatório (variância zero)
