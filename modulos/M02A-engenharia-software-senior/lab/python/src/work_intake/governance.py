"""Validação executável de riscos e alegações profissionais do laboratório."""

from __future__ import annotations

import hashlib
import json
from pathlib import Path
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, ValidationError


class GovernanceError(ValueError):
    """Artefato profissional incompleto, inconsistente ou não verificável."""


class _Risk(BaseModel):
    model_config = ConfigDict(extra="forbid", strict=True)

    risk_id: str = Field(pattern=r"^RISK-[0-9]{3}$")
    objective_id: str = Field(min_length=3)
    statement: str = Field(min_length=20)
    owner: str = Field(min_length=3)
    evidence_basis: list[str] = Field(min_length=1)
    review_trigger: str = Field(min_length=10)
    impact: Literal["low", "medium", "high"]
    detectability: Literal["low", "medium", "high"]
    reversibility: Literal["low", "medium", "high"]
    confidence: Literal["low", "medium", "high"]
    limitation: str = Field(min_length=10)


class _RiskRegister(BaseModel):
    model_config = ConfigDict(extra="forbid", strict=True)

    schema_version: Literal["1.0"]
    objective_id: str = Field(min_length=3)
    objective: str = Field(min_length=20)
    risks: list[_Risk] = Field(min_length=1)


class _Artifact(BaseModel):
    model_config = ConfigDict(extra="forbid", strict=True)

    path: str = Field(min_length=1)
    sha256: str = Field(pattern=r"^[a-f0-9]{64}$")


class _Claim(BaseModel):
    model_config = ConfigDict(extra="forbid", strict=True)

    claim_id: str = Field(pattern=r"^CLAIM-[0-9]{3}$")
    kind: Literal["technical", "organizational"]
    statement: str = Field(min_length=20)
    method: str = Field(min_length=20)
    raw_artifacts: list[_Artifact] = Field(min_length=1)
    limitation: str = Field(min_length=10)


class _ClaimLedger(BaseModel):
    model_config = ConfigDict(extra="forbid", strict=True)

    schema_version: Literal["1.0"]
    claims: list[_Claim] = Field(min_length=1)


def _load(path: Path) -> object:
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except (OSError, UnicodeError, json.JSONDecodeError) as exc:
        raise GovernanceError("artefato de governança ilegível") from exc


def validate_risk_register(path: Path) -> None:
    try:
        register = _RiskRegister.model_validate(_load(path))
    except ValidationError as exc:
        raise GovernanceError("registro de riscos incompleto") from exc
    if len({risk.risk_id for risk in register.risks}) != len(register.risks):
        raise GovernanceError("risk_id duplicado")
    if any(risk.objective_id != register.objective_id for risk in register.risks):
        raise GovernanceError("risco sem vínculo ao objetivo declarado")


def validate_claim_ledger(path: Path, *, root: Path) -> None:
    try:
        ledger = _ClaimLedger.model_validate(_load(path))
    except ValidationError as exc:
        raise GovernanceError("registro de alegações incompleto") from exc
    if len({claim.claim_id for claim in ledger.claims}) != len(ledger.claims):
        raise GovernanceError("claim_id duplicado")
    resolved_root = root.resolve()
    for claim in ledger.claims:
        for artifact in claim.raw_artifacts:
            candidate = (resolved_root / artifact.path).resolve()
            if not candidate.is_relative_to(resolved_root) or not candidate.is_file():
                raise GovernanceError("artefato bruto ausente ou fora do laboratório")
            digest = hashlib.sha256(candidate.read_bytes()).hexdigest()
            if digest != artifact.sha256:
                raise GovernanceError("digest de artefato bruto diverge")
