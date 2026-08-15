# M04 · Design Docs com IA

## Visão geral

Documentação parou de ser burocracia porque apareceu um leitor que lê tudo, toda vez, e age com base no que leu. Isso inverte a economia: doc ausente vira invenção, doc desatualizada vira erro confiante (pior que ausente), doc correta se paga a cada sessão nova. O módulo cobre os quatro formatos que importam (taxonomia, C4/Mermaid, ADR, postmortem) e — a parte que sempre falha — a **manutenção automatizada** via linter determinístico + agente revisor de PR.

Bônus estratégico: o Capstone **gera documentação**. Este módulo define o gabarito da saída do produto (`output-spec.md`), que o M13 usa como definição de pronto.

## Conteúdo do módulo

- **Material principal (HTML):** [`M04.html`](M04.html) — abra no navegador
- **Carga:** 4 blocos de 2h (8h)
- **Pré-requisito:** M03 (o CI e o `check.sh` recebem o doc lint; o Capstone já está no ar)

## Estrutura dos blocos

1. **Bloco 1:** Taxonomia e docs como contexto — a inversão econômica com os dois consumidores; as 5 categorias de documento; Diátaxis; as 3 camadas de contexto (sempre carregado <200 linhas, just-in-time, arquivo); `AGENTS.md` como convenção 2026 e o exemplo real; context poisoning e a hierarquia da verdade.
2. **Bloco 2:** Diagrama como código — C4 como níveis de zoom (L1/L2 dão 90% do valor; L4 se gera); os cinco diagramas Mermaid que bastam (flowchart, sequence, ER, state, C4) com sintaxe e critério de uso; o aviso honesto de que C4 no Mermaid é experimental e de layout manual.
3. **Bloco 3:** ADR e postmortem — anatomia seção a seção com o porquê de cada uma; imutabilidade; critério de custo de reversão para decidir o que merece ADR; ADR-0001 real do Capstone como modelo; ADR gerado por IA (uso certo e errado); postmortem blameless com linha do tempo, fatores contribuintes e ações com dono.
4. **Bloco 4:** Manutenção automatizada — as 4 classes de doc drift e quem detecta cada uma; `tools/doc_lint.py` completo e tipado (referência quebrada, estrutura de ADR, mermaid, obsolescência via git); o agente revisor de PR com o prompt versionado e as restrições que o impedem de virar ruído; runbook e front matter.

## Entregáveis

- `capstone/docs/` completo: PRD, `architecture.md` (C4 L1+L2 + sequence com caminho de erro), `adr/0001`, `runbook.md`, `output-spec.md`.
- Postmortem blameless de incidente real do trabalho, com contraditório do agente.
- `tools/doc_lint.py` no `check.sh` e no CI + workflow `doc-drift.yml` reprovando PR com doc desatualizada.
- `AGENTS.md` (<200 linhas) com `CLAUDE.md` como ponteiro.

## Fundamentos reciclados neste módulo

Comunicação técnica escrita ("escrever é pensar", em versão mecânica) · abstração e níveis (um diagrama, uma pergunta, ≤7 elementos) · cultura de falha e segurança psicológica (blameless como mecanismo, não gentileza) · guardrail mecânico aplicado a documentação (retomada do M01 bloco 2).
