from __future__ import annotations

import json
from pathlib import Path
import sys
import unittest


ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "tools"))

from build_course_portal import build_manifest, render  # noqa: E402


class CoursePortalTests(unittest.TestCase):
    def setUp(self) -> None:
        self.manifest = build_manifest(allow_missing=True)

    def test_core_inventory(self) -> None:
        self.assertEqual(self.manifest["totalUnits"], len(self.manifest["units"]))
        self.assertGreater(self.manifest["totalUnits"], 0)
        self.assertFalse(any(unit["code"].startswith("ML") for unit in self.manifest["units"]))

    def test_ids_and_anchors_are_unique(self) -> None:
        blocks = [block for unit in self.manifest["units"] for block in unit["blocks"]]
        self.assertEqual(len({block["id"] for block in blocks}), self.manifest["totalBlocks"])
        self.assertTrue(all(block["anchor"] for block in blocks))

    def test_every_block_target_exists(self) -> None:
        for unit in self.manifest["units"]:
            for block in unit["blocks"]:
                source = (ROOT / block["file"]).read_text(encoding="utf-8")
                self.assertIn(f'id="{block["anchor"]}"', source, block["id"])

    def test_a01_in_phase_2_after_m01(self) -> None:
        codes = [unit["code"] for unit in self.manifest["units"]]
        self.assertEqual(codes[codes.index("M01") + 1], "A01")
        unit = self.manifest["units"][codes.index("A01")]
        self.assertEqual(unit["prerequisites"], ["M01"])
        self.assertEqual(unit["hours"], 14)

    def test_index_is_standalone_home(self) -> None:
        page = render(self.manifest)
        self.assertNotIn("<iframe", page)
        self.assertIn('data-layout="none"', page)
        self.assertIn("trilha-rapida/TR.html", (ROOT / "portal" / "portal.js").read_text(encoding="utf-8"))
        for asset in ("assets/course.css", "assets/course-manifest.js", "portal/progress.js", "assets/course.js", "portal/portal.js"):
            self.assertIn(asset, page)
        for asset in ("assets/course.css", "assets/course.js", "portal/progress.js", "portal/portal.js"):
            self.assertTrue((ROOT / asset).is_file(), asset)

    def test_modules_use_course_js(self) -> None:
        for unit in self.manifest["units"]:
            path = ROOT / unit["file"]
            if path.is_file():
                self.assertIn("course.js", path.read_text(encoding="utf-8"), unit["code"])


if __name__ == "__main__":
    unittest.main()
