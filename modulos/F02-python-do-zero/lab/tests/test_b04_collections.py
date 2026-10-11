"""Block 4: dict accumulation, ordering, groupby adjacency, shallow copy."""

from __future__ import annotations

import copy
import datetime as dt
import itertools
from decimal import Decimal

from expenses.aggregate import monthly_totals, top, total_by_category
from expenses.model import Expense


def e(day: str, category: str, amount: str) -> Expense:
    return Expense(dt.date.fromisoformat(day), category, Decimal(amount))


def test_total_by_category_orders_by_total_desc_then_name() -> None:
    data = [
        e("2026-01-01", "b", "5.00"),
        e("2026-01-02", "a", "5.00"),
        e("2026-01-03", "c", "9.00"),
    ]
    assert list(total_by_category(data).items()) == [
        ("c", Decimal("9.00")),
        ("a", Decimal("5.00")),
        ("b", Decimal("5.00")),
    ]


def test_total_of_many_cents_is_exact() -> None:
    data = [e("2026-01-01", "x", "0.10")] * 30
    assert total_by_category(data)["x"] == Decimal("3.00")
    acc = 0.0
    for _ in range(30):  # a manual loop: since 3.12 sum() compensates float errors by itself
        acc += 0.1
    assert acc != 3.0


def test_empty_input_gives_empty_mapping() -> None:
    assert total_by_category([]) == {}
    assert monthly_totals([]) == {}
    assert top({}, 3) == []


def test_monthly_totals_handles_unsorted_input() -> None:
    data = [
        e("2026-02-01", "x", "1.00"),
        e("2026-01-01", "x", "2.00"),
        e("2026-02-15", "y", "3.00"),
    ]
    assert monthly_totals(data) == {"2026-01": Decimal("2.00"), "2026-02": Decimal("4.00")}


def test_groupby_without_sorting_splits_groups() -> None:
    """Negative control for monthly_totals: groupby alone does NOT merge distant keys."""
    keys = ["a", "b", "a"]
    assert [k for k, _ in itertools.groupby(keys)] == ["a", "b", "a"]
    assert [k for k, _ in itertools.groupby(sorted(keys))] == ["a", "b"]


def test_top_takes_a_prefix_without_copying_everything() -> None:
    totals = {"a": Decimal(3), "b": Decimal(2), "c": Decimal(1)}
    assert top(totals, 2) == [("a", Decimal(3)), ("b", Decimal(2))]
    assert top(totals, 10) == list(totals.items())


def test_shallow_vs_deep_copy() -> None:
    original = {"k": [1, 2]}
    shallow = copy.copy(original)
    deep = copy.deepcopy(original)
    original["k"].append(3)
    assert shallow["k"] == [1, 2, 3]
    assert deep["k"] == [1, 2]
