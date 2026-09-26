"""B1: toda claim do release contract tem método de medição — nenhuma solta."""

from pathlib import Path

CONTRACT = Path(__file__).parents[1] / "docs" / "release-contract.md"
RISKS = Path(__file__).parents[1] / "docs" / "risk-register.md"


def _claim_rows() -> list[list[str]]:
    text = CONTRACT.read_text(encoding="utf-8")
    section = text.split("## Claims e métodos de medição")[1].split("##")[0]
    rows = [
        [c.strip() for c in line.strip().strip("|").split("|")]
        for line in section.splitlines()
        if line.strip().startswith("|")
    ]
    header = rows[0]
    return [r for r in rows[1:] if set("".join(r)) - {"-", " "}] if len(header) >= 3 else []


def test_contract_has_frozen_sections() -> None:
    text = CONTRACT.read_text(encoding="utf-8")
    for marker in ("Persona e problema", "Claims e métodos de medição", "Critérios go/no-go"):
        assert marker in text, f"seção obrigatória ausente: {marker}"


def test_every_claim_has_measurement_method() -> None:
    rows = _claim_rows()
    assert len(rows) >= 3, "release contract precisa de pelo menos 3 claims"
    for row in rows:
        assert len(row) >= 3 and row[1] and row[2], f"claim sem método de medição: {row}"


def test_risk_register_tracks_blockers_honestly() -> None:
    text = RISKS.read_text(encoding="utf-8")
    assert "BLOCKED" in text, "risk register deve registrar bloqueios reais (Docker/Tree-sitter)"
    assert text.count("| R-") >= 5, "risk register inicial deve listar riscos identificados"
