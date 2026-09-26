"""Reversao verificada: stop dispara, rollback mira digest anterior, restore prova.

Referencia executavel do Bloco 3.
Implementacao verbatim na folha B03-L. So STDLIB (sem imports).
Oracalos LT04-T1-AT-020..022; trafego/dado real = trilha BLOCKED.
"""

from __future__ import annotations


def stop_disparado(metricas: dict[str, float], limites: dict[str, float]) -> list[str]:
    """Condicoes violadas (metrica acima do limite), em ordem; vazio e seguir."""
    return sorted(m for m, teto in limites.items() if metricas.get(m, 0.0) > teto)


def escolher_alvo(historico: list[dict[str, str]], atual: int) -> dict[str, str]:
    """Alvo e o release anterior conhecido: sem anterior, erro explicito."""
    if atual <= 0 or atual >= len(historico):
        raise ValueError(f"sem release anterior para regredir (atual={atual})")
    return historico[atual - 1]


def reverter(
    historico: list[dict[str, str]], atual: int, violacoes: list[str]
) -> dict[str, object]:
    """Com stop disparado, acao e rollback ao digest anterior; sem stop, manter."""
    if not violacoes:
        return {"acao": "manter", "alvo": historico[atual]}
    return {"acao": "rollback", "alvo": escolher_alvo(historico, atual)}


def restauracao_ok(alvo: dict[str, str], estado: dict[str, object]) -> bool:
    """Restore provado: mesmo digest, dado compativel e servico saudavel."""
    return (
        estado.get("digest") == alvo.get("digest")
        and estado.get("dado") == alvo.get("dado")
        and estado.get("saudavel") is True
    )
