from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import bootstrap  # noqa: E402


def test_copia_tudo_em_destino_vazio(tmp_path: Path) -> None:
    report = bootstrap.apply_kit(tmp_path)
    assert (tmp_path / "AGENTS.md").is_file()
    assert (tmp_path / ".cursor/rules/projeto.mdc").is_file()
    assert (tmp_path / ".github/workflows/deploy.yml").is_file()
    assert (tmp_path / "scripts/hooks/scan_secrets.py").is_file()
    assert not report.skipped_existing


def test_nao_sobrescreve(tmp_path: Path) -> None:
    (tmp_path / "AGENTS.md").write_text("meu conteudo", encoding="utf-8")
    report = bootstrap.apply_kit(tmp_path)
    assert (tmp_path / "AGENTS.md").read_text(encoding="utf-8") == "meu conteudo"
    assert "AGENTS.md" in report.skipped_existing


def test_existing_pula_deploy(tmp_path: Path) -> None:
    report = bootstrap.apply_kit(tmp_path, existing=True)
    assert not (tmp_path / "azure-pipelines.yml").exists()
    assert not (tmp_path / ".github/workflows/deploy.yml").exists()
    assert (tmp_path / ".github/workflows/ci.yml").is_file()
    assert set(report.skipped_mode) == bootstrap.EXISTING_SKIP


def test_dry_run_nao_escreve(tmp_path: Path) -> None:
    report = bootstrap.apply_kit(tmp_path, dry_run=True)
    assert report.created
    assert list(tmp_path.iterdir()) == []


def test_idempotente(tmp_path: Path) -> None:
    bootstrap.apply_kit(tmp_path)
    second = bootstrap.apply_kit(tmp_path)
    assert not second.created


def test_cli_dry_run(tmp_path: Path, capsys) -> None:  # type: ignore[no-untyped-def]
    assert bootstrap.main([str(tmp_path / "novo"), "--dry-run"]) == 0
    assert "criaria: AGENTS.md" in capsys.readouterr().out
    assert not (tmp_path / "novo").exists()
