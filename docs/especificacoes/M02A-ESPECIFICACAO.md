# M02A — Engenharia de Software Sênior em 2026

> Referência de escopo da versão anterior do módulo. A sequência e o estado atuais estão em [CURRICULO.md](../../CURRICULO.md) e [STATUS.md](../../STATUS.md).

> Especificação normativa de produção · versão 1.2 · 12/09/2026
> Estado: **G0 aprovado; G1 em produção**

## 1. Decisão curricular

O M02A é a ponte entre a fluência em Python do M02 e a construção de sistemas em produção. Ele desenvolve julgamento técnico com explicações autossuficientes, sem pressupor experiência em outra stack.

- **Python 3.14 é a linguagem e implementação canônica.** Todo claim técnico executável deve ser demonstrado primeiro em Python; claims organizacionais e profissionais são sustentados por artefato, dado, argumento e limitação, pois uma linguagem não os “prova”.
- **Compatibilidade é ensinada em Python.** Um corte de integração compara chamada em processo com CLI instalada em processo separado, usando o mesmo corpus. Troca de adapter, serialização, erros, cancelamento e distribuição são ensinados pelo mecanismo; não há implementação obrigatória em outra stack.
- Arquitetura, contratos, telemetria e evidências são agnósticos de fornecedor.
- No `work-intake`, IA é tratada por decisão arquitetural como componente não confiável e substituível. Isso não é apresentado como propriedade universal de todo sistema; nenhum provedor, modelo ou SDK fechado é requisito do módulo.
- O módulo entrega material de estudo, laboratório executável, falhas semeadas, avaliação e evidência; não apenas uma lista de tópicos.

### 1.1 Resultado profissional

Ao concluir o módulo, o aluno deve conseguir transformar uma necessidade ambígua em software evolutivo, seguro e operável; justificar trade-offs; separar política determinística de recomendação probabilística; investigar falhas; e demonstrar cada alegação importante com artefato reproduzível.

### 1.2 Carga e pré-requisitos

- Carga planejada: **30 horas estimadas**, em 15 blocos de conteúdo retomáveis. Não há duração obrigatória de sessão.
- Pré-requisitos: M00, M01 e M02 verificados.
- Perfil: pessoas com os pré-requisitos declarados, sem exigência de conhecimento de outra linguagem ou plataforma.

## 2. Produto integrador: `work-intake`

`work-intake` é um monólito modular local para triagem de solicitações de trabalho assistida por IA.

```text
WorkRequest JSON
      │
      ▼
trust boundary + JSON Schema versionado
      │
      ▼
política determinística ──► decisão accept/review/reject
      │
      ├── Advisor port ──► fake / record-replay
      │       recomendação nunca substitui a política
      ├── SQLite ──► request, advisory, decision e audit
      ├── fila local limitada ──► evento versionado pós-commit
      └── logs, traces, métricas e evidence manifest
```

O produto completo e o corte de compatibilidade são Python. O mesmo contrato percorre boundary → política → advisor → decisão → CLI instalada. O teste diferencial compara decisões e erros observáveis, não detalhes internos nem desempenho de processos como se fossem idênticos.

### 2.1 Modelo mínimo

- `WorkRequest`: ID, tenant, intenção, prioridade, orçamento decimal, prazo, versão e chave de idempotência.
- `Advisory`: categoria, risco, confiança, sinais e metadados de custo/latência.
- `Decision`: `accept`, `review` ou `reject`, reason codes estáveis e versão da política.
- Portas: `Advisor`, `Repository`, `EventSink`, `Clock`, `IdGenerator` e `Telemetry`.
- Adapters Python: CLI, SQLite, advisor determinístico/record-replay e OpenTelemetry local.
- `BatchEvaluator`: concorrência estruturada, fila limitada, cancelamento propagado e overload explícito.

### 2.2 Invariantes

