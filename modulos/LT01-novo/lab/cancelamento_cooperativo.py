"""Cancelamento cooperativo: o sinal viaja, o trabalho decide onde parar.

Referencia executavel do Bloco 4.
Implementacao verbatim na folha B04-L. So STDLIB (threading).
Nunca interrompe thread à força: o trabalho verifica nos limites.
"""

from __future__ import annotations

import threading
from collections.abc import Callable, Iterable, Iterator


class Cancelado(Exception):
    """Trabalho interrompido num limite após cancelar()."""


class SinalCancelamento:
    """Sinal manual e idempotente: cancelar() uma vez vale para sempre."""

    def __init__(self) -> None:
        self._evento = threading.Event()

    def cancelar(self) -> None:
        """Marca o sinal; chamar duas vezes não muda nada."""
        self._evento.set()

    @property
    def cancelado(self) -> bool:
        """Verdadeiro depois de cancelar(), falso antes."""
        return self._evento.is_set()

    def verificar(self) -> None:
        """Levanta Cancelado se o sinal foi marcado; senão, retorna."""
        if self._evento.is_set():
            raise Cancelado("trabalho cancelado pelo chamador")

    def aguardar(self, prazo: float | None = None) -> bool:
        """Espera o sinal até o prazo; devolve True se cancelado."""
        return self._evento.wait(timeout=prazo)


def executar_cancelavel[T](sinal: SinalCancelamento, trabalho: Callable[[], T]) -> T:
    """Verifica antes e depois; o cancelamento aparece no limite seguinte."""
    sinal.verificar()
    saida = trabalho()
    sinal.verificar()
    return saida


def iterar_cancelavel[T](sinal: SinalCancelamento, itens: Iterable[T]) -> Iterator[T]:
    """Produz item a item, verificando o sinal a cada passo."""
    for item in itens:
        sinal.verificar()
        yield item
