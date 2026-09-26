"""Oraculos LT04-T1-AT-010..012: gate fechado, P0/P1 e condicional com dono.

Numeros: exemplo variavel (dicts em memoria, 2-3 claims).
Assinatura humana responsavel = trilha externa BLOCKED; aqui calculo puro.
"""

from __future__ import annotations

import gates_release as g

CLAIM_OK: dict[str, object] = {"id": "contrato", "evidencia": True, "severidade": "p1"}
GATE_VERDE: dict[str, dict[str, object]] = {"q1": {"veredito": "aprovado", "bloqueadores": []}}


def test_claim_sem_evidencia_falha_fechado() -> None:
    r = g.avaliar_gate([CLAIM_OK, {"id": "cauda", "evidencia": False, "severidade": "p2"}])
    assert r == {"veredito": "reprovado", "bloqueadores": ["cauda"]}


def test_gate_verde_exige_toda_evidencia() -> None:
    assert g.avaliar_gate([CLAIM_OK])["veredito"] == "aprovado"


def test_p0_aberto_forca_no_go() -> None:
    claims = [{"id": "contrato", "evidencia": False, "severidade": "p0"}]
    d = g.decidir({}, claims, [])
    assert d["decisao"] == "NO-GO"
    assert d["motivo"] == ["contrato"]


def test_gate_reprovado_forca_no_go() -> None:
    claims = [{"id": "x", "evidencia": True, "severidade": "p2"}]
    d = g.decidir({"q1": {"veredito": "reprovado", "bloqueadores": ["x"]}}, claims, [])
    assert d["decisao"] == "NO-GO"


def test_condicional_sem_dono_ou_prazo_e_no_go() -> None:
    claims = [CLAIM_OK]
    pendentes: list[dict[str, object]] = [
        {"item": "i", "condicao": "c", "expiracao": "e"},
        {"item": "i", "dono": "d", "expiracao": "e"},
        {"item": "i", "dono": "d", "condicao": "c"},
    ]
    for item in pendentes:
        d = g.decidir(GATE_VERDE, claims, [item])
        assert d["decisao"] == "NO-GO"


def test_condicional_completo_e_conditional_go() -> None:
    item: dict[str, object] = {
        "item": "cauda-p99",
        "dono": "sre",
        "condicao": "p99<800ms",
        "expiracao": "2026-10-01",
    }
    d = g.decidir(GATE_VERDE, [CLAIM_OK], [item])
    assert d["decisao"] == "CONDITIONAL GO"


def test_tudo_verde_sem_pendencia_e_go() -> None:
    assert g.decidir(GATE_VERDE, [CLAIM_OK], []) == {"decisao": "GO", "motivo": []}
