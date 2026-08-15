# Guia de regeneração dos módulos — handoff para o próximo agente

> **Atualização de governança — 14/08/2026:** este guia continua sendo a régua operacional de escrita, mas seu status histórico e sua ordem original não são mais a fonte da verdade. Antes de agir, leia `docs/PLANO-ESTRUTURACAO-CURSO-2026.md`, `docs/MATRIZ-RASTREABILIDADE.md`, `docs/POLITICA-FONTES-E-AGNOSTICISMO.md` e `docs/STATUS-IMPLEMENTACAO-CURSO.md`. M12 e M13 estão bloqueados para estudo; M01–M11 aguardam auditoria pelos gates G0–G6; LT01–LT04 foram adicionados ao escopo.

> **Para quem é este documento:** o agente de IA (qualquer modelo/harness) que vai continuar a regeneração do material do curso. Leia INTEIRO antes de escrever a primeira linha. Leia também, obrigatoriamente: `CLAUDE.md` (a constituição — as regras dele prevalecem sobre tudo), `CURRICULO.md` (o conteúdo prometido por módulo) e um dos módulos já regenerados como gabarito de qualidade (`modulos/M03-fastapi-postgres-docker-ci/M03.html` é o melhor exemplo completo).

---

## 1. Estado atual (12/08/2026)

### O que já foi feito

| Módulo | Estado | Palavras visíveis | Observação |
|---|---|---|---|
| M00 | original (bom) | ~3.000 + bloco-4 com ~7.000 | feito à mão antes; `bloco-4-mcp-e-hooks.html` é a RÉGUA de densidade por bloco |
| M01 | **regenerado ✅** | ~9.550 | 12-Factor Agents corrigido (a versão anterior tinha os 12 fatores INVENTADOS) |
| M02 | **regenerado ✅** | ~8.430 | inclui GIL/free-threading 2026, Little's Law, benchmark async guiado |
| M03 | **regenerado ✅** | ~9.260 | a versão anterior PULAVA os blocos 5, 6 e 7 (Docker, testes de integração, CI/CD) |
| M04–M13 | **pendentes ❌** | 1.100–3.100 cada | são esqueletos/resumos gerados pelo Antigravity — ver diagnóstico abaixo |

### Diagnóstico dos módulos pendentes (por que precisam ser refeitos)

Os arquivos `M04.html` a `M13.html` atuais têm os problemas sistemáticos abaixo. **Não tente "melhorar" o arquivo existente por edição incremental — regenere por completo**, aproveitando apenas o roteiro de blocos (os títulos de `<h2>` costumam estar bons) e um ou outro trecho:

1. **Densidade ~10–20% do necessário.** 150–400 palavras por bloco de 2h de estudo. O aluno não consegue estudar 2 horas com meia página.
2. **Prática quase inexistente.** Não há passo a passo numerado com "Resultado esperado" (a exigência mais explícita do CLAUDE.md). Contar no arquivo: `grep -c "Resultado esperado"` — nos regenerados dá 10–20; nos pendentes, 0–2.
3. **Teoria em "caixa de contexto + tradução .NET" e nada mais.** Falta o desenvolvimento do porquê, os trade-offs, os anti-padrões, as tabelas comparativas.
4. **Código insuficiente.** 1–6 blocos `<pre>` por módulo (os regenerados têm 15–20, completos e tipados).
5. **Checkpoints que o material não sustenta.** As perguntas cobram conteúdo que o texto não ensina.
6. **Risco de conteúdo inventado.** O M01 antigo listava 12 fatores com nomes fabricados ("Natural Language Refactoring", "Deterministic Tools"...). Os corretos são outros (ver §5). **Assuma que qualquer lista numerada/nomenclatura de spec nos arquivos antigos pode estar errada e verifique na fonte primária antes de reaproveitar.**

### Erros factuais já encontrados e corrigidos (não reintroduzir)

- **12-Factor Agents (HumanLayer):** os nomes corretos dos 12 fatores estão no M01 regenerado e em `github.com/humanlayer/12-factor-agents`. Há também o Fator 13 (pre-fetch context) no apêndice.
- **GitHub Spec Kit:** os comandos reais são `/speckit.constitution`, `/speckit.specify`, `/speckit.clarify`, `/speckit.plan`, `/speckit.tasks`, `/speckit.analyze`, `/speckit.implement` (e `/speckit.converge`). Suporta 30+ agentes.
- **Python:** 3.14 free-threaded é oficialmente suportado desde out/2025 (não "experimental"); recomendação de produção em 2026 continua asyncio para I/O-bound. Está no M02 bloco 4.

