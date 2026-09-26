# Trilha curada: agentes de programação antes de apps com LLMs

**Curadoria consultada em 26/09/2026.** Este guia apresenta, em linguagem própria, o percurso definido no manifesto [`portal/study-route-source.json`](../portal/study-route-source.json). Os links levam a cursos, documentação, padrões e artigos públicos; o guia não reproduz essas obras.

## Como usar a trilha

Esta é a entrada principal para estudar com uma sequência curta. As dez etapas começam pelo trabalho controlado com agentes de programação, fazem uma ponte seletiva de Python e avançam para aplicações com modelos de linguagem (LLMs). O [portal](../index.html) mantém o checklist e o progresso da trilha separados dos 152 blocos do acervo local.

Cada etapa distingue **leituras essenciais**, que sustentam o percurso, de **aprofundamentos**, que ampliam a comparação ou a prática. As atividades também são opcionais: ajudam a consolidar e transferir o conhecimento, mas não bloqueiam a etapa seguinte, não exigem certificado e podem atravessar quantas sessões forem necessárias.

Os recursos essenciais são gratuitos para leitura. O percurso não exige assinatura, crédito de API, nuvem ou conta de cobrança. Quando uma documentação descreve API comercial, estude o contrato sem executar chamadas pagas; fixtures podem verificar fluxo e formato offline, mas não provam a qualidade de um modelo real.

Codex e OpenCode recebem prática direta nas três primeiras etapas. Claude Code e Cursor aparecem como comparação de documentação oficial, sem exigir instalação ou conta. Recursos, comandos, preços e limites de produto mudam; confira a documentação atual antes de aplicar uma configuração.

## Percurso principal

### 1. Trabalhar com um agente de programação

Um agente de programação pode explorar arquivos, executar comandos e propor mudanças, não apenas completar texto. Um fluxo controlado define objetivo, escopo e evidência de conclusão; depois inspeciona o diff e a verificação observável. Planejamento detalhado é útil quando existem incertezas ou várias partes, mas pode apenas atrasar uma correção pequena. Git e testes funcionam como recuperação e evidência, não como cerimônias obrigatórias para toda tarefa.

**Leitura essencial**

