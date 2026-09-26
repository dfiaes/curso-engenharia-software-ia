from __future__ import annotations

import unittest
from dataclasses import replace

from backlog_tasks import Task, build_tasks, html_excerpt, prompt
from validate_backlog import BACKLOG, validate


class BacklogValidationTests(unittest.TestCase):
    def test_block_bundle_excludes_unrelated_html(self) -> None:
        html = (
            "<h2>Bloco 1 · Primeiro</h2><p>alvo</p>"
            "<h2>Bloco 2 · Segundo</h2><p>fora</p>"
            "<h2>Laboratório guiado</h2><p>execução</p>"
        )
        content = html_excerpt(html, "M06-B01-C")
        self.assertIn("alvo", content)
        self.assertNotIn("fora", content)
        self.assertNotIn("execução", content)
        lab = html_excerpt(html, "M06-B01-L")
        self.assertIn("execução", lab)
        self.assertEqual(html_excerpt(html, "M06-R"), html)

    def setUp(self) -> None:
        self.backlog = BACKLOG.read_text(encoding="utf-8")
        self.tasks = build_tasks()

    def changed(
        self,
        identifier: str,
        *,
        depends_on: tuple[str, ...] | None = None,
        owner: str | None = None,
        release_blocking: bool | None = None,
        scenario_ids: tuple[str, ...] | None = None,
        steps: tuple[str, ...] | None = None,
    ) -> list[Task]:
        return [
            replace(
                t,
                depends_on=t.depends_on if depends_on is None else depends_on,
                owner=t.owner if owner is None else owner,
                release_blocking=(
                    t.release_blocking if release_blocking is None else release_blocking
                ),
                scenario_ids=t.scenario_ids if scenario_ids is None else scenario_ids,
                steps=t.steps if steps is None else steps,
            )
            if t.id == identifier
            else t
            for t in self.tasks
        ]

    def test_materialized_graph_is_valid(self) -> None:
        self.assertEqual(validate(self.tasks, self.backlog), [])

    def test_missing_leaf_is_rejected(self) -> None:
        tasks = [t for t in self.tasks if t.id != "M03-B01-D"]
        self.assertTrue(
            any("missing atomic leaf" in e for e in validate(tasks, self.backlog))
        )

    def test_cycle_is_rejected(self) -> None:
        tasks = self.changed("M03-B01-C", depends_on=("M03-B01-D",))
        self.assertTrue(any("cycle" in e for e in validate(tasks, self.backlog)))

    def test_dangling_dependency_is_rejected(self) -> None:
        tasks = self.changed("M03-B01-C", depends_on=("NO-SUCH-TASK",))
        self.assertTrue(
            any("dangling dependency" in e for e in validate(tasks, self.backlog))
        )

    def test_non_luna_owner_is_rejected(self) -> None:
        tasks = self.changed("M03-B01-C", owner="Astra-final")
        self.assertTrue(
            any("non-Luna owner" in e for e in validate(tasks, self.backlog))
        )

    def test_optional_appendix_cannot_block_main(self) -> None:
        tasks = self.changed("M06-B01-C", depends_on=("ML01-E",))
        self.assertTrue(
            any(
                "optional appendix blocks core" in e
                for e in validate(tasks, self.backlog)
            )
        )

    def test_optional_task_cannot_be_main_blocker(self) -> None:
        tasks = self.changed("ML01-B01-C", release_blocking=True)
        self.assertTrue(
            any("optional task marked" in e for e in validate(tasks, self.backlog))
        )

    def test_main_release_cannot_skip_required_work(self) -> None:
        tasks = self.changed("REL-01", depends_on=("M02-E",))
        self.assertTrue(
            any("does not depend on all" in e for e in validate(tasks, self.backlog))
        )

    def test_unknown_scenario_is_rejected(self) -> None:
        tasks = self.changed("M03-B01-C", scenario_ids=("M03-AT-999",))
        self.assertTrue(
            any("unknown scenario" in e for e in validate(tasks, self.backlog))
        )

    def test_missing_scenario_coverage_is_rejected(self) -> None:
        tasks = [
            replace(
                t, scenario_ids=tuple(s for s in t.scenario_ids if s != "M03-AT-001")
            )
            for t in self.tasks
        ]
        self.assertTrue(
            any(
                "missing acceptance coverage" in e
                for e in validate(tasks, self.backlog)
            )
        )

    def test_packet_requires_steps(self) -> None:
        tasks = self.changed("FIX-01", steps=())
        self.assertTrue(
            any("incomplete task" in e for e in validate(tasks, self.backlog))
        )

    def test_prompt_contains_concrete_failures_and_scope(self) -> None:
        task = next(t for t in self.tasks if t.id == "FIX-03")
        text = prompt(task)
        self.assertIn("Diretório vazio", text)
        self.assertIn("Write set", text)
        self.assertIn("NO-GO", text)
        self.assertIn("PROGRESSO.md", text)

    def test_appendix_release_covers_all_optional_work(self) -> None:
        tasks = self.changed("ML-REL-01", depends_on=("ML01-E",))
        self.assertTrue(
            any(
                "appendix review does not cover" in e
                for e in validate(tasks, self.backlog)
            )
        )


if __name__ == "__main__":
    unittest.main()
