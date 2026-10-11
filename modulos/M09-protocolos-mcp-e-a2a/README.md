**Status:** G0 approved; B01–B07 in didactic review with local executable lab (3 transports). G1–G6 pending orchestrator review.

# M09 · Protocolos: MCP e A2A

## Visão geral

Protocolos como contratos entre processos: MCP (agente↔ferramenta/dado, com descoberta) e A2A (agente↔agente, com opacidade e ciclo de vida). O laboratório implementa núcleo, três transportes locais e dois clientes independentes — sem SDK externo, conta ou rede pública.

> **Atenção à versão.** O material ensina a revisão **`2026-07-28`**, que introduziu *mudanças que quebram compatibilidade* com o que a maioria dos tutoriais ainda mostra: acabou o handshake `initialize` e a sessão de protocolo, servidores não iniciam mais requisições (padrão **MRTR**), o Streamable HTTP perdeu o GET de stream / `Mcp-Session-Id` / retomada, e `roots` foi depreciada. O servidor do M00 seguia o modelo antigo — e o material usa isso como gancho didático, mostrando o que mudou e **por quê**. Confirme a revisão vigente antes de implementar.

## Conteúdo do módulo

- **Material principal (HTML):** [`M09.html`](M09.html) — abra no navegador
- **Especificação:** [`docs/especificacoes/M09-ESPECIFICACAO.md`](../../docs/especificacoes/M09-ESPECIFICACAO.md) — G0 aprovado
- **Laboratório:** [`lab/`](lab/) — núcleo + 3 transportes locais, sem rede/conta/SDK
- **Carga:** 7 blocos de conteúdo (14h)
- **Pré-requisito:** M08

## Estrutura dos blocos

1. **Bloco 1:** Por que protocolo — o problema N×M (o argumento do ODBC, do OpenAPI e do **LSP**); protocolo × tool calling; host/cliente/servidor; JSON-RPC 2.0; o que MCP **não** é (inclusive: não é grátis em contexto).
2. **Bloco 2:** MCP por dentro — as três primitivas pelo critério de **quem controla** (tools/resources/prompts); anatomia de uma tool com `outputSchema` e `annotations` (**dicas não confiáveis**); features do cliente e `roots` depreciada; o **modelo sem estado** e o porquê arquitetural; utilidades e extensões (Tasks, Skills over MCP, MCP Apps).
3. **Bloco 3:** Transportes — stdio (e a armadilha do stdout) e **Streamable HTTP** com os headers obrigatórios, validação header×body (`HeaderMismatch -32020`), `Origin`, localhost; tabela do que sumiu nesta revisão; **MRTR** com `requestState` tratado como entrada de atacante.
4. **Bloco 4:** O servidor — decisão de granularidade; escopo do runtime; erros acionáveis; testes sem cliente; custo de contexto.
5. **Bloco 5:** Distribuição e consumo — uvx/Docker/binário/HTTP; `.mcp.json` versionado com volume read-only; consumir MCP **dentro do próprio agente** e o custo escondido disso; autenticação (chave → OAuth 2.1 → mTLS); extensões com caminho de degradação.
6. **Bloco 6:** **A2A** — a diferença de natureza (agente↔agente, com **opacidade deliberada**); Agent Card com skills em linguagem de negócio; Task/Message/Part/Artifact e os sete estados (com destaque para `INPUT_REQUIRED` e `REJECTED`); três bindings e três formas de acompanhar; quando **não** usar.
7. **Bloco 7:** Segurança de protocolo — os três princípios da spec; **os seis ataques** (tool poisoning, rug pull, confused deputy, injeção indireta, sombreamento entre servidores, exfiltração) com mitigação; checklist para avaliar servidor de terceiro; mini-projeto de endurecimento e o exercício monetizável.

## Entregáveis

- Servidor com tools/resources/prompts, escopo do runtime e erros acionáveis; dois clientes no mesmo contrato.
- Mesmo núcleo nos 3 transportes; negações de segurança com oráculo; agente A2A com ciclo de vida.
- SDKs reais, Docker e hospedagem são trilha externa.

A aplicação ao Capstone (`mcp/`, `a2a/`) é trilha opcional com especificação própria.

## Fundamentos reciclados neste módulo

Padrões de integração e o problema N×M · descoberta em runtime × contrato em build time · fronteira de processo como fronteira de segurança · stateless, continuação por token autocontido e proteção contra replay · integração assíncrona entre organizações (correlação, idempotência, webhook autenticado, compensação, confiança não transitiva) · segurança de cadeia de suprimentos e menor privilégio · defesa em profundidade e auditabilidade.
