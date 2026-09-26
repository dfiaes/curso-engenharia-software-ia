# Lab LT02-B01 — Falha parcial, tempo, ordem e consistência

Folha B01-L da trilha LT02 (Bloco 1). Implementa verbatim os três contratos
da seção B01 de `../LT02.html`, sem rede e sem Docker — só stdlib
(`dataclasses`, `random` só no harness dos testes).

## Arquivos (nomes congelados)

| Arquivo | Oráculo | Papel |
|---|---|---|
| `barramento_fake.py` | LT02-AT-001/003: partição ligada e desligada por chamada; cada lado registra só o recebido | barramento fake determinístico, caixas por destinatário |
| `escrita_sob_particao.py` | LT02-AT-001: recusa publica erro; reconciliação converge | duas políticas explícitas: recusar ou aceitar-e-reconciliar |
| `leituras_consistencia.py` | LT02-AT-001/002: fronteira por leitor; timeout vira desconhecido | read-your-writes, monotonic reads, prazo ambíguo |
| `tests/test_at001_particao.py` | LT02-AT-001 | partição, recusa, reconciliação, perda/duplicação programadas |
| `tests/test_at002_timeout.py` | LT02-AT-002 | timeout jamais auto-classificado; reconciliação por identidade |
| `tests/test_at003_cap_pacelc.py` | LT02-AT-003 | CAP sob partição, PACELC fora dela; live BLOCKED |

## Tabela requisito → falha → decisão → garantia → custo

| Requisito | Falha temida | Decisão | Garantia (com fronteira) | Custo |
|---|---|---|---|---|
| Reserva de orçamento não vende o mesmo saldo duas vezes | partição entre réplicas | recusar no lado isolado | ordem única; erro explícito — válida durante a partição | indisponibilidade visível do lado isolado |
| Autor vê o que acabou de publicar | leitura em réplica atrasada | sessão com read-your-writes | visibilidade própria imediata, sem ordem global — por sessão | roteamento por sessão |
| Leitor nunca vê o passado desandar | leituras em réplicas de idades distintas | sessão com monotonic reads | não-retrocesso por cliente — por sessão | versão viaja com a sessão |
| Contador tolera divergência temporária | partição com incrementos dos dois lados | aceitar e reconciliar na reconexão | convergência eventual, sem prazo declarado | surpresa transitória no intervalo |
| Leitura global rápida fora de partição | latência de ida ao decisor | servir da réplica próxima (idade máxima 2 versões) | idade máxima declarada — fora de partição | staleness limitada e monitorada |

## Regras de execução

- Determinismo por semente: agenda AT-001 com `SEED = 20260814`, `N = 6`
  mensagens; perda/duplicação/atraso/reordenação programados pelo harness
  via API pública do fake. O módulo verbatim não tem relógio nem
  aleatoriedade: `occurred_at`/`deadline_at` são inteiros da agenda.
- Timeout é flag explícita (`no_prazo`), nunca medição de parede; estado
  desconhecido pede reconciliação por `intent_hash` antes de repetir.
- `reconciliar()` republica por `mensagem.tenant_id`: nos cenários,
  `tenant_id == destino`.
- Números são exemplo variável com semente/amostra declaradas; o ledger
  externo (`dict`/`set` por `intent_hash` nos testes) é o oráculo de
  efeito lógico.
- Demo externa RabbitMQ (acks, confirms, redelivery, DLQ) é trilha fora do
  caminho obrigatório: sem rede/Docker, o oráculo live nasce BLOCKED com
  registro (`pytest.skip`), nunca com simulação.

## Comandos

```sh
uv sync
uv run ruff check .
uv run ruff format --check .
uv run mypy
uv run pytest
```

Evidência dos gates: `evidence/b01-gates.txt`.
