# Especificação do M01 — SDD, harness engineering e execução paralela segura

**Versão:** 1.0 · **Data-base:** 14/08/2026 · **Estado:** G0 APROVADO · **Carga:** 5 blocos / 10h

## 1. Resultado do módulo

Ao concluir o M01, o aluno deve transformar intenção em mudanças pequenas, rastreáveis e verificáveis, usando IA sem entregar ao modelo a autoridade do processo. A aprovação exige demonstrar que ele:

- separa problema, requisitos, design, plano, tarefa, código e evidência;
- detecta drift em ambas as direções e reconcilia artefatos no mesmo change set;
- implementa gates determinísticos com resultados positivos e negativos;
- limita iterações, custo, escopo, capabilities e estados de falha;
- usa criticamente Spec Kit e 12-Factor Agents, distinguindo framework, padrão e opinião;
- cria worktrees somente dentro de fixture descartável e integra por waves;
- detecta conflito semântico mesmo quando o merge textual é limpo;
- produz kit SDD portátil e a primeira fatia do Capstone.

## 2. Pré-requisitos

- M00: task contract, `AGENTS.md`, Agent Skills, menor privilégio e ciclo de evidência.
- Git básico: status, diff, branch, commit e merge. O lab ensina somente worktrees e integração segura.
- Python é guiado; M02 aprofundará a linguagem.

## 3. Fora de escopo

- tratar Spec Kit como metodologia universal;
- afirmar que todo bug exige alterar spec antes de mitigar produção;
- executar agentes em repositório corporativo real durante o laboratório;
- medir produtividade organizacional com uma única tarefa;
- ensinar CI/CD completo, supply chain completa ou eval estatística, temas de LT04/M06;
- supor que isolamento de arquivos elimina conflito semântico.

## 4. Arquitetura do fluxo

```text
problema/evidência
       │
       ▼
intent ──► requisitos + não-objetivos + invariantes + exemplos
       │                         │
       ▼                         ▼
design/decisões ─────────► critérios verificáveis
       │                         │
       ▼                         ▼
plan/task contract ──────► write/read sets + capabilities + orçamento
       │
       ├── execução sequencial ─► gate local ─┐
       │                                      │
       └── waves/worktrees ─────► gate worker ├─► integração ─► gate global
                                              │
                         diff + logs + testes ┘
                                      │
                                      ▼
                       reconciliação spec/código/evidência
```

### Regras inegociáveis

1. Spec não substitui descoberta; começa por evidência do sistema existente.
2. Código não é descartável quando contém comportamento não capturado por contrato.
3. Drift pode revelar bug no código, na spec, em ambos ou mudança legítima ainda não documentada.
4. Exit code é sinal necessário, não prova semântica suficiente.
5. Workflow baixado pode executar código; template/extensão é dependência de supply chain.
6. Nenhum exercício usa `git add -A`, branch presumida ou limpeza fora de sandbox validado.
7. Worktree isola diretório de trabalho, não banco, porta, cache, dependência nem contrato.
8. Um segundo LLM não é verificador independente por definição.

## 5. Roteiro

### Bloco 1 · Intenção, especificação e drift bidirecional

**Competências:** `M01-B01-C01..05`.

- separar problema, outcome, requisito funcional, qualidade, não-objetivo, design e plano;
- escrever critérios com exemplo, contraexemplo e propriedade verificável;
- pesquisar o sistema antes de especificar;
- rastrear requisito → decisão → tarefa → teste;
- detectar e classificar drift spec↔código.

**Prática:** especificar um changelog de repositório; executar scanner de drift em fixtures com quatro estados: consistente, spec antiga, código incorreto e divergência ambígua.

**Resultado esperado:** o scanner não “escolhe a verdade”; reporta evidência, classificação e decisão humana necessária.

### Bloco 2 · Harness e gates que produzem evidência

**Competências:** `M01-B02-C01..05`.

