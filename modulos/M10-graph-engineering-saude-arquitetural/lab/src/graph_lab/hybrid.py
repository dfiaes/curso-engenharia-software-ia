"""Híbrido vetor→grafo: âncora léxica, expansão com orçamento (lote M10)."""

from __future__ import annotations

from graph_lab.digraph import DiGraph


def ancorar(pergunta: str, simbolos: list[str]) -> list[str]:
    """Âncoras por casamento de símbolo (case-insensitive, sem LLM)."""
    baixa = pergunta.lower()
    return [s for s in simbolos if s.split(".")[-1].lower() in baixa]


def expandir(
    g: DiGraph, ancoras: list[str], saltos: int = 2, teto: int = 20, direcao: str = "ambas"
) -> list[dict[str, object]]:
    """Vizinhança com orçamento: saídas e/ou entradas, sem virar o repo."""
    vistos: dict[str, int] = {}
    for ancora in ancoras[:3]:
        alcances = [g.alcancaveis(ancora, chave="CHAMA", max_saltos=saltos)]
        if direcao == "ambas":
            alcances.append(g.alcancado_por(ancora, chave="CHAMA", max_saltos=saltos))
        for alcance in alcances:
            for vizinho, distancia in alcance.items():
                if vizinho not in vistos or distancia < vistos[vizinho]:
                    vistos[vizinho] = distancia
    ordenados = ordenar_por_distancia(vistos)
    return [{"fqn": fqn, "distancia": d} for fqn, d in ordenados[:teto]]


def ordenar_por_distancia(vistos: dict[str, int]) -> list[tuple[str, int]]:
    """Ordena por distância (determinístico)."""
    return sorted(vistos.items(), key=lambda kv: (kv[1], kv[0]))