1. Uma recomendação de IA nunca amplia privilégio nem revoga uma proibição determinística.
2. Saída inválida, timeout, injeção de prompt ou provider indisponível seguem fallback declarado e testado.
3. Tenant, idempotência, versão do contrato e versão da política participam da decisão e da auditoria.
4. Persistência da decisão é atômica; publicação local ocorre apenas após commit e não promete entrega distribuída.
5. Segredos e conteúdo sensível não entram em logs, traces ou labels de métricas.
6. Toda alegação mensurável referencia amostras brutas, ambiente, comando, digest e limitação.

## 3. Fronteiras curriculares

O M02A ensina fundamentos e decisões; profundidade operacional pertence aos módulos donos.

| Tema | O que M02A prova | Onde aprofunda |
|---|---|---|
| API e banco | contratos, SQLite, transação, índices e evolução local | M03: HTTP, FastAPI, PostgreSQL e containers |
| Arquitetura | C4/ADR mínimos e dependency rules executáveis | M04: design e implementação assistidos por IA |
| Linux e rede | portabilidade Windows/Linux e falhas simuladas | LT01: processos, rede, TLS, diagnóstico e pools |
| Mensageria | fila local bounded e envelope versionado | LT02: broker, outbox, entrega, saga e consistência distribuída |
| Plataforma | artefatos publicáveis e CI reprodutível | LT03: Kubernetes, IaC, GitOps e plataforma |
| Supply chain | locks, inventário e conceitos de proveniência | LT04: SBOM, assinatura, SLSA e dossiê completo |
| Segurança/produção | threat model, controles, SLO e runbook locais | M12: operação, SRE, billing e segurança em produção |
| IA | porta agnóstica, eval contratual e decisão humana/política | M06–M11: RAG, memória, agentes, MCP, voz e UX |

SQLite, fake de rede/fila e record-replay são instrumentos didáticos. Aprovação neste módulo **não** prova garantias de PostgreSQL, broker, rede real, sistema distribuído, cloud ou provedor de IA.

## 4. Estrutura do laboratório

```text
modulos/M02A-engenharia-software-senior/lab/
├── README.md
├── pyproject.toml
├── uv.lock
├── contracts/
├── fixtures/{golden,adversarial,compatibility,provider-recordings,generated-defects}/
├── docs/{intent,requirements,quality-attributes,architecture,threat-model,slo,runbook}.md
├── docs/decisions/
├── python/src/work_intake/{domain,application,ports,adapters}/
├── python/tests/
├── migrations/
├── tests/{contracts,architecture,differential,performance,negative}/
├── tools/gate.py
└── evidence/
```

Não se deve criar serviço web, depender de Docker/cloud ou fazer chamada externa obrigatória.

## 5. Arquitetura didática dos 15 blocos

Cada bloco deve conter: problema real, modelo mental, decisão/trade-off, implementação Python, falha semeada, evidência, transferência para outro contexto, leitura primária e avaliação baseada em cenário.

### B01 — Papel sênior, produto, risco e evidência

- `ES26-001`: distinguir output, outcome, impacto e restrição.
- `ES26-002`: priorizar risco por objetivo, incerteza/evidência, impacto, detectabilidade, horizonte e reversibilidade, sem transformar escala ordinal em probabilidade.
- `ES26-003`: tratar desenvolvimento como sistema sociotécnico.
- `ES26-004`: converter alegação em claim → método → evidência → limitação.
- Prática: escrever intent, mapa de stakeholders e registro inicial de riscos.

### B02 — Requisitos, atributos de qualidade e decisões

- `ES26-005`: separar necessidade, requisito, restrição e solução.
- `ES26-006`: escrever cenários mensuráveis de atributo de qualidade.
- `ES26-007`: produzir ADR/RFC com alternativas e condição de revisão.
- `ES26-008`: manter C4, decisões e código coerentes.
- Prática: requisitos P0/P1, cenários de qualidade — incluindo acessibilidade e inclusão —, C4 e ADR-0001.

### B03 — Modularidade, acoplamento e domínio

