# Currículo — Engenharia de Software e IA em Python

**Aluno:** Denisson · **Origem:** engenharia de software sênior · **Destino:** engenheiro de software e sistemas de IA em produção
**Carga total:** 304h em 15 módulos + 4 laboratórios transversais · **Unidade de estudo:** bloco de 2h
**Ritmo irregular:** semana de 4h = 2 blocos · semana de 20h = 10 blocos · previsão realista: **7 a 10 meses**

> **v4 em estruturação** — núcleo ampliado para 128 blocos e 24 blocos transversais, totalizando 152 blocos/304h. O M02A teve o escopo aprovado em G0; sua implementação está em produção. Plano e status: [`docs/PLANO-ESTRUTURACAO-CURSO-2026.md`](docs/PLANO-ESTRUTURACAO-CURSO-2026.md) e [`docs/STATUS-IMPLEMENTACAO-CURSO.md`](docs/STATUS-IMPLEMENTACAO-CURSO.md).

---

## As duas transformações — leia isto antes do mapa

Existem duas coisas diferentes acontecendo ao mesmo tempo, e confundi-las é o erro mais caro do campo:

| | Desenvolver software **usando** IA | Desenvolver software **contendo** IA |
|---|---|---|
| Pergunta | "como faço a IA construir meu software direito?" | "como construo um sistema cuja arquitetura tem IA dentro?" |
| Onde | **M00 – M04** | **M05 – M13** |
| Resultado | você entrega mais rápido | você constrói a próxima geração de produto |

Dominar Claude Code, OpenCode, Codex ou qualquer outro harness não é dominar engenharia de software com IA. É a camada de superfície. Este currículo ensina a mecânica dos **harnesses de agente, engenharia de contexto, contratos e protocolos abertos** para que o conhecimento sobreviva à troca de ferramenta, framework, modelo ou provedor. As duas transformações existem nessa ordem porque a primeira acelera o aprendizado da segunda.

A hierarquia completa de conceitos — LLM, prompt, tool, MCP, RAG, agent loop, agent, workflow, memory, harness, eval, observability — está em [`docs/mapa-conceitual.md`](docs/mapa-conceitual.md). **Leia junto com o M00.** É a defesa contra a sopa de siglas, e tem as três simplificações mais comuns do mercado corrigidas.

---

## Mapa

| # | Módulo | Blocos | Entrega para o produto final |
|---|--------|--------|------------------------------|
| M00 | Harness engineering e trabalho seguro com IA | 5 | instruções portáteis, skill, delegate, MCP e ação invocável |
| M01 | **Workflow IA-driven: SDD e Harness Engineering** | 5 | O método com que você constrói tudo depois |
| M02 | Python 3.14 para engenharia profissional | 8 | Pacote instalável, tipado, concorrente e testado |
| M02A | Engenharia de Software Sênior em 2026 | 15 | `work-intake`, decisões e evidência Python-first |
| M03 | FastAPI, Postgres, Docker, CI | 8 | Esqueleto da API do produto |
| M04 | **Design Docs com IA** | 4 | PRD, C4, ADRs e guidelines do produto |
| M05 | LLM na prática: contrato, custo, gateway, cache | 7 | Camada de LLM do produto |
| M06 | **Evals e observabilidade** | 6 | Suíte de avaliação — o diferencial |
| M07 | RAG de verdade | 8 | Busca híbrida sobre o corpus |
| M08 | Agentes: padrões e context engineering | 8 | Agente investigador |
| M09 | Protocolos: MCP e A2A | 7 | Servidor MCP do produto |
| M10 | **Graph engineering + saúde arquitetural** | 10 | Grafo de conhecimento + orquestrador |
| M11 | Fundamentos de ML/DL e modelos locais | 8 | Entendimento de custo, latência e limites |
| M12 | Produção: segurança, multi-tenant, billing, SRE com IA | 9 | Produto vendável |
| M13 | **Capstone** — o produto | 20 | Lançamento |
| LT01 | Runtime, Linux e redes | 6 | Diagnóstico operacional da API |
| LT02 | Sistemas distribuídos, dados e mensageria | 6 | Jobs recuperáveis sem efeitos duplicados |
| LT03 | Cloud-native, IaC, GitOps e plataforma | 6 | Deploy declarativo com rollback |
| LT04 | Qualidade avançada, supply chain e governança de IA | 6 | Dossiê verificável de release |

**Os quatro módulos em negrito são os que o mercado mais valoriza e menos gente sabe.** M01 é produtividade real; M06 é o principal sinal de contratação em IA; M10 é o que quase nenhum curso cobre; M13 é a prova.

---

## Como cada módulo é estruturado

```
1. Por que isso importa          (5 min de leitura)
2. Conceito em Python; ponte com experiência anterior quando útil (15 min)
3. Mini-projeto guiado           (1 a 2 blocos) — você digita, eu reviso
4. Exercício sozinho             (1 bloco) — sem pista até você pedir
5. Peça do produto final         (1 bloco) — vai para /capstone
6. Checkpoint                    (30 min) — só passa se explicar + rodar + testar
```

O método de estudo — como começar, como retomar, como testar retenção — está em [`docs/como-estudar.md`](docs/como-estudar.md). **Leia antes do M00.**

---

# FASE 0 — Pilotar a IA

## M00 · Harness engineering e trabalho seguro com IA · 5 blocos

**Material completo:** [`modulos/M00-ferramental/M00.html`](modulos/M00-ferramental/M00.html) — abra no navegador.

Cinco blocos progressivos, todos com prática:

| Bloco | Tema | Você constrói |
|---|---|---|
| 1 | modelo, harness, workflow, agente e task contract | contrato de uma tarefa real |
| 2 | instruções, Agent Skills e seleção de contexto | núcleo portátil + adapters mínimos |
| 3 | tools, delegates, permissões e conteúdo não confiável | policy executável de menor privilégio |
| 4 | skills, interfaces slash, hooks e MCP | skill portátil, ação `finish-study-block` e capability MCP |
| 5 | loop operacional, avaliação e checkpoint | scorecard, handoff e ADR de harness |

