"""Padrões compostáveis sobre funções puras (lote M08).

Chaining, routing, voting e evaluator-optimizer executados com chamáveis
determinísticos — a mecânica dos padrões sem modelo. O orchestrator com
subagentes usa o loop real e está em `subagent.py`.
"""

from __future__ import annotations

from collections import Counter
from collections.abc import Callable
from typing import Any


def chaining(etapas: list[Callable[[Any], Any]], entrada: Any) -> Any:
    """Passa a saída de cada etapa para a próxima, em ordem fixa."""
    valor = entrada
    for etapa in etapas:
        valor = etapa(valor)
    return valor


def routing(entrada: Any, rotas: dict[str, Callable[[Any], Any]], padrao: str) -> Any:
    """Despacha pela chave da entrada; rota padrão é obrigatória e segura."""
    chave = entrada if isinstance(entrada, str) else padrao
    return rotas.get(chave, rotas[padrao])(entrada)


def voting(candidatos: list[Callable[[Any], Any]], entrada: Any) -> tuple[object, int]:
    """Roda N variantes e devolve (vencedor, votos). Empate: primeiro."""
    votos = Counter(candidato(entrada) for candidato in candidatos)
    vencedor, n = votos.most_common(1)[0]
    return vencedor, n


def evaluator_optimizer(
    gerar: Callable[[Any], Any],
    avaliar: Callable[[Any], tuple[bool, str]],
    entrada: Any,
    max_voltas: int = 2,
) -> tuple[object, int]:
    """Gera, avalia com rubrica, revisa até passar ou o teto."""
    saida = gerar(entrada)
    for volta in range(1, max_voltas + 1):
        ok, _feedback = avaliar(saida)
        if ok:
            return saida, volta
        saida = gerar((entrada, saida))
    return saida, max_voltas
