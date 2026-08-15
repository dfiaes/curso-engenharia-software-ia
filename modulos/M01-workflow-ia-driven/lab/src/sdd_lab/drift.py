"""Classificação conservadora de drift: evidência antes de mutação."""

from dataclasses import dataclass
from enum import StrEnum


class DriftState(StrEnum):
    CONSISTENT = "consistent"
    SPEC_STALE = "spec_stale"
    CODE_INCORRECT = "code_incorrect"
    DECISION_REQUIRED = "decision_required"


@dataclass(frozen=True)
class DriftEvidence:
    spec_accepts_observed: bool
    tests_accept_observed: bool
    production_supports_observed: bool | None
    detail: str


@dataclass(frozen=True)
class DriftReport:
    state: DriftState
    evidence: DriftEvidence
    mutation_allowed: bool = False


def classify_drift(evidence: DriftEvidence) -> DriftReport:
    if evidence.spec_accepts_observed and evidence.tests_accept_observed:
        state = DriftState.CONSISTENT
    elif (
        not evidence.spec_accepts_observed
        and evidence.tests_accept_observed
        and evidence.production_supports_observed is True
    ):
        state = DriftState.SPEC_STALE
    elif evidence.spec_accepts_observed and not evidence.tests_accept_observed:
        state = DriftState.CODE_INCORRECT
    else:
        state = DriftState.DECISION_REQUIRED
    return DriftReport(state=state, evidence=evidence)
