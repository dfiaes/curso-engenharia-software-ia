"""Execucao confinada: non-root, escrita permitida e segredo fora do codigo.

Referencia executavel do Bloco 2.
Implementacao verbatim na folha B02-L. So STDLIB (os, pathlib).
Sem rede; segredo so chega por ambiente, nunca pelo codigo.
"""

from __future__ import annotations

import os
from pathlib import Path


class SegredoAusente(RuntimeError):
    """Variavel de ambiente obrigatoria ausente ou em branco."""


class EscritaNaoPermitida(PermissionError):
    """Destino fora do diretorio de dados declarado."""


def rodando_como_root() -> bool:
    """True somente com uid 0; fora de POSIX nao ha uid 0."""
    geteuid = getattr(os, "geteuid", None)
    if geteuid is None:
        return False
    return bool(geteuid() == 0)


def exige_non_root() -> None:
    """Recusa operar com privilegio total; o oraculo exige non-root."""
    if rodando_como_root():
        raise PermissionError("recusado: execute como usuario sem privilegio")


def carregar_segredo(nome: str) -> str:
    """Le segredo do ambiente; nunca do codigo, de argv ou de log."""
    valor = os.environ.get(nome, "").strip()
    if not valor:
        raise SegredoAusente(f"defina {nome} no ambiente")
    return valor


def destino_escrita_permitido(diretorio_dados: str, nome: str) -> str:
    """Publica o destino somente dentro do diretorio de dados."""
    raiz = Path(diretorio_dados).resolve()
    destino = (raiz / nome).resolve()
    if destino != raiz and not destino.is_relative_to(raiz):
        raise EscritaNaoPermitida(f"fora dos dados: {nome!r}")
    return str(destino)


def relatar_contexto(variavel_segredo: str) -> dict[str, str]:
    """Publica contexto sem jamais incluir o valor do segredo."""
    tem_segredo = "sim" if os.environ.get(variavel_segredo, "").strip() else "nao"
    return {"root": str(rodando_como_root()), "segredo_presente": tem_segredo}
