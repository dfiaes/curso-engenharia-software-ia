"""Orquestra policy, advisor e persistência sem depender de adapters concretos."""

from __future__ import annotations

from decimal import Decimal

from work_intake.domain.models import (
    AdvisorIdentity,
    AdvisorStatus,
    Advisory,
    AdvisoryCategory,
    EvaluationResult,
    Risk,
    WorkRequest,
)
from work_intake.domain.policy import IntakePolicy
from work_intake.ports.advisor import Advisor, AdvisorError
from work_intake.ports.repository import EvaluationRepository


class IdempotencyConflict(ValueError):
    """A mesma chave foi reutilizada para uma intenção diferente."""


class EvaluateWorkRequest:
    def __init__(
        self,
        *,
        repository: EvaluationRepository,
        advisor: Advisor,
        policy: IntakePolicy | None = None,
    ) -> None:
        self._repository = repository
        self._advisor = advisor
        self._policy = policy or IntakePolicy()

    def execute(self, request: WorkRequest) -> EvaluationResult:
        stored = self._repository.find_by_idempotency(request.tenant_id, request.idempotency_key)
        if stored is not None:
            if stored.intent_hash != request.intent_hash:
                raise IdempotencyConflict("idempotency key já representa outra intenção")
            result = stored.result
            return EvaluationResult(
                decision=result.decision,
                advisory=result.advisory,
                advisor_identity=result.advisor_identity,
                advisor_status=result.advisor_status,
                reused=True,
                advisor_calls=0,
            )

        identity = self._advisor.identity
        status = AdvisorStatus.AVAILABLE
        try:
            advisory = self._advisor.advise(request)
            if not isinstance(advisory, Advisory):
                raise AdvisorError("adapter retornou tipo fora do contrato")
        except AdvisorError, TimeoutError, ValueError, TypeError:
            status = AdvisorStatus.FALLBACK
            advisory = Advisory(
                category=AdvisoryCategory.UNKNOWN,
                risk=Risk.UNKNOWN,
                confidence=Decimal("0"),
                signals=("advisor_unavailable",),
            )
            identity = AdvisorIdentity(
                adapter=identity.adapter,
                version=identity.version,
                digest=identity.digest,
            )

        decision = self._policy.decide(request, advisory)
        result = EvaluationResult(
            decision=decision,
            advisory=advisory,
            advisor_identity=identity,
            advisor_status=status,
        )
        self._repository.save(request, result)
        return result
