from __future__ import annotations

import os
import subprocess
import sys
from pathlib import Path

import pytest

from sdlc_kit.cli import main
from sdlc_kit.gitio import (
    install_precommit,
    parse_name_status,
    render_precommit_script,
    run_checks,
)
from sdlc_kit.policy import ChangedFile, load_policy
from tests.conftest import EXAMPLES, LAB, git, needs_git

POLICY_FILE = EXAMPLES / "policy.json"
POLICY = load_policy(POLICY_FILE)
AWS = "AKIA" + "QWERTYUIOPASDFGH"


def test_parse_name_status_splits_renames() -> None:
    out = "M\tsrc/a.py\nR100\ttests/test_old.py\ttests/test_new.py\nA\tb.py\nD\tc.py\n\n"
    assert parse_name_status(out) == [
        ChangedFile("M", "src/a.py"),
        ChangedFile("D", "tests/test_old.py"),
        ChangedFile("A", "tests/test_new.py"),
        ChangedFile("A", "b.py"),
        ChangedFile("D", "c.py"),
    ]


def test_precommit_script_text() -> None:
    text = render_precommit_script("p.json", "/usr/bin/python3")
    assert text.startswith("#!/bin/sh") and '"/usr/bin/python3" -m sdlc_kit hook' in text


@needs_git
def test_staged_clean_change_passes(repo: Path) -> None:
    (repo / "src/app.py").write_text("def f():\n    return 2\n", encoding="utf-8")
    git(repo, "add", "-A")
    assert run_checks(repo, POLICY, "staged", branch="feat/x") == []


@needs_git
def test_staged_protected_path_and_secret_are_found(repo: Path) -> None:
    (repo / ".github/workflows/ci.yml").write_text(f"name: ci\nkey: {AWS}\n", encoding="utf-8")
    git(repo, "add", "-A")
    codes = sorted(f.code for f in run_checks(repo, POLICY, "staged", branch="feat/x"))
    assert codes == ["PROTECTED_PATH", "SECRET_AWS_ACCESS_KEY"]


@needs_git
def test_range_mode_blocks_test_edit_on_fix_branch(repo: Path) -> None:
    git(repo, "checkout", "-q", "-b", "fix/login")
    (repo / "tests/test_app.py").write_text("def test_f():\n    assert 1 == 1\n", encoding="utf-8")
    git(repo, "commit", "-q", "-am", "weaken test")
    found = run_checks(repo, POLICY, "range", base="main")
    assert [f.code for f in found] == ["TEST_EDIT_ON_FIX"]
    assert run_checks(repo, POLICY, "range", base="main", branch="feat/x") == []


@needs_git
def test_range_mode_renamed_test_counts_as_edit(repo: Path) -> None:
    git(repo, "checkout", "-q", "-b", "fix/rename")
    git(repo, "mv", "tests/test_app.py", "tests/test_renamed.py")
    git(repo, "commit", "-q", "-m", "rename")
    found = run_checks(repo, POLICY, "range", base="main")
    assert [(f.code, f.path) for f in found] == [("TEST_EDIT_ON_FIX", "tests/test_app.py")]


@needs_git
def test_new_regression_test_on_fix_branch_is_allowed(repo: Path) -> None:
    git(repo, "checkout", "-q", "-b", "fix/ok")
    (repo / "tests/test_regression.py").write_text(
        "def test_r():\n    assert True\n", encoding="utf-8"
    )
    git(repo, "add", "-A")
    git(repo, "commit", "-q", "-m", "add regression test")
    assert run_checks(repo, POLICY, "range", base="main") == []


@needs_git
def test_unknown_mode_is_an_error(repo: Path) -> None:
    with pytest.raises(ValueError, match="unknown mode"):
        run_checks(repo, POLICY, "bogus")


@needs_git
def test_cli_hook_reports_and_returns_one(repo: Path, capsys: pytest.CaptureFixture[str]) -> None:
    (repo / "migrations").mkdir()
    (repo / "migrations/0001.sql").write_text("select 1;\n", encoding="utf-8")
    git(repo, "add", "-A")
    args = ["hook", "--mode", "staged", "--policy", str(POLICY_FILE), "--repo", str(repo)]
    assert main([*args, "--branch", "feat/x"]) == 1
    assert "[PROTECTED_PATH]" in capsys.readouterr().out


@needs_git
def test_installed_precommit_really_blocks_a_commit(repo: Path) -> None:
    install_precommit(repo, str(POLICY_FILE), sys.executable)
    env = {**os.environ, "PYTHONPATH": str(LAB / "src")}
    (repo / "src/ok.py").write_text("x = 1\n", encoding="utf-8")
    git(repo, "add", "-A")
    ok = subprocess.run(
        [
            "git",
            "-C",
            str(repo),
            "-c",
            "user.name=t",
            "-c",
            "user.email=t@e.com",
            "commit",
            "-m",
            "ok",
        ],
        env=env,
        capture_output=True,
        text=True,
        check=False,
    )
    assert ok.returncode == 0, ok.stdout + ok.stderr
    (repo / "src/leak.py").write_text(f'KEY = "{AWS}"\n', encoding="utf-8")
    git(repo, "add", "-A")
    bad = subprocess.run(
        [
            "git",
            "-C",
            str(repo),
            "-c",
            "user.name=t",
            "-c",
            "user.email=t@e.com",
            "commit",
            "-m",
            "leak",
        ],
        env=env,
        capture_output=True,
        text=True,
        check=False,
    )
    assert (
        bad.returncode != 0 and "SECRET_AWS_ACCESS_KEY" in bad.stderr
    )  # git sends hook stdout to stderr


@needs_git
def test_commits_mode_sees_a_test_weakened_then_restored_but_range_does_not(repo: Path) -> None:
    git(repo, "checkout", "-q", "-b", "fix/sneaky")
    original = (repo / "tests/test_app.py").read_text(encoding="utf-8")
    (repo / "tests/test_app.py").write_text("def test_f():\n    pass\n", encoding="utf-8")
    git(repo, "commit", "-q", "-am", "weaken")
    (repo / "tests/test_app.py").write_text(original, encoding="utf-8")
    git(repo, "commit", "-q", "-am", "restore")
    assert run_checks(repo, POLICY, "range", base="main") == []
    found = run_checks(repo, POLICY, "commits", base="main")
    assert [f.code for f in found] == ["TEST_EDIT_ON_FIX", "TEST_EDIT_ON_FIX"]
    assert all("[commit " in f.message for f in found)


@needs_git
def test_commits_mode_sees_a_secret_added_then_removed(repo: Path) -> None:
    (repo / "src/cfg.py").write_text(f'KEY = "{AWS}"\n', encoding="utf-8")
    git(repo, "add", "-A")
    git(repo, "commit", "-q", "-m", "add key")
    (repo / "src/cfg.py").write_text("KEY = ''\n", encoding="utf-8")
    git(repo, "commit", "-q", "-am", "remove key")
    assert run_checks(repo, POLICY, "range", base="HEAD~2") == []
    found = run_checks(repo, POLICY, "commits", base="HEAD~2", branch="feat/x")
    assert [f.code for f in found] == ["SECRET_AWS_ACCESS_KEY"]


@needs_git
def test_commits_mode_clean_branch_and_empty_range(repo: Path) -> None:
    assert run_checks(repo, POLICY, "commits", base="main", branch="feat/x") == []
    (repo / "src/app.py").write_text("def f():\n    return 2\n", encoding="utf-8")
    git(repo, "commit", "-q", "-am", "change")
    assert run_checks(repo, POLICY, "commits", base="main", branch="feat/x") == []
