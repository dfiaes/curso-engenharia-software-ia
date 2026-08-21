"""Contrato agnóstico do componente probabilístico."""

from __future__ import annotations

from typing import Protocol

from work_intake.domain.models import AdvisorIdentity, Advisory, WorkRequest


class AdvisorError(RuntimeError):
    """Adapter não conseguiu produzir advisory contratualmente válido."""


class Advisor(Protocol):
    @property
    def identity(self) -> AdvisorIdentity: ...

    def advise(self, request: WorkRequest) -> Advisory: ...
