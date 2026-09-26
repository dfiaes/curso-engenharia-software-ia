"""Coordenador: dois workers disputam a mesma intencao, um efeito vence.

Referencia executavel do Bloco 3.
Implementacao verbatim na folha B03-L. So STDLIB (threading, dataclasses).
"""

from __future__ import annotations

import threading
from dataclasses import dataclass, field

from repositorio_idempotente import ChaveConflito, RepositorioIdempotente


@dataclass
class Coordenador:
    """Tokens monotonicos por chave; so o dono vigente conclui."""

    repositorio: RepositorioIdempotente
    _trava: threading.Lock = field(default_factory=threading.Lock)
    _geracao: dict[str, int] = field(default_factory=dict)

    def tentar_assumir(self, chave: str, intent_hash: str) -> int | None:
        """Nova geracao para a chave; conflito de hash devolve None auditado."""
        with self._trava:
            proximo = self._geracao.get(chave, 0) + 1
            self._geracao[chave] = proximo
        try:
            veredito = self.repositorio.reservar(chave, intent_hash, proximo)
        except ChaveConflito:
            return None
        if veredito.startswith("dedup:"):
            return -1
        return proximo

    def concluir_como_dono(self, chave: str, token: int, resposta: str) -> bool:
        """Conclui somente com token vigente; vencido vira False sem efeito."""
        try:
            self.repositorio.concluir(chave, token, resposta)
        except PermissionError:
            return False
        return True

    def dono_vigente(self, chave: str) -> int:
        """Token vigente da chave neste instante; zero quando nunca assumida."""
        with self._trava:
            return self._geracao.get(chave, 0)
