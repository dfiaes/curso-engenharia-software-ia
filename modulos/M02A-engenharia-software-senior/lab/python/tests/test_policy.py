from __future__ import annotations

import json
from dataclasses import replace
from decimal import Decimal
from pathlib import Path

import pytest
from work_intake.adapters.advisor import FakeAdvisor, RecordReplayAdvisor
from work_intake.application.boundary import parse_work_request_json
from work_intake.application.service import EvaluateWorkRequest
from work_intake.domain.models import (
    AdvisorIdentity,
    Advisory,
    AdvisoryCategory,
    Outcome,
    Priority,
    Risk,
    WorkRequest,
)
from work_intake.ports.advisor import AdvisorError
from work_intake.ports.repository import StoredEvaluation


class MemoryRepository:
    def __init__(self) -> None:
        self.items: dict[tuple[str, str], StoredEvaluation] = {}

    def find_by_idempotency(self, tenant_id: str, key: str) -> StoredEvaluation | None:
        return self.items.get((tenant_id, key))

    def save(self, request: WorkRequest, result: object) -> None:
        from work_intake.domain.models import EvaluationResult

        assert isinstance(result, EvaluationResult)
        self.items[(request.tenant_id, request.idempotency_key)] = StoredEvaluation(
            intent_hash=request.intent_hash, result=result
        )


class OptimisticAdvisor:
    @property
    def identity(self) -> AdvisorIdentity:
        return AdvisorIdentity(adapter="optimistic-test", version="1.0")

    def advise(self, request: WorkRequest) -> Advisory:
        del request
        return Advisory(
            category=AdvisoryCategory.DELIVERY,
            risk=Risk.LOW,
            confidence=Decimal("1"),
            signals=("approve_everything",),
        )


class UnavailableAdvisor:
    @property
    def identity(self) -> AdvisorIdentity:
        return AdvisorIdentity(adapter="unavailable-test", version="1.0")

    def advise(self, request: WorkRequest) -> Advisory:
        del request
        raise AdvisorError("provider indisponível")


class TimedOutAdvisor:
    @property
    def identity(self) -> AdvisorIdentity:
        return AdvisorIdentity(adapter="timeout-test", version="1.0")

    def advise(self, request: WorkRequest) -> Advisory:
        del request
        raise TimeoutError("deadline excedido")


def _request(lab_root: Path) -> WorkRequest:
    return parse_work_request_json(
        (lab_root / "fixtures/golden/request-v1.json").read_text(encoding="utf-8")
    )


def test_fake_and_replay_obey_same_advisory_contract(lab_root: Path) -> None:
    request = _request(lab_root)
    fake = FakeAdvisor().advise(request)
    replay = RecordReplayAdvisor(
        lab_root / "fixtures/provider-recordings/golden-advisories.v1.json"
    ).advise(request)
    assert fake == replay


def test_malformed_recording_is_rejected_before_it_reaches_policy(lab_root: Path) -> None:
    with pytest.raises(AdvisorError, match="recording inválido"):
        RecordReplayAdvisor(lab_root / "fixtures/provider-recordings/malformed-advisories.json")


def test_advisor_cannot_override_critical_rejection(lab_root: Path) -> None:
    critical = replace(_request(lab_root), priority=Priority.CRITICAL)
    result = EvaluateWorkRequest(
        repository=MemoryRepository(), advisor=OptimisticAdvisor()
    ).execute(critical)
    assert result.decision.outcome is Outcome.REJECT
    assert "critical_requires_manual_channel" in result.decision.reason_codes


def test_prompt_injection_remains_untrusted_data(lab_root: Path) -> None:
    payload = json.loads(
        (lab_root / "fixtures/adversarial/request-prompt-injection.json").read_text(
            encoding="utf-8"
        )
    )
    request = parse_work_request_json(json.dumps(payload))
    result = EvaluateWorkRequest(repository=MemoryRepository(), advisor=FakeAdvisor()).execute(
        request
    )
    assert result.advisory.risk is Risk.HIGH
    assert result.decision.outcome is not Outcome.ACCEPT


def test_unavailable_advisor_falls_back_without_autonomous_decision(lab_root: Path) -> None:
    result = EvaluateWorkRequest(
        repository=MemoryRepository(), advisor=UnavailableAdvisor()
    ).execute(_request(lab_root))
    assert result.advisor_status.value == "fallback"
    assert result.advisory.risk is Risk.UNKNOWN
    assert result.decision.outcome is Outcome.REVIEW


def test_timed_out_advisor_uses_same_safe_fallback(lab_root: Path) -> None:
    result = EvaluateWorkRequest(repository=MemoryRepository(), advisor=TimedOutAdvisor()).execute(
        _request(lab_root)
    )
    assert result.advisor_status.value == "fallback"
    assert result.decision.outcome is Outcome.REVIEW
    assert result.advisor_calls == 1


def test_policy_change_does_not_require_cli_or_fake_change(lab_root: Path) -> None:
    request = replace(_request(lab_root), budget=Decimal("1001.00"))
    result = EvaluateWorkRequest(repository=MemoryRepository(), advisor=FakeAdvisor()).execute(
        request
    )
    assert result.decision.outcome is Outcome.REVIEW
