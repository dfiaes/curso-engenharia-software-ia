import subprocess
import sys
from pathlib import Path


def test_checker_rejects_variance_and_narrowing_defects() -> None:
    defect = (
        Path(__file__).parents[2] / "fixtures" / "generated_defects" / "static_contract_errors.py"
    )
    result = subprocess.run(
        [sys.executable, "-m", "mypy", "--strict", str(defect)],
        check=False,
        capture_output=True,
        text=True,
        encoding="utf-8",
    )

    assert result.returncode != 0
    assert "incompatible types in assignment" in result.stdout.lower()
    assert "assert_never" in result.stdout


def test_disallow_any_expr_exposes_unproved_boundary() -> None:
    defect = Path(__file__).parents[2] / "fixtures" / "generated_defects" / "any_leak.py"
    result = subprocess.run(
        [sys.executable, "-m", "mypy", "--strict", "--disallow-any-expr", str(defect)],
        check=False,
        capture_output=True,
        text=True,
        encoding="utf-8",
    )

    assert result.returncode != 0
    assert 'expression has type "any"' in result.stdout.lower()
    assert "Found 1 error" in result.stdout
