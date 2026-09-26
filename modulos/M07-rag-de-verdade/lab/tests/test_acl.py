"""ACL primeiro e abstenção calibrada (AT-010..012)."""

from __future__ import annotations

import pytest
from conftest import montar_store

from retrieval_lab.pipeline import (
    LIMIAR_RERANK,
    VazamentoNaSaida,
    montar_contexto,
    verificar_saida,
)
from retrieval_lab.rerank import rerankear
from retrieval_lab.store import TenantObrigatorio


def test_tenant_obrigatorio_sem_default() -> None:
    store, _ = montar_store()
    with pytest.raises(TenantObrigatorio):
        store.buscar_hibrido("qualquer coisa", "")


def test_cross_tenant_retorna_vazio() -> None:
    store, _ = montar_store()
    assert store.buscar_hibrido("cobrar pagamento gateway", "acme") == [] or all(
        h.doc.tenant_id == "acme" for h in store.buscar_hibrido("cobrar pagamento gateway", "acme")
    )
    globex = store.buscar_hibrido("cobrar pagamento gateway", "globex")
    assert globex and all(h.doc.tenant_id == "globex" for h in globex)
    acme_ids = {h.doc.chunk.id_estavel for h in store.buscar_hibrido("cobrar", "acme", k=50)}
    assert "globex.py::PagamentoGlobexService.cobrar" not in acme_ids


def test_verificar_saida_acusa_estrangeiro() -> None:
    store, _ = montar_store()
    hits = store.buscar_hibrido("cobrar", "globex", k=5)
    assert hits
    with pytest.raises(VazamentoNaSaida, match="outro tenant"):
        verificar_saida(hits, "acme")


def test_abstem_fora_do_corpus() -> None:
    store, _ = montar_store()
    hits = store.buscar_hibrido("como configurar deploy em kubernetes", "acme", k=20)
    reranqueados = rerankear("como configurar deploy em kubernetes", hits)
    contexto = montar_contexto("como configurar deploy em kubernetes", reranqueados, "acme")
    assert contexto.abstem is True
    assert "limiar" in contexto.motivo


def test_responde_no_corpus() -> None:
    store, _ = montar_store()
    pergunta = "como o sistema calcula juros compostos com taxa mensal"
    hits = store.buscar_hibrido(pergunta, "acme", k=20)
    reranqueados = rerankear(pergunta, hits, limiar=0.0)
    contexto = montar_contexto(pergunta, reranqueados, "acme", limiar=0.0)
    assert contexto.abstem is False
    assert any(c.doc.chunk.simbolo == "calcular_juros_compostos_v2" for c in contexto.chunks)
    _ = LIMIAR_RERANK
