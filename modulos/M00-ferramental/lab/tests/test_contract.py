import json
import tempfile
import unittest
from pathlib import Path

from harness_lab.contract import load_contract


class ContractTests(unittest.TestCase):
    def setUp(self) -> None:
        self.root = Path(__file__).parents[1]

    def test_safe_contract_is_valid(self) -> None:
        contract = load_contract(self.root / "examples" / "harness.safe.json")
        self.assertEqual((), contract.violations())

    def test_invalid_contract_reports_core_violations(self) -> None:
        contract = load_contract(self.root / "examples" / "harness.invalid.json")
        codes = "\n".join(contract.violations())
        self.assertIn("MISSING_PORTABLE_INSTRUCTIONS", codes)
        self.assertIn("MISSING_EVIDENCE", codes)
        self.assertIn("MISSING_ALLOWLIST", codes)
        self.assertIn("INVALID_CONTEXT_BUDGET", codes)
        self.assertIn("UNVERSIONED_INTEGRATION", codes)
        self.assertIn("MISSING_OBJECTIVE", codes)
        self.assertIn("MISSING_IN_SCOPE", codes)
        self.assertIn("MISSING_OUT_OF_SCOPE", codes)
        self.assertIn("MISSING_CAPABILITIES", codes)
        self.assertIn("MISSING_STOP_CONDITIONS", codes)

    def test_empty_task_contract_item_is_rejected(self) -> None:
        contract = load_contract(self.root / "examples" / "harness.safe.json")
        incomplete = contract.__class__(
            objective=" ",
            in_scope=("",),
            out_of_scope=contract.out_of_scope,
            capabilities=contract.capabilities,
            stop_conditions=contract.stop_conditions,
            instruction_files=contract.instruction_files,
            evidence_commands=contract.evidence_commands,
            allowed_command_prefixes=contract.allowed_command_prefixes,
            context_budget=contract.context_budget,
            integrations=contract.integrations,
        )
        codes = "\n".join(incomplete.violations())
        self.assertIn("MISSING_OBJECTIVE", codes)
        self.assertIn("MISSING_IN_SCOPE", codes)

    def test_shell_string_is_rejected(self) -> None:
        payload = {
            "instruction_files": ["AGENTS.md"],
            "evidence_commands": ["python -m unittest"],
            "allowed_command_prefixes": [["python"]],
            "context_budget": 100,
        }
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "contract.json"
            path.write_text(json.dumps(payload), encoding="utf-8")
            with self.assertRaisesRegex(ValueError, "não aceita string de shell"):
                load_contract(path)

    def test_boolean_is_not_integer_budget(self) -> None:
        payload = {
            "instruction_files": ["AGENTS.md"],
            "evidence_commands": [["python"]],
            "allowed_command_prefixes": [["python"]],
            "context_budget": True,
        }
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "contract.json"
            path.write_text(json.dumps(payload), encoding="utf-8")
            with self.assertRaisesRegex(ValueError, "deve ser inteiro"):
                load_contract(path)


if __name__ == "__main__":
    unittest.main()
