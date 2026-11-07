# Atualização de afirmações voláteis

Registro das afirmações do curso que mudam com o tempo: recursos de ferramentas de IA, preços, versões, leis, normas e estatísticas de mercado. Atualizado em 07/11/2026, com base numa varredura dos `modulos/*/*.html`.

## Objetivo e regra

Toda afirmação sobre produto, preço, versão, lei ou estatística de mercado precisa de três coisas no texto do módulo: a data de verificação, a fonte e o prazo de revalidação.

| Tipo de afirmação | Prazo de revalidação |
|---|---|
| Recurso de ferramenta de IA (Claude Code, Codex, Cursor, OpenCode, Copilot, frameworks de agentes) | 30 dias |
| Cloud, preços, cotas, versões de modelo e de API | 90 dias |
| Regulação, normas e padrões (EU AI Act, PL 2338, ANPD, NIST, OWASP, RFC, MCP spec) | 180 dias |

Afirmação sem data não entra em módulo novo. Afirmação com prazo vencido não é corrigida só no registro: o autor revisa o módulo.

Exemplos com preço hipotético (E01, E02, M05 quando dizem "hipotético") não são fatos de mercado e não precisam de revalidação. Devem dizer que são hipotéticos.

## Processo mensal

1. Rodar a revisão. Pode ser uma tarefa agendada com um agente de pesquisa que lê as fontes da lista abaixo e compara com a tabela.
2. Listar as mudanças: linha, o que mudou, fonte e data.
3. O autor decide o que muda no texto. O agente não edita o módulo sozinho.
4. Atualizar o módulo e a data de verificação no próprio HTML.
5. Registrar aqui: nova data em "Verificado em", novo "Revalidar até", e uma linha em "Histórico".

Depois dos passos 4 e 5, rodar `uv run --with markdown python tools/build_course_portal.py` e `python3 tools/check_course.py`.

## Fontes a acompanhar

- Claude Code: documentação e changelog oficiais.
- OpenAI Codex: documentação oficial (developers.openai.com, que redireciona para learn.chatgpt.com) e changelog.
- Cursor: documentação oficial, incluindo Bugbot e hooks.
- OpenCode: documentação oficial e changelog.
- Model Context Protocol: especificação oficial (modelcontextprotocol.io).
- A2A: especificação oficial.
- OWASP: GenAI / Top 10 for LLM Applications; ASVS; Password Storage Cheat Sheet.
- NIST: AI RMF 1.0; AI 600-1 (GenAI Profile); SSDF SP 800-218 e 800-218A.
- EU AI Act: texto no EUR-Lex (Regulamento (UE) 2024/1689) e cronograma do Digital Omnibus on AI.
- ANPD: site oficial, notas técnicas e resoluções do Conselho Diretor. PL 2338/2023: tramitação na Câmara.
- DORA: dora.dev e página de IA do relatório.
- Blogs de engenharia: Google (ex.: Elephant-Goldfish Model, out/2026), Anthropic e OpenAI.
- Repositórios de skills da comunidade: só como exemplo, nunca como padrão.

Fonte primária vem primeiro (especificação, documentação oficial, texto da lei). Blog e levantamento de terceiros entram rotulados como complemento.

## Afirmações a revalidar

Ordenadas por módulo. "Vencido" significa que o prazo passou em 07/11/2026.

