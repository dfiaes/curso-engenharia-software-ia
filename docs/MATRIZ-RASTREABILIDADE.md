# Matriz de rastreabilidade curricular

**Versão:** 1.1 · **Data-base:** 15/08/2026

Esta matriz liga resultados de aprendizagem a conteúdo, prática, evidência e fonte. O estado inicial representa a auditoria do material existente, não o progresso de estudo do aluno.

## Legenda

- `AUSENTE`: não há cobertura suficiente.
- `PARCIAL`: existe introdução, mas falta profundidade ou prática.
- `COBERTO`: conteúdo e prática existem; ainda falta verificação completa.
- `ESPECIFICADO`: objetivos, prática, evidência, fontes e G0 foram definidos; conteúdo ainda não foi produzido.
- `VERIFICADO`: passou pelos gates G0–G6.
- `REFAZER`: o material existente transmite falsa prontidão ou possui implementação inválida.

## Resultados de alto nível

| ID | Competência observável | Destino | Evidência obrigatória | Fontes-base | Estado inicial |
|---|---|---|---|---|---|
| AIW-01 | Controlar contexto, instruções, ferramentas e permissões de um harness | M00 | contrato agnóstico, seleção sob orçamento e testes de menor privilégio | Agent Skills + MCP + docs oficiais comparadas | EM REVISÃO |
| AIW-02 | Transformar intenção em spec, plano, tarefas e feedback mecânico | M01 | drift, gates e integração rastreados em lab cross-platform | Spec Kit + Git + tooling Python + DORA | VERIFICADO |
| AIW-03 | Revisar saída de IA por evidência, não por fluência | M01, M06, LT04 | defeitos semeados detectados por testes/evals | pesquisas e relatórios com metodologia | PARCIAL |
| PY-01 | Usar typing gradual, Protocols, genéricos, narrowing e validação em fronteiras | M02 | dois adapters, checker estrito e caso runtime negativo | Python typing specification, mypy, Pydantic | VERIFICADO NO M02 |
| PY-02 | Projetar concorrência estruturada, cancelamento, timeout e backpressure | M02, LT01 | TaskGroup, cancelamento e saturação em servidor local | Python asyncio | VERIFICADO NO M02 |
| PY-03 | Empacotar, reproduzir e distribuir aplicação Python | M02, M03 | wheel instalado fora do checkout e ambiente bloqueado | PyPA, pylock.toml, uv | VERIFICADO NO M02 |
| PY-04 | Diagnosticar modelo de objetos, imports, recursos, exceções e encoding | M02 | defeitos semeados com cleanup, import e exception chain | Python Language Reference e stdlib | VERIFICADO NO M02 |
| PY-05 | Escolher event loop, thread, processo, interpreter ou free-threading por evidência | M02, M11 | benchmark registrado e caso de corrida/compatibilidade | Python concurrency e free-threading HOWTO | VERIFICADO NO M02 |
| PY-06 | Testar contrato Python por unidade, integração, propriedade e mutação | M02, M06, M02A | CLI instalada, property tests e mutante morto | pytest, Hypothesis e estratégia de testes | VERIFICADO NO M02 |
| WEB-01 | Projetar API HTTP com contratos e erros interoperáveis | M03, M08, M09 | OpenAPI + Problem Details + contract tests | HTTP RFCs, OpenAPI, RFC 9457 | PARCIAL |
| DATA-01 | Modelar transações, isolamento, índices e planos | M03 | migrações e análise de plano | PostgreSQL, SQLAlchemy, Alembic | COBERTO |
| OPS-01 | Diagnosticar processos, recursos, DNS, TCP e TLS | LT01 | incidente reproduzido e diagnosticado | Linux, IETF RFCs, Python docs | AUSENTE |
| ARCH-01 | Produzir PRD, C4, ADR e fitness functions úteis | M04, M10 | design doc confrontado com implementação | C4, ADR, Evolutionary Architecture | COBERTO |
| DIST-01 | Raciocinar sobre consistência, CAP/PACELC e falhas parciais | LT02, M10 | decisão arquitetural com experimento | papers originais + DDIA como síntese | AUSENTE |
| DIST-02 | Implementar fila, backpressure, retry budget e DLQ | LT02, M05 | worker saturado sem colapso | docs do broker + Reactive Streams | AUSENTE |
| DIST-03 | Garantir idempotência durável e outbox/inbox | LT02, M12 | múltiplas instâncias sem efeito duplicado | PostgreSQL + padrões canônicos | AUSENTE |
| DATA-02 | Planejar backup, PITR, replicação, retenção e exclusão | LT02, M12 | restore testado e política documentada | PostgreSQL + NIST/LGPD aplicável | AUSENTE |
| LLM-01 | Explicar tokenização, sampling, contexto e structured output | M05, M11 | experimento comparável entre modelos | papers + docs dos modelos | COBERTO |
| LLM-02 | Isolar provedores por portas/adapters e erros normalizados | M05 | mesma suíte em fake e adapters | Python Protocol, JSON Schema | PARCIAL |
| LLM-03 | Controlar timeout, retry, fallback, quota, cache e custo | M05, LT02 | relatório de falhas e custo por chamada | docs de gateway/cache + SRE | COBERTO |
| EVAL-01 | Construir dataset por taxonomia e métricas adequadas | M06 | dataset versionado e baseline | papers/métricas originais | COBERTO |
| EVAL-02 | Calibrar LLM-as-judge contra avaliação humana | M06, LT04 | concordância e análise de divergências | papers originais | PARCIAL |
| OBS-01 | Correlacionar logs, métricas e traces em IA | M06, LT01 | trace ponta a ponta e diagnóstico | OpenTelemetry | COBERTO |
| RAG-01 | Implementar ingestão, chunking, busca híbrida e reranking | M07 | pipeline avaliado por retrieval metrics | papers IR/RAG + PostgreSQL | COBERTO |
| RAG-02 | Aplicar autorização antes do contexto e provar não vazamento | M07, M12 | testes negativos multi-tenant | OWASP, PostgreSQL RLS | COBERTO |
| AGT-01 | Escolher workflow, agente ou código determinístico por trade-off | M08 | ADR e implementação mínima | papers/padrões + frameworks comparados | COBERTO |
| AGT-02 | Projetar tools estreitas, idempotentes e com aprovação | M08, M12 | ação destrutiva protegida e auditada | OWASP Agentic, NIST | PARCIAL |
| PROTO-01 | Implementar MCP por especificação, sem dependência do SDK | M09 | cliente/servidor interoperáveis | MCP versionado | COBERTO |
| PROTO-02 | Implementar descoberta e comunicação A2A segura | M09 | agent card e fluxo autenticado | A2A versionado | COBERTO |
| GRAPH-01 | Modelar máquina de estados, checkpoint e retomada | M10 | workflow retomado após falha | teoria de FSM + framework usado | COBERTO |
| GRAPH-02 | Construir e avaliar grafo de conhecimento | M10 | consultas e métricas do grafo | teoria de grafos + GraphRAG papers | COBERTO |
| ML-01 | Explicar vetores, gradiente, atenção e transformer | M11 | transformer mínimo explicado/testado | papers originais + PyTorch | COBERTO |
| INF-01 | Medir memória, latência, throughput e qualidade de inferência | M11, LT03 | benchmark reproduzível | engines/model docs + papers | PARCIAL |
| PLAT-01 | Operar workload declarativo com probes e recursos | LT03 | deploy resiliente | Kubernetes, OCI | AUSENTE |
| PLAT-02 | Provisionar ambiente reproduzível com IaC | LT03 | plan/apply/destroy em sandbox | OpenTofu/Terraform docs | AUSENTE |
| PLAT-03 | Implementar GitOps, canary e rollback | LT03, LT04 | promoção e rollback observados | GitOps/progressive delivery specs/docs | AUSENTE |
| SEC-01 | Modelar ameaças de aplicação e agente | M12, LT04 | threat model com testes de abuso | OWASP, NIST | REFAZER |
| SEC-02 | Conter goal hijacking, tool misuse, privilege abuse e poisoning | M12 | red-team suite e mitigação em camadas | OWASP Agentic Top 10 | REFAZER |
| SEC-03 | Implementar identidade, least privilege, secrets e auditoria | M12, LT01 | trilha de auditoria e testes negativos | OWASP ASVS, NIST | PARCIAL |
| TEN-01 | Provar isolamento multi-tenant em banco, cache e telemetria | M12 | testes adversariais entre tenants | PostgreSQL RLS, OWASP | REFAZER |
| SRE-01 | Definir SLI/SLO, error budget e alertas acionáveis | M12 | SLO medido e política de release | Google SRE, OpenTelemetry | REFAZER |
| SRE-02 | Conduzir incidente, rollback e postmortem sem culpa | M12, M13 | game day e postmortem | Google SRE, resilience engineering | AUSENTE |
| FIN-01 | Medir unit economics, quota, margem e custo por tenant | M12 | dashboard e decisão de preço | dados medidos + billing docs | REFAZER |
| GOV-01 | Versionar modelo, dados, prompts e decisões de risco | LT04, M13 | lineage e risk register | NIST AI RMF | AUSENTE |
| GOV-02 | Operar human evaluation, drift, shadow e canary | LT04 | relatório go/no-go | NIST + papers de avaliação | AUSENTE |
| SUP-01 | Produzir SBOM, proveniência e artefato verificável | LT04 | pacote assinado e verificado | SLSA, SPDX/CycloneDX, Sigstore | AUSENTE |
| TEST-01 | Usar testes unitários, integração e e2e de forma intencional | M02, M03, M06 | pirâmide justificada e executada | pytest + Testcontainers | COBERTO |
| TEST-02 | Usar contract, property, mutation, load e chaos testing | LT04 | relatório de mutantes/carga/falhas | ferramentas oficiais + literatura canônica | AUSENTE |
| CAP-01 | Integrar produto executável sem resultados simulados | M13 | repositório, CI e ambiente implantado | todas as anteriores | REFAZER |
| CAP-02 | Demonstrar valor, segurança, custo e confiabilidade medidos | M13 | dossier de evidências e usuário real | métricas do próprio produto | REFAZER |
| SEN-01 | Defender trade-offs e consequências para stakeholders | M04–M13 | ADRs e defesas técnicas | material canônico por tema | PARCIAL |
| SEN-02 | Liderar escopo, risco, dívida e roadmap técnico | M13 | plano por fases com critérios de corte | DORA + engenharia de produto | AUSENTE |