Heurística inicial: **skill empacota conhecimento/procedimento; MCP conecta capabilities; delegate separa trabalho/contexto; slash é apenas uma interface de invocação do host**. Nas bordas, decida por autoridade, ciclo de vida e evidência.

---

## M01 · Workflow IA-driven: SDD e Harness Engineering · 5 blocos ⭐ NOVO

**Por que:** o M00 te deu as peças. Este te dá o **método**. É a diferença entre "pedi pra IA e ela destruiu o código bom que ela mesma escreveu" e um fluxo previsível. É também o módulo que se paga mais rápido — você aplica no seu trabalho .NET amanhã, sem esperar aprender Python.

**Conceitos**

- **Spec-Driven Development (SDD).** A especificação vira o artefato principal; o código é saída gerada. Em vez de descobrir requisito conversando com a IA, você entrega o "o quê", o "por quê" e — crucialmente — o "o que NÃO construir" antes de qualquer código. *Equivalente:* é o velho documento de requisitos, mas agora executável e com um consumidor que realmente lê tudo.
  - Os três níveis: PRD → especificação técnica → plano de implementação por fase.
  - Ciclo: pesquisar → planejar → implementar → verificar.
  - Ferramental: GitHub Spec Kit, ou seu próprio conjunto de skills (`prd-writer`, `spec-writer`, `plan-writer`).
- **Harness Engineering.** O andaime em volta do agente: artefatos, estado, unidades pequenas e verificáveis, gates mecânicos, rubricas de avaliação. A distinção que importa: *prompt engineering* é o que você diz; *context engineering* é o que ele vê; *harness engineering* é a estrutura que o impede de se perder.
  - Context anxiety e autoavaliação — por que o agente degrada em tarefa longa.
  - Guardrails mecânicos: se o teste tem que passar, faça o CI reprovar, não peça educadamente no prompt.
- **12-Factor Agents.** Os doze princípios do HumanLayer. A tese central, e você vai ouvir de mim o curso inteiro: **os sistemas de IA que funcionam em produção são código majoritariamente determinístico com passos de LLM colocados nos pontos certos** — não loops autônomos até resolver. Os que mais importam para você: possuir o próprio prompt, possuir a própria janela de contexto, possuir o próprio fluxo de controle, ferramentas são saída estruturada, agentes pequenos e focados, erros compactados, launch/pause/resume.
- **Paralelização.** Subagentes em lote, arquitetura de orquestrador para economizar token, waves e consolidação, resolução de conflito entre features. Multi-sessão com tmux ou worktrees do git.

**Mini-projeto:** construir seu kit de SDD — as skills `prd-writer`, `spec-writer` e `plan-writer`, mais um `contract.md` que define o que conta como "pronto". Usar o kit para especificar o próprio Capstone. **A especificação do produto final sai deste módulo.**

**Exercício:** pegar uma feature real do seu trabalho em .NET e executá-la ponta a ponta com SDD. Medir: tempo, retrabalho e quantas vezes você precisou corrigir a IA. Comparar com a sua média anterior. É o número que você leva para o seu gestor.

**Peça do produto:** `docs/spec/` do Capstone.

**Checkpoint:** demonstrar duas features implementadas em paralelo por subagentes sem conflito, e explicar qual gate mecânico impediu cada uma de sair do trilho.

---

# FASE 1 — Base de engenharia

## M02 · Python 3.14 para engenharia profissional · 8 blocos

**Especificação:** [`docs/especificacoes/M02-ESPECIFICACAO.md`](docs/especificacoes/M02-ESPECIFICACAO.md) — G0–G6 verificados em 15/08/2026.

**Por que:** a transição sênior exige mais que sintaxe e analogias com C#. O aluno precisa entender runtime, imports, distribuição, typing gradual, trust boundaries, concorrência estruturada, paralelismo, recursos, diagnóstico e testes como um sistema coerente. Python é a implementação canônica; .NET é ponte comparativa, não molde.

**Blocos:**

1. projeto, ambientes, dependências, build e distribuição;
2. modelo de objetos, imports, recursos e exceções;
3. typing gradual, Protocols, genéricos e narrowing;
4. Pydantic e contratos de trust boundary;
5. `asyncio`, TaskGroup, cancelamento, timeout e backpressure;
6. threads, processos, subinterpreters e free-threading;
7. Python idiomático com logging, encoding, profiling e operação;
8. testes unitários/integração/propriedade/mutação, CLI e entrega.

**Mini-projeto:** `csv-cleaner` Python 3.14 instalável por wheel, tipado, validado e testado. O núcleo não depende de internet; portabilidade Linux, CPython 3.14t, servidor local de diagnóstico e instalação limpa foram verificados.

**Peça do produto:** pacote `core/` com domínio e ports sem dependência de framework web ou provedor de IA.

**Checkpoint:** executar gate completo, instalar o wheel fora do checkout, reproduzir duas falhas semeadas e defender uma decisão entre asyncio, thread, processo e interpreter com evidência do próprio ambiente.

---

## M02A · Engenharia de Software Sênior em 2026 · 15 blocos

**Especificação:** [`docs/especificacoes/M02A-ESPECIFICACAO.md`](docs/especificacoes/M02A-ESPECIFICACAO.md) — G0 aprovado em 15/08/2026; G1 em produção; G2–G6 pendentes.

**Por que:** experiência em uma plataforma não substitui uma base atualizada de engenharia. Este módulo ensina julgamento, mudança segura e prova reproduzível antes de o curso entrar em web, sistemas distribuídos e sistemas de IA especializados.

**Decisão de linguagem:** Python 3.14 é a implementação canônica. .NET 10 aparece somente em um corte vertical comparativo para explicitar diferenças de runtime, tipos, DI, cancelamento e distribuição; não constitui uma segunda trilha nem pré-requisito.

