"""Oraculos LT03-AT-053/060/061: rollback com migracao, incidente e restauracao.

Numeros: exemplo variavel (dicts e listas em memoria). Sem cluster: camada
localizada por sinais, SLO e desired state restaurados como dados locais.
"""

from __future__ import annotations

import analisar_canary as c


def test_rollback_exige_leitura_cruzada_provada() -> None:
    assert c.rollback_compativel(True, True) is True
    assert c.rollback_compativel(True, False) is False


def test_incidente_localizado_por_camada_em_ordem() -> None:
    sinais = {"aplicacao": False, "manifesto": False, "no": True, "rede": True}
    assert c.localizar_camada(sinais) == "no"


def test_sem_sinal_camada_indeterminada() -> None:
    assert c.localizar_camada({}) == "indeterminada"


def test_restauracao_desliga_falhas_e_religa_reconciliacao() -> None:
    veredito = c.restaurar([])
    assert veredito == {"falhas_ativas": [], "reconciliacao": True, "removivel": True}


def test_com_falha_ativa_lab_nao_e_removivel() -> None:
    veredito = c.restaurar(["bad-probe"])
    assert veredito["reconciliacao"] is False
    assert veredito["removivel"] is False
