# Roteiro gratuito de Engenharia de Software e IA

**Curadoria consultada em 26/09/2026.** Esta é uma seleção para estudar a formação inteira usando fontes públicas, não uma lista literalmente exaustiva de tudo que existe na internet. O material prioriza cursos completos, documentação dos mantenedores, padrões abertos, livros autorizados e artigos de pesquisa. A maioria está em inglês; quando necessário, use a tradução do navegador.

## Recomendação

Comece por este roteiro se a prioridade for aprender com uma sequência mais curta e com material já publicado. O acervo local continua útil como consulta, mas não é preciso ler os 152 blocos em ordem para seguir este percurso. O currículo local permanece em [`index.html`](../index.html); o estado editorial e os bloqueios técnicos estão em [`STATUS-IMPLEMENTACAO-CURSO.md`](STATUS-IMPLEMENTACAO-CURSO.md).

Cada etapa tem um resultado simples para consolidar o que foi aprendido. Ele serve para lembrar e transferir o conhecimento, não para pedir aprovação nem bloquear a próxima etapa. Não é necessário fazer certificados.

Os links de leitura e os cursos listados são gratuitos. Chamadas a APIs de modelos podem gerar cobrança: são opcionais neste roteiro. Não crie conta de cobrança para seguir as leituras. Para o projeto final, a integração com um modelo real pode ficar para quando houver uma forma de executar sem custo; testes com resultados fixos devem ser identificados como fixtures e não como evidência de qualidade de um modelo.

## Percurso

### 1. Python para construir e testar programas