- `ES26-009`: avaliar coesão, acoplamento, dependências e ciclos.
- `ES26-010`: usar SOLID como heurística, não dogma.
- `ES26-011`: delimitar domínio, aplicação, portas e adapters.
- `ES26-012`: reconhecer quando abstração custa mais que a mudança esperada.
- Vocabulário obrigatório: information hiding, ubiquitous language, bounded context, invariante, entity/value object, aggregate como possível limite de consistência e composition root. Bounded context não implica microserviço; `Protocol` não prova substituição comportamental.
- Prática: arquitetura hexagonal mínima e gate de dependências.

### B04 — Contratos, compatibilidade e interoperabilidade

- `ES26-013`: distinguir contrato sintático, semântico e operacional.
- `ES26-014`: evoluir JSON Schema v1/v2 com matriz de compatibilidade.
- `ES26-015`: normalizar tempo, decimal, enum, UTF-8 e erros entre runtimes.
- `ES26-016`: escolher versionamento e política de depreciação.
- Prática: corpus golden compartilhado entre chamada Python em processo e CLI instalada.

### B05 — Dados, transações e evolução de schema

- `ES26-017`: modelar invariantes, ownership e ciclo de vida.
- `ES26-018`: explicar atomicidade, isolamento, locking e retry.
- `ES26-019`: projetar idempotência e concorrência otimista.
- `ES26-020`: validar índice com plano de consulta, não intuição.
- Prática: migrations SQLite, rollback, tenant e `EXPLAIN QUERY PLAN`.

### B06 — Runtime, concorrência e backpressure

- `ES26-021`: escolher sync, async, thread ou processo pelo workload.
- `ES26-022`: propagar cancelamento, timeout e cleanup.
- `ES26-023`: aplicar concorrência estruturada e ownership de tarefas.
- `ES26-024`: limitar filas e tornar overload observável.
- Prática: batch bounded em Python; contraste entre recusa por capacidade, timeout e cancelamento cooperativo.

### B07 — Fundamentos de sistemas distribuídos

- `ES26-025`: raciocinar sobre tempo, ordem causal e falhas parciais.
- `ES26-026`: diferenciar consistência, disponibilidade e durabilidade.
- `ES26-027`: justificar retry, idempotência e entrega.
- `ES26-028`: reconhecer limites de transação, saga e consenso.
- Prática: simulações determinísticas; nenhuma alegação de sistema distribuído real.

### B08 — Estratégia de testes e desenho para testabilidade

- `ES26-029`: escolher unit, integration, contract, property e differential tests.
- `ES26-030`: projetar oráculos e evitar testes tautológicos.
- `ES26-031`: usar mutação e falhas semeadas para provar sensibilidade.
- `ES26-032`: controlar clock, IDs, aleatoriedade e dependências.
- Prática: pirâmide por risco, Hypothesis, mutante controlado e corpus entre caminhos de execução Python.

### B09 — Secure SDLC e threat modeling

- `ES26-033`: localizar trust boundaries, assets, atores e abuse cases.
- `ES26-034`: aplicar least privilege, fail-closed e defesa em profundidade.
- `ES26-035`: tratar segredo, privacidade, isolamento e retenção.
- `ES26-036`: separar awareness de requisito de segurança verificável.
- Prática: threat model e fixtures adversariais, incluindo prompt injection.

### B10 — Observabilidade, confiabilidade e incidentes

- `ES26-037`: correlacionar logs, métricas e traces semanticamente.
- `ES26-038`: definir SLI/SLO e interpretar error budget.
- `ES26-039`: projetar diagnósticos sem cardinalidade ou dados sensíveis.
- `ES26-040`: operar runbook e produzir postmortem sem culpa.
- Prática: trace request→advisory→decision→evento e exercício de incidente.

### B11 — Complexidade, estruturas de dados, performance e custo

