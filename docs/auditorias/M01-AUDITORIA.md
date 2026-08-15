# Auditoria do M01 — SDD, harness engineering e paralelização

**Data-base:** 14/08/2026 · **Decisão:** REGENERAR COM APROVEITAMENTO ESTRUTURAL · **Próximo gate:** especificação G0

## 1. Baseline objetiva

| Artefato | Palavras visíveis | Blocos `<pre>` | “Resultado esperado” | Links externos |
|---|---:|---:|---:|---:|
| `M01.html` | 10.316 | 16 | 21 | 0 |
| `README.md` | guia curto | — | — | 2 |

O módulo tem boa sequência pedagógica e densidade suficiente. A regeneração não deve inflá-lo; deve corrigir absolutos, adicionar fontes, executar os exemplos e tornar a prática segura/cross-platform.

## 2. Estrutura que deve ser preservada

- problema → requisitos/especificação → plano → tarefas → implementação → verificação;
- não-objetivos, critérios observáveis e rastreabilidade;
- gates mecânicos próximos da alteração;
- unidade de trabalho pequena, retomável e com handoff;
- crítica ao loop autônomo sem controle explícito;
- isolamento com worktrees e nova verificação após integração;
- conflito semântico mesmo quando Git não detecta conflito textual;
- artefato `contract.md` e validador de estrutura como mini-projeto.

## 3. Achados bloqueantes

| ID | Severidade | Achado | Risco | Correção exigida |
|---|---|---|---|---|
| M01-AUD-01 | P0 | HTML sem fonte externa | claims de 2025/2026 e comandos versionáveis não são auditáveis | ligar afirmações a Spec Kit, HumanLayer, Git, Python/tooling e padrões |
| M01-AUD-02 | P0 | prática executa `git add -A` e commit no repositório do aluno | captura mudanças alheias/secrets e altera histórico sem escopo | usar fixture/lab próprio, checar status, stage explícito e nunca assumir branch |
| M01-AUD-03 | P0 | remoção de worktrees usa paths relativos fixos sem validação | pode remover worktree errada ou falhar em diretório com trabalho | resolver paths, listar, confirmar estado limpo e usar sandbox descartável |
| M01-AUD-04 | P1 | “código é saída derivada regenerável” é absoluto | legado, testes, migrações e integrações contêm verdade não capturada pela spec | reconciliar spec, código, testes e telemetria |
| M01-AUD-05 | P1 | “corrigir a spec, não o código” é regra absoluta | pode atrasar correção operacional e perpetuar spec errada | corrigir fonte da divergência e atualizar contrato + implementação no mesmo change set |
| M01-AUD-06 | P1 | 12-Factor Agents é tratado como padrão | é guia opinativo de practitioner, valioso mas não normativo | ensinar tese, limites, contrapontos e aplicação concreta |
| M01-AUD-07 | P1 | “context anxiety” antropomorfiza degradação | diagnóstico não observável substitui métricas | medir truncamento, passos, falhas, compactação e retomada |
| M01-AUD-08 | P1 | “outro agente” aparece como verificador independente | modelo, dados e prompts podem compartilhar falhas correlacionadas | priorizar compilador, schema, testes e revisão humana; declarar independência real |
| M01-AUD-09 | P1 | custo de defeito “~10x por estágio” sem fonte | falsa precisão histórica | remover multiplicador e medir feedback time/blast radius local |
| M01-AUD-10 | P1 | exemplos assumem Bash (`check.sh`, `mkdir -p`) | trilha principal é Windows/PowerShell e Python | runner Python canônico e wrappers opcionais Bash/PowerShell |
| M01-AUD-11 | P1 | interseção vazia de arquivos autoriza paralelismo | contratos, schema, dependências e comportamento ainda colidem | mapear write/read sets, contratos e recursos compartilhados; usar waves |
| M01-AUD-12 | P1 | Spec Kit descrito com comandos/números antigos | documentação atual tem 35 integrações e invocação variável | ensinar CLI/fluxo atual, generic integration e versão/data |
| M01-AUD-13 | P1 | segurança do Spec Kit não aparece | workflow pode executar shell com privilégios locais; `requires` não é sandbox | threat model, revisão e allowlist antes de workflow/extensão |
| M01-AUD-14 | P2 | skills presas a `.claude/skills` | contradiz M00 e Agent Skills aberta | diretório canônico de skill + adapters |
| M01-AUD-15 | P2 | exit code 0 é prova de correção | prova execução do checker, não adequação do requisito | resultado semântico, teste negativo e cobertura rastreada |
| M01-AUD-16 | P2 | pre-fetch não é conciliado com just-in-time | pré-carga indiscriminada aumenta custo e ruído | pré-carregar dependência certa/pequena; recuperar descoberta incerta sob demanda |

