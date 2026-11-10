/* E04 · Bloco 1: Papéis e escopo. Fonte: E04.html#b01. */
(function () {
  var L = function (kind, text) { return { kind: kind, text: text }; };
  function opc(id, texto, correta, porque) { return { id: id, texto: texto, correta: correta, porque: porque }; }

  var codigo = `def participacao(meus_commits, total_commits):
    """Fração dos commits do time que são seus. total_commits == 0 é erro."""
    return 0.0


def diagnostico(antes, depois, entrega_antes, entrega_depois):
    """antes/depois: sua fração de commits (0 a 1); entrega_*: itens entregues por mês.

    "heroi": continua com 30% ou mais dos commits.
    "multiplicacao": entre 10% e 20% (inclusive) e o time entrega pelo menos o que entregava.
    "abdicacao": abaixo de 10% e o time entrega menos que antes.
    "revisar": qualquer outro caso.
    """
    return "revisar"


print(participacao(40, 100), diagnostico(0.40, 0.0, 10, 7))
`;
  var testes = `def test_participacao_normal():
    assert participacao(40, 100) == 0.4


def test_participacao_sem_commits_e_erro():
    try:
        participacao(0, 0)
    except ValueError:
        return
    assert False, "deveria lançar ValueError"


def test_multiplicacao():
    assert diagnostico(0.40, 0.15, 10, 12) == "multiplicacao"
    assert diagnostico(0.40, 0.10, 10, 10) == "multiplicacao"


def test_abdicacao_zero_e_time_mais_lento():
    assert diagnostico(0.40, 0.0, 10, 7) == "abdicacao"


def test_heroi():
    assert diagnostico(0.40, 0.40, 10, 10) == "heroi"


def test_controle_negativo_zero_sem_queda_nao_e_abdicacao():
    assert diagnostico(0.40, 0.0, 10, 10) == "revisar"
    assert diagnostico(0.40, 0.25, 10, 10) == "revisar"
`;
  var solucao = `def participacao(meus_commits, total_commits):
    if total_commits == 0:
        raise ValueError("sem commits")
    return meus_commits / total_commits


def diagnostico(antes, depois, entrega_antes, entrega_depois):
    if depois >= 0.30:
        return "heroi"
    if 0.10 <= depois <= 0.20 and entrega_depois >= entrega_antes:
        return "multiplicacao"
    if depois < 0.10 and entrega_depois < entrega_antes:
        return "abdicacao"
    return "revisar"
`;

  TrilhaAula.registrar({
    id: 'e04-b1',
    titulo: 'Papéis e escopo: de quem mais codifica a quem multiplica',
    minutos: 30,
    resumo: 'A promoção a tech lead ou staff acontece porque você é o melhor executor. O trabalho novo é aumentar a capacidade de decisão e entrega de várias pessoas, e isso se mede por decisões que funcionam sem você.',
    objetivo: 'Distinguir tech lead, gerente, staff e principal pelo que cada um entrega, usar as quatro moedas da influência sem autoridade e planejar 90 dias que tiram você do caminho crítico sem abdicar.',
    revisao: [
      { id: 'e04b1-papeis', pergunta: 'Qual a diferença central entre tech lead, engineering manager e staff engineer?',
        opcoes: [
          opc('a', 'Tech lead responde pela qualidade técnica e ritmo de um time; EM por pessoas; staff por problemas que atravessam times, por influência.', true, 'os nomes variam por empresa; o que importa é pelo que cada papel responde e como isso se observa.'),
          opc('b', 'São o mesmo papel com títulos diferentes.', false, 'tech lead e gerente são papéis diferentes mesmo quando a mesma pessoa os acumula.'),
          opc('c', 'Staff tem autoridade formal sobre pessoas e orçamento.', false, 'quem tem autoridade formal sobre pessoas, orçamento e escopo é o EM; staff opera por influência, documento e patrocínio.')] },
      { id: 'e04b1-moedas', pergunta: 'Quais são as quatro moedas da influência sem autoridade?',
        opcoes: [
          opc('a', 'Evidência, clareza, reciprocidade e patrocínio', true, 'e a ordem importa: patrocínio sem evidência dá decreto fraco; evidência sem patrocínio dá análise ignorada.'),
          opc('b', 'Senioridade, volume de código, tempo de casa e carisma', false, 'nenhuma delas é uma moeda de troca verificável.'),
          opc('c', 'Cargo, orçamento, veto e urgência', false, 'são formas de autoridade, que é justamente o que falta.')] },
      { id: 'e04b1-alvo', pergunta: 'Num plano de 90 dias, para quanto a sua participação em commits deve cair, partindo de 40%?',
        opcoes: [
          opc('a', 'Para algo como 10% a 20%, com o time entregando', true, 'se caiu a zero e o time desacelerou, você delegou sem sustentar: é abdicação.'),
          opc('b', 'Para 0%, porque líder bom não codifica', false, 'manter trabalho fora do caminho crítico preserva credibilidade e contexto.'),
          opc('c', 'Fica em 40%, para dar o exemplo', false, 'é o herói silencioso: o time aprende a esperar por você.')] },
      { id: 'e04b1-heroi', pergunta: 'Qual é o teste do herói silencioso?',
        opcoes: [
          opc('a', 'Se você tirar duas semanas de férias sem celular, o que quebra? Cada item vira tarefa de transferência.', true, 'a organização lê o herói como competência; na verdade é risco.'),
          opc('b', 'Contar quantos incidentes você resolveu à noite.', false, 'isso mede o heroísmo, não o risco que ele esconde.'),
          opc('c', 'Medir quantos commits você fez no mês.', false, 'volume individual não mostra dependência do time.')] }
    ],
    abas: [
      { rotulo: 'Entender', blocos: [
        { tipo: 'texto', html:
          '<p>A promoção a tech lead ou staff costuma acontecer porque você é o melhor executor da sala. O trabalho novo é outro: aumentar a capacidade de decisão e entrega de várias pessoas. Quem não faz essa troca consciente continua somando o próprio rendimento (uma pessoa, 40 horas) enquanto o ganho possível está na <strong>multiplicação</strong> (dez pessoas decidindo melhor). Com agentes de código a troca ficou mais urgente: a produção individual de código barateou, o que torna a sua produção individual ainda menos diferencial e a qualidade das decisões do time ainda mais.</p>' +
          '<h3>Os papéis, sem rótulo vago</h3>' +
          '<p>Os nomes variam por empresa. O que importa é o que cada papel responde por entregar e como se verifica. Use a tabela para negociar escopo, não para colar crachá.</p>' },
        { tipo: 'texto', largo: true, html:
          '<table><thead><tr><th>Papel</th><th>Responde por</th><th>Autoridade típica</th><th>Sinal observável</th></tr></thead><tbody>' +
          '<tr><td><strong>Tech lead</strong> (de um time)</td><td>Qualidade técnica e ritmo de entrega de um time; decomposição, design, review, onboarding técnico</td><td>Decide o "como" dentro do time; propõe o "o quê" com o gerente de produto</td><td>Time entrega com previsibilidade; decisões técnicas escritas; duas pessoas além de você conseguem liderar uma iniciativa</td></tr>' +
          '<tr><td><strong>Engineering manager</strong></td><td>Pessoas: contratação, desempenho, carreira, saúde do time, prioridades e capacidade</td><td>Formal sobre pessoas, orçamento e escopo</td><td>Retenção, crescimento visível, conflitos tratados cedo, time com capacidade e foco</td></tr>' +
          '<tr><td><strong>Staff engineer</strong></td><td>Problemas técnicos que atravessam times (arquitetura, migração, plataforma, confiabilidade), ou profundidade crítica</td><td>Quase nenhuma formal; opera por influência, documento e patrocínio</td><td>Uma decisão ou capacidade que persiste depois que você sai da iniciativa</td></tr>' +
          '<tr><td><strong>Principal / distinguished</strong></td><td>Direção técnica da organização por anos; apostas de alto custo; reputação externa</td><td>Acesso a executivos; veto moral, não formal</td><td>A empresa evita um erro caro ou captura uma oportunidade que não veria sem você</td></tr>' +
          '</tbody></table>' },
        { tipo: 'texto', html:
          '<p>Tech lead e gerente são papéis diferentes mesmo quando a mesma pessoa os acumula. O erro típico é o "tech lead que gerencia por osmose": cuida de pessoas só quando sobra tempo e, por isso, nunca. Se você acumula, escreva no calendário a parte de pessoas (1:1, feedback, carreira) com a mesma firmeza dos compromissos técnicos.</p>' +
          '<p>Will Larson descreve quatro <strong>arquétipos de staff engineer</strong>: <em>tech lead</em> (guia um time), <em>architect</em> (dono de uma área técnica), <em>solver</em> (entra nos problemas difíceis e sai) e <em>right hand</em> (extensão de um executivo). A utilidade da lista é perguntar "qual deles esta empresa precisa de mim agora?" antes de aceitar o escopo, porque cada um tem rotina e métrica diferentes.</p>' },
        { tipo: 'takeaway', html: 'Tech lead responde pelo <mark>time</mark>, gerente pelas <mark>pessoas</mark>, staff pelo que <mark>atravessa times</mark>. Escolha o arquétipo antes de aceitar o escopo.' }
      ] },

      { rotulo: 'Ver funcionando', blocos: [
        { tipo: 'texto', html:
          '<h3>Influência sem autoridade: o mecanismo</h3>' +
          '<p>Sem poder de mando, você troca em quatro moedas: <strong>evidência</strong> (dados, protótipos, incidentes passados), <strong>clareza</strong> (o documento que organiza uma discussão confusa), <strong>reciprocidade</strong> (você já destravou os outros) e <strong>patrocínio</strong> (alguém com autoridade que apoia a direção). A ordem importa: começar pelo patrocínio sem evidência produz decreto fraco; evidência sem patrocínio produz análise ignorada.</p>' +
          '<h3>Alavancagem: da produção individual à multiplicação</h3>' +
          '<p>Há quatro estágios: <strong>você escreve</strong> (1x), <strong>você decide e revisa</strong> (2 a 3x, e vira gargalo), <strong>você forma quem decide</strong> e <strong>o time decide sem você</strong> (5 a 10x). O ganho de cada etapa só aparece se a etapa anterior for realmente entregue a alguém. A etapa 2 é onde mais líderes ficam presos.</p>' +
          '<h3>Exemplo trabalhado: o primeiro trimestre como tech lead</h3>' +
          '<p>Você assume um time de sete pessoas que mantém o serviço de conciliação e é o autor de 40% dos commits. O plano de 90 dias tem critério verificável em cada fase. Rode e observe.</p>' },
        { tipo: 'rode', id: 'b1-rode', titulo: 'Plano de 90 dias, fase a fase', obrigatorio: true,
          enunciado: 'Clique em cada fase do plano e leia o critério. Antes, faça a previsão.',
          prefixo: '$', entrada: 'plano de 90 dias · time de 7 · você é autor de 40% dos commits', unidade: 'dias', terminalTitulo: 'primeiro trimestre',
          prever: { pergunta: 'Ao fim dos 90 dias, qual deve ser, aproximadamente, a sua participação nos commits do time?', opcoes: [
            { id: 'a', texto: 'Cerca de 40%: líder precisa dar o exemplo.', correta: false, porque: 'ficar em 40% mantém você no caminho crítico; o time continua esperando.' },
            { id: 'b', texto: 'Algo como 10% a 20%, com o time entregando.', correta: true, porque: 'o alvo é sair do caminho crítico, mantendo trabalho fora dele para preservar contexto.' },
            { id: 'c', texto: '0%: líder bom não codifica.', correta: false, porque: 'se cair a zero e o time desacelerar, você delegou sem sustentar: é abdicação.' }
          ] },
          etapas: [
            { id: 'escutar', nome: 'Dias 1-15: escutar e mapear', descricao: '1:1 com todos', tom: 'dns', ms: 15, linhas: [
              L('cmd', '1:1 com cada pessoa (roteiro no bloco 5)'),
              L('info', 'pergunta fixa: "o que atrasa você hoje e que eu poderia resolver?"'),
              L('out', 'entregável: lista de dez atritos ordenada por frequência'),
              L('hint', 'critério: três itens têm dono e data')] },
            { id: 'caminho', nome: 'Dias 15-45: tirar-se do caminho crítico', descricao: 'Regras de autonomia', tom: 'request', ms: 30, linhas: [
              L('cmd', 'liste as decisões que passam por você: PR, biblioteca, prioridade de bug'),
              L('info', 'para cada uma, escreva a regra: "decide sozinho se reversível em um dia e abaixo de X; me avise depois"'),
              L('hint', 'critério: a fila de PRs que esperam você cai (tempo até a primeira revisão)')] },
            { id: 'segundo', nome: 'Dias 45-90: criar o segundo líder', descricao: 'Delegação ponta a ponta', tom: 'response', ms: 45, linhas: [
              L('cmd', 'escolha uma iniciativa média e passe a liderança a uma pessoa; você é o patrocinador'),
              L('out', 'critério: você não é autor de nenhum commit do caminho crítico daquela iniciativa, e ela entrega'),
              L('in', 'participação em commits: de 40% para algo como 10% a 20%'),
              L('hint', 'se caiu a zero e o time desacelerou, é abdicação, não liderança')] }
          ] },
        { tipo: 'callout', tom: 'danger', titulo: 'Armadilha que pega sênior: o herói silencioso', html:
          '<p>Você resolve as crises de madrugada, segura o legado, é indispensável, e a organização lê isso como competência. Na verdade é risco: se você some, o sistema para, e o time aprende a esperar o herói. <strong>Teste:</strong> se você tirar duas semanas de férias sem celular, o que quebra? Cada item da resposta é uma tarefa de transferência para o próximo trimestre.</p>' },
        { tipo: 'takeaway', html: 'O plano mede-se por decisões que funcionam <mark>sem você</mark>: commits de 40% para <mark>10 a 20%</mark>, com o time entregando.' }
      ] },

      { rotulo: 'Praticar', blocos: [
        { tipo: 'texto', html:
          '<p>Transforme o critério do plano em código: um diagnóstico que separa multiplicação de abdicação e de heroísmo. Os limites vêm do exemplo do bloco (alvo de 10% a 20% e queda de entrega como sinal de abdicação).</p>' },
        { tipo: 'python', id: 'b1-python', titulo: 'Multiplicação ou abdicação?', obrigatorio: false,
          enunciado: 'Implemente <code>participacao(meus_commits, total_commits)</code> (erro se o total for zero) e <code>diagnostico(antes, depois, entrega_antes, entrega_depois)</code> com as quatro saídas descritas na docstring.',
          codigo: codigo, testes: testes,
          dica: 'Teste <code>heroi</code> primeiro (depois ≥ 0,30); depois a faixa <code>0.10 &lt;= depois &lt;= 0.20</code> com entrega mantida; depois abaixo de 0,10 com queda de entrega. O resto é <code>revisar</code>.',
          solucao: solucao,
          tutorDepois: 'Repare no controle negativo: cair a zero com o time entregando o mesmo não é o diagnóstico de abdicação do bloco, que exige o time desacelerar.',
          callout: 'O diagnóstico separa multiplicação de abdicação pelo efeito no time, não só pelo número de commits.' },
        { tipo: 'cenario', id: 'b1-cenario', titulo: 'Sua primeira semana como tech lead', obrigatorio: false,
          inicio: 'inicio',
          nos: {
            inicio: { texto: 'Você assumiu o time de conciliação. Quatro PRs esperam revisão sua e a pessoa mais nova pergunta, pela terceira vez, qual biblioteca usar.', opcoes: [
              { texto: 'Responder a biblioteca e revisar os quatro PRs hoje', vai: 'heroi', consequencia: 'Resolve o dia e reforça a dependência: o time aprende que decidir é esperar você.', tom: 'ruim' },
              { texto: 'Perguntar "o que você já tentou? qual hipótese escolheria?" e marcar 1:1 com todos', vai: 'escuta', consequencia: 'Menos gratificante hoje; começa a lista de atritos e o hábito de decidir sozinho.', tom: 'ok' }
            ] },
            heroi: { texto: 'Dois meses depois você ainda é autor de 40% dos commits e o time não decide nada sem você. O que faz?', opcoes: [
              { texto: 'Trabalhar mais horas para dar conta', vai: 'fim_ruim', consequencia: 'Soma o seu rendimento de uma pessoa; o gargalo é você.', tom: 'ruim' },
              { texto: 'Listar as decisões que passam por você e escrever regras de autonomia por reversibilidade e limite', vai: 'regras', consequencia: 'É o passo dos dias 15 a 45 do plano.', tom: 'ok' }
            ] },
            escuta: { texto: 'A lista de dez atritos sai com três itens com dono e data. Que decisão tomar agora?', opcoes: [
              { texto: 'Listar as decisões que passam por você e escrever regras de autonomia', vai: 'regras', consequencia: 'Você começa a sair do caminho crítico com critério.', tom: 'ok' }
            ] },
            regras: { texto: 'A fila de PRs caiu. Falta o segundo líder. Como delegar a iniciativa média?', opcoes: [
              { texto: 'Entregar a iniciativa e sumir: o time que se vire', vai: 'fim_abdica', consequencia: 'Sem patrocínio, critérios e contexto, o time desacelera: abdicação.', tom: 'ruim' },
              { texto: 'Passar a liderança ponta a ponta a uma pessoa, com você como patrocinador e checkpoints', vai: 'fim_bom', consequencia: 'Você deixa de ser autor do caminho crítico daquela iniciativa e ela entrega.', tom: 'ok' }
            ] }
          },
          finais: {
            fim_bom: { texto: 'Segundo líder formado: suas decisões agora funcionam sem você, e seus commits caíram para a faixa de 10% a 20%.', bom: true },
            fim_ruim: { texto: 'Você seguiu somando o próprio rendimento. O ganho possível estava na multiplicação.', bom: false },
            fim_abdica: { texto: 'Você caiu a zero e o time desacelerou: delegou sem sustentar. Abdicação, não liderança.', bom: false }
          } },
        { tipo: 'takeaway', html: 'O número de commits sozinho não diz nada: <mark>10 a 20%</mark> com o time entregando é multiplicação; <mark>zero com o time mais lento</mark> é abdicação.' }
      ] },

      { rotulo: 'Conferir', blocos: [
        { tipo: 'texto', html:
          '<h3>Trade-offs e erros comuns</h3>' +
          '<ul><li><strong>Codar ou não codar.</strong> Manter uma parte do código mantém credibilidade e contexto. Mantenha trabalho fora do caminho crítico (ferramentas, spikes, correções pequenas), porque você será interrompido e não pode bloquear ninguém.</li>' +
          '<li><strong>Staff por profundidade ou por abrangência.</strong> Profundidade (o especialista em banco de dados) é respeitável, mas só é staff se resolve o que ninguém mais resolve e ensina o suficiente para não virar relíquia.</li>' +
          '<li><strong>Gerente ou trilha técnica.</strong> A troca é reversível em muitas empresas. Faça um período de teste explícito (6 a 12 meses) com critério de saída conversado com sua chefia.</li></ul>' +
          '<p>Erros comuns: responder todas as perguntas técnicas em vez de perguntar "o que você já tentou?" (cria dependência); reescrever o PR do colega "porque é mais rápido" (uma vez compensa, a segunda custa o time); confundir visibilidade com impacto (reunião de arquitetura de duas horas não é entrega); aceitar escopo transversal sem patrocinador (staff sem patrocínio vira consultor sem mandato).</p>' },
        { tipo: 'escolha', id: 'b1-esc1', titulo: 'Diagnóstico depois de 90 dias',
          pergunta: 'Depois de 90 dias você caiu de 40% para 0% dos commits e o time desacelerou. Qual o diagnóstico mais provável?',
          opcoes: [
            { id: 'a', texto: 'Sucesso: líder bom não codifica.', correta: false, porque: 'confunde multiplicar com sumir.' },
            { id: 'b', texto: 'O time não tem a capacidade técnica necessária.', correta: false, porque: 'o sintoma aponta para o modo como você delegou, não para a capacidade do time.' },
            { id: 'c', texto: 'Abdicação: você delegou sem sustentar (patrocínio, critérios, contexto). O alvo era algo como 10% a 20%.', correta: true, porque: 'cair a zero com o time mais lento é abdicação, não liderança.' }
          ] },
        { tipo: 'escolha', id: 'b1-esc2', titulo: 'Escopo transversal',
          pergunta: 'Você aceitou liderar uma migração que atravessa três times, sem patrocinador e sem autoridade formal. Qual o risco mais provável?',
          opcoes: [
            { id: 'a', texto: 'Virar consultor sem mandato: análise ignorada, porque falta o patrocínio.', correta: true, porque: 'evidência sem patrocínio produz análise ignorada; staff sem patrocínio perde a alavanca.' },
            { id: 'b', texto: 'Ganhar autoridade formal por cobrir mais escopo.', correta: false, porque: 'staff opera por influência, documento e patrocínio; escopo não cria mando.' },
            { id: 'c', texto: 'Nenhum: documentos bem escritos bastam.', correta: false, porque: 'clareza é uma das quatro moedas, não a única; sem patrocínio o documento fica sem força.' }
          ] },
        { tipo: 'takeaway', html: 'Com IA barateando o código, o diferencial é a <mark>qualidade das decisões do time</mark>, não a sua produção individual.' }
      ] }
    ]
  });
})();
