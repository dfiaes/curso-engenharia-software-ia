"""Oraculo LT03-AT-003: decisao registra responsabilidade, domains, egress, saida.

Numeros: exemplo variavel (dados em memoria). Semente 20260814, N = 3 servicos.
Sem Docker, sem rede: valida estrutura da tabela, nao provisiona nada.
"""

from __future__ import annotations

from typing import TypedDict


class Decisao(TypedDict):
    servico: str
    responsabilidade: str
    failure_domains: list[str]
    egress: str
    saida: str


DECISOES: list[Decisao] = [
    {
        "servico": "fila-gerenciada-exemplo",
        "responsabilidade": "provedor opera broker; time opera schema e consumo",
        "failure_domains": ["zona-a", "zona-b"],
        "egress": "consumo intra-zona; extracao taxada por GB",
        "saida": "exportar mensagens e recriar fila neutra",
    },
    {
        "servico": "banco-gerenciado-exemplo",
        "responsabilidade": "provedor opera disco/backup; time opera schema",
        "failure_domains": ["zona-a", "zona-b", "regiao-remota"],
        "egress": "replica cross-zone paga; leitura local gratuita",
        "saida": "dump logico + replay em instancia neutra",
    },
    {
        "servico": "registry-exemplo",
        "responsabilidade": "provedor guarda blobs; time pinna digest",
        "failure_domains": ["regiao-unica-com-mirror"],
        "egress": "pull por deploy; mirror local reduz custo",
        "saida": "republicar por digest em registry neutro",
    },
]


def decisao_completa(dec: Decisao) -> bool:
    return bool(
        dec["servico"].strip()
        and dec["responsabilidade"].strip()
        and len(dec["failure_domains"]) >= 1
        and dec["egress"].strip()
        and dec["saida"].strip()
    )


def test_todas_as_decisoes_explicitam_os_quatro_campos() -> None:
    assert len(DECISOES) == 3
    for dec in DECISOES:
        assert decisao_completa(dec) is True, dec["servico"]


def test_decisao_incompleta_e_recusada() -> None:
    incompleta: Decisao = {
        "servico": "fila-sem-saida",
        "responsabilidade": "provedor opera tudo",
        "failure_domains": ["zona-a"],
        "egress": "",
        "saida": "",
    }
    assert decisao_completa(incompleta) is False


def test_sem_failure_domain_e_recusado() -> None:
    sem_domain: Decisao = {
        "servico": "banco-sem-domain",
        "responsabilidade": "time opera tudo",
        "failure_domains": [],
        "egress": "egress taxado",
        "saida": "dump e replay",
    }
    assert decisao_completa(sem_domain) is False
