/* M09 · Bloco 5: distribuição, consumo e extensões. Fonte: M09.html#b05 (verificado em 14/09/2026). */
(function () {
  var L = function (kind, text) { return { kind: kind, text: text }; };
  function opc(id, texto, correta, porque) { return { id: id, texto: texto, correta: correta, porque: porque }; }

  var codigo = [
    'import math', '',
    '# Catálogo FAKE: servidor -> {ferramenta: texto da definição enviada ao modelo}.',
    '# Aproximação didática: 1 token ~ 4 caracteres.',
    'def tokens(texto):', '    return math.ceil(len(texto) / 4)', '', '',
    'def selecionar(catalogo, servidores, permitidas=None):',
    '    """Nomes com namespace (servidor.ferramenta) das ferramentas que entram no contexto.',
    '    servidores: só estes são conectados nesta tarefa.',
    '    permitidas: conjunto de nomes com namespace; None = todas do servidor."""',
    '    nomes = []',
    '    for s in servidores:',
    '        for f in catalogo[s]:',
    '            nome = s + "." + f',
    '            # FALTA: aplicar o filtro quando permitidas não for None',
    '            nomes.append(nome)',
    '    return nomes', '', '',
    'def custo_contexto(catalogo, nomes):',
    '    total = 0',
    '    for nome in nomes:',
    '        s, f = nome.split(".", 1)',
    '        # FALTA: somar os tokens da definição de catalogo[s][f]',
    '    return total', '',
    'cat = {"jira": {"buscar": "x" * 400}, "docs": {"ler": "y" * 200}}',
    'print(custo_contexto(cat, selecionar(cat, ["jira"])))', ''].join('\n');

  var solucao = [
    'import math', '',
    'def tokens(texto):', '    return math.ceil(len(texto) / 4)', '', '',
    'def selecionar(catalogo, servidores, permitidas=None):',
    '    nomes = []',
    '    for s in servidores:',
    '        for f in catalogo[s]:',
    '            nome = s + "." + f',
    '            if permitidas is not None and nome not in permitidas:',
    '                continue',
    '            nomes.append(nome)',
    '    return nomes', '', '',
    'def custo_contexto(catalogo, nomes):',
    '    total = 0',
    '    for nome in nomes:',
    '        s, f = nome.split(".", 1)',
    '        total += tokens(catalogo[s][f])',
    '    return total', ''].join('\n');

  var testes = [
    'CAT = {"jira": {"buscar": "x" * 400, "criar": "x" * 400}, "docs": {"ler": "y" * 200}}', '', '',
    'def test_conecta_so_o_servidor_da_tarefa():',
    '    assert selecionar(CAT, ["docs"]) == ["docs.ler"]', '', '',
    'def test_filtro_deixa_so_as_permitidas():',
    '    assert selecionar(CAT, ["jira"], {"jira.buscar"}) == ["jira.buscar"]', '', '',
    'def test_custo_soma_as_definicoes():',
    '    assert custo_contexto(CAT, ["jira.buscar", "docs.ler"]) == 150', '', '',
    'def test_borda_nenhum_servidor_custa_zero():',
    '    assert custo_contexto(CAT, selecionar(CAT, [])) == 0', '', '',
    'def test_servidor_desconhecido_falha_alto():',
    '    try:', '        selecionar(CAT, ["trello"])', '    except KeyError:', '        return',
    '    assert False, "deveria levantar KeyError"', ''].join('\n');

  TrilhaAula.registrar({
    id: 'm09-b5',
    titulo: 'Distribuição, consumo e extensões',
    minutos: 35,
    resumo: 'Um servidor que só roda na sua máquina é um script. O que o torna produto é instalar em um comando, configurar em poucas linhas e consumir sem inflar o contexto do agente.',
    objetivo: 'Escolher a forma de empacotar o servidor, ler uma configuração de cliente MCP, medir o custo de contexto de servidores conectados e decidir como degradar quando uma extensão não é suportada.',
    revisao: [
      { id: 'm09b5-custo', pergunta: 'Por que "conectei 12 servidores MCP ao meu agente" é dívida e não conquista?',
        opcoes: [
          opc('a', 'Cada servidor despeja suas definições no contexto de toda chamada e a seleção de ferramentas degrada acima de ~15; conecte por tarefa, filtre e delegue a subagente', true, 'o custo de contexto é permanente e silencioso.'),
          opc('b', 'MCP só aceita 8 servidores por cliente', false, 'o limite que importa é o de contexto e de precisão de seleção.'),
          opc('c', 'O JSON de configuração fica grande demais', false, 'o problema é o contexto, não o arquivo.')] },
      { id: 'm09b5-ro', pergunta: 'Na configuração em Docker, por que o volume do repositório é montado com <code>:ro</code>?',
        opcoes: [
          opc('a', 'O servidor de análise não tem por que escrever no repositório do cliente; read-only é enforcement, não confiança', true, 'o container precisa enxergar o código, mas só ler.'),
          opc('b', 'Para o container iniciar mais rápido', false, 'não é o motivo.'),
          opc('c', 'Porque o stdio exige volumes read-only', false, 'o stdio não impõe isso; a decisão é de menor privilégio.')] },
      { id: 'm09b5-ext', pergunta: 'O cliente não declarou suporte à extensão Tasks, mas a ingestão leva minutos. O que o servidor faz?',
        opcoes: [
          opc('a', 'Degrada: dispara a ingestão e expõe o status por uma tool; usa Tasks só onde há suporte declarado', true, 'extensões são opt-in e negociadas; é progressive enhancement.'),
          opc('b', 'Usa Tasks mesmo assim', false, 'sem declaração do cliente, o servidor não pode usar a extensão.'),
          opc('c', 'Recusa a chamada', false, 'a função continua possível por outro caminho.')] },
      { id: 'm09b5-auth', pergunta: 'Qual a ordem de esforço dos três níveis de autenticação do servidor HTTP citados no bloco?',
        opcoes: [
          opc('a', 'Chave de API por tenant, depois OAuth 2.1 com o provedor do cliente, depois mTLS em ambiente corporativo fechado', true, 'em todos, o token define o escopo e o escopo entra na consulta.'),
          opc('b', 'mTLS, depois chave de API, depois OAuth 2.1', false, 'a ordem é de menor para maior esforço.'),
          opc('c', 'Só OAuth 2.1 é permitido', false, 'a chave de API por tenant é o que a maioria dos servidores corporativos usa hoje.')] }
    ],
    abas: [
      { rotulo: 'Entender', blocos: [
        { tipo: 'texto', html:
          '<p>Um servidor que só roda na sua máquina, iniciado por você, é um script. O que o torna produto é a <strong>distribuição</strong>: alguém instala em um comando, configura em três linhas e usa sem saber Python. O consumo tem um detalhe importante: o mesmo servidor precisa servir o Claude Code e o seu próprio agente do M08.</p>' +
          '<h3>Empacotar</h3>' },
        { tipo: 'texto', largo: true, html:
          '<table><thead><tr><th>Forma</th><th>Como o usuário instala</th><th>Bom para</th><th>Cuidados</th></tr></thead><tbody>' +
          '<tr><td><code>uvx</code> / script Python</td><td><code>uvx cartografo-mcp</code>: o <code>uv</code> baixa e roda sem instalar nada permanentemente</td><td>ferramenta de dev distribuída por PyPI; a via mais leve</td><td>exige Python/uv na máquina; dependências nativas podem pesar</td></tr>' +
          '<tr><td>Docker</td><td><code>docker run -i --rm cartografo/mcp</code></td><td>isolamento, dependências complexas, distribuição corporativa</td><td>montar volumes para o servidor enxergar o código; overhead de inicialização em stdio</td></tr>' +
          '<tr><td>Binário</td><td>baixar e executar</td><td>usuário não técnico</td><td>build por plataforma; em Python, empacotamento é trabalhoso</td></tr>' +
          '<tr><td>Serviço HTTP</td><td>o usuário só configura a URL e o token</td><td>SaaS multi-tenant; atualização centralizada</td><td>autenticação obrigatória; o código do cliente sai da máquina dele (barreira comercial)</td></tr>' +
          '</tbody></table>' },
        { tipo: 'texto', html:
          '<p>Para o Capstone, os dois modos que o produto vende. No <strong>modo local</strong>, o índice fica na máquina do cliente e o servidor roda em stdio, sem porta.</p>' },
        { tipo: 'codigo', linguagem: 'dockerfile', texto: [
          '# Dockerfile.mcp: modo local, o índice fica na máquina do cliente',
          'FROM python:3.12-slim AS builder',
          'COPY --from=ghcr.io/astral-sh/uv:latest /uv /bin/uv',
          'WORKDIR /app',
          'COPY pyproject.toml uv.lock ./',
          'RUN uv sync --frozen --no-install-project --no-dev',
          'COPY capstone/ capstone/',
          'RUN uv sync --frozen --no-dev',
          'FROM python:3.12-slim AS runtime',
          'WORKDIR /app',
          'RUN groupadd -r mcp && useradd -r -g mcp mcp',
          'COPY --from=builder --chown=mcp:mcp /app/.venv /app/.venv',
          'COPY --from=builder --chown=mcp:mcp /app/capstone /app/capstone',
          'ENV PATH="/app/.venv/bin:$PATH" PYTHONUNBUFFERED=1',
          'USER mcp',
          '# stdio: sem EXPOSE, sem porta; o cliente fala pelo stdin/stdout do container',
          'ENTRYPOINT ["python", "-m", "capstone.mcp.server"]'].join('\n') },
        { tipo: 'texto', html:
          '<p>Tudo do M03 bloco 5 vale igual (multi-stage, não-root, cache de camadas). A diferença: em stdio não há porta, e o cliente inicia o container com <code>-i</code> e conversa pelos streams padrão. O detalhe que mais confunde: o container precisa enxergar o código do cliente, então o <strong>volume</strong> é parte da configuração, não opcional.</p>' +
          '<h3>Instalação indolor ou desinstalação</h3>' +
          '<p>Distribuir servidor local é o problema de distribuir ferramenta de dev: instalação simples, versionamento, configuração compartilhável pelo repositório. A regra de ouro: atualização tem que ser indolor, porque servidor que quebra a cada versão é desinstalado.</p>' },
        { tipo: 'takeaway', html: 'Produto é <mark>instalar em um comando</mark>, versionar e <mark>atualizar sem dor</mark>; em stdio o container não tem porta, mas precisa de <mark>volume</mark>.' }
      ] },

      { rotulo: 'Ver funcionando', blocos: [
        { tipo: 'texto', html:
          '<h3>Consumir: a configuração nos clientes</h3>' +
          '<p>A configuração é um JSON com o comando a executar (stdio) ou a URL (HTTP). Os nomes de arquivo variam por cliente; o formato é praticamente o mesmo. O arquivo no repositório (<code>.mcp.json</code>) faz todo o time herdar a configuração, o equivalente do <code>.editorconfig</code>.</p>' },
        { tipo: 'codigo', linguagem: 'json', texto: [
          '// .mcp.json (no repositório, compartilhado com o time) ou config do cliente',
          '{',
          '  "mcpServers": {',
          '    "cartografo": {',
          '      "command": "docker",',
          '      "args": [',
          '        "run", "-i", "--rm",',
          '        "-v", "${workspaceFolder}:/repo:ro",   // read-only: o servidor não escreve',
          '        "-e", "CARTOGRAFO_REPO=/repo",',
          '        "cartografo/mcp:1.0"',
          '      ]',
          '    },',
          '    "cartografo-saas": {',
          '      "type": "http",',
          '      "url": "https://api.cartografo.dev/mcp",',
          '      "headers": { "Authorization": "Bearer ${CARTOGRAFO_TOKEN}" }',
          '    }',
          '  }',
          '}'].join('\n') },
        { tipo: 'rode', id: 'm09b5-rode', titulo: 'Leia a configuração como o cliente leria', obrigatorio: false,
          enunciado: 'Simulação didática (saída ilustrativa, não de um cliente real) do que o cliente faz com cada entrada de <code>mcpServers</code>.',
          prefixo: '$', entrada: 'cliente-mcp --config .mcp.json', unidade: 's', terminalTitulo: 'consumo da configuração',
          prever: { pergunta: 'Na entrada <code>cartografo-saas</code>, o token aparece literal no JSON?', opcoes: [
            { id: 'a', texto: 'Sim, é mais simples de configurar.', correta: false, porque: 'o JSON costuma ir para o git; segredo literal vaza.' },
            { id: 'b', texto: 'Não: vem de variável de ambiente (<code>${CARTOGRAFO_TOKEN}</code>).', correta: true, porque: 'segredo por variável de ambiente, nunca literal no JSON.' },
            { id: 'c', texto: 'Não há token, pois HTTP não exige autenticação.', correta: false, porque: 'servidor remoto precisa provar quem está chamando.' }
          ] },
          etapas: [
            { id: 'local', nome: 'Entrada local (stdio)', descricao: 'command + args', tom: 'dns', ms: 1, linhas: [
              L('cmd', 'docker run -i --rm -v <workspace>:/repo:ro -e CARTOGRAFO_REPO=/repo cartografo/mcp:1.0'),
              L('info', 'transporte: stdio (cliente fala pelo stdin/stdout do container)'),
              L('hint', 'volume read-only: o servidor lê o repositório e não escreve nele')] },
            { id: 'remota', nome: 'Entrada remota (HTTP)', descricao: 'url + headers', tom: 'request', ms: 1, linhas: [
              L('info', 'transporte: HTTP, URL https://api.cartografo.dev/mcp'),
              L('out', 'Authorization: Bearer <valor de $CARTOGRAFO_TOKEN>'),
              L('hint', 'segredo vem do ambiente, o arquivo versionado não o contém')] },
            { id: 'time', nome: 'Time herda', descricao: 'arquivo no repositório', tom: 'response', ms: 1, linhas: [
              L('info', '.mcp.json versionado: quem clona o repositório recebe a mesma configuração'),
              L('hint', 'o equivalente do .editorconfig')] }
          ],
          tutorDepois: 'Três decisões na configuração: volume <code>:ro</code>, segredo por variável de ambiente e arquivo no repositório.',
          callout: 'Você leu as três decisões da configuração.' },
        { tipo: 'texto', html:
          '<h3>Consumir no seu próprio agente</h3>' +
          '<p>O seu agente também pode ser cliente MCP, o que fecha o ciclo com o M08. Em vez de importar as ferramentas do código, ele as <strong>descobre pelo protocolo</strong>, o que permite conectar servidores de terceiros (trackers, docs, bancos) sem escrever integração.</p>' },
        { tipo: 'codigo', linguagem: 'python', texto: [
          '# services/agent/mcp_client.py',
          '"""Carrega ferramentas de servidores MCP e as expõe ao loop do agente (M08 b5)."""',
          'from fastmcp import Client',
          'from app.services.agent.tools import Ferramenta',
          '',
          'async def carregar_ferramentas_mcp(config: dict[str, object]) -> list[Ferramenta]:',
          '    ferramentas: list[Ferramenta] = []',
          '    async with Client(config) as cliente:',
          '        for t in await cliente.list_tools():',
          '            ferramentas.append(',
          '                Ferramenta(',
          '                    nome=f"{t.name}",   # já vem com namespace do servidor',
          '                    descricao=t.description or "",',
          '                    schema=t.inputSchema,',
          '                    executar=lambda args, n=t.name: cliente.call_tool(n, args),',
          '                )',
          '            )',
          '    return ferramentas'].join('\n') },
        { tipo: 'takeaway', html: 'O mesmo servidor serve o <mark>Claude Code</mark> e o <mark>seu agente</mark>: volume <mark>read-only</mark>, segredo no ambiente, configuração no repositório.' }
      ] },

      { rotulo: 'Custo, auth e extensões', blocos: [
        { tipo: 'callout', tom: 'danger', titulo: 'O custo escondido de conectar servidores de terceiros', html:
          '<p>Cada servidor conectado despeja as definições dele no contexto de toda chamada (bloco 1). Conectar quatro servidores genéricos pode custar <strong>5 a 10 mil tokens por requisição</strong> e degradar a seleção de ferramentas (M08 bloco 3: acima de ~15 ferramentas a precisão cai). "Conectei 12 MCPs" não é conquista, é dívida de contexto.</p>' },
        { tipo: 'texto', html:
          '<p>Três mitigações: (1) <strong>conectar por tarefa</strong>, não sempre (carregue o servidor do Jira só quando a tarefa envolve Jira); (2) <strong>filtrar</strong> quais ferramentas de cada servidor entram; (3) <strong>delegar a subagente</strong> com contexto próprio (M08 bloco 6).</p>' +
          '<h3>Autenticação em HTTP</h3>' +
          '<p>Servidor local herda o usuário; servidor remoto precisa provar quem está chamando. O caminho padrão do ecossistema é <strong>OAuth 2.1</strong>, com o servidor MCP agindo como resource server: o host obtém um token do provedor de identidade e o envia no <code>Authorization</code>. Para o produto, três níveis, em ordem de esforço:</p>' +
          '<ul><li><strong>Chave de API por tenant</strong>, no header. Simples, suficiente para começar e o que a maioria dos servidores corporativos usa hoje. Exige rotação e escopo por chave.</li>' +
          '<li><strong>OAuth 2.1</strong> com o provedor do cliente. É o que empresa grande vai pedir; permite consentimento por usuário e revogação central.</li>' +
          '<li><strong>mTLS</strong> em ambiente corporativo fechado.</li></ul>' +
          '<p>Em todos, vale a regra do M07 bloco 6: o token define o escopo, e o escopo entra na consulta. Some as exigências do bloco 3: validar <code>Origin</code> e não expor em <code>0.0.0.0</code>.</p>' +
          '<h3>Extensões: o que dá para construir a mais</h3>' },
        { tipo: 'texto', largo: true, html:
          '<table><thead><tr><th>Extensão</th><th>O que resolve</th><th>Uso no Capstone</th></tr></thead><tbody>' +
          '<tr><td>Tasks</td><td>operações longas com identificador durável, polling e entrada no meio do caminho</td><td>ingestão de repositório: leva minutos; o cliente dispara, acompanha e retoma</td></tr>' +
          '<tr><td>Skills over MCP</td><td>instruções ricas e estruturadas para fluxos, descobertas pelo protocolo</td><td>distribuir o "método de análise de legado" como skill, não só como prompt</td></tr>' +
          '<tr><td>MCP Apps</td><td>UI interativa dentro da conversa</td><td>mostrar o grafo de dependências como diagrama navegável em vez de texto</td></tr>' +
          '</tbody></table>' },
        { tipo: 'callout', tom: 'info', titulo: 'Extensões são opt-in e negociadas', html:
          '<p>Se o cliente não declarar suporte, o servidor não pode usá-las. Você precisa de um <strong>caminho de degradação</strong>: a ingestão longa funciona com Tasks onde há suporte e com "dispare e consulte o status por uma tool" onde não há. É o mesmo raciocínio de progressive enhancement da web.</p>' },
        { tipo: 'takeaway', html: 'Conecte <mark>por tarefa</mark>, filtre e delegue; extensão só com <mark>suporte declarado</mark>, sempre com <mark>degradação</mark>.' }
      ] },

      { rotulo: 'Praticar e conferir', blocos: [
        { tipo: 'python', id: 'm09b5-python', titulo: 'Meça o custo de contexto', obrigatorio: false,
          enunciado: 'Catálogo fake, 1 token ≈ 4 caracteres (aproximação didática, não é um tokenizador real). Complete <code>selecionar</code> (aplicar o filtro de ferramentas permitidas) e <code>custo_contexto</code> (somar os tokens das definições).',
          codigo: codigo, testes: testes,
          dica: 'Em <code>selecionar</code>, pule o nome com <code>continue</code> quando <code>permitidas</code> não for <code>None</code> e o nome não estiver nele. Em <code>custo_contexto</code>, acumule <code>tokens(catalogo[s][f])</code>.',
          solucao: solucao,
          tutorDepois: 'Conectar por tarefa (lista de servidores) e filtrar (conjunto de permitidas) são as duas primeiras mitigações; a terceira, subagente, é decisão de arquitetura do M08.',
          callout: 'O seletor e o medidor de custo passaram nos testes, inclusive a borda sem servidor e o servidor desconhecido.' },
        { tipo: 'cenario', id: 'm09b5-cenario', titulo: 'A ingestão leva minutos', obrigatorio: false,
          enunciado: 'O Capstone precisa ingerir repositórios que levam minutos. Um cliente declara suporte a Tasks e outro não declara. Decida o desenho.',
          inicio: 'inicio',
          nos: {
            inicio: { texto: 'Como o servidor expõe a ingestão?', opcoes: [
              { texto: 'Só com Tasks: quem não suporta que atualize o cliente.', vai: 'f-so-tasks', tom: 'ruim', consequencia: 'extensão sem declaração do cliente não pode ser usada.' },
              { texto: 'Sempre mantendo a chamada aberta por minutos.', vai: 'f-aberta', tom: 'ruim', consequencia: 'frágil e sem retomada.' },
              { texto: 'Tasks onde o cliente declarou suporte; onde não, uma tool que dispara e outra que consulta o status.', vai: 'f-bom', tom: 'ok', consequencia: 'progressive enhancement: a função existe nos dois casos.' }
            ] }
          },
          finais: {
            'f-bom': { bom: true, texto: 'Mesmo núcleo, duas formas de expor a operação longa, escolhidas por capability declarada.' },
            'f-so-tasks': { bom: false, texto: 'Parte dos clientes ficou sem a função de ingestão.' },
            'f-aberta': { bom: false, texto: 'Timeouts e conexões presas em ingestões longas.' }
          },
          callout: 'Você degradou com elegância em vez de depender da extensão.' },
        { tipo: 'escolha', id: 'm09b5-escolha', titulo: 'Confira: o servidor do Jira',
          pergunta: 'Seu agente já tem 3 servidores conectados e a seleção de ferramentas está piorando. A tarefa de hoje não envolve Jira, mas o servidor do Jira está sempre conectado. O que fazer primeiro?',
          opcoes: [
            { id: 'a', texto: 'Conectar o servidor do Jira só quando a tarefa envolver Jira, e filtrar as ferramentas que de fato entram.', correta: true, porque: 'conectar por tarefa e filtrar reduzem o custo permanente de contexto.' },
            { id: 'b', texto: 'Aumentar o limite de tokens do contexto.', correta: false, porque: 'a precisão de seleção cai acima de ~15 ferramentas mesmo com contexto sobrando.' },
            { id: 'c', texto: 'Conectar mais um servidor para compensar.', correta: false, porque: 'piora o custo e o sombreamento.' }
          ], tutorDepois: 'Verificado em 14/09/2026 na fonte do módulo; os números (5 a 10 mil tokens, ~15 ferramentas) são ordens de grandeza do bloco.' },
        { tipo: 'takeaway', html: '<mark>Menos servidores</mark>, conectados <mark>por tarefa</mark>: o custo de contexto é <mark>permanente e silencioso</mark>.' }
      ] }
    ]
  });
})();
