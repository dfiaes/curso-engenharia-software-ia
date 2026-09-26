"""Adapters falsos determinísticos (lote M05).

Dois backends distintos atrás do mesmo `Provider`:

- `EchoFake`: devolve eco modelado com usage calculado do texto;
- `ScriptedFake`: responde por regras (palavra-chave -> resposta pronta),
  incluindo saídas JSON e propostas de tool call para os testes.

Decoradores de falha (`FlakyProvider`, `SlowProvider`) simulam 5xx e
lentidão SEM rede, para os testes de retry/timeout. Nenhum teste
obrigatório usa rede, conta ou crédito.
"""

from __future__ import annotations

import asyncio
import time

from llm_gateway.contract import (
    ChatRequest,
    ChatResponse,
    Provider,
    ProviderError,
    ToolCall,
)
from llm_gateway.tokenizer import estimate_tokens


class EchoFake:
    """Eco determinístico: mesma entrada, mesma saída, sempre."""

    def __init__(self, model: str = "fake-eco-1") -> None:
        self._model = model
        self.calls = 0

    @property
    def name(self) -> str:
        return self._model

    async def complete(self, request: ChatRequest) -> ChatResponse:
        start = time.perf_counter()
        self.calls += 1
        user_text = next((m.content for m in reversed(request.messages) if m.role == "user"), "")
        content = f"eco[{self.calls}]: {user_text[:80]}"
        in_tokens = sum(estimate_tokens(m.content) for m in request.messages)
        return ChatResponse(
            content=content,
            input_tokens=in_tokens,
            output_tokens=estimate_tokens(content),
            model=self._model,
            finish_reason="end_turn",
            latency_ms=(time.perf_counter() - start) * 1000.0,
        )


class ScriptedFake:
    """Respostas roteirizadas por predicado sobre o último texto do usuário."""

    def __init__(
        self,
        rules: tuple[tuple[str, str], ...] = (),
        model: str = "fake-roteiro-1",
        default: str = "resposta padrão do roteiro",
    ) -> None:
        self._rules = rules
        self._model = model
        self._default = default
        self.calls = 0

    @property
    def name(self) -> str:
        return self._model

    async def complete(self, request: ChatRequest) -> ChatResponse:
        start = time.perf_counter()
        self.calls += 1
        user_text = next((m.content for m in reversed(request.messages) if m.role == "user"), "")
        lowered = user_text.lower()
        content = self._default
        for keyword, answer in self._rules:
            if keyword.lower() in lowered:
                content = answer
                break
        truncated = len(content) > request.max_tokens * 4
        return ChatResponse(
            content=content if not truncated else content[: request.max_tokens * 4],
            input_tokens=sum(estimate_tokens(m.content) for m in request.messages),
            output_tokens=estimate_tokens(content),
            model=self._model,
            finish_reason="max_tokens" if truncated else "end_turn",
            latency_ms=(time.perf_counter() - start) * 1000.0,
        )


class ToolCallFake:
    """Propõe exatamente uma tool call por pedido (para o loop de tools)."""

    def __init__(self, tool_name: str, arguments: dict[str, object]) -> None:
        self._tool_name = tool_name
        self._arguments = arguments
        self.calls = 0

    @property
    def name(self) -> str:
        return "fake-tool-1"

    async def complete(self, request: ChatRequest) -> ChatResponse:
        self.calls += 1
        if self.calls == 1:
            return ChatResponse(
                content="",
                input_tokens=10,
                output_tokens=5,
                model=self.name,
                finish_reason="tool_use",
                tool_calls=(
                    ToolCall(id="call-1", name=self._tool_name, arguments=self._arguments),
                ),
                latency_ms=0.1,
            )
        return ChatResponse(
            content="concluído com a ferramenta",
            input_tokens=10,
            output_tokens=5,
            model=self.name,
            finish_reason="end_turn",
            latency_ms=0.1,
        )


class FlakyProvider:
    """Falha `fail_times` vezes com `error` e depois delega (para retry)."""

    def __init__(
        self, inner: Provider, fail_times: int, error: ProviderError | None = None
    ) -> None:
        self._inner = inner
        self._remaining = fail_times
        self._error = error or ProviderError("falha transitória simulada")
        self.attempts = 0

    @property
    def name(self) -> str:
        return f"flaky({self._inner.name})"

    async def complete(self, request: ChatRequest) -> ChatResponse:
        self.attempts += 1
        if self._remaining > 0:
            self._remaining -= 1
            raise self._error
        return await self._inner.complete(request)


class SlowProvider:
    """Dorme `delay_s` antes de delegar (para timeout). Sem I/O real."""

    def __init__(self, inner: Provider, delay_s: float) -> None:
        self._inner = inner
        self._delay_s = delay_s

    @property
    def name(self) -> str:
        return f"slow({self._inner.name})"

    async def complete(self, request: ChatRequest) -> ChatResponse:
        await asyncio.sleep(self._delay_s)
        return await self._inner.complete(request)
