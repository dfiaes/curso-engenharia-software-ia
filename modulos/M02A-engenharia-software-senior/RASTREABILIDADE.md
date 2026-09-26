# Rastreabilidade — M02A · Engenharia de Software Sênior em 2026

> Atualizado em 12/09/2026 · estado: **G0 aprovado; G1 em produção; G2 parcial**
> Fonte normativa: [`M02A-ESPECIFICACAO.md`](../../docs/especificacoes/M02A-ESPECIFICACAO.md) v1.2

Este registro distingue escopo aprovado de evidência executada. A existência de
uma competência, cenário ou fonte na especificação comprova G0; não comprova
material, código, teste, portabilidade ou revisão visual.

## Baseline aprovada

| Item | Quantidade | Fonte de verdade |
|---|---:|---|
| carga | 30 h | especificação §1.2 |
| blocos | 15 | especificação §5 |
| competências | 60 (`ES26-001`–`ES26-060`) | especificação §5 |
| cenários | 60 (`M02A-AT-001`–`060`) | especificação §6 |
| dimensões de rubrica | 8 | especificação §8 |
| gates | 7 (`G0`–`G6`) | especificação §7 |

## Estado dos gates

| Gate | Estado | Evidência |
|---|---|---|
| G0 — design | **APROVADO** | especificação v1.2: escopo, linguagem, produto, limites, 60 competências, 60 ATs, rubrica e fontes |
| G1 — material | **APROVADO** | HTML com B01–B15 no padrão, revisado pelo orquestrador; laboratório final com 17 passos |
| G2 — execução | **PARCIAL** | gate offline verde: format/lint, mypy strict 48 arquivos, pytest 144 passed, wheel, lock, corpus golden/diferencial/fixtures, API/CLI fora do checkout; PG/.NET/Windows/venv-virgem bloqueados |
| G3 — avaliação | PENDENTE | recuperação por bloco B01–B15 + 48 oráculos fortes; rubrica formal por AT pendente |
| G4 — portabilidade | **PARCIAL** | corte API/CLI Python com corpus diferencial executado; matriz Windows/venv-virgem bloqueada |
| G5 — produção | **PARCIAL** | controles locais integrais (dados, concorrência, telemetria, SLO, runbook, instalação); montante live bloqueado |
| G6 — editorial/certificação | PENDENTE | estrutura/links/âncoras verificados; QA visual e CI pendentes |

Comando revisado pelo orquestrador no diretório `lab/`:
`uv run --locked --offline python tools/gate.py all`. A validação de lock também passou
offline. Esses resultados sustentam apenas o slice atual.

## Rastreabilidade por bloco

