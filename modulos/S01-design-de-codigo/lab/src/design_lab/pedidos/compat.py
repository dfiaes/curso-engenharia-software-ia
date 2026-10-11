"""Adapter: accepts the legacy dict-shaped input and calls the typed core.

The legacy callers keep their call shape while the code behind it changes.
"""

from collections.abc import Mapping, Sequence
from datetime import date
from typing import Any

from design_lab.pedidos.modelos import Cliente, Item, Pedido, TipoCliente
from design_lab.pedidos.precificacao import calcular


def item_de_dict(d: Mapping[str, Any]) -> Item:
    return Item(
        sku=d["sku"],
        preco=d["preco"],
        qtd=d["qtd"],
        peso_g=d["peso_g"],
        perecivel=d.get("categoria") == "perecivel",
    )


def cliente_de_dict(d: Mapping[str, Any]) -> Cliente:
    try:
        tipo = TipoCliente(d["tipo"])
    except ValueError:
        raise ValueError(f"tipo de cliente desconhecido: {d['tipo']}") from None
    return Cliente(tipo=tipo, pedidos=d["pedidos"])


def pedido_de_dict(
    itens: Sequence[Mapping[str, Any]],
    cliente: Mapping[str, Any],
    cupom: str | None,
    uf: str,
    expresso: bool,
) -> Pedido:
    if not itens:
        raise ValueError("pedido vazio")
    itens_tipados = tuple(item_de_dict(i) for i in itens)
    return Pedido(itens_tipados, cliente_de_dict(cliente), uf, cupom, expresso)


def calcular_pedido_dict(
    itens: Sequence[Mapping[str, Any]],
    cliente: Mapping[str, Any],
    cupom: str | None,
    uf: str,
    expresso: bool,
    hoje: date,
) -> dict[str, object]:
    pedido = pedido_de_dict(itens, cliente, cupom, uf, expresso)
    return calcular(pedido, hoje).para_dict()
