from datetime import UTC, datetime
from decimal import Decimal
from io import StringIO

from hypothesis import given
from hypothesis import strategies as st

from python_senior_lab.domain import Transaction
from python_senior_lab.parsing import CSV_FIELDS, format_row, iter_stream


@given(
    amount=st.decimals(
        min_value=Decimal("0.01"),
        max_value=Decimal("1000000"),
        places=2,
        allow_nan=False,
        allow_infinity=False,
    ),
    category=st.text(
        alphabet=" abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZáéíóúç",
        min_size=1,
        max_size=24,
    ).filter(lambda value: bool(value.strip())),
)
def test_csv_round_trip_preserves_critical_values(amount: Decimal, category: str) -> None:
    transaction = Transaction(
        transaction_id="generated",
        amount=amount,
        currency="BRL",
        category=category,
        occurred_at=datetime(2026, 8, 15, 10, tzinfo=UTC),
    )
    row = format_row(transaction)
    stream = StringIO(
        ",".join(CSV_FIELDS) + "\n" + ",".join(row[field] for field in CSV_FIELDS) + "\n"
    )

    parsed = next(iter_stream(stream))

    assert parsed.amount == transaction.amount
    assert parsed.category == transaction.category.strip()


@given(st.decimals(max_value=Decimal("0"), allow_nan=False, allow_infinity=False))
def test_non_positive_amount_never_crosses_domain_boundary(amount: Decimal) -> None:
    try:
        Transaction(
            transaction_id="generated",
            amount=amount,
            currency="BRL",
            category="test",
            occurred_at=datetime(2026, 8, 15, tzinfo=UTC),
        )
    except ValueError:
        return
    raise AssertionError("mutante detectado: regra amount > 0 foi removida")
