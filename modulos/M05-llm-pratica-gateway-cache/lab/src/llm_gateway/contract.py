"""Contrato de mensagem do gateway (lote M05).

Tudo que atravessa a fronteira provedor-aplicação fala esta língua:
mensagens, parâmetros, resposta normalizada com uso e motivo de parada,
e erros tipados. Adapters (fakes aqui, SDKs reais na trilha opcional)
traduzem o formato do fornecedor para este contrato — nunca o contrário.
"""

from __future__ import annotations

from typing import Literal, Protocol

from pydantic import BaseModel, Field

FinishReason = Literal["end_turn", "max_tokens", "tool_use", "stop_sequence", "error"]


class ChatMessage(BaseModel):
    """Uma mensagem do histórico. Papéis: system, user, assistant, tool."""

    model_config = {"frozen": True}

    role: Literal["system", "user", "assistant", "tool"]
    content: str = ""
    name: str | None = None
    tool_call_id: str | None = None


class ChatRequest(BaseModel):
    """Intenção de completar: histórico + parâmetros de amostragem."""

    model_config = {"frozen": True}

    messages: tuple[ChatMessage, ...] = Field(min_length=1)
    temperature: float = Field(default=0.0, ge=0.0, le=2.0)
    top_p: float = Field(default=1.0, ge=0.0, le=1.0)
    max_tokens: int = Field(default=512, ge=1)
    stop: tuple[str, ...] = ()
    seed: int | None = None


class ToolCall(BaseModel):
    """Chamada proposta pelo modelo: nome + argumentos já parseados."""

    model_config = {"frozen": True}

    id: str
    name: str
    arguments: dict[str, object] = Field(default_factory=dict)


class ChatResponse(BaseModel):
    """Resposta normalizada: texto, uso, modelo real e motivo de parada."""

    model_config = {"frozen": True}

    content: str = ""
    input_tokens: int = Field(ge=0)
    output_tokens: int = Field(ge=0)
    model: str
    finish_reason: FinishReason
    tool_calls: tuple[ToolCall, ...] = ()
    latency_ms: float = Field(ge=0.0)


class ProviderError(Exception):
    """Falha do adapter (rede, 5xx, payload). Tentável por padrão."""


class ProviderTimeout(ProviderError):
    """A chamada estourou o timeout. Tentável em operação idempotente."""


class ProviderRateLimit(ProviderError):
    """429/quota. Tentável com espera — o gateway não espera sozinho."""


class Provider(Protocol):
    """Adapter: traduz o contrato para um backend e de volta."""

    @property
    def name(self) -> str:
        """Identificador estável do backend (ex.: 'fake-eco')."""
        ...

    async def complete(self, request: ChatRequest) -> ChatResponse:
        """Executa uma chamada. Levanta `ProviderError` nas falhas."""
        ...
