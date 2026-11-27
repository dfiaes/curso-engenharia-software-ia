#!/usr/bin/env python3
"""Render the course Markdown documents as HTML pages in the course layout.

Each included `X.md` becomes `X.html` next to it, and `assets/docs-manifest.js`
lists them (`window.COURSE_DOCS`). Run `python3 tools/build_docs.py` (or
`tools/build_course_portal.py`, which calls it); `--check` reports stale output.
Needs the `markdown` package (`uv run --with markdown python tools/build_docs.py`).
"""

from __future__ import annotations

import argparse
import html
import posixpath
import re
import unicodedata
from pathlib import Path
from urllib.parse import unquote, urlsplit

ROOT = Path(__file__).resolve().parents[1]
DOCS_MANIFEST = ROOT / "assets" / "docs-manifest.js"
ROOT_FILES = ("README.md", "CURRICULO.md", "STATUS.md", "PROGRESSO.md")
INCLUDE_DIRS = ("docs", "kit")
EXCLUDED_PARTS = {"lab", "capstone", ".claude", ".github", "node_modules", ".venv", ".git"}


def doc_sources(root: Path = ROOT) -> list[str]:
    """Repository-relative POSIX paths of the Markdown files that get an HTML page."""
    found: list[str] = []
    for name in ROOT_FILES:
        if (root / name).is_file():
            found.append(name)
    for directory in INCLUDE_DIRS:
        base = root / directory
        if not base.is_dir():
            continue
        for path in base.rglob("*.md"):
            rel = path.relative_to(root)
            if EXCLUDED_PARTS.intersection(rel.parts):
                continue
            found.append(rel.as_posix())
    return sorted(set(found))


def slugify(value: str, separator: str = "-") -> str:
    """Same anchors as tools/check_course.py:markdown_slug (GitHub style, accents kept)."""
    value = re.sub(r"<[^>]*>", "", value).strip().lower().replace("`", "")
    value = "".join(c for c in value if c in "-_ " or unicodedata.category(c)[0] in "LN")
    return value.replace(" ", separator)


def rewrite_links(page: str, source: str, docs: set[str]) -> str:
    """`href="x.md#a"` -> `href="x.html#a"` when x.md is a generated document."""
    base = posixpath.dirname(source)

    def fix(match: re.Match[str]) -> str:
        quote, href = match.group(1), match.group(2)
        url = urlsplit(html.unescape(href))
        if url.scheme or url.netloc or not url.path.endswith(".md"):
            return match.group(0)
        target = posixpath.normpath(posixpath.join(base, unquote(url.path)))
        if target not in docs:
            return match.group(0)
        new_path = url.path[: -len(".md")] + ".html"
        rebuilt = new_path + ("?" + url.query if url.query else "") + ("#" + url.fragment if url.fragment else "")
        return f"href={quote}{html.escape(rebuilt, quote=False)}{quote}"

    return re.sub(r"href=([\"'])([^\"']*)\1", fix, page)


def title_of(text: str, fallback: str) -> str:
    fence = False
    for line in text.splitlines():
        if re.match(r"^\s*(```|~~~)", line):
            fence = not fence
        m = None if fence else re.match(r"^#\s+(.+?)\s*#*\s*$", line)
        if m:
            return re.sub(r"[`*_]|<[^>]+>", "", m.group(1)).strip()
    return fallback


def convert(text: str) -> str:
    import markdown

    md = markdown.Markdown(
        extensions=["extra", "tables", "fenced_code", "toc", "md_in_html"],
        extension_configs={"toc": {"slugify": slugify}},
    )
    return md.convert(text)


def render_page(source: str, text: str, docs: set[str]) -> str:
    depth = source.count("/")
    up = "../" * depth
    title = html.escape(title_of(text, Path(source).stem))
    body = rewrite_links(convert(text), source, docs)
    return f"""<!DOCTYPE html>
<!-- gerado por tools/build_docs.py a partir de {source}; não editar -->
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{title}</title>
<meta name="color-scheme" content="light dark">
<script>try{{var t=localStorage.getItem("curso.theme");if(t)document.documentElement.dataset.theme=t}}catch(e){{}}window.Course=window.Course||{{ready:function(f){{(window.__courseQ=window.__courseQ||[]).push(f)}}}};</script>
<link rel="stylesheet" href="{up}assets/course.css">
</head>
<body>
<div class="wrap doc">
{body}
</div>
<script src="{up}assets/course-manifest.js"></script>
<script src="{up}assets/docs-manifest.js"></script>
<script src="{up}assets/course.js" data-unit="" defer></script>
</body>
</html>
"""


def manifest_js(docs: list[str]) -> str:
    items = ",".join('"' + d + '"' for d in docs)
    return "window.COURSE_DOCS = [" + items + "];\n"


def outputs(root: Path = ROOT) -> dict[Path, str]:
    sources = doc_sources(root)
    docs = set(sources)
    result: dict[Path, str] = {}
    for source in sources:
        text = (root / source).read_text(encoding="utf-8")
        result[(root / source).with_suffix(".html")] = render_page(source, text, docs)
    result[root / "assets" / "docs-manifest.js"] = manifest_js(sources)
    return result


def build(check: bool = False) -> list[str]:
    errors: list[str] = []
    generated = outputs()
    for path, content in generated.items():
        rel = path.relative_to(ROOT).as_posix()
        if check:
            if not path.is_file() or path.read_text(encoding="utf-8") != content:
                errors.append(f"{rel} is stale; run tools/build_docs.py")
        else:
            path.write_text(content, encoding="utf-8")
    return errors


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--check", action="store_true", help="fail if generated pages are stale")
    args = parser.parse_args()
    errors = build(check=args.check)
    if errors:
        print("\n".join(errors))
        return 1
    n = len(doc_sources())
    print(f"Docs: {n} pages {'valid' if args.check else 'generated'}.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