---

## 2. O padrão de qualidade (a régua)

### Calibração de densidade — instrução do aluno (14/08/2026)

> "Os módulos devem ter a densidade de conteúdo semelhante às fontes oficiais das tecnologias. O grande trunfo aqui é saber **relacionar entre si** todo o conhecimento de tecnologias, em formato de curso, numa trilha extremamente didática para a formação do engenheiro de software especializado em IA."

Traduzindo em regras operacionais, que **prevalecem sobre os mínimos numéricos abaixo** (eles viram piso, não meta):

1. **Cobertura de referência.** Em cada bloco, cubra a superfície do assunto como a documentação oficial cobriria: os parâmetros que existem (não só os que você usaria), os modos de operação, os limites declarados, o vocabulário completo. O aluno deve poder usar o módulo como **material de consulta** meses depois, sem abrir a doc do fornecedor — a regra de ouro do CLAUDE.md ("se ele precisar sair do material, o material falhou") vale para consulta, não só para o primeiro estudo. Tabelas de referência (parâmetros, operadores, limites, comandos) são bem-vindas e devem ser completas.
2. **O diferencial é a costura, não a cópia.** Doc oficial explica UMA tecnologia isolada; o valor deste curso é a relação entre elas. Todo bloco deve amarrar explicitamente: para trás (o que já foi ensinado — "isto é o fator 4 do M01", "usa o semáforo do M02 b4"), para o lado (a tecnologia vizinha e por que a escolha), e para frente (onde isso volta — "o M10 mede isto"). Sem essa costura, o material é uma doc traduzida; com ela, é formação.
3. **Densidade sem enrolação.** Mais conteúdo ≠ mais palavras sobre a mesma coisa. O que aumenta a densidade: mais tabelas de referência, mais casos de uso enumerados, mais anti-padrões nomeados, mais código completo, mais parâmetros explicados, mais "quando NÃO usar". O que não aumenta: adjetivos, repetição de motivação, parágrafos de transição.
4. **Faixa prática que isso implica:** 10.000–14.000 palavras para módulos de 6–8 blocos (M05 saiu com 12,5k e M06 com 10,5k por esse critério), 14.000–18.000 para M10 e M11. Se o módulo passar de ~18k, quebre num arquivo companheiro (`bloco-N-tema.html`), como o M00 já faz.
5. **Um módulo por tarefa, entregue completo.** Nada de lote.

### Números-alvo por módulo (piso mínimo)

- **7.500–10.000 palavras visíveis** (texto renderizado, sem HTML/CSS) para módulos de 5–8 blocos; proporcionalmente mais para M10 (10 blocos) e M13 (20 blocos — ver nota no §6).
- **≥ 1.100–1.600 palavras por bloco** de 2h.
- **≥ 10 ocorrências de "Resultado esperado"** por módulo (todo passo de prática tem um).
- **≥ 12 blocos `<pre>`** com código completo, tipado, executável — nunca esqueleto com `...` ou "// implementar".
- **Tabela de diagnóstico com ≥ 8 linhas** (sintoma → causa → conserto) de erros REAIS que o aluno vai encontrar.
- **Checkpoint com ≥ 8 perguntas** difíceis + lista de entregáveis verificáveis em disco/rodando.
- **Conclusão "o essencial em 8 linhas"** — frases curtas de fixação (exigência do CLAUDE.md: conclusão direta).

### Estrutura obrigatória de cada módulo (siga o M03 como template)

