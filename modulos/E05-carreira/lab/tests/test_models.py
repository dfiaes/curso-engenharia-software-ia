from __future__ import annotations

import json
from pathlib import Path
from typing import Any

import pytest

from interview_prep.models import (
    BankError,
    Question,
    QuestionBank,
    Topic,
    coverage_problems,
    load_bank,
    parse_bank,
)
from tests.conftest import make_question

VALID: dict[str, Any] = {
    "id": "q-ok",
    "topic": "evals",
    "module": "M06",
    "question": "Uma pergunta válida e longa o bastante?",
    "model_answer": "Uma resposta-modelo válida, com tamanho suficiente para o validador.",
    "criteria": ["primeiro", "segundo"],
}


def bank_json(*questions: dict[str, Any]) -> str:
    return json.dumps({"version": 1, "questions": list(questions)})


def test_valid_question_parses() -> None:
    bank = parse_bank(bank_json(VALID))
    assert bank.questions[0].topic is Topic.EVALS


@pytest.mark.parametrize(
    ("field", "value"),
    [
        ("module", "M99"),
        ("topic", "culinaria"),
        ("id", "Id Inválido"),
        ("criteria", ["só um"]),
        ("criteria", ["bom", "   "]),
        ("question", "curta"),
        ("model_answer", "x" * 801),
    ],
)
def test_invalid_field_is_rejected(field: str, value: object) -> None:
    broken = {**VALID, field: value}
    with pytest.raises(BankError):
        parse_bank(bank_json(broken))


def test_unknown_field_is_rejected() -> None:
    with pytest.raises(BankError):
        parse_bank(bank_json({**VALID, "extra": 1}))


def test_duplicate_ids_are_rejected() -> None:
    with pytest.raises(BankError, match="duplicate question ids: q-ok"):
        parse_bank(bank_json(VALID, VALID))


def test_invalid_json_and_missing_file(tmp_path: Path) -> None:
    with pytest.raises(BankError, match="invalid JSON"):
        parse_bank("{not json")
    with pytest.raises(BankError, match="cannot read bank"):
        load_bank(tmp_path / "nope.json")


def test_questions_are_immutable() -> None:
    question = make_question("q-a")
    with pytest.raises(ValueError, match="frozen"):
        question.id = "outro"  # type: ignore[misc]


def test_coverage_flags_small_and_uneven_bank(small_bank: QuestionBank) -> None:
    problems = coverage_problems(small_bank)
    assert any("only 2 questions" in p for p in problems)
    assert any("'rag'" in p for p in problems)


def test_coverage_accepts_enough_questions() -> None:
    questions = [make_question(f"q-{topic.value}-{i}", topic) for topic in Topic for i in range(2)]
    bank = QuestionBank(version=1, questions=questions)
    assert coverage_problems(bank, min_questions=10) == []


def test_bundled_bank_meets_the_course_rules() -> None:
    bank = load_bank()
    assert len(bank.questions) >= 40
    assert coverage_problems(bank) == []
    assert all(isinstance(q, Question) for q in bank.questions)


def test_bundled_bank_negative_control() -> None:
    """Dropping one topic from the real bank must be detected."""
    bank = load_bank()
    kept = [q for q in bank.questions if q.topic is not Topic.RAG]
    problems = coverage_problems(QuestionBank(version=1, questions=kept))
    assert any("'rag'" in p for p in problems)
