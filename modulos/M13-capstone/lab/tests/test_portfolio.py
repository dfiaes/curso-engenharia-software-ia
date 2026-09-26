"""B20: dossier com métricas rastreáveis, versão real, defesa e oráculo de sigilo."""

from pathlib import Path

import pytest

from capstone_lab.portfolio import (
    DEMO_SCRIPT,
    EXPECTED_QUESTIONS,
    MetricRef,
    build_dossier,
    resolve_version,
    scan_public_text,
)

MODULE_ROOT = Path(__file__).resolve().parents[2]


def _metricas_reais() -> tuple[MetricRef, ...]:
    return (
        MetricRef("testes", "117 verdes", "evidence/m13/B15/pytest-webexp.txt"),
        MetricRef("gates", "ruff/mypy/pytest 0 falha", "evidence/m13/B15/gates-sync-ruff-mypy.txt"),
    )


def test_versao_resolvida_nao_vazia() -> None:
    v = resolve_version(MODULE_ROOT)
    assert v and v != "unknown"


def test_dossier_falha_se_evidencia_nao_existe() -> None:
    with pytest.raises(ValueError, match="evidência ausente"):
        metricas = (MetricRef("fake", "9", "evidence/m13/NOPE/x.txt"),)
        build_dossier(MODULE_ROOT, ("x",), metricas, (), ())


def test_dossier_completo_toda_metrica_aponta_para_arquivo() -> None:
    d = build_dossier(
        MODULE_ROOT,
        changelog=("M13 B1-B20 concluídos",),
        metricas=_metricas_reais(),
        limitacoes=("modo local somente; cloud não medida",),
        blocked=("Kubernetes real BLOCKED", "piloto humano BLOCKED"),
    )
    texto = d.to_markdown()
    assert "evidence/m13/B15/pytest-webexp.txt" in texto
    for m in d.metricas:
        assert (MODULE_ROOT / m.evidencia).exists()
    assert scan_public_text(texto) == []


def test_demo_script_cobre_os_cinco_atos_e_perguntas_honestas() -> None:
    assert len(DEMO_SCRIPT) == 5
    assert any("rollback" in passo.lower() for passo in DEMO_SCRIPT)
    assert len(EXPECTED_QUESTIONS) >= 4
    for _, resposta in EXPECTED_QUESTIONS:
        assert resposta.strip()
    perguntas = " ".join(p for p, _ in EXPECTED_QUESTIONS)
    assert "piloto" in perguntas.lower() or "Kubernetes" in perguntas
    respostas = " ".join(r for _, r in EXPECTED_QUESTIONS)
    assert "BLOCKED" in respostas


def test_scan_public_text_detecta_segredos() -> None:
    assert scan_public_text("token sk-abcdefghijklmnop vazou") != []
    assert scan_public_text("-----BEGIN RSA PRIVATE KEY-----") != []
    assert scan_public_text("AKIAIOSFODNN7EXAMPLE aqui") != []
    assert scan_public_text("texto limpo sobre algoritmos") == []
