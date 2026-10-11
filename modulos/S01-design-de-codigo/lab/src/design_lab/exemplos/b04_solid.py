"""Block 4: one violation and one fix per principle, plus where the fix costs more than it earns."""

from collections.abc import Callable, Mapping, Sequence
from dataclasses import dataclass
from pathlib import Path
from typing import Protocol

# --- SRP: one reason to change --------------------------------------------------------------


@dataclass(frozen=True, slots=True)
class Venda:
    produto: str
    valor: int


class RelatorioTudoJunto:
    """Calculates, formats and writes: three actors can force this class to change."""

    def __init__(self, vendas: Sequence[Venda]) -> None:
        self.vendas = vendas

    def gerar(self, destino: Path) -> str:
        total = sum(v.valor for v in self.vendas)
        texto = "\n".join(f"{v.produto}: {v.valor / 100:.2f}" for v in self.vendas)
        texto += f"\nTOTAL: {total / 100:.2f}"
        destino.write_text(texto, encoding="utf-8")
        return texto


def total_vendas(vendas: Sequence[Venda]) -> int:
    return sum(v.valor for v in vendas)


def formatar_relatorio(vendas: Sequence[Venda]) -> str:
    linhas = [f"{v.produto}: {v.valor / 100:.2f}" for v in vendas]
    return "\n".join([*linhas, f"TOTAL: {total_vendas(vendas) / 100:.2f}"])


# --- OCP: new variation without editing the old code -------------------------------------


def taxa_com_cadeia(tipo: str, valor: int) -> int:
    if tipo == "pix":
        return 0
    elif tipo == "cartao":
        return valor * 3 // 100
    elif tipo == "boleto":
        return 350
    raise ValueError(f"tipo desconhecido: {tipo}")


_TAXAS: dict[str, Callable[[int], int]] = {}


def taxa(tipo: str) -> Callable[[Callable[[int], int]], Callable[[int], int]]:
    def registrar(f: Callable[[int], int]) -> Callable[[int], int]:
        _TAXAS[tipo] = f
        return f

    return registrar


@taxa("pix")
def _taxa_pix(valor: int) -> int:
    return 0


@taxa("cartao")
def _taxa_cartao(valor: int) -> int:
    return valor * 3 // 100


@taxa("boleto")
def _taxa_boleto(valor: int) -> int:
    return 350


def calcular_taxa(tipo: str, valor: int) -> int:
    try:
        return _TAXAS[tipo](valor)
    except KeyError:
        raise ValueError(f"tipo desconhecido: {tipo}") from None


# --- LSP: a subtype must honor the base contract ---------------------------------------------


class Pagamento:
    def pagar(self, valor: int) -> str:
        return f"pago {valor}"


class PagamentoComLimite(Pagamento):
    def pagar(self, valor: int) -> str:
        if valor > 1000:
            raise ValueError("acima do limite")  # stronger precondition than the base
        return super().pagar(valor)


def fechar_compra(pagamento: Pagamento, valor: int) -> str:
    return pagamento.pagar(valor)


@dataclass(frozen=True, slots=True)
class Recusado:
    motivo: str


class PagamentoDeclarado:
    """The refusal is part of the base contract: ``pagar`` returns a str or a Recusado."""

    def pagar(self, valor: int) -> str | Recusado:
        return f"pago {valor}"


class PagamentoDeclaradoComLimite(PagamentoDeclarado):
    def pagar(self, valor: int) -> str | Recusado:
        if valor > 1000:
            return Recusado("acima do limite")
        return super().pagar(valor)


# --- ISP: depend on the slice you use ----------------------------------------------------------


class RepositorioGordo(Protocol):
    def obter(self, chave: str) -> int | None: ...
    def salvar(self, chave: str, valor: int) -> None: ...
    def remover(self, chave: str) -> None: ...
    def listar(self) -> list[str]: ...
    def contar(self) -> int: ...
    def limpar(self) -> None: ...


class Leitor(Protocol):
    def obter(self, chave: str) -> int | None: ...


def saldo_ou_zero(leitor: Leitor, chave: str) -> int:
    valor = leitor.obter(chave)
    return 0 if valor is None else valor


class LeitorFalso:
    def __init__(self, dados: Mapping[str, int]) -> None:
        self._dados = dados

    def obter(self, chave: str) -> int | None:
        return self._dados.get(chave)


# --- DIP: the policy owns the interface ----------------------------------------------------------


class SmtpClient:
    def send(self, to: str, body: str) -> None:
        raise ConnectionError("sem rede neste laboratório")


class AlertaAcoplado:
    def __init__(self) -> None:
        self._smtp = SmtpClient()  # cannot be tested without the network

    def disparar(self, to: str) -> None:
        self._smtp.send(to, "limite excedido")


class Enviador(Protocol):
    def enviar(self, destino: str, texto: str) -> None: ...


class Alerta:
    def __init__(self, enviador: Enviador) -> None:
        self._enviador = enviador

    def disparar(self, destino: str) -> None:
        self._enviador.enviar(destino, "limite excedido")


class AdaptadorSmtp:
    def __init__(self, cliente: SmtpClient) -> None:
        self._cliente = cliente

    def enviar(self, destino: str, texto: str) -> None:
        self._cliente.send(destino, texto)
