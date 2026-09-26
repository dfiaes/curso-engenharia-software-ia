"""Resumo de confianca por geracao.

Referencia executavel do Bloco 1.
Implementacao verbatim na folha B01-L.
"""

from dataclasses import dataclass
from math import exp

LIMIAR_INCERTEZA = -1.0  # ~37% de probabilidade


@dataclass(frozen=True, slots=True)
class ConfiancaGeracao:
    """Resumo de confianca derivado dos logprobs."""

    medio: float
    minimo: float
    incertos: int
    total: int

    @property
    def perplexidade(self) -> float:
        """exp(-media). 1.0 = certeza total."""
        return exp(-self.medio)

    @property
    def fracao_incerta(self) -> float:
        if not self.total:
            return 0.0
        return self.incertos / self.total


def resumir(logprobs: list[float]) -> ConfiancaGeracao | None:
    if not logprobs:
        return None
    return ConfiancaGeracao(
        medio=sum(logprobs) / len(logprobs),
        minimo=min(logprobs),
        incertos=sum(1 for lp in logprobs if lp < LIMIAR_INCERTEZA),
        total=len(logprobs),
    )
