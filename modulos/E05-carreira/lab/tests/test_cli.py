from __future__ import annotations

import io
import json
from collections.abc import Callable, Iterator
from datetime import date
from pathlib import Path

import pytest

from interview_prep.cli import main
from interview_prep.leitner import load_state
from interview_prep.models import Topic
from tests.conftest import make_question


def scripted(answers: list[str]) -> Callable[[str], str]:
    iterator: Iterator[str] = iter(answers)

    def _input(prompt: str) -> str:
        try:
            return next(iterator)
        except StopIteration:
            raise EOFError from None

    return _input


def write_bank(path: Path, ids: list[str]) -> Path:
    questions = [make_question(i).model_dump(mode="json") for i in ids]
    path.write_text(json.dumps({"version": 1, "questions": questions}), encoding="utf-8")
    return path


def run(argv: list[str], answers: list[str] | None = None) -> tuple[int, str, str]:
    out, err = io.StringIO(), io.StringIO()
    code = main(argv, input_fn=scripted(answers or []), out=out, err=err)
    return code, out.getvalue(), err.getvalue()


def test_validate_bundled_bank_ok() -> None:
    code, out, _ = run(["validate-bank"])
    assert code == 0
    assert "perguntas" in out


def test_validate_small_bank_is_negative_result(tmp_path: Path) -> None:
    bank = write_bank(tmp_path / "bank.json", ["q-a", "q-b"])
    code, out, _ = run(["validate-bank", "--bank", str(bank)])
    assert code == 1
    assert "problema:" in out


def test_invalid_bank_is_error_exit_2(tmp_path: Path) -> None:
    bad = tmp_path / "bank.json"
    bad.write_text("{oops", encoding="utf-8")
    code, _, err = run(["validate-bank", "--bank", str(bad)])
    assert code == 2
    assert "erro:" in err


def test_usage_error_is_exit_2() -> None:
    assert run(["practice"])[0] == 2


def test_practice_session_updates_and_persists_state(tmp_path: Path) -> None:
    bank = write_bank(tmp_path / "bank.json", ["q-a", "q-b"])
    state = tmp_path / "state.json"
    argv = ["practice", "--bank", str(bank), "--state", str(state), "--today", "2026-10-11"]
    code, out, _ = run(argv, ["", "s", "", "n"])
    assert code == 0
    assert "2 pergunta(s) respondida(s)" in out
    cards = load_state(state).cards
    assert cards["q-a"].box == 2
    assert cards["q-a"].due == date(2026, 10, 13)
    assert cards["q-b"].box == 1
    assert cards["q-b"].lapses == 1


def test_invalid_verdict_is_asked_again(tmp_path: Path) -> None:
    bank = write_bank(tmp_path / "bank.json", ["q-a"])
    state = tmp_path / "state.json"
    argv = ["practice", "--bank", str(bank), "--state", str(state), "--today", "2026-10-11"]
    code, _, _ = run(argv, ["", "talvez", "", "s"])
    assert code == 0
    assert load_state(state).cards["q-a"].box == 2


def test_quit_and_eof_keep_progress_made_so_far(tmp_path: Path) -> None:
    bank = write_bank(tmp_path / "bank.json", ["q-a", "q-b"])
    state = tmp_path / "state.json"
    argv = ["practice", "--bank", str(bank), "--state", str(state), "--today", "2026-10-11"]
    run(argv, ["", "s", "q"])
    cards = load_state(state).cards
    assert cards["q-a"].box == 2
    assert cards["q-b"].box == 1
    run([*argv, "--limit", "1"], [""])  # EOF in the middle of an answer
    assert load_state(state).cards["q-b"].box == 1


def test_nothing_due_after_a_session(tmp_path: Path) -> None:
    bank = write_bank(tmp_path / "bank.json", ["q-a"])
    state = tmp_path / "state.json"
    argv = ["practice", "--bank", str(bank), "--state", str(state), "--today", "2026-10-11"]
    run(argv, ["", "s"])
    _, out, _ = run(argv)
    assert "Nada para revisar hoje." in out
    later = ["practice", "--bank", str(bank), "--state", str(state), "--today", "2026-10-13"]
    _, out, _ = run(later, ["", "s"])
    assert "[caixa 2]" in out


def test_topic_filter(tmp_path: Path) -> None:
    bank = write_bank(tmp_path / "bank.json", ["q-a"])
    state = tmp_path / "state.json"
    argv = ["practice", "--bank", str(bank), "--state", str(state), "--topic", Topic.RAG.value]
    _, out, _ = run(argv)
    assert "Nada para revisar hoje." in out


def test_status_reports_boxes(tmp_path: Path) -> None:
    bank = write_bank(tmp_path / "bank.json", ["q-a", "q-b"])
    state = tmp_path / "state.json"
    code, out, _ = run(["status", "--bank", str(bank), "--state", str(state)])
    assert code == 0
    assert "caixa 1: 2" in out
    assert "vencidas hoje: 2" in out


def test_corrupt_state_stops_practice_with_exit_2(tmp_path: Path) -> None:
    bank = write_bank(tmp_path / "bank.json", ["q-a"])
    state = tmp_path / "state.json"
    state.write_text("{broken", encoding="utf-8")
    code, _, err = run(["status", "--bank", str(bank), "--state", str(state)])
    assert code == 2
    assert "cannot load state" in err


def test_checklist_exit_codes(examples_dir: Path) -> None:
    assert run(["checklist", str(examples_dir / "README.bom.md")])[0] == 0
    code, out, _ = run(["checklist", str(examples_dir / "README.fraco.md")])
    assert code == 1
    assert "- [ ] Problema e contexto: missing" in out


def test_checklist_missing_file_is_exit_2(tmp_path: Path) -> None:
    code, _, err = run(["checklist", str(tmp_path / "nope.md")])
    assert code == 2
    assert "erro:" in err


@pytest.mark.parametrize("flag", ["--help"])
def test_help_exits_zero(flag: str) -> None:
    assert run([flag])[0] == 0
