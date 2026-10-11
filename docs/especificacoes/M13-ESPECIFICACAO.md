# Especificação do M13 — Capstone Cartógrafo

> Referência de escopo da versão anterior do módulo. A sequência e o estado atuais estão em [CURRICULO.md](../../CURRICULO.md) e [STATUS.md](../../STATUS.md).

**Versão:** 1.0 · **Data-base:** 14/08/2026 · **Estado:** G0 APROVADO · **Carga:** 20 blocos / 40h

Esta especificação converte o M13 em roteiro de integração, validação e lançamento. O módulo não introduz uma nova pilha: ele obriga as peças construídas em M01–M12 e LT01–LT04 a funcionar como um produto único, mensurável e operável.

O HTML atual está bloqueado para estudo. Código simulado, `passed=True`, respostas hardcoded, chamadas `sleep()` fingindo integração e números de marketing não medidos são incompatíveis com esta especificação.

## 1. Produto e resultado final

**Nome de trabalho:** Cartógrafo / LegacyLens AI.

**Problema:** equipes gastam tempo e assumem risco para entender bases legadas antes de manutenção, incidente, auditoria ou modernização.

**Produto:** serviço multi-tenant que ingere uma base de código autorizada, extrai estrutura deterministicamente, cria índices de recuperação e grafo, responde perguntas com evidências, calcula sinais arquiteturais, conduz investigação por tools controladas e gera documentação útil.

**Linguagem de implementação:** Python 3.14. O produto pode analisar fixtures de C#, Python e outras linguagens por Tree-sitter; isso é dado do domínio, não ensino de .NET.

Ao concluir M13, o aluno deve possuir:

- repositório reproduzível e documentado;
- API, worker e experiência web mínima utilizável;
- ingestão e análise determinísticas onde o problema permite;
- RAG, grafo e agente avaliados por datasets versionados;
- contratos OpenAPI, MCP e A2A testados;
- isolamento multi-tenant, segurança e billing demonstrados;
- deploy, rollback, backup/restore, SLO e runbooks exercitados;
- usuário piloto e feedback registrado;
- custo, qualidade, latência e valor medidos;
- release dossier e defesa técnica pública sem números inventados.

## 2. Princípios do capstone

1. **Determinístico primeiro:** parse, símbolos, referências, paths, autorização e políticas não são delegados ao LLM.
2. **Evidência antes de afirmação:** toda claim de qualidade, economia ou produtividade aponta para execução, dataset ou entrevista.
3. **Uma arquitetura, adapters substituíveis:** modelos, billing, storage e deployment ficam atrás de portas explícitas.
4. **Async para trabalho longo:** ingestão retorna job; polling/evento informa estado; request HTTP não fica presa por horas.
5. **Falha é requisito:** cada etapa longa é retomável e idempotente.
6. **Segurança atravessa tudo:** tenant, identidade, autorização, secrets e audit não são middleware decorativo.
7. **Release é operação:** pronto inclui observabilidade, suporte, rollback, dados e custo.
8. **Usuário real pode rejeitar a hipótese:** feedback negativo é evidência válida; depoimento inventado reprova.

## 3. Escopo mínimo e cortes explícitos

### Obrigatório

- ingestão de repositório local ou snapshot autorizado;
- suporte comprovado a ao menos duas linguagens por Tree-sitter;
- extração de símbolos e relações com fixtures douradas;
- busca híbrida e grafo;
- respostas com citações para arquivo/linhas e abstenção;
- workflow durável com tools estreitas;
- API HTTP e servidor MCP; A2A demonstrado em fluxo delimitado;
- fake de modelo obrigatório e pelo menos um adapter live opcional/configurável;
- multi-tenancy, RLS, quotas, usage ledger e billing fake;
- OpenTelemetry, SLO, alertas e runbooks;
- deploy reproduzível e restauração testada.

### Pode ser simplificado

- UI server-rendered em Python/HTML; TypeScript não é pré-requisito;
- billing live permanece em test-mode;
- um único ambiente de produção de baixo custo, desde que rollback seja real;
- execução local de modelo pode ser um modo opcional se hardware for limitante.

### Fora de escopo

- IDE completa, refatoração automática irrestrita ou geração de PR sem aprovação;
- suporte universal a linguagens;
- substituição de SAST, revisão humana ou ferramenta de migração;
- prometer precisão perfeita ou redução percentual antes do piloto;
- armazenar código real de empregador sem autorização formal.

## 4. Arquitetura integrada

