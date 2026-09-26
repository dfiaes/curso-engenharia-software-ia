"""Contrato de release: workflow, paridade local e segredos (AT-025..029).

Oráculos estáticos sobre `.github/workflows/ci-m03.yml`,
`scripts/check.sh` e o comportamento fail-fast de `serve` — executáveis
sem runner, sem Docker e sem conta externa.
"""

from __future__ import annotations

from pathlib import Path

import pytest
import yaml

REPO = Path(__file__).resolve().parent.parent.parent.parent.parent
LAB = Path(__file__).resolve().parent.parent
WORKFLOW_PATH = REPO / ".github" / "workflows" / "ci-m03.yml"
WORKFLOW = yaml.safe_load(WORKFLOW_PATH.read_text(encoding="utf-8"))
CHECK_SH = (LAB / "scripts" / "check.sh").read_text(encoding="utf-8")

GATES = ["uv sync --frozen", "ruff check", "ruff format --check", "mypy", "pytest"]


def test_workflow_reproduz_gates_com_lock() -> None:
    """AT-025: o job quality executa os mesmos gates, com lock preservado."""
    quality = WORKFLOW["jobs"]["quality"]
    runs = "\n".join(str(step.get("run", "")) for step in quality["steps"])
    for gate in GATES:
        assert gate in runs, f"gate ausente no workflow: {gate}"


def test_check_local_espelha_workflow() -> None:
    """AT-025: paridade dev↔CI — o script local contém os mesmos comandos."""
    for gate in GATES:
        assert gate in CHECK_SH, f"gate ausente no check.sh: {gate}"


def test_pr_sem_deploy_nem_segredo() -> None:
    """AT-026: build de imagem só na main; quality não referencia segredos."""
    build = WORKFLOW["jobs"]["build-image"]
    assert build["if"] == "github.ref == 'refs/heads/main'"
    quality_text = str(WORKFLOW["jobs"]["quality"])
    assert "secrets." not in quality_text


def test_imagem_enderecada_por_sha() -> None:
    """AT-027: endereço imutável por revisão, além da tag conveniente."""
    tags = WORKFLOW["jobs"]["build-image"]["steps"][-1]["with"]["tags"]
    assert "github.sha" in tags and "latest" in tags


def test_startup_sem_criacao_de_schema() -> None:
    """AT-028: nenhum startup de produção cria schema; só migration e teste."""
    hits = []
    for path in (LAB / "src").rglob("*.py"):
        text = path.read_text(encoding="utf-8")
        if "create_all" in text:
            hits.append(path.name)
    assert hits == ["db.py"], f"create_all fora do auxiliar de teste: {hits}"
    serve_src = (LAB / "src" / "link_shortener" / "serve.py").read_text(encoding="utf-8")
    assert "startup" not in serve_src


def test_falha_cedo_sem_vazar_segredo(monkeypatch: pytest.MonkeyPatch) -> None:
    """AT-029: config ausente falha alto; a mensagem nunca ecoa valores."""
    secret = "segredo-super-sensivel-123"
    monkeypatch.setenv("APP_DATABASE_URL", "sqlite+aiosqlite:///:memory:")
    import link_shortener.serve as serve

    monkeypatch.setenv("APP_DATABASE_URL", secret)
    assert serve._database_url() == secret
    monkeypatch.delenv("APP_DATABASE_URL")
    with pytest.raises(RuntimeError) as excinfo:
        serve._database_url()
    assert secret not in str(excinfo.value)
    assert "APP_DATABASE_URL" in str(excinfo.value)
