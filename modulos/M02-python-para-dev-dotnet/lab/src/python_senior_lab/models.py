"""Contratos Pydantic nas fronteiras não confiáveis."""

from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator

from python_senior_lab.domain import Transaction


class LaxTransactionInput(BaseModel):
    """Contrato explícito para fontes internas que admitem coerção documentada."""

    model_config = ConfigDict(extra="forbid")

    id: str = Field(min_length=1)
    amount: Decimal = Field(gt=0)
    currency: str = Field(pattern=r"^[A-Z]{3}$")
    category: str = Field(min_length=1)
    occurred_at: datetime

    @field_validator("id", "category", "currency", mode="before")
    @classmethod
    def strip_text(cls, value: Any) -> Any:
        return value.strip() if isinstance(value, str) else value

    def to_domain(self) -> Transaction:
        return Transaction(
            transaction_id=self.id,
            amount=self.amount,
            currency=self.currency,
            category=self.category,
            occurred_at=self.occurred_at,
        )


class StrictTransactionInput(BaseModel):
    """Trust boundary estrita: sem extras, coerção ou mutação inválida posterior."""

    model_config = ConfigDict(extra="forbid", strict=True, validate_assignment=True)

    id: str = Field(min_length=1)
    amount: Decimal = Field(gt=0)
    currency: Literal["BRL", "EUR", "USD"]
    category: str = Field(min_length=1)
    occurred_at: datetime

    def to_domain(self) -> Transaction:
        return Transaction(
            transaction_id=self.id,
            amount=self.amount,
            currency=self.currency,
            category=self.category,
            occurred_at=self.occurred_at,
        )
