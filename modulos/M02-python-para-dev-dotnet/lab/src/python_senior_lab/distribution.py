"""Inspeção offline de artefatos de distribuição antes da publicação."""

from __future__ import annotations

import zipfile
from collections.abc import Iterable
from dataclasses import dataclass
from pathlib import Path

DEFAULT_REQUIRED_MEMBERS = (
    "python_senior_lab/__init__.py",
    "python_senior_lab/py.typed",
)


class WheelContractError(ValueError):
    """O artefato não satisfaz o conteúdo mínimo declarado pelo pacote."""


@dataclass(frozen=True, slots=True)
class WheelInspection:
    path: Path
    members: tuple[str, ...]
    required_members: tuple[str, ...]


def inspect_wheel(
    wheel_path: Path,
    *,
    required_members: Iterable[str] = DEFAULT_REQUIRED_MEMBERS,
) -> WheelInspection:
    """Lê somente o ZIP do wheel e falha se qualquer arquivo obrigatório estiver ausente."""

    if wheel_path.suffix != ".whl":
        raise WheelContractError(f"artefato não é wheel: {wheel_path.name}")

    required = tuple(required_members)
    if not required:
        raise WheelContractError("required_members não pode ser vazio")

    try:
        with zipfile.ZipFile(wheel_path) as archive:
            members = tuple(sorted(archive.namelist()))
    except (OSError, zipfile.BadZipFile) as exc:
        raise WheelContractError(f"wheel ilegível: {wheel_path}") from exc

    available = set(members)
    missing = tuple(member for member in required if member not in available)
    if missing:
        raise WheelContractError(f"arquivos ausentes no wheel: {', '.join(missing)}")

    return WheelInspection(path=wheel_path, members=members, required_members=required)
