"""Tests for tools/build_diario.py. Run: python3 -m unittest tools/test_build_diario.py
(needs the `markdown` package for the build tests)."""

from __future__ import annotations

import json
import sys
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import build_diario as bd  # noqa: E402

ED1 = """---
data: 2026-01-10
titulo: "Primeira: com dois pontos"
resumo: "Resumo um."
tags: [engenharia, llm-local]
modulos_afetados:
  - {modulo: "M05", motivo: "Custo mudou."}
  - {modulo: "M11", motivo: "Runtime novo."}
revisao:
  - pergunta: "Qual?"
    opcoes:
      - {texto: "A", correta: true}
      - {texto: "B", correta: false}
    porque: "Porque A."
fontes_count: 2
---

## Destaques

### 1. Algo

Texto com [link](https://example.com/a).

## Radar de ferramentas

- **Ferramenta X** ([repo](https://example.com/x)): candidata, não avaliada.
- **`y`:** segunda linha
  continuada.

## Fontes

1. [A](https://example.com/a)

*Compilação gerada por IA em 10/01/2026, a partir das fontes listadas. Confira antes de agir.*
"""
ED2 = """---
data: 2026-01-11
titulo: Segunda
resumo: Resumo dois.
tags:
  - seguranca
modulos_afetados:
  - modulo: M05
    motivo: Outro motivo.
revisao: []
fontes_count: 1
---

## Destaques

Corpo dois.
"""
WEEK = """---
semana: 2026-W02
titulo: "Semana"
resumo: "Resumo da semana."
periodo: "05 a 11/01/2026"
---

1. Item.
"""


def make_repo(tmp: Path) -> None:
    (tmp / "diario/edicoes/2026").mkdir(parents=True)
    (tmp / "diario/semanas").mkdir(parents=True)
    (tmp / "diario/edicoes/2026/2026-01-10.md").write_text(ED1, encoding="utf-8")
    (tmp / "diario/edicoes/2026/2026-01-11.md").write_text(ED2, encoding="utf-8")
    (tmp / "diario/semanas/2026-W02.md").write_text(WEEK, encoding="utf-8")
    (tmp / "modulos/M05-x").mkdir(parents=True)
    (tmp / "modulos/M05-x/M05.html").write_text("<html></html>", encoding="utf-8")


class FrontmatterTests(unittest.TestCase):
    def test_scalars_lists_and_nested(self) -> None:
        meta, body = bd.split_frontmatter(ED1)
        self.assertEqual(meta["data"], "2026-01-10")
        self.assertEqual(meta["titulo"], "Primeira: com dois pontos")
        self.assertEqual(meta["tags"], ["engenharia", "llm-local"])
        self.assertEqual(meta["modulos_afetados"][0], {"modulo": "M05", "motivo": "Custo mudou."})
        self.assertEqual(meta["revisao"][0]["opcoes"][0], {"texto": "A", "correta": True})
        self.assertEqual(meta["fontes_count"], 2)
        self.assertTrue(body.lstrip().startswith("## Destaques"))

    def test_block_list_and_block_map_items(self) -> None:
        meta, _ = bd.split_frontmatter(ED2)
        self.assertEqual(meta["tags"], ["seguranca"])
        self.assertEqual(meta["modulos_afetados"], [{"modulo": "M05", "motivo": "Outro motivo."}])
        self.assertEqual(meta["revisao"], [])

    def test_missing_frontmatter_fails(self) -> None:
        with self.assertRaises(ValueError):
            bd.split_frontmatter("# sem frontmatter")

    def test_edition_validation(self) -> None:
        with tempfile.TemporaryDirectory() as d:
            p = Path(d) / "2026-01-10.md"
            p.write_text(ED1.replace("data: 2026-01-10", "data: 2026-01-12"), encoding="utf-8")
            with self.assertRaises(ValueError):  # filename differs from data
                bd.load_edition(p)
            p.write_text(ED1.replace("correta: true", "correta: false"), encoding="utf-8")
            with self.assertRaises(ValueError):  # no correct option
                bd.load_edition(p)


