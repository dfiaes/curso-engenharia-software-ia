"""Oraculo LT03-AT-012: ServiceAccount so executa verbos/recursos necessarios.

Numeros: exemplo variavel (dados em memoria). Amostra: 2 contas (api, worker),
semente 20260921. Sem cluster, sem rede: matriz de permissoes como dicts;
segredo jamais em manifesto, env ou evidencia (ponte AT-014).
"""

from __future__ import annotations


class Permissao:
    """Verbos concedidos a uma conta sobre um recurso em um escopo."""

    def __init__(self, conta: str, recurso: str, verbos: list[str]) -> None:
        self.conta = conta
        self.recurso = recurso
        self.verbos = verbos


MATRIZ: list[Permissao] = [
    Permissao("conta-api", "servicos-estado", ["get", "list"]),
    Permissao("conta-worker", "fila-trabalho", ["get", "update"]),
]

VERBOS_API = {"get", "list"}
VERBOS_WORKER = {"get", "update"}


def pode(conta: str, recurso: str, verbo: str) -> bool:
    """Autorizacao local sobre a matriz declarada (default-deny: ausente nega)."""
    for permissao in MATRIZ:
        if permissao.conta == conta and permissao.recurso == recurso:
            return verbo in permissao.verbos
    return False


def sem_curinga(verbos: list[str]) -> bool:
    return "*" not in verbos


def test_contas_distintas_com_verbos_minimos() -> None:
    for permissao in MATRIZ:
        assert sem_curinga(permissao.verbos) is True
        assert len(permissao.verbos) <= 2


def test_worker_nao_alcanca_permissao_da_api() -> None:
    assert pode("conta-worker", "servicos-estado", "get") is False
    assert pode("conta-worker", "fila-trabalho", "update") is True


def test_api_nao_alcanca_permissao_do_worker() -> None:
    assert pode("conta-api", "fila-trabalho", "update") is False
    assert pode("conta-api", "servicos-estado", "list") is True


def test_verbo_nao_listado_e_negado_por_padrao() -> None:
    assert pode("conta-api", "servicos-estado", "delete") is False
    assert pode("conta-desconhecida", "servicos-estado", "get") is False


def test_verbos_cruzados_nao_compartilhados() -> None:
    assert VERBOS_API != VERBOS_WORKER
    assert pode("conta-api", "fila-trabalho", "get") is False
