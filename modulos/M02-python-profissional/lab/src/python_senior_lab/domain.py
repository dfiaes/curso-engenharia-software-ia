"""Modelo de domínio: invariantes explícitas depois da validação de fronteira."""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from decimal import Decimal
from typing import Self

SUPPORTED_CURRENCIES = frozenset({"BRL", "EUR", "USD"})


class DomainInvariantError(ValueError):
    """Dado bem-formado que viola uma regra do domínio."""


@dataclass(frozen=True, slots=True)
class Transaction:
    """Value object hashable; `tags` é tupla para evitar mutabilidade profunda óbvia."""

    transaction_id: str
    amount: Decimal
    currency: str
    category: str
    occurred_at: datetime
    tags: tuple[str, ...] = ()

    def __post_init__(self) -> None:
        if self.amount <= 0:
            raise DomainInvariantError("amount deve ser positivo")
        if self.currency not in SUPPORTED_CURRENCIES:
            raise DomainInvariantError(f"moeda não suportada: {self.currency}")
        if not self.transaction_id.strip():
            raise DomainInvariantError("transaction_id não pode ser vazio")

    def with_tag(self, tag: str) -> Self:
        normalized = tag.strip().lower()
        if not normalized:
            return self
        return type(self)(
            transaction_id=self.transaction_id,
            amount=self.amount,
            currency=self.currency,
            category=self.category,
            occurred_at=self.occurred_at,
            tags=(*self.tags, normalized),
        )


def append_tag_with_shared_default(tag: str, bucket: list[str] = []) -> list[str]:  # noqa: B006
    """Defeito semeado: default é criado uma vez e compartilhado entre chamadas."""

    bucket.append(tag)
    return bucket


def append_tag(tag: str, bucket: list[str] | None = None) -> list[str]:
    """Versão correta: cada chamada sem argumento recebe um novo objeto."""

    result = [] if bucket is None else bucket
    result.append(tag)
    return result