class BuildTests(unittest.TestCase):
    def setUp(self) -> None:
        self.tmp = tempfile.TemporaryDirectory()
        self.root = Path(self.tmp.name)
        make_repo(self.root)
        self.counts = bd.build(self.root)

    def tearDown(self) -> None:
        self.tmp.cleanup()

    def test_pages_and_navigation(self) -> None:
        self.assertEqual(self.counts, {"edicoes": 2, "semanas": 1})
        first = (self.root / "diario/edicoes/2026/2026-01-10.html").read_text(encoding="utf-8")
        second = (self.root / "diario/edicoes/2026/2026-01-11.html").read_text(encoding="utf-8")
        self.assertIn("dr-tag-llm-local", first)
        self.assertIn('rel="noopener noreferrer"', first)
        self.assertIn("Voltar ao calendário", first)
        self.assertIn('<span class="dr-nav-off">← dia anterior</span>', first)
        self.assertIn('href="../2026/2026-01-11.html"', first)
        self.assertIn('href="../2026/2026-01-10.html"', second)
        self.assertIn("modulos/M05-x/M05.html", first)
        self.assertTrue((self.root / "diario/semanas/2026-W02.html").is_file())

    def test_index_js(self) -> None:
        text = (self.root / "diario/indice.js").read_text(encoding="utf-8")
        data = json.loads(text.split("window.DIARIO = ", 1)[1].rstrip().rstrip(";"))
        self.assertEqual([e["data"] for e in data["edicoes"]], ["2026-01-11", "2026-01-10"])
        self.assertEqual(data["edicoes"][1]["url"], "diario/edicoes/2026/2026-01-10.html")
        self.assertEqual(data["edicoes"][1]["modulos_afetados"][0]["modulo"], "M05")
        self.assertEqual(data["semanas"][0]["semana"], "2026-W02")

    def test_review_js(self) -> None:
        text = (self.root / "diario/revisao.js").read_text(encoding="utf-8")
        items = json.loads(text.split("window.DIARIO_REVISAO = ", 1)[1].rstrip().rstrip(";"))
        self.assertEqual(len(items), 1)
        self.assertEqual(items[0]["id"], "2026-01-10#1")
        self.assertTrue(items[0]["opcoes"][0]["correta"])

    def test_radar_js(self) -> None:
        text = (self.root / "diario/radar.js").read_text(encoding="utf-8")
        items = json.loads(text.split("window.DIARIO_RADAR = ", 1)[1].rstrip().rstrip(";"))
        self.assertEqual(len(items), 2)  # ED2 has no radar section: negative control
        self.assertEqual({i["data"] for i in items}, {"2026-01-10"})
        self.assertEqual(items[0]["url_edicao"], "diario/edicoes/2026/2026-01-10.html")
        self.assertIn("<strong>Ferramenta X</strong>", items[0]["texto_html"])
        self.assertIn('rel="noopener noreferrer"', items[0]["texto_html"])
        self.assertNotIn("<p>", items[0]["texto_html"])
        self.assertIn("segunda linha continuada", items[1]["texto_html"])
        self.assertNotIn("example.com/a", items[1]["texto_html"])  # section stops at the next heading

    def test_queue_and_treated(self) -> None:
        queue = (self.root / "diario/fila-revisao-mensal.md").read_text(encoding="utf-8")
        self.assertIn("## M05", queue)
        self.assertIn("Custo mudou.", queue)
        self.assertIn("Outro motivo.", queue)
        self.assertIn("## M11", queue)
        (self.root / "diario/revisao-tratadas.txt").write_text("2026-01-10  # tratada\n", encoding="utf-8")
        bd.build(self.root)
        queue = (self.root / "diario/fila-revisao-mensal.md").read_text(encoding="utf-8")
        self.assertNotIn("Custo mudou.", queue)  # negative control: treated edition leaves the queue
        self.assertNotIn("## M11", queue)
        self.assertIn("Outro motivo.", queue)

    def test_idempotent(self) -> None:
        path = self.root / "diario/indice.js"
        self.assertFalse(bd.write_if_changed(path, path.read_text(encoding="utf-8")))


if __name__ == "__main__":
    unittest.main()
