# REL-05 — Revisão integrada dos gates G0–G5 (Terra/Sol, 21/09/2026)

Consolidação do estado decisório por módulo, cruzando o STATUS
(14/09/2026), o REL-01 (21/09/2026) e o REL-02 desta data. Escopo: gates
mecânicos/editoriais já executáveis (G0–G5). G6 (QA visual em device,
trilhas live com humano) e a revisão terminal Astra (REL-06) ficam fora —
resta apenas o que depende de humano ou de execução final.

## Consolidação por unidade

| Unidade | G0 | G1 | G2 | G3 | G4 | G5 | O que resta (humano/G6/Astra) |
|---|---|---|---|---|---|---|---|
| M00 | ✓ hist. | ✓ hist. | ✓ hist. | ✓ hist. | ✓ hist. | ✓ hist. (REL-02 labs limpos após correção pytest/format) | QA visual da revisão didática + companion legado (G6) |
| M01 | ✓ hist. | ✓ hist. | ✓ hist. | ✓ hist. | ✓ hist. | ✓ hist. (REL-02: 27 testes) | Revalidar G6 pós-revisão de setembro |
| M02 | ✓ hist. | ✓ hist. | ✓ hist. | ✓ hist. | ✓ hist. | ✓ hist. (REL-02: 51 testes; único COMPLETO no REL-01) | Apresentação G6 e checkpoint revisado (Astra) |
| M02A | ✓ v1.2 | ✓ | PARCIAL (trilha live PG/.NET/Windows ausente) | PENDENTE | PARCIAL | PARCIAL | Trilha live + QA visual; G3/G6 |
| M03 | ✓ | EM PRODUÇÃO (B01 ok) | PARCIAL-BLOQUEADO (6 testes PG skipped por Docker ausente) | PENDENTE | PARCIAL | PARCIAL | B02 com PostgreSQL real; gates do bloco seguinte |
| M04 | ✓ (legado) | PENDENTE | PARCIAL (15 testes verdes, verify-only/E-QA fechados) | PENDENTE | PARCIAL | PARCIAL | Construção após M03 + revisão profunda |
| M05 | ✓ (legado) | PENDENTE | PARCIAL (27 testes verdes) | PENDENTE | PARCIAL | PARCIAL | Construção; integrar LT02 |
| M06 | ✓ (legado) | PENDENTE | PARCIAL (17 testes) | PENDENTE | PARCIAL | PARCIAL | Construção após M05 |
| M07 | ✓ (legado) | PENDENTE | PARCIAL (23 testes) | PENDENTE | PARCIAL | PARCIAL | Construção após M06 |
| M08 | ✓ (legado) | PENDENTE | PARCIAL (15 testes) | PENDENTE | PARCIAL | PARCIAL | Construção após M07 |
| M09 | ✓ (legado) | PENDENTE | PARCIAL (19 testes) | PENDENTE | PARCIAL | PARCIAL | Construção após M08 |
| M10 | ✓ (legado) | PENDENTE | PARCIAL (15 testes) | PENDENTE | PARCIAL | PARCIAL | Construção após M09 |
| M11 | ✓ | ✓ | PARCIAL (94 testes) | ✓ | ✓ | PARCIAL | Trilha live Ollama/PG (Docker) + QA visual G6 |
| M12 | G1/G4 históricos ✓ | ✓ | BLOQUEADO (PostgreSQL/TLS: 1 skip honesto) | BLOQUEADO (game day) | ✓ | PARCIAL | PostgreSQL, E2E de segurança, game day, G6 |
| M13 | ✓ (20/20 blocos, 125 testes) | parcial | PARCIAL (B19 piloto BLOCKED honesto) | parcial | PARCIAL | PARCIAL | Docker/PostgreSQL + integração; G6 final |
| LT01 | ✓ | ✓ | PARCIAL (160 testes) | ✓ | PARCIAL | PARCIAL | G2/G4/G5 profundos + G6 |
| LT02 | ✓ | ✓ | PARCIAL (87 testes) | ✓ | PARCIAL | PARCIAL | idem |
| LT03 | ✓ | ✓ | PARCIAL (81 testes) | ✓ | PARCIAL | PARCIAL | G2/G4/G5 formais; G6 |
| LT04 | ✓ | ✓ | PARCIAL (28 testes) | ✓ | PARCIAL | PARCIAL | idem |

(Precisão dos "parciais" por bloco está nas rastreabilidades de cada
módulo; esta folha é decisória, não reescreve evidência.)

## Consolidação

- **Mecânica (REL-02):** 19/19 labs verdes em ruff, ruff-format, mypy e
  pytest (1.092 testes, 0 falhas) após duas correções triviais justificadas
  (pytest faltante em M00/M01; ruff-format no M00). Nada mais pendente em
  G2-mecânico dentro do que é executável sem Docker.
- **Bloqueios ambientais (não editoriais):** Docker/PostgreSQL para M03
  (6 skips), M12 (TLS cert material), trilhas live de M02A/M11, piloto M13.
  Dependem de device humano com Docker.
- **Dependente de humano (G6/QA visual):** revalidação visual de M00–M02
  após revisões editoriais; QA visual de M02A/M11; G6 global.
- **Dependente de Astra (REL-06, revisão terminal):** vereditos finais
  após fechar os itens acima; REL-04 marcou 7 pontos para
  REVALIDAR-EM-DEVICE com rede.
- **Fila editorial que não cabe neste lote Tier 1 (revisão):** produção de
  conteúdo novo — M03 B02, M04–M10 build, M02A B07–B15, M12/M13 restantes.
  Segue no BACKLOG-OPERACIONAL-V4 sob orquestração, fora do escopo REL-05.

**Resíduo após este mega-lote:** exclusivamente (a) execuções com Docker/
rede/humano, (b) QA visual G6 em device, (c) revisão terminal Astra e
(d) produção de conteúdo novo já filada. Nenhum gate mecânico G0–G5
executável localmente ficou pendente.