- `ES26-041`: estimar complexidade e escolher estrutura de dados pelo padrão de acesso.
- `ES26-042`: formular hipótese e distinguir latência, throughput, utilização e saturação.
- `ES26-043`: desenhar workload, warm-up, amostras e limitações.
- `ES26-044`: relacionar capacidade, cache e custo unitário ao outcome.
- Prática: comparar representação/algoritmo no workload real e executar experimento sem threshold ou ranking universal.

### B12 — Git, integração, entrega e reversibilidade

- `ES26-045`: manter mudanças pequenas, revisáveis e integráveis.
- `ES26-046`: modernizar legado incrementalmente com change seams, strangler e expand-contract.
- `ES26-047`: diferenciar build/release/deploy/operação e usar flags/rollback com segurança.
- `ES26-048`: interpretar métricas DORA como sistema, nunca ranking individual.
- Prática: plano incremental de legado, gate único cross-platform, policy v2 defeituosa e rollback para v1.

### B13 — Python sênior aplicado

- `ES26-049`: fazer escolhas idiomáticas por responsabilidade, legibilidade e custo de execução.
- `ES26-050`: desenhar boundaries tipadas preservando runtime truth.
- `ES26-051`: empacotar, publicar e instalar fora do checkout.
- `ES26-052`: depurar imports, memória, I/O e concorrência com método.
- Prática: produto Python completo, wheel limpo e investigação orientada a evidência.

### B14 — Compatibilidade entre implementações Python

- `ES26-053`: preservar valores e erros ao atravessar a fronteira entre objetos Python e representação serializada.
- `ES26-054`: substituir adapter no composition root sem alterar o contrato do consumidor.
- `ES26-055`: distinguir sobrecarga, timeout, cancelamento cooperativo e término de processo por efeitos observáveis.
- `ES26-056`: verificar o mesmo corpus pela API Python em processo e pela CLI instalada em processo separado.
- Prática: corte Python instalado fora do checkout, com teste diferencial e caso negativo de incompatibilidade. Nenhuma segunda linguagem é necessária.

### B15 — Engenharia AI-native e liderança técnica

- `ES26-057`: manter IA atrás de porta, orçamento e política determinística.
- `ES26-058`: construir eval versionada com corpus, scorer, adversariais e evidência.
- `ES26-059`: revisar código gerado por IA e preservar responsabilidade humana.
- `ES26-060`: comunicar risco, delegar, influenciar e decidir com ética.
- Prática: adapter record-replay, revisão de defeitos gerados e defesa final do sistema.

## 6. Cenários de aceite

### Design e arquitetura

- `M02A-AT-001`: cada requisito P0 aponta para teste e evidência.
- `M02A-AT-002`: import de adapter pelo domínio é rejeitado.
- `M02A-AT-003`: ciclo entre módulos é detectado.
- `M02A-AT-004`: ADR substituído preserva histórico e sucessor.
- `M02A-AT-005`: manifesto arquitetural estruturado referencia apenas IDs/paths existentes; processos esperados existem e relações estáticas declaradas não contradizem o grafo de imports. O gate não alega provar completude do diagrama.

### Contratos e interoperabilidade

- `M02A-AT-006`: fixture v1 válida produz a mesma decisão pela API Python e pela CLI instalada.
- `M02A-AT-007`: campo externo desconhecido é rejeitado no trust boundary.
- `M02A-AT-008`: consumidor v1 aceita somente evolução v2 declarada compatível.
- `M02A-AT-009`: remoção ou mudança incompatível bloqueia o gate.
- `M02A-AT-010`: reason codes e valores serializados coincidem entre chamada em processo e CLI Python instalada, incluindo entradas inválidas.
- `M02A-AT-011`: timestamps, UTF-8, enums e decimais preservam semântica.

### Domínio e dados

- `M02A-AT-012`: falha entre request e decision executa rollback completo.
- `M02A-AT-013`: mesma chave e intenção reutiliza a decisão.
- `M02A-AT-014`: mesma chave com intenção diferente produz conflito.
- `M02A-AT-015`: tenant não lê nem altera registro de outro tenant.
- `M02A-AT-016`: updates concorrentes produzem um vencedor observável.
- `M02A-AT-017`: consulta crítica usa índice provado pelo query plan.