**Blocos:**

1. papel sênior, produto, risco, sistema sociotécnico e evidência;
2. requisitos, atributos de qualidade, ADR/RFC e C4;
3. modularidade, acoplamento, domínio e arquitetura hexagonal;
4. contratos, compatibilidade, versionamento e interoperabilidade;
5. dados, transações, idempotência, índices e evolução de schema;
6. runtime, concorrência estruturada, cancelamento e backpressure;
7. tempo, falhas parciais, consistência e limites de sistemas distribuídos;
8. estratégia de testes, propriedades, mutação e testabilidade;
9. secure SDLC, threat modeling, privacidade e trust boundaries de IA;
10. OpenTelemetry, SLI/SLO, incidentes, runbooks e postmortems;
11. complexidade, estruturas de dados, performance, capacidade, cache e custo;
12. Git, modernização incremental de legado, entrega, flags e rollback;
13. Python sênior aplicado a um produto instalável e operável;
14. ponte comparativa .NET → Python, sem falsa equivalência;
15. engenharia AI-native, evals, revisão, governança e liderança técnica.

**Mini-projeto:** `work-intake`, monólito modular local de triagem assistida por IA. Uma política determinística decide; um `Advisor` agnóstico, offline e substituível apenas recomenda. SQLite, fila local limitada, schemas versionados, telemetria e evidence manifest permitem provocar e diagnosticar falhas sem antecipar FastAPI, PostgreSQL, Docker, broker ou cloud.

**Peça do produto:** padrão reutilizável de domínio/ports/adapters, contratos, ADRs, threat model, SLO, runbook e gate de evidência para os módulos seguintes.

**Checkpoint:** reconstruir o artefato Python, executar corpus e falhas negativas, demonstrar transação/isolamento/backpressure/cancelamento, trocar o advisor sem alterar domínio/política, reverter uma policy defeituosa e defender quais garantias continuam locais. O corte .NET compara somente a capability contratual.

---

## M03 · FastAPI, Postgres, Docker, CI · 8 blocos

**Por que:** aqui você mata o gap de DevOps. Sair de "faço git push e alguém configurou o resto" para "eu levanto e publico sozinho".

**Conceitos**
- FastAPI: roteamento, dependências (é DI, e mais ergonômica que a do ASP.NET), middlewares, OpenAPI automático, background tasks.
- SQLAlchemy 2.0 async + Alembic. *Equivalente:* EF Core + Migrations. As diferenças de sessão e unit-of-work importam.
- Postgres para valer: índices, `EXPLAIN ANALYZE`, transações, e por que `JSONB` salva produto de IA.
- Docker e Compose do zero: multi-stage, camadas, `.dockerignore`, healthcheck.
- GitHub Actions: lint → type-check → teste → build → deploy.
- Deploy real em Railway ou Fly.io. Domínio, HTTPS, variáveis de ambiente, logs.
- Estrutura que escala (não é MVC): `api/ core/ services/ repositories/ workers/`.
- Testes na era da IA: caminho feliz, caminho triste, edge cases; cobertura vs. valor real; TDD com agente; snapshot testing.

**Mini-projeto:** API de encurtador de links com Postgres, migrations, testes de integração com container, Compose e CI verde.

**Exercício:** publicar em produção, com domínio próprio, e medir latência p95. Sozinho, sem eu configurar nada.

**Peça do produto:** esqueleto do backend do Capstone, no ar, vazio mas deployado.

**Checkpoint:** derrubar o Postgres e mostrar que a API degrada com erro claro em vez de travar; explicar cada linha do Dockerfile.

---

## LT01 · Runtime, Linux e redes · 6 blocos

**Especificação:** [`docs/especificacoes/LT01-ESPECIFICACAO.md`](docs/especificacoes/LT01-ESPECIFICACAO.md) — G0 aprovado.

**Por que:** um sênior de produção precisa explicar o que acontece abaixo do framework. Este laboratório conecta Python e FastAPI a processos, recursos do sistema operacional, DNS, TCP, TLS e comportamento real de conexões.

**Conceitos:** processos, threads, sinais, file descriptors, filesystem e permissões; DNS e estabelecimento de conexão; TCP, TLS, HTTP/1.1, HTTP/2 e HTTP/3; pools, timeouts, cancelamento, limites e saturação; diagnóstico orientado por logs, métricas, traces e ferramentas do sistema.

**Laboratório:** receber uma API propositalmente degradada, reproduzir falhas de DNS, pool, timeout e esgotamento de recursos, formar hipóteses e corrigir a causa com evidência.

**Checkpoint:** diagnosticar um incidente inédito sem tentativa aleatória e explicar o caminho completo da requisição do cliente ao processo Python.

---

## M04 · Design Docs com IA · 4 blocos ⭐ NOVO

**Por que:** documentação deixou de ser burocracia e virou **o insumo que a IA lê para saber o que construir**. Um design doc bem feito é context engineering aplicado ao ciclo inteiro do projeto. E, no seu caso, tem um bônus grande: o Capstone **gera documentação** — você não consegue construir um bom gerador de docs sem saber o que é uma boa doc.

**Conceitos**
- O mapa dos formatos e quando cada um serve:

| Categoria | Documentos |
|---|---|
| Produto | PRD, TRD, FRD, user stories, epics |
| Decisão | RFC, **ADR** (e MADR) |
| Guidelines | workflow, coding standards, code review, testing |
| Arquitetura | High Level Design, Feature Design Doc, **C4** |
| Operação | runbook, playbook, postmortem |

- **Documentação como contexto:** o que entra no contexto do agente e o que não entra. Doc desatualizada é pior que doc ausente — ela envenena o agente com confiança.
- **Diagramas gerados:** C4 (contexto, containers, componentes, código) e Mermaid (flowchart, sequência, classe, ER, estado). Diagrama como texto versionado é a única forma que sobrevive.
- **ADR na prática:** estrutura, status, metadados, quando usar e **quando evitar** (nem toda decisão merece ADR — só as caras de reverter).
- Geração e, principalmente, **manutenção** automatizada: o agente que comenta no PR quando a mudança contradiz a doc.