```
<head> com o CSS compartilhado (copiar de M01/M02/M03 — inclui .box.fund e .step)
<h1> + .meta (badge, nº de blocos, pré-requisito, tagline)
.box "O que muda ao final deste módulo" (parágrafo denso, com o gancho para o Capstone)
.toc Roteiro (um <li> por bloco)
Para CADA bloco:
  <h2>Bloco N · Título</h2>
  .clock (divisão de tempo do bloco: 00:00–00:25 tema | ...)
  <h3>Por que isso importa</h3> (motivação real, ligada à trajetória do aluno)
  Teoria desenvolvida com:
    - .box.net "Ponte mental" (OPCIONAL; usar apenas quando uma analogia curta com experiência
      anterior reduzir a carga cognitiva; Python continua sendo a explicação canônica)
    - .box "Contexto · O que é X" para TODA tecnologia/sigla/termo citado antes de ser
      ensinado formalmente (regra do CLAUDE.md: uv, npx, SSE, JSON-RPC, decorador, etc.)
    - .box.warn para pegadinhas/anti-padrões
    - .box.fund "Fundamento de engenharia · X" — a reciclagem sênior (ver §4; 1–2 por bloco
      nos pontos onde o fundamento é USADO, não como apêndice)
    - tabelas comparativas, e 1–2 diagramas SVG inline por módulo onde agregam
  <h3>Prática guiada · nome (Nmin)</h3>
    - .step numerados: <span class="n">1</span> instrução + código + "Resultado esperado:"
      descrevendo a SAÍDA CONCRETA (terminal, status code, arquivo, número)
    - cada passo se liga ao anterior ("agora que X está no ar, o passo seguinte...")
  .box.ok "Síntese do bloco N" (4–6 bullets de fixação)
No fim do módulo:
  Exercício sozinho (sem pistas — escada só se o aluno pedir)
  "Peça do produto" (o que vai para o Capstone — regra nº 6 do CLAUDE.md; se não alimenta
   o produto, justificar)
  <h2>Tabela de Diagnóstico</h2>
  <h2>Checkpoint MXX</h2> (.box.ok com .check + entregáveis)
  .box "Conclusão — o essencial em 8 linhas"
</div></body></html>
```

### Regras de escrita (do CLAUDE.md, operacionalizadas)

- **Português** no material; código, commits e nomes técnicos em inglês quando natural.
- **Nunca assumir contexto não dado.** O aluno é sênior em .NET e iniciante em Python/IA. Na dúvida, caixa de contexto.
- **Fundamentos desenvolvidos** ("por quê" antes do "como"), **prática detalhada**, **conclusão seca**. Sem enrolação, sem repetição.
- **Sem perguntas socráticas no corpo do material.** Perguntas só no Checkpoint.
- **Código Python 3.12+, tipado, passa `mypy --strict`,** gerenciado com `uv`. Pydantic v2, pytest, ruff. Postgres sempre.
- **Amarrar com o que veio antes:** citar M00/M01/M02/M03 explicitamente ("você viu isso no M01 bloco 2") — o curso é cumulativo e as referências cruzadas são parte da didática. Os regenerados fazem isso o tempo todo; mantenha.
- **Tom:** direto, de tech lead para sênior. Zero condescendência, zero hype. Humor seco ocasional é ok.

### Processo recomendado (o que funcionou para M01–M03)

1. **Pesquise ANTES de escrever** (WebSearch/WebFetch nas fontes do §3). Verifique especialmente: nomes oficiais de specs/fatores/comandos, versões atuais, mudanças pós-jan/2026.
2. **Esboce o roteiro de blocos** (pode partir dos `<h2>` do arquivo antigo + CURRICULO.md, que é mais rico).
3. **Escreva em fragmentos** (um arquivo por bloco) e concatene — arquivos de 20–90 KB numa tacada só degradam a qualidade do fim.
4. **Valide mecanicamente** (script abaixo) e revise as referências cruzadas.
5. **Reescreva o README.md do módulo** no padrão dos regenerados (visão geral honesta, estrutura de blocos, entregáveis, "fundamentos reciclados neste módulo").
6. **Commite** com mensagem no padrão do repo: `M0X: regenerate module content to full density` (inglês, imperativo).

### Script de validação (rodar em cada módulo terminado)

