from datetime import UTC, datetime
from decimal import Decimal

from python_senior_lab.domain import append_tag_with_shared_default
from python_senior_lab.models import LaxTransactionInput, StrictTransactionInput


def test_model_construct_can_bypass_validation() -> None:
    invalid = StrictTransactionInput.model_construct(
        id="tx-1",
        amount=Decimal("-99"),
        currency="BRL",
        category="books",
        occurred_at=datetime(2026, 8, 15, tzinfo=UTC),
    )

    assert invalid.amount < 0


def test_model_without_validate_assignment_can_become_invalid() -> None:
    model = LaxTransactionInput.model_validate(
        {
            "id": "tx-1",
            "amount": "10",
            "currency": "BRL",
            "category": "books",
            "occurred_at": "2026-08-15T10:00:00Z",
        }
    )
    model.amount = Decimal("-99")

    assert model.amount < 0


def test_seeded_mutable_default_reproduces_aliasing() -> None:
    first = append_tag_with_shared_default("first")
    second = append_tag_with_shared_default("second")

    assert first is second
    assert first[-2:] == ["first", "second"]