## 4. Lacunas para o sênior de 2026

1. **Spec drift bidirecional:** detectar spec→código e código/produção→spec.
2. **Invariantes e exemplos:** requisito, exemplos, schema, property tests e observabilidade como camadas complementares.
3. **Proveniência:** quem mudou requisito, evidência e versão consumida pelo agente.
4. **Segurança do harness:** scripts, templates e extensões são supply chain; shell roda com privilégios do usuário.
5. **Convergência:** limite de iterações, orçamento, estados de falha e handoff.
6. **Reprodutibilidade:** Python 3.14, lockfile, ambiente limpo, comandos cross-platform e saídas reais.
7. **Avaliação da decomposição:** conflito, retrabalho, integração e tempo de revisão.
8. **Controle de concorrência:** write/read sets, dependências, ownership e integração ordenada.
9. **Artefato executável:** JSON Schema ou parser tipado para contract/spec/plan.
10. **Uso crítico de frameworks:** Spec Kit é implementação de referência, não definição universal de SDD.

## 5. Atualizações factuais confirmadas

- A documentação oficial do Spec Kit, atualizada em julho de 2026, descreve `Spec → Plan → Tasks → Implement`, 35 integrações e integração `generic`; a invocação varia por agente (`/speckit.*`, `$speckit-*` etc.).
- Workflows atuais incluem gates, pausa/retomada, fan-out/fan-in e shell steps. A própria documentação alerta que não há capability sandbox e que `requires` é apenas precondição declarativa.
- A lista original do 12-Factor Agents possui doze fatores e classifica pre-fetch como “Factor 13” em honorable mentions. O repositório é guia comunitário/opinativo.
- O manual do Git confirma worktrees ligadas, metadata compartilhada e comandos `add/list/remove/prune/repair`; configurações e refs possuem partes comuns e específicas.
- Ruff declara compatibilidade com Python 3.14; a documentação consultada do mypy identifica versão 2.3.0. O lab deve fixar faixas e revalidá-las.

## 6. Fontes-base da regeneração

### Padrões e documentação primária

- [GitHub Spec Kit](https://github.github.com/spec-kit/) e [Agentic SDD](https://github.github.com/spec-kit/reference/agentic-sdd.html), atualizados em 2026;
- [Spec Kit workflows](https://github.com/github/spec-kit/blob/main/docs/reference/workflows.md), inclusive alerta de ausência de sandbox;
- [Git worktree](https://git-scm.com/docs/git-worktree.html), manual oficial;
- [Agent Skills Specification](https://agentskills.io/specification), formato portátil;
- [JSON Schema 2020-12](https://json-schema.org/draft/2020-12), validação de artefatos;
- [uv](https://docs.astral.sh/uv/), [Ruff](https://docs.astral.sh/ruff/), [mypy](https://mypy.readthedocs.io/en/stable/) e [pytest](https://docs.pytest.org/en/stable/), documentação oficial;
- [NIST SSDF 1.1](https://csrc.nist.gov/pubs/sp/800/218/final) e [SLSA 1.2](https://slsa.dev/spec/v1.2/), integridade do processo/supply chain;
- [DORA 2025](https://dora.dev/research/2025/dora-report/), fluxo sociotécnico assistido por IA.

### Material de practitioner, com rótulo explícito

- [HumanLayer — 12-Factor Agents](https://github.com/humanlayer/12-factor-agents), fonte original dos fatores, usada criticamente e não como norma.

## 7. Decisão

O M01 não deve ser descartado: sua arquitetura didática é forte. Também não deve ser promovido por revisão cosmética. A próxima unidade deve criar `docs/especificacoes/M01-ESPECIFICACAO.md`, um lab isolado/cross-platform e uma matriz que prove drift, gate positivo/negativo, retomada, workflow sem autoridade implícita, worktrees descartáveis, conflito semântico injetado e portabilidade.

Até lá, M01 fica `AUDITADO / G0 PENDENTE`, não `VERIFICADO`.

