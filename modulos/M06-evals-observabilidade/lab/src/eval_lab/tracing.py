"""Tracing sanitizado em memória (lote M06).

Espelha as convenções GenAI do OpenTelemetry (nomes `gen_ai.*`) sem
exportador externo: o que importa aqui é a POLÍTICA de conteúdo.
Metadados sempre (tokens, custo, latência, tag, modelo, hash);
conteúdo (prompt, resposta, código, justificativa) NUNCA — tentar
registrar levanta `ContentLeakage`. O hash do input permite correlacionar
falhas repetidas sem guardar a entrada.
"""

from __future__ import annotations

import hashlib
import itertools
from dataclasses import dataclass, field

CONTEUDO_PROIBIDO = frozenset(
    {"prompt", "response", "content", "messages", "codigo", "justificativa"}
)


class ContentLeakage(ValueError):
    """Tentativa de registrar conteúdo na telemetria (bloqueado)."""


def input_hash(texto: str) -> str:
    """Hash curto da entrada para correlação sem armazenamento."""
    return hashlib.sha256(texto.encode()).hexdigest()[:16]


@dataclass(slots=True)
class Span:
    trace_id: str
    operation: str
    attributes: dict[str, object] = field(default_factory=dict)


class SpanRecorder:
    """Gravador em memória com política de conteúdo executável."""

    def __init__(self) -> None:
        self._spans: list[Span] = []
        self._ids = itertools.count(1)

    def record(self, operation: str, attributes: dict[str, object]) -> Span:
        """Registra; chave proibida levanta antes de gravar qualquer coisa."""
        vazadas = [k for k in attributes if k.lower() in CONTEUDO_PROIBIDO]
        if vazadas:
            raise ContentLeakage(f"conteúdo na telemetria bloqueado: {vazadas}")
        span = Span(
            trace_id=f"trace-{next(self._ids):04d}",
            operation=operation,
            attributes=dict(attributes),
        )
        self._spans.append(span)
        return span

    def spans(self) -> list[Span]:
        """Cópia dos spans registrados."""
        return list(self._spans)