```python
# valida_modulo.py — uso: python valida_modulo.py modulos/MXX-nome/MXX.html
import re, sys
t = open(sys.argv[1], encoding="utf-8").read()
vis = re.sub(r"<style.*?</style>", "", t, flags=re.S)
vis = re.sub(r"<[^>]+>", " ", vis)
palavras = len(vis.split())
checks = {
    "palavras >= 7500": palavras >= 7500,
    "resultado esperado >= 10": len(re.findall(r"(?i)resultado esperado", t)) >= 10,
    "pre >= 12": len(re.findall(r"<pre", t)) >= 12,
    "diagnostico >= 8 linhas": len(re.findall(r"<tr>", t.split("Tabela de Diagnóstico")[-1])) >= 9,
    "checkpoint presente": "Checkpoint M" in t,
    "conclusao 8 linhas": "essencial em 8 linhas" in t,
    "caixas .NET >= 5": t.count('class="box net"') >= 5,
    "caixas contexto >= 3": t.count("Contexto ·") >= 3,
    "fundamentos >= 3": t.count('class="box fund"') >= 3,
}
for tag in ["div", "pre", "table", "ul", "ol", "figure", "svg"]:
    o = len(re.findall(rf"<{tag}[\s>]", t)); c = t.count(f"</{tag}>")
    checks[f"tags <{tag}> balanceadas"] = o == c
print(f"{palavras} palavras visíveis")
falhas = [k for k, v in checks.items() if not v]
for k, v in checks.items(): print(("OK " if v else "FALHOU ") + k)
sys.exit(1 if falhas else 0)
```

---

## 3. Onde buscar informação rica — fontes primárias por módulo

**Regra geral:** prefira SEMPRE a fonte primária (spec, doc oficial, repositório, blog de engenharia do criador) a posts de terceiros. Todo nome de fator/comando/parâmetro citado no material deve ter sido conferido na fonte no dia da escrita. Busque também "X 2026" para capturar mudanças recentes — o cutoff de conhecimento do modelo NUNCA é confiável para versões e preços.

### M04 · Design Docs com IA (4 blocos)
- **C4 Model:** c4model.com (Simon Brown — níveis contexto/containers/componentes/código) e a doc de diagramas C4 do Mermaid (mermaid.js.org — sintaxe `C4Context` etc.).
- **Mermaid:** mermaid.js.org/intro — flowchart, sequence, class, ER, state (os 5 que o curso usa).
- **ADR:** adr.github.io (formatos, MADR 4.x), github.com/joelparkerhenderson/architecture-decision-record (exemplos reais). O template do repo já existe em `docs/adr/0000-template.md`.
- **Postmortem blameless:** Google SRE Book, cap. "Postmortem Culture" (sre.google/sre-book) — gratuito online.
- **Taxonomia de documentação:** diataxis.fr (tutorial/how-to/reference/explanation) — vale caixa de contexto.
- **Docs como contexto para agentes:** blog de engenharia da Anthropic sobre "effective context engineering" e o conceito de docs como fonte de contexto; AGENTS.md (agents.md) como convenção emergente.
- **Ganchos internos:** o mini-projeto documenta o Capstone usando `docs/spec/capstone/` criado no M01 bloco 5. O exercício do postmortem usa incidente real do trabalho do aluno.

### M05 · LLM na prática: contrato, custo, gateway, cache (7 blocos)
- **APIs:** docs.anthropic.com (Messages, tool use, prompt caching — as regras de estrutura de prompt para cache hit), platform.openai.com/docs (structured outputs, function calling). Comparar os DOIS formatos = agnosticismo.
- **Tokenização:** tiktokenizer (tiktokenizer.vercel.app) para demonstração visual; docs do tiktoken.
- **Context rot:** pesquisa da Chroma "Context Rot" (research.trychroma.com) — a fonte do termo.
- **Gateway:** docs.litellm.ai (proxy, router, fallbacks, budgets por chave/time — o curso usa LiteLLM), e conceito de AI Gateway em blogs de engenharia (Cloudflare AI Gateway docs como contraponto).
- **Resiliência:** tenacity.readthedocs.io (retry), conceitos de circuit breaker (Polly é a ponte .NET do aluno).
- **Custo:** páginas de preço oficiais da Anthropic/OpenAI NO DIA DA ESCRITA (mudam; nunca confie no cutoff). O checkpoint do módulo pede conta de custo mensal — o material precisa de números reais com data.
- **Streaming/SSE:** MDN (Server-Sent Events) para a caixa de contexto; docs de streaming das APIs.
- **Ganchos internos:** o serviço construído vira `services/llm/` do Capstone; Little's Law (M02 bloco 4) dimensiona o gateway; fator 4 do 12-factor (M01) fundamenta "tool = structured output".

