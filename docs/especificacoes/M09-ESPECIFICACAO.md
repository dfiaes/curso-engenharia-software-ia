# M09 — especificação de escopo e evidência

> Referência de escopo da versão anterior do módulo. A sequência e o estado atuais estão em [CURRICULO.md](../../CURRICULO.md) e [STATUS.md](../../STATUS.md).

**Versão:** 1.0 · **Data-base:** 14/09/2026 · **Estado:** G0 aprovado; G1 em produção

## 1. Decisão curricular

O M09 ensina protocolos como contratos entre processos: MCP
(agente↔ferramenta/dado, com descoberta) e A2A (agente↔agente, com
opacidade e ciclo de vida). Protocolo transforma N×M em N+M. O núcleo —
registros, despacho, escopo do runtime, negação por capability, timeout,
cancelamento e ciclo de vida de task — é implementado no laboratório
sobre três transportes locais (memória, stdio com subprocesso real e
HTTP em localhost via stdlib), sem dependência externa, conta ou rede
pública. SDKs de fornecedor e hospedagem são trilha externa.

A integração no Capstone (`mcp/`, `a2a/`) só ocorre após spec própria.
Versão de protocolo é dependência de produção: o material retrata a
revisão vigente na data-base e manda confirmar antes de implementar.

## 2. Resultado, limites e integração

| Aspecto | Definição |
|---|---|
| Carga | sete blocos de duas horas, total de 14 h |
| Entrada | M05 (contrato), M08 (tools), M04 (ADR) |
| Saída | servidor com tools/resources/prompts, cliente independente e agente A2A |
| Peça do capstone | `mcp/` + `agent-card.json`; integração só após spec própria |
| Não cobre | grafos (M10), produção multi-tenant (M12) |
| Evidência mínima | comandos, versões e saída executada; conformidade total com spec externa, só na trilha externa |

## 3. Arquitetura do laboratório

```text
núcleo (registros+despacho+escopo) ◄── transports ──► cliente A / cliente B
   │        memory (filas)                (implementações independentes)
   │        stdio (subprocesso real)
   │        http (localhost, stdlib)
   ▼
a2a (cards, tasks, polling) com opacidade entre pares
```

A referência fica em `modulos/M09-protocolos-mcp-e-a2a/lab/`. O roteiro
`Laboratório guiado M09`, no final do HTML, cria cópia de trabalho em
diretório temporário possuído pelo laboratório.

## 4. Blocos, competências e evidência

| Bloco | Competências observáveis | Evidência planejada |
|---|---|---|
| B01 · por que protocolo | N×M, arquitetura, JSON-RPC | conta + diagrama |
| B02 · primitivas | tools/resources/prompts, capabilities | discovery + negação |
| B03 · transportes | stdio/HTTP, MRTR, headers | paridade + replay |
| B04 · servidor | granularidade, escopo, erro | servidor com 3 tools |
| B05 · distribuição | empacotar, consumir, auth | cliente independente |
| B06 · A2A | card, task, estados | ciclo até COMPLETED |
| B07 · segurança | 6 ataques, checklist | negações demonstradas |

## 5. Cenários de aceitação

| ID | Oráculo e caso relevante | Bloco |
|---|---|---|
| M09-AT-001 | `tools/list` descobre as tools registradas | B02 |
| M09-AT-002 | `tools/call` executa e devolve resultado estruturado | B02/B04 |
| M09-AT-003 | tool inexistente devolve `-32601`, não exceção crua | B02 |
| M09-AT-004 | argumento fora do schema é rejeitado antes de executar | B04 |
| M09-AT-005 | resource leitura + erro em URI desconhecida | B02 |
| M09-AT-006 | prompt rende template com argumento | B02 |
| M09-AT-007 | escopo insuficiente nega (confused deputy barrado) | B04/B07 |
| M09-AT-008 | capability não declarada nunca é acionada | B02/B03 |
| M09-AT-009 | timeout e cancelamento observáveis, sem órfão | B03 |
| M09-AT-010 | versão de protocolo viaja por requisição e é validada | B02/B03 |
| M09-AT-011 | estado retomado adulterado é rejeitado (MAC/TTL) | B03 |
| M09-AT-012 | mesmo núcleo nos 3 transportes (memória/stdio/HTTP) | B03/B05 |
| M09-AT-013 | A2A: card descoberto + task até COMPLETED com artifact | B06 |
| M09-AT-014 | A2A: REJECTED fora de escopo + INPUT_REQUIRED retomado | B06 |

## 6. Fontes e versões

| ID | Fonte e uso | Tipo | Risco |
|---|---|---|---|
| SRC-M09-01 | [MCP specification](https://modelcontextprotocol.io/specification/) — primitivas e transportes | padrão aberto | alto |
| SRC-M09-02 | [JSON-RPC 2.0](https://www.jsonrpc.org/specification) — formato de mensagem | padrão aberto | baixo |
| SRC-M09-03 | [A2A specification (Linux Foundation)](https://a2a-protocol.org/) — cards e tasks | padrão aberto | alto |
| SRC-M09-04 | [OAuth 2.1 draft](https://datatracker.ietf.org/doc/draft-ietf-oauth-v2-1/) — auth do transporte HTTP | normativa | médio |

Consultadas em 14/09/2026. Revisão de protocolo, capacidades e
comportamento de produto: revalidar em até 90 dias. O lab implementa um
subconjunto documentado (sem sampling/elicitation reais); conformidade
total pertence à trilha externa com SDK.

## 7. Panorama de prática vigente

MCP em editores/IDEs e A2A sob fundação neutra são prática observável —
sustentam decisões didáticas sem definir fundamentos.

## 8. Gates e decisão G0

| Gate | Estado | Critério |
|---|---|---|
| G0 · escopo | **APROVADO** | sete blocos, 14 cenários, fontes classificadas, lab local e limites definidos |
| G1–G6 | EM PRODUÇÃO/PENDENTE | HTML legado em revisão; lab e avaliação em construção neste ciclo |

**Decisão de G0:** aprovada em 14/09/2026 pelo orquestrador. Define o
trabalho; não certifica HTML legado ou lab inexistente.
