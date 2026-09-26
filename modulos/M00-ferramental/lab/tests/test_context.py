import unittest

from harness_lab.context import ContextItem, select_context


class ContextTests(unittest.TestCase):
    def test_selection_never_exceeds_budget(self) -> None:
        result = select_context(
            [
                ContextItem("instructions", 100, 1, 1, required=True),
                ContextItem("target", 300, 1, 1),
                ContextItem("history", 900, 0.2, 0.5),
            ],
            500,
        )
        self.assertLessEqual(result.used_tokens, result.budget)
        self.assertEqual(["instructions", "target"], [item.name for item in result.included])

    def test_omissions_are_reported(self) -> None:
        result = select_context(
            [ContextItem("required", 100, 1, 1, True), ContextItem("large", 500, 1, 1)],
            200,
        )
        self.assertEqual(("large",), tuple(item.name for item in result.omitted))

    def test_required_items_fail_loudly_when_they_do_not_fit(self) -> None:
        with self.assertRaisesRegex(ValueError, "itens obrigatórios requerem"):
            select_context([ContextItem("required", 201, 1, 1, True)], 200)

    def test_invalid_scores_are_rejected(self) -> None:
        with self.assertRaisesRegex(ValueError, "entre 0 e 1"):
            ContextItem("bad", 10, 1.1, 1)


if __name__ == "__main__":
    unittest.main()
