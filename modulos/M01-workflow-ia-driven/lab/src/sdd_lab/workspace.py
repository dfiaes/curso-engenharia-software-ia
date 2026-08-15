"""Limites de workspace, write sets, worktrees e conflito semântico."""

from __future__ import annotations

import shutil
import subprocess
from dataclasses import dataclass
from pathlib import Path


def resolve_within(root: Path, candidate: Path) -> Path:
    resolved_root = root.resolve()
    resolved = candidate.resolve()
    try:
        resolved.relative_to(resolved_root)
    except ValueError as exc:
        raise ValueError(f"path fora do sandbox: {resolved}") from exc
    return resolved


def unexpected_changes(changed: set[str], declared_write_set: set[str]) -> frozenset[str]:
    def normalize(value: str) -> str:
        return Path(value).as_posix().casefold()

    allowed = {normalize(value) for value in declared_write_set}
    return frozenset(value for value in changed if normalize(value) not in allowed)


@dataclass(frozen=True)
class WorkUnit:
    name: str
    write_set: frozenset[str]
    contracts: frozenset[str]
    resources: frozenset[str]
    depends_on: frozenset[str] = frozenset()


@dataclass(frozen=True)
class ParallelDecision:
    safe: bool
    reasons: tuple[str, ...]


def assess_parallelism(left: WorkUnit, right: WorkUnit) -> ParallelDecision:
    reasons: list[str] = []
    if left.write_set & right.write_set:
        reasons.append("write_set_overlap")
    if left.contracts & right.contracts:
        reasons.append("shared_contract")
    if left.resources & right.resources:
        reasons.append("shared_resource")
    if left.name in right.depends_on or right.name in left.depends_on:
        reasons.append("dependency_edge")
    return ParallelDecision(not reasons, tuple(reasons))


@dataclass(frozen=True)
class IntegrationResult:
    textual_merge_clean: bool
    semantic_gate_passed: bool
    detail: str


def contract_integration_gate(*, produced_amount: int, consumer_limit: int) -> IntegrationResult:
    passed = produced_amount <= consumer_limit
    detail = (
        "contrato compatível"
        if passed
        else f"produtor emitiu {produced_amount}; consumidor aceita no máximo {consumer_limit}"
    )
    return IntegrationResult(True, passed, detail)


class GitWorktreeSandbox:
    """Opera apenas num repositório descartável possuído pelo laboratório."""

    MARKER = ".sdd-lab-owned"

    def __init__(self, root: Path) -> None:
        if shutil.which("git") is None:
            raise RuntimeError("Git é obrigatório para o gate de worktrees")
        self.root = root.resolve()
        self.repo = self.root / "repo"
        self.worktrees_root = self.root / "worktrees"

    def _git(self, *args: str, cwd: Path | None = None) -> subprocess.CompletedProcess[str]:
        return subprocess.run(
            ["git", "-c", "core.autocrlf=false", *args],
            cwd=cwd or self.repo,
            capture_output=True,
            text=True,
            check=True,
            shell=False,
        )

    def initialize(self) -> None:
        self.root.mkdir(parents=True, exist_ok=True)
        self.worktrees_root.mkdir(parents=True, exist_ok=True)
        self.repo.mkdir(parents=True, exist_ok=True)
        (self.root / self.MARKER).write_text("owned-by=m01-sdd-lab\n", encoding="utf-8")
        self._git("init", "-b", "main", str(self.repo), cwd=self.root)
        self._git("config", "user.name", "M01 Lab")
        self._git("config", "user.email", "m01-lab@example.invalid")
        (self.repo / "base.txt").write_text("base\n", encoding="utf-8")
        self._git("add", "--", "base.txt")
        self._git("commit", "-m", "fixture: base")

    def _assert_owned(self) -> None:
        if not (self.root / self.MARKER).is_file():
            raise RuntimeError("sandbox sem marcador de propriedade")
        resolve_within(self.root, self.repo)
        resolve_within(self.root, self.worktrees_root)

    def add(self, name: str) -> Path:
        self._assert_owned()
        if not name or not all(char.isalnum() or char in "-_" for char in name):
            raise ValueError("nome de worktree inseguro")
        target = resolve_within(self.worktrees_root, self.worktrees_root / name)
        self._git("worktree", "add", str(target), "-b", f"feature/{name}")
        return target

    def list_porcelain(self) -> str:
        self._assert_owned()
        return self._git("worktree", "list", "--porcelain").stdout

    def commit_file(self, worktree: Path, relative: str, content: str) -> None:
        self._assert_owned()
        tree = resolve_within(self.worktrees_root, worktree)
        target = resolve_within(tree, tree / relative)
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_text(content, encoding="utf-8")
        self._git("add", "--", relative, cwd=tree)
        self._git("commit", "-m", f"fixture: {relative}", cwd=tree)

    def merge(self, name: str) -> None:
        self._assert_owned()
        self._git("merge", "--no-edit", f"feature/{name}")

    def remove(self, worktree: Path) -> None:
        self._assert_owned()
        target = resolve_within(self.worktrees_root, worktree)
        status = self._git("status", "--porcelain", cwd=target).stdout.strip()
        if status:
            raise RuntimeError("cleanup recusado: worktree possui mudanças")
        self._git("worktree", "remove", str(target))