**Mini-projeto:** documentar o Capstone por completo — PRD, High Level Design, diagramas C4 em Mermaid, engineering guidelines. Tudo gerado com apoio de IA e revisado por você.

**Exercício:** escrever um postmortem de um incidente real que você viveu no trabalho, no formato blameless. Depois pedir para um agente criticar o seu postmortem. É desconfortável e é o exercício mais útil do módulo.

**Peça do produto:** `docs/` completo do Capstone — e o gabarito do que o produto deve gerar.

**Checkpoint:** dado um ADR seu, eu vou tentar derrubar a decisão. Você defende ou reconhece que errou. Ambos valem.

---

# FASE 2 — Engenharia de LLM

## M05 · LLM na prática: contrato, custo, gateway, cache · 7 blocos

**Por que:** 95% do trabalho de engenheiro de IA é construir software **em volta** do modelo. Esta é a interface.

**Conceitos**
- Tokenização, janela de contexto, e por que "contexto longo" não resolve tudo (*context rot*).
- Amostragem: temperatura, top-k, top-p, `max_tokens`, stop sequences, seed. O que cada um faz de verdade.
- **Structured output**: forçar schema Pydantic. É o fim do parsing com regex. Agnóstico via JSON Schema.
- **Tool calling**: o loop modelo pede → você executa → devolve → continua. E o princípio do M01: ferramenta é saída estruturada.
- Streaming: SSE, latência percebida, backpressure. Quando transformar IA em processamento assíncrono.
- **Caching, com profundidade** — é o maior redutor de custo que existe:
  - fundamentos e invalidação (TTL, cache-aside, write-through);
  - políticas de despejo (LRU, LFU, FIFO);
  - **prompt caching** nos provedores — e como estruturar o prompt para o cache pegar (prefixo estável primeiro, variável por último);
  - cache de embeddings e de contexto em RAG.
- **AI Gateway** — o padrão que quase ninguém no Brasil conhece e todo time grande usa:
  - múltiplos provedores atrás de uma interface (LiteLLM como proxy e router);
  - governança: acesso, quota, custo por time;
  - resiliência: timeout, retry, fallback entre modelos.
  - *Equivalente:* é um API gateway, com roteamento por custo e qualidade em vez de por rota.
- **Custo e latência como requisito de primeira classe:** contar tokens, R$ por request, modelo barato para classificar e caro para raciocinar.

**Mini-projeto:** serviço que recebe um documento e devolve objeto Pydantic validado, atrás de um gateway com dois provedores, prompt caching ativo e contador de custo por request.

**Exercício:** derrubar o provedor primário e provar que o fallback funciona sem o cliente perceber. Depois medir quanto o prompt caching economizou em 100 requests.

**Peça do produto:** `services/llm/` do Capstone.

**Checkpoint:** dado um volume de 10.000 requests/mês, calcular o custo mensal e apresentar duas otimizações com o impacto em R$ de cada uma.

---

## LT02 · Sistemas distribuídos, dados e mensageria · 6 blocos

**Especificação:** [`docs/especificacoes/LT02-ESPECIFICACAO.md`](docs/especificacoes/LT02-ESPECIFICACAO.md) — G0 aprovado.

**Por que:** chamadas de IA são lentas, caras e sujeitas a falhas parciais. Sem filas, backpressure, idempotência durável e recuperação, um sistema que funciona em uma instância quebra quando recebe carga real.

**Conceitos:** consistência, CAP e PACELC; produtor-consumidor, filas e streams; at-least-once e deduplicação; outbox/inbox, sagas e compensação; particionamento, replicação, backup, PITR e retenção; retry storms e limites de concorrência.

**Laboratório:** implementar jobs de IA recuperáveis em múltiplos workers, interromper processos durante efeitos externos e provar que a retomada não duplica operações.

**Checkpoint:** defender as garantias de entrega, consistência e recuperação com testes de concorrência e falha.

---

## M06 · Evals e observabilidade · 6 blocos ⭐

**Por que:** separa quem fez demo de quem entregou produção, e é o principal sinal em processo seletivo de IA em 2026. Também é o que te dá autoridade na sua empresa: você vira a pessoa que sabe **medir** se a IA funciona.

**Conceitos**
- Por que teste unitário não serve para LLM, e o que serve.
- Dataset de avaliação: construir a partir de casos reais, quantos casos bastam, como versionar. Dados reais vs. sintéticos.
- **A taxonomia de datasets que você precisa ter** — um só dataset não detecta regressão comportamental:

  | Dataset | O que protege |
  |---|---|
  | golden path | o caso principal continua funcionando |
  | fora de escopo | o sistema continua **recusando** o que deve recusar |
  | prompt injection | o sistema não obedece a instrução vinda de dado de terceiro |
  | segurança / vazamento | o sistema não revela dado de outro tenant ou de outra permissão |
  | ação destrutiva | o sistema pede aprovação antes de agir |
  | casos de borda | o que já quebrou uma vez |

  **O cenário que isso previne:** você corrige o prompt v14 → v15, o caso que falhava passa, e sem perceber você quebrou recusa de escopo, resposta sobre preço e coleta de dado. Isso é **regressão comportamental**, é invisível sem dataset por categoria, e é como agentes morrem em produção.
- Tipos de grader: determinístico (exato, regex, schema), estatístico (similaridade, distância de embedding), **LLM-as-judge** e seus vieses (posição, verbosidade, auto-preferência).
- Snapshot testing e estratégias determinísticas para um sistema não-determinístico.
- Métricas: acurácia por categoria, taxa de alucinação, obediência a formato, custo, latência p50/p95.
- **Prompt é código:** versionamento, registry (`prompts/*.yaml`), histórico de iteração, testes automatizados de prompt.
- Regressão na CI: um PR que piore a acurácia falha o build.
- Observabilidade: tracing (OpenTelemetry + Langfuse ou LangSmith), o que logar sem vazar PII, dashboard de custo por usuário/prompt/agente.
- Guardrails: validação de saída, detecção de recusa, circuit breaker de custo.

