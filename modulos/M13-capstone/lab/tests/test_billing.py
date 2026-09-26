"""B13: ledger com idempotência, quotas/entitlement e reconciliação de webhooks."""

import random
from pathlib import Path

from capstone_lab.billing import (
    PLANS,
    FakeProvider,
    UsageEvent,
    UsageLedger,
    entitled,
    load_webhook_fixture,
    margin_per_plan,
    quota_remaining,
    reconcile,
)

FIX = Path(__file__).resolve().parent.parent / "fixtures" / "billing"


def test_ledger_dedup_por_chave() -> None:
    ledger = UsageLedger()
    ev = UsageEvent("t1", "analysis", 1, "req-1")
    assert ledger.record(ev)
    assert not ledger.record(ev)  # duplicado: mesma chave, não dobra
    assert ledger.total("t1", "analysis") == 1 and ledger.size() == 1


def test_quota_e_entitlement_derivados_do_plano() -> None:
    ledger = UsageLedger()
    for i in range(4):
        ledger.record(UsageEvent("t1", "analysis", 1, f"k{i}"))
    assert quota_remaining(ledger, "t1", "free") == 6
    assert quota_remaining(ledger, "t1", "pro") == 496
    assert entitled("pro", "agent") and not entitled("free", "agent")
    assert entitled("team", "sso") and not entitled("pro", "sso")


def test_reconciliacao_converge_com_duplicados_e_desordem() -> None:
    events = load_webhook_fixture(FIX / "webhook_events.json")
    balances = reconcile(FakeProvider(), events)
    assert balances == {"cus_acme": 4000, "cus_globex": 29900}
    for seed in range(5):  # qualquer permutação converge para o mesmo estado
        shuffled = events[:]
        random.Random(seed).shuffle(shuffled)
        assert reconcile(FakeProvider(), shuffled) == balances


def test_reconciliacao_idempotente_na_reexecucao() -> None:
    events = load_webhook_fixture(FIX / "webhook_events.json")
    provider = FakeProvider()
    reconcile(provider, events)
    assert reconcile(provider, events) == {"cus_acme": 4000, "cus_globex": 29900}


def test_webhook_desconhecido_e_rejeitado() -> None:
    import pytest

    with pytest.raises(ValueError, match="evento desconhecido"):
        reconcile(
            FakeProvider(),
            [{"id": "e9", "type": "charge.hacked", "customer": "c", "amount": 1, "created": 1}],
        )


def test_custo_por_analise_derivado_do_ledger() -> None:
    ledger = UsageLedger()
    ledger.record(UsageEvent("t1", "analysis", 3, "a"))
    ledger.record(UsageEvent("t1", "analysis", 2, "b"))
    assert ledger.total("t1", "analysis") == 5


def test_margem_por_plano_derivada() -> None:
    ledger = UsageLedger()
    for i in range(10):  # 10 análises do tenant pro
        ledger.record(UsageEvent("tp", "analysis", 1, f"p{i}"))
    for i in range(3):  # 3 análises do tenant free
        ledger.record(UsageEvent("tf", "analysis", 1, f"f{i}"))
    margin = margin_per_plan(ledger, {"tp": "pro", "tf": "free"})
    assert margin["pro"] == PLANS["pro"]["price_cents"] - 10 * 35
    assert margin["free"] == -(3 * 35)  # free com custo: margem negativa real
