# Threat model do Cartógrafo (M13 B12)

Escopo: pipeline local (ingestão → índice → resposta), banco SQLite por tenant,
webhooks de billing, logs/telemetria. Metodologia: STRIDE por componente.

## Plano de dados e ativos

Ativos: código-fonte dos repositórios do tenant, segredos (API keys, segredo de
webhook), PII em logs, índice de retrieval, ledger de uso.

## Análise STRIDE

| # | Categoria | Ameaça | Controle (código) | Teste |
|---|---|---|---|---|
| T1 | Spoofing | webhook forjado de billing | `security.verify_webhook` (HMAC + `compare_digest`) | `test_security.py::test_webhook_signature_valid_and_forged` |
| T2 | Tampering | path traversal em artefato ingerido | `security.safe_member_path` | `test_security.py::test_path_traversal_rejected` |
| T3 | Repudiation | uso sem rastro | ledger imutável com idempotency key (B13) | `test_billing.py::test_ledger_dedup_por_chave` |
| T4 | Information disclosure | vazamento cross-tenant | scoping obrigatório em `db.list_tenant_repositories` + `security.assert_tenant` | `test_security.py::test_isolamento_tenant_no_db` |
| T5 | Information disclosure | segredo/PII em log | `security.redact_secrets` na borda de saída | `test_security.py::test_redacao_remove_segredos` |
| T6 | Elevation of privilege | prompt injection vindo do corpus | controle de pipeline (chunks `poisoned` não indexados, `evals.build_index`) + detector `security.contains_injection` | `test_security.py::test_detector_injection`; `test_evals.py::test_injection_nao_vaza_marcador` |
| T7 | Denial of service | budget infinito de agente | budget de passos em `AgentRunner` (B9) | `test_agent.py::test_step_budget_stops_execution` |

## Risco residual (aceito e registrado)

- Detector de injection (T6) é heurístico lexical: frases fora da lista passam.
  Mitigação: a camada primária é o filtro de pipeline, não o detector.
- SQLite local não tem RLS; a defesa é o contrato de scoping + guard explícito.
  RLS no Postgres permanece BLOCKED ambiental.
- Sem scanner externo (SAST/DAST) no ambiente: BLOCKED ambiental, cobertura via
  testes de isolamento e controles acima. Nenhum P0/P1 aberto ao final do B12.
