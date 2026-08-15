# M09 · Protocolos: MCP e A2A

## Visão geral

No M00 bloco 4 você construiu um servidor MCP de brinquedo. Este módulo transforma aquilo em competência vendável: a especificação de verdade, um servidor de produção que expõe o índice e o grafo do sistema legado, e a camada seguinte (A2A) para comunicação entre agentes.

> **Atenção à versão.** O material ensina a revisão **`2026-07-28`**, que introduziu *mudanças que quebram compatibilidade* com o que a maioria dos tutoriais ainda mostra: acabou o handshake `initialize` e a sessão de protocolo, servidores não iniciam mais requisições (padrão **MRTR**), o Streamable HTTP perdeu o GET de stream / `Mcp-Session-Id` / retomada, e `roots` foi depreciada. O servidor do M00 seguia o modelo antigo — e o material usa isso como gancho didático, mostrando o que mudou e **por quê**. Confirme a revisão vigente antes de implementar.

## Conteúdo do módulo

- **Material principal (HTML):** [`M09.html`](M09.html) — abra no navegador
- **Carga:** 7 blocos de 2h (14h)
- **Pré-requisito:** M08 (as ferramentas expostas vêm do M07/M08; o servidor MCP é casca fina sobre elas)

## Estrutura dos blocos

1. **Bloco 1:** Por que protocolo — o problema N×M (o argumento do ODBC, do OpenAPI e do **LSP**); protocolo × tool calling; host/cliente/servidor; JSON-RPC 2.0; o que MCP **não** é (inclusive: não é grátis em contexto).
2. **Bloco 2:** MCP por dentro — as três primitivas pelo critério de **quem controla** (tools/resources/prompts); anatomia de uma tool com `outputSchema` e `annotations` (**dicas não confiáveis**); features do cliente e `roots` depreciada; o **modelo sem estado** e o porquê arquitetural; utilidades e extensões (Tasks, Skills over MCP, MCP Apps).
3. **Bloco 3:** Transportes — stdio (e a armadilha do stdout) e **Streamable HTTP** com os headers obrigatórios, validação header×body (`HeaderMismatch -32020`), `Origin`, localhost; tabela do que sumiu nesta revisão; **MRTR** com `requestState` tratado como entrada de atacante.
4. **Bloco 4:** O servidor do Capstone com **FastMCP** — decisão de granularidade antes do código; servidor completo (3 tools, 2 resources, 2 prompts); `_escopo_da_requisicao` derivando o escopo do runtime; testes **em memória** no CI; medir e publicar o custo de contexto.
5. **Bloco 5:** Distribuição e consumo — uvx/Docker/binário/HTTP; `.mcp.json` versionado com volume read-only; consumir MCP **dentro do próprio agente** e o custo escondido disso; autenticação (chave → OAuth 2.1 → mTLS); extensões com caminho de degradação.
6. **Bloco 6:** **A2A** — a diferença de natureza (agente↔agente, com **opacidade deliberada**); Agent Card com skills em linguagem de negócio; Task/Message/Part/Artifact e os sete estados (com destaque para `INPUT_REQUIRED` e `REJECTED`); três bindings e três formas de acompanhar; quando **não** usar.
7. **Bloco 7:** Segurança de protocolo — os três princípios da spec; **os seis ataques** (tool poisoning, rug pull, confused deputy, injeção indireta, sombreamento entre servidores, exfiltração) com mitigação; checklist para avaliar servidor de terceiro; mini-projeto de endurecimento e o exercício monetizável.

## Entregáveis

- `capstone/mcp/`: 3 tools de fluxo, 2 resources, 2 prompts, escopo do runtime, erros acionáveis, testes em memória (incluindo os 6 de segurança) no CI, Docker (stdio) + variante HTTP autenticada, README com seção de segurança e **custo de contexto publicado**.
- Relatório dos 6 ataques tentados contra o próprio servidor.
- `capstone/a2a/agent-card.json` + ADR-0004 (não implementar A2A agora, com gatilho de revisão).
- **Segundo servidor MCP** para uma API do trabalho (ex.: Azure DevOps), usado por uma semana, com arquivo de atrito e post público — o primeiro entregável monetizável.

## Fundamentos reciclados neste módulo

Padrões de integração e o problema N×M · descoberta em runtime × contrato em build time · fronteira de processo como fronteira de segurança · stateless, continuação por token autocontido e proteção contra replay · integração assíncrona entre organizações (correlação, idempotência, webhook autenticado, compensação, confiança não transitiva) · segurança de cadeia de suprimentos e menor privilégio · defesa em profundidade e auditabilidade.
