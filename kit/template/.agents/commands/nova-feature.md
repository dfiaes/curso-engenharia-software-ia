---
description: Nova feature em etapas (spec, plano, implementação, fechamento) a partir de um ticket
argument-hint: PROJ-123
---
Ticket: $ARGUMENTS (se houver servidor MCP de Jira/GitHub conectado, leia a história por ele; senão peça o texto).
Leia AGENTS.md e os docs relevantes. Siga prompts/nova-feature.md, em etapas, e PARE ao fim de cada uma para minha aprovação:

1. Intenção e spec em modo leitura: no máximo 7 perguntas; depois docs/specs/<TICKET>-<slug>.md com critérios Dado/Quando/Então.
2. Plano em docs/plans/<TICKET>-<slug>.md: arquivos, passos pequenos com `make check` verde, riscos, rollback.
3. Implementação (só após aprovação do plano): branch feat/<TICKET>-<slug>; teste primeiro, mudança mínima, `make check`, commit "<TICKET>: ...".
4. Fechamento: docs, CHANGELOG, descrição do PR citando cada critério e o teste que o cobre.

Nada fora do escopo da spec. Não toque em caminhos protegidos. Não coloque segredos em arquivos.
