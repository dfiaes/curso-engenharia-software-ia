"""Identity, policy decisions, and approval binding."""

from __future__ import annotations

from datetime import datetime, timedelta
from enum import StrEnum
from uuid import UUID, uuid4

from pydantic import Field

from m12_lab.models import AuditEvent, Principal, StrictModel, ToolRequest, utc_now


class AuthorizationDenied(PermissionError):
    pass


class ActionRisk(StrEnum):
    READ = "read"
    REVERSIBLE_WRITE = "reversible_write"
    CRITICAL_EFFECT = "critical_effect"


class PolicyDecision(StrictModel):
    allowed: bool
    approval_required: bool
    rule_id: str
    reason: str


class Approval(StrictModel):
    approval_id: UUID = Field(default_factory=uuid4)
    actor_id: UUID
    tenant_id: UUID
    request_id: UUID
    intent_hash: str
    expires_at: datetime
    used_at: datetime | None = None


class LocalPolicy:
    def decide(
        self, principal: Principal, request: ToolRequest, risk: ActionRisk
    ) -> PolicyDecision:
        if principal.tenant_id != request.tenant_id:
            return PolicyDecision(
                allowed=False,
                approval_required=False,
                rule_id="AUTH_TENANT_MATCH",
                reason="principal and request tenant differ",
            )
        required_scope = f"tools:{request.tool_name}"
        if required_scope not in principal.scopes:
            return PolicyDecision(
                allowed=False,
                approval_required=False,
                rule_id="AUTH_TOOL_SCOPE",
                reason=f"missing {required_scope}",
            )
        return PolicyDecision(
            allowed=True,
            approval_required=risk is ActionRisk.CRITICAL_EFFECT,
            rule_id="AUTH_ALLOW_SCOPED",
            reason="identity, tenant, and scope match",
        )


class ApprovalStore:
    def __init__(self) -> None:
        self._items: dict[UUID, Approval] = {}

    def issue(self, principal: Principal, request: ToolRequest, ttl: timedelta) -> Approval:
        approval = Approval(
            actor_id=principal.actor_id,
            tenant_id=request.tenant_id,
            request_id=request.request_id,
            intent_hash=request.intent_hash,
            expires_at=utc_now() + ttl,
        )
        self._items[approval.approval_id] = approval
        return approval

    def consume(
        self,
        approval_id: UUID,
        principal: Principal,
        request: ToolRequest,
        *,
        now: datetime | None = None,
    ) -> AuditEvent:
        approval = self._items.get(approval_id)
        instant = now or utc_now()
        if approval is None:
            raise AuthorizationDenied("APPROVAL_NOT_FOUND")
        if approval.used_at is not None:
            raise AuthorizationDenied("APPROVAL_ALREADY_USED")
        if instant >= approval.expires_at:
            raise AuthorizationDenied("APPROVAL_EXPIRED")
        if (
            approval.actor_id != principal.actor_id
            or approval.tenant_id != principal.tenant_id
            or approval.request_id != request.request_id
            or approval.intent_hash != request.intent_hash
        ):
            raise AuthorizationDenied("APPROVAL_BINDING_MISMATCH")
        self._items[approval_id] = approval.model_copy(update={"used_at": instant})
        return AuditEvent(
            event_type="tool.approval.consumed",
            actor_id=principal.actor_id,
            tenant_id=principal.tenant_id,
            correlation_id=request.request_id,
            rule_id="APPROVAL_EXACT_INTENT",
            outcome="allowed",
        )


def audit_policy_decision(
    principal: Principal, request: ToolRequest, decision: PolicyDecision
) -> AuditEvent:
    """Create a content-free audit record for both allow and deny decisions."""
    return AuditEvent(
        event_type="tool.policy.decided",
        actor_id=principal.actor_id,
        tenant_id=principal.tenant_id,
        correlation_id=request.request_id,
        rule_id=decision.rule_id,
        outcome="allowed" if decision.allowed else "denied",
        metadata={"tool": request.tool_name},
    )
