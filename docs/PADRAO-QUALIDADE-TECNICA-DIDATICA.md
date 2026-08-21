# Padrão composto de qualidade técnica e didática

**Versão:** 1.0 · **Data-base:** 15/08/2026 · **Aplicação:** todos os módulos e laboratórios

## 1. Autoridade

Nenhum módulo isolado é o padrão completo. O M00 oferece a baseline visual; M01 e M02 já elevaram a densidade, a rastreabilidade, a execução e a validação cross-platform. A qualidade exigida é o conjunto mais forte e coerente de:

1. `CLAUDE.md` e `AGENTS.md`;
2. política de fontes e agnosticismo;
3. currículo e fronteiras entre módulos;
4. especificação e rastreabilidade locais;
5. profundidade N1–N5 e gates G0–G6;
6. evidência executável e revisão do orquestrador;
7. critérios técnicos e didáticos deste documento.

Uma prática nova só eleva a baseline se for verificável, transferível e não criar regressão de acessibilidade, manutenção ou aprendizagem.

## 2. Régua técnica

Cada tópico relevante precisa responder, proporcionalmente ao escopo:

| Camada | Pergunta obrigatória | Evidência |
|---|---|---|
| fundamento | qual problema existe e qual modelo mental explica o mecanismo? | explicação, vocabulário e limites |
| decisão | quando usar, quando evitar e quais trade-offs importam? | matriz, hipótese ou ADR |
| implementação | como construir em Python sem esconder a primitiva? | código completo e ambiente reproduzível |
| falha | como quebra, como detectar e como recuperar? | falha semeada, oráculo e diagnóstico |
| operação/transferência | como medir, proteger, manter e transferir? | telemetria/evidência e defesa técnica |

Requisitos adicionais:

- separar invariante, padrão aberto e adapter de produto;
- tornar explícita a diferença entre conceito, convenção, sintaxe de interface e mecanismo de segurança;
- cobrir caminho feliz, bordas, falha, controle negativo e limitação não provada;
- não publicar claim temporal, benchmark ou saída sem versão/data/método;
- ensinar estrutura de dados, complexidade, runtime, I/O, concorrência, dados, segurança e operação onde forem pré-requisitos reais — sem transformar cada módulo numa enciclopédia repetitiva;
- revisar código gerado por IA pelos mesmos contratos aplicados ao código humano.

## 3. Arquitetura didática

Cada bloco deve permitir estudo independente e retomada após pausa. A sequência recomendada é:

1. **orientação:** o que será aprendido, pré-requisitos e saída observável;
2. **ativação curta:** recuperar conhecimentos anteriores necessários;
3. **modelo mental:** explicar o porquê antes da API ou comando;
4. **exemplo trabalhado:** solução completa, raciocínio e resultado real;
5. **contraste:** alternativa, anti-padrão ou caso quase correto;
6. **prática guiada:** executar/modificar com checkpoints e diagnóstico;
7. **prática independente:** tarefa nova com oráculo, sem solução antecipada;
8. **recuperação e transferência:** explicar sem consulta e aplicar em contexto diferente;
9. **fechamento:** síntese, evidência produzida e próxima retomada.

### 3.1 Carga cognitiva e expertise

- Não assumir conhecimento ainda não ensinado; introduzir sigla, ferramenta e sintaxe no ponto de uso.
- Não reensinar fundamentos que o aluno já domina; usar ponte breve e focal.
- Integrar explicação e código próximos para evitar atenção dividida.
- Começar com exemplo trabalhado e retirar suporte progressivamente.
- Quebrar complexidade por dependências conceituais, não por quantidade arbitrária de texto.
- Explicitar diferenças Python/.NET somente quando evitarem transferência incorreta.

### 3.2 Fixação e avaliação

- Recuperação ativa deve ocorrer sem consulta antes de releitura extensa.
- Exercícios devem variar contexto e intercalar competências já estudadas.
- Cada erro relevante entra em revisão espaçada quando houver estudo real; produção editorial não altera `PROGRESSO.md`.
- Checkpoint mede explicação, decisão, execução, diagnóstico e transferência; múltipla escolha isolada não aprova competência prática.
- A avaliação informa critérios e oráculos antecipadamente, mas não entrega a solução da tarefa independente.

### 3.3 Contrato de voz editorial e contexto técnico

O material é escrito para leitura autônoma por uma pessoa que pode ter menos experiência, sem reduzir a precisão necessária para a formação sênior. Simplificar a linguagem não autoriza apagar nomenclatura, trade-off, falha ou limite. O termo técnico permanece; sua função é explicada no ponto em que passa a ser necessário.

Para toda tecnologia, sigla, API, ferramenta ou construção de linguagem introduzida no bloco, a revisão procura esta cadeia:

1. **situação:** qual tarefa, falha ou custo torna o conceito necessário;
2. **definição:** o que ele é, em linguagem direta;
3. **mecanismo:** o que acontece entre entrada, estado, processamento e efeito;
4. **decisão:** quando ele ajuda, quando não ajuda e qual alternativa importa;
5. **observação:** exemplo trabalhado, contraste ou diagnóstico que torne a explicação verificável.

A prosa alterna frases curtas de fixação e períodos desenvolvidos quando uma relação causal precisa ser construída. Não usar conectivos vazios, adjetivação grandiosa, metáforas corporativas, abertura protocolar ou encerramento clichê. Cada parágrafo deve acrescentar contexto, decisão, consequência ou evidência. Tamanho de texto não é critério de corte: o material pode crescer o necessário para respeitar as dependências conceituais, desde que não repita conteúdo ou esconda ausência de prática.

