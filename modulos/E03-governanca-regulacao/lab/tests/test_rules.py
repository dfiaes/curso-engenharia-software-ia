from datetime import date
from typing import Any

import pytest
from pydantic import ValidationError

from aigov.models import AISystemRecord
from aigov.rules import RULES, Severity, validate

from .conftest import TODAY, make


def ids(record: AISystemRecord, today: date = TODAY) -> set[str]:
    return {f.rule for f in validate(record, today)}


def test_clean_record_has_no_findings(clean_record: AISystemRecord) -> None:
    assert validate(clean_record, TODAY) == []


def test_personal_data_without_basis(raw: dict[str, Any]) -> None:
    raw["legal_basis"] = None
    assert "AIG-001" in ids(make(raw))


def test_no_personal_data_needs_no_basis(raw: dict[str, Any]) -> None:
    raw["legal_basis"] = None
    raw["personal_data"] = {"processes": False}
    raw["stores"][0]["holds_personal_data"] = False
    assert validate(make(raw), TODAY) == []


@pytest.mark.parametrize("basis", ["legitimate_interest", "contract", "credit_protection"])
def test_sensitive_data_rejects_art7_only_bases(raw: dict[str, Any], basis: str) -> None:
    raw["personal_data"]["sensitive"] = True
    raw["legal_basis"] = basis
    raw["assessments"].append({"kind": "dpia", "done_on": "2026-08-01", "reference": "RIPD-1"})
    assert "AIG-002" in ids(make(raw))


def test_sensitive_data_accepts_consent(raw: dict[str, Any]) -> None:
    raw["personal_data"]["sensitive"] = True
    raw["legal_basis"] = "consent"
    raw["assessments"].append({"kind": "dpia", "done_on": "2026-08-01", "reference": "RIPD-1"})
    assert validate(make(raw), TODAY) == []


def test_store_without_retention_and_erasure(raw: dict[str, Any]) -> None:
    raw["stores"].append({"kind": "vector_store", "holds_personal_data": True})
    found = {(f.rule, f.field) for f in validate(make(raw), TODAY)}
    assert ("AIG-003", "stores[1].retention_days") in found
    assert ("AIG-004", "stores[1].erasure_supported") in found


def test_store_with_personal_data_contradicts_declaration(raw: dict[str, Any]) -> None:
    raw["personal_data"] = {"processes": False}
    raw["legal_basis"] = None
    assert "AIG-005" in ids(make(raw))


def test_foreign_provider_needs_transfer_mechanism(raw: dict[str, Any]) -> None:
    raw["provider"]["country"] = "US"
    assert "AIG-006" in ids(make(raw))
    raw["provider"]["transfer_mechanism"] = "clausulas-padrao-anpd-res-19-2024"
    assert "AIG-006" not in ids(make(raw))


def test_provider_training_is_warning_not_error(raw: dict[str, Any]) -> None:
    raw["provider"]["trains_on_inputs"] = True
    (f,) = validate(make(raw), TODAY)
    assert (f.rule, f.severity) == ("AIG-007", Severity.WARN)


def test_prohibited_blocks_until_retired(raw: dict[str, Any]) -> None:
    raw["risk_tier"] = "prohibited"
    assert "AIG-008" in ids(make(raw))
    raw["lifecycle"] = "retired"
    assert "AIG-008" not in ids(make(raw))


def test_high_risk_needs_impact_and_red_team(raw: dict[str, Any]) -> None:
    raw["risk_tier"] = "high"
    found = {(f.rule, f.severity) for f in validate(make(raw), TODAY)}
    assert ("AIG-009", Severity.ERROR) in found
    assert ("AIG-013", Severity.WARN) in found


def test_children_data_needs_dpia(raw: dict[str, Any]) -> None:
    raw["personal_data"]["children"] = True
    assert "AIG-010" in ids(make(raw))


def test_automated_decision_needs_review_path(raw: dict[str, Any]) -> None:
    raw["automated_decision"] = True
    assert "AIG-011" in ids(make(raw))
    raw["human_review"] = True
    assert "AIG-011" not in ids(make(raw))


@pytest.mark.parametrize(
    ("lifecycle", "severity"),
    [("production", Severity.ERROR), ("pilot", Severity.WARN)],
)
def test_incident_plan_severity_follows_lifecycle(
    raw: dict[str, Any], lifecycle: str, severity: Severity
) -> None:
    raw["incident_plan"] = None
    raw["lifecycle"] = lifecycle
    (f,) = (f for f in validate(make(raw), TODAY) if f.rule == "AIG-012")
    assert f.severity is severity


def test_draft_without_incident_plan_is_fine(raw: dict[str, Any]) -> None:
    raw["incident_plan"] = None
    raw["lifecycle"] = "draft"
    assert validate(make(raw), TODAY) == []


def test_assessment_staleness_depends_on_the_injected_clock(clean_record: AISystemRecord) -> None:
    assert "AIG-014" not in ids(clean_record, date(2026, 12, 31))
    assert "AIG-014" in ids(clean_record, date(2027, 9, 2))


def test_generative_without_disclosure_warns(raw: dict[str, Any]) -> None:
    raw["ai_disclosure"] = False
    (f,) = validate(make(raw), TODAY)
    assert (f.rule, f.severity) == ("AIG-015", Severity.WARN)


def test_every_rule_id_is_unique_and_documented() -> None:
    names = [r.__name__.split("_")[0].upper() for r in RULES]
    assert len(names) == len(set(names))


def test_schema_is_closed_unknown_key_is_rejected(raw: dict[str, Any]) -> None:
    raw["retencao_dias"] = 30  # typo for a field that does not exist
    with pytest.raises(ValidationError, match="Extra inputs"):
        make(raw)


def test_negative_control_removing_a_rule_hides_the_finding(raw: dict[str, Any]) -> None:
    raw["legal_basis"] = None
    record = make(raw)
    without = tuple(r for r in RULES if r.__name__ != "aig001_basis_required")
    assert validate(record, TODAY, without) == []
    assert validate(record, TODAY) != []
