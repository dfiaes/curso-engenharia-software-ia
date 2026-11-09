/* M00 · Bloco 2: Instruções e contexto portáveis. Fonte: M00.html#b02. Saídas do harness_lab são execuções reais do laboratório. */
(function () {
  var L = function (kind, text) { return { kind: kind, text: text }; };
  function opc(id, texto, correta, porque) { return { id: id, texto: texto, correta: correta, porque: porque }; }
  var DEMO = 'python -m harness_lab context-demo';
  var SNIP = 'python -c "select_context(itens, budget=150)"';

  var etapasContexto = function () {
    return [
      { id: 'itens', nome: 'Candidatos', descricao: 'Quatro itens, um obrigatório', tom: 'dns', ms: 8, linhas: [
        L('info', 'AGENTS.md            180 tokens  relevância 1.0  confiança 1.0  obrigatório'),
        L('info', 'arquivo-alvo.py      420 tokens  relevância 1.0  confiança 0.95'),
        L('info', 'teste-alvo.py        350 tokens  relevância 0.9  confiança 0.95'),
        L('info', 'historico-completo   2500 tokens relevância 0.2  confiança 0.6'),
        L('hint', 'score = relevância × confiança ÷ custo; obrigatórios entram primeiro')] },
      { id: 'selecao', nome: 'Seleção', descricao: 'Orçamento de 1000 tokens', tom: 'request', ms: 12, linhas: [
        L('out', 'CONTEXT 950/1000'),
        L('out', 'INCLUDED AGENTS.md, teste-alvo.py, arquivo-alvo.py'),
        L('out', 'OMITTED historico-completo.txt'),
        L('hint', 'a decisão registra o que entrou e o que ficou de fora')] }
    ];
  };

  var codigoCtx = [
    'from dataclasses import dataclass', '', '',
    '@dataclass(frozen=True)',
    'class ContextItem:', '    name: str', '    tokens: int', '    relevance: float', '    trust: float', '    required: bool = False', '',
    '    @property', '    def score(self):',
    '        # relevância × confiança, dividido pelo custo em tokens',
    '        return 0.0', '', '',
    'def select_context(items, budget):',
    '    """Devolve (incluidos, omitidos, usados). Falha alto se um obrigatório não cabe."""',
    '    if budget <= 0:', '        raise ValueError("budget deve ser positivo")',
    '    obrigatorios = sorted((i for i in items if i.required), key=lambda i: i.name)',
    '    usados = sum(i.tokens for i in obrigatorios)',
    '    # se os obrigatórios já estouram o orçamento, levante ValueError',
    '    incluidos = list(obrigatorios)',
    '    candidatos = sorted((i for i in items if not i.required), key=lambda i: (-i.score, i.name))',
    '    for item in candidatos:', '        if usados + item.tokens <= budget:',
    '            incluidos.append(item)', '            usados += item.tokens',
    '    nomes = {i.name for i in incluidos}',
    '    omitidos = [i.name for i in items if i.name not in nomes]',
    '    return [i.name for i in incluidos], omitidos, usados', '', '',
    'ITENS = [', '    ContextItem("AGENTS.md", 180, 1.0, 1.0, required=True),',
    '    ContextItem("arquivo-alvo.py", 420, 1.0, 0.95),',
    '    ContextItem("teste-alvo.py", 350, 0.9, 0.95),',
    '    ContextItem("historico-completo.txt", 2500, 0.2, 0.6),', ']',
    'print(select_context(ITENS, 1000))', ''].join('\n');
  var testesCtx = [
    'ITENS = [',
    '    ContextItem("AGENTS.md", 180, 1.0, 1.0, required=True),',
    '    ContextItem("arquivo-alvo.py", 420, 1.0, 0.95),',
    '    ContextItem("teste-alvo.py", 350, 0.9, 0.95),',
    '    ContextItem("historico-completo.txt", 2500, 0.2, 0.6),', ']', '', '',
    'def test_orcamento_1000_deixa_o_historico_de_fora():',
    '    inc, omit, usados = select_context(ITENS, 1000)',
    '    assert inc == ["AGENTS.md", "teste-alvo.py", "arquivo-alvo.py"]',
    '    assert omit == ["historico-completo.txt"] and usados == 950', '', '',
    'def test_obrigatorio_que_nao_cabe_falha_alto():',
    '    try:', '        select_context(ITENS, 150)', '    except ValueError as e:',
    '        assert "180" in str(e) and "150" in str(e)', '    else:', '        assert False, "deveria falhar"', '', '',
    'def test_borda_orcamento_exato_do_obrigatorio():',
    '    inc, omit, usados = select_context(ITENS, 180)',
    '    assert inc == ["AGENTS.md"] and usados == 180 and len(omit) == 3', '', '',
    'def test_orcamento_invalido():',
    '    try:', '        select_context(ITENS, 0)', '    except ValueError:', '        return', '    assert False', ''].join('\n');
  var solucaoCtx = [
    'from dataclasses import dataclass', '', '',
    '@dataclass(frozen=True)',
    'class ContextItem:', '    name: str', '    tokens: int', '    relevance: float', '    trust: float', '    required: bool = False', '',
    '    @property', '    def score(self):', '        return (self.relevance * self.trust) / self.tokens', '', '',
    'def select_context(items, budget):',
    '    if budget <= 0:', '        raise ValueError("budget deve ser positivo")',
    '    obrigatorios = sorted((i for i in items if i.required), key=lambda i: i.name)',
    '    usados = sum(i.tokens for i in obrigatorios)',
    '    if usados > budget:',
    '        raise ValueError(f"itens obrigatórios requerem {usados} tokens; orçamento é {budget}")',
    '    incluidos = list(obrigatorios)',
    '    candidatos = sorted((i for i in items if not i.required), key=lambda i: (-i.score, i.name))',
    '    for item in candidatos:', '        if usados + item.tokens <= budget:',
    '            incluidos.append(item)', '            usados += item.tokens',
    '    nomes = {i.name for i in incluidos}',
    '    omitidos = [i.name for i in items if i.name not in nomes]',
    '    return [i.name for i in incluidos], omitidos, usados', ''].join('\n');

  TrilhaAula.registrar({
    id: 'm00-b2',
    titulo: 'Instruções e contexto portáveis',
    minutos: 40,
    resumo: 'O arquivo de instruções é o contrato operacional do repositório, não um tutorial. O contexto que entra em cada execução é uma decisão auditável sob orçamento.',
    objetivo: 'Decidir o que pertence ao AGENTS.md e o que vira skill, manter um núcleo portátil com adapters pequenos e implementar uma seleção de contexto que falha alto quando um item obrigatório não cabe.',
    revisao: [
      { id: 'm00b2-agents', pergunta: 'Qual conteúdo pertence a um AGENTS.md de repositório?',
        opcoes: [
          opc('a', 'Comandos de teste/lint já verificados, restrições não óbvias (como “não editar migration publicada”) e onde estão os ADRs', true, 'o arquivo é contrato operacional: só fatos que quase toda tarefa precisa.'),
          opc('b', 'Um tutorial de Python e a história do projeto', false, 'não é autobiografia nem tutorial genérico.'),
          opc('c', 'Revisão detalhada de concorrência, carregada em toda tarefa', false, 'procedimento pontual vira skill, carregada sob demanda.')] },
      { id: 'm00b2-boato', pergunta: 'Por que “instrução sem verificação vira boato automatizado”?',
        opcoes: [
          opc('a', 'Comandos nunca executados e confirmados falham em máquina limpa e o agente os repete como se fossem verdade', true, 'por isso os comandos do arquivo devem ser executados e confirmados, com precondições documentadas.'),
          opc('b', 'Porque o agente não lê arquivos Markdown', false, 'ele lê; o problema é o que está escrito.'),
          opc('c', 'Porque instruções são sempre ignoradas', false, 'não são sempre ignoradas; o risco é obedecer a algo falso.')] },
      { id: 'm00b2-claude', pergunta: 'Como o Claude Code, em 14/08/2026, passa a respeitar um AGENTS.md já existente sem duplicar o contrato?',
        opcoes: [
          opc('a', 'Um CLAUDE.md pequeno que importa o núcleo com @AGENTS.md e acrescenta só o específico do produto', true, 'a documentação afirma que ele lê CLAUDE.md, não AGENTS.md, e sugere a importação.'),
          opc('b', 'Copiar todo o AGENTS.md para dentro do CLAUDE.md', false, 'duplica o núcleo e as regras divergem.'),
          opc('c', 'Renomear AGENTS.md para CLAUDE.md', false, 'quebra os outros hosts que leem AGENTS.md.')] },
      { id: 'm00b2-disclosure', pergunta: 'O que é progressive disclosure numa Agent Skill?',
        opcoes: [
          opc('a', 'Metadados no catálogo inicial; instruções ao ativar; referências e scripts só quando necessários', true, 'separa o conteúdo sempre necessário do conhecimento sob demanda; o catálogo ainda tem custo residual.'),
          opc('b', 'Carregar a skill inteira, com referências, em toda sessão', false, 'é o oposto: gasta contexto sem necessidade.'),
          opc('c', 'Esconder a skill do usuário até ele pedir', false, 'o termo trata do carregamento de contexto, não de visibilidade ao usuário.')] },
      { id: 'm00b2-obrigatorio', pergunta: 'O orçamento está em 250 tokens e o AGENTS.md obrigatório tem 300. O que a seleção correta faz?',
        opcoes: [
          opc('a', 'Falha explicitamente e registra o motivo', true, 'obrigatório que não cabe é erro, não omissão silenciosa.'),
          opc('b', 'Corta o AGENTS.md pela metade', false, 'esconde do auditor que o agente trabalhou com contrato truncado.'),
          opc('c', 'Omite o AGENTS.md e segue com os demais', false, 'o agente trabalharia sem o contrato e ninguém saberia.')] }
    ],
    abas: [
      { rotulo: 'Entender', blocos: [
        { tipo: 'texto', html:
          '<p>Uma tarefa pede “corrija o parser CSV”. Sem instrução de repositório, o agente pode procurar o projeto inteiro, escolher o parser errado, instalar uma dependência já proibida ou executar uma suíte lenta que não cobre a mudança. Um <code>AGENTS.md</code> útil elimina essas tentativas previsíveis: informa onde vive o parser, qual teste focal executar, qual migration não pode ser tocada e qual documento define o formato público.</p>' +
          '<p>Uma boa instrução reduz busca repetida e previne erros específicos do repositório. Ela não é autobiografia, tutorial genérico de Python nem lugar para esconder decisões arquiteturais. Inclua somente fatos que quase toda tarefa precisa:</p>' +
          '<ul><li>o que o sistema faz e onde estão as fronteiras;</li>' +
          '<li>comandos <em>executados e confirmados</em> de bootstrap, teste, lint e type checking;</li>' +
          '<li>restrições não óbvias, como “não editar migration publicada”;</li>' +
          '<li>critérios mínimos de conclusão e como relatar evidência;</li>' +
          '<li>onde encontrar design docs, ADRs e instruções específicas.</li></ul>' +
          '<p>A documentação do GitHub Copilot recomenda testar comandos e documentar precondições, ordem e problemas observados; a do Codex descreve a descoberta hierárquica de <code>AGENTS.md</code>. Isso sustenta um princípio maior: <strong>instrução sem verificação vira boato automatizado</strong>.</p>' },
        { tipo: 'callout', tom: 'neutral', titulo: 'O que fica fora do arquivo', html:
          '<p>O arquivo não substitui o design doc nem repete o manual de Python. Ele é carregado porque diversas tarefas precisam do mesmo contrato operacional. Uma instrução de revisão de concorrência só faz sentido quando há código concorrente: deve ficar numa <strong>skill</strong> e ser recuperada sob demanda. Essa separação reduz ruído e torna a origem de cada regra rastreável.</p>' },
        { tipo: 'texto', largo: true, html:
          '<h3>Sintoma, hipótese, evidência</h3>' +
          '<table><thead><tr><th>Sintoma</th><th>Hipótese a testar</th><th>Evidência</th><th>Correção</th></tr></thead><tbody>' +
          '<tr><td>o agente altera arquivo fora da área da tarefa</td><td>o escopo não foi declarado ou a instrução não foi descoberta</td><td>log de contexto e diff</td><td>registrar o path correto no contrato; não “pedir mais atenção” ao modelo</td></tr>' +
          '<tr><td>um comando documentado falha em máquina limpa</td><td>há precondição implícita</td><td>saída do terminal e versão do runtime</td><td>documentar a precondição ou oferecer caminho local verificável</td></tr>' +
          '<tr><td>duas ferramentas recebem regras diferentes</td><td>o adapter duplicou o núcleo</td><td>comparação entre arquivos e comportamento</td><td>mover a regra comum para o artefato portátil</td></tr>' +
          '</tbody></table>' },
        { tipo: 'takeaway', html: 'O <code>AGENTS.md</code> guarda o que <mark>quase toda tarefa</mark> precisa, com comandos <mark>verificados</mark>; o resto vira skill.' }
      ] },

      { rotulo: 'Núcleo e adapters', blocos: [
        { tipo: 'texto', html:
          '<p>O módulo propõe <strong>um núcleo portátil e adapters pequenos</strong>: a regra comum mora em artefatos abertos (<code>AGENTS.md</code>, Agent Skills, MCP), e cada ferramenta recebe só o que é específico dela.</p>' },
        { tipo: 'texto', largo: true, html:
          '<table><thead><tr><th>Necessidade</th><th>Núcleo portátil</th><th>Codex</th><th>Claude Code</th><th>GitHub Copilot</th></tr></thead><tbody>' +
          '<tr><td>instrução do repo</td><td><code>AGENTS.md</code> + docs</td><td>lê <code>AGENTS.md</code> hierárquico</td><td>lê <code>CLAUDE.md</code>; pode importar <code>@AGENTS.md</code></td><td>aceita <code>AGENTS.md</code> e também <code>.github/*instructions.md</code></td></tr>' +
          '<tr><td>procedimento reutilizável</td><td>Agent Skills</td><td><code>SKILL.md</code></td><td><code>SKILL.md</code>, com extensões próprias</td><td>capacidade varia por superfície; não presuma equivalência</td></tr>' +
          '<tr><td>acesso externo</td><td>MCP ou API explícita</td><td>MCP stdio/HTTP</td><td>MCP stdio/HTTP</td><td>verifique a superfície usada</td></tr>' +
          '<tr><td>isolamento</td><td>processo/worktree + capability set</td><td>subagent/task conforme produto</td><td>subagent/worktree</td><td>coding agent/sessão</td></tr>' +
          '</tbody></table>' },
        { tipo: 'abas', rotulo: 'Como cada ferramenta lê as instruções', itens: [
          { rotulo: 'Codex', blocos: [
            { tipo: 'texto', html: '<p>Lê <code>AGENTS.md</code> de forma hierárquica (do diretório da tarefa até a raiz). Nada a duplicar: o núcleo portátil já é o arquivo que ele lê.</p>' }] },
          { rotulo: 'Claude Code', blocos: [
            { tipo: 'texto', html: '<p>Lê <code>CLAUDE.md</code>, não <code>AGENTS.md</code>. O adapter fica pequeno: um <code>CLAUDE.md</code> que importa o núcleo com <code>@AGENTS.md</code> e acrescenta só o que for específico do produto.</p>' },
            { tipo: 'codigo', linguagem: 'markdown', texto: [
              '# CLAUDE.md — adapter mínimo', '@AGENTS.md', '', '## Claude Code',
              '- Para regras por path, consulte .claude/rules/.',
              '- Não habilite permissões adicionais sem registrar o motivo.'].join('\n') },
            { tipo: 'texto', html: '<p>Em 14/08/2026, a documentação do Claude Code afirma explicitamente que ele lê <code>CLAUDE.md</code>, não <code>AGENTS.md</code>, e sugere a importação acima. É uma convenção versionável do adapter, não motivo para duplicar todo o contrato.</p>' }] },
          { rotulo: 'GitHub Copilot', blocos: [
            { tipo: 'texto', html: '<p>Aceita <code>AGENTS.md</code> e também arquivos <code>.github/*instructions.md</code>. Use os arquivos do produto apenas para o que for realmente específico dele.</p>' }] }
        ] },
        { tipo: 'texto', html:
          '<h3>Progressive disclosure</h3>' +
          '<p>O padrão aberto <strong>Agent Skills</strong> define uma pasta com <code>SKILL.md</code> e recursos opcionais. O catálogo inicial carrega metadados; as instruções entram quando a skill é ativada; referências e scripts são lidos conforme necessário. É o <strong>progressive disclosure</strong>: separa o conteúdo sempre necessário do conhecimento sob demanda, e o catálogo ainda tem um custo residual de contexto.</p>' },
        { tipo: 'codigo', linguagem: 'text', texto: [
          'review-python-transition/', '├── SKILL.md', '├── references/', '│   ├── async.md', '│   └── typing.md', '└── scripts/', '    └── collect_evidence.py'].join('\n') },
        { tipo: 'codigo', linguagem: 'markdown', texto: [
          '---', 'name: review-python-transition',
          'description: Revisa código Python. Use em code review de arquivos .py para verificar clareza, concorrência bloqueante, contratos e typing frágil.',
          '---', '', '# Revisão de código Python',
          '1. Leia somente o diff e os contratos próximos.',
          '2. Classifique achados por correção, segurança, concorrência e idiomatismo.',
          '3. Para cada achado, cite arquivo/linha, risco, evidência e menor correção.',
          '4. Não altere arquivos; retorne um relatório revisável.',
          '5. Leia references/async.md apenas quando houver async.'].join('\n') },
        { tipo: 'texto', html:
          '<p>As linhas entre os dois marcadores <code>---</code> formam o <strong>frontmatter</strong>: metadados em YAML, não código Python. O host usa <code>name</code> para identificar a skill e <code>description</code> para decidir se ela é candidata à tarefa. O texto abaixo dos metadados é o procedimento. A descrição precisa dizer <em>o que</em> a skill faz e <em>quando</em> usá-la. Disparo automático nunca é garantia sem teste: produtos podem truncar catálogos, usar regras diferentes ou exigir invocação explícita.</p>' },
        { tipo: 'complete', id: 'm00b2-complete', titulo: 'Monte o frontmatter da skill', linguagem: 'markdown',
          enunciado: 'Escolha, em cada lacuna, o trecho que faz a skill ser reconhecida pelo host e carregada só quando deve.',
          partes: [
            '---\nname: ', { lacuna: 'nome', opcoes: ['review-python-transition', 'Revisão Python (final)', 'skill1'], correta: 'review-python-transition' },
            '\ndescription: ', { lacuna: 'desc', opcoes: ['Revisa código Python. Use em code review de arquivos .py para verificar clareza, concorrência bloqueante, contratos e typing frágil.', 'Skill muito útil para todo o projeto, sempre.', 'Python.'], correta: 'Revisa código Python. Use em code review de arquivos .py para verificar clareza, concorrência bloqueante, contratos e typing frágil.' },
            '\n---\n# Revisão de código Python\n1. Leia somente o diff e os contratos próximos.\n4. ', { lacuna: 'escrita', opcoes: ['Não altere arquivos; retorne um relatório revisável.', 'Corrija o que achar e commite.', 'Reescreva os módulos afetados.'], correta: 'Não altere arquivos; retorne um relatório revisável.' },
            '\n5. ', { lacuna: 'ref', opcoes: ['Leia references/async.md apenas quando houver async.', 'Leia todas as referências antes de começar.', 'Ignore as referências.'], correta: 'Leia references/async.md apenas quando houver async.' },
            '\n'
          ],
          explicacao: 'O <code>name</code> identifica a skill; a <code>description</code> diz o que ela faz e quando usá-la, e é o que o host lê para decidir se ela é candidata. Revisão é leitura: a skill devolve um relatório, não altera arquivos. A referência de async só entra quando há async: é a divulgação progressiva em ação.',
          callout: 'Skill montada: nome, gatilho claro, procedimento só de leitura e referência sob demanda.' },
        { tipo: 'takeaway', html: 'Regra comum no <mark>núcleo portátil</mark>, só o específico no <mark>adapter</mark>; a skill carrega em <mark>camadas</mark>.' }
      ] },

      { rotulo: 'Orçamento de contexto', blocos: [
        { tipo: 'texto', html:
          '<p>Não existe uma função universal que selecione o “melhor” contexto. Existe um conjunto de compromissos: relevância para a tarefa, confiança da origem, atualidade, custo e obrigatoriedade. O laboratório do módulo torna a decisão visível com <code>select_context</code>, que recebe uma lista de <code>ContextItem</code> (nome, custo em tokens, relevância, confiança e, opcionalmente, <code>required=True</code>) e um <code>budget</code>.</p>' +
          '<p>Itens obrigatórios entram primeiro. Os demais competem por <strong>relevância × confiança ÷ custo</strong>. Se um item obrigatório não cabe, a seleção <strong>falha</strong> em vez de omitir em silêncio. A estimativa de tokens é aproximada e o score é uma heurística didática, não uma verdade científica; o valor profissional está em registrar inclusões e omissões, falhar quando o obrigatório não cabe e medir o efeito na tarefa.</p>' },
        { tipo: 'quebre', id: 'm00b2-quebre', titulo: 'Cabe, ou falha alto?', enunciado: 'Escolha uma falha, rode, e depois rode “Sem falha” para fechar o exercício. A seleção com orçamento 1000 é saída real do laboratório; o erro é o <code>ValueError</code> real da função, com o traceback abreviado.',
          prefixo: '$', entrada: DEMO, unidade: 'ms', terminalTitulo: 'select_context', etapas: etapasContexto(),
          prever: { pergunta: 'Com orçamento 1000, AGENTS.md obrigatório e o histórico de 2500 tokens como candidato, o que fica de fora?', opcoes: [
            { id: 'a', texto: 'Nada: o histórico entra, por ser o mais completo.', correta: false, porque: 'o histórico custa 2500 tokens, mais que todo o orçamento.' },
            { id: 'b', texto: 'O histórico completo: tem pouca relevância e custo maior que o orçamento restante.', correta: true, porque: 'com score baixo e 2500 tokens, ele não cabe; teste-alvo e arquivo-alvo entram por score e fecham 950 de 1000.' },
            { id: 'c', texto: 'O AGENTS.md, para abrir espaço.', correta: false, porque: 'obrigatório entra primeiro e nunca é omitido em silêncio.' }
          ] },
          falhas: [
            { id: 'orc', rotulo: 'Orçamento menor que o obrigatório (150)', efeito: { etapaFalha: 'selecao', linhasErro: [
              { kind: 'cmd', text: SNIP },
              { kind: 'out', text: 'Traceback (most recent call last):' },
              { kind: 'out', text: '  ...' },
              { kind: 'out', text: 'ValueError: itens obrigatórios requerem 180 tokens; orçamento é 150' },
              { kind: 'hint', text: 'exit=1' }
            ], tutor: 'o AGENTS.md tem 180 tokens e o orçamento é 150. A seleção levanta erro em vez de cortar o arquivo ou omiti-lo: omitir em silêncio esconderia do auditor que o agente trabalhou sem o contrato.' } }
          ],
          tutorAntes: 'Aperte Enter para ver a seleção normal; depois escolha “Orçamento menor que o obrigatório”, rode e leia o erro.',
          tutorDepois: 'Orçamento 1000: entram AGENTS.md, teste-alvo.py e arquivo-alvo.py (950 tokens) e o histórico fica de fora, registrado. Orçamento 150: falha alta, com o motivo na mensagem.',
          callout: 'Você viu a seleção registrar inclusões e omissões e falhar alto no obrigatório que não cabe.' },
        { tipo: 'python', id: 'm00b2-python', titulo: 'Escreva a seleção de contexto', obrigatorio: false,
          enunciado: 'Complete o <code>score</code> do item e a verificação dos obrigatórios em <code>select_context</code>: o score é <code>relevance * trust / tokens</code>; se os obrigatórios custam mais que o orçamento, levante <code>ValueError</code> com os dois números.',
          codigo: codigoCtx, testes: testesCtx,
          dica: 'Depois de somar o custo dos obrigatórios em <code>usados</code>, compare com <code>budget</code> antes de incluir qualquer candidato. A mensagem deve conter o custo e o orçamento.',
          solucao: solucaoCtx,
          tutorDepois: 'Repare no caso de borda: com orçamento 180, só o obrigatório cabe e os outros três ficam registrados como omitidos.',
          callout: 'A seleção respeita o orçamento, registra o que ficou de fora e falha alto.' },
        { tipo: 'callout', tom: 'info', titulo: 'Leitura da chamada', html:
          '<p><code>selection = select_context([...], budget=1000)</code> guarda o retorno numa variável. Os colchetes formam a lista de candidatos, e cada <code>ContextItem(...)</code> cria um item com nome e números. <code>required=True</code> e <code>budget=1000</code> são argumentos nomeados: deixam explícito qual regra está sendo configurada. O comando <code>python -m</code> pede ao interpretador que execute um módulo disponível no ambiente, não um arquivo escolhido por caminho.</p>' },
        { tipo: 'takeaway', html: 'A seleção de contexto registra <mark>o que entrou e o que saiu</mark> e <mark>falha alto</mark> quando o obrigatório não cabe.' }
      ] },

      { rotulo: 'Conferir', blocos: [
        { tipo: 'cenario', id: 'm00b2-cenario', titulo: 'O contrato não cabe', obrigatorio: false,
          enunciado: 'Um harness novo roda com orçamento de 250 tokens e o <code>AGENTS.md</code> obrigatório tem 300. Decida o comportamento da seleção.',
          inicio: 'inicio',
          nos: {
            inicio: { texto: 'A seleção recebe os itens e o orçamento. Os obrigatórios custam 300 tokens e o orçamento é 250. O que a seleção faz?', opcoes: [
              { texto: 'Corta o <code>AGENTS.md</code> pela metade para caber.', vai: 'f-corta', tom: 'ruim', consequencia: 'o agente recebe meio contrato e ninguém sabe qual metade.' },
              { texto: 'Omite o arquivo e segue com os demais itens.', vai: 'f-omite', tom: 'ruim', consequencia: 'o agente trabalha sem o contrato, sem registro de que isso aconteceu.' },
              { texto: 'Falha explicitamente e registra o motivo.', vai: 'registra', tom: 'ok', consequencia: 'o problema aparece na hora, com os dois números na mensagem.' }
            ] },
            registra: { texto: 'A falha apareceu. Como resolver sem esconder o problema?', opcoes: [
              { texto: 'Aumentar o orçamento ou enxugar o <code>AGENTS.md</code>, e medir o efeito na tarefa.', vai: 'f-bom', tom: 'ok', consequencia: 'o contrato continua inteiro e a decisão fica auditável.' },
              { texto: 'Marcar o item como não obrigatório para a seleção passar.', vai: 'f-rebaixa', tom: 'ruim', consequencia: 'a seleção passa, mas o contrato deixa de ser garantido.' }
            ] }
          },
          finais: {
            'f-bom': { bom: true, texto: 'Orçamento ou arquivo ajustado, contrato inteiro e decisão registrada.' },
            'f-corta': { bom: false, texto: 'Um contrato pela metade produziu comportamento que ninguém soube explicar.' },
            'f-omite': { bom: false, texto: 'O agente trabalhou sem contrato e a auditoria não tinha como saber.' },
            'f-rebaixa': { bom: false, texto: 'A seleção passou, e o que era obrigatório virou opcional sem que ninguém decidisse isso.' }
          },
          callout: 'Você manteve o obrigatório obrigatório e deixou a decisão auditável.' },
        { tipo: 'escolha', id: 'm00b2-escolha-agents', titulo: 'Confira: o que vai no AGENTS.md',
          pergunta: 'Qual conteúdo pertence a um <code>AGENTS.md</code> de repositório?',
          opcoes: [
            { id: 'a', texto: 'Comandos de teste e lint já verificados, restrições não óbvias (por exemplo, “não editar migration publicada”) e onde estão os ADRs.', correta: true, porque: 'o arquivo é contrato operacional: só fatos que quase toda tarefa precisa.' },
            { id: 'b', texto: 'Um tutorial de Python e a história do projeto, para o agente entender o contexto geral.', correta: false, porque: 'não é autobiografia nem tutorial genérico.' },
            { id: 'c', texto: 'Revisão detalhada de concorrência, carregada em toda tarefa para não esquecer.', correta: false, porque: 'procedimento pontual fica em uma skill, carregada sob demanda.' },
            { id: 'd', texto: 'Decisões arquiteturais completas, para evitar abrir o design doc.', correta: false, porque: 'o arquivo aponta para o design doc, não o substitui.' }
          ], tutorDepois: 'Instrução sem comando verificado vira boato automatizado.' },
        { tipo: 'escolha', id: 'm00b2-escolha-orcamento', titulo: 'Confira: o obrigatório que não cabe',
          pergunta: 'O orçamento de contexto está em 250 tokens e <code>AGENTS.md</code> (obrigatório, 300 tokens) não cabe. O que a seleção correta faz?',
          opcoes: [
            { id: 'a', texto: 'Corta o <code>AGENTS.md</code> pela metade para caber.', correta: false, porque: 'esconde um contrato truncado.' },
            { id: 'b', texto: 'Omite o <code>AGENTS.md</code> e segue com os demais itens.', correta: false, porque: 'o agente trabalharia sem o contrato.' },
            { id: 'c', texto: 'Inclui o histórico do chat no lugar, por ser o mais recente.', correta: false, porque: 'o histórico é candidato por score, não substituto do obrigatório.' },
            { id: 'd', texto: 'Falha explicitamente e registra o motivo.', correta: true, porque: 'obrigatório que não cabe é erro, não omissão silenciosa; o valor da seleção está em registrar inclusões e exclusões e em falhar alto.' }
          ], tutorDepois: 'Falhar alto protege o auditor de uma omissão que ninguém viu.' },
        { tipo: 'takeaway', html: 'Um <mark>contrato curto e verificado</mark>, adapters pequenos e <mark>contexto auditável</mark> sob orçamento.' }
      ] }
    ]
  });
})();
