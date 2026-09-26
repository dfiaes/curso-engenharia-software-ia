"""Simulacao deterministica de rollout com trava de readiness.

Referencia executavel do Bloco 2.
Implementacao verbatim na folha B02-L. So STDLIB.
Sem cluster, sem rede, sem tempo real: passos logicos sobre dicts puros.
"""

from __future__ import annotations


def passo(
    prontas_total: int,
    removidas: int,
    desejadas: int,
    max_indisponiveis: int,
) -> dict[str, int]:
    """Quantas replicas antigas podem sair neste passo logico.

    Cada nova pronta libera uma remocao; max_indisponiveis autoriza
    a margem inicial. Sem nenhuma pronta, nada sai: a trava de
    readiness e absoluta.
    """
    if not prontas_total >= 1:
        return {"prontas_total": prontas_total, "removiveis": 0}
    margem = prontas_total - removidas + max_indisponiveis
    if not margem >= 1:
        return {"prontas_total": prontas_total, "removiveis": 0}
    restantes = desejadas - removidas
    if not restantes >= 1:
        return {"prontas_total": prontas_total, "removiveis": 0}
    return {"prontas_total": prontas_total, "removiveis": min(margem, restantes)}


def simular(
    desejadas: int,
    sequencia_prontidao: list[bool],
    max_indisponiveis: int,
) -> dict[str, object]:
    """Avanca a troca versao antiga contra nova; aborta se a nova nao fica pronta."""
    prontas_total = 0
    removidas = 0
    linha: list[str] = []
    for sinal in sequencia_prontidao:
        if sinal:
            prontas_total += 1
        veredito = passo(prontas_total, removidas, desejadas, max_indisponiveis)
        removidas += veredito["removiveis"]
        linha.append("prontas=" + str(prontas_total) + ",removidas=" + str(removidas))
        if removidas >= desejadas:
            break
    veredito_final: dict[str, object] = {"linha": linha, "removidas": removidas}
    veredito_final["concluiu"] = removidas >= desejadas
    return veredito_final
