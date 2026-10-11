import json
from pathlib import Path
from typing import Any

import pytest

from aigov.cli import main
from aigov.loader import LoadError, load_record

from .conftest import CLEAN, EXAMPLES


def test_loads_yaml_and_json_equally(tmp_path: Path) -> None:
    j = tmp_path / "r.json"
    j.write_text(json.dumps(CLEAN), encoding="utf-8")
    assert load_record(j).id == "assistente-teste"
    assert load_record(EXAMPLES / "good.yaml").id == "assistente-atendimento"


def test_unknown_extension_and_missing_file(tmp_path: Path) -> None:
    f = tmp_path / "r.txt"
    f.write_text("{}", encoding="utf-8")
    with pytest.raises(LoadError, match="unsupported extension"):
        load_record(f)
    with pytest.raises(LoadError, match="No such file"):
        load_record(tmp_path / "nope.yaml")


def test_broken_syntax_and_wrong_shape(tmp_path: Path) -> None:
    bad = tmp_path / "bad.yaml"
    bad.write_text("id: [unclosed", encoding="utf-8")
    with pytest.raises(LoadError, match="invalid syntax"):
        load_record(bad)
    lst = tmp_path / "list.yaml"
    lst.write_text("- 1\n- 2\n", encoding="utf-8")
    with pytest.raises(LoadError, match="mapping"):
        load_record(lst)


def test_schema_error_names_the_field(tmp_path: Path) -> None:
    data: dict[str, Any] = {**CLEAN, "risk_tier": "enorme"}
    f = tmp_path / "r.json"
    f.write_text(json.dumps(data), encoding="utf-8")
    with pytest.raises(LoadError, match="risk_tier"):
        load_record(f)


def test_cli_good_example_exits_zero(capsys: pytest.CaptureFixture[str]) -> None:
    code = main(["validate", str(EXAMPLES / "good.yaml"), "--today", "2026-10-11"])
    assert code == 0
    assert "0 error(s), 0 warning(s)" in capsys.readouterr().out


def test_cli_bad_example_exits_one_with_findings(capsys: pytest.CaptureFixture[str]) -> None:
    code = main(["validate", str(EXAMPLES / "bad.yaml"), "--today", "2026-10-11"])
    out = capsys.readouterr().out
    assert code == 1
    for rule in ("AIG-002", "AIG-003", "AIG-004", "AIG-006", "AIG-009", "AIG-011", "AIG-012"):
        assert rule in out


def test_cli_github_format_and_strict(tmp_path: Path, capsys: pytest.CaptureFixture[str]) -> None:
    data: dict[str, Any] = {**CLEAN, "ai_disclosure": False}  # warning only
    f = tmp_path / "r.json"
    f.write_text(json.dumps(data), encoding="utf-8")
    assert main(["validate", str(f), "--today", "2026-10-11", "--format", "github"]) == 0
    assert capsys.readouterr().out.startswith("::warning file=")
    assert main(["validate", str(f), "--today", "2026-10-11", "--strict"]) == 1


def test_cli_load_error_exits_two(tmp_path: Path, capsys: pytest.CaptureFixture[str]) -> None:
    assert main(["validate", str(tmp_path / "nope.yaml")]) == 2
    assert "No such file" in capsys.readouterr().err
    assert main(["validate", str(EXAMPLES / "good.yaml"), "--today", "ontem"]) == 2
