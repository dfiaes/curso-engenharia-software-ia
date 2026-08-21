from __future__ import annotations

import json
import subprocess
import sys
from pathlib import Path
from typing import Any

from jsonschema import Draft202012Validator, FormatChecker


def _load(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def test_cli_evaluates_persists_and_emits_verifiable_evidence(
    tmp_path: Path, lab_root: Path
) -> None:
    evidence_path = tmp_path / "evidence.json"
    completed = subprocess.run(
        [
            sys.executable,
            "-m",
            "work_intake.cli",
            "evaluate",
            str(lab_root / "fixtures/golden/request-v1.json"),
            "--database",
            str(tmp_path / "work.sqlite"),
            "--advisor",
            "replay",
            "--recording",
            str(lab_root / "fixtures/provider-recordings/golden-advisories.v1.json"),
            "--evidence",
            str(evidence_path),
        ],
        check=False,
        capture_output=True,
        text=True,
        encoding="utf-8",
    )
    assert completed.returncode == 0, completed.stderr
    decision = json.loads(completed.stdout)
    Draft202012Validator(_load(lab_root / "contracts/decision.v1.schema.json")).validate(decision)
    evidence = _load(evidence_path)
    Draft202012Validator(
        _load(lab_root / "contracts/evidence.v1.schema.json"),
        format_checker=FormatChecker(),
    ).validate(evidence)
    assert evidence["adapter"]["digest"]
    assert evidence["budget"] == {
        "request": "750.00",
        "advisor_call_limit": 1,
        "advisor_calls": 1,
    }


def test_cli_boundary_failure_is_sanitized_and_does_not_create_database(
    tmp_path: Path, lab_root: Path
) -> None:
    database = tmp_path / "must-not-exist.sqlite"
    completed = subprocess.run(
        [
            sys.executable,
            "-m",
            "work_intake.cli",
            "evaluate",
            str(lab_root / "fixtures/adversarial/request-extra-field.json"),
            "--database",
            str(database),
        ],
        check=False,
        capture_output=True,
        text=True,
        encoding="utf-8",
    )
    assert completed.returncode == 2
    assert "is_admin" in completed.stderr
    assert "Solicitação aparentemente normal" not in completed.stderr
    assert not database.exists()
