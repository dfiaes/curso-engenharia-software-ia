import unittest

from sdd_lab.negative_control import evaluate_negative_control


class NegativeControlTests(unittest.TestCase):
    def test_known_mutant_must_be_rejected(self) -> None:
        baseline = lambda value: value * 2  # noqa: E731
        mutant = lambda value: value + 2  # noqa: E731
        result = evaluate_negative_control(baseline, mutant, ((1, 2), (3, 6)))
        self.assertTrue(result.strong)

    def test_weak_oracle_is_exposed(self) -> None:
        identity = lambda value: value  # noqa: E731
        result = evaluate_negative_control(identity, identity, ((1, 1),))
        self.assertFalse(result.strong)


if __name__ == "__main__":
    unittest.main()
