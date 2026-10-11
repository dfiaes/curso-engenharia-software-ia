import asyncio
import json
from collections.abc import Callable

import httpx
import pytest

from llm_service.config import ConfigError, load_settings
from llm_service.llm import AzureOpenAIAdapter, LLMError, LLMUnavailable, build_llm

ENDPOINT = "https://acct.openai.azure.com/"


async def fake_token() -> str:
    return "tok-123"


def adapter(handler: Callable[[httpx.Request], httpx.Response]) -> AzureOpenAIAdapter:
    client = httpx.AsyncClient(transport=httpx.MockTransport(handler))
    return AzureOpenAIAdapter(ENDPOINT, "gpt-x", fake_token, client)


def ok_body() -> dict[str, object]:
    return {
        "choices": [{"message": {"content": "resposta"}}],
        "usage": {"prompt_tokens": 4, "completion_tokens": 2},
    }


def test_complete_uses_bearer_token_and_v1_path_without_api_key() -> None:
    seen: list[httpx.Request] = []

    def handler(request: httpx.Request) -> httpx.Response:
        seen.append(request)
        return httpx.Response(200, json=ok_body())

    result = asyncio.run(adapter(handler).complete("oi"))
    assert result.text == "resposta" and result.usage.input_tokens == 4
    request = seen[0]
    assert request.url.path == "/openai/v1/chat/completions"
    assert request.headers["authorization"] == "Bearer tok-123"
    assert "api-key" not in request.headers
    assert json.loads(request.content)["model"] == "gpt-x"


@pytest.mark.parametrize("status", [429, 500, 503])
def test_transient_statuses_are_unavailable_with_retry_after(status: int) -> None:
    def handler(_: httpx.Request) -> httpx.Response:
        return httpx.Response(status, headers={"retry-after": "9"})

    with pytest.raises(LLMUnavailable) as err:
        asyncio.run(adapter(handler).complete("oi"))
    assert err.value.retry_after_s == 9


def test_auth_failure_points_to_rbac_and_is_not_retryable() -> None:
    with pytest.raises(LLMError, match="RBAC") as err:
        asyncio.run(adapter(lambda _r: httpx.Response(403)).complete("oi"))
    assert not isinstance(err.value, LLMUnavailable)


def test_malformed_body_is_llm_error() -> None:
    with pytest.raises(LLMError, match="formato"):
        asyncio.run(adapter(lambda _r: httpx.Response(200, json={"choices": []})).complete("oi"))


def test_timeout_is_unavailable() -> None:
    def handler(_: httpx.Request) -> httpx.Response:
        raise httpx.ReadTimeout("lento")

    with pytest.raises(LLMUnavailable):
        asyncio.run(adapter(handler).complete("oi"))


def sse(*events: object) -> bytes:
    lines = [f"data: {json.dumps(e)}\n\n" for e in events] + ["data: [DONE]\n\n"]
    return "".join(lines).encode()


def test_stream_parses_deltas_and_final_usage() -> None:
    body = sse(
        {"choices": [{"delta": {"content": "ol"}}]},
        {"choices": [{"delta": {"content": "á"}}]},
        {"choices": [], "usage": {"prompt_tokens": 3, "completion_tokens": 2}},
    )

    async def run() -> list[tuple[str, int | None]]:
        a = adapter(lambda _r: httpx.Response(200, content=body))
        return [(c.text, c.usage.output_tokens if c.usage else None) async for c in a.stream("x")]

    assert asyncio.run(run()) == [("ol", None), ("á", None), ("", 2)]


def test_stream_http_error_surfaces_before_any_chunk() -> None:
    async def run() -> None:
        a = adapter(lambda _r: httpx.Response(429))
        async for _ in a.stream("x"):
            pass

    with pytest.raises(LLMUnavailable):
        asyncio.run(run())


def test_build_llm_azure_without_extra_is_actionable(monkeypatch: pytest.MonkeyPatch) -> None:
    import importlib

    real = importlib.import_module

    def boom(name: str, package: str | None = None) -> object:
        if name == "azure.identity.aio":
            raise ModuleNotFoundError(name)
        return real(name, package)

    monkeypatch.setattr(importlib, "import_module", boom)
    settings = load_settings(
        {"LLM_BACKEND": "azure", "AZURE_OPENAI_ENDPOINT": ENDPOINT, "AZURE_OPENAI_DEPLOYMENT": "d"}
    )
    with pytest.raises(ConfigError, match="uv sync --extra azure"):
        build_llm(settings)
