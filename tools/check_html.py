#!/usr/bin/env python3
"""Checa páginas HTML do curso: tags balanceadas, ids duplicados, âncoras internas,
sintaxe dos <script> inline (via `node --check`) e marcação dos componentes interativos.

Uso: python3 tools/check_html.py modulos/F03-*/F03.html [mais arquivos...]
"""
from __future__ import annotations

import re
import shutil
import subprocess
import sys
import tempfile
from html.parser import HTMLParser
from pathlib import Path

VOID = {"area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "source", "track", "wbr",
        "path", "circle", "rect", "line", "polyline", "polygon", "ellipse", "stop", "use"}
CHECKED = {"div", "section", "table", "details", "ul", "ol", "aside", "figure", "pre", "svg", "g", "main", "nav", "p", "li", "tr", "td", "th", "a", "span", "code"}


class Balance(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.stack: list[tuple[str, int]] = []
        self.errors: list[str] = []
        self.ids: dict[str, int] = {}
        self.hrefs: list[tuple[str, int]] = []

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        line = self.getpos()[0]
        if "id" in a and a["id"]:
            if a["id"] in self.ids:
                self.errors.append(f"linha {line}: id duplicado '{a['id']}'")
            self.ids[a["id"]] = line
        if tag == "a" and (a.get("href") or "").startswith("#"):
            self.hrefs.append((a["href"][1:], line))
        if tag in CHECKED and tag not in VOID:
            self.stack.append((tag, line))

    def handle_startendtag(self, tag, attrs):
        a = dict(attrs)
        if "id" in a and a["id"]:
            self.ids[a["id"]] = self.getpos()[0]

    def handle_endtag(self, tag):
        if tag not in CHECKED:
            return
        if tag in ("p", "li", "tr", "td", "th"):  # fechamento implícito permitido
            for i in range(len(self.stack) - 1, -1, -1):
                if self.stack[i][0] == tag:
                    del self.stack[i:]
                    return
            return
        if self.stack and self.stack[-1][0] == tag:
            self.stack.pop()
            return
        for i in range(len(self.stack) - 1, -1, -1):
            if self.stack[i][0] == tag:
                for t, ln in self.stack[i + 1:]:
                    if t not in ("p", "li", "tr", "td", "th"):
                        self.errors.append(f"<{t}> aberto na linha {ln} sem fechamento antes de </{tag}> (linha {self.getpos()[0]})")
                del self.stack[i:]
                return
        self.errors.append(f"linha {self.getpos()[0]}: </{tag}> sem abertura")


def check(path: Path) -> list[str]:
    text = path.read_text(encoding="utf-8")
    p = Balance()
    p.feed(text)
    errs = list(p.errors)
    for t, ln in p.stack:
        if t not in ("p", "li", "tr", "td", "th"):
            errs.append(f"<{t}> aberto na linha {ln} nunca fechado")
    for target, ln in p.hrefs:
        if target and target not in p.ids:
            errs.append(f"linha {ln}: âncora #{target} não existe")
    if "assets/course.js" not in text:
        errs.append("falta <script src=../../assets/course.js data-unit=...>")
    # componentes
    for m in re.finditer(r'<div class="quiz"([^>]*)>(.*?)</div>\s*</div>|<div class="quiz"([^>]*)>(.*?)<div class="explain"', text, re.S):
        attrs = m.group(1) or m.group(3) or ""
        body = m.group(2) or m.group(4) or ""
        ans = re.search(r'data-answer="([^"]+)"', attrs)
        if not ans:
            errs.append("quiz sem data-answer")
        elif f'data-opt="{ans.group(1)}"' not in body:
            errs.append(f"quiz: data-answer='{ans.group(1)}' não corresponde a nenhum li[data-opt]")
    for m in re.finditer(r'<ol class="order" data-solution="([^"]+)">(.*?)</ol>', text, re.S):
        ids = re.findall(r'data-id="([^"]+)"', m.group(2))
        sol = [x.strip() for x in m.group(1).split(",")]
        if sorted(ids) != sorted(sol):
            errs.append(f"order: data-solution {sol} não bate com data-id {ids}")
    if text.count('class="stepper"') > text.count('class="frame'):
        errs.append("stepper sem .frame")
    # scripts inline
    node = shutil.which("node")
    scripts = re.findall(r"<script(?![^>]*\bsrc=)[^>]*>(.*?)</script>", text, re.S)
    if node:
        for i, code in enumerate(scripts):
            with tempfile.NamedTemporaryFile("w", suffix=".js", delete=False, encoding="utf-8") as fh:
                fh.write(code)
            r = subprocess.run([node, "--check", fh.name], capture_output=True, text=True)
            Path(fh.name).unlink(missing_ok=True)
            if r.returncode:
                errs.append(f"script inline #{i + 1}: erro de sintaxe: {r.stderr.strip().splitlines()[-1] if r.stderr.strip() else ''}")
    return errs


def main(argv: list[str]) -> int:
    bad = 0
    for a in argv or sorted(map(str, Path("modulos").glob("*/*.html"))):
        errs = check(Path(a))
        print(f"{'OK ' if not errs else 'ERR'} {a}")
        for e in errs[:30]:
            print("    " + e)
        bad += bool(errs)
    return 1 if bad else 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
