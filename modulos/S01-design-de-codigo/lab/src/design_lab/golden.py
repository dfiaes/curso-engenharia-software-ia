"""Characterization cases: inputs we choose, outputs we *observe* from the legacy code.

The golden file is never written by hand. ``cli golden --write`` runs the legacy
function over ``CASOS`` and stores what it answers, right or wrong.
"""

import json
import random
from collections.abc import Callable
from dataclasses import dataclass, field
from datetime import date
from pathlib import Path
from typing import Any
from unittest import mock

from design_lab import legado
from design_lab.pedidos.compat import calcular_pedido_dict

type Saida = dict[str, Any]

HOJE = date(2026, 3, 10)
BLACK_FRIDAY = date(2026, 11, 28)


def item(
    sku: str, preco: int, qtd: int = 1, peso_g: int = 500, categoria: str | None = None
) -> dict[str, Any]:
    d: dict[str, Any] = {"sku": sku, "preco": preco, "qtd": qtd, "peso_g": peso_g}
    if categoria is not None:
        d["categoria"] = categoria
    return d


def cli(tipo: str = "regular", pedidos: int = 3) -> dict[str, Any]:
    return {"tipo": tipo, "pedidos": pedidos}


@dataclass(frozen=True, slots=True)
class Caso:
    nome: str
    itens: tuple[dict[str, Any], ...]
    cliente: dict[str, Any] = field(default_factory=cli)
    cupom: str | None = None
    uf: str = "SP"
    expresso: bool = False
    hoje: date = HOJE


A5000 = item("A", 5000)

CASOS: tuple[Caso, ...] = (
    Caso("basico_sudeste", (A5000,)),
    Caso("pedido_vazio", ()),
    Caso("quantidade_zero", (item("Z", 100, qtd=0),)),
    Caso("tipo_desconhecido", (A5000,), cliente=cli("diamante")),
    Caso("ouro_10pct", (A5000,), cliente=cli("ouro")),
    Caso("prata_5pct", (A5000,), cliente=cli("prata")),
    Caso("regular_fiel_10_pedidos", (A5000,), cliente=cli("regular", 10)),
    Caso("regular_9_pedidos_sem_desconto", (A5000,), cliente=cli("regular", 9)),
    Caso("volume_10_itens", (item("V", 1000, qtd=10),)),
    Caso("volume_9_itens_borda", (item("V", 1000, qtd=9),)),
    Caso("volume_50_itens", (item("V", 1000, qtd=50),)),
    Caso("black_friday", (A5000,), hoje=BLACK_FRIDAY),
    Caso("cupom_primeira_ok", (A5000,), cliente=cli("regular", 0), cupom="PRIMEIRA"),
    Caso("cupom_primeira_negado", (A5000,), cliente=cli("regular", 2), cupom="PRIMEIRA"),
    Caso("cupom_fixo20_ok", (item("F", 12000),), cupom="FIXO20"),
    Caso("cupom_fixo20_exato_10000", (item("F", 10000),), cupom="FIXO20"),
    Caso("cupom_fixo20_subtotal_baixo", (item("F", 9999),), cupom="FIXO20"),
    Caso("cupom_fretegratis", (A5000,), cupom="FRETEGRATIS"),
    Caso("cupom_invalido", (A5000,), cupom="PROMO99"),
    Caso("cupom_vazio_nao_e_none", (A5000,), cupom=""),
    Caso(
        "teto_20pct",
        (item("V", 1000, qtd=50),),
        cliente=cli("ouro", 0),
        cupom="PRIMEIRA",
    ),
    Caso("frete_sul", (A5000,), uf="RS"),
    Caso("frete_outras_regioes", (A5000,), uf="BA"),
    Caso("perecivel_fora_do_alcance", (item("P", 3000, categoria="perecivel"),), uf="BA"),
    Caso("perecivel_no_sudeste", (item("P", 3000, categoria="perecivel"),), uf="MG"),
    Caso("peso_1001g_conta_2kg", (item("H", 5000, peso_g=1001),)),
    Caso("peso_zero", (item("H", 5000, peso_g=0),)),
    Caso("expresso", (A5000,), expresso=True),
    Caso("frete_gratis_exato_30000", (item("G", 30000),)),
    Caso("frete_pago_29999", (item("G", 29999),)),
    Caso("expresso_nao_ganha_frete_gratis", (item("G", 40000),), expresso=True),
    Caso("expresso_com_cupom_fretegratis", (A5000,), cupom="FRETEGRATIS", expresso=True),
    Caso("ouro_frete_pela_metade", (A5000,), cliente=cli("ouro")),
    Caso(
        "ouro_expresso_cupom_fretegratis",
        (A5000,),
        cliente=cli("ouro"),
        cupom="FRETEGRATIS",
        expresso=True,
    ),
)


