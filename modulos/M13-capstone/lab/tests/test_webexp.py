"""B15: render determinístico, estados, escape, a11y estrutural e Diátaxis."""

import re
from pathlib import Path

import pytest

from capstone_lab.webexp import (
    Page,
    a11y_audit,
    cli_onboarding,
    onboarding_checklist,
    render_page,
)

DOCS = Path(__file__).resolve().parent.parent / "docs" / "diataxis"


def test_render_deterministico_mesmos_bytes() -> None:
    page = Page("result", "Relatório", items=("a.py:10", "b.py:3"))
    assert render_page(page) == render_page(page)
    assert render_page(page).count("<h1") == 1


def test_conteudo_externo_escapado() -> None:
    page = Page("error", "Erro", message='<script>alert("xss")</script>')
    out = render_page(page)
    assert "<script>" not in out and "&lt;script&gt;" in out


def test_estados_empty_progress_error_result() -> None:
    assert 'role="status"' in render_page(Page("empty", "T"))
    assert 'aria-live="polite"' in render_page(Page("progress", "T", "etapa 2/4"))
    assert 'role="alert"' in render_page(Page("error", "T", "falhou"))
    assert "<li>a.py:10</li>" in render_page(Page("result", "T", items=("a.py:10",)))
    with pytest.raises(ValueError, match="estado desconhecido"):
        render_page(Page("weird", "T"))


def test_a11y_audit_aprova_paginas_e_reprova_violacoes() -> None:
    for state in ("empty", "progress", "error", "result"):
        assert a11y_audit(render_page(Page(state, "T", "m", ("i",)))) == []
    bad = "<html><body><h1>A</h1><h1>B</h1><img src='x.png'><input type='text'></body></html>"
    violations = a11y_audit(bad)
    assert any("lang" in v for v in violations)
    assert any("h1" in v for v in violations)
    assert any("img sem alt" in v for v in violations)
    assert any("input sem label" in v for v in violations)


def test_onboarding_deterministico_e_completo() -> None:
    steps = onboarding_checklist()
    assert steps == onboarding_checklist()
    assert [s.split(":")[0] for s in steps] == [
        "cadastro",
        "ingestão",
        "primeira pergunta",
        "relatório",
    ]
    out = cli_onboarding()
    assert out == cli_onboarding() and out.count("\n") == 5


def test_diataxis_quatro_tipos_presentes() -> None:
    expected = {
        "tutorial.md": "tutorial",
        "howto-primeira-pergunta.md": "how-to",
        "reference-cli.md": "reference",
        "explanation-arquitetura.md": "explanation",
    }
    for filename, dtype in expected.items():
        text = (DOCS / filename).read_text(encoding="utf-8")
        assert re.search(rf"^tipo: {dtype}$", text, re.M), f"{filename} sem tipo {dtype}"
