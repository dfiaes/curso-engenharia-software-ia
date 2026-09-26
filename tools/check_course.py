"""Check local course navigation; report legacy teaching patterns without changing files.

Run with Python 3.14 (canonical) or Python 3.9+ for repository maintenance.
This structural check does not certify correctness, execution or accessibility.
"""

from __future__ import annotations

import argparse
import re
import sys
import unicodedata
from collections import Counter
from dataclasses import dataclass, field
from html.parser import HTMLParser
from pathlib import Path
from typing import ClassVar
from urllib.parse import unquote, urlsplit


@dataclass
class Document:
    path: Path
    ids: set[str] = field(default_factory=set)
    id_text: dict[str, str] = field(default_factory=dict)
    links: list[tuple[int, str]] = field(default_factory=list)
    svg_label_refs: list[tuple[int, tuple[str, ...]]] = field(default_factory=list)
    errors: list[tuple[int, str]] = field(default_factory=list)
    legacy: list[tuple[int, str]] = field(default_factory=list)


@dataclass
class SVGState:
    line: int
    decorative: bool
    image_role: bool
    has_label: bool
    label_refs: tuple[str, ...]
    title_open: bool = False
    title_text: bool = False


class CourseHTML(HTMLParser):
    """Inspect explicit structural containers, anchors and local references."""

    containers: ClassVar[set[str]] = {
        "html",
        "head",
        "body",
        "main",
        "nav",
        "aside",
        "section",
        "header",
        "footer",
        "div",
        "pre",
        "table",
        "ul",
        "ol",
        "figure",
        "svg",
    }
    void_elements: ClassVar[set[str]] = {
        "area", "base", "br", "col", "embed", "hr", "img", "input",
        "link", "meta", "param", "source", "track", "wbr",
    }

    def __init__(self, document: Document) -> None:
        super().__init__(convert_charrefs=True)
        self.document = document
        self.stack: list[tuple[str, int]] = []
        self.hidden: list[str] = []
        self.svg_stack: list[SVGState] = []
        self.id_nodes: list[tuple[str, str]] = []

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        data = dict(attrs)
        line = self.getpos()[0]
        if tag in {"style", "script"}:
            self.hidden.append(tag)
        if tag == "svg":
            role = (data.get("role") or "").strip().lower()
            label = (data.get("aria-label") or "").strip()
            label_refs = tuple((data.get("aria-labelledby") or "").split())
            decorative = (
                (data.get("aria-hidden") or "").strip().lower() == "true"
                or role in {"none", "presentation"}
            )
            self.svg_stack.append(
                SVGState(
                    line=line,
                    decorative=decorative,
                    image_role=role == "img",
                    has_label=bool(label),
                    label_refs=label_refs,
                )
            )
            if label_refs and not decorative:
                self.document.svg_label_refs.append((line, label_refs))
        elif tag == "title" and self.svg_stack:
            self.svg_stack[-1].title_open = True
        identifier = data.get("id")
        if identifier:
            if identifier in self.document.ids:
                self.document.errors.append((line, f"duplicate id: {identifier}"))
            self.document.ids.add(identifier)
            self.document.id_text.setdefault(identifier, "")
            if tag not in self.void_elements:
                self.id_nodes.append((tag, identifier))
        for attribute in ("href", "src"):
            if data.get(attribute):
                self.document.links.append((line, str(data[attribute])))
        if "clock" in (data.get("class") or "").split():
            self.document.legacy.append((line, "study clock needs rhythm review"))
        if tag in self.containers:
            self.stack.append((tag, line))

    def handle_startendtag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        self.handle_starttag(tag, attrs)
        self.handle_endtag(tag)

    def handle_endtag(self, tag: str) -> None:
        for index in range(len(self.id_nodes) - 1, -1, -1):
            if self.id_nodes[index][0] == tag:
                del self.id_nodes[index:]
                break
        if self.hidden and self.hidden[-1] == tag:
            self.hidden.pop()
        if tag == "title" and self.svg_stack:
            self.svg_stack[-1].title_open = False
        if tag == "svg" and self.svg_stack:
            svg = self.svg_stack.pop()
            if not svg.decorative:
                if not svg.image_role:
                    self.document.errors.append(
                        (svg.line, 'svg needs role="img" or an explicit decorative role')
                    )
                if not (svg.has_label or svg.label_refs or svg.title_text):
                    self.document.errors.append(
                        (svg.line, "svg has no accessible name: add aria-label, aria-labelledby or title")
                    )
        if tag not in self.containers:
            return
        line = self.getpos()[0]
        if not self.stack or self.stack[-1][0] != tag:
            self.document.errors.append(
                (line, f"unmatched or misnested closing tag: {tag}")
            )
            return
        self.stack.pop()

    def handle_data(self, data: str) -> None:
        if not self.hidden and data.strip():
            for _, identifier in self.id_nodes:
                self.document.id_text[identifier] += data
        if (
            self.svg_stack
            and self.svg_stack[-1].title_open
            and data.strip()
        ):
            self.svg_stack[-1].title_text = True
        if not self.hidden and re.search(r"\.NET\b|\bC#|\bASP\.NET|\bEF Core", data):
            self.document.legacy.append(
                (self.getpos()[0], "stack reference needs contextual review")
            )

    def finish(self) -> None:
        self.close()
        for tag, line in self.stack:
            self.document.errors.append((line, f"unclosed container: {tag}"))