```text
Web/API/MCP/A2A
      │ authn → authz → tenant → quota
      ▼
Application services / job API
      │
      ├── Ingestion pipeline ──► object store / source snapshot
      │       └── Tree-sitter adapters ─► symbols/references
      │
      ├── Retrieval ─► lexical + vector + ACL ─► reranker
      │
      ├── Knowledge graph ─► relationships + architecture metrics
      │
      ├── Investigation workflow
      │       ├── deterministic tools
      │       ├── model port → fake/cloud/local adapters
      │       └── checkpoint + policy + approval
      │
      └── Report/document generation with provenance

PostgreSQL/RLS ─ job state ─ idempotency/outbox ─ usage/billing ledger
      │
OpenTelemetry ─ eval pipeline ─ SLI/SLO ─ alert/runbook
      │
declarative deployment ─ backup/restore ─ canary/rollback
```

### Portas mínimas

`SourceRepository`, `LanguageParser`, `EmbeddingProvider`, `ModelGateway`, `VectorIndex`, `GraphStore`, `JobQueue`, `PolicyEngine`, `BillingProvider`, `ObjectStore` e `TelemetrySink`.

Cada porta crítica tem fake determinístico e contract tests. Adapters podem compartilhar infraestrutura, mas não tipos proprietários no domínio.

## 5. Os vinte blocos executáveis

Cada bloco termina com commit, evidência em `capstone/evidence/m13/BXX/` e decisão explícita `PASS`, `FAIL` ou `BLOCKED` com causa. `PASS` não pode ser digitado manualmente sem comando/artefato que o sustente.

## Bloco 1 · Release contract, escopo e orçamento de evidência

**IDs:** M13-B01-C01..05 · **Dependências:** M01, M04.

**Entrada:** PRD, ADRs, definição do Cartógrafo e matriz curricular.

**Trabalho:** congelar persona, problema, três jornadas críticas, não objetivos, supported languages, datasets, SLOs preliminares, orçamento/custo máximo e critérios go/no-go antes de observar o release candidate.

**Saída:** `docs/release-contract.md`, trace matrix detalhada e risk register inicial.

**Aceitação:** toda claim planejada possui método de medição; nenhuma meta pode ser relaxada silenciosamente após o teste.

## Bloco 2 · Baseline reproduzível do repositório

**IDs:** M13-B02-C01..04 · **Dependências:** M02, M03, LT04.

**Entrada:** peças produzidas nos módulos.

**Trabalho:** integrar workspace Python 3.14, `uv.lock`, configuração tipada, Compose, migrations, seeds não sensíveis, lint, type checking, unit/integration tests e build de imagem.

**Saída:** um comando documentado sobe o sistema limpo; CI gera artefato identificável.

**Aceitação:** clone limpo → setup → testes → build sem passos ocultos ou segredo local.

## Bloco 3 · Ingestão segura e job assíncrono

**IDs:** M13-B03-C01..05 · **Dependências:** M03, LT01, LT02, M12.

**Trabalho:** source snapshot autorizado, ignore rules, limites de arquivo/repositório, detecção de binário, secret policy, job idempotente, progresso, cancelamento e retomada.

**Saída:** endpoint/job ingere fixture grande sem prender request HTTP.

**Aceitação:** cancel/retry/crash não duplica snapshot nem deixa job impossível de reconciliar.

## Bloco 4 · Parsing multi-language com Tree-sitter

**IDs:** M13-B04-C01..06 · **Dependências:** M02, M10, M11.

**Trabalho:** adapters Tree-sitter em Python, queries por linguagem, símbolos, spans, imports/chamadas, tratamento de erro, versão de gramática e corpus dourado. Python `ast` pode existir apenas como adapter Python especializado, nunca fingir suporte multi-language.

**Saída:** `LanguageParser` com pelo menos duas implementações e fixtures esperadas.

**Aceitação:** 100% dos símbolos/relações definidos no corpus contratual são reproduzidos; erros de parse são medidos e não somem silenciosamente.

## Bloco 5 · Modelo de dados, migrations e isolamento

**IDs:** M13-B05-C01..05 · **Dependências:** M03, M07, M10, M12.

**Trabalho:** schema para tenant/repository/snapshot/file/symbol/edge/chunk/job/report/usage, constraints, lifecycle e RLS. Definir identificadores estáveis e estratégia incremental.

**Saída:** migrations forward e rollback seguro; dados de fixtures A/B.

**Aceitação:** integridade referencial, `WITH CHECK`, pool reuse e exclusão cross-store passam.

