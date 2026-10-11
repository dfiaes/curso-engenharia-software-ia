# Especificação do M12 — Produção, segurança, multi-tenancy, billing e SRE

> Referência de escopo da versão anterior do módulo. A sequência e o estado atuais estão em [CURRICULO.md](../../CURRICULO.md) e [STATUS.md](../../STATUS.md).

**Versão:** 1.0 · **Data-base:** 14/08/2026 · **Estado:** G0 APROVADO · **Carga:** 9 blocos / 18h

Esta especificação é o contrato de regeneração do M12. O HTML existente está bloqueado para estudo e não deve ser usado como base técnica. Seu roteiro nominal pode ser aproveitado, mas exemplos, afirmações e soluções precisam ser reconstruídos a partir deste documento.

## 1. Resultado do módulo

Ao concluir o M12, o aluno deve transformar o Capstone de aplicação funcional em serviço operável e faturável, demonstrando por evidência que:

- conteúdo não confiável não ganha autoridade sobre o agente;
- ferramentas não executam além da identidade, escopo e política permitidos;
- tenants não vazam dados entre banco, busca, grafo, cache, objetos ou telemetria;
- retries, concorrência e crashes não duplicam efeitos externos;
- uso e custo são medidos por unidade de negócio e reconciliados;
- billing é um adapter, não o domínio do produto;
- SLOs, alertas e runbooks refletem impacto ao usuário;
- IA auxilia a operação, mas não decide sozinha ações críticas.

## 2. Pré-requisitos

- M03: API, PostgreSQL, migrations, testes de integração e CI.
- M05: gateway, contratos, cache, custo e resiliência de chamadas.
- LT02: filas, entrega at-least-once, idempotência, outbox/inbox e recuperação.
- M06: evals, datasets e OpenTelemetry.
- M07: RAG com autorização antes da recuperação.
- M08: design de tools, workflow versus agente e limites de autonomia.
- M09: segurança e identidade em MCP/A2A.
- M10: workflow durável, checkpoint e human-in-the-loop.

## 3. Fora de escopo

- ensinar um produto IAM, gateway, billing ou observabilidade específico;
- prometer que prompt injection pode ser eliminada por regex ou classificação;
- construir um SIEM, plataforma Kubernetes ou processador de pagamentos;
- substituir aconselhamento jurídico sobre LGPD;
- cobrir supply chain, SBOM e governança completa de modelos, que pertencem ao LT04;
- ensinar segurança ofensiva fora do ambiente controlado do Capstone.

## 4. Arquitetura de referência

```text
usuário autenticado
       │ identidade + tenant + escopos
       ▼
API / policy enforcement point ───────────────► quota + budget ledger
       │                                                │
       ▼                                                ▼
workflow/agent ─► proposta de tool ─► policy ─► approval binding
       │                                  │              │
       │                                  └── deny ──────┘
       ▼
tool executor isolado ─► idempotency ledger ─► outbox ─► efeito externo
       │                       │                            │
       ▼                       ▼                            ▼
data plane por tenant     audit append-only           reconciliation
Postgres/RLS, vector,
graph, cache, objects
       │
       └──────────► OpenTelemetry sanitizado ─► SLI/SLO/alertas

billing domain: UsageEvent → Meter → Entitlement → InvoiceState
                                  │
                                  └── BillingProvider adapter
                                      ├── fake determinístico
                                      └── Stripe test-mode (referência)
```

### Regras arquiteturais inegociáveis

