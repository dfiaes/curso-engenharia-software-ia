/* M12 · Bloco 2: Dados não confiáveis, secrets, PII e contenção de execução. Fonte: M12.html#b2. Saídas do rode vêm de execução real de Python local com os mesmos passos; o laboratório final executa os controles reais. */
(function () {
  var L = function (kind, text) { return { kind: kind, text: text }; };
  function opc(id, texto, correta, porque) { return { id: id, texto: texto, correta: correta, porque: porque }; }

  var PY_INI = [
    'import ipaddress',
    'import posixpath',
    'from urllib.parse import urlsplit',
    '',
    '',
    'class SecurityViolation(Exception):',
    '    def __init__(self, codigo):',
    '        super().__init__(codigo)',
    '        self.codigo = codigo',
    '',
    '',
    'def safe_path(raiz, candidato, symlinks=None):',
    '    """Resolve o candidato contra a raiz e nega se o destino real escapa dela.',
    '    symlinks simula links: {caminho_absoluto: destino_absoluto}."""',
    '    symlinks = symlinks or {}',
    '    # TODO: junte raiz e candidato, normalize, siga o symlink e confira o prefixo',
    '    return posixpath.join(raiz, candidato)',
    '',
    '',
    'def safe_url(url, allowed_hosts):',
    '    """https, sem credenciais, host na allowlist e endereco literal nao privado."""',
    '    partes = urlsplit(url)',
    '    # TODO: SEC_URL_INVALID, SEC_SSRF_ADDRESS, SEC_HOST_NOT_ALLOWED',
    '    return url'
  ].join('\n') + '\n';
  var PY_TEST = [
    'RAIZ = "/srv/ws"',
    'OK = {"api.example.test"}',
    '',
    '',
    'def cod(f, *a):',
    '    try:',
    '        f(*a)',
    '    except SecurityViolation as e:',
    '        return e.codigo',
    '    return "OK"',
    '',
    '',
    'def test_path_dentro_da_raiz():',
    '    assert safe_path(RAIZ, "reports/result.json") == "/srv/ws/reports/result.json"',
    '',
    '',
    'def test_traversal_negado():',
    '    assert cod(safe_path, RAIZ, "../secret.txt") == "SEC_PATH_OUTSIDE_WORKSPACE"',
    '    assert cod(safe_path, RAIZ, "docs/../../etc/passwd") == "SEC_PATH_OUTSIDE_WORKSPACE"',
    '',
    '',
    'def test_prefixo_parecido_nao_engana():',
    '    assert cod(safe_path, RAIZ, "../ws-outro/x") == "SEC_PATH_OUTSIDE_WORKSPACE"',
    '',
    '',
    'def test_symlink_que_escapa():',
    '    links = {"/srv/ws/atalho": "/etc"}',
    '    assert cod(safe_path, RAIZ, "atalho", links) == "SEC_PATH_OUTSIDE_WORKSPACE"',
    '',
    '',
    'def test_url_permitida():',
    '    assert safe_url("https://api.example.test/v1?q=ok", OK).startswith("https://")',
    '',
    '',
    'def test_metadata_e_enderecos_privados():',
    '    assert cod(safe_url, "https://169.254.169.254/latest/meta-data", OK) == "SEC_SSRF_ADDRESS"',
    '    assert cod(safe_url, "https://127.0.0.1/admin", OK) == "SEC_SSRF_ADDRESS"',
    '    assert cod(safe_url, "https://10.0.0.5/", OK) == "SEC_SSRF_ADDRESS"',
    '',
    '',
    'def test_host_fora_da_allowlist():',
    '    assert cod(safe_url, "https://evil.example.test/", OK) == "SEC_HOST_NOT_ALLOWED"',
    '',
    '',
    'def test_forma_invalida():',
    '    assert cod(safe_url, "http://api.example.test/", OK) == "SEC_URL_INVALID"',
    '    assert cod(safe_url, "https://user:pw@api.example.test/", OK) == "SEC_URL_INVALID"'
  ].join('\n') + '\n';
  var PY_SOL = [
    'import ipaddress',
    'import posixpath',
    'from urllib.parse import urlsplit',
    '',
    '',
    'class SecurityViolation(Exception):',
    '    def __init__(self, codigo):',
    '        super().__init__(codigo)',
    '        self.codigo = codigo',
    '',
    '',
    'def safe_path(raiz, candidato, symlinks=None):',
    '    symlinks = symlinks or {}',
    '    destino = posixpath.normpath(posixpath.join(raiz, candidato))',
    '    destino = symlinks.get(destino, destino)',
    '    destino = posixpath.normpath(destino)',
    '    if destino != raiz and not destino.startswith(raiz.rstrip("/") + "/"):',
    '        raise SecurityViolation("SEC_PATH_OUTSIDE_WORKSPACE")',
    '    return destino',
    '',
    '',
    'def safe_url(url, allowed_hosts):',
    '    partes = urlsplit(url)',
    '    host = partes.hostname',
    '    if partes.scheme != "https" or not host or partes.username or partes.password:',
    '        raise SecurityViolation("SEC_URL_INVALID")',
    '    try:',
    '        ip = ipaddress.ip_address(host)',
    '    except ValueError:',
    '        ip = None',
    '    if ip is not None and (ip.is_private or ip.is_loopback or ip.is_link_local',
    '                           or ip.is_reserved or ip.is_multicast):',
    '        raise SecurityViolation("SEC_SSRF_ADDRESS")',
    '    if host not in allowed_hosts:',
    '        raise SecurityViolation("SEC_HOST_NOT_ALLOWED")',
    '    return url'
  ].join('\n') + '\n';

  TrilhaAula.registrar({
    id: 'm12-b2',
    titulo: 'Dados não confiáveis, secrets, PII e contenção de execução',
    minutos: 45,
    resumo: 'Um arquivo ingerido pede para ler fora do workspace e chamar um destino interno. Contenção por canonicalização e negação antes do efeito, schema fechado e redação como defesa em profundidade.',
    objetivo: 'Negar path fora do workspace, host fora da allowlist, argumento fora do schema e segredo ou PII em saída e trace, sempre antes do efeito, com evento seguro que guarda metadados e nunca o valor.',
    revisao: [
      { id: 'm12b2-canal', pergunta: 'Qual é o modelo mental de separação de canais deste bloco?',
        opcoes: [
          opc('a', 'Canal de evidência, onde o texto circula e pode ser lido, e canal de autoridade, onde código determinístico decide; o conteúdo recuperado atravessa o primeiro e jamais escreve no segundo', true, 'por isso redação e secret scanning são defesa em profundidade, não autorização.'),
          opc('b', 'Um canal só, com o modelo decidindo o que é instrução', false, 'é exatamente a confusão entre dados e controle.'),
          opc('c', 'Dois modelos, um que lê e outro que obedece', false, 'os dois continuam probabilísticos; a autoridade precisa ser código determinístico.')] },
      { id: 'm12b2-ssrf', pergunta: 'SSRF, path traversal e symlink escape são a mesma confusão. Qual é o conserto estrutural?',
        opcoes: [
          opc('a', 'Canonicalizar primeiro (resolver path e symlink contra a raiz; decompor a URL em esquema, credenciais, host e endereço) e negar por padrão o que não está na allowlist, antes de qualquer I/O', true, 'a falha é validar a string antes de resolvê-la, em vez de autorizar o destino resolvido.'),
          opc('b', 'Remover <code>..</code> da string e bloquear dois endereços internos conhecidos', false, 'cada regra cobre o ataque de ontem e perde para a variação de amanhã.'),
          opc('c', 'Confiar que o modelo não vai pedir esses destinos', false, 'o argumento vem de dado não confiável.')] },
      { id: 'm12b2-codigos', pergunta: 'Uma URL <code>https</code> válida aponta para um host que não está na allowlist. Qual é o código de negação?',
        opcoes: [
          opc('a', 'SEC_HOST_NOT_ALLOWED', true, 'o endereço não é privado e a forma é válida; falta o host na allowlist fechada.'),
          opc('b', 'SEC_SSRF_ADDRESS', false, 'esse é para endereço privado, loopback, link-local, reservado ou multicast.'),
          opc('c', 'Nenhum: https basta', false, 'https não diz para onde é permitido ir.')] },
      { id: 'm12b2-evento', pergunta: 'O que entra e o que nunca entra no evento seguro de uma negação?',
        opcoes: [
          opc('a', 'Entram categoria, regra, tenant e metadados (<code>security.outcome=redacted</code>); o valor sensível nunca entra', true, 'suficiente para investigar, insuficiente para vazar. A telemetria usa allowlist de atributos.'),
          opc('b', 'O conteúdo integral, para depurar depois', false, 'copiar o valor para o evento é o antipadrão.'),
          opc('c', 'Nada: negação não é auditada', false, 'sem evento não há investigação nem prova de que o controle segurou.')] }
    ],
    abas: [
      { rotulo: 'Entender', blocos: [
        { tipo: 'texto', html:
          '<p>Um arquivo ingerido contém documentação normal, um marcador de segredo falso e uma instrução escondida pedindo leitura fora do workspace e uma chamada a um destino interno. O Bloco 1 mostrou que o texto não ganha autoridade. Este bloco mostra o resto da contenção: o que o executor faz com o argumento que sobra depois da decisão de política.</p>' +
          '<p>A saída observável é um executor que nega antes do efeito: path fora do workspace, host fora da allowlist, argumento fora do schema e segredo ou PII em saída e trace. As falhas de referência: <em>symlink escape</em>, URL contra o serviço de metadados, segredo em arquivo ingerido, PII em atributo de trace e payload codificado tentando escapar da redação. Cada negação gera um evento seguro com metadados úteis, sem copiar o dado sensível. Pré-requisito: o modelo de ameaças e a autoridade de sessão do Bloco 1; Pydantic aparece como mecanismo. A regulação de dados pessoais entra só como contexto de minimização e finalidade.</p>' },
        { tipo: 'texto', html:
          '<h3>Três termos que sustentam o bloco</h3>' +
          '<ul><li><strong>Dado não confiável:</strong> qualquer conteúdo cuja origem ou integridade a aplicação não controla: documento ingerido, trecho recuperado, saída do modelo, resposta de tool, atributo de trace.</li>' +
          '<li><strong>Autoridade:</strong> o conjunto fechado do que a sessão pode fazer, criado pela aplicação.</li>' +
          '<li><strong>Defesa em profundidade:</strong> sobreposição de controles determinísticos para que a falha de um não vire efeito externo: schema, allowlist de destino, canonicalização de path, redação de saída e telemetria mínima.</li></ul>' +
          '<p>O modelo mental é a <strong>separação de canais</strong>. Existe o canal de evidência, onde o texto circula e pode ser lido, e o canal de autoridade, onde código determinístico autentica, autoriza, valida e executa. O conteúdo recuperado atravessa o primeiro e jamais escreve no segundo. Por isso secret scanning e redação não são autorização: encontram padrões conhecidos de alta confiança, mas têm falsos negativos diante de codificação, tokens inéditos e PII contextual, e nunca justificam enviar dado desnecessário para logs, traces ou relatórios.</p>' },
        { tipo: 'callout', tom: 'info', titulo: 'Conceito: a mesma confusão com roupas diferentes', html:
          '<p>SSRF, path traversal e symlink escape aceitam uma <strong>representação controlada pelo atacante como destino</strong>. O mecanismo da falha é validar a string antes de resolvê-la, em vez de autorizar o destino resolvido. A consequência: canonicalizar primeiro, resolvendo path e symlink contra a raiz e decompondo a URL em esquema, credenciais, host e endereço, e negar por padrão tudo que não estiver na allowlist, antes de qualquer leitura, escrita ou chamada de rede.</p>' },
        { tipo: 'texto', html:
          '<h3>Classificar para decidir retenção e destino</h3>' +
          '<p>Origem, confiança, sensibilidade, finalidade, residência, retenção e destino permitido são eixos independentes: uma página pública pode ser não sensível e ainda maliciosa; um token interno pode vir de fonte verificada e continuar altamente sensível. Pela LGPD, minimização, finalidade e retenção fazem parte do desenho do tratamento; decisões reais envolvem a assessoria adequada de cada organização. Valores de custo, contagem ou latência citados neste bloco são exemplo variável, nunca medição.</p>' },
        { tipo: 'takeaway', html: 'Valide o <mark>destino resolvido</mark>, não a string; <mark>negue por padrão</mark> antes do <mark>efeito</mark>.' }
      ] },

      { rotulo: 'Ver funcionando', blocos: [
        { tipo: 'texto', html:
          '<h3>Negar por construção, nunca sanitizar com esperteza</h3>' +
          '<p>Allowlist de hosts responde "para onde é permitido ir"; schema fechado responde "qual forma de argumento é aceitável"; path canônico responde "qual destino real foi autorizado". Cada pergunta é respondida por código determinístico antes do efeito, com código de erro estável e sem executar nada parcial.</p>' },
        { tipo: 'texto', largo: true, html:
          '<table><thead><tr><th>Pergunta</th><th>Controle</th><th>Negação</th><th>O que não fazer</th></tr></thead><tbody>' +
          '<tr><td>o argumento tem a forma esperada?</td><td>schema fechado com tipos e valores literais</td><td>argumento extra, ausente ou fora do enum é rejeitado</td><td>aceitar campos desconhecidos e ignorar o excedente</td></tr>' +
          '<tr><td>o arquivo está no workspace?</td><td>resolver path e symlink contra a raiz e comparar</td><td>traversal e escape viram negação antes de I/O</td><td>procurar <code>..</code> na string com substituição textual</td></tr>' +
          '<tr><td>o destino de rede é permitido?</td><td>esquema fechado, sem credenciais, host na allowlist, endereço não privado</td><td>SSRF e host desconhecido viram negação antes da chamada</td><td>bloquear só prefixos conhecidos de endereço interno</td></tr>' +
          '<tr><td>a saída pode circular?</td><td>redação de padrões sensíveis e telemetria mínima por allowlist</td><td>segredo vira marcador e o evento guarda só metadados</td><td>copiar o valor para o evento "para depurar"</td></tr>' +
          '</tbody></table>' },
        { tipo: 'texto', html: '<p>No exemplo trabalhado, o arquivo hostil é negado três vezes por camadas independentes: o path resolve para fora da raiz e é negado antes de qualquer leitura; a URL aponta para fora da allowlist e é negada antes de qualquer chamada; o segredo que sobra no texto é redigido antes de alcançar relatório ou trace, e o evento registra categoria, regra e tenant, sem o valor. Nomes reais do laboratório (exemplo ilustrativo, valores variáveis):</p>' },
        { tipo: 'abas', rotulo: 'Os três controles', itens: [
          { rotulo: 'Path e URL', blocos: [{ tipo: 'codigo', linguagem: 'python', texto:
            'policy = ToolConstraints(workspace, frozenset({"api.example.test"}))\npolicy.safe_path(Path("reports") / "result.json")  # dentro da raiz: autoriza\npolicy.safe_path(Path("..") / "secret.txt")  # fora da raiz: SEC_PATH_OUTSIDE_WORKSPACE\npolicy.safe_url("https://api.example.test/v1?q=ok")  # allowlist: autoriza\npolicy.safe_url("https://169.254.169.254/latest/meta-data")  # SEC_SSRF_ADDRESS' }] },
          { rotulo: 'Redação', blocos: [{ tipo: 'codigo', linguagem: 'python', texto:
            'result = ContentPolicy().redact("contato owner@example.com")\n# result.text troca o valor por [REDACTED:email]; categories registra {"email"}' }] },
          { rotulo: 'Schema fechado', blocos: [{ tipo: 'codigo', linguagem: 'python', texto:
            'registry = ToolSchemaRegistry()\nregistry.register("export_report", ExportReportArguments)\nregistry.validate(proposal)  # enum fora de ["json", "pdf"]: TOOL_ARGUMENTS_INVALID\n# campo extra ou ausente: TOOL_ARGUMENTS_INVALID; tool desconhecida: TOOL_NOT_REGISTERED' }] }
        ] },
        { tipo: 'rode', id: 'm12b2-rode', titulo: 'Filtro ingênuo contra canonicalização', terminalTitulo: 'workspace /srv/ws',
          enunciado: 'A entrada <code>....//....//etc/passwd</code> passa por um filtro que remove <code>../</code> da string. Rode e clique em cada etapa para ver o que o sistema operacional resolveria. Saídas de uma execução real de <code>posixpath</code> em Python.',
          prefixo: '$', entrada: 'python traversal.py "....//....//etc/passwd"', unidade: 'ms',
          prever: { pergunta: 'O filtro remove "../" do texto. Onde o path "....//....//etc/passwd" cai depois de montado e resolvido?', opcoes: [
            { id: 'a', texto: 'Dentro de /srv/ws: o filtro removeu o perigoso.', correta: false, porque: 'a remoção cria um novo "../" ao juntar os pedaços que sobram.' },
            { id: 'b', texto: 'Em /etc/passwd: a remoção reconstrói "../../etc/passwd".', correta: true, porque: 'cada "....//" vira "../" depois que o filtro tira o miolo. Substituição textual perde para entrada construída para reaparecer.' },
            { id: 'c', texto: 'Em erro de sintaxe: o sistema recusa esse path.', correta: false, porque: 'o sistema operacional resolve "../" normalmente.' }
          ] },
          etapas: [
            { id: 'filtro', nome: 'Filtro ingênuo', descricao: 'remove "../" da string', tom: 'request', ms: 1, linhas: [
              L('info', 'entrada   = ....//....//etc/passwd'),
              L('info', 'filtrada  = ../../etc/passwd'),
              L('info', 'montada   = /srv/ws/../../etc/passwd'),
              L('out', 'resolvida = /etc/passwd'),
              L('hint', 'ESCAPOU DA RAIZ: o filtro reconstruiu o traversal')] },
            { id: 'canon', nome: 'Canonicalizar e conferir', descricao: 'resolve contra a raiz e compara o prefixo', tom: 'response', ms: 1, linhas: [
              L('cmd', 'safe_path("/srv/ws", "../../etc/passwd")'),
              L('out', 'resolvida = /etc/passwd'),
              L('in', 'SEC_PATH_OUTSIDE_WORKSPACE (negado antes de abrir)'),
              L('hint', 'o controle olha o destino real, não a grafia')] },
            { id: 'ok', nome: 'Acesso legítimo', descricao: 'dentro da raiz', tom: 'tls', ms: 1, linhas: [
              L('cmd', 'safe_path("/srv/ws", "reports/result.json")'),
              L('in', '/srv/ws/reports/result.json (autorizado)'),
              L('hint', 'o controle não atrapalha o trabalho legítimo')] }
          ],
          tutorDepois: 'O filtro textual abriu a porta que pretendia fechar. A canonicalização compara o destino real com a raiz e nega com código estável, antes de qualquer leitura.',
          callout: 'Você viu o filtro ingênuo falhar e a conferência canônica negar.' },
        { tipo: 'takeaway', html: 'Substituição textual é derrotada por entradas feitas para <mark>reaparecer</mark>; resolva o <mark>destino real</mark> e compare com a raiz.' }
      ] },

      { rotulo: 'Praticar', blocos: [
        { tipo: 'python', id: 'm12b2-python', titulo: 'Implemente safe_path e safe_url', obrigatorio: false,
          enunciado: 'Implemente <code>safe_path(raiz, candidato, symlinks)</code>: normalize o path contra a raiz, siga o symlink simulado e negue com <code>SEC_PATH_OUTSIDE_WORKSPACE</code> se o destino real sai dela (cuidado com <code>/srv/ws-outro</code>). Implemente <code>safe_url(url, allowed_hosts)</code>: <code>SEC_URL_INVALID</code> para esquema diferente de https, host ausente ou credenciais embutidas; <code>SEC_SSRF_ADDRESS</code> para IP literal privado, loopback, link-local, reservado ou multicast; <code>SEC_HOST_NOT_ALLOWED</code> para host fora da allowlist.',
          codigo: PY_INI, testes: PY_TEST,
          dica: 'Path: <code>posixpath.normpath(posixpath.join(raiz, candidato))</code>, depois <code>symlinks.get(destino, destino)</code>, e o prefixo é <code>raiz + "/"</code>, nunca só <code>raiz</code>. URL: <code>urlsplit(url).hostname</code>; <code>ipaddress.ip_address(host)</code> levanta <code>ValueError</code> quando o host é um nome (aí vale a allowlist).',
          solucao: PY_SOL,
          tutorDepois: 'Negue por padrão: o que não está na raiz ou na allowlist não passa. DNS real e redirecionamentos pertencem à boundary de rede e não entram neste oráculo.',
          callout: 'Path e URL são autorizados pelo destino resolvido, com código estável antes do efeito.' },
        { tipo: 'cenario', id: 'm12b2-cenario', titulo: 'O arquivo hostil chegou ao executor', obrigatorio: false,
          enunciado: 'O arquivo ingerido pede <code>../../secret.txt</code>, depois uma URL de metadados e deixa uma chave de acesso no texto. Decida o desenho da contenção.',
          inicio: 'inicio',
          nos: {
            inicio: { texto: 'A tool de leitura recebeu <code>../secret.txt</code> como path. Qual é o seu controle?', opcoes: [
              { texto: 'Remover as ocorrências de "../" da string antes de abrir.', vai: 'f-filtro', tom: 'ruim', consequencia: '"....//" reaparece como "../" depois do filtro. Cada regra nova cobre o ataque de ontem.' },
              { texto: 'Resolver path e symlink contra a raiz do workspace e negar antes de abrir se o destino real sai dela.', vai: 'url', tom: 'ok', consequencia: 'o destino real é a única coisa que importa; negação com SEC_PATH_OUTSIDE_WORKSPACE.' }
            ] },
            url: { texto: 'Agora a tool de rede recebe <code>https://169.254.169.254/latest/meta-data</code>. O host está "no domínio permitido da empresa" segundo o time. O que você faz?', opcoes: [
              { texto: 'Bloquear só "localhost" e "127.0.0.1" por lista.', vai: 'f-lista', tom: 'ruim', consequencia: 'o endereço de metadados é link-local; lista de prefixos conhecidos perde para formas alternativas.' },
              { texto: 'Exigir https, recusar credenciais, negar endereço privado, loopback, link-local ou reservado, e exigir host na allowlist, tudo antes da chamada.', vai: 'segredo', tom: 'ok', consequencia: 'negado com SEC_SSRF_ADDRESS antes de qualquer rede.' }
            ] },
            segredo: { texto: 'O arquivo trazia uma chave de acesso no texto, que o relatório ia citar. Qual é o tratamento?', opcoes: [
              { texto: 'Redigir com a política de conteúdo (<code>[REDACTED:aws_key]</code>), registrar só a categoria no evento e continuar tratando a redação como defesa em profundidade.', vai: 'f-bom', tom: 'ok', consequencia: 'o valor não chega a relatório nem trace; a fronteira continua sendo schema, allowlist e minimização.' },
              { texto: 'Copiar a chave no evento de auditoria para depurar depois.', vai: 'f-vaza', tom: 'ruim', consequencia: 'o trace virou o novo vazamento: valor literal no evento.' },
              { texto: 'Confiar na redação e liberar o destino que o texto sugere.', vai: 'f-confia', tom: 'ruim', consequencia: 'redação tem falsos negativos (codificação, token inédito); ela não autoriza destino nenhum.' }
            ] }
          },
          finais: {
            'f-bom': { bom: true, texto: 'Três negações por camadas independentes, antes do efeito, com evento que guarda categoria, regra e tenant e nunca o valor.' },
            'f-filtro': { bom: false, texto: 'O traversal reconstruído leu o arquivo fora do workspace. Era o ataque que o filtro prometia fechar.' },
            'f-lista': { bom: false, texto: 'A chamada alcançou o serviço de metadados por um endereço que a lista não previa.' },
            'f-vaza': { bom: false, texto: 'A chave apareceu no trace e agora vive em mais um sistema. A resposta a segredo vazado é revogar.' },
            'f-confia': { bom: false, texto: 'Um payload codificado escapou da redação e o destino sugerido foi alcançado, porque o redator virou autorização.' }
          },
          callout: 'Você negou por camadas, antes do efeito, sem tratar a redação como fronteira.' },
        { tipo: 'takeaway', html: 'Cada camada nega <mark>sozinha</mark>; a <mark>redação</mark> só reduz o dano que sobra.' }
      ] },

      { rotulo: 'Conferir', blocos: [
        { tipo: 'texto', html:
          '<h3>O que prova que a contenção segurou</h3>' +
          '<p>O oráculo nunca é "o modelo percebeu a malícia"; é "nenhum efeito ocorreu fora da autoridade e nenhum segredo circulou". M12-AT-002 fecha quando traversal, symlink escape e SSRF são negados antes de qualquer I/O externo. M12-AT-003 fecha quando segredo e PII somem de saída e trace e o evento preserva metadados sem o valor. M12-AT-004 fecha quando argumento extra, enum inválido e destino não permitido são rejeitados por validação determinística.</p>' },
        { tipo: 'texto', largo: true, html:
          '<table><thead><tr><th>Sintoma</th><th>Hipótese</th><th>Evidência</th><th>Correção</th></tr></thead><tbody>' +
          '<tr><td>leitura alcançou arquivo fora do workspace</td><td>string validada antes da resolução</td><td>negação ausente ou posterior ao I/O</td><td>resolver path e symlink contra a raiz e negar com <code>SEC_PATH_OUTSIDE_WORKSPACE</code> antes de abrir</td></tr>' +
          '<tr><td>chamada alcançou destino interno</td><td>host inicial autorizado sem checar o endereço real</td><td>esquema, credenciais ou faixa privada aceitos</td><td>exigir <code>https</code>, recusar credenciais, negar endereço privado e host fora da allowlist antes da chamada</td></tr>' +
          '<tr><td>segredo aparece em relatório ou trace</td><td>conteúdo copiado para saída ou evento</td><td>valor literal no texto ou no atributo</td><td>redigir com <code>ContentPolicy</code>; telemetria só por allowlist de atributos, marcando <code>security.outcome</code> como <code>redacted</code></td></tr>' +
          '<tr><td>payload codificado escapa da redação</td><td>redator tratado como autorização</td><td>padrão novo ou ofuscado passa intacto</td><td>rebaixar a redação a defesa em profundidade; a fronteira é schema, allowlist e minimização</td></tr>' +
          '<tr><td>argumento inesperado executa</td><td>schema aberto ou validado depois do efeito</td><td>campo extra aceito ou enum divergente</td><td>schema fechado validado no runtime antes de decidir a política</td></tr>' +
          '<tr><td>SSRF via IP literal ou multicast</td><td>allowlist só de nomes; blocos especiais não negados</td><td>faixa especial aceita</td><td>negar privado, loopback, link-local, reservado e multicast com <code>SEC_SSRF_ADDRESS</code>; sem DNS real aqui</td></tr>' +
          '</tbody></table>' },
        { tipo: 'callout', tom: 'danger', titulo: 'Perigo', html:
          '<p>Substituição textual de <code>..</code>, lista de bloqueio de hosts e regex de segredo isolados não fecham M12-AT-002 nem M12-AT-003. Representações alternativas (codificação, symlink, endereço literal, credencial embutida) contornam cada filtro pontual. A fronteira é canonicalizar e negar por padrão; a redação apenas reduz o dano residual.</p>' },
        { tipo: 'texto', html:
          '<h3>Contraste: negação antes do efeito contra sanitização esperta</h3>' +
          '<p>Uma contenção fraca tenta adivinhar a intenção do atacante: remove <code>..</code> da string, bloqueia dois endereços internos conhecidos, mascara um formato de chave. Uma contenção determinística inverte o ônus: resolve o destino real, compara com o conjunto fechado do permitido e nega tudo o mais com um código estável, antes de tocar em disco ou rede. Da mesma forma, um evento "rico" que copia o conteúdo para depurar contrasta com um evento seguro que registra tipo, regra, tenant e categorias.</p>' },
        { tipo: 'escolha', id: 'm12b2-escolha-traversal', titulo: 'Confira: remover "../"',
          pergunta: 'Para impedir path traversal, o código remove "../" do caminho informado. Por que isso é insuficiente?',
          opcoes: [
            opc('a', 'Porque o sistema operacional não aceita caminhos relativos.', false, 'aceita; é por isso que o traversal funciona.'),
            opc('b', 'Porque "....//" vira "../" após a remoção e há codificações como %2e%2e; a defesa é canonizar e conferir o prefixo da base.', true, 'substituição textual é derrotada por entradas construídas para reaparecer. Resolva o caminho real (inclusive symlinks), decodifique antes e exija que o resultado esteja dentro do diretório base.'),
            opc('c', 'Porque a remoção é lenta.', false, 'o problema é de correção, não de velocidade.'),
            opc('d', 'Porque só funciona no Windows.', false, 'o ataque é independente de plataforma.')
          ], tutorDepois: 'Decodifique, resolva, compare o prefixo da raiz.' },
        { tipo: 'escolha', id: 'm12b2-escolha-ssrf', titulo: 'Confira: URLs fornecidas pelo usuário',
          pergunta: 'Um agente busca URLs fornecidas pelo usuário. Qual medida mais reduz o risco de SSRF?',
          opcoes: [
            opc('a', 'Bloquear apenas "localhost" por lista.', false, 'a lista perde para IP literal, DNS e redirecionamento.'),
            opc('b', 'Validar o texto da URL com regex.', false, 'regex se contorna por formas alternativas de endereço.'),
            opc('c', 'Confiar no DNS do provedor.', false, 'o nome pode resolver para endereço interno.'),
            opc('d', 'Resolver o host, validar o IP contra faixas privadas e de metadados, fixar o IP na conexão e limitar redirecionamentos.', true, 'a validação precisa acontecer sobre o IP efetivamente usado, incluindo cada redirecionamento e o endpoint de metadados da nuvem. No laboratório desta aula o escopo é a decisão local; DNS e egress reais ficam na boundary.')
          ], tutorDepois: 'Valide o IP efetivo de cada salto.' },
        { tipo: 'texto', html:
          '<h3>Contratos congelados para o laboratório (B02-L)</h3>' +
          '<p>O laboratório executa esta teoria sem rede, com arquivos planos. <code>SecurityViolation</code> é levantado antes de qualquer efeito externo. <code>ToolConstraints(workspace, allowed_hosts)</code> tem <code>safe_path(candidate)</code> (resolve path e symlink contra a raiz; <code>SEC_PATH_OUTSIDE_WORKSPACE</code>) e <code>safe_url(raw_url)</code> (exige <code>https</code>, recusa credenciais, nega endereço privado, loopback, link-local ou reservado com <code>SEC_SSRF_ADDRESS</code>, host fora da allowlist com <code>SEC_HOST_NOT_ALLOWED</code> e forma inválida com <code>SEC_URL_INVALID</code>). <code>ContentPolicy().redact(text)</code> devolve texto com marcadores <code>[REDACTED:categoria]</code> e as categorias entre <code>email, aws_key, private_key, connection_string</code>, mantendo instrução não confiável como texto sem lhe dar autoridade. <code>SafeSpanExporter(content_policy).export(name, attributes)</code> descarta atributos fora da allowlist, redige strings permitidas e marca <code>security.outcome</code> como <code>redacted</code> quando algo foi redigido. <code>ToolSchemaRegistry</code> e <code>SafeAgentRuntime.evaluate_proposal</code> seguem o contrato do Bloco 1.</p>' +
          '<p><strong>Limites declarados:</strong> symlink escape e defesa de DNS e egress na boundary real, payload codificado e exporter real do Capstone, além da suíte em PostgreSQL e do ponta a ponta, pertencem às evidências seguintes e não são alegados aqui.</p>' +
          '<p><strong>Resultados esperados:</strong> M12-AT-002 nega SSRF, traversal e symlink escape antes de qualquer I/O externo; M12-AT-003 remove segredo e PII de saída e trace, preservando só metadados seguros; M12-AT-004 rejeita argumento extra, enum inválido e destino não permitido.</p>' +
          '<h3>Fontes do bloco</h3>' +
          '<ul><li>OWASP Application Security Verification Standard: validação, controle de acesso e proteção de dados.</li>' +
          '<li>OWASP API Security: autorização por tenant e escopo, validação de entrada.</li>' +
          '<li>Lei Geral de Proteção de Dados, texto compilado: minimização, finalidade e retenção.</li>' +
          '<li>Materiais educativos da ANPD: orientação brasileira para decisões de tratamento e retenção.</li></ul>' },
        { tipo: 'takeaway', html: 'M12-AT-002 a AT-004 fecham por <mark>negação</mark> e <mark>redação</mark> observáveis em teste, com <mark>limites explícitos</mark> para a boundary real.' }
      ] }
    ]
  });
})();
