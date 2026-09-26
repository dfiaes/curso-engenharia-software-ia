# Design de migrations e isolamento — do SQLite local ao Postgres/RLS

**Contexto:** o Tier 1 executa com SQLite stdlib (B5). PostgreSQL com RLS é o alvo de
produção da especificação e permanece BLOCKED ambiental neste lote (sem Docker/Postgres).
Este documento é o design que "compila" — as mesmas tabelas, constraints e invariantes já
estão escritas de modo a migrar sem redesenho.

## Invariantes que não dependem do banco

1. Toda linha de dados de cliente carrega `tenant_id` com FK para `tenant`.
2. Toda consulta de leitura passa pelo escopo de tenant (nesta camada: `WHERE tenant_id = ?`
   obrigatório na API pública — ver `list_tenant_repositories`).
3. `ON DELETE CASCADE` modela o lifecycle: apagar tenant remove tudo dele.
4. Migrations são pares versionados (up/down), aplicadas em transação por passo e
   registradas em `schema_migrations`; rollback é operação suportada, não exceção.
5. Jobs são idempotentes por `idempotency_key UNIQUE` — repetir a chave atualiza o
   mesmo registro (`ON CONFLICT DO UPDATE`), nunca cria duplicata.

## Tradução planejada para Postgres + RLS (quando desbloqueado)

```sql
-- Política por linha: o app sempre executa com `app.tenant_id` setado na sessão.
ALTER TABLE repository ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON repository
  USING (tenant_id = current_setting('app.tenant_id')::int)
  WITH CHECK (tenant_id = current_setting('app.tenant_id')::int);
```

O `WITH CHECK` barra INSERT/UPDATE que escape do tenant da sessão — defesa em
profundidade além do scoping na aplicação. Pool reuse com política exige
`SET LOCAL` por transação (nunca SET global por conexão), decisão já registrada
para o adapter PG e referenciada em `docs/release-contract.md` (R-03).

## O que este banco local prova hoje (e o que não prova)

- PROVA: integridade referencial, idempotência de job, forward/rollback íntegros,
  isolamento por scoping no data plane local.
- NÃO PROVA: enforcement de RLS pelo servidor, concorrência multi-conexão,
  performance sob pool. Registrado nos riscos R-03/R-04.
