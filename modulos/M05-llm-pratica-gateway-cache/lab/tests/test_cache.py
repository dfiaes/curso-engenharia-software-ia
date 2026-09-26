"""Cache: hit, TTL, invalidação e stats (AT-011/012)."""

from __future__ import annotations

import pytest

from llm_gateway.cache import ExactCache, cache_key
from llm_gateway.contract import ChatMessage, ChatRequest, ChatResponse


def _request(text: str = "quanto custa?") -> ChatRequest:
    return ChatRequest(messages=(ChatMessage(role="user", content=text),))


def _response(text: str = "resposta") -> ChatResponse:
    return ChatResponse(
        content=text,
        input_tokens=5,
        output_tokens=3,
        model="fake",
        finish_reason="end_turn",
        latency_ms=0.0,
    )


def test_chave_estavel_para_mesma_intencao() -> None:
    assert cache_key(_request()) == cache_key(_request())
    assert cache_key(_request("a")) != cache_key(_request("b"))


def test_segunda_chamada_identica_e_hit() -> None:
    cache = ExactCache()
    request = _request()
    assert cache.get(request) is None
    cache.put(request, _response())
    hit = cache.get(request)
    assert hit is not None and hit.content == "resposta"
    assert (cache.stats.hits, cache.stats.misses) == (1, 1)


def test_ttl_expirado_volta_a_chamar(monkeypatch: pytest.MonkeyPatch) -> None:
    import time

    cache = ExactCache(ttl_s=60.0)
    request = _request()
    cache.put(request, _response())
    agora = time.monotonic()
    monkeypatch.setattr(time, "monotonic", lambda: agora + 61.0)
    assert cache.get(request) is None
    assert cache.stats.evictions == 1


def test_invalidacao_explicita() -> None:
    cache = ExactCache()
    request = _request()
    cache.put(request, _response())
    assert cache.invalidate(request) is True
    assert cache.invalidate(request) is False
    assert cache.get(request) is None
