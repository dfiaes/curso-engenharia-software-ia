from __future__ import annotations

from pathlib import Path
import sys
import unittest

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "tools"))

import build_docs  # noqa: E402

DOCS = {"CURRICULO.md", "docs/nivelamento.md", "kit/template/README.md", "docs/sub/x.md"}


class BuildDocsTests(unittest.TestCase):
    def test_md_links_become_html_only_for_generated_docs(self) -> None:
        src = "# T\n\n[a](nivelamento.md#parte) [b](../CURRICULO.md) [c](../lab/x.md) [d](code.py) [e](https://x.org/a.md)\n"
        page = build_docs.render_page("docs/como-estudar.md", src, DOCS | {"docs/como-estudar.md"})
        self.assertIn('href="nivelamento.html#parte"', page)
        self.assertIn('href="../CURRICULO.html"', page)
        self.assertIn('href="../lab/x.md"', page)
        self.assertIn('href="code.py"', page)
        self.assertIn('href="https://x.org/a.md"', page)

    def test_details_preserved_and_title(self) -> None:
        src = "# Meu *título*\n\n<details><summary>Resposta</summary>\n\ntexto\n\n</details>\n"
        page = build_docs.render_page("CURRICULO.md", src, DOCS)
        self.assertIn("<details><summary>Resposta</summary>", page)
        self.assertIn("<title>Meu título</title>", page)
        self.assertIn("gerado por tools/build_docs.py a partir de CURRICULO.md; não editar", page)
        self.assertTrue(page.startswith("<!DOCTYPE html>"))

    def test_assets_path_depends_on_depth(self) -> None:
        self.assertIn('href="assets/course.css"', build_docs.render_page("CURRICULO.md", "# A", DOCS))
        self.assertIn('src="../assets/course.js" data-unit=""', build_docs.render_page("docs/nivelamento.md", "# A", DOCS))
        self.assertIn('href="../../assets/course.css"', build_docs.render_page("kit/template/README.md", "# A", DOCS))

    def test_sources_inclusion_rules(self) -> None:
        sources = build_docs.doc_sources()
        self.assertIn("CURRICULO.md", sources)
        self.assertIn("docs/nivelamento.md", sources)
        self.assertIn("kit/README.md", sources)
        self.assertNotIn("CLAUDE.md", sources)
        self.assertNotIn("AGENTS.md", sources)
        self.assertFalse(any("/lab/" in s or s.startswith("capstone/") for s in sources))

    def test_generated_pages_are_current(self) -> None:
        self.assertEqual(build_docs.build(check=True), [])


if __name__ == "__main__":
    unittest.main()
