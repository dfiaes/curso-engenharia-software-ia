#!/usr/bin/env python3
"""Build the "Diário de IA e engenharia" from Markdown editions.

Reads `diario/edicoes/AAAA/AAAA-MM-DD.md` and `diario/semanas/AAAA-Www.md` and writes,
next to them, the static HTML pages (Trilha layout, no React), plus
`diario/indice.js`, `diario/revisao.js`, `diario/radar.js` and `diario/fila-revisao-mensal.{md,html}`.

Run: `python3 tools/build_diario.py` (needs the `markdown` package;
`uv run --with markdown python tools/build_diario.py`). Only stdlib + markdown.
"""

from __future__ import annotations

import argparse
import html
import json
import re
import sys
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
DIARIO = "diario"
KNOWN_TAGS = [
    "mercado", "modelos", "ferramentas-dev", "llm-local", "engenharia",
    "seguranca", "regulacao", "pesquisa", "open-source", "cloud",
]
TAG_LABEL = {
    "mercado": "Mercado", "modelos": "Modelos", "ferramentas-dev": "Ferramentas dev",
    "llm-local": "LLM local", "engenharia": "Engenharia", "seguranca": "Segurança",
    "regulacao": "Regulação", "pesquisa": "Pesquisa", "open-source": "Open source", "cloud": "Cloud",
}
MESES = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto",
         "setembro", "outubro", "novembro", "dezembro"]
DIAS = ["segunda-feira", "terça-feira", "quarta-feira", "quinta-feira", "sexta-feira", "sábado", "domingo"]

# ---------------------------------------------------------------- mini YAML


def _split_flow(text: str) -> list[str]:
    parts, depth, quote, cur = [], 0, "", ""
    for ch in text:
        if quote:
            cur += ch
            if ch == quote:
                quote = ""
            continue
        if ch in "\"'":
            quote = ch
            cur += ch
        elif ch in "[{":
            depth += 1
            cur += ch
        elif ch in "]}":
            depth -= 1
            cur += ch
        elif ch == "," and depth == 0:
            parts.append(cur.strip())
            cur = ""
        else:
            cur += ch
    if cur.strip():
        parts.append(cur.strip())
    return parts


def _find_colon(text: str) -> int:
    quote = ""
    for i, ch in enumerate(text):
        if quote:
            if ch == quote:
                quote = ""
        elif ch in "\"'":
            quote = ch
        elif ch == ":" and (i + 1 == len(text) or text[i + 1] == " "):
            return i
    return -1


def parse_scalar(raw: str) -> Any:
    raw = raw.strip()
    if raw == "" or raw in ("~", "null"):
        return None
    if raw[0] == "[" and raw[-1] == "]":
        return [parse_scalar(p) for p in _split_flow(raw[1:-1])]
    if raw[0] == "{" and raw[-1] == "}":
        out: dict[str, Any] = {}
        for part in _split_flow(raw[1:-1]):
            i = _find_colon(part)
            if i < 0:
                raise ValueError(f"mapa inline inválido: {part!r}")
            out[parse_scalar(part[:i])] = parse_scalar(part[i + 1:])
        return out
    if raw[0] == '"' and raw[-1] == '"' and len(raw) >= 2:
        try:
            return json.loads(raw)
        except ValueError:
            return raw[1:-1]
    if raw[0] == "'" and raw[-1] == "'" and len(raw) >= 2:
        return raw[1:-1].replace("''", "'")
    if raw in ("true", "True"):
        return True
    if raw in ("false", "False"):
        return False
    if re.fullmatch(r"-?\d+", raw):
        return int(raw)
    return raw


