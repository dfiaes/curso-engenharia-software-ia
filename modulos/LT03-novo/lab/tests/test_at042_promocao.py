"""Oraculos LT03-AT-042/043: config ruim preserva saudavel; digest atravessa envs.

Numeros: exemplo variavel (dicts em memoria; 3 ambientes). Sem cluster:
promocao como identidade de dado; pipeline real na trilha externa.
"""

from __future__ import annotations

import reconciliar_gitops as g

SAUDAVEL = {"revisao": "boa", "digest": "sha256:44", "valida": "sim"}


def test_config_invalida_falha_visivel_sem_apagar_saudavel() -> None:
    ruim = {"revisao": "ruim", "digest": "sha256:99"}
    assert g.aplicar_config(SAUDAVEL, ruim) == SAUDAVEL


def test_config_valida_substitui() -> None:
    boa = {"revisao": "nova", "digest": "sha256:45", "valida": "sim"}
    assert g.aplicar_config(SAUDAVEL, boa) == boa


def test_promocao_preserva_identidade_entre_ambientes() -> None:
    saidas = g.promover("sha256:44", ["dev", "homolog", "prod"])
    assert saidas == {"dev": "sha256:44", "homolog": "sha256:44", "prod": "sha256:44"}


def test_promocao_nao_troca_digest_por_tag() -> None:
    saidas = g.promover("sha256:44", ["prod"])
    assert saidas["prod"] != "latest"
