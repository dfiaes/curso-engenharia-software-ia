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
- **Carga:** 10 blocos de 2h (20h)
- **Pré-requisito:** M08 (o loop caseiro e o ADR-0003) e M07 (o índice vetorial que o grafo vai complementar)

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

- `capstone/grafo/`: pipeline de ingestão em LangGraph com `AsyncPostgresSaver`, HITL na etapa de escrita, extrator determinístico (tree-sitter) e schema em Apache AGE.
- As **três perguntas do M07 respondidas** — com os casos de eval correspondentes saindo de `esperado_falhar: true` para verde.
- `metricas.py` + **relatório de saúde arquitetural** do sistema legado (I/A/D, ciclos, candidatos a código morto) com as ressalvas explícitas.
- ADR sobre a fronteira de microsserviço sugerida pelas métricas — e a prova de durabilidade: matar o processo no meio da execução e mostrar retomada **sem repetir chamadas pagas**.

## Fundamentos reciclados neste módulo

Teoria de grafos aplicada (grau, caminho, ciclo, componente conexo) · máquina de estados e o custo de estado implícito · determinismo e idempotência em retomada · event sourcing e o significado de checkpoint · bitemporalidade (tempo de validade × tempo de transação) · acoplamento aferente/eferente, instabilidade e abstração (Martin) · o princípio das dependências acíclicas e por que ciclo é dívida estrutural · métricas como instrumento, não veredito.