- [Codex Prompting Guide — OpenAI Cookbook](https://developers.openai.com/cookbook/examples/gpt-5/codex_prompting_guide): padrões de tarefa, contexto e verificação no Codex; comandos e modelos permanecem específicos do produto.

**Aprofundamentos**

- [Best practices for Claude Code — Anthropic](https://code.claude.com/docs/en/best-practices): compare exploração, planejamento, implementação e verificação.
- [Run long horizon tasks with Codex — OpenAI Developers](https://developers.openai.com/blog/run-long-horizon-tasks-with-codex): estudo de tarefas longas; separe princípios transferíveis de recursos do Codex.
- [Agents — OpenCode](https://opencode.ai/docs/agents): agentes primários e subagentes como exemplo de harness.

**Atividade opcional:** descreva uma mudança pequena com objetivo, limites e teste de aceite; execute-a com um agente e revise o diff e a saída do teste.

- [ ] Etapa 1 concluída

### 2. Configurar Codex e OpenCode

Organize separadamente regras pessoais, contexto do repositório e pedido da tarefa. Instruções persistentes devem conter apenas o que o agente não consegue inferir e o que evita erros recorrentes. Orientação para o modelo não substitui controles de ferramenta, permissão ou sandbox. A comparação deve considerar configuração pessoal e por projeto, contexto carregado, seleção de modelo e custo: nenhum arquivo configura todos os produtos da mesma forma.

**Leituras essenciais**

- [Config basics — OpenAI Codex](https://developers.openai.com/codex/config-file/config-basic): configuração pessoal e do projeto, precedência, modelo, esforço, aprovações e sandbox.
- [Rules — OpenCode](https://opencode.ai/docs/rules): `AGENTS.md`, inicialização e precedência de instruções no OpenCode.

**Aprofundamentos**

- [Docs MCP em Codex, Cursor e Claude Code — OpenAI Developers](https://developers.openai.com/learn/docs-mcp): instalação de um servidor MCP de documentação e comparação de integrações.
- [Best practices for Claude Code — Anthropic](https://code.claude.com/docs/en/best-practices): contexto, arquivos de instrução, permissões e sandbox específicos do Claude Code.
- [Customize Cursor — Cursor](https://cursor.com/docs/customize-cursor): regras, Skills, MCP, subagentes, hooks e seus escopos no Cursor.

**Atividade opcional:** configure o mesmo repositório de prática em Codex e OpenCode e registre o que é portável e o que pertence a cada produto.

- [ ] Etapa 2 concluída

### 3. Criar Skills e usar MCP com segurança

Uma Skill reúne instruções e recursos para um fluxo reutilizável. O Model Context Protocol (MCP) conecta clientes a recursos, prompts e ferramentas; como uma ferramenta pode agir em sistemas externos, confiança, escopo, credenciais e consentimento fazem parte do desenho. Hooks e subagentes resolvem outros problemas e não são obrigatórios. Comece por um servidor local ou de documentação confiável e somente de leitura; só depois crie uma ferramenta local mínima e inspecione a capacidade concedida. Compatibilidade de Skills e MCP varia entre clientes.

**Leituras essenciais**

- [Skills — OpenAI Developers](https://developers.openai.com/plugins/concepts/skills): Skill como workflow reutilizável e sua fronteira com capacidades fornecidas por MCP.
- [Especificação do Model Context Protocol](https://modelcontextprotocol.io/specification/2026-07-28): arquitetura, recursos, prompts, ferramentas, consentimento e segurança.
- [Agent Skills — OpenCode](https://opencode.ai/docs/skills): criação de `SKILL.md`, descoberta, frontmatter e permissões.

**Aprofundamentos**

- [MCP servers — OpenCode](https://opencode.ai/docs/mcp-servers): configuração e desativação de servidores locais ou remotos, custo de contexto e credenciais.
- [Get started — MCP Python SDK](https://py.sdk.modelcontextprotocol.io/get-started/): servidor Python mínimo para uma ferramenta local de leitura.

**Atividade opcional:** crie uma Skill de revisão e conecte um servidor MCP local com uma ferramenta de leitura; registre o escopo concedido e como desativá-lo.

- [ ] Etapa 3 concluída

### 4. Ponte de Python para quem já programa

O objetivo é ler e modificar as práticas seguintes, não repetir obrigatoriamente um curso introdutório inteiro. Priorize módulos, imports, funções, exceções, coleções, arquivos, ambientes virtuais e testes. A documentação oficial define semântica e biblioteca padrão; o CS50P oferece explicações e exercícios seletivos para os pontos ainda novos. Python é a linguagem das práticas, não um pré-requisito para configurar Codex ou OpenCode.

**Leituras essenciais**

- [Tutorial de Python 3.14 — Python Software Foundation](https://docs.python.org/3.14/tutorial/): selecione funções, módulos, estruturas de dados, erros, exceções e arquivos como referência.
- [Get started — pytest](https://docs.pytest.org/en/stable/getting-started.html): primeiros testes, descoberta e execução local.

**Aprofundamento**

- [CS50’s Introduction to Programming with Python — Harvard](https://cs50.harvard.edu/python/): escolha aulas e exercícios apenas nos assuntos que ainda não domina.

**Atividade opcional:** adapte um script curto que lê um arquivo e teste tanto o caminho normal quanto uma entrada inválida.

- [ ] Etapa 4 concluída

### 5. Construir o primeiro app com LLM

Comece por uma chamada direta com entrada explícita, saída validável, tratamento de erro e fronteira entre domínio e provedor. Prompt não substitui validação do programa. Depois acrescente saída estruturada e tool calling, no qual a aplicação valida e executa a ferramenta. Prompts permanecem versionados no código e o modelo fica atrás de um adapter. Fixtures offline testam a lógica e o formato, mas não medem a qualidade de um modelo real.

**Leituras essenciais**

- [Prompting — OpenAI Developers](https://developers.openai.com/api/docs/guides/prompting): instruções, parâmetros tipados, prompts versionados e testes; o endpoint é específico da OpenAI.
- [Using tools — OpenAI Developers](https://developers.openai.com/api/docs/guides/tools): contrato de tool calling e responsabilidade da aplicação pela validação e execução.

**Aprofundamentos**

- [Prompt engineering overview — Anthropic](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/overview): compare a orientação do fornecedor mantendo invariantes separados de parâmetros proprietários.
- [Building effective agents — Anthropic Engineering](https://www.anthropic.com/engineering/building-effective-agents): orientação practitioner sobre chamada simples, workflow e agente; não é padrão normativo.

**Atividade opcional:** desenhe uma chamada que transforma uma solicitação em resposta estruturada e identifique validações, falhas e dependências do provedor.

- [ ] Etapa 5 concluída

### 6. Transformar a chamada em serviço

Uma API organiza entrada, autenticação quando necessária, validação, resposta e erros. OpenAPI descreve o contrato; FastAPI é uma implementação Python, não o padrão em si. Acrescente persistência apenas se conversas, documentos ou resultados precisarem sobreviver ao processo. Containers, nuvem e integração contínua podem vir depois: a primeira versão deve executar e ser testável localmente.

**Leituras essenciais**

- [Visão geral de HTTP — MDN Web Docs](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Overview): cliente, servidor, requisição, resposta, headers e códigos de estado.
- [Learn OpenAPI — OpenAPI Initiative](https://learn.openapis.org/): descrição e validação de contratos HTTP sem confundir contrato com implementação.

**Aprofundamentos**

- [Tutorial do FastAPI](https://fastapi.tiangolo.com/tutorial/): validação, erros e testes para um serviço Python local.
- [Tutorial do PostgreSQL](https://www.postgresql.org/docs/current/tutorial.html): relações, consultas e transações quando o projeto realmente precisar de banco relacional.

**Atividade opcional:** descreva um endpoint que recebe uma pergunta e devolve resposta, fontes e erros num formato consistente.

- [ ] Etapa 6 concluída

### 7. Avaliar e observar antes de aumentar a complexidade

Avaliações começam por tarefas representativas e critérios que definem uma resposta aceitável. Separe recuperação, fidelidade às fontes, formato e comportamento de ferramentas. Um conjunto pequeno revela padrões iniciais, mas não representa automaticamente todos os usuários. Traces localizam a etapa de uma falha; fixtures validam lógica e formato, não desempenho do modelo. Toda métrica fica ligada à versão do modelo, ao dataset e ao método.

**Leitura essencial**

- [Demystifying evals for AI agents — Anthropic Engineering](https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents): tarefa, execução, grader e taxa de sucesso; exemplos e recomendações são orientação practitioner do fornecedor.

**Aprofundamentos**

- [Evals — OpenAI Developers](https://developers.openai.com/api/docs/guides/evals): abordagem da plataforma OpenAI para comparar com avaliações agnósticas no código.
- [OpenTelemetry Python — Get started](https://opentelemetry.io/docs/languages/python/getting-started/): spans, traces, métricas e instrumentação Python.

**Atividade opcional:** escreva de cinco a dez casos com resultado esperado e fonte; classifique as falhas pela etapa do sistema.

- [ ] Etapa 7 concluída

### 8. RAG com recuperação e evidências

Retrieval-Augmented Generation (RAG) recupera trechos para oferecer contexto à geração; não garante que a fonte esteja correta nem que a resposta seja fiel a ela. Comece por um corpus pequeno e autorizado, preserve metadados e identificadores de origem e mostre a evidência usada. Avalie separadamente busca e resposta. Contextualização de chunks, busca híbrida e reranking são hipóteses a testar, não receitas universais; ganhos publicados dependem do experimento descrito.

**Leitura essencial**

- [Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks — NeurIPS 2020](https://arxiv.org/abs/2005.11401): resumo, introdução e desenho do trabalho original de RAG.

**Aprofundamento**

- [Contextual Retrieval — Anthropic Engineering](https://www.anthropic.com/engineering/contextual-retrieval): estudo de caso practitioner; verifique método e limites antes de interpretar os ganhos quantitativos.

**Atividade opcional:** prepare perguntas sobre documentos locais e classifique cada erro como ingestão, recuperação, evidência ou geração.

- [ ] Etapa 8 concluída

### 9. Workflows primeiro; agentes quando fizer sentido

Um workflow fixa as etapas do processo; um agente escolhe parte do caminho em tempo de execução usando contexto e ferramentas. A autonomia adicional amplia também erro, latência, custo e risco. Comece pelo menor fluxo que resolve o problema. Ferramentas devem ser estreitas, com argumentos e resultados validados, limites de iteração e recursos e consentimento humano para ações sensíveis. MCP usado dentro do produto é diferente do MCP configurado no Codex ou OpenCode para ajudar a programar.

**Leitura essencial**

- [Building effective agents — Anthropic Engineering](https://www.anthropic.com/engineering/building-effective-agents): padrões e trade-offs de workflows e agentes sob uma perspectiva practitioner.

**Aprofundamentos**

- [Effective context engineering for AI agents — Anthropic Engineering](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents): organização de contexto, ferramentas, dados e histórico.
- [Agents — OpenAI Developers](https://developers.openai.com/api/docs/guides/agents): runtime gerenciado, harness próprio e loop da aplicação; APIs e opções são específicas da plataforma.

**Atividade opcional:** desenhe um workflow e aponte qual decisão em tempo de execução justificaria transformá-lo em agente.

- [ ] Etapa 9 concluída

### 10. Segurança, operação e projeto de integração

O capstone é um serviço local que responde perguntas sobre poucos documentos autorizados, mostra os trechos-fonte e executa casos de avaliação. A lógica pode ser testada offline com fixtures identificadas; provedor real ou modelo local é opcional. Não exige GraphRAG, Kubernetes, publicação em nuvem ou conta de cobrança. Revise prompt injection, exposição de dados, permissões excessivas e falhas de recuperação; guarde um trace para localizar falhas e explique como interromper ou remover integrações externas.

**Leitura essencial**

- [OWASP GenAI LLM Top 10 2026](https://genai.owasp.org/resource/owasp-genai-llm-top-10-2026/): riscos de aplicações com LLMs e agentes; confirme a edição atual ao estudar.

**Aprofundamentos**

- [Google SRE Book — capítulos selecionados](https://sre.google/sre-book/table-of-contents/): SLOs, monitoramento, incidentes e postmortem no contexto operacional do Google.
- [AI Risk Management Framework — NIST](https://www.nist.gov/itl/ai-risk-management-framework): orientação voluntária de risco e perfil de GenAI, não certificação do capstone.

Use o [Capstone Cartógrafo](projeto-final.md) como referência e reduza-o ao necessário: contrato e modelo de dados, serviço local testado, perguntas com resultados esperados, trace e cenário de falha, além de instruções para executar e limpar dados locais.

**Atividade opcional:** descreva um incidente plausível, seu sinal de detecção, impacto, recuperação e o limite de segurança do capstone.

- [ ] Etapa 10 concluída

## Aprofundamentos opcionais fora do percurso

- **M11 — modelos locais e fundamentos de ML/DL:** todo o módulo é opcional; não é pré-requisito para aplicações com LLM, RAG ou agentes.
- **ML01–ML07 — apêndice de ML:** matemática, ML tabular, treinamento, validação e MLOps permanecem fora da trilha principal. Consulte o [currículo](../CURRICULO.md) se esse aprofundamento servir ao seu objetivo.

## Como acompanhar o progresso

O acompanhamento começa em **0/10 etapas** no portal. As marcações ficam separadas do progresso dos 152 blocos locais e entram na exportação JSON da página “Progresso”. Para retomar fora do portal, informe a última etapa concluída e o ponto difícil; isso não transforma a leitura numa sequência de aprovações.

## Correspondência com o acervo local

Os módulos locais formam um acervo secundário: oferecem explicações e laboratórios em revisão, mas não precisam ser lidos linearmente para concluir a trilha curada.

| Etapa | Unidades locais relacionadas |
|---:|---|
| 1 | M00, M01 |
| 2 | M00, M04 |
| 3 | M00, M09 |
| 4 | M02 |
| 5 | M05 |
| 6 | M03, M04 |
| 7 | M06 |
| 8 | M07 |
| 9 | M08, M09 |
| 10 | M12, M13 |

As demais unidades e os laboratórios transversais continuam acessíveis no [portal](../index.html). O [status de implementação](STATUS-IMPLEMENTACAO-CURSO.md) descreve prontidão, gates e bloqueios do acervo v4; esse processo editorial é separado do checklist pessoal desta trilha.