def _normalizar(chamada: Callable[[], dict[str, Any]]) -> Saida:
    try:
        return {"ok": chamada()}
    except ValueError as erro:
        return {"erro": str(erro)}


def rodar_legado(caso: Caso) -> Saida:
    itens = [dict(i) for i in caso.itens]
    with mock.patch.object(legado, "_hoje", return_value=caso.hoje):
        return _normalizar(
            lambda: legado.calcular_pedido(
                itens, dict(caso.cliente), caso.cupom, caso.uf, caso.expresso
            )
        )


def rodar_refatorado(caso: Caso) -> Saida:
    return _normalizar(
        lambda: dict(
            calcular_pedido_dict(
                caso.itens, caso.cliente, caso.cupom, caso.uf, caso.expresso, caso.hoje
            )
        )
    )


def observar() -> dict[str, Saida]:
    """What the legacy code answers today, per case name."""
    return {c.nome: rodar_legado(c) for c in CASOS}


def escrever(caminho: Path) -> None:
    dados = json.dumps(observar(), indent=2, ensure_ascii=False, sort_keys=True)
    caminho.write_text(dados + "\n", encoding="utf-8")


def carregar(caminho: Path) -> dict[str, Saida]:
    carregado: dict[str, Saida] = json.loads(caminho.read_text(encoding="utf-8"))
    return carregado


# --- differential testing: random inputs, two implementations, one answer -----------------

_UFS = ("SP", "RJ", "MG", "ES", "PR", "SC", "RS", "BA", "AM", "ZZ")
_CUPONS = (None, None, "PRIMEIRA", "FIXO20", "FRETEGRATIS", "XYZ")
_TIPOS = ("regular", "regular", "prata", "ouro")


def caso_aleatorio(rng: random.Random, indice: int) -> Caso:
    n_itens = 0 if rng.random() < 0.01 else rng.randint(1, 4)
    itens = tuple(
        item(
            f"S{indice}-{k}",
            rng.randint(100, 20000),
            qtd=0 if rng.random() < 0.02 else rng.choice((1, 1, 2, 5, 9, 10, 11, 30, 50)),
            peso_g=rng.randint(0, 3000),
            categoria="perecivel" if rng.random() < 0.03 else None,
        )
        for k in range(n_itens)
    )
    tipo = rng.choice(_TIPOS) if rng.random() < 0.97 else "diamante"
    return Caso(
        f"aleatorio_{indice}",
        itens,
        cliente=cli(tipo, rng.randint(0, 15)),
        cupom=rng.choice(_CUPONS),
        uf=rng.choice(_UFS),
        expresso=rng.random() < 0.3,
        hoje=rng.choice((HOJE, BLACK_FRIDAY)),
    )


def divergencias(
    n: int,
    seed: int,
    candidato: Callable[[Caso], Saida] = rodar_refatorado,
) -> list[tuple[Caso, Saida, Saida]]:
    rng = random.Random(seed)
    achadas = []
    for i in range(n):
        caso = caso_aleatorio(rng, i)
        esperado, obtido = rodar_legado(caso), candidato(caso)
        if esperado != obtido:
            achadas.append((caso, esperado, obtido))
    return achadas
