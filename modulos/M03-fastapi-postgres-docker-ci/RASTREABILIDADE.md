# Rastreabilidade do M03

**Data-base:** 21/08/2026 · **Especificação:** [`docs/especificacoes/M03-ESPECIFICACAO.md`](../../docs/especificacoes/M03-ESPECIFICACAO.md) · **Estado:** G0 aprovado; G1 em produção

Este registro separa escopo de evidência. Um cenário `ESPECIFICADO` possui oráculo planejado; não significa que o HTML, o laboratório ou a avaliação já o comprovem. Só uma execução reproduzível, revisada pelo orquestrador, pode promovê-lo para `VERIFICADO`.

## Baseline aprovada

| Item | Quantidade | Fonte de verdade |
|---|---:|---|
| carga | 16 h | especificação §2 |
| blocos | 8 | especificação §4 |
| cenários | 32 (`M03-AT-001`–`032`) | especificação §5 |
| fontes | 15 | especificação §6 |
| produto | 1 (`link-shortener`) | especificação §1 e §3 |
| execução externa obrigatória | 0 | especificação §1 |

## Cobertura por bloco

| Bloco | Competência verificável | Cenários | Saída planejada | Estado |
|---|---|---|---|---|
| B01 · HTTP | rota, schema, dependência, lifecycle, middleware e contrato de erro | AT-001–004 | API ASGI e OpenAPI | MATERIAL PRODUZIDO; EVIDÊNCIA PENDENTE |
| B02 · dados | `AsyncSession`, transação, constraint e Alembic | AT-003, AT-005–008 | migrations e UoW por request | CONTEÚDO PRODUZIDO; LAB PARCIAL (PG BLOQUEADO) |
| B03 · PostgreSQL | índice, plano, JSONB, isolamento e update atômico | AT-009–012 | queries e casos concorrentes | CONTEÚDO PRODUZIDO; LAB PARCIAL (PG BLOQUEADO) |
| B04 · arquitetura | camadas, porta, override e regra de import | AT-013–016 | import contract e ADR | CONTEÚDO PRODUZIDO; ORÁCULOS OFFLINE VERDES |
| B05 · containers | imagem, cache, usuário, segredo, Compose, rede e volume | AT-017–020 | Dockerfile e Compose | CONTEÚDO PRODUZIDO; ORÁCULOS ESTÁTICOS VERDES; EXECUÇÃO BLOCKED |
| B06 · integração | PostgreSQL descartável, client ASGI e determinismo | AT-012, AT-015, AT-021–024 | suíte de integração | CONTRATO GENUÍNO; EXECUÇÃO BLOCKED (PG) + PARCIAL OFFLINE |
| B07 · CI/release | gates, lock, segredos, imagem imutável e migration de release | AT-025–029 | workflow e contrato de release | CONTEÚDO PRODUZIDO; ORÁCULOS OFFLINE VERDES |
| B08 · operação | health, correlação, degradação, diagnóstico e limite do deploy | AT-024, AT-029–032 | laboratório final e checkpoint | CONTEÚDO PRODUZIDO; LAB GUIADO + CHECKPOINT; PG BLOCKED |

## Matriz de cenários

