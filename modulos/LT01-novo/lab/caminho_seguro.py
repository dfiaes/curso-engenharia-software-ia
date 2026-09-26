"""Resolucao confinada: pedido nunca escapa da base.

Referencia executavel do Bloco 2.
Implementacao verbatim na folha B02-L. So STDLIB (pathlib).
Sem rede; nega antes de qualquer I/O sensivel.
"""

from __future__ import annotations

from pathlib import Path


class EscapeNegado(ValueError):
    """Pedido resolve para fora da base: negado antes de abrir."""


def resolver_confinado(base: str, pedido: str) -> str:
    """Resolve o pedido contra a base e publica o absoluto confinado.

    Symlinks do caminho sao resolvidos; se o resultado ficar fora
    da base, levanta EscapeNegado sem tocar no destino.
    """
    raiz = Path(base).resolve()
    destino = (raiz / pedido).resolve()
    if destino != raiz and not destino.is_relative_to(raiz):
        raise EscapeNegado(f"fora da base: {pedido!r}")
    return str(destino)


def ler_confinado(base: str, pedido: str) -> bytes:
    """Resolve, nega escape e so entao le os bytes."""
    caminho = resolver_confinado(base, pedido)
    with open(caminho, "rb") as arquivo:
        return arquivo.read()
