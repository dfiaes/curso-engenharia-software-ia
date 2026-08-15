"""Gate mínimo da primeira fatia do Capstone e de seu handoff."""

from __future__ import annotations

import csv
import re
from dataclasses import dataclass
from pathlib import Path

_REQUIREMENT = re.compile(r"\bR[FN]-[0-9]{3}\b")


@dataclass(frozen=True)
class CapstoneResult:
    ok: bool
    issues: tuple[str, ...]


def validate_capstone_slice(root: Path) -> CapstoneResult:
    required = ("intent.md", "requirements.md", "design.md", "plan.md", "trace.csv", "handoff.md")
    issues = [f"missing:{name}" for name in required if not (root / name).is_file()]
    if issues:
        return CapstoneResult(False, tuple(issues))

    requirements = set(_REQUIREMENT.findall((root / "requirements.md").read_text(encoding="utf-8")))
    with (root / "trace.csv").open(encoding="utf-8", newline="") as stream:
        rows = list(csv.DictReader(stream))
    traced = {row.get("requirement_id", "") for row in rows}
    for requirement in sorted(requirements - traced):
        issues.append(f"untraced:{requirement}")
    for row in rows:
        if not row.get("test", "").strip():
            issues.append(f"missing_test:{row.get('requirement_id', '?')}")

    handoff = (root / "handoff.md").read_text(encoding="utf-8").casefold()
    for marker in ("última verificação", "próxima ação", "pendências"):
        if marker not in handoff:
            issues.append(f"handoff_missing:{marker}")
    return CapstoneResult(not issues, tuple(issues))