| Família | Cenários | Estado atual | Condição para promoção |
|---|---|---|---|
| HTTP e contrato | AT-001–004 | CONTEÚDO PRODUZIDO; EVIDÊNCIA PENDENTE | testes ASGI, erro deliberado e código de referência |
| sessão e migration | AT-005–008 | CONTEÚDO PRODUZIDO; ORÁCULOS OFFLINE VERDES; PG BLOQUEADO | PostgreSQL real, upgrade/downgrade e negativo (Docker) |
| plano e concorrência | AT-009–012 | CONTEÚDO PRODUZIDO; ORÁCULOS OFFLINE VERDES; PG BLOQUEADO | plano real, corrida reprodutível e correção (Docker) |
| fronteiras internas | AT-013–016 | CONTEÚDO PRODUZIDO; ORÁCULOS OFFLINE VERDES | mutante de guardrail rejeitado + ADR |
| imagem e Compose | AT-017–020 | CONTEÚDO PRODUZIDO; ORÁCULOS ESTÁTICOS VERDES; BUILD/SUBIDA BLOCKED | Docker Engine com `docker build`/`compose up` |
| integração | AT-021–024 | CONTRATO GENUÍNO EM `conftest.py`+`test_postgres_integration.py`; PARCIAL OFFLINE VERDE | Testcontainers/PostgreSQL (Docker) |
| CI e release | AT-025–029 | CONTEÚDO PRODUZIDO; WORKFLOW + CHECK.SH + WHEEL VERIFICADOS | runner CI com Docker para a parte `postgres` |
| operação e transferência | AT-030–032 | LAB GUIADO + CHECKPOINT POR CENÁRIO; PG BLOCKED | execução local com Docker; publicação externa opcional |

## Estado dos gates

| Gate | Estado | Evidência existente / lacuna |
|---|---|---|
| G0 | **APROVADO** | especificação v1.0, 32 ATs, fontes, produto, laboratório e limites definidos |
| G1 | EM PRODUÇÃO (todos os blocos reescritos, avaliação pendente) | HTML B01–B08 + lab guiado + checkpoint por cenário produzidos; falta revisão do orquestrador |
| G2 | PENDENTE (parcial offline) | `lab/` com 52 testes verdes offline + 6 contratos PG BLOCKED; sem Docker não há PostgreSQL real |
| G3 | PENDENTE (material pronto) | checkpoint por cenário com rubrica em M03.html; sem execução de avaliação real |
| G4 | PENDENTE (parcial) | invariantes/adapters separados; verificação Windows/Linux/Docker pendente |
| G5 | PENDENTE (parcial) | timeout/cleanup/segredo/health/concorrência com oráculos offline; release PG pendente |
| G6 | PENDENTE | estrutura/links validados (`check_course.py` 0 erros); QA visual 390px/impressão pendente |

## Auditoria do artefato anterior

| Achado | Impacto | Tratamento planejado |
|---|---|---|
| práticas aparecem dentro de B01–B07 | leitura interrompida e prática vira sequência de tarefas desconectadas | mover a execução para um único `Laboratório guiado M03` depois de B08 |
| não há diretório `lab/` | não existe referência reproduzível nem cópia segura | criar produto, lock, gates e `create_working_copy.py` |
| zero fontes no HTML | claims mutáveis de framework e mercado não são auditáveis | inserir fontes por bloco e matriz no fechamento |
| deploy Fly/Railway tratado como obrigatório | exige conta externa e deixa a prática não reproduzível | manter apenas como trilha opcional, fora da promoção local |
| exemplos usam versões e tempos fixos sem método | risco de leitura como promessa de desempenho | substituir por resultados executados ou exemplos variáveis marcados |
| checkpoint mistura checklist de entrega e prática | avaliação não separa repetição de decisão | reconstruir rubrica por cenário após o laboratório |

## Lote B01 — 21/08/2026

| Item | Aplicação | Estado |
|---|---|---|
| contexto antes de adapter | HTTP, ASGI, Uvicorn, FastAPI e OpenAPI são apresentados por responsabilidade e limite | APLICADO |
| exemplo trabalhado | fronteira em memória mostra schema, `Depends`, lifespan, Problem Details e correlation id; o trecho declara que não prova banco ou produção | APLICADO |
| contraste e diagnóstico | 422 versus policy, OpenAPI versus autorização, I/O bloqueante, erro inconsistente, header não confiável e entidade vazada | APLICADO |
| prática | os três passos manuais antigos foram removidos; nenhuma execução é pedida antes do laboratório final | APLICADO |
| fontes | fontes oficiais e normativas vinculadas ao fim do bloco, com data de consulta | APLICADO |