**Mini-projeto:** suíte de eval para o extrator do M05 — 50 casos reais rotulados, graders mistos, relatório comparando 3 modelos e 3 versões de prompt com custo e acurácia lado a lado.

**Exercício:** integrar na CI de forma que um PR que piore a acurácia em mais de 2% reprove.

**Peça do produto:** `evals/` — e a prova de que seu produto funciona.

**Checkpoint:** apresentar, como se eu fosse um gestor não-técnico, por que a versão B do prompt é melhor que a A. Com números.

---

## M07 · RAG de verdade · 8 blocos

**Por que:** RAG é o padrão mais usado e o mais mal feito. A maioria para no "joguei tudo num vector DB".

**Conceitos**
- Embeddings: espaço vetorial, similaridade cosseno, limitações (não entende negação, ruim com número e data). Compatibilidade entre versões de embedding — o problema que aparece no dia da migração.
- **Chunking é 60% do resultado:** fixo, semântico, estrutural, late chunking. Overlap. Metadados.
- Armazenamento: **pgvector** (por que começar aqui e não em Pinecone), HNSW vs. IVFFlat, filtro por metadado.
- **Busca híbrida:** BM25 + vetorial + fusão (RRF). Quase sempre bate busca puramente vetorial.
- **Reranking** com cross-encoder — o maior ganho por linha de código do pipeline.
- Query transformation: HyDE, Query2Doc, ITER-RETGEN, decomposição, roteamento.
- Onde RAG falha e você precisa de grafo (gancho para o M10): perguntas que exigem conectar entidades.
- Avaliar RAG separado da geração: recall@k, precisão de contexto, *faithfulness*.
- **RAG mal feito é um mecanismo sofisticado de vazamento de dados.** O filtro de permissão vem **antes** da relevância semântica, nunca depois:
  ```
  tenant_id = usuario.tenant
  visibility <= usuario.permissao
  status = published
  version = current
  departamento IN permitidos
        ↓  só então
  busca semântica → rerank → contexto
  ```
  Ordenar por similaridade e filtrar depois é como fazer `SELECT *` e filtrar na aplicação — só que aqui o vazamento sai numa resposta em linguagem natural, sem log de acesso. Em banco isso é incidente, não bug.
- **Abstenção:** limiar de elegibilidade. Se o melhor documento recuperado está abaixo do corte, a resposta certa é "não encontrei", não uma resposta plausível. **Não responder é melhor que responder mal** — e é a diferença entre sistema corporativo e demo.
- O RAG de tutorial tem 6 etapas; o de produção tem ~18 (normalização, metadados, ACL, versionamento, chunking semântico, reescrita de query, detecção de intenção, filtro, busca híbrida, rerank, limiar, empacotamento de contexto, citação, avaliação). Você vai construir as 18.

**Mini-projeto:** RAG sobre um corpus real e feio — código-fonte e documentação de um sistema .NET legado. Busca híbrida, reranking, eval de recuperação. Código é o corpus mais difícil e mais valioso.

**Exercício:** provar com números que reranking melhorou o recall — e encontrar 3 perguntas que o RAG erra sistematicamente. **Guarde essas 3 perguntas: são a justificativa do M10.**

**Peça do produto:** `services/retrieval/`.

**Checkpoint:** explicar por que aumentar o `k` da busca degrada a resposta a partir de certo ponto.

---

# FASE 3 — Agentes, protocolos e grafos

## M08 · Agentes: padrões e context engineering · 8 blocos

**Por que:** o núcleo do que você pediu.

**Conceitos**
- **Workflow vs. agente:** workflow = caminho predefinido; agente = o modelo decide. **Comece sempre por workflow.** A maioria dos problemas de produção não precisa de agente e fica pior com agente.
- Padrões compostáveis: prompt chaining, roteamento, paralelização (sectioning e voting), orquestrador-trabalhadores, avaliador-otimizador.
- Bloco básico: LLM aumentado com **recuperação, ferramentas e memória**.
- Tipos de agente: baseado em ferramenta, com memória, reflexivo.
- **Design de ferramentas** — é design de API com regras diferentes: nomes autoexplicativos, poucas ferramentas, erros que ensinam o modelo a se corrigir, respostas econômicas em token, aprovação humana para ação irreversível.
- **Context engineering aplicado:** compactação, sumarização progressiva, memória externa, edição de contexto, *just-in-time retrieval*.
- Loop: planejar → agir → observar → criticar. Critério de parada. Orçamento de passos.
- Multi-agente: quando compensa (contexto isolado, paralelismo) e quando é overengineering (quase sempre no começo).
- Panorama de frameworks — LangGraph, CrewAI, Google ADK, **Microsoft Agent Framework**, Pydantic AI — e critério de escolha por caso de uso. Você vai usar LangGraph no M10, mas precisa saber justificar a escolha.
- Confiabilidade: idempotência, retry, timeout, human-in-the-loop.
- **As três simplificações que você vai ouvir e que estão erradas** (detalhadas em [`docs/mapa-conceitual.md`](docs/mapa-conceitual.md)):
  1. *"Agente é software não determinístico"* → é um runtime **predominantemente determinístico** com ilhas probabilísticas. Quando uma função normal resolve, use a função.
  2. *"LangGraph torna tudo determinístico"* → ele controla **onde** a incerteza pode existir, não a elimina.
  3. *"Prompt é o código do agente"* → o comportamento é código + prompt + modelo + schemas + tools + state + policies + evals. Trocar o prompt achando que o resto se ajusta é a causa nº 1 de regressão silenciosa.

  Saber corrigir essas três em voz alta, com educação, é o que te posiciona como sênior numa conversa técnica.

