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
        self.manifest = build_manifest()

    def test_core_inventory(self) -> None:
        self.assertEqual(self.manifest["totalUnits"], 19)
        self.assertEqual(self.manifest["totalBlocks"], 152)
        self.assertFalse(any(unit["code"].startswith("ML") for unit in self.manifest["units"]))

    def test_ids_and_anchors_are_unique(self) -> None:
        blocks = [block for unit in self.manifest["units"] for block in unit["blocks"]]
        self.assertEqual(len({block["id"] for block in blocks}), 152)
        self.assertTrue(all(block["anchor"] for block in blocks))

    def test_every_block_target_exists(self) -> None:
        for unit in self.manifest["units"]:
            for block in unit["blocks"]:
                source = (ROOT / block["file"]).read_text(encoding="utf-8")
                self.assertIn(f'id="{block["anchor"]}"', source, block["id"])

    def test_index_embeds_the_manifest(self) -> None:
        page = render(self.manifest)
        self.assertNotIn("__COURSE_MANIFEST__", page)
        self.assertNotIn("fetch(", page)
        payload = json.dumps(self.manifest, ensure_ascii=False, separators=(",", ":")).replace("</", "<\\/")
        self.assertIn(payload, page)

    def test_portal_assets_and_module_bridge_exist(self) -> None:
        page = render(self.manifest)
        for asset in ("portal/portal.css", "portal/progress.js", "portal/portal.js"):
            self.assertTrue((ROOT / asset).is_file(), asset)
            self.assertIn(asset, page)
        source_files = {block["file"] for unit in self.manifest["units"] for block in unit["blocks"]}
        for source_file in source_files:
            source = (ROOT / source_file).read_text(encoding="utf-8")
            self.assertIn("course-bridge.js", source, source_file)


if __name__ == "__main__":
    unittest.main()
