"""M12-B03-L: executable bridge for M12-AT-005/006 (local slice, no network).

Limits (not executed here): atomic persistence/consumption in Capstone,
Capstone identity/audit store, PostgreSQL suite, end-to-end.
"""

from datetime import timedelta
from uuid import UUID, uuid4

import pytest

from m12_lab.authorization import (
    ActionRisk,
    ApprovalStore,
    AuthorizationDenied,
    LocalPolicy,
    audit_policy_decision,
)
from m12_lab.models import Principal, ToolRequest


def _principal(tenant_id: UUID, *, actor_id: UUID | None = None) -> Principal:
    return Principal(
        actor_id=actor_id or uuid4(),
        tenant_id=tenant_id,
        scopes=frozenset({"tools:send_payment"}),
        workload_id="agent-runtime",
    )


def _request(tenant_id: UUID, amount: int = 10) -> ToolRequest:
    return ToolRequest(
        tenant_id=tenant_id,
        tool_name="send_payment",
        arguments={"amount": amount, "currency": "BRL"},
    )


def test_at005_denies_replay_with_single_use() -> None:
    tenant_id = uuid4()
    actor = _principal(tenant_id)
    operation = _request(tenant_id)
    store = ApprovalStore()
    issued = store.issue(actor, operation, timedelta(minutes=5))

    event = store.consume(issued.approval_id, actor, operation)

    assert event.outcome == "allowed"
    assert event.rule_id == "APPROVAL_EXACT_INTENT"
    assert event.correlation_id == operation.request_id
    with pytest.raises(AuthorizationDenied, match="APPROVAL_ALREADY_USED"):
        store.consume(issued.approval_id, actor, operation)


def test_at005_denies_tampered_arguments() -> None:
    tenant_id = uuid4()
    actor = _principal(tenant_id)
    operation = _request(tenant_id, amount=10)
    store = ApprovalStore()
    issued = store.issue(actor, operation, timedelta(minutes=5))
    tampered = operation.model_copy(update={"arguments": {"amount": 1000, "currency": "BRL"}})

    with pytest.raises(AuthorizationDenied, match="APPROVAL_BINDING_MISMATCH"):
        store.consume(issued.approval_id, actor, tampered)


def test_at005_denies_expired_approval() -> None:
    tenant_id = uuid4()
    actor = _principal(tenant_id)
    operation = _request(tenant_id)
    store = ApprovalStore()
    issued = store.issue(actor, operation, timedelta(minutes=5))

    with pytest.raises(AuthorizationDenied, match="APPROVAL_EXPIRED"):
        store.consume(issued.approval_id, actor, operation, now=issued.expires_at)


def test_at005_denies_unknown_approval() -> None:
    tenant_id = uuid4()

    with pytest.raises(AuthorizationDenied, match="APPROVAL_NOT_FOUND"):
        ApprovalStore().consume(uuid4(), _principal(tenant_id), _request(tenant_id))


def test_at006_denies_divergent_tenant_with_content_free_audit() -> None:
    actor = _principal(uuid4())
    operation = _request(uuid4())
    decision = LocalPolicy().decide(actor, operation, ActionRisk.READ)
    event = audit_policy_decision(actor, operation, decision)

    assert not decision.allowed
    assert decision.rule_id == "AUTH_TENANT_MATCH"
    assert event.outcome == "denied"
    assert event.rule_id == "AUTH_TENANT_MATCH"
    assert event.metadata == {"tool": operation.tool_name}
    dumped = event.model_dump_json()
    assert "amount" not in dumped
    assert "BRL" not in dumped


def test_at006_denies_divergent_actor_and_tenant_on_consume() -> None:
    tenant_id = uuid4()
    actor = _principal(tenant_id)
    operation = _request(tenant_id)
    store = ApprovalStore()
    issued = store.issue(actor, operation, timedelta(minutes=5))

    with pytest.raises(AuthorizationDenied, match="APPROVAL_BINDING_MISMATCH"):
        store.consume(issued.approval_id, _principal(tenant_id), operation)
    with pytest.raises(AuthorizationDenied, match="APPROVAL_BINDING_MISMATCH"):
        store.consume(issued.approval_id, _principal(uuid4()), operation)
