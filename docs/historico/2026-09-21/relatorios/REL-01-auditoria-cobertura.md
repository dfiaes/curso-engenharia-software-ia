# REL-01 — Auditoria de cobertura (spec ↔ material ↔ evidência ↔ trace)

**Data:** 21/09/2026 · **Tarefa:** REL-01 (auditoria de cobertura, mecânica e barata) · **Escopo:** 19 especificações × 19 diretórios de módulo.

## 1. Estado G0 das especificações

Todos os 19 arquivos em `docs/especificacoes/*.md` possuem **G0 APROVADO** (LT01–LT04, M00–M13, M02A). Destaques: M02 declarado VERIFICADO (G0–G6, 38 cenários); M02A v1.2 com G0 reaprovado em 12/09/2026 e G1 em produção; M03–M10 explicitam "G0 aprovado; G1 em produção" (G0 certifica escopo, não material).

## 2. Execuções desta auditoria (21/09/2026)

- `uv run pytest -q` em cada `modulos/*/lab/` (M00/M01 exigiram `uv run --with pytest` pois `pytest` não está no ambiente dos labs).
- `python3 tools/check_course.py <Mxx.html>` em todos os 19 HTMLs: **0 erros estruturais em todos**; achados legados contextuais: M02A (4), M10 (1).
- Verbatins: lidos diretamente das rastreabilidades locais quando relatados.

## 3. Tabela de cobertura

| Módulo | Spec OK (G0) | HTML | Lab testes (n) | check_course | Verbatim | ATs da spec | Cobertos na trace | Gap / BLOCKEDs | Veredito |
|---|---|---|---|---|---|---|---|---|---|
| LT01 | G0 ✓ | ✓ | 160 passed, 1 skipped | 0 erros | relatado (3 módulos) | 18 | parcial (B01+ com E; trace cita famílias produzidas) | G1–G6 não promovidos; trace sinaliza pendências (7 linhas) | PARCIAL |
| LT02 | G0 ✓ | ✓ | 87 passed, 1 skipped (BLOCKED registrado) | 0 erros | 4/4 programático | 25 | parcial | G1–G6 não promovidos | PARCIAL |
| LT03 | G0 ✓ | ✓ | 81 passed | 0 erros | 2/2 (E501) | 29 | B01–B06 + E final executado; G1/G3 aprovados | G2/G4/G5 parciais; G6 pendente | PARCIAL |
| LT04 | G0 ✓ | ✓ | 28 passed | 0 erros | 6/6 byte-idênticos + 1/1 suíte | 34 | Tier 1 completo; 10 pontes parciais + 23 spec-ATs ESPECIFICADOS | G2/G4/G5 parciais; G6 pendente | PARCIAL |
| M00 | G0 ✓ | ✓ | 16 passed, 2 skipped | 0 erros | n/r | 20 | LAB/competências VERIFICADO na trace; G0–G5 aprovados histórico | G6 PARCIAL (QA visual/links pendentes); pytest ausente do env do lab | PARCIAL |
| M01 | G0 ✓ | ✓ | 26 passed, **1 failed** (test_seeded_mypy_error_blocks_and_cites_file) | 0 erros | n/r | 22 | baseline agosto G0–G6; revisão editorial set. | falha de teste no runner; G6 a revalidar | PARCIAL (com falha) |
| M02 | G0 ✓ (VERIFICADO) | ✓ | 51 passed | 0 erros | n/r | 38 | 38/38 ATs verificados (spec §11) | revisão editorial G6 em andamento (não técnica) | COMPLETO |
| M02A | G0 ✓ (v1.2) | ✓ | 144 passed | 0 erros (4 flags legadas) | n/r | 60 | G1 aprovado; slice local verde | G2/G4/G5 parciais; G3/G6 pendentes; AT-006/010/022/040 exigem reexecução | PARCIAL |
| M03 | G0 ✓ | ✓ | 52 passed, 6 skipped | 0 erros | n/r | 32 | oráculos offline/estáticos verdes em várias famílias | **PG/Docker BLOCKED** (B02/B03/B05/B06: migration real, plano, build/compose, integração); G1 em produção | PARCIAL (BLOCKEDs honestos) |
| M04 | G0 ✓ | ✓ | 15 passed | 0 erros | 5/5 + mutante OK | 12 | E-QA fechado; verify-only | gates formais G1–G6 não promovidos (aguardam revisão final) | PARCIAL |
| M05 | G0 ✓ | ✓ | 27 passed | 0 erros | n/r | 17 | LEGADO EM REVISÃO; conteúdo produzido | G1 em produção; revisão profunda pendente | PARCIAL |
| M06 | G0 ✓ | ✓ | 17 passed | 0 erros | n/r | 14 | idem M05 | idem | PARCIAL |
| M07 | G0 ✓ | ✓ | 23 passed | 0 erros | n/r | 16 | idem M05 | idem (10 linhas pend/blocked na trace) | PARCIAL |
| M08 | G0 ✓ | ✓ | 15 passed | 0 erros | n/r | 14 | idem M05 | idem | PARCIAL |
| M09 | G0 ✓ | ✓ | 19 passed | 0 erros | n/r | 14 | idem M05 | idem | PARCIAL |
| M10 | G0 ✓ | ✓ | 15 passed | 0 erros (1 flag legada) | n/r | 16 | idem M05 | idem | PARCIAL |
| M11 | G0 ✓ | ✓ | 94 passed | 0 erros | reexecução verbatim relatada | 35 | G0/G1/G3/G4 aprovados | G2/G5 parciais; G6 pendente; trilha live (Ollama/PG) sem Docker | PARCIAL |
| M12 | G0 ✓ | ✓ | 94 passed, 1 skipped | 0 erros | n/r | 24 | G1/G4 históricos aprovados | **BLOQUEADO PARA ESTUDO**: PostgreSQL, E2E, game day e G6 pendentes (Docker ausente) | BLOQUEADO |
| M13 | G0 ✓ | ✓ | 125 passed | 0 erros | verbatins conferidos na E | (30 cenários E, sem IDs AT-xxx) | 20/20 blocos executados; 4 épicos | B19 piloto BLOCKED (sem humano); Docker/PG e integração pendentes; G6 pendente | BLOQUEADO (execução avançada, integração travada) |