## Bloco 6 · Busca híbrida, ACL e abstenção

**IDs:** M13-B06-C01..06 · **Dependências:** M06, M07.

**Trabalho:** lexical + vector, filtros antes da recuperação, reranking, citations, threshold de abstenção e dataset de retrieval.

**Saída:** serviço de busca com benchmark versionado.

**Aceitação:** atinge limiar pré-registrado de Recall@k/MRR, zero vazamento cross-tenant e regressão dentro do budget definido em B1.

## Bloco 7 · Grafo e métricas arquiteturais

**IDs:** M13-B07-C01..05 · **Dependências:** M10.

**Trabalho:** materializar entidades/relações, atualização incremental, travessias, provenance e métricas I/A/distância quando aplicáveis. Separar fato extraído de inferência do modelo.

**Saída:** consultas estruturais respondem perguntas que o RAG isolado não responde.

**Aceitação:** respostas estruturais conferem com corpus dourado e cada aresta aponta à origem.

## Bloco 8 · Gateway de modelos e outputs estruturados

**IDs:** M13-B08-C01..05 · **Dependências:** M05, M06, M11.

**Trabalho:** tipos internos, fake, adapter cloud e/ou local, structured output, timeout, retry budget, token/cost usage e fallback compatível com requisitos.

**Saída:** mesma suíte roda no fake e nos adapters habilitados.

**Aceitação:** remover SDK proprietário não altera domínio; erros e usage são normalizados.

## Bloco 9 · Agente, tools e workflow durável

**IDs:** M13-B09-C01..06 · **Dependências:** M08, M10, LT02, M12.

**Trabalho:** tools estreitas, estado tipado, budget de passos, stop conditions, checkpoint, retomada, idempotência, policy e aprovação ligada.

**Saída:** investigação longa retoma após kill sem repetir chamada paga/efeito.

**Aceitação:** execução real aparece em trace; nenhuma resposta hardcoded ou `sleep()` conta como agente.

## Bloco 10 · Contratos OpenAPI, MCP e A2A

**IDs:** M13-B10-C01..05 · **Dependências:** M03, M08, M09.

**Trabalho:** OpenAPI versionado, Problem Details, paginação/job API, servidor MCP interoperável e fluxo A2A limitado. Contract tests verificam schemas, auth e erros.

**Saída:** clientes independentes descobrem e exercitam capacidades documentadas.

**Aceitação:** breaking change é detectada; protocolo não depende do framework interno.

## Bloco 11 · Evals e quality gate

**IDs:** M13-B11-C01..06 · **Dependências:** M06, M07, M10.

**Trabalho:** datasets golden path, fora de escopo, injection, leakage, edge cases e regressão; retrieval, structural e answer metrics; judge calibrado; intervalos/variância quando cabível.

**Saída:** relatório comparável por commit/model/prompt/dataset.

**Aceitação:** CI falha por regressão real; trocar `passed` manualmente não altera cálculo.

## Bloco 12 · Hardening de segurança e multi-tenancy

**IDs:** M13-B12-C01..06 · **Dependências:** M12.

**Trabalho:** executar M12-AT-001..060 aplicáveis, atualizar threat model, corrigir P0/P1 e registrar risco residual.

**Saída:** relatório red-team e tenant isolation report.

**Aceitação:** zero P0/P1 aberto; nenhum controle depende apenas de prompt/regex.

## Bloco 13 · Metering, entitlement e billing

**IDs:** M13-B13-C01..05 · **Dependências:** M05, M12.

**Trabalho:** usage ledger, quotas, planos, entitlement, fake provider, Stripe test-mode opcional, webhooks e reconciliação. Medir custo completo por análise.

**Saída:** dashboard de custo, receita simulada pelo test-mode e margem por plano.

**Aceitação:** eventos duplicados/desordenados convergem; números derivam do ledger.

## Bloco 14 · Observabilidade, SLOs e runbooks

**IDs:** M13-B14-C01..06 · **Dependências:** M06, M12, LT01.

**Trabalho:** traces ponta a ponta, métricas de usuário/qualidade/custo, logs sanitizados, SLO, burn-rate alerts e runbooks.

**Saída:** dashboard permite ir do sintoma à dependência/execução.

**Aceitação:** failure injection aciona alerta correto; PII/código não aparecem na telemetria por padrão.

## Bloco 15 · Experiência web, onboarding e documentação

**IDs:** M13-B15-C01..06 · **Dependências:** M03, M04.