### 3.4 Panorama de prática vigente no mercado

O curso mostra como os fundamentos aparecem em ferramentas e fluxos que têm adoção observável. Esse panorama orienta estudo e transferência; não escolhe a arquitetura do aluno por popularidade, nem transforma uma pesquisa de mercado em autoridade técnica.

Quando o tema tiver impacto no trabalho atual, o módulo inclui uma seção curta e datada com:

1. o sinal de mercado e sua fonte, método, população e data;
2. a prática profissional que o sinal torna relevante;
3. duas ou mais ferramentas, frameworks ou padrões que materializam a prática, separados entre núcleo, padrão aberto e adapter;
4. limites do dado — por exemplo, repositórios públicos não representam vagas, empresas brasileiras, custo ou adequação ao domínio;
5. uma decisão didática: o que o aluno precisa dominar primeiro e o que ficará apenas como exemplo de ecossistema.

Relatórios de comunidades, pesquisas com desenvolvedores, dados públicos de ecossistemas e estudos com método publicado podem sustentar a seção como fonte industrial. A documentação oficial continua a fonte do comportamento de cada produto; especificações e papers continuam a fonte do fundamento. Dados de adoção, versões, preços, APIs e catálogos de produto são de alto risco e exigem revalidação em até 90 dias.

## 4. Material como referência

O HTML precisa funcionar simultaneamente como aula e consulta:

- sumário com links profundos estáveis para bloco e subseção;
- títulos pesquisáveis, glossário local e referências cruzadas;
- exemplos completos ligados ao repositório/lab e ao commit/evidência aplicável;
- tabelas de referência somente quando ajudarem decisão ou consulta;
- diagnóstico sintoma → hipótese → evidência → correção;
- fonte colocada junto ao claim de alto risco e registro completo ao final;
- nenhuma navegação essencial pode depender apenas de abrir arquivos `file://` manualmente.

Até existir a plataforma integrada, links entre documentos devem usar caminhos relativos funcionais no repositório e âncoras HTML estáveis.

## 5. Apresentação, inclusão e acessibilidade

- HTML semântico, hierarquia de headings, idioma e landmarks corretos;
- teclado, foco visível, contraste, texto redimensionável e conteúdo compreensível sem cor;
- tabelas e código com estratégia móvel; zero overflow da página a 390 px;
- SVG/diagramas com nome e alternativa textual equivalente;
- impressão integral revisada, sem corte ou sobreposição;
- densidade visual compatível com leitura longa, com largura de linha e espaçamento controlados;
- linguagem portuguesa precisa; termos ingleses preservados quando forem o vocabulário profissional, sempre definidos no primeiro uso.

## 6. Fontes pedagógicas de base

| Fonte | Aplicação | Tipo |
|---|---|---|
| [Roediger & Karpicke — testing effect](https://doi.org/10.1111/j.1745-6916.2006.00012.x) | recuperação ativa e retenção | revisão de pesquisa primária |
| [Sweller et al. — Cognitive Architecture and Instructional Design](https://doi.org/10.1007/s10648-019-09465-5) | carga cognitiva, exemplos trabalhados e expertise reversal | revisão científica |
| [Tamang et al. — self-explanation de código](https://doi.org/10.1145/3408877.3432423) | explicação de código e compreensão | experimento em educação de computação |
| [Sandoval-Medina et al. 2024](https://doi.org/10.62273/GMIV1698) | worked examples e self-explanation em programação | estudo aplicado |

Essas fontes orientam decisões didáticas; não justificam percentuais universais nem garantem o mesmo efeito para todo aluno. O curso registra desempenho próprio e ajusta suporte sem confundir percepção de fluência com aprendizagem.

## 7. Gate de autoria por bloco

Antes de marcar um bloco como produzido:

- [ ] pré-requisitos, objetivos e saída observável estão explícitos;
- [ ] conceitos e termos novos são ensinados antes do uso;
- [ ] cada conceito novo apresenta situação, definição, mecanismo, decisão/limite e observação proporcional ao escopo;
- [ ] a voz alterna ritmo sem virar texto telegráfico, e não usa conectivos vazios ou clichês de fechamento;
- [ ] quando relevante, há panorama de prática vigente datado, com sinal de mercado, limite metodológico e separação entre fundamento e produto;
- [ ] existe exemplo completo executável ou justificativa de não aplicabilidade;
- [ ] o resultado publicado veio de execução ou está rotulado como variável;
- [ ] há contraste/anti-padrão e diagnóstico de falha relevante;
- [ ] prática guiada e tarefa independente possuem oráculos distintos;
- [ ] recuperação/transferência avaliam algo além de repetição do exemplo;
- [ ] claims possuem fonte proporcional e adapters não viram fundamentos;
- [ ] links profundos, mobile, teclado, acessibilidade e impressão foram verificados;
- [ ] rastreabilidade e status foram atualizados sem tocar o diário do aluno.

## 8. Regra de evolução

Ao encontrar uma abordagem melhor:

1. registrar qual problema ela resolve;
2. provar o ganho com revisão ou evidência;
3. atualizar este padrão se for geral;
4. aplicar ao módulo em produção;
5. abrir backlog explícito para módulos anteriores afetados.

“Ficar parecido com o M00” nunca é critério suficiente de aceite.
