"""Block 5: patterns that earn their keep in Python."""

import logging
from collections.abc import Callable, Sequence
from dataclasses import dataclass, field
from functools import wraps
from typing import Any, Protocol

# --- Strategy as a callable ---

type Ordenacao = Callable[[str], Any]

ESTRATEGIAS: dict[str, Ordenacao] = {
    "alfabetica": str.lower,
    "tamanho": len,
}


def ordenar(nomes: Sequence[str], estrategia: str) -> list[str]:
    return sorted(nomes, key=ESTRATEGIAS[estrategia])


# --- Factory: registry + alternative constructors ---

type Formatador = Callable[[dict[str, int]], str]
_FORMATADORES: dict[str, Formatador] = {}


def formatador(nome: str) -> Callable[[Formatador], Formatador]:
    def registrar(f: Formatador) -> Formatador:
        _FORMATADORES[nome] = f
        return f

    return registrar


@formatador("csv")
def _csv(dados: dict[str, int]) -> str:
    return "\n".join(f"{k},{v}" for k, v in dados.items())


@formatador("linha")
def _linha(dados: dict[str, int]) -> str:
    return "; ".join(f"{k}={v}" for k, v in dados.items())


def criar_formatador(nome: str) -> Formatador:
    try:
        return _FORMATADORES[nome]
    except KeyError:
        raise ValueError(
            f"formato desconhecido: {nome} (disponíveis: {sorted(_FORMATADORES)})"
        ) from None


@dataclass(frozen=True, slots=True)
class Periodo:
    inicio: int
    fim: int

    @classmethod
    def de_texto(cls, texto: str) -> Periodo:
        a, _, b = texto.partition("-")
        return cls(int(a), int(b))


# --- Adapter ---


class GatewayLegado:
    """Third-party shape we do not control."""

    def cobrar_centavos(self, cartao: str, cents: int) -> dict[str, str]:
        return {"status": "OK" if cents <= 100_000 else "NEGADO", "cartao": cartao[-4:]}


class Pagamentos(Protocol):
    def pagar(self, cartao: str, valor: int) -> bool: ...


class AdaptadorGateway:
    def __init__(self, gateway: GatewayLegado) -> None:
        self._gateway = gateway

    def pagar(self, cartao: str, valor: int) -> bool:
        return self._gateway.cobrar_centavos(cartao, valor)["status"] == "OK"


# --- Decorator: the pattern and the language feature ---


class Leitura(Protocol):
    def obter(self, chave: str) -> int: ...


class FonteLenta:
    def __init__(self) -> None:
        self.consultas = 0

    def obter(self, chave: str) -> int:
        self.consultas += 1
        return len(chave)


class ComCache:
    """Decorator pattern: same interface, wraps another object, adds behavior."""

    def __init__(self, interna: Leitura) -> None:
        self._interna = interna
        self._cache: dict[str, int] = {}

    def obter(self, chave: str) -> int:
        if chave not in self._cache:
            self._cache[chave] = self._interna.obter(chave)
        return self._cache[chave]


def repetir(tentativas: int, excecoes: tuple[type[Exception], ...]) -> Callable[..., Any]:
    def decorador[**P, R](f: Callable[P, R]) -> Callable[P, R]:
        @wraps(f)
        def interna(*args: P.args, **kwargs: P.kwargs) -> R:
            for tentativa in range(1, tentativas + 1):
                try:
                    return f(*args, **kwargs)
                except excecoes:
                    if tentativa == tentativas:
                        raise
            raise AssertionError("inalcançável")

        return interna

    return decorador


def ordem_de_aplicacao() -> list[str]:
    log: list[str] = []

    def a(f: Callable[[], str]) -> Callable[[], str]:
        log.append("a aplicado")
        return lambda: "a(" + f() + ")"

    def b(f: Callable[[], str]) -> Callable[[], str]:
        log.append("b aplicado")
        return lambda: "b(" + f() + ")"

    @a
    @b
    def base() -> str:
        return "base"

    log.append(base())
    return log


# --- Observer ---

type Assinante = Callable[[str, object], None]


@dataclass
class Barramento:
    _assinantes: dict[str, list[Assinante]] = field(default_factory=dict)
    falhas: list[str] = field(default_factory=list)

    def assinar(self, evento: str, assinante: Assinante) -> None:
        self._assinantes.setdefault(evento, []).append(assinante)

    def publicar(self, evento: str, carga: object) -> None:
        for assinante in self._assinantes.get(evento, []):
            try:
                assinante(evento, carga)
            except Exception as erro:
                self.falhas.append(f"{evento}: {erro!r}")
                logging.getLogger(__name__).exception("assinante falhou")


# --- Composition root ---


class Cobranca:
    def __init__(self, pagamentos: Pagamentos) -> None:
        self._pagamentos = pagamentos

    def cobrar(self, cartao: str, valor: int) -> str:
        return "cobrado" if self._pagamentos.pagar(cartao, valor) else "recusado"


def montar_cobranca() -> Cobranca:
    """The only place that knows the concrete classes."""
    return Cobranca(AdaptadorGateway(GatewayLegado()))
