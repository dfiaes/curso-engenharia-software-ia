"""Corpus e store compartilhados pelos testes (fixture, sem serviços)."""

from __future__ import annotations

from collections.abc import Sequence
from pathlib import Path

from retrieval_lab.chunking import dividir_estrutural
from retrieval_lab.embeddings import FakeEmbedder
from retrieval_lab.ingest import coletar
from retrieval_lab.rerank import Rerankeado
from retrieval_lab.store import DocIndexado, Hit, Store

LAB = Path(__file__).resolve().parent.parent
CORPUS = LAB / "corpus" / "legado_demo"


def montar_store(tenant_acme: str = "acme") -> tuple[Store, FakeEmbedder]:
    """Indexa o corpus: acme tudo menos globex; globex só globex.py."""
    embedder = FakeEmbedder()
    store = Store(embedder)
    arquivos, _relatorio = coletar(CORPUS)
    for arquivo in arquivos:
        fonte = arquivo.read_text(encoding="utf-8")
        tenant = "globex" if arquivo.name == "globex.py" else tenant_acme
        for chunk in dividir_estrutural(arquivo.name, fonte):
            store.indexar(chunk, tenant)
    return store, embedder


def ids(hits: Sequence[Hit] | Sequence[Rerankeado]) -> list[str]:
    """Ids estáveis dos hits ou rerankeados."""
    return [h.doc.chunk.id_estavel for h in hits]


def doc_ids(docs: Sequence[DocIndexado]) -> list[str]:
    """Ids estáveis de documentos (listas léxicas/vetoriais)."""
    return [d.chunk.id_estavel for d in docs]