def parse_yaml(text: str) -> dict[str, Any]:
    """Subset of YAML: block maps/lists, inline [..] and {..}, quoted scalars."""
    lines: list[tuple[int, str]] = []
    for raw in text.splitlines():
        if not raw.strip() or raw.lstrip().startswith("#"):
            continue
        lines.append((len(raw) - len(raw.lstrip(" ")), raw.strip()))

    def block(i: int, indent: int) -> tuple[Any, int]:
        if i >= len(lines):
            return None, i
        if lines[i][1].startswith("- ") or lines[i][1] == "-":
            return seq(i, lines[i][0])
        return mapping(i, lines[i][0])

    def mapping(i: int, indent: int) -> tuple[dict[str, Any], int]:
        out: dict[str, Any] = {}
        while i < len(lines) and lines[i][0] == indent and not lines[i][1].startswith("- "):
            content = lines[i][1]
            c = _find_colon(content)
            if c < 0:
                raise ValueError(f"linha de frontmatter inválida: {content!r}")
            key = str(parse_scalar(content[:c]))
            rest = content[c + 1:].strip()
            i += 1
            if rest:
                out[key] = parse_scalar(rest)
            elif i < len(lines) and (lines[i][0] > indent or (lines[i][0] == indent and lines[i][1].startswith("- "))):
                out[key], i = block(i, lines[i][0])
            else:
                out[key] = None
        return out, i

    def seq(i: int, indent: int) -> tuple[list[Any], int]:
        out: list[Any] = []
        while i < len(lines) and lines[i][0] == indent and (lines[i][1].startswith("- ") or lines[i][1] == "-"):
            rest = lines[i][1][1:].strip()
            if not rest:
                i += 1
                if i < len(lines) and lines[i][0] > indent:
                    val, i = block(i, lines[i][0])
                    out.append(val)
                else:
                    out.append(None)
            elif _find_colon(rest) > 0 and rest[0] not in "[{\"'":
                # item is a mapping: re-read this line as a map at deeper indent
                inner = indent + 2
                lines[i] = (inner, rest)
                val, i = mapping(i, inner)
                out.append(val)
            else:
                out.append(parse_scalar(rest))
                i += 1
        return out, i

    if not lines:
        return {}
    value, end = block(0, lines[0][0])
    if end != len(lines) or not isinstance(value, dict):
        raise ValueError("frontmatter YAML não pôde ser lido por completo")
    return value


def split_frontmatter(text: str) -> tuple[dict[str, Any], str]:
    text = text.lstrip("﻿")
    m = re.match(r"---[ \t]*\n(.*?)\n---[ \t]*\n?(.*)\Z", text, re.S)
    if not m:
        raise ValueError("sem frontmatter (--- ... ---)")
    return parse_yaml(m.group(1)), m.group(2)


# ---------------------------------------------------------------- model


def _iso(value: Any, name: str) -> str:
    s = str(value or "")
    if not re.fullmatch(r"\d{4}-\d{2}-\d{2}", s):
        raise ValueError(f"{name}: data inválida {s!r} (use AAAA-MM-DD)")
    return s


def load_edition(path: Path) -> dict[str, Any]:
    meta, body = split_frontmatter(path.read_text(encoding="utf-8"))
    data = _iso(meta.get("data"), "data")
    if path.stem != data:
        raise ValueError(f"{path.name}: nome do arquivo difere de data {data}")
    for key in ("titulo", "resumo"):
        if not meta.get(key):
            raise ValueError(f"{path.name}: falta {key}")
    tags = [str(t) for t in (meta.get("tags") or [])]
    afetados = []
    for item in meta.get("modulos_afetados") or []:
        if not isinstance(item, dict) or "modulo" not in item:
            raise ValueError(f"{path.name}: modulos_afetados exige {{modulo, motivo}}")
        afetados.append({"modulo": str(item["modulo"]), "motivo": str(item.get("motivo") or "")})
    revisao = []
    for item in (meta.get("revisao") or [])[:3]:
        opcoes = [{"texto": str(o.get("texto")), "correta": bool(o.get("correta"))} for o in item.get("opcoes") or []]
        if sum(o["correta"] for o in opcoes) != 1:
            raise ValueError(f"{path.name}: cada pergunta de revisão precisa de exatamente 1 opção correta")
        revisao.append({"pergunta": str(item.get("pergunta")), "opcoes": opcoes, "porque": str(item.get("porque") or "")})
    return {
        "data": data, "titulo": str(meta["titulo"]), "resumo": str(meta["resumo"]), "tags": tags,
        "modulos_afetados": afetados, "revisao": revisao,
        "fontes_count": int(meta.get("fontes_count") or 0), "body": body,
        "url": f"{DIARIO}/edicoes/{data[:4]}/{data}.html", "path": path,
    }