**Mini-projeto:** agente investigador de código — responde "o que quebra se eu mudar a assinatura deste método?" investigando sozinho, com ferramentas: buscar símbolo, ler arquivo, listar referências. Termina citando evidência.

**Exercício:** transformar o mesmo problema em workflow determinístico e comparar custo, latência e acurácia (com o M06). A resposta vai te surpreender.

**Peça do produto:** o agente central do Capstone.

**Checkpoint:** justificar cada ferramenta do seu agente e mostrar o que acontece quando você adiciona uma décima.

---

## M09 · Protocolos: MCP e A2A · 7 blocos

**Por que:** MCP virou o padrão de integração de agentes, e saber **construir** servidor MCP é vendável imediatamente — é o item mais pedido em consultoria de IA hoje. A2A é a camada seguinte, e chegou cedo o suficiente para você sair na frente.

**Conceitos**
- Protocolo de comunicação vs. tool calling — qual é a diferença real e por que ela importa.
- **MCP:** tools, resources, prompts. Transporte stdio vs. HTTP/SSE. Ciclo de vida.
- Construir em Python (FastMCP), e o que faz um servidor **bom**: granularidade, schema descritivo, erro acionável, paginação, limite de resposta.
- Deploy e distribuição via Docker. Docker MCP Toolkit.
- Consumir MCP: no Claude Code, no seu agente, em outros clientes.
- **A2A (Agent-to-Agent):** tasks, messages, parts, agent cards, artifacts. Descoberta via `agent.json`. Composição de agentes escritos em frameworks diferentes.
- Segurança: escopo de permissão, tool poisoning, dado não confiável entrando no contexto, o servidor MCP como superfície de ataque.
- Agnosticismo: a mesma ferramenta exposta via MCP, via function calling nativo e via OpenAPI.

**Mini-projeto:** servidor MCP que expõe o índice e o grafo do sistema legado — usável pelo seu agente, pelo Claude Code e pelo Copilot. Na prática: você passa a poder perguntar sobre o sistema do trabalho de dentro do editor.

**Exercício:** um segundo servidor MCP para uma API que você usa no trabalho (Azure DevOps, por exemplo), usado por uma semana no dia a dia. **Este é o seu primeiro entregável monetizável.**

**Peça do produto:** `mcp/` do Capstone.

**Checkpoint:** demonstrar seu MCP rodando dentro do Claude Code e explicar cada decisão de design das ferramentas.

---

## M10 · Graph engineering e saúde arquitetural · 10 blocos ⭐

**Por que:** "graph engineer" significa **duas coisas** que costumam ser confundidas, e você precisa das duas. Este módulo é o que o nosso currículo tem e nenhum outro tem.

1. **Grafo de execução** (LangGraph): modelar *qual agente roda em seguida e com que estado*. Engenharia de orquestração — mais perto de escrever organograma do que de escrever prompt.
2. **Grafo de conhecimento** (GraphRAG, memória de agente): modelar *dados como entidades e relações* para recuperação e memória de longo prazo.

**Parte 1 — execução**
- Máquina de estados como base de agente confiável. *Equivalente:* workflow engine / saga, que você já viu em corporativo.
- LangGraph: nós, arestas condicionais, estado tipado, checkpointing, human-in-the-loop, retomada após falha.
- Durabilidade: por que agente de produção precisa persistir estado. Alternativas: Temporal, filas.
- Padrão supervisor, padrão hierárquico, e o custo real de cada um.

**Parte 2 — conhecimento**
- Modelagem: entidades, relações, propriedades. Ontologia mínima viável.
- Extração de grafo a partir de texto com LLM — e por que é caro e ruidoso. Quando extrair deterministicamente é melhor.
- Neo4j ou Postgres + Apache AGE. Cypher básico.
- **GraphRAG:** recuperação por caminho, comunidades, sumarização hierárquica. Quando bate RAG vetorial e quando é overkill.
- **Grafo como memória de agente:** conhecimento durável vs. observação temporária; grafo temporal (fatos com validade).
- Híbrido vetor + grafo — o padrão que mais funciona.

**Parte 3 — saúde arquitetural mensurável** *(extraído da grade da FullCycle, e é ouro para o Capstone)*
- Tipos de acoplamento e quando ele vira dor.
- **Main Sequence:** instabilidade (I), abstratividade (A), distância da sequência principal. Zonas de dor e de inutilidade.
- Cálculo e visualização sobre o grafo real de um sistema.
- Planejamento de refatoração guiado por essas métricas.

> Isso transforma o Capstone de "gerador de documentação" em **ferramenta de diagnóstico com número**. "Este módulo está na zona de dor, distância 0,74 da sequência principal" vende muito melhor que "este módulo parece acoplado".

**Mini-projeto:** orquestrador em LangGraph do fluxo do Capstone (ingestão → parse → grafo → análise → revisão humana → relatório), com estado persistido e retomada. Ingerir repositório grande leva horas e falha no meio — caso de uso perfeito para checkpointing.

**Exercício:** o grafo de conhecimento do código — `Projeto ⟶ Classe ⟶ Método ⟶ chama ⟶ Método ⟶ acessa ⟶ Tabela`. Responder com ele as **3 perguntas que o RAG errou no M07**. Depois calcular I, A e distância da sequência principal para cada módulo do sistema.

**Peça do produto:** `orchestration/`, `graph/` e `metrics/`.

**Checkpoint:** matar o processo no meio de uma execução e mostrar que ela retoma do último checkpoint sem repetir chamadas pagas.

---

## LT03 · Cloud-native, IaC, GitOps e plataforma · 6 blocos

**Especificação:** [`docs/especificacoes/LT03-ESPECIFICACAO.md`](docs/especificacoes/LT03-ESPECIFICACAO.md) — G0 aprovado.

**Por que:** publicar uma demo em PaaS não ensina a operar workloads críticos. O laboratório apresenta o modelo declarativo e as abstrações que o mercado usa para executar serviços e inferência com segurança e repetibilidade.

