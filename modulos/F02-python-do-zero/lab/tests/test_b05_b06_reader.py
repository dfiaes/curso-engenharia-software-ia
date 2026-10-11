"""Blocks 5-7: lazy generators, explicit encoding, error values, file system."""

from __future__ import annotations

import datetime as dt
import inspect
from decimal import Decimal
from pathlib import Path

import pytest

from expenses.errors import (
    EncodingMismatchError,
    ExpensesError,
    InvalidRowError,
    MissingColumnError,
)
from expenses.model import Expense
from expenses.reader import read_expenses, scan

from .conftest import CsvFactory


def test_scan_is_a_generator_and_does_not_open_the_file_early(tmp_path: Path) -> None:
    gen = scan(tmp_path / "does-not-exist.csv")
    assert inspect.isgenerator(gen)  # no FileNotFoundError yet: nothing ran
    with pytest.raises(FileNotFoundError):
        next(gen)


def test_happy_path_and_line_numbers(make_csv: CsvFactory) -> None:
    path = make_csv("2026-01-05,Alimentação,45.90,Mercado", '2026-01-06,Transporte,"12,50",')
    items = list(scan(path))
    assert [type(i) for i in items] == [Expense, Expense]
    assert items[0] == Expense(dt.date(2026, 1, 5), "alimentação", Decimal("45.90"), "Mercado")


def test_bad_rows_come_back_as_values_with_their_line(make_csv: CsvFactory) -> None:
    path = make_csv("2026-01-05,a,1.00,", "nope,a,1.00,", "2026-01-07,a,xx,", "2026-01-08,,1.00,")
    items = list(scan(path))
    errors = [i for i in items if isinstance(i, InvalidRowError)]
    assert [(err.line, err.field) for err in errors] == [
        (3, "date"),
        (4, "amount"),
        (5, "category"),
    ]
    assert len(items) == 4


def test_strict_reader_is_lazy_and_stops_at_first_bad_row(make_csv: CsvFactory) -> None:
    path = make_csv("2026-01-05,a,1.00,", "nope,a,1.00,", "2026-01-07,a,2.00,")
    gen = read_expenses(path)
    first = next(gen)  # the bad row has not been read yet
    assert first.amount == Decimal("1.00")
    with pytest.raises(InvalidRowError) as info:
        next(gen)
    assert info.value.line == 3


def test_wrong_encoding_is_reported_not_garbled(make_csv: CsvFactory) -> None:
    path = make_csv("2026-01-05,Alimentação,1.00,", encoding="latin-1")
    with pytest.raises(EncodingMismatchError, match="não é utf-8 válido") as info:
        list(scan(path))
    assert isinstance(info.value.__cause__, UnicodeDecodeError)
    assert [i.category for i in scan(path, encoding="latin-1") if isinstance(i, Expense)] == [
        "alimentação"
    ]


def test_bom_breaks_utf8_header_but_utf8_sig_reads_it(make_csv: CsvFactory) -> None:
    path = make_csv("2026-01-05,a,1.00,", encoding="utf-8-sig")
    with pytest.raises(MissingColumnError) as info:
        list(scan(path))  # first column is '﻿date'
    assert info.value.columns == ["date"]
    assert len(list(scan(path, encoding="utf-8-sig"))) == 1


def test_every_domain_error_is_an_expenses_error(make_csv: CsvFactory) -> None:
    path = make_csv("x,a,1.00,")
    with pytest.raises(ExpensesError):
        list(read_expenses(path))


def test_missing_column_names_the_columns(make_csv: CsvFactory) -> None:
    path = make_csv("2026-01-05,a", header="date,category\n")
    with pytest.raises(MissingColumnError) as info:
        list(scan(path))
    assert info.value.columns == ["amount", "description"]


def test_empty_file_with_only_header_yields_nothing(make_csv: CsvFactory) -> None:
    assert list(scan(make_csv())) == []
