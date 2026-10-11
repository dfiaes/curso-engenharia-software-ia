"""FastAPI: health/readiness, completion, stream SSE e log de acesso com tokens."""

import asyncio
import json
import logging
import os
import re
import uuid
from collections.abc import AsyncGenerator, AsyncIterator, Mapping, MutableMapping
from contextlib import aclosing, asynccontextmanager, suppress
from dataclasses import dataclass
from time import perf_counter
from typing import Any

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse, StreamingResponse
from opentelemetry import metrics
from opentelemetry.metrics import Meter
from pydantic import BaseModel, Field
from starlette.datastructures import MutableHeaders
from starlette.types import ASGIApp, Message, Receive, Scope, Send

from llm_service.config import Settings, load_settings
from llm_service.llm import Chunk, LLMClient, LLMError, LLMUnavailable, Usage, build_llm
from llm_service.logs import LOGGER_NAME, configure_logging
from llm_service.metrics import Instruments
from llm_service.telemetry import setup_telemetry

_REQUEST_ID = re.compile(r"^[A-Za-z0-9._-]{1,64}$")


@dataclass(slots=True)
class RequestStats:
    request_id: str
    model: str = ""
    input_tokens: int = 0
    output_tokens: int = 0
    ttft_ms: float | None = None
    error: str = ""


class ProblemError(Exception):
    def __init__(
        self, status: int, title: str, detail: str, headers: Mapping[str, str] | None = None
    ) -> None:
        super().__init__(title)
        self.status = status
        self.title = title
        self.detail = detail
        self.headers = dict(headers or {})


class AccessLogMiddleware:
    """ASGI puro (não bufferiza o corpo, então não quebra SSE). Um log por requisição."""

    def __init__(self, app: ASGIApp, logger: logging.Logger) -> None:
        self.app = app
        self.logger = logger

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return
        incoming = dict(scope["headers"]).get(b"x-request-id", b"").decode("latin-1")
        request_id = incoming if _REQUEST_ID.match(incoming) else uuid.uuid4().hex
        stats = RequestStats(request_id=request_id)
        scope.setdefault("state", {})["stats"] = stats
        started = perf_counter()
        status = 500

        async def send_wrapper(message: Message) -> None:
            nonlocal status
            if message["type"] == "http.response.start":
                status = message["status"]
                MutableHeaders(scope=message)["x-request-id"] = request_id
            await send(message)

        try:
            await self.app(scope, receive, send_wrapper)
        finally:
            fields: dict[str, Any] = {
                "request_id": request_id,
                "method": scope["method"],
                "path": scope["path"],
                "status": status,
                "duration_ms": round((perf_counter() - started) * 1000, 1),
                "model": stats.model,
                "input_tokens": stats.input_tokens,
                "output_tokens": stats.output_tokens,
            }
            if stats.ttft_ms is not None:
                fields["ttft_ms"] = round(stats.ttft_ms, 1)
            if stats.error:
                fields["error"] = stats.error
            self.logger.info("request", extra={"fields": fields})


class CompleteRequest(BaseModel):
    prompt: str = Field(min_length=1)


class UsageOut(BaseModel):
    input_tokens: int
    output_tokens: int


class CompleteResponse(BaseModel):
    text: str
    model: str
    usage: UsageOut
    request_id: str


def _sse(event: str, data: Mapping[str, Any]) -> str:
    return f"event: {event}\ndata: {json.dumps(data, ensure_ascii=False)}\n\n"


async def sse_events(
    llm: LLMClient,
    prompt: str,
    *,
    keepalive_s: float,
    stats: RequestStats,
    instruments: Instruments,
) -> AsyncGenerator[str]:
    """Converte o stream do LLM em SSE, com keepalive e cancelamento do upstream.

    Um produtor lê o provedor e empilha pedaços numa fila limitada. O consumidor espera
    `keepalive_s` e, se nada chegou, emite um comentário SSE para que proxies e o ingress não
    vejam a conexão como ociosa. Se o cliente desconectar, o `finally` cancela o produtor e
    fecha o stream do provedor: tokens que ninguém lê deixam de ser gerados e cobrados.
    """
    queue: asyncio.Queue[Chunk | Exception | None] = asyncio.Queue(maxsize=16)
    stats.model = llm.model

    async def produce() -> None:
        try:
            async with aclosing(llm.stream(prompt)) as chunks:
                async for chunk in chunks:
                    await queue.put(chunk)
            await queue.put(None)
        except Exception as exc:  # repassado ao consumidor, que decide o evento de erro
            await queue.put(exc)

    started = perf_counter()
    producer = asyncio.create_task(produce())
    try:
        while True:
            try:
                item = await asyncio.wait_for(queue.get(), timeout=keepalive_s)
            except TimeoutError:
                yield ": keepalive\n\n"
                continue
            if item is None:
                return
            if isinstance(item, Exception):
                kind = "unavailable" if isinstance(item, LLMUnavailable) else "upstream"
                stats.error = kind
                instruments.record_error(llm.model, kind)
                status = 503 if kind == "unavailable" else 502
                yield _sse("error", {"status": status, "title": "falha no provedor de modelo"})
                return
            if item.usage is not None:
                stats.input_tokens = item.usage.input_tokens
                stats.output_tokens = item.usage.output_tokens
                instruments.record_call(
                    llm.model,
                    item.usage.input_tokens,
                    item.usage.output_tokens,
                    perf_counter() - started,
                )
                yield _sse(
                    "done",
                    {
                        "usage": {
                            "input_tokens": item.usage.input_tokens,
                            "output_tokens": item.usage.output_tokens,
                        }
                    },
                )
            elif item.text:
                if stats.ttft_ms is None:
                    stats.ttft_ms = (perf_counter() - started) * 1000
                yield _sse("token", {"text": item.text})
    finally:
        producer.cancel()
        with suppress(asyncio.CancelledError):
            await producer