**Conceitos:** OCI e Kubernetes; workloads, scheduling, networking, storage, configuração e secrets; requests/limits, probes, autoscaling e disruption; infraestrutura como código; GitOps, progressive delivery, rollback e platform engineering.

**Laboratório:** promover o Capstone entre ambientes por configuração declarativa, provocar uma regressão, observar o impacto e executar rollback verificável.

**Checkpoint:** explicar e demonstrar como configuração, artefato, infraestrutura, identidade e telemetria percorrem o caminho até produção.

---

# FASE 4 — Produção, teoria e produto

## M11 · Fundamentos de ML/DL e modelos locais · 8 blocos

**Por que:** você pediu profundidade real. Isso não te faz treinar modelo — te faz **entender por que as coisas falham** e parar de tratar o modelo como caixa preta. É o que sustenta conversa técnica sênior.

**Conceitos**
- Atenção e transformer, construído do zero em ~200 linhas de PyTorch. Você implementa, não só lê.
- Por que atenção é O(n²) e o que isso significa para custo e janela de contexto.
- Arquiteturas: encoder-only, decoder-only, encoder-decoder — e o uso ideal de cada uma.
- Etapas de treino: pré-treino, SFT, RLHF/DPO — o que cada uma faz com o comportamento.
- Por que o modelo alucina: é amostragem de distribuição, não busca em base de dados. E as estratégias reais de redução.
- Embeddings por dentro: treinar um pequeno.
- **Modelos abertos e execução local:** Llama, DeepSeek, Hugging Face; Ollama e LM Studio. Quando rodar local vale a pena — e no seu caso tem um motivo específico: **cliente de código legado que não deixa o fonte sair da rede.** Isso é feature de venda do Capstone.
- **Por que um modelo bom escreve código bem e trabalha mal em modo agente.** Você vai bater nisso ao plugar Ollama no OpenCode ou no Claude Code: o modelo responde e sugere, mas não executa. O diagnóstico quase nunca é "falta um agente em cima" — o harness já existe. É o **modelo** que não cumpre o protocolo que o harness espera. Modo agente exige competências que benchmark de código não mede:

  `instruction following · tool calling · structured output · aderência a schema · estado multi-turno · contexto longo · planejamento · seleção de ferramenta`

  E exige que a integração entregue certo: system prompt, schema das tools, chat template, stop tokens, formato de tool call, limite de contexto. **Modelo ≠ agente ≠ harness** — empilhar mais um agente em cima de um modelo ruim de tool calling não resolve nada.
- Quantização, latência, custo por token local vs. API.
- Fine-tuning: LoRA/QLoRA. **Quando fine-tuning é a resposta errada** (quase sempre — RAG ou prompt resolve, mais barato).

**Mini-projeto:** implementar atenção multi-head e treinar um transformer minúsculo. Ver o loss cair.

**Exercício:** rodar o extrator do Capstone em modelo local via Ollama e comparar, com os evals do M06, contra a API: acurácia, latência, custo. Concluir com números se o modo local é viável.

**Checkpoint:** explicar em 3 minutos, sem jargão, por que um LLM erra contas simples — e por que isso não se conserta com mais dados.

---

## M12 · Produção: segurança, multi-tenant, billing, SRE com IA · 9 blocos

**Especificação de regeneração:** [`docs/especificacoes/M12-ESPECIFICACAO.md`](docs/especificacoes/M12-ESPECIFICACAO.md) — G0 aprovado; o HTML atual permanece bloqueado até G1–G6.

**Por que:** transformar projeto em produto. É o módulo que permite cobrar dinheiro.

**Conceitos**
- **Segurança de agentes — OWASP Top 10 para LLM:** prompt injection direta e indireta (documento do usuário contendo instruções — e o seu produto ingere código de terceiros, então isso é ameaça real, não teórica), jailbreaking, exfiltração de dados, ferramentas perigosas. Defesas: separação de canais de confiança, sandbox, menor privilégio por ferramenta, validação de saída, aprovação humana.
- Proteção de dado sensível: detecção e mascaramento de segredo, PII, string de conexão — que **existe aos montes** em código legado.
- Multi-tenant: isolamento por linha (RLS no Postgres) vs. por schema. Isolamento de embeddings e de grafo por tenant.
- **Human-in-the-loop como camada de política, não como boa intenção.** `GET /faturas` é seguro; `POST /cancelar-assinatura`, `DELETE /conta` e `POST /transferencia` não são. O modelo **propõe**; o runtime intercepta:
  ```
  LLM → tool proposta → POLICY → aprovação humana → execução
  ```
  A decisão de qual ferramenta exige aprovação é sua, escrita em código, e não pode depender de o prompt ter pedido educadamente.
- **Idempotência — e por que o seu conhecimento de engenharia vale mais, não menos.** Um agente executa `cancelar_assinatura`, perde a conexão, conclui "talvez não tenha funcionado" e executa de novo. Em contexto financeiro isso são duas transferências de R$ 5.000. Agentes **não** eliminam engenharia tradicional; eles tornam obrigatório o que antes era recomendado:

  `chave de idempotência · transação · autorização · RBAC · log de auditoria · rate limit · política de retry · circuit breaker · timeout · dead-letter · observabilidade`

  Este é o melhor contra-argumento que existe para "IA vai tornar conhecimento de engenharia desnecessário" — e é literalmente o seu currículo dos últimos anos virando vantagem.
- Auth: OAuth/OIDC, JWT, chaves de API.
- Rate limit e quota por tenant. Circuit breaker de custo (o cliente que gasta R$ 400 em tokens num plano de R$ 99).
- Billing: Stripe, ou Asaas/Pagar.me para o Brasil. Assinatura, uso medido, trial, inadimplência, webhooks idempotentes.
- LGPD aplicada: base legal, retenção, direito de exclusão, dado do cliente não vira treino.
- Custo unitário: quanto custa **uma** análise? Margem por plano.
- **SRE com IA** *(extraído da FullCycle)*: detecção de anomalia com explicação em linguagem natural, consulta conversacional a métricas e logs, resumo automático de incidente, rascunho de postmortem, ChatOps. Adoção gradual com supervisão humana. Copiloto vs. agente autônomo em produção.
- Onboarding self-service e produto que não gera ticket — era o seu requisito original.

