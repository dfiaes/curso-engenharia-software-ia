"""Discount rules as pure functions. Each rule answers with an ``Efeito``; they combine by sum."""

from collections.abc import Callable, Mapping
from dataclasses import dataclass
from datetime import date
from functools import reduce
from types import MappingProxyType

from design_lab.pedidos.modelos import Centavos, Cliente, TipoCliente

TETO_PERCENTUAL = 20


@dataclass(frozen=True, slots=True)
class Efeito:
    percentual: int = 0
    fixo: Centavos = 0
    frete_gratis: bool = False
    avisos: tuple[str, ...] = ()

    def somar(self, outro: Efeito) -> Efeito:
        return Efeito(
            self.percentual + outro.percentual,
            self.fixo + outro.fixo,
            self.frete_gratis or outro.frete_gratis,
            self.avisos + outro.avisos,
        )


def combinar(efeitos: tuple[Efeito, ...]) -> Efeito:
    return reduce(Efeito.somar, efeitos, Efeito())


def efeito_cliente(cliente: Cliente) -> Efeito:
    match cliente.tipo:
        case TipoCliente.OURO:
            return Efeito(percentual=10)
        case TipoCliente.PRATA:
            return Efeito(percentual=5)
        case TipoCliente.REGULAR:
            return Efeito(percentual=2 if cliente.pedidos >= 10 else 0)


def efeito_volume(qtd_total: int) -> Efeito:
    if qtd_total >= 50:
        return Efeito(percentual=7)
    if qtd_total >= 10:
        return Efeito(percentual=3)
    return Efeito()


def efeito_data(hoje: date) -> Efeito:
    if (hoje.month, hoje.day) == (11, 28):
        return Efeito(percentual=5, avisos=("black friday",))
    return Efeito()


type RegraCupom = Callable[[Cliente, Centavos], Efeito]


def _primeira(cliente: Cliente, subtotal: Centavos) -> Efeito:
    if cliente.pedidos == 0:
        return Efeito(percentual=15)
    return Efeito(avisos=("cupom PRIMEIRA só vale na primeira compra",))


def _fixo20(cliente: Cliente, subtotal: Centavos) -> Efeito:
    if subtotal >= 10000:
        return Efeito(fixo=2000)
    return Efeito(avisos=("cupom FIXO20 exige subtotal mínimo de R$ 100,00",))


def _frete_gratis(cliente: Cliente, subtotal: Centavos) -> Efeito:
    return Efeito(frete_gratis=True)


CUPONS: Mapping[str, RegraCupom] = MappingProxyType(
    {"PRIMEIRA": _primeira, "FIXO20": _fixo20, "FRETEGRATIS": _frete_gratis}
)


def efeito_cupom(codigo: str | None, cliente: Cliente, subtotal: Centavos) -> Efeito:
    if codigo is None:
        return Efeito()
    regra = CUPONS.get(codigo)
    if regra is None:
        return Efeito(avisos=(f"cupom inválido: {codigo}",))
    return regra(cliente, subtotal)