## Rastreabilidade por artefato

### M00 · Rastreabilidade detalhada aprovada em G0

O detalhe por competência, cenário e gate está em `modulos/M00-ferramental/RASTREABILIDADE.md`. Em 14/08/2026, G0–G5 estão aprovados no escopo; G6 é parcial. O laboratório registra 18 testes verdes em Python 3.14.7, Ruff e mypy, incluindo cliente MCP v2 oficial in-memory; revisão visual permanece pendente porque a política do navegador bloqueou `file://`.

### M01 · Rastreabilidade detalhada em produção

A especificação em `docs/especificacoes/M01-ESPECIFICACAO.md` define 27 competências e 22 cenários. O lab passou em Python 3.14.7, Ruff, mypy estrito e 27 testes, incluindo Git real descartável, falhas semeadas e Capstone rastreado. O HTML regenerado possui 9.049 palavras e novo checkpoint. G0–G6 estão aprovados.

### M02 · Rastreabilidade detalhada verificada

O detalhe está em `modulos/M02-python-para-dev-dotnet/RASTREABILIDADE.md`: 43 competências e 38 cenários, todos verificados. O HTML foi regenerado em oito blocos/16h com vinte fontes primárias. Em Windows, Ruff, mypy strict, build/inspeção e instalação limpa do wheel passaram; os 51 testes foram aprovados tanto no CPython 3.14.7 padrão quanto no 3.14t com GIL desativado, e `pydantic-core` preservou esse modo. No WSL2/Ubuntu, os 51 testes e a CLI passaram em CPython 3.14.7, com saída UTF-8/LF. `csv-cleaner==0.1.0` importa `python_senior_lab` de `site-packages`. Desktop, viewport real de 390 px e impressão integral em 52 páginas foram inspecionados; G0–G6 estão aprovados.

