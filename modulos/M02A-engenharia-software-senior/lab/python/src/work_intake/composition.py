"""Composition root: único lugar que seleciona adapters concretos."""

from __future__ import annotations

from pathlib import Path

from work_intake.adapters.advisor import FakeAdvisor, RecordReplayAdvisor
from work_intake.adapters.sqlite import SQLiteEvaluationRepository
from work_intake.application.service import EvaluateWorkRequest
from work_intake.ports.advisor import Advisor, AdvisorError


def build_evaluator(
    *, database: Path, advisor_kind: str, recording: Path | None
) -> EvaluateWorkRequest:
    repository = SQLiteEvaluationRepository(database)
    advisor: Advisor
    if advisor_kind == "fake":
        advisor = FakeAdvisor()
    elif advisor_kind == "replay":
        if recording is None:
            raise AdvisorError("--recording é obrigatório para advisor replay")
        advisor = RecordReplayAdvisor(recording)
    else:
        raise AdvisorError("adapter desconhecido")
    return EvaluateWorkRequest(repository=repository, advisor=advisor)
