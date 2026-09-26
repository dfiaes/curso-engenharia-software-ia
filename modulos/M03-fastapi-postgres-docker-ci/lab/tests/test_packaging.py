"""Embalagem: Dockerfile, contexto e Compose (AT-017..020, estático).

Roda sem Docker: verifica os artefatos como texto e estrutura. A prova
de execução (build, subida ordenada, saúde observada, limpeza nomeada)
está no roteiro do `Laboratório guiado M03` e permanece BLOCKED sem
Docker Engine/Compose.
"""

from __future__ import annotations

from pathlib import Path

import yaml

LAB = Path(__file__).resolve().parent.parent
DOCKERFILE = (LAB / "Dockerfile").read_text(encoding="utf-8")
DOCKERIGNORE = (LAB / ".dockerignore").read_text(encoding="utf-8").splitlines()
COMPOSE = yaml.safe_load((LAB / "compose.yml").read_text(encoding="utf-8"))


def test_multistage_com_base_canonical() -> None:
    stages = [line for line in DOCKERFILE.splitlines() if line.startswith("FROM ")]
    assert len(stages) >= 2, "esperado builder + runtime"
    assert all("python:3.14" in stage for stage in stages)


def test_usuario_nao_root() -> None:
    assert "USER app" in DOCKERFILE
    assert "USER root" not in DOCKERFILE
    assert "useradd" in DOCKERFILE


def test_runtime_nao_leva_build_nem_segredo() -> None:
    runtime = DOCKERFILE.split("AS runtime", 1)[1]
    assert "uv sync" not in runtime and "uv " not in runtime.replace("/app/.venv", "")
    assert ".env" not in DOCKERFILE
    for entry in (".env", ".venv", "__pycache__", ".git"):
        assert entry in DOCKERIGNORE, f"{entry} fora do contexto"


def test_healthcheck_e_cmd_apontam_para_o_serve() -> None:
    assert "HEALTHCHECK" in DOCKERFILE
    assert "/health" in DOCKERFILE
    assert "link_shortener.serve:app" in DOCKERFILE


def test_compose_espera_banco_saudavel() -> None:
    api = COMPOSE["services"]["api"]
    assert api["depends_on"]["db"]["condition"] == "service_healthy"
    assert "healthcheck" in COMPOSE["services"]["db"]


def test_compose_usa_nome_de_servico_interno() -> None:
    url = COMPOSE["services"]["api"]["environment"]["APP_DATABASE_URL"]
    assert "@db:" in url and "@localhost" not in url


def test_volume_e_rede_nomeados_para_limpeza_segura() -> None:
    assert "pgdata" in COMPOSE["volumes"]
    assert "shortnet" in COMPOSE["networks"]
    db = COMPOSE["services"]["db"]
    assert "pgdata:/var/lib/postgresql/data" in db["volumes"]
    assert "shortnet" in db["networks"] and "shortnet" in COMPOSE["services"]["api"]["networks"]
