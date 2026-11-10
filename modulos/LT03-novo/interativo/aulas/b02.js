/* LT03 · Bloco 2: APIs declarativas, workloads, rede e configuração. Fonte: LT03.html#b02. Saídas de terminal são exemplo variável, não evidência. */
(function () {
  var L = function (kind, text) { return { kind: kind, text: text }; };
  function opc(id, texto, correta, porque) { return { id: id, texto: texto, correta: correta, porque: porque }; }

  var codigo = [
    'import re', '',
    'PADRAO_SECRETO = re.compile(r"(senha|secret|token|password|passwd|pwd|api[_-]?key)", re.IGNORECASE)', '', '',
    'def seletor_encontra_labels(seletor, labels):',
    '    # todo par do seletor existe identico nas labels; seletor vazio nao casa',
    '    return True', '', '',
    'def recursos_declarados(container):',
    '    # pedido e teto existem, cada um com cpu e memoria',
    '    return True', '', '',
    'def expoe_segredo_em_env(container):',
    '    # env (lista de dicts nome/valor): nome ou valor com padrao de segredo,',
    '    # ou a chave "segredo_literal" presente',
    '    return False', ''].join('\n');

  var solucao = [
    'import re', '',
    'PADRAO_SECRETO = re.compile(r"(senha|secret|token|password|passwd|pwd|api[_-]?key)", re.IGNORECASE)', '', '',
    'def seletor_encontra_labels(seletor, labels):',
    '    for chave, valor in seletor.items():',
    '        if labels.get(chave) != valor:',
    '            return False',
    '    return bool(seletor)', '', '',
    'def recursos_declarados(container):',
    '    recursos = container.get("recursos")',
    '    if not isinstance(recursos, dict):',
    '        return False',
    '    pedido = recursos.get("pedido")',
    '    teto = recursos.get("teto")',
    '    if not isinstance(pedido, dict) or not isinstance(teto, dict):',
    '        return False',
    '    return bool(pedido.get("cpu") and pedido.get("memoria") and teto.get("cpu") and teto.get("memoria"))', '', '',
    'def expoe_segredo_em_env(container):',
    '    ambiente = container.get("env")',
    '    if not isinstance(ambiente, list):',
    '        return False',
    '    for entrada in ambiente:',
    '        if not isinstance(entrada, dict):',
    '            continue',
    '        if PADRAO_SECRETO.search(str(entrada.get("nome", ""))) or PADRAO_SECRETO.search(str(entrada.get("valor", ""))):',
    '            return True',
    '        if "segredo_literal" in entrada:',
    '            return True',
    '    return False', ''].join('\n');

  var testes = [
    'def test_seletor_casa_quando_todos_os_pares_existem():',
    '    assert seletor_encontra_labels({"app": "api"}, {"app": "api", "versao": "2"})', '', '',
    'def test_valor_diferente_nao_casa():',
    '    assert not seletor_encontra_labels({"app": "api"}, {"app": "worker"})', '', '',
    'def test_seletor_vazio_nao_casa():',
    '    assert not seletor_encontra_labels({}, {"app": "api"})', '', '',
    'def test_recursos_completos():',
    '    c = {"recursos": {"pedido": {"cpu": "100m", "memoria": "128Mi"}, "teto": {"cpu": "500m", "memoria": "256Mi"}}}',
    '    assert recursos_declarados(c)', '', '',
    'def test_sem_teto_reprova():',
    '    c = {"recursos": {"pedido": {"cpu": "100m", "memoria": "128Mi"}}}',
    '    assert not recursos_declarados(c)', '', '',
    'def test_segredo_no_nome_da_env():',
    '    assert expoe_segredo_em_env({"env": [{"nome": "DB_SENHA", "valor": "x"}]})', '', '',
    'def test_segredo_literal_marcado():',
    '    assert expoe_segredo_em_env({"env": [{"nome": "X", "segredo_literal": "abc"}]})', '', '',
    'def test_env_limpa_passa():',
    '    assert not expoe_segredo_em_env({"env": [{"nome": "NIVEL_LOG", "valor": "info"}]})', ''].join('\n');

  TrilhaAula.registrar({
    id: 'lt03-b2',
    titulo: 'APIs declarativas, workloads, rede e configuração',
    minutos: 45,
    resumo: 'Aplicar um manifesto registra uma intenção, não um isolamento: selector, probe, request, política de rede e RBAC são objetos que precisam existir e casar.',
    objetivo: 'Explicar o control loop, escolher o workload pelo ciclo de vida, seguir a cadeia regra, Service, selector e endpoints, manter segredo fora de manifesto e env, desenhar default-deny com DNS e RBAC mínimo, e ler o que o validador de manifesto cobra.',
    revisao: [
      { id: 'lt03b2-job', pergunta: 'Uma migração deve rodar uma vez e terminar. Qual workload?',
        opcoes: [
          opc('a', 'Job', true, 'Job é trabalho que termina; sucesso é conclusão contada. Para agenda recorrente, CronJob.'),
          opc('b', 'Deployment com uma réplica', false, 'Deployment reinicia o que termina.'),
          opc('c', 'DaemonSet', false, 'é um agente por nó elegível.'),
          opc('d', 'StatefulSet', false, 'é para identidade estável por réplica.')] },
      { id: 'lt03b2-endpoints', pergunta: 'O Service existe, os Pods estão Running e a lista de endpoints está vazia. Causa mais provável?',
        opcoes: [
          opc('a', 'O selector do Service não casa com as labels dos Pods (ou os Pods não estão prontos)', true, 'selector que não casa produz zero endpoints: serviço no ar, tráfego em lugar nenhum.'),
          opc('b', 'O Deployment precisa de mais réplicas', false, 'réplicas não alteram a seleção.'),
          opc('c', 'A imagem usa :latest', false, 'a tag não afeta endpoints.')] },
      { id: 'lt03b2-segredo', pergunta: 'Onde um segredo pode aparecer em relação ao manifesto versionado?',
        opcoes: [
          opc('a', 'Nunca como literal em env ou manifesto: chega por referência montada na execução', true, 'segredo literal em env é vazamento versionado.'),
          opc('b', 'Em env, se o repositório for privado', false, 'o segredo continua no histórico e na evidência.'),
          opc('c', 'Em ConfigMap, porque é só configuração', false, 'ConfigMap é para dado não sensível.')] },
      { id: 'lt03b2-dns', pergunta: 'Depois de ativar default-deny, até a resolução de nomes parou. O que faltou?',
        opcoes: [
          opc('a', 'Declarar DNS e cada fluxo legítimo na allowlist', true, 'negar o nome derruba tudo antes de qualquer teste de aplicação.'),
          opc('b', 'Mais réplicas do banco', false, 'o problema é de política, não de capacidade.'),
          opc('c', 'Trocar o namespace', false, 'namespace não é isolamento de rede.')] },
      { id: 'lt03b2-liveness', pergunta: 'Qual probe jamais deve consultar banco, fila ou DNS?',
        opcoes: [
          opc('a', 'Liveness', true, 'liveness reinicia: consultar dependência externa converte lentidão alheia em reinício próprio.'),
          opc('b', 'Startup', false, 'startup só suspende as demais enquanto o processo nasce.'),
          opc('c', 'Nenhuma: todas devem consultar o banco', false, 'dependência externa pertence à readiness.')] }
    ],
    abas: [
      { rotulo: 'Declarar e escolher', blocos: [
        { tipo: 'texto', html:
          '<p>Em uma <strong>API declarativa</strong> você descreve o estado desejado e o sistema trabalha até a realidade coincidir. O <strong>desired state</strong> é o documento versionado (réplicas, imagem por digest, portas); o <strong>observed state</strong> é o que existe (Pods rodando, endpoints, conditions). Entre os dois opera o <strong>control loop</strong>: observar, comparar, agir, repetir. Aplicar o manifesto não executa uma sequência: registra uma intenção que controladores perseguem sem parar.</p>' },
        { tipo: 'texto', largo: true, html:
          '<table><thead><tr><th>Termo</th><th>Definição e mecanismo</th><th>Limite</th></tr></thead><tbody>' +
          '<tr><td>Pod</td><td>Menor unidade executável: um ou mais containers com rede, parte do storage e ciclo de vida em comum. Efêmero por desenho.</td><td>Pod isolado para serviço durável não tem reposição.</td></tr>' +
          '<tr><td>Label / selector</td><td>Label é o par chave-valor no objeto; selector é a consulta que seleciona o conjunto. Service e controladores encontram Pods assim.</td><td>Selector sem label correspondente: zero endpoints.</td></tr>' +
          '<tr><td>Owner reference</td><td>Vínculo de posse: quem criou quem e quem limpa quem na exclusão.</td><td>Órfão acumula; dono trocado vira disputa entre controladores.</td></tr>' +
          '<tr><td>Namespace</td><td>Fronteira de nomes e de política: separa ambientes e equipes por nome, quota e permissão.</td><td>Não é isolamento de rede nem de kernel; isso exige NetworkPolicy, quota e security context.</td></tr>' +
          '<tr><td>Condition / evento</td><td>Relato do controlador: pronto, disponível, progredindo, com motivo. Evento conta a história; condition resume o veredito.</td><td>Diagnóstico exige ler condition contra o manifesto, não só a última linha de log.</td></tr>' +
          '</tbody></table>' },
        { tipo: 'texto', html: '<h3>Workload pelo ciclo de vida</h3><p>O erro de entrada é tratar todo workload como réplica genérica. A escolha começa pelas perguntas sobre término, identidade e lugar.</p>' },
        { tipo: 'texto', largo: true, html:
          '<table><thead><tr><th>Workload</th><th>Caso que resolve</th><th>Limite que decide</th></tr></thead><tbody>' +
          '<tr><td>Deployment</td><td>API sem estado, réplicas intercambiáveis: rollout, reposição, escala por número. É o workload da API desta trilha.</td><td>Réplicas são gêmeas: dado que precisa sobreviver ao Pod não mora aqui.</td></tr>' +
          '<tr><td>StatefulSet</td><td>Identidade estável: nome ordinal, rede estável, storage próprio por réplica.</td><td>Identidade cobra ordem e lentidão de escala; para API sem estado é coordenação paga à toa.</td></tr>' +
          '<tr><td>DaemonSet</td><td>Um agente por nó elegível: coleta, proxy local, varredura.</td><td>Multiplica custo automaticamente; fora de agente de nó é réplica sem motivo.</td></tr>' +
          '<tr><td>Job</td><td>Tarefa que termina: migração, lote, verificação. Sucesso é conclusão contada.</td><td>Job que nunca termina é serviço disfarçado; falta deadline e backoff.</td></tr>' +
          '<tr><td>CronJob</td><td>Job sob agenda; cada horário cria um Job filho.</td><td>Agenda não é fila: sobreposição exige política de concorrência e histórico limitado.</td></tr>' +
          '</tbody></table>' },
        { tipo: 'escolha', id: 'b2-escolha-workload', titulo: 'Qual workload?', obrigatorio: false,
          pergunta: 'Um agente de coleta deve rodar exatamente uma vez em cada nó do cluster, nascendo e morrendo com o nó. Qual workload?',
          opcoes: [
            opc('a', 'Deployment com réplicas igual ao número de nós', false, 'não garante um por nó, nem acompanha o nó que entra ou sai.'),
            opc('b', 'DaemonSet', true, 'um por nó elegível, que nasce com o nó e morre com o nó.'),
            opc('c', 'StatefulSet', false, 'dá identidade ordinal, não presença por nó.'),
            opc('d', 'CronJob', false, 'é agenda de tarefa que termina.')] },
        { tipo: 'takeaway', html: 'Escolha o workload por <mark>término</mark>, <mark>identidade</mark> e <mark>lugar</mark>; Deployment é para <mark>réplicas intercambiáveis sem estado</mark>.' }
      ] },

      { rotulo: 'Rede, config e permissão', blocos: [
        { tipo: 'texto', html:
          '<h3>Rede: expor só a API</h3>' +
          '<p>O <strong>Service</strong> é o nome estável diante de Pods instáveis: seleciona por selector, publica endpoints e oferece DNS interno. O worker não recebe Service externo: é alcançado pela fila, não pela rede. <strong>Gateway ou Ingress</strong> é a porta de entrada do cluster e roteia ao Service por regra declarada. A cadeia de seleção é única, e cada elo quebrado tem sintoma próprio.</p>' },
        { tipo: 'ordene', id: 'b2-ordene-cadeia', titulo: 'A cadeia de seleção', obrigatorio: false,
          enunciado: 'Coloque os elos na ordem em que o tráfego externo os atravessa.',
          itens: [
            { id: 'endpoints', texto: 'Endpoints publicam quem está pronto' },
            { id: 'regra', texto: 'Regra do Gateway ou Ingress aponta ao Service' },
            { id: 'pods', texto: 'Pods com as labels correspondentes' },
            { id: 'service', texto: 'Service seleciona Pods pelo selector' }],
          solucao: ['regra', 'service', 'endpoints', 'pods'],
          dica: 'A regra aponta ao Service; o Service consulta; os endpoints listam os prontos; os Pods são o destino.',
          tutorDepois: 'Selector sem label real quebra o elo do meio: o serviço está no ar e muda.' },
        { tipo: 'texto', html:
          '<h3>Configuração, persistência e identidade</h3>' +
          '<ul><li><strong>ConfigMap contra Secret.</strong> ConfigMap carrega dado não sensível. Secret carrega referência sensível, e referência não é cofre: o conteúdo viaja em base legível por quem lê o objeto. Regra do validador: nenhum segredo literal em env de manifesto; segredo chega por referência montada na execução. Config ausente ou chave trocada: o Pod nasce e morre pedindo o que ninguém entregou.</li>' +
          '<li><strong>Efêmero contra durável.</strong> O filesystem do container é efêmero: reinício limpa, recriação apaga, escala espalha. Persistência real é o volume cuja vida supera o Pod, com classe, reclaim e backup pensados.</li>' +
          '<li><strong>ServiceAccount e RBAC mínimo.</strong> Todo Pod fala com a API do cluster sob uma ServiceAccount; o RBAC diz quais verbos sobre quais recursos. Mínimo é exatamente o necessário: a conta da API não carrega os verbos do worker, e vice-versa. Security context declara usuário, filesystem read-only e capacidades descartadas; os Pod Security Standards convertem isso em patamares exigíveis por namespace.</li></ul>' +
          '<p>&ldquo;Apliquei, então está isolado e autorizado&rdquo; é a ilusão central. Isolamento vem de NetworkPolicy que seleciona os Pods certos, RBAC preso à conta certa e selector com label real.</p>' },
        { tipo: 'texto', html:
          '<h3>Default-deny e allowlist</h3>' +
          '<p><strong>NetworkPolicy</strong> filtra tráfego entre Pods por endereço e porta. Por padrão tudo passa; com default-deny no namespace, nada passa exceto a allowlist. A regra da trilha: nega tudo e libera o estrito. A API recebe da porta de entrada, o worker fala com fila e banco, o banco só ouve o worker. <strong>O DNS precisa constar</strong>, porque negar o nome derruba tudo antes de qualquer teste de aplicação. Limite arquitetural: a política só vale onde o <strong>CNI</strong> a implementa; em plugin que ignora a API, o manifesto correto é carta sem carteiro.</p>' },
        { tipo: 'transcript', id: 'b2-transcript', titulo: 'Ache a afirmação que o manifesto não sustenta', obrigatorio: false, terminalTitulo: 'revisão de manifesto',
          enunciado: 'O agente revisa o Deployment da API e dá um parecer. Uma afirmação contradiz o que o manifesto mostra. Clique na linha e aperte Conferir.',
          linhas: [
            { quem: 'voce', texto: 'Revise o container da API antes do merge.' },
            { quem: 'ferramenta', texto: '$ cat api-deployment.yaml (trecho, exemplo)\ncontainer: api\nimagem: registry.exemplo/api@sha256:aaa\nenv:\n  - nome: DB_SENHA\n    valor: "abc123"\nsondas: {prontidao: ..., vivacidade: ...}\nrecursos: {pedido: {cpu: 100m, memoria: 128Mi}, teto: {cpu: 500m, memoria: 256Mi}}' },
            { quem: 'agente', texto: 'A imagem é pinada por digest, então a identidade do artefato está garantida.' },
            { quem: 'agente', texto: 'Há pedido e teto de CPU e memória, e as duas probes obrigatórias estão presentes.' },
            { quem: 'agente', texto: 'Não há segredo no manifesto, pode mergear.' }
          ],
          erradas: [4],
          explicacao: { 4: 'a env <code>DB_SENHA</code> carrega um valor literal: é segredo em env, vazamento versionado. O validador acusaria <code>segredo em env</code>. O segredo deve chegar por referência montada na execução.' },
          tutorDepois: 'As duas primeiras afirmações são sustentadas pelo manifesto. O parecer final ignorou a env.' },
        { tipo: 'takeaway', html: 'Aplicar registra <mark>intenção</mark>; isolamento e autorização vêm de objetos que precisam <mark>existir e casar</mark>: política com <mark>DNS</mark>, RBAC mínimo e <mark>segredo por referência</mark>.' }
      ] },

      { rotulo: 'Probes, recursos e rollout', blocos: [
        { tipo: 'texto', html:
          '<p>Declarar é contratar reação: selector contrata endpoints, probe contrata tráfego ou reinício, request contrata agendamento, limit contrata contenção, política contrata bloqueio. Manifesto incompleto não é simples: é contrato em branco que o cluster preenche com padrão silencioso. O validador existe para recusar o branco antes que vire incidente.</p>' +
          '<ul><li><strong>Startup</strong> suspende as demais enquanto o processo nasce. <strong>Readiness</strong> remove o Pod dos endpoints sem matar o processo. <strong>Liveness</strong> reinicia o container, e jamais consulta banco, fila ou DNS.</li>' +
          '<li><strong>Request</strong> é a reserva do agendador; <strong>limit</strong> é o teto imposto (CPU estrangulada, memória com OOMKill). QoS: garantida (pedido e teto coincidem), intermediária (parte), oportunista (nada declarado). Valor sem medição é hipótese; a prova está no Bloco 3.</li>' +
          '<li><strong>HPA</strong> é um control loop atrasado, depende de requests declarados, não cria capacidade instantânea e não corrige dependência saturada.</li></ul>' },
        { tipo: 'quebre', id: 'b2-quebre-rollout', titulo: 'Rollout travado por readiness',
          enunciado: 'Simulação determinística de <code>simular_rollout.py</code>: 3 réplicas, <code>max_indisponiveis=0</code>. As linhas são o resultado do contrato calculado à mão; rótulo: exemplo. Escolha uma falha, rode e depois rode &ldquo;Sem falha&rdquo;.',
          prefixo: '$', entrada: 'simular(3, sequencia_prontidao, 0)', unidade: 'passo', terminalTitulo: 'simulador (exemplo)',
          prever: { pergunta: 'Qual regra o rollout aplica antes de remover uma réplica antiga?', opcoes: [
            { id: 'a', texto: 'Remove por tempo decorrido, para cumprir o prazo.', correta: false, porque: 'sem nenhuma réplica nova pronta, nada sai: a trava de readiness é absoluta.' },
            { id: 'b', texto: 'Só remove antigas quando há nova pronta; sem nenhuma pronta, nada sai e a antiga fica preservada.', correta: true, porque: 'o rollout só avança sobre readiness; falha aborta antes de 100%.' },
            { id: 'c', texto: 'Remove todas as antigas de uma vez para trocar rápido.', correta: false, porque: 'isso derrubaria o serviço.' }
          ] },
          etapas: [
            { id: 'p1', nome: 'Réplica 1', descricao: 'Nova pronta, antiga sai', tom: 'dns', ms: 1, linhas: [L('out', 'prontas=1,removidas=1')] },
            { id: 'p2', nome: 'Réplica 2', descricao: 'Nova pronta, antiga sai', tom: 'request', ms: 1, linhas: [L('out', 'prontas=2,removidas=2')] },
            { id: 'p3', nome: 'Réplica 3', descricao: 'Última troca', tom: 'response', ms: 1, linhas: [L('out', 'prontas=3,removidas=3'), L('in', '{"removidas": 3, "concluiu": true}')] }
          ],
          falhas: [
            { id: 'nunca-pronta', rotulo: 'Readiness nunca fica verdadeira', efeito: { etapaFalha: 'p1', linhasErro: [
              L('out', 'prontas=0,removidas=0'), L('out', 'prontas=0,removidas=0'), L('out', 'prontas=0,removidas=0'),
              L('in', '{"removidas": 0, "concluiu": false}'), L('hint', 'versão antiga preservada, rollout parado')
            ], tutor: 'sem nenhuma nova pronta, <code>passo</code> devolve <code>removiveis=0</code>. O rollout não avança sobre réplica despreparada.' } }
          ],
          tutorDepois: 'Readiness ausente ou indisponibilidade máxima permissiva demais faz a troca andar sem prova.',
          callout: 'Você viu o rollout só avançar sobre readiness e abortar com a antiga preservada.' },
        { tipo: 'python', id: 'b2-python', titulo: 'Escreva três checagens do validador', obrigatorio: false,
          enunciado: 'Implemente <code>seletor_encontra_labels</code>, <code>recursos_declarados</code> e <code>expoe_segredo_em_env</code>, recortes de <code>lab/validar_manifesto.py</code>. Manifestos são dicts puros (chaves em português), sem PyYAML.',
          codigo: codigo, testes: testes,
          dica: 'No seletor, todo par precisa existir idêntico nas labels e o seletor vazio não casa. Em recursos, confira <code>pedido</code> e <code>teto</code> com <code>cpu</code> e <code>memoria</code>. Na env, procure o padrão no nome e no valor.',
          solucao: solucao,
          tutorDepois: 'O seletor vazio não casa: sem essa regra, um Service sem selector pareceria saudável.',
          callout: 'As três checagens passaram nos testes, com o caso negativo de cada defeito.' },
        { tipo: 'cenario', id: 'b2-cenario', titulo: 'Default-deny derrubou tudo', obrigatorio: false,
          enunciado: 'Você ativou default-deny no namespace e a comunicação legítima falhou, até a resolução de nomes.',
          inicio: 'inicio',
          nos: {
            inicio: { texto: 'A API não alcança o banco e nenhum nome resolve. O que você faz?', opcoes: [
              { texto: 'Remover a política de default-deny para recuperar o serviço.', vai: 'f-remove', tom: 'ruim', consequencia: 'o serviço volta, e o isolamento some junto.' },
              { texto: 'Declarar DNS e cada fluxo legítimo na allowlist, e manter testes positivos e negativos.', vai: 'cni', tom: 'ok', consequencia: 'a negação passa a cobrir só o que deve.' }] },
            cni: { texto: 'A allowlist está certa, mas o teste negativo mostra que o tráfego proibido ainda passa. Qual a primeira hipótese?', opcoes: [
              { texto: 'O CNI do cluster não implementa NetworkPolicy: a política é carta sem carteiro.', vai: 'f-bom', tom: 'ok', consequencia: 'a dependência do CNI fica registrada e a política só é confiável onde ele a aplica.' },
              { texto: 'A allowlist precisa de IPs fixos dos Pods.', vai: 'f-ip', tom: 'ruim', consequencia: 'Pods são efêmeros; a allowlist vira lista de IPs que envelhece.' }] }
          },
          finais: {
            'f-bom': { bom: true, texto: 'Política com DNS explícito, testes positivos e negativos e a dependência do CNI registrada.' },
            'f-remove': { bom: false, texto: 'Sem política, o tráfego atravessa onde não deveria e ninguém percebe.' },
            'f-ip': { bom: false, texto: 'A lista de IPs quebra a cada reposição de Pod.' }
          },
          callout: 'Você manteve o default-deny, liberou o estrito e registrou o limite do CNI.' },
        { tipo: 'escreva', id: 'b2-escreva', titulo: 'Desenhe contas e segredos', obrigatorio: false,
          enunciado: 'O worker precisa da fila e do banco; a API precisa da porta de entrada. Desenhe contas, permissões e segredos: quem pode o quê, onde o segredo mora e onde jamais aparece.',
          placeholder: 'Contas, verbos, onde mora o segredo, onde nunca aparece e o custo de cada violação.',
          rubrica: [
            'Contas distintas por workload, com verbos mínimos (a API não carrega os do worker nem o contrário).',
            'Segredo por referência montada na execução, ausente de manifesto, env e evidência.',
            'Custo de cada violação (conta ampla funciona até funcionar demais; segredo versionado é vazamento).'],
          modelo: '<p>Duas ServiceAccounts, uma por workload, cada uma só com os verbos que usa; a conta da API não alcança a fila nem o banco, e o worker não herda a credencial da API. Segredos moram em cofre ou Secret e chegam por referência na execução; nunca aparecem em manifesto versionado, env literal, log ou evidência. Conta compartilhada amplia o dano de qualquer comprometimento; segredo em env vira vazamento versionado.</p><p><strong>Reprova:</strong> aprovar conta compartilhada ou segredo em env.</p>' },
        { tipo: 'escolha', id: 'b2-escolha-liveness', titulo: 'Confira: reinício sem deadlock',
          pergunta: 'A lentidão do banco reinicia containers saudáveis, em restart loop, sem deadlock interno. O que o validador acusaria e qual o conserto?',
          opcoes: [
            opc('a', 'Liveness consulta dependência externa; mantê-la só sobre estado interno e mover a dependência para a readiness.', true, 'falha alheia vira reinício próprio; dependência externa pertence à readiness.'),
            opc('b', 'Aumentar o limit de memória.', false, 'não há OOMKill descrito; o reinício vem da liveness.'),
            opc('c', 'Remover a readiness.', false, 'a readiness só drena tráfego; remover não corrige o reinício.')] },
        { tipo: 'callout', tom: 'info', titulo: 'Fontes e validade', html:
          '<p>Kubernetes 1.36.2 na data-base (risco alto, revalidar em até 90 dias): releases, workload controllers, NetworkPolicy, RBAC good practices, probes, resource management e HPA. Os contratos dos dois scripts e as timelines são construção da trilha, medidos na folha B02-L e na trilha externa; qualquer número aqui é exemplo variável, não evidência. Apply real, convergência e testes de rede ficam na trilha externa com cluster.</p>' },
        { tipo: 'takeaway', html: 'Manifesto incompleto é <mark>contrato em branco</mark>: o validador recusa o que falta antes que o <mark>padrão silencioso</mark> vire incidente.' }
      ] }
    ]
  });
})();
