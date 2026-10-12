# Kit de arranque para trabalhar com agentes

Conjunto de arquivos para copiar para qualquer projeto e conduzir o ciclo **intenção → spec → plano → implementação → verificação → PR → CI/CD → operação**, com a documentação sempre atualizada. Agnóstico de ferramenta: funciona com Cursor, Codex, OpenCode, Claude Code ou um agente próprio. O passo a passo didático está na [Trilha rápida](../trilha-rapida/TR.html).

## O que vem no kit (`template/`)

| Arquivo | Para quê |
|---|---|
| `AGENTS.md` | Fonte única de instruções (comandos, fluxo, limites). `CLAUDE.md` e `.cursor/rules/projeto.mdc` só apontam para ele. |
| `REVIEW.md` | Roteiro de revisão para humano ou agente revisor (sessão separada). |
| `docs/{intent,specs,plans,adr,runbooks}/_modelo.md` | Modelos dos artefatos versionados de cada etapa. |
| `.github/pull_request_template.md`, `CODEOWNERS` | PR com checklist; donos obrigatórios em caminhos sensíveis. |
| `.github/workflows/ci.yml`, `deploy.yml` | CI (`make check`) e esteira dev → cert → prod com environments e OIDC Azure; comentários para runner self-hosted on-premise. |
| `azure-pipelines.yml` | Equivalente para Azure DevOps. |
| `Makefile` | `make check` = lint + testes + checagens de doc e de hooks. Troque os comandos de exemplo pelos da sua stack. |
| `scripts/hooks/` | Bloqueio de caminhos protegidos, bloqueio de edição de testes em `fix/`, busca de segredos no diff, checagem de docs/drift. Usados pelo pre-commit e pelo CI. |
| `.pre-commit-config.yaml` | Liga os hooks localmente (`pip install pre-commit && pre-commit install`). |
| `jira/historia.md`, `jira/bug.md` | Modelos de ticket com o vínculo ao repositório. |
| `.agents/commands/`, `.agents/skills/` | Fonte única de comandos (`/nova-feature`, `/corrigir-bug`, `/atualizar-docs`) e de skills (`gerar-teste-playwright`). `--tools` copia para o formato de cada ferramenta. |
| `.cursor/mcp.json`, `.mcp.json`, `opencode.json`, `docs/agentes/codex-config.toml` | Configs de exemplo de MCP (Playwright e Atlassian/Jira) para Cursor, Claude Code, OpenCode e Codex. Sem segredos: OAuth ou variável de ambiente. |
| `tests/e2e/exemplo.spec.ts` | Teste Playwright mínimo, modelo para os testes gerados pela skill. |
| `evals/` | Evals agnósticos de agente e modelo (só Python 3.11+): casos TOML com verificação objetiva, variantes (Claude Code, Codex, OpenCode, Cursor, API própria), pass^k, custo por sucesso, McNemar e modo `--skill-ab`. Exemplo executável sem custo. Veja `evals/README.md`. |
| `prompts/` | Prompts agnósticos: onboarding de repo existente, nova feature, corrigir bug, módulo grande, atualizar docs, revisar PR. |

## Projeto novo

```bash
git init meu-projeto && cd meu-projeto
python3 /caminho/do/curso/kit/bootstrap.py . --dry-run   # veja o que será criado
python3 /caminho/do/curso/kit/bootstrap.py .
```

1. Preencha os `[PREENCHER]` do `AGENTS.md` e ajuste os comandos do `Makefile`; confirme que `make check` roda.
2. Em *Settings*: proteja a `main` (PR obrigatório, status check `check`, Code Owners), crie os environments `dev`, `cert`, `prod` (aprovadores em cert e prod).
3. Troque `@org/...` do `CODEOWNERS`. Rode `pre-commit install`.
4. Abra o primeiro ticket com `jira/historia.md` e siga `prompts/nova-feature.md`.

## Comandos, skills e MCP por ferramenta

```bash
python3 /caminho/do/curso/kit/bootstrap.py . --tools cursor,claude,codex,opencode
```

`--tools` (qualquer subconjunto) copia a fonte única em `.agents/` para onde cada ferramenta procura, sem sobrescrever:

| Ferramenta | Comandos | Skills |
|---|---|---|
| Cursor | `.cursor/commands/` | lê `.agents/skills/` direto |
| Claude Code | `.claude/commands/` | `.claude/skills/` |
| OpenCode | `.opencode/commands/` | lê `.agents/skills/` direto |
| Codex | cada comando vira uma skill em `.agents/skills/<nome>/` (`$nome`), pois prompts personalizados são só do usuário e obsoletos | lê `.agents/skills/` direto |

Os MCP não são copiados por `--tools`: já vêm nos arquivos de config acima (Codex: copie `docs/agentes/codex-config.toml` para `~/.codex/config.toml`). Veja o passo de MCP da [Trilha rápida](../trilha-rapida/TR.html#passo-7).

## Projeto existente

```bash
python3 /caminho/do/curso/kit/bootstrap.py . --existing --dry-run
python3 /caminho/do/curso/kit/bootstrap.py . --existing
```

`--existing` nunca sobrescreve e **não copia** `deploy.yml` nem `azure-pipelines.yml` (compare com a sua esteira e adote por partes; o `diff` é seu amigo).

1. Rode `prompts/onboarding-repo-existente.md` numa sessão **só-leitura**; aprove e grave `docs/architecture.md` e o `AGENTS.md`.
2. Peça testes de caracterização das áreas de maior risco **antes** de qualquer mudança funcional.
3. Só então adote as regras do dia a dia (branch protection, hooks, template de PR).

## Avaliar skills e modelos

Antes de trocar de modelo ou de manter uma skill, meça. `evals/` roda os mesmos casos (com verificação por teste) em cada variante, repete N vezes e reporta pass^k, custo por tarefa bem-sucedida e uma comparação pareada com McNemar exato.

```bash
python3 evals/run_evals.py --config evals/exemplos/variantes.toml --casos-dir evals/exemplos/casos \
    --variantes modelo-grande,modelo-pequeno --repeticoes 3 --paralelo 4      # exemplo com agente fake, sem custo
python3 evals/run_evals.py --variantes sonnet,haiku --repeticoes 3            # os seus casos e variantes
python3 evals/run_evals.py --variantes sonnet --skill-ab minha-skill          # a skill ainda vale a pena?
```

Resultado em `evals/resultados/<data>/` (já no `.gitignore`). Saída de exemplo: `evals/exemplos/relatorio-exemplo.md`. Rode de novo ao mudar modelo, skill, `AGENTS.md` ou quando o fornecedor atualizar o modelo.

## Testes do kit

```bash
cd kit && uv run -q --with pytest python -m pytest -q tests
```

## Regra de ouro

Quando o agente errar duas vezes a mesma coisa, a correção vai para o `AGENTS.md` (ou para um hook), não para o chat.
