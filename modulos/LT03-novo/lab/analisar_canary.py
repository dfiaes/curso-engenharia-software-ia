"""Canary como dados: analise por metrica, abort/promocao e rollback, sem trafego.

Referencia executavel do Bloco 6.
Implementacao verbatim na folha B06-L. So STDLIB.
Oraculos LT03-AT-050..053, 060, 061 sobre dicts puros e aritmetica local.
"""

from __future__ import annotations


def analisar(
    erro_stable: float,
    erro_canary: float,
    p95_stable: float,
    p95_canary: float,
    limiar_erro: float,
    limiar_p95: float,
    amostras: int,
    minimo_amostras: int,
) -> str:
    """Promove, aborta ou declara inconclusiva; inconclusiva nunca vira sucesso."""
    if amostras < minimo_amostras:
        return "inconclusiva"
    if erro_canary > erro_stable + limiar_erro or p95_canary > p95_stable + limiar_p95:
        return "abortar"
    return "promover"


def rollback_compativel(novo_le_antigo: bool, antigo_le_novo: bool) -> bool:
    """Rollback de workload nao reverte schema: exige leitura cruzada provada."""
    return novo_le_antigo and antigo_le_novo


def localizar_camada(sinais: dict[str, bool]) -> str:
    """Primeira camada com sinal aceso, na ordem aplicacao a dependencia."""
    for camada in ("aplicacao", "manifesto", "controlador", "no", "rede", "dependencia"):
        if sinais.get(camada):
            return camada
    return "indeterminada"


def restaurar(falhas_ativas: list[str]) -> dict[str, object]:
    """Lab restaurado: sem falhas, reconciliacao ligada, sandbox removivel."""
    return {
        "falhas_ativas": [f for f in falhas_ativas if f],
        "reconciliacao": not falhas_ativas,
        "removivel": not falhas_ativas,
    }
