# Plano de Implementação: Atualização do Currículo 2026 e Geração Completa Antecipada dos Módulos (M00-M13)

> **Documento histórico do planejamento inicial.** A execução vigente foi substituída em 14/08/2026 pelo [`docs/PLANO-ESTRUTURACAO-CURSO-2026.md`](docs/PLANO-ESTRUTURACAO-CURSO-2026.md). Consulte também a [`matriz de rastreabilidade`](docs/MATRIZ-RASTREABILIDADE.md), a [`política de fontes e agnosticismo`](docs/POLITICA-FONTES-E-AGNOSTICISMO.md) e o [`status de implementação`](docs/STATUS-IMPLEMENTACAO-CURSO.md). Em caso de conflito, esses quatro documentos e o `CURRICULO.md` prevalecem sobre o conteúdo abaixo.

Este plano define a estratégia para reestruturar e gerar antecipadamente **todos os 14 módulos de estudo** (HTML autossuficiente) da trilha de Engenheiro de Software + IA (nível Sênior, transição de .NET para Python & Ecossistema de IA em 2026, agnóstico de ferramentas).

---

## 1. Visão Geral da Análise do Projeto Atual

### Estrutura Existente
- **`CLAUDE.md`**: Constituição do repositório. Define o perfil do aluno (Denisson, Sênior .NET 10+ anos), regras didáticas estritas (sempre começar com analogia .NET, blocos de contexto obrigatórios para novidades, sem perguntas socráticas durante estudo, código Python completo/tipado, avaliação concentrada no checkpoint).
- **`CURRICULO.md`**: Trilha de 14 módulos (~218h / 111 blocos) dividida em 4 fases:
  - **Fase 0 (M00–M04)**: *Desenvolver software USANDO IA* (SDD, Harness, Python tipado, FastAPI, Design Docs com IA).
  - **Fase 1 (M05–M07)**: *Engenharia de LLM* (Gateways, Cache, Evals/Observabilidade, RAG de produção com ACL/Busca Híbrida).
  - **Fase 2 (M08–M10)**: *Agentes, Protocolos e Grafos* (Context Engineering, MCP/A2A, LangGraph, GraphRAG, Métricas de Saúde Arquitetural).
  - **Fase 3 (M11–M13)**: *Produção, Teoria e Produto* (PyTorch do zero, SLMs/Ollama local vs Agentes, OWASP Top 10 para LLM, Billing/Idempotência/SRE, Capstone).
- **`PROGRESSO.md`**: Placar e diário de aprendizado do aluno.
- **`modulos/`**: Atualmente contém apenas `M00-ferramental/` (com `M00.html` e `bloco-4-mcp-e-hooks.html`).

---

## 2. Ações Cruciais & Melhorias de Conteúdo para 2026

> [!IMPORTANT]
> **Revisão e Aprovação Solicitada antes da Geração**: Por favor, avalie os pontos de ajuste abaixo para garantir total alinhamento com sua expectativa.

### A. Total Agnolicismo de Ferramentas (Além do Claude Code)
Em 2026, o ecossistema de agentes CLI e IDEs evoluiu para múltiplos atores (**Claude Code, OpenCode, Codex, Antigravity, Cursor, Windsurf**).
- **Ajuste Didático**: Todos os módulos ensinarão os **fundamentos subjacentes dos harnesses de agente**:
  - Manipulação de contextos (`system_prompt`, `tools`, `context_window`, truncagem, sumarização progressiva).
  - Protocolos abertos: **MCP (Model Context Protocol)** e **A2A (Agent-to-Agent)** via stdio e HTTP/SSE.
  - Regras de prompts e harnesses universais que funcionam em qualquer agente CLI ou estendível.
  - Diferença crítica entre **harness determinístico** e **capacidade de tool-calling do modelo**.

### B. Ponte Alavancada para Dev Sênior .NET (10 anos)
Aproveitar o conhecimento sênior corporativo como alavanca contínua em todos os módulos:
- **Paralelos Diretos**:
  - `C# Task / async-await` ⟷ `Python asyncio` (comparando scheduler, ownership e escopo do event loop sem afirmar Task=ThreadPool ou loop único por processo).
  - `ASP.NET Core DI / Middleware` ⟷ `FastAPI Depends / Middleware`.
  - `Entity Framework Core + Migrations` ⟷ `SQLAlchemy 2.0 Async + Alembic`.
  - `FluentValidation + DTOs` ⟷ `Pydantic v2`.
  - `xUnit / Moq` ⟷ `pytest / pytest-mock / fixtures`.
  - `Polly (Resilience & Transient Fault Handling)` ⟷ `AI Gateways (LiteLLM, Tenacity, Circuit Breaker)`.
  - `Sagas / Workflow Engines` ⟷ `LangGraph / State Machines para Agentes`.
  - `Idempotência & Transações Bancárias` ⟷ `Guardrails de Ações Destrutivas em Agentes`.

### C. Geração Antecipada Completa (M00 a M13 em HTML)
Em vez de gerar material dinamicamente durante as aulas, geraremos **todos os módulos prévios em HTML autossuficientes** com:
- Design visual consistente (paleta CSS idêntica ao `M00.html` com suporte a Dark Mode).
- Teoria profunda, desenvolvida, sem enrolação.
- Diagramas visuais SVG embutidos diretamente no HTML.
- Blocos de tradução `.NET` (`.box.net`), alertas (`.box.warn`, `.box.ok`), e caixas de contexto para pré-requisitos (`.box`).
- Código executável em Python 3.14 no laboratório; fragmentos didáticos devem ser explicitamente marcados e ligados ao exemplo verificado.
- Guia passo a passo prático com saída esperada no terminal.
- Tabela de Diagnóstico (Sintoma ⟶ Causa ⟶ Solução).
- Resumo conciso de conclusão.
- Checkpoint de avaliação rigoroso e não-consultivo no final.

