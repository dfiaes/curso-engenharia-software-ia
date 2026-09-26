"""Contrato único, dois adapters (AT-001/002/003)."""

from __future__ import annotations

import pytest

from llm_gateway.contract import ChatMessage, ChatRequest, Provider
from llm_gateway.fake_providers import EchoFake, ScriptedFake
from llm_gateway.structured import require_complete_finish


def _request(text: str = "olá") -> ChatRequest:
    return ChatRequest(messages=(ChatMessage(role="user", content=text),))


async def _contract_suite(provider: Provider) -> None:
    response = await provider.complete(_request())
    assert response.finish_reason == "end_turn"
    assert response.content
    assert response.input_tokens > 0 and response.output_tokens > 0
    assert response.model == provider.name
    assert response.latency_ms >= 0.0


async def test_echo_passas_na_suite() -> None:
    await _contract_suite(EchoFake())


async def test_roteiro_passas_na_suite() -> None:
    await _contract_suite(ScriptedFake(rules=(("preço", "custa caro"),)))


async def test_roteiro_responde_por_regra() -> None:
    fake = ScriptedFake(rules=(("preço", "custa caro"),))
    response = await fake.complete(_request("qual o preço?"))
    assert response.content == "custa caro"


async def test_determinismo_mesma_entrada() -> None:
    fake = EchoFake()
    first = await fake.complete(_request("x"))
    second = await fake.complete(ChatRequest(messages=(ChatMessage(role="user", content="x"),)))
    assert first.content.removeprefix("eco[1]: ") == second.content.removeprefix("eco[2]: ")


async def test_truncamento_e_erro_explicito() -> None:
    with pytest.raises(Exception, match="truncada"):
        require_complete_finish("max_tokens", "texto parcial {")
    assert require_complete_finish("end_turn", "ok") == "ok"
