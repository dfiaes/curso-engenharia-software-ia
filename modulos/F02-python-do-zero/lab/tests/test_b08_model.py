"""Block 8: what @dataclass(frozen=True, slots=True) gives and forbids."""

from __future__ import annotations

import dataclasses
import datetime as dt
from decimal import Decimal

import pytest

from expenses.model import Expense


@pytest.fixture
def sample() -> Expense:
    return Expense(dt.date(2026, 1, 5), "mercado", Decimal("45.90"), "feira")


def test_repr_is_generated_and_shows_every_field(sample: Expense) -> None:
    text = repr(sample)
    assert text.startswith("Expense(date=datetime.date(2026, 1, 5)")
    assert "amount=Decimal('45.90')" in text


def test_frozen_rejects_assignment(sample: Expense) -> None:
    with pytest.raises(dataclasses.FrozenInstanceError):
        sample.category = "outra"  # type: ignore[misc]


def test_slots_forbid_new_attributes(sample: Expense) -> None:
    with pytest.raises((AttributeError, TypeError)):
        sample.extra = 1  # type: ignore[attr-defined]


def test_replace_builds_a_new_object(sample: Expense) -> None:
    other = dataclasses.replace(sample, amount=Decimal("1.00"))
    assert other is not sample
    assert other != sample
    assert sample.amount == Decimal("45.90")


def test_default_description_is_not_shared_state() -> None:
    a = Expense(dt.date(2026, 1, 1), "x", Decimal(1))
    b = Expense(dt.date(2026, 1, 1), "y", Decimal(2))
    assert a.description == b.description == ""


def test_instances_are_usable_as_dict_keys(sample: Expense) -> None:
    assert {sample: 1}[dataclasses.replace(sample)] == 1
