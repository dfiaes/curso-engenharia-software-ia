# M02A — Engenharia de Software Sênior em 2026

> **Estado editorial:** G0 aprovado; G1 em produção com B01 e B02 produzidos
> **Carga:** 15 blocos de 2 horas — 30 horas
> **Linguagem canônica:** Python 3.14
> **Ponte comparativa:** .NET 10, limitada a um corte vertical

Este módulo liga a fluência em Python do M02 à construção de sistemas seguros,
evolutivos e operáveis. O público é um desenvolvedor experiente vindo de
.NET/C#, mas o destino é engenharia Python e AI-native, não uma nova trilha de
plataforma.

Cada bloco deve funcionar como material de estudo autossuficiente: problema,
modelo mental, decisão, implementação Python, falha semeada, evidência,
transferência, leitura primária e avaliação por cenário. O HTML já materializa
B01 e B02; B03–B15 ainda não foram produzidos. O laboratório possui um corte
vertical Python executável, mas ainda não representa o módulo completo.

## Decisão de linguagem

Python é a implementação normativa. .NET 10 aparece somente em um corte
vertical comparativo para tornar diferenças de runtime, tipos, DI, cancelamento
e distribuição observáveis. Não há trilha paralela nem exigência de dominar
.NET.

## Produto integrador

O laboratório `work-intake` é um monólito modular local de triagem de
solicitações de trabalho assistida por IA. A política determinística decide; um
`Advisor` agnóstico apenas recomenda e nunca amplia privilégio ou revoga uma
proibição. O corte atual roda offline e não depende de provedor fechado.

## Mapa dos 15 blocos

| Bloco | Foco | Competências | Prática aprovada em G0 |
|---|---|---|---|
| B01 | papel sênior, produto, risco e evidência | `ES26-001`–`004` | intent, stakeholders e registro de riscos |
| B02 | requisitos, atributos de qualidade e decisões | `ES26-005`–`008` | requisitos P0/P1, cenários, C4 e ADR-0001 |
| B03 | modularidade, acoplamento e domínio | `ES26-009`–`012` | hexagonal mínima e gate de dependências |
| B04 | contratos, compatibilidade e interoperabilidade | `ES26-013`–`016` | corpus golden Python/.NET |
| B05 | dados, transações e evolução de schema | `ES26-017`–`020` | migrations locais, rollback, tenant e query plan |
| B06 | runtime, concorrência e backpressure | `ES26-021`–`024` | batch limitado e comparação focal com .NET |
| B07 | fundamentos de sistemas distribuídos | `ES26-025`–`028` | simulações determinísticas e limites explícitos |
| B08 | estratégia de testes e testabilidade | `ES26-029`–`032` | property, mutation e differential tests |
| B09 | Secure SDLC e threat modeling | `ES26-033`–`036` | threat model e fixtures adversariais |
| B10 | observabilidade, confiabilidade e incidentes | `ES26-037`–`040` | trace, SLI/SLO, runbook e incidente |
| B11 | complexidade, performance e custo | `ES26-041`–`044` | experimento com amostras e sem ranking universal |
| B12 | Git, integração, entrega e reversibilidade | `ES26-045`–`048` | modernização incremental e rollback de policy |
| B13 | Python sênior aplicado | `ES26-049`–`052` | produto Python, wheel e diagnóstico |
| B14 | ponte moderna .NET → Python | `ES26-053`–`056` | corte .NET limitado e differential test |
| B15 | engenharia AI-native e liderança técnica | `ES26-057`–`060` | record-replay, eval, revisão e defesa final |

## Primeiro incremento editorial: B01–B03

O primeiro lote cobre B01–B03. B01 e B02 possuem material no HTML; B03 ainda
está pendente editorialmente. A execução do slice sustenta parte dos cenários,
mas não fecha G1, G2 ou qualquer bloco isoladamente.

### B01 — critérios

- distinguir output, outcome, impacto e restrição em um caso concreto;
- priorizar riscos por objetivo, incerteza/evidência, impacto, detectabilidade,
  horizonte e reversibilidade, sem converter escala ordinal em probabilidade;
- representar stakeholders e efeitos sociotécnicos, não apenas componentes;
- registrar pelo menos uma alegação como
  `claim → método → evidência → limitação`;
- ligar requisito P0, método e evidência sem fabricar resultado de execução.

### B02 — critérios

- separar necessidade, requisito, restrição e solução proposta;
- escrever cenários mensuráveis de atributos de qualidade, incluindo
  acessibilidade e inclusão;
- produzir C4 mínimo coerente com a arquitetura planejada;
- registrar ADR-0001 com contexto, alternativas, decisão, consequências e
  condição de revisão;
- preservar histórico e sucessão de uma decisão substituída.

### B03 — critérios

- justificar limites entre domínio, aplicação, portas e adapters;
- detectar import indevido de adapter pelo domínio e ciclo entre módulos;
- usar SOLID como heurística, expondo um caso em que a abstração custa mais que
  a mudança esperada;
- executar um controle negativo que prove a sensibilidade do gate de
  dependências;
- relacionar a estrutura implementada ao C4 e ao ADR, sem diagrama decorativo.

## Estado verificável

| Artefato | Estado em 15/08/2026 |
|---|---|
| especificação v1.1 | G0 aprovado: 15 blocos, 60 competências e 60 ATs |
| HTML de estudo | B01 e B02 produzidos; B03–B15 ausentes |
| métricas estruturais do HTML | 4.564 palavras visíveis, 31 tags `code`, 14 fontes externas distintas, 5/5 seções e 27/27 `div`s balanceadas, 0 links internos quebrados |
| revisão visual | pendente; nenhuma aprovação de mobile, desktop ou impressão |
| laboratório `work-intake` | slice Python executável e offline; módulo incompleto |
| gate local executado pelo orquestrador | `uv run --locked --offline python tools/gate.py all` |
| evidência do slice | Ruff format/lint OK; mypy strict em 29 arquivos; pytest 34 passed; wheel inspecionado; lock validado offline |
| G2 | parcial; slice verde, mas execução integral do módulo ausente |
| G3–G6 | pendentes |

G1 permanece **em produção**, não aprovado. G2 é **parcial**: os resultados
acima foram executados e revistos, mas não comprovam a ponte .NET, todos os 60
cenários, Windows/Linux/CI, desempenho, operação ou certificação editorial.

## Documentos

- [Especificação normativa](../../docs/especificacoes/M02A-ESPECIFICACAO.md)
- [Rastreabilidade](RASTREABILIDADE.md)
- [Padrão composto de qualidade](../../docs/PADRAO-QUALIDADE-TECNICA-DIDATICA.md)

Não considere G1 ou G2 aprovados. A rastreabilidade separa evidência forte no
slice, cobertura parcial e cenários ainda pendentes.
