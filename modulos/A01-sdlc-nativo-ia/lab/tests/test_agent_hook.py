from __future__ import annotations

import io
import json
from collections.abc import Mapping
from pathlib import Path

import pytest

from sdlc_kit import agent_hook
from sdlc_kit.cli import main
from sdlc_kit.policy import load_policy
from tests.conftest import EXAMPLES

POLICY = load_policy(EXAMPLES / "policy.json")


def test_extract_claude_style_payload() -> None:
    payload = {"tool_name": "Edit", "tool_input": {"file_path": "src/app.py", "old_string": "a"}}
    assert agent_hook.extract_paths(payload) == ["src/app.py"]


def test_extract_flat_cursor_style_payload() -> None:
    assert agent_hook.extract_paths({"file_path": "src/app.py"}) == ["src/app.py"]


def test_extract_paths_from_apply_patch_text() -> None:
    patch = (
        "*** Begin Patch\n*** Update File: tests/test_app.py\n@@\n-a\n+b\n"
        "*** Add File: src/n.py\n+x\n*** End Patch"
    )
    payload = {"tool_name": "apply_patch", "tool_input": {"command": patch}}
    assert agent_hook.extract_paths(payload) == ["tests/test_app.py", "src/n.py"]


def test_extract_nothing_from_unrelated_payload() -> None:
    assert agent_hook.extract_paths({"tool_input": {"command": "ls -la"}}) == []


def test_decide_blocks_protected_path() -> None:
    d = agent_hook.decide({"file_path": "migrations/0003.sql"}, POLICY, "feat/x", lambda p: True)
    assert d.blocked and "protegido" in d.reason


def test_decide_blocks_existing_test_on_fix_branch_but_not_new_one() -> None:
    payload = {"file_path": "tests/test_app.py"}
    assert agent_hook.decide(payload, POLICY, "fix/x", lambda p: True).blocked
    assert not agent_hook.decide(payload, POLICY, "fix/x", lambda p: False).blocked


def test_decide_allows_test_edit_off_fix_branch() -> None:
    assert not agent_hook.decide(
        {"file_path": "tests/test_app.py"}, POLICY, "feat/x", lambda p: True
    ).blocked


def test_parse_payload_empty_and_invalid() -> None:
    assert agent_hook.parse_payload("  ") == {}
    with pytest.raises(ValueError, match="JSON object"):
        agent_hook.parse_payload("[1]")
    with pytest.raises(json.JSONDecodeError):
        agent_hook.parse_payload("{nope")


def run_hook(
    monkeypatch: pytest.MonkeyPatch, payload: Mapping[str, object], root: Path, branch: str
) -> int:
    monkeypatch.setattr("sys.stdin", io.StringIO(json.dumps(payload)))
    args = ["agent-hook", "--policy", str(EXAMPLES / "policy.json"), "--root", str(root)]
    return main([*args, "--branch", branch])


def test_cli_exit_2_with_reason_on_stderr(
    monkeypatch: pytest.MonkeyPatch, capsys: pytest.CaptureFixture[str], tmp_path: Path
) -> None:
    code = run_hook(
        monkeypatch, {"tool_input": {"file_path": "infra/prod/main.tf"}}, tmp_path, "feat/x"
    )
    assert code == 2
    assert "infra/prod/main.tf" in capsys.readouterr().err


def test_cli_normalizes_absolute_paths(monkeypatch: pytest.MonkeyPatch, tmp_path: Path) -> None:
    absolute = str((tmp_path / "migrations/0009.sql").resolve())
    assert run_hook(monkeypatch, {"tool_input": {"file_path": absolute}}, tmp_path, "feat/x") == 2


def test_cli_allows_ordinary_edit(monkeypatch: pytest.MonkeyPatch, tmp_path: Path) -> None:
    assert (
        run_hook(monkeypatch, {"tool_input": {"file_path": "src/app.py"}}, tmp_path, "fix/x") == 0
    )


def test_cli_existing_test_on_fix_branch_blocked(
    monkeypatch: pytest.MonkeyPatch, tmp_path: Path
) -> None:
    (tmp_path / "tests").mkdir()
    (tmp_path / "tests/test_app.py").write_text("x", encoding="utf-8")
    payload = {"tool_input": {"file_path": "tests/test_app.py"}}
    assert run_hook(monkeypatch, payload, tmp_path, "fix/x") == 2
    payload = {"tool_input": {"file_path": "tests/test_new.py"}}
    assert run_hook(monkeypatch, payload, tmp_path, "fix/x") == 0
