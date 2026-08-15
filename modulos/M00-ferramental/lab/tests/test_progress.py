import tempfile
import unittest
from pathlib import Path

from harness_lab.progress import course_progress


class ProgressTests(unittest.TestCase):
    def test_progress_is_bounded(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "PROGRESSO.md"
            path.write_text("abcdef", encoding="utf-8")
            result = course_progress(path, max_chars=3)
        self.assertEqual("abc", result["content"])
        self.assertTrue(result["truncated"])
        self.assertEqual(6, result["original_chars"])


if __name__ == "__main__":
    unittest.main()

