from __future__ import annotations

import tempfile
import unittest
from pathlib import Path

from backlog_tasks import Task
from course_flow import acquire, choose, release


def task(identifier: str, deps: tuple[str, ...] = (), track: str = "core") -> Task:
    return Task(
        identifier,
        "test",
        "GPT-6-Luna-high",
        deps,
        "test",
        (),
        (),
        (),
        (),
        track=track,
        evidence=identifier + ".md",
    )


class CourseFlowTests(unittest.TestCase):
    def setUp(self) -> None:
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.tasks = [task("A"), task("B", ("A",)), task("ML", ("A",), "appendix")]
        self.status = "**Automação:** ATIVA\n**Unidade ativa: A — PLANEJADO.**"

    def report(
        self, identifier: str, state: str, author: str = "old", reviewer: str = "review"
    ) -> None:
        (self.root / (identifier + ".md")).write_text(
            f"**Estado:** {state}\n**Sessão de autoria:** {author}\n**Sessão de revisão:** {reviewer}\n",
            encoding="utf-8",
        )

    def test_cannot_review_own_delivery_or_unblock_dependency(self) -> None:
        self.report("A", "AGUARDA_REVISAO", "run")
        self.assertEqual(
            choose(self.tasks, self.root, "run", self.status)["action"], "AGUARDAR"
        )
        self.assertEqual(
            choose(self.tasks, self.root, "other", self.status)["action"], "REVISAR"
        )

    def test_approval_unlocks_next_core_before_appendix(self) -> None:
        self.report("A", "REVISADO")
        self.assertEqual(choose(self.tasks, self.root, "run", self.status)["task"], "B")
        self.report("B", "REVISADO")
        self.assertEqual(
            choose(self.tasks, self.root, "run", self.status)["task"], "ML"
        )

    def test_pause_overrides_queue(self) -> None:
        self.assertEqual(
            choose(self.tasks, self.root, "run", "**Automação:** PAUSADA")["action"],
            "PAUSADA",
        )

    def test_second_review_requires_another_session(self) -> None:
        self.report("A", "AGUARDA_REVISAO", "author", "reviewer")
        self.assertEqual(
            choose(self.tasks, self.root, "reviewer", self.status)["action"],
            "AGUARDAR",
        )
        self.assertEqual(
            choose(self.tasks, self.root, "third", self.status)["action"], "REVISAR"
        )

    def test_pending_review_cannot_unlock_dependency(self) -> None:
        self.report("A", "REVISADO", "author", "pendente")
        with self.assertRaises(ValueError):
            choose(self.tasks, self.root, "run", self.status)

    def test_block_does_not_stop_independent_work(self) -> None:
        self.report("A", "BLOQUEADO")
        self.assertEqual(
            choose([*self.tasks, task("C")], self.root, "run", self.status)["task"], "C"
        )

    def test_no_fake_or_stale_approval(self) -> None:
        self.report("A", "REVISADO", "same", "same")
        with self.assertRaises(ValueError):
            choose(self.tasks, self.root, "run", self.status)
        self.report("A", "BLOQUEADO")
        self.report("B", "REVISADO")
        with self.assertRaises(ValueError):
            choose(self.tasks, self.root, "run", self.status)

    def test_lock_prevents_overlapping_writers(self) -> None:
        lock = self.root / "lock"
        self.assertTrue(acquire(lock, "one"))
        self.assertFalse(acquire(lock, "two"))
        with self.assertRaises(ValueError):
            release(lock, "two")
        release(lock, "one")
        self.assertTrue(acquire(lock, "two"))
        release(lock, "two")

    def test_empty_report_is_not_approved(self) -> None:
        (self.root / "A.md").write_text("")
        with self.assertRaises(ValueError):
            choose(self.tasks, self.root, "run", self.status)


if __name__ == "__main__":
    unittest.main()
