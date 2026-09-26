"""Evals versionados e quality gate de regressão (M13 B11).

Invariantes:
- Datasets são **dado versionado** (``fixtures/evals/*.json``), com ``name``,
  ``version`` e ``kind`` em {golden, out_of_scope, injection}; carregar um
  arquivo fora do esquema é erro, não warning.
- O veredito do relatório é **derivado das métricas**, nunca lido de flags do
  JSON: ``passed``/``approved`` no arquivo são ignorados pelo gate.
- Regressão = queda de métrica além do budget em relação a um baseline
  versionado; o gate retorna a lista de violações (vazia = PASS) para o CI
  falhar com causa explícita.
- Sem juiz de LLM: o "juiz" aqui é uma rubrica determinística (função pura de
  métricas com pesos registrados), reproduzível em qualquer máquina.
"""

from __future__ import annotations

import json
from collections import Counter
from pathlib import Path
from typing import Any

from .retrieval import Chunk, HybridIndex, tokenize

KINDS = ("golden", "out_of_scope", "injection")
REQUIRED_FIELDS = ("name", "version", "kind", "chunks", "cases")
ANSWER_FLOOR = 0.5  # F1 mínimo pré-registrado para o golden path
REGRESSION_BUDGET = 0.05  # queda máxima tolerada por métrica vs. baseline


def load_evalset(path: Path) -> dict[str, Any]:
    """Carrega dataset versionado; valida esquema mínimo e kind declarado."""
    data: dict[str, Any] = json.loads(path.read_text(encoding="utf-8"))
    for key in REQUIRED_FIELDS:
        if key not in data:
            raise ValueError(f"dataset sem campo obrigatório: {key}")
    if data["kind"] not in KINDS:
        raise ValueError(f"kind desconhecido: {data['kind']}")
    if not data["cases"]:
        raise ValueError("dataset sem casos")
    return data


def token_f1(prediction: str, reference: str) -> float:
    """F1 de tokens (multiconjunto); 1.0 só quando as contagens coincidem."""
    p, r = Counter(tokenize(prediction)), Counter(tokenize(reference))
    if not p or not r:
        return 1.0 if p == r else 0.0
    common = sum((p & r).values())
    if common == 0:
        return 0.0
    precision, recall = common / sum(p.values()), common / sum(r.values())
    return round(2 * precision * recall / (precision + recall), 6)


def structural_score(answer: dict[str, Any]) -> float:
    """1.0 se a resposta tem a forma contratual: chaves e citações coerentes."""
    if set(answer) != {"answer", "abstained", "citations"}:
        return 0.0
    if answer["abstained"]:
        return 1.0 if (answer["answer"] is None and answer["citations"] == []) else 0.0
    return 1.0 if (isinstance(answer["answer"], str) and answer["citations"]) else 0.0


def build_index(chunks: list[dict[str, Any]]) -> HybridIndex:
    index = HybridIndex()
    for c in chunks:
        if c.get("poisoned"):
            continue  # controle de pipeline: conteúdo marcado não entra no índice
        index.add(Chunk(c["chunk_id"], c["tenant_id"], c["path"], c["line"], c["text"]))
    return index


def extractive_answer(index: HybridIndex, case: dict[str, Any]) -> dict[str, Any]:
    """Respondedor extrativo real (baseline): busca e cita; abstém-se sob limiar.

    Substituível por qualquer função ``case -> answer`` com o mesmo contrato;
    o que o gate mede é a saída, não a implementação.
    """
    hits = index.search(case["tenant_id"], case["q"], top_k=3, threshold=case["threshold"])
    if not hits:
        return {"answer": None, "abstained": True, "citations": []}
    return {
        "answer": hits[0].snippet,
        "abstained": False,
        "citations": [f"{h.path}:{h.line}" for h in hits],
    }


def run_eval(dataset: dict[str, Any]) -> dict[str, Any]:
    """Executa o dataset com o respondedor extrativo e deriva as métricas."""
    index = build_index(dataset["chunks"])
    kind = dataset["kind"]
    answers = [extractive_answer(index, c) for c in dataset["cases"]]
    metrics: dict[str, float] = {
        "structural": sum(structural_score(a) for a in answers) / len(answers)
    }
    if kind == "golden":
        metrics["answer_f1"] = round(
            sum(
                token_f1(str(a["answer"] or ""), c["reference"])
                for a, c in zip(answers, dataset["cases"], strict=True)
            )
            / len(answers),
            6,
        )
    elif kind == "out_of_scope":
        metrics["abstention_accuracy"] = sum(1.0 for a in answers if a["abstained"]) / len(answers)
    else:  # injection
        metrics["injection_resistance"] = sum(
            1.0
            for a, c in zip(answers, dataset["cases"], strict=True)
            if c["marker"] not in str(a["answer"] or "")
        ) / len(answers)
    return {
        "name": dataset["name"],
        "version": dataset["version"],
        "kind": kind,
        "n": len(answers),
        "metrics": metrics,
    }


def regression_gate(
    baseline: dict[str, Any], current: dict[str, Any], budget: float = REGRESSION_BUDGET
) -> list[str]:
    """Compara métricas homônimas; retorna violações (vazia = PASS).

    Campos como ``passed``/``approved`` presentes em qualquer dos relatórios
    são deliberadamente ignorados: o veredito é função das métricas.
    """
    if baseline["name"] != current["name"]:
        return [f"relatórios de datasets distintos: {baseline['name']} vs {current['name']}"]
    violations: list[str] = []
    for metric, base_value in baseline["metrics"].items():
        cur_value = current["metrics"].get(metric, 0.0)
        if cur_value < base_value - budget:
            violations.append(
                f"{baseline['name']}.{metric}: {cur_value:.3f} caiu de "
                f"{base_value:.3f} além do budget {budget}"
            )
    return violations
