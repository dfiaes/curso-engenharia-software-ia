# M03 · FastAPI, Postgres, Docker, CI

## Visão geral

O módulo que mata o gap de DevOps: de "git push pro Azure e alguém configurou o resto" para construir, containerizar, testar contra banco real, automatizar e publicar sozinho. Os 8 blocos estão completos nesta versão — incluindo Docker (bloco 5), testes de integração com containers (bloco 6) e CI/CD + deploy (bloco 7), que faltavam na versão anterior do material. A peça entregue é o esqueleto do backend do Capstone, no ar.

## Conteúdo do módulo

- **Material principal (HTML):** [`M03.html`](M03.html) — abra no navegador
- **Carga:** 8 blocos de 2h (16h)
- **Pré-requisito:** M02 (asyncio, Pydantic e pytest são usados sem re-explicação)

## Estrutura dos blocos

1. **Bloco 1:** FastAPI — mapa ASP.NET→FastAPI; a assinatura é a configuração; `Depends` (DI por função, escopo request, override em teste); middleware; lifespan; fundamentos de HTTP/REST (idempotência de verbos, status codes como contrato).
2. **Bloco 2:** SQLAlchemy 2.0 async + Alembic — AsyncSession=DbContext; a pegadinha `MissingGreenlet` (provocada de propósito); ACID e lost update; migrations com revisão obrigatória e downgrade testado.
3. **Bloco 3:** Postgres para valer — índices (B-tree, composto, parcial, GIN), EXPLAIN ANALYZE lido de verdade sobre 500k linhas, JSONB com GIN para a cauda variável de produtos de IA.
4. **Bloco 4:** Estrutura que escala — api/services/repositories/core com regras de import viradas lei via import-linter; coesão/acoplamento/Dependency Rule (gancho para as métricas do M10).
5. **Bloco 5:** Docker do zero — imagem/camada/container; Dockerfile de produção linha a linha (multi-stage, cache, não-root, healthcheck, stdout); Compose com rede, volume e service_healthy.
6. **Bloco 6:** Testes de integração — testcontainers + transação-envelope + client ASGI com override de DI; determinismo; o teste de 50 gathers que prova o lost update.
7. **Bloco 7:** GitHub Actions e deploy — pipeline quality→imagem(SHA)→deploy; Fly.io com release_command para migrations; config no ambiente; rollback ensaiado.
8. **Bloco 8:** Mini-projeto — encurtador completo em produção (redirect atômico, paginação, rate limit, p95 medido) + esqueleto do Capstone deployado.

## Entregáveis

- Encurtador em produção com URL pública e pipeline verde ponta a ponta.
- Suíte de integração com Postgres real (testcontainers), incluindo o teste do lost update.
- import-linter como guardrail de arquitetura no check.sh e no CI.
- **Esqueleto do Capstone no ar**: `/health` + `/projects`, migrations, testes, deploy por push.

## Fundamentos reciclados neste módulo

Semântica HTTP e idempotência de verbos · ACID e níveis de isolamento (lost update provado em teste) · índices e leitura de plano de execução · coesão, acoplamento e Dependency Rule · 12-Factor App (config, logs, paridade de ambientes) · as três perguntas de release (detecção, rollback, banco).