O conteúdo cobre a preparação para AT-001–004, mas esses cenários seguem pendentes. Ainda não há código versionado, client ASGI, oráculo de erro, teste de lifecycle ou prova de middleware.

## Próximo lote

**M03 fechado no executável.** Falta, fora do alcance deste ambiente:
execução PostgreSQL/Docker (etapa 7 do lab guiado), QA visual G6 e
revisão do orquestrador para G1–G6. Pela fila do status, a próxima
unidade é **M04-S** (escopo e rastreabilidade do M04).

## Lote B02 — 13/09/2026 (M03-B02-C/L/D)

Teoria reescrita sem pré-requisito de outra stack, sem prática no corpo e
com fontes por bloco; referência executável criada em `lab/`.

| Item | Aplicação | Estado |
|---|---|---|
| contexto antes de adapter | engine, pool, sessão, transação, migration e constraint ensinados no ponto de uso | APLICADO |
| exemplo trabalhado | `db.py` conceitual rotulado; percurso de leitura request-com-banco sem comandos | APLICADO |
| contraste e diagnóstico | `if exists` vs. constraint, `create_all` vs. migration, sessão global vs. por request; linha nova na tabela de diagnóstico | APLICADO |
| prática | passos manuais removidos do corpo; execução reunida no futuro `Laboratório guiado M03` | APLICADO |
| fontes | SQLAlchemy asyncio/session, Alembic cookbook, PostgreSQL MVCC/transactions ao fim do bloco | APLICADO |
| checkpoint | P3 reescrita sem referência a outra stack | APLICADO |

Arquivos do lab: `pyproject.toml` (Python 3.14, `uv`), `src/link_shortener/`
(`domain`, `errors`, `models`, `db`), `migrations/` (`env.py` + revision
`0001` com upgrade/downgrade), `tests/` (5 arquivos), `create_working_copy.py`,
`README.md`, `.env.example`, `evidence/b02-gates.txt`.

Execução real (CPython 3.14.7, `uv sync` com lock gerado em 13/09/2026):

- `uv run ruff check .` — aprovado;
- `uv run ruff format --check .` — aprovado;
- `uv run mypy src tests` (strict) — 10 arquivos, sem achados;
- `uv run pytest -q -rs` — **19 passed, 4 skipped**; os 4 pulos são
  `test_postgres_integration.py` com motivo `BLOCKED: Docker/PostgreSQL
  indisponível`, cobrindo AT-005/006/007/008 contra PostgreSQL real.

Limites explícitos: `test_session_scope.py` usa SQLite transacional local e
prova a MECÂNICA da fronteira (commit/rollback/escopo — AT-003/AT-007
parciais), não garantias do PostgreSQL; `create_all` existe apenas como
auxiliar de teste restrito (`db.create_all`, docstring proíbe uso em
produção). Nenhum cenário foi promovido; G2/G5 seguem pendentes até a
execução PostgreSQL com Docker. Evidência em `lab/evidence/b02-gates.txt`.
Revisão do orquestrador pendente; `STATUS-IMPLEMENTACAO-CURSO.md` e
`PROGRESSO.md` não alterados neste lote.

## Lote B03 — 13/09/2026 (M03-B03-C/L/D)

Teoria reescrita sem pré-requisito de outra stack, sem prática no corpo e
com fontes por bloco; `lab/` estendido com revision `0002`, contadores e
oráculos de dados.

| Item | Aplicação | Estado |
|---|---|---|
| contexto antes de adapter | B-tree/composto/parcial/GIN, EXPLAIN, transação e JSONB ensinados no ponto de uso | APLICADO |
| exemplo trabalhado | plano ilustrativo rotulado como variável; percurso de leitura sintoma-conserto sem comandos | APLICADO |
| contraste e diagnóstico | plano com estatística velha, índice sem predicado, JSONB sem validação; linha nova na tabela de diagnóstico | APLICADO |
| prática | passos manuais removidos do corpo; execução reunida no futuro `Laboratório guiado M03` | APLICADO |
| fontes | PostgreSQL EXPLAIN/ANALYZE/JSON/MVCC/transactions ao fim do bloco | APLICADO |

