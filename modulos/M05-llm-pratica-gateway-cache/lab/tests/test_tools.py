"""Tool loop com teto e erro acionável (AT-007/008)."""

from __future__ import annotations

import pytest

from llm_gateway.contract import ChatMessage, ChatRequest, ChatResponse, ToolCall
from llm_gateway.fake_providers import EchoFake, ToolCallFake
from llm_gateway.tools import ToolBudgetExceeded, ToolDefinition, ToolExecutionError, tool_loop


def _request() -> ChatRequest:
    return ChatRequest(messages=(ChatMessage(role="user", content="some os valores"),))


def _somar(args: dict[str, object]) -> str:
    valores = args["valores"]
    if not isinstance(valores, list):
        raise ValueError(f"'valores' deve ser lista, veio {type(valores).__name__}")
    return str(sum(int(v) for v in valores))


async def test_loop_pede_executa_devolve() -> None:
    provider = ToolCallFake("somar", {"valores": [2, 3]})
    tools = (ToolDefinition(name="somar", description="soma", fn=_somar),)
    assert await tool_loop(provider, _request(), tools) == "concluído com a ferramenta"


async def test_teto_de_passos() -> None:
    class SempreTool(EchoFake):
        async def complete(self, request: ChatRequest) -> ChatResponse:
            return ChatResponse(
                content="",
                input_tokens=1,
                output_tokens=1,
                model="x",
                finish_reason="tool_use",
                tool_calls=(ToolCall(id="c", name="ok", arguments={}),),
                latency_ms=0.0,
            )

    tools = (ToolDefinition(name="ok", description="sempre ok", fn=lambda args: "feito"),)
    with pytest.raises(ToolBudgetExceeded, match="3 passos"):
        await tool_loop(SempreTool(), _request(), tools, max_steps=3)


async def test_ferramenta_desconhecida_e_acionavel() -> None:
    provider = ToolCallFake("inexistente", {})
    tools = (ToolDefinition(name="somar", description="soma", fn=_somar),)
    with pytest.raises(ToolExecutionError, match="desconhecida"):
        await tool_loop(provider, _request(), tools)


async def test_argumento_invalido_e_acionavel() -> None:
    provider = ToolCallFake("somar", {"valores": "não-lista"})
    tools = (ToolDefinition(name="somar", description="soma", fn=_somar),)
    with pytest.raises(ToolExecutionError, match="inválidos"):
        await tool_loop(provider, _request(), tools)
