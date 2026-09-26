# Risk register inicial — Cartógrafo (M13 B1)

**Aberto em:** 20/09/2026 · Severidade: P0/P1/P2 · Estado: OPEN/MITIGATED/BLOCKED

| ID | Risco | Sev. | Estado | Mitigação / evidência |
|---|---|---|---|---|
| R-01 | Docker Compose indisponível no ambiente deste lote | P1 | BLOCKED | `docker-compose.yml` documentado como trilha; baseline roda sem contêiner |
| R-02 | Tree-sitter ausente (binários/gramáticas nativas) | P1 | BLOCKED | porta `LanguageParser` + AST + MiniLang; adapter Tree-sitter fica no backlog do B4 |
| R-03 | SQLite local não prova RLS do Postgres | P2 | OPEN | design de migrations + `WITH CHECK` documentados em `docs/migrations-design.md` |
| R-04 | Idempotência em filesystem não cobre concorrência multi-processo | P2 | OPEN | escopo do Tier 1: worker único; lock por processo registrado como limite |
| R-05 | Claim publicada sem medição | P0 | MITIGATED | release contract exige método por claim; teste B1 falha em claim sem método |
| R-06 | MiniLang regex confundida com suporte real a linguagem | P2 | MITIGATED | gramática EBNF local + limitações declaradas no parser e no HTML |
