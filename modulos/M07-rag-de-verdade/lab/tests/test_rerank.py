"""Rerank: ganho medido, limiar calibrado, routing sem LLM (AT-007..009)."""

from __future__ import annotations

from conftest import ids, montar_store

from retrieval_lab.eval_retrieval import recall_at_k
from retrieval_lab.rerank import calibrar_limiar, pontuar, rerankear, rotear


def test_rerank_melhora_recall() -> None:
    store, _ = montar_store()
    pergunta = "como o sistema calcula juros compostos com taxa mensal"
    esperado = {"cobranca.py::calcular_juros_compostos_v2"}
    base = ids(store.buscar_hibrido(pergunta, "acme", k=20))
    sem = recall_at_k(base, esperado, k=5)
    com = recall_at_k(
        ids(rerankear(pergunta, store.buscar_hibrido(pergunta, "acme", k=20))), esperado, k=5
    )
    assert com >= sem
    assert com == 1.0


def test_limiar_calibrado_no_corpus() -> None:
    store, _ = montar_store()
    hits = store.buscar_hibrido(
        "como o sistema calcula juros compostos com taxa mensal", "acme", k=20
    )
    positivos = [
        pontuar("como o sistema calcula juros compostos com taxa mensal", h.doc) for h in hits[:1]
    ]
    negativos = [pontuar("assunto inexistente zzz", h.doc) for h in hits[:5]]
    limiar = calibrar_limiar(positivos, negativos)
    assert min(positivos) >= limiar > max(negativos)


def test_pontuar_bonus_de_simbolo() -> None:
    store, _ = montar_store()
    hits = store.buscar_hibrido("onde está validar_entrada", "acme", k=20)
    doc_alvo = next(h.doc for h in hits if h.doc.chunk.simbolo == "validar_entrada")
    doc_outro = next(h.doc for h in hits if h.doc.chunk.simbolo != "validar_entrada")
    assert pontuar("onde está validar_entrada", doc_alvo) > pontuar(
        "onde está validar_entrada", doc_outro
    )


def test_roteamento_deterministico() -> None:
    assert rotear("onde está CalcularJurosCompostosV2") == "lexica"
    assert rotear("o que quebra se eu mudar salvar_pedido") == "grafo"
    assert rotear("como o sistema calcula juros") == "hibrida"
