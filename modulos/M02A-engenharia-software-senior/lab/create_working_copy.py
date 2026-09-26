"""Cria uma cópia descartável e marcada do laboratório M02A."""

from __future__ import annotations

import shutil
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent
DESTINATION_ROOT = Path(tempfile.gettempdir()) / "tutor-ia-codex-labs"
IGNORED_NAMES = frozenset(
    {
        ".git",
        ".hypothesis",
        ".mypy_cache",
        ".pytest_cache",
        ".ruff_cache",
        ".venv",
        "__pycache__",
        "dist",
        "build",
    }
)


def _ignore(_: str, names: list[str]) -> set[str]:
    return set(names) & IGNORED_NAMES


def main() -> None:
    """Copia somente a referência versionada para um diretório temporário possuído."""
    DESTINATION_ROOT.mkdir(parents=True, exist_ok=True)
    destination = Path(tempfile.mkdtemp(prefix="M02A-work-intake-", dir=DESTINATION_ROOT))
    shutil.copytree(ROOT, destination, dirs_exist_ok=True, ignore=_ignore)
    (destination / ".course-lab-workspace").write_text("M02A\n", encoding="utf-8")
    print(destination)


if __name__ == "__main__":
    main()
