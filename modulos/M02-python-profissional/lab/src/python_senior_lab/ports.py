"""Ports estruturais: contratos dependem de comportamento, não de herança nominal."""

from __future__ import annotations

from decimal import Decimal
from typing import Protocol


class RateProvider(Protocol):
    def rate(self, source: str, target: str) -> Decimal:
        """Retorna a taxa `source -> target` ou falha explicitamente."""


class FixedRateProvider:
    def __init__(self, value: Decimal) -> None:
        self._value = value

    def rate(self, source: str, target: str) -> Decimal:
        del source, target
        return self._value


class MappingRateProvider:
    def __init__(self, rates: dict[tuple[str, str], Decimal]) -> None:
        self._rates = rates.copy()

    def rate(self, source: str, target: str) -> Decimal:
        try:
            return self._rates[(source, target)]
        except KeyError as exc:
            raise LookupError(f"taxa ausente: {source}->{target}") from exc


def convert(amount: Decimal, source: str, target: str, provider: RateProvider) -> Decimal:
    if source == target:
        return amount
    return amount * provider.rate(source, target)
