"""Block 3: pure functions, immutability, functools and a pipeline."""

import gc
import weakref
from collections.abc import Callable, Iterable
from dataclasses import dataclass, replace
from datetime import date
from functools import cache, partial, reduce, singledispatch
from itertools import accumulate
from types import MappingProxyType

# --- pure vs impure -------------------------------------------------------------------------

_total_global = 0


def somar_impuro(valor: int) -> int:
    global _total_global
    _total_global += valor
    return _total_global


def somar_puro(total: int, valor: int) -> int:
    return total + valor


def idade_impura(nascimento: date) -> int:
    hoje = date.today()
    return (
        hoje.year - nascimento.year - ((hoje.month, hoje.day) < (nascimento.month, nascimento.day))
    )


def idade(nascimento: date, hoje: date) -> int:
    return (
        hoje.year - nascimento.year - ((hoje.month, hoje.day) < (nascimento.month, nascimento.day))
    )


# --- immutability ---------------------------------------------------------------------------


@dataclass(frozen=True, slots=True)
class Ponto:
    x: int
    y: int


def deslocar(p: Ponto, dx: int) -> Ponto:
    return replace(p, x=p.x + dx)


@dataclass(frozen=True)
class Raso:
    itens: list[int]


CONFIG = MappingProxyType({"moeda": "BRL"})

# --- higher-order functions and functools -----------------------------------------------------


def percentual(taxa: int, valor: int) -> int:
    return valor * taxa // 100


dez_por_cento = partial(percentual, 10)


def compor[T](*funcoes: Callable[[T], T]) -> Callable[[T], T]:
    def composta(valor: T) -> T:
        return reduce(lambda acc, f: f(acc), funcoes, valor)

    return composta


@cache
def fib(n: int) -> int:
    return n if n < 2 else fib(n - 1) + fib(n - 2)


_chamadas_taxa = 0


@cache
def cotacao_cacheada(moeda: str) -> int:
    """Impure on purpose: the value depends on a counter standing in for the market."""
    global _chamadas_taxa
    _chamadas_taxa += 1
    return 500 + _chamadas_taxa


class Calculadora:
    @cache  # noqa: B019 - the leak is the point of the example
    def dobro(self, x: int) -> int:
        return 2 * x


def instancia_sobrevive_ao_cache() -> bool:
    calc = Calculadora()
    calc.dobro(21)
    ref = weakref.ref(calc)
    del calc
    gc.collect()
    return ref() is not None


@singledispatch
def descrever(valor: object) -> str:
    return f"objeto {type(valor).__name__}"


@descrever.register
def _(valor: int) -> str:
    return f"inteiro {valor}"


@descrever.register
def _(valor: list) -> str:  # type: ignore[type-arg]
    return f"lista de {len(valor)}"


# --- a pipeline -----------------------------------------------------------------------------


@dataclass(frozen=True, slots=True)
class Venda:
    produto: str
    valor: int
    cancelada: bool = False


def faturamento_por_produto(vendas: Iterable[Venda]) -> dict[str, int]:
    validas = (v for v in vendas if not v.cancelada)
    totais: dict[str, int] = {}
    for v in validas:
        totais[v.produto] = totais.get(v.produto, 0) + v.valor
    return dict(sorted(totais.items(), key=lambda kv: (-kv[1], kv[0])))


def saldo_acumulado(movimentos: Iterable[int]) -> list[int]:
    return list(accumulate(movimentos))
