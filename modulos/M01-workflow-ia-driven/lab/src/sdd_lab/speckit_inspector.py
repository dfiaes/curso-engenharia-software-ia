"""Descobre adapters em snapshot local; nunca instala nem executa workflows."""

from __future__ import annotations

import re
from dataclasses import dataclass
from pathlib import Path

_COMMAND = re.compile(r"(?<![\w])(?:/speckit\.[a-z][\w.-]*|\$speckit-[a-z][\w.-]*)")
_SHELL_MARKER = re.compile(r"(?im)^\s*(?:run:|shell:|type:\s*shell\b)")


@dataclass(frozen=True)
class SpecKitSnapshot:
    commands: tuple[str, ...]
    files_with_process_steps: tuple[str, ...]


def inspect_snapshot(root: Path) -> SpecKitSnapshot:
    commands: set[str] = set()
    risky: list[str] = []
    for path in sorted(root.rglob("*")):
        if not path.is_file():
            continue
        try:
            text = path.read_text(encoding="utf-8")
        except UnicodeDecodeError:
            continue
        commands.update(_COMMAND.findall(text))
        if _SHELL_MARKER.search(text):
            risky.append(path.relative_to(root).as_posix())
    return SpecKitSnapshot(tuple(sorted(commands)), tuple(risky))
