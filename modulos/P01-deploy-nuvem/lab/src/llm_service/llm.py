"""Contrato do LLM, adapter fake (padrão) e adapter Azure OpenAI (opcional, sem chave)."""

import asyncio
import importlib
import json
from collections.abc import AsyncGenerator, Awaitable, Callable
from dataclasses import dataclass
from typing import Any, Protocol

import httpx

from llm_service.config import ConfigError, Settings

TokenProvider = Callable[[], Awaitable[str]]


@dataclass(frozen=True, slots=True)
class Usage:
    input_tokens: int
    output_tokens: int


@dataclass(frozen=True, slots=True)
class Completion:
    text: str
    usage: Usage
    model: str


@dataclass(frozen=True, slots=True)
class Chunk:
    """Um pedaço de stream. O último pedaço traz `usage`; os anteriores, `text`."""

    text: str = ""
    usage: Usage | None = None


class LLMError(Exception):
    """Falha do provedor que não vale retry (autenticação, requisição inválida, resposta ruim)."""


class LLMUnavailable(LLMError):
    """Falha transitória (429, 5xx, timeout): o cliente pode tentar de novo."""

    def __init__(self, message: str, retry_after_s: int | None = None) -> None:
        super().__init__(message)
        self.retry_after_s = retry_after_s


class LLMClient(Protocol):
    model: str

    def ready(self) -> bool:
        """Pronto para atender? Não faz chamada de rede."""
        ...

    async def complete(self, prompt: str) -> Completion: ...

    def stream(self, prompt: str) -> AsyncGenerator[Chunk]: ...

    async def aclose(self) -> None: ...


def count_tokens(text: str) -> int:
    """Contagem didática: uma palavra, um token. Provedores reais devolvem a contagem exata."""
    return len(text.split())


class FakeLLM:
    """Resposta determinística, sem rede. Permite injetar falha, atraso e observar cancelamento."""

    model = "fake-echo"

    def __init__(
        self,
        *,
        fail_with: Exception | None = None,
        delay_s: float = 0.0,
        is_ready: bool = True,
    ) -> None:
        self.fail_with = fail_with
        self.delay_s = delay_s
        self.is_ready = is_ready
        self.stream_cancelled = False
        self.closed = False

    def ready(self) -> bool:
        return self.is_ready

    @staticmethod
    def _answer(prompt: str) -> str:
        return "eco: " + prompt

    async def complete(self, prompt: str) -> Completion:
        if self.delay_s:
            await asyncio.sleep(self.delay_s)
        if self.fail_with is not None:
            raise self.fail_with
        text = self._answer(prompt)
        return Completion(text, Usage(count_tokens(prompt), count_tokens(text)), self.model)

    async def stream(self, prompt: str) -> AsyncGenerator[Chunk]:
        text = self._answer(prompt)
        try:
            for word in text.split():
                if self.delay_s:
                    await asyncio.sleep(self.delay_s)
                if self.fail_with is not None:
                    raise self.fail_with
                yield Chunk(text=word + " ")
            yield Chunk(usage=Usage(count_tokens(prompt), count_tokens(text)))
        except asyncio.CancelledError:
            self.stream_cancelled = True
            raise
        except GeneratorExit:
            self.stream_cancelled = True
            raise

    async def aclose(self) -> None:
        self.closed = True


