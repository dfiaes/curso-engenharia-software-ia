"""Exercise broken navigation and malformed containers in disposable documents."""

import unittest
from pathlib import Path
from tempfile import TemporaryDirectory

from check_course import check_paths, course_paths


class NavigationTests(unittest.TestCase):
    def test_history_is_explicit_and_links_to_it_still_checked(self) -> None:
        with TemporaryDirectory() as directory:
            root = Path(directory)
            history = root / "docs" / "historico"
            history.mkdir(parents=True)
            archived = history / "old.md"
            archived.write_text("# Evidence\n")
            page = root / "index.md"
            page.write_text("[History](docs/historico/old.md#evidence)\n")
            self.assertNotIn(archived, course_paths(root))
            self.assertIn(archived, course_paths(root, include_history=True))
            self.assertFalse(check_paths(course_paths(root), root)[0])
            archived.unlink()
            self.assertTrue(check_paths(course_paths(root), root)[0])

    def test_valid_unicode_link_and_markdown_heading(self) -> None:
        with TemporaryDirectory() as directory:
            root = Path(directory)
            (root / "explicação.md").write_text("# Uma decisão\n", encoding="utf-8")
            page = root / "index.html"
            page.write_text(
                '<main><a href="explica%C3%A7%C3%A3o.md#uma-decisão">Ler</a></main>'
            )
            self.assertEqual(check_paths([page], root)[0], [])

    def test_removed_document_breaks_navigation(self) -> None:
        with TemporaryDirectory() as directory:
            root = Path(directory)
            page = root / "index.md"
            page.write_text("[Plano](plano.md)\n")
            target = root / "plano.md"
            target.write_text("# Plano\n")
            self.assertFalse(check_paths([page], root)[0])
            target.unlink()
            self.assertTrue(check_paths([page], root)[0])

    def test_changed_anchor_breaks_deep_link(self) -> None:
        with TemporaryDirectory() as directory:
            root = Path(directory)
            page = root / "index.html"
            page.write_text(
                '<section id="novo"><a href="#antigo">Retomar</a></section>'
            )
            self.assertTrue(check_paths([page], root)[0])

    def test_svg_without_accessible_alternative_is_rejected(self) -> None:
        with TemporaryDirectory() as directory:
            root = Path(directory)
            page = root / "index.html"
            page.write_text('<svg role="img"><path d="M0 0"/></svg>')
            errors, _ = check_paths([page], root)
            self.assertTrue(any("svg has no accessible name" in error for error in errors))

    def test_svg_title_and_labelledby_are_accepted(self) -> None:
        with TemporaryDirectory() as directory:
            root = Path(directory)
            page = root / "index.html"
            page.write_text(
                '<svg role="img"><title>Fluxo do processo</title></svg>'
                '<svg role="img" aria-labelledby="flow-title flow-desc"></svg>'
                '<span id="flow-title">Fluxo</span><span id="flow-desc">Etapas</span>'
            )
            self.assertEqual(check_paths([page], root)[0], [])

    def test_svg_labelledby_rejects_missing_target(self) -> None:
        with TemporaryDirectory() as directory:
            root = Path(directory)
            page = root / "index.html"
            page.write_text('<svg role="img" aria-labelledby="missing-label"></svg>')
            errors, _ = check_paths([page], root)
            self.assertTrue(any("svg aria-labelledby references missing id" in error for error in errors))

    def test_svg_labelledby_rejects_empty_text_in_referenced_target(self) -> None:
        with TemporaryDirectory() as directory:
            root = Path(directory)
            page = root / "index.html"
            page.write_text(
                '<svg role="img" aria-labelledby="blank"></svg>'
                '<span id="blank"> \n </span>'
            )
            errors, _ = check_paths([page], root)
            self.assertTrue(
                any("aria-labelledby has no text" in error for error in errors)
            )

    def test_svg_labelledby_accepts_nested_text_in_referenced_target(self) -> None:
        with TemporaryDirectory() as directory:
            root = Path(directory)
            page = root / "index.html"
            page.write_text(
                '<svg role="img" aria-labelledby="description"></svg>'
                '<div id="description"><span>Etapas</span> do fluxo</div>'
            )
            self.assertEqual(check_paths([page], root)[0], [])

    def test_explicitly_decorative_svg_does_not_require_a_name(self) -> None:
        with TemporaryDirectory() as directory:
            root = Path(directory)
            page = root / "index.html"
            page.write_text(
                '<svg aria-hidden="true" aria-labelledby="unused-label"><path d="M0 0"/></svg>'
                '<svg role="presentation"><circle cx="1" cy="1" r="1"/></svg>'
            )
            self.assertEqual(check_paths([page], root)[0], [])

    def test_duplicate_anchor_and_unclosed_container(self) -> None:
        with TemporaryDirectory() as directory:
            root = Path(directory)
            page = root / "index.html"
            page.write_text('<main><div id="x"></div><section id="x"></section>')
            errors, _ = check_paths([page], root)
            self.assertEqual(len(errors), 2)

    def test_code_and_remote_urls_are_not_local_navigation(self) -> None:
        with TemporaryDirectory() as directory:
            root = Path(directory)
            page = root / "index.md"
            page.write_text(
                "```markdown\n[Exemplo](inexistente.md)\n```\n[Ler](https://example.com)\n"
            )
            self.assertFalse(check_paths([page], root)[0])

    def test_stack_reference_is_reported_without_claiming_content_invalid(self) -> None:
        with TemporaryDirectory() as directory:
            root = Path(directory)
            page = root / "index.html"
            page.write_text('<div class="clock">00:00</div><p>Corpus C#</p>')
            errors, findings = check_paths([page], root)
            self.assertFalse(errors)
            self.assertEqual(len(findings), 2)


if __name__ == "__main__":
    unittest.main()
