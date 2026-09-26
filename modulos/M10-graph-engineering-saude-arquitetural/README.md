**Status:** G0 approved; B01–B10 in didactic review with local executable lab (no external deps). G1–G6 pending orchestrator review.

# M10 · Graph engineering e saúde arquitetural

## Visão geral

Este é o módulo que o guia chama de **diferencial do curso**: é aqui que as pontas soltas viram sistema.

O M07 terminou com três perguntas que o RAG vetorial **não** consegue responder — "quem chama esse método", "o que quebra se eu mudar essa assinatura", "esse código está morto?". O M08 terminou com o ADR-0003 registrando um gatilho: *"quando o fluxo precisar de retomada durável e aprovação humana, migre o loop caseiro para um framework de grafo"*. Este módulo paga as duas dívidas com a mesma ideia — **grafo** — em duas encarnações que a maioria dos tutoriais confunde:

| | Grafo de **execução** | Grafo de **conhecimento** |
|---|---|---|
| O que é | como o agente **roda** | o que o agente **sabe** |
| Ferramenta | LangGraph | Apache AGE (Cypher no Postgres) |
| Estado | efêmero por thread, com checkpoint | persistente, versionado, temporal |
| Pergunta que responde | "onde parei e como retomo?" | "quem chama quem, e o que quebra?" |

E fecha com a terceira aplicação de grafo: **métricas de saúde arquitetural** (Ca, Ce, I, A, D de Martin) calculadas sobre o grafo de dependências — o entregável que transforma o Cartógrafo de "busca inteligente" em **relatório que o cliente paga**.

## Conteúdo do módulo

- **Material principal (HTML):** [`M10.html`](M10.html) — abra no navegador
- **Especificação:** [`docs/especificacoes/M10-ESPECIFICACAO.md`](../../docs/especificacoes/M10-ESPECIFICACAO.md) — G0 aprovado
- **Rastreabilidade:** [`RASTREABILIDADE.md`](RASTREABILIDADE.md)
- **Laboratório:** [`lab/`](lab/) — workflow, grafo e métricas locais, sem rede/banco/framework
- **Carga:** 10 blocos de conteúdo (20h)
- **Pré-requisito:** M09

## Estrutura dos blocos

1. **Bloco 1:** A dualidade — grafo de execução × grafo de conhecimento; por que as três perguntas do M07 exigem *travessia*, não *similaridade*; vocabulário de grafos (nó, aresta, direção, grau, caminho, ciclo, componente) como fundamento reciclado; e o mapa honesto de **onde grafo não é a resposta**.
2. **Bloco 2:** LangGraph — `StateGraph`, estado tipado como `TypedDict`, **reducers** (`Annotated[list, operator.add]`) e a armadilha do default que *sobrescreve*; nós, `START`/`END`, arestas condicionais, `Command` e `Send` para fan-out dinâmico. O pipeline de ingestão do Cartógrafo reescrito como grafo.
3. **Bloco 3:** Persistência — `AsyncPostgresSaver`, `thread_id` **estável** (e o que acontece quando não é), os três modos de durabilidade (`exit`/`async`/`sync`) com a tabela de trade-off, determinismo e idempotência como fundamento, `get_state_history()` e **time travel**.
4. **Bloco 4:** Human-in-the-loop — `interrupt()` e `Command(resume=)`; **a armadilha central: o nó reexecuta desde o começo na retomada** (nada de efeito colateral antes do interrupt); as cinco regras, os quatro padrões (aprovar/editar/escolher/validar entrada) e a simetria com o **MRTR** do MCP e o `INPUT_REQUIRED` do A2A — o mesmo problema resolvido em três camadas.
5. **Bloco 5:** Modelagem do grafo de conhecimento — schema do Cartógrafo (nós e arestas), extração **determinística × por LLM** (e por que o parser faz 95% por ~zero), extrator com `tree-sitter` + `networkx`.
6. **Bloco 6:** Apache AGE — `CREATE EXTENSION` / `LOAD` / `search_path`, o `connect` listener que evita o erro mais comum, Cypher essencial (`MATCH`/`WHERE`/`RETURN`, `*1..n`), as **três perguntas do M07 escritas em Cypher**, e um grafo por tenant.
7. **Bloco 7:** GraphRAG — busca **local** × **global**, comunidades e sumarização, o problema de custo real do indexing e a resposta do **LazyGraphRAG** (~0,1% do custo), quatro padrões de recuperação, e o híbrido vetor→grafo do Cartógrafo.
8. **Bloco 8:** Grafo como **memória** — fatos do agente com **dois eixos de tempo** (quando valeu × quando soubemos), migração `fatos_agente` com `valido_de`/`valido_ate`, invalidação disparada por commit.
9. **Bloco 9:** Saúde arquitetural — Ca, Ce, **I = Ce/(Ca+Ce)**, A, **D = |A+I−1|**, sequência principal (com gráfico), zona da dor e zona da inutilidade, SDP/SAP; `metricas.py` e detecção de ciclos entre componentes; **as três ressalvas de honestidade** que separam relatório de oráculo.
10. **Bloco 10:** Mini-projeto — pipeline completo em LangGraph com checkpoint, rota de grafo no roteador, os casos de eval marcados `esperado_falhar` **virando `true`**, graders determinísticos de grafo, e o **relatório de avaliação arquitetural** entregável.

## Entregáveis

- Workflow durável com checkpoint em arquivo, HITL com pausa/retomada e fan-out com reducers.
- Grafo extraído por AST com as três perguntas respondidas e híbrido com orçamento.
- Memória temporal com validade; métricas I/A/D com zonas e ciclos.
- LangGraph, AGE e modelos reais são trilha externa.

A aplicação ao Capstone (`orchestration/`, `graph/`, `metrics/`) é trilha opcional com especificação própria.

## Fundamentos reciclados neste módulo

Teoria de grafos aplicada (grau, caminho, ciclo, componente conexo) · máquina de estados e o custo de estado implícito · determinismo e idempotência em retomada · event sourcing e o significado de checkpoint · bitemporalidade (tempo de validade × tempo de transação) · acoplamento aferente/eferente, instabilidade e abstração (Martin) · o princípio das dependências acíclicas e por que ciclo é dívida estrutural · métricas como instrumento, não veredito.