### M02A · Rastreabilidade detalhada aprovada em G0

Especificação: [`docs/especificacoes/M02A-ESPECIFICACAO.md`](especificacoes/M02A-ESPECIFICACAO.md)

Python 3.14 é canônico; .NET 10 é somente um corte comparativo. O laboratório local não antecipa garantias de M03/LT01–LT04.

| ID detalhado | Resultado observável | Bloco | Evidência principal | Aceitação | Estado |
|---|---|---|---|---|---|
| ES26-001..004 | decidir por produto, risco e evidência | B01 | intent + risk register | M02A-AT-001,043 | ESPECIFICADO |
| ES26-005..008 | rastrear requisitos, qualidade, ADR e C4 | B02 | requirements + architecture | M02A-AT-001,004,005 | ESPECIFICADO |
| ES26-009..012 | controlar modularidade e dependências | B03 | architecture rules | M02A-AT-002,003 | ESPECIFICADO |
| ES26-013..016 | evoluir contratos interoperáveis | B04 | schemas + corpus golden | M02A-AT-006..011 | ESPECIFICADO |
| ES26-017..020 | provar transação, isolamento e índice | B05 | migrations + query plan | M02A-AT-012..017 | ESPECIFICADO |
| ES26-021..024 | controlar concorrência e backpressure | B06 | bounded batch + fault tests | M02A-AT-018..022 | ESPECIFICADO |
| ES26-025..028 | raciocinar sobre tempo e falha parcial | B07 | simulações + limites declarados | M02A-AT-013,018..021 | ESPECIFICADO |
| ES26-029..032 | testar por risco e força do oráculo | B08 | property/mutation/differential | M02A-AT-029..031 | ESPECIFICADO |
| ES26-033..036 | modelar ameaça e testar controles | B09 | threat model + adversariais | M02A-AT-025,032..035 | ESPECIFICADO |
| ES26-037..040 | operar telemetria, SLO e incidente | B10 | trace + SLO + runbook | M02A-AT-036,044,045 | ESPECIFICADO |
| ES26-041..044 | escolher estruturas e medir performance/capacidade/custo | B11 | workload + raw samples | M02A-AT-037,038 | ESPECIFICADO |
| ES26-045..048 | modernizar legado, entregar e reverter mudança | B12 | plano incremental + gates + policy rollback | M02A-AT-039..043 | ESPECIFICADO |
| ES26-049..052 | aplicar Python sênior no produto | B13 | wheel + diagnóstico | M02A-AT-020,021,040..043 | ESPECIFICADO |
| ES26-053..056 | transferir sem falsa equivalência .NET | B14 | differential corpus + publish | M02A-AT-006,010,011,022,040 | ESPECIFICADO |
| ES26-057..060 | governar IA e liderar decisão | B15 | advisor contract + defense | M02A-AT-023..028,031 | ESPECIFICADO |

