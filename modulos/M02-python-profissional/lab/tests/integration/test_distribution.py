from __future__ import annotations

import os
import shutil
import subprocess
import sys
import zipfile
from pathlib import Path

import pytest

from python_senior_lab.distribution import WheelContractError, inspect_wheel


def run_process(
    command: list[str], *, cwd: Path, environment: dict[str, str] | None = None
) -> subprocess.CompletedProcess[str]:
    return subprocess.run(
        command,
        cwd=cwd,
        env=environment,
        check=False,
        capture_output=True,
        text=True,
        encoding="utf-8",
    )


@pytest.mark.distribution
def test_stale_lock_is_rejected_offline_without_mutating_it(tmp_path: Path) -> None:
    uv = shutil.which("uv")
    assert uv is not None, "uv é ferramenta obrigatória do gate deste laboratório"
    pyproject = tmp_path / "pyproject.toml"
    pyproject.write_text(
        '[project]\nname = "lock-fixture"\nversion = "0.1.0"\nrequires-python = ">=3.14"\n',
        encoding="utf-8",
    )
    environment = os.environ.copy()
    environment.update({"UV_NO_PROGRESS": "1", "UV_PYTHON_DOWNLOADS": "never"})

    initial = run_process([uv, "lock", "--offline"], cwd=tmp_path, environment=environment)
    assert initial.returncode == 0, initial.stderr
    lock_path = tmp_path / "uv.lock"
    original_lock = lock_path.read_bytes()

    pyproject.write_text(
        '[project]\nname = "lock-fixture"\nversion = "0.2.0"\nrequires-python = ">=3.14"\n',
        encoding="utf-8",
    )
    stale = run_process([uv, "lock", "--check", "--offline"], cwd=tmp_path, environment=environment)

    assert stale.returncode != 0
    assert lock_path.read_bytes() == original_lock
    diagnostic = (stale.stdout + stale.stderr).lower()
    assert "lock" in diagnostic or "needs to be updated" in diagnostic


def write_wheel(path: Path, members: dict[str, str]) -> None:
    with zipfile.ZipFile(path, "w") as archive:
        for member, content in members.items():
            archive.writestr(member, content)


@pytest.mark.distribution
def test_missing_required_file_in_wheel_fails_before_publication(tmp_path: Path) -> None:
    wheel = tmp_path / "csv_cleaner-0.1.0-py3-none-any.whl"
    write_wheel(wheel, {"python_senior_lab/__init__.py": ""})

    with pytest.raises(WheelContractError, match=r"python_senior_lab/py\.typed"):
        inspect_wheel(wheel)


@pytest.mark.distribution
def test_wheel_with_declared_files_passes_inspection(tmp_path: Path) -> None:
    wheel = tmp_path / "csv_cleaner-0.1.0-py3-none-any.whl"
    write_wheel(
        wheel,
        {
            "python_senior_lab/__init__.py": "",
            "python_senior_lab/py.typed": "",
        },
    )

    inspection = inspect_wheel(wheel)

    assert inspection.required_members == (
        "python_senior_lab/__init__.py",
        "python_senior_lab/py.typed",
    )


def test_circular_import_is_reproduced_and_fixed_without_sys_path_hack(tmp_path: Path) -> None:
    package = tmp_path / "circular_demo"
    package.mkdir()
    (package / "__init__.py").write_text("", encoding="utf-8")
    (package / "__main__.py").write_text(
        "from .first import RESULT\nprint(RESULT)\n", encoding="utf-8"
    )
    (package / "first.py").write_text(
        'from .second import second_value\nfirst_value = "first"\n'
        'RESULT = f"{first_value}:{second_value}"\n',
        encoding="utf-8",
    )
    (package / "second.py").write_text(
        'from .first import first_value\nsecond_value = f"second-after-{first_value}"\n',
        encoding="utf-8",
    )
    environment = os.environ.copy()
    environment.pop("PYTHONPATH", None)

    broken = run_process(
        [sys.executable, "-m", "circular_demo"], cwd=tmp_path, environment=environment
    )

    assert broken.returncode != 0
    assert "partially initialized module" in broken.stderr
    assert "sys.path.append" not in (package / "first.py").read_text(encoding="utf-8")

    (package / "shared.py").write_text('first_value = "first"\n', encoding="utf-8")
    (package / "first.py").write_text(
        "from .shared import first_value\nfrom .second import second_value\n"
        'RESULT = f"{first_value}:{second_value}"\n',
        encoding="utf-8",
    )
    (package / "second.py").write_text(
        'from .shared import first_value\nsecond_value = f"second-after-{first_value}"\n',
        encoding="utf-8",
    )

    fixed = run_process(
        [sys.executable, "-m", "circular_demo"], cwd=tmp_path, environment=environment
    )

    assert fixed.returncode == 0, fixed.stderr
    assert fixed.stdout.strip() == "first:second-after-first"
