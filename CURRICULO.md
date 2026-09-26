# Currículo — Engenharia de Software e IA em Python

**Principal:** 15 módulos + quatro laboratórios transversais; 152 blocos. **Apêndice opcional:** ML01–ML07, 48 blocos. Python 3.14; português; sem pressupor outra stack. As 304h da baseline anterior são estimativa histórica, não prazo ou carga validada do acervo ampliado.

O [`index.html`](index.html) é a porta de entrada oficial da Prévia Editorial v1. Ele apresenta primeiro a trilha curada de dez etapas e mantém seu progresso exportável separado dos 152 blocos locais. Os links diretos abaixo continuam válidos como fallback.

Para estudar pela sequência atual, use o [roteiro de estudo curado](docs/ROTEIRO-ESTUDO-GRATUITO.md). Suas dez etapas seguem o manifesto do portal na mesma ordem, com sínteses originais, leituras essenciais, aprofundamentos e atividades opcionais. A prática usa Codex e OpenCode; Claude Code e Cursor entram como comparação documental. Leituras essenciais não exigem pagamento, e chamadas de API, nuvem, assinaturas e certificados não são requisitos.

A trilha curada ensina agentes de programação antes de Python e sistemas com LLMs. O acervo local preserva os 19 módulos e laboratórios como referência secundária mais extensa. M11 é aprofundamento opcional sobre modelos locais e fundamentos de ML/DL; ML01–ML07 formam um apêndice opcional de ML tabular, treinamento, validação e MLOps. Nenhum deles é pré-requisito da trilha nem bloqueia leitura. Conceitos matemáticos indispensáveis são explicados no próprio percurso principal.

O material combina explicação profunda e laboratório pequeno: problema → mecanismo → exemplo resolvido → decisão → falha/diagnóstico → transferência. Labs ficam ao final, seguidos do checkpoint separado. Blocos organizam conteúdo, não sessões obrigatórias. Não há relógio, quota, diário ou commit exigidos para estudar.

Consulte a [prontidão atual](docs/STATUS-IMPLEMENTACAO-CURSO.md) antes de tratar material como certificado. O checklist individual da trilha, os gates editoriais v4 e a automação de produção são registros separados; acesso livre ou conclusão de uma etapa não promove módulo nem gate.

Para consultar sintaxe que M00 e M01 usam antes do ensino aprofundado de Python, há uma [ponte de entrada opcional](modulos/apoio/entrada.html). Ela não é uma unidade avaliativa nem condição para começar o percurso.

## Trilha curada principal

| Etapa | Tema | Acervo local relacionado |
|---:|---|---|
| 1 | Trabalhar com um agente de programação | M00, M01 |
| 2 | Configurar Codex e OpenCode | M00, M04 |
| 3 | Criar Skills e usar MCP com segurança | M00, M09 |
| 4 | Ponte de Python para quem já programa | M02 |
| 5 | Construir o primeiro app com LLM | M05 |
| 6 | Transformar a chamada em serviço | M03, M04 |
| 7 | Avaliar e observar antes de aumentar a complexidade | M06 |
| 8 | RAG com recuperação e evidências | M07 |
| 9 | Workflows primeiro; agentes quando fizer sentido | M08, M09 |
| 10 | Segurança, operação e projeto de integração | M12, M13 |

O [guia da trilha](docs/ROTEIRO-ESTUDO-GRATUITO.md) contém as sínteses, fontes e atividades. A tabela fixa somente ordem, escopo e correspondência; não transforma os módulos locais em pré-requisitos.

## Acervo local secundário

