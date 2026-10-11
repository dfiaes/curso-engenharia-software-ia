# Especificação do LT02 — Sistemas distribuídos, dados e mensageria

> Referência de escopo da versão anterior do módulo. A sequência e o estado atuais estão em [CURRICULO.md](../../CURRICULO.md) e [STATUS.md](../../STATUS.md).

**Versão:** 1.0 · **Data-base:** 14/08/2026 · **Estado:** G0 APROVADO · **Carga:** 6 blocos / 12h

LT02 acontece depois do M05. Seu propósito é tornar explícitas as garantias e os modos de falha que aparecem quando uma operação lenta, cara ou não determinística sai do processo HTTP e passa a ser executada por múltiplos workers.

## 1. Resultado do laboratório

Ao concluir LT02, o aluno consegue:

- raciocinar sobre falha parcial, tempo, ordem, consistência, CAP e PACELC sem slogans incorretos;
- escolher fila, log/stream ou chamada síncrona por requisito, não por moda;
- definir acknowledgement, redelivery, ordenação, concorrência e backpressure;
- implementar idempotência durável, deduplicação e transactional outbox/inbox;
- limitar retries por deadline, orçamento e jitter, tratando poison messages;
- coordenar sagas e compensações sem fingir transação distribuída;
- explicar isolamento, WAL, replicação, backup, PITR, retenção e restauração;
- provar o comportamento de jobs multiworker durante crashes e duplicatas.

## 2. Pré-requisitos e limites

**Pré-requisitos:** M03 e M05. LT01 fornece processos, rede, deadline e saturação. M12 reutilizará ledger, multi-tenancy e operação; M13 integrará as garantias no produto.

**Fora de escopo:** implementar consenso, broker ou banco distribuído; memorizar produtos; administrar clusters em produção; prometer exatamente-uma-vez global; tratar alta disponibilidade como substituta de backup.

### Regras conceituais inegociáveis

1. CAP descreve o que ocorre **durante uma partição**; não é “escolha dois” em operação normal.
2. PACELC acrescenta o trade-off entre latência e consistência quando não há partição.
3. `at-least-once` admite duplicatas; `at-most-once` admite perda. “Exactly once” só pode ser afirmado com fronteira, estado e falhas explicitamente delimitados.
4. Idempotência não é apenas guardar uma chave em memória: exige identidade da intenção, estado durável, concorrência e política de expiração.
5. Retry sem deadline, limite, backoff e jitter é amplificação de falha.
6. Compensação é uma nova ação de negócio; não desfaz o tempo nem garante rollback perfeito.
7. Replicação/HA reduzem indisponibilidade; backup e restore protegem contra exclusão, corrupção e erro humano.

## 3. Ambiente e arquitetura do laboratório

```text
client
  │ POST /jobs + Idempotency-Key
  ▼
FastAPI producer ── transação ──► PostgreSQL
                                  jobs + outbox
                                          │ relay
                                          ▼
                                  MessageBus port
                                  ├─ fake determinístico
                                  └─ RabbitMQ adapter didático
                                          │ ack/redelivery
                                  ┌───────┴────────┐
                                  ▼                ▼
                              worker A          worker B
                                  └───────┬────────┘
                                          ▼
                                  fake external effect
                                  inbox + effect ledger

OTel Collector ◄── trace context, messaging spans, métricas e logs
fault controller ─► crash, duplicate, delay, reorder, 429, timeout, broker/db outage
```

Estrutura prevista:

```text
labs/LT02-distribuidos-dados-mensageria/
  compose.yaml
  producer/
  relay/
  worker/
  contracts/
    asyncapi.yaml
    events/
  adapters/
    fake_bus.py
    rabbitmq_bus.py
  migrations/
  faults/
  backup/
  observability/
  tests/
  runbooks/
  evidence/
```

O domínio depende de `MessageBus`, `JobRepository`, `IdempotencyStore`, `EffectLedger` e `Clock` definidos com `typing.Protocol`. CloudEvents fornece o envelope interoperável; AsyncAPI documenta canais, mensagens e operações. RabbitMQ demonstra acknowledgements, confirms, prefetch, redelivery e DLQ, mas a suíte de contrato também roda com fake determinístico e impede acoplamento do domínio.

