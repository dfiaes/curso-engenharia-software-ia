"""Deterministic policy-enforcement boundary for model-proposed tools."""

from __future__ import annotations

from typing import Literal
from uuid import UUID

from pydantic import ValidationError

from m12_lab.authorization import (
    ActionRisk,
    LocalPolicy,
    PolicyDecision,
    audit_policy_decision,
)
from m12_lab.models import AuditEvent, Principal, StrictModel, ToolRequest


class RuntimeDenied(PermissionError):
    pass


class ExportReportArguments(StrictModel):
    report_id: UUID
    format: Literal["json", "pdf"]


class SendPaymentArguments(StrictModel):
    destination_id: UUID
    amount_minor: int
    currency: Literal["BRL", "USD", "EUR"]


class SessionAuthority(StrictModel):
    """Trusted authority created by the application, never by retrieved content."""

    tenant_id: UUID
    allowed_tools: frozenset[str]


class RuntimeEvaluation(StrictModel):
    decision: PolicyDecision
    validated_arguments: StrictModel | None
    audit_event: AuditEvent


class ToolSchemaRegistry:
    def __init__(self) -> None:
        self._schemas: dict[str, type[StrictModel]] = {}

    def register(self, name: str, schema: type[StrictModel]) -> None:
        if name in self._schemas:
            raise ValueError("TOOL_SCHEMA_ALREADY_REGISTERED")
        self._schemas[name] = schema

    def validate(self, request: ToolRequest) -> StrictModel:
        schema = self._schemas.get(request.tool_name)
        if schema is None:
            raise RuntimeDenied("TOOL_NOT_REGISTERED")
        try:
            return schema.model_validate(request.arguments)
        except ValidationError as error:
            raise RuntimeDenied("TOOL_ARGUMENTS_INVALID") from error


class SafeAgentRuntime:
    """Evaluates proposals without granting authority to model-visible content."""

    def __init__(self, registry: ToolSchemaRegistry, policy: LocalPolicy) -> None:
        self._registry = registry
        self._policy = policy
        self.audit_events: list[AuditEvent] = []

    def evaluate_proposal(
        self,
        principal: Principal,
        session: SessionAuthority,
        proposal: ToolRequest,
        risk: ActionRisk,
        *,
        untrusted_content: str,
    ) -> RuntimeEvaluation:
        del untrusted_content  # Evidence is data and never an authority input.
        if session.tenant_id != principal.tenant_id or proposal.tenant_id != session.tenant_id:
            raise RuntimeDenied("SESSION_TENANT_MISMATCH")
        if proposal.tool_name not in session.allowed_tools:
            raise RuntimeDenied("TOOL_OUTSIDE_SESSION_AUTHORITY")

        validated = self._registry.validate(proposal)
        decision = self._policy.decide(principal, proposal, risk)
        event = audit_policy_decision(principal, proposal, decision)
        self.audit_events.append(event)
        if not decision.allowed:
            raise RuntimeDenied(decision.rule_id)
        return RuntimeEvaluation(
            decision=decision,
            validated_arguments=validated,
            audit_event=event,
        )