def markdown_slug(text: str) -> str:
    text = re.sub(r"<[^>]*>", "", text).strip().lower()
    text = text.replace("`", "")
    text = "".join(c for c in text if c in "-_ " or unicodedata.category(c)[0] in "LN")
    return text.replace(" ", "-")


def read_document(path: Path) -> Document:
    document = Document(path)
    text = path.read_text(encoding="utf-8")
    if path.suffix == ".html":
        parser = CourseHTML(document)
        parser.feed(text)
        parser.finish()
        return document
    fence: str | None = None
    counts: Counter[str] = Counter()
    for number, line in enumerate(text.splitlines(), 1):
        marker = re.match(r"^\s*(`{3,}|~{3,})", line)
        if marker:
            if fence is None:
                fence = marker[1][0]
            elif fence == marker[1][0]:
                fence = None
            continue
        if fence is not None:
            continue
        heading = re.match(r"^#{1,6}\s+(.+?)\s*#*\s*$", line)
        if heading:
            slug = markdown_slug(heading[1])
            identifier = slug if not counts[slug] else f"{slug}-{counts[slug]}"
            counts[slug] += 1
            document.ids.add(identifier)
        # Course Markdown uses inline destinations; code literals are not navigation.
        visible = re.sub(r"`[^`]+`", "", line)
        for link in re.finditer(
            r"!?\[[^\]]*\]\((<[^>]+>|[^\s)]+)(?:\s+\"[^\"]*\")?\)", visible
        ):
            document.links.append((number, link[1].strip("<>")))
    return document


def check_paths(paths: list[Path], root: Path) -> tuple[list[str], list[str]]:
    root = root.resolve()
    cache: dict[Path, Document] = {}
    errors: list[str] = []
    legacy: list[str] = []

    def label(path: Path) -> str:
        return str(path.relative_to(root)) if path.is_relative_to(root) else str(path)

    def read(path: Path) -> Document:
        if path not in cache:
            cache[path] = read_document(path)
        return cache[path]

    for path in paths:
        path = path.resolve()
        if not path.is_file():
            errors.append(f"{label(path)}: missing input document")
            continue
        doc = read(path)
        errors.extend(
            f"{label(path)}:{line}: {message}" for line, message in doc.errors
        )
        for line, references in doc.svg_label_refs:
            missing = [reference for reference in references if reference not in doc.ids]
            if missing:
                errors.append(
                    f"{label(path)}:{line}: svg aria-labelledby references missing id(s): "
                    + ", ".join(missing)
                )
            elif not any(doc.id_text.get(reference, "").strip() for reference in references):
                errors.append(
                    f"{label(path)}:{line}: svg aria-labelledby has no text in referenced id(s)"
                )
        legacy.extend(
            f"{label(path)}:{line}: {message}" for line, message in doc.legacy
        )
        for line, destination in doc.links:
            url = urlsplit(destination)
            if url.scheme or url.netloc:
                continue
            target = (path.parent / unquote(url.path)).resolve() if url.path else path
            if not target.is_relative_to(root):
                errors.append(
                    f"{label(path)}:{line}: link escapes repository: {destination}"
                )
            elif not target.exists():
                errors.append(f"{label(path)}:{line}: missing target: {destination}")
            elif (
                url.fragment
                and target.suffix in {".html", ".md"}
                and unquote(url.fragment) not in read(target).ids
            ):
                errors.append(f"{label(path)}:{line}: missing anchor: {destination}")
    return errors, legacy


def course_paths(root: Path, include_history: bool = False) -> list[Path]:
    """Only editorial documents; executable fixture corpora are owned by lab gates."""
    historical = root / "docs" / "historico"
    paths = list(root.glob("*.md")) + [
        path
        for path in (root / "docs").rglob("*.md")
        if include_history or not path.is_relative_to(historical)
    ]
    for directory in sorted((root / "modulos").glob("*")):
        if directory.is_dir():
            paths.extend(directory.glob("*.md"))
            paths.extend(directory.glob("*.html"))
    return sorted(set(paths))


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "paths", nargs="*", type=Path, help="optional focused document paths"
    )
    parser.add_argument(
        "--show-legacy", action="store_true", help="list contextual review findings"
    )
    parser.add_argument(
        "--include-history",
        action="store_true",
        help="also validate archived documents",
    )
    args = parser.parse_args()
    root = Path(__file__).resolve().parents[1]
    paths = args.paths or course_paths(root, args.include_history)
    errors, legacy = check_paths(paths, root)
    for error in errors:
        print(f"ERROR {error}")
    if args.show_legacy:
        for finding in legacy:
            print(f"REVIEW {finding}")
    print(
        f"Checked {len(paths)} documents: {len(errors)} structural/link errors; "
        f"{len(legacy)} legacy references/clocks for contextual review."
    )
    print(
        "No lab execution, external-source verification or visual certification performed."
    )
    return 1 if errors else 0


if __name__ == "__main__":
    sys.exit(main())
