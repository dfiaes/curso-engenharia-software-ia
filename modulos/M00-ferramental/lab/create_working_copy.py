"""Cria uma cópia descartável do laboratório M00 fora do repositório do curso."""

from __future__ import annotations

import argparse
import shutil
import tempfile
import uuid
from pathlib import Path

SOURCE = Path(__file__).resolve().parent
IGNORED_NAMES = {".venv", ".mypy_cache", ".ruff_cache", "__pycache__"}
GUIDED_FILES = (
    "src/harness_lab/contract.py",
    "src/harness_lab/context.py",
    "src/harness_lab/policy.py",
)


def _ignore(_: str, names: list[str]) -> set[str]:
    return {name for name in names if name in IGNORED_NAMES}


def _empty_guided_files(destination: Path) -> None:
    for relative_name in GUIDED_FILES:
        target = destination / relative_name
        target.write_text(
            '"""Este arquivo será reconstruído pelo Laboratório guiado M00.\n\n'
            "Copie o bloco indicado no material antes de executar os testes.\n"
            '"""\n',
            encoding="utf-8",
        )


def create_copy(destination: Path | None, guided: bool) -> Path:
    if destination is None:
        destination = (
            Path(tempfile.gettempdir())
            / "tutor-ia-codex-labs"
            / f"M00-harness-{uuid.uuid4().hex[:8]}"
        )
    destination = destination.resolve(strict=False)
    if destination.exists():
        raise FileExistsError(f"destino já existe: {destination}")

    shutil.copytree(SOURCE, destination, ignore=_ignore)
    (destination / ".course-lab-workspace").write_text("M00\n", encoding="utf-8")
    if guided:
        _empty_guided_files(destination)
    return destination


def main() -> int:
    parser = argparse.ArgumentParser(description="Cria cópia descartável do laboratório M00")
    parser.add_argument(
        "--destination",
        type=Path,
        help="diretório novo; por padrão usa a pasta temporária",
    )
    parser.add_argument(
        "--reference",
        action="store_true",
        help="mantém o código final para consulta, sem limpar os três arquivos do roteiro",
    )
    args = parser.parse_args()
    created = create_copy(args.destination, guided=not args.reference)
    print(created)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
