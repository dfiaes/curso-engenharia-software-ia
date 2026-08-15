from __future__ import annotations

import json
import unittest
from pathlib import Path

from sdd_lab.contract import load_contract, validate_contract

ROOT = Path(__file__).parents[1]


class ContractTests(unittest.TestCase):
    def test_valid_contract_is_accepted_and_traced(self) -> None:
        result = load_contract(ROOT / "examples" / "feature.valid.json")
        self.assertTrue(result.ok)
        self.assertEqual(result.contract.feature_id if result.contract else None, "CAP-001")

    def test_vague_requirement_is_rejected_without_mutation(self) -> None:
        path = ROOT / "examples" / "feature.invalid.json"
        before = path.read_bytes()
        result = load_contract(path)
        self.assertIn("vague_requirement", {issue.code for issue in result.issues})
        self.assertEqual(path.read_bytes(), before)

    def test_missing_non_goals_is_rejected(self) -> None:
        data = json.loads((ROOT / "examples" / "feature.valid.json").read_text(encoding="utf-8"))
        data["non_goals"] = []
        result = validate_contract(data)
        self.assertIn("missing_non_goals", {issue.code for issue in result.issues})

    def test_untraced_requirement_is_rejected(self) -> None:
        data = json.loads((ROOT / "examples" / "feature.valid.json").read_text(encoding="utf-8"))
        data["tasks"][0]["requirement_ids"] = []
        result = validate_contract(data)
        self.assertIn("untraced_requirement", {issue.code for issue in result.issues})

    def test_shell_string_and_path_escape_are_rejected(self) -> None:
        result = load_contract(ROOT / "examples" / "feature.invalid.json")
        codes = {issue.code for issue in result.issues}
        self.assertIn("shell_string", codes)
        self.assertIn("unsafe_path", codes)


if __name__ == "__main__":
    unittest.main()
