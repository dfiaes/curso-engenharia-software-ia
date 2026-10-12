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


def test_template_traz_mcp_comandos_e_skill(tmp_path: Path) -> None:
    bootstrap.apply_kit(tmp_path)
    for rel in (".cursor/mcp.json", ".mcp.json", "opencode.json", "docs/agentes/codex-config.toml",
                ".agents/commands/nova-feature.md", ".agents/commands/corrigir-bug.md",
                ".agents/commands/atualizar-docs.md", ".agents/skills/gerar-teste-playwright/SKILL.md",
                "tests/e2e/exemplo.spec.ts"):
        assert (tmp_path / rel).is_file(), rel


def test_configs_mcp_sao_json_valido_sem_segredo(tmp_path: Path) -> None:
    import json
    import re

    bootstrap.apply_kit(tmp_path)
    for rel in (".cursor/mcp.json", ".mcp.json", "opencode.json"):
        data = json.loads((tmp_path / rel).read_text(encoding="utf-8"))
        assert data
    secret = re.compile(r"(ghp_|github_pat_|xox[bp]-|sk-[A-Za-z0-9]{10,}|Bearer\s+[A-Za-z0-9]{12,})")
    for p in (tmp_path / ".cursor/mcp.json", tmp_path / ".mcp.json", tmp_path / "opencode.json",
              tmp_path / "docs/agentes/codex-config.toml"):
        assert not secret.search(p.read_text(encoding="utf-8")), p


def test_skill_tem_frontmatter_valido(tmp_path: Path) -> None:
    import re

    bootstrap.apply_kit(tmp_path)
    text = (tmp_path / ".agents/skills/gerar-teste-playwright/SKILL.md").read_text(encoding="utf-8")
    meta, _ = bootstrap._split_frontmatter(text)
    assert meta["name"] == "gerar-teste-playwright"
    assert re.fullmatch(r"[a-z0-9]+(-[a-z0-9]+)*", meta["name"])
    assert 0 < len(meta["description"]) <= 1024


def test_tools_copia_para_cada_ferramenta(tmp_path: Path) -> None:
    assert bootstrap.main([str(tmp_path), "--tools", "cursor,claude,codex,opencode"]) == 0
    assert (tmp_path / ".cursor/commands/corrigir-bug.md").is_file()
    assert (tmp_path / ".claude/commands/nova-feature.md").is_file()
    assert (tmp_path / ".claude/skills/gerar-teste-playwright/SKILL.md").is_file()
    assert (tmp_path / ".opencode/commands/atualizar-docs.md").is_file()
    wrapper = (tmp_path / ".agents/skills/nova-feature/SKILL.md").read_text(encoding="utf-8")
    assert wrapper.startswith("---\nname: nova-feature\n")
    assert "$ARGUMENTS" in wrapper


def test_tools_so_a_ferramenta_pedida(tmp_path: Path) -> None:
    bootstrap.main([str(tmp_path), "--tools", "opencode"])
    assert (tmp_path / ".opencode/commands/nova-feature.md").is_file()
    assert not (tmp_path / ".claude").exists()
    assert not (tmp_path / ".cursor/commands").exists()


def test_tools_nao_sobrescreve_e_dry_run(tmp_path: Path) -> None:
    (tmp_path / ".claude/commands").mkdir(parents=True)
    (tmp_path / ".claude/commands/nova-feature.md").write_text("meu", encoding="utf-8")
    bootstrap.main([str(tmp_path), "--tools", "claude"])
    assert (tmp_path / ".claude/commands/nova-feature.md").read_text(encoding="utf-8") == "meu"
    other = tmp_path / "x"
    other.mkdir()
    bootstrap.main([str(other), "--tools", "claude", "--dry-run"])
    assert list(other.iterdir()) == []


def test_tools_desconhecida_falha(tmp_path: Path) -> None:
    import pytest

    with pytest.raises(SystemExit):
        bootstrap.main([str(tmp_path), "--tools", "vim"])
