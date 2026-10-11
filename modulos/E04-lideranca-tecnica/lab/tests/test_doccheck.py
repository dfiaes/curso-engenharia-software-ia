from __future__ import annotations

from pathlib import Path

import pytest

from leadkit.doccheck import SPECS, check, normalize

ROOT = Path(__file__).resolve().parent.parent
GOOD_PM = """# Postmortem: fila travada

## Resumo
A fila de conciliação parou por 2 h após o deploy de terça.

## Impacto
1.200 conciliações atrasadas.

## Linha do tempo
- 14:02 deploy

## Causas contribuintes
O teste de carga não cobre mensagens acima de 1 MB e o alerta de fila só dispara após 30 min.

## O que funcionou
Rollback em 6 minutos.

## Ações
- Adicionar mensagem de 2 MB ao teste de carga @ana 2026-10-30
"""


def codes(kind: str, text: str) -> list[str]:
    return [f.code for f in check(kind, text)]


def test_good_sbi_example_passes() -> None:
    text = (ROOT / "exemplos" / "sbi-bom.md").read_text(encoding="utf-8")
    assert check("sbi", text) == []


def test_bad_sbi_example_is_flagged_for_judgment_placeholder_and_all() -> None:
    text = (ROOT / "exemplos" / "sbi-ruim.md").read_text(encoding="utf-8")
    found = codes("sbi", text)
    assert "julgamento" in found
    assert "placeholder" in found
    assert "secao-vazia" in found


def test_good_postmortem_passes() -> None:
    assert check("postmortem", GOOD_PM) == []


def test_bad_postmortem_example_flags_blame_and_ownerless_actions() -> None:
    text = (ROOT / "exemplos" / "postmortem-ruim.md").read_text(encoding="utf-8")
    found = check("postmortem", text)
    assert [f.code for f in found].count("julgamento") == 2
    assert [f.code for f in found].count("acao-sem-dono-ou-prazo") == 2


def test_missing_section_is_reported_once_at_line_one() -> None:
    text = GOOD_PM.replace(
        "## Resumo\nA fila de conciliação parou por 2 h após o deploy de terça.\n", ""
    )
    findings = check("postmortem", text)
    assert [(f.line, f.code) for f in findings] == [(1, "secao-ausente")]


def test_headings_match_without_accents_and_case() -> None:
    assert normalize("Situação") == "situacao"
    text = "## SITUACAO\nx\n## comportamento\ny\n## Impacto\nz\n## Pedido\nw\n"
    assert check("sbi", text) == []


def test_todo_inside_html_comment_is_ignored() -> None:
    text = GOOD_PM.replace(
        "# Postmortem: fila travada", "# Postmortem: fila travada\n<!-- TODO ignorado -->"
    )
    assert check("postmortem", text) == []


def test_rfc_needs_two_alternatives() -> None:
    rfc = (
        "## Contexto\na\n## Proposta\nb\n## Alternativas\n- só uma\n"
        "## Riscos e reversibilidade\nd\n## Perguntas em aberto\ne\n## Decisão\nf\n"
    )
    assert codes("rfc", rfc) == ["poucos-itens"]
    assert codes("rfc", rfc.replace("- só uma", "- uma\n- duas")) == []


@pytest.mark.parametrize(
    ("kind", "name"),
    [
        ("rfc", "rfc.md"),
        ("sbi", "feedback-sbi.md"),
        ("postmortem", "postmortem.md"),
    ],
)
def test_negative_control_untouched_templates_fail(kind: str, name: str) -> None:
    text = (ROOT / "templates" / name).read_text(encoding="utf-8")
    assert "placeholder" in codes(kind, text)


def test_every_spec_has_a_template_and_every_template_exists() -> None:
    assert set(SPECS) == {"rfc", "sbi", "postmortem"}
    for name in (
        "rfc.md",
        "design-review.md",
        "one-on-one.md",
        "feedback-sbi.md",
        "checklist-review-ia.md",
        "postmortem.md",
    ):
        assert (ROOT / "templates" / name).is_file()


@pytest.mark.parametrize(
    ("kind", "name"), [("rfc", "rfc-bom.md"), ("postmortem", "postmortem-bom.md")]
)
def test_reference_documents_pass(kind: str, name: str) -> None:
    text = (ROOT / "exemplos" / name).read_text(encoding="utf-8")
    assert check(kind, text) == []