def load_week(path: Path) -> dict[str, Any]:
    meta, body = split_frontmatter(path.read_text(encoding="utf-8"))
    semana = str(meta.get("semana") or path.stem)
    if not re.fullmatch(r"\d{4}-W\d{2}", semana):
        raise ValueError(f"{path.name}: semana inválida {semana!r}")
    return {
        "semana": semana, "titulo": str(meta.get("titulo") or f"Semana {semana}"),
        "resumo": str(meta.get("resumo") or ""), "periodo": str(meta.get("periodo") or ""),
        "body": body, "url": f"{DIARIO}/semanas/{semana}.html", "path": path,
    }


def discover(root: Path) -> tuple[list[dict[str, Any]], list[dict[str, Any]]]:
    base = root / DIARIO
    eds = [load_edition(p) for p in sorted((base / "edicoes").glob("*/*.md"))]
    weeks = [load_week(p) for p in sorted((base / "semanas").glob("*.md"))]
    eds.sort(key=lambda e: e["data"])
    weeks.sort(key=lambda w: w["semana"])
    return eds, weeks


# ---------------------------------------------------------------- HTML


def md_to_html(body: str) -> str:
    import markdown  # imported lazily so parsing tests do not need it

    out = markdown.markdown(body, extensions=["extra", "sane_lists"], output_format="html")
    return re.sub(r'<a href="(https?://[^"]+)"', r'<a href="\1" rel="noopener noreferrer"', out)


def pt_date(iso: str) -> str:
    import datetime as dt

    d = dt.date.fromisoformat(iso)
    return f"{DIAS[d.weekday()]}, {d.day} de {MESES[d.month - 1]} de {d.year}"


def esc(s: str) -> str:
    return html.escape(s, quote=True)


def module_link(root: Path, code: str, prefix: str) -> str | None:
    hits = sorted((root / "modulos").glob(f"{code}-*/{code}.html"))
    return f"{prefix}{hits[0].relative_to(root).as_posix()}" if hits else None


def tag_badge(tag: str) -> str:
    return f'<span class="tr-badge dr-tag dr-tag-{esc(tag)}"><span class="dr-dot" aria-hidden="true"></span>{esc(TAG_LABEL.get(tag, tag))}</span>'


def page(title: str, rel: str, inner: str, description: str = "") -> str:
    """`rel` is the path prefix from the page back to the repository root."""
    return f"""<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{esc(title)}</title>
<meta name="description" content="{esc(description)}">
<meta name="color-scheme" content="light dark">
<script>try{{var t=localStorage.getItem("curso.theme");if(t==="light"||t==="dark"||t==="paper")document.documentElement.dataset.theme=t}}catch(e){{}}</script>
<link rel="stylesheet" href="{rel}assets/trilha/tokens.css">
<link rel="stylesheet" href="{rel}assets/trilha/bundle.css">
<link rel="stylesheet" href="{rel}diario/diario.css">
</head>
<body class="tr-root">
{inner}
<script src="{rel}assets/glass-bar.js" defer></script>
</body>
</html>
"""


def topbar(rel: str, back_label: str, back_href: str) -> str:
    return f"""<header class="dr-top"><div class="dr-wrap dr-top-in">
<a class="dr-link" href="{rel}index.html">← Portal do curso</a>
<span class="dr-top-title">Diário de IA e engenharia</span>
<a class="dr-link" href="{back_href}">{esc(back_label)}</a>
</div></header>"""


