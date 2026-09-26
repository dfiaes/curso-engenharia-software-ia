"""Cria uma cópia de trabalho descartável deste laboratório.

Uso:
    python3 create_working_copy.py [--dest DIR]

Sem --dest, cria um diretório temporário novo e imprime o caminho.
A cópia nunca inclui .venv, __pycache__ nem evidence gerada.
"""

from __future__ import annotations

import argparse
import shutil
import sys
import tempfile
from pathlib import Path

HERE = Path(__file__).resolve().parent
IGNORE = shutil.ignore_patterns(".venv", "__pycache__", "*.pyc", "evidence/*")


def main() -> int:
    parser = argparse.ArgumentParser(description="Copia de trabalho do lab M03/B02")
    parser.add_argument("--dest", default="", help="diretório de destino (deve estar vazio)")
    args = parser.parse_args()

    dest = Path(args.dest) if args.dest else Path(tempfile.mkdtemp(prefix="m03-b02-"))
    if dest.exists() and any(dest.iterdir()):
        print(f"destino não está vazio: {dest}", file=sys.stderr)
        return 1
    shutil.copytree(HERE, dest, ignore=IGNORE, dirs_exist_ok=True)
    marker = dest / ".working-copy"
    marker.write_text(
        "copia de trabalho M03/B02 - pode ser descartada e refeita\n", encoding="utf-8"
    )
    print(str(dest))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
