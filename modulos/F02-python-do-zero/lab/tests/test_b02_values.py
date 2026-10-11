"""Block 2: float vs Decimal, identity vs equality, Unicode."""

from __future__ import annotations

import datetime as dt
import unicodedata
from decimal import Decimal

import pytest

from expenses.errors import InvalidRowError
from expenses.model import Expense
from expenses.parsing import normalize_category, parse_amount


def test_float_drifts_and_decimal_does_not() -> None:
    """Negative control: proves the Decimal tests below are not vacuous."""
    assert 0.1 + 0.2 != 0.3
    assert Decimal("0.1") + Decimal("0.2") == Decimal("0.3")


@pytest.mark.parametrize(
    ("text", "expected"),
    [("12", "12.00"), ("12.5", "12.50"), ("12,50", "12.50"), (" 0,05 ", "0.05"), ("007.1", "7.10")],
)
def test_parse_amount_accepts_both_separators(text: str, expected: str) -> None:
    assert parse_amount(1, text) == Decimal(expected)
    assert str(parse_amount(1, text)) == expected


@pytest.mark.parametrize(
    "text", ["", "abc", "-5", "1e3", "NaN", "Infinity", "1.234,50", "1,234.50", "1.005", "٣٤"]
)
def test_parse_amount_rejects_ambiguous_or_exotic_input(text: str) -> None:
    with pytest.raises(InvalidRowError) as info:
        parse_amount(7, text)
    assert info.value.line == 7
    assert info.value.field == "amount"


def test_zero_is_rejected() -> None:
    with pytest.raises(InvalidRowError, match="maior que zero"):
        parse_amount(2, "0,00")


def test_category_normalization_unifies_nfc_and_nfd() -> None:
    composed = "Alimentação"
    decomposed = unicodedata.normalize("NFD", composed)
    assert composed != decomposed
    assert len(composed) != len(decomposed)
    assert normalize_category(composed) == normalize_category(decomposed) == "alimentação"
    assert normalize_category("  Casa   e\tJardim ") == "casa e jardim"


def test_equality_is_by_value_not_identity() -> None:
    a = Expense(dt.date(2026, 1, 1), "x", Decimal("1.00"))
    b = Expense(dt.date(2026, 1, 1), "x", Decimal("1.00"))
    assert a == b
    assert a is not b
    assert hash(a) == hash(b)