Toda execução persiste `message_id`, `correlation_id`, `causation_id`, `tenant_id`, `intent_hash`, `attempt`, `occurred_at`, `deadline_at` e versão do schema. Payload sensível não entra em logs ou atributos de alta cardinalidade.

## 4. Blocos

## Bloco 1 · Falha parcial, tempo, ordem e consistência

**IDs:** LT02-B01-C01..06 · **Matriz:** DIST-01.

**Conteúdo:** sistema distribuído e ausência de relógio/estado global instantâneo; timeout como observação ambígua; duplicação, atraso, perda e reordenação; consistência forte e eventual; read-your-writes e monotonic reads; linearizability versus serializability; CAP sob partição e PACELC fora dela.

**Prática:** executar um serviço de escrita e duas leituras sob latência/partição controlada; registrar o que cada participante sabe; comparar política que recusa escrita, política que aceita e reconcilia e impacto de latência.

**Evidência:** tabela requisito → falha → decisão → garantia → custo, timeline com eventos e ADR sem o slogan “escolha dois”.

**Aceitação:** o aluno identifica a fronteira de consistência, distingue timeout de falha confirmada e defende uma escolha com experimento reproduzível.

## Bloco 2 · Filas, streams, entrega, ordenação e backpressure

**IDs:** LT02-B02-C01..07 · **Matriz:** DIST-02.

**Conteúdo:** chamada síncrona, work queue e append-only stream; producer/consumer; channel, partition e consumer group; acknowledgement e publisher confirm; redelivery; at-most/at-least-once; ordenação global versus por chave; prefetch; bounded queue; demand e backpressure; schema evolution; CloudEvents e AsyncAPI.

**Prática:** publicar jobs acima da capacidade de dois workers, limitar in-flight, medir profundidade/idade da fila e observar redelivery após crash antes do ack. Particionar por `tenant_id` ou `job_id` quando a ordem for requisito.

**Falhas:** broker indisponível, confirmação perdida, consumer lento, ack prematuro, mensagem atrasada/duplicada/fora de ordem e poison message.

**Evidência:** contrato AsyncAPI, schemas versionados, gráfico input rate → queue age → throughput/erro/memória e matriz de semântica de entrega.

**Aceitação:** memória permanece limitada, produtor recebe pressão explícita, duplicata é esperada no desenho e mensagem venenosa termina em quarentena após tentativas finitas.

## Bloco 3 · Idempotência durável e transactional outbox/inbox

**IDs:** LT02-B03-C01..07 · **Matriz:** DIST-03.

**Conteúdo:** identidade da requisição versus identidade do efeito; chave de idempotência e hash canônico da intenção; estados `started/completed/failed/unknown`; unique constraint; resposta persistida; lock/lease e fencing; outbox na mesma transação do estado de negócio; relay reexecutável; inbox/dedup do consumidor; tombstone, TTL e reconciliação.

**Prática:** gravar `job + outbox` atomicamente; matar producer após commit; publicar novamente quando confirm se perde; executar dois workers concorrentes; matar worker antes e depois do efeito externo; reconciliar estado `unknown` consultando o provedor fake por operation ID.

**Falhas:** mesma chave com payload diferente, relay duplicado, processo morto após efeito/antes de persistir, lease expirada e concorrência entre instâncias.

**Evidência:** migrations, diagrama de estados, histórico transacional e testes que contam efeitos reais no ledger externo.

**Aceitação:** qualquer número de redeliveries produz no máximo um efeito lógico dentro da fronteira declarada; intenção conflitante é rejeitada; recovery não depende de memória do processo.

## Bloco 4 · Deadlines, retries, DLQ, sagas e compensação

**IDs:** LT02-B04-C01..07 · **Matriz:** DIST-02, DIST-03, LLM-03.

**Conteúdo:** falha transitória/permanente/ambígua; timeout por tentativa versus deadline do job; exponential backoff com jitter; retry budget, max attempts e concurrency budget; Retry-After; circuit breaker e load shedding; DLQ como quarentena observável, não cemitério; saga orquestrada versus coreografada; passos compensáveis, pivot e retryáveis.

