"""Oraculo LT03-AT-011: selector sem labels correspondentes publica zero endpoints.

Numeros: exemplo variavel (dados em memoria). Amostra: 2 pods, 1 casa.
Sem cluster, sem rede: diagnostico por comparacao de dicts, nunca por apply.
"""

from __future__ import annotations

import validar_manifesto as vm

SELETOR = {"app": "api-exemplo", "versao": "v1"}
LABELS_GEMEAS = {"app": "api-exemplo", "versao": "v1"}
LABELS_VIZINHAS = {"app": "api-exemplo", "versao": "v2"}

PODS: list[dict[str, str]] = [
    {"nome": "api-1", "app": "api-exemplo", "versao": "v1"},
    {"nome": "api-2", "app": "api-exemplo", "versao": "v2"},
]


def endpoints_para(seletor: dict[str, str], pods: list[dict[str, str]]) -> list[str]:
    """Pods cujas labels casam com todo par do selector (diagnostico local)."""
    nomes: list[str] = []
    for pod in pods:
        labels = {chave: pod[chave] for chave in pod if chave != "nome"}
        if vm.seletor_encontra_labels(seletor, labels):
            nomes.append(pod["nome"])
    return nomes


def test_selector_que_casa_encontra_labels_gemeas() -> None:
    assert vm.seletor_encontra_labels(SELETOR, LABELS_GEMEAS) is True


def test_selector_que_nao_casa_produz_zero_endpoints() -> None:
    assert vm.seletor_encontra_labels(SELETOR, LABELS_VIZINHAS) is False
    assert endpoints_para(SELETOR, PODS) == ["api-1"]


def test_selector_trocado_publica_zero_endpoints_e_diagnosticado() -> None:
    seletor_errado = {"app": "api-exemplo", "versao": "v9"}
    assert endpoints_para(seletor_errado, PODS) == []
    diagnosticado = all(
        not vm.seletor_encontra_labels(
            seletor_errado, {k: v for k, v in pod.items() if k != "nome"}
        )
        for pod in PODS
    )
    assert diagnosticado is True


def test_selector_vazio_nao_seleciona_ninguem() -> None:
    assert vm.seletor_encontra_labels({}, LABELS_GEMEAS) is False
    assert endpoints_para({}, PODS) == []
