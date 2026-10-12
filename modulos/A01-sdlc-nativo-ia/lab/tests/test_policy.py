from __future__ import annotations

import json
from pathlib import Path

import pytest

from sdlc_kit.policy import (
    ChangedFile,
    Policy,
    check_protected_paths,
    check_test_edits,
    entropy,
    load_policy,
    matches,
    scan_diff,
)
from tests.conftest import EXAMPLES

POLICY = load_policy(EXAMPLES / "policy.json")

# built at runtime so this file never contains a literal that looks like a real credential
AWS = "AKIA" + "QWERTYUIOPASDFGH"
GH = "ghp_" + "aB3dE5gH7jK9mN1pQ3sT5vX7zA9cE1gI3kM5"
HIGH = "q8Zr2Lp9Xw4Tn7Vb3Kd6Hs1Jm5Fc0Yg"


def diff_adding(path: str, *added: str) -> str:
    body = "\n".join(f"+{line}" for line in added)
    return f"--- a/{path}\n+++ b/{path}\n@@ -1,0 +10,{len(added)} @@\n{body}\n"


def test_glob_matching_with_double_star() -> None:
    assert matches("migrations/0001_init.sql", ["migrations/**"])
    assert matches("svc/api/.env.local", ["**/.env.*"])
    assert matches(".github\\workflows\\ci.yml", [".github/workflows/**"])
    assert not matches("docs/migrations.md", ["migrations/**"])


def test_protected_path_hit_and_miss() -> None:
    files = [ChangedFile("M", "migrations/0002.sql"), ChangedFile("M", "src/app.py")]
    found = check_protected_paths(files, POLICY)
    assert [f.path for f in found] == ["migrations/0002.sql"]


def test_protected_applies_to_every_status() -> None:
    for status in "AMD":
        assert check_protected_paths([ChangedFile(status, "REVIEW.md")], POLICY)


def test_no_protection_without_patterns() -> None:
    assert check_protected_paths([ChangedFile("M", "migrations/x.sql")], Policy()) == []


@pytest.mark.parametrize("status", ["M", "D"])
def test_existing_test_edit_blocked_on_fix_branch(status: str) -> None:
    found = check_test_edits([ChangedFile(status, "tests/test_app.py")], "fix/login-500", POLICY)
    assert [f.code for f in found] == ["TEST_EDIT_ON_FIX"]


def test_new_test_allowed_on_fix_branch() -> None:
    assert check_test_edits([ChangedFile("A", "tests/test_regression.py")], "fix/x", POLICY) == []


def test_test_edit_allowed_on_feature_branch() -> None:
    assert check_test_edits([ChangedFile("M", "tests/test_app.py")], "feat/x", POLICY) == []


def test_non_test_file_allowed_on_fix_branch() -> None:
    assert check_test_edits([ChangedFile("M", "src/app.py")], "fix/x", POLICY) == []


def test_load_policy_rejects_unknown_keys_and_non_objects(tmp_path: Path) -> None:
    bad = tmp_path / "p.json"
    bad.write_text(json.dumps({"protected": ["x"]}), encoding="utf-8")
    with pytest.raises(ValueError, match="unknown policy keys"):
        load_policy(bad)
    bad.write_text("[]", encoding="utf-8")
    with pytest.raises(ValueError, match="JSON object"):
        load_policy(bad)


def test_secret_shapes_are_flagged_with_line_numbers() -> None:
    d = diff_adding("src/cfg.py", "x = 1", f'KEY = "{AWS}"', f"t = '{GH}'")
    found = scan_diff(d, POLICY)
    assert [(f.code, f.line) for f in found] == [
        ("SECRET_AWS_ACCESS_KEY", 11),
        ("SECRET_GITHUB_TOKEN", 12),
    ]


def test_private_key_header_is_flagged() -> None:
    d = diff_adding("deploy/key.pem", "-----BEGIN " + "RSA PRIVATE KEY-----")
    assert [f.code for f in scan_diff(d)] == ["SECRET_PRIVATE_KEY"]


def test_high_entropy_assignment_is_flagged_and_redacted() -> None:
    d = diff_adding("src/cfg.py", f'api_key = "{HIGH}"')
    found = scan_diff(d)
    assert [f.code for f in found] == ["SECRET_ASSIGNMENT"]
    assert HIGH not in found[0].message and "q8Zr***" in found[0].message


def test_removed_and_context_lines_are_not_scanned() -> None:
    d = f'--- a/src/cfg.py\n+++ b/src/cfg.py\n@@ -3,2 +3,1 @@\n-KEY = "{AWS}"\n context {AWS}\n'
    assert scan_diff(d) == []


def test_placeholders_and_low_entropy_are_not_flagged() -> None:
    d = diff_adding(
        "src/cfg.py",
        'password = "changeme-changeme-changeme"',
        'token = "${GITHUB_TOKEN_FROM_ENV_VAR}"',
        'secret = "aaaaaaaaaaaaaaaaaaaaaaaa"',
        'api_key = "<paste-your-key-here-please>"',
    )
    assert scan_diff(d) == []


def test_allow_marker_and_allowlisted_files() -> None:
    marked = diff_adding("src/cfg.py", f'KEY = "{AWS}"  # sdlc:allow-secret fixture')
    assert scan_diff(marked) == []
    docs = diff_adding("docs/guia.md", f"exemplo: {AWS}")
    assert scan_diff(docs, POLICY) == []
    assert scan_diff(docs) != []


def test_deleted_file_header_is_ignored() -> None:
    d = f'--- a/old.py\n+++ /dev/null\n@@ -1,1 +0,0 @@\n-KEY = "{AWS}"\n'
    assert scan_diff(d) == []


def test_entropy_values() -> None:
    assert entropy("") == 0.0
    assert entropy("aaaa") == 0.0
    assert entropy("abcd") == pytest.approx(2.0)