**Trabalho:** jornada cadastro → ingestão → primeira pergunta → relatório; empty/error/progress states; acessibilidade WCAG 2.2 AA nas telas críticas; tutorial, how-to, reference e explanation pelo Diátaxis.

**Saída:** usuário piloto conclui jornada sem intervenção do autor.

**Aceitação:** teste de usabilidade produz observações; problemas não são reescritos como sucesso.

## Bloco 16 · Performance, capacidade e modo local

**IDs:** M13-B16-C01..06 · **Dependências:** LT01, LT02, M11.

**Trabalho:** perfil de carga, p50/p95/p99, saturação, backpressure, capacity estimate, repositório grande e comparação local/cloud no mesmo dataset.

**Saída:** relatório de capacidade, custo e limites conhecidos.

**Aceitação:** SLO e budget do B1 são exercitados; teste registra ambiente e não extrapola conclusão além da amostra.

## Bloco 17 · Deploy, dados e rollback

**IDs:** M13-B17-C01..06 · **Dependências:** LT03, LT04.

**Trabalho:** infraestrutura declarativa, configuração/secrets, migrations compatíveis, canary, backup, restore e rollback de aplicação/dados.

**Saída:** staging/produção reproduzível e restore report.

**Aceitação:** release ruim é detectada e revertida; restore recupera RPO/RTO declarados.

## Bloco 18 · Production Readiness Review e game day

**IDs:** M13-B18-C01..06 · **Dependências:** M12, LT03, LT04.

**Trabalho:** revisar arquitetura, dependências, capacidade, segurança, dados, observabilidade, operação, acesso, suporte e rollback. Conduzir game day com papéis e comunicação.

**Saída:** `production-readiness-review.md`, incident timeline e postmortem.

**Aceitação:** go/no-go é decidido por evidência; NO-GO é resultado legítimo e deve gerar plano.

## Bloco 19 · Piloto com usuário e validação do problema

**IDs:** M13-B19-C01..06 · **Dependências:** B1–B18.

**Trabalho:** recrutar usuário autorizado, observar tarefa real, medir baseline manual, tempo/erros com produto, confiança, utilidade e disposição para repetir/pagar. Separar evidência de opinião.

**Saída:** notas anonimizadas, métricas, oportunidades, objeções e decisão de produto.

**Aceitação:** existe consentimento e contexto; nenhuma citação/depoimento é fabricado; hipótese pode ser rejeitada.

## Bloco 20 · Lançamento, portfólio e defesa técnica

**IDs:** M13-B20-C01..07 · **Dependências:** todos.

**Trabalho:** fechar changelog/versionamento, launch checklist, landing page factual, demo, post técnico, defesa arquitetural, retrospective e roadmap de 30/60/90 dias.

**Saída:** release versionada, dossier público sem dados sensíveis e dossier privado completo.

**Aceitação:** toda métrica publicada aponta para evidência; limitações e riscos aparecem; defesa explica trade-offs e incidentes, não apenas componentes.

## 6. Acceptance suite do produto

