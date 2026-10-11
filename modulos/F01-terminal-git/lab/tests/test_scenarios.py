from __future__ import annotations

import subprocess
import sys
from pathlib import Path

import pytest

from shell_git_lab.gitrepo import Repo, git_available
from shell_git_lab.scenarios import (
    ScenarioError,
    build_bisect_case,
    build_lost_commit,
    find_culprit,
    recover_via_reflog,
)

from .conftest import needs_git

pytestmark = needs_git


def test_reflog_recovers_work_removed_by_reset_hard(repo: Repo) -> None:
    lost = build_lost_commit(repo)
    assert repo.rev("HEAD") == lost.kept_sha
    assert repo.git("cat-file", "-t", lost.lost_sha).stdout.strip() == "commit"  # still stored
    found = recover_via_reflog(repo, "importante")
    assert found == lost.lost_sha
    assert repo.rev("rescue") == lost.lost_sha
    repo.git("checkout", "-q", "rescue")
    assert "v3 importante" in (repo.path / "notes.txt").read_text(encoding="utf-8")


def test_reflog_has_no_entry_for_text_that_never_existed(repo: Repo) -> None:
    build_lost_commit(repo)
    with pytest.raises(ScenarioError):
        recover_via_reflog(repo, "inexistente")


def test_reflog_is_not_eternal_after_expire_and_prune(repo: Repo) -> None:
    """Negative control: recovery depends on the reflog and on objects not being pruned."""
    lost = build_lost_commit(repo)
    repo.git("reflog", "expire", "--expire=now", "--all")
    repo.git("gc", "-q", "--prune=now")
    with pytest.raises(ScenarioError):
        recover_via_reflog(repo, "importante")
    assert repo.git("cat-file", "-e", lost.lost_sha, check=False).returncode != 0


def test_bisect_run_finds_the_first_bad_commit(repo: Repo) -> None:
    case = build_bisect_case(repo, total=8, culprit_index=4)
    assert find_culprit(repo, case.commits[0], case.commits[-1]) == case.culprit
    assert repo.git("rev-parse", "--abbrev-ref", "HEAD").stdout.strip() == "main"
    assert not (repo.path / ".git" / "BISECT_LOG").exists()


@pytest.mark.parametrize("culprit_index", [2, 7])
def test_bisect_boundaries(repo: Repo, culprit_index: int) -> None:
    case = build_bisect_case(repo, total=8, culprit_index=culprit_index)
    assert find_culprit(repo, case.commits[0], case.commits[-1]) == case.culprit


def test_bisect_refuses_when_bad_commit_passes(repo: Repo) -> None:
    """Negative control: with no regression in range the scenario must not invent a culprit."""
    case = build_bisect_case(repo, total=8, culprit_index=7)
    with pytest.raises(ScenarioError, match="passa"):
        find_culprit(repo, case.commits[0], case.commits[3])


def test_bisect_refuses_when_good_commit_fails(repo: Repo) -> None:
    case = build_bisect_case(repo, total=8, culprit_index=4)
    with pytest.raises(ScenarioError, match="falha"):
        find_culprit(repo, case.commits[5], case.commits[-1])


def test_build_bisect_case_validates_arguments(repo: Repo) -> None:
    with pytest.raises(ValueError):
        build_bisect_case(repo, total=8, culprit_index=1)


def test_commit_ids_are_reproducible_across_runs(tmp_path: Path) -> None:
    ids = []
    for name in ("one", "two"):
        r = Repo.init(tmp_path / name)
        ids.append(build_bisect_case(r).commits)
    assert ids[0] == ids[1]


def test_cli_scenarios_and_cat_object(tmp_path: Path) -> None:
    def cli(*args: str) -> subprocess.CompletedProcess[str]:
        return subprocess.run(
            [sys.executable, "-m", "shell_git_lab.cli", *args],
            capture_output=True,
            text=True,
            check=False,
            timeout=120,
        )

    target = tmp_path / "s"
    result = cli("scenario", "reflog", "--dir", str(target))
    assert result.returncode == 0, result.stderr
    assert "recuperação confere" in result.stdout
    head = cli("cat-object", str(target), "HEAD")
    assert head.returncode == 0
    assert head.stdout.startswith("commit ")
    bad = cli("cat-object", str(target), "nao-existe")
    assert bad.returncode == 1
    assert "não consegui resolver" in bad.stderr
    assert bad.stdout == ""
    assert cli("scenario", "bisect", "--dir", str(tmp_path / "b")).returncode == 0


def test_git_available_reflects_path() -> None:
    assert git_available() is True