### Concorrência e runtime

- `M02A-AT-018`: fila nunca ultrapassa a capacidade configurada.
- `M02A-AT-019`: overload retorna resultado explícito, sem crescimento ilimitado.
- `M02A-AT-020`: cancelamento externo executa cleanup e é propagado.
- `M02A-AT-021`: timeout do advisor não deixa tarefa órfã.
- `M02A-AT-022`: recusa por capacidade, timeout e cancelamento cooperativo geram resultados distintos; o teste demonstra cleanup e explicita o que não é garantido ao encerrar um processo.

### IA agnóstica

- `M02A-AT-023`: fake e record-replay passam a mesma contract suite.
- `M02A-AT-024`: resposta malformada não se torna decisão confiável.
- `M02A-AT-025`: prompt injection permanece dado não confiável.
- `M02A-AT-026`: timeout/indisponibilidade aciona fallback declarado.
- `M02A-AT-027`: advisor não transforma proibição determinística em aceite.
- `M02A-AT-028`: adapter, recording, policy, budget e digest constam da evidência.

### Qualidade e segurança

- `M02A-AT-029`: property test encontra contraexemplo de normalização/idempotência.
- `M02A-AT-030`: mutante que remove regra P0 é morto.
- `M02A-AT-031`: defeitos IA de tipo, semântica e cancelamento falham nos gates corretos.
- `M02A-AT-032`: segredo e texto sensível não aparecem em log/trace.
- `M02A-AT-033`: correlation ID, tenant e texto não viram nomes/labels de métrica.
- `M02A-AT-034`: erro interno preserva causa para operação sem expô-la externamente.
- `M02A-AT-035`: isolamento e retenção seguem threat model e requisitos.

### Operação, desempenho e entrega

- `M02A-AT-036`: trace liga request, advisory, decision e evento.
- `M02A-AT-037`: p50/p95/erro/throughput derivam de amostras brutas persistidas.
- `M02A-AT-038`: workload crescente localiza saturação/backpressure sem threshold universal.
- `M02A-AT-039`: policy v2 defeituosa é desativada e v1 restaura comportamento.
- `M02A-AT-040`: wheel instalado executa API Python e CLI fora do source tree, sem importar acidentalmente o checkout.
- `M02A-AT-041`: newline, casing e paths passam em Windows e Linux.
- `M02A-AT-042`: suíte obrigatória roda offline, sem credencial.
- `M02A-AT-043`: manifest registra commit, OS, runtimes, versões, seeds, digests e durações.
- `M02A-AT-044`: SLI/SLO é calculado do workload e aciona decisão operacional declarada.
- `M02A-AT-045`: runbook é exercitado para overload, DB locked, provider indisponível e rollback.

### Papel sênior, requisitos e modularidade

- `M02A-AT-046`: atividade ou volume não é aceito como outcome sem cadeia causal, contramétrica e limitação.
- `M02A-AT-047`: risco sem objetivo, owner, base de evidência ou trigger de revisão falha no gate.
- `M02A-AT-048`: mudança de reversibilidade ou confiança reordena a priorização e preserva a justificativa anterior.
- `M02A-AT-049`: claim sem dado/artefato bruto, digest, método ou limitação é rejeitado.
- `M02A-AT-050`: conflito entre produto, operação e pessoa afetada produz decisão e residual explícitos, não maioria fictícia.
- `M02A-AT-051`: requisito ambíguo, não verificável ou solução disfarçada é rejeitado com reason code.
- `M02A-AT-052`: cenário de atributo de qualidade incompleto falha indicando qual dos seis elementos está ausente.
- `M02A-AT-053`: mudança de requisito marca ADR, cenário, modelo arquitetural ou teste impactado como stale.
- `M02A-AT-054`: alternativa rejeitada sem trade-off ou evidência explícitos invalida o ADR.
- `M02A-AT-055`: fake e adapter alternativo passam a mesma suíte comportamental.
- `M02A-AT-056`: adapter que fortalece precondição ou altera semântica falha no contract test.
- `M02A-AT-057`: domínio permanece importável e testável sem adapters instalados.
- `M02A-AT-058`: composition root é o único ponto autorizado a ligar implementações concretas.
- `M02A-AT-059`: abstração sem segunda variação, risco ou mudança prevista exige ADR ou é removida.
- `M02A-AT-060`: mudança de política altera domínio/testes esperados sem exigir modificação de CLI ou advisor fake.