| ID | Área | Cenário | Condição de aprovação |
|---|---|---|---|
| CAP-REP-001 | reprodutibilidade | clone limpo até build | um fluxo documentado, sem passo oculto |
| CAP-ING-001 | ingestão | snapshot pequeno/grande | job conclui, progresso correto e artefato íntegro |
| CAP-ING-002 | ingestão | cancel/retry/crash | retomada sem duplicidade |
| CAP-PAR-001 | parser | corpus de duas linguagens | 100% do contrato de símbolos/relações esperado |
| CAP-PAR-002 | parser | arquivo parcial/inválido | erro medido, análise útil preservada |
| CAP-DAT-001 | dados | migrations e rollback | schema íntegro e compatível com estratégia declarada |
| CAP-TEN-001 | tenant | todos os data planes | zero vazamento A↔B |
| CAP-RAG-001 | retrieval | dataset versionado | limiar pré-registrado e regressão dentro do budget |
| CAP-RAG-002 | resposta | evidência ausente | sistema se abstém sem inventar localização |
| CAP-GRA-001 | grafo | perguntas estruturais | resultado confere com corpus e provenance |
| CAP-LLM-001 | adapters | fake/cloud/local habilitados | mesma suíte de contrato passa |
| CAP-AGT-001 | workflow | kill e retomada | sem repetição de efeito/chamada paga |
| CAP-API-001 | HTTP | OpenAPI/Problem Details/job | contract tests passam |
| CAP-MCP-001 | MCP | cliente independente | descoberta e execução interoperáveis |
| CAP-A2A-001 | A2A | fluxo delimitado | auth, estado e artifact verificáveis |
| CAP-EVL-001 | evals | regressão semeada | CI falha pelo cálculo correto |
| CAP-SEC-001 | segurança | catálogo M12 | zero P0/P1 falhando |
| CAP-BIL-001 | billing | duplicidade/desordem | ledger e entitlement convergem |
| CAP-CST-001 | custo | análise completa | custo e margem derivados de uso real/test-mode |
| CAP-OBS-001 | observabilidade | request → job → tools | correlação ponta a ponta sem dado sensível |
| CAP-SLO-001 | confiabilidade | burn-rate failure | alerta/runbook corretos |
| CAP-PRF-001 | performance | perfil de carga declarado | SLO cumprido ou NO-GO documentado |
| CAP-DR-001 | dados | backup/restore | RPO/RTO medidos e atendidos ou NO-GO |
| CAP-RBK-001 | release | canary ruim | rollback concluído e observado |
| CAP-UX-001 | usabilidade | primeira jornada | piloto conclui ou bloqueios são registrados |
| CAP-VAL-001 | valor | tarefa real | baseline e resultado medidos, sem claim fabricada |
| CAP-DOC-001 | documentação | onboarding/operação/API | quatro modos Diátaxis presentes e testados |
| CAP-ACC-001 | acessibilidade | jornadas críticas | WCAG 2.2 AA avaliada com teste automático + humano |
| CAP-SUP-001 | supply chain | release artifact | SBOM/proveniência/assinatura verificáveis |
| CAP-LCH-001 | lançamento | dossier e texto público | cada claim possui evidence ID |

## 7. Stop conditions e go/no-go

O release é **NO-GO** se qualquer condição ocorrer:

- P0/P1 de segurança aberto;
- vazamento cross-tenant em qualquer data plane;
- restore não testado ou RPO/RTO desconhecidos;
- regressão acima do budget pré-registrado;
- custo unitário torna o plano vendido estruturalmente negativo;
- ausência de rollback observável;
- telemetria contém código, secret ou PII sem justificativa/controle;
- jornada central não pode ser concluída por usuário piloto;
- métricas do material público não podem ser reproduzidas.

NO-GO não reprova o aluno se ele identifica corretamente a causa, preserva evidência e produz plano. Lançar apesar do bloqueador reprova.

## 8. Release dossier

```text
capstone/evidence/release/
  manifest.yaml                 # commit, versões, ambiente, datasets
  traceability.csv              # requisito → teste → evidência
  test-results/
  eval-results/
  security/
  tenant-isolation/
  performance/
  cost-and-margin/
  slo-and-incidents/
  backup-restore/
  supply-chain/
  usability-and-pilot/
  production-readiness-review.md
  go-no-go.md
  known-limitations.md
```

Cada artefato recebe ID estável, timestamp, comando, versão e resultado. Material público referencia apenas evidências anonimizadas e autorizadas.

## 9. Checkpoint e defesa final

### Demonstração de 45 minutos

1. problema e jornada do usuário;
2. ingestão real e resposta com provenance;
3. pergunta estrutural resolvida pelo grafo;
4. workflow interrompido e retomado;
5. troca de adapter de modelo;
6. ataque e isolamento cross-tenant;
7. dashboard de eval/custo/SLO;
8. rollback ou restore demonstrado;
9. evidência do piloto e limitações;
10. decisão go/no-go.

### Defesa técnica

- justificar fronteiras e trade-offs;
- localizar três pontos de maior blast radius;
- explicar por que uma parte foi determinística e outra probabilística;
- defender consistência/idempotência e modelo de tenant;
- demonstrar como mede qualidade e evita eval theater;
- calcular custo/margem de um caso real;
- explicar o incidente do game day e mudanças decorrentes;
- escolher o próximo investimento e o que deliberadamente não fará.

## 10. Fontes e versões

