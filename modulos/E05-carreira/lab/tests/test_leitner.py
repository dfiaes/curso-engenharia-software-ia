from __future__ import annotations

import json
from datetime import date, timedelta
from pathlib import Path

import pytest

from interview_prep import leitner
from interview_prep.leitner import (
    INTERVAL_DAYS,
    CardState,
    Deck,
    StateError,
    StudyState,
    UnknownQuestionError,
    load_state,
    save_state,
)
from tests.conftest import FakeClock


def make_deck(clock: FakeClock, ids: list[str]) -> Deck:
    deck = Deck(StudyState(), clock)
    deck.sync(ids)
    return deck


def test_new_cards_start_in_box_1_and_are_due_today(clock: FakeClock) -> None:
    deck = make_deck(clock, ["b", "a"])
    assert deck.due_ids() == ["a", "b"]
    assert deck.state.cards["a"].box == 1


def test_correct_answers_climb_boxes_with_growing_intervals(clock: FakeClock) -> None:
    deck = make_deck(clock, ["a"])
    start = clock.today
    for expected_box in (2, 3, 4, 5):
        card = deck.review("a", correct=True)
        assert card.box == expected_box
        assert card.due == clock.today + timedelta(days=INTERVAL_DAYS[expected_box - 1])
        clock.today = card.due
    assert clock.today == start + timedelta(days=2 + 4 + 8 + 16)


def test_top_box_is_a_ceiling(clock: FakeClock) -> None:
    deck = make_deck(clock, ["a"])
    for _ in range(10):
        deck.review("a", correct=True)
    card = deck.state.cards["a"]
    assert card.box == leitner.MAX_BOX
    assert card.reviews == 10


def test_wrong_answer_returns_to_box_1_and_counts_a_lapse(clock: FakeClock) -> None:
    deck = make_deck(clock, ["a"])
    for _ in range(3):
        deck.review("a", correct=True)
    card = deck.review("a", correct=False)
    assert card.box == 1
    assert card.lapses == 1
    assert card.due == clock.today + timedelta(days=INTERVAL_DAYS[0])


def test_card_is_not_due_before_its_date_and_is_after(clock: FakeClock) -> None:
    deck = make_deck(clock, ["a"])
    deck.review("a", correct=True)
    assert deck.due_ids() == []
    clock.today += timedelta(days=INTERVAL_DAYS[1] - 1)
    assert deck.due_ids() == []
    clock.today += timedelta(days=1)
    assert deck.due_ids() == ["a"]


def test_due_ids_respect_limit_and_order(clock: FakeClock) -> None:
    deck = make_deck(clock, ["c", "a", "b"])
    deck.state.cards["c"] = CardState(box=1, due=date(2026, 10, 1))
    assert deck.due_ids(limit=2) == ["c", "a"]


def test_sync_adds_new_and_drops_removed_without_touching_progress(clock: FakeClock) -> None:
    deck = make_deck(clock, ["a", "b"])
    deck.review("a", correct=True)
    deck.sync(["a", "c"])
    assert set(deck.state.cards) == {"a", "c"}
    assert deck.state.cards["a"].box == 2


def test_unknown_question_is_an_error(clock: FakeClock) -> None:
    deck = make_deck(clock, ["a"])
    with pytest.raises(UnknownQuestionError):
        deck.review("zzz", correct=True)


def test_box_counts(clock: FakeClock) -> None:
    deck = make_deck(clock, ["a", "b", "c"])
    deck.review("a", correct=True)
    assert deck.box_counts() == {1: 2, 2: 1, 3: 0, 4: 0, 5: 0}


def test_state_roundtrip(tmp_path: Path, clock: FakeClock) -> None:
    path = tmp_path / "state.json"
    deck = make_deck(clock, ["a", "b"])
    deck.review("a", correct=True)
    save_state(path, deck.state)
    assert load_state(path) == deck.state
    assert not path.with_name("state.json.tmp").exists()


def test_missing_state_is_empty(tmp_path: Path) -> None:
    assert load_state(tmp_path / "nope.json").cards == {}


@pytest.mark.parametrize(
    "content",
    [
        "{broken",
        json.dumps({"cards": {"a": {"box": 9, "due": "2026-10-11"}}}),
        json.dumps({"cards": {"a": {"box": 1, "due": "ontem"}}}),
        json.dumps({"cards": {}, "surprise": True}),
    ],
)
def test_corrupt_state_is_an_error_not_a_silent_reset(tmp_path: Path, content: str) -> None:
    path = tmp_path / "state.json"
    path.write_text(content, encoding="utf-8")
    with pytest.raises(StateError):
        load_state(path)
    assert path.read_text(encoding="utf-8") == content


def test_failed_save_keeps_previous_state(
    tmp_path: Path, clock: FakeClock, monkeypatch: pytest.MonkeyPatch
) -> None:
    path = tmp_path / "state.json"
    deck = make_deck(clock, ["a"])
    save_state(path, deck.state)
    before = path.read_text(encoding="utf-8")
    deck.review("a", correct=True)

    def boom(src: object, dst: object) -> None:
        raise OSError("disk full")

    monkeypatch.setattr("interview_prep.leitner.os.replace", boom)
    with pytest.raises(StateError, match="disk full"):
        save_state(path, deck.state)
    assert path.read_text(encoding="utf-8") == before
    assert not path.with_name("state.json.tmp").exists()
