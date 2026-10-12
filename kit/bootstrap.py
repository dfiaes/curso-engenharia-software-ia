#!/usr/bin/env python3
"""Copia o kit (kit/template) para um projeto, sem sobrescrever arquivos existentes.

Uso:
    python kit/bootstrap.py <destino> [--existing] [--dry-run]

--existing  projeto que já tem pipelines/convenções: não copia deploy.yml nem azure-pipelines.yml
            (adote-os conscientemente, comparando com os seus).
--dry-run   só lista o que faria.
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


@dataclass
class Report:
    created: list[str] = field(default_factory=list)
    skipped_existing: list[str] = field(default_factory=list)
    skipped_mode: list[str] = field(default_factory=list)


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


def format_report(report: Report, dry_run: bool) -> str:
    verb = "criaria" if dry_run else "criado"
    lines = [f"{verb}: {p}" for p in report.created]
    lines += [f"já existe (mantido): {p}" for p in report.skipped_existing]
    lines += [f"ignorado (--existing): {p}" for p in report.skipped_mode]
    lines.append(f"resumo: {len(report.created)} {verb}(s), {len(report.skipped_existing)} mantido(s), {len(report.skipped_mode)} ignorado(s)")
    return "\n".join(lines)


def main(argv: Sequence[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("destino", type=Path)
    parser.add_argument("--existing", action="store_true")
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args(argv)
    if not args.destino.is_dir():
        if args.dry_run:
            print(f"aviso: {args.destino} não existe (seria criado)", file=sys.stderr)
        else:
            args.destino.mkdir(parents=True)
    report = apply_kit(args.destino, existing=args.existing, dry_run=args.dry_run)
    print(format_report(report, args.dry_run))
    if not args.dry_run:
        print("\nPróximo passo: preencha os [PREENCHER] do AGENTS.md e ajuste o Makefile à sua stack.")
        if args.existing:
            print("Projeto existente: rode prompts/onboarding-repo-existente.md numa sessão só-leitura.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
