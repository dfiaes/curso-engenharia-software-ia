"""Oraculo AT-018: base continua sem marcador; template errado e diagnosticado.

Limite honesto: MARCADORES registra 1 familia; o ramo 'template-errado'
exige >= 2 familias e e exercitado com familia extra injetada no teste
(monkeypatch, sem tocar o contrato). Cross-family real com servidores
pertence aos lotes B07/B08.
"""

import pytest

from template_chat import MARCADORES, detectar_base_vs_instruct, diagnosticar_template, renderizar


def test_renderizar_monta_marcadores_e_fecha_com_assistant() -> None:
    texto = renderizar([("system", "s"), ("user", "u")], "familia-a")
    assert texto.count("<|im_start|>") == 3
    assert texto.count("<|im_end|>") == 2
    assert texto.endswith("<|im_start|>assistant\n")
    assert "s" in texto and "u" in texto


def test_texto_puro_e_base() -> None:
    assert detectar_base_vs_instruct("texto puro sem marcador", "familia-a") == "base"
    assert diagnosticar_template("texto puro sem marcador", "familia-a") == "base-sem-template"


def test_template_proprio_e_ok() -> None:
    texto = renderizar([("user", "u")], "familia-a")
    assert detectar_base_vs_instruct(texto, "familia-a") == "instruct"
    assert diagnosticar_template(texto, "familia-a") == "ok"


def test_marcador_de_outra_familia_e_template_errado(monkeypatch: pytest.MonkeyPatch) -> None:
    """AT-018 negativo: marcador estranho com familia declarada = errado."""
    monkeypatch.setitem(MARCADORES, "familia-b", {"inicio": "<|b_start|>", "fim": "<|b_end|>"})
    texto = renderizar([("user", "u")], "familia-a") + "<|b_start|>user\nx<|b_end|>"
    assert diagnosticar_template(texto, "familia-a") == "template-errado"
