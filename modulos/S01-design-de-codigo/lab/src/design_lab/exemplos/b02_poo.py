"""Block 2: fragile base class, composition, MRO, mangling and Protocol vs ABC."""

from abc import ABC, abstractmethod
from collections.abc import Sequence
from typing import Protocol, runtime_checkable

# --- fragile base class ---------------------------------------------------------------------


class ColecaoV1:
    def __init__(self) -> None:
        self.itens: list[str] = []

    def adicionar(self, x: str) -> None:
        self.itens.append(x)

    def adicionar_varios(self, xs: Sequence[str]) -> None:
        for x in xs:
            self.adicionar(x)


class ColecaoV2:
    """Same public behavior as V1; ``adicionar_varios`` was optimized."""

    def __init__(self) -> None:
        self.itens: list[str] = []

    def adicionar(self, x: str) -> None:
        self.itens.append(x)

    def adicionar_varios(self, xs: Sequence[str]) -> None:
        self.itens.extend(xs)


class ContadaPorHerancaV1(ColecaoV1):
    def __init__(self) -> None:
        super().__init__()
        self.total = 0

    def adicionar(self, x: str) -> None:
        self.total += 1
        super().adicionar(x)

    def adicionar_varios(self, xs: Sequence[str]) -> None:
        self.total += len(xs)
        super().adicionar_varios(xs)


class ContadaPorHerancaV2(ColecaoV2):
    def __init__(self) -> None:
        super().__init__()
        self.total = 0

    def adicionar(self, x: str) -> None:
        self.total += 1
        super().adicionar(x)

    def adicionar_varios(self, xs: Sequence[str]) -> None:
        self.total += len(xs)
        super().adicionar_varios(xs)


class Armazem(Protocol):
    itens: list[str]

    def adicionar(self, x: str) -> None: ...

    def adicionar_varios(self, xs: Sequence[str]) -> None: ...


class ContadaPorComposicao:
    def __init__(self, interna: Armazem) -> None:
        self._interna = interna
        self.total = 0

    def adicionar(self, x: str) -> None:
        self.total += 1
        self._interna.adicionar(x)

    def adicionar_varios(self, xs: Sequence[str]) -> None:
        self.total += len(xs)
        self._interna.adicionar_varios(xs)


# --- MRO and cooperative super() ------------------------------------------------------------


class Base:
    def passos(self) -> list[str]:
        return ["Base"]


class Auditoria(Base):
    def passos(self) -> list[str]:
        return ["Auditoria", *super().passos()]


class Cache(Base):
    def passos(self) -> list[str]:
        return ["Cache", *super().passos()]


class Servico(Auditoria, Cache):
    def passos(self) -> list[str]:
        return ["Servico", *super().passos()]


class Quebrado(Base):
    def passos(self) -> list[str]:
        return ["Quebrado"]  # forgot super(): the chain stops here


class ServicoComEloQuebrado(Auditoria, Quebrado, Cache):
    def passos(self) -> list[str]:
        return ["ServicoComEloQuebrado", *super().passos()]


def nomes_mro(cls: type) -> list[str]:
    return [c.__name__ for c in cls.__mro__]


def tentar_mro_inconsistente() -> str:
    try:
        type("X", (Base, Auditoria), {})
    except TypeError as erro:
        return str(erro)
    return "sem erro"


# --- encapsulation by convention ------------------------------------------------------------


class Conta:
    def __init__(self, saldo: int) -> None:
        self._saldo = saldo
        self.__historico: list[int] = [saldo]

    @property
    def saldo(self) -> int:
        return self._saldo

    def depositar(self, valor: int) -> None:
        if valor <= 0:
            raise ValueError("depósito deve ser positivo")
        self._saldo += valor
        self.__historico.append(self._saldo)

    def n_movimentos(self) -> int:
        return len(self.__historico)


class ContaPoupanca(Conta):
    def __init__(self, saldo: int) -> None:
        super().__init__(saldo)
        self.__historico = [-1]  # a different attribute: _ContaPoupanca__historico

    def historico_da_subclasse(self) -> list[int]:
        return self.__historico


# --- Protocol vs ABC ------------------------------------------------------------------------


class NotificadorABC(ABC):
    @abstractmethod
    def enviar(self, destino: str, texto: str) -> None: ...


class IncompletoABC(NotificadorABC):
    pass


@runtime_checkable
class NotificadorProtocol(Protocol):
    def enviar(self, destino: str, texto: str) -> None: ...


class AssinaturaErrada:
    def enviar(self) -> None: ...


def instanciar_incompleto() -> str:
    try:
        IncompletoABC()  # type: ignore[abstract]
    except TypeError as erro:
        return str(erro)
    return "sem erro"
