"""One shim for the agent-side hook of any tool that blocks on exit code 2.

Claude Code, Codex and Cursor pass the tool call as JSON on stdin and treat exit code 2 with a
message on stderr as "block". The payload field names differ by tool and version, so the shim
looks for paths in the usual places and in ``apply_patch`` text. It is a guardrail, not a
boundary: the pre-commit and CI checks are the backstop.
"""

from __future__ import annotations

import json
import re
from collections.abc import Callable, Iterator
from dataclasses import dataclass
from typing import Any

from sdlc_kit.policy import Policy, matches

_PATH_KEYS = ("file_path", "filePath", "path", "target_file")
_PATCH_FILE = re.compile(r"^\*\*\* (?:Add|Update|Delete) File: (.+)$", re.MULTILINE)
EXIT_BLOCK = 2


@dataclass(frozen=True, slots=True)
class Decision:
    blocked: bool
    reason: str = ""


def _strings(node: Any) -> Iterator[str]:
    if isinstance(node, str):
        yield node
    elif isinstance(node, dict):
        for value in node.values():
            yield from _strings(value)
    elif isinstance(node, list):
        for value in node:
            yield from _strings(value)


def extract_paths(payload: dict[str, Any]) -> list[str]:
    """Paths a tool call intends to touch, from ``tool_input`` or top-level fields."""
    raw = payload.get("tool_input", payload)
    paths: list[str] = []
    if isinstance(raw, dict):
        for key in _PATH_KEYS:
            value = raw.get(key)
            if isinstance(value, str) and value:
                paths.append(value)
    for text in _strings(raw):
        paths += [m.strip() for m in _PATCH_FILE.findall(text)]
    return list(dict.fromkeys(paths))


def decide(
    payload: dict[str, Any],
    policy: Policy,
    branch: str,
    exists: Callable[[str], bool],
) -> Decision:
    """Block protected paths always, and edits of *existing* tests on fix branches."""
    on_fix = branch.startswith(policy.fix_branch_prefix)
    for path in extract_paths(payload):
        if matches(path, policy.protected_paths):
            return Decision(True, f"{path}: caminho protegido; abra uma solicitação de mudança")
        if on_fix and matches(path, policy.test_globs) and exists(path):
            return Decision(
                True,
                f"{path}: teste existente em branch de correção; corrija o código, não o teste",
            )
    return Decision(False)


def parse_payload(raw: str) -> dict[str, Any]:
    data = json.loads(raw) if raw.strip() else {}
    if not isinstance(data, dict):
        raise ValueError("hook payload must be a JSON object")
    return data