---

## 3. Perguntas Abertas para Confirmação do Usuário

> [!QUESTION]
> **1. Estrutura dos Arquivos de Módulo**: Prefere que cada módulo tenha um arquivo HTML único e denso contendo todos os seus blocos (ex: `modulos/M01-workflow-ia-driven/M01.html`), acompanhado do seu `README.md` de índice, mantendo a estrutura exata do M00?
>
> **2. Execução com Subagentes**: Como a geração de 13 módulos completos com HTML extenso, código executável e diagramas SVG demanda alto volume de escrita, propomos dividir a execução por Fases do Currículo utilizando subagentes especializados, mantendo o agente principal como orquestrador para garantir a coerência entre as peças do projeto Capstone. Concorda com essa abordagem de paralelização?

---

## 4. Mudanças Propostas no Repositório

### Fase A: Atualização do Currículo (`CURRICULO.md`)
- Refinar tópicos dos 14 módulos para explicitar a visão agnóstica de ferramentas (Claude Code, OpenCode, Antigravity, Codex, etc.) e o aprofundamento nos padrões de 2026 (SDD, Evals, Harness Engineering, Multi-agent, GraphRAG, LLM Security).

### Fase B: Geração do Conteúdo dos Módulos em HTML (`modulos/MXX-*/MXX.html`)

#### [MODIFY] [CURRICULO.md](CURRICULO.md)
Refinar descrições e garantir agnosticismo total e pontes com .NET em 2026.

#### [NEW] Módulos HTML Completos (`modulos/MXX-nome/MXX.html` + `README.md`):
- **`modulos/M00-ferramental/`**: Atualizar/completar eventuais lacunas dos blocos 4 e 5.
- **`modulos/M01-workflow-ia-driven/M01.html`**: SDD, Spec Kit, Harness Engineering, Guardrails mecânicos, 12-Factor Agents.
- **`modulos/M02-python-para-dev-dotnet/M02.html`**: Python 3.14, padrões PyPA/typing, `uv` como adapter, limites do Pydantic, asyncio estruturado, paralelismo e estratégia de testes.
- **`modulos/M03-fastapi-postgres-docker-ci/M03.html`**: FastAPI, Async SQLAlchemy 2.0, Postgres JSONB/pgvector, Docker multi-stage, CI/CD.
- **`modulos/M04-design-docs-com-ia/M04.html`**: PRD, C4 em Mermaid, ADRs, Postmortems, Manutenção automatizada de docs.
- **`modulos/M05-llm-pratica-gateway-cache/M05.html`**: Tokenização, Structured Output, Tool Calling, Prompt Caching, AI Gateways (LiteLLM), Fallbacks.
- **`modulos/M06-evals-observabilidade/M06.html`**: Evals em CI, Datasets por taxonomia (Golden path, Injection, Edge cases), LLM-as-judge, Tracing (Langfuse/OpenTelemetry).
- **`modulos/M07-rag-de-verdade/M07.html`**: Chunking semântico, pgvector, Busca Híbrida (BM25 + Vetores), Reranking, ACLs/Filtro de Segurança, Abstenção.
- **`modulos/M08-agentes-e-context-engineering/M08.html`**: Workflow vs Agente, Padrões compostáveis, Context Engineering, Tool Design, Guardrails de resiliência.
- **`modulos/M09-protocolos-mcp-e-a2a/M09.html`**: Servidores MCP (stdio e HTTP/SSE), A2A Protocol, Agent Cards, Segurança em protocolos de ferramentas.
- **`modulos/M10-graph-engineering-saude-arquitetural/M10.html`**: LangGraph (máquina de estados), GraphRAG (Neo4j/Postgres AGE), Métricas de Saúde Arquitetural (Main Sequence, I, A, Distância).
- **`modulos/M11-fundamentos-ml-dl-modelos-locais/M11.html`**: Transformer/Atenção PyTorch em ~200 linhas, LLMs abertos (Ollama, DeepSeek), Por que modelos bons em código falham em modo agente.
- **`modulos/M12-producao-seguranca-sre-billing/M12.html`**: OWASP Top 10 para LLM, Idempotência em chamadas de IA, Human-in-the-loop mecânico, Multi-tenant RLS, Billing/Stripe, SRE com IA.
- **`modulos/M13-capstone/M13.html`**: Guia de execução e lançamento do produto Capstone ponta a ponta.

---

## 5. Plano de Verificação

### Verificação Automatizada e Manual
1. **Validação de Sintaxe HTML/CSS**: Verificar se cada `MXX.html` abre corretamente, valida estruturalmente e possui estilos responsivos/Dark Mode ativados.
2. **Validação de Código Python**: O código canônico do laboratório deve executar em Python 3.14 com lint, typing e testes; snippets completos devem ser extraídos/validados e fragmentos precisam ser rotulados como tais.
3. **Verificação de Integridade dos Exercícios e Capstone**: Garantir que as peças entregues nos mini-projetos dos módulos M01 a M12 se encaixam perfeitamente na arquitetura do produto final do M13.
4. **Verificação Didática (`CLAUDE.md`)**: Confirmar se 100% dos módulos possuem:
   - Analogias .NET no início de cada conceito.
   - Caixas de contexto para termos não ensinados previamente.
   - Tabelas de Diagnóstico e Checkpoint ao final.
