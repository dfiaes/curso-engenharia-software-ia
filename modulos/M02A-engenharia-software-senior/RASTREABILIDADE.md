# Rastreabilidade — M02A · Engenharia de Software Sênior em 2026

> Atualizado em 15/08/2026 · estado: **G0 aprovado; G1 em produção; G2 parcial**
> Fonte normativa: [`M02A-ESPECIFICACAO.md`](../../docs/especificacoes/M02A-ESPECIFICACAO.md) v1.1

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
| G0 — design | **APROVADO** | especificação v1.1: escopo, linguagem, produto, limites, 60 competências, 60 ATs, rubrica e fontes |
| G1 — material | EM PRODUÇÃO | HTML com B01+B02: 4.564 palavras visíveis, 31 `code`, 14 fontes distintas; B03–B15 ausentes |
| G2 — execução | **PARCIAL** | orquestrador executou gate offline: Ruff format/lint OK, mypy strict 29 arquivos, pytest 34 passed, wheel inspecionado e lock OK; slice não cobre o módulo inteiro |
| G3 — avaliação | PENDENTE | matriz possui evidência inicial, mas 60 ATs, checkpoint, demonstrações e rubrica integral não foram executados |
| G4 — portabilidade | PENDENTE | Python canônico está separado; corte .NET, corpus diferencial e matriz de ambientes permanecem pendentes |
| G5 — produção | PENDENTE | faltam os controles e evidências integrais de dados, concorrência, telemetria, SLO, runbook e instalação limpa |
| G6 — editorial/certificação | PENDENTE | estrutura/links HTML passaram checagem estática; QA visual 390 px/desktop/impressão e Windows/Linux/CI pendentes |

Comando revisado pelo orquestrador no diretório `lab/`:
`uv run --locked --offline python tools/gate.py all`. A validação de lock também passou
offline. Esses resultados sustentam apenas o slice atual.

## Rastreabilidade por bloco

| Bloco | Competências | Cenários principais | Saída planejada | Estado |
|---|---|---|---|---|
| B01 · papel/risco/evidência | `ES26-001`–`004` | AT-046–050; cruza AT-001/049 | intent, stakeholders e riscos | MATERIAL PRODUZIDO; EVIDÊNCIA MISTA |
| B02 · requisitos/decisões | `ES26-005`–`008` | AT-051–054; cruza AT-001/004/005 | P0/P1, quality scenarios, C4 e ADR-0001 | MATERIAL PRODUZIDO; EVIDÊNCIA PENDENTE/PARCIAL |
| B03 · modularidade/domínio | `ES26-009`–`012` | AT-055–060; cruza AT-002/003/005 | hexagonal mínima e dependency gate | MATERIAL PENDENTE; SLICE PARCIAL |
| B04 · contratos | `ES26-013`–`016` | AT-006–011 | schemas v1/v2 e corpus golden | PENDENTE |
| B05 · dados | `ES26-017`–`020` | AT-012–017 | migrations, transação, tenant e query plan | PENDENTE |
| B06 · concorrência | `ES26-021`–`024` | AT-018–022 | batch bounded, cancelamento e overload | PENDENTE |
| B07 · distribuídos | `ES26-025`–`028` | AT-013, AT-018–021 | simulações determinísticas com limites | PENDENTE |
| B08 · testes | `ES26-029`–`032` | AT-029–031 | property, mutation e differential tests | PENDENTE |
| B09 · segurança | `ES26-033`–`036` | AT-025, AT-032–035 | threat model e adversariais | PENDENTE |
| B10 · observabilidade/SRE | `ES26-037`–`040` | AT-033, AT-036, AT-044–045 | trace, SLI/SLO, runbook e incidente | PENDENTE |
| B11 · complexidade/performance/custo | `ES26-041`–`044` | AT-037–038 | workload, amostras e decisão | PENDENTE |
| B12 · legado/entrega | `ES26-045`–`048` | AT-039–043 | mudança incremental, gate e rollback | PENDENTE |
| B13 · Python sênior | `ES26-049`–`052` | AT-020–021, AT-040–043 | produto Python, wheel e diagnóstico | PENDENTE |
| B14 · ponte .NET | `ES26-053`–`056` | AT-006, AT-010–011, AT-022, AT-040 | corte comparativo e differential corpus | PENDENTE |
| B15 · AI-native/liderança | `ES26-057`–`060` | AT-023–028, AT-031 | record-replay, eval, revisão e defesa | PENDENTE; SLICE COM EVIDÊNCIA FORTE EM AT-023–028 |

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
| `ES26-009` | grafo/gate mede dependências e ciclos | mutação cria violação que o gate rejeita | MATERIAL PENDENTE; AT-002/003 FORTES |
| `ES26-010` | decisão usa SOLID como heurística | contraponto demonstra custo/limite da heurística | MATERIAL PENDENTE; AT-059 PENDENTE |
| `ES26-011` | domínio, aplicação, portas e adapters delimitados | domínio importa sem adapters e só composition root liga concretos | MATERIAL PENDENTE; AT-057/058 FORTES, AT-055 PARCIAL |
| `ES26-012` | decisão compara custo da abstração à mudança esperada | abstração sem variação/risco exige ADR ou remoção | MATERIAL PENDENTE; AT-059 PENDENTE, AT-060 PARCIAL |