**Prática:** orquestrar `reservar orçamento → executar operação externa → confirmar uso`; injetar 429, timeout e erro permanente; impedir tentativa que já não cabe no deadline; compensar reserva quando permitido e abrir caso humano quando resultado é ambíguo.

**Evidência:** policy executável, timeline de saga, contagem de retries por causa, runbook de DLQ/replay e teste de não amplificação.

**Aceitação:** retry total é finito e distribuído com jitter; replay preserva identidade; compensação é idempotente; erro ambíguo não é tratado como falha definitiva sem reconciliação.

## Bloco 5 · Transações, WAL, replicação, backup, PITR e retenção

**IDs:** LT02-B05-C01..07 · **Matriz:** DATA-02, DIST-01.

**Conteúdo:** ACID e limites da transação; isolation levels e anomalias; optimistic/pessimistic concurrency; WAL e durability; replicação síncrona/assíncrona e lag; RPO/RTO; base backup + WAL archive/PITR; checksum/verificação; retenção, deleção e legal hold; restore drill; HA versus DR.

**Prática:** reproduzir lost update/write skew quando aplicável e corrigir; gerar base backup; excluir um job; restaurar em instância isolada até imediatamente antes da exclusão; validar integridade e registrar tempos medidos.

**Falhas:** commit reconhecido antes da durabilidade esperada, réplica atrasada, backup incompleto, credencial de restore ausente, retenção incompatível e restore nunca ensaiado.

**Evidência:** política RPO/RTO, comando e log sanitizado de backup/restore, manifest/checksum, query de validação e relatório de restore drill.

**Aceitação:** dado apagado é recuperado por PITR dentro do RPO/RTO do laboratório; aluno demonstra por que réplica não recupera exclusão já replicada.

## Bloco 6 · Incidente multiworker e defesa das garantias

**IDs:** LT02-B06-C01..07 · **Matriz:** DIST-01..03, DATA-02, OBS-01, SRE-02.

**Conteúdo:** invariant e failure matrix; observabilidade de mensagens; propagation de trace context; queue age/in-flight/redelivery/DLQ; reconciliação; mitigação; restore e postmortem; diferença entre garantia projetada, verificada e apenas assumida.

**Prática:** cenário inédito combina ao menos três falhas: confirm perdido, worker morto em ponto sorteado e upstream lento/ambíguo. O aluno diagnostica, contém, reconcilia efeitos, restaura dado se necessário e prova invariantes por consulta independente.

**Saída:** `guarantees.md`, `failure-matrix.md`, traces, métricas, ledger de efeitos, patch, teste de regressão, restore report e postmortem curto.

**Aceitação:** nenhum claim excede a evidência; o sistema drena backlog após recuperação sem retry storm, efeito lógico duplicado ou mensagem silenciosamente perdida.

## 5. Agenda determinística de falhas

| Ponto | Falha injetada | Invariante esperado | Mecanismo de recuperação |
|---|---|---|---|
| após commit de `job + outbox`, antes de publish | kill producer | job não some | relay lê outbox pendente |
| após publish, antes de receber confirm | perda de conexão | duplicata é possível | message ID + inbox |
| após dequeue, antes do efeito | kill worker | mensagem volta | ack somente após processamento |
| após efeito, antes de persistir conclusão | kill worker | efeito lógico não duplica | operation ID + reconciliação |
| durante duas execuções concorrentes | atraso/lease expirada | apenas dono válido conclui | lock/fencing + unique constraint |
| em erro 429/timeout | burst de workers | sem tempestade | deadline + retry/concurrency budget + jitter |
| em mensagem inválida | redelivery repetida | fila saudável não bloqueia | limite + DLQ/quarentena |
| após exclusão acidental | dado ausente | recuperação até ponto anterior | restore isolado + PITR |

Cada teste registra seed, relógio, ponto de falha e contagem externa de efeitos. A variante de checkpoint muda a combinação e o instante; não muda os invariantes.

## 6. Catálogo de aceitação