Arquivos novos do lab: `migrations/versions/0002_add_meta_and_created_at_index.py`
(coluna `meta` JSONB + GIN + índice de data, com downgrade),
`src/link_shortener/counters.py` (incremento ingênuo vs. atômico),
`tests/test_counters.py` (AT-010: intercalamento determinístico perde,
atômico preserva 20 concorrentes), `tests/test_data.py` (AT-009: índices
no schema; AT-011: DDL JSONB no dialeto PG + persiste/filtra;
AT-012: mesmo slug em dois testes, ordem invertida verificada).
`models.Link` ganhou `meta` (JSONB com variante para SQLite) e
`ix_links_created_at`. `test_postgres_integration.py` ganhou os contratos
AT-009/010/011, todos BLOCKED.

Execução real (CPython 3.14.7):

- `uv run ruff check .` — aprovado;
- `uv run ruff format --check .` — aprovado;
- `uv run mypy src tests` (strict) — 13 arquivos, sem achados (um
  `type: ignore[no-untyped-call]` pontual na compilação DDL, cujos stubs
  não são tipados);
- `uv run pytest -q -rs` — **28 passed, 7 skipped**; os 7 pulos são
  `test_postgres_integration.py` com motivo `BLOCKED: Docker/PostgreSQL
  indisponível`.

Limites explícitos: SQLite prova mecânica e schema, não plano do
planejador PG, GIN nem MVCC; AT-009/010/011 seguem parciais até a
execução PostgreSQL com Docker. Nenhum cenário foi promovido; G2/G5
seguem pendentes. Evidência em `lab/evidence/b03-gates.txt`.
Revisão do orquestrador pendente; `STATUS-IMPLEMENTACAO-CURSO.md` e
`PROGRESSO.md` não alterados neste lote.

Nenhum cenário foi promovido nesta etapa. G0 não é evidência de G1–G6.

## Lote B04 — 13/09/2026 (M03-B04-C/L/D)

Teoria reescrita no layout real do lab, sem prática no corpo e com fontes
por bloco; camadas executáveis com guardrail, override e ADR.

| Item | Aplicação | Estado |
|---|---|---|
| contexto antes de adapter | import system, Protocol, override e ADR ensinados no ponto de uso | APLICADO |
| exemplo trabalhado | percurso de leitura ponta a ponta sem comandos; árvore do lab real | APLICADO |
| contraste e diagnóstico | sessão opaca vs. repositório na rota; linha nova na tabela de diagnóstico | APLICADO |
| prática | passos SDD/import-linter removidos do corpo; execução no futuro `Laboratório guiado M03` | APLICADO |
| fontes | Python import system/typing-Protocol, FastAPI dependencies (13/09/2026) | APLICADO |
| ADR | `docs/adr/0001-fronteiras-camadas-link-shortener.md` com custo e condição de revisão (AT-016) | APLICADO |

Arquivos novos do lab: `repositories/link_repository.py` (Protocol +
SQLAlchemy, com rollback antes de traduzir conflito), `services/link_service.py`
(regra pura sobre protocolo), `api/{app,deps}.py` (rotas + Problem Details +
`dependency_overrides`), `composition.py` (raiz de composição, isenta do
guardrail por desenho), `tests/test_layers.py` (varredura AST AT-013/014 com
controles negativos), `tests/test_service_override.py` (AT-015: mesma regra
contra SQLAlchemy e fake + HTTP com override e cliente ASGI).
`errors.translate_conflict` passa a reconhecer unicidade do SQLite além do
SQLSTATE 23505 (documentado como mecânica local).