class AzureOpenAIAdapter:
    """Chama o endpoint compatível com OpenAI (`/openai/v1/`) com token Entra ID, nunca com chave.

    `token_provider` é uma corrotina que devolve o bearer token; em produção vem de
    `azure.identity.aio` (ver `build_token_provider`). Nos testes é uma função fake.
    """

    def __init__(
        self,
        endpoint: str,
        deployment: str,
        token_provider: TokenProvider,
        client: httpx.AsyncClient,
    ) -> None:
        self.model = deployment
        self._url = endpoint.rstrip("/") + "/openai/v1/chat/completions"
        self._token_provider = token_provider
        self._client = client

    def ready(self) -> bool:
        return True

    async def _headers(self) -> dict[str, str]:
        token = await self._token_provider()
        return {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}

    def _body(self, prompt: str, *, stream: bool) -> dict[str, Any]:
        body: dict[str, Any] = {
            "model": self.model,
            "messages": [{"role": "user", "content": prompt}],
            "stream": stream,
        }
        if stream:
            body["stream_options"] = {"include_usage": True}
        return body

    @staticmethod
    def _raise_for_status(response: httpx.Response) -> None:
        status = response.status_code
        if status < 400:
            return
        if status == 429 or status >= 500:
            raw = response.headers.get("retry-after", "")
            retry = int(raw) if raw.isdigit() else None
            raise LLMUnavailable(f"provedor respondeu {status}", retry)
        if status in (401, 403):
            raise LLMError("identidade sem permissão no recurso de modelo (verifique o RBAC)")
        raise LLMError(f"provedor rejeitou a requisição ({status})")

    async def complete(self, prompt: str) -> Completion:
        try:
            response = await self._client.post(
                self._url, headers=await self._headers(), json=self._body(prompt, stream=False)
            )
        except httpx.TimeoutException as exc:
            raise LLMUnavailable("timeout falando com o provedor") from exc
        except httpx.TransportError as exc:
            raise LLMUnavailable("falha de rede falando com o provedor") from exc
        self._raise_for_status(response)
        try:
            data = response.json()
            text = str(data["choices"][0]["message"]["content"])
            usage = Usage(
                int(data["usage"]["prompt_tokens"]), int(data["usage"]["completion_tokens"])
            )
        except (KeyError, IndexError, TypeError, ValueError) as exc:
            raise LLMError("resposta do provedor fora do formato esperado") from exc
        return Completion(text, usage, self.model)

    async def stream(self, prompt: str) -> AsyncGenerator[Chunk]:
        try:
            async with self._client.stream(
                "POST",
                self._url,
                headers=await self._headers(),
                json=self._body(prompt, stream=True),
            ) as response:
                if response.status_code >= 400:
                    await response.aread()
                self._raise_for_status(response)
                async for line in response.aiter_lines():
                    if not line.startswith("data:"):
                        continue
                    payload = line.removeprefix("data:").strip()
                    if payload == "[DONE]":
                        return
                    chunk = self._parse_event(payload)
                    if chunk is not None:
                        yield chunk
        except httpx.TimeoutException as exc:
            raise LLMUnavailable("timeout falando com o provedor") from exc
        except httpx.TransportError as exc:
            raise LLMUnavailable("falha de rede falando com o provedor") from exc

    @staticmethod
    def _parse_event(payload: str) -> Chunk | None:
        try:
            event = json.loads(payload)
            usage = event.get("usage")
            if usage:
                return Chunk(
                    usage=Usage(int(usage["prompt_tokens"]), int(usage["completion_tokens"]))
                )
            choices = event.get("choices") or []
            if not choices:
                return None
            text = choices[0].get("delta", {}).get("content")
        except (ValueError, KeyError, TypeError, AttributeError) as exc:
            raise LLMError("evento de stream fora do formato esperado") from exc
        return Chunk(text=text) if text else None

    async def aclose(self) -> None:
        await self._client.aclose()


def build_token_provider(scope: str) -> TokenProvider:
    """Token provider assíncrono via `azure.identity.aio` (extra opcional `azure`).

    `DefaultAzureCredential` assíncrono não bloqueia o event loop ao renovar o token; a versão
    síncrona bloquearia todas as requisições em voo durante a renovação.
    """
    try:
        identity = importlib.import_module("azure.identity.aio")
    except ModuleNotFoundError as exc:
        raise ConfigError("instale o extra opcional: uv sync --extra azure") from exc
    credential = identity.DefaultAzureCredential()
    provider: TokenProvider = identity.get_bearer_token_provider(credential, scope)
    return provider


def build_llm(settings: Settings) -> LLMClient:
    if settings.llm_backend == "fake":
        return FakeLLM()
    client = httpx.AsyncClient(timeout=httpx.Timeout(settings.upstream_timeout_s, connect=5.0))
    return AzureOpenAIAdapter(
        settings.azure_endpoint,
        settings.azure_deployment,
        build_token_provider(settings.azure_scope),
        client,
    )
