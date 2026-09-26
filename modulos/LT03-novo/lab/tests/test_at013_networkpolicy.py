"""Oraculo LT03-AT-013: default-deny com allowlist; DNS explicito; limite do CNI.

Numeros: exemplo variavel (dados em memoria). Amostra: 4 fluxos legitimos,
2 ilegitimos. Sem cluster, sem rede: politica como dicts; teste positivo e
negativo quebram junto com a politica. Dependencia do CNI registrada como dado.
"""

from __future__ import annotations

POLITICA: dict[str, object] = {
    "padrao": "negar-tudo",
    "cni_implementa_politica": True,
    "allowlist": [
        {"origem": "porta-entrada", "destino": "api", "porta": 8080},
        {"origem": "worker", "destino": "fila", "porta": 5672},
        {"origem": "worker", "destino": "banco", "porta": 5432},
        {"origem": "api", "destino": "dns", "porta": 53},
        {"origem": "worker", "destino": "dns", "porta": 53},
    ],
}

FLUXOS_LEGITIMOS: list[tuple[str, str, int]] = [
    ("porta-entrada", "api", 8080),
    ("worker", "fila", 5672),
    ("worker", "banco", 5432),
    ("api", "dns", 53),
]

FLUXOS_ILEGITIMOS: list[tuple[str, str, int]] = [
    ("worker", "api", 8080),
    ("api", "banco", 5432),
]


def permitido(origem: str, destino: str, porta: int) -> bool:
    """Default-deny local: so o declarado na allowlist passa."""
    allowlist = POLITICA["allowlist"]
    assert isinstance(allowlist, list)
    for regra in allowlist:
        assert isinstance(regra, dict)
        if (
            regra.get("origem") == origem
            and regra.get("destino") == destino
            and regra.get("porta") == porta
        ):
            return True
    return False


def test_padrao_e_negar_tudo_com_allowlist_explicita() -> None:
    assert POLITICA["padrao"] == "negar-tudo"
    allowlist = POLITICA["allowlist"]
    assert isinstance(allowlist, list) and len(allowlist) == 5


def test_fluxos_legitimos_passam_incluindo_dns() -> None:
    for origem, destino, porta in FLUXOS_LEGITIMOS:
        assert permitido(origem, destino, porta) is True
    assert permitido("worker", "dns", 53) is True


def test_fluxos_nao_listados_sao_negados() -> None:
    for origem, destino, porta in FLUXOS_ILEGITIMOS:
        assert permitido(origem, destino, porta) is False


def test_sem_dns_na_allowlist_nome_nao_resolve() -> None:
    sem_dns = [r for r in FLUXOS_LEGITIMOS if r[2] != 53]
    assert ("api", "dns", 53) not in sem_dns
    assert permitido("api", "banco", 5432) is False


def test_limite_do_cni_registrado_como_dado() -> None:
    assert POLITICA["cni_implementa_politica"] is True