Execução real (CPython 3.14.7):

- `uv run ruff check .` — aprovado;
- `uv run ruff format --check .` — aprovado;
- `uv run mypy src tests` (strict) — 23 arquivos, sem achados;
- `uv run pytest -q -rs` — **34 passed, 7 skipped** (BLOCKED Docker);
- controle mutante: import ilegal injetado em `api/app.py` quebra
  `test_nenhuma_violacao_na_referencia`; revertido, suíte volta ao verde.

Limites explícitos: override HTTP provado contra SQLite + ASGI, não contra
PostgreSQL descartável (B06/Testcontainers, BLOCKED sem Docker); nenhuma
migração de comportamento — os 28 testes anteriores continuam verdes sem
edição. Nenhum cenário promovido a VERIFICADO; G2/G5 seguem pendentes.
Evidência em `lab/evidence/b04-gates.txt`. Revisão do orquestrador
pendente; `STATUS-IMPLEMENTACAO-CURSO.md` e `PROGRESSO.md` não alterados
neste lote.

## Lote B05 — 13/09/2026 (M03-B05-C/L/D)

Teoria sem referências pessoais e com Dockerfile canônico 3.14; artefatos
de embalagem no lab com oráculos estáticos.

| Item | Aplicação | Estado |
|---|---|---|
| contexto antes de adapter | imagem/camada/container/registry ensinados no ponto de uso | APLICADO |
| exemplo trabalhado | Dockerfile e Compose de referência, correspondentes ao lab | APLICADO |
| contraste | saúde de enfeite vs. saúde que verifica (antecipado de B08) | PARCIAL (completo em B08) |
| prática | passos com clock removidos; execução na etapa 4/7 do lab guiado | APLICADO |
| fontes | Docker multi-stage/context/startup-order | APLICADO |

Arquivos novos: `Dockerfile` (multi-stage 3.14, não-root, healthcheck),
`.dockerignore` (sem `.env`), `compose.yml` (service_healthy, rede e
volume nomeados), `src/link_shortener/serve.py` (ponto de entrada),
`tests/test_packaging.py` (AT-017..020 estáticos). Observado: 41 passed,
7 skipped (BLOCKED). Evidência em `lab/evidence/b05-gates.txt`
(resumo) e `b08-gates.txt` (cumulativa).

## Lote B06 — 13/09/2026 (M03-B06-C/L/D)

Teoria com imports reais do lab e migration como setup; suíte PG genuína
com fixtures que pulam BLOCKED sem Docker.

| Item | Aplicação | Estado |
|---|---|---|
| exemplo trabalhado | três fixtures (container/sessão, migration, cliente ASGI) | APLICADO |
| contraste e diagnóstico | simulação de ORM vs. banco real; linhas de diagnóstico já existentes | APLICADO |
| prática | passos com clock removidos; execução nas etapas 5/7 do lab guiado | APLICADO |
| fontes | Testcontainers Python (13/09/2026), SQLAlchemy asyncio, Alembic | APLICADO |

Arquivos novos: `tests/conftest.py` (container por sessão, schema por
migration, envelope por teste, cleanup), `tests/test_postgres_integration.py`
reescrito com corpos genuínos (AT-005/006/009/010/011/012/021/022),
`tests/test_resilience.py` (AT-024 parcial offline). Defeito real
corrigido: `create_engine` passava `pool_size` ao SQLite. Observado:
44 passed, 6 skipped (BLOCKED). Evidência em `lab/evidence/b06-gates.txt`.

## Lote B07 — 13/09/2026 (M03-B07-C/L/D)

CI como lei e release como contrato; deploy externo rebaixado a trilha
opcional registrada (AT-032), sem conta/URL no caminho obrigatório.