Detalhe completo: [`modulos/M02A-engenharia-software-senior/RASTREABILIDADE.md`](../modulos/M02A-engenharia-software-senior/RASTREABILIDADE.md). Nenhum aceite está verificado antes de G1–G6.

### M12 · Rastreabilidade detalhada aprovada em G0

Especificação: [`docs/especificacoes/M12-ESPECIFICACAO.md`](especificacoes/M12-ESPECIFICACAO.md)

| ID detalhado | Resultado observável | Bloco | Evidência principal | Aceitação | Estado |
|---|---|---|---|---|---|
| M12-B01-C01..04 | modelar e priorizar ameaças convencionais e agênticas | B1 | threat model + catálogo YAML | M12-AT-001 | ESPECIFICADO |
| M12-B02-C01..04 | conter dados não confiáveis, secrets, PII e execução | B2 | content policy + tool constraints | M12-AT-002..004 | ESPECIFICADO |
| M12-B03-C01..05 | separar identidade, autorização, policy e aprovação ligada | B3 | authorizer + approval store + audit | M12-AT-005..006 | ESPECIFICADO |
| M12-B04-C01..05 | provar isolamento em todos os data planes | B4 | migrations RLS + suíte cross-tenant | M12-AT-010..014 | ESPECIFICADO |
| M12-B05-C01..05 | garantir idempotência durável sob concorrência/crash | B5 | ledger PostgreSQL + failure injection | M12-AT-020..023 | ESPECIFICADO |
| M12-B06-C01..04 | aplicar quotas e budgets hierárquicos reconciliáveis | B6 | quota policy + budget ledger | M12-AT-040..041 | ESPECIFICADO |
| M12-B07-C01..06 | medir, faturar e reconciliar sem acoplar o domínio | B7 | billing ports/fake/adapter + ledger | M12-AT-030..032 | ESPECIFICADO |
| M12-B08-C01..06 | operar por SLO, burn rate, runbook e incidente | B8 | SLO + alertas + game day | M12-AT-050..052 | ESPECIFICADO |
| M12-B09-C01..06 | demonstrar hardening e risco residual de ponta a ponta | B9 | dossier `evidence/m12` | todos + M12-AT-060 | ESPECIFICADO |