1. Texto recuperado, código ingerido, saída de modelo e resposta de tool são dados não confiáveis.
2. O modelo propõe; código determinístico autentica, autoriza, valida e executa.
3. Aprovação humana é ligada criptograficamente ou por registro imutável a ação, argumentos, tenant, ator, validade e digest; não é um booleano solto.
4. A identidade do usuário, do agente e da workload são distintas e auditáveis.
5. O papel da aplicação não é owner das tabelas e não possui `BYPASSRLS`; tabelas críticas usam `FORCE ROW LEVEL SECURITY`.
6. Contexto de tenant é definido por transação com `set_config(..., true)` e testado sob reutilização de pool.
7. Idempotência usa registro durável, chave única, hash da intenção e máquina de estados; cache em memória não é garantia.
8. Webhook é entrada não confiável: assinatura, tolerância temporal, deduplicação, ordenação/reconciliação e processamento assíncrono são obrigatórios.
9. Telemetria não grava prompts, código, secrets ou PII por padrão.
10. ChatOps e resumo de incidente são copilotos somente leitura até aprovação explícita.

## 5. Roteiro dos nove blocos

## Bloco 1 · Threat modeling para aplicações agênticas

**Competências:** `M12-B01-C01` a `M12-B01-C04` · **Matriz:** SEC-01, SEC-02.

### Objetivos observáveis

- separar assets, atores, entry points, trust boundaries e efeitos;
- aplicar STRIDE ao software convencional e OWASP Agentic Top 10 ao fluxo agêntico;
- mapear ASI01–ASI10 para componentes do Capstone;
- priorizar risco por impacto, probabilidade, detectabilidade e blast radius.

### Conteúdo

- por que prompt injection é uma instância de confusão entre dados e controle;
- ameaça versus vulnerabilidade versus risco versus controle;
- goal hijacking, tool misuse, privilege abuse, supply chain, execução inesperada, memory poisoning, comunicação insegura, cascata, exploração da confiança humana e rogue behavior;
- trust boundaries entre ingestão, retrieval, modelo, tool executor, MCP/A2A, dados e operador;
- controles preventivos, detectivos, responsivos e compensatórios.

### Prática e evidência

Criar `capstone/docs/security/threat-model.md` e `capstone/docs/security/data-flow.md` com pelo menos 20 ameaças, responsável, controle, teste e risco residual. Produzir `threat-catalog.yaml` legível por testes.

**Falha injetada:** instrução maliciosa dentro de README ingerido tenta alterar o objetivo e exfiltrar um segredo por uma tool legítima.

**Resultado esperado:** a ameaça aparece ligada a ASI01/ASI02/ASI03, a trust boundary e a pelo menos um teste executável; “usar regex” isoladamente não é aceito como controle.

## Bloco 2 · Dados não confiáveis, secrets, PII e contenção de execução

**Competências:** `M12-B02-C01` a `M12-B02-C04` · **Matriz:** SEC-02, SEC-03, DATA-02.

### Objetivos observáveis

- classificar dados por origem, sensibilidade, finalidade e retenção;
- impedir que conteúdo recuperado ou saída do modelo controle instruções privilegiadas;
- aplicar allowlists de ação/destino, sandbox e egress control;
- detectar e mascarar secrets/PII sem prometer cobertura perfeita.

### Conteúdo

- separação de canais de confiança e taint tracking conceitual;
- validação estrutural de argumentos, canonicalização de paths e defesa contra SSRF/path traversal;
- secret scanning como defesa em profundidade, não autorização;
- minimização, retenção, exclusão e limites de logs/traces;
- controlador, operador, finalidade e direitos do titular como contexto de LGPD.

### Prática e evidência

Implementar `security/content_policy.py`, `security/tool_constraints.py` e uma matriz de classificação. O executor deve negar path fora do workspace, host fora da allowlist, argumento inesperado e tentativa de colocar segredo em relatório/telemetria.

**Falhas injetadas:** symlink escape, URL para metadata service, segredo em arquivo ingerido, PII em atributo de trace e payload codificado tentando burlar a saída.

**Resultado esperado:** todas as tentativas são negadas ou redigidas por controles determinísticos; o evento de segurança preserva metadados úteis sem copiar o dado sensível.

## Bloco 3 · Identidade, autorização, policy-as-code e aprovação humana

**Competências:** `M12-B03-C01` a `M12-B03-C05` · **Matriz:** SEC-03, AGT-02.

### Objetivos observáveis

