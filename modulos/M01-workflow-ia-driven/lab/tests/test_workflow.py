from __future__ import annotations

import tempfile
import unittest
from pathlib import Path

from sdd_lab.workflow import (
    CheckpointStore,
    EventType,
    WorkflowEvent,
    WorkflowState,
    WorkflowStatus,
    reduce_state,
)


class WorkflowTests(unittest.TestCase):
    def test_pause_checkpoint_resume_does_not_repeat_effect(self) -> None:
        state = reduce_state(WorkflowState("demo"), WorkflowEvent(EventType.START))
        state = reduce_state(state, WorkflowEvent(EventType.STEP_SUCCEEDED, "email-001"))
        state = reduce_state(state, WorkflowEvent(EventType.PAUSE, detail="aprovação humana"))
        with tempfile.TemporaryDirectory() as directory:
            store = CheckpointStore(Path(directory))
            store.save(state)
            restored = store.load("demo")
        resumed = reduce_state(restored, WorkflowEvent(EventType.RESUME))
        repeated = reduce_state(resumed, WorkflowEvent(EventType.STEP_SUCCEEDED, "email-001"))
        self.assertEqual(repeated.iteration, 1)
        self.assertEqual(repeated.completed_effects, ("email-001",))

    def test_iteration_budget_escalates_with_handoff_reason(self) -> None:
        state = reduce_state(
            WorkflowState("budget", max_iterations=2), WorkflowEvent(EventType.START)
        )
        state = reduce_state(state, WorkflowEvent(EventType.STEP_FAILED, detail="falha 1"))
        state = reduce_state(state, WorkflowEvent(EventType.STEP_FAILED, detail="falha 2"))
        self.assertEqual(state.status, WorkflowStatus.ESCALATED)
        self.assertEqual(state.reason, "falha 2")

    def test_checkpoint_rejects_unsafe_identifier(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            store = CheckpointStore(Path(directory))
            with self.assertRaises(ValueError):
                store.save(WorkflowState("../escape"))


if __name__ == "__main__":
    unittest.main()