### M13 · Rastreabilidade detalhada aprovada em G0

Especificação: [`docs/especificacoes/M13-ESPECIFICACAO.md`](especificacoes/M13-ESPECIFICACAO.md)

| ID detalhado | Resultado observável | Blocos | Evidência principal | Aceitação | Estado |
|---|---|---|---|---|---|
| M13-B01-C01..05 | congelar contrato, metas e método de evidência | B1 | release contract + risk register | CAP-LCH-001 | ESPECIFICADO |
| M13-B02-C01..04 | reproduzir workspace, CI e artefato | B2 | build limpo + manifest | CAP-REP-001 | ESPECIFICADO |
| M13-B03-C01..05 | ingerir de forma segura, async e recuperável | B3 | job + snapshot + failure tests | CAP-ING-001..002 | ESPECIFICADO |
| M13-B04-C01..06 | extrair estrutura multi-language deterministicamente | B4 | parser adapters + corpus dourado | CAP-PAR-001..002 | ESPECIFICADO |
| M13-B05-C01..05 | manter schema, lifecycle e isolamento | B5 | migrations + RLS tests | CAP-DAT-001, CAP-TEN-001 | ESPECIFICADO |
| M13-B06-C01..06 | recuperar com ACL, métricas e abstenção | B6 | retrieval benchmark | CAP-RAG-001..002 | ESPECIFICADO |
| M13-B07-C01..05 | responder estrutura por grafo com provenance | B7 | graph fixtures + queries | CAP-GRA-001 | ESPECIFICADO |
| M13-B08-C01..05 | trocar modelos sem alterar domínio | B8 | contract suite de adapters | CAP-LLM-001 | ESPECIFICADO |
| M13-B09-C01..06 | executar investigação durável e controlada | B9 | kill/resume trace | CAP-AGT-001 | ESPECIFICADO |
| M13-B10-C01..05 | expor contratos HTTP/MCP/A2A interoperáveis | B10 | specs + contract tests | CAP-API/MCP/A2A-001 | ESPECIFICADO |
| M13-B11-C01..06 | detectar regressão por cálculo reproduzível | B11 | eval report por versão | CAP-EVL-001 | ESPECIFICADO |
| M13-B12-C01..06 | fechar segurança e multi-tenancy | B12 | red-team + isolation report | CAP-SEC-001 | ESPECIFICADO |
| M13-B13-C01..05 | medir e faturar por ledger reconciliado | B13 | cost/margin report | CAP-BIL/CST-001 | ESPECIFICADO |
| M13-B14-C01..06 | operar por telemetria, SLO e runbook | B14 | dashboard + alert evidence | CAP-OBS/SLO-001 | ESPECIFICADO |
| M13-B15-C01..06 | permitir onboarding utilizável e acessível | B15 | usability/accessibility report | CAP-UX/DOC/ACC-001 | ESPECIFICADO |
| M13-B16-C01..06 | medir capacidade, limites e modo local | B16 | performance/capacity report | CAP-PRF-001 | ESPECIFICADO |
| M13-B17-C01..06 | implantar, restaurar e reverter | B17 | deploy/restore/rollback evidence | CAP-DR/RBK/SUP-001 | ESPECIFICADO |
| M13-B18-C01..06 | decidir prontidão e responder a incidente | B18 | PRR + game day + postmortem | stop conditions | ESPECIFICADO |
| M13-B19-C01..06 | validar tarefa e problema com usuário real | B19 | pilot evidence | CAP-VAL-001 | ESPECIFICADO |
| M13-B20-C01..07 | lançar e defender apenas claims rastreáveis | B20 | release dossier + defesa | CAP-LCH-001 | ESPECIFICADO |

