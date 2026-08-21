"""Política determinística: advisory pode escalar, nunca de-escalar."""

from __future__ import annotations

from decimal import Decimal

from work_intake.domain.models import Advisory, Decision, Outcome, Priority, Risk, WorkRequest


class IntakePolicy:
    version = "1.0"
    review_budget = Decimal("1000.00")
    reject_budget = Decimal("10000.00")

    def decide(self, request: WorkRequest, advisory: Advisory) -> Decision:
        reasons: list[str] = []

        if request.priority is Priority.CRITICAL:
            outcome = Outcome.REJECT
            reasons.append("critical_requires_manual_channel")
        elif request.budget > self.reject_budget:
            outcome = Outcome.REJECT
            reasons.append("budget_limit_exceeded")
        elif request.priority is Priority.HIGH or request.budget > self.review_budget:
            outcome = Outcome.REVIEW
            reasons.append("deterministic_review_required")
        else:
            outcome = Outcome.ACCEPT
            reasons.append("deterministic_policy_passed")

        if outcome is Outcome.ACCEPT and advisory.risk in {Risk.MEDIUM, Risk.HIGH, Risk.UNKNOWN}:
            outcome = Outcome.REVIEW
            reasons.append("advisor_risk_escalation")

        return Decision(
            request_id=request.request_id,
            outcome=outcome,
            reason_codes=tuple(reasons),
            policy_version=self.version,
            contract_version=request.contract_version,
        )
