# ---------- estágio 1: builder (ferramentas de build ficam AQUI e morrem aqui)
FROM python:3.14-slim AS builder
COPY --from=ghcr.io/astral-sh/uv:latest /uv /bin/uv

WORKDIR /app
ENV UV_COMPILE_BYTECODE=1 UV_LINK_MODE=copy

# 1º: SÓ os manifests. Enquanto pyproject/uv.lock não mudarem,
# esta camada (a instalação inteira de dependências) vem do cache.
COPY pyproject.toml uv.lock ./
RUN uv sync --frozen --no-install-project --no-dev

# 2º: o código (muda toda hora, por isso vem DEPOIS das dependências)
COPY src/ src/
RUN uv sync --frozen --no-dev

# ---------- estágio 2: runtime (só o necessário para RODAR)
FROM python:3.14-slim AS runtime
WORKDIR /app

# usuário não-root: um processo comprometido não opera como root
RUN groupadd -r app && useradd -r -g app app

COPY --from=builder --chown=app:app /app/.venv /app/.venv
COPY --from=builder --chown=app:app /app/src /app/src

ENV PATH="/app/.venv/bin:$PATH" PYTHONUNBUFFERED=1
USER app
EXPOSE 8000

HEALTHCHECK --interval=15s --timeout=3s --retries=3 \
  CMD python -c "import urllib.request as u; u.urlopen('http://localhost:8000/health')"

CMD ["uvicorn", "link_shortener.serve:app", "--host", "0.0.0.0", "--port", "8000"]
