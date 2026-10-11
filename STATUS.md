# Status dos módulos

Atualizado em 11/10/2026. Estados: **pronto** (revisado por uma pessoa, lab executado), **revisar** (conteúdo completo, falta revisão humana ou execução do lab), **rascunho** (em escrita).

| Fase | Módulo | Estado | Observação |
|---|---|---|---|
| 0 | F01 Terminal e Git | revisar | novo; lab verde (pytest, ruff, mypy --strict) |
| 0 | F02 Python do zero | revisar | novo; lab verde (pytest, ruff, mypy --strict) |
| 0 | F03 Estruturas de dados e algoritmos | revisar | novo; lab verde (pytest, ruff, mypy --strict) |
| 0 | F04 Web, redes e HTTP | revisar | novo; lab verde (pytest, ruff, mypy --strict) |
| 0 | F05 SQL e bancos relacionais | revisar | novo; lab verde (pytest, ruff, mypy --strict) |
| 0 | M02 Python profissional | revisar | lab com testes; revisar apresentação |
| 1 | S01 Design de código | revisar | novo; lab verde (pytest, ruff, mypy --strict) |
| 1 | M02A Engenharia sênior | revisar | denso; candidato a enxugar |
| 1 | M03 Serviço real | revisar | integração PostgreSQL exige Docker |
| 1 | M04 Design docs | revisar | |
| 1 | LT01 Runtime, Linux e redes | revisar | |
| 2 | M00 Agentes de programação | revisar | |
| 2 | M01 SDD e execução paralela | revisar | |
| 2 | M05 LLM na prática | revisar | |
| 2 | M06 Evals e observabilidade | revisar | |
| 2 | M07 RAG | revisar | |
| 2 | M08 Agentes | revisar | |
| 2 | M09 MCP | revisar | A2A reduzido a panorama |
| 2 | M10 Grafos | revisar | nichos condensados |
| 3 | M12 Produção | revisar | billing virou leitura opcional |
| 3 | LT02 Sistemas distribuídos | revisar | |
| 3 | LT03 Plataforma | revisar | |
| 3 | P01 Deploy em nuvem | revisar | novo; lab verde (pytest, ruff, mypy --strict) |
| 3 | LT04 Release | revisar | |
| 4 | E01 System design de IA | revisar | novo; lab verde (pytest, ruff, mypy --strict) |
| 4 | M11 ML/DL e modelos locais | revisar | |
| 4 | E02 Adaptação de modelos | revisar | novo; lab verde (pytest, ruff, mypy --strict) |
| 4 | E03 Governança e regulação | revisar | novo; lab verde (pytest, ruff, mypy --strict) |
| 4 | E04 Liderança técnica | revisar | novo; lab verde (pytest, ruff, mypy --strict) |
| 4 | M13 Capstone | revisar | lab com 147 testes; integrações reais (Docker, Postgres/RLS, LLM, piloto) pendentes |
| 4 | E05 Carreira | revisar | novo; lab verde (pytest, ruff, mypy --strict) |

## Pendências gerais

- Revisão humana módulo a módulo, começando pela Fase 0.
- Integrações que exigem Docker/PostgreSQL ou conta de nuvem continuam como trilha opcional.

## Revisar com atenção

- Fatos voláteis com data: E03 (PL 2338/2023, cronograma do EU AI Act após o Digital Omnibus, resoluções da ANPD), E02 (ofertas de fine-tuning e computer use), P01 (nomes e escopos do Azure), E04/E05 (DORA e mercado).
- P01: build Docker, `what-if` e deploy real não foram executados (sem Docker/conta Azure no ambiente de autoria).
- Módulos novos ficaram entre 9 e 18 mil palavras; F02, F05 e E01 são candidatos a enxugar após a primeira leitura.
- M02A, LT01, LT03, LT04 e M11: IDs de critério de aceite foram tirados da prosa; reler frases onde o ID era o sujeito.
