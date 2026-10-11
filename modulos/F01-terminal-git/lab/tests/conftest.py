from __future__ import annotations

import shutil
from pathlib import Path

import pytest

from shell_git_lab.gitrepo import Repo

needs_git = pytest.mark.skipif(
    shutil.which("git") is None,
    reason="git não encontrado no PATH: instale o Git para executar este teste",
)


@pytest.fixture
def repo(tmp_path: Path) -> Repo:
    return Repo.init(tmp_path / "repo")
