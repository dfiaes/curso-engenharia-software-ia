# Rastreabilidade — M02A

> Atualizado em 15/08/2026 · estado: **G0 aprovado; G1 em produção**

## Baseline aprovada

| Item | Quantidade | Fonte de verdade |
|---|---:|---|
| carga | 30 h | especificação §1.2 |
| blocos | 15 | especificação §5 |
| competências | 60 (`ES26-001`–`ES26-060`) | especificação §5 |
| cenários | 45 (`M02A-AT-001`–`045`) | especificação §6 |
| dimensões de rubrica | 8 | especificação §8 |
| gates | 7 (`G0`–`G6`) | especificação §7 |

## Estado dos gates

| Gate | Estado | Evidência |
|---|---|---|
| G0 — design | **APROVADO** | escopo, linguagem, produto, limites, competências, ATs, rubrica, fontes |
| G1 — material | EM PRODUÇÃO | ainda sem HTML |
| G2 — Python | PENDENTE | ainda sem laboratório |
| G3 — ponte .NET e contratos | PENDENTE | ainda sem laboratório/testes |
| G4 — resiliência/segurança/dados | PENDENTE | ainda sem testes |
| G5 — operação/distribuição | PENDENTE | ainda sem evidência |
| G6 — certificação | PENDENTE | ainda sem ATs/QA visual/cross-platform revisados |

## Rastreabilidade por bloco

| Bloco | Competências | ATs principais |
|---|---|---|
| B01 papel/risco/evidência | 001–004 | 001, 043 |
| B02 requisitos/arquitetura | 005–008 | 001, 004, 005 |
| B03 modularidade/domínio | 009–012 | 002, 003 |
| B04 contratos | 013–016 | 006–011 |
| B05 dados | 017–020 | 012–017 |
| B06 concorrência | 021–024 | 018–022 |
| B07 distribuídos | 025–028 | 013, 018–021 |
| B08 testes | 029–032 | 029–031 |
| B09 segurança | 033–036 | 025, 032–035 |
| B10 observabilidade/SRE | 037–040 | 033, 036, 044, 045 |
| B11 complexidade/performance/custo | 041–044 | 037, 038 |
| B12 legado/entrega | 045–048 | 039–043 |
| B13 Python sênior | 049–052 | 020, 021, 040–043 |
| B14 ponte .NET | 053–056 | 006, 010, 011, 022, 040 |
| B15 AI-native/liderança | 057–060 | 023–028, 031 |

## Limites auditáveis

- Python 3.14 é canônico; .NET é comparação limitada.
- Nenhuma API, cloud, Docker, PostgreSQL, broker ou chamada de IA real é requisito.
- SQLite e fakes não provam comportamento distribuído.
- OTel, DORA, IA e supply chain exigem revalidação de fonte a cada 90 dias durante produção.
- Nenhum cenário pode ser marcado verificado antes de comando, resultado e artefato de evidência revisados pelo orquestrador.

## Próximo incremento

Produzir o esqueleto HTML no padrão M00, o registro bibliográfico versionado e B01–B03; em paralelo lógico, criar apenas os contratos e fixtures mínimos necessários para que o texto use exemplos reais.
