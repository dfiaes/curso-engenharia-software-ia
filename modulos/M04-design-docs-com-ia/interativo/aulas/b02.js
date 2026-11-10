/* M04 · Bloco 2: diagrama como código, C4 e Mermaid. Fonte: M04.html#b02. Sintaxe do Mermaid é informação de alto risco (verificada em 14/09/2026; revalidar em até 90 dias). */
(function () {
  var L = function (kind, text) { return { kind: kind, text: text }; };
  function opc(id, texto, correta, porque) { return { id: id, texto: texto, correta: correta, porque: porque }; }
  var F = '```';

  var etapasValida = function () {
    return [
      { id: 'doc', nome: 'O documento', descricao: 'Três blocos mermaid', tom: 'dns', ms: 3, linhas: [
        L('cmd', 'python validar.py docs/arquitetura.md'),
        L('info', 'bloco 1: flowchart LR            (fechado)'),
        L('info', 'bloco 2: flowchar LR             (fechado, tipo com erro de digitação)'),
        L('info', 'bloco 3: sequenceDiagram         (a cerca nunca fecha)')] },
      { id: 'cerca', nome: 'Regra: cerca', descricao: 'Compara aberturas e blocos fechados', tom: 'tcp', ms: 1, linhas: [
        L('out', 'aberturas de "```mermaid": 3'),
        L('out', 'blocos fechados achados pela regex: 2'),
        L('in', 'mermaid-cerca')] },
      { id: 'tipo', nome: 'Regra: tipo', descricao: 'Primeira linha de cada bloco fechado', tom: 'tls', ms: 1, linhas: [
        L('out', 'bloco 1: "flowchart LR" -> tipo conhecido'),
        L('out', 'bloco 2: "flowchar LR" -> não começa com nenhum tipo conhecido'),
        L('in', 'mermaid-tipo:2')] },
      { id: 'saida', nome: 'Resultado', descricao: 'Exit code do CI', tom: 'ink', ms: 1, linhas: [
        L('in', "['mermaid-cerca', 'mermaid-tipo:2']"),
        L('hint', 'exit=1: o GitHub mostraria o texto cru nos dois blocos com problema')] }
    ];
  };

  TrilhaAula.registrar({
    id: 'm04-b2',
    titulo: 'Diagrama como código: C4 e Mermaid',
    minutos: 35,
    resumo: 'Diagrama em ferramenta gráfica morre por atrito. Como texto no repositório ele versiona, entra no diff do PR e o agente lê. C4 dá os níveis de zoom; cinco tipos de Mermaid bastam.',
    objetivo: 'Escolher o nível C4 certo para uma pergunta, escrever os cinco tipos de diagrama Mermaid que importam e decidir o que se gera do código e o que se escreve à mão.',
    revisao: [
      { id: 'm04b2-niveis', pergunta: 'Quais níveis do C4 concentram 90% do valor, e o que fazer com o L4 (código)?',
        opcoes: [
          opc('a', 'L1 (contexto) e L2 (containers); o L4 se gera a partir do código, não se desenha à mão', true, 'o próprio Simon Brown desaconselha manter o L4 à mão.'),
          opc('b', 'L3 e L4, desenhados à mão por quem conhece o código', false, 'L3 só vale para containers complexos e L4 envelhece na hora.'),
          opc('c', 'Todos os quatro, com o mesmo detalhe', false, 'misturar níveis é o vício que o C4 corrige.')] },
      { id: 'm04b2-pergunta', pergunta: 'Um diagrama mistura "Kafka", "Cliente pessoa física" e a classe OrderValidator. Qual a correção?',
        opcoes: [
          opc('a', 'Separar por nível de abstração: um diagrama por pergunta, com no máximo cerca de sete elementos', true, 'abstração é escolher qual detalhe importa para a pergunta; passou de sete, misturou níveis ou falta um nível acima.'),
          opc('b', 'Acrescentar mais caixas para completar o desenho', false, 'mais elementos pioram a mistura.'),
          opc('c', 'Trocar a ferramenta de desenho', false, 'a ferramenta não é o problema; o nível é.')] },
      { id: 'm04b2-gerar', pergunta: 'Qual diagrama se gera do código e qual se escreve à mão?',
        opcoes: [
          opc('a', 'Gera-se o de classes (derivado); escreve-se o de contexto de negócio (nenhum parser sabe quem é dono do sistema externo)', true, 'o que pode ser derivado do código se gera; o que não pode se escreve e se revisa.'),
          opc('b', 'Gera-se o de contexto; escreve-se o de classes', false, 'inverte a regra.'),
          opc('c', 'Tudo à mão, para garantir qualidade', false, 'o que é derivável e escrito à mão envelhece.')] },
      { id: 'm04b2-status', pergunta: 'Uma coluna do banco se chama status. Que diagrama ela merece e o que isso implica no código?',
        opcoes: [
          opc('a', 'Um stateDiagram-v2; transição que não existe no diagrama deve ser proibida no código', true, 'o diagrama vira especificação das transições legais.'),
          opc('b', 'Um erDiagram; nada muda no código', false, 'o ER mostra a coluna, não as transições.'),
          opc('c', 'Nenhum: status é detalhe de implementação', false, 'máquina de estados esquecida vira bug de transição.')] },
      { id: 'm04b2-c4mermaid', pergunta: 'O que o curso diz sobre o C4 no Mermaid?',
        opcoes: [
          opc('a', 'É oficialmente experimental e de layout manual; aceite o visual imperfeito ou use Structurizr DSL e exporte', true, 'vale mais estar no repositório e renderizar no GitHub do que ser bonito; se ficou ilegível, há elementos demais.'),
          opc('b', 'É estável e tem layout automático', false, 'a documentação do Mermaid avisa o contrário.'),
          opc('c', 'Não existe; use só flowchart', false, 'C4Context e C4Container existem, com ressalvas.')] }
    ],
    abas: [
      { rotulo: 'Entender', blocos: [
        { tipo: 'texto', html:
          '<h3>O slide antigo com a caixa "Integrações"</h3>' +
          '<p>Todo sistema tem um diagrama de arquitetura. Ele está num slide antigo, tem uma caixa chamada "Integrações" e ninguém sabe se ainda é verdade. O problema nunca foi desenhar: foi manter. Diagrama em ferramenta gráfica morre por três motivos mecânicos: <strong>não versiona</strong> (não dá para revisar num PR nem ver o diff), <strong>não é lido por agente</strong> (é imagem) e <strong>atualizar exige abrir outra ferramenta</strong>, atrito suficiente para nunca acontecer. Diagrama como texto resolve os três.</p>' },
        { tipo: 'callout', tom: 'info', titulo: 'O que é Mermaid', html:
          '<p><strong>Mermaid</strong> é uma linguagem de marcação para diagramas: você escreve texto (<code>A --&gt; B</code>) e uma biblioteca JavaScript renderiza SVG. O que a tornou padrão de fato é o suporte nativo em GitHub, GitLab, Azure DevOps e Obsidian: um bloco de código marcado como <code>mermaid</code> dentro de um <code>.md</code> aparece renderizado direto no navegador, sem plugin nem build.</p>' +
          '<p>Consequências: o diagrama vive no mesmo commit do código, aparece no diff do PR em texto legível e é lido e escrito por agentes como qualquer código. Para renderizar localmente ou em CI: <code>npx @mermaid-js/mermaid-cli -i arquivo.mmd -o out.svg</code>.</p>' },
        { tipo: 'callout', tom: 'success', titulo: 'Derivado se gera; o resto se escreve', html:
          '<p>A regra do módulo inteiro: o que pode ser derivado do código deve ser <strong>gerado</strong>; o que não pode ser derivado deve ser <strong>escrito à mão e revisado</strong>. Diagrama de classes: gere a partir do fonte, sempre correto porque derivado. Diagrama de contexto de negócio: escreva, porque nenhum parser sabe que aquele sistema externo pertence a outro time nem quais restrições contratuais o cercam.</p>' },
        { tipo: 'texto', html:
          '<h3>Abstração: o vício que o C4 corrige</h3>' +
          '<p>Abstração não é "esconder detalhe": é escolher qual detalhe importa para a pergunta que está sendo feita. Um diagrama só funciona se todos os elementos estiverem no mesmo nível e servirem à mesma pergunta.</p>' +
          '<ul><li><strong>Um diagrama, uma pergunta.</strong> "Como o dinheiro entra?" e "como o deploy acontece?" são dois diagramas, mesmo que as caixas se repitam. Diagrama que responde a tudo não responde a nada.</li>' +
          '<li><strong>Sete elementos é o teto prático.</strong> Passou disso, ou você misturou níveis ou precisa de um nível acima agrupando. O mesmo limite vale para uma tela, uma API e um menu.</li>' +
          '<li><strong>Legenda não é opcional.</strong> Se a cor ou a forma significa algo, diga o quê; a metade dos diagramas corporativos usa cor decorativa e o leitor procura um padrão inexistente.</li></ul>' +
          '<p>É o raciocínio do M03, bloco 4: camadas de código são níveis de abstração impostos por <code>import</code>; níveis de C4 são a mesma disciplina aplicada à figura. Quando o diagrama fica confuso, quase sempre a arquitetura também está: o diagrama é sintoma, não causa.</p>' },
        { tipo: 'takeaway', html: 'Diagrama <mark>como texto no repositório</mark> versiona, entra no diff e o agente lê; <mark>derivado se gera</mark>, o resto se escreve.' }
      ] },

      { rotulo: 'C4 e os cinco tipos', blocos: [
        { tipo: 'texto', html:
          '<h3>C4: quatro níveis de zoom, não quatro diagramas obrigatórios</h3>' +
          '<p>O <strong>C4 Model</strong> (Simon Brown) resolve o problema mais comum de diagrama de arquitetura: misturar níveis na mesma figura. Propõe uma hierarquia de zoom, como um mapa: país, estado, cidade, rua. Na prática, 90% do valor está em L1 e L2. Exemplo: um encurtador de links.</p>' },
        { tipo: 'abas', rotulo: 'Os quatro níveis', itens: [
          { rotulo: 'L1 · Contexto', blocos: [{ tipo: 'texto', html: '<p>Seu sistema como <strong>uma caixa</strong>, mais usuários e sistemas externos (no exemplo: Cliente pessoa, Encurtador, Provedor de e-mail).</p><ul><li><strong>Responde:</strong> quem usa e com o que ele conversa?</li><li><strong>Público:</strong> qualquer pessoa, inclusive não técnica.</li><li><strong>Vale a pena sempre.</strong></li></ul>' }] },
          { rotulo: 'L2 · Containers', blocos: [{ tipo: 'texto', html: '<p>Unidades executáveis ou implantáveis: API, worker, SPA, banco, fila (no exemplo: SPA Angular, API FastAPI, Worker de cliques, PostgreSQL).</p><ul><li><strong>Responde:</strong> o que é implantado e como se falam?</li><li><strong>Público:</strong> qualquer dev.</li><li><strong>O mais útil no dia a dia:</strong> é o mapa do deploy.</li></ul>' }] },
          { rotulo: 'L3 · Componentes', blocos: [{ tipo: 'texto', html: '<p>Blocos <strong>dentro de um container</strong>: routers, services, repositories (no exemplo: Router, Service, Repository, Domain).</p><ul><li><strong>Responde:</strong> como a API é montada por dentro? Reflete as camadas do M03, bloco 4.</li><li><strong>Público:</strong> quem mexe naquele container.</li><li>Só para containers complexos.</li></ul>' }] },
          { rotulo: 'L4 · Código', blocos: [{ tipo: 'texto', html: '<p>Classes, funções e schemas. <strong>Gere, nunca desenhe à mão</strong>: o próprio Simon Brown desaconselha mantê-lo à mão. Em geral sai de uma ferramenta que lê o fonte; é o território do seu Capstone.</p>' }, { tipo: 'codigo', linguagem: 'mermaid', texto: 'classDiagram\n  class Link { +slug: str\n               +url: str\n               +hits: int }\n  Service --> Repository' }] }
        ] },
        { tipo: 'texto', html:
          '<h3>Mermaid: os cinco diagramas que você vai usar</h3>' +
          '<p>Mermaid tem dezenas de tipos; cinco cobrem tudo que este curso e o Capstone precisam. Para cada um, quando usar e a sintaxe mínima.</p>' },
        { tipo: 'abas', rotulo: 'Cinco tipos', itens: [
          { rotulo: 'flowchart', blocos: [
            { tipo: 'texto', html: '<p>Fluxo de decisão e pipelines; o mais versátil e o que você mais vai escrever. <code>LR</code> é left-right, <code>TD</code> é top-down. As formas comunicam o tipo: <code>[texto]</code> processo, <code>{texto}</code> decisão, <code>[(texto)]</code> banco, <code>([texto])</code> início ou fim.</p>' },
            { tipo: 'codigo', linguagem: 'mermaid', texto: 'flowchart LR\n    A[Repositório legado] --> B{Já indexado?}\n    B -- não --> C[Clonar e varrer arquivos]\n    B -- sim --> D[Ler índice do cache]\n    C --> E[Parse determinístico<br/>tree-sitter]\n    E --> F[(Postgres:<br/>grafo + pgvector)]\n    D --> F\n    F --> G[Agente investigador]' }] },
          { rotulo: 'sequenceDiagram', blocos: [
            { tipo: 'texto', html: '<p>Quem chama quem, em que ordem. Insubstituível para fluxo assíncrono, timeout e ordem de operações, exatamente onde a prosa falha. <code>-&gt;&gt;</code> é chamada, <code>--&gt;&gt;</code> é resposta, <code>autonumber</code> numera as setas (ótimo para citar "passo 4" no texto).</p>' },
            { tipo: 'codigo', linguagem: 'mermaid', texto: 'sequenceDiagram\n    autonumber\n    participant U as Usuário\n    participant API as FastAPI\n    participant GW as LLM Gateway\n    participant DB as Postgres\n\n    U->>API: POST /analises {repo_url}\n    API->>DB: INSERT analise (status=pending)\n    API-->>U: 202 Accepted {id}\n    API->>GW: gerar resumo (async)\n    GW-->>API: resultado + tokens\n    API->>DB: UPDATE analise (status=done, custo)\n    Note over API,DB: transação curta:<br/>LLM fora dela (M03 b2)' }] },
          { rotulo: 'erDiagram', blocos: [
            { tipo: 'texto', html: '<p>Modelo de dados. O valor está na <strong>cardinalidade</strong>: <code>||--o{</code> é um-para-muitos (obrigatório para opcional). Serve para revisar a modelagem antes da migration, e o agente lê isso melhor que o DDL espalhado.</p>' },
            { tipo: 'codigo', linguagem: 'mermaid', texto: 'erDiagram\n    TENANT ||--o{ PROJECT : possui\n    PROJECT ||--o{ ANALYSIS : gera\n    ANALYSIS ||--o{ FINDING : contem\n    PROJECT {\n        bigint id PK\n        bigint tenant_id FK\n        text repo_url\n        jsonb meta\n    }' }] },
          { rotulo: 'stateDiagram-v2', blocos: [
            { tipo: 'texto', html: '<p>Máquina de estados. Você vai usá-lo no M10 (LangGraph é uma máquina de estados) e no M12 (assinatura e cobrança). Regra: <strong>se uma coluna do banco se chama <code>status</code>, ela merece um <code>stateDiagram</code></strong>, e as transições que não existem no diagrama devem ser proibidas no código.</p>' },
            { tipo: 'codigo', linguagem: 'mermaid', texto: 'stateDiagram-v2\n    [*] --> pending\n    pending --> running: worker pega da fila\n    running --> awaiting_review: achou risco alto\n    running --> done: sem intervenção\n    awaiting_review --> done: humano aprova\n    awaiting_review --> failed: humano rejeita\n    running --> failed: erro irrecuperável\n    failed --> pending: retry manual\n    done --> [*]' }] },
          { rotulo: 'C4Container', blocos: [
            { tipo: 'texto', html: '<p>A arquitetura em C4 (<code>C4Context</code> e <code>C4Container</code>).</p>' },
            { tipo: 'codigo', linguagem: 'mermaid', texto: 'C4Container\n    title Containers — Cartógrafo (Capstone)\n\n    Person(dev, "Dev / consultor", "Analisa um sistema legado")\n    System_Ext(repo, "Repositório Git", "Código legado do cliente")\n    System_Ext(llm, "Provedor LLM", "Anthropic / OpenAI via gateway")\n\n    Container_Boundary(c1, "Cartógrafo") {\n        Container(api, "API", "Python/FastAPI", "REST + auth + billing")\n        Container(worker, "Worker de ingestão", "Python", "Clone, parse, indexação")\n        Container(mcp, "Servidor MCP", "Python/FastMCP", "Expõe o índice ao editor")\n        ContainerDb(db, "Postgres", "pgvector + AGE", "Grafo, embeddings, tenants")\n    }\n\n    Rel(dev, api, "Cria análise", "HTTPS")\n    Rel(api, db, "Lê/escreve", "asyncpg")\n    Rel(worker, repo, "Clona", "git")\n    Rel(worker, db, "Grava grafo e vetores")\n    Rel(worker, llm, "Resume e classifica", "HTTPS")\n    Rel(dev, mcp, "Pergunta de dentro do editor", "stdio")' }] }
        ] },
        { tipo: 'callout', tom: 'danger', titulo: 'Cuidado com o C4 do Mermaid, e a alternativa', html:
          '<p>O suporte a C4 no Mermaid é <strong>oficialmente experimental</strong>: a documentação avisa que sintaxe e propriedades podem mudar, e faltam recursos (sprites, tags, links, legendas). O layout é manual: a posição depende da ordem das declarações, então diagramas médios saem embolados.</p>' +
          '<p>Duas saídas honestas: (1) usar <code>C4Context</code>/<code>C4Container</code> mesmo assim, aceitando o visual imperfeito em troca de ficar tudo em Mermaid (o que este curso faz: vale mais estar no repositório e renderizar no GitHub do que ser bonito); (2) escrever em <strong>Structurizr DSL</strong> (a ferramenta do próprio autor do C4, com layout automático e um modelo único que gera todos os níveis) e exportar. Para o Capstone, Mermaid basta. Se o diagrama ficar ilegível, é sinal de elementos demais: volte ao teto de sete.</p>' },
        { tipo: 'takeaway', html: 'L1 e L2 dão <mark>90% do valor</mark>; L4 se <mark>gera</mark>. Cinco tipos bastam: flowchart, sequence, ER, state e C4.' }
      ] },

      { rotulo: 'Ver funcionando', blocos: [
        { tipo: 'texto', html:
          '<h3>Um verificador de diagramas em ação</h3>' +
          '<p>No bloco 4 você verá o linter de docs completo; aqui está a regra 3 dele, a que cuida dos blocos Mermaid. Um documento com três blocos: um correto, um com erro de digitação no tipo e um cuja cerca nunca fecha. Preveja o resultado.</p>' },
        { tipo: 'rode', id: 'm04b2-rode', titulo: 'Rode a regra de Mermaid', enunciado: 'A saída vem da solução do exercício desta aula, executada sobre o documento descrito na primeira etapa. Clique em cada regra para ler só as linhas dela.',
          prefixo: '$', entrada: 'python validar.py docs/arquitetura.md', unidade: 'ms', terminalTitulo: 'validar mermaid', etapas: etapasValida(),
          prever: { pergunta: 'O documento tem três blocos: o 1 correto, o 2 com "flowchar" e o 3 sem fechamento. Quantas violações a regra acusa?', opcoes: [
            { id: 'a', texto: 'Uma: só o bloco 2, porque o 3 é só um fim de arquivo.', correta: false, porque: 'a cerca aberta sem fechamento é violação própria: o GitHub não renderiza o diagrama.' },
            { id: 'b', texto: 'Duas: a cerca sem fechamento e o tipo do bloco 2.', correta: true, porque: 'a regra compara aberturas (3) com blocos fechados (2) e confere a primeira linha de cada bloco fechado.' },
            { id: 'c', texto: 'Três: um erro por bloco.', correta: false, porque: 'o bloco 1 está correto, e o bloco 3 nem chega à checagem de tipo por não estar fechado.' }
          ] },
          tutorAntes: 'Aperte Enter e depois clique em "Regra: tipo" para ver por que o bloco 2 reprova.',
          tutorDepois: 'Duas violações, ambas mecânicas e baratas. Um tipo desconhecido ou uma cerca aberta é o que faz o GitHub mostrar o texto cru em vez do desenho.',
          callout: 'Você viu o verificador acusar a cerca aberta e o tipo com erro de digitação.' },
        { tipo: 'texto', html:
          '<p>Agora escreva a regra. A cópia executável e testada do linter vive no laboratório (<code>lab/src/design_guard/</code>); aqui você implementa só a parte de Mermaid.</p>' },
        { tipo: 'python', id: 'm04b2-python', titulo: 'Escreva o verificador de Mermaid', obrigatorio: false,
          enunciado: 'Implemente <code>validar_mermaid(texto)</code>. Devolva <code>"mermaid-cerca"</code> se o número de aberturas <code>```mermaid</code> for diferente do número de blocos fechados, e <code>"mermaid-tipo:N"</code> (N em base 1) para cada bloco fechado cuja primeira linha não vazia não comece por um dos <code>MERMAID_TIPOS</code>.',
          codigo: [
      'import re',
      '',
      'MERMAID_TIPOS = (',
      '    "flowchart", "graph", "sequenceDiagram", "classDiagram", "erDiagram",',
      '    "stateDiagram-v2", "C4Context", "C4Container", "C4Component",',
      '    "C4Dynamic", "C4Deployment", "gantt", "journey", "mindmap",',
      ')',
      'RE_MERMAID = re.compile(r"^```mermaid\\s*$(.*?)^```\\s*$", re.MULTILINE | re.DOTALL)',
      '',
      '',
      'def validar_mermaid(texto):',
      '    """Devolve a lista de violações: "mermaid-cerca" se algum bloco não',
      '    fecha e "mermaid-tipo:N" para o bloco N (base 1) cujo tipo é desconhecido."""',
      '    problemas = []',
      '    # 1. compare texto.count("```mermaid") com len(RE_MERMAID.findall(texto))',
      '    # 2. para cada bloco, pegue a primeira linha não vazia',
      '    # 3. str.startswith aceita a tupla MERMAID_TIPOS',
      '    return problemas'
    ].join('\n'), testes: [
      'FENCE = "```"',
      '',
      '',
      'def doc(*blocos):',
      '    return "\\n\\n".join(f"{FENCE}mermaid\\n{b}\\n{FENCE}" for b in blocos)',
      '',
      '',
      'def test_documento_limpo():',
      '    assert validar_mermaid(doc("flowchart LR\\n  A --> B", "sequenceDiagram\\n  A->>B: oi")) == []',
      '',
      '',
      'def test_tipo_com_erro_de_digitacao():',
      '    assert validar_mermaid(doc("flowchart LR\\n  A --> B", "flowchar LR\\n  A --> B")) == ["mermaid-tipo:2"]',
      '',
      '',
      'def test_cerca_sem_fechamento():',
      '    assert validar_mermaid(f"{FENCE}mermaid\\nflowchart LR\\n  A --> B\\n") == ["mermaid-cerca"]',
      '',
      '',
      'def test_linhas_em_branco_antes_do_tipo():',
      '    assert validar_mermaid(doc("\\n\\nstateDiagram-v2\\n  [*] --> a")) == []',
      '',
      '',
      'def test_texto_sem_diagrama():',
      '    assert validar_mermaid("# so prosa\\n\\nnada aqui") == []',
      '',
      '',
      'def test_bloco_vazio_e_tipo_desconhecido():',
      '    assert validar_mermaid(doc("")) == ["mermaid-tipo:1"]'
    ].join('\n'),
          dica: 'Guarde <code>blocos = RE_MERMAID.findall(texto)</code>, compare <code>texto.count("```mermaid")</code> com <code>len(blocos)</code> e use <code>enumerate(blocos, start=1)</code>. A primeira linha não vazia sai de <code>next((l.strip() for l in bloco.splitlines() if l.strip()), "")</code>.',
          solucao: [
      'import re',
      '',
      'MERMAID_TIPOS = (',
      '    "flowchart", "graph", "sequenceDiagram", "classDiagram", "erDiagram",',
      '    "stateDiagram-v2", "C4Context", "C4Container", "C4Component",',
      '    "C4Dynamic", "C4Deployment", "gantt", "journey", "mindmap",',
      ')',
      'RE_MERMAID = re.compile(r"^```mermaid\\s*$(.*?)^```\\s*$", re.MULTILINE | re.DOTALL)',
      '',
      '',
      'def validar_mermaid(texto):',
      '    problemas = []',
      '    blocos = RE_MERMAID.findall(texto)',
      '    if texto.count("```mermaid") != len(blocos):',
      '        problemas.append("mermaid-cerca")',
      '    for i, bloco in enumerate(blocos, start=1):',
      '        primeira = next((l.strip() for l in bloco.splitlines() if l.strip()), "")',
      '        if not primeira.startswith(MERMAID_TIPOS):',
      '            problemas.append(f"mermaid-tipo:{i}")',
      '    return problemas'
    ].join('\n'),
          tutorDepois: 'O controle do bloco vazio importa: sem primeira linha, o tipo é desconhecido. O verificador é determinístico e roda em microssegundos; nenhum modelo precisa contar cercas.',
          callout: 'O verificador de Mermaid passou nos testes, com o bloco vazio e a cerca aberta tratados.' },
        { tipo: 'takeaway', html: 'A regra de Mermaid é <mark>mecânica</mark>: cerca fechada e <mark>tipo conhecido</mark>, com exit code.' }
      ] },

      { rotulo: 'Praticar e conferir', blocos: [
        { tipo: 'texto', html:
          '<p>Complete um diagrama de sequência que mostra o caminho de erro, não só o caminho feliz. Depois decida o que fazer com um diagrama que misturou níveis.</p>' },
        { tipo: 'complete', id: 'm04b2-complete', titulo: 'Complete o sequenceDiagram com o caminho de erro', linguagem: 'mermaid',
          enunciado: 'Escolha o trecho que torna o diagrama honesto: chamada assíncrona, resposta e o caminho de falha do gateway de LLM.',
          partes: [
            'sequenceDiagram\n    autonumber\n    participant U as Usuário\n    participant API as FastAPI\n    participant GW as LLM Gateway\n\n    U->>API: POST /analises {repo_url}\n    API', { lacuna: 'resp', opcoes: ['-->>U: 202 Accepted {id}', '->>U: 202 Accepted {id}', '-->API: 202'], correta: '-->>U: 202 Accepted {id}' },
            '\n    API->>GW: gerar resumo (async)\n    ', { lacuna: 'bloco', opcoes: ['alt', 'loop', 'participant'], correta: 'alt' },
            ' gateway respondeu\n        GW-->>API: resultado + tokens\n    ', { lacuna: 'senao', opcoes: ['else', 'end', 'rect'], correta: 'else' },
            ' timeout ou erro\n        Note over API,GW: status=failed; retry manual\n    end\n'
          ],
          explicacao: 'A resposta usa a seta tracejada <code>--&gt;&gt;</code> (chamada é <code>-&gt;&gt;</code>). O <code>alt ... else ... end</code> mostra o caminho de erro: diagrama que só mostra o caminho feliz é propaganda. Cada dúvida de produto encontrada ao desenhar vira linha de spec ou ADR.',
          callout: 'Sequência com resposta tracejada e caminho de falha explícito.' },
        { tipo: 'cenario', id: 'm04b2-cenario', titulo: 'O diagrama que mistura tudo', obrigatorio: false,
          enunciado: 'O time tem um único diagrama com a caixa "Kafka", a caixa "Cliente pessoa física" e a classe OrderValidator, e ninguém entende. Decida como consertar.',
          inicio: 'inicio',
          nos: {
            inicio: { texto: 'O diagrama tem 14 elementos de níveis diferentes e responde a "tudo". Qual o primeiro movimento?', opcoes: [
              { texto: 'Redesenhar numa ferramenta mais bonita, com cores por equipe.', vai: 'f-cor', tom: 'ruim', consequencia: 'cor sem legenda é decoração; o problema era o nível, não a ferramenta.' },
              { texto: 'Escolher a pergunta de cada diagrama e separar por nível: L1 para quem usa, L2 para o deploy, L3 só do container complexo.', vai: 'niveis', tom: 'ok', consequencia: 'cada figura responde a uma pergunta, com no máximo cerca de sete elementos.' },
              { texto: 'Acrescentar mais detalhes até cobrir todos os casos.', vai: 'f-mais', tom: 'ruim', consequencia: 'o diagrama vira um mapa ilegível: quem responde a tudo não responde a nada.' }
            ] },
            niveis: { texto: 'O L2 sai embolado no Mermaid (C4Container). O que faz?', opcoes: [
              { texto: 'Reordenar as declarações, cortar para sete elementos e, se persistir, dividir em dois diagramas ou migrar para Structurizr.', vai: 'f-bom', tom: 'ok', consequencia: 'o layout do C4 no Mermaid depende da ordem das declarações; embolar costuma ser elementos demais.' },
              { texto: 'Exportar uma imagem e colar no wiki, onde o layout é livre.', vai: 'f-wiki', tom: 'ruim', consequencia: 'volta ao diagrama que não versiona, o agente não lê e ninguém atualiza.' }
            ] }
          },
          finais: {
            'f-bom': { bom: true, texto: 'Diagramas por nível, cada um com uma pergunta, versionados no repositório e legíveis no GitHub.' },
            'f-cor': { bom: false, texto: 'O diagrama ficou mais bonito e continuou incompreensível; a metade das cores não significava nada.' },
            'f-mais': { bom: false, texto: 'O diagrama passou de 30 elementos e ninguém voltou a abri-lo.' },
            'f-wiki': { bom: false, texto: 'A imagem no wiki envelheceu em um mês, e o agente nunca a viu.' }
          },
          callout: 'Você separou por nível, uma pergunta por figura, e manteve o diagrama como texto no repositório.' },
        { tipo: 'callout', tom: 'info', titulo: 'Leitura aplicada: diagramas com distinção de estado', html:
          '<p>No laboratório você produz L1 à mão, L2 a partir do que existe e um sequence do fluxo crítico com caminho de falha. Três regras atravessam o percurso: cada diagrama responde a uma pergunta e tem <strong>parágrafo de contexto antes dele</strong> (diagrama sem texto é rorschach); containers planejados e existentes se distinguem no título (<strong>"planejado"</strong>), senão o diagrama vira ficção; o sequence inclui o caminho de erro com <code>alt</code> ou <code>Note</code>. Cada dúvida de produto encontrada no desenho ("o consultor analisa o repo do cliente, ou o cliente aponta o próprio?") vira linha de spec ou ADR. A aplicação ao Capstone é trilha opcional.</p>' },
        { tipo: 'escolha', id: 'm04b2-escolha-1', titulo: 'Confira: abstração',
          pergunta: 'Um diagrama mistura a caixa "Kafka", a caixa "Cliente pessoa física" e a classe <code>OrderValidator</code>. Qual princípio ele viola?',
          opcoes: [
            { id: 'a', texto: 'Mistura níveis de abstração; deve virar diagramas C4 separados, um por pergunta.', correta: true, porque: 'abstração é escolher qual detalhe importa para a pergunta; no máximo cerca de sete elementos por figura.' },
            { id: 'b', texto: 'Usa Mermaid em vez de uma ferramenta gráfica.', correta: false, porque: 'Mermaid é o recomendado; o defeito é o nível.' },
            { id: 'c', texto: 'Tem poucas caixas.', correta: false, porque: 'o problema é a mistura, não a quantidade.' },
            { id: 'd', texto: 'Nenhum: um diagrama completo é sempre melhor.', correta: false, porque: 'diagrama que responde a tudo não responde a nada.' }
          ], tutorDepois: 'L1 e L2 dão 90% do valor; L4 se gera.' },
        { tipo: 'escolha', id: 'm04b2-escolha-2', titulo: 'Confira: gerar ou escrever',
          pergunta: 'Qual destes deve ser <strong>escrito à mão</strong> e revisado, em vez de gerado do código?',
          opcoes: [
            { id: 'a', texto: 'O diagrama de classes do módulo de domínio.', correta: false, porque: 'é derivado do fonte: gere, e estará sempre correto.' },
            { id: 'b', texto: 'O contexto de negócio: quem é dono do sistema externo e que restrição contratual o cerca.', correta: true, porque: 'nenhum parser infere o porquê; o que não pode ser derivado se escreve e se revisa.' },
            { id: 'c', texto: 'A lista de rotas HTTP da API.', correta: false, porque: 'rotas são derivadas do código (ou do OpenAPI).' },
            { id: 'd', texto: 'O grafo de dependências entre pacotes.', correta: false, porque: 'dependências saem dos imports.' }
          ], tutorDepois: 'Ao pedir arquitetura a um agente, exija a distinção "existe hoje × planejado".' },
        { tipo: 'takeaway', html: 'Uma pergunta por figura, <mark>sete elementos</mark>, caminho de erro no sequence e <mark>"planejado"</mark> no título do que ainda não existe.' }
      ] }
    ]
  });
})();
