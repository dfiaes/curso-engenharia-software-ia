"""Gap rules. Each rule is a pure function: (record, today) -> findings.

The schema says what a record may contain; the rules say what a record must contain
given what it declares. Rules never decide risk, they check that the declared
risk has the artifacts it implies.
"""

from collections.abc import Callable
from dataclasses import dataclass
from datetime import date, timedelta
from enum import StrEnum

from aigov.models import (
    SENSITIVE_BASES,
    AISystemRecord,
    AssessmentKind,
    Lifecycle,
    RiskTier,
)

MAX_ASSESSMENT_AGE = timedelta(days=365)


class Severity(StrEnum):
    ERROR = "error"
    WARN = "warn"


@dataclass(frozen=True)
class Finding:
    rule: str
    severity: Severity
    field: str
    message: str


Rule = Callable[[AISystemRecord, date], list[Finding]]


def _has(record: AISystemRecord, kind: AssessmentKind) -> bool:
    return any(a.kind is kind for a in record.assessments)


def _err(rule: str, field: str, message: str) -> Finding:
    return Finding(rule, Severity.ERROR, field, message)


def _warn(rule: str, field: str, message: str) -> Finding:
    return Finding(rule, Severity.WARN, field, message)


def aig001_basis_required(r: AISystemRecord, today: date) -> list[Finding]:
    if r.personal_data.processes and r.legal_basis is None:
        return [_err("AIG-001", "legal_basis", "personal data without a legal basis (LGPD art. 7)")]
    return []


def aig002_sensitive_basis(r: AISystemRecord, today: date) -> list[Finding]:
    basis = r.legal_basis
    if r.personal_data.sensitive and basis is not None and basis not in SENSITIVE_BASES:
        return [
            _err(
                "AIG-002",
                "legal_basis",
                f"'{basis}' is not a valid basis for sensitive data (LGPD art. 11)",
            )
        ]
    return []


def aig003_retention(r: AISystemRecord, today: date) -> list[Finding]:
    return [
        _err(
            "AIG-003",
            f"stores[{i}].retention_days",
            f"{s.kind} holds personal data without a retention period",
        )
        for i, s in enumerate(r.stores)
        if s.holds_personal_data and s.retention_days is None
    ]


def aig004_erasure(r: AISystemRecord, today: date) -> list[Finding]:
    return [
        _err(
            "AIG-004",
            f"stores[{i}].erasure_supported",
            f"{s.kind} holds personal data but cannot erase one data subject (LGPD art. 18)",
        )
        for i, s in enumerate(r.stores)
        if s.holds_personal_data and not s.erasure_supported
    ]


def aig005_declared_vs_stores(r: AISystemRecord, today: date) -> list[Finding]:
    if not r.personal_data.processes and any(s.holds_personal_data for s in r.stores):
        return [
            _err(
                "AIG-005",
                "personal_data.processes",
                "a store holds personal data but the record says the system processes none",
            )
        ]
    return []


def aig006_transfer(r: AISystemRecord, today: date) -> list[Finding]:
    abroad = r.provider.country != "BR"
    if r.personal_data.processes and abroad and not r.provider.transfer_mechanism:
        return [
            _err(
                "AIG-006",
                "provider.transfer_mechanism",
                f"provider in {r.provider.country} receives personal data without a "
                "documented transfer mechanism (LGPD arts. 33-36)",
            )
        ]
    return []


def aig007_provider_training(r: AISystemRecord, today: date) -> list[Finding]:
    if r.personal_data.processes and r.provider.trains_on_inputs:
        return [
            _warn(
                "AIG-007",
                "provider.trains_on_inputs",
                "provider may train on inputs that contain personal data; "
                "confirm purpose compatibility or disable it by contract",
            )
        ]
    return []


def aig008_prohibited(r: AISystemRecord, today: date) -> list[Finding]:
    if r.risk_tier is RiskTier.PROHIBITED and r.lifecycle is not Lifecycle.RETIRED:
        return [_err("AIG-008", "risk_tier", "prohibited practice cannot be built or operated")]
    return []


def aig009_high_risk_impact(r: AISystemRecord, today: date) -> list[Finding]:
    if r.risk_tier is RiskTier.HIGH and not _has(r, AssessmentKind.IMPACT):
        return [_err("AIG-009", "assessments", "high risk without an impact assessment")]
    return []


def aig010_dpia(r: AISystemRecord, today: date) -> list[Finding]:
    p = r.personal_data
    if p.processes and (p.sensitive or p.children) and not _has(r, AssessmentKind.DPIA):
        return [
            _err(
                "AIG-010",
                "assessments",
                "sensitive or children's data without a data protection impact report (RIPD)",
            )
        ]
    return []


def aig011_automated_decision(r: AISystemRecord, today: date) -> list[Finding]:
    if r.automated_decision and not r.human_review:
        return [
            _err(
                "AIG-011",
                "human_review",
                "automated decision affecting people without a review path (LGPD art. 20)",
            )
        ]
    return []


def aig012_incident_plan(r: AISystemRecord, today: date) -> list[Finding]:
    if r.incident_plan:
        return []
    if r.lifecycle is Lifecycle.PRODUCTION:
        return [_err("AIG-012", "incident_plan", "production system without an incident plan")]
    if r.lifecycle is Lifecycle.PILOT:
        return [_warn("AIG-012", "incident_plan", "pilot without an incident plan")]
    return []


def aig013_evals(r: AISystemRecord, today: date) -> list[Finding]:
    if r.lifecycle is Lifecycle.PRODUCTION and not _has(r, AssessmentKind.EVAL_REPORT):
        return [_err("AIG-013", "assessments", "production system without an eval report")]
    if r.risk_tier is RiskTier.HIGH and not _has(r, AssessmentKind.RED_TEAM):
        return [_warn("AIG-013", "assessments", "high risk without a red team record")]
    return []


def aig014_stale(r: AISystemRecord, today: date) -> list[Finding]:
    return [
        _warn(
            "AIG-014",
            f"assessments[{i}]",
            f"{a.kind} is {(today - a.done_on).days} days old (limit {MAX_ASSESSMENT_AGE.days})",
        )
        for i, a in enumerate(r.assessments)
        if today - a.done_on > MAX_ASSESSMENT_AGE
    ]


def aig015_disclosure(r: AISystemRecord, today: date) -> list[Finding]:
    if r.user_facing_generative and not r.ai_disclosure:
        return [
            _warn(
                "AIG-015",
                "ai_disclosure",
                "users talk to a generative system without being told (EU AI Act art. 50)",
            )
        ]
    return []


RULES: tuple[Rule, ...] = (
    aig001_basis_required,
    aig002_sensitive_basis,
    aig003_retention,
    aig004_erasure,
    aig005_declared_vs_stores,
    aig006_transfer,
    aig007_provider_training,
    aig008_prohibited,
    aig009_high_risk_impact,
    aig010_dpia,
    aig011_automated_decision,
    aig012_incident_plan,
    aig013_evals,
    aig014_stale,
    aig015_disclosure,
)


def validate(record: AISystemRecord, today: date, rules: tuple[Rule, ...] = RULES) -> list[Finding]:
    findings: list[Finding] = []
    for rule in rules:
        findings.extend(rule(record, today))
    return findings
