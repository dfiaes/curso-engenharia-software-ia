# Rastreabilidade da implementação M12

**Atualizado em:** 14/08/2026 · **Estado:** EM PRODUÇÃO

Esta matriz liga o catálogo da [especificação](../../docs/especificacoes/M12-ESPECIFICACAO.md) aos artefatos atualmente executáveis. `VERIFICADO` significa que a propriedade indicada passou no ambiente atual; `PARCIAL` significa que existe implementação/teste determinístico, mas falta parte da boundary; `PENDENTE` significa que a evidência obrigatória ainda não foi produzida.

## Gates técnicos já executados

| Verificação | Resultado | Evidência atual |
|---|---|---|
| Python | 3.14.7 | ambiente criado por `uv` |
| Ruff | VERIFICADO | `All checks passed!` |
| mypy strict | VERIFICADO | 12 arquivos sem erro |
| pytest determinístico | VERIFICADO | 41 passed |
| PostgreSQL 18 | PENDENTE | 1 skipped; Docker indisponível |

## Decisão atual dos gates

| Gate | Estado | Fundamentação | Para fechar |
|---|---|---|---|
| G0 · contrato | APROVADO | especificação, competências, fontes e aceitação definidos | — |
| G1 · cobertura/profundidade | APROVADO | 9 blocos, ≥13 mil palavras, práticas, riscos residuais e checkpoint | — |
| G2 · execução | PARCIAL / BLOQUEANTE | Python 3.14, Ruff, mypy e 41 testes verdes | executar PostgreSQL 18; skip não aprova o gate |
| G3 · segurança | PARCIAL / BLOQUEANTE | suíte adversarial determinística cobre runtime, schemas, approval, tenancy fake e idempotência | testar roles/RLS, symlink/DNS e Capstone E2E nas boundaries reais |
| G4 · neutralidade | APROVADO | domínio usa contratos/fakes; Stripe permanece restrito ao adapter/fontes A* | manter contract tests ao criar adapter real |
| G5 · operação/finanças | PARCIAL / BLOQUEANTE | ledger, reconciliação, entitlement, budget e burn rate possuem testes | executar game day, alertas reais e relatório de margem do Capstone |
| G6 · editorial/evidência | PARCIAL | estrutura HTML, âncoras e links locais passam; fontes foram reabertas | revisão visual bloqueada pelo controlador do navegador; produzir pacote `evidence/m12` |

## Testes de aceitação

| ID | Estado | Implementação/teste atual | Lacuna para aprovação |
|---|---|---|---|
| M12-AT-001 | VERIFICADO (fake) | `SafeAgentRuntime` mantém authority fora do conteúdo e nega tool injetada | integrar ao runtime completo do Capstone |
| M12-AT-002 | PARCIAL | `ToolConstraints`; testes de SSRF e traversal | adicionar symlink escape e defesa de DNS/egress na boundary real |
| M12-AT-003 | PARCIAL | `ContentPolicy` e `SafeSpanExporter` removem conteúdo e redigem PII | inspecionar exporter real do Capstone e payload codificado |
| M12-AT-004 | VERIFICADO (fake) | registry de schemas rejeita enum inválido, campo ausente e argumento extra | integrar ao executor do Capstone |
| M12-AT-005 | VERIFICADO (fake) | replay, tamper, expiry e actor mismatch em `test_authorization.py` | persistência/consumo atômico no Capstone |
| M12-AT-006 | VERIFICADO (fake) | `LocalPolicy` nega tenant/scope divergentes e emite audit event sem conteúdo | integrar identidade e audit store do Capstone |
| M12-AT-010 | PENDENTE | SQL RLS e teste Testcontainers escritos | executar em PostgreSQL 18 real |
| M12-AT-011 | PENDENTE | `WITH CHECK` e teste cross-tenant escritos | executar em PostgreSQL 18 real |
| M12-AT-012 | PARCIAL | roles `NOBYPASSRLS` e `FORCE ROW LEVEL SECURITY` na migration | asserir catálogos `pg_roles`/`pg_class` em PostgreSQL real |
| M12-AT-013 | PENDENTE | estratégia documentada no HTML | implementar pool size 1, reuse A→B e rollback |
| M12-AT-014 | VERIFICADO (fake) | cache/vector/graph/object/queue usam `TenantContext` e casos de colisão | repetir contra cada provider real do Capstone |
| M12-AT-020 | VERIFICADO (fake) | replay da mesma chave/intenção | repetir com repositório durável |
| M12-AT-021 | VERIFICADO (fake) | conflito para intent hash diferente | repetir com unique constraint PostgreSQL |
| M12-AT-022 | VERIFICADO (fake) | duas coroutines e contador externo igual a um | repetir entre conexões/processos distintos |
| M12-AT-023 | VERIFICADO (fake) | crash vira `UNKNOWN`; lookup confirma receipt ou ausência antes do retry | persistir ledger e executar matriz de crashes real |
| M12-AT-030 | VERIFICADO (genérico) | HMAC constante, assinatura e replay window | contrato específico somente no adapter test-mode escolhido |
| M12-AT-031 | VERIFICADO (fake) | ledger deduplica; `EntitlementProjection` ignora duplicata e versão antiga | persistir projection e testar concorrência no banco |
| M12-AT-032 | VERIFICADO (fake) | `reconcile_usage` abre issue para diferença e fecha quando totais convergem | persistir job/issue e executar contra adapter test-mode |
| M12-AT-040 | PARCIAL | sliding window por tenant com relógio controlado | limites distribuídos de request/token/concorrência |
| M12-AT-041 | PARCIAL | reserve/commit/release e teto de custo | integrar cancelamento, uso do adapter e fechamento/reconciliação |
| M12-AT-050 | PARCIAL | cálculo e regra multiwindow testados com dados sintéticos | ligar a métricas reais, alerta e runbook |
| M12-AT-051 | VERIFICADO (fake) | copiloto read-only redige PII e não executa ação | integrar ao fluxo de incidente do Capstone |
| M12-AT-052 | PENDENTE | roteiro completo documentado | executar game day e produzir timeline/postmortem |
| M12-AT-060 | VERIFICADO (fake) | exclusão remove cinco stores ativos, preserva B e registra expiração de backup | executar contra stores reais e controlar restore/tombstone |

## Cobertura editorial

| Critério | Medição | Estado |
|---|---:|---|
| palavras visíveis | ≥ 13.000 | ATENDE |
| blocos curriculares | 9 | ATENDE |
| resultados observáveis | 27 | ATENDE (mínimo 25) |
| blocos de código/SQL/config | 28 | ATENDE (mínimo 20) |
| falhas na tabela de diagnóstico | 15 | ATENDE |
| perguntas do checkpoint | 14 | ATENDE |

## Próxima sequência de fechamento

1. Disponibilizar Docker e executar o teste PostgreSQL 18 já escrito.
2. Completar M12-AT-010..014 com catálogos, pool reuse e data planes.
3. Implementar reconciliação de billing/idempotência, limites distribuídos e alert rule.
4. Integrar controles ao Capstone e executar a suíte adversarial de ponta a ponta.
5. Produzir `capstone/evidence/m12/`, revisar links/HTML e decidir G1–G6.

O módulo permanece bloqueado para promoção enquanto qualquer P0/P1 ou gate obrigatório estiver pendente.