Aceite integrado: o slice sustenta AT-002, AT-003, AT-057 e AT-058; AT-055 e
AT-060 são parciais; AT-056 e AT-059 permanecem pendentes. B03 não está
produzido no HTML e, portanto, não pode ser promovido como bloco.

## Fontes para B01–B03

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

`MAPEADA EM G0` significa fonte selecionada para sustentar o bloco. O HTML de
B01+B02 contém 14 fontes externas distintas; a revisão por claim e a cobertura
de B03–B15 continuam necessárias. Esta tabela não aprova G1.

## Estado dos 60 cenários

Os estados abaixo reproduzem o relatório do slice integrado, revisado junto da
execução do gate pelo orquestrador. Eles não são “verificado G3”: forte significa
evidência convincente no recorte atual; parcial significa que parte material do
oráculo ainda falta; pendente significa ausência de evidência suficiente.

| Estado | IDs | Quantidade |
|---|---|---:|
| **FORTE NO SLICE** | AT-002, AT-003, AT-006–009, AT-011–015, AT-023–028, AT-047, AT-049, AT-057–058 | 21 |
| **PARCIAL** | AT-001, AT-005, AT-055, AT-060 | 4 |
| **PENDENTE** | AT-004, AT-010, AT-016–022, AT-029–046, AT-048, AT-050–054, AT-056, AT-059 | 35 |
| **Total** | AT-001–060 | **60** |

### Visão por família

| Família | Forte | Parcial | Pendente |
|---|---|---|---|
| design e arquitetura · AT-001–005 | 002, 003 | 001, 005 | 004 |
| contratos e interoperabilidade · AT-006–011 | 006–009, 011 | — | 010 |
| domínio e dados · AT-012–017 | 012–015 | — | 016, 017 |
| concorrência e runtime · AT-018–022 | — | — | 018–022 |
| IA agnóstica · AT-023–028 | 023–028 | — | — |
| qualidade e segurança · AT-029–035 | — | — | 029–035 |
| operação, desempenho e entrega · AT-036–045 | — | — | 036–045 |
| papel sênior, requisitos e modularidade · AT-046–060 | 047, 049, 057, 058 | 055, 060 | 046, 048, 050–054, 056, 059 |

## Pendências e limites reais

1. **Material:** apenas B01 e B02 estão no HTML; B03–B15 e a avaliação final
   permanecem pendentes.
2. **Execução:** o slice Python está verde, mas G2 exige o corpus e o módulo
   completos, inclusive ponte .NET quando aplicável.
3. **Avaliação:** nenhum dos estados “forte” é promoção formal de AT; G3 exige os
   60 cenários, checkpoint, negativos, demonstração e rubrica integral.
4. **Portabilidade/certificação:** Windows/Linux/CI e revisão visual a 390 px,
   desktop e impressão ainda não foram fechados.
5. **Fronteira didática:** SQLite, fila local, fake e record-replay não provam
   PostgreSQL, broker, rede, sistema distribuído, cloud ou provedor real.

## Limites auditáveis

- Python 3.14 é canônico; .NET é comparação limitada.
- Nenhuma API, cloud, Docker, PostgreSQL, broker ou chamada de IA real é requisito.
- SQLite e fakes não provam comportamento distribuído.
- OTel, DORA, IA e supply chain exigem revalidação de fonte a cada 90 dias durante produção.
- Estado forte no slice não equivale a cenário verificado nem aprova G3.

## Próximo incremento

Produzir B03 no padrão composto e fechar os cenários dedicados AT-055–060 sem
regredir o slice verde. Em seguida, continuar B04–B15 e ampliar o laboratório
por dependência conceitual. Manter G2 parcial e G3–G6 pendentes até que seus
critérios completos tenham evidência revisada.
