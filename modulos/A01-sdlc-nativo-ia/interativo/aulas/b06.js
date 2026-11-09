/* A01 · Bloco 6 · Maintain: fechar o laço com detecção determinística, scans recorrentes e agente de plantão. */
(function () {
  var L = function (kind, text) { return { kind: kind, text: text }; };

  var bands = [
    '# examples/bands.yaml',
    'metric: http_5xx_per_min',
    'window: 30        # pontos de linha de base que precedem a janela recente',
    'lookback: 8       # pontos recentes avaliados contra essa base (WE4 precisa de 8)',
    'min_std: 0.5      # piso: base perfeitamente plana não pode gerar sigma infinito',
    'rules: [WE1, WE2, WE3, WE4]',
    'tiers:',
    '  - {name: log,      sigma: 1, action: log}',
    '  - {name: diagnose, sigma: 2, action: diagnose_readonly}',
    '  - {name: act,      sigma: 3, action: propose, via: runbook, runbook: rollback-last-deploy}'
  ].join('\n');

  TrilhaAula.registrar({
    id: 'a01-b6',
    titulo: 'Maintain: fechar o laço com a produção',
    minutos: 40,
    resumo: 'Um script determinístico detecta a anomalia; só depois um agente de leitura diagnostica e escreve um intent.md que volta ao backlog. Varreduras e plantão seguem o mesmo padrão.',
    objetivo: 'Entender e configurar o laço de Maintain: detecção por regras de Western Electric contra base rolante, bands.yaml por tier, intent.md de diagnóstico, varreduras agendadas e agente de plantão.',
    revisao: [
      { id: 'a01b6-ordem', pergunta: 'Qual é a ordem que não pode ser invertida no laço de Maintain?', opcoes: [
        { id: 'a', texto: 'Um script determinístico detecta contra uma base rolante; só quando uma banda é violada o agente é acionado', correta: true, porque: 'nenhum modelo participa da detecção.' },
        { id: 'b', texto: 'O agente lê os logs continuamente e decide se há anomalia', correta: false, porque: 'fica caro, irreprodutível e vulnerável a injeção por conteúdo de log.' },
        { id: 'c', texto: 'O humano observa o dashboard e abre o ticket', correta: false, porque: 'é o mundo antes do laço: produção e backlog separados.' } ] },
      { id: 'a01b6-bandas', pergunta: 'O que o <code>bands.yaml</code> mapeia?', opcoes: [
        { id: 'a', texto: '1σ registra, 2σ aciona diagnóstico somente leitura, 3σ permite propor PR ou runbook pré-aprovado', correta: true, porque: 'o custo de um falso positivo cresce com o tier, e a resposta cresce junto.' },
        { id: 'b', texto: '1σ propõe PR, 2σ registra, 3σ ignora', correta: false, porque: 'inverte a escada de resposta.' },
        { id: 'c', texto: 'Os horários de plantão da equipe', correta: false, porque: 'ele mapeia nível de desvio para ação.' } ] },
      { id: 'a01b6-base', pergunta: 'Por que a base são os 30 pontos que <em>precedem</em> os 8 mais recentes?', opcoes: [
        { id: 'a', texto: 'Uma base que inclui os pontos recentes é arrastada por uma deriva lenta, que nunca se destaca', correta: true, porque: 'a deriva viraria o novo normal; o custo é exigir rebaselining explícito para mudanças legítimas.' },
        { id: 'b', texto: 'Para economizar memória', correta: false, porque: 'o motivo é estatístico, não de memória.' },
        { id: 'c', texto: 'Porque o desvio-padrão não aceita mais de 30 pontos', correta: false, porque: 'não existe esse limite.' } ] },
      { id: 'a01b6-volta', pergunta: 'Como verificar que "as métricas voltaram ao normal" depois de um incidente?', opcoes: [
        { id: 'a', texto: 'Rodando o detector: as regras não disparam mais contra a base anterior ao incidente, e o resultado vai para o registro', correta: true, porque: 'critério objetivo e reproduzível, o mesmo que detectou o problema.' },
        { id: 'b', texto: 'Aceitando a palavra do agente de plantão', correta: false, porque: '"acho que sim" não é evidência.' },
        { id: 'c', texto: 'Esperando uma hora', correta: false, porque: 'tempo arbitrário não é critério.' } ] },
      { id: 'a01b6-scan', pergunta: 'Qual é a relação entre a varredura de segurança por IA e a análise estática determinística?', opcoes: [
        { id: 'a', texto: 'A varredura por IA complementa; o piso determinístico (SAST, auditoria de dependências, segredos) continua', correta: true, porque: 'o piso detecta o conhecido sem modelo; a IA procura o que as regras não escrevem.' },
        { id: 'b', texto: 'A varredura por IA substitui o SAST', correta: false, porque: 'o playbook é claro: complementa, não substitui.' },
        { id: 'c', texto: 'Só uma das duas deve existir por repositório', correta: false, porque: 'as camadas se somam.' } ] }
    ],
    abas: [
      { rotulo: 'Entender', blocos: [
        { tipo: 'texto', html:
          '<p>Na maioria das empresas, produção e backlog são mundos separados: o alerta dispara, alguém investiga no calor do momento, a causa é anotada num post-mortem que ninguém relê e nada entra no ciclo de planejamento. Maintain, no playbook, é a etapa que <strong>fecha o loop</strong>: o que a produção revela volta como <code>intent.md</code> e atravessa o mesmo processo que qualquer outra ideia. Três plays compõem o bloco: fechar o laço, varreduras recorrentes de segurança e um agente de plantão.</p>' +
          '<h3>Fechar o laço</h3>' +
          '<p>O mecanismo tem uma ordem que não pode ser invertida. <strong>Um script determinístico</strong> observa uma métrica contra uma <strong>linha de base rolante</strong> (a janela de referência que anda com o tempo), aplicando regras estatísticas que pegam tanto picos quanto deriva lenta. <strong>Nenhum modelo participa da detecção.</strong> Só quando uma banda é violada o agente é acionado, de modo não interativo, e escreve seu diagnóstico como <code>intent.md</code>, que reentra no pipeline. O dono do serviço tria a fila (corrigir agora, agendar ou descartar), os descartes <em>retunam as bandas</em>, e cada correção entregue acrescenta uma eval.</p>' +
          '<p>No nosso sistema .NET + Angular com Durable Functions, a métrica poderia ser <code>http_5xx_per_min</code> da API, lida do monitoramento do Azure.</p>' },
        { tipo: 'ordene', id: 'b6-ordene-laco', titulo: 'Ponha o laço na ordem',
          enunciado: 'Ordene os seis passos de Maintain, do primeiro ao último.',
          itens: [
            { id: 'triagem', texto: 'O dono do serviço tria a fila: corrigir agora, agendar ou descartar (descartes retunam as bandas)' },
            { id: 'agente', texto: 'O agente headless é acionado, diagnostica com ferramentas de leitura e escreve <code>intent.md</code>' },
            { id: 'metrica', texto: 'Uma métrica é lida contra uma linha de base rolante de 30 dias, sem modelo' },
            { id: 'eval', texto: 'A correção passa pelo loop normal (spec, plano, PR) e ganha uma eval' },
            { id: 'bands', texto: '<code>bands.yaml</code> decide qual resposta a violação merece (1σ, 2σ, 3σ)' },
            { id: 'detector', texto: 'Um script versionado e testado aplica as regras de Western Electric e acusa a violação' }
          ], solucao: ['metrica', 'detector', 'bands', 'agente', 'triagem', 'eval'],
          dica: 'O modelo só entra depois que o script e as bandas decidiram.',
          tutorDepois: 'O agente é o quarto passo, não o primeiro: detecção e política de resposta são determinísticas.' },
        { tipo: 'takeaway', html: 'Detecta o <mark>script</mark>, diagnostica o <mark>agente</mark>, decide o <mark>humano</mark>, e cada correção vira <mark>eval</mark>.' }
      ] },

      { rotulo: 'Detectar', blocos: [
        { tipo: 'texto', html:
          '<h3>Regras de Western Electric</h3>' +
          '<p>As regras vêm do controle estatístico de processos (cartas de Shewhart; <em>Statistical Quality Control Handbook</em>, Western Electric, 1956). Mede-se a distância da média da linha de base em desvios-padrão (z). Quatro regras, cada uma sensível a um tipo de mudança:</p>' +
          '<table><thead><tr><th>Regra</th><th>Condição (no ponto mais recente)</th><th>Pega bem</th><th>Faixa</th></tr></thead><tbody>' +
          '<tr><td>WE1</td><td>um ponto além de 3σ</td><td>picos, falhas abruptas</td><td>3σ</td></tr>' +
          '<tr><td>WE2</td><td>2 de 3 pontos consecutivos além de 2σ, do mesmo lado</td><td>degraus moderados</td><td>2σ</td></tr>' +
          '<tr><td>WE3</td><td>4 de 5 pontos além de 1σ, do mesmo lado</td><td>desvios pequenos e persistentes</td><td>1σ</td></tr>' +
          '<tr><td>WE4</td><td>8 pontos seguidos do mesmo lado da média</td><td>deriva lenta (o centro andou)</td><td>1σ</td></tr>' +
          '</tbody></table>', largo: true },
        { tipo: 'texto', html:
          '<p>Cada regra tem um nível de σ associado, e o <code>bands.yaml</code> mapeia o nível para a resposta. Do playbook: <strong>1σ só registra; 2σ aciona o agente com ferramentas somente leitura; 3σ permite que o agente proponha ação</strong>, seja um PR para o gate de revisão, seja o acionamento de um runbook pré-aprovado (como um rollback). A base é uma janela rolante de 30 dias, e o script de detecção é versionado e testado.</p>' },
        { tipo: 'codigo', linguagem: 'yaml', texto: bands },
        { tipo: 'texto', html:
          '<p>O carregador valida o arquivo (sigmas estritamente crescentes, ações conhecidas, um tier <code>propose</code> exige <code>via: pr</code> ou um runbook nomeado) e <strong>recusa</strong> configuração incompleta: é preferível o monitor não subir a subir com um 3σ que "propõe" sem destino. Uma decisão de projeto aparece no código: a base são os 30 pontos que <em>precedem</em> os 8 mais recentes. Se a base incluísse os pontos recentes, uma deriva lenta arrastaria a média junto e nunca se destacaria.</p>' },
        { tipo: 'complete', id: 'b6-complete-bands', titulo: 'Complete o tier de ação', linguagem: 'yaml',
          enunciado: 'O tier mais alto precisa de um destino. Complete o <code>bands.yaml</code> que o carregador aceita.',
          partes: [
            'tiers:\n  - {name: log,      sigma: 1, action: ', { lacuna: 'a1', opcoes: ['log', 'propose', 'diagnose_readonly'], correta: 'log' },
            '}\n  - {name: diagnose, sigma: ', { lacuna: 's2', opcoes: ['2', '1', '3'], correta: '2' },
            ', action: diagnose_readonly}\n  - {name: act,      sigma: 3, action: propose, ', { lacuna: 'via', opcoes: ['via: runbook, runbook: rollback-last-deploy', 'via: chat', '(sem destino, o agente decide)'], correta: 'via: runbook, runbook: rollback-last-deploy' },
            '}\n'
          ],
          explicacao: 'Os sigmas são estritamente crescentes (1, 2, 3). O tier <code>propose</code> exige <code>via: pr</code> ou um runbook nomeado: sem destino o carregador recusa o arquivo. Em 3σ, propor via runbook pré-aprovado é mais seguro que escrever código novo sob pressão.',
          callout: 'bands.yaml completo: escada de resposta crescente e um 3σ com destino.' },
        { tipo: 'texto', html:
          '<h3>Do disparo ao <code>intent.md</code></h3>' +
          '<p>Quando um tier maior ou igual a 2 dispara, o kit gera um <em>rascunho</em> de intent com a evidência e as perguntas em aberto; o agente, com ferramentas somente leitura, completa o diagnóstico. Rode o detector do laboratório sobre uma série com degrau.</p>' },
        { tipo: 'rode', id: 'b6-rode-detect', titulo: 'Detecte e gere o intent', prefixo: '$', unidade: 's', terminalTitulo: 'terminal',
          enunciado: 'Rode o detector e observe quais regras disparam, em qual ponto, e o que sai em <code>out/</code>.',
          entrada: 'python -m sdlc_kit detect --bands examples/bands.yaml --csv step.csv --out out --intent-id INT-900 --when 2026-10-11T12:00:00Z',
          prever: { pergunta: 'Numa série com degrau, qual regra aciona o agente (tier 2 ou mais) primeiro?', opcoes: [
            { id: 'we1', texto: 'WE1, o pico além de 3σ.', correta: false, porque: 'o WE1 dispara no ponto 40; antes dele outra regra já cruzou o tier de diagnóstico.' },
            { id: 'we2', texto: 'WE2, no ponto 39, um ponto antes do 3σ.', correta: true, porque: 'WE2 (2 de 3 pontos além de 2σ) cruza o tier diagnose no ponto 39, um ponto antes de WE1 chegar a 3σ no ponto 40.' },
            { id: 'we4', texto: 'WE4, a deriva de 8 pontos.', correta: false, porque: 'WE4 só fecha no ponto 45, e é do tier de registro.' } ] },
          etapas: [
            { id: 'regras', nome: 'Regras e tiers', descricao: 'Cada regra cruza um tier', tom: 'request', ms: 2, linhas: [
              L('cmd', 'python -m sdlc_kit detect --bands examples/bands.yaml --csv step.csv --out out --intent-id INT-900 --when 2026-10-11T12:00:00Z'),
              L('out', 'WE2 idx=39 high z=2.37 tier=diagnose'),
              L('out', 'WE1 idx=40 high z=3.02 tier=act'),
              L('out', 'WE3 idx=40 high z=3.02 tier=log'),
              L('out', 'WE4 idx=45 high z=3.15 tier=log'),
              L('hint', 'em produção o detector age no primeiro tier cruzado: WE2 no ponto 39') ] },
            { id: 'intent', nome: 'Intent de diagnóstico', descricao: 'Rascunho para a triagem', tom: 'response', ms: 1, linhas: [
              L('in', 'intent de diagnóstico: out/INT-900-http_5xx_per_min.md'),
              L('out', 'exit=1'),
              L('body', '---'), L('body', 'id: INT-900'), L('body', 'status: draft'), L('body', 'author: detector'), L('body', 'origin: monitor'),
              L('body', 'metric: http_5xx_per_min'), L('body', 'rule: WE1'), L('body', 'tier: act'), L('body', 'detected_at: 2026-10-11T12:00:00Z'), L('body', '---'),
              L('body', '# Diagnóstico: http_5xx_per_min (WE1, act)'),
              L('body', '## Problema'),
              L('body', 'A métrica `http_5xx_per_min` violou a regra WE1 (high, z = 3.02) ...') ] }
          ],
          tutorAntes: 'Escolha sua previsão e aperte Enter. Depois leia a ordem em que as regras disparam.',
          tutorDepois: 'Em produção real, o detector processa cada ponto novo e age no primeiro tier cruzado: WE2 no ponto 39 já teria acionado o diagnóstico, um ponto antes do 3σ.',
          callout: 'Você viu o detector disparar por tier e gerar o rascunho de intent.' },
        { tipo: 'texto', html:
          '<p>Saída real do laboratório, executada em 12/10/2026. Três detalhes de projeto:</p>' +
          '<ol><li>O arquivo passa no mesmo <code>validate_intent</code> do bloco 2: um incidente é uma ideia como outra qualquer.</li>' +
          '<li>O status é <code>draft</code> e há questões em aberto; o dono do serviço decide se vira spec.</li>' +
          '<li>O modo de operação (somente leitura; ou "pode propor o runbook X, humano autoriza") vem do tier, e não da inventividade do modelo.</li></ol>' +
          '<h3>O preço das regras: alarme falso</h3>' +
          '<p>Em série plana, trocar a semente gera disparos espúrios. Não é defeito, é o preço das regras. Medido com o próprio <code>sdlc_kit</code> em 30.000 pontos independentes e normais (semente 2026, janela 30, lookback 8):</p>' +
          '<table><thead><tr><th>Regra</th><th>Alarme falso por ponto avaliado</th></tr></thead><tbody>' +
          '<tr><td>WE1</td><td>0,61%</td></tr><tr><td>WE2</td><td>0,50%</td></tr><tr><td>WE3</td><td>0,91%</td></tr><tr><td>WE4</td><td>1,33%</td></tr><tr><td>Qualquer uma</td><td>3,13%</td></tr></tbody></table>' +
          '<p>Dois pontos de leitura: (1) o WE1 teórico, com média e σ conhecidos, é 0,27%; aqui dá 0,61% porque a <em>linha de base é estimada com 30 pontos</em>, e um σ estimado pequeno produz z grandes; (2) alarmes disparam em pontos vizinhos (a regra continua verdadeira por alguns pontos), de modo que o número de <em>incidentes</em> é menor que o de pontos. Por isso o 1σ só registra e o 3σ é que propõe ações. Por tipo de série: na deriva lenta, WE4 e WE3 acusam bem antes de WE1; no pico, só WE1 (e às vezes WE2) agem.</p>', largo: true },
        { tipo: 'callout', tom: 'danger', titulo: 'Armadilha que pega sênior: pressupostos estatísticos que a produção não cumpre', html:
          'As regras assumem observações independentes e aproximadamente normais. Métricas de produção são autocorrelacionadas (um minuto ruim contamina o próximo), assimétricas (latência tem cauda pesada), discretas (contagens de erros) e sazonais. Resultado: mais alarmes falsos do que a tabela acima e pontos cegos. Mitigações: analisar taxas ou transformar (log em latência); linha de base por faixa de horário (hora da semana); suprimir durante janelas de manutenção e deploy conhecidos (ou usá-las como gatilho, como no rollback); e <strong>medir</strong> a taxa de alarme falso do seu detector com dados reais. O detector é código de produção: versionado e testado.' },
        { tipo: 'takeaway', html: 'Regras de <mark>Western Electric</mark> contra base que <mark>precede</mark> a janela recente; <mark>bands.yaml</mark> traduz o σ em resposta.' }
      ] },

      { rotulo: 'Varreduras e plantão', blocos: [
        { tipo: 'texto', html:
          '<h3>Exemplos do playbook</h3>' +
          '<ul><li><strong>Pico de testes instáveis:</strong> a taxa de falha de teste sai da banda; a resposta é quarentenar o teste ou abrir um PR de reversão.</li>' +
          '<li><strong>Pico de 5xx logo após um deploy:</strong> dentro da janela de deploy, aciona o pipeline de rollback pré-aprovado.</li>' +
          '<li><strong>Deriva no tempo de ciclo de PR:</strong> gera um relatório para a liderança (a métrica é do próprio SDLC).</li></ul>' +
          '<p>Métricas da play: <strong>líder</strong>, tempo entre a violação da banda e o <code>intent.md</code> na fila de triagem; <strong>defasadas</strong>, parcela dos achados que viram correções mergeadas e incidentes repetidos.</p>' +
          '<h3>Varreduras recorrentes de segurança</h3>' +
          '<p>Segurança não deve depender de alguém lembrar. A play agenda uma varredura por repositório (semanal é a sugestão para serviços ativos). Os achados são <strong>validados e recebem uma classificação de confiança</strong>; descartar exige uma <strong>razão</strong>; correções passam pelo gate de PR e problemas maiores viram <code>intent.md</code>. O playbook apresenta um produto hospedado para isso (Claude Security, em beta público para Enterprise na data do texto) e é claro num ponto que vale para qualquer fornecedor: a varredura por IA <strong>complementa, não substitui</strong>, a análise estática e de dependências determinística.</p>' +
          '<table><thead><tr><th>Camada</th><th>Invariante</th><th>Substituto agnóstico</th></tr></thead><tbody>' +
          '<tr><td>Piso determinístico</td><td>Detecta o conhecido, reprodutível, sem modelo</td><td>SAST (CodeQL, Semgrep), auditoria de dependências (pip-audit, OSV; no .NET, <code>dotnet list package --vulnerable</code>), varredura de segredos, tudo em CI agendado</td></tr>' +
          '<tr><td>Camada de IA</td><td>Procura o que as regras não escrevem (lógica de autorização, cadeias de falhas) e valida achados</td><td>Job agendado com agente somente leitura; saída em arquivo de findings com <code>confidence</code> e evidência</td></tr>' +
          '<tr><td>Triagem</td><td>Descarte exige razão registrada</td><td>Arquivo versionado de descartes (<code>id</code>, razão, quem, até quando) revisado por code owner</td></tr>' +
          '<tr><td>Correção</td><td>Entra pelo gate</td><td>PR do agente; achados grandes viram <code>docs/intent/</code></td></tr>' +
          '</tbody></table>' +
          '<p>Disparar por agenda não depende de produto: o evento <code>schedule</code> de qualquer CI chama o modo não interativo da ferramenta (no OpenCode V2, um job com <code>opencode run --standalone</code>; o suporte da ação oficial a <code>schedule</code> e <code>workflow_dispatch</code> era da V1 e não foi confirmado na V2; <code>codex exec</code> e <code>agent -p</code> servem ao mesmo papel).</p>', largo: true },
        { tipo: 'texto', html:
          '<h3>Agente de plantão</h3>' +
          '<p>A última play entra no canal de incidente. No playbook, o agente (Claude Tag, em beta público no Slack na data do texto) participa sob <strong>identidade própria</strong>, diagnostica, propõe correções, <strong>verifica que as métricas voltaram à linha de base</strong> e escreve o <strong>post-mortem num arquivo de lições versionado</strong>. Correções pequenas passam por revisão de PR; maiores viram <code>intent.md</code>; o canal é a trilha de auditoria. O invariante: um participante automatizado do incidente, identificável, com ferramentas de leitura, que deixa artefatos.</p>' +
          '<ul><li><strong>Peças agnósticas:</strong> uma conta de serviço no chat (Slack, Teams) acionada por menção; um agente headless com servidores MCP somente leitura (métricas, logs, histórico de deploy, runbooks); resposta no thread; arquivo <code>docs/lessons/AAAA-MM-DD-slug.md</code> por incidente.</li>' +
          '<li><strong>Verificação de recuperação:</strong> reutilize o detector. "Voltou ao normal" é "as regras de WE não disparam mais contra a linha de base anterior ao incidente", não "o agente acha que sim".</li>' +
          '<li><strong>Fecho do laço:</strong> toda lição vira eval (bloco 4) e, quando generalizável, uma linha em <code>AGENTS.md</code> ou numa skill.</li></ul>' },
        { tipo: 'takeaway', html: 'A varredura por IA <mark>complementa</mark> o piso determinístico; o plantão verifica a recuperação com o <mark>detector</mark>, não com opinião.' }
      ] },

      { rotulo: 'Conferir', blocos: [
        { tipo: 'escolha', id: 'b6-esc-base', titulo: 'Confira: a linha de base',
          pergunta: 'Por que a linha de base do detector é formada pelos pontos que <em>precedem</em> a janela recente, e não por todos os pontos, incluindo os recentes?',
          opcoes: [
            { id: 'a', texto: 'Uma base que inclui os pontos recentes é arrastada por uma deriva lenta e a deriva nunca se destaca.', correta: true, porque: 'se a média acompanha o que acontece, a deriva vira o "novo normal" e WE3/WE4 deixam de enxergar. O custo: mudanças legítimas exigem rebaselining explícito.' },
            { id: 'b', texto: 'Para economizar memória.', correta: false, porque: 'o motivo é estatístico.' },
            { id: 'c', texto: 'Porque o desvio-padrão não pode ser calculado com mais de 30 pontos.', correta: false, porque: 'não existe esse limite.' },
            { id: 'd', texto: 'Para que o 1σ nunca dispare.', correta: false, porque: 'o 1σ continua disparando; só registra.' }
          ] },
        { tipo: 'escolha', id: 'b6-esc-plantao', titulo: 'Confira: a recuperação',
          pergunta: 'Num incidente, o agente de plantão afirma "as métricas voltaram ao normal". Qual verificação segue o espírito do playbook?',
          opcoes: [
            { id: 'a', texto: 'Aceitar, pois o agente tem acesso aos dashboards.', correta: false, porque: 'acesso não é evidência.' },
            { id: 'b', texto: 'Pedir ao agente que confirme duas vezes.', correta: false, porque: 'repetir o relato não o transforma em critério.' },
            { id: 'c', texto: 'Rodar o detector determinístico: as regras não disparam contra a base anterior ao incidente, e o resultado vai para o registro.', correta: true, porque: 'o agente verifica contra um critério objetivo e reproduzível; o resultado entra no post-mortem e na eval.' },
            { id: 'd', texto: 'Esperar uma hora e só então fechar o incidente.', correta: false, porque: 'tempo arbitrário não é critério.' }
          ] },
        { tipo: 'cenario', id: 'b6-cenario', titulo: '5xx depois do deploy', obrigatorio: false,
          enunciado: 'Após um deploy na API .NET, a taxa de 5xx sobe. Decida como o laço responde e veja o custo.',
          inicio: 'inicio',
          nos: {
            inicio: { texto: 'A taxa de 5xx sai da banda minutos depois do deploy. Quem decide que isso é anomalia?', opcoes: [
              { texto: 'Um LLM lê os logs e decide.', vai: 'f-llm', tom: 'ruim', consequencia: 'caro, irreprodutível e vulnerável a injeção por conteúdo de log.' },
              { texto: 'O script determinístico aplica WE1 a WE4 contra a base de 30 pontos que precede a janela recente.', vai: 'tier', tom: 'ok', consequencia: 'a decisão é reprodutível e testável.' }
            ] },
            tier: { texto: 'O WE1 passou de 3σ, dentro da janela de deploy. O que o <code>bands.yaml</code> permite?', opcoes: [
              { texto: 'Só registrar, para não incomodar ninguém.', vai: 'f-silencio', tom: 'ruim', consequencia: '3σ não pode ficar no tier de registro: o incidente segue sem resposta.' },
              { texto: 'Propor via runbook pré-aprovado (<code>rollback-last-deploy</code>), com o humano autorizando, e gerar o intent de diagnóstico.', vai: 'depois', tom: 'ok', consequencia: 'propor via runbook é mais seguro que escrever código novo sob pressão.' }
            ] },
            depois: { texto: 'O rollback foi feito. O dono do serviço decide que a causa era o novo endpoint. O que fecha o laço?', opcoes: [
              { texto: 'Anotar no post-mortem e seguir.', vai: 'f-postmortem', tom: 'ruim', consequencia: 'a lição some: nada entra no backlog nem nas evals.' },
              { texto: 'A correção entra pelo loop normal (intent, spec, plano, PR) e ganha uma eval de regressão.', vai: 'f-bom', tom: 'ok', consequencia: 'a produção alimentou o backlog e o erro virou teste.' }
            ] }
          },
          finais: {
            'f-bom': { bom: true, texto: 'Detecção determinística, resposta por tier, rollback pré-aprovado e correção que virou eval: o laço fechou.' },
            'f-llm': { bom: false, texto: 'O modelo classificou o ruído de forma diferente a cada rodada e uma linha de log forjada o convenceu a ignorar o alerta.' },
            'f-silencio': { bom: false, texto: 'O alerta ficou só registrado enquanto os clientes recebiam erro.' },
            'f-postmortem': { bom: false, texto: 'O mesmo defeito voltou duas semanas depois, sem eval que o pegasse.' }
          },
          callout: 'Você deixou o script detectar, o runbook responder e a eval registrar a lição.' },
        { tipo: 'texto', html:
          '<h3>Trade-offs e erros comuns</h3>' +
          '<ul><li><strong>Sensibilidade × fadiga.</strong> Mais regras pegam mais coisa e geram mais ruído; a fila de triagem é finita. Comece com WE1 e WE2 acionando o agente; deixe WE3 e WE4 em registro até confiar.</li>' +
          '<li><strong>Janela longa × reação.</strong> Base de 30 dias é estável e demora a acomodar mudanças legítimas (nova funcionalidade, novo cliente). Mudança conhecida exige <em>rebaselining</em> explícito e versionado.</li>' +
          '<li><strong>Autonomia do agente × raio de explosão.</strong> Em 3σ, "propor" via runbook pré-aprovado é mais seguro que escrever código novo sob pressão.</li>' +
          '<li>Erro comum: usar um modelo para decidir se há anomalia.</li>' +
          '<li>Erro comum: aplicar as regras a contagens com forte sazonalidade (hora do dia, dia da semana) sem tratá-la: o horário de pico vira "anomalia" toda semana.</li>' +
          '<li>Erro comum: tratar descarte como fim. Descartes sem razão não retunam nada.</li></ul>' },
        { tipo: 'takeaway', html: 'O que a produção revela volta como <mark>intent.md</mark> e termina em <mark>eval</mark>.' }
      ] }
    ]
  });
})();