**Mini-projeto:** endurecer o Capstone — RLS, quotas, billing em modo teste, painel de custo por tenant, mascaramento de segredo na ingestão.

**Exercício:** relatório de ataque contra o próprio produto — 10 vetores de prompt injection tentados via código ingerido, quais passaram, o que você corrigiu.

**Checkpoint:** calcular a margem bruta no plano de entrada e defender o preço.

---

## LT04 · Qualidade avançada, supply chain e governança de IA · 6 blocos

**Especificação:** [`docs/especificacoes/LT04-ESPECIFICACAO.md`](docs/especificacoes/LT04-ESPECIFICACAO.md) — G0 aprovado.

**Por que:** qualidade em IA não termina em unit tests e evals offline. Um release precisa de compatibilidade, segurança de artefato, testes sob carga, estratégia de exposição gradual e decisão explícita de risco.

**Conceitos:** contract, property-based, mutation, concurrency, load e chaos testing; shadow, canary e rollback; SBOM, proveniência, assinatura e SLSA; threat modeling; model/data/prompt cards; lineage, drift, human evaluation e risk register.

**Laboratório:** produzir um pacote de release com artefato verificável, SBOM, resultados de eval, riscos aceitos, estratégia de rollout e decisão go/no-go.

**Checkpoint:** conduzir uma release readiness review e rejeitar o próprio release quando a evidência não sustentar produção.

---

## M13 · Capstone — lançar o produto · 20+ blocos

**Especificação de regeneração:** [`docs/especificacoes/M13-ESPECIFICACAO.md`](docs/especificacoes/M13-ESPECIFICACAO.md) — G0 aprovado; o HTML atual permanece bloqueado até G1–G6.

Detalhado em [`docs/projeto-final.md`](docs/projeto-final.md).

Não é "terminar o código". É: produto no ar, landing page, primeiro usuário real, evals na CI, custo medido, e um post público contando o que você construiu. **O post é parte do entregável** — é ele que vira portfólio e prova, para o mercado e para a sua liderança.

---

## Trilhas paralelas (rodam o curso inteiro, 30 min por vez)

> **Elas não entram nos 152 blocos/304h.** São fatias de 30 min encaixadas fora do bloco de estudo. O placar mede somente o currículo verificável.

### ADR — Architecture Decision Record
Toda decisão não-óbvia vira `docs/adr/NNNN-titulo.md`: contexto, opções, decisão, consequências. Fixa o aprendizado, produz prova de raciocínio arquitetural, e vira material bruto para system design em entrevista sem "estudar para a prova". **Meta: 25 ADRs.**

### Inglês técnico → funcional
Não é fluência geral. É o mínimo para destravar freelance assíncrono e vaga com PM bilíngue. 30 min/dia:
- Commits, PRs e READMEs deste repo **sempre** em inglês.
- Documentação primária em inglês, não tradução.
- A partir do M06: gravar-se explicando o checkpoint em inglês, 3 min. Sem plateia. É o que mais destrava conversação técnica.
- A partir do M10: uma discussão em inglês por semana (issue no GitHub, Discord de projeto open-source).

### Enquadramento para sênior+ em corporação
A cada módulo, responda três perguntas no `PROGRESSO.md`:
1. Quantas requisições simultâneas isso aguenta?
2. O que acontece quando a dependência externa satura?
3. Como versiono e faço rollback disso sem quebrar produção?

São exatamente as perguntas de system design de infraestrutura de IA de 2026 — e o erro mais registrado é descrever componentes sem discutir o trade-off entre eles.

### Marketing pessoal — 30 min/semana
Extraído da FullCycle, e concordo com eles: no seu objetivo de triplicar renda, ser bom não basta se ninguém sabe. Um post por módulo, contando o que construiu, com números. Quatorze posts em seis meses. Você não precisa de inglês nem de audiência prévia — precisa de constância. É isso que gera inbound para os projetos do `gaps-e-projetos.md`.

### Cursos pagos — quando valem
📘 **Reforço opcional, nunca pré-requisito.** Onde vale: M07/M08/M10 (RAG, agentes, LangGraph — o ecossistema muda rápido e curso bom acelera). Onde **não** vale: fundamentos de Python (você passa batido), system design genérico (a maioria é de anos atrás e não cobre banco vetorial nem streaming), "IA do zero". Peça critérios de triagem antes de comprar.

### Experiência anterior — ponte mental, não trilha

O curso inteiro é ensinado e exercitado prioritariamente em Python. Conceitos conhecidos de outras plataformas podem ser citados para reduzir a carga cognitiva. A única prática .NET normativa é o corte comparativo limitado do M02A; APIs, frameworks e atualizações .NET não formam uma trilha própria, não substituem a implementação Python e não fazem parte do capstone.

### Trading — segundo plano
Em espera por decisão sua. Continua valendo: protocolo demo com tamanho real, critérios objetivos de saída, journaling, Profit Factor. **Ponto de reencontro:** o journaling estruturado é dataset perfeito para o M06.

---

## Sistema de estudo para ritmo irregular

Detalhado em [`docs/como-estudar.md`](docs/como-estudar.md). O resumo:

**Regra de ouro:** um bloco de 2h sempre termina com **algo commitado**. Nunca pare no meio de um raciocínio sem registrar.

**Semana de 4h (2 blocos):** só teoria + mini-projeto guiado. Não comece exercício sozinho.
**Semana de 20h (10 blocos):** módulo inteiro, incluindo checkpoint.
**Voltando de pausa de 2+ semanas:** diga `Voltei`.