- distinguir prompt, contexto, policy, gate e workflow runner;
- construir runner Python cross-platform para Ruff, mypy e testes;
- validar estrutura de artefato por parser tipado/JSON Schema;
- injetar falha e provar que o gate bloqueia avanço;
- registrar versão, duração, stdout/stderr resumido e exit code sem hardcode.

**Prática:** `python -m sdd_lab check <feature>` executa gates com timeout e lista de argumentos, sem shell implícito.

**Resultado esperado:** fixture válida passa; requisito vago, teste ausente, arquivo fora do write set e comando expirado falham com códigos distintos.

### Bloco 3 · 12-Factor Agents sob análise crítica

**Competências:** `M01-B03-C01..05`.

- explicar os doze fatores como guia de practitioner, não norma;
- mapear cada fator a estado, controle, ferramenta ou decisão de arquitetura;
- comparar pre-fetch certo/pequeno com retrieval just-in-time;
- modelar launch/pause/resume e agente como reducer com estado externo;
- definir limites de iteração, orçamento e escalonamento humano.

**Prática:** auditar um workflow e produzir matriz `fator → evidência → lacuna → controle`, incluindo ao menos dois contrapontos.

**Resultado esperado:** nenhuma linha recebe “conforme” sem artefato ou teste; fator 13 é rotulado honorable mention.

### Bloco 4 · Decomposição, worktrees e integração por waves

**Competências:** `M01-B04-C01..06`.

- diferenciar concorrência, paralelismo e independência;
- declarar read/write sets, contratos e recursos compartilhados;
- criar/remover worktrees em diretório temporário validado;
- rodar gate por worker e gate global após merge;
- detectar conflito textual e conflito semântico;
- medir speedup, coordenação, retrabalho e tempo de revisão.

**Prática:** dois workers alteram arquivos disjuntos; uma falha semeada muda o mesmo contrato indireto e só aparece na integração.

**Resultado esperado:** merges textuais passam, teste de contrato global falha, causa é diagnosticada e integração é replanejada sem apagar trabalho.

### Bloco 5 · Kit SDD portátil e fatia do Capstone

**Competências:** `M01-B05-C01..06`.

- produzir skills portáteis de requisitos, spec e plan;
- comparar kit próprio com fluxo atual do Spec Kit;
- validar artefatos, proveniência e links de rastreabilidade;
- proteger execução de templates/workflows não confiáveis;
- gerar primeira fatia vertical do Capstone com critérios executáveis;
- produzir handoff de retomada.

**Prática:** kit em Agent Skills + adapter por harness + `contract.schema.json` + runner; Spec Kit é executado apenas em fixture após inspeção dos arquivos gerados.

**Resultado esperado:** o mesmo contrato passa em dois adapters; nenhum adapter contém regra de domínio duplicada.

## 6. Modelo de artefatos

```text
docs/spec/NNN-feature/
├── intent.md          # problema, outcome, evidência e não-objetivos
├── requirements.md    # RF/RQ, invariantes, exemplos e critérios
├── design.md          # decisões e consequências; links para ADRs
├── plan.md            # tarefas, dependências, read/write sets e gates
├── trace.csv          # requisito → decisão → tarefa → teste
└── evidence/
    └── run.json       # comando tokenizado, versão, duração, exit, resumo

skills/
├── requirements-writer/SKILL.md
├── spec-reviewer/SKILL.md
└── plan-writer/SKILL.md

lab/
├── pyproject.toml
├── src/sdd_lab/
├── tests/
└── fixtures/repos/    # repositórios Git descartáveis
```

## 7. Cenários de aceitação

