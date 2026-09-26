"""Cria uma cópia descartável do laboratório M02 fora do repositório do curso."""

from __future__ import annotations

import argparse
import shutil
import tempfile
import uuid
from pathlib import Path

SOURCE = Path(__file__).resolve().parent
IGNORED_NAMES = {
    ".hypothesis",
    ".mypy_cache",
    ".orchestrator-wheel-csv",
    ".orchestrator-wheel-test",
    ".pytest_cache",
    ".ruff_cache",
    ".venv",
    ".wheel-test",
    "__pycache__",
}
GUIDED_FILE = Path("src/python_senior_lab/models.py")


def _ignore(_: str, names: list[str]) -> set[str]:
    return {name for name in names if name in IGNORED_NAMES}


def create_copy(destination: Path | None, guided: bool) -> Path:
    if destination is None:
        temporary_root = Path(tempfile.gettempdir()) / "tutor-ia-codex-labs"
        destination = temporary_root / f"M02-python-{uuid.uuid4().hex[:8]}"
    destination = destination.resolve(strict=False)
    if destination.exists():
        raise FileExistsError(f"destino já existe: {destination}")
    shutil.copytree(SOURCE, destination, ignore=_ignore)
    (destination / ".course-lab-workspace").write_text("M02\n", encoding="utf-8")
    if guided:
        (destination / GUIDED_FILE).write_text(
            '"""Este arquivo será reconstruído pelo Laboratório guiado M02."""\n',
            encoding="utf-8",
        )
    return destination


def main() -> int:
    parser = argparse.ArgumentParser(description="Cria cópia descartável do laboratório M02")
    parser.add_argument(
        "--destination",
        type=Path,
        help="diretório novo; por padrão usa a pasta temporária",
    )
    parser.add_argument(
        "--reference",
        action="store_true",
        help="mantém o código final, sem limpar o arquivo reconstruído pelo roteiro",
    )
    args = parser.parse_args()
    print(create_copy(args.destination, guided=not args.reference))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