### M06 · Evals e observabilidade (6 blocos)
- **Evals:** docs da Anthropic sobre evals (guia "define success criteria" / "develop tests"); Hamel Husain "Your AI Product Needs Evals" (hamel.dev) — o texto de referência da área; promptfoo.dev (evals em CI, o tooling que o curso pode usar); OpenAI evals cookbook.
- **LLM-as-judge e vieses:** paper "Judging LLM-as-a-Judge" (Zheng et al., o dos vieses de posição/verbosidade/auto-preferência) — verificar citação exata.
- **Observabilidade:** langfuse.com/docs (tracing, custo por usuário/prompt — self-hosted, bom para o curso), OpenTelemetry GenAI semantic conventions (opentelemetry.io — convenções para LLM spans, ainda em evolução: checar estado atual).
- **Taxonomia de datasets:** o CURRICULO.md já traz a tabela (golden path / fora de escopo / injection / vazamento / ação destrutiva / bordas) — desenvolvê-la com exemplos concretos do extrator do M05.
- **Ganchos internos:** a suíte avalia o extrator do M05; o gate de CI reusa o padrão do M03 bloco 7; regressão comportamental é O conceito central do módulo (cenário v14→v15 do CURRICULO.md).

### M07 · RAG de verdade (8 blocos)
- **pgvector:** github.com/pgvector/pgvector (README é excelente: HNSW vs IVFFlat, operadores, tuning) + pgvector-python (integração SQLAlchemy).
- **Busca híbrida:** full-text search do Postgres (tsvector/tsquery — a metade BM25-ish) + RRF (Reciprocal Rank Fusion — paper original de Cormack/Clarke é curto); artigos da Supabase/Neon sobre hybrid search em Postgres são bons guias práticos.
- **Chunking e retrieval:** Anthropic "Contextual Retrieval" (anthropic.com/news/contextual-retrieval — chunking com contexto + o pipeline com reranking e números de recall); pesquisa da Chroma sobre chunking strategies.
- **Reranking:** docs da Cohere Rerank e cross-encoders da sentence-transformers (sbert.net).
- **Avaliação de RAG:** docs.ragas.io (faithfulness, context precision/recall) — mas ensinar as métricas manualmente primeiro, framework depois.
- **Embeddings:** docs de embeddings da OpenAI/Voyage; MTEB leaderboard (huggingface.co/spaces/mteb/leaderboard) para o estado da arte do momento.
- **Ganchos internos:** o corpus é código .NET legado (conectar com o trabalho do aluno); o filtro ACL-antes-da-busca já está detalhado no CURRICULO.md (pseudocódigo pronto); as 3 perguntas que o RAG erra são a ponte para o M10.

### M08 · Agentes: padrões e context engineering (8 blocos)
- **A fonte nº 1:** Anthropic "Building Effective Agents" (anthropic.com/research/building-effective-agents) — workflows vs agents, os 5 padrões compostáveis (chaining, routing, parallelization, orchestrator-workers, evaluator-optimizer). O CURRICULO.md segue essa taxonomia.
- **Context engineering:** Anthropic engineering blog "Effective context engineering for AI agents"; posts do Lance Martin (LangChain) sobre context engineering.
- **Tool design:** Anthropic "Writing tools for agents" (engineering blog) — nomes, erros que ensinam, economia de tokens.
- **12-Factor Agents:** github.com/humanlayer/12-factor-agents (já verificado — nomes corretos no M01).
- **Frameworks (panorama honesto):** docs do LangGraph, CrewAI, Pydantic AI (ai.pydantic.dev — o mais alinhado com o curso por ser tipado), Google ADK, Microsoft Agent Framework (learn.microsoft.com — a ponte .NET do aluno! GA em 2026, sucessor de Semantic Kernel/AutoGen).
- **As 3 simplificações erradas** já estão escritas no CURRICULO.md e em docs/mapa-conceitual.md — desenvolver, não reinventar.
- **Ganchos internos:** o agente investigador de código usa as ferramentas restritas do M00 bloco 3 como precedente; o exercício "mesmo problema como workflow determinístico" usa os evals do M06 para comparar.

