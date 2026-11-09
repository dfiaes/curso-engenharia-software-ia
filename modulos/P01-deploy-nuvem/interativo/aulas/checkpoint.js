/* P01 · Checkpoint: oito cenários, avaliação sem consulta. Rubrica = "Basta"; modelo = resposta esperada, com o que reprova. Fonte: P01.html#checkpoint-p01. */
(function () {
  var reprova = function (t) { return '<p><strong>Reprova:</strong> ' + t + '</p>'; };
  function opc(id, texto, correta, porque) { return { id: id, texto: texto, correta: correta, porque: porque }; }

  TrilhaAula.registrar({
    id: 'p01-checkpoint',
    titulo: 'Checkpoint P01',
    minutos: 50,
    resumo: 'Oito cenários sobre colocar um serviço com LLM em produção na nuvem, sem consulta. Responda com as suas palavras, justifique pelo invariante e diga o que mudaria em outra nuvem.',
    objetivo: 'Verificar, sem consulta, se você escolhe a plataforma com critérios, constrói uma imagem confiável, usa identidade em vez de chave, lê o what-if como diff, desenha o pipeline com OIDC e investiga uma fatura que dobrou.',
    revisao: [
      { id: 'p01cp-execformat', pergunta: 'A revisão está em <em>Failed</em> e os logs do sistema mostram <code>exec format error</code>. Qual a causa provável e o conserto?',
        opcoes: [
          opc('a', 'Imagem arm64 (build em Apple Silicon) em plataforma amd64; <code>docker build --platform linux/amd64</code>, ou construir só no CI', true, 'construir só no CI também elimina a diferença entre a máquina de dev e a de produção.'),
          opc('b', 'Falta de papel <code>AcrPull</code> para a identidade do app', false, 'isso aparece como falha ao puxar a imagem, não como erro de formato de executável.'),
          opc('c', 'Probe de startup com porta errada', false, 'o sintoma de probe é reinício em laço, não <code>exec format error</code>.')] },
      { id: 'p01cp-pull', pergunta: 'A revisão não sobe e o pull do ACR falha (<code>ImagePullBackOff</code>). Qual é o conserto estrutural?',
        opcoes: [
          opc('a', 'Atribuir <code>AcrPull</code> no registro <em>antes</em> do app (identidade user-assigned) e referenciar a identidade em <code>registries</code>', true, 'o papel criado depois do app, ou <code>registries.identity</code> ausente, causam exatamente esse sintoma.'),
          opc('b', 'Dar <code>Contributor</code> no grupo de recursos', false, 'plano de controle não resolve puxar imagem, e alarga o poder do app.'),
          opc('c', 'Usar a tag <code>:latest</code> para sempre puxar a mais nova', false, 'tag mutável muda de significado a cada push e não tem relação com permissão.')] },
      { id: 'p01cp-401', pergunta: 'Chamada ao modelo devolve 401 mesmo com o papel atribuído. Quais as causas prováveis?',
        opcoes: [
          opc('a', 'Escopo do token errado ou endpoint regional sem subdomínio personalizado (<code>customSubDomainName</code>)', true, 'o conserto: escopo conforme a documentação atual (<code>AZURE_OPENAI_SCOPE</code> ajusta) e subdomínio na conta.'),
          opc('b', 'Falta de papel de dados', false, 'papel de dados ausente produz 403, não 401.'),
          opc('c', 'A cota de tokens acabou', false, 'cota excedida produz 429.')] },
      { id: 'p01cp-idtoken', pergunta: '<code>azure/login</code> falha com "Unable to get ACTIONS_ID_TOKEN_REQUEST_URL". O que falta?',
        opcoes: [
          opc('a', '<code>permissions: id-token: write</code> no job de deploy (o <code>deploycheck</code> pega, XR006)', true, 'sem a permissão o GitHub não emite o JWT. Já "No matching federated identity record" é diferença no <code>sub</code>.'),
          opc('b', 'Uma credencial federada para o ambiente <code>production</code>', false, 'a falta de credencial dá "No matching federated identity record", não este erro.'),
          opc('c', 'Um secret com o JSON do service principal', false, 'reintroduz segredo de longa vida e não é o conserto.')] },
      { id: 'p01cp-canario', pergunta: 'O canário foi desfeito sozinho depois de um redeploy "só de infraestrutura". Por quê?',
        opcoes: [
          opc('a', 'O Bicep rodou com <code>stableRevision</code> vazio e devolveu 100% à última revisão; leia a estável antes de todo deploy, inclusive os manuais', true, 'o pipeline lê do Azure qual revisão tem 100% antes de qualquer mudança.'),
          opc('b', 'O Container Apps limpa canários a cada hora', false, 'não há essa limpeza automática.'),
          opc('c', 'O <code>what-if</code> aprovou a mudança de tráfego', false, 'o <code>what-if</code> só mostra o diff previsto.')] },
      { id: 'p01cp-nome', pergunta: 'Recriar o ambiente falha por "nome em uso" (Key Vault ou conta de modelo). Qual a causa e a saída?',
        opcoes: [
          opc('a', 'Exclusão suave e proteção contra purga mantêm o nome; use nomes com <code>uniqueString</code>, faça <code>purge</code> da conta e aguarde o fim da retenção do cofre', true, 'é o mesmo mecanismo que protege o cofre de ser destruído de vez por quem tem acesso de exclusão.'),
          opc('b', 'O Bicep não é idempotente', false, 'o Bicep é declarativo; o nome está retido pela exclusão suave.'),
          opc('c', 'Falta o papel <code>Contributor</code> na assinatura', false, 'o erro é de nome retido, não de permissão.')] }
    ],
    abas: [
      { rotulo: 'Plataforma, imagem e probes', blocos: [
        { tipo: 'texto', html:
          '<p>Uma pergunta por vez, sem consulta. Cada pergunta é um cenário; a rubrica diz o que basta e o modelo diz o que reprova. Justifique pelo <strong>invariante</strong> (E/S com conexões longas, imagem como contrato, identidade em vez de chave, reversibilidade) e, quando fizer sentido, diga como ficaria em AWS ou GCP. Reprovar é permitido: volte ao bloco indicado e tente de novo.</p>' },

        { tipo: 'escolha', id: 'cp-esc-p1', titulo: 'P1 · Aquecimento: a plataforma',
          pergunta: 'Serviço com LLM para 8 times internos, tráfego só em horário comercial, respostas em streaming de até 60 s. A diretoria sugere AKS "porque é padrão". Qual é a postura certa?',
          opcoes: [
            { id: 'a', texto: 'Aceitar: Kubernetes é sempre a melhor escolha em produção.', correta: false, porque: 'é o absoluto que reprova; o critério é a forma da carga e o custo de operar.' },
            { id: 'b', texto: 'Recusar: serverless é sempre mais barato.', correta: false, porque: 'também é um absoluto; escala a zero tem partida a frio, e há cenários que pedem cluster.' },
            { id: 'c', texto: 'Decidir por critérios: carga de E/S com streams longos e concorrência, custo de operar cluster, escala a zero contra partida a frio medida, limite de 240 s do ingresso, e o que justificaria AKS (CRDs, GPU, malha, multi-times).', correta: true, porque: 'nomear o que justificaria AKS é o que torna a recusa defensável.' }
          ] },
        { tipo: 'escreva', id: 'cp-p1', titulo: 'P1 · Defenda ou refute o AKS', obrigatorio: false,
          enunciado: 'Um serviço com LLM para 8 times internos, tráfego só em horário comercial, respostas em streaming de até 60 s. A diretoria sugere AKS "porque é padrão". Defenda ou refute com critérios. <em>Bloco 1.</em>',
          placeholder: 'A carga é… O custo de operar… A escala a zero… O limite do ingresso… AKS se…',
          rubrica: [
            'A <strong>forma da carga</strong>: E/S pura, concorrência alta, <strong>streams longos</strong>.',
            'O <strong>custo de operar cluster</strong> (upgrades, nós, rede, segurança).',
            '<strong>Escala a zero</strong> contra <strong>partida a frio medida</strong>.',
            'O <strong>limite de 240 s</strong> do ingresso.',
            'O que <strong>justificaria AKS</strong>: CRDs, GPU, malha, multi-times.'
          ],
          modelo: '<p>A carga é E/S com muitas conexões longas e sem estado local, e o tráfego só em horário comercial favorece escalar a zero. Container Apps entrega esse caso sem que o time opere nós, upgrades e rede de um cluster. Eu mediria a partida a frio contra o orçamento de latência e usaria <code>minReplicas: 1</code> se ela incomodasse; streams de 60 s cabem folgadamente no limite de 240 s do ingresso. AKS passa a fazer sentido com CRDs e operadores próprios, GPU, malha de serviços ou muitos times com isolamento forte; nada disso está no enunciado.</p>' +
            reprova('"serverless é sempre mais barato" ou "Kubernetes é sempre melhor".') },

        { tipo: 'escreva', id: 'cp-p2', titulo: 'P2 · Imagem confiável', obrigatorio: false,
          enunciado: 'Dois deploys do mesmo commit rodam comportamentos diferentes. Liste as causas possíveis na construção e na publicação e as correções. <em>Bloco 2.</em>',
          placeholder: 'Na construção… Na publicação… Correções…',
          rubrica: [
            'Imagem base e ferramentas <strong>sem versão</strong>.',
            '<code>uv sync</code> <strong>sem <code>--locked</code></strong>.',
            '<strong>Tag mutável</strong> e push de <strong>máquina de dev</strong>.',
            'Correções: <strong>lockfile</strong>, versão ou <strong>digest</strong>, <strong>tag por SHA</strong>, build só no CI, tag travada no ACR.'
          ],
          modelo: '<p>Na construção, base e ferramenta sem versão fixa e <code>uv sync</code> sem <code>--locked</code> resolvem dependências diferentes a cada build. Na publicação, uma tag mutável aponta para conteúdos diferentes ao longo do tempo, e um push feito de uma máquina de desenvolvimento escapa dos gates. As correções: lockfile respeitado com <code>--locked</code>, base fixada por versão ou digest, tag igual ao SHA do commit com o digest registrado, build só no CI e tag imutável travada no ACR.</p>' +
            reprova('"use <code>:latest</code> para sempre ter a mais nova".') },

        { tipo: 'escreva', id: 'cp-p3', titulo: 'P3 · Probes', obrigatorio: false,
          enunciado: 'O provedor de modelo degrada e todas as réplicas reiniciam juntas, piorando o incidente. Diagnostique e conserte. <em>Bloco 2.</em>',
          placeholder: 'A causa é… A liveness deve… A readiness… A conectividade…',
          rubrica: [
            'Diagnóstico: <strong>liveness dependente de rede externa</strong>.',
            '<strong>Liveness só do processo</strong>; readiness <strong>sem chamada de rede</strong>.',
            'Verificação de conectividade em <strong>teste sintético com alerta</strong>.'
          ],
          modelo: '<p>A liveness depende de uma chamada externa: quando o provedor degrada, todas as réplicas falham a probe juntas e a plataforma as reinicia, trocando uma degradação parcial por indisponibilidade total. A liveness deve olhar só o processo; a readiness não faz chamada de rede (<code>/readyz</code> valida configuração e adapter). A conectividade com o provedor é verificada por um teste sintético com alerta, que acorda uma pessoa sem derrubar réplicas.</p>' +
            reprova('"aumentar o timeout da probe".') },
        { tipo: 'takeaway', html: 'Em cada resposta: o <mark>critério</mark> primeiro, o <mark>absoluto</mark> nunca.' }
      ] },

      { rotulo: 'Identidade, segredos e IaC', blocos: [
        { tipo: 'escreva', id: 'cp-p4', titulo: 'P4 · Sem chave', obrigatorio: false,
          enunciado: 'Explique, de ponta a ponta, como o contêiner chama o modelo sem nenhuma chave, e dê três causas de 403 com a identidade "certa". <em>Bloco 4.</em>',
          placeholder: 'A identidade… O token… O papel… Três causas de 403…',
          rubrica: [
            '<strong>Identidade gerenciada</strong> e <strong>token Entra com escopo</strong>.',
            '<strong>Papel de dados</strong> no recurso; <strong>plano de controle versus plano de dados</strong>.',
            'Causas de 403: <strong>propagação</strong>, <code>AZURE_CLIENT_ID</code> ausente, escopo errado.',
            '<strong>Subdomínio</strong> personalizado e <code>disableLocalAuth</code>.'
          ],
          modelo: '<p>O app roda com uma managed identity user-assigned; o SDK (<code>DefaultAzureCredential</code>) pede um token à plataforma com o escopo do recurso e o envia em <code>Authorization: Bearer</code>. O recurso de modelo valida o token e o papel: <code>Cognitive Services OpenAI User</code>, um papel de dados, atribuído no escopo da conta. O endpoint exige subdomínio personalizado e a conta tem <code>disableLocalAuth: true</code>, então chave não existe. Três causas de 403 com a identidade certa: papel de plano de controle (<code>Contributor</code>) em vez de dados, atribuição recente ainda propagando e <code>AZURE_CLIENT_ID</code> ausente (ou escopo da atribuição errado).</p>' +
            reprova('"dar Contributor no grupo".') },

        { tipo: 'escreva', id: 'cp-p5', titulo: 'P5 · Segredos que sobram', obrigatorio: false,
          enunciado: 'Um parceiro exige uma chave de API. Onde ela vive, quem a lê, como entra no app e o que acontece na rotação? <em>Bloco 4.</em>',
          placeholder: 'Ela vive em… Quem lê… Entra no app por… Na rotação…',
          rubrica: [
            '<strong>Key Vault com RBAC</strong>; referência no app <strong>por identidade</strong>.',
            'Variável <strong>lida na partida</strong>; URL <strong>com ou sem versão</strong> e reinício.',
            'Segredo <strong>criado fora do código</strong>; nunca em saída ou parâmetro sem <code>@secure()</code>.'
          ],
          modelo: '<p>A chave vive no Key Vault, com RBAC; a identidade do app tem <code>Key Vault Secrets User</code> no cofre. No Bicep, o app declara a referência (<code>keyVaultUrl</code> e <code>identity</code>) e a expõe como variável por <code>secretRef</code>; o valor é criado fora do código (<code>az keyvault secret set</code>) e nunca aparece em saída ou em parâmetro sem <code>@secure()</code>. O contêiner lê a variável na partida: sem versão na URL a plataforma troca depois de um intervalo e reinicia as revisões; com versão, o valor é fixo até mudar a URL. Rotação, portanto, é planejar um reinício.</p>' +
            reprova('variável no workflow ou no template.') },

        { tipo: 'escolha', id: 'cp-esc-p6', titulo: 'P6 · Aquecimento: o what-if',
          pergunta: 'O <code>what-if</code> mostra uma exclusão de identidade e um <code>~</code> em <code>publicNetworkAccess</code>. O que você faz antes de aprovar?',
          opcoes: [
            { id: 'a', texto: 'Aprovar: é só um diff e o <code>what-if</code> garante que o deploy passa.', correta: false, porque: 'o <code>what-if</code> mostra o diff previsto; não garante sucesso (cota, política, nomes, propagação).' },
            { id: 'b', texto: 'Analisar o diff: uma identidade recriada perde os papéis, e a mudança em <code>publicNetworkAccess</code> altera a exposição; só então aprovar.', correta: true, porque: 'o diff é a evidência a ser lida, não a garantia.' },
            { id: 'c', texto: 'Ignorar o <code>~</code>: modificações não importam, só exclusões.', correta: false, porque: 'um <code>~</code> em acesso de rede pode abrir ou fechar o serviço.' }
          ] },
        { tipo: 'escreva', id: 'cp-p6', titulo: 'P6 · IaC e what-if', obrigatorio: false,
          enunciado: 'Seu <code>what-if</code> mostra uma exclusão de identidade e um <code>~</code> em <code>publicNetworkAccess</code>. O que você faz antes de aprovar, e por que "o what-if passou" não garante o deploy? <em>Bloco 3.</em>',
          placeholder: 'A exclusão significa… O ~ muda… Antes de aprovar… O what-if não garante porque…',
          rubrica: [
            'Identidade recriada <strong>perde os papéis</strong>.',
            '<strong>Análise do diff</strong>, inclusive da mudança de exposição de rede.',
            'Limites do <code>what-if</code>: <strong>cota, política, nomes, propagação</strong>.',
            '<strong>Modo incremental</strong> e o que ele não apaga.'
          ],
          modelo: '<p>Uma identidade excluída e recriada tem outro principal e perde os papéis atribuídos, então o app perde acesso até a atribuição propagar; eu verificaria se a exclusão é intencional e se os papéis são recriados no mesmo deploy. O <code>~</code> em <code>publicNetworkAccess</code> muda a exposição do recurso e precisa de leitura explícita. O <code>what-if</code> é um diff previsto: não enxerga cota, política do Azure, nomes retidos nem a propagação do RBAC, então "passou" não garante o deploy. Lembro também do modo incremental, em que o que está fora do template não é apagado.</p>' +
            reprova('aprovar porque "é só um diff".') },
        { tipo: 'takeaway', html: 'Identidade com <mark>papel de dados</mark> no menor escopo, segredo <mark>fora do código</mark> e <mark>what-if</mark> lido como <mark>diff</mark>, não como garantia.' }
      ] },

      { rotulo: 'Pipeline, fatura e entregáveis', blocos: [
        { tipo: 'escreva', id: 'cp-p7', titulo: 'P7 · Pipeline com OIDC', obrigatorio: false,
          enunciado: 'Desenhe o fluxo e o modelo de confiança do deploy, incluindo as duas identidades e o ambiente protegido. <em>Bloco 6.</em>',
          placeholder: 'O job pede… O Entra confere… As identidades… O ambiente…',
          rubrica: [
            '<code>id-token: write</code>, <strong>JWT</strong> e <strong>credencial federada por subject</strong>.',
            'Variáveis <strong>não secretas</strong> (client, tenant, subscription).',
            '<strong>Ambiente com revisores</strong>; deploy com escopo de <strong>grupo de recursos</strong>.',
            'Runtime <strong>só com papéis de dados</strong>; actions <strong>fixadas</strong>.'
          ],
          modelo: '<p>O job de deploy declara <code>id-token: write</code> e usa o ambiente protegido <code>production</code>, com revisores obrigatórios. O GitHub emite um JWT cujo subject é <code>repo:ORG/REPO:environment:production</code>; o <code>azure/login</code> o apresenta ao Entra ID, que valida emissor, audiência e subject contra a credencial federada e devolve um token curto. As variáveis do repositório são só identificadores. A identidade de deploy tem plano de controle no grupo de recursos; a de runtime tem apenas papéis de dados por recurso. As actions ficam fixadas, as permissões do workflow são mínimas e o deploy é uma sequência reversível (what-if, canário, rollback por tráfego).</p>' +
            reprova('service principal com segredo no repositório, ou uma identidade para tudo.') },

        { tipo: 'escolha', id: 'cp-esc-p8', titulo: 'P8 · Aquecimento: a fatura',
          pergunta: 'O custo dobrou e o p95 subiu, sem nenhum erro. Qual é o primeiro passo?',
          opcoes: [
            { id: 'a', texto: 'Aumentar o número de réplicas.', correta: false, porque: 'réplicas não reduzem tokens.' },
            { id: 'b', texto: 'Separar o TTFT da latência total e comparar tokens por requisição antes e depois, com KQL por modelo, rota e <code>request_id</code>.', correta: true, porque: 'sem erro, o suspeito é o volume por requisição: prompt, contexto, histórico ou cliente em laço.' },
            { id: 'c', texto: 'Esperar o aviso do orçamento.', correta: false, porque: 'o orçamento avisa com atraso, depois do gasto.' }
          ] },
        { tipo: 'escreva', id: 'cp-p8', titulo: 'P8 · Fatura e incidente', obrigatorio: false,
          enunciado: 'O custo dobrou e o p95 subiu, sem erro. Conduza a investigação e proponha os controles permanentes. <em>Bloco 5.</em>',
          placeholder: 'Eu separaria… A consulta… A causa provável… Os controles permanentes…',
          rubrica: [
            'Separar <strong>TTFT</strong> de total; <strong>tokens</strong> de contagem de chamadas.',
            '<strong>KQL por modelo, rota e <code>request_id</code></strong>; causa em prompt ou cliente.',
            'Teto de réplicas e de <strong>TPM</strong>; orçamento como <strong>aviso</strong>, não bloqueio.',
            'Alerta de <strong>queima de tokens</strong>; <strong>rollback por tráfego</strong> se a causa for uma revisão.'
          ],
          modelo: '<p>Sem erro, olho o volume por requisição. Separo o TTFT da latência total e comparo os tokens de entrada e saída por chamada antes e depois do último deploy, com KQL sobre o log por requisição, agrupando por modelo, rota e <code>request_id</code>. Se a causa for uma revisão (prompt maior, histórico sem limite), devolvo o tráfego à estável pela tabela de tráfego; se for um cliente em laço, limito por chamador. Como controles permanentes: alerta de queima de tokens, teto de <code>maxReplicas</code> e de TPM, limite por chamador e orçamento como aviso, sabendo que ele não bloqueia gasto.</p>' +
            reprova('"aumentar réplicas".') },

        { tipo: 'texto', html:
          '<h3>Entregáveis verificados (mostrar rodando)</h3>' +
          '<ol><li>Gates do lab verdes: <code>pytest</code> (84 testes), <code>ruff check</code>, <code>ruff format --check</code>, <code>mypy --strict</code>.</li>' +
          '<li><code>deploycheck --strict</code> com 0 erros nos três artefatos, e as 8 falhas reais da edição quebrada do passo 5.</li>' +
          '<li>Mutação da regra XR001 rejeitada pela suíte (2 falhas) e revertida.</li>' +
          '<li><code>bicep build</code> sem avisos do <code>main.bicep</code> e do <code>main.bicepparam</code>.</li>' +
          '<li>Opcional: deploy real com rollback medido e <code>az group delete</code> confirmado.</li></ol>' },
        { tipo: 'texto', html: '<p class="ta-nota">Estado verificado em 11/10/2026 (Python 3.14.7, uv 0.11.32, Bicep 0.48.1). Não foram verificados por execução: o build da imagem (sem Docker no ambiente), qualquer implantação (sem assinatura Azure), o <code>what-if</code> e o fluxo de OIDC. Nomes de produto, escopos de token, versões de modelo, cotas e preços de nuvem são de alto risco: revalidar em até 90 dias, e sempre antes de uma implantação real.</p>' },
        { tipo: 'takeaway', html: 'Rollback é <mark>tabela de tráfego</mark>, identidade é <mark>papel de dados</mark>, e o <mark>orçamento só avisa</mark>.' }
      ] }
    ]
  });
})();