- [CS50’s Introduction to Programming with Python — Harvard](https://cs50.harvard.edu/python/): curso aberto com aulas, exercícios e projeto final. Faça o curso completo se ainda não programa; se já programa, priorize exceções, bibliotecas, testes, arquivos e orientação a objetos.
- [Tutorial oficial de Python](https://docs.python.org/3/tutorial/): use como referência para sintaxe e biblioteca padrão, não precisa ler de ponta a ponta antes de começar.
- [pytest — primeiros testes](https://docs.pytest.org/en/stable/getting-started.html): acompanhe o exemplo e adapte os testes do projeto durante as etapas seguintes.

**Resultado para consolidar:** um pequeno programa de linha de comando que lê um arquivo, valida entradas e tem testes para o caminho normal e para uma falha.

- [ ] Etapa 1 concluída

### 2. Git e engenharia de software no tempo

- [Pro Git](https://git-scm.com/book/en/v2): capítulos 1–3 cobrem modelo de versionamento, commits, histórico e ramificações; pare aí até precisar de tópicos mais avançados.
- [Software Engineering at Google](https://abseil.io/resources/swe-book/html/toc.html): livro completo gratuito. Comece por “What Is Software Engineering?”, “Code Review”, “Documentation” e os capítulos de testes. São experiências de uma organização específica, úteis como casos e trade-offs, não regras universais.
- [pytest — primeiros testes](https://docs.pytest.org/en/stable/getting-started.html): mantenha os testes pequenos, legíveis e ligados ao comportamento que importa.

**Resultado para consolidar:** descreva uma decisão técnica em uma página e mostre como uma mudança pequena é revisada por diff e coberta por um teste.

- [ ] Etapa 2 concluída

### 3. HTTP, contratos de API e banco relacional

- [Como a Web funciona — MDN](https://developer.mozilla.org/en-US/docs/Learn_web_development/Getting_started/Web_standards/How_the_web_works) e [visão geral de HTTP](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Overview): comece pelo fluxo cliente, servidor, requisição e resposta.
- [Aprenda OpenAPI](https://learn.openapis.org/): leia a introdução e como descrever, validar e documentar um contrato de API.
- [Tutorial do PostgreSQL](https://www.postgresql.org/docs/current/tutorial.html): percorra criação de tabelas, consultas, joins, agregações, atualizações, chaves estrangeiras e transações.

**Resultado para consolidar:** modele duas entidades relacionadas e descreva em OpenAPI dois endpoints de leitura e um de escrita, incluindo erros esperados.

- [ ] Etapa 3 concluída

### 4. Serviço Python e entrega contínua

- [Tutorial do FastAPI](https://fastapi.tiangolo.com/tutorial/): siga em ordem até dependências, validação, tratamento de erros e testes; consulte o guia avançado apenas quando um requisito pedir.
- [Docker Get Started](https://docs.docker.com/get-started/): faça o tutorial de containerização da aplicação; ignore publicação em registry se não precisar compartilhar uma imagem.
- [Quickstart do GitHub Actions](https://docs.github.com/en/actions/get-started/quickstart): adapte o primeiro workflow para executar os testes do serviço em cada mudança.

**Resultado para consolidar:** execute localmente uma API testável em container e deixe a CI rodar os testes automaticamente. Não precisa publicar em nuvem.

- [ ] Etapa 4 concluída

### 5. Aplicações com modelos de linguagem

- [Prompt engineering — OpenAI Developers](https://developers.openai.com/api/docs/guides/prompt-engineering): leia como orientação específica da plataforma; destaque critérios de sucesso, exemplos, formato e separação de instruções e dados.
- [Prompt engineering — Anthropic](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/overview): compare a abordagem e use as seções sobre critérios de sucesso e testes antes de ajustar prompts.
- [Building effective agents — Anthropic](https://www.anthropic.com/engineering/building-effective-agents): antes de criar um agente, compare uma chamada única, um fluxo explícito e um loop de agente; mantenha a solução mais simples que atende ao caso.
- [Using tools — OpenAI Developers](https://developers.openai.com/api/docs/guides/tools): entenda o contrato de chamada de ferramenta, execução pelo aplicativo e retorno do resultado.

Esses materiais são gratuitos para leitura. Para executar exemplos contra uma API comercial, confira o preço atual antes de habilitar cobrança. O roteiro não exige chamadas pagas; uma implementação local ou uma etapa conceitual é suficiente para estudar contratos, fluxo e tratamento de falhas.

**Resultado para consolidar:** desenhe o fluxo de uma aplicação com modelo, ferramenta, permissões e validação de saída; indique em que condições uma chamada direta é suficiente.

- [ ] Etapa 5 concluída

### 6. Avaliação e RAG

- [Demystifying evals for AI agents — Anthropic](https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents): comece por tarefa, trial, grader, taxa de sucesso e avaliação de múltiplas etapas.
- [Artigo original de RAG — NeurIPS](https://arxiv.org/abs/2005.11401): leia resumo, introdução e desenho do sistema para entender o problema que recuperação de informação tenta resolver.
- [Contextual Retrieval — Anthropic](https://www.anthropic.com/engineering/contextual-retrieval): estudo de caso de fornecedor sobre contexto de chunks, busca lexical, embeddings e reranking. Trate os ganhos numéricos como resultado do experimento descrito, não como garantia geral.

**Resultado para consolidar:** crie um conjunto pequeno de perguntas com respostas esperadas e fontes; para cada erro, identifique se falhou a recuperação, a evidência ou a resposta. Um conjunto de 10–15 perguntas já permite começar a enxergar padrões.

- [ ] Etapa 6 concluída

### 7. Agentes e protocolos de ferramentas

- [Effective context engineering — Anthropic](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents): leia como manter instruções, ferramentas, dados e histórico úteis ao longo de uma tarefa.
- [MCP Python SDK — Get started](https://py.sdk.modelcontextprotocol.io/get-started/): construa um servidor mínimo, conecte um cliente e teste em memória antes de usar rede ou uma aplicação hospedeira.
- [Especificação do MCP](https://modelcontextprotocol.io/specification/2026-07-28): consulte a versão publicada atual quando precisar verificar contratos, capacidades e transporte.
- [Documentação A2A](https://a2a-protocol.org/en/docs): leitura complementar para comunicação entre agentes independentes. Deixe a implementação para depois do fluxo simples e do MCP.

**Resultado para consolidar:** exponha uma operação local e de baixo risco por uma interface tipada; documente entrada, saída, erro e permissão necessária.

- [ ] Etapa 7 concluída

### 8. Grafos, observabilidade, segurança e operação

- [OpenTelemetry Python](https://opentelemetry.io/docs/languages/python/getting-started/): instrumente uma aplicação para observar traces, métricas e logs.
- [Google SRE — livro e capítulos](https://sre.google/sre-book/table-of-contents/): escolha “Service Level Objectives”, “Monitoring Distributed Systems”, “Managing Incidents” e “Postmortem Culture”. O texto completo é leitura gratuita.
- [OWASP GenAI Security Project — Top 10 2026](https://genai.owasp.org/initiative/owasp-top-10-for-llm-and-genai/): use a versão 2026, a mais recente consultada nesta curadoria, para revisar prompt injection, exposição de dados, agência excessiva e riscos de sistemas com agentes.

**Resultado para consolidar:** escreva um cenário de falha, o sinal que permitiria detectá-la, o impacto aceitável, a ação de recuperação e o risco de segurança associado.

- [ ] Etapa 8 concluída

### 9. Projeto de integração

Use o [Capstone Cartógrafo local](projeto-final.md) como enunciado de referência. Reduza para um serviço que consulta um conjunto pequeno de documentos autorizados e apresenta as fontes usadas.

Entregas em uma única pasta, no ritmo que fizer sentido:

1. contrato de API e modelo de dados;
2. serviço local com testes;
3. índice de perguntas e resultados esperados;
4. um trace de execução e um cenário de falha documentado;
5. instruções para rodar e limpar os dados locais.

Não precisa de múltiplos agentes, Kubernetes, cloud, billing, certificado ou ML para demonstrar o percurso. Adicione cada peça só se uma pergunta do projeto exigir.

- [ ] Etapa 9 concluída

## Aprofundamentos sob demanda

Estes tópicos cobrem partes especializadas de runtime, sistemas distribuídos e plataforma. Consulte-os quando o projeto exigir; não são uma segunda fila obrigatória antes do capstone.

- **Linux e rede:** [Introduction to Linux — Linux Foundation](https://training.linuxfoundation.org/training/introduction-to-linux/). É gratuito e introdutório, mas o material completo é extenso; quem já usa terminal pode ir direto aos capítulos de processos, operações de rede, shell e segurança local. Para revisar o fluxo DNS → TCP → TLS → HTTP, use [How the Internet works — Cloudflare Learning Center](https://www.cloudflare.com/learning/network-layer/how-does-the-internet-work/).
- **Sistemas distribuídos:** [MIT 6.5840 Distributed Systems](https://pdos.csail.mit.edu/6.824/index.html). O curso e as leituras são públicos, mas é uma disciplina de pós-graduação com labs; para uma passada rápida, escolha aulas e notas sobre RPC, replicação e consenso e deixe os labs como prática avançada.
- **Infraestrutura como código, Kubernetes e GitOps:** [OpenTofu — getting started](https://opentofu.org/docs/intro/), [Kubernetes Basics](https://kubernetes.io/docs/tutorials/kubernetes-basics/) e [Argo CD — getting started](https://argo-cd.readthedocs.io/en/stable/getting_started/). Para laboratório, prefira um cluster local; não é necessário criar recursos em nuvem.
- **Modelagem de grafos:** [Graph Data Modeling Fundamentals — GraphAcademy](https://graphacademy.neo4j.com/courses/modeling-fundamentals), curso gratuito de cerca de 2h. É específico de Neo4j; use como exemplo de modelagem, não como padrão universal.
- **Comunicação entre agentes:** [Documentação A2A](https://a2a-protocol.org/en/docs). Leia conceitos e tarefas apenas se dois serviços precisarem delegar trabalho um ao outro.
- **Governança de risco de IA:** [NIST AI RMF e perfil de GenAI](https://www.nist.gov/itl/ai-risk-management-framework). A página descreve uso voluntário e informa que o AI RMF 1.0 está em revisão.

## Como acompanhar o progresso comigo

O acompanhamento começa em **0/9 etapas** no portal. Marque cada etapa na seção “Roteiro”; esse progresso fica separado dos blocos locais e também é incluído na exportação JSON da página “Progresso”. Se preferir estudar fora do portal, diga “concluí a etapa 1” ou “estou na etapa 3; travei em transações” e posso retomar com você, sem transformar a leitura em uma sequência de aprovações.

Se parar por um tempo, basta informar a última etapa e o que ficou difícil. Vou retomar daí e, quando uma informação de tecnologia puder ter mudado, verifico a documentação atual antes de recomendar o próximo passo.

## Correspondência com o acervo local

| Etapas deste roteiro | Unidades locais relacionadas |
|---|---|
| 1–2 | M00, M01, M02, M02A |
| 3–4 | M03, M04, LT01, LT03 |
| 5 | M05 |
| 6 | M06, M07 |
| 7–8 | M08, M09, LT02, LT04, M12 |
| 9 | M13 |

M10 entra no complemento de grafos se o projeto pedir um grafo. LT01 e LT03 entram nos aprofundamentos de Linux/rede e plataforma se forem relevantes ao contexto. M11 pode ficar como leitura complementar. ML01–ML07 continuam opcionais e não são necessários para esta formação de engenharia de software e sistemas com LLMs.
