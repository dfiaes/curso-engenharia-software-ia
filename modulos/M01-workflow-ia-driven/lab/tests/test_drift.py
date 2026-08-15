import unittest

from sdd_lab.drift import DriftEvidence, DriftState, classify_drift


class DriftTests(unittest.TestCase):
    def test_four_states_do_not_authorize_mutation(self) -> None:
        cases = (
            (DriftEvidence(True, True, None, "alinhado"), DriftState.CONSISTENT),
            (DriftEvidence(False, True, True, "produção confirma"), DriftState.SPEC_STALE),
            (DriftEvidence(True, False, False, "teste falha"), DriftState.CODE_INCORRECT),
            (
                DriftEvidence(False, False, None, "evidência insuficiente"),
                DriftState.DECISION_REQUIRED,
            ),
        )
        for evidence, expected in cases:
            with self.subTest(expected=expected):
                report = classify_drift(evidence)
                self.assertEqual(report.state, expected)
                self.assertFalse(report.mutation_allowed)

    def test_behavioral_failure_supports_code_incorrect_classification(self) -> None:
        observed = 1 + 1
        specified = 3
        evidence = DriftEvidence(
            spec_accepts_observed=True,
            tests_accept_observed=observed == specified,
            production_supports_observed=False,
            detail=f"esperado={specified}; observado={observed}",
        )
        self.assertEqual(classify_drift(evidence).state, DriftState.CODE_INCORRECT)


if __name__ == "__main__":
    unittest.main()
