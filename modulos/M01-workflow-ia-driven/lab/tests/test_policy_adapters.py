from __future__ import annotations

import unittest
from pathlib import Path

from sdd_lab.adapters import AgentSkillsAdapter, GenericHarnessAdapter
from sdd_lab.contract import load_contract
from sdd_lab.policy import WorkflowReview, authorize_external_workflow, review_fingerprint

ROOT = Path(__file__).parents[1]


class PolicyAdapterTests(unittest.TestCase):
    def test_external_process_requires_exact_review_and_allowlist(self) -> None:
        content = b"steps:\n  - run: python -m unittest\n"
        denied = authorize_external_workflow(content, "python", None)
        self.assertFalse(denied.allowed)
        review = WorkflowReview(review_fingerprint(content), frozenset({"python"}))
        allowed = authorize_external_workflow(content, "python", review)
        changed = authorize_external_workflow(content + b"# changed", "python", review)
        self.assertTrue(allowed.allowed)
        self.assertEqual(changed.reason, "content_changed_after_review")

    def test_two_adapters_preserve_same_canonical_contract(self) -> None:
        result = load_contract(ROOT / "examples" / "feature.valid.json")
        self.assertIsNotNone(result.contract)
        assert result.contract is not None
        skills = AgentSkillsAdapter().render(result.contract)
        generic = GenericHarnessAdapter().render(result.contract)
        self.assertEqual(skills.contract_fingerprint, generic.contract_fingerprint)
        self.assertNotEqual(skills.entrypoint, generic.entrypoint)


if __name__ == "__main__":
    unittest.main()
