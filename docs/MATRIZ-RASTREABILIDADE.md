# Matriz de rastreabilidade curricular

**Revisão:** 25/09/2026. Esta matriz mapeia contratos, não certifica conteúdo. [Status](STATUS-IMPLEMENTACAO-CURSO.md) contém a única fila; [catálogo de tarefas](BACKLOG-OPERACIONAL-V4.md) contém passos e dependências. Gates dependem de evidência revisada, nunca de existência de arquivo.

## Principal

| Unidade | Blocos | Cenários declarados no catálogo | Escopo | Evidência/gates locais |
|---|---:|---:|---|---|
| M00 | 5 | 20 | [M00](especificacoes/M00-ESPECIFICACAO.md) | [Rastreabilidade](../modulos/M00-ferramental/RASTREABILIDADE.md) |
| M01 | 5 | 22 | [M01](especificacoes/M01-ESPECIFICACAO.md) | [Rastreabilidade](../modulos/M01-workflow-ia-driven/RASTREABILIDADE.md) |
| M02 | 8 | 38 | [M02](especificacoes/M02-ESPECIFICACAO.md) | [Rastreabilidade](../modulos/M02-python-para-dev-dotnet/RASTREABILIDADE.md) |
| M02A | 15 | 60 | [M02A](especificacoes/M02A-ESPECIFICACAO.md) | [Rastreabilidade](../modulos/M02A-engenharia-software-senior/RASTREABILIDADE.md) |
| M03 | 8 | 32 | [M03](especificacoes/M03-ESPECIFICACAO.md) | [Rastreabilidade](../modulos/M03-fastapi-postgres-docker-ci/RASTREABILIDADE.md) |
| M04 | 4 | 12 | [M04](especificacoes/M04-ESPECIFICACAO.md) | [Rastreabilidade](../modulos/M04-design-docs-com-ia/RASTREABILIDADE.md) |
| M05 | 7 | 17 | [M05](especificacoes/M05-ESPECIFICACAO.md) | [Rastreabilidade](../modulos/M05-llm-pratica-gateway-cache/RASTREABILIDADE.md) |
| M06 | 6 | 14 | [M06](especificacoes/M06-ESPECIFICACAO.md) | [Rastreabilidade](../modulos/M06-evals-observabilidade/RASTREABILIDADE.md) |
| M07 | 8 | 16 | [M07](especificacoes/M07-ESPECIFICACAO.md) | [Rastreabilidade](../modulos/M07-rag-de-verdade/RASTREABILIDADE.md) |
| M08 | 8 | 14 | [M08](especificacoes/M08-ESPECIFICACAO.md) | [Rastreabilidade](../modulos/M08-agentes-e-context-engineering/RASTREABILIDADE.md) |
| M09 | 7 | 14 | [M09](especificacoes/M09-ESPECIFICACAO.md) | [Rastreabilidade](../modulos/M09-protocolos-mcp-e-a2a/RASTREABILIDADE.md) |
| M10 | 10 | 16 | [M10](especificacoes/M10-ESPECIFICACAO.md) | [Rastreabilidade](../modulos/M10-graph-engineering-saude-arquitetural/RASTREABILIDADE.md) |
| M11 | 8 | 35 | [M11](especificacoes/M11-ESPECIFICACAO.md) | [Rastreabilidade](../modulos/M11-fundamentos-ml-dl-modelos-locais/RASTREABILIDADE.md) |
| M12 | 9 | 24 | [M12](especificacoes/M12-ESPECIFICACAO.md) | [Rastreabilidade](../modulos/M12-producao-seguranca-sre-billing/RASTREABILIDADE.md) |
| M13 | 20 | 29 | [M13](especificacoes/M13-ESPECIFICACAO.md) | [Rastreabilidade](../modulos/M13-capstone/RASTREABILIDADE.md) |
| LT01 | 6 | 18 | [LT01](especificacoes/LT01-ESPECIFICACAO.md) | [Rastreabilidade](../modulos/LT01-novo/RASTREABILIDADE.md) |
| LT02 | 6 | 25 | [LT02](especificacoes/LT02-ESPECIFICACAO.md) | [Rastreabilidade](../modulos/LT02-novo/RASTREABILIDADE.md) |
| LT03 | 6 | 29 | [LT03](especificacoes/LT03-ESPECIFICACAO.md) | [Rastreabilidade](../modulos/LT03-novo/RASTREABILIDADE.md) |
| LT04 | 6 | 34 | [LT04](especificacoes/LT04-ESPECIFICACAO.md) | [Rastreabilidade](../modulos/LT04-novo/RASTREABILIDADE.md) |

Na Prévia Editorial v1, LT04 publica o recorte Tier 1 de release engineering descrito na rastreabilidade local. Os 34 cenários da especificação ampliada de qualidade, supply chain e governança continuam pertencendo à certificação v4; não são apresentados como cobertura da prévia.

Os IDs dos LTs e de M12 são esparsos; maior sufixo não é contagem. OPS-01 conferiu 613 IDs enumerados nas 26 specs contra o catálogo e vinculou cada critério aos blocos owner, sem preencher lacunas numéricas. Onze critérios enviesados de M07/M08/M11 foram reescritos para comparar e medir sem resultado universal; IDs preservados. A [evidência OPS-01](planejamento-v4/evidencias/OPS-01.md) registra divergências, disposição e natureza planejada da prova. Nenhuma linha acima equivale a VERIFICADO.

## Apêndice opcional

| Unidade | Blocos | Cenários planejados | Escopo |
|---|---:|---:|---|
| ML01 | 6 | 18 | [ML01](especificacoes/ML01-ESPECIFICACAO.md) |
| ML02 | 6 | 18 | [ML02](especificacoes/ML02-ESPECIFICACAO.md) |
| ML03 | 8 | 24 | [ML03](especificacoes/ML03-ESPECIFICACAO.md) |
| ML04 | 6 | 18 | [ML04](especificacoes/ML04-ESPECIFICACAO.md) |
| ML05 | 8 | 24 | [ML05](especificacoes/ML05-ESPECIFICACAO.md) |
| ML06 | 8 | 24 | [ML06](especificacoes/ML06-ESPECIFICACAO.md) |
| ML07 | 6 | 18 | [ML07](especificacoes/ML07-ESPECIFICACAO.md) |

ML01–ML07 têm G0 candidato, G1–G6 pendentes e nenhuma execução alegada. Cada bloco propõe três cenários: exemplo/mecanismo, falha/diagnóstico e decisão/transferência. A validação do apêndice não participa de REL-06 principal.

## Achados que atravessam a cobertura

M06 exige validação de entrada/categorias e correção estatística; M13 exige PRR substantivo, recuperação observada e integração real. [Diagnóstico](auditorias/STATUS-DIDATICA-PROFUNDIDADE-2026-09-21.md). Testes históricos não eliminam esses achados.

Detalhes históricos de competências e rótulos antigos foram [preservados](historico/2026-09-21/snapshots/MATRIZ-RASTREABILIDADE.md). Usar somente para reconstruir evidência, não como placar atual.
