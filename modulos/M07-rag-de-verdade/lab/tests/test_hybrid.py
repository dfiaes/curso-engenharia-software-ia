"""Híbrida: léxico acha identificador, vetor acha conceito, RRF une (AT-002/006)."""

from __future__ import annotations

from conftest import doc_ids, ids, montar_store


def test_literal_vence_no_lexico() -> None:
    store, _ = montar_store()
    top = store.buscar_lexico("onde está CalcularJurosCompostosV2", "acme", k=5)
    assert doc_ids(top)[0] == "cobranca.py::calcular_juros_compostos_v2"


def test_conceitual_alcanca_no_vetorial() -> None:
    store, _ = montar_store()
    top = store.buscar_vetorial(
        "como o sistema calcula juros compostos com taxa mensal", "acme", k=5
    )
    assert "cobranca.py::calcular_juros_compostos_v2" in doc_ids(top)


def test_hibrida_une_os_dois_mundos() -> None:
    store, _ = montar_store()
    consultas = [
        ("onde está CalcularJurosCompostosV2", "cobranca.py::calcular_juros_compostos_v2"),
        (
            "como o sistema calcula juros compostos com taxa mensal",
            "cobranca.py::calcular_juros_compostos_v2",
        ),
        ("como a entrada do usuário é validada", "cobranca.py::validar_entrada"),
    ]
    for texto, esperado in consultas:
        lex = doc_ids(store.buscar_lexico(texto, "acme", k=5))
        vec = doc_ids(store.buscar_vetorial(texto, "acme", k=5))
        hibr = ids(store.buscar_hibrido(texto, "acme", k=5))
        assert esperado in hibr, (texto, hibr)
        assert esperado in lex or esperado in vec
