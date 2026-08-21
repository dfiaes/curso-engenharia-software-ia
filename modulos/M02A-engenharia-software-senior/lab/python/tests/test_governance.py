from __future__ import annotations

import json
from pathlib import Path
from typing import Any

import pytest
from work_intake.governance import (
    GovernanceError,
    validate_claim_ledger,
    validate_risk_register,
)


def _load(path: Path) -> dict[str, Any]:
    payload: dict[str, Any] = json.loads(path.read_text(encoding="utf-8"))
    return payload


def test_risks_have_objective_owner_evidence_and_review_trigger(lab_root: Path) -> None:
    validate_risk_register(lab_root / "docs/risk-register.json")


@pytest.mark.parametrize("missing", ("objective_id", "owner", "evidence_basis", "review_trigger"))
def test_incomplete_risk_is_rejected(tmp_path: Path, lab_root: Path, missing: str) -> None:
    payload = _load(lab_root / "docs/risk-register.json")
    del payload["risks"][0][missing]
    path = tmp_path / "invalid-risks.json"
    path.write_text(json.dumps(payload), encoding="utf-8")
    with pytest.raises(GovernanceError, match="incompleto"):
        validate_risk_register(path)


def test_claims_require_existing_raw_artifact_digest_method_and_limitation(
    lab_root: Path,
) -> None:
    validate_claim_ledger(lab_root / "docs/claims.json", root=lab_root)


def test_claim_with_forged_digest_is_rejected(tmp_path: Path, lab_root: Path) -> None:
    payload = _load(lab_root / "docs/claims.json")
    payload["claims"][0]["raw_artifacts"][0]["sha256"] = "0" * 64
    path = tmp_path / "invalid-claims.json"
    path.write_text(json.dumps(payload), encoding="utf-8")
    with pytest.raises(GovernanceError, match="digest"):
        validate_claim_ledger(path, root=lab_root)


@pytest.mark.parametrize("missing", ("raw_artifacts", "method", "limitation"))
def test_incomplete_claim_is_rejected(tmp_path: Path, lab_root: Path, missing: str) -> None:
    payload = _load(lab_root / "docs/claims.json")
    del payload["claims"][0][missing]
    path = tmp_path / "incomplete-claims.json"
    path.write_text(json.dumps(payload), encoding="utf-8")
    with pytest.raises(GovernanceError, match="incompleto"):
        validate_claim_ledger(path, root=lab_root)
