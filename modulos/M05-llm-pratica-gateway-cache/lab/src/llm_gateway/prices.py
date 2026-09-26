"""Retrato de preços para a conta de custo (lote M05).

Números ILUSTRATIVOS datados — servem para exercitar a conta (ledger,
relatório, alavancas), não para decidir compra. Preço real se lê na
documentação do provedor no dia do uso; este retrato expira em 90 dias.
Valores em USD por 1M de tokens.
"""

from __future__ import annotations

SNAPSHOT_DATE = "2026-09-14"
SNAPSHOT_NOTE = "retrato ilustrativo para exercícios; revalidar antes de qualquer decisão"

PRICES_PER_MTOK_USD: dict[str, dict[str, float]] = {
    "classe-forte": {"input": 3.00, "output": 15.00},
    "classe-rapida": {"input": 0.25, "output": 1.25},
}


def cost_usd(model: str, input_tokens: int, output_tokens: int) -> float:
    """Custo de uma chamada pelo retrato. Modelo fora do retrato é erro."""
    try:
        table = PRICES_PER_MTOK_USD[model]
    except KeyError as exc:
        raise KeyError(f"modelo fora do retrato de preços: {model!r}") from exc
    return (input_tokens * table["input"] + output_tokens * table["output"]) / 1_000_000.0
