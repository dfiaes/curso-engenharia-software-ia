"""Shipping: a regional table (the strategy) plus small pure steps applied in a fixed order."""

from collections.abc import Mapping
from dataclasses import dataclass
from types import MappingProxyType
from typing import Protocol

from design_lab.pedidos.modelos import Centavos, Pedido, Regiao, TipoCliente

LIMITE_FRETE_GRATIS: Centavos = 30000

_UF_SUDESTE = frozenset({"SP", "RJ", "MG", "ES"})
_UF_SUL = frozenset({"PR", "SC", "RS"})


class PoliticaFrete(Protocol):
    def calcular(self, peso_g: int) -> Centavos: ...


@dataclass(frozen=True, slots=True)
class TabelaRegional:
    base: Centavos
    por_kg_extra: Centavos

    def calcular(self, peso_g: int) -> Centavos:
        kgs = (peso_g + 999) // 1000
        extra = (kgs - 1) * self.por_kg_extra if kgs > 1 else 0
        return self.base + extra


TABELAS: Mapping[Regiao, PoliticaFrete] = MappingProxyType(
    {
        Regiao.SUDESTE: TabelaRegional(base=1500, por_kg_extra=500),
        Regiao.SUL: TabelaRegional(base=2000, por_kg_extra=700),
        Regiao.OUTRAS: TabelaRegional(base=3000, por_kg_extra=1200),
    }
)


def regiao_de(uf: str) -> Regiao:
    if uf in _UF_SUDESTE:
        return Regiao.SUDESTE
    if uf in _UF_SUL:
        return Regiao.SUL
    return Regiao.OUTRAS


def aplicar_isencao(
    frete: Centavos, *, base_pos_desconto: Centavos, expresso: bool, cupom_frete_gratis: bool
) -> Centavos:
    if base_pos_desconto >= LIMITE_FRETE_GRATIS and not expresso:
        return 0
    if cupom_frete_gratis:
        return frete // 2 if expresso else 0
    return frete


def calcular_frete(
    pedido: Pedido,
    *,
    base_pos_desconto: Centavos,
    cupom_frete_gratis: bool,
    tabelas: Mapping[Regiao, PoliticaFrete] = TABELAS,
) -> Centavos:
    regiao = regiao_de(pedido.uf)
    if regiao is Regiao.OUTRAS and pedido.tem_pereciveis:
        raise ValueError(f"perecível não é entregue em {pedido.uf}")
    frete = tabelas[regiao].calcular(pedido.peso_total_g)
    if pedido.expresso:
        frete *= 2
    frete = aplicar_isencao(
        frete,
        base_pos_desconto=base_pos_desconto,
        expresso=pedido.expresso,
        cupom_frete_gratis=cupom_frete_gratis,
    )
    if pedido.cliente.tipo is TipoCliente.OURO:
        frete //= 2
    return frete