| Bloco | Competências | Cenários principais | Saída planejada | Estado |
|---|---|---|---|---|
| B01 · papel/risco/evidência | `ES26-001`–`004` | AT-046–050; cruza AT-001/049 | intent, stakeholders e riscos | MATERIAL PRODUZIDO; EVIDÊNCIA MISTA |
| B02 · requisitos/decisões | `ES26-005`–`008` | AT-051–054; cruza AT-001/004/005 | P0/P1, quality scenarios, C4 e ADR-0001 | MATERIAL PRODUZIDO; EVIDÊNCIA PENDENTE/PARCIAL |
| B03 · modularidade/domínio | `ES26-009`–`012` | AT-055–060; cruza AT-002/003/005 | hexagonal mínima e dependency gate | MATERIAL PRODUZIDO; EVIDÊNCIA PARCIAL |
| B04 · contratos | `ES26-013`–`016` | AT-006–011 | schemas v1/v2 e corpus golden | MATERIAL PRODUZIDO; EVIDÊNCIA PARCIAL |
| B05 · dados | `ES26-017`–`020` | AT-012–017 | migrations, transação, tenant e query plan | MATERIAL PRODUZIDO; EVIDÊNCIA FORTE NO SLICE |
| B06 · concorrência | `ES26-021`–`024` | AT-018–022 | batch bounded, cancelamento e overload | MATERIAL PRODUZIDO; EVIDÊNCIA FORTE NO SLICE |
| B07 · distribuídos | `ES26-025`–`028` | AT-013, AT-018–021 | simulações determinísticas com limites | CONTEÚDO PRODUZIDO; LAB VERDE; DIAGNÓSTICO + RECUPERAÇÃO |
| B08 · testes | `ES26-029`–`032` | AT-029–031 | property, mutation e differential tests | CONTEÚDO PRODUZIDO; LAB VERDE; DIAGNÓSTICO + RECUPERAÇÃO |
| B09 · segurança | `ES26-033`–`036` | AT-025, AT-032–035 | threat model e adversariais | CONTEÚDO PRODUZIDO; LAB VERDE; DIAGNÓSTICO + RECUPERAÇÃO |
| B10 · observabilidade/SRE | `ES26-037`–`040` | AT-033, AT-036, AT-044–045 | trace, SLI/SLO, runbook e incidente | CONTEÚDO PRODUZIDO; LAB VERDE; DIAGNÓSTICO + RECUPERAÇÃO |
| B11 · complexidade/performance/custo | `ES26-041`–`044` | AT-037–038 | workload, amostras e decisão | CONTEÚDO PRODUZIDO; LAB VERDE; DIAGNÓSTICO + RECUPERAÇÃO |
| B12 · legado/entrega | `ES26-045`–`048` | AT-039–043 | mudança incremental, gate e rollback | CONTEÚDO PRODUZIDO; LAB VERDE; DIAGNÓSTICO + RECUPERAÇÃO |
| B13 · Python sênior | `ES26-049`–`052` | AT-020–021, AT-040–043 | produto Python, wheel e diagnóstico | CONTEÚDO PRODUZIDO; LAB VERDE; DIAGNÓSTICO + RECUPERAÇÃO |
| B14 · compatibilidade Python | `ES26-053`–`056` | AT-006, AT-010–011, AT-022, AT-040 | API/CLI instalada e corpus diferencial | CONTEÚDO PRODUZIDO; LAB VERDE; DIAGNÓSTICO + RECUPERAÇÃO |
| B15 · AI-native/liderança | `ES26-057`–`060` | AT-023–028, AT-031 | record-replay, eval, revisão e defesa | CONTEÚDO PRODUZIDO; LAB VERDE; DIAGNÓSTICO + RECUPERAÇÃO |

`AT` acima abrevia `M02A-AT`. Os vínculos são de cobertura principal; um mesmo
cenário pode integrar competências de mais de um bloco.

## Critérios do lote B01–B03

### B01 · papel sênior, produto, risco e evidência

| Competência | Evidência mínima planejada | Oráculo/limite | Estado |
|---|---|---|---|
| `ES26-001` | intent separa output, outcome, impacto e restrição | termos aplicados ao mesmo caso, sem confundi-los | PRODUZIDO NO HTML; AT-046 PENDENTE |
| `ES26-002` | risk register usa objetivo, incerteza/evidência, impacto, detectabilidade, horizonte e reversibilidade | escala ordinal não é tratada como probabilidade | PRODUZIDO; AT-047 FORTE, AT-048 PENDENTE |
| `ES26-003` | mapa de stakeholders e efeitos sociotécnicos | inclui pessoas/processos/incentivos, não só software | PRODUZIDO; AT-050 PENDENTE |
| `ES26-004` | registro `claim → método → evidência → limitação` | evidência ausente é marcada ausente, nunca simulada | PRODUZIDO; AT-049 FORTE |

Aceite integrado: AT-001 está parcial; AT-047 e AT-049 têm evidência forte no
slice. AT-046, AT-048 e AT-050 continuam pendentes. “Forte” não equivale a
aceite final do cenário ou aprovação de G3.

### B02 · requisitos, atributos de qualidade e decisões

| Competência | Evidência mínima planejada | Oráculo/limite | Estado |
|---|---|---|---|
| `ES26-005` | catálogo separa necessidade, requisito, restrição e solução | solução precoce não é reclassificada como requisito | PRODUZIDO NO HTML; AT-051 PENDENTE |
| `ES26-006` | cenários mensuráveis, inclusive acessibilidade/inclusão | seis elementos do cenário são explícitos | PRODUZIDO; AT-052 PENDENTE |
| `ES26-007` | ADR/RFC com alternativas e condição de revisão | trade-offs e consequência constam do registro | PRODUZIDO; AT-053/054 PENDENTES |
| `ES26-008` | C4 rastreado para decisões e estrutura real | gate prova consistência declarada, não completude do diagrama | PRODUZIDO; AT-005 PARCIAL |

Aceite integrado: AT-001 e AT-005 estão parciais; AT-004 e AT-051–054 estão
pendentes. A presença do conteúdo não comprova a avaliação.

### B03 · modularidade, acoplamento e domínio