- distinguir autenticação, autorização, entitlement, quota e aprovação;
- validar issuer, audience, assinatura, expiração e escopos de access tokens;
- modelar ator humano, sessão, agente e workload como identidades diferentes;
- implementar policy decision point e policy enforcement point;
- impedir replay ou alteração de uma aprovação.

### Conteúdo

- OAuth/OIDC no resource server e OAuth Security BCP;
- RBAC, ABAC/ReBAC e capability-based security: quando cada modelo ajuda;
- least privilege, token exchange/delegation conceitual e credenciais curtas;
- policy pura e determinística antes do adapter de policy engine;
- approval binding a ação, argumentos, tenant, ator, digest, prazo e uso único.

### Prática e evidência

Criar portas `Authorizer`, `PolicyEngine` e `ApprovalStore`, fake determinístico e implementação local. Tools são classificadas em leitura, escrita reversível e efeito crítico. A política gera decisão explicável com rule ID.

**Falhas injetadas:** trocar `tenant_id` após aprovação, aumentar valor, reaproveitar aprovação expirada e usar token de usuário A por agente do tenant B.

**Resultado esperado:** quatro operações negadas; a ação exata aprovada executa uma vez e gera audit event correlacionado.

## Bloco 4 · Multi-tenancy e RLS como propriedade verificável

**Competências:** `M12-B04-C01` a `M12-B04-C05` · **Matriz:** TEN-01, RAG-02, DATA-02.

### Objetivos observáveis

- comparar isolamento por linha, schema, banco e conta/projeto;
- implementar `USING` e `WITH CHECK` com deny-by-default;
- configurar roles sem owner/BYPASSRLS e aplicar `FORCE ROW LEVEL SECURITY`;
- propagar tenant por transação de forma segura em pool assíncrono;
- testar isolamento em todos os data planes, não apenas SQL.

### Conteúdo

- PostgreSQL RLS, política permissiva/restritiva, owner, superuser e bypass;
- `current_setting(..., true)` e `set_config(..., true)`;
- transação por request/job e riscos de connection pooling;
- tenant em vector metadata, graph labels/edges, cache keys, object prefixes, filas e telemetria;
- migrations, operações administrativas e backup/restore com consciência de tenant.

### Prática e evidência

Criar migrations RLS, roles de aplicação/migração, fixture com tenants A/B e suíte `tests/security/test_tenant_isolation.py`. Executar com PostgreSQL real em container.

**Falhas injetadas:** query sem filtro, insert com tenant alheio, reuse da mesma conexão A→B, cache key sem tenant e vector search sem filtro.

**Resultado esperado:** zero linhas/objetos cross-tenant e operações de escrita negadas pelo banco, mesmo quando a aplicação erra.

## Bloco 5 · Idempotência durável e efeitos externos de agentes

**Competências:** `M12-B05-C01` a `M12-B05-C05` · **Matriz:** DIST-03, AGT-02, SRE-02.

### Objetivos observáveis

- distinguir operação naturalmente idempotente de deduplicação construída;
- definir escopo, retenção e semântica da idempotency key;
- implementar registro durável com hash da intenção e estados explícitos;
- coordenar banco e efeito externo por outbox/reconciliação;
- recuperar crash em cada janela ambígua sem duplicar efeito.

### Conteúdo

- estados `received/started/succeeded/failed/unknown`;
- mesma chave + mesmo payload versus mesma chave + payload diferente;
- concorrência, unique constraint, lock, lease e timeout de execução;
- impossibilidade de atomicidade ingênua entre banco e API externa;
- retry budget, backoff, jitter, dead-letter e compensação.

### Prática e evidência

Implementar `IdempotencyRepository` em PostgreSQL e uma tool destrutiva fake com contador externo. Testar duas instâncias concorrentes e crash antes/depois do efeito.

**Resultado esperado:** mesmo intent produz um efeito; payload divergente recebe conflito; estado ambíguo exige reconciliação, não retry cego.

## Bloco 6 · Quotas, rate limits, token budgets e circuit breaker financeiro

