"""B4: duas implementações de LanguageParser, corpus dourado e erros medidos."""

from pathlib import Path

import pytest

from capstone_lab.parsers import (
    LanguageParser,
    MiniLangParser,
    PythonAstParser,
    golden_corpus_check,
)

GOLDEN_DIR = Path(__file__).parents[1] / "fixtures" / "golden"

PARSERS: dict[str, LanguageParser] = {
    ".py": PythonAstParser(),
    ".mini": MiniLangParser(),
}

FIXTURES = sorted(f for f in GOLDEN_DIR.iterdir() if f.suffix in PARSERS)


def test_two_language_parsers_are_available() -> None:
    assert len({p.language_id for p in PARSERS.values()}) == 2


@pytest.mark.parametrize("fixture", FIXTURES, ids=lambda f: f.name)
def test_golden_corpus_is_reproduced_100_percent(fixture: Path) -> None:
    diffs = golden_corpus_check(fixture, PARSERS[fixture.suffix])
    assert diffs == [], f"corpus dourado divergiu: {diffs}"


def test_python_parse_error_is_measured_not_silent() -> None:
    result = PythonAstParser().parse("x.py", "def broken(:\n")
    assert len(result.errors) == 1
    assert "SyntaxError" in result.errors[0].message
    assert result.symbols == []


def test_minilang_invalid_line_is_measured_and_rest_is_preserved() -> None:
    src = "func ok(a)\nthis is garbage\ncall ok(z)\n"
    result = MiniLangParser().parse("m.mini", src)
    assert [s.name for s in result.symbols] == ["ok"]
    assert [r.target for r in result.relations] == ["ok"]
    assert len(result.errors) == 1 and result.errors[0].line == 2


def test_error_budget_of_corpus_is_measured() -> None:
    """Taxa de erro do corpus: contada, não escondida."""
    total_files = 0
    files_with_errors = 0
    for fixture in FIXTURES:
        total_files += 1
        got = PARSERS[fixture.suffix].parse(fixture.name, fixture.read_text(encoding="utf-8"))
        if got.errors:
            files_with_errors += 1
    # Oráculo do corpus: exatamente os dois fixtures 'broken' têm erros.
    assert total_files == 4
    assert files_with_errors == 2
