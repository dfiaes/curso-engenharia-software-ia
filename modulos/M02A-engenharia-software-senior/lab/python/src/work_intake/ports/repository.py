"""Contrato da persistência local."""

from __future__ import annotations

from typing import Protocol

from work_intake.domain.models import EvaluationResult, WorkRequest


class StoredEvaluation:
    def __init__(self, *, intent_hash: str, result: EvaluationResult) -> None:
        self.intent_hash = intent_hash
        self.result = result


class EvaluationRepository(Protocol):
    def find_by_idempotency(self, tenant_id: str, key: str) -> StoredEvaluation | None: ...

    def save(self, request: WorkRequest, result: EvaluationResult) -> None: ...