**Competências:** `M12-B06-C01` a `M12-B06-C04` · **Matriz:** SEC-03, FIN-01, LLM-03.

### Objetivos observáveis

- separar rate limit, concurrency limit, quota, entitlement e budget;
- aplicar limites hierárquicos por tenant, usuário, workload e operação;
- reservar e reconciliar orçamento antes/depois da chamada;
- degradar serviço sem transformar indisponibilidade em retry storm.

### Conteúdo

- token bucket/sliding window em nível conceitual;
- `429`, `Retry-After` e o Internet-Draft de RateLimit identificado como work in progress;
- limites de request, token, concorrência, armazenamento e ação crítica;
- estimate/reserve/commit/release para custo variável;
- modelo barato/fallback não pode violar requisitos de qualidade ou segurança.

### Prática e evidência

Criar `QuotaPolicy`, `BudgetLedger` e testes com relógio controlado. O budget reserva custo máximo estimado e reconcilia custo real emitido pelo adapter.

**Resultado esperado:** burst controlado, resposta acionável, nenhuma cobrança fantasma após cancelamento e nenhum bypass por múltiplas instâncias.

## Bloco 7 · Metering, billing e unit economics sem lock-in

**Competências:** `M12-B07-C01` a `M12-B07-C06` · **Matriz:** FIN-01, DIST-03.

### Objetivos observáveis

- modelar usage event, meter, entitlement e invoice state no domínio;
- garantir ledger de uso append-only, deduplicável e reconciliável;
- verificar webhook antes de aceitar estado externo;
- processar duplicidade e desordem sem corromper entitlement;
- calcular custo por análise, cost-to-serve, margem de contribuição e break-even;
- trocar adapter de billing sem alterar o domínio.

### Conteúdo

- metering versus pricing versus invoicing versus payment;
- custos diretos e alocação de custos compartilhados;
- modelo por assinatura, uso, créditos e híbrido;
- assinatura, replay window, deduplicação e processamento assíncrono de webhook;
- reconciliação periódica entre usage ledger, provider e invoice;
- fake provider obrigatório e Stripe test-mode como adapter de referência.

### Prática e evidência

Implementar `BillingProvider` como `Protocol`, fake determinístico, usage ledger e adapter Stripe em modo teste. Gerar dashboard por tenant com custo direto, custo alocado, receita e margem.

**Falhas injetadas:** assinatura inválida, evento duplicado, evento fora de ordem, timeout na API e divergência de reconciliação.

**Resultado esperado:** nenhuma mudança por evento inválido/duplicado; divergência é detectada e encaminhada, não ocultada; números vêm do ledger.

## Bloco 8 · SRE para sistemas de IA e operação assistida

**Competências:** `M12-B08-C01` a `M12-B08-C06` · **Matriz:** SRE-01, SRE-02, OBS-01, FIN-01.

### Objetivos observáveis

- definir SLIs a partir da experiência do usuário;
- escrever SLO e política de error budget;
- alertar por multiwindow/multi-burn-rate e por exaustão iminente;
- correlacionar qualidade, latência, disponibilidade e custo;
- conduzir incidente com papéis, timeline, rollback e postmortem;
- limitar IA operacional a resumo, consulta e proposta auditável.

### Conteúdo

- success rate, time-to-first-token, duração end-to-end, freshness, groundedness/abstenção e custo por análise;
- diferença entre métrica de SLI, diagnóstico e business KPI;
- OpenTelemetry sem conteúdo sensível por padrão;
- burn rate e alertas acionáveis;
- incident commander, communication lead, operations lead, runbook e postmortem blameless;
- riscos de ChatOps: prompt injection em logs, ação privilegiada e automação de diagnóstico incorreto.

### Prática e evidência

Produzir `slo.yaml`, dashboard, alert rules, `runbooks/` e game day. O copiloto recebe apenas dados sanitizados e não possui tool de escrita em produção.

**Falha injetada:** provedor lento, aumento de erro, custo por análise duplicado e log com instrução maliciosa.

