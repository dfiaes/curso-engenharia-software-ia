"""Chunking: estrutural preserva unidade; fixo corta; id é estável (AT-003/004)."""

from __future__ import annotations

from pathlib import Path

from retrieval_lab.chunking import dividir_estrutural, dividir_fixo

CORPUS = Path(__file__).resolve().parent.parent / "corpus" / "legado_demo"
FONTE = (CORPUS / "cobranca.py").read_text(encoding="utf-8")


def test_estrutural_uma_unidade_por_chunk() -> None:
    chunks = dividir_estrutural("cobranca.py", FONTE)
    simbolos = {c.simbolo for c in chunks}
    assert {
        "Cliente",
        "validar_entrada",
        "calcular_juros_compostos_v2",
        "salvar_pedido",
    } <= simbolos
    calc = next(c for c in chunks if c.simbolo == "calcular_juros_compostos_v2")
    assert calc.linha_ini == 20 and calc.linha_fim == 25
    assert "def calcular_juros_compostos_v2" in calc.texto


def test_fixo_corta_no_meio() -> None:
    chunks = dividir_fixo("cobranca.py", FONTE, tamanho=6, overlap=1)
    cortado = [
        c
        for c in chunks
        if "def calcular_juros_compostos_v2" in c.texto and "round(" not in c.texto
    ]
    assert cortado, "fixo pequeno deveria cortar a função"


def test_id_estavel_sobrevive_a_mudanca_de_linha() -> None:
    deslocada = "# comentário novo\n" + FONTE
    antes = {c.id_estavel: c.linha_ini for c in dividir_estrutural("cobranca.py", FONTE)}
    depois = {c.id_estavel: c.linha_ini for c in dividir_estrutural("cobranca.py", deslocada)}
    assert set(antes) == set(depois)
    assert depois["cobranca.py::validar_entrada"] == antes["cobranca.py::validar_entrada"] + 1
