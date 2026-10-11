# M13 · Capstone Cartógrafo

Módulo final da Fase 4 (40 h). O Cartógrafo é um serviço multi-tenant que ingere snapshots autorizados de código, extrai estrutura de forma determinística, constrói retrieval e grafo, responde com citações e abstenção, e conduz workflows controlados. O M13 integra e defende esse produto.

## Como integra as fases

Cada peça vem de um módulo anterior: contratos e dados (Fase 1), gateway de modelos, evals, retrieval, agente e MCP/A2A (Fase 2), segurança, quotas, observabilidade, deploy e rollback (Fase 3), system design e defesa técnica (Fase 4). Modelos, embeddings, cobrança, storage e deploy ficam atrás de portas com fakes determinísticos; SDKs de fornecedor só entram em adapters opcionais.

## Estado real

- `M13.html` tem 20 blocos (B1–B20) com o código do lab e as saídas de teste.
- `lab/` é o pacote `capstone_lab` (Python 3.14, uv): ingestão, parsers, banco SQLite com migrations, retrieval, grafo, gateway, agente, contratos, evals, segurança, billing, observabilidade, web mínima, performance, deploy, PRR e portfólio. Verificado em 11/10/2026: `uv run pytest` passa com 147 testes.
- `evidence/m13/B01..B20/` guarda as saídas de comando de cada bloco.
- Bloqueado de verdade, com causa registrada: Docker Compose, PostgreSQL/RLS, Tree-sitter, adapters de LLM reais, Stripe, Kubernetes/nuvem e o piloto com usuário humano (B19). Nada disso é simulado.
- O PRR do B18 termina em GO; um NO-GO fundamentado também seria resultado válido.

Estado editorial do módulo: [`../../STATUS.md`](../../STATUS.md).

## Como rodar o lab

```bash
cd modulos/M13-capstone/lab
uv sync
uv run ruff check . && uv run ruff format --check .
uv run mypy
uv run pytest
```

Não precisa de conta, credencial nem rede. Para não criar `.venv` no repositório, defina `UV_PROJECT_ENVIRONMENT` fora da pasta do curso.