| Módulo | Assunto | Verificado em | Revalidar até | Fonte/observação |
|---|---|---|---|---|
| A01 | Recursos de Cursor, Codex, OpenCode e Claude Code (rules, skills, hooks, subagents, MCP) | 12/10/2026 | 11/11/2026 | Docs oficiais; recurso de ferramenta (30 dias) |
| A01 | Caminhos de instrução e precedência (AGENTS.md, .cursor/rules, CLAUDE.md) | 12/10/2026 | 11/11/2026 | Docs oficiais |
| A01 | Políticas gerenciadas e allowlist de MCP (MDM, requirements.toml, managed config) | 12/10/2026 | 11/11/2026 | Docs oficiais |
| A01 | Cursor Bugbot (BUGBOT.md, bugbot.yaml, neutral por padrão) | 12/10/2026 | 11/11/2026 | Docs do Cursor |
| M00 | Claude Code: CLAUDE.md não lê AGENTS.md; skills e .claude/commands | 15/08/2026 | 14/09/2026 (vencido) | Docs do Claude Code; texto cita 14/08 e 15/08 |
| M00 | Codex: slash commands e custom prompts (deprecated); Copilot | 15/08/2026 | 14/09/2026 (vencido) | Docs do Codex e do Copilot |
| M01 | Panorama industrial de ferramentas | 14/08/2026 | 18/11/2026 | Data já declarada no módulo |
| M02A | DORA como sistema; métricas de entrega; relatório 2025 | 15/08/2026 | 13/11/2026 | Texto do módulo pede 90 dias |
| M02A | Normas citadas (OWASP, NIST) | 15/08/2026 | 10/02/2027 | Norma: 180 dias |
| M03 | PostgreSQL MVCC e transações; RFC 9110 e 9457; GitHub Actions hardening | 21/08/2026 | 19/11/2026 | Documentação de banco e plataforma (90 dias) |
| M03 | SQLAlchemy asyncio, Alembic, Testcontainers, FastAPI dependencies | 13/09/2026 | 12/12/2026 | Documentação de framework (90 dias) |
| M05 | Preços de referência: Opus 5, Sonnet 5, Haiku 4.5 (retrato ago/2026) | 14/09/2026 | 13/12/2026 | Preço: 90 dias; tabela oficial antes de decidir |
| M05 | Versões pinadas (`claude-sonnet-5`) e mínimo de tokens para cache (512, 1.024, 4.096) | 14/09/2026 | 13/12/2026 | Documentação de API |
| M05 | Multiplicadores de cache (escrita 1,25x, leitura 0,1x) | 14/09/2026 | 13/12/2026 | Documentação de prompt caching |
| M07 | Modelos de embedding: dimensões, preços e versões | 14/09/2026 | 13/12/2026 | Documentação do provedor |
| M08 | Frameworks de agentes: SDK unificado, suporte a MCP e A2A | 14/09/2026 | 14/10/2026 (vencido) | Recurso de ferramenta (30 dias) |
| M09 | MCP specification: estado e recursos | 14/09/2026 | 13/03/2027 | Especificação oficial (180 dias) |
| M09 | A2A specification: Task, INPUT_REQUIRED, cards | 14/09/2026 | 13/03/2027 | Especificação oficial (180 dias) |
| M10 | Bibliotecas de grafos e checkpointing (interrupt, retomada) | 14/09/2026 | 14/10/2026 (vencido) | Recurso de ferramenta (30 dias) |
| M11 | URLs e benchmarks de modelos locais (spec §6) | 14/09/2026 | 13/12/2026 | Risco alto no módulo; 90 dias |
| M12 | Baseline de produção: OWASP ASVS, PostgreSQL, OpenTelemetry, RFCs | 14/08/2026 | 12/11/2026 | Módulo pede revisão a cada turma |
| M12 | Preços de entrada e saída usados no billing | 14/08/2026 | 12/11/2026 | Preço: 90 dias; manter hipotético se não houver tabela real |
| LT01 | Especificações e URLs (spec §7) | 14/08/2026 | 12/11/2026 | URLs na especificação; 90 dias |
| LT02 | Especificações e URLs (spec §8); demo externa, risco alto | 14/08/2026 | 12/11/2026 | URLs na especificação; 90 dias |
| LT03 | NIST SP 800-145 e normativas de cloud | 14/08/2026 | 12/11/2026 | Norma, mas o módulo marca 90 dias |
| LT04 | NIST AI RMF, AI 600-1, SSDF SP 800-218, TEVV | 14/08/2026 | 10/02/2027 | Norma: 180 dias |
| E01 | Preços de provedor, cota, batch e prompt caching usados como referência | 11/10/2026 | 09/01/2027 | Preço: 90 dias; exemplos hipotéticos não precisam |
| E02 | Ofertas de fine-tuning por API e preço de inferência do modelo ajustado | 11/10/2026 | 10/11/2026 | Recurso de produto (30 dias); vence em 3 dias |
| E02 | Computer use e documentação da Anthropic (estado de 11/10/2026) | 11/10/2026 | 10/11/2026 | Recurso de produto (30 dias) |
| E02 | Levantamento de fine-tuning por fornecedor (AI Prompts Hub, 21/06/2026) | 21/06/2026 | 19/09/2026 (vencido) | Fonte de terceiros; revalidar ou remover |
| E02 | Modelos de raciocínio: preço e acerto (Classmethod, 13/07/2026) | 13/07/2026 | 11/10/2026 (vencido) | Fonte de terceiros; rotulada no módulo |
| E03 | PL 2338/2023: Senado em 10/12/2024; Câmara (status de 24/08/2026) | 24/08/2026 | 20/02/2027 | Projeto de lei: 180 dias; acompanhar a tramitação |
| E03 | EU AI Act: cronograma, Digital Omnibus, art. 50 desde 2/8/2026 | 11/10/2026 | 10/04/2027 | Regulação: 180 dias; fonte secundária marcada com (*) |
| E03 | ANPD: Nota Técnica 12/2025 e resoluções CD/ANPD 19/2024 e 15/2024 | 11/10/2026 | 10/04/2027 | Autoridade: 180 dias |
| E03 | NIST AI RMF 1.0 (26/01/2023) e AI 600-1 (26/07/2024) | 11/10/2026 | 10/04/2027 | Norma: 180 dias |
| E04 | Relatórios DORA de IA (set/2025, "ROI of AI-assisted..."; citação de 2026) | 11/10/2026 | 09/01/2027 | Pesquisa externa: 90 dias; o módulo diz que a data do ROI não aparece na página |
| E05 | LinkedIn "fastest-growing jobs for 2026" (07/01/2026) | 11/10/2026 | 09/01/2027 | Estatística de mercado: 90 dias |
| E05 | OWASP Top 10 for LLM Applications | 11/10/2026 | 10/04/2027 | Norma: 180 dias |
| F01 | Saídas de execução (Git 2.34.1) | 11/10/2026 | 09/01/2027 | Versão de ferramenta; rever com nova execução |
| F02, F03, F05 | Saídas de execução (Python 3.14.7, uv 0.12.13, SQLite 3.53.1) | 11/10/2026 | 09/01/2027 | Versões: 90 dias |
| F04 | OWASP Password Storage Cheat Sheet (Argon2id, parâmetros mínimos) | 11/10/2026 | 10/04/2027 | Norma: 180 dias |
| P01 | Azure: nomes de produto (Microsoft Foundry, Container Apps, Azure Monitor), RBAC e federated credentials | 11/10/2026 | 09/01/2027 | Cloud: 90 dias; build Docker e deploy real não executados |

## Tópicos novos na fila

| Tópico | Destino | Status |
|---|---|---|
| Elephant-Goldfish Model (blog de engenharia do Google, out/2026) | Entra primeiro na Trilha rápida e depois na A01 | A fazer |
| Mapa de conceitos: agente, bot, subagente, regra, comando, skill, hook, MCP, plugin | Trilha rápida | A fazer |
| Revisar ofertas de fine-tuning | E02, junto da linha de ofertas (vence em 10/11/2026) | A fazer |

## Histórico

- 07/11/2026: registro criado a partir da varredura dos módulos. Nenhuma afirmação foi revalidada nesta rodada; as datas são as que os módulos declaram.
