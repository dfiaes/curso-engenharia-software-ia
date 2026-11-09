/* P01 · Bloco 4: Identidade e segredos. Fonte: P01.html#b04. Saídas do deploycheck são execuções reais do laboratório (lab/), com a edição indicada. */
(function () {
  var L = function (kind, text) { return { kind: kind, text: text }; };
  function opc(id, texto, correta, porque) { return { id: id, texto: texto, correta: correta, porque: porque }; }

  var CHECK = 'uv run deploycheck --strict --bicep infra/main.bicep';

  var etapasChave = function () {
    return [
      { id: 'conta', nome: 'Conta do modelo', descricao: 'Propriedade no Bicep', tom: 'dns', ms: 1, linhas: [
        L('info', 'infra/main.bicep, linha 112 (recurso Microsoft.CognitiveServices/accounts)'),
        L('hint', 'sem falha: disableLocalAuth: true, só token Entra ID vale. Com a falha escolhida, a edição troca por false antes do check')] },
      { id: 'check', nome: 'deploycheck', descricao: 'Regra XR009', tom: 'request', ms: 1, linhas: [
        L('out', '0 erro(s), 0 aviso(s)'),
        L('hint', 'exit=0')] },
      { id: 'pr', nome: 'Merge', descricao: 'O que o CI decide', tom: 'response', ms: 1, linhas: [
        L('info', 'check verde: o PR segue para revisão humana com a conta sem chave')] }
    ];
  };

  var codigoRbac = [
    'OAI = "/sub/rg/openai-conta"', '',
    'PAPEIS = {',
    '    "AcrPull": {"acr:pull"},',
    '    "Key Vault Secrets User": {"kv:secret/read"},',
    '    "Cognitive Services OpenAI User": {"openai:chat", "openai:embeddings"},',
    '    "Contributor": {"control:write", "control:delete"},  # plano de controle',
    '}', '', '',
    'def no_escopo(recurso, escopo):',
    '    # o recurso está dentro do escopo? Cuidado com a fronteira:',
    '    # "/sub/rg/openai-conta-b" NÃO está em "/sub/rg/openai-conta"',
    '    return recurso.startswith(escopo)', '', '',
    'def pode(atribuicoes, acao, recurso):',
    '    """atribuicoes: lista de (papel, escopo). Vale se algum papel traz a ação no escopo."""',
    '    return False', '',
    'print(pode([("Cognitive Services OpenAI User", OAI)], "openai:chat", OAI))', ''].join('\n');
  var testesRbac = [
    'def test_papel_de_dados_no_escopo_da_conta():',
    '    assert pode([("Cognitive Services OpenAI User", OAI)], "openai:chat", OAI)', '', '',
    'def test_escopo_cobre_recursos_filhos():',
    '    assert pode([("Cognitive Services OpenAI User", OAI)], "openai:embeddings", OAI + "/deployments/gpt")', '', '',
    'def test_fronteira_do_escopo():',
    '    assert not no_escopo(OAI + "-b", OAI)', '    assert no_escopo(OAI, OAI)', '', '',
    'def test_contributor_nao_chama_inferencia():',
    '    assert not pode([("Contributor", OAI)], "openai:chat", OAI)', '', '',
    'def test_papel_certo_em_outro_recurso_nao_vale():',
    '    assert not pode([("Cognitive Services OpenAI User", "/sub/rg/openai-outra")], "openai:chat", OAI)', '', '',
    'def test_sem_atribuicao_ou_papel_desconhecido():',
    '    assert not pode([], "openai:chat", OAI)', '    assert not pode([("Dono Supremo", OAI)], "openai:chat", OAI)', ''].join('\n');
  var solucaoRbac = [
    'OAI = "/sub/rg/openai-conta"', '',
    'PAPEIS = {',
    '    "AcrPull": {"acr:pull"},',
    '    "Key Vault Secrets User": {"kv:secret/read"},',
    '    "Cognitive Services OpenAI User": {"openai:chat", "openai:embeddings"},',
    '    "Contributor": {"control:write", "control:delete"},',
    '}', '', '',
    'def no_escopo(recurso, escopo):',
    '    return recurso == escopo or recurso.startswith(escopo.rstrip("/") + "/")', '', '',
    'def pode(atribuicoes, acao, recurso):',
    '    return any(',
    '        acao in PAPEIS.get(papel, set()) and no_escopo(recurso, escopo)',
    '        for papel, escopo in atribuicoes',
    '    )', ''].join('\n');

  TrilhaAula.registrar({
    id: 'p01-b4',
    titulo: 'Identidade e segredos: managed identity, RBAC mínimo e Key Vault',
    minutos: 35,
    resumo: 'Uma chave de API em variável de ambiente vaza, não expira e não diz quem a usou. A alternativa é o contêiner provar quem é e o recurso decidir por papel: nenhum segredo para o modelo, o registro ou o cofre.',
    objetivo: 'Explicar a cadeia de acesso ao modelo sem chave, atribuir só papéis de dados no menor escopo, diagnosticar um 403 sem alargar permissão e dizer o que o Key Vault ainda guarda e como a rotação chega ao app.',
    revisao: [
      { id: 'p01b4-userassigned', pergunta: 'Por que o lab usa identidade <strong>user-assigned</strong> e não system-assigned?',
        opcoes: [
          opc('a', 'Ela existe antes do app, então <code>AcrPull</code> e o acesso ao cofre podem ser concedidos antes da primeira revisão', true, 'com identidade de sistema o principal só nasce com o app, e a primeira revisão falha ao puxar a imagem: ciclo sem saída.'),
          opc('b', 'Ela é mais barata que a identidade de sistema', false, 'as duas custam o mesmo; a razão é operacional, não financeira.'),
          opc('c', 'Ela dispensa o RBAC', false, 'os papéis continuam necessários; muda só o ciclo de vida da identidade.')] },
      { id: 'p01b4-403', pergunta: 'A identidade do app tem <code>Contributor</code> no recurso do modelo e recebe 403 na inferência. Por quê?',
        opcoes: [
          opc('a', '<code>Contributor</code> é papel de plano de controle; inferência é plano de dados e exige um papel de dados', true, 'ser Owner da conta não permite chamá-la, e ter <code>Cognitive Services OpenAI User</code> não permite alterá-la.'),
          opc('b', 'O RBAC nunca termina de propagar', false, 'a propagação leva minutos, não é eterna; outras causas: escopo errado, <code>AZURE_CLIENT_ID</code> ausente, autenticação local desligada sem o app usar token.'),
          opc('c', '<code>Contributor</code> não existe no Azure', false, 'existe, e é justamente o papel largo que não resolve este 403.')] },
      { id: 'p01b4-rotacao', pergunta: 'Um segredo de parceiro foi rotacionado no Key Vault e o app segue usando o valor antigo. O que explica?',
        opcoes: [
          opc('a', 'O contêiner lê o valor na partida; é preciso reiniciar ou criar nova revisão', true, 'não há "reler": sem versão na URL a plataforma passa à versão nova depois de um intervalo e reinicia as revisões afetadas.'),
          opc('b', 'O Key Vault não suporta rotação', false, 'suporta; a questão é quando o contêiner lê o valor.'),
          opc('c', 'O RBAC bloqueia a versão nova', false, 'o mesmo papel <code>Key Vault Secrets User</code> lê qualquer versão do segredo.')] },
      { id: 'p01b4-localauth', pergunta: 'O que <code>disableLocalAuth: true</code> na conta do modelo garante?',
        opcoes: [
          opc('a', 'Desliga a autenticação por chave: uma chave vazada deixa de existir como categoria de risco', true, 'o <code>deploycheck</code> reprova <code>disableLocalAuth: false</code> (XR009).'),
          opc('b', 'Exige autenticação de quem chama o seu serviço', false, 'identidade resolve como o serviço fala com a nuvem, não quem fala com o serviço.'),
          opc('c', 'Concede o papel de dados à identidade do app', false, 'papel de dados é uma atribuição RBAC à parte.')] },
      { id: 'p01b4-endpoint', pergunta: 'O ingresso externo do lab não exige credencial do chamador. Qual é a correção para produção?',
        opcoes: [
          opc('a', 'Autenticação na frente (Easy Auth/Entra, API Management, ingress privado) e quota por chamador', true, 'qualquer pessoa com a URL consome seus tokens, e a managed identity não protege esse lado.'),
          opc('b', 'Dar mais papéis à identidade do app', false, 'mais papéis aumentam o dano, não resolvem quem entra.'),
          opc('c', 'Trocar a chave por uma chave de cliente no código do app', false, 'a chave de cliente validada pelo serviço é válida, mas o segredo vive no Key Vault, nunca no código.')] }
    ],
    abas: [
      { rotulo: 'Entender', blocos: [
        { tipo: 'texto', html:
          '<p>Uma chave de API em variável de ambiente resolve o problema de autenticar e cria quatro novos: ela <strong>vaza</strong> (log, <code>docker history</code>, captura de tela, repositório), <strong>não expira</strong>, <strong>não diz quem a usou</strong> e <strong>dá o mesmo poder a quem a copiar</strong>.</p>' +
          '<p>O padrão de nuvem é trocar "algo que você sabe" por "algo que você é": a plataforma atesta a identidade do seu workload, e o recurso de destino decide por papel o que essa identidade pode fazer. O resultado é um serviço sem segredo para o modelo, para o registro e para o cofre. O <a href="../M12-producao-seguranca-sre-billing/M12.html#b3">M12</a> chama isso de identidade como fronteira; aqui está a prática no Azure.</p>' +
          '<h3>Como funciona uma managed identity</h3>' +
          '<p>Uma <strong>managed identity</strong> é um principal de serviço no Microsoft Entra ID cujo ciclo de vida e credenciais a plataforma gerencia: você nunca vê o segredo. Existem dois tipos.</p>' },
        { tipo: 'texto', largo: true, html:
          '<table><thead><tr><th></th><th>System-assigned</th><th>User-assigned</th></tr></thead><tbody>' +
          '<tr><td>Ciclo de vida</td><td>Nasce e morre com o recurso (o app).</td><td>Recurso próprio, independente do app.</td></tr>' +
          '<tr><td>Compartilhamento</td><td>Um recurso, uma identidade.</td><td>Vários recursos podem usá-la.</td></tr>' +
          '<tr><td>Quando existe</td><td>Só depois que o app é criado.</td><td>Antes de tudo: dá para conceder papéis primeiro.</td></tr>' +
          '<tr><td>Seleção no SDK</td><td>Automática.</td><td>Exige o <code>client_id</code> (<code>AZURE_CLIENT_ID</code>) se houver mais de uma.</td></tr>' +
          '</tbody></table>' },
        { tipo: 'texto', html:
          '<p>O lab usa <strong>user-assigned</strong> por uma razão operacional que pega muita gente. O app precisa do papel <code>AcrPull</code> <em>para criar a primeira revisão</em> (puxar a imagem) e do acesso ao Key Vault para resolver os segredos. Com identidade de sistema, o principal só existe depois do app, e a primeira revisão falha por falta de permissão, num ciclo sem saída. Com a identidade criada antes e os papéis atribuídos antes, o app já nasce com tudo.</p>' +
          '<h3>O fluxo sem chave</h3>' +
          '<ol><li>O contêiner pede um token ao <strong>endpoint de identidade</strong> da plataforma (que fala com o Entra ID).</li>' +
          '<li>Recebe um <strong>JWT de cerca de 1 h</strong>, com escopo (destinatário) do recurso.</li>' +
          '<li>Apresenta o token ao recurso de modelo em <code>Authorization: Bearer</code>.</li>' +
          '<li>O recurso valida o token e o <strong>papel</strong> (RBAC) da identidade.</li></ol>' +
          '<p>Nenhuma credencial estática entra no contêiner. O token é curto, tem destinatário e é renovado pelo SDK.</p>' +
          '<h3>No código: um adapter que nunca vê uma chave</h3>' +
          '<p>O adapter do laboratório fala com o endpoint compatível com OpenAI (<code>/openai/v1/</code>) usando um <code>Authorization: Bearer</code> obtido de um <strong>token provider</strong> assíncrono. O mesmo código roda na sua máquina (a credencial vem do <code>az login</code>) e na nuvem (vem da identidade), porque <code>DefaultAzureCredential</code> tenta uma cadeia de fontes em ordem. A versão assíncrona, de <code>azure.identity.aio</code>, importa: a síncrona bloquearia o event loop, e todas as requisições em voo, a cada renovação.</p>' },
        { tipo: 'codigo', linguagem: 'python', texto: [
          'def build_token_provider(scope: str) -> TokenProvider:',
          '    """Token provider assíncrono via `azure.identity.aio` (extra opcional `azure`)."""',
          '    try:',
          '        identity = importlib.import_module("azure.identity.aio")',
          '    except ModuleNotFoundError as exc:',
          '        raise ConfigError("instale o extra opcional: uv sync --extra azure") from exc',
          '    credential = identity.DefaultAzureCredential()',
          '    provider: TokenProvider = identity.get_bearer_token_provider(credential, scope)',
          '    return provider'].join('\n') },
        { tipo: 'texto', html:
          '<p>Três detalhes de contrato que os testes do lab garantem (<code>tests/test_llm_azure.py</code>):</p>' +
          '<ul><li>O cabeçalho é <code>Bearer</code> e <em>não</em> há <code>api-key</code>.</li>' +
          '<li>429, 5xx e timeout viram <code>LLMUnavailable</code> (com <code>Retry-After</code> repassado à resposta 503, retentável). 401 e 403 viram um erro <strong>não retentável</strong> cuja mensagem aponta para o RBAC: tentar de novo uma permissão ausente só atrasa o diagnóstico.</li>' +
          '<li>Resposta fora do formato esperado vira <code>LLMError</code> sem vazar o corpo do provedor ao cliente.</li></ul>' },
        { tipo: 'takeaway', html: 'Identidade gerenciada troca a <mark>chave</mark> por um <mark>token curto</mark> com destinatário; <mark>user-assigned</mark> deixa conceder papéis antes de o app existir.' }
      ] },

      { rotulo: 'RBAC e acesso ao modelo', blocos: [
        { tipo: 'texto', html:
          '<h3>RBAC mínimo: o que a identidade pode</h3>' +
          '<p>No Azure, papéis atribuídos a um principal sobre um <strong>escopo</strong> (assinatura, grupo de recursos ou recurso) definem as ações permitidas. O Bicep do lab dá à identidade do app exatamente três papéis, cada um no menor escopo possível (o próprio recurso).</p>' },
        { tipo: 'texto', largo: true, html:
          '<table><thead><tr><th>Papel</th><th>Escopo</th><th>Para quê</th></tr></thead><tbody>' +
          '<tr><td><code>AcrPull</code></td><td>o registro</td><td>puxar imagens; não envia, não apaga.</td></tr>' +
          '<tr><td><code>Key Vault Secrets User</code></td><td>o cofre</td><td>ler o valor de segredos; não cria nem altera.</td></tr>' +
          '<tr><td><code>Cognitive Services OpenAI User</code></td><td>a conta do modelo</td><td>chamar inferência (chat, embeddings); não cria implantações nem lê chaves.</td></tr>' +
          '</tbody></table>' },
        { tipo: 'texto', html:
          '<p>Os GUIDs dos papéis internos são fixos e públicos (<code>7f951dda-...</code>, <code>4633458b-...</code>, <code>5e0bd9bd-...</code>, conferidos na documentação de papéis internos em 11/10/2026). O Bicep usa o GUID em vez do nome porque o nome é texto de portal.</p>' +
          '<p>Na atribuição, <code>principalType: \'ServicePrincipal\'</code> evita uma falha clássica: o principal acabou de ser criado, ainda não replicou no diretório e a atribuição falha com "principal não encontrado". Informar o tipo dispensa a consulta ao diretório.</p>' },
        { tipo: 'callout', tom: 'info', titulo: 'Fundamento: plano de controle e plano de dados', html:
          '<p>Todo recurso Azure tem dois planos. O <strong>plano de controle</strong> (criar, configurar, apagar o recurso) é regido por papéis como <code>Owner</code> e <code>Contributor</code>. O <strong>plano de dados</strong> (o que o recurso faz para seus clientes: inferência, ler segredo, puxar imagem) é regido por papéis de dados, com <em>DataActions</em>.</p>' +
          '<p>Ser <code>Owner</code> da conta do modelo não permite chamá-lo; ter <code>Cognitive Services OpenAI User</code> não permite alterá-lo. É por isso que o 403 com "tenho Contributor" faz sentido, e é a base do mínimo privilégio: o app recebe apenas ações de dados, nunca de controle.</p>' },
        { tipo: 'texto', html:
          '<h3>Acesso ao modelo por Entra ID: o que precisa estar certo</h3>' +
          '<ol><li><strong>Subdomínio personalizado.</strong> O endpoint <code>https://&lt;nome&gt;.openai.azure.com/openai/v1/</code> exige que a conta tenha <code>customSubDomainName</code>; o endpoint regional genérico não aceita tokens Entra. O Bicep define o subdomínio igual ao nome da conta.</li>' +
          '<li><strong>Escopo do token.</strong> A documentação atual usa <code>https://ai.azure.com/.default</code> para o endpoint <code>/openai/v1/</code>. O escopo é configurável no lab (<code>AZURE_OPENAI_SCOPE</code>) porque já mudou entre versões de documentação e SDK. <strong>Confirme na página de managed identity do serviço antes de depender dele</strong> (verificado em 11/10/2026).</li>' +
          '<li><strong>Chaves desligadas.</strong> <code>disableLocalAuth: true</code> na conta desabilita a autenticação por chave; o <code>deploycheck</code> reprova <code>disableLocalAuth: false</code> (XR009).</li>' +
          '<li><strong>Papel de dados no escopo da conta</strong> e paciência: atribuições levam alguns minutos para valer. Um 403 nos primeiros minutos depois de um deploy novo costuma ser propagação, não erro.</li>' +
          '<li><strong>Seleção da identidade.</strong> Com user-assigned, o SDK só a escolhe se receber o <code>client_id</code>; o Bicep injeta <code>AZURE_CLIENT_ID</code>.</li></ol>' +
          '<p><strong>Nome do produto.</strong> O serviço que hospeda modelos OpenAI no Azure fica sob a marca <strong>Microsoft Foundry</strong> (antes Azure AI Foundry; o recurso "Azure OpenAI" continua existindo como tipo <code>Microsoft.CognitiveServices/accounts</code> com <code>kind: OpenAI</code>). Nomes de portal e de documentação mudam mais depressa que os tipos de recurso do ARM: no código de IaC, confie no tipo e na versão de API.</p>' },
        { tipo: 'quebre', id: 'idsec-quebre', titulo: 'Ligar a chave "só por hoje"', obrigatorio: true,
          enunciado: 'Escolha a falha, rode o check da conta do modelo e depois rode "Sem falha". A edição é uma troca de <code>true</code> por <code>false</code> em <code>infra/main.bicep</code>; a saída é execução real do laboratório.',
          prefixo: '$', entrada: CHECK, unidade: 's', terminalTitulo: 'lab/ · infra/main.bicep', etapas: etapasChave(),
          prever: { pergunta: 'Alguém troca <code>disableLocalAuth: true</code> por <code>false</code> para destravar uma demonstração. O <code>deploycheck --strict</code> sobre o Bicep reprova?', opcoes: [
            { id: 'a', texto: 'Não: é só uma propriedade booleana, o linter olha estrutura.', correta: false, porque: 'a regra XR009 procura exatamente esse texto.' },
            { id: 'b', texto: 'Sim: XR009, com a linha e a razão, e exit 1.', correta: true, porque: 'o check reprova <code>disableLocalAuth: false</code> porque a chave "temporária" é a que fica e dá ao vazamento o poder do recurso inteiro.' },
            { id: 'c', texto: 'Só avisa, sem barrar o merge.', correta: false, porque: 'com <code>--strict</code> o exit é diferente de zero.' }
          ] },
          falhas: [
            { id: 'chave', rotulo: 'disableLocalAuth: false', efeito: { etapaFalha: 'check', linhasErro: [
              { kind: 'info', text: 'edição: disableLocalAuth: true -> disableLocalAuth: false (infra/main.bicep, linha 112)' },
              { kind: 'out', text: 'infra/main.bicep:112: error XR009 disableLocalAuth: false mantém chaves ativas no recurso de modelo' },
              { kind: 'out', text: '1 erro(s), 0 aviso(s)' },
              { kind: 'hint', text: 'exit=1' }
            ], tutor: 'o check apontou a linha e a razão. Sem ele, a demo passa, a chave permanece e, seis meses depois, aparece num log de CI. Trave a propriedade em IaC e, no Azure, também em política, para que o portal não consiga ligá-la.' } }
          ],
          tutorAntes: 'Faça a previsão, aperte Enter com a falha selecionada e leia a mensagem. Depois escolha "Sem falha" e rode de novo.',
          tutorDepois: 'O caminho certo mantém a chave desligada e dá ao app o papel de dados.',
          callout: 'Você viu o check barrar a chave e liberar a conta sem ela.' },
        { tipo: 'takeaway', html: 'Dê só <mark>papéis de dados</mark> no <mark>menor escopo</mark> e desligue a <mark>autenticação por chave</mark> do recurso de modelo.' }
      ] },

      { rotulo: 'Key Vault e armadilhas', blocos: [
        { tipo: 'texto', html:
          '<h3>Key Vault: o que ainda precisa de segredo</h3>' +
          '<p>Com identidade, o modelo, o registro e o próprio cofre não precisam de segredo. Sobram credenciais que o seu serviço <em>não controla</em>: a chave de um parceiro, o token de um SaaS, um certificado. Para essas, o <strong>Key Vault</strong> guarda o valor e o Container Apps o referencia.</p>' +
          '<ul><li>No Bicep, <code>secrets: [{ name, keyVaultUrl, identity }]</code> declara a referência; no <code>env</code>, <code>secretRef</code> a expõe como variável. O valor nunca aparece no template, no <code>what-if</code> nem no repositório; ele é criado fora do código (<code>az keyvault secret set</code>).</li>' +
          '<li>O cofre usa <strong>RBAC</strong> (<code>enableRbacAuthorization: true</code>), não as <em>access policies</em> antigas: a mesma mecânica de papéis do resto do Azure, auditável, com escopo por segredo.</li>' +
          '<li><strong>Com versão ou sem versão na URL.</strong> Sem versão, a plataforma passa a usar a versão mais recente depois de um intervalo e reinicia as revisões afetadas; com versão, o valor é fixo até você mudar a URL. Rotação automática exige a primeira forma e um processo que aguenta reinício; controle fino de "quando troca" exige a segunda. Seja qual for, o contêiner lê a variável na partida: não há "reler".</li>' +
          '<li><strong>Soft-delete e proteção contra purga</strong> ficam ligados: segredo apagado por engano é recuperável, e um invasor com acesso de exclusão não consegue destruir o cofre de vez.</li></ul>' +
          '<p>No lab, o par <code>PARTNER_API_KEY</code>/<code>partner-api-key</code> existe atrás do parâmetro <code>useKeyVaultSecret</code> (padrão <code>false</code>), porque a referência a um segredo que ainda não existe faz a criação do app falhar. Ordem correta: criar o cofre, gravar o valor, depois implantar o app com o parâmetro em <code>true</code>.</p>' +
          '<h3>Equivalentes em AWS e GCP</h3>' },
        { tipo: 'texto', largo: true, html:
          '<table><thead><tr><th>Invariante</th><th>Azure</th><th>AWS</th><th>GCP</th></tr></thead><tbody>' +
          '<tr><td>Identidade do workload</td><td>Managed identity</td><td>Papel IAM da tarefa/função (task role)</td><td>Service account anexada ao serviço</td></tr>' +
          '<tr><td>Acesso ao modelo sem chave</td><td>Entra ID + <code>Cognitive Services OpenAI User</code></td><td>Bedrock via IAM (<code>bedrock:InvokeModel</code>)</td><td>Vertex AI via IAM (<code>roles/aiplatform.user</code>)</td></tr>' +
          '<tr><td>Segredos</td><td>Key Vault (RBAC)</td><td>Secrets Manager / Parameter Store</td><td>Secret Manager</td></tr>' +
          '<tr><td>Federação do CI (sem segredo)</td><td>Credencial federada + <code>azure/login</code></td><td>Provedor OIDC + <code>configure-aws-credentials</code> (role-to-assume)</td><td>Workload Identity Federation + <code>google-github-actions/auth</code></td></tr>' +
          '</tbody></table>' },
        { tipo: 'callout', tom: 'danger', titulo: 'Armadilha que pega sênior: a chave "temporária" que fica', html:
          '<p>Para destravar uma demonstração, alguém liga a autenticação por chave na conta do modelo e põe a chave numa variável. A demo passa; a chave permanece; seis meses depois ela está em um log de CI. Se a conta de produção tem <code>disableLocalAuth: false</code>, qualquer vazamento de chave é um vazamento do recurso inteiro e <em>nada</em> no RBAC o contém. Trave a propriedade em IaC (e em política do Azure, para que o portal também não consiga ligá-la) e trate o pedido de "só uma chave por hoje" como um incidente evitado.</p>' },
        { tipo: 'callout', tom: 'danger', titulo: 'Armadilha que pega sênior: papel largo "para funcionar"', html:
          '<p>Diante de um 403, a tentação é <code>Contributor</code> no grupo de recursos. Além de não resolver o 403 (plano de controle), concede ao app o poder de alterar ou apagar o próprio ambiente, e agora qualquer injeção de comando ou SSRF no serviço vira controle de infraestrutura. O diagnóstico certo é ler a mensagem, identificar qual ação de dados falta e conceder só essa, no escopo do recurso.</p>' },
        { tipo: 'callout', tom: 'danger', titulo: 'Armadilha que pega sênior: endpoint público sem autenticação de chamador', html:
          '<p>A identidade resolve como o <em>serviço</em> fala com a nuvem, não quem fala com o <em>serviço</em>. O Bicep do lab publica o ingresso externo e a API não exige credencial: qualquer pessoa com a URL consome seus tokens. Em produção, coloque autenticação na frente (Easy Auth/Entra, API Management, ingress privado com VNet, ou chave de cliente validada pelo serviço, com o segredo no Key Vault) e quota por chamador (<a href="../M12-producao-seguranca-sre-billing/M12.html">M12</a>). No laboratório pago, restrinja o ingresso ao seu IP.</p>' },
        { tipo: 'takeaway', html: 'O <mark>Key Vault</mark> guarda o que você <mark>não controla</mark>, entrega o valor <mark>na partida</mark> (rotação exige reinício) e funciona por <mark>RBAC</mark>; identidade do serviço não substitui <mark>autenticação do chamador</mark>.' }
      ] },

      { rotulo: 'Praticar e conferir', blocos: [
        { tipo: 'python', id: 'idsec-python', titulo: 'Escreva a checagem de RBAC', obrigatorio: false,
          enunciado: 'Modele a decisão do recurso: <code>pode(atribuicoes, acao, recurso)</code> é verdadeira se algum papel atribuído traz a ação e o recurso está dentro do escopo da atribuição. Complete também <code>no_escopo</code>, sem cair na armadilha da fronteira: <code>.../openai-conta-b</code> não está no escopo <code>.../openai-conta</code>. O <code>Contributor</code> do modelo só tem ações de controle.',
          codigo: codigoRbac, testes: testesRbac,
          dica: 'Escopo cobre o próprio recurso ou o que vem depois de <code>escopo + "/"</code>. Use <code>any(...)</code> sobre as atribuições e <code>PAPEIS.get(papel, set())</code> para papel desconhecido.',
          solucao: solucaoRbac,
          tutorDepois: 'Repare no controle negativo: o papel certo em outro recurso não vale. Escopo é parte da permissão, não enfeite.',
          callout: 'A checagem de RBAC passou, incluindo a fronteira do escopo e o Contributor sem acesso a dados.' },
        { tipo: 'cenario', id: 'idsec-cenario', titulo: '403 três minutos depois do deploy', obrigatorio: false,
          enunciado: 'O serviço está no ar, <code>/readyz</code> responde 200, e a chamada ao modelo devolve 502 com "RBAC" na mensagem. O deploy novo tem três minutos. Decida.',
          inicio: 'inicio',
          nos: {
            inicio: { texto: 'Quem investiga lê o erro: o token foi aceito, a permissão não. Qual é o primeiro movimento?', opcoes: [
              { texto: 'Dar <code>Contributor</code> no grupo de recursos para a identidade do app.', vai: 'f-largo', tom: 'ruim', consequencia: 'não resolve (plano de controle) e entrega ao app o controle do ambiente.' },
              { texto: 'Ligar a autenticação por chave na conta, só até a demo acabar.', vai: 'f-chave', tom: 'ruim', consequencia: 'a chave temporária é a que fica.' },
              { texto: 'Ler a mensagem e conferir quatro coisas: papel de dados, escopo da atribuição, <code>AZURE_CLIENT_ID</code> e o tempo desde a atribuição.', vai: 'confere', tom: 'ok', consequencia: 'o diagnóstico começa pelo que a mensagem diz que falta.' }
            ] },
            confere: { texto: 'O papel <code>Cognitive Services OpenAI User</code> está atribuído na conta certa e o <code>AZURE_CLIENT_ID</code> está injetado. O 403 persiste. O que você faz?', opcoes: [
              { texto: 'Esperar alguns minutos e repetir a chamada, sem mudar nada: atribuições levam minutos para propagar.', vai: 'f-bom', tom: 'ok', consequencia: 'um 403 logo depois de um deploy novo costuma ser propagação, não erro.' },
              { texto: 'Apagar e recriar a identidade para forçar a atribuição.', vai: 'f-recria', tom: 'ruim', consequencia: 'a identidade recriada perde os papéis e recomeça a espera.' }
            ] }
          },
          finais: {
            'f-bom': { bom: true, texto: 'Depois de alguns minutos a atribuição valeu e a inferência respondeu. Papel de dados no menor escopo, nenhuma permissão alargada, nenhuma chave criada.' },
            'f-largo': { bom: false, texto: 'O 403 continuou, e agora uma injeção de comando no serviço vira controle da infraestrutura inteira.' },
            'f-chave': { bom: false, texto: 'A demo passou, a chave ficou ativa na conta e meses depois apareceu em um log de CI.' },
            'f-recria': { bom: false, texto: 'A identidade nova nasceu sem papéis e o serviço ficou mais tempo fora do ar.' }
          },
          callout: 'Você diagnosticou pela mensagem, esperou a propagação e não alargou nada.' },
        { tipo: 'escolha', id: 'idsec-escolha-ua', titulo: 'Confira: a primeira revisão que não sobe',
          pergunta: 'Com identidade system-assigned, a primeira revisão do app falha ao puxar a imagem do registro. Qual é a explicação e a saída?',
          opcoes: [
            { id: 'a', texto: 'O principal só existe depois do app, então <code>AcrPull</code> não pôde ser atribuído antes; use user-assigned e conceda os papéis antes de criar o app.', correta: true, porque: 'com a identidade criada antes e os papéis atribuídos antes, o app já nasce com tudo.' },
            { id: 'b', texto: 'O registro não aceita identidades; use uma senha de administrador do ACR.', correta: false, porque: 'o ACR aceita identidade com <code>AcrPull</code>, e senha de administrador reintroduz segredo.' },
            { id: 'c', texto: 'Falta <code>Contributor</code> no grupo de recursos para a identidade do app.', correta: false, porque: 'puxar imagem é ação de dados do registro; o papel largo não é a resposta.' },
            { id: 'd', texto: 'É propagação do RBAC: basta aguardar e a revisão sobe sozinha.', correta: false, porque: 'aqui o papel nem pôde ser atribuído, porque o principal não existia.' }
          ], tutorDepois: 'É o mesmo desenho que o Bicep do lab segue: identidade e papéis primeiro, app depois.' },
        { tipo: 'escolha', id: 'idsec-escolha-rot', titulo: 'Confira: a rotação que não pega',
          pergunta: 'O segredo do parceiro foi rotacionado e a referência no app aponta para a URL <em>sem</em> versão. Cinco minutos depois o app ainda usa o valor antigo. O que está acontecendo e o que você planeja?',
          opcoes: [
            { id: 'a', texto: 'O Key Vault não propaga rotação; é preciso reimplantar o Bicep inteiro.', correta: false, porque: 'o cofre tem a versão nova; a questão é quando o contêiner a lê.' },
            { id: 'b', texto: 'O contêiner lê o valor na partida. Sem versão na URL a plataforma troca depois de um intervalo e reinicia as revisões; para controlar o momento, reinicie ou crie uma revisão e planeje esse reinício.', correta: true, porque: 'não existe "reler": rotação exige um processo que aguenta reinício.' },
            { id: 'c', texto: 'O RBAC do cofre impede a leitura da nova versão.', correta: false, porque: 'o mesmo papel lê qualquer versão.' },
            { id: 'd', texto: 'O valor ficou numa saída do Bicep e não foi atualizado.', correta: false, porque: 'segredo em saída seria outro erro: vazaria nos registros de deploy.' }
          ], tutorDepois: 'Versão fixa dá controle fino de quando troca; sem versão dá rotação automática. Escolha conhecendo o custo do reinício.' },
        { tipo: 'takeaway', html: 'Em um 403: <mark>mensagem</mark>, <mark>papel de dados</mark>, <mark>escopo</mark>, <mark>propagação</mark>. Nunca <mark>Contributor</mark> nem chave "só por hoje".' }
      ] }
    ]
  });
})();
