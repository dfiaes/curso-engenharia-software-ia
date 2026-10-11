# Leituras complementares por fase

Fontes externas que aprofundam os módulos do [currículo](../CURRICULO.md). Nada aqui é pré-requisito: cada módulo é autossuficiente. Use estas leituras para comparar com a fonte primária, consultar a referência completa ou seguir um assunto além do módulo. Documentação de produto, comandos, preços e limites mudam; confira a versão atual antes de aplicar uma configuração. A política de fontes está em [POLITICA-FONTES-E-AGNOSTICISMO.md](POLITICA-FONTES-E-AGNOSTICISMO.md).

## Fase 0 · Fundamentos

### F01 · Terminal, sistema de arquivos, processos e Git

- [Pro Git (pt-BR) — Scott Chacon e Ben Straub](https://git-scm.com/book/pt-br/v2): o livro oficial e gratuito de Git; referência para modelo de objetos, branches, rebase e recuperação.

### F02 · Python do zero

- [Tutorial de Python 3.14 — Python Software Foundation](https://docs.python.org/3.14/tutorial/): funções, módulos, estruturas de dados, exceções e arquivos, na semântica oficial.
- [Get started — pytest](https://docs.pytest.org/en/stable/getting-started.html): primeiros testes, descoberta e execução local.
- [CS50's Introduction to Programming with Python — Harvard](https://cs50.harvard.edu/python/): aulas e exercícios para os pontos ainda novos.

### F04 · Como a web funciona

- [Visão geral de HTTP — MDN Web Docs](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Overview): cliente, servidor, requisição, resposta, headers e códigos de estado.
- [Learn OpenAPI — OpenAPI Initiative](https://learn.openapis.org/): descrição e validação de contratos HTTP, sem confundir contrato com implementação.

### F05 · Bancos relacionais, SQL e modelagem

- [Use The Index, Luke — Markus Winand](https://use-the-index-luke.com/): como índices funcionam e como escrever SQL que os usa.

## Fase 1 · Engenharia de software

### S01 · Design de código

- [Refactoring — Martin Fowler](https://martinfowler.com/books/refactoring.html): página do livro de referência em refatoração; o catálogo de refatorações está no site do autor.
- [Refactoring.Guru — refatoração e padrões](https://refactoring.guru/refactoring): catálogo ilustrado de code smells e técnicas.

### M03 · Serviço real: FastAPI, PostgreSQL, Docker e CI

- [Tutorial do FastAPI](https://fastapi.tiangolo.com/tutorial/): validação, erros e testes para um serviço Python local.
- [Tutorial do PostgreSQL](https://www.postgresql.org/docs/current/tutorial.html): relações, consultas e transações.
- [The Twelve-Factor App](https://12factor.net/): princípios de configuração, processos e logs para serviços implantáveis.

## Fase 2 · AI Engineering

### M00 · Trabalhar com agentes de programação

- [Codex Prompting Guide — OpenAI Cookbook](https://developers.openai.com/cookbook/examples/gpt-5/codex_prompting_guide): padrões de tarefa, contexto e verificação no Codex; comandos e modelos são específicos do produto.
- [Best practices for Claude Code — Anthropic](https://code.claude.com/docs/en/best-practices): exploração, planejamento, implementação e verificação, mais contexto, permissões e sandbox no Claude Code.
- [Run long horizon tasks with Codex — OpenAI Developers](https://developers.openai.com/blog/run-long-horizon-tasks-with-codex): tarefas longas; separe princípios transferíveis de recursos do produto.
- [Agents — OpenCode](https://opencode.ai/docs/agents): agentes primários e subagentes como exemplo de harness.

### M01 · Desenvolvimento orientado a especificação e execução paralela

- [Config basics — OpenAI Codex](https://developers.openai.com/codex/config-file/config-basic): configuração pessoal e do projeto, precedência, modelo, esforço, aprovações e sandbox.
- [Rules — OpenCode](https://opencode.ai/docs/rules): `AGENTS.md`, inicialização e precedência de instruções.
- [Customize Cursor — Cursor](https://cursor.com/docs/customize-cursor): regras, Skills, MCP, subagentes, hooks e seus escopos.
- [Skills — OpenAI Developers](https://developers.openai.com/plugins/concepts/skills): Skill como workflow reutilizável e sua fronteira com MCP.
- [Agent Skills — OpenCode](https://opencode.ai/docs/skills): `SKILL.md`, descoberta, frontmatter e permissões.

### M05 · LLM na prática

- [Prompting — OpenAI Developers](https://developers.openai.com/api/docs/guides/prompting): instruções, parâmetros tipados, prompts versionados e testes; o endpoint é específico da OpenAI.
- [Using tools — OpenAI Developers](https://developers.openai.com/api/docs/guides/tools): contrato de tool calling e responsabilidade da aplicação pela validação e execução.
- [Prompt engineering overview — Anthropic](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/overview): orientação do fornecedor; mantenha invariantes separados de parâmetros proprietários.

### M06 · Evals e observabilidade

- [Demystifying evals for AI agents — Anthropic Engineering](https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents): tarefa, execução, grader e taxa de sucesso (orientação de praticante).
- [Evals — OpenAI Developers](https://developers.openai.com/api/docs/guides/evals): abordagem da plataforma OpenAI, para comparar com avaliações agnósticas no código.
- [OpenTelemetry Python — Get started](https://opentelemetry.io/docs/languages/python/getting-started/): spans, traces, métricas e instrumentação.

### M07 · RAG de verdade

- [Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks — NeurIPS 2020](https://arxiv.org/abs/2005.11401): o paper original de RAG.
- [Contextual Retrieval — Anthropic Engineering](https://www.anthropic.com/engineering/contextual-retrieval): estudo de caso de praticante; verifique método e limites antes de interpretar os ganhos.

### M08 · Agentes e context engineering

- [Building effective agents — Anthropic Engineering](https://www.anthropic.com/engineering/building-effective-agents): workflows versus agentes e seus trade-offs (não é padrão normativo).
- [Effective context engineering for AI agents — Anthropic Engineering](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents): organização de contexto, ferramentas, dados e histórico.
- [Agents — OpenAI Developers](https://developers.openai.com/api/docs/guides/agents): runtime gerenciado, harness próprio e loop da aplicação; APIs específicas da plataforma.

### M09 · Protocolos: MCP na prática

- [Especificação do Model Context Protocol](https://modelcontextprotocol.io/specification/2026-07-28): arquitetura, recursos, prompts, ferramentas, consentimento e segurança.
- [Get started — MCP Python SDK](https://py.sdk.modelcontextprotocol.io/get-started/): servidor Python mínimo.
- [MCP servers — OpenCode](https://opencode.ai/docs/mcp-servers): configuração de servidores locais ou remotos, custo de contexto e credenciais.
- [Docs MCP em Codex, Cursor e Claude Code — OpenAI Developers](https://developers.openai.com/learn/docs-mcp): instalação de um servidor MCP de documentação em vários clientes.

## Fase 3 · Produção

### M12 · Segurança, SRE e operação

- [OWASP GenAI LLM Top 10 2026](https://genai.owasp.org/resource/owasp-genai-llm-top-10-2026/): riscos de aplicações com LLMs e agentes; confirme a edição atual.
- [Google SRE Book](https://sre.google/sre-book/table-of-contents/): SLOs, monitoramento, incidentes e postmortem.

### LT02 · Sistemas distribuídos, dados e mensageria

- [Designing Data-Intensive Applications — Martin Kleppmann](https://www.oreilly.com/library/view/designing-data-intensive-applications/9781491903063/): replicação, particionamento, transações, consistência e processamento de fluxos.

### P01 · Deploy real em nuvem

- [Azure Container Apps — documentação](https://learn.microsoft.com/en-us/azure/container-apps/overview): visão geral, revisões, escala, segredos e observabilidade do serviço usado no módulo.

## Fase 4 · Especialista e líder

### E01 · System design de sistemas com IA

- [Designing Data-Intensive Applications — Martin Kleppmann](https://www.oreilly.com/library/view/designing-data-intensive-applications/9781491903063/): base para raciocinar sobre dados, consistência e escala.
- [Google SRE Book](https://sre.google/sre-book/table-of-contents/): confiabilidade como requisito de desenho.

### E03 · Governança, regulação e IA responsável

- [AI Risk Management Framework — NIST](https://www.nist.gov/itl/ai-risk-management-framework): orientação voluntária de gestão de risco e perfil de GenAI.
- [OWASP GenAI LLM Top 10 2026](https://genai.owasp.org/resource/owasp-genai-llm-top-10-2026/): catálogo de riscos técnicos para ligar aos controles de governança.

### E04 · Liderança técnica

- [StaffEng — guias](https://staffeng.com/guides/): carreira em nível staff, influência sem autoridade formal e trabalho de liderança técnica.
