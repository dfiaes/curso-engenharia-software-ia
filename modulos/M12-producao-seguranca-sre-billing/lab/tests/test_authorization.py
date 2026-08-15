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


def principal(tenant_id: UUID, *, actor_id: UUID | None = None) -> Principal:
    return Principal(
        actor_id=actor_id or uuid4(),
        tenant_id=tenant_id,
        scopes=frozenset({"tools:send_payment"}),
        workload_id="agent-runtime",
    )


def request(tenant_id: UUID, amount: int = 10) -> ToolRequest:
    return ToolRequest(
        tenant_id=tenant_id,
        tool_name="send_payment",
        arguments={"amount": amount, "currency": "BRL"},
    )


def test_denies_cross_tenant_request() -> None:
    actor = principal(uuid4())
    operation = request(uuid4())
    decision = LocalPolicy().decide(actor, operation, ActionRisk.READ)
    event = audit_policy_decision(actor, operation, decision)

    assert not decision.allowed
    assert decision.rule_id == "AUTH_TENANT_MATCH"
    assert event.outcome == "denied"
    assert event.rule_id == decision.rule_id
    assert event.metadata == {"tool": operation.tool_name}


def test_denies_missing_capability() -> None:
    tenant_id = uuid4()
    actor = principal(tenant_id).model_copy(update={"scopes": frozenset()})

    decision = LocalPolicy().decide(actor, request(tenant_id), ActionRisk.READ)

    assert not decision.allowed
    assert decision.rule_id == "AUTH_TOOL_SCOPE"


def test_critical_effect_requires_approval() -> None:
    tenant_id = uuid4()

    decision = LocalPolicy().decide(
        principal(tenant_id), request(tenant_id), ActionRisk.CRITICAL_EFFECT
    )

    assert decision.allowed
    assert decision.approval_required


def test_approval_is_bound_to_exact_intent_and_single_use() -> None:
    tenant_id = uuid4()
    actor = principal(tenant_id)
    operation = request(tenant_id)
    store = ApprovalStore()
    approval = store.issue(actor, operation, timedelta(minutes=5))

    event = store.consume(approval.approval_id, actor, operation)

    assert event.outcome == "allowed"
    assert event.correlation_id == operation.request_id
    with pytest.raises(AuthorizationDenied, match="APPROVAL_ALREADY_USED"):
        store.consume(approval.approval_id, actor, operation)


def test_approval_rejects_tampered_arguments() -> None:
    tenant_id = uuid4()
    actor = principal(tenant_id)
    operation = request(tenant_id)
    approval = ApprovalStore()
    issued = approval.issue(actor, operation, timedelta(minutes=5))
    tampered = operation.model_copy(update={"arguments": {"amount": 1_000_000}})

    with pytest.raises(AuthorizationDenied, match="APPROVAL_BINDING_MISMATCH"):
        approval.consume(issued.approval_id, actor, tampered)


def test_approval_rejects_different_actor() -> None:
    tenant_id = uuid4()
    actor = principal(tenant_id)
    operation = request(tenant_id)
    store = ApprovalStore()
    issued = store.issue(actor, operation, timedelta(minutes=5))

    with pytest.raises(AuthorizationDenied, match="APPROVAL_BINDING_MISMATCH"):
        store.consume(issued.approval_id, principal(tenant_id), operation)


def test_approval_rejects_expiration() -> None:
    tenant_id = uuid4()
    actor = principal(tenant_id)
    operation = request(tenant_id)
    store = ApprovalStore()
    issued = store.issue(actor, operation, timedelta(minutes=5))

    with pytest.raises(AuthorizationDenied, match="APPROVAL_EXPIRED"):
        store.consume(issued.approval_id, actor, operation, now=issued.expires_at)
