"""Grader deterministico de abstencao; sem modelo, sem rede.

Referencia executavel do Bloco 5.
Implementacao verbatim na folha B05-L. So STDLIB.
"""

from enum import StrEnum


class Desfecho(StrEnum):
    ABSTEVE = "absteve"
    RESPONDEU_CERTO = "respondeu_certo"
    RESPONDEU_ERRADO = "respondeu_errado"


NOTA: dict[Desfecho, float] = {
    Desfecho.RESPONDEU_CERTO: 1.0,
    Desfecho.ABSTEVE: 0.5,
    Desfecho.RESPONDEU_ERRADO: -1.0,
}


def graduar(esperado: str, obtido: str) -> tuple[Desfecho, float]:
    """Compara normalizado; devolve desfecho e nota."""
    exp = esperado.strip().lower()
    got = obtido.strip().lower()
    if got in {"abstencao", "nao esta no contexto", "nao sei"}:
        d = Desfecho.ABSTEVE if exp == "abstencao" else Desfecho.RESPONDEU_ERRADO
        return d, NOTA[d]
    d = Desfecho.RESPONDEU_CERTO if got == exp else Desfecho.RESPONDEU_ERRADO
    return d, NOTA[d]
