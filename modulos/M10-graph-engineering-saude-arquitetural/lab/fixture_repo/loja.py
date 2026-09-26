"""Fixture: pacote Python pequeno com chamadas, ciclo e morto (autoria do curso)."""

from abc import ABC, abstractmethod


class Repositorio(ABC):
    """Contrato abstrato de persistência (para a métrica A)."""

    @abstractmethod
    def salvar(self, chave: str, valor: str) -> None:
        """Persiste um par."""


class PedidoService:
    """Vendas: valida, totaliza e fecha."""

    def validar(self, itens: list) -> bool:
        """Valida antes de fechar."""
        return len(itens) > 0

    def calcular_total(self, itens: list[float]) -> float:
        """Soma simples. Chamado por fechar_pedido."""
        return round(sum(itens), 2)

    def fechar_pedido(self, itens: list) -> int:
        """Fecha pedido: valida e totaliza."""
        if not self.validar(itens):
            return -1
        return hash(self.calcular_total(itens)) % 100000


class Auditoria:
    """Consome vendas de outro componente (aresta entre componentes)."""

    def auditar(self, itens: list) -> int:
        """Audita fechando pedido no componente de vendas."""
        return PedidoService.fechar_pedido(itens)


class Ping:
    """Ciclo proposital: ping chama pong e vice-versa."""

    def ping(self) -> str:
        """Ida do ciclo."""
        return self.pong()

    def pong(self) -> str:
        """Volta do ciclo."""
        return self.ping()


def rotina_morta() -> str:
    """Nunca chamada por ninguém: candidata a morta."""
    return "esquecida"
