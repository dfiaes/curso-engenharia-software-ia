"""Leitner system: five boxes, growing intervals, injectable clock, atomic JSON state."""

from __future__ import annotations

import os
from collections.abc import Callable, Iterable
from datetime import date, timedelta
from pathlib import Path

from pydantic import BaseModel, ConfigDict, Field, ValidationError

INTERVAL_DAYS: tuple[int, ...] = (1, 2, 4, 8, 16)
MAX_BOX = len(INTERVAL_DAYS)

Clock = Callable[[], date]


class StateError(ValueError):
    """The state file is unreadable or invalid."""


class UnknownQuestionError(LookupError):
    """A review referred to a question that is not in the deck."""


class CardState(BaseModel):
    model_config = ConfigDict(extra="forbid")

    box: int = Field(ge=1, le=MAX_BOX)
    due: date
    reviews: int = Field(default=0, ge=0)
    lapses: int = Field(default=0, ge=0)
    last_reviewed: date | None = None


class StudyState(BaseModel):
    model_config = ConfigDict(extra="forbid")

    version: int = 1
    cards: dict[str, CardState] = Field(default_factory=dict)


class Deck:
    def __init__(self, state: StudyState, clock: Clock) -> None:
        self.state = state
        self._clock = clock

    def sync(self, question_ids: Iterable[str]) -> None:
        """Add new questions in box 1 (due today); drop cards whose question is gone."""
        ids = set(question_ids)
        today = self._clock()
        for qid in sorted(ids - self.state.cards.keys()):
            self.state.cards[qid] = CardState(box=1, due=today)
        for qid in self.state.cards.keys() - ids:
            del self.state.cards[qid]

    def due_ids(self, limit: int | None = None) -> list[str]:
        today = self._clock()
        due = [(c.due, c.box, qid) for qid, c in self.state.cards.items() if c.due <= today]
        ordered = [qid for _, _, qid in sorted(due)]
        return ordered if limit is None else ordered[:limit]

    def review(self, question_id: str, *, correct: bool) -> CardState:
        card = self.state.cards.get(question_id)
        if card is None:
            raise UnknownQuestionError(question_id)
        today = self._clock()
        box = min(card.box + 1, MAX_BOX) if correct else 1
        updated = card.model_copy(
            update={
                "box": box,
                "due": today + timedelta(days=INTERVAL_DAYS[box - 1]),
                "reviews": card.reviews + 1,
                "lapses": card.lapses + (0 if correct else 1),
                "last_reviewed": today,
            }
        )
        self.state.cards[question_id] = updated
        return updated

    def box_counts(self) -> dict[int, int]:
        counts = dict.fromkeys(range(1, MAX_BOX + 1), 0)
        for card in self.state.cards.values():
            counts[card.box] += 1
        return counts


def load_state(path: Path) -> StudyState:
    """A missing file is an empty state; a corrupt one is an error, never silently reset."""
    if not path.exists():
        return StudyState()
    try:
        return StudyState.model_validate_json(path.read_text(encoding="utf-8"))
    except (OSError, ValidationError) as exc:
        raise StateError(f"cannot load state {path}: {exc}") from exc


def save_state(path: Path, state: StudyState) -> None:
    """Write to a temp file and rename, so a crash never leaves a half-written state."""
    tmp = path.with_name(path.name + ".tmp")
    try:
        tmp.write_text(state.model_dump_json(indent=2) + "\n", encoding="utf-8")
        os.replace(tmp, path)
    except OSError as exc:
        tmp.unlink(missing_ok=True)
        raise StateError(f"cannot save state {path}: {exc}") from exc
