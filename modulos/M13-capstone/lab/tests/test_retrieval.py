"""B6: busca híbrida, ACL antes de recuperar, abstenção e dataset versionado."""

import json
from pathlib import Path

import pytest

from capstone_lab.retrieval import (
    Chunk,
    HybridIndex,
    evaluate,
    load_dataset,
    meets_thresholds,
)

DATASET_PATH = Path(__file__).parent.parent / "fixtures" / "retrieval" / "dataset_v1.json"


def build_index() -> HybridIndex:
    data = load_dataset(DATASET_PATH)
    index = HybridIndex()
    for raw in data["chunks"]:
        index.add(Chunk(**raw))
    return index


def test_dataset_is_versioned_and_complete() -> None:
    data = load_dataset(DATASET_PATH)
    assert data["version"] == "v1-2026-09-21"
    assert len(data["chunks"]) == 6
    assert len(data["queries"]) == 6
    assert set(data["thresholds"]) == {"recall_at_k", "mrr"}


def test_hybrid_search_finds_relevant_chunk_with_citation() -> None:
    hits = build_index().search("t1", "bm25 cosseno ranking", top_k=3, threshold=0.05)
    assert hits[0].chunk_id == "c3"
    assert hits[0].path == "retrieval.py"  # citação: arquivo + linha
    assert hits[0].line == 30
    assert hits[0].score > 0.0


def test_acl_filters_before_retrieval_zero_cross_tenant() -> None:
    index = build_index()
    for tenant in ("t1", "t2"):
        hits = index.search(tenant, "credenciais confidencial privados", top_k=5, threshold=0.0)
        own = {"c6"} if tenant == "t2" else {"c1", "c2", "c3", "c4", "c5"}
        assert all(h.chunk_id in own for h in hits)
    # t1 jamais vê c6 mesmo com query idêntica ao conteúdo dele
    assert not any(
        h.chunk_id == "c6" for h in index.search("t1", "credenciais confidencial", 5, 0.0)
    )


def test_abstention_below_threshold_returns_nothing() -> None:
    hits = build_index().search("t1", "bm25 ranking", top_k=3, threshold=1000.0)
    assert hits == []  # melhor score abaixo do limiar: abstenção, não palpite


def test_empty_query_returns_nothing() -> None:
    assert build_index().search("t1", "!!!", top_k=3, threshold=0.0) == []


def test_dataset_meets_preregistered_recall_and_mrr() -> None:
    data = load_dataset(DATASET_PATH)
    metrics = evaluate(build_index(), data, top_k=3)
    violations = meets_thresholds(metrics, data["thresholds"])
    assert violations == [], f"limiares pré-registrados não atingidos: {violations}"
    assert metrics["recall_at_k"] == pytest.approx(1.0)


def test_regression_would_break_threshold() -> None:
    # prova de que o oráculo detecta regressão: exigindo recall impossível, deve violar
    metrics = {"recall_at_k": 0.5, "mrr": 0.5}
    assert meets_thresholds(metrics, {"recall_at_k": 0.99}) != []


def test_invalid_alpha_is_rejected() -> None:
    with pytest.raises(ValueError):
        HybridIndex(alpha=1.5)
    # dataset malformado (sem campo obrigatório) é erro, não silêncio
    broken = json.loads(DATASET_PATH.read_text(encoding="utf-8"))
    del broken["version"]
    with pytest.raises(ValueError, match="version"):
        load_dataset(_write_tmp(broken))


def _write_tmp(obj: dict[str, object]) -> Path:
    tmp = Path(__file__).parent / "_tmp_dataset.json"
    tmp.write_text(json.dumps(obj), encoding="utf-8")
    return tmp