| ID | Fonte | Versão/data | Uso | Obsolescência |
|---|---|---|---|---|
| SRC-M13-01 | [Tree-sitter](https://tree-sitter.github.io/tree-sitter/) | docs consultadas 14/08/2026 | parsing multi-language | média |
| SRC-M13-02 | [py-tree-sitter](https://tree-sitter.github.io/py-tree-sitter/) | 0.26.0 | binding Python | alta |
| SRC-M13-03 | [OpenAPI](https://spec.openapis.org/oas/v3.2.0.html) | 3.2.0, 19/09/2025 | contrato HTTP | média |
| SRC-M13-04 | [JSON Schema](https://json-schema.org/specification) | Draft 2020-12 | contratos de dados | baixa |
| SRC-M13-05 | [Problem Details](https://www.rfc-editor.org/rfc/rfc9457.html) | RFC 9457 | erros interoperáveis | baixa |
| SRC-M13-06 | [MCP Specification](https://modelcontextprotocol.io/specification/) | versão vigente na regeneração | interoperabilidade tool/context | crítica |
| SRC-M13-07 | [A2A Specification](https://a2a-protocol.org/latest/specification/) | versão vigente na regeneração | comunicação entre agentes | crítica |
| SRC-M13-08 | [OpenTelemetry Semantic Conventions](https://opentelemetry.io/docs/specs/semconv/) | vigente na regeneração | observabilidade | alta |
| SRC-M13-09 | [DORA 2025](https://dora.dev/research/2025/dora-report/) | relatório v2025.2 | entrega e IA como amplificador | média |
| SRC-M13-10 | [Google SRE Launch Checklist](https://sre.google/sre-book/launch-checklist/) | edição online | prontidão de lançamento | baixa |
| SRC-M13-11 | [Google SRE Production Readiness Review](https://sre.google/sre-book/evolving-sre-engagement-model/) | edição online | PRR | baixa |
| SRC-M13-12 | [Google SRE Production Launch Planning](https://sre.google/resources/practices-and-processes/production-launch-planning/) | consultada 14/08/2026 | plano de lançamento | baixa |
| SRC-M13-13 | [Semantic Versioning](https://semver.org/) | 2.0.0 | versionamento público | baixa |
| SRC-M13-14 | [Diátaxis](https://diataxis.fr/) | consultada 14/08/2026 | documentação para uso/estudo | baixa |
| SRC-M13-15 | [WCAG](https://www.w3.org/TR/WCAG22/) | 2.2 Recommendation | acessibilidade | baixa |
| SRC-M13-16 | [OWASP Agentic Top 10](https://genai.owasp.org/resource/owasp-top-10-for-agentic-applications-for-2026/) | edição 2026 | acceptance de segurança | média |
| SRC-M13-17 | [SLSA](https://slsa.dev/spec/v1.2/) | 1.2 | proveniência do release | média |
| SRC-M13-18 | [FinOps Unit Economics](https://www.finops.org/framework/capabilities/unit-economics/) | Framework 2026 | custo e valor | média |
| SRC-M13-19 | [Product Talk — opportunity mapping](https://www.producttalk.org/sourcing-opportunities/) | Teresa Torres; consultada 14/08/2026 | organizar evidência do piloto | média |
| SRC-M13-20 | fontes de M06, M07, M09, M10, M12 e LT01–LT04 | versões registradas nesses artefatos | integração | variável |

## 11. Critérios editoriais do novo M13

- 20 blocos reais, um `<h2>` por bloco, sem condensar em cinco seções;
- 14.000–18.000 palavras visíveis, priorizando comandos, critérios e diagnóstico;
- mínimo de 30 resultados esperados;
- código somente quando integra peças; não repetir teoria dos módulos anteriores;
- exemplos executáveis ou explicitamente marcados como pseudocódigo arquitetural;
- nenhum teste com resultado fixo e nenhuma métrica de marketing pré-preenchida;
- diagnóstico com pelo menos 20 falhas de integração/lançamento;
- cada bloco aponta para módulos-fonte e evidence path;
- companion permitido para release checklist e catálogo de falhas;
- o post público é template com placeholders derivados de evidências, nunca números prontos.

## 12. Gate G0

- [x] produto, usuário e problema delimitados;
- [x] escopo obrigatório, simplificável e fora de escopo definidos;
- [x] vinte blocos com dependências, entrada, saída e aceitação;
- [x] arquitetura e portas agnósticas definidas;
- [x] acceptance suite com 30 cenários definida;
- [x] stop conditions e go/no-go definidos;
- [x] release dossier e checkpoint definidos;
- [x] validação com usuário real sem fabricação definida;
- [x] fontes primárias/canônicas selecionadas;
- [x] Python confirmado como linguagem de implementação;
- [x] métricas simuladas explicitamente proibidas.

**Decisão:** M13 está `ESPECIFICADO` e pode entrar em regeneração no marco R2. O HTML atual permanece `REFAZER / BLOQUEADO PARA ESTUDO` até aprovação dos gates G1–G6.

