"""Reproducible Git situations: lost work recovered via reflog, and a regression found by bisect."""

from __future__ import annotations

import os
import re
import subprocess
import sys
from dataclasses import dataclass

from shell_git_lab.gitrepo import Repo


class ScenarioError(RuntimeError):
    """A precondition of the scenario failed (the evidence would be meaningless)."""


@dataclass(frozen=True)
class LostWork:
    kept_sha: str
    lost_sha: str
    lost_message: str


def build_lost_commit(repo: Repo) -> LostWork:
    """Three commits, then ``reset --hard`` back to the first one: the others look gone."""
    repo.write("notes.txt", "v1\n")
    first = repo.commit_all("primeira versão")
    repo.write("notes.txt", "v1\nv2\n")
    repo.commit_all("segunda versão")
    repo.write("notes.txt", "v1\nv2\nv3 importante\n")
    lost = repo.commit_all("terceira versão com trabalho importante")
    repo.git("reset", "--hard", first)
    if "importante" in (repo.path / "notes.txt").read_text(encoding="utf-8"):
        raise ScenarioError("o reset --hard deveria ter removido o trabalho do disco")
    return LostWork(
        kept_sha=first, lost_sha=lost, lost_message="terceira versão com trabalho importante"
    )


def recover_via_reflog(repo: Repo, needle: str, branch: str = "rescue") -> str:
    """Find the newest HEAD-reflog entry whose commit subject contains ``needle``; branch it."""
    out = repo.git("reflog", "--format=%H%x09%s").stdout
    for line in out.splitlines():
        oid, _, subject = line.partition("\t")
        if needle in subject:
            repo.git("branch", branch, oid)
            return oid
    raise ScenarioError(f"nenhuma entrada do reflog contém {needle!r}")


@dataclass(frozen=True)
class BisectCase:
    commits: tuple[str, ...]  # oldest first
    culprit: str


CHECK_PY = "import sys\nfrom calc import add\nsys.exit(0 if add(2, 3) == 5 else 1)\n"


def build_bisect_case(repo: Repo, total: int = 8, culprit_index: int = 4) -> BisectCase:
    """``total`` commits; from ``culprit_index`` (0-based) on, ``add`` subtracts."""
    if not 2 <= culprit_index < total:
        raise ValueError("culprit_index precisa estar entre 2 e total-1")
    repo.write("check.py", CHECK_PY)
    commits: list[str] = []
    for i in range(total):
        body = "a - b" if i >= culprit_index else "a + b"
        repo.write("calc.py", f"def add(a: int, b: int) -> int:\n    return {body}\n")
        repo.write("CHANGELOG.md", "".join(f"- mudança {n}\n" for n in range(i + 1)))
        commits.append(repo.commit_all(f"mudança {i}"))
    return BisectCase(commits=tuple(commits), culprit=commits[culprit_index])


def _check_passes(repo: Repo, rev: str) -> bool:
    repo.git("checkout", "-q", rev)
    try:
        # No .pyc: two same-size edits within one second would reuse a stale cache.
        env = {**os.environ, "PYTHONDONTWRITEBYTECODE": "1"}
        result = subprocess.run([sys.executable, "check.py"], cwd=repo.path, env=env, check=False)
        return result.returncode == 0
    finally:
        repo.git("checkout", "-q", "main")


FIRST_BAD = re.compile(r"^([0-9a-f]{40}) is the first bad commit$", re.MULTILINE)


def find_culprit(repo: Repo, good: str, bad: str) -> str:
    """Run ``git bisect run`` between ``good`` and ``bad``; return the first bad commit."""
    if not _check_passes(repo, good):
        raise ScenarioError("o commit 'good' falha no teste: bisect não tem ponto de partida")
    if _check_passes(repo, bad):
        raise ScenarioError("o commit 'bad' passa no teste: não há regressão a procurar")
    repo.git("bisect", "start", bad, good)
    try:
        out = repo.git("bisect", "run", sys.executable, "check.py").stdout
    finally:
        repo.git("bisect", "reset")
    match = FIRST_BAD.search(out)
    if match is None:
        raise ScenarioError("git bisect não informou o primeiro commit ruim")
    return match.group(1)
