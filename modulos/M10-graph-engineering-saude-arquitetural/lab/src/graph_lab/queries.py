"""Travessias: as três perguntas respondidas com evidência (lote M10)."""

from __future__ import annotations

from graph_lab.digraph import DiGraph


def impacto(g: DiGraph, fqn: str, profundidade: int = 4) -> list[dict[str, object]]:
    """Quem quebra se `fqn` mudar: reversa de CHAMA com distância e rota."""
    afetados = g.alcancado_por(fqn, chave="CHAMA", max_saltos=profundidade)
    saida = []
    for origem, distancia in sorted(afetados.items(), key=lambda kv: kv[1]):
        rota = g.rota(origem, fqn, chave="CHAMA") or [origem, fqn]
        saida.append({"afetado": origem, "distancia": distancia, "rota": rota})
    return saida


def codigo_morto(g: DiGraph, entrypoints: list[str]) -> list[str]:
    """CANDIDATOS a mortos: métodos inalcançáveis de qualquer entry point."""
    vivos: set[str] = set(entrypoints)
    for ep in entrypoints:
        vivos |= set(g.alcancaveis(ep, chave="CHAMA").keys())
    return sorted(n for n in g.nos() if g.attrs(n).get("tipo") == "Metodo" and n not in vivos)


def vizinhanca(g: DiGraph, fqn: str, saltos: int = 2) -> list[str]:
    """Expansão com orçamento: vizinhos até N saltos (híbrido vetor→grafo)."""
    return sorted(g.alcancaveis(fqn, chave="CHAMA", max_saltos=saltos).keys())
