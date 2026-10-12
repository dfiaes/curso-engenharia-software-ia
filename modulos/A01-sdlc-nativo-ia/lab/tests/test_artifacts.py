from __future__ import annotations

import shutil
from pathlib import Path

from sdlc_kit.artifacts import (
    check_chain,
    parse_document,
    validate_intent,
    validate_plan,
    validate_spec,
    validate_tree,
)
from tests.conftest import EXAMPLES

INTENT = (EXAMPLES / "docs/intent/INT-001-exportar-extrato.md").read_text(encoding="utf-8")
SPEC = (EXAMPLES / "docs/specs/SPEC-001-exportar-extrato.md").read_text(encoding="utf-8")
PLAN = (EXAMPLES / "docs/plans/PLAN-001-exportar-extrato.md").read_text(encoding="utf-8")


def codes(findings: list) -> list[str]:  # type: ignore[type-arg]
    return [f.code for f in findings]


def test_examples_are_clean_end_to_end() -> None:
    assert validate_tree(EXAMPLES) == []


def test_parse_document_reads_meta_and_sections() -> None:
    doc = parse_document(INTENT, "x.md")
    assert doc.meta["id"] == "INT-001"
    assert "problema" in doc.sections and doc.sections["questões em aberto"] == "Nenhuma."


def test_parse_document_without_front_matter_does_not_raise() -> None:
    doc = parse_document("# sem nada\n\ntexto")
    assert doc.meta == {} and doc.sections == {}
    assert "FM_ID" in codes(validate_intent(doc))


def test_intent_missing_section_is_reported() -> None:
    text = INTENT.replace("## Restrições", "## Outra coisa")
    assert "INTENT_MISSING_SECTION" in codes(validate_intent(parse_document(text)))


def test_intent_empty_section_is_reported() -> None:
    text = INTENT.replace(
        "Dados pessoais só do próprio titular; arquivo gerado em até 10 s para 12 meses.", ""
    )
    assert "INTENT_EMPTY_SECTION" in codes(validate_intent(parse_document(text)))


def test_duplicate_section_is_reported() -> None:
    text = INTENT + "\n## Problema\n\noutra vez\n"
    assert "INTENT_DUPLICATE_SECTION" in codes(validate_intent(parse_document(text)))


def test_intent_bad_id_and_status() -> None:
    text = INTENT.replace("id: INT-001", "id: X1").replace("status: accepted", "status: ok")
    found = codes(validate_intent(parse_document(text)))
    assert "FM_ID" in found and "FM_STATUS" in found


def test_accepted_intent_cannot_have_open_questions() -> None:
    text = INTENT.replace("Nenhuma.", "- Quem aprova o limite de 12 meses?")
    assert "INTENT_OPEN_QUESTIONS" in codes(validate_intent(parse_document(text)))


def test_draft_intent_may_have_open_questions() -> None:
    text = INTENT.replace("status: accepted", "status: draft").replace("Nenhuma.", "- Quem aprova?")
    assert validate_intent(parse_document(text)) == []


def test_spec_requirement_without_acceptance_criterion() -> None:
    text = SPEC.replace(
        "- AC3 (R3): dado o token do cliente A e a conta do cliente B, a resposta é 403.", ""
    )
    found = validate_spec(parse_document(text))
    assert [f.message for f in found if f.code == "SPEC_REQ_WITHOUT_AC"] == [
        "R3 não tem critério de aceite"
    ]


def test_spec_acceptance_cites_unknown_requirement() -> None:
    text = SPEC.replace("- AC1 (R1):", "- AC1 (R9):")
    found = codes(validate_spec(parse_document(text)))
    assert "SPEC_AC_UNKNOWN_REQ" in found and "SPEC_REQ_WITHOUT_AC" in found


def test_spec_without_parseable_requirements() -> None:
    text = SPEC.replace("- R1:", "* R1 -").replace("- R2:", "* R2 -").replace("- R3:", "* R3 -")
    assert "SPEC_NO_REQUIREMENTS" in codes(validate_spec(parse_document(text)))


def test_spec_intent_reference_must_have_the_right_shape() -> None:
    text = SPEC.replace("intent: INT-001", "intent: pedido-do-ana")
    assert "FM_REF" in codes(validate_spec(parse_document(text)))


def test_plan_without_steps() -> None:
    text = PLAN.replace("- S1 (R1, R2):", "- fazer").replace("- S2 (R3):", "- fazer mais")
    assert "PLAN_NO_STEPS" in codes(validate_plan(parse_document(text)))


def test_chain_ok_for_examples() -> None:
    chain = check_chain(parse_document(INTENT), parse_document(SPEC), parse_document(PLAN))
    assert chain == []


def test_chain_spec_points_to_other_intent() -> None:
    spec = parse_document(SPEC.replace("intent: INT-001", "intent: INT-002"))
    found = codes(check_chain(parse_document(INTENT), spec, parse_document(PLAN)))
    assert "CHAIN_SPEC_INTENT" in found


def test_chain_intent_not_accepted() -> None:
    intent = parse_document(INTENT.replace("status: accepted", "status: draft"))
    found = codes(check_chain(intent, parse_document(SPEC), parse_document(PLAN)))
    assert found == ["CHAIN_INTENT_NOT_ACCEPTED"]


def test_chain_requirement_without_step_and_step_with_unknown_requirement() -> None:
    plan = parse_document(PLAN.replace("- S2 (R3):", "- S2 (R7):"))
    found = codes(check_chain(parse_document(INTENT), parse_document(SPEC), plan))
    assert "CHAIN_REQ_WITHOUT_STEP" in found and "CHAIN_STEP_UNKNOWN_REQ" in found


def test_chain_requirement_without_proving_test() -> None:
    plan = parse_document(PLAN.replace("- R3: teste de acesso cruzado entre titulares.", ""))
    found = check_chain(parse_document(INTENT), parse_document(SPEC), plan)
    assert [f.code for f in found] == ["PLAN_UNPROVEN_REQUIREMENT"]
    assert "R3" in found[0].message


def _copy_examples(tmp_path: Path) -> Path:
    dest = tmp_path / "ex"
    shutil.copytree(EXAMPLES / "docs", dest / "docs")
    return dest


def test_tree_orphan_spec_and_plan(tmp_path: Path) -> None:
    root = _copy_examples(tmp_path)
    (root / "docs/intent/INT-001-exportar-extrato.md").unlink()
    found = codes(validate_tree(root))
    assert found == ["CHAIN_ORPHAN_SPEC"]
    (root / "docs/specs/SPEC-001-exportar-extrato.md").unlink()
    assert codes(validate_tree(root)) == ["CHAIN_ORPHAN_PLAN"]


def test_tree_reports_paths_relative_to_root(tmp_path: Path) -> None:
    root = _copy_examples(tmp_path)
    plan = root / "docs/plans/PLAN-001-exportar-extrato.md"
    plan.write_text(
        plan.read_text(encoding="utf-8").replace("## Riscos", "## Riscs"), encoding="utf-8"
    )
    found = validate_tree(root)
    assert found and all(f.path == "docs/plans/PLAN-001-exportar-extrato.md" for f in found)


def test_empty_tree_is_valid(tmp_path: Path) -> None:
    assert validate_tree(tmp_path) == []
