"""Hermetic Git driver for scenarios and tests.

Every call ignores the user's global and system config and uses a fixed identity
and a fake clock, so commit ids are reproducible on any machine.
"""

from __future__ import annotations

import os
import shutil
import subprocess
from dataclasses import dataclass
from pathlib import Path

BASE_EPOCH = 1_767_268_800  # 2026-01-01T12:00:00Z


class GitMissing(RuntimeError):
    """The ``git`` executable is not on PATH."""


def git_available() -> bool:
    return shutil.which("git") is not None


def _hermetic_env(epoch: int) -> dict[str, str]:
    env = {k: v for k, v in os.environ.items() if not k.startswith("GIT_")}
    date = f"{epoch} +0000"
    env.update(
        GIT_CONFIG_GLOBAL=os.devnull,
        GIT_CONFIG_NOSYSTEM="1",
        GIT_AUTHOR_NAME="Ada Lovelace",
        GIT_AUTHOR_EMAIL="ada@example.com",
        GIT_COMMITTER_NAME="Ada Lovelace",
        GIT_COMMITTER_EMAIL="ada@example.com",
        GIT_AUTHOR_DATE=date,
        GIT_COMMITTER_DATE=date,
        GIT_EDITOR=":",
        GIT_TERMINAL_PROMPT="0",
        PYTHONDONTWRITEBYTECODE="1",
        LC_ALL="C",
    )
    return env


@dataclass
class Repo:
    path: Path
    clock: int = BASE_EPOCH

    @classmethod
    def init(cls, path: Path) -> Repo:
        if not git_available():
            raise GitMissing("git não encontrado no PATH")
        path.mkdir(parents=True, exist_ok=True)
        repo = cls(path)
        repo.git("init", "-q", "-b", "main")
        repo.git("config", "gc.auto", "0")
        repo.git("config", "core.autocrlf", "false")
        return repo

    def git(
        self, *args: str, check: bool = True, tick: bool = False
    ) -> subprocess.CompletedProcess[str]:
        if tick:
            self.clock += 60
        return subprocess.run(
            ["git", *args],
            cwd=self.path,
            env=_hermetic_env(self.clock),
            capture_output=True,
            text=True,
            check=check,
        )

    def write(self, name: str, text: str) -> None:
        target = self.path / name
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_text(text, encoding="utf-8")

    def commit_all(self, message: str) -> str:
        """Stage everything, commit with the next fake timestamp, return the new id."""
        self.git("add", "-A")
        self.git("commit", "-q", "-m", message, tick=True)
        return self.rev("HEAD")

    def rev(self, name: str) -> str:
        return self.git("rev-parse", name).stdout.strip()
