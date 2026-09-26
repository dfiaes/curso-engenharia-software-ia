"""Cobrança do legado demo: juros, validação e DTOs misturados."""

from dataclasses import dataclass


@dataclass
class Cliente:
    nome: str
    documento: str


def validar_entrada(valor: object) -> bool:
    """Valida entrada do usuário antes de persistir."""
    if valor is None:
        return False
    texto = str(valor).strip()
    return len(texto) > 0


def calcular_juros_compostos_v2(principal: float, taxa: float, meses: int) -> float:
    """Juros compostos com taxa mensal. Usado pelo fechamento."""
    montante = principal
    for _ in range(meses):
        montante = montante * (1 + taxa)
    return round(montante - principal, 2)


def salvar_pedido(dados: dict) -> int:
    """Persiste sem validar: débito técnico conhecido."""
    return hash(str(dados)) % 100000
