# M08 · Agentes: padrões e context engineering

## Visão geral

O núcleo do currículo — e o lugar onde mais gente erra, construindo agente autônomo para problema que um `if` resolveria. O módulo dá a definição operacional (workflow = caminho no código; agente = o modelo escolhe o caminho), a taxonomia dos cinco padrões que a indústria adotou, o design de ferramentas como API para um leitor literal, e o assunto central: **context engineering como gestão de orçamento de atenção**.

Entrega o agente investigador do Capstone e — o mais valioso — o número que quase ninguém tem: **quanto custa e quanto acerta o agente comparado ao workflow determinístico equivalente**.

## Conteúdo do módulo

- **Material principal (HTML):** [`M08.html`](M08.html) — abra no navegador
- **Carga:** 8 blocos de 2h (16h)
- **Pré-requisito:** M07 (as ferramentas de busca vêm de lá; o loop de tool calling, do M05 b3)

## Estrutura dos blocos

1. **Bloco 1:** Workflow × agente — definição operacional; o LLM aumentado; as três perguntas do critério de escolha; o custo do não determinismo (teste vira amostragem, custo vira distribuição).
2. **Bloco 2:** Os cinco padrões compostáveis — chaining, routing, parallelization (sectioning/voting), orchestrator-workers, evaluator-optimizer — com quando usar, risco de cada um, e o mapa do Capstone.
3. **Bloco 3:** Design de ferramentas — poucas e de alto impacto, namespacing, contexto significativo, economia de tokens, descrição como prompt; **erros que ensinam**; eval de ferramentas (o nº de chamadas é o indicador revelador).
4. **Bloco 4:** Context engineering — orçamento de atenção e O(n²); altitude do system prompt; **compactação, notas estruturadas e subagentes**; just-in-time × pré-computado.
5. **Bloco 5:** O loop — ReAct e o que mudou com reasoning models; **sete critérios de parada**; orçamento triplo (passos, custo, tempo); resposta parcial; loop estéril; HITL como allowlist.
6. **Bloco 6:** Memória e multi-agente — os quatro tipos; **observação × fato durável** (evidência + gatilho de invalidação); tabela de fatos com validade; quando multi-agente compensa e o teste honesto.
7. **Bloco 7:** Frameworks — o que eles realmente entregam vs. o que você já tem; panorama (LangGraph, Pydantic AI, CrewAI, SDKs de provedor, **Microsoft Agent Framework** como ponte .NET); critério de escolha e teste de transparência do prompt.
8. **Bloco 8:** Mini-projeto — o agente investigador completo, e o exercício de comparar com o workflow determinístico equivalente.

## Entregáveis

- `services/agent/`: cinco ferramentas com eval próprio, prompt versionado, loop com orçamento triplo e sete paradas, compactação, memória de fatos com invalidação, subagente opcional.
- Categoria `agente_impacto` nos evals do M06, com os casos estruturais marcados `esperado_falhar` (insumo do M10).
- ADR-0003 sobre framework, com gatilho de revisão explícito.
- Tabela agente × workflow: custo, latência p50/p95, acurácia e variância.

## Fundamentos reciclados neste módulo

Custo do não determinismo (amostragem, distribuição de custo, trace em vez de log) · contratos, acoplamento e princípio do menor espanto aplicados a ferramentas · gerenciamento de recurso escasso (orçamento, política de despejo, paginação, externalizar estado) · terminação, invariantes de loop e detecção de ciclo · cache com política de invalidação aplicado a memória · build × buy, custo de abstração e lei de Hyrum.
