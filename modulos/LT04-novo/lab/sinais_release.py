"""Sinais que nao mentem: percentis de amostras brutas e regressao por slice.

Referencia executavel do Bloco 4.
Implementacao verbatim na folha B04-L. So STDLIB (math).
Oracalos LT04-T1-AT-030..032; carga/trafego real = trilha BLOCKED.
"""

from __future__ import annotations

import math


def percentil(amostras: list[float], p: float) -> float:
    """Nearest-rank sobre amostras brutas: sem amostra, erro explicito."""
    if not amostras:
        raise ValueError("sem amostras: percentil de vazio nao existe")
    if not 0.0 < p <= 100.0:
        raise ValueError(f"percentil invalido: {p}")
    ordenadas = sorted(amostras)
    posto = min(len(ordenadas), math.ceil(len(ordenadas) * p / 100.0))
    return ordenadas[posto - 1]


def resumo(amostras: list[float]) -> dict[str, float]:
    """Media mais cauda do mesmo raw: p50/p95/p99 acompanham n."""
    return {
        "n": float(len(amostras)),
        "media": sum(amostras) / len(amostras),
        "p50": percentil(amostras, 50.0),
        "p95": percentil(amostras, 95.0),
        "p99": percentil(amostras, 99.0),
    }


def taxa_erro(falhas: int, total: int) -> float:
    """Fracao de falhas: total zero e dado ausente, nao zero por cento."""
    if total <= 0:
        raise ValueError("total precisa ser positivo")
    return falhas / total


def slices_piores(p99_por_slice: dict[str, float], teto: float) -> list[str]:
    """Slices acima do teto, em ordem: agregado verde nao absolve segmento."""
    return sorted(s for s, p99 in p99_por_slice.items() if p99 > teto)