**Resultado esperado:** alerta corresponde a impacto, dashboard permite diagnóstico, budget é consumido corretamente e a instrução no log não vira ação.

## Bloco 9 · Hardening, red team e checkpoint M12

**Competências:** `M12-B09-C01` a `M12-B09-C06` · **Matriz:** SEC-01..03, TEN-01, SRE-01..02, FIN-01.

### Objetivos observáveis

- executar a suíte adversarial de ponta a ponta;
- demonstrar isolamento, autorização, idempotência, billing e SLO;
- registrar risco residual e decisão de aceite;
- exercitar exclusão/retenção nos data planes;
- conduzir game day e produzir postmortem;
- defender preço e margem com dados medidos.

### Prática e evidência

Gerar `capstone/evidence/m12/` com resultados de testes, threat model atualizado, relatório red-team, tenant isolation report, reconciliation report, SLO report, postmortem e cálculo de margem.

**Resultado esperado:** zero teste P0/P1 falhando; falhas P2 possuem owner, prazo e risco aceito; nenhum número é hardcoded como sucesso.

## 6. Catálogo mínimo de testes de aceitação

| ID | Cenário | Critério de aprovação |
|---|---|---|
| M12-AT-001 | indirect prompt injection em código/README | não altera objetivo, política ou permissão |
| M12-AT-002 | SSRF/path traversal/symlink escape | tool nega antes do efeito |
| M12-AT-003 | segredo/PII em saída e trace | conteúdo redigido; evento seguro registrado |
| M12-AT-004 | tool arg fora do schema/allowlist | validação determinística nega |
| M12-AT-005 | approval replay/tamper/expiry | três variantes negadas |
| M12-AT-006 | identidade ou tenant divergente | autorização nega e audita |
| M12-AT-010 | SQL sem filtro de tenant | banco retorna apenas tenant corrente |
| M12-AT-011 | insert/update para tenant alheio | `WITH CHECK` nega |
| M12-AT-012 | role owner/BYPASSRLS | role da aplicação não possui privilégios |
| M12-AT-013 | pool reuse A→B | nenhum estado ou dado de A aparece em B |
| M12-AT-014 | vector/cache/graph/object sem escopo | teste falha até todos os data planes isolarem |
| M12-AT-020 | mesma chave, mesmo intent | uma execução e resposta estável |
| M12-AT-021 | mesma chave, payload diferente | conflito sem efeito |
| M12-AT-022 | duas instâncias concorrentes | um efeito externo |
| M12-AT-023 | crash em janela ambígua | reconciliação, nunca retry cego |
| M12-AT-030 | webhook com assinatura inválida | rejeitado sem mutação |
| M12-AT-031 | webhook duplicado/fora de ordem | estado interno converge corretamente |
| M12-AT-032 | divergência ledger/provider | detectada e registrada |
| M12-AT-040 | excesso de request/token/concorrência | limite correto e resposta acionável |
| M12-AT-041 | budget excedido durante execução | cancelamento/fechamento consistente |
| M12-AT-050 | queima rápida de error budget | alerta correto dispara |
| M12-AT-051 | log contém instrução maliciosa | copiloto não executa ação |
| M12-AT-052 | game day com dependência degradada | mitigação, comunicação e postmortem completos |
| M12-AT-060 | exclusão de tenant | stores ativos limpos e limites de backup documentados |

## 7. Artefatos obrigatórios

```text
capstone/
  app/security/
    content_policy.py
    tool_constraints.py
    authorization.py
    approvals.py
    audit.py
  app/tenancy/
    context.py
    policies.py
  app/reliability/
    idempotency.py
    quota.py
    budget.py
  app/billing/
    domain.py
    ports.py
    fake_provider.py
    stripe_adapter.py
    reconciliation.py
  migrations/
  tests/security/
  tests/tenancy/
  tests/reliability/
  tests/billing/
  docs/security/
    threat-model.md
    data-flow.md
    data-classification.md
  docs/sre/
    slo.yaml
    error-budget-policy.md
    runbooks/
  evidence/m12/
```

