# AGENTS.md — fonte única de instruções para agentes

<!--
  Este arquivo é lido por Codex, OpenCode, Cursor e (via CLAUDE.md) Claude Code.
  Regras: curto (< 150 linhas), comandos exatos, só o que o agente NÃO descobriria sozinho.
  Quando o agente errar duas vezes a mesma coisa, a correção entra AQUI (e não só no chat).
  Apague os comentários e preencha os campos [PREENCHER].
-->

## O que é este projeto
[PREENCHER: 2-3 linhas. Domínio, usuários, o que este repositório entrega.]

## Stack e versões
- Linguagem/runtime: [PREENCHER: ex. .NET 8, C# 12]
- Banco/filas: [PREENCHER]
- Hospedagem: [PREENCHER: on-premise / Azure App Service / AKS ...]

## Comandos (única fonte; não invente outros)
- Verificação completa (obrigatória antes de qualquer PR): `make check`
- Só testes: `make test`
- Lint/format: `make lint`
- Subir local: `make run`

## Estrutura
- `src/` código; `tests/` testes; `docs/` documentação viva.
- `docs/intent/` por que (intenção) · `docs/specs/` o quê (critérios verificáveis) · `docs/plans/` como (passos) · `docs/adr/` decisões caras · `docs/runbooks/` operação.

## Fluxo de trabalho (obrigatório)
1. Todo trabalho nasce de um ticket (`PROJ-123`). Branch: `feat/PROJ-123-slug` ou `fix/PROJ-123-slug`.
2. Antes de codar: leia a spec em `docs/specs/` e o plano em `docs/plans/`. Sem spec aprovada, pare e peça.
3. Planeje em modo leitura; implemente em passos pequenos; rode `make check` a cada passo.
4. Commits: `PROJ-123: verbo no imperativo`. Um PR por ticket.
5. O MESMO PR atualiza a documentação afetada (spec, runbook, README, CHANGELOG).

## Limites (o agente NÃO faz sem pedido explícito de um humano)
- Não edita: `.github/workflows/deploy.yml`, `azure-pipelines.yml`, `infra/`, `.env*`, `CODEOWNERS`.
- Não executa deploy em cert ou prod; não roda migração em banco compartilhado.
- Em branch `fix/`: não altera testes existentes (só adiciona o teste que reproduz o bug).
- Não adiciona dependência nova sem registrar justificativa no PR (ou ADR se for estrutural).
- Nunca imprime, comita ou cola segredos.

## Convenções de código
[PREENCHER: nomes, camadas, tratamento de erro, logging, o que é proibido. Só o que o linter não cobre.]

## Armadilhas conhecidas
<!-- Cresce com o tempo. Formato: - [data] O que o agente errou -> regra correta. -->
- [PREENCHER]

## Definição de pronto
- `make check` verde; critérios da spec cobertos por teste; docs atualizadas; PR com checklist preenchido.