| Item | Aplicação | Estado |
|---|---|---|
| contexto | workflow/evento/job/step ensinados; segredos só em cofre | APLICADO |
| exemplo trabalhado | pipeline de referência correspondente ao workflow real | APLICADO |
| contraste | mesma imagem + config injetada vs. rebuild por ambiente | APLICADO |
| prática | passos Fly removidos; execução na etapa 6 do lab guiado | APLICADO |
| fontes | Actions workflow syntax + security hardening | APLICADO |

Arquivos novos: `.github/workflows/ci-m03.yml` (quality + build por SHA),
`lab/scripts/check.sh` (equivalente local, AT-025), `lab/RELEASE.md`
(contrato + trilha opcional), `tests/test_release.py` (AT-025..029),
`dist/` (wheel + sdist via `uv build`). Observado: `check.sh` verde
ponta a ponta, 50 passed, 6 skipped. Evidência em `b07-gates.txt`.

## Lote B08 — 13/09/2026 (M03-B08-C/D)

Operação local com saúde que verifica banco, correlation id e degradação
503; laboratório guiado único com 7 etapas retomáveis; checkpoint
reconstruído por cenário com rubrica.

| Item | Aplicação | Estado |
|---|---|---|
| saúde/correlação | `/health` com `select 1` (200/503), middleware de correlation id | EXECUTÁVEL OFFLINE |
| lab guiado | seção `Laboratório guiado M03`: cópia, etapas 1–7, limpeza, retomada | APLICADO |
| checkpoint | P1–P8 por família AT com basta/reprova + entregáveis sem produção pública | APLICADO |
| diagnóstico | tabela preservada + 3 linhas novas dos lotes (sessão, JSONB, fronteira) | APLICADO |

Arquivos novos: `/health` e middleware em `api/app.py`,
`tests/test_operation.py` (AT-024/029/030 offline). Observado:
`check.sh` verde, 52 passed, 6 skipped (BLOCKED). Evidência em
`lab/evidence/b08-gates.txt` (execução cumulativa completa).

Limites do módulo após os lotes: sem Docker Engine não há execução
PostgreSQL (etapa 7 do lab guiado, 6 testes BLOCKED); G2/G5 seguem
pendentes por esse motivo. QA visual G6 (390px/impressão/navegador) não
foi executado neste ambiente. Nenhum cenário promovido a VERIFICADO;
nenhum gate promovido. Revisão do orquestrador pendente;
`STATUS-IMPLEMENTACAO-CURSO.md` e `PROGRESSO.md` não alterados.

## Revisão editorial — 12/09/2026

O HTML principal recebeu explicações independentes de outra stack, remoção de duração obrigatória, links por seção e aviso de prontidão. A navegação permite leitura e prática no ritmo do aluno. O verificador editorial examinou estrutura, destinos locais e âncoras; não executou laboratórios nem certificou fontes externas ou apresentação visual. Os resultados técnicos anteriores permanecem históricos; G6 da apresentação revisada continua pendente.

## Revisão E — 14/09/2026 (orquestrador, protocolo econômico)
Lab re-executado: ruff/format/mypy verdes; pytest 52 passed + 6 PG-BLOCKED (test_postgres_integration, sem skip verde); Python 3.14.7. HTML: 0 erros, 0 legadas; 8 h2 com id; TOC 9 âncoras íntegras; SRC-M03 ×7 por bloco; checkpoint P1–P8; diagnóstico ×9. Serve 200. Âncoras diagnostico/checkpoint adicionadas nesta revisão. Limites: sem Docker/PG, sem QA visual device, sem rede/fontes externas. G2 re-verificado no slice offline; G1/G3–G6 inalterados.

E-QA complementar (orquestrador): regra `:focus-visible` explícita + rolagem horizontal de tabelas ≤640px aplicadas no CSS (padrão M00/M11); sem `outline:none` em nenhum módulo (foco visível por padrão). M06 TOC convertido para âncoras; ids diagnostico/checkpoint/fontes adicionados.