### M09 · Protocolos: MCP e A2A (7 blocos)
- **MCP:** modelcontextprotocol.io (spec oficial — CONFERIR a revisão vigente da spec e o estado dos transportes: stdio e streamable HTTP; a nomenclatura de transporte mudou ao longo de 2025). Primitivas: tools, resources, prompts + sampling/elicitation.
- **FastMCP:** gofastmcp.com (o framework Python que o curso usa — v2.x) e o SDK oficial python-sdk do repositório modelcontextprotocol.
- **A2A:** a2a-protocol.org / repositório do projeto na Linux Foundation (doado pelo Google em 2025) — agent cards, tasks, messages, parts, artifacts. Verificar estado de adoção em 2026 e ser honesto sobre maturidade menor que MCP.
- **Segurança MCP:** seção de security best practices da spec; pesquisas sobre tool poisoning (Invariant Labs foi quem cunhou); princípio de "dado não confiável entrando no contexto" conecta com M07 (ACL) e M12 (injection).
- **Docker MCP Toolkit:** docs.docker.com/ai/mcp-catalog-and-toolkit.
- **Ganchos internos:** o aluno JÁ construiu um servidor MCP de brinquedo no M00 bloco 4 (bloco-4-mcp-e-hooks.html — LER antes de escrever o M09 para não repetir nem contradizer); o mini-projeto expõe o índice do sistema legado; o exercício (MCP do Azure DevOps) é o "primeiro entregável monetizável".

### M10 · Graph engineering e saúde arquitetural (10 blocos)
- **LangGraph:** langchain-ai.github.io/langgraph — conceitos: StateGraph, nós/arestas condicionais, checkpointing/persistence (a killer feature para o curso), human-in-the-loop, subgraphs. Verificar versão/API atual (mudou bastante em 2025).
- **Durabilidade além de LangGraph:** docs do Temporal (conceito de durable execution) — 1 caixa de contexto comparativa basta.
- **GraphRAG:** microsoft.github.io/graphrag (o paper/repo original — comunidades, sumarização hierárquica); Neo4j GenAI docs (neo4j.com/docs — Cypher básico + vector index híbrido); Apache AGE (age.apache.org) como alternativa Postgres-only alinhada com a stack do curso.
- **Memória de agente com grafo temporal:** Graphiti/Zep (github.com/getzep/graphiti — fatos com validade temporal).
- **Métricas de saúde arquitetural:** Robert Martin "Clean Architecture" caps. de component coupling (Instabilidade I = Ce/(Ca+Ce), Abstratividade A, Distância D = |A+I-1|, zona de dor/inutilidade) — a formulação original; docs do NDepend explicam bem as métricas (e são a ponte .NET). Para calcular em Python: análise de imports com grep/ast + networkx.
- **Ganchos internos:** o orquestrador executa o fluxo do Capstone (ingestão→parse→grafo→análise→revisão→relatório) com retomada pós-falha (o checkpoint do módulo mata o processo no meio); o grafo de conhecimento responde as 3 perguntas do M07; as métricas transformam o Capstone em "diagnóstico com número" (pitch de venda do CURRICULO.md).

### M11 · Fundamentos de ML/DL e modelos locais (8 blocos)
- **Transformer do zero:** Karpathy — "Neural Networks: Zero to Hero" / nanoGPT (github.com/karpathy/nanoGPT) e o vídeo "Let's build GPT" — a referência pedagógica; Sebastian Raschka "Build a Large Language Model (From Scratch)" (github.com/rasbt/LLMs-from-scratch) para código limpo e moderno; 3Blue1Brown série de transformers para as visualizações de atenção.
- **Paper:** "Attention Is All You Need" (Vaswani et al. 2017) — citar, não exigir leitura.
- **PyTorch:** pytorch.org/tutorials (tensores, autograd, nn.Module).
- **Local:** docs do Ollama (ollama.com — Modelfile, API, tool calling local: TESTAR o estado atual do suporte a tools), Hugging Face (hub, transformers), quantização GGUF (docs do llama.cpp).
- **"Por que modelo bom em código falha em modo agente":** Berkeley Function Calling Leaderboard (gorilla.cs.berkeley.edu/leaderboard) — evidência mensurável de que tool calling ≠ capacidade de código; a lista de competências do CURRICULO.md (instruction following, schema adherence, estado multi-turno...) já está pronta para desenvolver.
- **Fine-tuning:** docs de LoRA/QLoRA da HF (peft) — com a tese do curso: "quando fine-tuning é a resposta errada (quase sempre)".
- **Ganchos internos:** o exercício roda o extrator do M05 em modelo local e compara com os evals do M06 (acurácia, latência, custo) — as três peças se encontram aqui.

