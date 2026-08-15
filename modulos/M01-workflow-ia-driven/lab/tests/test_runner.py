from __future__ import annotations

import sys
import tempfile
import unittest
from pathlib import Path

from sdd_lab.runner import (
    POLICY_EXIT_CODE,
    TIMEOUT_EXIT_CODE,
    CommandPolicy,
    RunSpec,
    run_command,
)


class RunnerTests(unittest.TestCase):
    def test_tokenized_command_records_real_evidence(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            policy = CommandPolicy(frozenset({Path(sys.executable).name}), root)
            result = run_command(
                RunSpec((sys.executable, "-c", "print('real-output')"), root), policy
            )
            self.assertEqual(result.exit_code, 0)
            self.assertIn("real-output", result.stdout)
            self.assertGreaterEqual(result.duration_ms, 0)
            self.assertFalse(result.timed_out)
            self.assertIn("Python", result.tool_version)

    def test_seeded_mypy_error_blocks_and_cites_file(self) -> None:
        root = Path(__file__).parents[1]
        policy = CommandPolicy(frozenset({Path(sys.executable).name}), root)
        result = run_command(
            RunSpec(
                (
                    sys.executable,
                    "-m",
                    "mypy",
                    "fixtures/gates/type_error/broken.py",
                ),
                root,
            ),
            policy,
        )
        self.assertNotEqual(result.exit_code, 0)
        self.assertIn("broken.py:2", result.stdout)

    def test_timeout_has_distinct_code(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            policy = CommandPolicy(frozenset({Path(sys.executable).name}), root)
            result = run_command(
                RunSpec((sys.executable, "-c", "import time; time.sleep(1)"), root, 0.05),
                policy,
            )
            self.assertEqual(result.exit_code, TIMEOUT_EXIT_CODE)
            self.assertTrue(result.timed_out)

    def test_unreviewed_shell_script_and_escape_are_denied(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            policy = CommandPolicy(frozenset({"check.sh", Path(sys.executable).name}), root)
            shell = run_command(RunSpec(("check.sh",), root), policy)
            escape = run_command(RunSpec((sys.executable, "-V"), root.parent), policy)
            self.assertEqual(shell.exit_code, POLICY_EXIT_CODE)
            self.assertEqual(shell.policy_reason, "shell_script_requires_review")
            self.assertEqual(escape.policy_reason, "cwd_outside_workspace")


if __name__ == "__main__":
    unittest.main()
