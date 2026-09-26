"""Pool local de conexões: tamanho fixo, fila FIFO e prazo de aquisição.

Referencia executavel do Bloco 4.
Implementacao verbatim na folha B04-L. So STDLIB (queue, threading).
Conexões nascem da fabrica contratada; nenhum socket externo aqui.
"""

from __future__ import annotations

import queue
import threading
from collections.abc import Callable


class PoolEsgotado(TimeoutError):
    """Nenhum slot livre dentro do prazo de aquisição contratado."""


class PoolLocal:
    """Pool de tamanho fixo com fila FIFO e prazo de aquisição.

    A fabrica cria o recurso sob demanda até o teto; a partir daí,
    adquirir espera um slot livre até o prazo e levanta PoolEsgotado.
    """

    def __init__(
        self,
        fabrica: Callable[[], object],
        tamanho: int,
        prazo_aquisicao: float,
    ) -> None:
        if tamanho < 1:
            raise ValueError("tamanho precisa ser ao menos 1")
        if not prazo_aquisicao > 0:
            raise ValueError("prazo_aquisicao precisa ser positivo")
        self._fabrica = fabrica
        self._tamanho = tamanho
        self._prazo = prazo_aquisicao
        self._livres: queue.Queue[object] = queue.Queue()
        self._criadas = 0
        self._trava = threading.Lock()

    def adquirir(self) -> object:
        """Devolve recurso livre ou recém-criado; sem slot no prazo: PoolEsgotado."""
        try:
            return self._livres.get_nowait()
        except queue.Empty:
            pass
        with self._trava:
            pode_criar = self._criadas < self._tamanho
            if pode_criar:
                self._criadas += 1
        if pode_criar:
            return self._fabrica()
        try:
            return self._livres.get(timeout=self._prazo)
        except queue.Empty:
            raise PoolEsgotado(f"sem slot livre em {self._prazo}s") from None

    def liberar(self, item: object) -> None:
        """Devolve o slot à fila; quem adquiriu devolve exatamente uma vez."""
        self._livres.put(item)

    def estatisticas(self) -> dict[str, int]:
        """Publica tamanho, livres e em_uso para o oráculo AT-030."""
        livres = self._livres.qsize()
        with self._trava:
            criadas = self._criadas
        return {"tamanho": self._tamanho, "livres": livres, "em_uso": criadas - livres}

    def fechar(self) -> None:
        """Esvazia os slots livres; recursos em uso voltam e são descartados."""
        try:
            while True:
                self._livres.get_nowait()
        except queue.Empty:
            return
