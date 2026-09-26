from __future__ import annotations

import sqlite3
import threading
from dataclasses import replace
from pathlib import Path

import pytest
from work_intake.adapters.advisor import FakeAdvisor
from work_intake.adapters.sqlite import SQLiteEvaluationRepository
from work_intake.application.boundary import parse_work_request_json
from work_intake.application.service import EvaluateWorkRequest, IdempotencyConflict
from work_intake.domain.models import Advisory, WorkRequest


def _request(lab_root: Path) -> WorkRequest:
    return parse_work_request_json(
        (lab_root / "fixtures/golden/request-v1.json").read_text(encoding="utf-8")
    )


def test_transaction_rolls_back_every_record(tmp_path: Path, lab_root: Path) -> None:
    def fail(stage: str) -> None:
        if stage == "before_commit":
            raise RuntimeError("falha injetada")

    repository = SQLiteEvaluationRepository(tmp_path / "rollback.sqlite", failure_hook=fail)
    service = EvaluateWorkRequest(repository=repository, advisor=FakeAdvisor())
    with pytest.raises(RuntimeError, match="falha injetada"):
        service.execute(_request(lab_root))
    assert repository.row_counts() == {
        "work_requests": 0,
        "advisories": 0,
        "decisions": 0,
        "audit_events": 0,
    }


def test_same_key_and_intent_reuses_without_second_advisor_call(
    tmp_path: Path, lab_root: Path
) -> None:
    repository = SQLiteEvaluationRepository(tmp_path / "idempotency.sqlite")
    service = EvaluateWorkRequest(repository=repository, advisor=FakeAdvisor())
    first = service.execute(_request(lab_root))
    second = service.execute(_request(lab_root))
    assert first.reused is False
    assert second.reused is True
    assert second.advisor_calls == 0
    assert repository.row_counts() == {
        "work_requests": 1,
        "advisories": 1,
        "decisions": 1,
        "audit_events": 1,
    }


def test_same_key_with_different_intent_is_conflict(tmp_path: Path, lab_root: Path) -> None:
    repository = SQLiteEvaluationRepository(tmp_path / "conflict.sqlite")
    service = EvaluateWorkRequest(repository=repository, advisor=FakeAdvisor())
    request = _request(lab_root)
    service.execute(request)
    with pytest.raises(IdempotencyConflict):
        service.execute(replace(request, intent="Outra intenção legítima"))
    assert repository.row_counts()["work_requests"] == 1


def test_tenant_isolation_and_sanitized_audit(tmp_path: Path, lab_root: Path) -> None:
    repository = SQLiteEvaluationRepository(tmp_path / "tenant.sqlite")
    request = _request(lab_root)
    EvaluateWorkRequest(repository=repository, advisor=FakeAdvisor()).execute(request)
    assert repository.request_exists(request.tenant_id, request.request_id)
    assert not repository.request_exists("tenant-outra", request.request_id)
    audit = repository.audit_payloads()[0]
    assert request.intent not in str(audit)
    assert audit["contract_version"] == "1.0"
    assert audit["idempotency_key"] == request.idempotency_key
    assert audit["policy_version"] == "1.0"


class BarrierAdvisor(FakeAdvisor):
    """Sincroniza duas chamadas para expor a disputa de escrita local."""

    def __init__(self, barrier: threading.Barrier) -> None:
        self._barrier = barrier

    def advise(self, request: WorkRequest) -> Advisory:
        self._barrier.wait(timeout=5)
        return super().advise(request)


def test_concurrent_same_key_has_one_winner_and_one_observable_conflict(
    tmp_path: Path, lab_root: Path
) -> None:
    database = tmp_path / "concurrent.sqlite"
    barrier = threading.Barrier(2)
    request = _request(lab_root)
    results: list[object] = []
    failures: list[BaseException] = []

    def execute_once() -> None:
        repository = SQLiteEvaluationRepository(database)
        service = EvaluateWorkRequest(repository=repository, advisor=BarrierAdvisor(barrier))
        try:
            results.append(service.execute(request))
        except BaseException as exc:
            failures.append(exc)

    first = threading.Thread(target=execute_once)
    second = threading.Thread(target=execute_once)
    first.start()
    second.start()
    first.join(timeout=10)
    second.join(timeout=10)

    assert not first.is_alive()
    assert not second.is_alive()
    assert len(results) == 1
    assert len(failures) == 1
    assert isinstance(failures[0], sqlite3.IntegrityError)
    assert SQLiteEvaluationRepository(database).row_counts()["work_requests"] == 1


def test_critical_idempotency_lookup_uses_an_index(tmp_path: Path) -> None:
    repository = SQLiteEvaluationRepository(tmp_path / "plan.sqlite")
    plan = repository.idempotency_query_plan("tenant-acme", "idem-onboard-001")
    assert any("SEARCH work_requests" in detail and "USING INDEX" in detail for detail in plan)
