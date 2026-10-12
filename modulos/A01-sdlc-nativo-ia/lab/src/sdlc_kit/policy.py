"""Deterministic guardrails as pure functions: the same code runs in an agent hook,
in a git pre-commit hook and in a CI step."""

from __future__ import annotations

import json
import math
import re
from collections.abc import Iterable
from dataclasses import dataclass
from pathlib import Path, PurePosixPath

from sdlc_kit.findings import Finding


@dataclass(frozen=True, slots=True)
class Policy:
    protected_paths: tuple[str, ...] = ()
    test_globs: tuple[str, ...] = ()
    fix_branch_prefix: str = "fix/"
    secret_allow_files: tuple[str, ...] = ()


@dataclass(frozen=True, slots=True)
class ChangedFile:
    """``status`` is the first letter of ``git diff --name-status``: A, M, D (R is split)."""

    status: str
    path: str


def load_policy(path: Path) -> Policy:
    data = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(data, dict):
        raise ValueError("policy must be a JSON object")
    known = {"protected_paths", "test_globs", "fix_branch_prefix", "secret_allow_files"}
    unknown = set(data) - known
    if unknown:
        raise ValueError(f"unknown policy keys: {sorted(unknown)}")
    return Policy(
        protected_paths=tuple(data.get("protected_paths", ())),
        test_globs=tuple(data.get("test_globs", ())),
        fix_branch_prefix=str(data.get("fix_branch_prefix", "fix/")),
        secret_allow_files=tuple(data.get("secret_allow_files", ())),
    )


def matches(path: str, patterns: Iterable[str]) -> bool:
    """Glob match with ``**`` support (``PurePosixPath.full_match``, Python 3.13+)."""
    posix = PurePosixPath(path.replace("\\", "/"))
    return any(posix.full_match(p) for p in patterns)


def check_protected_paths(files: Iterable[ChangedFile], policy: Policy) -> list[Finding]:
    return [
        Finding("PROTECTED_PATH", "caminho protegido: mudança exige o fluxo de aprovação", f.path)
        for f in files
        if matches(f.path, policy.protected_paths)
    ]


def check_test_edits(files: Iterable[ChangedFile], branch: str, policy: Policy) -> list[Finding]:
    """On ``fix/*`` branches an existing test may not be modified or deleted; new tests are fine."""
    if not branch.startswith(policy.fix_branch_prefix):
        return []
    return [
        Finding(
            "TEST_EDIT_ON_FIX",
            f"teste existente alterado ({f.status}) em branch de correção: "
            "corrija o código, não o teste",
            f.path,
        )
        for f in files
        if f.status in {"M", "D"} and matches(f.path, policy.test_globs)
    ]


_PLACEHOLDER = re.compile(r"(?i)(changeme|example|placeholder|your[_-]|xxx|<.+>|\$\{.+\}|dummy)")
_ASSIGN = re.compile(
    r"""(?ix)\b(?:api[_-]?key|secret|token|passw(?:or)?d|private[_-]?key)\b
    ["']?\s*[:=]\s*["']([^"'\s]{16,})["']"""
)
_SHAPES = (
    ("AWS_ACCESS_KEY", re.compile(r"\bAKIA[0-9A-Z]{16}\b")),
    ("GITHUB_TOKEN", re.compile(r"\bgh[pousr]_[A-Za-z0-9]{36,}\b")),
    ("PRIVATE_KEY", re.compile(r"-----BEGIN (?:RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----")),
)
ALLOW_MARKER = "sdlc:allow-secret"
_HUNK = re.compile(r"^@@ -\d+(?:,\d+)? \+(\d+)(?:,\d+)? @@")


def entropy(value: str) -> float:
    """Shannon entropy in bits per character."""
    if not value:
        return 0.0
    counts: dict[str, int] = {}
    for ch in value:
        counts[ch] = counts.get(ch, 0) + 1
    n = len(value)
    return -sum(c / n * math.log2(c / n) for c in counts.values())


def _redact(value: str) -> str:
    return value[:4] + "***"


def scan_diff(diff: str, policy: Policy | None = None, min_entropy: float = 3.5) -> list[Finding]:
    """Find secrets in lines *added* by a unified diff. Removed and context lines are ignored."""
    allow_files = policy.secret_allow_files if policy else ()
    out: list[Finding] = []
    path = ""
    line_no = 0
    for raw in diff.splitlines():
        if raw.startswith("+++ "):
            target = raw[4:].strip()
            path = "" if target == "/dev/null" else target.removeprefix("b/")
            continue
        if raw.startswith("--- "):
            continue
        hunk = _HUNK.match(raw)
        if hunk:
            line_no = int(hunk.group(1))
            continue
        if raw.startswith("+"):
            text = raw[1:]
            here = line_no
            line_no += 1
            if not path or ALLOW_MARKER in text or matches(path, allow_files):
                continue
            out += _scan_line(text, path, here, min_entropy)
        elif raw.startswith(" "):
            line_no += 1
    return out


def _scan_line(text: str, path: str, line: int, min_entropy: float) -> list[Finding]:
    found: list[Finding] = []
    for code, pattern in _SHAPES:
        m = pattern.search(text)
        if m:
            found.append(
                Finding(f"SECRET_{code}", f"segredo no diff ({_redact(m.group(0))})", path, line)
            )
    if found:
        return found
    m = _ASSIGN.search(text)
    if m:
        value = m.group(1)
        if not _PLACEHOLDER.search(value) and entropy(value) >= min_entropy:
            found.append(
                Finding(
                    "SECRET_ASSIGNMENT",
                    f"credencial literal no diff ({_redact(value)})",
                    path,
                    line,
                )
            )
    return found