def edition_html(root: Path, ed: dict[str, Any], prev: dict[str, Any] | None, nxt: dict[str, Any] | None) -> str:
    rel = "../../../"
    cal = "../../index.html"
    here = f"{ed['data']}.html"

    def nav_link(e: dict[str, Any] | None, label: str) -> str:
        if not e:
            return f'<span class="dr-nav-off">{label}</span>'
        return f'<a class="dr-link" href="../{e["data"][:4]}/{e["data"]}.html" title="{esc(e["titulo"])}">{label}</a>'

    nav = f'<nav class="dr-nav" aria-label="Navegar entre edições">{nav_link(prev, "← dia anterior")}<a class="dr-link" href="{cal}">Voltar ao calendário</a>{nav_link(nxt, "próximo →")}</nav>'
    tags = "".join(tag_badge(t) for t in ed["tags"])
    sections = ""
    if ed["modulos_afetados"]:
        items = ""
        for m in ed["modulos_afetados"]:
            link = module_link(root, m["modulo"], rel)
            name = f'<a class="dr-link" href="{link}">{esc(m["modulo"])}</a>' if link else f"<strong>{esc(m['modulo'])}</strong>"
            items += f"<li>{name}: {esc(m['motivo'])}</li>"
        sections += f'<section class="tr-card tr-card-raised dr-box"><h2 class="dr-h">Módulos do curso sinalizados</h2><ul class="dr-ul">{items}</ul><p class="dr-muted">O diário só sinaliza. A decisão de editar o módulo é da revisão mensal.</p></section>'
    if ed["revisao"]:
        qs = ""
        for n, q in enumerate(ed["revisao"], 1):
            opts = "".join(
                f'<li class="{"dr-right" if o["correta"] else ""}">{esc(o["texto"])}{" (correta)" if o["correta"] else ""}</li>' for o in q["opcoes"]
            )
            qs += f'<details class="dr-q"><summary>{n}. {esc(q["pergunta"])}</summary><ol class="dr-ul" type="a">{opts}</ol><p>{esc(q["porque"])}</p></details>'
        sections += f'<section class="tr-card tr-card-raised dr-box"><h2 class="dr-h">Revisão rápida</h2>{qs}</section>'
    inner = f"""{topbar(rel, "Voltar ao calendário", cal)}
<main class="dr-wrap dr-article">
<p class="dr-date">{esc(pt_date(ed["data"]))}</p>
<h1 class="dr-title">{esc(ed["titulo"])}</h1>
<p class="dr-lead">{esc(ed["resumo"])}</p>
<div class="dr-tags">{tags}<span class="tr-badge tr-badge-neutral">{ed["fontes_count"]} fontes</span></div>
{nav}
<article class="dr-body">
{md_to_html(ed["body"])}
</article>
{sections}
{nav}
</main>"""
    return page(f"{ed['titulo']} · Diário {ed['data']}", rel, inner, ed["resumo"])


def week_html(w: dict[str, Any]) -> str:
    rel = "../../"
    inner = f"""{topbar(rel, "Voltar ao calendário", "../index.html")}
<main class="dr-wrap dr-article">
<p class="dr-date">Resumo semanal · {esc(w["semana"])}{(" · " + esc(w["periodo"])) if w["periodo"] else ""}</p>
<h1 class="dr-title">{esc(w["titulo"])}</h1>
<p class="dr-lead">{esc(w["resumo"])}</p>
<article class="dr-body">
{md_to_html(w["body"])}
</article>
</main>"""
    return page(f"{w['titulo']} · Diário {w['semana']}", rel, inner, w["resumo"])


# ---------------------------------------------------------------- outputs


def build_index(eds: list[dict[str, Any]], weeks: list[dict[str, Any]]) -> str:
    data = {
        "edicoes": [
            {k: e[k] for k in ("data", "titulo", "resumo", "tags", "modulos_afetados", "url")}
            for e in sorted(eds, key=lambda e: e["data"], reverse=True)
        ],
        "semanas": [
            {k: w[k] for k in ("semana", "titulo", "resumo", "periodo", "url")}
            for w in sorted(weeks, key=lambda w: w["semana"], reverse=True)
        ],
        "tags": KNOWN_TAGS + sorted({t for e in eds for t in e["tags"]} - set(KNOWN_TAGS)),
    }
    return "/* Gerado por tools/build_diario.py — não edite. */\nwindow.DIARIO = " + json.dumps(data, ensure_ascii=False, indent=1) + ";\n"


def build_review(eds: list[dict[str, Any]]) -> str:
    items = []
    for e in sorted(eds, key=lambda e: e["data"]):
        for n, q in enumerate(e["revisao"], 1):
            items.append({"id": f"{e['data']}#{n}", "data": e["data"], "pergunta": q["pergunta"],
                          "opcoes": q["opcoes"], "porque": q["porque"], "url": e["url"]})
    return "/* Gerado por tools/build_diario.py — não edite. */\nwindow.DIARIO_REVISAO = " + json.dumps(items, ensure_ascii=False, indent=1) + ";\n"


def radar_bullets(body: str) -> list[str]:
    """Bullets of the "## Radar de ferramentas" section, as Markdown text (one string per bullet)."""
    m = re.search(r"^##[ \t]+Radar de ferramentas[ \t]*\n(.*?)(?=^##[ \t]|^---[ \t]*$|\Z)", body, re.S | re.M)
    if not m:
        return []
    items: list[str] = []
    for line in m.group(1).splitlines():
        if re.match(r"\s*[-*]\s+", line):
            items.append(re.sub(r"^\s*[-*]\s+", "", line).strip())
        elif items and line.strip():
            items[-1] += " " + line.strip()
    return items


