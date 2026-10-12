from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "template" / "scripts" / "hooks"))

import block_protected_paths as bpp  # noqa: E402
import block_test_edits_in_fix as bte  # noqa: E402
import check_docs as cd  # noqa: E402
import scan_secrets as ss  # noqa: E402


def test_caminho_protegido_detectado() -> None:
    bad = bpp.find_violations(["src/a.cs", ".github/workflows/deploy.yml", "infra/main.tf"], bpp.DEFAULT_PATTERNS)
    assert bad == [".github/workflows/deploy.yml", "infra/main.tf"]


def test_caminho_comum_passa() -> None:
    assert bpp.find_violations(["src/a.cs", "docs/x.md"], bpp.DEFAULT_PATTERNS) == []


def test_fix_branch_bloqueia_modificar_teste() -> None:
    assert bte.find_violations("fix/PROJ-1-x", ["M\ttests/test_a.py"])


def test_fix_branch_permite_adicionar_teste() -> None:
    assert bte.find_violations("fix/PROJ-1-x", ["A\ttests/test_novo.py", "M\tsrc/a.py"]) == []


def test_fix_branch_bloqueia_renomear_e_apagar() -> None:
    assert bte.find_violations("fix/x", ["D\ttests/t.py"])
    assert bte.find_violations("fix/x", ["R100\ttests/t.py\ttests/u.py"])


def test_feat_branch_livre() -> None:
    assert bte.find_violations("feat/PROJ-1-x", ["M\ttests/test_a.py"]) == []


def test_segredo_em_linha_adicionada() -> None:
    diff = "+++ b/cfg.py\n+key = 'AKIAABCDEFGHIJKLMNOP'\n"
    assert ss.scan_added_lines(diff) == ["cfg.py: possível AWS access key"]


def test_segredo_em_linha_removida_ou_allowlist() -> None:
    assert ss.scan_added_lines("+++ b/a\n-key = 'AKIAABCDEFGHIJKLMNOP'\n") == []
    assert ss.scan_added_lines("+++ b/a\n+k='AKIAABCDEFGHIJKLMNOP'  # pragma: allowlist secret\n") == []


def test_connection_string_com_senha() -> None:
    assert ss.scan_added_lines("+++ b/a\n+Server=x;Password=hunter22;\n")


def test_drift_exige_doc_ou_optout() -> None:
    assert cd.drift_violation(["src/a.cs"], "")
    assert not cd.drift_violation(["src/a.cs", "docs/specs/x.md"], "")
    assert not cd.drift_violation(["src/a.cs"], "Docs: não se aplica (refatoração interna)")
    assert not cd.drift_violation(["tests/t.py"], "")


def test_front_matter_exigido(tmp_path: Path, monkeypatch) -> None:  # type: ignore[no-untyped-def]
    (tmp_path / "docs" / "specs").mkdir(parents=True)
    (tmp_path / "docs" / "plans").mkdir(parents=True)
    (tmp_path / "docs" / "specs" / "A.md").write_text("sem front matter", encoding="utf-8")
    (tmp_path / "docs" / "specs" / "B.md").write_text("---\nticket: P-1\nstatus: aprovada\n---\ncorpo", encoding="utf-8")
    errors = cd.front_matter_errors(tmp_path)
    assert any("A.md" in e for e in errors)
    assert not any("B.md" in e for e in errors)
