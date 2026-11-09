/* P01 · Bloco 3: Bicep. Fonte: P01.html#b03. Verificado nas fontes oficiais em 11/10/2026; bicep build com a CLI 0.48.1 gerou 14 recursos sem aviso. O what-if e qualquer implantação não foram verificados por execução (sem assinatura Azure): as saídas do simulador vêm da lógica do template. */
(function () {
  var L = function (kind, text) { return { kind: kind, text: text }; };
  function opc(id, texto, correta, porque) { return { id: id, texto: texto, correta: correta, porque: porque }; }

  var BICEP_TRAFFIC = [
    "var traffic = empty(stableRevision)",
    "  ? [",
    "      { latestRevision: true, weight: 100 }",
    "    ]",
    "  : [",
    "      { revisionName: stableRevision, weight: 100 - canaryPercent }",
    "      { latestRevision: true, weight: canaryPercent }",
    "    ]"
  ].join('\n');

  var BICEP_APP_1 = [
    "resource app 'Microsoft.App/containerApps@2024-03-01' = if (!empty(image)) {",
    "  name: '${prefix}-app'",
    "  location: location",
    "  tags: tags",
    "  identity: {",
    "    type: 'UserAssigned'",
    "    userAssignedIdentities: { '${identity.id}': {} }",
    "  }",
    "  properties: {",
    "    environmentId: env.id",
    "    workloadProfileName: 'Consumption'",
    "    configuration: {",
    "      activeRevisionsMode: 'Multiple'",
    "      ingress: {",
    "        external: true",
    "        targetPort: 8000",
    "        transport: 'auto'",
    "        traffic: traffic",
    "      }",
    "      registries: [",
    "        { server: acr.properties.loginServer, identity: identity.id }",
    "      ]",
    "      secrets: appSecrets",
    "    }",
    "    template: {",
    "      revisionSuffix: revisionSuffix",
    "      containers: ["
  ].join('\n');

  var BICEP_APP_2 = [
    "        {",
    "          name: 'llm-service'",
    "          image: image",
    "          resources: { cpu: json('0.5'), memory: '1Gi' }",
    "          env: concat(baseEnv, secretEnv)",
    "          probes: [",
    "            {",
    "              type: 'Startup'",
    "              httpGet: { path: '/healthz', port: 8000 }",
    "              periodSeconds: 3",
    "              failureThreshold: 20",
    "            }",
    "            {",
    "              type: 'Liveness'",
    "              httpGet: { path: '/healthz', port: 8000 }",
    "              periodSeconds: 10",
    "              failureThreshold: 3",
    "            }",
    "            {",
    "              type: 'Readiness'",
    "              httpGet: { path: '/readyz', port: 8000 }",
    "              periodSeconds: 5",
    "              failureThreshold: 3",
    "            }",
    "          ]",
    "        }",
    "      ]"
  ].join('\n');

  var BICEP_APP_3 = [
    "      scale: {",
    "        minReplicas: minReplicas",
    "        maxReplicas: maxReplicas",
    "        rules: [",
    "          {",
    "            name: 'http-concurrency'",
    "            http: { metadata: { concurrentRequests: '10' } }",
    "          }",
    "        ]",
    "      }",
    "    }",
    "  }",
    "  dependsOn: [",
    "    pullImages",
    "    readSecrets",
    "    callModel",
    "  ]",
    "}"
  ].join('\n');

  var etapasTrafego = function () {
    return [
      { id: 'base', nome: 'Base', descricao: 'image vazio: app não existe', tom: 'dns', ms: 4, linhas: [
        L('info', 'o recurso do app é condicional: if (!empty(image))'),
        L('out', "deploy 1, image='' -> cria registro, identidade, cofre, modelo, ambiente e logs; o app não é criado"),
        L('hint', 'saídas: acrName, acrLoginServer, identityClientId')] },
      { id: 'primeiro', nome: 'Primeira revisão', descricao: 'stableRevision vazio', tom: 'tcp', ms: 6, linhas: [
        L('out', 'deploy 3, image=<acr>/llm-service:<sha>, revisionSuffix=abc1234, stableRevision=\'\''),
        L('out', 'revisão criada: p01lab-app--abc1234'),
        L('out', 'traffic = [{"latestRevision": true, "weight": 100}]'),
        L('hint', 'papéis já existem desde o deploy 1: o pull da imagem funciona na primeira revisão')] },
      { id: 'canario', nome: 'Canário', descricao: 'estável 90, nova 10', tom: 'tls', ms: 8, linhas: [
        L('out', 'deploy 4, revisionSuffix=def5678, stableRevision=p01lab-app--abc1234, canaryPercent=10'),
        L('out', 'traffic = [{"revisionName": "p01lab-app--abc1234", "weight": 90}, {"latestRevision": true, "weight": 10}]'),
        L('hint', 'activeRevisionsMode Multiple: a anterior continua ativa, o que viabiliza canário e rollback')] },
      { id: 'infra', nome: 'Só infraestrutura', descricao: 'stableRevision vazio', tom: 'request', ms: 9, linhas: [
        L('out', "deploy 5, 'só de infraestrutura', stableRevision='' (canário de 10% em andamento)"),
        L('out', 'traffic = [{"latestRevision": true, "weight": 100}]'),
        L('hint', 'o código declara o tráfego, então o código sobrescreve: o canário virou 100% na revisão nova')] },
      { id: 'regra', nome: 'Regra', descricao: 'O dono do que é declarado', tom: 'ink', ms: 3, linhas: [
        L('in', 'o pipeline lê a revisão estável antes de cada deploy; deploy manual fora do pipeline precisa fazer o mesmo')] }
    ];
  };

  TrilhaAula.registrar({
    id: 'p01-b3',
    titulo: 'Infraestrutura como código com Bicep: ambiente, app, logs, Key Vault, identidade e what-if',
    minutos: 40,
    resumo: 'Infraestrutura criada no portal não tem histórico nem repetição. Bicep descreve o estado desejado em um arquivo em Git, compila para ARM e usa o próprio Azure como estado; o what-if é um diff, não uma garantia.',
    objetivo: 'Ler o main.bicep do lab, explicar idempotência, dependências e modo incremental, tornar o app condicional à imagem, ler um what-if como diff e saber quando reaplicar o template mexe no tráfego.',
    revisao: [
      { id: 'p01b3-whatif', pergunta: 'O what-if mostra só as mudanças esperadas. Isso garante que o create terá sucesso?',
        opcoes: [
          opc('a', 'Não: é um diff previsto; cota, política de região, nome já usado e permissões ainda podem falhar na hora', true, 'o what-if não prevê o que só o provedor do recurso decide na execução; use-o para revisar riscos, não como garantia.'),
          opc('b', 'Sim: o what-if executa o deploy em modo de teste', false, 'o what-if só pede ao ARM a lista de mudanças, sem executar.'),
          opc('c', 'Sim, desde que o template compile', false, 'compilar não prova cota, RBAC nem políticas.')] },
      { id: 'p01b3-condicional', pergunta: 'O app referencia uma imagem que ainda não existe, porque o ACR nasce no mesmo template. Qual a solução do lab?',
        opcoes: [
          opc('a', 'Tornar o app condicional a um parâmetro de imagem (if (!empty(image))): base, imagem e depois o app, pelo mesmo template', true, 'resolve o ovo e a galinha do registro sem sair do template e sem :latest.'),
          opc('b', 'Usar :latest para que qualquer imagem sirva', false, ':latest é tag mutável e não resolve a dependência.'),
          opc('c', 'Criar o ACR à mão fora do template', false, 'quebra a reprodutibilidade.')] },
      { id: 'p01b3-incremental', pergunta: 'Você remove um recurso do arquivo Bicep e reaplica em modo incremental. O que acontece com o recurso?',
        opcoes: [
          opc('a', 'Ele é mantido no grupo de recursos', true, 'no modo incremental, o que existe no grupo e não está no template é mantido; apagar exige modo completo (perigoso) ou deployment stacks.'),
          opc('b', 'Ele é apagado', false, 'só o modo completo e as deployment stacks removem o que sai do código.'),
          opc('c', 'O deploy falha por divergência', false, 'não há erro: o recurso é apenas ignorado.')] },
      { id: 'p01b3-trafego', pergunta: 'Uma implantação "só de infraestrutura" passa <code>stableRevision</code> vazio durante um canário. Qual o efeito?',
        opcoes: [
          opc('a', '100% do tráfego volta para a última revisão, desfazendo o canário ou um rollback manual', true, 'traffic e revisionSuffix fazem parte do que o Bicep declara: o que o código declara, o código dono sobrescreve.'),
          opc('b', 'Nada: o tráfego não faz parte do template', false, 'ingress.traffic é declarado no template.'),
          opc('c', 'O canário continua em 10%', false, 'com stableRevision vazio o template calcula 100% na última revisão.')] },
      { id: 'p01b3-segredo', pergunta: 'Onde nunca colocar uma chave ou string de conexão num template Bicep?',
        opcoes: [
          opc('a', 'Em output, ou em parâmetro sem @secure(): o histórico de implantações é legível por quem tem leitura no grupo', true, 'devolva o nome do cofre e leia o valor em tempo de execução; o lab nem tem parâmetro secreto.'),
          opc('b', 'Apenas em comentários', false, 'comentários não são o risco principal; o histórico de implantações é.'),
          opc('c', 'Em lugar nenhum além do nome da conta de storage', false, 'a regra vale para qualquer segredo, em saída ou em parâmetro sem @secure().')] }
    ],
    abas: [
      { rotulo: 'Bicep e o mapa do lab', blocos: [
        { tipo: 'texto', html: [
          '<h3>Por que infraestrutura como código</h3>',
          '<p>Infraestrutura criada no portal não tem histórico, revisão nem repetição. Quando o ambiente de produção diverge do de homologação, ninguém sabe qual clique causou a diferença. <strong>IaC</strong> troca cliques por um arquivo em Git: a mudança vira pull request, o estado desejado é legível, e o ambiente pode ser recriado do zero, que é a única prova de que você sabe recriá-lo. O LT03 trata IaC, estado, drift e ciclo de vida em geral; aqui vai o essencial aplicado ao Azure, com um arquivo real que o laboratório compila.</p>',
          '<h3>Bicep: o que é e o que não é</h3>',
          '<p><strong>Bicep</strong> é uma linguagem declarativa que <strong>compila para templates ARM</strong> (JSON), o formato que o Azure Resource Manager (ARM) executa. Não há servidor nem arquivo de estado do Bicep: o estado é o próprio Azure. Você descreve o que deve existir; o ARM compara com o que existe e cria, atualiza ou, em modo completo, remove. Três propriedades guiam tudo.</p>'
        ].join('') },
        { tipo: 'abas', rotulo: 'Três propriedades', itens: [
          { rotulo: 'Idempotência', blocos: [{ tipo: 'texto', html: '<p>Aplicar o mesmo arquivo duas vezes resulta no mesmo ambiente. Isso permite rodar o deploy a cada commit sem medo.</p>' }] },
          { rotulo: 'Dependências', blocos: [{ tipo: 'texto', html: '<p>O grafo de dependências é <strong>implícito</strong>. Quando um recurso referencia outro por nome simbólico (<code>identity.properties.principalId</code>), o Bicep deduz a ordem. <code>dependsOn</code> explícito só entra quando a dependência não aparece em nenhuma expressão: o lab usa para garantir que as atribuições de papel existam antes do app.</p>' }] },
          { rotulo: 'Modo incremental', blocos: [{ tipo: 'texto', html: '<p>O <strong>modo incremental</strong> é o padrão. Em implantação de grupo de recursos, recursos que existem no grupo mas não estão no template são <em>mantidos</em>: remover um recurso do arquivo não o apaga. Para apagar o que sai do código existem o modo completo (perigoso) e as <em>deployment stacks</em>, que rastreiam o que o template criou.</p>' }] }
        ] },
        { tipo: 'callout', tom: 'neutral', titulo: 'Terraform em uma caixa', html: '<p>Terraform (provedor <code>azurerm</code>, ou <code>azapi</code> para recursos novos) resolve o mesmo problema com outro modelo: guarda o <strong>estado</strong> num arquivo (no Azure, tipicamente num container de Storage com bloqueio), compara <em>código x estado x realidade</em> no <code>plan</code> e aplica no <code>apply</code>. <strong>Vantagens:</strong> mesma linguagem para vários provedores (a tabela de equivalentes do bloco 1 vira módulos do mesmo repositório), ecossistema de módulos e <code>plan</code> maduro. <strong>Custos:</strong> o estado é um ativo sensível que precisa de backend, bloqueio e controle de acesso, e recursos Azure muito novos podem demorar a aparecer no provedor. Bicep ganha em simplicidade e em cobertura imediata de qualquer recurso Azure; Terraform ganha em multi-nuvem e em equipes que já o dominam. Para quem vem de .NET e Azure, Bicep é o caminho mais curto, e os conceitos de plano, estado e drift do LT03 se transferem.</p>' },
        { tipo: 'texto', largo: true, html: [
          '<h3>O mapa do que o lab cria</h3>',
          '<p>O container app usa a identidade, que recebe papéis nos recursos. Nenhuma chave circula: o app apresenta a identidade e cada recurso decide pelo papel (RBAC).</p>',
          '<table><thead><tr><th>Recurso</th><th>Papel da identidade nele</th><th>Observação</th></tr></thead><tbody>',
          '<tr><td><strong>Container App</strong></td><td>usa a identidade user-assigned</td><td>revisões, probes e escala</td></tr>',
          '<tr><td><strong>Managed Environment</strong></td><td>-</td><td>logs para o Log Analytics</td></tr>',
          '<tr><td><strong>Identidade (user-assigned)</strong></td><td>-</td><td>sem segredo</td></tr>',
          '<tr><td><strong>ACR</strong></td><td><code>AcrPull</code></td><td>pull da imagem pela identidade</td></tr>',
          '<tr><td><strong>Key Vault</strong></td><td><code>Key Vault Secrets User</code></td><td>leitura de segredos</td></tr>',
          '<tr><td><strong>Azure OpenAI</strong></td><td><code>Cognitive Services OpenAI User</code></td><td>chamada ao modelo sem chave</td></tr>',
          '<tr><td><strong>Log Analytics</strong></td><td>-</td><td>retenção de 30 dias</td></tr>',
          '<tr><td><strong>Application Insights</strong></td><td>-</td><td>workspace-based</td></tr>',
          '<tr><td><strong>Budget</strong></td><td>-</td><td>alerta de custo</td></tr>',
          '</tbody></table>'
        ].join('') },
        { tipo: 'takeaway', html: 'Bicep descreve o <mark>estado desejado</mark>, compila para ARM e usa o <mark>Azure como estado</mark>; a ordem sai das <mark>referências entre recursos</mark>.' }
      ] },

      { rotulo: 'O arquivo e o what-if', blocos: [
        { tipo: 'texto', html: [
          '<h3>Parâmetros e nomes</h3>',
          '<p><strong>Parâmetros com decoradores.</strong> <code>@minLength</code>, <code>@maxLength</code>, <code>@minValue</code> e <code>@description</code> transformam erro de implantação (nome inválido que só estoura depois de dois minutos) em erro de validação imediato. No lab, <code>canaryPercent</code> aceita de 1 a 100, <code>minReplicas</code> aceita a partir de 0 e <code>maxReplicas</code> a partir de 1 (os padrões do arquivo são 1 e 5, diferentes dos 0 e 10 da plataforma). Nomes únicos vêm de <code>uniqueString(resourceGroup().id)</code>: determinístico para o mesmo grupo, diferente entre grupos, o que evita colisão em recursos de nome global (ACR, Key Vault, subdomínio do OpenAI).</p>',
          '<h3>O ambiente e os logs</h3>',
          '<p>O ambiente envia logs do console e do sistema para o Log Analytics por <em>configuração de diagnóstico</em> (destino <code>azure-monitor</code>), em vez de receber a chave compartilhada do workspace no template. Isso evita o <code>listKeys()</code>, que colocaria uma credencial no corpo da implantação (e o <code>deploycheck</code> reprova, regra <code>XR009</code>). <code>logAnalyticsDestinationType: \'Dedicated\'</code> grava em tabelas específicas do recurso, mais baratas de consultar que o esquema genérico.</p>',
          '<h3>O app: as decisões que o laboratório inteiro verifica</h3>',
          '<p>Primeiro o tráfego, calculado a partir de dois parâmetros.</p>'
        ].join('') },
        { tipo: 'codigo', linguagem: 'bicep', texto: BICEP_TRAFFIC },
        { tipo: 'texto', html: '<p>Depois o recurso, em três pedaços do mesmo arquivo.</p>' },
        { tipo: 'abas', rotulo: 'resource app', itens: [
          { rotulo: 'Identidade e ingresso', blocos: [{ tipo: 'codigo', linguagem: 'bicep', texto: BICEP_APP_1 }] },
          { rotulo: 'Contêiner e probes', blocos: [{ tipo: 'codigo', linguagem: 'bicep', texto: BICEP_APP_2 }] },
          { rotulo: 'Escala e dependências', blocos: [{ tipo: 'codigo', linguagem: 'bicep', texto: BICEP_APP_3 }] }
        ] },
        { tipo: 'texto', html: [
          '<ul>',
          '<li><code>identity</code> do tipo <code>UserAssigned</code> e <code>registries</code> com <code>identity</code>: o pull da imagem usa a identidade, sem usuário nem senha do ACR.</li>',
          '<li><code>activeRevisionsMode: \'Multiple\'</code> + <code>revisionSuffix</code> (SHA curto do commit): cada implantação gera uma revisão nomeada, e as anteriores continuam ativas, o que viabiliza canário e rollback instantâneo.</li>',
          '<li><code>traffic</code> parametrizado: com <code>stableRevision</code> vazio, 100% vai para a última revisão; com a estável informada, <code>canaryPercent</code> vai para a nova e o resto fica na estável.</li>',
          '<li>Três probes (startup, liveness, readiness) apontando para os endpoints que o serviço realmente expõe.</li>',
          '<li>Regra de escala por <code>concurrentRequests</code>, com <code>maxReplicas</code> como teto de custo e de pressão sobre o provedor.</li>',
          '<li>O recurso do app é <strong>condicional</strong> (<code>if (!empty(image))</code>): a primeira implantação cria só a base (registro, identidade, cofre, modelo, ambiente) e devolve o nome do ACR; o pipeline então envia a imagem e implanta de novo com <code>image</code> preenchido. Isso resolve o ovo e a galinha "o app precisa da imagem, a imagem precisa do registro".</li>',
          '</ul>',
          '<p>O resultado de <code>bicep build</code> com a CLI 0.48.1 foi um JSON ARM com 14 recursos e nenhum aviso (verificado em 11/10/2026).</p>'
        ].join('') },
        { tipo: 'texto', html: [
          '<h3>Antes de aplicar: what-if</h3>',
          '<p><code>az deployment group what-if</code> pede ao ARM a lista de mudanças que a implantação causaria, sem executá-la. Cada recurso vem com um símbolo.</p>'
        ].join('') },
        { tipo: 'texto', largo: true, html: [
          '<table><thead><tr><th>Símbolo</th><th>Significado</th></tr></thead><tbody>',
          '<tr><td><code>+</code></td><td>criar</td></tr>',
          '<tr><td><code>~</code></td><td>modificar (com o diff por propriedade)</td></tr>',
          '<tr><td><code>-</code></td><td>excluir</td></tr>',
          '<tr><td><code>=</code></td><td>sem mudança</td></tr>',
          '<tr><td><code>*</code></td><td>ignorado (recurso fora do escopo do template, por exemplo em modo incremental)</td></tr>',
          '<tr><td><code>!</code></td><td>implantado sem previsão (o ARM não consegue prever)</td></tr>',
          '</tbody></table>'
        ].join('') },
        { tipo: 'texto', html: [
          '<p>O pipeline do bloco 6 roda o <code>what-if</code> antes do <code>create</code> e o registra no log do job; em ambientes sensíveis ele vira etapa de aprovação.</p>',
          '<p>Leia o diff procurando o que <em>não deveria</em> estar ali: uma exclusão, uma troca de SKU, <code>publicNetworkAccess</code> mudando, uma identidade sendo recriada (o que invalida os papéis atribuídos a ela). E guarde três limites.</p>'
        ].join('') },
        { tipo: 'abas', rotulo: 'Limites do what-if', itens: [
          { rotulo: 'Ruído', blocos: [{ tipo: 'texto', html: '<p>A API normaliza propriedades, e aparecem modificações que são no-ops. O diff precisa ser lido, não só aprovado.</p>' }] },
          { rotulo: 'Decisões do provedor', blocos: [{ tipo: 'texto', html: '<p>Ele não prevê falhas decididas na hora pelo provedor do recurso: cota, política de região, nome já usado.</p>' }] },
          { rotulo: 'Dependências inexistentes', blocos: [{ tipo: 'texto', html: '<p>Ele não prevê o que depende de outro recurso ainda inexistente, e marca como "implantado" (<code>!</code>) sem detalhar.</p>' }] }
        ] },
        { tipo: 'texto', html: [
          '<h3>Exemplo trabalhado: o primeiro deploy, passo a passo</h3>',
          '<ol>',
          '<li><strong>Base.</strong> <code>az deployment group create -g rg-p01 -f infra/main.bicep -p prefix=p01lab image=\'\'</code> cria registro, identidade, cofre, conta e implantação do modelo, ambiente e logs. Não cria o app. Saídas: <code>acrName</code>, <code>acrLoginServer</code>, <code>identityClientId</code>.</li>',
          '<li><strong>Imagem.</strong> Build e push para <code>&lt;acr&gt;.azurecr.io/llm-service:&lt;sha&gt;</code> (bloco 2).</li>',
          '<li><strong>App.</strong> O mesmo comando, agora com <code>image=&lt;acr&gt;.azurecr.io/llm-service:&lt;sha&gt;</code> e <code>revisionSuffix=&lt;sha7&gt;</code>. As atribuições de papel já existem (criadas no passo 1), então o pull da imagem e a chamada ao modelo funcionam desde a primeira revisão.</li>',
          '<li><strong>Deploys seguintes.</strong> Só o passo 3, com <code>stableRevision</code> e <code>canaryPercent</code> (bloco 6).</li>',
          '</ol>'
        ].join('') },
        { tipo: 'callout', tom: 'danger', titulo: 'Armadilha que pega sênior: segredo em saída ou em parâmetro sem @secure()', html: '<p>O histórico de implantações do grupo de recursos guarda parâmetros e saídas em texto legível por quem tem leitura no grupo. Uma <code>output</code> com chave ou string de conexão vira credencial exposta a todo leitor. Parâmetros sensíveis levam <code>@secure()</code>; saídas nunca carregam segredo (devolva o <em>nome</em> do cofre e leia o valor em tempo de execução). O lab não tem nenhum parâmetro secreto porque nada precisa de um: é o objetivo do bloco 4.</p>' },
        { tipo: 'callout', tom: 'danger', titulo: 'Armadilha que pega sênior: reaplicar o template pode mexer no tráfego', html: '<p>As propriedades <code>ingress.traffic</code> e <code>revisionSuffix</code> fazem parte do que o Bicep declara. Uma implantação "só de infraestrutura" que passa <code>stableRevision</code> vazio devolve 100% do tráfego à última revisão, desfazendo um canário em andamento ou um rollback manual. O pipeline do lab trata isso lendo a revisão estável antes de cada deploy; um deploy manual fora do pipeline precisa fazer o mesmo. Em geral: <strong>o que o código declara, o código dono sobrescreve</strong>.</p>' },
        { tipo: 'callout', tom: 'danger', titulo: 'Armadilha que pega sênior: proteção contra purga e nomes que não voltam', html: '<p>O Key Vault do lab tem <code>enablePurgeProtection: true</code> (boa prática de produção, e irreversível depois de ligada): <code>az group delete</code> remove o cofre para o estado "excluído suavemente", e ele permanece por 7 dias com o nome reservado. A conta do modelo também fica em exclusão suave até ser purgada. Em laboratório, use nomes derivados de <code>uniqueString</code> (como o lab) e saiba que "apaguei tudo" não libera esses nomes imediatamente.</p>' },
        { tipo: 'takeaway', html: 'O <mark>what-if</mark> é um diff que você <mark>lê</mark>, não uma garantia; o app é <mark>condicional à imagem</mark>; e <mark>o que o código declara, o código dono sobrescreve</mark>, inclusive o tráfego.' }
      ] },

      { rotulo: 'Ver e praticar', blocos: [
        { tipo: 'texto', html: '<p>A variável <code>traffic</code> é a parte do template que decide quem recebe requisições. Abaixo, a sequência de deploys do exemplo trabalhado, com o tráfego que o template declara em cada um (calculado pela lógica do arquivo; sem assinatura Azure no ambiente de autoria). Antes do Enter, preveja o que acontece com um deploy "só de infraestrutura" no meio de um canário.</p>' },
        { tipo: 'rode', id: 'p01b3-rode', titulo: 'Siga o tráfego deploy a deploy', enunciado: 'Rode a sequência de deploys e clique em "Só infraestrutura" para ler só essa etapa.',
          prefixo: '$', entrada: 'python trafego.py --sequencia', unidade: 'deploy', terminalTitulo: 'sequência de deploys', etapas: etapasTrafego(),
          prever: { pergunta: 'Um deploy "só de infraestrutura" passa <code>stableRevision</code> vazio durante um canário de 10%. Onde fica o tráfego depois?', opcoes: [
            { id: 'a', texto: 'Segue 90% na estável e 10% na nova: o tráfego não faz parte do template.', correta: false, porque: 'ingress.traffic é declarado no Bicep, então o template o recalcula a cada implantação.' },
            { id: 'b', texto: '100% na última revisão: o canário é desfeito.', correta: true, porque: 'com stableRevision vazio a variável traffic devolve 100% para a última revisão.' },
            { id: 'c', texto: '100% na revisão estável anterior.', correta: false, porque: 'sem a estável informada o template não tem como apontar para ela.' }
          ] },
          tutorAntes: 'Escolha a previsão e aperte Enter. Depois clique em "Só infraestrutura" para ler a tabela de tráfego daquele deploy.',
          tutorDepois: 'O deploy 5 não trocou imagem nenhuma, mas devolveu 100% do tráfego à última revisão, desfazendo o canário. O pipeline lê a revisão estável antes de cada deploy por isso, e um deploy manual precisa fazer o mesmo.',
          callout: 'Você viu um deploy de infraestrutura desfazer um canário porque o template é dono do tráfego.' },
        { tipo: 'complete', id: 'p01b3-complete', titulo: 'Monte as decisões do container app', linguagem: 'bicep',
          enunciado: 'Escolha, em cada lacuna, o trecho que o lab usa. As cinco decisões são as que o laboratório inteiro verifica.',
          partes: [
            "resource app 'Microsoft.App/containerApps@2024-03-01' = if (", { lacuna: 'cond', opcoes: ['!empty(image)', 'empty(image)', 'true'], correta: '!empty(image)' },
            ") {\n  identity: {\n    type: '", { lacuna: 'ident', opcoes: ['UserAssigned', 'SystemAssigned', 'None'], correta: 'UserAssigned' },
            "'\n    userAssignedIdentities: { '${identity.id}': {} }\n  }\n  properties: {\n    configuration: {\n      activeRevisionsMode: '", { lacuna: 'modo', opcoes: ['Multiple', 'Single', 'Parallel'], correta: 'Multiple' },
            "'\n      registries: [\n        { server: acr.properties.loginServer, identity: ", { lacuna: 'reg', opcoes: ['identity.id', 'acr.listCredentials().username', 'adminUserEnabled'], correta: 'identity.id' },
            " }\n      ]\n    }\n    template: {\n      containers: [{\n        probes: [{\n          type: 'Readiness'\n          httpGet: { path: '", { lacuna: 'ready', opcoes: ['/readyz', '/healthz', '/v1/chat'], correta: '/readyz' },
            "', port: 8000 }\n        }]\n      }]\n      scale: {\n        rules: [{\n          name: 'http-concurrency'\n          http: { metadata: { concurrentRequests: '", { lacuna: 'conc', opcoes: ['10', '1000', '0'], correta: '10' },
            "' } }\n        }]\n      }\n    }\n  }\n}\n"
          ],
          explicacao: 'O <code>if (!empty(image))</code> resolve o ovo e a galinha do registro: a base nasce sem app. A identidade <em>user-assigned</em> existe antes do app, e os papéis já estão atribuídos quando a primeira revisão puxa a imagem; o <code>registries</code> aponta para ela, sem senha do ACR. <code>Multiple</code> mantém as revisões anteriores ativas, base do canário e do rollback. A readiness usa <code>/readyz</code> (liveness e startup usam <code>/healthz</code>), e a regra de escala é por 10 requisições simultâneas por réplica.',
          callout: 'Container app montado: condicional à imagem, com identidade, revisões múltiplas, probe de readiness e escala por concorrência.' },
        { tipo: 'python', id: 'p01b3-python', titulo: 'Reescreva a variável traffic em Python', obrigatorio: false,
          enunciado: 'Complete <code>trafego(stable_revision, canary_percent)</code>, que espelha a variável <code>traffic</code> do Bicep. <code>canary_percent</code> fora de 1 a 100 levanta <code>ValueError</code> (os decoradores <code>@minValue(1)</code> e <code>@maxValue(100)</code> valem mesmo com a estável vazia). Com <code>stable_revision</code> vazio, devolva 100% na última revisão. Com a estável informada, devolva a estável com <code>100 - canary_percent</code> e a última com <code>canary_percent</code>. Cada entrada é um dict como no Bicep: <code>revisionName</code> ou <code>latestRevision</code>, mais <code>weight</code>.',
          codigo: "def trafego(stable_revision, canary_percent):\n    \"\"\"Espelha a variável traffic do main.bicep e as regras de @minValue(1)/@maxValue(100).\"\"\"\n    # 1. canary_percent fora de 1..100 é erro de validação (ValueError), mesmo com stable_revision vazio\n    # 2. stable_revision vazio: 100% na última revisão\n    # 3. com a estável informada: (100 - canary_percent)% nela e canary_percent% na última\n    return []\n\n\nprint(trafego(\"p01lab-app--abc1234\", 10))\n",
          testes: "STAVEL = \"p01lab-app--abc1234\"\n\n\ndef test_primeiro_deploy_vai_tudo_para_a_ultima():\n    assert trafego(\"\", 100) == [{\"latestRevision\": True, \"weight\": 100}]\n\n\ndef test_canario_divide_o_trafego():\n    assert trafego(STAVEL, 10) == [\n        {\"revisionName\": STAVEL, \"weight\": 90},\n        {\"latestRevision\": True, \"weight\": 10},\n    ]\n\n\ndef test_estavel_vazia_ignora_o_percentual():\n    assert trafego(\"\", 10) == [{\"latestRevision\": True, \"weight\": 100}]\n\n\ndef test_borda_percentual_cem_zera_a_estavel():\n    t = trafego(STAVEL, 100)\n    assert [x[\"weight\"] for x in t] == [0, 100]\n\n\ndef test_a_soma_e_sempre_cem():\n    for pct in (1, 5, 50, 99, 100):\n        assert sum(x[\"weight\"] for x in trafego(STAVEL, pct)) == 100\n\n\ndef test_falha_percentual_invalido():\n    for ruim in (0, 101, -5):\n        try:\n            trafego(STAVEL, ruim)\n        except ValueError:\n            continue\n        raise AssertionError(\"esperava ValueError para %s\" % ruim)\n    try:\n        trafego(\"\", 0)\n    except ValueError:\n        return\n    raise AssertionError(\"a validação vale mesmo com estável vazia\")\n",
          dica: 'Valide primeiro com <code>if not 1 &lt;= canary_percent &lt;= 100: raise ValueError(...)</code>. Depois, <code>if not stable_revision:</code> devolve uma lista com um único dict <code>{"latestRevision": True, "weight": 100}</code>.',
          solucao: "def trafego(stable_revision, canary_percent):\n    \"\"\"Espelha a variável traffic do main.bicep e as regras de @minValue(1)/@maxValue(100).\"\"\"\n    if not 1 <= canary_percent <= 100:\n        raise ValueError(\"canary_percent deve estar entre 1 e 100\")\n    if not stable_revision:\n        return [{\"latestRevision\": True, \"weight\": 100}]\n    return [\n        {\"revisionName\": stable_revision, \"weight\": 100 - canary_percent},\n        {\"latestRevision\": True, \"weight\": canary_percent},\n    ]\n",
          tutorDepois: 'A soma dos pesos é sempre 100, e o percentual 100 zera a estável: é um canário sem rede de proteção. A validação vem antes de qualquer cálculo, como os decoradores do Bicep, que transformam erro de implantação em erro imediato.',
          callout: 'A tabela de tráfego do template virou uma função testada: validação, primeiro deploy e canário.' },
        { tipo: 'cenario', id: 'p01b3-cenario', titulo: 'Subir o teto de réplicas no meio de um canário', obrigatorio: false,
          enunciado: 'Há um canário de 10% em andamento e você precisa subir <code>maxReplicas</code> pelo Bicep. Decida como aplicar e veja o custo de cada escolha.',
          inicio: 'inicio',
          nos: {
            inicio: { texto: 'A nova revisão recebe 10% e a estável é <code>p01lab-app--abc1234</code>. A mudança é só de infraestrutura. Como você aplica?', opcoes: [
              { texto: 'Rodar o create com os valores padrão: stableRevision vazio.', vai: 'f-trafego', tom: 'ruim', consequencia: 'o template recalcula o tráfego como 100% na última revisão.' },
              { texto: 'Ler a revisão estável ativa e passá-la como stableRevision, como o pipeline faz.', vai: 'whatif', tom: 'ok', consequencia: 'o template declara o mesmo tráfego que está em curso.' }
            ] },
            whatif: { texto: 'Você roda o what-if antes. Ele mostra <code>~</code> em <code>maxReplicas</code>, <code>~</code> em <code>ingress.traffic</code> e, na identidade do app, um <code>-</code> seguido de <code>+</code> (o nome mudou, então ela seria recriada). O que você faz?', opcoes: [
              { texto: 'Aprovar: o what-if mostrou as mudanças, então o deploy é seguro.', vai: 'f-identidade', tom: 'ruim', consequencia: 'a identidade recriada perde os papéis atribuídos a ela, e o pull da imagem passa a falhar.' },
              { texto: 'Tratar tudo como ruído de normalização da API e aplicar.', vai: 'f-ruido', tom: 'ruim', consequencia: 'o <code>-</code> na identidade não é ruído: é a exclusão de um recurso com papéis atribuídos.' },
              { texto: 'Investigar a recriação da identidade antes de aplicar: o diff é para procurar o que não deveria estar ali.', vai: 'f-bom', tom: 'ok', consequencia: 'você corrige o nome e o diff mostra só o que deveria mudar.' }
            ] }
          },
          finais: {
            'f-bom': { bom: true, texto: 'O diff mostra só maxReplicas, o tráfego fica 90/10 e a identidade segue intacta: você leu o what-if como diff e o template continuou dono do que declara.' },
            'f-trafego': { bom: false, texto: 'O canário foi desfeito sem ninguém decidir: 100% do tráfego foi para a revisão nova.' },
            'f-identidade': { bom: false, texto: 'A identidade foi recriada, os papéis se perderam e a revisão falhou ao puxar a imagem.' },
            'f-ruido': { bom: false, texto: 'A exclusão da identidade passou como ruído e a plataforma ficou sem os papéis.' }
          },
          callout: 'Você passou a revisão estável e leu o what-if procurando exclusões e recriações.' },
        { tipo: 'takeaway', html: 'O tráfego é <mark>declarado no template</mark>: passe a <mark>revisão estável</mark> em todo deploy e leia o <mark>what-if</mark> atrás de <mark>exclusões e recriações</mark>.' }
      ] },

      { rotulo: 'Conferir', blocos: [
        { tipo: 'texto', html: '<p>Duas perguntas de cenário, sem consulta. Marque quanto você confia antes de conferir.</p>' },
        { tipo: 'escolha', id: 'p01b3-escolha-whatif', titulo: 'Confira: o que o what-if garante',
          pergunta: 'O what-if do Bicep mostra apenas alterações esperadas. Isso garante que o deploy terá sucesso?',
          opcoes: [
            { id: 'a', texto: 'Sim, o what-if executa o deploy em modo de teste.', correta: false, porque: 'o what-if só pede ao ARM a lista de mudanças, sem executar.' },
            { id: 'b', texto: 'Não: é um diff previsto e ainda podem falhar permissões, cotas, políticas e dependências de runtime.', correta: true, porque: 'o what-if compara o estado desejado com o atual, mas não prova que o provisionamento vai passar por RBAC, cotas ou políticas. Use-o para revisar riscos (exclusões, mudanças em publicNetworkAccess), não como garantia.' },
            { id: 'c', texto: 'Sim, desde que o template compile.', correta: false, porque: 'compilar não prova cota, política nem permissão.' },
            { id: 'd', texto: 'Só quando usado com Terraform.', correta: false, porque: 'a pergunta é sobre o what-if do Bicep, e o plan do Terraform tem limites parecidos.' }
          ], tutorDepois: 'O diff mostra o que mudaria; só a execução mostra o que falha.' },
        { tipo: 'escolha', id: 'p01b3-escolha-ovo', titulo: 'Confira: o ovo e a galinha do registro',
          pergunta: 'O Container App referencia uma imagem que ainda não existe, porque o ACR é criado no mesmo template. Qual a solução idiomática?',
          opcoes: [
            { id: 'a', texto: 'Tornar o app condicional a um parâmetro de imagem: cria-se a infraestrutura, publica-se a imagem e então se implanta o app.', correta: true, porque: 'a infraestrutura vem primeiro, depois a imagem, depois o app, tudo pelo mesmo template com um parâmetro.' },
            { id: 'b', texto: 'Usar :latest para que qualquer imagem sirva.', correta: false, porque: ':latest é tag mutável e não resolve a dependência.' },
            { id: 'c', texto: 'Criar o ACR manualmente fora do template.', correta: false, porque: 'quebra a reprodutibilidade do ambiente.' },
            { id: 'd', texto: 'Desligar a validação do Bicep.', correta: false, porque: 'a validação não é a causa, e desligá-la não resolve a dependência.' }
          ], tutorDepois: 'O parâmetro de imagem vazio é o que deixa o template criar só a base.' },
        { tipo: 'takeaway', html: 'Infraestrutura <mark>declarada, revisada e repetível</mark>: o <mark>what-if</mark> mostra o diff, o <mark>parâmetro de imagem</mark> ordena os deploys e <mark>nenhum segredo</mark> entra em saída.' }
      ] }
    ]
  });
})();
