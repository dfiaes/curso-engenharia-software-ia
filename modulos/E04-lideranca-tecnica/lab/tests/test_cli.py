from __future__ import annotations

from pathlib import Path

import pytest

from leadkit.cli import main

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "data"


def test_estimate_prints_percentiles_and_exit_zero(capsys: pytest.CaptureFixture[str]) -> None:
    code = main(["estimate", str(DATA / "projeto-conciliacao.csv"), "--runs", "2000"])
    out = capsys.readouterr().out
    assert code == 0
    assert "P50" in out
    assert "P85" in out
    assert "P95" in out


def test_estimate_is_deterministic(capsys: pytest.CaptureFixture[str]) -> None:
    args = ["estimate", str(DATA / "projeto-conciliacao.csv"), "--runs", "1000", "--seed", "5"]
    main(args)
    first = capsys.readouterr().out
    main(args)
    assert capsys.readouterr().out == first


def test_missing_file_is_exit_2_with_message_on_stderr(
    capsys: pytest.CaptureFixture[str],
) -> None:
    code = main(["estimate", "nao-existe.csv"])
    captured = capsys.readouterr()
    assert code == 2
    assert captured.out == ""
    assert "leadkit:" in captured.err


def test_bad_capacity_is_exit_2(capsys: pytest.CaptureFixture[str]) -> None:
    code = main(["estimate", str(DATA / "projeto-conciliacao.csv"), "--capacity", "0"])
    assert code == 2
    assert "capacity" in capsys.readouterr().err


def test_dora_report(capsys: pytest.CaptureFixture[str]) -> None:
    code = main(["dora", str(DATA / "deploys.csv"), str(DATA / "incidents.csv")])
    out = capsys.readouterr().out
    assert code == 0
    assert "5/37" in out
    assert "em aberto" in out


def test_check_exit_codes(capsys: pytest.CaptureFixture[str]) -> None:
    assert main(["check", "sbi", str(ROOT / "exemplos" / "sbi-bom.md")]) == 0
    assert main(["check", "sbi", str(ROOT / "exemplos" / "sbi-ruim.md")]) == 1
    assert main(["check", "sbi", str(ROOT / "exemplos" / "nao-existe.md")]) == 2
    capsys.readouterr()
