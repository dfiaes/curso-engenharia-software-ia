"""Restauracao como oraculo: faults desligados e verificacao verde.

Referencia executavel do Bloco 6.
Implementacao verbatim na folha B06-L. So STDLIB (collections.abc).
Restaurado exige as duas metades; "voltou ao normal" sem prova reprova.
"""

from __future__ import annotations

from collections.abc import Callable


def desligar_faults(faults: dict[str, bool]) -> dict[str, bool]:
    """Desliga cada degradacao declarada; publica o mapa desligado."""
    return {nome: False for nome in faults}


def smoke_verde(sondas: dict[str, Callable[[], bool]]) -> dict[str, bool]:
    """Executa cada sonda sobre o ambiente restaurado; vazio: ValueError."""
    if not sondas:
        raise ValueError("sem sondas não há verificacao verde")
    return {nome: bool(sonda()) for nome, sonda in sondas.items()}


def veredito_restauracao(faults: dict[str, bool], resultados: dict[str, bool]) -> str:
    """Restaurado só com todos os faults desligados e todas as sondas verdes."""
    if not resultados:
        raise ValueError("sem resultados não há veredito")
    todos_desligados = all(desligado is False for desligado in faults.values())
    todas_verdes = all(passou for passou in resultados.values())
    if todos_desligados and todas_verdes:
        return "restaurado"
    return "pendente"
