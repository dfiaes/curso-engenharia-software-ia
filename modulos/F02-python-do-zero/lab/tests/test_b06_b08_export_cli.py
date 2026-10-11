"""Blocks 6-8: context manager under failure, JSON, CLI exit codes."""

from __future__ import annotations

import json
from decimal import Decimal
from pathlib import Path

import pytest

from expenses.cli import main
from expenses.errors import ExportError
from expenses.export import AtomicWriter, report_payload, write_report

from .conftest import CsvFactory


def test_atomic_writer_commits_on_success(tmp_path: Path) -> None:
    target = tmp_path / "out.txt"
    with AtomicWriter(target) as handle:
        handle.write("novo")
    assert target.read_text(encoding="utf-8") == "novo"
    assert not (tmp_path / "out.txt.tmp").exists()


def test_atomic_writer_keeps_the_old_file_when_the_body_fails(tmp_path: Path) -> None:
    """Injected failure: the exception propagates, the original survives, no temp is left."""
    target = tmp_path / "out.txt"
    target.write_text("antigo", encoding="utf-8")
    with pytest.raises(RuntimeError, match="boom"), AtomicWriter(target) as handle:
        handle.write("metade")
        raise RuntimeError("boom")
    assert target.read_text(encoding="utf-8") == "antigo"
    assert list(tmp_path.iterdir()) == [target]


def test_naive_write_would_have_clobbered_the_file(tmp_path: Path) -> None:
    """Negative control: the same failure with a plain open() destroys the old content."""
    target = tmp_path / "out.txt"
    target.write_text("antigo", encoding="utf-8")
    with pytest.raises(RuntimeError), target.open("w", encoding="utf-8") as handle:
        handle.write("metade")
        raise RuntimeError("boom")
    assert target.read_text(encoding="utf-8") == "metade"


def test_report_json_roundtrip_keeps_decimals_exact(tmp_path: Path) -> None:
    out = tmp_path / "r.json"
    payload = report_payload(
        {"alimentação": Decimal("76.00")}, {"2026-01": Decimal("76.00")}, rejected=2
    )
    write_report(out, payload)
    text = out.read_text(encoding="utf-8")
    assert "alimentação" in text  # ensure_ascii=False
    data = json.loads(text)
    assert data["total"] == "76.00"
    assert Decimal(data["by_category"]["alimentação"]) == Decimal("76.00")
    assert data["rejected_rows"] == 2


def test_write_report_into_missing_directory_is_an_export_error(tmp_path: Path) -> None:
    with pytest.raises(ExportError, match="não foi possível gravar") as info:
        write_report(tmp_path / "nao" / "existe.json", {})
    assert isinstance(info.value.__cause__, OSError)


def test_cli_ok(make_csv: CsvFactory, capsys: pytest.CaptureFixture[str], tmp_path: Path) -> None:
    path = make_csv("2026-01-05,Alimentação,45.90,", "2026-01-06,alimentação,4.10,")
    out = tmp_path / "r.json"
    assert main(["report", str(path), "--json", str(out)]) == 0
    captured = capsys.readouterr()
    assert "alimentação" in captured.out
    assert "50.00" in captured.out
    assert captured.err == ""
    assert json.loads(out.read_text(encoding="utf-8"))["total"] == "50.00"


def test_cli_strict_stops_with_1_and_writes_no_json(
    make_csv: CsvFactory, capsys: pytest.CaptureFixture[str], tmp_path: Path
) -> None:
    path = make_csv("2026-01-05,a,1.00,", "xx,a,1.00,")
    out = tmp_path / "r.json"
    assert main(["report", str(path), "--json", str(out)]) == 1
    assert "linha 3" in capsys.readouterr().err
    assert not out.exists()


def test_cli_lenient_reports_everything_and_still_exits_1(
    make_csv: CsvFactory, capsys: pytest.CaptureFixture[str], tmp_path: Path
) -> None:
    path = make_csv("2026-01-05,a,1.00,", "xx,a,1.00,", "2026-01-07,a,2.00,")
    out = tmp_path / "r.json"
    assert main(["report", str(path), "--lenient", "--json", str(out)]) == 1
    captured = capsys.readouterr()
    assert "3.00" in captured.out
    assert "rejeitada: linha 3" in captured.err
    assert json.loads(out.read_text(encoding="utf-8"))["rejected_rows"] == 1


@pytest.mark.parametrize(
    ("kind", "stderr_part"),
    [("missing", "arquivo não encontrado"), ("latin", "não é utf-8 válido")],
)
def test_cli_problems_exit_2(
    kind: str,
    stderr_part: str,
    make_csv: CsvFactory,
    capsys: pytest.CaptureFixture[str],
    tmp_path: Path,
) -> None:
    path = (
        tmp_path / "nada.csv"
        if kind == "missing"
        else make_csv("2026-01-05,ç,1.00,", encoding="latin-1")
    )
    assert main(["report", str(path)]) == 2
    assert stderr_part in capsys.readouterr().err


def test_cli_usage_error_exits_2_via_argparse() -> None:
    with pytest.raises(SystemExit) as info:
        main(["report"])
    assert info.value.code == 2
