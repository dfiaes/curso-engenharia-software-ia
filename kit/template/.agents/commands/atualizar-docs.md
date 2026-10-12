---
description: Comparar o diff da branch com a documentação e propor as edições (anti-drift)
argument-hint: "[branch-base, padrão origin/main]"
---
Base de comparação: $ARGUMENTS (se vazio, use origin/main). Rode `git diff <base>...HEAD` e compare com docs/specs, docs/plans, docs/runbooks, docs/architecture.md, README, CHANGELOG e AGENTS.md.

1. Liste cada afirmação da doc que o diff tornou falsa, incompleta ou obsoleta (arquivo e trecho).
2. Liste comportamentos novos do diff que não estão documentados.
3. Proponha as edições exatas; para decisão estrutural, rascunhe uma ADR.
4. Entrada no CHANGELOG com a chave do ticket.
5. Se você errou e foi corrigido neste trabalho, proponha uma linha para "Armadilhas conhecidas" do AGENTS.md.
Não invente: o que não puder verificar no código, marque como "precisa de confirmação humana". Detalhes em prompts/atualizar-docs.md.
