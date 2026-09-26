"""Metering, entitlement, quotas e reconciliação de webhooks (M13 B13).

Invariantes:
- O usage ledger é a única fonte de verdade de consumo; todo número publicado
  (custo, receita, margem) é **derivado** do ledger, nunca digitado.
- Idempotência em duas camadas: eventos de uso por ``idempotency_key`` e
  webhooks por ``id`` de evento; duplicado não altera o estado.
- Webhooks podem chegar duplicados e fora de ordem; a reconciliação ordena por
  ``(created, id)`` e converge para o mesmo saldo final.
- Stripe real/test-mode: BLOCKED ambiental (sem credenciais/rede); o provider
  aqui é um ``FakeProvider`` local explicitamente rotulado — ver RASTREABILIDADE.
"""

from __future__ import annotations

import json
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

PLANS: dict[str, dict[str, Any]] = {
    "free": {"quota_analyses": 10, "price_cents": 0, "features": ["search"]},
    "pro": {"quota_analyses": 500, "price_cents": 4900, "features": ["search", "agent", "api"]},
    "team": {
        "quota_analyses": 5000,
        "price_cents": 29900,
        "features": ["search", "agent", "api", "sso"],
    },
}
COST_PER_ANALYSIS_CENTS = 35  # custo unitário estimado registrado (exemplo local)


@dataclass(frozen=True)
class UsageEvent:
    tenant_id: str
    kind: str
    quantity: int
    idempotency_key: str


class UsageLedger:
    """Append-only com dedup por idempotency key; totais sempre derivados."""

    def __init__(self) -> None:
        self._events: dict[str, UsageEvent] = {}

    def record(self, event: UsageEvent) -> bool:
        """Registra; retorna False se a chave já existia (duplicado ignorado)."""
        if event.idempotency_key in self._events:
            return False
        self._events[event.idempotency_key] = event
        return True

    def total(self, tenant_id: str, kind: str) -> int:
        return sum(
            e.quantity for e in self._events.values() if e.tenant_id == tenant_id and e.kind == kind
        )

    def size(self) -> int:
        return len(self._events)


def entitled(plan: str, feature: str) -> bool:
    return feature in PLANS[plan]["features"]


def quota_remaining(ledger: UsageLedger, tenant_id: str, plan: str) -> int:
    used = ledger.total(tenant_id, "analysis")
    return max(int(PLANS[plan]["quota_analyses"]) - used, 0)


@dataclass
class FakeProvider:
    """Provider de billing local (rotulado: sem Stripe, sem rede)."""

    balances: dict[str, int] = field(default_factory=dict)  # customer -> cents
    seen_events: set[str] = field(default_factory=set)

    def apply(self, event: dict[str, Any]) -> None:
        if event["id"] in self.seen_events:
            return  # webhook duplicado: já reconciliado
        self.seen_events.add(event["id"])
        customer = event["customer"]
        if event["type"] == "invoice.paid":
            self.balances[customer] = self.balances.get(customer, 0) + int(event["amount"])
        elif event["type"] == "charge.refunded":
            self.balances[customer] = self.balances.get(customer, 0) - int(event["amount"])
        else:
            raise ValueError(f"evento desconhecido: {event['type']}")


def reconcile(provider: FakeProvider, events: list[dict[str, Any]]) -> dict[str, int]:
    """Aplica eventos em ordem determinística; duplicados e fora de ordem convergem."""
    for event in sorted(events, key=lambda e: (int(e["created"]), str(e["id"]))):
        provider.apply(event)
    return dict(sorted(provider.balances.items()))


def load_webhook_fixture(path: Path) -> list[dict[str, Any]]:
    events: list[dict[str, Any]] = json.loads(path.read_text(encoding="utf-8"))
    for e in events:
        for key in ("id", "type", "customer", "amount", "created"):
            if key not in e:
                raise ValueError(f"webhook sem campo obrigatório: {key}")
    return events


def margin_per_plan(ledger: UsageLedger, tenants_plans: dict[str, str]) -> dict[str, int]:
    """Margem (receita do plano menos custo derivado do ledger), em cents."""
    margin: dict[str, int] = {}
    for tenant, plan in tenants_plans.items():
        cost = ledger.total(tenant, "analysis") * COST_PER_ANALYSIS_CENTS
        margin[plan] = margin.get(plan, 0) + int(PLANS[plan]["price_cents"]) - cost
    return margin
