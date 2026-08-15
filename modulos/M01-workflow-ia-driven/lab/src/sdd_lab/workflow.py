"""Reducer puro com checkpoint, retomada idempotente e orçamento de iteração."""

from __future__ import annotations

import json
from dataclasses import asdict, dataclass, replace
from enum import StrEnum
from pathlib import Path


class WorkflowStatus(StrEnum):
    PENDING = "pending"
    RUNNING = "running"
    PAUSED = "paused"
    COMPLETED = "completed"
    ESCALATED = "escalated"


class EventType(StrEnum):
    START = "start"
    STEP_SUCCEEDED = "step_succeeded"
    PAUSE = "pause"
    RESUME = "resume"
    COMPLETE = "complete"
    STEP_FAILED = "step_failed"


@dataclass(frozen=True)
class WorkflowEvent:
    type: EventType
    effect_id: str | None = None
    detail: str = ""


@dataclass(frozen=True)
class WorkflowState:
    workflow_id: str
    status: WorkflowStatus = WorkflowStatus.PENDING
    iteration: int = 0
    max_iterations: int = 5
    completed_effects: tuple[str, ...] = ()
    reason: str = ""


def reduce_state(state: WorkflowState, event: WorkflowEvent) -> WorkflowState:
    """Aplica evento sem I/O; efeitos já confirmados não são repetidos."""
    if state.status in {WorkflowStatus.COMPLETED, WorkflowStatus.ESCALATED}:
        return state
    if event.type is EventType.START and state.status is WorkflowStatus.PENDING:
        return replace(state, status=WorkflowStatus.RUNNING)
    if event.type is EventType.PAUSE and state.status is WorkflowStatus.RUNNING:
        return replace(state, status=WorkflowStatus.PAUSED, reason=event.detail)
    if event.type is EventType.RESUME and state.status is WorkflowStatus.PAUSED:
        return replace(state, status=WorkflowStatus.RUNNING, reason="")
    if event.type is EventType.COMPLETE and state.status is WorkflowStatus.RUNNING:
        return replace(state, status=WorkflowStatus.COMPLETED)
    if event.type is EventType.STEP_SUCCEEDED and state.status is WorkflowStatus.RUNNING:
        if not event.effect_id or event.effect_id in state.completed_effects:
            return state
        next_iteration = state.iteration + 1
        effects = (*state.completed_effects, event.effect_id)
        if next_iteration >= state.max_iterations:
            return replace(
                state,
                status=WorkflowStatus.ESCALATED,
                iteration=next_iteration,
                completed_effects=effects,
                reason="iteration_budget_exhausted",
            )
        return replace(state, iteration=next_iteration, completed_effects=effects)
    if event.type is EventType.STEP_FAILED and state.status is WorkflowStatus.RUNNING:
        next_iteration = state.iteration + 1
        if next_iteration >= state.max_iterations:
            return replace(
                state,
                status=WorkflowStatus.ESCALATED,
                iteration=next_iteration,
                reason=event.detail or "iteration_budget_exhausted",
            )
        return replace(state, iteration=next_iteration, reason=event.detail)
    return state


class CheckpointStore:
    def __init__(self, root: Path) -> None:
        self.root = root.resolve()
        self.root.mkdir(parents=True, exist_ok=True)

    def _path(self, workflow_id: str) -> Path:
        if not workflow_id or not all(char.isalnum() or char in "-_" for char in workflow_id):
            raise ValueError("workflow_id inseguro")
        return self.root / f"{workflow_id}.json"

    def save(self, state: WorkflowState) -> Path:
        target = self._path(state.workflow_id)
        temporary = target.with_suffix(".tmp")
        payload = asdict(state)
        payload["status"] = state.status.value
        temporary.write_text(
            json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
        )
        temporary.replace(target)
        return target

    def load(self, workflow_id: str) -> WorkflowState:
        data = json.loads(self._path(workflow_id).read_text(encoding="utf-8"))
        return WorkflowState(
            workflow_id=str(data["workflow_id"]),
            status=WorkflowStatus(data["status"]),
            iteration=int(data["iteration"]),
            max_iterations=int(data["max_iterations"]),
            completed_effects=tuple(str(item) for item in data["completed_effects"]),
            reason=str(data["reason"]),
        )
