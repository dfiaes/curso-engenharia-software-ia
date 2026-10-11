"""Aggregations over any iterable of Expense."""

from __future__ import annotations

import itertools
from collections.abc import Iterable
from decimal import Decimal

from expenses.model import Expense


def total_by_category(expenses: Iterable[Expense]) -> dict[str, Decimal]:
    """Sum amounts per category; largest total first, ties broken by name."""
    totals: dict[str, Decimal] = {}
    for expense in expenses:
        totals[expense.category] = totals.get(expense.category, Decimal(0)) + expense.amount
    return dict(sorted(totals.items(), key=lambda item: (-item[1], item[0])))


def monthly_totals(expenses: Iterable[Expense]) -> dict[str, Decimal]:
    """Sum per 'YYYY-MM'. groupby only merges ADJACENT keys, hence the sort first."""

    def month(expense: Expense) -> str:
        return f"{expense.date:%Y-%m}"

    ordered = sorted(expenses, key=month)
    return {
        key: sum((e.amount for e in group), start=Decimal(0))
        for key, group in itertools.groupby(ordered, key=month)
    }


def top(totals: dict[str, Decimal], n: int) -> list[tuple[str, Decimal]]:
    """First n entries of an already ordered mapping."""
    return list(itertools.islice(totals.items(), n))
