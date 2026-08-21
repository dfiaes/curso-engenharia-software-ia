"""Tipos de domínio e representações canônicas."""

from __future__ import annotations

import hashlib
import json
from dataclasses import dataclass
from datetime import UTC, datetime
from decimal import Decimal
from enum import StrEnum
from typing import Any


class Priority(StrEnum):
    LOW = "low"
    NORMAL = "normal"
    HIGH = "high"
    CRITICAL = "critical"


class AdvisoryCategory(StrEnum):
    DELIVERY = "delivery"
    OPERATIONS = "operations"
    SECURITY = "security"
    UNKNOWN = "unknown"


class Risk(StrEnum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    UNKNOWN = "unknown"


class Outcome(StrEnum):
    ACCEPT = "accept"
    REVIEW = "review"
    REJECT = "reject"


class AdvisorStatus(StrEnum):
    AVAILABLE = "available"
    FALLBACK = "fallback"


@dataclass(frozen=True, slots=True)
class WorkRequest:
    contract_version: str
    request_id: str
    tenant_id: str
    intent: str
    priority: Priority
    budget: Decimal
    deadline_at: datetime
    idempotency_key: str
    source: str | None = None

    def __post_init__(self) -> None:
        if self.deadline_at.tzinfo is None or self.deadline_at.utcoffset() is None:
            raise ValueError("deadline_at deve possuir timezone")
        if self.budget < 0:
            raise ValueError("budget não pode ser negativo")

    @property
    def intent_hash(self) -> str:
        payload = {
            "budget": format(self.budget.quantize(Decimal("0.01")), "f"),
            "contract_version": self.contract_version,
            "deadline_at": self.deadline_at.astimezone(UTC).isoformat(),
            "intent": self.intent.strip(),
            "priority": self.priority.value,
            "source": self.source,
            "tenant_id": self.tenant_id,
        }
        canonical = json.dumps(
            payload, ensure_ascii=False, sort_keys=True, separators=(",", ":")
        ).encode("utf-8")
        return hashlib.sha256(canonical).hexdigest()


@dataclass(frozen=True, slots=True)
class Advisory:
    category: AdvisoryCategory
    risk: Risk
    confidence: Decimal
    signals: tuple[str, ...]

    def __post_init__(self) -> None:
        if not Decimal("0") <= self.confidence <= Decimal("1"):
            raise ValueError("confidence deve estar entre 0 e 1")
        if len(set(self.signals)) != len(self.signals):
            raise ValueError("signals não podem repetir")


@dataclass(frozen=True, slots=True)
class AdvisorIdentity:
    adapter: str
    version: str
    digest: str | None = None


@dataclass(frozen=True, slots=True)
class Decision:
    request_id: str
    outcome: Outcome
    reason_codes: tuple[str, ...]
    policy_version: str
    contract_version: str

    def __post_init__(self) -> None:
        if not self.reason_codes:
            raise ValueError("decision exige ao menos um reason code")
        if len(set(self.reason_codes)) != len(self.reason_codes):
            raise ValueError("reason codes não podem repetir")


@dataclass(frozen=True, slots=True)
class EvaluationResult:
    decision: Decision
    advisory: Advisory
    advisor_identity: AdvisorIdentity
    advisor_status: AdvisorStatus
    reused: bool = False
    advisor_calls: int = 1

    def __post_init__(self) -> None:
        if self.advisor_calls not in (0, 1):
            raise ValueError("o primeiro slice permite no máximo uma chamada ao advisor")
        if self.reused and self.advisor_calls != 0:
            raise ValueError("resultado reutilizado não pode chamar o advisor")

    def as_payload(self) -> dict[str, Any]:
        return {
            "schema_version": "1.0",
            "request_id": self.decision.request_id,
            "outcome": self.decision.outcome.value,
            "reason_codes": list(self.decision.reason_codes),
            "policy_version": self.decision.policy_version,
            "contract_version": self.decision.contract_version,
            "advisor": {
                "adapter": self.advisor_identity.adapter,
                "version": self.advisor_identity.version,
                "status": self.advisor_status.value,
                "digest": self.advisor_identity.digest,
            },
            "reused": self.reused,
        }
