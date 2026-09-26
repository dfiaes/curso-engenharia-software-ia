"""Estimativa de tokens (lote M05).

Heurística por caracteres — serve para orçar ANTES de chamar. O número
exato vem do `usage` da resposta, nunca daqui. Rotulada como estimativa
em todo relatório: estimar não é medir.
"""

from __future__ import annotations

import math

CHARS_PER_TOKEN = 4.0


def estimate_tokens(text: str) -> int:
    """Estima tokens como teto de `len(texto)/4`. Aproximação, não medida."""
    return max(1, math.ceil(len(text) / CHARS_PER_TOKEN))


def estimate_request(messages: tuple[object, ...], per_message_overhead: int = 4) -> int:
    """Soma estimativas do conteúdo mais custo fixo de envelope por mensagem."""
    total = 0
    for message in messages:
        content = getattr(message, "content", "")
        total += estimate_tokens(str(content)) + per_message_overhead
    return total
