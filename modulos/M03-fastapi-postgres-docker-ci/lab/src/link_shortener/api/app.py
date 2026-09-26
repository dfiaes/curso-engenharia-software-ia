"""Aplicação HTTP do encurtador (lote B04).

Tradução pura: valida o envelope, chama o service, converte erro de
domínio em status. Nenhum SQL, nenhuma entidade do banco e nenhum
``commit`` existem neste nível — a transação pertence à dependência
(bloco 2) e a regra pertence ao service (bloco 4).
"""

from __future__ import annotations

from collections.abc import Awaitable, Callable
from typing import Annotated

from fastapi import Depends, FastAPI, Request
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker
from starlette.responses import Response

from link_shortener.api.deps import get_request_session
from link_shortener.composition import build_repository
from link_shortener.domain import DomainError, LinkNotFoundError, SlugConflictError
from link_shortener.services import link_service

RouteHandler = Callable[[Request], Awaitable[Response]]


class LinkIn(BaseModel):
    """Corpo de criação (envelope HTTP; a regra valida no service)."""

    slug: str = Field(min_length=1, max_length=16)
    url: str = Field(min_length=1, max_length=2048)


class LinkOut(BaseModel):
    """Contrato de resposta: nunca a entidade de persistência."""

    slug: str
    url: str


Session = Annotated[AsyncSession, Depends(get_request_session)]


def _problem(status: int, title: str, detail: str) -> JSONResponse:
    return JSONResponse(
        status_code=status,
        content={"type": "about:blank", "title": title, "status": status, "detail": detail},
    )


def create_app(session_factory: async_sessionmaker[AsyncSession]) -> FastAPI:
    """Monta o app com a fábrica de sessões fixada em ``app.state``."""
    app = FastAPI(title="Shortener")
    app.state.session_factory = session_factory

    @app.middleware("http")
    async def correlation_id(request: Request, call_next: RouteHandler) -> Response:
        """Preserva ou cria o correlation id sem alterar a semântica (B01)."""
        import time
        import uuid

        received = request.headers.get("x-request-id")
        try:
            rid = str(uuid.UUID(received)) if received else str(uuid.uuid4())
        except ValueError:
            rid = str(uuid.uuid4())
        start = time.perf_counter()
        response = await call_next(request)
        response.headers["x-request-id"] = rid
        response.headers["x-elapsed-ms"] = f"{(time.perf_counter() - start) * 1000:.1f}"
        return response

    @app.exception_handler(DomainError)
    async def _domain_error(_request: Request, exc: DomainError) -> JSONResponse:
        if isinstance(exc, SlugConflictError):
            return _problem(409, "slug em conflito", str(exc))
        if isinstance(exc, LinkNotFoundError):
            return _problem(404, "slug não encontrado", str(exc))
        return _problem(422, "representação inválida", str(exc))

    @app.post("/links", response_model=LinkOut, status_code=201)
    async def criar_link(body: LinkIn, session: Session) -> LinkOut:
        repo = build_repository(session)
        link = await link_service.create_link(repo, body.slug, body.url)
        return LinkOut(slug=link.slug, url=link.url)

    @app.get("/links/{slug}", response_model=LinkOut)
    async def obter_link(slug: str, session: Session) -> LinkOut:
        repo = build_repository(session)
        link = await link_service.get_link(repo, slug)
        return LinkOut(slug=link.slug, url=link.url)

    @app.get("/health")
    async def saude(request: Request) -> JSONResponse:
        """Saúde com verificação de banco: 200 up, 503 degradado (B08).

        Degrada com sinal em vez de travar: falha de conexão vira corpo
        estruturado com correlation id, e a sessão é sempre encerrada.
        """
        factory: async_sessionmaker[AsyncSession] = request.app.state.session_factory
        try:
            async with factory() as session:
                await session.execute(text("select 1"))
        except Exception as exc:
            return JSONResponse(
                status_code=503,
                content={
                    "type": "about:blank",
                    "title": "banco indisponível",
                    "status": 503,
                    "detail": f"{type(exc).__name__}: verifique a conexão e o healthcheck",
                },
            )
        return JSONResponse(status_code=200, content={"status": "ok"})

    return app
