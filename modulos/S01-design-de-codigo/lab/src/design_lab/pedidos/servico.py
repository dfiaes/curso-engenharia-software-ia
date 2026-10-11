"""The imperative shell: reads the clock, calls the pure core, persists, notifies."""

from collections.abc import Callable, Sequence
from datetime import date
from typing import Protocol

from design_lab.pedidos.modelos import Pedido, Resultado
from design_lab.pedidos.precificacao import calcular
from design_lab.pedidos.repositorio import PedidoCalculado, RepositorioPedidos

type Ouvinte = Callable[[PedidoCalculado], None]


class Relogio(Protocol):
    def hoje(self) -> date: ...


class RelogioSistema:
    def hoje(self) -> date:
        return date.today()


class ServicoPedidos:
    def __init__(
        self,
        repositorio: RepositorioPedidos,
        relogio: Relogio,
        ouvintes: Sequence[Ouvinte] = (),
    ) -> None:
        self._repositorio = repositorio
        self._relogio = relogio
        self._ouvintes = tuple(ouvintes)

    def fechar(self, pedido_id: str, pedido: Pedido) -> Resultado:
        hoje = self._relogio.hoje()
        resultado = calcular(pedido, hoje)
        registro = PedidoCalculado(pedido_id, resultado, hoje)
        self._repositorio.salvar(registro)
        for ouvinte in self._ouvintes:
            ouvinte(registro)
        return resultado

    def consultar(self, pedido_id: str) -> PedidoCalculado | None:
        return self._repositorio.obter(pedido_id)
