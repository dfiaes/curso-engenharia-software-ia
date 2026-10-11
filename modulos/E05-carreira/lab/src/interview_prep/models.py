"""Question bank: schema validated at the boundary, coverage rules on top."""

from __future__ import annotations

import json
from collections import Counter
from enum import StrEnum
from importlib import resources
from pathlib import Path
from typing import Self

from pydantic import BaseModel, ConfigDict, Field, ValidationError, field_validator, model_validator

KNOWN_MODULES: frozenset[str] = frozenset(
    {
        "F01", "F02", "F03", "F04", "F05",
        "M00", "M01", "M02", "M02A", "M03", "M04", "M05", "M06", "M07",
        "M08", "M09", "M10", "M11", "M12", "M13",
        "S01", "P01", "LT01", "LT02", "LT03", "LT04",
        "E01", "E02", "E03", "E04", "E05",
    }
)  # fmt: skip

MIN_QUESTIONS = 40
MIN_PER_TOPIC = 2


class BankError(ValueError):
    """The bank file is unreadable or violates the schema."""


class Topic(StrEnum):
    EVALS = "evals"
    RAG = "rag"
    AGENTES = "agentes"
    CUSTO_LATENCIA = "custo-latencia"
    SEGURANCA = "seguranca"
    ADAPTACAO = "adaptacao-de-modelos"
    PRODUCAO = "producao"
    SYSTEM_DESIGN = "system-design"
    ENGENHARIA = "engenharia"
    LIDERANCA = "lideranca"
    COMPORTAMENTAL = "comportamental"


class Question(BaseModel):
    model_config = ConfigDict(frozen=True, extra="forbid")

    id: str = Field(pattern=r"^[a-z0-9]+(-[a-z0-9]+)*$", max_length=40)
    topic: Topic
    module: str
    question: str = Field(min_length=15, max_length=400)
    model_answer: str = Field(min_length=40, max_length=800)
    criteria: list[str] = Field(min_length=2, max_length=5)

    @field_validator("module")
    @classmethod
    def _module_exists(cls, value: str) -> str:
        if value not in KNOWN_MODULES:
            raise ValueError(f"unknown module {value!r}")
        return value

    @field_validator("criteria")
    @classmethod
    def _criteria_not_blank(cls, value: list[str]) -> list[str]:
        if any(not item.strip() for item in value):
            raise ValueError("criteria must not contain blank items")
        return value


class QuestionBank(BaseModel):
    model_config = ConfigDict(frozen=True, extra="forbid")

    version: int = Field(ge=1)
    questions: list[Question] = Field(min_length=1)

    @model_validator(mode="after")
    def _unique_ids(self) -> Self:
        counts = Counter(q.id for q in self.questions)
        repeated = sorted(qid for qid, n in counts.items() if n > 1)
        if repeated:
            raise ValueError(f"duplicate question ids: {', '.join(repeated)}")
        return self

    def by_id(self) -> dict[str, Question]:
        return {q.id: q for q in self.questions}


def parse_bank(raw: str) -> QuestionBank:
    try:
        return QuestionBank.model_validate(json.loads(raw))
    except json.JSONDecodeError as exc:
        raise BankError(f"invalid JSON: {exc}") from exc
    except ValidationError as exc:
        raise BankError(str(exc)) from exc


def load_bank(path: Path | None = None) -> QuestionBank:
    """Load the bundled bank, or the one at ``path``."""
    try:
        if path is None:
            raw = (
                resources.files("interview_prep")
                .joinpath("data", "questions.json")
                .read_text(encoding="utf-8")
            )
        else:
            raw = path.read_text(encoding="utf-8")
    except OSError as exc:
        raise BankError(f"cannot read bank: {exc}") from exc
    return parse_bank(raw)


def coverage_problems(
    bank: QuestionBank,
    *,
    min_questions: int = MIN_QUESTIONS,
    min_per_topic: int = MIN_PER_TOPIC,
) -> list[str]:
    """Rules about the bank as a whole; the schema cannot express them."""
    problems: list[str] = []
    total = len(bank.questions)
    if total < min_questions:
        problems.append(f"only {total} questions, need at least {min_questions}")
    per_topic = Counter(q.topic for q in bank.questions)
    for topic in Topic:
        if per_topic[topic] < min_per_topic:
            problems.append(
                f"topic {topic.value!r} has {per_topic[topic]} questions, need {min_per_topic}"
            )
    return problems
