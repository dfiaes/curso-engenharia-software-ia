"""Ledger de demonstração: dinheiro em centavos (int), nunca float."""


def registrar(ledger: dict[str, int], chave: str, centavos: int) -> int:
    """Soma idempotente por chave."""
    if chave in ledger:
        return ledger[chave]
    ledger[chave] = centavos
    return centavos
