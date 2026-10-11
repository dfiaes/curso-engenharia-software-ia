"""The functional core: ``calcular`` is a pure function of the order and of today's date."""

from datetime import date

from design_lab.pedidos.descontos import (
    TETO_PERCENTUAL,
    combinar,
    efeito_cliente,
    efeito_cupom,
    efeito_data,
    efeito_volume,
)
from design_lab.pedidos.frete import calcular_frete
from design_lab.pedidos.modelos import Pedido, Resultado


def calcular(pedido: Pedido, hoje: date) -> Resultado:
    subtotal = pedido.subtotal
    efeito = combinar(
        (
            efeito_cliente(pedido.cliente),
            efeito_volume(pedido.qtd_total),
            efeito_data(hoje),
            efeito_cupom(pedido.cupom, pedido.cliente, subtotal),
        )
    )
    percentual = min(efeito.percentual, TETO_PERCENTUAL)
    avisos = efeito.avisos
    if efeito.percentual > TETO_PERCENTUAL:
        avisos += (f"desconto limitado a {TETO_PERCENTUAL}%",)
    desconto = min(subtotal * percentual // 100 + efeito.fixo, subtotal)
    base = subtotal - desconto
    frete = calcular_frete(pedido, base_pos_desconto=base, cupom_frete_gratis=efeito.frete_gratis)
    return Resultado(subtotal, desconto, frete, base + frete, avisos)