| ID | Cenário | Resultado obrigatório |
|---|---|---|
| M01-AT-001 | requisitos válidos | schema/parser aceita e trace cobre todos os RFs |
| M01-AT-002 | requisito vago | falha com ID e sugestão, sem reescrever silenciosamente |
| M01-AT-003 | não-objetivos ausentes | gate nega conclusão |
| M01-AT-004 | spec antiga | drift report cita divergência e evidência |
| M01-AT-005 | código incorreto | teste comportamental falha e report não culpa spec automaticamente |
| M01-AT-006 | divergência ambígua | estado `decision_required`, sem mutação |
| M01-AT-007 | gate feliz | Ruff, mypy e testes passam com versões registradas |
| M01-AT-008 | type error semeado | mypy bloqueia e evidencia arquivo/linha |
| M01-AT-009 | teste que nunca falha | mutation/controle negativo detecta gate fraco |
| M01-AT-010 | comando excede timeout | runner encerra filho e retorna código específico |
| M01-AT-011 | shell string | contrato rejeita; requer argv tokenizado |
| M01-AT-012 | workflow externo com shell | execução negada até revisão/allowlist |
| M01-AT-013 | pause/resume | retoma do último estado confirmado sem repetir efeito |
| M01-AT-014 | limite de iteração | escala para humano com handoff compacto |
| M01-AT-015 | worktrees seguras | paths resolvidos dentro de sandbox temporário |
| M01-AT-016 | arquivo tocado fora do write set | gate do worker falha |
| M01-AT-017 | merge textual limpo | duas branches integram sem conflito Git |
| M01-AT-018 | conflito semântico | gate global falha por contrato compartilhado |
| M01-AT-019 | cleanup seguro | lista worktrees, confirma limpeza e remove somente fixtures |
| M01-AT-020 | portabilidade | dois adapters executam a mesma suite/contrato |
| M01-AT-021 | Spec Kit atual | comandos/formas de invocação são descobertos, não presumidos |
| M01-AT-022 | fatia Capstone | intent→teste rastreado e handoff reproduzível |

## 8. Fontes e risco

| ID | Fonte | Uso | Risco de obsolescência |
|---|---|---|---|
| SRC-M01-01 | [Spec Kit](https://github.github.com/spec-kit/) | implementação de referência SDD | alto |
| SRC-M01-02 | [Agentic SDD](https://github.github.com/spec-kit/reference/agentic-sdd.html) | sequência e invocação atual | alto |
| SRC-M01-03 | [Spec Kit workflows](https://github.github.com/spec-kit/reference/workflows.html) | gates/fan-out/segurança | alto |
| SRC-M01-04 | [12-Factor Agents](https://github.com/humanlayer/12-factor-agents) | guia de practitioner analisado criticamente | médio |
| SRC-M01-05 | [Git worktree](https://git-scm.com/docs/git-worktree.html) | semântica e comandos Git | médio |
| SRC-M01-06 | [Agent Skills](https://agentskills.io/specification) | skills portáteis | médio |
| SRC-M01-07 | [JSON Schema 2020-12](https://json-schema.org/draft/2020-12) | contratos de artefato | baixo |
| SRC-M01-08 | [uv](https://docs.astral.sh/uv/) | ambiente e lockfile | médio |
| SRC-M01-09 | [Ruff](https://docs.astral.sh/ruff/) | lint/format Python 3.14 | médio |
| SRC-M01-10 | [mypy](https://mypy.readthedocs.io/en/stable/) | type checking | médio |
| SRC-M01-11 | [pytest](https://docs.pytest.org/en/stable/) | testes | médio |
| SRC-M01-12 | [NIST SSDF 1.1](https://csrc.nist.gov/pubs/sp/800/218/final) | processo seguro | baixo |
| SRC-M01-13 | [SLSA 1.2](https://slsa.dev/spec/v1.2/) | proveniência/supply chain | baixo |
| SRC-M01-14 | [DORA 2025](https://dora.dev/research/2025/dora-report/) | sistema sociotécnico | médio |

## 9. Gate G0

- [x] resultados observáveis e limites definidos;
- [x] cinco blocos e carga preservados;
- [x] 22 cenários positivos, negativos e de falha;
- [x] lab isolado/cross-platform especificado;
- [x] fontes normativas, oficiais e practitioner separadas;
- [x] segurança de Git e supply chain incluída;
- [x] portabilidade e integração curricular definidas.

**Decisão:** G0 aprovado. M01 entra em produção de lab e regeneração do HTML. O material atual permanece `REFAZER COM APROVEITAMENTO ESTRUTURAL` até G1–G6.
