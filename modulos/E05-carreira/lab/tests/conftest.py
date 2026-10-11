from __future__ import annotations

from datetime import date
from pathlib import Path

import pytest

from interview_prep.models import Question, QuestionBank, Topic


class FakeClock:
    """A clock the test moves by hand."""

    def __init__(self, today: date) -> None:
        self.today = today

    def __call__(self) -> date:
        return self.today


@pytest.fixture
def clock() -> FakeClock:
    return FakeClock(date(2026, 10, 11))


def make_question(qid: str, topic: Topic = Topic.EVALS, module: str = "M06") -> Question:
    return Question(
        id=qid,
        topic=topic,
        module=module,
        question="Pergunta de teste suficientemente longa?",
        model_answer="Resposta-modelo de teste com tamanho suficiente para passar no validador.",
        criteria=["critério um", "critério dois"],
    )


@pytest.fixture
def small_bank() -> QuestionBank:
    return QuestionBank(version=1, questions=[make_question("q-a"), make_question("q-b")])


@pytest.fixture
def examples_dir() -> Path:
    return Path(__file__).resolve().parent.parent / "examples"
