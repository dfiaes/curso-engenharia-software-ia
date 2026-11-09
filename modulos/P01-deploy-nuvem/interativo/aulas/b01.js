/* P01 · Bloco 1: onde rodar. Fonte: P01.html#b01. Verificado nas fontes oficiais em 11/10/2026 (padrões de escala 0/10, regra HTTP de 10 requisições, ingresso de 240 s, App Runner sem novos clientes). Preços e limites mudam: revalidar em até 90 dias. */
(function () {
  var L = function (kind, text) { return { kind: kind, text: text }; };
  function opc(id, texto, correta, porque) { return { id: id, texto: texto, correta: correta, porque: porque }; }

  var etapasEscala = function () {
    return [
      { id: 'carga', nome: 'Carga', descricao: 'Streams simultâneos', tom: 'dns', ms: 6, linhas: [
        L('info', 'entrada: 50 req/s, cada resposta em streaming por 60 s, CPU média 15%'),
        L('out', 'simultâneas = 50 req/s x 60 s = 3000 streams abertos'),
        L('hint', 'repare: o número que cresce é a concorrência, não a CPU')] },
      { id: 'regra', nome: 'Regra HTTP', descricao: '10 simultâneas por réplica', tom: 'tcp', ms: 10, linhas: [
        L('out', 'regra http-concurrency: 3000 / 10 = 300 réplicas pedidas'),
        L('hint', 'sem regra definida, os padrões da plataforma são mínimo 0, máximo 10 e 10 simultâneas por réplica')] },
      { id: 'teto', nome: 'Teto de réplicas', descricao: 'maxReplicas manda', tom: 'tls', ms: 8, linhas: [
        L('out', 'maxReplicas padrão = 10 -> 10 réplicas, cada uma com 300 streams (30x o alvo)'),
        L('out', 'limite da plataforma: 1.000 réplicas por revisão -> o teto de 300 cabe, mas precisa ser configurado'),
        L('hint', 'o teto protege a conta e o provedor; escolhido baixo demais, vira saturação')] },
      { id: 'cpu', nome: 'Sinal de CPU', descricao: 'O que uma regra por CPU enxerga', tom: 'request', ms: 4, linhas: [
        L('out', 'CPU média das réplicas: 15% (limiar de exemplo para escalar por CPU: 70%)'),
        L('out', 'regra por CPU: não dispara; as conexões abertas estão saturando a réplica e ninguém é avisado'),
        L('hint', 'o serviço é dominado por espera de E/S: a CPU engana')] },
      { id: 'ingresso', nome: 'Ingresso', descricao: 'Tempo máximo de requisição: 240 s', tom: 'response', ms: 5, linhas: [
        L('out', 'stream de 60 s: cabe nos 240 s do ingresso HTTP'),
        L('out', 'stream de 300 s: cortado aos 240 s -> keepalive SSE, retomada ou resposta assíncrona por job')] },
      { id: 'veredito', nome: 'Veredito', descricao: 'O sinal certo e o teto certo', tom: 'ink', ms: 2, linhas: [
        L('in', 'escalar por requisições simultâneas por réplica; subir maxReplicas conforme o número que sustenta')] }
    ];
  };

  TrilhaAula.registrar({
    id: 'p01-b1',
    titulo: 'Onde rodar: do IaaS ao Kubernetes, e por que Container Apps',
    minutos: 30,
    resumo: 'A escolha de plataforma depende da forma da carga, e a carga de um serviço com LLM é espera de E/S com conexões longas. Container Apps encaixa sem exigir cluster; as outras opções têm cenários nomeáveis.',
    objetivo: 'Descrever a forma da carga de um serviço com LLM, escolher o sinal de escala, comparar Container Apps com App Service, Functions, AKS e VM, e decidir mínimo de réplicas com um número que sustente a decisão.',
    revisao: [
      { id: 'p01b1-sinal', pergunta: 'Um serviço de LLM com streaming de até 60 s está lento sob carga, com CPU em 15%. Qual sinal deve guiar a regra de escala?',
        opcoes: [
          opc('a', 'Requisições simultâneas por réplica', true, 'o serviço passa quase todo o tempo esperando o modelo; a CPU engana, e a concorrência acompanha o que de fato se esgota.'),
          opc('b', 'Percentual de CPU', false, 'regra de serviços limitados por CPU; aqui reagiria tarde e pouco.'),
          opc('c', 'Tamanho da imagem do contêiner', false, 'o tamanho da imagem não mede carga.')] },
      { id: 'p01b1-estado', pergunta: 'Um limite de 10 req/min por usuário guardado em memória, com N réplicas, vale na prática:',
        opcoes: [
          opc('a', '10 por réplica, ou seja, 10 x N', true, 'o contador mora em cada processo; o balanceador distribui, e o limite só vale com armazenamento compartilhado.'),
          opc('b', '10 por usuário, como no teste local', false, 'o teste local roda um processo só; com várias réplicas o limite se multiplica.'),
          opc('c', '10 dividido por N', false, 'a memória não é compartilhada, então nada divide o limite.')] },
      { id: 'p01b1-240', pergunta: 'No Container Apps, o que acontece com um stream de 300 s pelo ingresso HTTP?',
        opcoes: [
          opc('a', 'É cortado aos 240 s, o tempo máximo de requisição', true, 'o desenho precisa prever o corte: keepalive SSE, retomada ou resposta assíncrona por job.'),
          opc('b', 'Passa, porque o ingresso não tem limite', false, 'o ingresso HTTP tem tempo máximo de requisição de 240 segundos.'),
          opc('c', 'A plataforma aumenta o limite automaticamente', false, 'o limite é fixo e o desenho é que se adapta.')] },
      { id: 'p01b1-padroes', pergunta: 'Sem nenhuma regra de escala definida, quais são os padrões do Container Apps?',
        opcoes: [
          opc('a', 'Mínimo 0, máximo 10 e a regra HTTP com 10 requisições simultâneas por réplica', true, 'por revisão a plataforma aceita de 0 a 1.000 réplicas; escalar a zero não cobra uso enquanto parado.'),
          opc('b', 'Mínimo 1, máximo 100 e escala por CPU', false, 'os padrões são 0, 10 e a regra HTTP, não CPU.'),
          opc('c', 'Mínimo 1, máximo 1 e sem regra', false, 'sem regra, a plataforma aplica 0 a 10 com a regra HTTP.')] },
      { id: 'p01b1-aks', pergunta: 'Qual motivo é legítimo para preferir AKS a Container Apps?',
        opcoes: [
          opc('a', 'Precisar de CRDs e operadores, GPU dedicada ou malha de serviço, tendo quem opere o cluster', true, 'AKS compensa quando você usa o ecossistema Kubernetes completo e aceita operar versões, nós, ingress e upgrades.'),
          opc('b', 'Tráfego baixo e só em horário comercial', false, 'é argumento a favor de Container Apps (escala a zero, menos operação).'),
          opc('c', 'Evitar escrever YAML ou Bicep', false, 'Kubernetes exige ainda mais manifestos.')] }
    ],
    abas: [
      { rotulo: 'A forma da carga', blocos: [
        { tipo: 'texto', html: [
          '<h3>Por que a plataforma é a decisão mais cara de desfazer</h3>',
          '<p>A escolha de plataforma define o formato do artefato, o modelo de escala, a conta no fim do mês e quem acorda às três da manhã. Times costumam escolher pela familiaridade ("já temos AKS") ou pela promessa ("serverless não custa nada parado"). As duas razões são verdadeiras e incompletas. O que decide é a <strong>forma da carga</strong>, e a carga de um serviço com LLM tem uma forma bem particular.</p>',
          '<p>Pré-requisitos: <strong>LT03</strong> (IaC e plataforma em geral) e <strong>M05</strong> (chamada de LLM, gateway, custo). Neste módulo o exemplo condutor é o serviço do laboratório, um orquestrador fino que recebe um prompt, repassa ao modelo e devolve tokens em streaming. O alvo é o Azure, mas o que se ensina são invariantes: artefato imutável, identidade em vez de segredo, infraestrutura declarativa, sinais antes de alertas, rollback por troca de tráfego.</p>'
        ].join('') },
        { tipo: 'texto', html: [
          '<h3>Cinco propriedades da carga</h3>',
          '<p>Para o seu processo, a chamada ao modelo é uma requisição HTTP de segundos a minutos, frequentemente em streaming. Isso tem cinco consequências.</p>'
        ].join('') },
        { tipo: 'abas', rotulo: 'Propriedades', itens: [
          { rotulo: 'Quase tudo é espera', blocos: [{ tipo: 'texto', html: '<p>O serviço recebe um prompt, repassa e aguarda tokens. A CPU fica baixa e a memória cresce com o número de conexões abertas. Uma réplica de 0,5 vCPU atende dezenas de streams simultâneos, <strong>desde que o código seja assíncrono</strong>. O serviço do lab é: um produtor por stream, fila limitada, cancelamento no <code>finally</code>.</p>' }] },
          { rotulo: 'Sinal de carga', blocos: [{ tipo: 'texto', html: '<p>O sinal de carga é <strong>concorrência</strong>, não CPU. Escalar por CPU reagiria tarde e pouco. A regra natural é "requisições simultâneas por réplica". A concorrência esperada vem de uma conta simples: taxa de chegada vezes duração de cada requisição (50 req/s com streams de 60 s mantêm cerca de 3.000 abertos).</p>' }] },
          { rotulo: 'Conexões longas', blocos: [{ tipo: 'texto', html: '<p>Ingress, balanceador e proxies têm limites de tempo e de ociosidade. No Container Apps o ingresso HTTP tem <strong>tempo máximo de requisição de 240 segundos</strong>: um stream mais longo é cortado. O desenho precisa prever isso com keepalive SSE, retomada ou resposta assíncrona por job.</p>' }] },
          { rotulo: 'Modelo remoto', blocos: [{ tipo: 'texto', html: '<p>O modelo não roda na sua máquina. Você paga tokens ao provedor e um pouco de computação à plataforma. Se você hospeda o modelo (GPU, inferência própria), a análise é outra e entra no M11; aqui o serviço é um <strong>orquestrador fino</strong>.</p>' }] },
          { rotulo: 'Estado externo', blocos: [{ tipo: 'texto', html: '<p>Com N réplicas, qualquer contador, cache ou sessão em memória passa a valer <strong>por réplica</strong>. Um limite de "10 req/min por usuário" em memória vira 10 por réplica, ou seja, 10 x N.</p>' }] }
        ] },
        { tipo: 'callout', tom: 'info', titulo: 'Fundamento: serviço sem estado local', html: '<p>Plataformas que escalam horizontalmente assumem <strong>réplicas intercambiáveis</strong>: podem nascer, morrer e ser reiniciadas a qualquer momento, e o balanceador não sabe de nada que esteja só na memória de uma delas. Tudo que precisa sobreviver a isso (sessões, filas, limites por usuário, cache compartilhado, resultado de job) vive em um serviço externo: banco, Redis, fila. O disco do contêiner é efêmero. O lab segue a regra: o serviço não guarda nada entre requisições.</p>' },
        { tipo: 'takeaway', html: 'Serviço de LLM é <mark>E/S pura com conexões longas</mark>: o sinal de carga é a <mark>concorrência</mark>, o estado mora <mark>fora do processo</mark> e o ingresso corta o stream aos <mark>240 s</mark>.' }
      ] },

      { rotulo: 'Escolher a plataforma', blocos: [
        { tipo: 'texto', html: [
          '<h3>O espectro de plataformas</h3>',
          '<p>Cada degrau transfere responsabilidade do seu time para o provedor e, em troca, tira alguma liberdade. As perguntas que ordenam o espectro: quem aplica patch no sistema operacional, qual é a unidade de escala, como se cobra, o que o processo pode fazer (conexões longas, estado local, portas) e quanto você controla a rede.</p>',
          '<p>Da esquerda (mais controle de SO e rede, mais operação) para a direita (mais abstração, menos botões): <strong>VM</strong> (Virtual Machines: você cuida de SO, runtime, escala e patches), <strong>App Service</strong> (plano fixo de VMs, slots, sem escala a zero), <strong>Container Apps</strong> (revisões, KEDA, escala a zero; é a escolha deste módulo), <strong>Functions</strong> (gatilho e invocação, limite por execução) e <strong>AKS</strong> (você opera nós, upgrades, ingress e CRDs).</p>',
          '<p>O AKS aparece à direita no eixo "operação própria", embora seja o mais flexível: flexibilidade e carga operacional crescem juntas.</p>'
        ].join('') },
        { tipo: 'texto', html: [
          '<h3>Por que Container Apps para este serviço</h3>',
          '<p>O <strong>Azure Container Apps</strong> é uma plataforma de contêineres sem cluster visível. Por baixo há Kubernetes, KEDA (escala por evento), Envoy (ingresso) e, opcionalmente, Dapr; você não recebe <code>kubectl</code> nem CRDs. Para a forma de carga da aba anterior, as peças que importam são estas.</p>'
        ].join('') },
        { tipo: 'abas', rotulo: 'Peças do Container Apps', itens: [
          { rotulo: 'Ambiente', blocos: [{ tipo: 'texto', html: '<p>O <strong>ambiente</strong> (<code>managedEnvironments</code>) é a fronteira de rede e de logs. Vários apps compartilham um ambiente.</p>' }] },
          { rotulo: 'Revisões', blocos: [{ tipo: 'texto', html: '<p>Cada mudança de <code>template</code> (imagem, variáveis, escala) cria uma <strong>revisão</strong> imutável e nomeada <code>&lt;app&gt;--&lt;sufixo&gt;</code>. No modo <em>múltiplo</em> várias ficam ativas e você divide o tráfego por porcentagem. No modo <em>único</em> (o padrão) a plataforma só troca para a nova depois que ela passa nas probes. Esse é o mecanismo de canário e rollback do bloco 6.</p>' }] },
          { rotulo: 'Escala', blocos: [{ tipo: 'texto', html: '<p>De <strong>0 a 1.000 réplicas por revisão</strong>. Quando você não define regra, os padrões são mínimo 0, máximo 10 e a regra HTTP com 10 requisições simultâneas por réplica. Escalar a zero não cobra uso enquanto parado.</p>' }] },
          { rotulo: 'Cobrança', blocos: [{ tipo: 'texto', html: '<p>O plano <strong>Consumption</strong> cobra vCPU e memória por segundo, com preço menor para réplica ociosa, mais uma franquia mensal por assinatura (na página oficial, em 11/10/2026: 180.000 vCPU-segundos, 360.000 GiB-segundos e 2 milhões de requisições). Os valores unitários mudam por região e data: <strong>trate qualquer número de preço neste módulo como exemplo</strong>.</p>' }] },
          { rotulo: 'Integrações', blocos: [{ tipo: 'texto', html: '<p>Identidade gerenciada, referência a segredo no Key Vault, pull de imagem do ACR por identidade e logs para o Log Analytics, tudo nativo.</p>' }] },
          { rotulo: 'Limites', blocos: [{ tipo: 'texto', html: '<p>O preço da simplicidade: sem acesso ao plano de controle do Kubernetes, ingresso com o tempo máximo de requisição citado, opções de rede mais restritas que no AKS e arquitetura de contêiner <code>linux/amd64</code>. Uma imagem construída em um Mac com Apple Silicon e publicada sem <code>--platform</code> falha na partida com <code>exec format error</code>.</p>' }] }
        ] },
        { tipo: 'texto', largo: true, html: [
          '<h3>Quando escolher outra coisa</h3>',
          '<table><thead><tr><th>Plataforma</th><th>Escolha quando</th><th>Custo que você aceita</th></tr></thead><tbody>',
          '<tr><td><strong>Container Apps</strong></td><td>API ou worker em contêiner, carga irregular, quer revisões e escala a zero sem operar cluster.</td><td>Sem Kubernetes "de verdade"; limites de ingresso e de rede; imagem amd64.</td></tr>',
          '<tr><td><strong>App Service</strong> (web app, contêiner ou código)</td><td>Time já opera, carga estável e previsível, precisa de <em>deployment slots</em> com swap, integração madura com domínio e certificado, autenticação embutida.</td><td>Paga o plano (VMs) mesmo ocioso; escala em nível de plano; menos granular que revisões.</td></tr>',
          '<tr><td><strong>Functions</strong></td><td>Trabalho orientado a evento (fila, timer, blob), curto, sem servidor HTTP longo. Também como cola de integração.</td><td>Modelo de execução por invocação e limites de duração; difícil encaixar um servidor ASGI com SSE longo.</td></tr>',
          '<tr><td><strong>AKS</strong></td><td>Plataforma interna para muitos times, operadores e CRDs, GPU em nós dedicados, malha de serviço, políticas de rede finas, portabilidade para outro Kubernetes.</td><td>Você opera versões, nós, ingress, upgrades e segurança do cluster. O ganho só aparece se você usa o que ele oferece a mais (veja o LT03).</td></tr>',
          '<tr><td><strong>VM</strong></td><td>Software legado, agente que exige acesso ao SO, licença atrelada a máquina.</td><td>Patches, imagem, escala e disponibilidade são seus.</td></tr>',
          '</tbody></table>'
        ].join('') },
        { tipo: 'texto', largo: true, html: [
          '<h3>Equivalentes em AWS e GCP</h3>',
          '<p>Os invariantes são os mesmos; só mudam os nomes. A tabela cobre o que este módulo usa. Confira a disponibilidade atual antes de decidir: produtos de nicho mudam de estado com frequência. O AWS App Runner, por exemplo, deixou de aceitar novos clientes, e a AWS indica o ECS Express Mode como caminho (verificado em 11/10/2026).</p>',
          '<table><thead><tr><th>Papel</th><th>Azure</th><th>AWS</th><th>GCP</th></tr></thead><tbody>',
          '<tr><td>Contêiner gerenciado, escala a zero ou perto</td><td>Container Apps</td><td>ECS em Fargate (Express Mode para o caso simples)</td><td>Cloud Run</td></tr>',
          '<tr><td>Web app em plano fixo</td><td>App Service</td><td>Elastic Beanstalk (legado), ECS/Fargate</td><td>App Engine</td></tr>',
          '<tr><td>Função por evento</td><td>Functions</td><td>Lambda</td><td>Cloud Run functions</td></tr>',
          '<tr><td>Kubernetes gerenciado</td><td>AKS</td><td>EKS</td><td>GKE</td></tr>',
          '<tr><td>Registro de imagens</td><td>Azure Container Registry</td><td>ECR</td><td>Artifact Registry</td></tr>',
          '</tbody></table>'
        ].join('') },
        { tipo: 'callout', tom: 'danger', titulo: 'Armadilha que pega sênior: cold start sem medir, ou minReplicas 1 "por segurança"', html: '<p>Escala a zero é ótimo para um serviço interno usado em horário comercial e ruim para uma API cuja primeira requisição após a madrugada vai esperar a imagem ser puxada e a aplicação subir (segundos). Já uma réplica sempre ligada, mesmo ociosa, cobra por segundo o mês inteiro, e a conta pequena se multiplica por revisão ativa, por ambiente e por serviço. <strong>Decida com a distribuição real de tráfego e uma medição de partida a frio, e registre a decisão com o número que a sustenta.</strong></p>' },
        { tipo: 'callout', tom: 'danger', titulo: 'Armadilha que pega sênior: rate limit em memória com várias réplicas', html: '<p>O teste local passa (um processo), a produção deixa passar N vezes o limite, e o problema só aparece na conta ou no provedor devolvendo 429. Limite por usuário e orçamento de tokens exigem armazenamento compartilhado (M12). Neste módulo o contrapeso é <code>maxReplicas</code>, que limita o dano.</p>' },
        { tipo: 'takeaway', html: 'Container Apps entrega <mark>revisões, escala por requisições e identidade</mark> sem cluster; <mark>App Service, Functions e AKS</mark> ganham em cenários que você deve saber nomear, e a escolha vale o <mark>número que a sustenta</mark>.' }
      ] },

      { rotulo: 'Ver e praticar', blocos: [
        { tipo: 'texto', html: '<p>Uma API recebe rajadas de até 50 req/s, cada resposta faz streaming por 60 s e o gargalo é esperar o provedor de modelo. O simulador abaixo faz a conta com as regras que você acabou de ler (a conta de concorrência é taxa vezes duração; os limites vêm da documentação). Antes do Enter, preveja o número de réplicas que a regra pede.</p>' },
        { tipo: 'rode', id: 'p01b1-rode', titulo: 'Conte as réplicas que a regra pede', enunciado: 'Rode o simulador de escala e clique em cada etapa para ler só as linhas dela. Saída calculada pela regra, sem nuvem real.',
          prefixo: '$', entrada: 'python escala.py --rps 50 --stream 60 --cpu 15', unidade: 'passo', terminalTitulo: 'simulador de escala', etapas: etapasEscala(),
          prever: { pergunta: 'Com 50 req/s e streams de 60 s, a regra HTTP de 10 simultâneas por réplica pede quantas réplicas?', opcoes: [
            { id: 'a', texto: '5 réplicas: 50 req/s dividido por 10.', correta: false, porque: 'a conta de réplicas parte das conexões abertas, não da taxa de chegada: cada requisição fica aberta por 60 s.' },
            { id: 'b', texto: '300 réplicas: 3000 streams abertos dividido por 10.', correta: true, porque: '50 req/s x 60 s mantêm 3000 streams abertos, e a regra pede uma réplica a cada 10 simultâneas.' },
            { id: 'c', texto: '3000 réplicas: uma por stream.', correta: false, porque: 'a regra agrupa 10 simultâneas por réplica, não uma por requisição.' }
          ] },
          tutorAntes: 'Escolha a previsão, digite o comando já preenchido e aperte Enter. Depois clique em "Teto de réplicas" para ler só essa etapa.',
          tutorDepois: 'A regra pede 300 réplicas, mas o teto padrão de 10 deixaria cada réplica com 300 streams. A CPU de 15% nunca dispararia uma regra por CPU. O sinal certo é a concorrência, e o teto precisa ser decidido com o número na mão.',
          callout: 'Você viu a concorrência, e não a CPU, pedir 300 réplicas, e o teto padrão de 10 limitar isso.' },
        { tipo: 'python', id: 'p01b1-python', titulo: 'Calcule o plano de escala', obrigatorio: false,
          enunciado: 'Complete <code>plano_escala(rps, duracao_s, por_replica=10, minimo=0, maximo=10)</code>. Calcule as <code>concorrentes</code> (taxa x duração), o <code>pedido</code> (réplicas que a regra pede, arredondando para cima), as <code>replicas</code> efetivas (pedido limitado entre mínimo e máximo) e <code>saturado</code> (o pedido passou do teto). Devolva um dict com essas quatro chaves. <code>por_replica</code> menor que 1 é erro de configuração: levante <code>ValueError</code>.',
          codigo: 'import math\n\n\ndef plano_escala(rps, duracao_s, por_replica=10, minimo=0, maximo=10):\n    if por_replica < 1:\n        raise ValueError("por_replica deve ser >= 1")\n    concorrentes = 0  # 1. taxa de chegada x duração de cada requisição\n    pedido = 0  # 2. réplicas pedidas pela regra, arredondando para cima\n    replicas = 0  # 3. pedido limitado entre minimo e maximo\n    saturado = False  # 4. o pedido passou do teto?\n    return {"concorrentes": concorrentes, "pedido": pedido, "replicas": replicas, "saturado": saturado}\n\n\nprint(plano_escala(50, 60))\n',
          testes: 'def test_padroes_da_plataforma():\n    p = plano_escala(50, 60)\n    assert p == {"concorrentes": 3000, "pedido": 300, "replicas": 10, "saturado": True}\n\n\ndef test_teto_alto_atende_tudo():\n    p = plano_escala(50, 60, maximo=1000)\n    assert p["replicas"] == 300 and p["saturado"] is False\n\n\ndef test_escala_a_zero_e_minimo_um():\n    assert plano_escala(0, 60)["replicas"] == 0\n    assert plano_escala(0, 60, minimo=1)["replicas"] == 1\n\n\ndef test_arredonda_para_cima():\n    assert plano_escala(0.5, 20)["pedido"] == 1\n    assert plano_escala(1, 11)["pedido"] == 2\n\n\ndef test_falha_configuracao_invalida():\n    try:\n        plano_escala(5, 10, por_replica=0)\n    except ValueError:\n        return\n    raise AssertionError("esperava ValueError")\n\n\ndef test_controle_negativo_carga_pequena_nao_satura():\n    p = plano_escala(1, 5)\n    assert p["pedido"] == 1 and p["replicas"] == 1 and p["saturado"] is False\n',
          dica: 'A concorrência é <code>rps * duracao_s</code>. Para arredondar para cima use <code>math.ceil(concorrentes / por_replica)</code>. As réplicas são <code>min(max(pedido, minimo), maximo)</code> e saturado é <code>pedido &gt; maximo</code>.',
          solucao: 'import math\n\n\ndef plano_escala(rps, duracao_s, por_replica=10, minimo=0, maximo=10):\n    if por_replica < 1:\n        raise ValueError("por_replica deve ser >= 1")\n    concorrentes = rps * duracao_s\n    pedido = math.ceil(concorrentes / por_replica)\n    replicas = min(max(pedido, minimo), maximo)\n    saturado = pedido > maximo\n    return {"concorrentes": concorrentes, "pedido": pedido, "replicas": replicas, "saturado": saturado}\n',
          tutorDepois: 'O mínimo e o máximo são decisões de custo e de proteção: o pedido sozinho não diz quanto você está disposto a pagar nem quanto o provedor aguenta.',
          callout: 'A regra de escala virou código: concorrência, pedido, teto e saturação.' },
        { tipo: 'cenario', id: 'p01b1-cenario', titulo: 'Um serviço interno de resumos: onde rodar e quantas réplicas manter', obrigatorio: false,
          enunciado: 'Um serviço interno de resumo de documentos, em contêiner, é usado em horário comercial com rajadas irregulares. Decida a plataforma e depois os limites, e veja o custo de cada escolha.',
          inicio: 'inicio',
          nos: {
            inicio: { texto: 'A carga é irregular, o time é pequeno, nenhuma parte precisa de CRD, GPU ou malha de serviço, e as respostas fazem streaming. Qual plataforma?', opcoes: [
              { texto: 'AKS, porque o time já ouviu falar de Kubernetes.', vai: 'f-aks', tom: 'ruim', consequencia: 'você passa a operar versões, nós, ingress e upgrades sem usar nada que o cluster ofereça a mais.' },
              { texto: 'Functions, porque serverless não custa nada parado.', vai: 'f-functions', tom: 'ruim', consequencia: 'o modelo é por invocação, com limite de duração; um servidor ASGI com SSE longo encaixa mal.' },
              { texto: 'Container Apps: contêiner, revisões e escala por requisições, sem cluster para operar.', vai: 'min', tom: 'ok', consequencia: 'a plataforma cobre o caso comum, e os limites (ingresso de 240 s, imagem amd64) cabem no desenho.' }
            ] },
            min: { texto: 'Agora o mínimo de réplicas. O serviço fica ocioso à noite e a primeira requisição da manhã vai esperar a partida. O que você faz?', opcoes: [
              { texto: 'Fixar minReplicas em 1 "por segurança", sem somar a conta.', vai: 'f-min1', tom: 'ruim', consequencia: 'uma réplica ligada o mês inteiro cobra por segundo; a conta pequena se multiplica por revisão, ambiente e serviço.' },
              { texto: 'Escalar a zero sem medir, porque é o padrão.', vai: 'f-zero', tom: 'ruim', consequencia: 'o primeiro usuário da manhã espera a imagem ser puxada e a aplicação subir, e ninguém sabe quanto tempo é.' },
              { texto: 'Medir a partida a frio, olhar a distribuição real de tráfego e registrar a decisão com o número.', vai: 'estado', tom: 'ok', consequencia: 'a escolha de mínimo passa a ter um número que a sustenta.' }
            ] },
            estado: { texto: 'O produto quer um limite de 10 requisições por minuto por usuário, e o primeiro código guarda o contador em um dict em memória. Com várias réplicas, o que você faz?', opcoes: [
              { texto: 'Manter em memória e confiar no teste local, que passou.', vai: 'f-limite', tom: 'ruim', consequencia: 'o limite vira 10 por réplica; o excesso aparece na conta ou em 429 do provedor.' },
              { texto: 'Mover o contador para um armazenamento compartilhado (Redis ou banco) e usar maxReplicas como teto de custo.', vai: 'f-bom', tom: 'ok', consequencia: 'o limite vale para o usuário, não para a réplica, e o teto limita o dano enquanto isso.' }
            ] }
          },
          finais: {
            'f-bom': { bom: true, texto: 'Container Apps, mínimo decidido com medição e limite por usuário fora do processo: o serviço fica sem estado e a conta tem um número por trás.' },
            'f-aks': { bom: false, texto: 'O cluster funciona, mas o time carrega a operação de um Kubernetes que ninguém usa por inteiro.' },
            'f-functions': { bom: false, texto: 'O modelo por invocação briga com o stream longo, e a solução vira remendo.' },
            'f-min1': { bom: false, texto: 'A reserva "por segurança" virou custo fixo sem número que a justifique.' },
            'f-zero': { bom: false, texto: 'A partida a frio apareceu na primeira requisição do dia, em produção, sem medição prévia.' },
            'f-limite': { bom: false, texto: 'O limite por usuário valia 10 x N, e o problema só apareceu na conta.' }
          },
          callout: 'Você escolheu a plataforma pela forma da carga e decidiu mínimo e limite com um número e um armazenamento compartilhado.' },
        { tipo: 'takeaway', html: 'Conte a <mark>concorrência</mark> (taxa x duração), compare com o <mark>teto de réplicas</mark> e decida mínimo com <mark>partida a frio medida</mark>.' }
      ] },

      { rotulo: 'Conferir', blocos: [
        { tipo: 'texto', html: '<p>Duas perguntas de cenário, sem consulta. Marque quanto você confia antes de conferir.</p>' },
        { tipo: 'escolha', id: 'p01b1-escolha-sinal', titulo: 'Confira: o sinal de escala',
          pergunta: 'Um serviço de LLM com respostas em streaming de até 60 s está lento sob carga, e a CPU das réplicas fica em 15%. Qual sinal deve guiar a regra de escala?',
          opcoes: [
            { id: 'a', texto: 'Percentual de CPU, o padrão de qualquer serviço.', correta: false, porque: 'quem escolhe isto aplica a regra de serviços limitados por CPU a um serviço limitado por espera.' },
            { id: 'b', texto: 'Concorrência de requisições em andamento, porque o serviço é dominado por espera de E/S.', correta: true, porque: 'o serviço passa quase todo o tempo esperando o modelo, então a CPU engana (15% com réplicas saturadas de conexões abertas); a concorrência acompanha o que de fato se esgota.' },
            { id: 'c', texto: 'Tamanho da imagem do contêiner.', correta: false, porque: 'o tamanho da imagem não mede carga.' },
            { id: 'd', texto: 'Memória livre no nó.', correta: false, porque: 'o nó não é a unidade de escala visível no Container Apps, e a memória não acompanha a concorrência de streams de forma confiável.' }
          ], tutorDepois: 'Escale pelo recurso que se esgota primeiro, e aqui são as conexões abertas.' },
        { tipo: 'escolha', id: 'p01b1-escolha-aks', titulo: 'Confira: quando AKS compensa',
          pergunta: 'Qual destes é um motivo legítimo para preferir AKS em vez de Container Apps?',
          opcoes: [
            { id: 'a', texto: 'O tráfego é baixo e só em horário comercial.', correta: false, porque: 'é argumento a favor de Container Apps (escala a zero, menos operação).' },
            { id: 'b', texto: 'O time precisa de CRDs e operadores, GPU dedicada ou malha de serviço e tem quem opere o cluster.', correta: true, porque: 'AKS compensa quando você precisa do ecossistema Kubernetes completo e aceita o custo de operar o cluster.' },
            { id: 'c', texto: 'Escalar a zero réplicas fora do expediente.', correta: false, porque: 'escala a zero é argumento a favor de Container Apps.' },
            { id: 'd', texto: 'Evitar escrever YAML ou Bicep.', correta: false, porque: 'é falso: Kubernetes exige ainda mais manifestos.' }
          ], tutorDepois: 'O ganho do AKS só aparece se você usa o que ele oferece a mais.' },
        { tipo: 'takeaway', html: 'A plataforma segue a <mark>forma da carga</mark>; o sinal de escala é a <mark>concorrência</mark>, o estado fica <mark>fora das réplicas</mark> e cada escolha carrega um <mark>número</mark>.' }
      ] }
    ]
  });
})();
