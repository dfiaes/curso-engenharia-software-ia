#!/usr/bin/env python3
"""Copia o kit (kit/template) para um projeto, sem sobrescrever arquivos existentes.

Uso:
    python kit/bootstrap.py <destino> [--existing] [--dry-run] [--tools cursor,claude,codex,opencode]

--existing  projeto que já tem pipelines/convenções: não copia deploy.yml nem azure-pipelines.yml
            (adote-os conscientemente, comparando com os seus).
--dry-run   só lista o que faria.
--tools     copia os comandos (.agents/commands) e as skills (.agents/skills) para os diretórios de
            cada ferramenta: cursor, claude, codex, opencode. Nunca sobrescreve.
"""
from __future__ import annotations

import argparse
import shutil
import sys
from dataclasses import dataclass, field
from pathlib import Path
from typing import Sequence

TEMPLATE = Path(__file__).resolve().parent / "template"
EXISTING_SKIP = {".github/workflows/deploy.yml", "azure-pipelines.yml"}
IGNORED_PARTS = {"__pycache__", ".pytest_cache"}
TOOLS = ("cursor", "claude", "codex", "opencode")
COMMANDS_DIR = ".agents/commands"
SKILLS_DIR = ".agents/skills"
# Onde cada ferramenta procura comandos e skills (verificado em 12/10/2026, ver Trilha rápida).
# None = a ferramenta já lê a pasta .agents/ nativamente (ou não tem o recurso em arquivo de repositório).
COMMAND_TARGET = {"cursor": ".cursor/commands", "claude": ".claude/commands", "opencode": ".opencode/commands", "codex": None}
SKILL_TARGET = {"cursor": None, "claude": ".claude/skills", "opencode": None, "codex": None}


@dataclass
class Report:
    created: list[str] = field(default_factory=list)
    skipped_existing: list[str] = field(default_factory=list)
    skipped_mode: list[str] = field(default_factory=list)
    tools_created: list[str] = field(default_factory=list)


def iter_template(template: Path) -> list[Path]:
    files = [p for p in template.rglob("*") if p.is_file() and not (IGNORED_PARTS & set(p.parts))]
    return sorted(files)


def apply_kit(dest: Path, existing: bool = False, dry_run: bool = False, template: Path = TEMPLATE) -> Report:
    report = Report()
    for src in iter_template(template):
        rel = src.relative_to(template).as_posix()
        target = dest / rel
        if existing and rel in EXISTING_SKIP:
            report.skipped_mode.append(rel)
            continue
        if target.exists():
            report.skipped_existing.append(rel)
            continue
        report.created.append(rel)
        if not dry_run:
            target.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(src, target)
    return report


def parse_tools(value: str) -> list[str]:
    tools = [t.strip().lower() for t in value.split(",") if t.strip()]
    unknown = [t for t in tools if t not in TOOLS]
    if unknown:
        raise ValueError(f"ferramenta(s) desconhecida(s): {', '.join(unknown)} (use: {', '.join(TOOLS)})")
    return list(dict.fromkeys(tools))


def _split_frontmatter(text: str) -> tuple[dict[str, str], str]:
    if not text.startswith("---\n"):
        return {}, text
    head, sep, body = text[4:].partition("\n---\n")
    if not sep:
        return {}, text
    meta: dict[str, str] = {}
    for line in head.splitlines():
        key, colon, val = line.partition(":")
        if colon:
            meta[key.strip()] = val.strip().strip('"')
    return meta, body.lstrip("\n")


def _codex_skill_from_command(name: str, text: str) -> str:
    """Codex não tem comando de repositório (prompts personalizados são só do usuário e estão obsoletos):
    o comando vira uma skill chamada por `$nome`."""
    meta, body = _split_frontmatter(text)
    desc = meta.get("description", name).replace("\n", " ")
    return f"---\nname: {name}\ndescription: {desc}. Invocar explicitamente com ${name}.\n---\n\n{body}"


def apply_tools(dest: Path, tools: Sequence[str], dry_run: bool = False, template: Path = TEMPLATE) -> list[str]:
    """Copia .agents/commands e .agents/skills para os diretórios de cada ferramenta. Não sobrescreve."""
    created: list[str] = []

    def put(rel: str, writer) -> None:  # type: ignore[no-untyped-def]
        target = dest / rel
        if target.exists():
            return
        created.append(rel)
        if not dry_run:
            target.parent.mkdir(parents=True, exist_ok=True)
            writer(target)

    commands = sorted((template / COMMANDS_DIR).glob("*.md"))
    skill_files = [p for p in iter_template(template / SKILLS_DIR)]
    for tool in tools:
        cdir = COMMAND_TARGET[tool]
        if cdir:
            for src in commands:
                put(f"{cdir}/{src.name}", lambda t, s=src: shutil.copy2(s, t))
        if tool == "codex":
            for src in commands:
                text = src.read_text(encoding="utf-8")
                put(f"{SKILLS_DIR}/{src.stem}/SKILL.md", lambda t, n=src.stem, x=text: t.write_text(_codex_skill_from_command(n, x), encoding="utf-8"))
        sdir = SKILL_TARGET[tool]
        if sdir:
            for src in skill_files:
                rel = src.relative_to(template / SKILLS_DIR).as_posix()
                put(f"{sdir}/{rel}", lambda t, s=src: shutil.copy2(s, t))
    return created


def format_report(report: Report, dry_run: bool) -> str:
    verb = "criaria" if dry_run else "criado"
    lines = [f"{verb}: {p}" for p in report.created]
    lines += [f"já existe (mantido): {p}" for p in report.skipped_existing]
    lines += [f"ignorado (--existing): {p}" for p in report.skipped_mode]
    lines += [f"{verb} (--tools): {p}" for p in report.tools_created]
    lines.append(f"resumo: {len(report.created)} {verb}(s), {len(report.skipped_existing)} mantido(s), {len(report.skipped_mode)} ignorado(s), {len(report.tools_created)} por ferramenta")
    return "\n".join(lines)


def main(argv: Sequence[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("destino", type=Path)
    parser.add_argument("--existing", action="store_true")
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--tools", default="", help="lista separada por vírgula: " + ",".join(TOOLS))
    args = parser.parse_args(argv)
    try:
        tools = parse_tools(args.tools)
    except ValueError as exc:
        parser.error(str(exc))
    if not args.destino.is_dir():
        if args.dry_run:
            print(f"aviso: {args.destino} não existe (seria criado)", file=sys.stderr)
        else:
            args.destino.mkdir(parents=True)
    report = apply_kit(args.destino, existing=args.existing, dry_run=args.dry_run)
    if tools:
        report.tools_created = apply_tools(args.destino, tools, dry_run=args.dry_run)
    print(format_report(report, args.dry_run))
    if not args.dry_run:
        print("\nPróximo passo: preencha os [PREENCHER] do AGENTS.md e ajuste o Makefile à sua stack.")
        if args.existing:
            print("Projeto existente: rode prompts/onboarding-repo-existente.md numa sessão só-leitura.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