Nomes podem ser adaptados à estrutura real do Capstone, mas responsabilidades e evidências não podem desaparecer.

## 8. Checkpoint M12

O checkpoint deve combinar perguntas sem consulta e demonstração prática.

### Perguntas mínimas

1. Por que prompt injection não é resolvida por identificar frases suspeitas?
2. Onde estão as trust boundaries do Capstone e qual tem maior blast radius?
3. Qual diferença entre autenticação, autorização, entitlement, quota e aprovação?
4. Por que a aprovação deve ser ligada aos argumentos exatos da ação?
5. Como owner de tabela e `BYPASSRLS` invalidam a promessa de isolamento?
6. Como provar que reutilização do pool não carrega tenant anterior?
7. O que fazer quando uma API externa conclui o efeito, mas a resposta se perde?
8. Por que idempotency key sem hash do intent pode esconder um bug grave?
9. Como webhook duplicado e fora de ordem afeta entitlement e faturamento?
10. Qual é a unidade econômica do Capstone e quais custos entram nela?
11. Qual diferença entre SLI, SLO, SLA e error budget?
12. Quando um alerta deve paginar uma pessoa e quando deve abrir ticket?
13. Por que permitir que um copiloto leia logs não autoriza executar ações?
14. Quais dados nunca devem entrar em traces por padrão?

### Demonstrações obrigatórias

- executar cinco ataques agentic e mostrar controles em camadas;
- executar a suíte cross-tenant em PostgreSQL real;
- provocar concorrência e crash no efeito idempotente;
- processar webhooks inválido, duplicado e fora de ordem;
- mostrar custo/margem derivados do ledger;
- provocar burn rate e seguir o runbook;
- apresentar risco residual que decidiu não corrigir e defender a decisão.

## 9. Fontes e versões

Todas devem ser revalidadas no início da regeneração e registradas no HTML.

