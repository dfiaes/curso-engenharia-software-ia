# M08 — especificação de escopo e evidência

> Referência de escopo da versão anterior do módulo. A sequência e o estado atuais estão em [CURRICULO.md](../../CURRICULO.md) e [STATUS.md](../../STATUS.md).

**Versão:** 1.0 · **Data-base:** 14/09/2026 · **Estado:** G0 aprovado; G1 em produção

## 1. Decisão curricular

O M08 ensina quando NÃO usar agente: workflow primeiro, agência só onde
o caminho é imprevisível. O núcleo — padrões compostáveis, design de
ferramentas, orçamento de atenção, loop com parada, memória com validade
e critério de framework — é invariante e demonstrável sem modelo real:
o laboratório usa política de decisão roteirizada e determinística, e o
loop, os orçamentos, as ferramentas e a memória são código real testado.

Modelo real, frameworks (LangGraph e outros) e multi-agente distribuído
são trilha externa ao lab. A integração no Capstone (`services/agent/`)
só ocorre após spec própria.

## 2. Resultado, limites e integração

| Aspecto | Definição |
|---|---|
| Carga | oito blocos de duas horas, total de 16 h |
| Entrada | M05 (tools, custo), M06 (evals), M07 (retrieval) |
| Saída | agente investigador local com loop, ferramentas, memória e comparação |
| Peça do capstone | camada `services/agent/`; integração só após spec própria |
| Não cobre | grafos duráveis (M10), protocolos (M09), produção (M12) |
| Evidência mínima | comandos, versões e saída executada; comportamento de modelo real, só na trilha externa |

## 3. Arquitetura do laboratório

```text
pergunta ──► loop ──► política roteirizada ──► tools (buscar/ler/notas)
               │            (finge o modelo)         │ sandbox + teto
               ├──► orçamentos (passos/custo/tempo) + parada (7 motivos)
               ├──► contexto (orçamento, compactação) e memória (fatos)
               └──► Execucao (resposta/parcial, trace, custo) + relatório
```

A referência fica em `modulos/M08-agentes-e-context-engineering/lab/`.
O roteiro `Laboratório guiado M08`, no final do HTML, cria cópia de
trabalho em diretório temporário possuído pelo laboratório.

## 4. Blocos, competências e evidência

| Bloco | Competências observáveis | Evidência planejada |
|---|---|---|
| B01 · workflow×agente | definição, 3 perguntas, custo | classificação + estimativa |
| B02 · padrões | chaining/routing/voting/orquestrador/avaliador | composição executada |
| B03 · tools | design, erro acionável, escopo | eval de ferramentas |
| B04 · contexto | orçamento, compactação, notas | composição medida |
| B05 · loop | 7 paradas, parcial, HITL | cada motivo demonstrado |
| B06 · memória/multi | observação×fato, invalidação, subagente | ciclo com validade |
| B07 · frameworks | panorama, critério, ADR | ADR com gatilho |
| B08 · investigador | pipeline, comparação agente×workflow | tabela com números |

## 5. Cenários de aceitação

| ID | Oráculo e caso relevante | Bloco |
|---|---|---|
| M08-AT-001 | classificar 3 tarefas pelo critério das 3 perguntas | B01 |
| M08-AT-002 | chaining com gate; routing com fallback; voting por consenso | B02 |
| M08-AT-003 | evaluator-optimizer com avaliador determinístico e teto | B02 |
| M08-AT-004 | ferramenta recusa fora da raiz com erro acionável | B03 |
| M08-AT-005 | truncamento avisa e sugere próximo passo | B03 |
| M08-AT-006 | composição do contexto medida por parte antes de otimizar | B04 |
| M08-AT-007 | compactação preserva fatos com evidência e descarta cru | B04 |
| M08-AT-008 | cada um dos 7 motivos de parada dispara com o diagnóstico certo | B05 |
| M08-AT-009 | orçamento esgotado devolve parcial útil, nunca vazio/invenção | B05 |
| M08-AT-010 | ferramenta de escrita pausa para aprovação (default deny) | B05 |
| M08-AT-011 | fato sem evidência não entra; arquivo alterado invalida | B06 |
| M08-AT-012 | subagente devolve só resumo com orçamento próprio menor | B06 |
| M08-AT-013 | ADR de framework com gatilho de revisão explícito | B07 |
| M08-AT-014 | comparar workflow e agente no mesmo problema e orçamento; medir passos, custo e qualidade sem multiplicador obrigatório | B08 |

## 6. Fontes e versões

| ID | Fonte e uso | Tipo | Risco |
|---|---|---|---|
| SRC-M08-01 | [Yao et al. — ReAct (2022)](https://arxiv.org/abs/2210.03629) — ciclo planejar/agir/observar | científica | baixo |
| SRC-M08-02 | [Anthropic — building effective agents](https://www.anthropic.com/engineering/building-effective-agents) — workflows vs agentes | fornecedor | médio |
| SRC-M08-03 | [12-Factor Agents (HumanLayer)](https://github.com/humanlayer/12-factor-agents) — fatores de harness | industrial | médio |
| SRC-M08-04 | [LangGraph docs](https://docs.langchain.com/) — orquestração com estado (M10) | documentação oficial | alto |

Consultadas em 14/09/2026. Docs de framework e capacidades de modelo:
revalidar em até 90 dias. Frameworks são adapters; nenhum define o
currículo.

## 7. Panorama de prática vigente

LangGraph, Pydantic AI, CrewAI, SDKs de provedor e Agent Frameworks são
prática observável — o módulo os compara pelo que entregam e declara o
critério de adoção, sem recomendar produto.

## 8. Gates e decisão G0

| Gate | Estado | Critério |
|---|---|---|
| G0 · escopo | **APROVADO** | oito blocos, 14 cenários, fontes classificadas, lab local e limites definidos |
| G1–G6 | EM PRODUÇÃO/PENDENTE | HTML legado em revisão; lab e avaliação em construção neste ciclo |

**Decisão de G0:** aprovada em 14/09/2026 pelo orquestrador. Define o
trabalho; não certifica HTML legado ou lab inexistente.
