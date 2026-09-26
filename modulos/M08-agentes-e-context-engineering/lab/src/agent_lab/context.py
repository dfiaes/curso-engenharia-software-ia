"""Contexto: medir composição e compactar preservando fatos (lote M08).

O vilão de tokens quase sempre é saída de ferramenta: por isso a
composição é medida por parte ANTES de otimizar, e a compactação
preserva fatos com evidência enquanto descarta cru interpretado.
"""

from __future__ import annotations

from typing import Any


def estimar_tokens(texto: str) -> int:
    """Estimativa honesta: teto de len/4 (orçar, não medir)."""
    return max(1, (len(texto) + 3) // 4)


def composicao(historico: list[dict[str, Any]]) -> dict[str, int]:
    """Conta tokens estimados por papel: user/assistant/tool."""
    partes: dict[str, int] = {"user": 0, "assistant": 0, "tool": 0}
    for mensagem in historico:
        papel = str(mensagem.get("role", "user"))
        partes[papel] = partes.get(papel, 0) + estimar_tokens(str(mensagem.get("content", "")))
    return partes


def compactar(
    historico: list[dict[str, Any]], fatos: list[str], teto: int = 2000
) -> list[dict[str, Any]]:
    """Resume preservando fatos; descarta saídas cruas já interpretadas.

    Devolve histórico novo: pergunta original + fatos + marcador. Se a
    estimativa já cabe no teto, devolve o histórico intacto.
    """
    total = sum(composicao(historico).values())
    if total <= teto:
        return historico
    pergunta = next((str(m.get("content", "")) for m in historico if m.get("role") == "user"), "")
    resumo = ["[compactado: saídas cruas descartadas]"]
    resumo += [f"fato: {f}" for f in fatos]
    return [
        {"role": "user", "content": pergunta},
        {"role": "assistant", "content": "\n".join(resumo)},
    ]