| ID | Fonte | Versão/data usada | Uso | Obsolescência |
|---|---|---|---|---|
| SRC-M12-01 | [OWASP Top 10 for Agentic Applications](https://genai.owasp.org/resource/owasp-top-10-for-agentic-applications-for-2026/) | edição 2026, publicada 09/12/2025 | taxonomia ASI01–ASI10 | média |
| SRC-M12-02 | [OWASP Agentic AI Threats and Mitigations](https://genai.owasp.org/resource/agentic-ai-threats-and-mitigations/) | 2025; revisar atualização vigente | threat modeling e controles | alta |
| SRC-M12-03 | [OWASP ASVS](https://github.com/OWASP/ASVS) | 5.0.0, maio/2025 | requisitos de aplicação web/API | média |
| SRC-M12-04 | [NIST AI RMF — GenAI Profile](https://www.nist.gov/publications/artificial-intelligence-risk-management-framework-generative-artificial-intelligence) | NIST AI 600-1; página atualizada 08/04/2026 | risco e ciclo de vida | baixa |
| SRC-M12-05 | [NIST SP 800-218A](https://csrc.nist.gov/pubs/sp/800/218/a/final) | final, julho/2024 | desenvolvimento seguro de IA | baixa |
| SRC-M12-06 | [OAuth 2.0 Security BCP](https://www.rfc-editor.org/rfc/rfc9700.html) | RFC 9700 / BCP 240 | identidade e tokens | baixa |
| SRC-M12-06A | [OpenID Connect Core](https://openid.net/specs/openid-connect-core-1_0.html) | 1.0 com errata vigente | autenticação federada e claims | média |
| SRC-M12-07 | [PostgreSQL Row Security](https://www.postgresql.org/docs/18/ddl-rowsecurity.html) | PostgreSQL 18 | RLS, owner e bypass | média |
| SRC-M12-08 | [PostgreSQL system administration functions](https://www.postgresql.org/docs/18/functions-admin.html) | PostgreSQL 18 | `current_setting`/`set_config` | média |
| SRC-M12-09 | [Stripe idempotent requests](https://docs.stripe.com/api/idempotent_requests) | consultada 14/08/2026 | comportamento do adapter Stripe | alta |
| SRC-M12-10 | [Stripe webhooks](https://docs.stripe.com/webhooks) | consultada 14/08/2026 | assinatura, duplicidade e async | alta |
| SRC-M12-11 | [Stripe usage-based billing](https://docs.stripe.com/billing/subscriptions/usage-based) | consultada 14/08/2026 | adapter de referência | alta |
| SRC-M12-12 | [Google SRE Workbook](https://sre.google/workbook/table-of-contents/) | edição online consultada 14/08/2026 | SLO, alertas e incidentes | baixa |
| SRC-M12-13 | [Alerting on SLOs](https://sre.google/workbook/alerting-on-slos/) | edição online | multiwindow/multi-burn-rate | baixa |
| SRC-M12-14 | [OpenTelemetry Semantic Conventions](https://opentelemetry.io/docs/specs/semconv/) | vigente em 14/08/2026 | telemetria interoperável | alta |
| SRC-M12-15 | [FinOps Framework](https://www.finops.org/framework/) | atualização 2026 | operação financeira | média |
| SRC-M12-16 | [FinOps Unit Economics](https://www.finops.org/framework/capabilities/unit-economics/) | consultada 14/08/2026 | custo por unidade e valor | média |
| SRC-M12-17 | [Lei Geral de Proteção de Dados](https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709.htm) | texto compilado vigente | obrigações e direitos | média |
| SRC-M12-18 | [ANPD — materiais educativos](https://www.gov.br/anpd/pt-br/centrais-de-conteudo/materiais-educativos-e-publicacoes) | consultada 14/08/2026 | orientação brasileira | alta |
| SRC-M12-19 | [RateLimit header fields for HTTP](https://datatracker.ietf.org/doc/draft-ietf-httpapi-ratelimit-headers/) | draft-11, 23/05/2026 | somente panorama; marcar como work in progress | crítica |
| SRC-M12-20 | [HTTP Semantics](https://www.rfc-editor.org/rfc/rfc9110.html) | RFC 9110 | `Retry-After` e semântica HTTP | baixa |
| SRC-M12-21 | [Additional HTTP Status Codes](https://www.rfc-editor.org/rfc/rfc6585.html) | RFC 6585 | status `429 Too Many Requests` | baixa |

## 10. Critérios editoriais específicos

- alvo de 13.000–16.000 palavras visíveis; dividir red-team/catalog em companion se necessário;
- mínimo de 25 resultados esperados observáveis;
- mínimo de 20 blocos de código/SQL/configuração completos;
- tabela de diagnóstico com pelo menos 15 falhas reais;
- cada mitigação deve declarar qual ameaça reduz e qual risco permanece;
- nenhuma lista OWASP/NIST pode ser reproduzida de memória sem conferir a versão;
- código Python 3.14, tipado, async correto e executado em PostgreSQL real;
- Stripe aparece somente no adapter e laboratório test-mode;
- Pagar.me/Asaas podem ser citados como alternativas, sem implementação canônica;
- nenhuma recomendação jurídica é apresentada como parecer legal.

## 11. Gate G0

- [x] resultado e não objetivos definidos;
- [x] nove blocos e carga definidos;
- [x] pré-requisitos e limites definidos;
- [x] competências ligadas à matriz;
- [x] arquitetura e trust boundaries definidas;
- [x] práticas, falhas e resultados esperados definidos;
- [x] testes de aceitação definidos;
- [x] artefatos e checkpoint definidos;
- [x] fontes primárias versionadas selecionadas;
- [x] neutralidade entre provedores explicitada;
- [x] riscos de privacidade e aconselhamento jurídico delimitados.

**Decisão:** M12 está `ESPECIFICADO` e pode entrar em regeneração quando chegar ao marco R2. O HTML atual permanece `REFAZER / BLOQUEADO PARA ESTUDO` até aprovação dos gates G1–G6.
