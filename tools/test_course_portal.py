from __future__ import annotations

import json
from pathlib import Path
import sys
import unittest


ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "tools"))

from build_course_portal import build_manifest, build_study_route_manifest, render  # noqa: E402


class CoursePortalTests(unittest.TestCase):
    def setUp(self) -> None:
        self.manifest = build_manifest()
        self.route_manifest = build_study_route_manifest(self.manifest)

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

    def test_curated_external_route_is_reachable_from_portal(self) -> None:
        page = render(self.manifest, self.route_manifest)
        self.assertIn('href="#/roteiro" data-view-link="roteiro"', page)
        self.assertIn('id="view-roteiro" data-view="roteiro"', page)
        self.assertIn('id="external-route-list"', page)
        self.assertIn("docs/ROTEIRO-ESTUDO-GRATUITO.md", page)
        self.assertIn('id="study-route-manifest"', page)
        self.assertIn("__STUDY_ROUTE_MANIFEST__", (ROOT / "portal" / "index.template.html").read_text(encoding="utf-8"))

    def test_curated_route_order_sources_and_optional_tracks(self) -> None:
        stages = self.route_manifest["stages"]
        self.assertEqual(len(stages), 10)
        self.assertEqual(stages[0]["id"], "fluxo-agente-programacao")
        self.assertEqual(stages[1]["id"], "configurar-codex-opencode")
        self.assertEqual(stages[2]["id"], "skills-mcp-extensoes")
        self.assertEqual(len({stage["id"] for stage in stages}), 10)
        self.assertTrue(all(any(source["role"] == "essential" for source in stage["resources"]) for stage in stages))
        self.assertFalse(any("M11" in stage.get("localReferences", []) for stage in stages))
        self.assertIn("M11", [item.get("unitCode") for item in self.route_manifest["optionalTracks"]])
        route_text = json.dumps(self.route_manifest)
        self.assertIn("Claude Code", route_text)
        self.assertIn("Cursor", route_text)
        self.assertIn("OpenCode", route_text)

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
