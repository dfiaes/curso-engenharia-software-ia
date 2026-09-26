# M05 — especificação de escopo e evidência

**Versão:** 1.0 · **Data-base:** 14/09/2026 · **Estado:** G0 aprovado; G1 em produção

## 1. Decisão curricular

O M05 ensina a engenharia em volta do modelo: contrato de mensagem,
saída estruturada, tool calling, streaming, cache, gateway com fallback
e custo como requisito. O núcleo é invariante e agnóstico — mensagens,
uso, erros, finish reasons e tool calls normalizados em portas Python.
Provedores concretos (Anthropic, OpenAI ou outros) são adapters
intercambiáveis atrás da mesma suíte de contrato.

O laboratório obrigatório usa fakes determinísticos locais e nunca exige
rede, conta ou crédito. Testes live contra provedores são trilha opcional,
marcados, datados e comparando implementações — nunca a única evidência.
Preços e versões de produto citados no material são retrato datado
(agosto–setembro/2026), não promessa; revalidar em até 90 dias.

## 2. Resultado, limites e integração

| Aspecto | Definição |
|---|---|
| Carga | sete blocos de duas horas, total de 14 h |
| Entrada | M02 (Pydantic, asyncio), M03 (HTTP, CI), M04 (docs como contexto) |
| Saída | gateway com dois adapters, cache, retry/timeout, contabilidade de custo e relatório |
| Peça do capstone | camada `services/llm/`; a integração no Capstone só ocorre após spec própria |
| Não cobre | evals (M06), retrieval (M07), agentes (M08), produção multi-tenant (M12) |
| Evidência mínima | comandos, versões e saída executada; latência/custo só com ambiente e amostras |

Referência interna de matemática e dependências do principal: [ponte do M05](../planejamento-v4/pontes-principal.md#probabilidade-e-amostragem-no-m05). A distribuição e a amostragem são ensinadas no próprio B01; ML01 é somente aprofundamento opcional.
## 3. Arquitetura do laboratório

```text
aplicação ──► Gateway ──► adapter primário (fake A) ──► resposta normalizada
                  │            │ falha/timeout
                  │            ▼
                  │       adapter fallback (fake B)
                  ├──► cache exato (prefixo estável, TTL, stats)
                  ├──► retry com orçamento + timeout por chamada
                  └──► ledger de custo (tokens, modelo, R$) + relatório
```

A referência fica em `modulos/M05-llm-pratica-gateway-cache/lab/`. O roteiro
`Laboratório guiado M05`, no final do HTML, cria cópia de trabalho em
diretório temporário possuído pelo laboratório.

## 4. Blocos, competências e evidência

| Bloco | Competências observáveis | Evidência planejada |
|---|---|---|
| B01 · contrato | tokens, janela, amostragem, finish reason | estimativa + fake com usage |
| B02 · structured | schema como contrato, validação, abstenção | Pydantic parse + JSON inválido |
| B03 · tools | loop com orçamento, erro acionável, parada | tool loop com fake + budget |
| B04 · streaming | SSE, parcial, backpressure, 202+job | assembler com stream cortado |
| B05 · cache | camadas, invalidação, prefixo estável, stats | hit/miss + TTL + relatório |
| B06 · gateway | fallback, timeout, retry com teto, telemetria | primário derrubado, cliente não percebe |
| B07 · custo | contabilidade por request, alavancas, relatório | ledger + relatório com R$ |

## 5. Cenários de aceitação

| ID | Oráculo e caso relevante | Bloco |
|---|---|---|
| M05-AT-001 | dois adapters passam na mesma suíte de contrato (fake A e B) | B01 |
| M05-AT-002 | usage (in/out) contabilizado por chamada, sem rede | B01 |
| M05-AT-003 | finish reason truncado vira erro explícito, não JSON quebrado silencioso | B01/B02 |
| M05-AT-004 | JSON válido vira objeto Pydantic; JSON inválido vira erro tipado | B02 |
| M05-AT-005 | saída fora do schema (campo ausente/tipo errado) é rejeitada | B02 |
| M05-AT-006 | abstenção ("não encontrei") é saída válida, não falha | B02 |
| M05-AT-007 | tool loop executa pede→executa→devolve até resposta ou teto de passos | B03 |
| M05-AT-008 | ferramenta desconhecida/argumento inválido vira erro acionável | B03 |
| M05-AT-009 | stream parcial (corte no meio do JSON) é detectado, não parseado | B04 |
| M05-AT-010 | backpressure: produtor rápido não estoura memória do consumidor | B04 |
| M05-AT-011 | segunda chamada idêntica é hit (sem nova chamada ao adapter) | B05 |
| M05-AT-012 | TTL expirado volta a chamar; invalidação explícita limpa | B05 |
| M05-AT-013 | primário derrubado: fallback responde sem o cliente perceber | B06 |
| M05-AT-014 | timeout por chamada + retry com teto; retry storm é impossível por construção | B06 |
| M05-AT-015 | telemetria registra modelo usado, latência e tokens por chamada | B06 |
| M05-AT-016 | ledger soma custo por request/modelo com preços datados | B07 |
| M05-AT-017 | relatório lista top requests e economia do cache em R$ | B07 |

## 6. Fontes e versões

| ID | Fonte e uso | Tipo | Risco |
|---|---|---|---|
| SRC-M05-01 | [Anthropic API — messages](https://docs.anthropic.com/en/api/messages) — contrato de chamada/usage | fornecedor | alto |
| SRC-M05-02 | [OpenAI API — chat](https://platform.openai.com/docs/api-reference/chat) — segundo adapter | fornecedor | alto |
| SRC-M05-03 | [Anthropic — prompt caching](https://platform.claude.com/docs/en/build-with-claude/prompt-caching) — prefixo/TTL/preços/limites mínimos por modelo | fornecedor / adapter | alto |
| SRC-M05-04 | [SSE spec (HTML standard)](https://html.spec.whatwg.org/multipage/server-sent-events.html) — formato do stream | normativa | baixo |
| SRC-M05-05 | [JSON Schema 2020-12](https://json-schema.org/specification) — validação de saída | padrão aberto | baixo |
| SRC-M05-06 | Preços de provedores (retrato ago–set/2026 no HTML) — conta de custo | fornecedor | alto |

Fontes da tabela consultadas em 14/09/2026; SRC-M05-03 revalidada em
25/09/2026. Preços, versões de modelo, quotas, limites mínimos de cache e
capacidades de produto devem ser revalidados em até 90 dias. Limite mínimo
de prefixo cacheável não equivale a janela de contexto nem a teto de saída.
O invariante ensinado (contrato, cache, retry, custo) não depende de
nenhum fornecedor. O ledger focal de claims está em
[`docs/planejamento-v4/fontes.json`](../planejamento-v4/fontes.json).

## 7. Panorama de prática vigente

Gateways (LiteLLM e similares) e prompt caching são prática observável em
times que operam LLM em volume — sustentam a decisão didática. Não definem
fundamento nem autorizam recomendação universal de produto.

## 8. Gates e decisão G0

| Gate | Estado | Critério |
|---|---|---|
| G0 · escopo | **APROVADO** | sete blocos, 17 cenários, fontes classificadas, lab local sem rede e limites definidos |
| G1–G6 | EM PRODUÇÃO/PENDENTE | HTML legado em revisão; lab e avaliação em construção neste ciclo |

**Decisão de G0:** aprovada em 14/09/2026 pelo orquestrador. Define o
trabalho; não certifica HTML legado ou lab inexistente.
