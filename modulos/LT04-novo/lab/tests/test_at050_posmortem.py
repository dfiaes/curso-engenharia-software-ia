"""Oraculos LT04-T1-AT-050..052: registro, acao com dono/prazo e waiver com expiracao.

Numeros: exemplo variavel (dicts em memoria, datas ISO 2026).
Incidente real = trilha externa BLOCKED; aqui regra pura.
"""

from __future__ import annotations

import posmortem_release as p

HOJE = "2026-09-21"
INC_OK: dict[str, object] = {
    "titulo": "canary promoveu com stop cego",
    "timeline": [{"quando": "10:00", "fato": "p99 estourou o teto"}],
    "causas": ["stop sem limite previo"],
}
ACAO_OK: dict[str, object] = {
    "descricao": "declarar limites antes do rollout",
    "dono": "sre",
    "prazo": "2026-10-01",
}


def test_registro_exige_titulo_timeline_causas() -> None:
    assert p.validar_registro(INC_OK) == []
    sem: dict[str, object] = {"titulo": "x"}
    problemas = p.validar_registro(sem)
    assert "timeline ausente" in problemas
    assert "causas ausentes" in problemas


def test_acao_exige_descricao_dono_prazo_futuro() -> None:
    assert p.validar_acao(ACAO_OK, HOJE) == []
    for acao, esperado in (
        ({"dono": "sre", "prazo": "2026-10-01"}, "descricao ausente"),
        ({"descricao": "x", "prazo": "2026-10-01"}, "dono ausente"),
        ({"descricao": "x", "dono": "sre", "prazo": "2026-09-01"}, "prazo ausente ou vencido"),
        ({"descricao": "x", "dono": "sre"}, "prazo ausente ou vencido"),
    ):
        a: dict[str, object] = dict(acao)
        assert esperado in p.validar_acao(a, HOJE)


def test_waiver_vencida_bloqueia_release() -> None:
    boa: dict[str, object] = {"motivo": "risco mapeado", "dono": "seg", "expiracao": "2026-10-01"}
    assert p.waiver_valida(boa, HOJE) is True
    vencida: dict[str, object] = {"motivo": "m", "dono": "s", "expiracao": "2026-09-01"}
    assert p.waiver_valida(vencida, HOJE) is False
    sem_dono: dict[str, object] = {"motivo": "m", "expiracao": "2026-10-01"}
    assert p.waiver_valida(sem_dono, HOJE) is False