### M12 · Produção: segurança, multi-tenant, billing, SRE (9 blocos)
- **OWASP:** genai.owasp.org — "OWASP Top 10 for LLM Applications" (usar a versão 2025, LLM01–LLM10; verificar se saiu atualização 2026). Prompt injection direta/indireta: blog do Simon Willison (simonwillison.net/tags/prompt-injection) é a melhor fonte contínua.
- **Multi-tenant RLS:** docs do Postgres (Row Security Policies) + artigos de referência sobre RLS multi-tenant (Crunchy Data, AWS); isolamento de embeddings por tenant conecta com M07.
- **Idempotência e billing:** docs da Stripe (stripe.com/docs) — idempotent requests, webhooks (verificação de assinatura + idempotência do handler), usage-based billing, trials, dunning. Para o Brasil: docs de Asaas/Pagar.me (comparação de 1 parágrafo basta).
- **Human-in-the-loop como política:** o CURRICULO.md já tem o desenho (LLM → tool proposta → POLICY → aprovação → execução); conectar com fator 7 do 12-factor (M01) e interrupts do LangGraph (M10).
- **LGPD:** texto da lei + guias da ANPD para o essencial aplicado (base legal, retenção, exclusão, "dado do cliente não vira treino").
- **SRE com IA:** Google SRE Book (golden signals, error budgets — reciclagem) + práticas de AIOps com supervisão humana.
- **Ganchos internos:** o exercício é um relatório de ataque contra o próprio Capstone (10 vetores de injection via código ingerido — conecta com M07/M09); o checkpoint calcula margem bruta do plano de entrada (usa o custo unitário do M05).

### M13 · Capstone (20 blocos)
- **Fonte principal: `docs/projeto-final.md` do próprio repo** (leia primeiro — o produto já está definido lá) + TODAS as "peças do produto" entregues nos M01–M12.
- **Formato diferente:** M13 não é teoria nova — é um guia de execução por fases (integração das peças, hardening, landing page, lançamento, primeiro usuário, post público). O material deve ser um roteiro de projeto com critérios de aceitação por fase, não blocos de conceito. Meta de densidade menor por "bloco" é aceitável (~500–800 palavras/bloco), mas com MUITO critério verificável.
- **Parse de código .NET para o grafo:** tree-sitter (tree-sitter.github.io) com a gramática C# — verificar o binding Python atual.
- **Go-to-market:** nada exótico — landing (a própria API serve estático ou Fly + página), post técnico (o entregável obrigatório do CURRICULO.md).

### M00 (tarefa menor de consistência)
O M00.html original é bom mas anterior à reforma. Depois de M04–M13 prontos, fazer UMA passada de consistência: conferir se referências e nomenclatura (ex.: skills/subagentes/hooks) continuam alinhadas com o que os módulos regenerados citam, e se o bloco 5 (comando `/bloco`, integração) está com prática completa. Não regenerar do zero sem necessidade.

---

## 4. Fundamentos de engenharia a reciclar (caixas `.box.fund`)

Decisão do aluno (12/08/2026): fundamentos entram **integrados nos módulos** (caixa no ponto de uso) **+ um guia de referência único** em `docs/fundamentos-de-engenharia.md` (AINDA NÃO CRIADO — criar ao final, compilando as caixas escritas, organizadas por tema, com link para o módulo/bloco onde cada uma vive).

Já cobertos (não duplicar; referenciar): requisitos (M01b1) · fail fast/shift left (M01b2) · função pura/idempotência/event sourcing (M01b3) · concorrência, estado compartilhado, Amdahl (M01b4) · tipagem nominal×estrutural (M02b2) · parse don't validate/trust boundary (M02b3) · Little's Law (M02b4) · RAII/imutabilidade/semântica de referência (M02b5) · pirâmide de testes na era IA (M02b6) · HTTP/REST/idempotência de verbos (M03b1) · ACID/isolamento (M03b2) · índices/planos (M03b3) · coesão/acoplamento/Dependency Rule (M03b4) · 12-Factor App config/logs (M03b5/b7) · qualidades de teste de integração (M03b6) · três perguntas de release (M03b7).