| Unidade | Blocos | Assunto | Material |
|---|---:|---|---|
| M00 | 5 | Harness engineering e trabalho seguro com IA | [M00](modulos/M00-ferramental/M00.html) |
| M01 | 5 | SDD, harness engineering e execução paralela segura | [M01](modulos/M01-workflow-ia-driven/M01.html) |
| M02 | 8 | Python 3.14 para engenharia profissional | [M02](modulos/M02-python-para-dev-dotnet/M02.html) |
| M02A | 15 | Engenharia de Software Sênior em 2026 | [M02A](modulos/M02A-engenharia-software-senior/M02A.html) |
| M03 | 8 | especificação de escopo e evidência | [M03](modulos/M03-fastapi-postgres-docker-ci/M03.html) |
| M04 | 4 | especificação de escopo e evidência | [M04](modulos/M04-design-docs-com-ia/M04.html) |
| M05 | 7 | especificação de escopo e evidência | [M05](modulos/M05-llm-pratica-gateway-cache/M05.html) |
| M06 | 6 | especificação de escopo e evidência | [M06](modulos/M06-evals-observabilidade/M06.html) |
| M07 | 8 | especificação de escopo e evidência | [M07](modulos/M07-rag-de-verdade/M07.html) |
| M08 | 8 | especificação de escopo e evidência | [M08](modulos/M08-agentes-e-context-engineering/M08.html) |
| M09 | 7 | especificação de escopo e evidência | [M09](modulos/M09-protocolos-mcp-e-a2a/M09.html) |
| M10 | 10 | especificação de escopo e evidência | [M10](modulos/M10-graph-engineering-saude-arquitetural/M10.html) |
| M11 | 8 | especificação de escopo e evidência | [M11](modulos/M11-fundamentos-ml-dl-modelos-locais/M11.html) |
| M12 | 9 | Produção, segurança, multi-tenancy, billing e SRE | [M12](modulos/M12-producao-seguranca-sre-billing/M12.html) |
| M13 | 20 | Capstone Cartógrafo | [M13](modulos/M13-capstone/M13.html) |
| LT01 | 6 | Runtime, Linux e redes | [LT01](modulos/LT01-novo/LT01.html) |
| LT02 | 6 | Sistemas distribuídos, dados e mensageria | [LT02](modulos/LT02-novo/LT02.html) |
| LT03 | 6 | Cloud-native, IaC, GitOps e plataforma | [LT03](modulos/LT03-novo/LT03.html) |
| LT04 | 6 | Release engineering: versão, gates, rollback, sinais, comunicação e pós-mortem | [LT04](modulos/LT04-novo/LT04.html) |

Dependências conceituais do acervo: M00/M01 → M02 → M02A → M03/M04 → M05/M06 → M07/M08/M09/M10 → M11/M12 → M13. Elas organizam a coleção local, não substituem nem ampliam a ordem das dez etapas. LT01 acompanha a base HTTP/runtime; LT02 aprofunda dados e falha distribuída; LT03 cobre plataforma; LT04 fecha o recorte de release engineering. Qualidade avançada, supply chain e governança de IA permanecem extensão de certificação v4, não promessa cumprida pela prévia. Use a especificação local para os pré-requisitos exatos; navegar fora da ordem não exige aprovação.

O Capstone Cartógrafo liga as peças por uma jornada pequena: ingerir corpus autorizado, consultar com evidência e operar com controles. Não precisa virar uma plataforma grande para ensinar conceitos profundos. Quando a promessa envolver PostgreSQL, rede ou processo, a prova usa o componente real em sandbox. Detalhe: [produto final](docs/projeto-final.md).

## Apêndice opcional de ML — planejado

Não há material HTML novo publicado: os links abaixo apontam a especificações de produção. Seus estados e aceites são independentes do principal.

| Unidade | Blocos | Conhecimento | Especificação |
|---|---:|---|---|
| ML01 | 6 | Matemática e estatística para decisões | [ML01](docs/especificacoes/ML01-ESPECIFICACAO.md) |
| ML02 | 6 | Dados e formulação de problemas | [ML02](docs/especificacoes/ML02-ESPECIFICACAO.md) |
| ML03 | 8 | Aprendizado supervisionado e validação | [ML03](docs/especificacoes/ML03-ESPECIFICACAO.md) |
| ML04 | 6 | Estrutura, tempo e recomendação | [ML04](docs/especificacoes/ML04-ESPECIFICACAO.md) |
| ML05 | 8 | Deep learning e representação | [ML05](docs/especificacoes/ML05-ESPECIFICACAO.md) |
| ML06 | 8 | MLOps e operação de modelos | [ML06](docs/especificacoes/ML06-ESPECIFICACAO.md) |
| ML07 | 6 | Projeto integrado de ML | [ML07](docs/especificacoes/ML07-ESPECIFICACAO.md) |

ML01 ensina a matemática necessária. ML02 organiza dados; ML03 aprende e valida modelos; ML04 amplia para estrutura/tempo/recomendação; ML05 aprofunda redes; ML06 opera modelos; ML07 integra um produto tabular pequeno. Exercícios com dados sintéticos não são apresentados como validação real de negócio.

## Consulta e autoria

- [Mapa conceitual](docs/mapa-conceitual.md): vocabulário de sistemas de IA; revisão de claims permanece sujeita aos gates.
- [Como estudar](docs/como-estudar.md): navegação e retomada em ritmo livre.
- [Especificação de profundidade e didática](docs/especificacoes/FORMACAO-SOFTWARE-IA-ML-ESPECIFICACAO.md).
- [Backlog executável por cartão](docs/BACKLOG-OPERACIONAL-V4.md).

Extensões de pesquisa (robótica, RL profundo, treinamento de fronteira e infraestrutura GPU multinó) não estão prometidas. O foco é compreensão transferível, exemplos honestos e decisões verificáveis. A versão curricular anterior foi [arquivada](docs/historico/2026-09-21/snapshots/CURRICULO.md), sem reger o escopo atual.
