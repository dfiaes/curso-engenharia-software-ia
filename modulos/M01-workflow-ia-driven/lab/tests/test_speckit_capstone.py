from __future__ import annotations

import tempfile
import unittest
from pathlib import Path

from sdd_lab.capstone import validate_capstone_slice
from sdd_lab.speckit_inspector import inspect_snapshot

ROOT = Path(__file__).parents[1]


class SpecKitCapstoneTests(unittest.TestCase):
    def test_discovers_invocation_forms_without_executing_snapshot(self) -> None:
        snapshot = inspect_snapshot(ROOT / "fixtures" / "speckit")
        self.assertIn("/speckit.specify", snapshot.commands)
        self.assertIn("$speckit-specify", snapshot.commands)
        self.assertEqual(snapshot.files_with_process_steps, ("dollar/workflow.md",))

    def test_capstone_slice_has_trace_tests_and_resumable_handoff(self) -> None:
        result = validate_capstone_slice(ROOT / "fixtures" / "capstone")
        self.assertTrue(result.ok, result.issues)

    def test_incomplete_capstone_slice_is_rejected(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            result = validate_capstone_slice(Path(directory))
        self.assertFalse(result.ok)
        self.assertIn("missing:intent.md", result.issues)


if __name__ == "__main__":
    unittest.main()
