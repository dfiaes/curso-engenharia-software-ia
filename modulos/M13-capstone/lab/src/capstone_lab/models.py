"""Gateway de modelos: porta, fake local e normalizações (M13 B8).

Invariantes:
- O domínio depende apenas da porta ``ModelGateway`` e dos tipos internos
  (``ModelRequest``/``ModelResponse``/``NormalizedError``); nenhum SDK
  proprietário aparece fora de um adapter.
- Erros de qualquer adapter são normalizados para ``ErrorKind`` fechado;
  ``usage`` (tokens/custo) segue o mesmo formato em todos.
- Adapters reais (OpenAI/Anthropic/locais via rede) ficam BLOCKED neste
  ambiente (sem rede/credenciais) — ver RASTREABILIDADE; nada é simulado
  como se fosse chamada real.
"""

from __future__ import annotations

import json
import time
from collections.abc import Callable
from dataclasses import dataclass
from enum import StrEnum
from typing import Any, Protocol


class ErrorKind(StrEnum):
    TIMEOUT = "timeout"
    RATE_LIMIT = "rate_limit"
    INVALID_OUTPUT = "invalid_output"
    BUDGET_EXCEEDED = "budget_exceeded"
    UNAVAILABLE = "unavailable"


@dataclass(frozen=True)
class Usage:
    input_tokens: int
    output_tokens: int
    cost_usd: float


@dataclass(frozen=True)
class ModelRequest:
    prompt: str
    schema: dict[str, Any] | None = None  # structured output (JSON Schema)
    timeout_s: float = 5.0
    max_retries: int = 2


@dataclass(frozen=True)
class ModelResponse:
    content: str
    usage: Usage
    structured: dict[str, Any] | None = None


@dataclass(frozen=True)
class NormalizedError(Exception):
    kind: ErrorKind
    provider: str
    detail: str


class ModelGateway(Protocol):
    name: str

    def complete(self, request: ModelRequest) -> ModelResponse: ...


class FakeModelAdapter:
    """Adapter determinístico para testes: respostas declaradas por prompt.

    Declarado explicitamente como FAKE: nenhuma chamada sai do processo.
    """

    name = "fake"

    def __init__(self, script: dict[str, str] | None = None, latency_s: float = 0.0) -> None:
        self._script = script or {}
        self._latency = latency_s
        self.calls: list[str] = []

    def complete(self, request: ModelRequest) -> ModelResponse:
        start = time.monotonic()
        self.calls.append(request.prompt)
        content = self._script.get(request.prompt, "")
        if self._latency > request.timeout_s:
            raise NormalizedError(ErrorKind.TIMEOUT, self.name, "latência simulada > timeout")
        structured = None
        if request.schema is not None:
            try:
                structured = json.loads(content)
            except json.JSONDecodeError as exc:
                raise NormalizedError(
                    ErrorKind.INVALID_OUTPUT, self.name, f"JSON inválido: {exc}"
                ) from exc
        _ = time.monotonic() - start  # medido, não simulado por sleep
        tokens = len(content.split()) + len(request.prompt.split())
        return ModelResponse(
            content=content, usage=Usage(tokens, tokens, tokens * 0.0), structured=structured
        )


def with_retry_budget(
    gateway: ModelGateway, retryable: frozenset[ErrorKind]
) -> Callable[[ModelRequest], ModelResponse]:
    """Envolve o gateway com retry limitado a ``max_retries`` em erros retryable."""

    def call(request: ModelRequest) -> ModelResponse:
        attempts = request.max_retries + 1
        last: NormalizedError | None = None
        for _ in range(attempts):
            try:
                return gateway.complete(request)
            except NormalizedError as exc:
                last = exc
                if exc.kind not in retryable:
                    raise
        assert last is not None
        raise NormalizedError(
            ErrorKind.BUDGET_EXCEEDED,
            last.provider,
            f"retry budget esgotado após {attempts} tentativas",
        )

    return call
