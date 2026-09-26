"""Fixture: repositório Python pequeno para investigar (autoria do curso)."""


def validar_entrada(valor: object) -> bool:
    """Valida entrada antes de persistir."""
    if valor is None:
        return False
    return len(str(valor).strip()) > 0


def calcular_total(itens: list[float], desconto: float = 0.0) -> float:
    """Total com desconto. Chamado por fechar_pedido."""
    base = sum(itens)
    return round(base * (1 - desconto), 2)


def fechar_pedido(itens: list[float]) -> int:
    """Fecha pedido sem validar: débito técnico conhecido."""
    total = calcular_total(itens)
    return hash(total) % 100000
