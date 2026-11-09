/* M00 · Bloco 4: Skills, hooks e MCP sem aprisionamento. Fonte: M00.html#b04. A saída de course_progress é execução real da função do laboratório. */
(function () {
  var L = function (kind, text) { return { kind: kind, text: text }; };
  function opc(id, texto, correta, porque) { return { id: id, texto: texto, correta: correta, porque: porque }; }
  var CMD1 = 'python -c "print(course_progress(Path(\'curto.md\'), max_chars=2000))"';
  var CMD2 = 'python -c "print(course_progress(Path(\'PROGRESSO.md\'), max_chars=2000))"';

  var codigoProg = [
    'import posixpath', '', '',
    'def safe_path(root, relativo):',
    '    """Resolve `relativo` sob `root`; levanta ValueError se sair de root."""',
    '    raiz = posixpath.normpath(root)',
    '    alvo = posixpath.normpath(posixpath.join(raiz, relativo))',
    '    # compare por componentes: "/raiz-outra" não está dentro de "/raiz"',
    '    return alvo', '', '',
    'def course_progress(texto, max_chars=2000):',
    '    """Resposta limitada: content cortado, truncated e original_chars."""',
    '    if max_chars <= 0:', '        raise ValueError("max_chars deve ser positivo")',
    '    return {"content": texto, "truncated": False, "original_chars": len(texto)}', '',
    'print(course_progress("abcdef", max_chars=4))', ''].join('\n');
  var testesProg = [
    'def test_caminho_relativo_dentro_da_raiz():',
    '    assert safe_path("/prog", "estudo/a.md") == "/prog/estudo/a.md"', '', '',
    'def test_ponto_ponto_sai_da_raiz():',
    '    try:', '        safe_path("/prog", "../.env")', '    except ValueError:', '        return', '    assert False, "deveria recusar"', '', '',
    'def test_caminho_absoluto_tambem_sai():',
    '    try:', '        safe_path("/prog", "/etc/passwd")', '    except ValueError:', '        return', '    assert False', '', '',
    'def test_controle_negativo_raiz_irma():',
    '    # "/prog-outra" começa com "/prog" como texto, mas é outro diretório',
    '    try:', '        safe_path("/prog", "../prog-outra/x")', '    except ValueError:', '        return', '    assert False', '', '',
    'def test_resposta_truncada_informa_o_corte():',
    '    r = course_progress("abcdef", max_chars=4)',
    '    assert r == {"content": "abcd", "truncated": True, "original_chars": 6}', '', '',
    'def test_texto_curto_nao_trunca():',
    '    r = course_progress("ok", max_chars=2000)',
    '    assert r["truncated"] is False and r["content"] == "ok"', '', '',
    'def test_limite_invalido():',
    '    try:', '        course_progress("x", max_chars=0)', '    except ValueError:', '        return', '    assert False', ''].join('\n');
  var solucaoProg = [
    'import posixpath', '', '',
    'def safe_path(root, relativo):',
    '    raiz = posixpath.normpath(root)',
    '    alvo = posixpath.normpath(posixpath.join(raiz, relativo))',
    '    if alvo != raiz and not alvo.startswith(raiz.rstrip("/") + "/"):',
    '        raise ValueError("path resolve fora da raiz")',
    '    return alvo', '', '',
    'def course_progress(texto, max_chars=2000):',
    '    if max_chars <= 0:', '        raise ValueError("max_chars deve ser positivo")',
    '    return {"content": texto[:max_chars], "truncated": len(texto) > max_chars, "original_chars": len(texto)}', ''].join('\n');

  TrilhaAula.registrar({
    id: 'm00-b4',
    titulo: 'Skills, hooks e MCP sem aprisionamento',
    minutos: 45,
    resumo: 'Instrução, skill, hook, delegate e MCP têm responsabilidades diferentes. O workflow vive num contrato portátil; o slash, o menu e o nome do comando são adapters.',
    objetivo: 'Escolher a peça pela responsabilidade, escrever um workflow como contrato com Agent Skill, reconhecer o que o MCP padroniza e testar uma capability de dentro para fora.',
    revisao: [
      { id: 'm00b4-peca', pergunta: 'Que peça é a certa para uma reação determinística a evento, como bloquear uma escrita antes da tool?',
        opcoes: [
          opc('a', 'Hook', true, 'hook é reação determinística a evento; é o que se usa para enforcement.'),
          opc('b', 'Skill', false, 'skill é conhecimento e procedimento sob demanda, não enforcement.'),
          opc('c', 'Instrução no AGENTS.md', false, 'instrução é contexto, não barreira.')] },
      { id: 'm00b4-slash', pergunta: 'Sobre slash commands (/nome), qual afirmação é correta?',
        opcoes: [
          opc('a', 'O / é uma affordance de interface; o workflow vive como contrato e Agent Skill, e o slash é adapter de invocação', true, 'o mesmo formato visual pode acionar lógica do cliente, carregar prompt ou selecionar skill: não existe semântica universal.'),
          opc('b', 'Têm semântica universal: /review faz o mesmo em qualquer cliente', false, 'o formato é comum, o significado não.'),
          opc('c', 'São uma barreira de segurança porque só o usuário os digita', false, 'slash não transforma texto em boundary de segurança.')] },
      { id: 'm00b4-proposta', pergunta: 'Por que o contrato finish-study-block propõe um patch de diário em vez de escrevê-lo?',
        opcoes: [
          opc('a', 'Escrita no diário e operações Git são efeitos separados e exigem aprovação; nenhuma automação deve registrar aprendizado que não ocorreu', true, 'o workflow lê e sintetiza; a escrita e o commit só acontecem depois de aprovação.'),
          opc('b', 'Porque o agente não consegue escrever arquivos', false, 'a questão é autoridade, não capacidade.'),
          opc('c', 'Porque diário não é versionado', false, 'o ponto é separar proposta de execução.')] },
      { id: 'm00b4-mcp', pergunta: 'O que o MCP padroniza e o que ele NÃO faz?',
        opcoes: [
          opc('a', 'Padroniza mensagens e schemas entre host e servidor; não cria autorização nem torna a tool segura', true, 'MCP é protocolo; autorização, limites, truncamento e path policy continuam no código da capability.'),
          opc('b', 'Padroniza a autorização e torna cada tool segura por definição', false, 'não cria autorização.'),
          opc('c', 'Decide qual tool o modelo deve usar em cada tarefa', false, 'quem decide é o modelo, sujeito ao host e à policy.')] },
      { id: 'm00b4-ordem', pergunta: 'Uma tool MCP local não funciona no host. Em que ordem testar?',
        opcoes: [
          opc('a', 'Função Python pura, depois contrato local/protocolo e só então o host com o modelo', true, 'de dentro para fora, cada hipótese (função, schema, transporte, registro, permissão, escolha do modelo) é isolada.'),
          opc('b', 'Direto no host com o modelo; se falhar, trocar o modelo', false, 'mistura seis hipóteses.'),
          opc('c', 'Primeiro a UI do host, onde o usuário vê o erro', false, 'é a camada mais externa e a mais ambígua.')] }
    ],
    abas: [
      { rotulo: 'Escolher a peça', blocos: [
        { tipo: 'texto', html:
          '<p>Skill, hook, delegate, MCP e instrução parecem se sobrepor. A saída é escolher pela <strong>responsabilidade</strong>, não pelo nome do recurso.</p>' },
        { tipo: 'texto', largo: true, html:
          '<table><thead><tr><th>Peça</th><th>Responsabilidade</th><th>Use quando</th><th>Não use para</th></tr></thead><tbody>' +
          '<tr><td>instrução</td><td>contexto sempre relevante</td><td>comando de teste, boundary, convenção</td><td>tutorial longo ou enforcement</td></tr>' +
          '<tr><td>skill</td><td>conhecimento/procedimento sob demanda</td><td>review, release, migração</td><td>dar acesso a Jira/banco</td></tr>' +
          '<tr><td>hook</td><td>reação determinística a evento</td><td>lint após edição, bloqueio antes da tool</td><td>decisão sem evento estável</td></tr>' +
          '<tr><td>delegate</td><td>trabalho em contexto/fronteira separados</td><td>auditoria focada, busca volumosa</td><td>procedimento reutilizável simples</td></tr>' +
          '<tr><td>MCP</td><td>protocolo entre host e capabilities</td><td>tool/resource/prompt interoperável</td><td>armazenar regra de negócio do agente</td></tr>' +
          '</tbody></table>' },
        { tipo: 'texto', html:
          '<p>A fórmula “skill = como; MCP = acesso; delegate = delegar” é uma boa primeira heurística. Ela falha nas bordas: uma skill pode incluir script, um MCP pode fornecer instruções e um delegate pode carregar skills. Quando houver dúvida, volte para responsabilidade, autoridade e ciclo de vida.</p>' +
          '<h3>Slash commands: interface útil, semântica não portátil</h3>' +
          '<p>O caractere <code>/</code> é uma <strong>affordance</strong> de interface: indica ao cliente que o texto inicial deve ser interpretado como uma ação nomeada. Isso existe no Claude Code, no Codex, no GitHub Copilot e em outros clientes. O que <strong>não</strong> existe é uma semântica universal de “slash command”: o mesmo formato visual pode acionar lógica compilada do cliente, carregar um prompt, selecionar uma skill ou encaminhar um comando a outro agente.</p>' },
        { tipo: 'texto', largo: true, html:
          '<table><thead><tr><th>Categoria</th><th>Quem implementa</th><th>Exemplo</th><th>Portabilidade</th></tr></thead><tbody>' +
          '<tr><td>comando embutido de sessão</td><td>cliente/harness</td><td><code>/compact</code>, <code>/model</code>, <code>/status</code></td><td>baixa; nomes e efeitos variam</td></tr>' +
          '<tr><td>workflow reutilizável</td><td>skill + host</td><td>review, release, migração</td><td>núcleo Agent Skills; invocação varia</td></tr>' +
          '<tr><td>prompt customizado legado</td><td>arquivo reconhecido pelo produto</td><td><code>.claude/commands/*.md</code> ou <code>/prompts:nome</code></td><td>baixa; formatos estão legados/deprecated</td></tr>' +
          '<tr><td>prompt MCP</td><td>servidor MCP + host</td><td>template descoberto pelo cliente</td><td>contrato MCP; exposição na UI é decisão do host</td></tr>' +
          '<tr><td>comando editor↔agente</td><td>protocolo/cliente</td><td>catálogo anunciado e texto <code>/cmd ...</code></td><td>ACP v1 define transporte, não autoria da skill</td></tr>' +
          '</tbody></table>' },
        { tipo: 'texto', html:
          '<p>Em 15/08/2026, o Claude Code recomenda skills e mantém <code>.claude/commands/</code> por compatibilidade: ambos podem aparecer como <code>/nome</code>. A documentação oficial do Codex marca custom prompts <code>/prompts:nome</code> como deprecated e manda migrar para skills; na interface atual, skills também podem ser selecionadas por <code>$nome</code> ou pelo catálogo. O GitHub Copilot separa skills, prompt files e comandos, com disponibilidade diferente entre CLI e IDEs.</p>' },
        { tipo: 'callout', tom: 'info', titulo: 'Modelo portátil', html:
          '<p>Escreva o workflow como <strong>contrato e Agent Skill</strong>. Trate <code>/nome</code>, <code>$nome</code>, menu, botão ou seleção automática como adapters de invocação. A sintaxe da UI pode desaparecer sem destruir o conhecimento.</p>' },
        { tipo: 'takeaway', html: 'Escolha pela <mark>responsabilidade</mark>; o <mark>slash</mark> é adapter de invocação, não o workflow.' }
      ] },

      { rotulo: 'Workflow como contrato', blocos: [
        { tipo: 'texto', html:
          '<h3>Recuperar o antigo <code>/bloco</code> sem recuperar o lock-in</h3>' +
          '<p>O comportamento antigo continua valioso: fechar um bloco, ler estado verificável e propor o próximo passo. O erro era colocar a semântica dentro de <code>.claude/commands/bloco.md</code>. Primeiro escreva um contrato independente do host:</p>' },
        { tipo: 'codigo', linguagem: 'yaml', texto: [
          'id: finish-study-block', 'invoker: user', 'inputs:', '  block_id: required',
          'reads:', '  - course progress', '  - git log', '  - git diff', 'writes: []',
          'outputs:', '  - proposed_diary_patch', '  - proposed_commit_message', '  - next_step',
          'approval:', '  required_before: [write_progress, git_stage, git_commit]',
          'evidence:', '  - sources_consulted', '  - commands_and_exit_codes',
          'stop_when:', '  - block_id_missing', '  - progress_source_missing', '  - dirty_changes_are_not_owned'].join('\n') },
        { tipo: 'texto', html:
          '<p>O verbo importante é <em>propor</em>. O workflow pode ler e sintetizar, mas escrita no diário e operações Git são efeitos separados. Isso preserva a regra do curso: regeneração editorial nunca altera progresso de estudo, e nenhuma automação deve registrar aprendizado que não ocorreu.</p>' },
        { tipo: 'complete', id: 'm00b4-complete', titulo: 'Complete o contrato portátil', linguagem: 'yaml',
          enunciado: 'Escolha, em cada lacuna, o valor que mantém o workflow como proposta, com aprovação antes de qualquer efeito.',
          partes: [
            'id: finish-study-block\ninvoker: ', { lacuna: 'inv', opcoes: ['user', 'model (seleção implícita)'], correta: 'user' },
            '\nwrites: ', { lacuna: 'wr', opcoes: ['[]', '[progress, diary, git]'], correta: '[]' },
            '\noutputs:\n  - ', { lacuna: 'out', opcoes: ['proposed_diary_patch', 'written_diary'], correta: 'proposed_diary_patch' },
            '\napproval:\n  required_before: ', { lacuna: 'apr', opcoes: ['[write_progress, git_stage, git_commit]', '[]'], correta: '[write_progress, git_stage, git_commit]' },
            '\nstop_when:\n  - ', { lacuna: 'stop', opcoes: ['block_id_missing', 'never'], correta: 'block_id_missing' },
            '\n'
          ],
          explicacao: 'O workflow é só de leitura e proposta: <code>writes: []</code>, saída <code>proposed_diary_patch</code> e aprovação exigida antes de escrever o progresso, de fazer stage e de commitar. A invocação é do usuário porque o momento de fechar um bloco é uma decisão humana, e <code>block_id_missing</code> falha antes de ler ou escrever qualquer coisa.',
          callout: 'Contrato portátil montado: leitura, proposta e aprovação antes de cada efeito.' },
        { tipo: 'texto', html:
          '<h3>Decisão de autoria</h3>' +
          '<ul><li>Use <strong>comando embutido</strong> para controlar a sessão do produto; não tente versioná-lo como conhecimento do time.</li>' +
          '<li>Use <strong>skill</strong> para procedimento compartilhável, com descrição, inputs, limites, ferramentas e resultado verificável.</li>' +
          '<li>Use invocação somente pelo usuário quando houver efeito sensível ou quando o momento da ação for decisão humana.</li>' +
          '<li>Use seleção implícita apenas quando a descrição for suficiente e um acionamento indevido tiver baixo custo.</li>' +
          '<li>Não confunda “apareceu no menu” com “funciona”: teste descoberta, invocação explícita, seleção implícita e permissões.</li></ul>' },
        { tipo: 'codigo', linguagem: 'text', texto: [
          'workflow canônico', '  └── review-python-transition/SKILL.md',
          '        ├── Claude Code: /review-python-transition',
          '        ├── Codex: $review-python-transition ou catálogo de skills',
          '        └── Copilot: /review-python-transition quando a superfície suportar', '',
          '# O contrato está no SKILL.md; estes nomes são adapters versionados.'].join('\n') },
        { tipo: 'callout', tom: 'danger', titulo: 'Segurança', html:
          '<p>Uma skill pode trazer scripts, referências e permissões; um prompt legado pode interpolar contexto ou executar pré-processamento específico do host. Revise a origem, limite ferramentas, fixe versão ou hash quando distribuído e execute o caso negativo. Slash não transforma texto em boundary de segurança.</p>' },
        { tipo: 'texto', largo: true, html:
          '<h3>Falhas semeadas e como diagnosticar</h3>' +
          '<p>A comparação honesta entre hosts separa descoberta, invocação explícita, seleção implícita e enforcement de permissões. A execução de hosts reais não é requisito do laboratório obrigatório, pois depende de produto e ambiente: o experimento local se limita ao contrato portátil e à capability de leitura.</p>' +
          '<table><thead><tr><th>Falha semeada</th><th>Oráculo</th><th>Diagnóstico</th></tr></thead><tbody>' +
          '<tr><td><code>block_id</code> ausente</td><td>falha antes de ler/escrever</td><td>validar argumentos na boundary</td></tr>' +
          '<tr><td>skill não aparece</td><td>invocação explícita também falha</td><td>verificar path, escopo, frontmatter e reload</td></tr>' +
          '<tr><td>duas skills com mesmo nome</td><td>host informa qual venceu ou teste bloqueia ambiguidade</td><td>registrar precedência específica do adapter</td></tr>' +
          '<tr><td>saída de shell contém instrução hostil</td><td>conteúdo permanece dado; policy não muda</td><td>não interpolar output como autoridade</td></tr>' +
          '<tr><td>adapter tenta escrever/commitar</td><td>policy exige aprovação e nega efeito automático</td><td>separar proposta de execução</td></tr>' +
          '<tr><td>dois adapters geram efeitos diferentes</td><td>differential contract test falha</td><td>corrigir adapter, não duplicar o núcleo</td></tr>' +
          '</tbody></table>' },
        { tipo: 'takeaway', html: 'O contrato <mark>propõe</mark>; escrita e commit são <mark>efeitos separados</mark> com aprovação.' }
      ] },

      { rotulo: 'MCP e a capability', blocos: [
        { tipo: 'texto', html:
          '<p><strong>Model Context Protocol (MCP)</strong> é um protocolo para um host (um IDE ou harness, por exemplo) conversar com um servidor que expõe capabilities. Ele padroniza a troca de mensagens e os schemas; não cria autorização, não torna uma tool segura e não decide o que o modelo deve fazer.</p>' +
          '<p>A fonte normativa é a especificação MCP 2026-07-28. Essa revisão tornou o núcleo <em>stateless</em>: cada requisição precisa carregar o necessário para ser tratada, em vez de depender de uma sessão implícita no servidor. Ela removeu o handshake <code>initialize/initialized</code> e o header de sessão, e introduziu descoberta opcional e mecanismos para múltiplos round-trips. Material de 2024/2025 pode ensinar arquitetura que deixou de ser invariável.</p>' +
          '<p>O servidor oferece três primitivas principais:</p>' },
        { tipo: 'texto', largo: true, html:
          '<table><thead><tr><th>Primitiva</th><th>Quem controla o uso</th><th>Exemplo</th></tr></thead><tbody>' +
          '<tr><td>prompt</td><td>usuário</td><td>template de revisão selecionado em menu</td></tr>' +
          '<tr><td>resource</td><td>aplicação/host</td><td>documento ou estado anexado ao contexto</td></tr>' +
          '<tr><td>tool</td><td>modelo, sujeito ao host/policy</td><td>buscar ticket ou executar operação</td></tr>' +
          '</tbody></table>' },
        { tipo: 'texto', html:
          '<p>O número de schemas colocados no contexto e a forma de descoberta dependem do host. “Cada tool custa contexto em toda mensagem” não é uma lei: meça catálogo, seleção, latência e taxa de escolha no cliente real.</p>' +
          '<h3>Trace mínimo: uma tool local sem depender do modelo</h3>' +
          '<p>O host descobre que o servidor oferece <code>course_progress</code>. Uma pessoa ou o modelo escolhe chamar a tool com um path. O adapter valida esse argumento e chama uma função Python que lê somente um arquivo permitido. A função devolve dados limitados; o adapter os serializa na resposta do protocolo. Testar esse caminho sem um LLM isola a pergunta importante: a capability devolve o dado certo e respeita a policy? Só depois vale testar se um host específico a descobre e a apresenta corretamente.</p>' +
          '<h3>SDK Python v2 e arquitetura por adapter</h3>' +
          '<p>O SDK oficial Python v2 usa <code>from mcp.server import MCPServer</code>. A lógica do curso continua uma função Python pura; o adapter apenas a publica:</p>' },
        { tipo: 'codigo', linguagem: 'python', texto: [
          'from pathlib import Path', 'from mcp.server import MCPServer',
          'from harness_lab.progress import course_progress as read_progress', '',
          'mcp = MCPServer(', '    "M00 Course Progress",',
          '    instructions="Read a progress file. Never write; return at most 2000 chars.",', ')', '',
          '@mcp.tool()', 'def course_progress(path: str) -> dict[str, str | int | bool]:',
          '    """Read a local course progress Markdown file with a bounded response."""',
          '    return read_progress(Path(path), max_chars=2_000)'].join('\n') },
        { tipo: 'texto', html:
          '<p>Leia a sintaxe antes de executar. <code>from ... import ...</code> traz um nome de outro módulo para este arquivo. <code>mcp = MCPServer(...)</code> cria o objeto do adapter. A linha <code>@mcp.tool()</code> é um <strong>decorador</strong>: registra a função logo abaixo como tool no servidor, sem misturar a regra de leitura com a lógica de descoberta. Em <code>def course_progress(path: str)</code>, <code>: str</code> é uma anotação de tipo que documenta texto; a seta <code>-&gt;</code> anota o formato devolvido; <code>dict[str, str | int | bool]</code> descreve um dicionário cujos valores podem ser texto, inteiro ou booleano. <code>max_chars=2_000</code> limita a resposta. Os tipos e as funções são aprofundados no M02.</p>' +
          '<p>Esse desenho permite testar truncamento, erro e path policy sem protocolo nem modelo. O erro antigo era começar pelo cliente: se falhasse, você não sabia se o problema era função, schema, transporte, registro, permissão ou escolha do modelo. O Inspector MCP fica numa trilha opcional, porque exige uma dependência versionável e uma interface gráfica externa ao núcleo obrigatório.</p>' },
        { tipo: 'rode', id: 'm00b4-rode', titulo: 'A capability devolve dado limitado', enunciado: 'Saída real da função <code>course_progress</code> do laboratório, sem MCP e sem modelo, sobre dois arquivos de exemplo (5 e 3.212 caracteres). O conteúdo é mostrado só pelo tamanho.',
          prefixo: '$', entrada: CMD2, unidade: 'ms', terminalTitulo: 'função pura',
          prever: { pergunta: 'O arquivo de progresso tem 3.212 caracteres e o limite é 2.000. O que a função devolve?', opcoes: [
            { id: 'a', texto: 'Erro, porque o arquivo é maior que o limite.', correta: false, porque: 'a função não falha: devolve a parte permitida e avisa do corte.' },
            { id: 'b', texto: 'Os 3.212 caracteres inteiros, porque leitura é segura.', correta: false, porque: 'o limite existe para que a resposta seja sempre limitada.' },
            { id: 'c', texto: '2.000 caracteres, truncated verdadeiro e original_chars 3212.', correta: true, porque: 'a resposta é cortada no limite e informa que houve corte e qual era o tamanho original.' }
          ] },
          etapas: [
            { id: 'curto', nome: 'Arquivo curto', descricao: 'curto.md, 5 caracteres', tom: 'dns', ms: 5, linhas: [
              L('cmd', CMD1),
              L('out', "{'path': 'curto.md', 'content': <5 caracteres>, 'truncated': False, 'original_chars': 5}"),
              L('hint', 'abaixo do limite: sem corte')] },
            { id: 'longo', nome: 'Arquivo longo', descricao: 'PROGRESSO.md, 3.212 caracteres', tom: 'request', ms: 7, linhas: [
              L('out', "{'path': 'PROGRESSO.md', 'content': <2000 caracteres>, 'truncated': True, 'original_chars': 3212}"),
              L('hint', 'o campo truncated avisa o corte; o path devolvido é só o nome do arquivo')] }
          ],
          tutorAntes: 'Aperte Enter e clique em “Arquivo longo” para ler só as linhas dele.',
          tutorDepois: 'A resposta é limitada em 2.000 caracteres e informa <code>truncated</code> e <code>original_chars</code>. É a propriedade que o laboratório observa; se um host falhar em chamar a tool, a função continua válida e o defeito está no adapter.',
          callout: 'Você viu a capability devolver dado limitado, sem protocolo nem modelo.' },
        { tipo: 'python', id: 'm00b4-python', titulo: 'Escreva a capability e a policy de path', obrigatorio: false,
          enunciado: 'Complete <code>safe_path(root, relativo)</code>, que recusa qualquer caminho que resolva fora da raiz, e <code>course_progress(texto, max_chars)</code>, que devolve conteúdo cortado, <code>truncated</code> e <code>original_chars</code>.',
          codigo: codigoProg, testes: testesProg,
          dica: 'Em <code>safe_path</code>, compare o alvo normalizado com <code>raiz + "/"</code>, não só com o texto da raiz. Em <code>course_progress</code>, <code>texto[:max_chars]</code> e <code>len(texto) &gt; max_chars</code>.',
          solucao: solucaoProg,
          tutorDepois: 'A função e a policy de path passam sem nenhum protocolo: é isso que permite saber, depois, de que camada vem uma falha no host.',
          callout: 'A capability corta, informa o corte e recusa path fora da raiz.' },
        { tipo: 'takeaway', html: 'O MCP padroniza <mark>mensagens e schemas</mark>; a <mark>segurança</mark> continua no código da capability.' }
      ] },

      { rotulo: 'Conferir', blocos: [
        { tipo: 'texto', html:
          '<h3>Segurança mínima de uma capability</h3>' +
          '<ul><li>schema fechado, tipos e limites;</li><li>resposta limitada e sem secrets;</li><li>erro acionável sem stack trace sensível;</li>' +
          '<li>read-only por padrão; efeito separado e explicitamente nomeado;</li>' +
          '<li>autenticação e autorização no código, nunca delegadas ao modelo;</li>' +
          '<li>versão de protocolo e dependência registrada;</li>' +
          '<li>teste da função, teste de contrato e só então teste no host.</li></ul>' +
          '<p>MCP remoto, OAuth, DNS rebinding, autorização empresarial e interoperabilidade completa ficam para M09 e M12. Aqui você precisa reconhecer a fronteira e não vender um servidor de brinquedo como produção. O contrato do laboratório registra <code>MCP 2026-07-28</code> e <code>mcp&gt;=2,&lt;3</code>.</p>' },
        { tipo: 'cenario', id: 'm00b4-cenario', titulo: 'A tool MCP não funciona no host', obrigatorio: false,
          enunciado: 'Uma tool MCP local de leitura de progresso não aparece, ou falha, no host escolhido. Decida em que ordem investigar.',
          inicio: 'inicio',
          nos: {
            inicio: { texto: 'O host não chama a tool <code>course_progress</code>. Por onde você começa?', opcoes: [
              { texto: 'Trocar de modelo no host e tentar de novo.', vai: 'f-modelo', tom: 'ruim', consequencia: 'o modelo é só uma das seis hipóteses, e a mais cara de testar.' },
              { texto: 'Chamar a função Python pura com um arquivo de teste.', vai: 'funcao', tom: 'ok', consequencia: 'se a função falha, o defeito está nela; se passa, ela está descartada.' },
              { texto: 'Reescrever o adapter MCP inteiro.', vai: 'f-adapter', tom: 'ruim', consequencia: 'sem saber se a função funciona, você reescreve às cegas.' }
            ] },
            funcao: { texto: 'A função passa nos testes (truncamento, erro e path policy). Qual é o próximo passo?', opcoes: [
              { texto: 'Testar o contrato local/protocolo e, só depois, o host com chamada explícita.', vai: 'f-bom', tom: 'ok', consequencia: 'cada camada é isolada; se função e contrato passam, a falha pertence ao adapter ou ao host.' },
              { texto: 'Concluir que o host está quebrado e abrir um chamado.', vai: 'f-chamado', tom: 'ruim', consequencia: 'o contrato e o registro do adapter nunca foram testados.' }
            ] }
          },
          finais: {
            'f-bom': { bom: true, texto: 'Função validada, depois contrato e só então o host: a falha ficou localizada no adapter, no transporte ou na descoberta do host.' },
            'f-modelo': { bom: false, texto: 'O custo subiu e a tool continuou sem aparecer: o defeito nunca esteve no modelo.' },
            'f-adapter': { bom: false, texto: 'O adapter foi reescrito e o defeito, que estava no registro, voltou com outra cara.' },
            'f-chamado': { bom: false, texto: 'O chamado voltou pedindo evidência que você não tinha: faltava testar o contrato.' }
          },
          callout: 'Você testou de dentro para fora e localizou a camada antes de trocar qualquer coisa.' },
        { tipo: 'escolha', id: 'm00b4-escolha-mcp', titulo: 'Confira: o que o MCP faz',
          pergunta: 'O que o MCP padroniza e o que ele NÃO faz?',
          opcoes: [
            { id: 'a', texto: 'Padroniza a autorização e torna cada tool segura por definição.', correta: false, porque: 'não cria autorização nem torna a tool segura.' },
            { id: 'b', texto: 'Decide qual tool o modelo deve usar em cada tarefa.', correta: false, porque: 'a escolha é do modelo, sujeita ao host e à policy.' },
            { id: 'c', texto: 'Garante que o servidor armazene a regra de negócio do agente.', correta: false, porque: 'regra de negócio do agente não é papel do MCP.' },
            { id: 'd', texto: 'Padroniza mensagens e schemas entre host e servidor; não cria autorização nem torna a tool segura.', correta: true, porque: 'MCP é protocolo: autorização, limites, truncamento e path policy continuam no código da capability, por isso a segurança mínima lista schema fechado, resposta limitada, read-only por padrão e autorização no código.' }
          ], tutorDepois: 'Protocolo não é segurança: a capability é responsável pelos seus limites.' },
        { tipo: 'escolha', id: 'm00b4-escolha-slash', titulo: 'Confira: o slash command',
          pergunta: 'Sobre slash commands (<code>/nome</code>), qual afirmação é correta?',
          opcoes: [
            { id: 'a', texto: 'Têm semântica universal: <code>/review</code> faz o mesmo em qualquer cliente.', correta: false, porque: 'o mesmo formato visual pode acionar lógica do cliente, carregar prompt ou selecionar skill.' },
            { id: 'b', texto: 'São uma barreira de segurança, porque só o usuário os digita.', correta: false, porque: 'slash não transforma texto em boundary de segurança.' },
            { id: 'c', texto: 'O <code>/</code> é uma affordance de interface; o workflow deve ser escrito como contrato e Agent Skill, e o slash tratado como adapter de invocação.', correta: true, porque: 'guardar a semântica dentro de um comando de produto é o lock-in que o módulo ensina a evitar.' },
            { id: 'd', texto: 'Devem conter a lógica de negócio do time, versionada em <code>.claude/commands/</code>.', correta: false, porque: 'esse formato é legado e específico do produto.' }
          ], tutorDepois: 'O nome do comando pode mudar; o contrato e a skill ficam.' },
        { tipo: 'callout', tom: 'neutral', titulo: 'Marca de verificação', html:
          '<p>MCP 2026-07-28 e SDK Python v2 (<code>mcp&gt;=2,&lt;3</code>) conferidos na revalidação de 15/08/2026; as notas de slash, skills e prompts legados do Claude Code, do Codex e do Copilot têm a data de 15/08/2026. Antes de executar MCP ou instruções de produto após 90 dias, confira a revisão da especificação, a linha estável do SDK e a documentação do host.</p>' },
        { tipo: 'takeaway', html: 'Teste <mark>de dentro para fora</mark>: função, contrato e só então o <mark>host</mark>.' }
      ] }
    ]
  });
})();
