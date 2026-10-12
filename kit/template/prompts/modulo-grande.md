# Prompt: módulo grande (fatiar em entregas verticais)

```
Épico: PROJ-200. Leia AGENTS.md, docs/architecture.md e as ADRs existentes.

Fase A - Intenção e arquitetura (modo leitura, sem código):
  1. Escreva docs/intent/PROJ-200-<slug>.md (problema, resultado, restrições, riscos).
  2. Proponha 2-3 desenhos alternativos com trade-offs. Recomende um. Eu decido.
  3. Registre a decisão em docs/adr/ADR-NNN-<slug>.md.

Fase B - Fatiamento:
  Quebre em fatias verticais (cada uma entrega valor testável, cabe em 1 PR de revisão humana viável,
  ~400 linhas). Para cada fatia: história Jira (modelo jira/historia.md), dependências, risco.
  Ordene por risco: a fatia que valida a premissa mais perigosa vem primeiro (esqueleto andante).

Fase C - Por fatia (repita o ciclo de nova-feature.md):
  spec curta -> plano -> branch própria (idealmente um worktree) -> PR -> review -> cert.
  Ao final de cada fatia, atualize docs/architecture.md e o status do plano mestre.

Mantenha docs/plans/PROJ-200-mestre.md com o checklist das fatias e decisões pendentes.
Pare ao fim de cada fase para minha aprovação.
```
