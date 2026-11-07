/* Aula 5 · Esteira dev, cert e prod. Fonte: TR-texto.html, Passo 4 (verificado em 12/10/2026). */
(function () {
  var L = function (kind, text) { return { kind: kind, text: text }; };

  var yamlOidc =
'name: deploy\n' +
'on:\n' +
'  workflow_run: { workflows: [ci], branches: [main], types: [completed] }\n' +
'  workflow_dispatch:\n\n' +
'permissions:\n' +
'  contents: read\n' +
'  id-token: write   # OIDC: o GitHub emite um token efêmero por execução\n\n' +
'jobs:\n' +
'  dev:\n' +
'    runs-on: ubuntu-latest\n' +
'    environment: dev            # sem proteção\n' +
'    steps:\n' +
'      - uses: actions/checkout@v4\n' +
'      - uses: azure/login@v2\n' +
'        with:\n' +
'          client-id: ${{ vars.AZURE_CLIENT_ID }}\n' +
'          tenant-id: ${{ vars.AZURE_TENANT_ID }}\n' +
'          subscription-id: ${{ vars.AZURE_SUBSCRIPTION_ID }}\n' +
'      - run: ./scripts/deploy.sh dev "${{ github.sha }}"\n\n' +
'  cert:\n' +
'    needs: dev\n' +
'    runs-on: ubuntu-latest\n' +
'    environment: cert           # pausa até um revisor aprovar\n' +
'    steps: [ ... login, deploy cert, ./scripts/smoke.sh cert ... ]\n\n' +
'  prod:\n' +
'    needs: cert\n' +
'    runs-on: ubuntu-latest\n' +
'    environment: prod           # revisores humanos, sem self-review, só main\n' +
'    steps: [ ... login, deploy prod, ./scripts/smoke.sh prod ... ]';

  var yamlOnprem =
'  cert:\n' +
'    needs: dev\n' +
'    runs-on: [self-hosted, linux, onprem-cert]   # runner dentro da rede\n' +
'    environment: cert\n' +
'    steps: [ ... deploy cert + smoke ... ]\n\n' +
'  prod:\n' +
'    needs: cert\n' +
'    runs-on: [self-hosted, linux, onprem-prod]   # runner dedicado e isolado\n' +
'    environment: prod\n' +
'    steps: [ ... deploy prod + smoke ... ]';

  var azdo =
'stages:\n' +
'  - stage: CI\n' +
'  - stage: Dev\n' +
'    jobs: [ { deployment: dev,  environment: dev  } ]\n' +
'  - stage: Cert\n' +
'    jobs: [ { deployment: cert, environment: cert, pool: { name: pool-onprem } } ]\n' +
'  - stage: Prod\n' +
'    jobs: [ { deployment: prod, environment: prod } ]\n' +
'# Aprovações: Pipelines > Environments > Approvals and checks\n' +
'# Versão completa: kit/template/azure-pipelines.yml';

  TrilhaAula.registrar({
    id: 'esteira',
    titulo: 'Esteira dev, cert e prod',
    minutos: 20,
    resumo: 'A pipeline decide o que é "pronto" por regra, não por opinião. Você promove um artefato por três ambientes, vê um gate falhar e ensaia o rollback.',
    abas: [
      { rotulo: 'Entender', blocos: [
        { tipo: 'texto', html:
          '<p>Pense numa linha de montagem com três cancelas. A peça só passa para a próxima etapa se a cancela abrir, e a última cancela só abre para quem tem crachá. A <strong>pipeline</strong> é o único lugar em que "pronto" é decidido por regra. Para agentes, ela também define <strong>até onde eles podem ir sozinhos</strong>: a autonomia cresce com a distância da produção.</p>' +
          '<h3>Autonomia do agente por ambiente</h3>' +
          '<table><thead><tr><th>Ambiente</th><th>O agente pode</th><th>Gate</th><th>Quem autoriza</th></tr></thead><tbody>' +
          '<tr><td><strong>Local / dev</strong></td><td>Editar, rodar testes, abrir PR, <em>propor</em> e disparar deploy em dev</td><td>CI verde</td><td>Automático (ou o próprio dev)</td></tr>' +
          '<tr><td><strong>Cert</strong></td><td>Acompanhar o deploy, rodar smoke tests, resumir resultados; <em>não</em> aprova</td><td>Environment com aprovadores; smoke test; QA</td><td>QA ou líder técnico</td></tr>' +
          '<tr><td><strong>Prod</strong></td><td>Preparar nota de release e checklist; <em>nunca</em> aprova nem executa sozinho</td><td>Environment com aprovadores humanos, só branch <code>main</code>, janela de mudança</td><td>Humano autorizado (diferente do autor do PR)</td></tr>' +
          '</tbody></table>',
          largo: true },
        { tipo: 'texto', html:
          '<h3>O fluxo, do merge à produção</h3>' +
          '<ol><li><strong>Merge na main:</strong> o CI roda <code>make check</code> e gera o artefato identificado pelo SHA.</li>' +
          '<li><strong>Dev:</strong> deploy automático, sem aprovação. O agente pode disparar e observar.</li>' +
          '<li><strong>Cert:</strong> o job pausa até um humano aprovar no environment; depois deploy e smoke test.</li>' +
          '<li><strong>Prod:</strong> aprovador humano diferente do autor, janela de mudança, smoke test e rollback pronto para o SHA anterior.</li></ol>' +
          '<p>O <strong>artefato é imutável</strong>: o mesmo SHA percorre os três ambientes. Recompilar entre ambientes quebra a promessa de que o que foi testado em cert é o que roda em prod.</p>' },
        { tipo: 'escolha', id: 'est-oidc', titulo: 'Confira: autenticação no Azure',
          pergunta: 'Qual é a melhor forma de o workflow autenticar no Azure?',
          opcoes: [
            { id: 'a', texto: 'Segredo de service principal com validade longa guardado no GitHub.', correta: false, porque: 'segredo de longa duração vaza e vale em qualquer lugar onde alguém o use.' },
            { id: 'b', texto: 'OIDC com credencial federada, uma identidade por ambiente e papel mínimo.', correta: true, porque: 'o token é efêmero e só vale para o <code>subject</code> configurado (repositório e environment). A identidade de dev não toca prod.' },
            { id: 'c', texto: 'Usuário pessoal do líder com MFA desligado.', correta: false, porque: 'é pior ainda: credencial humana, ampla e sem segundo fator.' }
          ] },
        { tipo: 'callout', tom: 'danger', titulo: 'Armadilha que pega sênior', html:
          'Deixar o agente editar o próprio workflow de deploy no mesmo PR que muda o código ("para ajustar o passo"). Quem controla a pipeline controla o gate. Por isso <code>deploy.yml</code> fica nos caminhos protegidos (hook) e no <code>CODEOWNERS</code> da plataforma: mudar a pipeline é um PR separado, revisado por quem a mantém.' },
        { tipo: 'takeaway', html: 'Dev livre, cert com <mark>gate humano</mark>, prod só com <mark>humano autorizado</mark>; quem controla a pipeline controla o gate.' }
      ] },

      { rotulo: 'Praticar', blocos: [
        { tipo: 'texto', html:
          '<p>Primeiro, a configuração. Em <em>Settings → Environments</em>, crie três environments: <code>dev</code> sem proteção; <code>cert</code> com <em>Required reviewers</em>; <code>prod</code> com <em>Required reviewers</em>, <em>Prevent self-review</em> e restrição ao branch <code>main</code>. Um job que declara <code>environment: prod</code> fica pausado até a aprovação. O arquivo completo está em <code>kit/template/.github/workflows/deploy.yml</code>.</p>' +
          '<p>Escolha o seu caso. Rode a simulação do workflow abaixo e depois promova um artefato de verdade pela esteira.</p>' },
        { tipo: 'abas', rotulo: 'Onde o job roda', itens: [
          { rotulo: 'Azure com OIDC', blocos: [
            { tipo: 'texto', html:
              '<p>Em vez de guardar uma senha de service principal no GitHub, configure <strong>credencial federada</strong> (workload identity) no Microsoft Entra. O GitHub emite um token efêmero por execução e o Azure só o aceita se o <code>subject</code> casar (repositório, environment, branch).</p>' +
              '<ol><li>Registre um app ou identidade gerenciada.</li>' +
              '<li>Adicione a credencial federada com <code>subject</code> do tipo <code>repo:ORG/REPO:environment:prod</code>.</li>' +
              '<li>Dê a ela só o papel necessário no <em>resource group</em> do ambiente.</li>' +
              '<li>No workflow, use <code>permissions: id-token: write</code> e <code>azure/login@v2</code> com <code>client-id</code>, <code>tenant-id</code> e <code>subscription-id</code> (variáveis, não segredos).</li></ol>' +
              '<p>Use uma identidade por ambiente: a de dev não consegue tocar prod.</p>' },
            { tipo: 'codigo', linguagem: 'yaml', texto: yamlOidc }] },
          { rotulo: 'On-premise (runner self-hosted)', blocos: [
            { tipo: 'texto', html:
              '<p>Para implantar em servidores locais, instale um <strong>runner self-hosted</strong> dentro da rede. Ele faz conexão de <em>saída</em> para o GitHub, sem abrir porta de entrada. Trocar o <code>runs-on</code> basta.</p>' +
              '<ul><li>Um runner por ambiente; o de prod isolado e restrito ao environment <code>prod</code>.</li>' +
              '<li>Runners efêmeros quando possível.</li>' +
              '<li>Nunca use self-hosted em repositório público: o PR de um fork executaria código na sua rede.</li>' +
              '<li>Atualização e limpeza de workspace automatizadas.</li></ul>' },
            { tipo: 'codigo', linguagem: 'yaml', texto: yamlOnprem }] },
          { rotulo: 'Azure DevOps Pipelines', blocos: [
            { tipo: 'texto', html:
              '<p>Mesmo desenho: <em>stages</em> <code>CI → Dev → Cert → Prod</code>, jobs do tipo <code>deployment</code> ligados a <em>Environments</em> (Pipelines → Environments → <em>Approvals and checks</em>), service connection com federação de identidade e pools self-hosted (<code>pool: name: pool-onprem</code>). Branch policies do Azure Repos cumprem o papel da branch protection.</p>' },
            { tipo: 'codigo', linguagem: 'yaml', texto: azdo }] }
        ] },
        { tipo: 'rode', id: 'est-rode', titulo: 'Rode e observe: o workflow deploy.yml',
          enunciado: 'Dispare o deploy depois de um merge na main e veja cada job acender, com a pausa do environment em cert.',
          prefixo: '$', entrada: 'gh workflow run deploy.yml --ref main', terminalTitulo: 'github actions', unidade: 's',
          etapas: [
            { id: 'ci', nome: 'CI e artefato', descricao: 'make check e build com SHA', tom: 'dns', ms: 95, linhas: [
              L('info', 'workflow ci: make check'), L('out', 'lint, tipos e 212 testes: ok'),
              L('in', 'artefato app:a3f9c21 publicado (imutável)')] },
            { id: 'dev', nome: 'Job dev', descricao: 'Login OIDC e deploy automático', tom: 'tcp', ms: 48, linhas: [
              L('info', 'environment: dev (sem proteção)'),
              L('out', 'azure/login@v2: token OIDC emitido para repo:ORG/REPO:environment:dev'),
              L('cmd', './scripts/deploy.sh dev a3f9c21'), L('in', 'dev: no ar, health check ok')] },
            { id: 'cert', nome: 'Job cert', descricao: 'Pausa até a aprovação', tom: 'tls', ms: 140, linhas: [
              L('info', 'environment: cert, aguardando revisor'),
              L('hint', 'decisão humana: QA ou líder aprova no environment'),
              L('in', 'aprovado por maria.qa'),
              L('cmd', './scripts/deploy.sh cert a3f9c21'), L('cmd', './scripts/smoke.sh cert'), L('in', 'smoke cert: 14 de 14 ok')] },
            { id: 'prod', nome: 'Job prod', descricao: 'Aprovador diferente do autor', tom: 'request', ms: 160, linhas: [
              L('info', 'environment: prod, branch main permitido'),
              L('hint', 'decisão humana: prevent self-review barra o autor do PR'),
              L('in', 'aprovado por joao.lider (autor do PR: ana.dev)'),
              L('cmd', './scripts/deploy.sh prod a3f9c21'), L('cmd', './scripts/smoke.sh prod'), L('in', 'prod: no ar, smoke 14 de 14 ok')] },
            { id: 'fim', nome: 'Rollback pronto', descricao: 'SHA anterior registrado', tom: 'response', ms: 2, linhas: [
              L('body', 'rollback: gh workflow run deploy.yml -f sha=<sha-anterior-estavel>')] }
          ],
          tutorAntes: 'Aperte Enter. Note onde o fluxo para sozinho e onde um humano precisa agir.',
          tutorDepois: 'Três ambientes, um artefato, duas aprovações humanas. Em prod o aprovador não é o autor.',
          callout: 'Você viu o desenho completo: CI, dev automático, cert e prod com gates humanos.' },
        { tipo: 'esteira', id: 'est-esteira', titulo: 'Mão na massa: promova até produção',
          enunciado: 'Promova o artefato de dev até prod. Aprove os gates que pedem uma pessoa, corrija o que falhar e teste o rollback antes de seguir.',
          artefato: 'a3f9c21',
          ambientes: [
            { id: 'dev', nome: 'Dev', gates: [
              { id: 'ci', rotulo: 'CI verde (make check)', tipo: 'auto', comando: 'make check', saida: 'lint, tipos e testes: ok' }] },
            { id: 'cert', nome: 'Cert', gates: [
              { id: 'aprov', rotulo: 'Aprovação de QA ou líder', tipo: 'aprovacao' },
              { id: 'smoke', rotulo: 'Smoke test em cert', tipo: 'auto', comando: './scripts/smoke.sh cert',
                saida: 'smoke cert: 14 de 14 ok',
                falhaPossivel: { linhas: ['smoke cert: GET /api/investidores retornou 500', 'causa: migração de banco não aplicada em cert'],
                  tutor: 'o smoke test pegou em cert o que o CI não via: o esquema do banco estava atrás do código. É para isso que cert existe. Corrija a causa (aplicar a migração, em duas fases) e rode o gate de novo, sem pular.' } }] },
            { id: 'prod', nome: 'Prod', gates: [
              { id: 'aprov', rotulo: 'Aprovação humana (não o autor)', tipo: 'aprovacao' },
              { id: 'smoke', rotulo: 'Smoke test em prod', tipo: 'auto', comando: './scripts/smoke.sh prod', saida: 'smoke prod: 14 de 14 ok' }] }
          ],
          tutorAntes: 'Aperte Promover. A esteira para nos gates de aprovação e no smoke de cert. Quando chegar em prod, clique em Rollback uma vez para ver como volta.',
          tutorDepois: 'Mesmo artefato nos três ambientes, o gate de cert barrou um erro real e o rollback voltou o SHA anterior sem novo build.',
          callout: 'O artefato chegou a produção passando por todos os gates.' },
        { tipo: 'texto', html:
          '<h3>Rollback ensaiado</h3>' +
          '<ol><li>Todo deploy é de um <strong>artefato imutável identificado pelo SHA</strong>; nunca recompile para voltar.</li>' +
          '<li>Rollback é reimplantar o SHA anterior estável (<code>workflow_dispatch</code> com o SHA, ou <code>deploy.sh prod &lt;sha&gt;</code>). Escreva o comando exato no runbook.</li>' +
          '<li>Mudanças de banco em duas fases (expandir, migrar, contrair), para que o código antigo continue funcionando com o esquema novo.</li>' +
          '<li><strong>Ensaie em cert</strong> a cada release relevante: faça deploy e rollback e cronometre. Um rollback nunca testado é uma esperança.</li>' +
          '<li>Feature flags desligam funcionalidade sem novo deploy.</li></ol>' },
        { tipo: 'takeaway', html: 'Mesmo <mark>artefato por SHA</mark> em todos os ambientes; o <mark>rollback ensaiado</mark> é só reimplantar o anterior.' }
      ] },

      { rotulo: 'Conferir', blocos: [
        { tipo: 'escolha', id: 'est-agente-prod', titulo: 'Confira: o agente aprova prod?',
          pergunta: 'O CI está verde e o agente diz que a mudança é segura. Ele pode aprovar o deploy em prod?',
          opcoes: [
            { id: 'a', texto: 'Sim, CI verde é suficiente.', correta: false, porque: 'CI verde prova que os testes passaram, não que a mudança deve ir para produção agora (janela, risco, pendências de negócio).' },
            { id: 'b', texto: 'Sim, se o autor do PR delegar a aprovação.', correta: false, porque: 'delegar a um agente esvazia o gate: a regra exige um humano autorizado, diferente do autor.' },
            { id: 'c', texto: 'Não. Prod exige humano autorizado diferente do autor; o agente prepara a nota de release e observa.', correta: true, porque: 'o agente reduz o trabalho do aprovador, não o substitui.' }
          ] },
        { tipo: 'escolha', id: 'est-rollback', titulo: 'Confira: voltar uma versão',
          pergunta: 'O deploy em prod degradou o serviço. Qual é a forma correta de voltar?',
          opcoes: [
            { id: 'a', texto: 'Reverter o código, recompilar e passar de novo por dev e cert.', correta: false, porque: 'recompilar gera outro artefato, nunca testado, no pior momento. O rollback precisa ser rápido e previsível.' },
            { id: 'b', texto: 'Reimplantar o SHA anterior estável, com o comando que já está no runbook.', correta: true, porque: 'o artefato antigo já existe e já foi testado; voltar é só apontar para ele.' },
            { id: 'c', texto: 'Editar o servidor de produção à mão até o problema sumir.', correta: false, porque: 'correção manual em produção não deixa rastro, não é repetível e pode piorar.' }
          ] },
        { tipo: 'takeaway', html: 'A pergunta de fim de aula: <mark>quem aprova</mark> e <mark>para qual SHA eu volto</mark>? Se você não sabe responder, a esteira não está pronta.' }
      ] }
    ]
  });
})();
