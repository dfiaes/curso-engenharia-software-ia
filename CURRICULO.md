# Currículo — Engenharia de Software e IA em Python

Uma trilha única, em cinco fases, do nível júnior ao nível de especialista e líder técnico em sistemas com IA. Python 3.14, material em português, labs executáveis sem conta paga.

**Como usar.** Siga as fases em ordem. Cada módulo abre com um **diagnóstico rápido**: se você acerta tudo, leia só a conclusão, faça o checkpoint e siga em frente. Quem já atua na área costuma passar rápido pela Fase 0 e parar exatamente nos pontos que a rotina deixou enferrujados. Comece pelo [nivelamento](docs/nivelamento.md) para decidir onde entrar.

As cargas são estimativas para quem estuda o módulo inteiro e faz o lab. Estado de cada módulo: [`STATUS.md`](STATUS.md).

## Fase 0 · Fundamentos (≈ 90 h)

O que todo engenheiro precisa dominar antes de qualquer framework: a máquina, o versionamento, a linguagem, os algoritmos, a rede e o banco.

| Módulo | Assunto | Carga | Pré-requisito |
|---|---|---:|---|
| [F01](modulos/F01-terminal-git/F01.html) | Terminal, sistema de arquivos, processos e Git a fundo | 12 h | — |
| [F02](modulos/F02-python-do-zero/F02.html) | Python do zero: tipos, coleções, funções, erros, arquivos, módulos e testes | 18 h | F01 |
| [F03](modulos/F03-estruturas-dados-algoritmos/F03.html) | Estruturas de dados, algoritmos e complexidade | 16 h | F02 |
| [F04](modulos/F04-web-redes-http/F04.html) | Como a web funciona: redes, DNS, TLS, HTTP, JSON e APIs REST | 10 h | F02 |
| [F05](modulos/F05-sql-bancos-relacionais/F05.html) | Bancos relacionais, SQL e modelagem de dados | 12 h | F02 |
| [M02](modulos/M02-python-profissional/M02.html) | Python profissional: tipagem, Pydantic, async, empacotamento, observabilidade | 16 h | F02 |

## Fase 1 · Engenharia de software (≈ 100 h)

Da escrita de código à engenharia: design, decisões, contratos, dados, concorrência, testes e serviço em produção local.

| Módulo | Assunto | Carga | Pré-requisito |
|---|---|---:|---|
| [S01](modulos/S01-design-de-codigo/S01.html) | Design de código: OO, funcional, padrões, refatoração e TDD | 14 h | M02 |
| [M02A](modulos/M02A-engenharia-software-senior/M02A.html) | Engenharia de software sênior: requisitos, arquitetura, dados, concorrência, falha parcial, testes | 30 h | S01, F05 |
| [M03](modulos/M03-fastapi-postgres-docker-ci/M03.html) | Serviço real: FastAPI, PostgreSQL, Docker e CI | 16 h | M02A, F04 |
| [M04](modulos/M04-design-docs-com-ia/M04.html) | Design docs, ADR, C4 e documentação como contexto de agente | 8 h | M03 |
| [LT01](modulos/LT01-novo/LT01.html) | Runtime, Linux e redes em profundidade | 12 h | F04, M03 |

## Fase 2 · AI Engineering (≈ 120 h)

Construir com modelos de linguagem: trabalhar com agentes de programação, chamar modelos, avaliar, recuperar, orquestrar e integrar.

