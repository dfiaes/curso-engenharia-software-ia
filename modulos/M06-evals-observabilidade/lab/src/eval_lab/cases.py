"""Casos de eval: o átomo do dataset (lote M06).

Um caso é entrada + expectativa verificável + o porquê. Casos são
imutáveis: correção vira `deprecated: true` mais um caso novo, nunca
edição — senão a série histórica morre.
"""

from __future__ import annotations

import json
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any


@dataclass(frozen=True, slots=True)
class Caso:
    id: str
    categoria: str
    entrada: dict[str, Any]
    espera: dict[str, Any]
    por_que: str = ""
    deprecated: bool = False
    origem: str = ""
    severidade: str = ""


def carregar_jsonl(caminho: Path) -> list[Caso]:
    """Lê um arquivo JSONL (um caso por linha), ignorando vazias."""
    casos: list[Caso] = []
    for linha in caminho.read_text(encoding="utf-8").splitlines():
        if linha.strip():
            casos.append(Caso(**json.loads(linha)))
    return casos


def carregar_pasta(pasta: Path) -> list[Caso]:
    """Carrega todos os JSONL da pasta, excluindo `deprecated`."""
    casos: list[Caso] = []
    for arquivo in sorted(pasta.glob("*.jsonl")):
        casos.extend(c for c in carregar_jsonl(arquivo) if not c.deprecated)
    return casos


@dataclass(slots=True)
class Resultado:
    caso: Caso
    passou: bool
    motivo: str
    custo_usd: float = 0.0
    latencia_ms: int = 0
    saida: dict[str, Any] = field(default_factory=dict)
