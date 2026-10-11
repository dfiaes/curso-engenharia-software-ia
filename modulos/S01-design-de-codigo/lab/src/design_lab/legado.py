"""Pricing of an order, as it was written in 2019 and never touched again.

This module is the *subject* of the lab. It is frozen on purpose: the tests
describe what it does today, bugs and quirks included. Do not clean it up.

All money values are integer centavos. ``itens`` are dicts with ``sku``, ``preco``,
``qtd``, ``peso_g`` and optionally ``categoria``; ``cliente`` is a dict with
``tipo`` ("regular", "prata", "ouro") and ``pedidos`` (past orders).
"""

import datetime
from typing import Any


def _hoje() -> datetime.date:
    return datetime.date.today()


def calcular_pedido(
    itens: list[dict[str, Any]],
    cliente: dict[str, Any],
    cupom: str | None,
    uf: str,
    expresso: bool,
) -> dict[str, Any]:
    if len(itens) == 0:
        raise ValueError("pedido vazio")
    sub = 0
    peso = 0
    qtd_total = 0
    tem_pereciveis = False
    for it in itens:
        if it["qtd"] <= 0:
            raise ValueError("quantidade inválida: " + it["sku"])
        sub = sub + it["preco"] * it["qtd"]
        peso = peso + it["peso_g"] * it["qtd"]
        qtd_total = qtd_total + it["qtd"]
        if it.get("categoria") == "perecivel":
            tem_pereciveis = True
    avisos = []
    pct = 0
    if cliente["tipo"] == "ouro":
        pct = pct + 10
    elif cliente["tipo"] == "prata":
        pct = pct + 5
    elif cliente["tipo"] == "regular":
        if cliente["pedidos"] >= 10:
            pct = pct + 2
    else:
        raise ValueError("tipo de cliente desconhecido: " + cliente["tipo"])
    if qtd_total >= 50:
        pct = pct + 7
    elif qtd_total >= 10:
        pct = pct + 3
    hoje = _hoje()
    if hoje.month == 11 and hoje.day == 28:
        pct = pct + 5
        avisos.append("black friday")
    frete_gratis_cupom = False
    fixo = 0
    if cupom is not None:
        if cupom == "PRIMEIRA":
            if cliente["pedidos"] == 0:
                pct = pct + 15
            else:
                avisos.append("cupom PRIMEIRA só vale na primeira compra")
        elif cupom == "FIXO20":
            if sub >= 10000:
                fixo = 2000
            else:
                avisos.append("cupom FIXO20 exige subtotal mínimo de R$ 100,00")
        elif cupom == "FRETEGRATIS":
            frete_gratis_cupom = True
        else:
            avisos.append("cupom inválido: " + cupom)
    if pct > 20:
        pct = 20
        avisos.append("desconto limitado a 20%")
    desconto = sub * pct // 100
    desconto = desconto + fixo
    if desconto > sub:
        desconto = sub
    base = sub - desconto
    if uf in ("SP", "RJ", "MG", "ES"):
        frete_base = 1500
        kg_extra = 500
    elif uf in ("PR", "SC", "RS"):
        frete_base = 2000
        kg_extra = 700
    else:
        if tem_pereciveis:
            raise ValueError("perecível não é entregue em " + uf)
        frete_base = 3000
        kg_extra = 1200
    kgs = (peso + 999) // 1000
    frete = frete_base
    if kgs > 1:
        frete = frete + (kgs - 1) * kg_extra
    if expresso:
        frete = frete * 2
    if base >= 30000 and not expresso:
        frete = 0
    elif frete_gratis_cupom:
        if expresso:
            frete = frete // 2
        else:
            frete = 0
    if cliente["tipo"] == "ouro" and frete > 0:
        frete = frete // 2
    return {
        "subtotal": sub,
        "desconto": desconto,
        "frete": frete,
        "total": base + frete,
        "avisos": avisos,
    }