A distribuir nos pendentes (sugestão de encaixe):

| Fundamento | Onde encaixa |
|---|---|
| Comunicação técnica escrita; "writing is thinking" | M04 (design docs) |
| Diagramas como modelo mental compartilhado; abstração e níveis | M04 (C4) |
| Teoria de cache: invalidação, TTL, cache-aside, write-through, LRU/LFU; os "2 problemas difíceis" | M05 (caching) |
| Filas, backpressure e sistemas produtor-consumidor | M05 (streaming/async) |
| Teoria de decisão sob incerteza; estatística básica: amostragem, significância, p95 vs média | M06 (evals e métricas) |
| Information retrieval clássica: TF-IDF/BM25, precision/recall/F1, relevância | M07 (busca híbrida) |
| Segurança: least privilege, defense in depth, canais de confiança | M07 (ACL) e M09 (MCP security) |
| Design de API públicas: contratos, versionamento, erros acionáveis (retomada do M03b1 aplicada a tools) | M08/M09 (tool design) |
| Máquinas de estado formais; grafos: nós/arestas/travessia/DAG | M10 (LangGraph e grafo de conhecimento) |
| Teorema CAP e consistência eventual (checkpointing distribuído) | M10 (durabilidade) |
| Álgebra linear mínima: vetor, produto escalar, matriz; gradiente como derivada | M11 (transformer) |
| Probabilidade: distribuição, amostragem, temperatura como reescala | M11 (por que aluciona) |
| OWASP clássico (injection, authz) como base do OWASP-LLM; modelagem de ameaças (STRIDE resumido) | M12 (segurança) |
| Unit economics: custo unitário, margem, CAC/LTV em 1 caixa | M12 (billing) |
| Golden signals, SLI/SLO/error budget | M12 (SRE) |
| Gestão de projeto por fases e critérios de aceitação; definition of done | M13 (execução) |

---

## 5. Ordem de trabalho recomendada e logística

1. **Ordem vigente:** especificar M12 → especificar M13 → especificar LT01–LT04 → regenerar M12 → regenerar M13 → produzir LT01–LT04 → auditar M00–M11 → consolidar fundamentos → automatizar os gates. O detalhe e o status ficam em `docs/STATUS-IMPLEMENTACAO-CURSO.md`.
2. **Uma unidade por vez, entregue completa** (rastreabilidade + HTML/README + evidências + gates) antes de começar a próxima. Qualidade prevalece sobre lote.
3. **Antes da release v4.0:** criar `docs/fundamentos-de-engenharia.md`, revisar M00–M11, manter `CURRICULO.md` como índice fiel e aprovar G0–G6 para todas as 135 unidades de estudo.
4. **Não tocar:** `PROGRESSO.md` (diário do aluno), `.claude/` (artefatos que ELE constrói nos exercícios), `docs/adr/`.
5. **Commits:** em inglês, padrão `M0X: <verbo imperativo>`. Um commit por módulo regenerado é aceitável.
6. **Validação final de cada módulo:** o script do §2 + abrir no navegador (dark mode e print também) + conferir que TODAS as perguntas do checkpoint têm resposta no corpo do material (é o teste que os arquivos antigos falhavam).

## 6. Notas de calibração por tamanho

- M04 (4 blocos): ~6.500–7.500 palavras está ok — módulo curto.
- M05–M09 (6–8 blocos): 8.000–10.000.
- M10 (10 blocos): 10.000–12.000 — pode dividir a Parte 3 (métricas) num arquivo separado estilo `bloco-4` do M00 se passar disso.
- M11 (8 blocos): 9.000–11.000 — o código PyTorch do transformer (~200 linhas) conta como conteúdo, mas precisa de explicação camada a camada, não só listagem.
- M12 (9 blocos): 13.000–16.000, conforme `docs/especificacoes/M12-ESPECIFICACAO.md`; dividir catálogo red-team em companion se necessário.
- M13 (20 blocos): 14.000–18.000, conforme `docs/especificacoes/M13-ESPECIFICACAO.md`; formato roteiro executável, denso em integração, evidências e critérios.

Boa geração. O aluno estuda de verdade com este material — cada parágrafo raso que passar vira uma pergunta que ele não consegue responder no checkpoint.