| Módulo | Assunto | Carga | Pré-requisito |
|---|---|---:|---|
| [M00](modulos/M00-ferramental/M00.html) | Trabalhar com agentes de programação: harness, contexto, permissões e evidência | 10 h | Fase 1 |
| [M01](modulos/M01-workflow-ia-driven/M01.html) | Desenvolvimento orientado a especificação e execução paralela com IA | 10 h | M00 |
| [M05](modulos/M05-llm-pratica-gateway-cache/M05.html) | LLM na prática: tokens, structured output, tool calling, streaming, cache, gateway e custo | 14 h | M03 |
| [M06](modulos/M06-evals-observabilidade/M06.html) | Evals e observabilidade de sistemas com LLM | 12 h | M05 |
| [M07](modulos/M07-rag-de-verdade/M07.html) | RAG de verdade: embeddings, chunking, pgvector, busca híbrida, reranking, ACL | 16 h | M06 |
| [M08](modulos/M08-agentes-e-context-engineering/M08.html) | Agentes e context engineering | 16 h | M07 |
| [M09](modulos/M09-protocolos-mcp-e-a2a/M09.html) | Protocolos: MCP na prática | 12 h | M08 |
| [M10](modulos/M10-graph-engineering-saude-arquitetural/M10.html) | Grafos: workflows com estado, human-in-the-loop e grafo de conhecimento | 14 h | M08 |

## Fase 3 · Produção (≈ 80 h)

Levar sistemas com IA para produção com segurança, confiabilidade e operação.

| Módulo | Assunto | Carga | Pré-requisito |
|---|---|---:|---|
| [M12](modulos/M12-producao-seguranca-sre-billing/M12.html) | Produção: threat modeling agêntico, contenção, identidade, multi-tenancy, idempotência, quotas, SRE | 18 h | Fase 2 |
| [LT02](modulos/LT02-novo/LT02.html) | Sistemas distribuídos, dados e mensageria | 12 h | M02A |
| [LT03](modulos/LT03-novo/LT03.html) | Cloud-native, IaC, GitOps e plataforma | 12 h | M03 |
| [P01](modulos/P01-deploy-nuvem/P01.html) | Deploy real em nuvem (Azure): container, segredos, observabilidade e custo de um serviço com LLM | 12 h | LT03, M05 |
| [LT04](modulos/LT04-novo/LT04.html) | Release engineering: versão, gates, rollback, sinais e pós-mortem | 12 h | P01 |

## Fase 4 · Especialista e líder (≈ 130 h)

O que separa o especialista: desenhar sistemas inteiros, entender e adaptar modelos, responder por risco e regulação, liderar pessoas e decisões, e provar tudo num produto.

| Módulo | Assunto | Carga | Pré-requisito |
|---|---|---:|---|
| [E01](modulos/E01-system-design-ia/E01.html) | System design de sistemas com IA | 14 h | Fase 3 |
| [M11](modulos/M11-fundamentos-ml-dl-modelos-locais/M11.html) | Fundamentos de ML/DL, transformer por dentro e modelos locais | 16 h | F03, M05 |
| [E02](modulos/E02-adaptacao-de-modelos/E02.html) | Adaptação de modelos: fine-tuning, LoRA, destilação, modelos de raciocínio e multimodal | 14 h | M11 |
| [E03](modulos/E03-governanca-regulacao/E03.html) | Governança, regulação e IA responsável: LGPD, EU AI Act, NIST AI RMF | 8 h | M12 |
| [E04](modulos/E04-lideranca-tecnica/E04.html) | Liderança técnica na era da IA | 12 h | E01 |
| [M13](modulos/M13-capstone/M13.html) | Capstone Cartógrafo: o produto que integra o curso | 40 h | E01 |
| [E05](modulos/E05-carreira/E05.html) | Carreira: portfólio, entrevistas de AI engineering e próximos passos | 6 h | M13 |

## Capstone

O [Cartógrafo](docs/projeto-final.md) atravessa o curso: cada fase acrescenta uma peça (contratos e dados, chamada ao modelo, avaliação, recuperação, agentes, segurança, operação). O M13 integra e defende o produto.

## Fora do escopo

Pesquisa de fronteira (pré-treino de modelos grandes, RL profundo, robótica, infraestrutura GPU multinó) não faz parte do curso. ML tabular clássico aparece apenas no necessário dentro do M11.

## Consulta

- [Nivelamento](docs/nivelamento.md) · [Como estudar](docs/como-estudar.md) · [Mapa conceitual](docs/mapa-conceitual.md) · [Leituras complementares por fase](docs/leituras-complementares.md)