| ID | Cenário | Condição |
|---|---|---|
| LT02-AT-001 | partição controlada | disponibilidade/consistência decididas por requisito e provadas |
| LT02-AT-002 | timeout ambíguo | não classificado automaticamente como operação não executada |
| LT02-AT-003 | CAP/PACELC | explicação distingue partição de operação normal |
| LT02-AT-010 | produtor excede consumidores | memória limitada e pressão/fila observável |
| LT02-AT-011 | crash antes de ack | redelivery ocorre sem perda |
| LT02-AT-012 | confirmação perdida | republish não duplica efeito lógico |
| LT02-AT-013 | ordenação por chave | sequência da chave preservada ou conflito detectado |
| LT02-AT-014 | poison message | quarentena após tentativas finitas, com causa e replay seguro |
| LT02-AT-015 | evolução de schema | consumidor aceita versão compatível e rejeita incompatível claramente |
| LT02-AT-020 | crash producer após commit | outbox publica o evento pendente |
| LT02-AT-021 | mesma chave/mesma intenção | resposta anterior é reutilizada |
| LT02-AT-022 | mesma chave/intenção distinta | conflito é rejeitado e auditado |
| LT02-AT-023 | dois workers | unique constraint/coordenação permite um efeito lógico |
| LT02-AT-024 | crash após efeito | reconciliação fecha estado sem repetir efeito |
| LT02-AT-030 | 429/timeout em massa | retry budget e jitter impedem sincronização |
| LT02-AT-031 | deadline insuficiente | nova tentativa não começa |
| LT02-AT-032 | saga falha após reserva | compensação idempotente ou intervenção explícita |
| LT02-AT-033 | replay de DLQ | IDs e causalidade preservados |
| LT02-AT-040 | anomalia de isolamento | reproduzida, explicada e mitigada |
| LT02-AT-041 | réplica atrasada | stale read detectada e tratada conforme requisito |
| LT02-AT-042 | exclusão acidental | PITR recupera dado em instância isolada |
| LT02-AT-043 | backup inválido | restore falha de modo visível; evidência não é promovida |
| LT02-AT-050 | trace por mensagem | producer, broker e consumer correlacionados sem PII |
| LT02-AT-060 | incidente inédito | invariantes provados após três falhas combinadas |
| LT02-AT-061 | restauração do lab | backlog drenado, faults desligados e smoke verde |

## 7. Checkpoint LT02

O aluno recebe uma combinação inédita e deve:

1. escrever as garantias e sua fronteira antes de executar o teste;
2. enumerar perda, duplicação, atraso, reorder e falha ambígua;
3. instrumentar a contagem externa do efeito;
4. executar a agenda de falha com seed registrada;
5. explicar o papel de transação, outbox, inbox, ack e reconciliação;
6. demonstrar backpressure e ausência de retry storm;
7. restaurar um dado por PITR e medir RPO/RTO;
8. declarar risco residual e condição de NO-GO.

Perguntas incluem: quando CAP se aplica; diferença entre serializability e linearizability; por que publisher confirm não prova consumo; onde “exactly once” termina; por que TTL de idempotência é decisão de negócio; como lease expirada gera concorrência; quando compensação não é possível; por que réplica não é backup; como queue age antecipa violação de SLO.

## 8. Fontes

