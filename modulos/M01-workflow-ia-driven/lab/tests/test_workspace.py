from __future__ import annotations

import tempfile
import unittest
from pathlib import Path

from sdd_lab.workspace import (
    GitWorktreeSandbox,
    WorkUnit,
    assess_parallelism,
    contract_integration_gate,
    resolve_within,
    unexpected_changes,
)


class WorkspaceTests(unittest.TestCase):
    def test_write_set_detects_extra_file(self) -> None:
        extras = unexpected_changes(
            {"src/a.py", "secrets.txt"},
            {"src/a.py"},
        )
        self.assertEqual(extras, frozenset({"secrets.txt"}))

    def test_parallelism_considers_contracts_and_resources(self) -> None:
        left = WorkUnit("a", frozenset({"a.py"}), frozenset({"api-v1"}), frozenset())
        right = WorkUnit("b", frozenset({"b.py"}), frozenset({"api-v1"}), frozenset())
        decision = assess_parallelism(left, right)
        self.assertFalse(decision.safe)
        self.assertIn("shared_contract", decision.reasons)

    def test_clean_textual_merge_can_fail_semantic_gate(self) -> None:
        result = contract_integration_gate(produced_amount=120, consumer_limit=110)
        self.assertTrue(result.textual_merge_clean)
        self.assertFalse(result.semantic_gate_passed)
        self.assertIn("120", result.detail)

    def test_path_escape_is_rejected(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            with self.assertRaises(ValueError):
                resolve_within(root, root.parent / "outside")

    def test_real_git_worktrees_merge_cleanly_and_cleanup_safely(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            sandbox = GitWorktreeSandbox(Path(directory))
            sandbox.initialize()
            producer = sandbox.add("producer")
            consumer = sandbox.add("consumer")
            sandbox.commit_file(producer, "producer.txt", "amount=120\n")
            sandbox.commit_file(consumer, "consumer.txt", "limit=110\n")
            sandbox.merge("producer")
            sandbox.merge("consumer")
            self.assertTrue((sandbox.repo / "producer.txt").is_file())
            self.assertTrue((sandbox.repo / "consumer.txt").is_file())
            produced = int((sandbox.repo / "producer.txt").read_text().split("=")[1])
            limit = int((sandbox.repo / "consumer.txt").read_text().split("=")[1])
            semantic = contract_integration_gate(
                produced_amount=produced,
                consumer_limit=limit,
            )
            self.assertFalse(semantic.semantic_gate_passed)
            self.assertIn("worktree", sandbox.list_porcelain())
            sandbox.remove(producer)
            sandbox.remove(consumer)
            self.assertFalse(producer.exists())
            self.assertFalse(consumer.exists())

    def test_dirty_worktree_cleanup_is_refused(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            sandbox = GitWorktreeSandbox(Path(directory))
            sandbox.initialize()
            tree = sandbox.add("dirty")
            (tree / "untracked.txt").write_text("não apagar\n", encoding="utf-8")
            with self.assertRaisesRegex(RuntimeError, "mudanças"):
                sandbox.remove(tree)


if __name__ == "__main__":
    unittest.main()
