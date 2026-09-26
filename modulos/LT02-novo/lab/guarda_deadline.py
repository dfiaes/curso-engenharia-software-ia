"""Guarda de deadline: tentativa que nao cabe no prazo jamais comeca.

Referencia executavel do Bloco 4.
Implementacao verbatim na folha B04-L. So STDLIB (dataclasses).
Tempo como inteiro logico da agenda; sem relogio de parede.
"""

from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class GuardaDeadline:
    """Prazo fim-a-fim do job; retry jamais estende o deadline."""

    deadline_em: int

    def cabe(self, agora: int, custo_estimado: int) -> bool:
        """Verdadeiro quando a tentativa termina ate o deadline."""
        return agora + custo_estimado <= self.deadline_em

    def autorizar(self, chave: str, agora: int, custo_estimado: int) -> str:
        """Autoriza com o saldo restante ou barra com o motivo deadline."""
        if self.cabe(agora, custo_estimado):
            restante = self.deadline_em - agora
            return f"autorizada:{chave}:restam-{restante}"
        return f"barrada-deadline:{chave}"
