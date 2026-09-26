"""Eval: recall/MRR/citação, ablação e as 3 perguntas (AT-013/014/016)."""

from __future__ import annotations

import json

from conftest import LAB, ids, montar_store

from retrieval_lab.eval_retrieval import ablacao, citacao_valida, mrr, recall_at_k
from retrieval_lab.rerank import rerankear


def _consultas() -> list[tuple[str, set[str]]]:
    consultas: list[tuple[str, set[str]]] = []
    for linha in (LAB / "queries.jsonl").read_text(encoding="utf-8").splitlines():
        if not linha.strip():
            continue
        q = json.loads(linha)
        if q.get("esperado_falhar"):
            continue
        consultas.append((q["texto"], set(q["esperados"])))
    return consultas


def test_recall_mrr_deterministicos() -> None:
    assert recall_at_k(["a", "b", "c"], {"b", "x"}, k=2) == 0.5
    assert recall_at_k([], set(), k=5) == 1.0
    assert mrr(["a", "b"], {"b"}) == 0.5
    assert mrr(["a"], {"z"}) == 0.0


def test_citacao_valida_aprova_e_reprova() -> None:
    raiz = LAB / "corpus" / "legado_demo"
    boa = {
        "caminho": "cobranca.py",
        "linha_ini": 20,
        "linha_fim": 20,
        "termo_esperado": "calcular_juros",
    }
    assert citacao_valida(boa, raiz)[0] is True
    ruim = {"caminho": "cobranca.py", "linha_ini": 1, "linha_fim": 200, "termo_esperado": "x"}
    assert citacao_valida(ruim, raiz)[0] is False
    fantasma = {"caminho": "nao_existe.py", "linha_ini": 1, "linha_fim": 1}
    assert citacao_valida(fantasma, raiz)[0] is False


def test_ablacao_mostra_preco_da_omissao() -> None:
    store, _ = montar_store()

    def completo(q: str) -> list[str]:
        return ids(rerankear(q, store.buscar_hibrido(q, "acme", k=20)))

    def so_vetorial(q: str) -> list[str]:
        return [h.chunk.id_estavel for h in store.buscar_vetorial(q, "acme", k=20)[:5]]

    def so_lexico(q: str) -> list[str]:
        return [h.chunk.id_estavel for h in store.buscar_lexico(q, "acme", k=20)[:5]]

    tabela = ablacao(
        _consultas(), {"completo": completo, "so_vetorial": so_vetorial, "so_lexico": so_lexico}
    )
    assert tabela["completo"] >= tabela["so_vetorial"]
    assert tabela["completo"] >= tabela["so_lexico"]
    assert tabela["completo"] == 1.0


def test_tres_perguntas_estruturais_falham_com_diagnostico() -> None:
    linhas = (LAB / "queries.jsonl").read_text(encoding="utf-8").splitlines()
    estruturais = [
        json.loads(linha)
        for linha in linhas
        if linha.strip() and json.loads(linha).get("esperado_falhar")
    ]
    assert len(estruturais) == 3
    for q in estruturais:
        # Termo casa, relação não: nenhum chunk ISOLADO responde "o que
        # quebra" ou "quem depende" — por isso `esperados` é vazio e o
        # diagnóstico é recuperação-estrutural (M10), não geração.
        assert q["esperados"] == []
