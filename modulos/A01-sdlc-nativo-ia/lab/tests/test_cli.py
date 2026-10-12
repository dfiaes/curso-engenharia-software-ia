from __future__ import annotations

from pathlib import Path

import pytest

from sdlc_kit.artifacts import parse_document, validate_intent
from sdlc_kit.cli import main, read_series
from tests.conftest import EXAMPLES

BANDS = str(EXAMPLES / "bands.yaml")


def make_csv(tmp_path: Path, kind: str, capsys: pytest.CaptureFixture[str]) -> Path:
    assert main(["demo-series", kind]) == 0
    path = tmp_path / f"{kind}.csv"
    path.write_text(capsys.readouterr().out, encoding="utf-8")
    return path


def test_demo_series_is_deterministic(capsys: pytest.CaptureFixture[str]) -> None:
    main(["demo-series", "spike"])
    first = capsys.readouterr().out
    main(["demo-series", "spike"])
    assert first == capsys.readouterr().out and first.startswith("t,value\n0,")


def test_detect_spike_writes_a_valid_intent_and_returns_one(
    tmp_path: Path, capsys: pytest.CaptureFixture[str]
) -> None:
    csv_path = make_csv(tmp_path, "spike", capsys)
    out = tmp_path / "docs/intent"
    code = main(["detect", "--bands", BANDS, "--csv", str(csv_path), "--out", str(out)])
    assert code == 1
    written = sorted(out.glob("*.md"))
    assert len(written) == 1
    assert validate_intent(parse_document(written[0].read_text(encoding="utf-8"))) == []


def test_detect_quiet_series_returns_zero_and_writes_nothing(
    tmp_path: Path, capsys: pytest.CaptureFixture[str]
) -> None:
    csv_path = make_csv(tmp_path, "flat", capsys)
    out = tmp_path / "docs/intent"
    assert main(["detect", "--bands", BANDS, "--csv", str(csv_path), "--out", str(out)]) == 0
    assert not out.exists()


def test_detect_log_only_drift_writes_nothing(
    tmp_path: Path, capsys: pytest.CaptureFixture[str]
) -> None:
    csv_path = make_csv(tmp_path, "drift", capsys)
    bands = tmp_path / "bands.yaml"
    bands.write_text(
        "metric: m\nmin_std: 0.5\nrules: [WE4]\ntiers: [{name: log, sigma: 1, action: log}]\n",
        encoding="utf-8",
    )
    out = tmp_path / "docs/intent"
    code = main(["detect", "--bands", str(bands), "--csv", str(csv_path), "--out", str(out)])
    assert code == 0 and not out.exists()
    assert "apenas registro" in capsys.readouterr().out


def test_detect_too_short_series_is_a_usage_error(
    tmp_path: Path, capsys: pytest.CaptureFixture[str]
) -> None:
    short = tmp_path / "short.csv"
    short.write_text("t,value\n0,1\n1,2\n", encoding="utf-8")
    assert main(["detect", "--bands", BANDS, "--csv", str(short)]) == 64
    assert "need 38 points" in capsys.readouterr().err


def test_detect_invalid_bands_is_a_usage_error(
    tmp_path: Path, capsys: pytest.CaptureFixture[str]
) -> None:
    bad = tmp_path / "bands.yaml"
    bad.write_text("metric: m\n", encoding="utf-8")
    csv_path = make_csv(tmp_path, "flat", capsys)
    assert main(["detect", "--bands", str(bad), "--csv", str(csv_path)]) == 64


def test_validate_command_ok_and_failing(
    tmp_path: Path, capsys: pytest.CaptureFixture[str]
) -> None:
    assert main(["validate", "--root", str(EXAMPLES)]) == 0
    assert capsys.readouterr().out.strip() == "ok"
    (tmp_path / "docs/intent").mkdir(parents=True)
    (tmp_path / "docs/intent/INT-001.md").write_text("# nada\n", encoding="utf-8")
    assert main(["validate", "--root", str(tmp_path)]) == 1
    assert "[FM_ID]" in capsys.readouterr().out


def test_read_series(tmp_path: Path) -> None:
    f = tmp_path / "s.csv"
    f.write_text("t,value\n0,1.5\n1,2\n", encoding="utf-8")
    assert read_series(f) == [1.5, 2.0]
