"""Domain types for the refactored pricing: small, frozen and validated on creation."""

from dataclasses import dataclass
from enum import StrEnum

type Centavos = int


class TipoCliente(StrEnum):
    REGULAR = "regular"
    PRATA = "prata"
    OURO = "ouro"


class Regiao(StrEnum):
    SUDESTE = "sudeste"
    SUL = "sul"
    OUTRAS = "outras"


@dataclass(frozen=True, slots=True)
class Item:
    sku: str
    preco: Centavos
    qtd: int
    peso_g: int
    perecivel: bool = False

    def __post_init__(self) -> None:
        if self.qtd <= 0:
            raise ValueError(f"quantidade inválida: {self.sku}")


@dataclass(frozen=True, slots=True)
class Cliente:
    tipo: TipoCliente
    pedidos: int


@dataclass(frozen=True, slots=True)
class Pedido:
    itens: tuple[Item, ...]
    cliente: Cliente
    uf: str
    cupom: str | None = None
    expresso: bool = False

    def __post_init__(self) -> None:
        if not self.itens:
            raise ValueError("pedido vazio")

    @property
    def subtotal(self) -> Centavos:
        return sum(i.preco * i.qtd for i in self.itens)

    @property
    def peso_total_g(self) -> int:
        return sum(i.peso_g * i.qtd for i in self.itens)

    @property
    def qtd_total(self) -> int:
        return sum(i.qtd for i in self.itens)

    @property
    def tem_pereciveis(self) -> bool:
        return any(i.perecivel for i in self.itens)


@dataclass(frozen=True, slots=True)
class Resultado:
    subtotal: Centavos
    desconto: Centavos
    frete: Centavos
    total: Centavos
    avisos: tuple[str, ...] = ()

    def para_dict(self) -> dict[str, object]:
        return {
            "subtotal": self.subtotal,
            "desconto": self.desconto,
            "frete": self.frete,
            "total": self.total,
            "avisos": list(self.avisos),
        }
