# Mapa conceitual — a hierarquia que evita 90% da confusão

Leia no M00. Releia no M08. Esta página é a defesa contra a sopa de siglas.

---

## As duas transformações

Existem **duas coisas diferentes** acontecendo ao mesmo tempo, e confundi-las é o erro mais caro do campo:

| | Desenvolver software **usando** IA | Desenvolver software **contendo** IA |
|---|---|---|
| Pergunta | "como faço a IA construir meu software direito?" | "como construo um sistema cuja arquitetura tem IA dentro?" |
| Ferramentas | Claude Code, Codex, skills, `CLAUDE.md`, SDD, harness, subagentes, gates | RAG, agentes, tools, memória, workflows, HITL, evals, observabilidade |
| Nosso currículo | **M00-M04** | **M05-M13** |
| Quem domina só isso | é produtivo | constrói produto |

Dominar Claude Code **não** é dominar engenharia de software com IA. É metade — a metade que te faz entregar mais rápido, não a que te faz construir a próxima geração de sistemas. Você precisa das duas, e por isso o currículo tem as duas fases.

---

## A hierarquia

Do mais baixo para o mais alto. Cada linha depende das anteriores.

| Camada | O que **realmente** é | Módulo |
|---|---|---|
| **LLM** | o modelo: recebe contexto, devolve saída. Só isso | M05, M11 |
| **Prompt / instructions** | a política dada ao modelo. Configuração comportamental | M05 |
| **Structured output** | contrato que restringe o **formato** da resposta | M05 |
| **Tool** | função externa que o runtime permite ao modelo *solicitar* — o modelo nunca executa nada | M05, M08 |
| **MCP** | protocolo padronizado para expor contexto e ferramentas | M09 |
| **RAG** | pipeline que recupera informação relevante e a insere no contexto | M07 |
| **Agent loop** | ciclo modelo → decisão → tool → observação → modelo | M08 |
| **Agent** | *runtime* que combina modelo + instruções + tools + contexto/estado + loop | M08 |
| **Workflow** | fluxo **explícito** que determina como etapas, agentes e funções se conectam | M08, M10 |
| **Memory** | persistência entre interações e sessões | M10 |
| **Harness** | ambiente que envolve o agente e controla contexto, ferramentas, permissões, estado, artefatos e execução | M01 |
| **Evaluation** | sistema que mede se o comportamento esperado continua funcionando | M06 |
| **Observability** | traces, ferramentas usadas, tokens, latência, erro, custo, trajetória | M06 |
| **Agent platform** | camada corporativa que reúne tudo e permite operar agentes em produção | M12 |

### O que decorre disso — as negações que mais importam

- **RAG não é agente.** RAG é um pipeline de recuperação. Sem loop e sem decisão, não é agente.
- **MCP não é agente.** MCP é protocolo. É encanamento, não inquilino.
- **Um prompt salvo num `.md` não é agente.** É configuração.
- **Uma chamada a um modelo não é agente.** É uma chamada de função cara.
- **Um fluxo no n8n com um nó de LLM não é sistema agêntico.** É automação com uma etapa probabilística.
- **Claude Code não é "uma LLM".** É um **agent harness** — e entendê-lo assim é o que faz o M00 e o M01 fazerem sentido.

Se você guardar só uma frase deste documento, guarde esta: **modelo ≠ agente ≠ harness.**

---

## Três simplificações que você vai ouvir por aí — e o que está errado nelas

Aparecem em aula, em vídeo e em conversa de corredor. São boas didaticamente e ruins como definição.

### "Agente é software não determinístico"

**Aproximado.** O correto é: *um sistema agêntico contém componentes probabilísticos dentro de um runtime predominantemente determinístico.*

A chamada de API, o banco, a autenticação, a idempotência, o controle transacional e as regras de negócio continuam sendo software normal. A parte probabilística é uma ilha, não o continente.

E a consequência prática, que a própria Microsoft recomenda: **quando uma função normal resolve o problema, use a função.** Agente serve para tarefa aberta e autônoma; workflow serve quando a ordem e as regras precisam ser explícitas.

### "LangGraph torna tudo determinístico"

**Não.** LangGraph te dá controle explícito da **topologia e do estado**. Um nó que contém uma LLM continua produzindo saída probabilística.

O que o LangGraph faz de valioso é outra coisa, e é mais sutil: ele controla **onde a incerteza pode existir**. Você decide quais arestas são condicionais por código e quais são decididas pelo modelo. Isso é engenharia; "eliminar não determinismo" é marketing.

### "Prompt é o código do agente"

**Incompleto.** O comportamento de um agente é:

```
código tradicional
+ prompt
+ modelo
+ schemas
+ tools
+ state
+ policies
+ datasets/evals
= comportamento do agente
```

O prompt é *configuração comportamental executável*. Trocar o prompt e esperar que o resto se ajuste sozinho é a causa nº 1 de regressão silenciosa — e é exatamente por isso que o M06 existe.

---

## O que dura e o que não dura

Frameworks mudam rápido. LangGraph muda. Google ADK muda. Claude Code muda. Modelos mudam quase todo mês. Não decore API.

**O que é transferível e vale estudar fundo:**

```
context · tools · state · memory · retrieval
orchestration · guardrails · evaluation · observability · arquitetura
```

Tudo neste currículo é organizado em volta desses dez. O framework é o veículo; eles são o destino.

Um sinal de que isso é verdade: em 2026 a Microsoft unificou AutoGen e Semantic Kernel em um único Agent Framework, e a LangChain passou a distinguir explicitamente framework, runtime e harness. Duas empresas diferentes convergindo para a mesma organização conceitual — porque a organização conceitual é o que era real o tempo todo.
