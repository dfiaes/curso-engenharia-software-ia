"""Gateway: fallback, timeout, teto de retry, telemetria e custo (AT-013..017)."""

from __future__ import annotations

from llm_gateway.cache import ExactCache
from llm_gateway.contract import ChatMessage, ChatRequest, ProviderError
from llm_gateway.fake_providers import EchoFake, FlakyProvider, SlowProvider
from llm_gateway.gateway import CostLedger, Gateway


def _request(text: str = "olá") -> ChatRequest:
    return ChatRequest(messages=(ChatMessage(role="user", content=text),))


async def test_fallback_responde_sem_cliente_perceber() -> None:
    primary = FlakyProvider(EchoFake("primario"), fail_times=99)
    gateway = Gateway(primary, EchoFake("reserva"))
    response = await gateway.complete(_request())
    assert response.model == "reserva"
    assert gateway.ledger.records[-1].fallback_used is True


async def test_retry_recupera_antes_do_fallback() -> None:
    flaky = FlakyProvider(EchoFake("primario"), fail_times=2)
    gateway = Gateway(flaky, EchoFake("reserva"), max_retries=2)
    response = await gateway.complete(_request())
    assert response.model == "primario"
    assert flaky.attempts == 3  # 1 inicial + 2 retries: teto respeitado


async def test_retry_storm_e_impossivel() -> None:
    flaky = FlakyProvider(EchoFake("primario"), fail_times=1000)
    gateway = Gateway(flaky, FlakyProvider(EchoFake("reserva"), fail_times=1000), max_retries=2)
    try:
        await gateway.complete(_request())
        raise AssertionError("deveria falhar")
    except ProviderError:
        pass
    assert flaky.attempts == 3  # 1 + 2 retries, depois fallback único que também falha


async def test_timeout_vira_fallback() -> None:
    slow = SlowProvider(EchoFake("lento"), delay_s=30.0)
    gateway = Gateway(slow, EchoFake("reserva"), timeout_s=0.05)
    response = await gateway.complete(_request())
    assert response.model == "reserva"


async def test_cache_economiza_chamada_e_ledger_conta() -> None:
    primary = EchoFake("primario")
    cache = ExactCache()
    gateway = Gateway(primary, EchoFake("reserva"), cache=cache, price_model="classe-rapida")
    first = await gateway.complete(_request())
    second = await gateway.complete(_request())
    assert primary.calls == 1
    assert second.content == first.content
    assert cache.stats.hits == 1
    assert gateway.ledger.total_usd() > 0.0
    relatorio = gateway.ledger.report()
    assert "custo total" in relatorio and "hits de cache: 1" in relatorio


async def test_telemetria_registra_modelo_e_tokens() -> None:
    gateway = Gateway(EchoFake("primario"), EchoFake("reserva"))
    await gateway.complete(_request())
    record = gateway.ledger.records[-1]
    assert record.model_used == "primario"
    assert record.input_tokens > 0 and record.latency_ms >= 0.0
    assert isinstance(gateway.ledger, CostLedger)
