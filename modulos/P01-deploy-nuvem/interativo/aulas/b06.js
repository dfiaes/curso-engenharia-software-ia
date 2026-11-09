/* P01 · Bloco 6: Pipeline com OIDC, revisões, tráfego e rollback. Fonte: P01.html#b06. Saídas do deploycheck são execuções reais do laboratório, com a edição indicada em cada falha. */
(function () {
  var L = function (kind, text) { return { kind: kind, text: text }; };
  function opc(id, texto, correta, porque) { return { id: id, texto: texto, correta: correta, porque: porque }; }

  var CHECK = 'uv run deploycheck --strict --workflow ci/deploy.yml';

  var etapasWorkflow = function () {
    return [
      { id: 'edit', nome: 'Edição do workflow', descricao: 'ci/deploy.yml', tom: 'dns', ms: 1, linhas: [
        L('info', 'ci/deploy.yml, job deploy (environment production, azure/login)'),
        L('hint', 'sem falha: o arquivo como está no lab. Com a falha escolhida, a edição é aplicada antes do check')] },
      { id: 'check', nome: 'deploycheck', descricao: 'Regras XR006, XR007, XR012', tom: 'request', ms: 1, linhas: [
        L('out', '0 erro(s), 0 aviso(s)'),
        L('hint', 'exit=0')] },
      { id: 'merge', nome: 'Merge em main', descricao: 'O que o CI decide', tom: 'response', ms: 1, linhas: [
        L('info', 'check verde: o job de deploy espera a aprovação do ambiente production')] }
    ];
  };

  var codigoSubject = [
    'def subject_de(repo, disparo, valor=None):',
    '    """Subject do JWT do GitHub Actions, por forma de disparo.',
    '    environment -> repo:ORG/REPO:environment:<nome>',
    '    branch      -> repo:ORG/REPO:ref:refs/heads/<branch>',
    '    pull_request-> repo:ORG/REPO:pull_request',
    '    """',
    '    return f"repo:{repo}"', '', '',
    'def federacao_aceita(sub, cadastrados):',
    '    """O Entra ID compara o subject com as credenciais federadas cadastradas."""',
    '    return True', '', '',
    'def decide_canario(err_antiga, n_antiga, err_nova, n_nova):',
    '    """AMOSTRA_PEQUENA se n_nova < 30; ABORTAR se a taxa da nova passa de',
    '    max(0.02, 3 x taxa da antiga); senão PROMOVER. Regra didática do simulador do módulo."""',
    '    return "PROMOVER"', '',
    'print(subject_de("org/app", "environment", "production"))', ''].join('\n');
  var testesSubject = [
    'def test_subject_de_ambiente():',
    '    assert subject_de("org/app", "environment", "production") == "repo:org/app:environment:production"', '', '',
    'def test_subject_de_branch_e_pull_request():',
    '    assert subject_de("org/app", "branch", "main") == "repo:org/app:ref:refs/heads/main"',
    '    assert subject_de("org/app", "pull_request") == "repo:org/app:pull_request"', '', '',
    'def test_disparo_desconhecido_e_erro():',
    '    try:', '        subject_de("org/app", "cron")', '    except ValueError:', '        return',
    '    assert False, "devia levantar ValueError"', '', '',
    'def test_federacao_so_aceita_subject_exato():',
    '    cad = {"repo:org/app:environment:production"}',
    '    assert federacao_aceita("repo:org/app:environment:production", cad)', '',
    '',
    'def test_caixa_e_repositorio_renomeado_nao_casam():',
    '    cad = {"repo:org/app:environment:production"}',
    '    assert not federacao_aceita("repo:org/app:environment:Production", cad)',
    '    assert not federacao_aceita("repo:org/app-novo:environment:production", cad)',
    '    assert not federacao_aceita(subject_de("org/app", "pull_request"), cad)', '', '',
    'def test_canario_saudavel_promove_e_quebrado_aborta():',
    '    assert decide_canario(2, 360, 0, 40) == "PROMOVER"',
    '    assert decide_canario(2, 360, 6, 40) == "ABORTAR"', '', '',
    'def test_amostra_pequena_nao_decide():',
    '    assert decide_canario(2, 390, 5, 10) == "AMOSTRA_PEQUENA"', '', '',
    'def test_borda_do_limiar_de_2_por_cento():',
    '    assert decide_canario(0, 350, 1, 50) == "PROMOVER"',
    '    assert decide_canario(0, 350, 2, 50) == "ABORTAR"', ''].join('\n');
  var solucaoSubject = [
    'def subject_de(repo, disparo, valor=None):',
    '    if disparo == "environment":',
    '        return f"repo:{repo}:environment:{valor}"',
    '    if disparo == "branch":',
    '        return f"repo:{repo}:ref:refs/heads/{valor}"',
    '    if disparo == "pull_request":',
    '        return f"repo:{repo}:pull_request"',
    '    raise ValueError(f"disparo desconhecido: {disparo}")', '', '',
    'def federacao_aceita(sub, cadastrados):',
    '    return sub in cadastrados', '', '',
    'def decide_canario(err_antiga, n_antiga, err_nova, n_nova):',
    '    if n_nova < 30:',
    '        return "AMOSTRA_PEQUENA"',
    '    taxa_antiga = err_antiga / n_antiga if n_antiga else 0.0',
    '    taxa_nova = err_nova / n_nova',
    '    if taxa_nova > max(0.02, 3 * taxa_antiga):',
    '        return "ABORTAR"',
    '    return "PROMOVER"', ''].join('\n');

  var workflowDeploy = [
    '  deploy:',
    '    needs: test',
    '    runs-on: ubuntu-latest',
    '    environment: production',
    '    permissions:',
    '      id-token: write',
    '      contents: read',
    '    env:',
    '      RG: ${{ vars.AZURE_RESOURCE_GROUP }}',
    '      PREFIX: ${{ vars.AZURE_PREFIX }}',
    '      SHA: ${{ github.sha }}',
    '    steps:',
    '      - uses: actions/checkout@v4',
    '',
    '      - name: Login (OIDC, sem segredo)',
    '        uses: azure/login@v2',
    '        with:',
    '          client-id: ${{ vars.AZURE_CLIENT_ID }}',
    '          tenant-id: ${{ vars.AZURE_TENANT_ID }}',
    '          subscription-id: ${{ vars.AZURE_SUBSCRIPTION_ID }}',
    '',
    '      - name: Base de infraestrutura (sem app) e nome do registry',
    '        run: |',
    '          az deployment group create -g "$RG" -f infra/main.bicep \\',
    '            -p prefix="$PREFIX" image=\'\' --query properties.outputs -o json > base.json',
    '          echo "ACR=$(jq -r .acrName.value base.json)" >> "$GITHUB_ENV"',
    '          echo "LOGIN_SERVER=$(jq -r .acrLoginServer.value base.json)" >> "$GITHUB_ENV"',
    '',
    '      - name: Build e push com tag imutável',
    '        run: |',
    '          az acr login --name "$ACR"',
    '          docker build -t "$LOGIN_SERVER/llm-service:$SHA" .',
    '          docker push "$LOGIN_SERVER/llm-service:$SHA"',
    '',
    '      - name: Revisão estável atual (vazia no primeiro deploy)',
    '        run: |',
    '          STABLE=$(az containerapp revision list -g "$RG" -n "$PREFIX-app" \\',
    '            --query "[?properties.trafficWeight==\\`100\\`].name | [0]" -o tsv 2>/dev/null || true)',
    '          echo "STABLE=$STABLE" >> "$GITHUB_ENV"',
    '',
    '      - name: what-if (mostra o diff antes de aplicar)',
    '        run: |',
    '          az deployment group what-if -g "$RG" -f infra/main.bicep \\',
    '            -p prefix="$PREFIX" image="$LOGIN_SERVER/llm-service:$SHA" \\',
    '            revisionSuffix="r${SHA::7}" stableRevision="$STABLE" canaryPercent=10',
    '',
    '      - name: Deploy com 10% de canário',
    '        run: |',
    '          az deployment group create -g "$RG" -f infra/main.bicep \\',
    '            -p prefix="$PREFIX" image="$LOGIN_SERVER/llm-service:$SHA" \\',
    '            revisionSuffix="r${SHA::7}" stableRevision="$STABLE" canaryPercent=10',
    '',
    '      # Sufixo de revisão precisa começar com letra: "r" + SHA curto (que pode começar com dígito).',
    '      - name: Smoke test da revisão nova',
    '        run: |',
    '          FQDN=$(az containerapp revision show -g "$RG" -n "$PREFIX-app" \\',
    '            --revision "$PREFIX-app--r${SHA::7}" --query properties.fqdn -o tsv)',
    '          curl --fail --retry 10 --retry-delay 6 --retry-all-errors "https://$FQDN/readyz"',
    '',
    '      - name: Promove para 100%',
    '        run: |',
    '          az containerapp ingress traffic set -g "$RG" -n "$PREFIX-app" \\',
    '            --revision-weight "$PREFIX-app--r${SHA::7}=100"',
    '',
    '      - name: Rollback automático',
    '        if: failure() && env.STABLE != \'\'',
    '        run: |',
    '          az containerapp ingress traffic set -g "$RG" -n "$PREFIX-app" \\',
    '            --revision-weight "$STABLE=100"'].join('\n');

  TrilhaAula.registrar({
    id: 'p01-b6',
    titulo: 'Pipeline: OIDC, revisões, divisão de tráfego e rollback',
    minutos: 40,
    resumo: 'O pipeline de deploy é a credencial mais poderosa da organização. A resposta moderna troca o segredo do CI por federação (OIDC) e transforma "colocar no ar" numa sequência de passos reversíveis.',
    objetivo: 'Explicar como o CI prova quem é sem segredo, separar a identidade de deploy da de runtime, ler o pipeline como uma máquina de estados de tráfego e dizer o que o rollback devolve e o que não devolve.',
    revisao: [
      { id: 'p01b6-subject', pergunta: 'No deploy com OIDC, o que o Entra ID valida para emitir o access token ao job?',
        opcoes: [
          opc('a', 'Emissor, audiência e <code>sub</code> do JWT contra a credencial federada cadastrada', true, 'a confiança vem de uma prova de origem de vida curta casada pelo subject; subject diferente é recusado.'),
          opc('b', 'Uma senha guardada em secret do repositório', false, 'o ponto da federação é não haver segredo de longa duração no CI.'),
          opc('c', 'Que o IP do runner é conhecido', false, 'IP não é parte do contrato de federação.')] },
      { id: 'p01b6-duas', pergunta: 'Por que o pipeline não deve reutilizar a identidade do app?',
        opcoes: [
          opc('a', 'São princípios opostos: runtime só com papéis de dados por recurso; deploy com plano de controle no grupo de recursos', true, 'a de deploy fica exposta ao código do repositório e a quem edita workflows, e se vazar entrega o controle do ambiente.'),
          opc('b', 'O Azure proíbe uma identidade em dois serviços', false, 'não proíbe; o problema é de poder e exposição, não de limite técnico.'),
          opc('c', 'A identidade do app não tem região', false, 'identidades não têm esse atributo.')] },
      { id: 'p01b6-estado', pergunta: 'Depois de um rollback por tabela de tráfego, o que NÃO foi desfeito?',
        opcoes: [
          opc('a', 'Migração de banco já aplicada e efeitos externos já disparados (mensagens, e-mails, cobranças)', true, 'o rollback devolve o código, não o estado; migre em duas fases compatíveis com a versão anterior (expandir, migrar, contrair).'),
          opc('b', 'A imagem do contêiner servida aos usuários', false, 'o tráfego volta à revisão antiga, com a imagem antiga.'),
          opc('c', 'As variáveis de ambiente da revisão', false, 'a revisão antiga mantém as suas.')] },
      { id: 'p01b6-sha', pergunta: 'Por que fixar actions por SHA de commit em repositórios de produção?',
        opcoes: [
          opc('a', 'Tags como <code>@v4</code> são móveis: em março de 2025 a <code>tj-actions/changed-files</code> foi comprometida e as tags existentes foram redirecionadas', true, 'o <code>deploycheck</code> reprova refs flutuantes (XR007); apontar para SHA é o passo seguinte, deixado como exercício no lab.'),
          opc('b', 'O GitHub cobra por tag', false, 'não há relação com custo.'),
          opc('c', 'SHA acelera o download da action', false, 'a razão é de cadeia de suprimentos, não de velocidade.')] },
      { id: 'p01b6-revisao', pergunta: 'Qual alteração cria uma nova revisão no Container Apps?',
        opcoes: [
          opc('a', 'Mudança em <code>template</code> (imagem, variáveis, escala); mudança em <code>configuration</code> (segredos, ingresso, tráfego, modo) vale para o app inteiro e não cria revisão', true, 'um segredo trocado atinge também a revisão estável, que precisa reiniciar para vê-lo.'),
          opc('b', 'Qualquer alteração em segredos', false, 'segredos são <code>configuration</code>: não criam revisão.'),
          opc('c', 'Uma alteração na tabela de tráfego', false, 'tráfego é <code>configuration</code>; por isso rollback é reescrever a tabela, não reimplantar.')] }
    ],
    abas: [
      { rotulo: 'OIDC e identidades', blocos: [
        { tipo: 'texto', html:
          '<p>O pipeline de deploy é a credencial mais poderosa da sua organização: quem controla o job controla a produção. Historicamente ele guardava um <em>service principal</em> com segredo de longa vida num cofre do CI, com permissões largas e sem data para expirar, e é o alvo preferido de ataques à cadeia de suprimentos. A resposta moderna tem duas partes: trocar o segredo por <strong>federação</strong> (OIDC) e transformar "colocar no ar" numa sequência de passos reversíveis. O gate de release, versionamento e pós-mortem é tema do <a href="../LT04-novo/LT04.html">LT04</a>; aqui está o pipeline que o LT04 vai governar.</p>' +
          '<h3>OIDC: como o GitHub prova quem é sem um segredo</h3>' +
          '<p>Quando um job tem <code>permissions: id-token: write</code>, o GitHub emite para ele, a pedido, um <strong>JWT assinado</strong> (OpenID Connect) que afirma de onde ele vem. O <code>azure/login</code> apresenta esse token ao Microsoft Entra ID, que o valida contra uma <strong>credencial federada</strong> cadastrada previamente na identidade e, se casar, devolve um token de acesso do Azure de vida curta.</p>' +
          '<p>Nada de longa duração existe no GitHub: o que você guarda como variáveis do repositório são <em>identificadores</em> (client-id, tenant-id, subscription-id), públicos por natureza, não segredos.</p>' +
          '<ol><li>O job pede um JWT ao emissor do GitHub (exige <code>id-token: write</code>; sem a permissão, o token nem é emitido).</li>' +
          '<li>O Entra ID confere emissor, audiência e <code>sub</code> contra a credencial federada.</li>' +
          '<li>O Entra ID devolve um access token que expira em minutos e não serve fora do job.</li>' +
          '<li>O job usa o token com papel mínimo no plano de controle do grupo de recursos.</li></ol>' +
          '<p>O que o Entra compara é o conjunto de <em>claims</em> do token com a credencial cadastrada: o emissor (<code>https://token.actions.githubusercontent.com</code>), a audiência (<code>api://AzureADTokenExchange</code>) e, o mais importante, o <strong><code>sub</code></strong> (subject), cujo formato depende de como o job foi disparado.</p>' },
        { tipo: 'texto', largo: true, html:
          '<table><thead><tr><th>Disparo</th><th>Subject</th><th>Uso recomendado</th></tr></thead><tbody>' +
          '<tr><td>Job com <code>environment: production</code></td><td><code>repo:ORG/REPO:environment:production</code></td><td><strong>Produção.</strong> Regras de proteção do ambiente (revisores obrigatórios, branches permitidos) passam a ser parte da autorização.</td></tr>' +
          '<tr><td>Push em branch</td><td><code>repo:ORG/REPO:ref:refs/heads/main</code></td><td>Homologação automática.</td></tr>' +
          '<tr><td>Pull request</td><td><code>repo:ORG/REPO:pull_request</code></td><td>Evite para qualquer identidade com escrita: código de PR não revisado pediria token.</td></tr>' +
          '</tbody></table>' },
        { tipo: 'texto', html:
          '<p>Cadastre uma credencial por subject. O erro "No matching federated identity record" do diagnóstico é uma diferença nessa string: ambiente <code>Production</code> versus <code>production</code>, repositório renomeado, job sem <code>environment</code>. A identidade e a credencial podem ser criadas pelo Bicep (<code>userAssignedIdentities/<wbr>federatedIdentityCredentials</code>) ou pela CLI:</p>' },
        { tipo: 'codigo', linguagem: 'bash', texto: [
          'az identity create -g rg-p01 -n id-deployer',
          'az identity federated-credential create -g rg-p01 --identity-name id-deployer \\',
          '  --name gh-production --issuer https://token.actions.githubusercontent.com \\',
          '  --subject repo:ORG/REPO:environment:production --audiences api://AzureADTokenExchange'].join('\n') },
        { tipo: 'texto', html:
          '<h3>Duas identidades, dois níveis de poder</h3>' +
          '<p>Não reutilize a identidade do app como identidade do pipeline. São princípios opostos.</p>' },
        { tipo: 'texto', largo: true, html:
          '<table><thead><tr><th></th><th>Identidade de runtime (app)</th><th>Identidade de deploy (pipeline)</th></tr></thead><tbody>' +
          '<tr><td>Faz</td><td>Chama modelo, lê segredos, puxa imagem.</td><td>Cria e altera recursos, envia imagens, atribui papéis.</td></tr>' +
          '<tr><td>Papéis</td><td>Só de dados, por recurso.</td><td>Plano de controle no <em>grupo de recursos</em> (por exemplo <code>Contributor</code>), mais permissão de atribuir papéis, idealmente restrita (<em>Role Based Access Control Administrator</em> com condições), já que o Bicep cria atribuições.</td></tr>' +
          '<tr><td>Exposição</td><td>Exposta a tráfego de internet.</td><td>Exposta ao código do repositório e a quem edita workflows.</td></tr>' +
          '<tr><td>Se vazar</td><td>Acesso a modelo e cofre.</td><td>Controle do ambiente.</td></tr>' +
          '</tbody></table>' },
        { tipo: 'texto', html:
          '<p>Escope a identidade de deploy a <strong>um grupo de recursos</strong>, nunca à assinatura, e proteja o ambiente <code>production</code> do GitHub com revisores obrigatórios: sem isso, qualquer commit em <code>main</code> executa o deploy de produção sem um humano ver o <code>what-if</code>.</p>' },
        { tipo: 'takeaway', html: 'O CI troca o <mark>segredo</mark> por uma <mark>prova de origem</mark> casada pelo <mark>subject</mark>; <mark>duas identidades</mark>, e a de deploy no escopo de <mark>um grupo de recursos</mark>.' }
      ] },

      { rotulo: 'O pipeline do laboratório', blocos: [
        { tipo: 'texto', html:
          '<p>Dois jobs: <code>test</code> (sem acesso à nuvem: instala pelo lockfile, roda os testes e o <code>deploycheck --strict</code>) e <code>deploy</code> (depende do primeiro, usa o ambiente protegido e é o único com <code>id-token: write</code>). O topo do arquivo tem <code>permissions: contents: read</code> e <code>concurrency</code> sem cancelamento: dois deploys simultâneos no mesmo ambiente são sempre um erro. Abaixo, o job <code>deploy</code>.</p>' },
        { tipo: 'codigo', linguagem: 'yaml', texto: workflowDeploy },
        { tipo: 'texto', html:
          '<p>Leia a sequência como uma <strong>máquina de estados</strong> com três estados de tráfego: <em>estável 100%</em> → <em>canário 10/90</em> → <em>nova 100%</em>, e a saída de emergência de volta ao primeiro.</p>' +
          '<ol><li><strong>Base.</strong> Idempotente: se tudo já existe, não muda nada; devolve o nome do registro.</li>' +
          '<li><strong>Build com o SHA do commit como tag.</strong> A mesma tag vai para o <code>what-if</code> e o <code>create</code>: o que é revisado é o que é implantado.</li>' +
          '<li><strong>Revisão estável</strong> lida do próprio Azure (a que tem 100%) antes de qualquer mudança, em vez de guardada em arquivo: a nuvem é a fonte da verdade.</li>' +
          '<li><strong><code>what-if</code> e <code>create</code></strong> com <code>canaryPercent=10</code>: a nova revisão nasce com 10% e a estável mantém 90%. O sufixo <code>r&lt;sha7&gt;</code> começa com letra porque a plataforma exige que o sufixo comece com letra, e um SHA curto pode começar com dígito.</li>' +
          '<li><strong>Smoke test na revisão nova</strong>, pelo FQDN <em>da revisão</em> (não pelo FQDN do app, que mistura 90% de tráfego da antiga): <code>/readyz</code> com retentativas.</li>' +
          '<li><strong>Promoção</strong>: 100% para a nova. As anteriores seguem ativas e sem tráfego (rollback imediato possível).</li>' +
          '<li><strong>Rollback automático</strong> se qualquer passo anterior falhar e existir uma estável: o tráfego volta a ela em segundos, sem rebuild.</li></ol>' },
        { tipo: 'ordene', id: 'pipe-ordene', titulo: 'Ponha o deploy na ordem', obrigatorio: true,
          enunciado: 'Os passos do job <code>deploy</code> estão fora de ordem. Ordene do primeiro ao último, na sequência em que o lab os executa.',
          itens: [
            { id: 'promove', texto: 'Promover a revisão nova para 100%' },
            { id: 'whatif', texto: '<code>what-if</code> com a mesma imagem e <code>canaryPercent=10</code>' },
            { id: 'smoke', texto: 'Smoke test em <code>/readyz</code> pelo FQDN da revisão nova' },
            { id: 'login', texto: 'Login OIDC com <code>azure/login</code>' },
            { id: 'build', texto: 'Build e push da imagem com tag igual ao SHA' },
            { id: 'estavel', texto: 'Ler do Azure qual revisão tem 100% (a estável)' },
            { id: 'create', texto: 'Deploy com 10% de canário' },
            { id: 'base', texto: 'Base de infraestrutura sem app, devolvendo o nome do registro' }
          ],
          solucao: ['login', 'base', 'build', 'estavel', 'whatif', 'create', 'smoke', 'promove'],
          dica: 'O login vem antes de qualquer comando <code>az</code>; a estável é lida antes de qualquer mudança de tráfego; o <code>what-if</code> precede o <code>create</code>.',
          tutorDepois: 'O rollback automático não entra na fila: ele roda só em <code>failure()</code>, depois de qualquer passo que falhe.',
          callout: 'Você montou a máquina de estados: estável 100%, canário 10/90, nova 100%.' },
        { tipo: 'callout', tom: 'danger', titulo: 'Armadilha que pega sênior: o smoke test que não testa o que quebra', html:
          '<p><code>/readyz</code> valida configuração e adapter, sem chamar o modelo (de propósito, pela regra do bloco 2). Logo, um deploy com o papel de dados ausente passa no smoke, recebe 10% do tráfego e devolve 502 para um décimo dos usuários. O canário só protege se algo <em>decide</em> com base nos sinais: neste lab o passo de promoção é incondicional após o smoke.</p>' +
          '<p>O próximo degrau, que o LT04 desenvolve, é uma chamada sintética real ao modelo (com prompt barato e <code>max_tokens</code> baixo) e uma consulta ao Application Insights que compare erro e TTFT da revisão nova com a estável antes de promover.</p>' },
        { tipo: 'takeaway', html: 'O que é <mark>revisado</mark> (<mark>tag por SHA</mark>, <mark>what-if</mark>) é o que é <mark>implantado</mark>; o canário só protege se algo <mark>decide</mark> pelos sinais.' }
      ] },

      { rotulo: 'Revisões, rollback e segurança', blocos: [
        { tipo: 'texto', html:
          '<h3>Revisões, tráfego e rollback no Container Apps</h3>' +
          '<p>Revisão é imutável; o que muda é a <strong>tabela de tráfego</strong>. Rollback, portanto, é reescrever a tabela, não reimplantar. Os comandos do dia de incidente:</p>' },
        { tipo: 'codigo', linguagem: 'bash', texto: [
          'az containerapp revision list -g rg-p01 -n p01lab-app -o table          # quais revisões, ativas, % de tráfego',
          'az containerapp ingress traffic set -g rg-p01 -n p01lab-app \\',
          '  --revision-weight p01lab-app--r1a2b3c4=100                             # volta tudo para a estável',
          'az containerapp revision deactivate -g rg-p01 -n p01lab-app \\',
          '  --revision p01lab-app--r9f8e7d6                                        # desativa a ruim (libera réplicas e custo)'].join('\n') },
        { tipo: 'texto', html:
          '<p>Duas propriedades importam.</p>' +
          '<ul><li><strong>Modo de revisão.</strong> Em <strong>modo único</strong> (padrão), a plataforma só passa o tráfego para a nova depois que ela fica saudável e desprovisiona a anterior: segurança básica, mas impede canário e deixa o rollback para um novo deploy. Em <strong>modo múltiplo</strong>, você controla tudo, e também a limpeza: revisões antigas ativas continuam consumindo réplica mínima.</li>' +
          '<li><strong>Escopo da mudança.</strong> Alterações em <code>template</code> (imagem, variáveis, escala) criam revisão; alterações em <code>configuration</code> (segredos, ingresso, tráfego, modo de revisão) valem para o app inteiro e não criam revisão. Um segredo trocado atinge a revisão "estável" também, e ela precisa reiniciar para vê-lo.</li></ul>' +
          '<h3>Segurança do próprio pipeline</h3>' +
          '<ul><li><strong>Fixe actions por SHA de commit</strong> em repositórios de produção. Tags como <code>@v4</code> são móveis: em março de 2025, a action <code>tj-actions/changed-files</code> foi comprometida e as tags existentes foram redirecionadas para código que despejava segredos nos logs. O <code>deploycheck</code> reprova refs flutuantes (<code>@main</code>, <code>@master</code>, sem ref: XR007); apontar para SHA é o passo seguinte, que o lab deixa como exercício por legibilidade.</li>' +
          '<li><strong><code>permissions</code> mínimas</strong> no topo (<code>contents: read</code>) e elevação por job. <code>write-all</code> é reprovado (XR012).</li>' +
          '<li><strong>Nada de segredo em <code>env</code> literal</strong> e nada de <code>creds:</code> com JSON de service principal no <code>azure/login</code> (XR006): o ponto da federação é que não há o que vazar.</li>' +
          '<li><strong>Cuidado com <code>pull_request_target</code> e com workflows que executam código de forks</strong> com acesso a credenciais; a identidade de deploy só deve ser alcançável de um ambiente protegido.</li></ul>' },
        { tipo: 'quebre', id: 'pipe-quebre', titulo: 'Quebre o workflow de deploy', obrigatorio: true,
          enunciado: 'Escolha uma edição que enfraquece o pipeline e rode o check. Depois rode "Sem falha". As saídas são execuções reais do laboratório sobre cópias editadas do <code>ci/deploy.yml</code>.',
          prefixo: '$', entrada: CHECK, unidade: 's', terminalTitulo: 'lab/ · ci/deploy.yml', etapas: etapasWorkflow(),
          prever: { pergunta: 'Alguém apaga a linha <code>id-token: write</code> do job de deploy "porque o login funcionava sem ela". O que o <code>deploycheck --strict</code> diz?', opcoes: [
            { id: 'a', texto: 'Nada: sem a permissão o login só fica mais seguro.', correta: false, porque: 'sem a permissão o JWT nem é emitido, e o <code>azure/login</code> falha em tempo de execução.' },
            { id: 'b', texto: 'Erro XR006: o job usa <code>azure/login</code> sem <code>permissions: id-token: write</code>.', correta: true, porque: 'é o erro "Unable to get ACTIONS_ID_TOKEN_REQUEST_URL" do diagnóstico, pego antes do merge.' },
            { id: 'c', texto: 'Aviso apenas, sem barrar o merge.', correta: false, porque: 'com <code>--strict</code> o exit é diferente de zero.' }
          ] },
          falhas: [
            { id: 'sem-id-token', rotulo: 'Remover id-token: write', efeito: { etapaFalha: 'check', linhasErro: [
              { kind: 'info', text: 'edição: apagar "id-token: write" do job deploy' },
              { kind: 'out', text: "ci/deploy.yml:43: error XR006 job 'deploy' usa azure/login sem 'permissions: id-token: write'" },
              { kind: 'out', text: '1 erro(s), 0 aviso(s)' },
              { kind: 'hint', text: 'exit=1' }
            ], tutor: 'sem a permissão o GitHub não emite o JWT. A causa está na linha 43; o conserto é declarar a permissão só no job de deploy.' } },
            { id: 'ref-flutuante', rotulo: 'azure/login@main', efeito: { etapaFalha: 'check', linhasErro: [
              { kind: 'info', text: 'edição: azure/login@v2 -> azure/login@main' },
              { kind: 'out', text: "ci/deploy.yml:44: error XR007 'azure/login@main' em ref flutuante; fixe versão (vN) ou, melhor, SHA do commit" },
              { kind: 'out', text: '1 erro(s), 0 aviso(s)' },
              { kind: 'hint', text: 'exit=1' }
            ], tutor: 'um ref que anda sozinho é o que o ataque de março de 2025 explorou. Aqui o check pede vN ou SHA; em produção, SHA.' } },
            { id: 'write-all', rotulo: 'permissions: write-all', efeito: { etapaFalha: 'check', linhasErro: [
              { kind: 'info', text: 'edição: "permissions: contents: read" no topo -> "permissions: write-all"' },
              { kind: 'out', text: 'ci/deploy.yml:10: error XR012 permissions amplas no topo; declare o mínimo (contents: read) e eleve por job' },
              { kind: 'out', text: '1 erro(s), 0 aviso(s)' },
              { kind: 'hint', text: 'exit=1' }
            ], tutor: 'o mínimo fica no topo e a elevação, por job; o único job que precisa de id-token: write é o de deploy.' } }
          ],
          tutorAntes: 'Faça a previsão, aperte Enter com a falha selecionada e leia a mensagem. Depois escolha "Sem falha" e rode de novo.',
          tutorDepois: 'Os três erros são de configuração do pipeline, pegos antes do merge. O check é um linter de texto: não substitui revisão humana nem o <code>what-if</code>.',
          callout: 'Você viu três enfraquecimentos do pipeline barrados e o workflow íntegro passar.' },
        { tipo: 'callout', tom: 'info', titulo: 'Alternativas e trade-offs', html:
          '<p><strong>Canário percentual versus blue-green.</strong> O percentual expõe pouca gente cedo, mas mistura versões no mesmo usuário (sessões, caches, formatos de resposta diferentes) e exige compatibilidade entre as duas. Blue-green troca tudo de uma vez com rollback igualmente rápido e testa a nova com tráfego sintético antes; custa o dobro de réplicas durante a troca.</p>' +
          '<p><strong>Pipeline imperativo versus GitOps.</strong> O workflow acima <em>empurra</em> mudanças para o Azure; em GitOps um agente dentro do ambiente <em>puxa</em> o estado desejado do repositório e o reconcilia (LT03, bloco 5), o que remove a necessidade de credenciais de escrita fora do ambiente. No Container Apps o modelo comum é o empurrado.</p>' },
        { tipo: 'callout', tom: 'danger', titulo: 'Armadilha que pega sênior: rollback de código não é rollback de estado', html:
          '<p>Voltar o tráfego restaura o comportamento do serviço; não desfaz uma migração de banco já aplicada, mensagens já consumidas, e-mails enviados, nem uma mudança de implantação de modelo ou de prompt versionado fora da imagem. Faça migrações em duas fases compatíveis com a versão anterior (expandir, migrar, contrair), de modo que "voltar uma revisão" seja sempre seguro por construção.</p>' +
          '<p>Um caso do próprio lab: se o runner morrer entre o canário e a promoção, nenhuma revisão tem 100% e o próximo deploy vê a estável vazia, comportamento que o pipeline não trata. Em produção, trate esse estado com um passo explícito de reconciliação antes do deploy.</p>' },
        { tipo: 'takeaway', html: '<mark>Rollback é reescrever a tabela de tráfego</mark>, não reimplantar; devolve o <mark>código</mark>, não o <mark>estado</mark>.' }
      ] },

      { rotulo: 'Praticar e conferir', blocos: [
        { tipo: 'python', id: 'pipe-python', titulo: 'Escreva a confiança do deploy e a decisão do canário', obrigatorio: false,
          enunciado: 'Três funções puras. <code>subject_de(repo, disparo, valor)</code> monta o subject do JWT para <code>environment</code>, <code>branch</code> e <code>pull_request</code> (e levanta <code>ValueError</code> para outro disparo). <code>federacao_aceita(sub, cadastrados)</code> só aceita o subject cadastrado, sem tolerância de caixa. <code>decide_canario(...)</code> devolve <code>AMOSTRA_PEQUENA</code>, <code>ABORTAR</code> ou <code>PROMOVER</code>. Os limiares (30 requisições, 2% e 3 vezes a taxa da antiga) são a regra didática do simulador do módulo, não um padrão da plataforma.',
          codigo: codigoSubject, testes: testesSubject,
          dica: 'Subject é uma string exata: <code>sub in cadastrados</code>. No canário, trate amostra pequena primeiro; depois compare <code>taxa_nova &gt; max(0.02, 3 * taxa_antiga)</code> (estritamente maior).',
          solucao: solucaoSubject,
          tutorDepois: 'Repare que <code>federacao_aceita</code> não "normaliza" a caixa: <code>Production</code> e <code>production</code> são subjects diferentes, e esse é o erro clássico do "No matching federated identity record".',
          callout: 'O modelo de confiança do deploy e a decisão do canário passaram nos testes, incluindo a borda de 2%.' },
        { tipo: 'cenario', id: 'pipe-cenario', titulo: 'O smoke passou e 10% dos usuários recebem 502', obrigatorio: false,
          enunciado: 'O deploy terminou, o <code>/readyz</code> da revisão nova respondeu 200, e o canário de 10% devolve 502 para um décimo dos usuários. A causa é o papel de dados ausente na identidade do app. Decida.',
          inicio: 'inicio',
          nos: {
            inicio: { texto: 'Os 502 estão acontecendo agora. Qual é a primeira ação?', opcoes: [
              { texto: 'Devolver 100% do tráfego à revisão estável pela tabela de tráfego, sem rebuild.', vai: 'depois', tom: 'ok', consequencia: 'o dano para em segundos e a revisão nova segue viva, sem usuários, para investigar.' },
              { texto: 'Rebuildar a imagem anterior e reimplantar.', vai: 'f-lento', tom: 'ruim', consequencia: 'rollback não é reimplantar: são minutos de 502 que a tabela de tráfego evitaria.' },
              { texto: 'Deixar como está: é só 10% e a propagação do RBAC resolve.', vai: 'f-ignora', tom: 'ruim', consequencia: 'o papel não foi atribuído; esperar não resolve e um décimo dos usuários segue com erro.' }
            ] },
            depois: { texto: 'Estável de volta com 100%. Por que o smoke passou, e o que muda no pipeline?', opcoes: [
              { texto: '<code>/readyz</code> não chama o modelo, de propósito. Acrescentar uma chamada sintética real (prompt barato, <code>max_tokens</code> baixo) e uma consulta ao Application Insights que compare erro e TTFT da nova com a estável antes de promover.', vai: 'f-bom', tom: 'ok', consequencia: 'o canário passa a decidir por sinais, não por um 200 que não exercita o que quebra.' },
              { texto: 'Remover o smoke test: ele não pegou o problema.', vai: 'f-sem-smoke', tom: 'ruim', consequencia: 'o smoke pega config e adapter quebrados; remover é perder uma camada.' }
            ] }
          },
          finais: {
            'f-bom': { bom: true, texto: 'Rollback em segundos, causa corrigida no papel de dados e a promoção agora depende de sinais reais da revisão nova.' },
            'f-lento': { bom: false, texto: 'O build e o deploy levaram minutos e os 502 continuaram o tempo todo.' },
            'f-ignora': { bom: false, texto: 'Os erros persistiram até alguém atribuir o papel, e a promoção incondicional teria levado tudo a 100%.' },
            'f-sem-smoke': { bom: false, texto: 'Sem o smoke, a próxima imagem com configuração quebrada recebe tráfego sem nenhuma checagem.' }
          },
          callout: 'Você reverteu por tráfego e fechou a lacuna entre readiness e sinal real.' },
        { tipo: 'escolha', id: 'pipe-escolha-sub', titulo: 'Confira: o subject de produção',
          pergunta: 'O <code>azure/login</code> falha com "No matching federated identity record". A credencial cadastrada tem o subject <code>repo:org/app:environment:Production</code> e o job roda com <code>environment: production</code>. Qual é a causa e o conserto?',
          opcoes: [
            { id: 'a', texto: 'O <code>sub</code> do token não casa com a credencial (aqui, <code>Production</code> versus <code>production</code>); leia o <code>sub</code> no erro e ajuste a credencial federada para ele.', correta: true, porque: 'o Entra compara a string exata do subject; caixa, repositório renomeado ou job sem <code>environment</code> quebram o casamento.' },
            { id: 'b', texto: 'Falta <code>id-token: write</code>; o erro é o mesmo.', correta: false, porque: 'sem a permissão o erro é outro: "Unable to get ACTIONS_ID_TOKEN_REQUEST_URL".' },
            { id: 'c', texto: 'Crie um segredo de service principal no repositório para contornar.', correta: false, porque: 'reintroduz o segredo de longa vida que a federação elimina.' },
            { id: 'd', texto: 'Dê <code>Contributor</code> na assinatura à identidade de deploy.', correta: false, porque: 'o problema é de autenticação (casamento do subject), não de autorização.' }
          ], tutorDepois: 'O próprio erro mostra o <code>sub</code> que chegou: copie-o para a credencial.' },
        { tipo: 'escolha', id: 'pipe-escolha-estado', titulo: 'Confira: o que o rollback não devolve',
          pergunta: 'Uma revisão nova aplicou uma migração que remove uma coluna e, depois, o tráfego voltou à revisão antiga. A revisão antiga quebra ao ler a tabela. O que faltou?',
          opcoes: [
            { id: 'a', texto: 'Nada: o rollback por tráfego desfaz também o banco.', correta: false, porque: 'rollback devolve o código, não o estado.' },
            { id: 'b', texto: 'Migração em duas fases compatíveis com a versão anterior (expandir, migrar, contrair), para que voltar uma revisão seja seguro por construção.', correta: true, porque: 'remover a coluna só na fase de contração, depois de nenhuma revisão ativa depender dela.' },
            { id: 'c', texto: 'Desativar a revisão antiga para forçar o app novo a funcionar.', correta: false, porque: 'perde-se a saída de emergência sem consertar o banco.' },
            { id: 'd', texto: 'Aumentar <code>maxReplicas</code> da revisão antiga.', correta: false, porque: 'réplicas não alteram o esquema do banco.' }
          ], tutorDepois: 'O mesmo vale para mensagens já consumidas, e-mails enviados e prompts versionados fora da imagem.' },
        { tipo: 'takeaway', html: '<mark>Subject exato</mark>, <mark>duas identidades</mark>, <mark>canário que decide por sinais</mark> e migração <mark>compatível</mark> com a versão anterior.' }
      ] }
    ]
  });
})();
