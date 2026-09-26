"""Oraculos LT03-AT-040/041: commit converge com revisao/digest; manual revertido.

Numeros: exemplo variavel (dicts em memoria; TTL 3600 s, agora injetado).
Sem cluster: reconciliacao como dados; controlador Flux na trilha externa.
"""

from __future__ import annotations

import reconciliar_gitops as g

DESEJADO = {"revisao": "abc123", "digest": "sha256:44", "replicas": "3"}


def test_commit_converge_e_registra_revisao_e_digest() -> None:
    veredito = g.reconciliar(DESEJADO, {"replicas": "2"})
    assert veredito["convergiu"] is True
    assert veredito["revisao"] == "abc123"
    assert veredito["digest"] == "sha256:44"


def test_mudanca_sem_commit_nao_persiste() -> None:
    revertido = g.reverter_manual(DESEJADO, {"replicas": "9"}, False)
    assert revertido["replicas"] == "3"


def test_break_glass_expira_por_ttl() -> None:
    assert g.break_glass_expirado(0.0, 3600.0, 100.0) is False
    assert g.break_glass_expirado(0.0, 3600.0, 7200.0) is True


def test_com_break_glass_ativo_excecao_temporaria() -> None:
    mantido = g.reverter_manual(DESEJADO, {"replicas": "9"}, True)
    assert mantido["replicas"] == "9"