def create_app(
    settings: Settings,
    llm: LLMClient | None = None,
    meter: Meter | None = None,
    log_stream: Any = None,
) -> FastAPI:
    logger = (
        configure_logging(log_stream) if log_stream is not None else logging.getLogger(LOGGER_NAME)
    )
    client = llm if llm is not None else build_llm(settings)
    instruments = Instruments(meter or metrics.get_meter(LOGGER_NAME))

    @asynccontextmanager
    async def lifespan(_: FastAPI) -> AsyncIterator[None]:
        yield
        await client.aclose()

    app = FastAPI(title="llm-service", lifespan=lifespan)
    app.add_middleware(AccessLogMiddleware, logger=logger)
    app.state.llm = client
    app.state.settings = settings

    @app.exception_handler(ProblemError)
    async def problem_handler(_: Request, exc: ProblemError) -> JSONResponse:
        body = {
            "type": "about:blank",
            "title": exc.title,
            "status": exc.status,
            "detail": exc.detail,
        }
        return JSONResponse(
            body, status_code=exc.status, headers=exc.headers, media_type="application/problem+json"
        )

    def check_prompt(prompt: str) -> None:
        if len(prompt) > settings.max_prompt_chars:
            raise ProblemError(
                413, "Prompt grande demais", f"o limite é {settings.max_prompt_chars} caracteres"
            )

    @app.get("/healthz")
    async def healthz() -> dict[str, str]:
        """Liveness: o processo responde. Não consulta nenhuma dependência."""
        return {"status": "ok"}

    @app.get("/readyz")
    async def readyz() -> JSONResponse:
        """Readiness: configuração válida e adapter pronto. Não faz chamada de rede."""
        if client.ready():
            return JSONResponse({"status": "ready", "backend": settings.llm_backend})
        return JSONResponse(
            {"status": "not-ready", "backend": settings.llm_backend}, status_code=503
        )

    @app.post("/v1/complete", response_model=CompleteResponse)
    async def complete(body: CompleteRequest, request: Request) -> CompleteResponse:
        stats: RequestStats = request.scope["state"]["stats"]
        check_prompt(body.prompt)
        stats.model = client.model
        started = perf_counter()
        try:
            result = await client.complete(body.prompt)
        except LLMUnavailable as exc:
            stats.error = "unavailable"
            instruments.record_error(client.model, "unavailable")
            raise ProblemError(
                503,
                "Provedor de modelo indisponível",
                "tente novamente em instantes",
                {"Retry-After": str(exc.retry_after_s or 5)},
            ) from exc
        except LLMError as exc:
            stats.error = "upstream"
            instruments.record_error(client.model, "upstream")
            raise ProblemError(502, "Falha no provedor de modelo", "consulte os logs") from exc
        usage: Usage = result.usage
        stats.input_tokens, stats.output_tokens = usage.input_tokens, usage.output_tokens
        instruments.record_call(
            result.model, usage.input_tokens, usage.output_tokens, perf_counter() - started
        )
        return CompleteResponse(
            text=result.text,
            model=result.model,
            usage=UsageOut(input_tokens=usage.input_tokens, output_tokens=usage.output_tokens),
            request_id=stats.request_id,
        )

    @app.post("/v1/stream")
    async def stream(body: CompleteRequest, request: Request) -> StreamingResponse:
        stats: RequestStats = request.scope["state"]["stats"]
        check_prompt(body.prompt)
        events = sse_events(
            client,
            body.prompt,
            keepalive_s=settings.keepalive_s,
            stats=stats,
            instruments=instruments,
        )
        return StreamingResponse(
            events,
            media_type="text/event-stream",
            headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
        )

    return app


def create_app_from_env(env: MutableMapping[str, str] | None = None) -> FastAPI:
    """Fábrica para `uvicorn --factory`: lê o ambiente, falha na partida se estiver inválido."""
    settings = load_settings(env if env is not None else os.environ)
    configure_logging()
    setup_telemetry(settings)
    return create_app(settings)