| ID | Fonte | Versão/data | Uso | Obsolescência |
|---|---|---|---|---|
| SRC-LT02-01 | [Brewer's Conjecture and the Feasibility of Consistent, Available, Partition-Tolerant Web Services](https://dl.acm.org/doi/10.1145/564585.564601) | Gilbert & Lynch, 2002 | resultado formal de CAP | baixa |
| SRC-LT02-02 | [Consistency Tradeoffs in Modern Distributed Database System Design](https://www.cs.umd.edu/~abadi/papers/abadi-pacelc.pdf) | Abadi, 2012 | PACELC | baixa |
| SRC-LT02-03 | [Reactive Streams](https://www.reactive-streams.org/) | especificação 1.0.4 | demanda assíncrona e backpressure | baixa |
| SRC-LT02-04 | [CloudEvents Specification](https://github.com/cloudevents/spec/tree/ce%40v1.0.2) | 1.0.2 | envelope interoperável de eventos | média |
| SRC-LT02-05 | [AsyncAPI Specification](https://www.asyncapi.com/docs/reference/specification/v3.0.0) | 3.0.0 | contrato de API orientada a mensagens | média |
| SRC-LT02-06 | [AMQP 0-9-1](https://www.rabbitmq.com/resources/specs/amqp0-9-1.pdf) | especificação de protocolo | modelo de fila/ack/qos | baixa |
| SRC-LT02-07 | [RabbitMQ acknowledgements and publisher confirms](https://www.rabbitmq.com/docs/confirms) | documentação vigente, consultada 14/08/2026 | comportamento do adapter didático | alta |
| SRC-LT02-08 | [RabbitMQ reliability guide](https://www.rabbitmq.com/docs/reliability) | documentação vigente, consultada 14/08/2026 | redelivery e duplicação | alta |
| SRC-LT02-09 | [PostgreSQL transaction isolation](https://www.postgresql.org/docs/18/transaction-iso.html) | PostgreSQL 18 | isolamento e anomalias | média |
| SRC-LT02-10 | [PostgreSQL WAL](https://www.postgresql.org/docs/18/wal-intro.html) | PostgreSQL 18 | durabilidade e WAL | média |
| SRC-LT02-11 | [PostgreSQL continuous archiving and PITR](https://www.postgresql.org/docs/18/continuous-archiving.html) | PostgreSQL 18 | backup, archive e restore | média |
| SRC-LT02-12 | [PostgreSQL reliability](https://www.postgresql.org/docs/18/wal-reliability.html) | PostgreSQL 18 | limites físicos da durabilidade | média |
| SRC-LT02-13 | [OpenTelemetry messaging semantic conventions](https://opentelemetry.io/docs/specs/semconv/messaging/) | vigente; estado Development em 14/08/2026 | telemetria de mensagens | alta |
| SRC-LT02-14 | [Google SRE — Data Processing Pipelines](https://sre.google/sre-book/data-processing-pipelines/) | edição online | retries, idempotência e operação | baixa |
| SRC-LT02-15 | [Enterprise Integration Patterns](https://www.enterpriseintegrationpatterns.com/patterns/messaging/) | catálogo canônico | padrões, outbox conceitual e DLQ | baixa |
| SRC-LT02-16 | [AWS Builders' Library — Timeouts, retries and backoff with jitter](https://aws.amazon.com/builders-library/timeouts-retries-and-backoff-with-jitter/) | artigo técnico canônico | fundamento operacional; não cria dependência AWS | média |

Fontes de fornecedor só descrevem o adapter ou uma experiência operacional concreta. Nenhuma semântica do domínio depende delas; os conceitos são confrontados com especificações, papers e comportamento observado.

## 9. Critérios editoriais e G0

- 9.000–11.000 palavras visíveis mais laboratório executável;
- exemplos Python 3.14 tipados e concorrência testada com relógio/falhas controláveis;
- fake e RabbitMQ passam pela mesma suíte de contrato dentro da semântica suportada;
- nenhuma afirmação “exactly once” sem escopo e prova explícitos;
- pelo menos 25 cenários de aceitação automatizados ou documentados com evidência;
- resultados de efeito vêm de ledger externo consultado após o teste, nunca de fixture hardcoded;
- restore acontece em destino isolado e nunca sobrescreve a origem;
- falhas são reprodutíveis, reversíveis e não executam ação destrutiva no host;
- conteúdo diferencia padrão, mecanismo, implementação e decisão local.

- [x] seis blocos, competências e dependências definidos;
- [x] arquitetura neutral e adapters definidos;
- [x] agenda de falhas e invariantes definidos;
- [x] 25 cenários de aceitação definidos;
- [x] backup/restore e evidências definidos;
- [x] fontes primárias/canônicas selecionadas e versionadas;
- [x] escopo separado de LT01, LT03 e M12.

**Decisão:** LT02 está `ESPECIFICADO` e pode entrar em produção de material após as especificações LT03–LT04. Gate G0 aprovado.
