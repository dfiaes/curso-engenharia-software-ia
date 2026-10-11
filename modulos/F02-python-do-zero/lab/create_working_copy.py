"""Cria uma cópia de trabalho descartável deste laboratório."""

from __future__ import annotations

import argparse
import shutil
import sys
import tempfile
from pathlib import Path

HERE = Path(__file__).resolve().parent
IGNORE = shutil.ignore_patterns(
    ".venv", "__pycache__", "*.pyc", ".pytest_cache", ".mypy_cache", ".ruff_cache", "evidence/*"
)


def main() -> int:
    parser = argparse.ArgumentParser(description="Cópia de trabalho do lab F02")
    parser.add_argument("--dest", default="")
    args = parser.parse_args()

    dest = Path(args.dest) if args.dest else Path(tempfile.mkdtemp(prefix="f02-"))
    if dest.exists() and any(dest.iterdir()):
        print(f"destino não está vazio: {dest}", file=sys.stderr)
        return 1
    shutil.copytree(HERE, dest, ignore=IGNORE, dirs_exist_ok=True)
    (dest / ".working-copy").write_text(
        "cópia de trabalho F02 - pode ser descartada e refeita\n", encoding="utf-8"
    )
    print(str(dest))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
