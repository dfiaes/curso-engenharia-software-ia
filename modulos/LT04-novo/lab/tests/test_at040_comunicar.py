"""Oraculos LT04-T1-AT-040..042: aprovadores por tier e reproducao independente.

Numeros: exemplo variavel (listas/dicts em memoria, 3 tiers).
Reuniao e aprovacao reais = trilha externa BLOCKED; aqui regra pura.
"""

from __future__ import annotations

import pytest

import comunicar_release as c

REG: dict[str, object] = {
    "digest": "sha256:" + "cc" * 32,
    "decisao": "GO",
    "claims": ["contrato", "cauda"],
}
BRUTOS: dict[str, object] = {"contrato": "evidencia-1", "cauda": "evidencia-2"}


def test_tiers_exigem_quem_pode_dizer_nao() -> None:
    assert c.exigidos("medio") == ["engenharia"]
    assert c.exigidos("alto") == ["engenharia", "seguranca"]
    assert c.exigidos("critico") == ["engenharia", "seguranca", "negocio"]
    with pytest.raises(ValueError):
        c.exigidos("apocaliptico")


def test_risco_sem_aprovador_completo_bloqueia() -> None:
    assert c.aprovacao_ok(["engenharia", "seguranca", "negocio"], "critico") is True
    assert c.aprovacao_ok(["engenharia", "seguranca"], "critico") is False
    assert c.aprovacao_ok([], "medio") is False


def test_revisor_reproduz_do_mesmo_digest() -> None:
    assert c.reproducao_ok(REG, "sha256:" + "cc" * 32, BRUTOS) is True


def test_digest_trocado_ou_claim_sem_bruto_nao_reproduz() -> None:
    assert c.reproducao_ok(REG, "sha256:" + "dd" * 32, BRUTOS) is False
    parcial: dict[str, object] = {"contrato": "x"}
    assert c.reproducao_ok(REG, "sha256:" + "cc" * 32, parcial) is False
    vazio: dict[str, object] = {"digest": "sha256:" + "cc" * 32, "claims": []}
    assert c.reproducao_ok(vazio, "sha256:" + "cc" * 32, BRUTOS) is False