def build_radar(eds: list[dict[str, Any]]) -> str:
    import markdown  # lazy, like md_to_html

    items = []
    for e in sorted(eds, key=lambda e: e["data"], reverse=True):
        for b in radar_bullets(e["body"]):
            texto = markdown.markdown(b, extensions=["extra"], output_format="html")
            texto = re.sub(r"^<p>(.*)</p>$", r"\1", texto, flags=re.S)
            texto = re.sub(r'<a href="(https?://[^"]+)"', r'<a href="\1" rel="noopener noreferrer"', texto)
            items.append({"data": e["data"], "texto_html": texto, "url_edicao": e["url"]})
    return "/* Gerado por tools/build_diario.py — não edite. */\nwindow.DIARIO_RADAR = " + json.dumps(items, ensure_ascii=False, indent=1) + ";\n"


def read_treated(root: Path) -> set[str]:
    """Edition dates already handled by the monthly review, one per line in diario/revisao-tratadas.txt."""
    p = root / DIARIO / "revisao-tratadas.txt"
    if not p.is_file():
        return set()
    return {ln.split("#")[0].strip() for ln in p.read_text(encoding="utf-8").splitlines() if ln.split("#")[0].strip()}


def build_queue(eds: list[dict[str, Any]], treated: set[str]) -> str:
    pending: dict[str, list[tuple[str, str, str]]] = {}
    for e in sorted(eds, key=lambda e: e["data"]):
        if e["data"] in treated:
            continue
        for m in e["modulos_afetados"]:
            pending.setdefault(m["modulo"], []).append((e["data"], m["motivo"], e["titulo"]))
    out = ["# Fila de revisão mensal", "",
           "Gerada por `tools/build_diario.py` a partir de `modulos_afetados` das edições ainda não tratadas. "
           "Para dar uma edição como tratada, acrescente a data em `diario/revisao-tratadas.txt`.", ""]
    if not pending:
        out.append("Nenhum módulo sinalizado.")
    for code in sorted(pending):
        out += [f"## {code}", ""]
        for data, motivo, titulo in pending[code]:
            out.append(f"- [{data}](edicoes/{data[:4]}/{data}.html) ({titulo}): {motivo}")
        out.append("")
    return "\n".join(out).rstrip() + "\n"


def queue_html(md_text: str) -> str:
    inner = f"""{topbar("../", "Voltar ao calendário", "index.html")}
<main class="dr-wrap dr-article"><article class="dr-body">
{md_to_html(md_text)}
</article></main>"""
    return page("Fila de revisão mensal · Diário", "../", inner, "Módulos do curso sinalizados pelas edições do diário.")


def write_if_changed(path: Path, text: str) -> bool:
    if path.is_file() and path.read_text(encoding="utf-8") == text:
        return False
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(text, encoding="utf-8")
    return True


def build(root: Path = ROOT) -> dict[str, int]:
    eds, weeks = discover(root)
    base = root / DIARIO
    for i, e in enumerate(eds):
        prev = eds[i - 1] if i > 0 else None
        nxt = eds[i + 1] if i + 1 < len(eds) else None
        write_if_changed(e["path"].with_suffix(".html"), edition_html(root, e, prev, nxt))
    for w in weeks:
        write_if_changed(w["path"].with_suffix(".html"), week_html(w))
    write_if_changed(base / "indice.js", build_index(eds, weeks))
    write_if_changed(base / "revisao.js", build_review(eds))
    write_if_changed(base / "radar.js", build_radar(eds))
    queue = build_queue(eds, read_treated(root))
    write_if_changed(base / "fila-revisao-mensal.md", queue)
    write_if_changed(base / "fila-revisao-mensal.html", queue_html(queue))
    return {"edicoes": len(eds), "semanas": len(weeks)}


def main() -> int:
    argparse.ArgumentParser(description=__doc__.splitlines()[0]).parse_args()
    try:
        counts = build()
    except (ValueError, ImportError) as exc:
        print(f"erro: {exc}", file=sys.stderr)
        return 1
    print(f"diário: {counts['edicoes']} edições, {counts['semanas']} resumos semanais")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