### LT01 · Rastreabilidade detalhada aprovada em G0

Especificação: [`docs/especificacoes/LT01-ESPECIFICACAO.md`](especificacoes/LT01-ESPECIFICACAO.md)

| ID detalhado | Resultado observável | Bloco | Evidência principal | Aceitação | Estado |
|---|---|---|---|---|---|
| LT01-B01-C01..06 | operar processo, sinais, cancelamento e shutdown | B1 | timeline + process tree + teste | LT01-AT-001..003 | ESPECIFICADO |
| LT01-B02-C01..06 | controlar filesystem, permissões, FD e secrets | B2 | permission map + FD chart | LT01-AT-010..012 | ESPECIFICADO |
| LT01-B03-C01..07 | localizar falha em DNS/TCP/TLS | B3 | connection breakdown | LT01-AT-020..022 | ESPECIFICADO |
| LT01-B04-C01..07 | projetar pools, deadlines e cancelamento HTTP | B4 | latency waterfall + pool metrics | LT01-AT-030..032 | ESPECIFICADO |
| LT01-B05-C01..07 | identificar saturação e limite de capacidade | B5 | load/resource curves | LT01-AT-040..050 | ESPECIFICADO |
| LT01-B06-C01..07 | diagnosticar incidente por hipótese e evidência | B6 | incident + patch + regression test | LT01-AT-060..061 | ESPECIFICADO |

### LT02 · Rastreabilidade detalhada aprovada em G0

Especificação: [`docs/especificacoes/LT02-ESPECIFICACAO.md`](especificacoes/LT02-ESPECIFICACAO.md)

| ID detalhado | Resultado observável | Bloco | Evidência principal | Aceitação | Estado |
|---|---|---|---|---|---|
| LT02-B01-C01..06 | decidir consistência sob falha parcial sem slogans | B1 | ADR + timeline + experimento | LT02-AT-001..003 | ESPECIFICADO |
| LT02-B02-C01..07 | controlar entrega, ordenação e backpressure | B2 | AsyncAPI + load curves + delivery matrix | LT02-AT-010..015 | ESPECIFICADO |
| LT02-B03-C01..07 | garantir idempotência durável com outbox/inbox | B3 | migrations + state diagram + effect ledger | LT02-AT-020..024 | ESPECIFICADO |
| LT02-B04-C01..07 | limitar retries e coordenar compensações | B4 | retry policy + saga timeline + DLQ runbook | LT02-AT-030..033 | ESPECIFICADO |
| LT02-B05-C01..07 | provar isolamento, durabilidade e recuperação | B5 | anomaly test + backup/restore report | LT02-AT-040..043 | ESPECIFICADO |
| LT02-B06-C01..07 | defender garantias em incidente multiworker | B6 | failure matrix + traces + postmortem | LT02-AT-050,060..061 | ESPECIFICADO |

