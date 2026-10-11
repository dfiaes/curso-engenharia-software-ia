from datetime import UTC, datetime
from decimal import Decimal

import pytest
from pydantic import ValidationError

from python_senior_lab.models import LaxTransactionInput, StrictTransactionInput


def valid_python_data() -> dict[str, object]:
    return {
        "id": "tx-1",
        "amount": Decimal("10.5"),
        "currency": "BRL",
        "category": "books",
        "occurred_at": datetime(2026, 8, 15, tzinfo=UTC),
    }


def test_lax_and_strict_are_explicit_policies() -> None:
    text_data = {
        "id": "tx-1",
        "amount": "10.5",
        "currency": "BRL",
        "category": "books",
        "occurred_at": "2026-08-15T10:00:00Z",
    }

    assert LaxTransactionInput.model_validate(text_data).amount == Decimal("10.5")
    with pytest.raises(ValidationError):
        StrictTransactionInput.model_validate(text_data)


def test_external_contract_forbids_extra_fields() -> None:
    data = valid_python_data()
    data["is_admin"] = True

    with pytest.raises(ValidationError, match="Extra inputs are not permitted"):
        StrictTransactionInput.model_validate(data)


def test_validate_assignment_rejects_invalid_mutation() -> None:
    transaction = StrictTransactionInput.model_validate(valid_python_data())

    with pytest.raises(ValidationError):
        transaction.amount = Decimal("-1")


def test_pydantic_does_not_replace_domain_invariants() -> None:
    syntactically_valid = LaxTransactionInput.model_validate(
        {**valid_python_data(), "currency": "GBP"}
    )

    with pytest.raises(ValueError, match="moeda não suportada"):
        syntactically_valid.to_domain()