## 4. Cruzamento ATs (síntese)

- **Único módulo com 100% dos ATs da spec promovidos a VERIFICADO:** M02 (38/38, conforme spec §11 e trace M02).
- **M00/M01:** ATs cobertos no baseline de agosto (G0–G6/G0–G5), mas em revisão editorial de setembro; M01 tem 1 teste falhando nesta execução.
- **M02A:** 60 ATs na spec v1.2; slice local verde (144 testes), mas AT-006/010/022/040 exigem reexecução pós-v1.2 (não há promoção automática).
- **M03–M10:** ATs marcados ESPECIFICADO/CONTEÚDO PRODUZIDO com oráculos offline verdes; nenhum promovido a VERIFICADO além do slice; M03 concentra BLOCKEDs reais (PostgreSQL/Docker).
- **M11:** G3/G4 aprovados; G2/G5 parciais pendentes de trilha live.
- **M12/M13:** BLOCKED para estudo por ausência de Docker/PostgreSQL e integração; registrado como BLOCKED, sem skip disfarçado.
- **LT01–LT04:** ATs produzidos por bloco (Tier 1), com E final executado em LT03/LT04; nenhum gate G1–G6 promovido integralmente.

## 5. Síntese de vereditos

- **COMPLETO:** 1 (M02)
- **PARCIAL:** 15 (LT01–LT04, M00, M01, M02A, M03–M11)
- **BLOQUEADO:** 2 (M12, M13)
- Causa dominante dos PARCIAIs: gates G2–G6 não promovidos / revisão editorial e QA final pendentes; do BLOQUEADO: ausência de Docker/PostgreSQL/humano, registrada honestamente.

> Auditoria mecânica: não promove gates, não substitui revisão G6 nem validação visual. Veredito reflete cruzamento documental + execução local em 21/09/2026.