### LT03 · Rastreabilidade detalhada aprovada em G0

Especificação: [`docs/especificacoes/LT03-ESPECIFICACAO.md`](especificacoes/LT03-ESPECIFICACAO.md)

| ID detalhado | Resultado observável | Bloco | Evidência principal | Aceitação | Estado |
|---|---|---|---|---|---|
| LT03-B01-C01..07 | decidir cloud/failure domains e produzir artifact OCI | B1 | ADR + manifest/digest + measurements | LT03-AT-001..003 | ESPECIFICADO |
| LT03-B02-C01..08 | modelar workload, rede, identidade e configuração | B2 | rendered manifests + negative tests | LT03-AT-010..014 | ESPECIFICADO |
| LT03-B03-C01..09 | operar probes, recursos, disrupção e autoscaling | B3 | capacity curves + disruption report | LT03-AT-020..025 | ESPECIFICADO |
| LT03-B04-C01..08 | provisionar por IaC com state e drift controlados | B4 | plan + lockfile + drift/import evidence | LT03-AT-030..034 | ESPECIFICADO |
| LT03-B05-C01..08 | reconciliar e promover desired state por GitOps | B5 | commit/artifact/reconciliation trace | LT03-AT-040..043 | ESPECIFICADO |
| LT03-B06-C01..09 | promover canary e recuperar incidente de plataforma | B6 | rollout analysis + incident/postmortem | LT03-AT-050..061 | ESPECIFICADO |

### LT04 · Rastreabilidade detalhada aprovada em G0

Especificação: [`docs/especificacoes/LT04-ESPECIFICACAO.md`](especificacoes/LT04-ESPECIFICACAO.md)

| ID detalhado | Resultado observável | Bloco | Evidência principal | Aceitação | Estado |
|---|---|---|---|---|---|
| LT04-B01-C01..09 | selecionar testes por risco e fortalecer oráculos | B1 | strategy matrix + counterexamples + mutants | LT04-AT-001..005 | ESPECIFICADO |
| LT04-B02-C01..10 | medir capacidade/resiliência e calibrar avaliação de IA | B2 | raw samples + intervals + calibration/chaos reports | LT04-AT-010..015 | ESPECIFICADO |
| LT04-B03-C01..10 | verificar dependências, SBOM, provenance e assinatura | B3 | SBOM + provenance + verification transcript | LT04-AT-020..025 | ESPECIFICADO |
| LT04-B04-C01..10 | operar secure SDLC, abuse suite e policy-as-code | B4 | findings ledger + policy tests + disclosure | LT04-AT-030..034 | ESPECIFICADO |
| LT04-B05-C01..11 | governar inventário, lineage, impacto e oversight | B5 | inventory + cards + lineage + risk/impact | LT04-AT-040..044 | ESPECIFICADO |
| LT04-B06-C01..11 | emitir e defender decisão de release reproduzível | B6 | dossier + independent review + decision | LT04-AT-050..061 | ESPECIFICADO |

Cada módulo ou laboratório deve acrescentar suas linhas detalhadas antes de entrar em escrita. Formato obrigatório:

| ID detalhado | Resultado | Seção/bloco | Prática | Evidência/caminho | Checkpoint | Fonte/versão | Estado |
|---|---|---|---|---|---|---|---|
| `MXX-BNN-C01` | verbo observável + objeto + condição | `MXX.html#...` | comando/experimento | arquivo, saída ou métrica | pergunta/teste | URL + versão | estado |

## Regras de atualização

1. `COBERTO` não significa correto até os exemplos serem executados.
2. Nenhuma competência pode ser `VERIFICADO` sem evidência persistida.
3. Se uma fonte mudar semanticamente, a linha volta para `PARCIAL` até revisão.
4. Um checkpoint sem conteúdo que o sustente bloqueia G3.
5. Resultados simulados, hardcoded ou não reproduzíveis marcam a competência como `REFAZER`.
