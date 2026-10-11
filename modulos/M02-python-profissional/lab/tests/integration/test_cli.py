from __future__ import annotations

import json
import os
import subprocess
import sys
from pathlib import Path


def run_cli(*arguments: str, cwd: Path | None = None) -> subprocess.CompletedProcess[str]:
    environment = os.environ.copy()
    environment["PYTHONUTF8"] = "1"
    return subprocess.run(
        [sys.executable, "-m", "python_senior_lab.cli", *arguments],
        cwd=cwd,
        env=environment,
        check=False,
        capture_output=True,
        text=True,
        encoding="utf-8",
    )


def test_cli_happy_path_utf8_newline_and_evidence(tmp_path: Path) -> None:
    source = tmp_path / "entrada.csv"
    output = tmp_path / "saida.csv"
    evidence = tmp_path / "evidence" / "run.json"
    source.write_text(
        "id,amount,currency,category,occurred_at\ntx-1,10.50,BRL,café,2026-08-15T10:00:00Z\n",
        encoding="utf-8",
        newline="\n",
    )

    result = run_cli(str(source), str(output), "--evidence", str(evidence), cwd=tmp_path)

    assert result.returncode == 0
    assert result.stderr == ""
    assert "1 transações" in result.stdout
    assert "café" in output.read_text(encoding="utf-8")
    assert b"\r\n" not in output.read_bytes()
    payload = json.loads(evidence.read_text(encoding="utf-8"))
    assert payload["output"]["rows"] == 1
    assert len(payload["output"]["sha256"]) == 64


def test_cli_contract_error_uses_stderr_and_exit_2(tmp_path: Path) -> None:
    source = tmp_path / "invalid.csv"
    output = tmp_path / "unused.csv"
    source.write_text(
        "id,amount,currency,category,occurred_at\ntx-1,nope,BRL,café,2026-08-15T10:00:00Z\n",
        encoding="utf-8",
    )

    result = run_cli(str(source), str(output), cwd=tmp_path)

    assert result.returncode == 2
    assert result.stdout == ""
    assert "entrada inválida" in result.stderr
    assert "causa:" in result.stderr
    assert not output.exists()
    assert not output.with_suffix(".csv.tmp").exists()


def test_cli_missing_file_uses_operational_exit_3(tmp_path: Path) -> None:
    result = run_cli(str(tmp_path / "missing.csv"), str(tmp_path / "out.csv"), cwd=tmp_path)

    assert result.returncode == 3
    assert "falha operacional" in result.stderr


def test_cli_help_works_outside_source_checkout(tmp_path: Path) -> None:
    result = run_cli("--help", cwd=tmp_path)

    assert result.returncode == 0
    assert "csv-cleaner" in result.stdout
