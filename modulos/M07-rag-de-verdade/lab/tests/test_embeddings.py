"""Embeddings: determinismo, limites e migração (AT-001/002/015)."""

from __future__ import annotations

from retrieval_lab.embeddings import FakeEmbedder, cosseno


def test_deterministico_mesmo_texto_modelo() -> None:
    emb = FakeEmbedder("fake-emb-1")
    assert emb.embed("validar entrada") == emb.embed("validar entrada")
    assert abs(cosseno(emb.embed("x"), emb.embed("x")) - 1.0) < 1e-9


def test_negacao_nao_se_distingue() -> None:
    """Limite do vetor: 'com' e 'sem' quase empatam — antídoto é estrutural."""
    emb = FakeEmbedder()
    q = emb.embed("métodos que validam a entrada")
    a = emb.embed("método que valida a entrada do usuário")
    b = emb.embed("método que não valida a entrada do usuário")
    assert abs(cosseno(q, a) - cosseno(q, b)) < 0.3


def test_modelo_distinto_e_incompativel() -> None:
    """Migração: vetores de outro modelo não se comparam (blue-green)."""
    a = FakeEmbedder("fake-emb-1")
    b = FakeEmbedder("fake-emb-2")
    va, vb = a.embed("validar entrada"), b.embed("validar entrada")
    assert va != vb
    assert a.modelo != b.modelo
