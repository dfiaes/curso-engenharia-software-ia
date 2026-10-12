from __future__ import annotations

import os
import shutil
import subprocess
from pathlib import Path

import pytest

needs_git = pytest.mark.skipif(
    shutil.which("git") is None,
    reason="git não encontrado no PATH: instale o Git para executar este teste",
)

LAB = Path(__file__).resolve().parent.parent
EXAMPLES = LAB / "examples"


def git(repo: Path, *args: str) -> str:
    env = {
        **os.environ,
        "GIT_AUTHOR_NAME": "t",
        "GIT_AUTHOR_EMAIL": "t@example.com",
        "GIT_COMMITTER_NAME": "t",
        "GIT_COMMITTER_EMAIL": "t@example.com",
    }
    proc = subprocess.run(
        ["git", "-C", str(repo), *args], capture_output=True, text=True, check=False, env=env
    )
    if proc.returncode != 0:
        raise AssertionError(f"git {args} failed: {proc.stderr}")
    return proc.stdout


@pytest.fixture
def repo(tmp_path: Path) -> Path:
    """A repo on ``main`` with one commit: a source file, a test and a workflow."""
    root = tmp_path / "repo"
    root.mkdir()
    git(root, "init", "-q", "-b", "main")
    (root / "src").mkdir()
    (root / "tests").mkdir()
    (root / ".github/workflows").mkdir(parents=True)
    (root / "src/app.py").write_text("def f():\n    return 1\n", encoding="utf-8")
    (root / "tests/test_app.py").write_text("def test_f():\n    assert True\n", encoding="utf-8")
    (root / ".github/workflows/ci.yml").write_text("name: ci\n", encoding="utf-8")
    git(root, "add", "-A")
    git(root, "commit", "-q", "-m", "init")
    return root