## 7. Gates de qualidade

| Gate | Saída verificável | Estado |
|---|---|---|
| G0 — design | escopo, 60 competências, 60 ATs, fontes, limites e rubrica | **APROVADO** |
| G1 — material | HTML no padrão M00, 15 blocos, exercícios, fontes e acessibilidade | EM PRODUÇÃO |
| G2 — execução | Python: Ruff, mypy strict, pytest/Hypothesis e wheel; corpus v1/v2 e testes diferenciais entre API e CLI instalada | PENDENTE |
| G3 — avaliação | 60 ATs, checkpoint por cenário, casos negativos, demonstração e rubrica corrigível | PENDENTE |
| G4 — portabilidade | invariantes/adapters separados, Python canônico, adapters substituíveis e corpus diferencial entre API e CLI, sem falsa equivalência de lifecycle | PENDENTE |
| G5 — produção | architecture rules, adversariais, tenant, transação, bounded queue, telemetria, SLI/SLO, runbook, clean install e evidência | PENDENTE |
| G6 — editorial/certificação | QA HTML a 390 px/desktop/impressão, links/fontes/acessibilidade e matriz Windows/Linux/CI sem P0 aberto | PENDENTE |

Entrada local única planejada: `uv run --locked --offline python tools/gate.py all`. Ela deve preservar stdout, stderr e exit code das ferramentas nativas. O modo offline pressupõe que o restore inicial já materializou o cache; execuções parciais podem chamar ferramentas específicas, mas não substituem o gate agregado.

## 8. Rubrica

Cada dimensão vale 0–4. Aprovação exige **≥ 28/32**, nenhum P0 aberto e nenhuma dimensão abaixo de 3.

| Dimensão | 0–1 | 2 | 3 | 4 |
|---|---|---|---|---|
| problema e requisitos | opinião/solução precoce | requisitos parciais | critérios rastreáveis | trade-offs e mudança controlada |
| arquitetura | diagrama decorativo | separação sem prova | limites e gates | evolução e condições de revisão |
| contratos/dados | happy path | validação parcial | compatibilidade e invariantes | falhas/concorrência demonstradas |
| qualidade | testes tautológicos | cobertura sem risco | camadas e negativos | property/mutation/differential efetivos |
| segurança/IA | confiança implícita | lista de riscos | controles testados | abuso, fallback e residual explícitos |
| operação | logs soltos | métricas sem decisão | correlação e SLO | incidente/runbook e aprendizado |
| performance/custo | número isolado | benchmark frágil | workload e amostras | capacidade, saturação e decisão |
| liderança/evidência | autoridade/opinião | justificativa informal | comunicação e evidência | decisão ética, limites e transferência |

## 9. Registro de fontes

O SWEBOK é índice de cobertura, não fonte única. Normas/especificações têm precedência para conformidade; literatura canônica ensina julgamento e deve resultar em hipótese ou prática verificável.

