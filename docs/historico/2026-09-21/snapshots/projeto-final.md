# Projeto final — Cartógrafo

O produto integrador é uma ferramenta de análise de bases de código: ingestão segura, extração de símbolos, grafo de dependências, busca, relatórios com evidência e investigação assistida por IA. A implementação é Python e não exige experiência do aluno em outra stack.

O corpus didático deve permitir verificar respostas e entender os exemplos com o contexto fornecido. Fixtures em outras linguagens, quando necessárias para testar um parser, são dados de entrada com comportamento explicado, não aulas ou pré-requisitos dessas linguagens. O escopo detalhado de parsers, contratos e aceite pertence à [especificação M13](../../../especificacoes/M13-ESPECIFICACAO.md).

O curso constrói as competências do produto progressivamente. Laboratórios isolados podem ensinar uma parte antes de sua integração; não devem alterar o Capstone implicitamente. O estado executável está em [capstone/README.md](../../../../capstone/README.md), e a [rastreabilidade M13](../../../../modulos/M13-capstone/RASTREABILIDADE.md) distingue o planejado do verificado.

Ideias de negócios, metas pessoais de renda e comparativos comerciais foram retirados da documentação de implementação. A utilidade do produto deve ser demonstrada por tarefas, feedback autorizado e evidência, sem promessa de faturamento ou prazo.

## Arquitetura do Cartógrafo, e como cada módulo a constrói

```
                     ┌─────────────────────────────────────┐
   repositório  ───▶ │  Ingestão (M03)                     │
   legado            │  clone, walk, filtro, fila           │
                     └────────────────┬────────────────────┘
                                      ▼
                     ┌─────────────────────────────────────┐
                     │  Parse determinístico (M10)         │
                     │  adapter de parser → símbolos,     │
                     │  referências, SQL embutido           │
                     └────────┬───────────────────┬────────┘
                              ▼                   ▼
              ┌──────────────────────┐  ┌────────────────────────┐
              │ Grafo (M10)          │  │ Índice híbrido (M07)   │
              │ Postgres+AGE ou Neo4j│  │ pgvector + BM25 + rerank│
              └──────────┬───────────┘  └───────────┬────────────┘
                         └────────────┬─────────────┘
                                      ▼
                     ┌─────────────────────────────────────┐
                     │  Agente investigador (M08)          │
                     │  ferramentas: buscar, ler,          │
                     │  travessia de grafo, perguntar      │
                     └────────────────┬────────────────────┘
                                      ▼
                     ┌─────────────────────────────────────┐
                     │  Orquestrador durável (M10)         │
                     │  LangGraph + checkpoint + HITL      │
                     └────────────────┬────────────────────┘
                    ┌─────────────────┼──────────────────┐
                    ▼                 ▼                  ▼
         ┌──────────────┐   ┌──────────────┐   ┌──────────────────┐
         │ Relatório    │   │ Servidor MCP │   │ API + UI (M03)   │
         │ (M05)        │   │ (M09)        │   │                  │
         └──────────────┘   └──────────────┘   └──────────────────┘

    Documentação-alvo: o gabarito do que gerar vem do M04 (PRD, C4, ADR)
    Transversal:  Evals na CI (M06) · Custo e tracing (M05/M06)
                  Multi-tenant, RLS, billing, segurança (M12)
```

**Regra de ouro da arquitetura:** o que é determinístico fica determinístico. Parse de código, resolução de referências e travessia de grafo são feitos por ferramenta, **não** por LLM. O modelo entra para explicar, priorizar e conversar. Isso derruba custo, elimina alucinação estrutural e é exatamente o julgamento arquitetural que separa engenheiro de IA sênior de quem só chama API.

---

## As sete versões — integração progressiva

As peças são integradas progressivamente. Um laboratório isolado pode tornar uma responsabilidade visível antes de incorporá-la ao produto; cada integração exige sua especificação e evidência.

| v | O que entra | Módulo | O que você aprende quando quebra |
|---|---|---|---|
| **v1** | RAG simples sobre o código: pergunta → busca → resposta | M07 | que busca vetorial não responde pergunta estrutural |
| **v2** | tools reais: buscar símbolo, ler arquivo, listar referências | M08 | que design de ferramenta é design de API, e que dez ferramentas é demais |
| **v3** | agente com loop, orçamento de passos e critério de parada | M08 | que agente sem critério de parada queima orçamento |
| **v4** | grafo de conhecimento + métricas de acoplamento | M10 | que travessia de grafo responde o que o vetor nunca respondeu |
| **v5** | workflow durável: checkpoint, retomada, human-in-the-loop | M10 | que ingestão de repositório grande falha no meio, sempre |
| **v6** | memória: estado curto, histórico de sessão, conhecimento durável | M10 | a diferença entre observação temporária e fato |
| **v7** | os seis datasets de eval + tracing + custo por análise | M06, M12 | que você não sabia se estava funcionando |

Note que o M06 (evals) aparece cedo no currículo e tarde nesta tabela **de propósito**: você constrói a suíte no M06 sobre um componente pequeno, e ela cresce junto com o produto. Evals que chegam no fim viram teatro. Evals que nascem junto viram gate.

---

## Perguntas que o produto tem que responder (e que definem "pronto")

Nível 1 — busca (RAG resolve, M07):
- "Onde está a regra de cálculo de juros?"
- "Como funciona a autenticação neste sistema?"

Nível 2 — estrutura (só grafo resolve, M10):
- "O que quebra se eu alterar a assinatura deste método?"
- "Quais telas dependem, direta ou indiretamente, desta tabela?"
- "Que código está morto — sem nenhum caminho de chamada a partir de um entry point?"
- "Onde estão os ciclos de dependência entre módulos?"

Nível 3 — julgamento (agente + grafo + LLM, M08+M10):
- "Se eu for extrair um microsserviço deste monólito, qual é a fronteira de menor acoplamento?"
- "Qual a ordem de menor risco para modernizar estes 40 arquivos?"

Os níveis orientam cenários de avaliação; não representam garantia comercial nem completude da análise estática.
