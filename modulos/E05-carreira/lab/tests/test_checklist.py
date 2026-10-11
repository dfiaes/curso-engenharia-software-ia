from __future__ import annotations

from pathlib import Path

from interview_prep.checklist import Status, check_readme, parse_sections


def statuses(markdown: str) -> dict[str, Status]:
    return {f.requirement.key: f.status for f in check_readme(markdown).findings}


def test_good_example_passes(examples_dir: Path) -> None:
    report = check_readme((examples_dir / "README.bom.md").read_text(encoding="utf-8"))
    assert report.passed
    assert "8/8 itens ok" in report.render()


def test_weak_example_fails_with_specific_reasons(examples_dir: Path) -> None:
    report = check_readme((examples_dir / "README.fraco.md").read_text(encoding="utf-8"))
    found = {f.requirement.key: f for f in report.findings}
    assert not report.passed
    assert found["problema"].status is Status.MISSING
    assert found["decisoes"].status is Status.MISSING
    assert found["arquitetura"].status is Status.WEAK  # too short
    assert found["avaliacao"].status is Status.WEAK
    assert found["rodar"].status is Status.WEAK


def test_evaluation_without_numbers_is_weak() -> None:
    body = " ".join(["palavra"] * 30)
    result = statuses(f"## Avaliação\n\n{body}\n")
    assert result["avaliacao"] is Status.WEAK
    result = statuses(f"## Avaliação\n\n{body} 0,86\n")
    assert result["avaliacao"] is Status.OK


def test_headings_inside_code_fences_are_ignored() -> None:
    text = "## Arquitetura\n\n```\n# Custo e latência\n```\n"
    titles = [s.title for s in parse_sections(text)]
    assert titles == ["Arquitetura"]


def test_accents_and_english_headings_match() -> None:
    body = " ".join(["word"] * 30)
    result = statuses(f"## Decisões\n\n{body}\n## Cost and latency\n\n{body} 2\n")
    assert result["decisoes"] is Status.OK
    assert result["custo"] is Status.OK


def test_subsections_count_toward_parent_body() -> None:
    body = " ".join(["palavra"] * 30)
    text = f"## Arquitetura\n\n### Componentes\n\n{body}\n\n## Outro\n"
    assert statuses(text)["arquitetura"] is Status.OK


def test_empty_readme_misses_everything() -> None:
    report = check_readme("")
    assert all(f.status is Status.MISSING for f in report.findings)
    assert not report.passed
