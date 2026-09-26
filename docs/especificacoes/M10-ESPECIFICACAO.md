# M10 — especificação de escopo e evidência

**Versão:** 1.0 · **Data-base:** 14/09/2026 · **Estado:** G0 aprovado; G1 em produção

## 1. Decisão curricular

O M10 ensina duas disciplinas ortogonais que o nome "grafo" costuma
confundir: grafo de execução (durabilidade, retomada, intervenção
humana) e grafo de conhecimento (relações extraídas, travessias,
métricas de saúde). O laboratório implementa as duas sem dependência
externa: motor de workflow com checkpoint em arquivo, grafo de código
extraído por AST, travessias das três perguntas, memória temporal e
métricas I/A/D. LangGraph, AGE/Neo4j e modelos reais são trilha externa;
o SQL de persistência vive como referência documentada.

A integração no Capstone (`orchestration/`, `graph/`, `metrics/`) só
ocorre após spec própria.

## 2. Resultado, limites e integração

| Aspecto | Definição |
|---|---|
| Carga | dez blocos de duas horas, total de 20 h |
| Entrada | M02 (AST), M06 (evals), M07 (retrieval), M08 (loop/HITL) |
| Saída | workflow durável, grafo consultável, memória temporal, relatório de saúde |
| Peça do capstone | `orchestration/` + `graph/` + `metrics/`; integração só após spec própria |
| Não cobre | RAG vetorial (M07), protocolos (M09), produção (M12) |
| Evidência mínima | comandos, versões e saída executada; travessia PG real, só com Docker |

## 3. Arquitetura do laboratório

```text
fixture Python ──► extração AST ──► digrafo ──► travessias (impacto, mortos, rotas)
                                              ──► métricas I/A/D + ciclos
workflow (nós+arestas) ──► checkpointer (arquivo/thread) ──► run/resume/HITL
memória temporal (valido_de/ate) ──► invalidação por símbolo
```

A referência fica em `modulos/M10-graph-engineering-saude-arquitetural/lab/`.
O roteiro `Laboratório guiado M10`, no final do HTML, cria cópia de
trabalho em diretório temporário possuído pelo laboratório.

## 4. Blocos, competências e evidência

| Bloco | Competências observáveis | Evidência planejada |
|---|---|---|
| B01 · dualidade | classificar pergunta por estrutura | roteamento pergunta→ferramenta |
| B02 · execução | estado, reducers, fan-out | merge sem perda |
| B03 · persistência | checkpoint, resume sem repetir | kill simulado + contagem |
| B04 · HITL | pausa durável, reexecução | efeito uma vez |
| B05 · extração | ontologia, determinístico, fqn | censo + não-resolvidos |
| B06 · persistência PG | SQL referência, grafo por tenant | documento (Docker bloqueado) |
| B07 · GraphRAG | híbrido, comunidades, custo | âncora→expansão |
| B08 · memória | temporal, invalidação | ciclo de validade |
| B09 · saúde | I/A/D, zonas, ciclos | relatório por componente |
| B10 · integração | 3 perguntas, virada de eval | taxa documentada |

## 5. Cenários de aceitação

| ID | Oráculo e caso relevante | Bloco |
|---|---|---|
| M10-AT-001 | classificar 5 perguntas (busca/grafo/SQL/híbrido) | B01 |
| M10-AT-002 | fan-out com reducer soma; default sobrescreve (mutante) | B02 |
| M10-AT-003 | kill no meio + resume na mesma thread: sem repetir efeito | B03 |
| M10-AT-004 | `thread_id` estável por unidade; aleatório nunca retoma | B03 |
| M10-AT-005 | pausa HITL retoma em outra instância com a decisão | B04 |
| M10-AT-006 | efeito antes da pausa acontece 2x; depois, 1x | B04 |
| M10-AT-007 | extração encontra tipos/métodos/chamadas do fixture | B05 |
| M10-AT-008 | fqn estável após deslocar linhas | B05 |
| M10-AT-009 | impacto reverte CHAMA com distância e rota | B06/B10 |
| M10-AT-010 | mortos = não alcançáveis de entry points (candidatos) | B06/B10 |
| M10-AT-011 | híbrido: âncora léxica + expansão com orçamento | B07 |
| M10-AT-012 | fato fora da validade some dos vigentes sem delete | B08 |
| M10-AT-013 | I/A/D calculados; zona de dor apontada | B09 |
| M10-AT-014 | ciclo entre componentes detectado com aresta sugerida | B09 |
| M10-AT-015 | medidas indefinidas (A sem dado) reportadas, não inventadas | B09 |
| M10-AT-016 | 3 perguntas respondidas com evidência e confiança | B10 |

## 6. Fontes e versões

| ID | Fonte e uso | Tipo | Risco |
|---|---|---|---|
| SRC-M10-01 | [LangGraph docs](https://docs.langchain.com/) — execução e checkpoint | documentação oficial | alto |
| SRC-M10-02 | [Martin — Clean Architecture (métricas)](https://blog.cleancoder.com/) — I/A/D | canônica | baixo |
| SRC-M10-03 | [Apache AGE docs](https://age.apache.org/) — grafo no Postgres | documentação oficial | alto |
| SRC-M10-04 | [Microsoft — GraphRAG](https://microsoft.github.io/graphrag/) — local/global e custo | fornecedor | médio |
| SRC-M10-05 | [Python — ast](https://docs.python.org/3/library/ast.html) — extração | normativa | baixo |

Consultadas em 14/09/2026. Versões de framework, extensão e modelo:
revalidar em até 90 dias.

## 7. Panorama de prática vigente

LangGraph, AGE/Neo4j e GraphRAG são prática observável — o módulo os
posiciona pelo que entregam, sem recomendar produto.

## 8. Gates e decisão G0

| Gate | Estado | Critério |
|---|---|---|
| G0 · escopo | **APROVADO** | dez blocos, 16 cenários, fontes classificadas, lab local e limites definidos |
| G1–G6 | EM PRODUÇÃO/PENDENTE | HTML legado em revisão; lab e avaliação em construção neste ciclo |

**Decisão de G0:** aprovada em 14/09/2026 pelo orquestrador. Define o
trabalho; não certifica HTML legado ou lab inexistente.