| Competência | Evidência mínima planejada | Oráculo/limite | Estado |
|---|---|---|---|
| `ES26-009` | grafo/gate mede dependências e ciclos | mutação cria violação que o gate rejeita | PRODUZIDO; AT-002/003 FORTES |
| `ES26-010` | decisão usa SOLID como heurística | contraponto demonstra custo/limite da heurística | PRODUZIDO; AT-059 PENDENTE |
| `ES26-011` | domínio, aplicação, portas e adapters delimitados | domínio importa sem adapters e só composition root liga concretos | PRODUZIDO; AT-057/058/AT-055/056 FORTES |
| `ES26-012` | decisão compara custo da abstração à mudança esperada | abstração sem variação/risco exige ADR ou remoção | PRODUZIDO; AT-059 PENDENTE, AT-060 PARCIAL |

Aceite integrado: o slice sustenta AT-002, AT-003, AT-055–058; AT-060 permanece
parcial porque a mudança incremental ainda não tem corpus completo. AT-059
permanece pendente: o ADR que justifica ou remove uma abstração ainda não foi
produzido. A presença do bloco e desses oráculos não promove G3.

## Fontes para B01–B06

| Bloco/claim | Fonte | Tipo | Versão/data | Revalidar | Estado de uso |
|---|---|---|---|---|---|
| B01 · cobertura profissional | [IEEE SWEBOK](https://www.computer.org/education/bodies-of-knowledge/software-engineering) | canônica | v4.0a | nova edição | MAPEADA EM G0 |
| B01 · responsabilidade | [IEEE/ACM Code of Ethics](https://www.computer.org/education/code-of-ethics) | normativa profissional | versão vigente no snapshot 15/08/2026 | anual | MAPEADA EM G0 |
| B01 · métricas sociotécnicas | [SPACE](https://doi.org/10.1145/3454122.3454124) | científica/industrial | paper original, 2021 | anual | MAPEADA EM G0 |
| B02 · descrição arquitetural | [ISO/IEC/IEEE 42010](https://www.iso.org/standard/74393.html) | normativa | 2022 | anual | MAPEADA EM G0 |
| B02 · atributos de qualidade | [ISO/IEC 25010](https://www.iso.org/standard/78176.html) | normativa | 2023 | anual | MAPEADA EM G0 |
| B02 · design orientado a atributos | [SEI ADD](https://www.sei.cmu.edu/library/attribute-driven-design-method-collection/) | canônica | coleção vigente no snapshot 15/08/2026 | anual | MAPEADA EM G0 |
| B02 · comunicação de arquitetura | [C4 Model](https://c4model.com/) | practitioner/canônica | página vigente no snapshot 15/08/2026 | anual | MAPEADA EM G0 |
| B02 · histórico de decisões | [Architecture Decision Record](https://martinfowler.com/bliki/ArchitectureDecisionRecord.html) | practitioner/canônica | Nygard/Fowler, página vigente | anual | MAPEADA EM G0 |
| B03 · domínio | [DDD Reference](https://www.dddcommunity.org/uncategorized/evans_2004/) | canônica | Evans, 2004 | por edição | MAPEADA EM G0 |
| B03 · evolução/modularidade | [Refactoring](https://martinfowler.com/books/refactoring.html) | canônica | edição indicada pela fonte | por edição | MAPEADA EM G0 |
| B04 · schemas e evolução | [JSON Schema 2020-12](https://json-schema.org/draft/2020-12); [OpenAPI](https://spec.openapis.org/oas/); [AsyncAPI](https://www.asyncapi.com/docs/reference/specification/latest) | especificações abertas | snapshots consultados em 21/08/2026 | 90 dias quando ativos | APLICADA NO HTML |
| B04 · erro interoperável | [RFC 9457](https://www.rfc-editor.org/rfc/rfc9457.html) | normativa | 2023 | por RFC | APLICADA COMO CONTRASTE |
| B04 · sinal de mercado | [Postman State of the API 2025](https://www.postman.com/state-of-api/2025/) | industrial de fornecedor | mais de 5.700 respondentes | 90 dias | APLICADA COM LIMITE |
| B05 · transação/plano local | [SQLite transactions](https://www.sqlite.org/lang_transaction.html); [SQLite EQP](https://www.sqlite.org/eqp.html) | documentação oficial | consultadas em 21/08/2026 | por versão do motor | APLICADA NO HTML/LAB |
| B05 · contraste do banco canônico | [PostgreSQL 18 MVCC](https://www.postgresql.org/docs/18/mvcc.html) | documentação oficial | major 18 | major/90 dias em produção | APLICADA COMO LIMITE |
| B05 · sinal de mercado | [Stack Overflow Developer Survey 2025](https://survey.stackoverflow.co/2025/technology) | industrial | 26.083 respondentes no campo de banco | 90 dias | APLICADA COM LIMITE |
| B06 · runtime e fila | [Python 3.14 asyncio tasks](https://docs.python.org/3.14/library/asyncio-task.html); [queues](https://docs.python.org/3.14/library/asyncio-queue.html) | documentação oficial | release 3.14 | por release | APLICADA NO HTML/LAB |

`MAPEADA EM G0` significa fonte selecionada para sustentar o bloco. A revisão
por claim e a cobertura de B05–B15 continuam necessárias. Esta tabela não
aprova G1.

## Critérios do lote B04

| Competência | Evidência mínima planejada | Oráculo/limite | Estado |
|---|---|---|---|
| `ES26-013` | diferencia contrato sintático, semântico e operacional | schema fechado não é tratado como autorização ou policy | PRODUZIDO; AT-006 PARCIAL / AT-007 FORTE |
| `ES26-014` | matriz v1/v2 e corpus golden explicitam direção da compatibilidade | adição opcional não é declarada compatível para consumidor v1 estrito | PRODUZIDO; AT-008/009 FORTES |
| `ES26-015` | tempo, decimal, enum, UTF-8 e erro têm representação declarada | corpus Python testa boundary; equivalência API/CLI instalada ainda falta | PRODUZIDO; AT-011 FORTE, AT-010 PENDENTE |
| `ES26-016` | versão, depreciação e mudança incompatível são escolhidas por consumidor | policy de remoção requer janela, owner e telemetria | PRODUZIDO; AT-009 FORTE |

Aceite integrado: o slice prova schemas, schema/modelo coerentes, campo extra
recusado, v1/v2 declarados e preservação local de decimal/timezone/UTF-8. Não
prova ainda serialização e reason codes equivalentes entre API e CLI instalada; AT-010 permanece
pendente até B14. A presença do conteúdo não promove G3.

## Critérios do lote B05

| Competência | Evidência mínima planejada | Oráculo/limite | Estado |
|---|---|---|---|
| `ES26-017` | ownership de request, advisory, decision e auditoria é explícito | falha injetada não deixa filhos/estado parcial | PRODUZIDO; AT-012 FORTE |
| `ES26-018` | transação, isolamento local, lock e retry são separados | duas escritas têm vencedor e conflito observável | PRODUZIDO; AT-016 FORTE NO SQLITE LOCAL |
| `ES26-019` | chave, namespace e hash distinguem repetição de colisão | mesma intenção reutiliza; intenção diferente conflita | PRODUZIDO; AT-013/014 FORTES |
| `ES26-020` | índice atende predicado crítico e é conferido no plano | `EXPLAIN QUERY PLAN` registra busca indexada | PRODUZIDO; AT-017 FORTE NO SQLITE LOCAL |

Aceite integrado: AT-012–017 têm oráculos executados no SQLite local, incluindo
tenant isolation. A evidência não promove equivalência de lock, isolamento, DDL
ou plano para PostgreSQL e não prova efeitos distribuídos. G3 não é promovido.

## Critérios do lote B06

| Competência | Evidência mínima planejada | Oráculo/limite | Estado |
|---|---|---|---|
| `ES26-021` | seleção de sync/async/thread/processo parte do workload | batch local usa asyncio sem alegar recomendação universal | PRODUZIDO |
| `ES26-022` | timeout e cancelamento propagam após cleanup | timeout cancela operação possuída; cancelamento externo chega ao chamador | PRODUZIDO; AT-020/021 FORTES NO SLICE |
| `ES26-023` | TaskGroup dá ownership para consumidora | cleanup no `finally` é observado | PRODUZIDO |
| `ES26-024` | fila bounded limita admissão e rejeita overload | capacidade máxima e rejeição são verificadas | PRODUZIDO; AT-018/019 FORTES NO SLICE |

AT-022 permanece pendente até o corte de compatibilidade Python. O batch não prova
broker, rede, thread bloqueante ou capacidade de produção; G3 não é promovido.

## Estado dos 60 cenários

Os estados abaixo reproduzem o relatório do slice integrado, revisado junto da
execução do gate pelo orquestrador. Eles não são “verificado G3”: forte significa
evidência convincente no recorte atual; parcial significa que parte material do
oráculo ainda falta; pendente significa ausência de evidência suficiente.

| Estado | IDs | Quantidade |
|---|---|---:|
| **FORTE NO SLICE** | AT-002, AT-003, AT-006–045, AT-047, AT-049, AT-055–058 | 48 |
| **PARCIAL** | AT-001, AT-005, AT-060 | 3 |
| **PENDENTE** | AT-004, AT-046, AT-048, AT-050–054, AT-059 | 9 |
| **Total** | AT-001–060 | **60** |

### Visão por família

| Família | Forte | Parcial | Pendente |
|---|---|---|---|
| design e arquitetura · AT-001–005 | 002, 003 | 001, 005 | 004 |
| contratos e interoperabilidade · AT-006–011 | 006–011 | — | — |
| domínio e dados · AT-012–017 | 012–017 | — | — |
| concorrência e runtime · AT-018–022 | 018–022 | — | — |
| IA agnóstica · AT-023–028 | 023–028 | — | — |
| qualidade e segurança · AT-029–035 | 029–035 | — | — |
| operação, desempenho e entrega · AT-036–045 | 036–045 | — | — |
| papel sênior, requisitos e modularidade · AT-046–060 | 047, 049, 055–058 | 060 | 046, 048, 050–054, 059 |

## Pendências e limites reais

1. **Material:** B01–B15 estão no HTML; avaliação final segue o modelo de
   recuperação por bloco, sem rubrica formal por AT.
2. **Execução:** slice Python verde com 144 testes, corpus golden,
   diferencial e fixtures, corte API/CLI instalada; PG, broker, rede,
   provedor real, Windows e venv virgem seguem fora do recorte.
3. **Avaliação:** nenhum dos estados “forte” é promoção formal de AT; G3 exige os
   60 cenários, checkpoint, negativos, demonstração e rubrica integral.
4. **Portabilidade/certificação:** Windows/Linux/CI e revisão visual a 390 px,
   desktop e impressão ainda não foram fechados.
5. **Fronteira didática:** SQLite, fila local, fake e record-replay não provam
   PostgreSQL, broker, rede, sistema distribuído, cloud ou provedor real.

## Limites auditáveis

- Python 3.14 é canônico; a compreensão e a prática independem de outra stack.
- Nenhuma API, cloud, Docker, PostgreSQL, broker ou chamada de IA real é requisito.
- SQLite e fakes não provam comportamento distribuído.
- OTel, DORA, IA e supply chain exigem revalidação de fonte a cada 90 dias durante produção.
- Estado forte no slice não equivale a cenário verificado nem aprova G3.

## Próximo incremento

B07 fechado (C+L+D): teoria revisada, 9 oráculos verdes (49 na suite),
diagnóstico + recuperação/transferência, passo 9 no lab. Próximo:
**B08-C** (testes e testabilidade), liberado pelo DAG. Manter G2 parcial
e G3–G6 pendentes.

## Revisão de escopo — 12/09/2026

B14 foi redefinido para compatibilidade entre API Python e CLI instalada. AT-006 passa a PARCIAL: a evidência local anterior não demonstra a comparação revisada entre os dois caminhos. AT-010, AT-022 e AT-040 continuam PENDENTES com oráculos revisados na especificação v1.2. Os resultados registrados de 40 testes são históricos e não aprovam esses novos critérios.

**Superscrito em 14/09/2026 (M02A-E):** B14-L executou a comparação revisada — AT-006/010/022/040 promovidos a FORTE NO SLICE (acordo total em 22 entradas, inválidos com mesmos campos, 3 códigos distintos, API+CLI fora do checkout). Contagem histórica "40 testes" substituída por 144 na suite atual.

A tabela por família foi reconciliada com a lista de IDs: AT-055/056 já constavam como fortes no slice; a correção não representa nova execução. O HTML principal recebeu explicações diretas, remoção de clocks e navegação para retomada; nenhum gate é promovido por esta mudança.

## Revisão editorial — 12/09/2026

O HTML principal recebeu explicações independentes de outra stack, remoção de duração obrigatória, links por seção e aviso de prontidão. A navegação permite leitura e prática no ritmo do aluno. O verificador editorial examinou estrutura, destinos locais e âncoras; não executou laboratórios nem certificou fontes externas ou apresentação visual. Os resultados técnicos anteriores permanecem históricos; G6 da apresentação revisada continua pendente.

## Lote M02A-B07 — 14/09/2026 (C+L+D, protocolo econômico)
Teoria b7 direta (causalidade, falha parcial, trade-offs, retry+dedup, saga/quorum, fontes); lab `entrega.py`+`simulacao.py`+9 testes+evidência com seed/digest; gate 49 passed + wheel; diagnóstico + recuperação/transferência + passo 9. Correções registradas: `__import__`→import de topo; tipos mínimos. Sem gate. STATUS/PROGRESSO: só STATUS-fila (M11-E) nesta sessão; PROGRESSO intacto.

## Lote M02A-B08 — 14/09/2026 (C+L+D, protocolo econômico)
Teoria b8 direta (84 linhas; 8.7 diagnóstico e 8.8 recuperação vieram na C); lab test_properties.py + evidence (Hypothesis no lock, 16 casos, digest congelado); gate 65 passed + wheel; passo 10 no roteiro. Correção do orquestrador: `</section>` do b7 restaurado (insert do B08 o removera; check 0 erros após). Diagnóstico/recuperação do B08 já na C. Sem gate. PROGRESSO intacto.

## Lote M02A-B09 — 14/09/2026 (C+L+D, protocolo econômico)
Teoria b9 direta (9.7 diagnóstico e 9.8 recuperação inclusos); lab ameacas.py + 11 testes + evidence (gate 76 passed + wheel); passo 11 no roteiro. Sem gate. PROGRESSO intacto.

## Lote M02A-B10 — 14/09/2026 (C+L+D, protocolo econômico)
Teoria b10 direta (10.6 diagnóstico e 10.7 recuperação inclusos); lab slo.py + 13 testes + evidence (gate 89 passed + wheel); passo 12 no roteiro. Correções registradas: sli(()) nega com ValueError; amostra 19/1. Sem gate. PROGRESSO intacto.

## Lote M02A-B11 — 14/09/2026 (C+L+D, protocolo econômico)
Teoria b11 direta (11.6/11.7 inclusos); lab capacidade.py + 11 testes + evidence (gate 100 passed + wheel); passo 13 no roteiro. Divergências registradas: quantiles fatiado→mediana/ordem; set por consulta→frozenset; CacheVersionado estende buscar. Sem gate. PROGRESSO intacto.

## Lote M02A-B12 — 14/09/2026 (C+L+D, protocolo econômico)
Teoria b12 direta (12.6/12.7 inclusos); lab mudanca.py + 12 testes + evidence (gate 112 passed + wheel); passo 14 no roteiro. Divergências: fail-closed em domínios; import-scan por linha. Sem gate. PROGRESSO intacto.

## Lote M02A-B13 — 14/09/2026 (C+L+D, protocolo econômico)
Teoria b13 direta (13.6/13.7 inclusos); lab diagnostico.py + 14 testes + evidence (gate 126 passed + wheel); passo 15 no roteiro. Divergências: fail-closed em origem; PurePath cross-OS; wheel via zipfile+PYTHONPATH; admitir_pedido tipado. Sem gate. PROGRESSO intacto.

## Lote M02A-B14 — 14/09/2026 (C+L+D, protocolo econômico)
Teoria b14 direta (14.6/14.7 inclusos); lab compatibilidade.py + 14 testes + evidence (gate 140 passed + wheel); passo 16 no roteiro; âncora section-link corrigida pelo orquestrador. Divergências: interseção observável; serviço montado pela raiz; morte em filho Python; cancelamento da tarefa do filho. Sem adapter .NET (dotnet ausente). Sem gate. PROGRESSO intacto.

## Lote M02A-B15 — 14/09/2026 (C+L+D, protocolo econômico)
Teoria b15 direta (15.6/15.7 inclusos); lab test_revisao_gerado.py + 4 testes + evidence (gate 144 passed + wheel); passo 17 no roteiro. Correção de trace: AT-031 já verde desde B08-L (linha atualizada). Sem gate. PROGRESSO intacto.

## Lote M02A-E — 14/09/2026 (revisão terminal do módulo, sem estratégia de subagente para gates)
Matriz 60 ATs reconciliada (48 fortes, 3 parciais, 9 pendentes); fontes B01–B15 e recuperação por bloco verificadas; lab 144 passed + wheel. Decisão: **G1 APROVADO; G2/G4/G5 PARCIAIS (live/matrix bloqueados); G3/G6 PENDENTES** (rubrica formal por AT; QA visual). STATUS atualizado; PROGRESSO intacto.
