"""Regras do verificador: oráculos positivos, negativos e mutante (AT-010)."""

from __future__ import annotations

from pathlib import Path

import pytest

from design_guard.rules import (
    checar_adr,
    checar_mermaid,
    checar_referencias,
    documenta_alvo,
)

DEMO = Path(__file__).resolve().parent.parent / "demo_docs"
ADR_BOM = DEMO / "adr" / "0001-banco-unico.md"
ADR_RUIM = DEMO / "adr" / "0002-formato-de-log.md"


def test_adr_bom_passas() -> None:
    assert checar_adr(ADR_BOM) == []


def test_adr_ruim_acusa_estrutura_e_porque() -> None:
    regras = {v.regra for v in checar_adr(ADR_RUIM)}
    assert "adr-estrutura" in regras
    assert "adr-sem-porque" in regras


def test_referencia_existente_passa() -> None:
    assert checar_referencias(DEMO / "runbook.md", DEMO.parent) == []


def test_referencia_quebrada_e_acusada(tmp_path: Path) -> None:
    doc = tmp_path / "nota.md"
    doc.write_text("ver `src/app/inexistente.py` para detalhes\n", encoding="utf-8")
    violacoes = checar_referencias(doc, tmp_path)
    assert len(violacoes) == 1 and violacoes[0].regra == "ref-quebrada"


def test_mermaid_valido_passa() -> None:
    assert checar_mermaid(DEMO / "architecture.md") == []


def test_mermaid_sem_cerca_e_acusado(tmp_path: Path) -> None:
    doc = tmp_path / "diag.md"
    doc.write_text("```mermaid\nflowchart LR\nA --> B\n", encoding="utf-8")
    assert any(v.regra == "mermaid-cerca" for v in checar_mermaid(doc))


def test_mermaid_tipo_desconhecido_e_acusado(tmp_path: Path) -> None:
    doc = tmp_path / "diag.md"
    doc.write_text("```mermaid\nteletransporte Q\n```\n", encoding="utf-8")
    assert any(v.regra == "mermaid-tipo" for v in checar_mermaid(doc))


def test_front_matter_documenta_liga_doc_a_codigo() -> None:
    assert documenta_alvo(DEMO / "architecture.md") == "demo_src/billing"
    assert documenta_alvo(DEMO / "runbook.md") is None


def test_obsolescencia_sem_historico_nao_acusa(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    import design_guard.rules as rules

    doc = tmp_path / "doc.md"
    doc.write_text("# Doc\n", encoding="utf-8")
    monkeypatch.setattr(rules, "_git", lambda *a, **k: "")
    assert rules.checar_obsolescencia(doc, tmp_path, "src") == []


def test_obsolescencia_com_codigo_andando_acusa(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    import design_guard.rules as rules

    doc = tmp_path / "doc.md"
    doc.write_text("# Doc\n", encoding="utf-8")

    def fake_git(*args: str, cwd: Path) -> str:
        if args[0] == "log":
            return "abc123"
        return "42"

    monkeypatch.setattr(rules, "_git", fake_git)
    violacoes = rules.checar_obsolescencia(doc, tmp_path, "src")
    assert len(violacoes) == 1 and "42 commits" in violacoes[0].detalhe
