"""Runner cross-platform sem shell implícito e com evidência serializável."""

from __future__ import annotations

import json
import os
import subprocess
import time
from dataclasses import asdict, dataclass
from datetime import UTC, datetime
from pathlib import Path

TIMEOUT_EXIT_CODE = 124
POLICY_EXIT_CODE = 126


@dataclass(frozen=True)
class CommandPolicy:
    allowed_executables: frozenset[str]
    workspace: Path
    max_output_chars: int = 4_000


@dataclass(frozen=True)
class RunSpec:
    argv: tuple[str, ...]
    cwd: Path
    timeout_seconds: float = 30.0


@dataclass(frozen=True)
class RunEvidence:
    argv: tuple[str, ...]
    cwd: str
    started_at: str
    duration_ms: int
    exit_code: int
    timed_out: bool
    stdout: str
    stderr: str
    tool_version: str
    policy_reason: str | None = None

    def write_json(self, path: Path) -> None:
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(
            json.dumps(asdict(self), ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
        )


def _within(root: Path, candidate: Path) -> bool:
    try:
        candidate.resolve().relative_to(root.resolve())
    except ValueError:
        return False
    return True


def _executable_name(value: str) -> str:
    return Path(value).name.casefold()


def _deny(spec: RunSpec, reason: str) -> RunEvidence:
    return RunEvidence(
        argv=spec.argv,
        cwd=str(spec.cwd),
        started_at=datetime.now(UTC).isoformat(),
        duration_ms=0,
        exit_code=POLICY_EXIT_CODE,
        timed_out=False,
        stdout="",
        stderr="",
        tool_version="",
        policy_reason=reason,
    )


def run_command(spec: RunSpec, policy: CommandPolicy) -> RunEvidence:
    if not spec.argv or any(not token for token in spec.argv):
        return _deny(spec, "argv_empty")
    executable = _executable_name(spec.argv[0])
    if executable.endswith((".bat", ".cmd", ".ps1", ".sh")):
        return _deny(spec, "shell_script_requires_review")
    if executable not in {item.casefold() for item in policy.allowed_executables}:
        return _deny(spec, "executable_not_allowlisted")
    if not _within(policy.workspace, spec.cwd):
        return _deny(spec, "cwd_outside_workspace")
    if spec.timeout_seconds <= 0:
        return _deny(spec, "invalid_timeout")

    started = datetime.now(UTC).isoformat()
    monotonic_start = time.monotonic()
    env = os.environ.copy()
    env["PYTHONUTF8"] = "1"
    version_probe = subprocess.run(
        [spec.argv[0], "--version"],
        cwd=spec.cwd,
        env=env,
        capture_output=True,
        text=True,
        encoding="utf-8",
        errors="replace",
        timeout=min(spec.timeout_seconds, 5.0),
        check=False,
        shell=False,
    )
    tool_version = (version_probe.stdout or version_probe.stderr).strip().splitlines()[0]
    try:
        completed = subprocess.run(
            list(spec.argv),
            cwd=spec.cwd,
            env=env,
            capture_output=True,
            text=True,
            encoding="utf-8",
            errors="replace",
            timeout=spec.timeout_seconds,
            check=False,
            shell=False,
        )
        exit_code = completed.returncode
        timed_out = False
        stdout = completed.stdout
        stderr = completed.stderr
    except subprocess.TimeoutExpired as exc:
        exit_code = TIMEOUT_EXIT_CODE
        timed_out = True
        stdout = exc.stdout.decode() if isinstance(exc.stdout, bytes) else (exc.stdout or "")
        stderr = exc.stderr.decode() if isinstance(exc.stderr, bytes) else (exc.stderr or "")
    duration_ms = int((time.monotonic() - monotonic_start) * 1_000)
    limit = policy.max_output_chars
    return RunEvidence(
        argv=spec.argv,
        cwd=str(spec.cwd.resolve()),
        started_at=started,
        duration_ms=duration_ms,
        exit_code=exit_code,
        timed_out=timed_out,
        stdout=stdout[-limit:],
        stderr=stderr[-limit:],
        tool_version=tool_version,
    )