| Área | Fonte normativa/canônica | Uso | Revalidar |
|---|---|---|---|
| corpo profissional | [IEEE SWEBOK v4.0a](https://www.computer.org/education/bodies-of-knowledge/software-engineering) | mapa de requisitos, design, construção, teste, operação e prática | nova edição |
| arquitetura/qualidade | [ISO/IEC/IEEE 42010:2022](https://www.iso.org/standard/74393.html); [ISO/IEC 25010:2023](https://www.iso.org/standard/78176.html); [SEI ADD](https://www.sei.cmu.edu/library/attribute-driven-design-method-collection/) | concerns, viewpoints, atributos e trade-offs | anual |
| requisitos | [ISO/IEC/IEEE 29148:2018](https://www.iso.org/standard/72089.html) | necessidade, requisito e rastreabilidade; edição em revisão em 2026 | alto durante revisão |
| documentação | [C4 Model](https://c4model.com/); [ADR de Nygard/Fowler](https://martinfowler.com/bliki/ArchitectureDecisionRecord.html) | comunicação leve e histórico de decisão | anual |
| risco/evidência | [ISO 31000:2018](https://www.iso.org/standard/65694.html); [OMG SACM 2.0](https://www.omg.org/spec/SACM/2.0/) | incerteza ligada a objetivos e subconjunto didático claim–evidência | nova edição |
| modularidade/domínio | [Parnas 1972](https://doi.org/10.1145/361598.361623); [Liskov/Wing 1994](https://www.cs.columbia.edu/~wing/publications/LiskovWing94.pdf); [PEP 544](https://peps.python.org/pep-0544/); [Python import system](https://docs.python.org/3.14/reference/import.html); [Cockburn 2005](https://alistair.cockburn.us/hexagonal-architecture); [DDD Reference](https://www.domainlanguage.com/ddd/reference/) | information hiding, subtipagem comportamental, Protocol, imports, ports/adapters e modelo de domínio | por release do Python; demais anual |
| contratos | [JSON Schema 2020-12](https://json-schema.org/draft/2020-12); [OpenAPI](https://spec.openapis.org/oas/); [AsyncAPI](https://www.asyncapi.com/docs/reference/specification/latest); [RFC 9110](https://www.rfc-editor.org/rfc/rfc9110.html); [RFC 9457](https://www.rfc-editor.org/rfc/rfc9457.html); [CloudEvents](https://cloudevents.io/) | contrato, evolução, erros e envelopes | 90 dias quando ativo |
| Python | [Python 3.14 Language Reference](https://docs.python.org/3.14/reference/); [Python typing specification](https://typing.python.org/en/latest/spec/) | semântica e typing gradual | por release |
| dados | [PostgreSQL 18 MVCC](https://www.postgresql.org/docs/18/mvcc.html); [Open Data Contract Standard](https://bitol.io/); [OpenLineage](https://openlineage.io/docs/spec/) | modelo conceitual, contratos e lineage | 90 dias/major |
| distribuídos | [Lamport](https://lamport.azurewebsites.net/pubs/time-clocks.pdf); [Gilbert/Lynch](https://dl.acm.org/doi/10.1145/564585.564601); [Raft](https://raft.github.io/raft.pdf); [Pat Helland](https://www.cidrdb.org/cidr2007/papers/cidr07p15.pdf) | causalidade, CAP formal, consenso e mensagens | anual |
| observabilidade/SRE | [OpenTelemetry Specification](https://opentelemetry.io/docs/specs/otel/); [W3C Trace Context](https://www.w3.org/TR/trace-context/); [Google SRE](https://sre.google/sre-book/service-level-objectives/) | sinais, propagação, SLI/SLO e error budget | 90 dias para OTel |
| entrega/plataforma | [DORA](https://dora.dev/guides/dora-metrics/); [OpenGitOps](https://opengitops.dev/); [OCI](https://specs.opencontainers.org/); [CNCF Platforms](https://tag-app-delivery.cncf.io/whitepapers/platforms/) | fluxo, reversibilidade e plataforma como produto | 90 dias |
| segurança/supply chain | [NIST SSDF 1.1](https://csrc.nist.gov/pubs/sp/800/218/final); [OWASP ASVS 5.0](https://owasp.org/www-project-application-security-verification-standard/); [SLSA 1.2](https://slsa.dev/spec/v1.2/); [SPDX 3.0](https://spdx.dev/use/specifications/); [CycloneDX 1.7](https://cyclonedx.org/specification/overview/); [Sigstore](https://docs.sigstore.dev/about/overview/) | requisitos, proveniência, inventário e verificação | 90 dias |
| IA | [NIST AI RMF 1.0](https://www.nist.gov/publications/artificial-intelligence-risk-management-framework-ai-rmf-10); [NIST AI 600-1](https://nvlpubs.nist.gov/nistpubs/ai/NIST.AI.600-1.pdf); [SP 800-218A](https://csrc.nist.gov/pubs/sp/800/218/a/final); [MITRE ATLAS](https://atlas.mitre.org/); [OWASP LLM Top 10 2025](https://genai.owasp.org/resource/owasp-top-10-for-llm-applications-2025/) | governança, riscos e controles de GenAI | 90 dias |
| evals | [UK AISI Inspect](https://inspect.aisi.org.uk/); [MLCommons AILuminate](https://mlcommons.org/ailuminate/) | dataset, scorer, logs, budget e adversariais | 90 dias |
| ética/liderança | [IEEE/ACM Code of Ethics](https://www.computer.org/education/code-of-ethics); [SPACE](https://doi.org/10.1145/3454122.3454124); [Team Topologies](https://teamtopologies.com/key-concepts-content); [Staff Engineer](https://staffeng.com/guides/staff-archetypes/) | responsabilidade, métricas e influência | anual |
| prática canônica | [Evans](https://www.dddcommunity.org/uncategorized/evans_2004/); [Fowler](https://martinfowler.com/books/refactoring.html); [Kleppmann](https://martin.kleppmann.com/); [Nygard](https://books.pragprog.com/titles/mnee2/release-it-second-edition/); [Brendan Gregg](https://www.brendangregg.com/usemethod.html) | domínio, refactoring, dados, resiliência e diagnóstico | por edição |

Regras: registrar versão/data no HTML; evitar claims de mercado sem pesquisa datada; não usar uma empresa como autoridade universal; nunca usar LLM-as-judge isolado como prova.

## 10. Matriz de execução

| Dimensão | Windows | Linux | CI |
|---|---|---|---|
| Python | CPython 3.14 via lock | mesmo | matriz Windows/Ubuntu |
| dados | SQLite e temp paths | mesmo | banco novo por job |
| encoding/path | UTF-8, CRLF de entrada, drive | UTF-8, LF, case-sensitive | fixtures divergentes |
| IA | fake/record-replay offline | igual | rede/credencial proibidas após restore |
| evidência | JSON sanitizado | JSON sanitizado | artefato por OS/runtime |
| performance | informativa | job de referência | sem comparar números absolutos entre runners |

## 11. Critério de conclusão

Um terceiro deve conseguir reconstruir os artefatos, executar o corpus nos dois caminhos Python, reproduzir falhas negativas, provar atomicidade/isolamento/backpressure/cancelamento, trocar o advisor sem alterar domínio/política, reverter policy defeituosa e ligar cada decisão relevante a requisito, ADR, teste e evidência.

A defesa final deve também declarar quais garantias são apenas locais e quais só serão adquiridas em M03 e LT01–LT04.

## 12. Decisão G0

**G0 revisado em 12/09/2026, versão 1.2**, por decisão do usuário de remover a dependência didática de outra stack. Permanecem 15 blocos, 60 competências, 60 cenários e o produto Python. B14 e AT-006/010/022/040 passam a comprovar compatibilidade entre caminhos Python; não se transfere aprovação de evidências anteriores para esses oráculos revisados. G1 continua em produção, G2 parcial e G3–G6 pendentes.

Aprovação histórica: versão 1.1 em 15/08/2026, com quinze oráculos próprios para B01–B03. O corte comparativo em outra linguagem daquela revisão foi substituído nesta versão; os IDs foram preservados para rastrear a mudança.
