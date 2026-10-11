from datetime import UTC, datetime
from decimal import Decimal

import pytest

from python_senior_lab.domain import DomainInvariantError, Transaction, append_tag


def make_transaction(**changes: object) -> Transaction:
    values: dict[str, object] = {
        "transaction_id": "tx-1",
        "amount": Decimal("10.50"),
        "currency": "BRL",
        "category": "books",
        "occurred_at": datetime(2026, 8, 15, tzinfo=UTC),
    }
    values.update(changes)
    return Transaction(**values)  # type: ignore[arg-type]


def test_equal_value_objects_have_equal_stable_hash() -> None:
    first = make_transaction()
    second = make_transaction()

    assert first is not second
    assert first == second
    assert hash(first) == hash(second)
    assert {first: "stored"}[second] == "stored"


def test_mutable_collection_is_explicitly_not_hashable() -> None:
    with pytest.raises(TypeError):
        hash(["mutable"])


def test_domain_rejects_schema_valid_but_unsupported_currency() -> None:
    with pytest.raises(DomainInvariantError, match="moeda não suportada"):
        make_transaction(currency="GBP")


def test_fixed_default_does_not_share_state() -> None:
    first = append_tag("a")
    second = append_tag("b")

    assert first == ["a"]
    assert second == ["b"]
    assert first is not second


def test_frozen_value_object_uses_immutable_tags() -> None:
    original = make_transaction()
    tagged = original.with_tag(" Review ")

    assert original.tags == ()
    assert tagged.tags == ("review",)
