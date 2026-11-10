/* M11 · Bloco 5 (aula 2): do pré-treino ao comportamento e por que ele alucina. Fonte: M11.html#b05. Números de amostragem são calculados sobre LOGITS_EXEMPLO do contrato lab/amostragem.py (execução real em CPython). */
(function () {
  var L = function (kind, text) { return { kind: kind, text: text }; };
  function opc(id, texto, correta, porque) { return { id: id, texto: texto, correta: correta, porque: porque }; }

  var IMP = 'python -c "from amostragem import *; p = aplicar_temperatura(LOGITS_EXEMPLO, 1.0); print([round(x, 3) for x in p], round(entropia(p), 3))"';

  var etapasAmostragem = function () {
    return [
      { id: 't1', nome: 'T = 1.0', descricao: 'Distribuição sem reponderar', tom: 'dns', ms: 1.224, linhas: [
        L('cmd', IMP),
        L('out', '[0.481, 0.356, 0.08, 0.044, 0.022, 0.012, 0.006] 1.224'),
        L('hint', 'sete candidatos vivos; o primeiro lidera com 48%, mas o segundo ainda tem 36%')] },
      { id: 't05', nome: 'T = 0.5', descricao: 'Concentra a massa no topo', tom: 'tcp', ms: 0.768, linhas: [
        L('cmd', 'python -c "...aplicar_temperatura(LOGITS_EXEMPLO, 0.5)..."'),
        L('out', '[0.63, 0.346, 0.017, 0.005, 0.001, 0.0, 0.0] 0.768'),
        L('hint', 'a entropia (em nats) caiu de 1.224 para 0.768; a ordem dos tokens não mudou')] },
      { id: 't2', nome: 'T = 2.0', descricao: 'Achata a distribuição', tom: 'tls', ms: 1.679, linhas: [
        L('cmd', 'python -c "...aplicar_temperatura(LOGITS_EXEMPLO, 2.0)..."'),
        L('out', '[0.328, 0.282, 0.133, 0.099, 0.07, 0.052, 0.036] 1.679'),
        L('hint', 'a cauda ganhou massa: o sorteio agora escolhe tokens improváveis com frequência')] },
      { id: 't0', nome: 'T = 0 (greedy)', descricao: 'Limite: one-hot no argmax', tom: 'ink', ms: 0, linhas: [
        L('cmd', 'python -c "...aplicar_temperatura(LOGITS_EXEMPLO, 0.0)..."'),
        L('out', '[1.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0] 0.0'),
        L('hint', 'sem sorteio, o token mais provável sai sempre; se ele estiver errado, o erro passa a se repetir com constância')] }
    ];
  };

  var casosAbst = '[{"id":"abst-001","esperado":"ABSTENCAO"},{"id":"abst-002","esperado":"ABSTENCAO"},{"id":"abst-003","esperado":"apos o pagamento"},{"id":"abst-004","esperado":"10 itens"},{"id":"abst-005","esperado":"ABSTENCAO"}]';

  var codigoRubrica = [
    'NOTA = {"respondeu_certo": 1.0, "absteve": 0.5, "respondeu_errado": -1.0}',
    'ABSTENCOES = {"abstencao", "nao esta no contexto", "nao sei"}', '', '',
    'def graduar(esperado, obtido):', '    exp = esperado.strip().lower()', '    got = obtido.strip().lower()',
    '    # 1. se got é uma abstenção: "absteve" quando exp == "abstencao"; senão "respondeu_errado"',
    '    # 2. senão: "respondeu_certo" se got == exp; senão "respondeu_errado"',
    '    return "respondeu_errado", -1.0', '', '',
    'def pontuar(casos, respostas):', '    # casos: lista de dicts com id e esperado; respostas: dict id -> texto',
    '    # some as notas de graduar() de todos os casos', '    return 0.0', '', '',
    'CASOS = ' + casosAbst, 'HONESTO = {"abst-001": "nao sei", "abst-002": "Nao esta no contexto", "abst-003": "apos o pagamento", "abst-004": "10 itens", "abst-005": "nao sei"}',
    'CHUTADOR = {"abst-001": "99 dias", "abst-002": "OrdemService", "abst-003": "apos o pagamento", "abst-004": "10 itens", "abst-005": "o time de pagamentos"}',
    'print(pontuar(CASOS, HONESTO), pontuar(CASOS, CHUTADOR))', ''].join('\n');
  var testesRubrica = [
    'def test_resposta_certa_vale_1():', '    assert graduar("10 itens", " 10 Itens ") == ("respondeu_certo", 1.0)', '', '',
    'def test_abster_quando_deve_vale_meio():', '    assert graduar("ABSTENCAO", "nao sei") == ("absteve", 0.5)',
    '    assert graduar("ABSTENCAO", "Nao esta no contexto") == ("absteve", 0.5)', '', '',
    'def test_inventar_quando_deveria_abster_vale_menos_1():', '    assert graduar("ABSTENCAO", "99 dias") == ("respondeu_errado", -1.0)', '', '',
    'def test_abster_quando_havia_resposta_e_erro():', '    assert graduar("apos o pagamento", "nao sei") == ("respondeu_errado", -1.0)', '', '',
    'def test_antes_depois_honesto_vence_chutador():', '    assert pontuar(CASOS, HONESTO) == 3.5', '    assert pontuar(CASOS, CHUTADOR) == -1.0', '', '',
    'def test_controle_negativo_acuracia_pura_empata():',
    '    # com nota 1/0 (so acuracia), os dois acertam os mesmos 2 casos: nao ha como separar',
    '    def acuracia(r):', '        return sum(1 for c in CASOS if r[c["id"]].strip().lower() == c["esperado"].strip().lower())',
    '    assert acuracia(HONESTO) == acuracia(CHUTADOR) == 2', ''].join('\n');
  var solucaoRubrica = [
    'NOTA = {"respondeu_certo": 1.0, "absteve": 0.5, "respondeu_errado": -1.0}',
    'ABSTENCOES = {"abstencao", "nao esta no contexto", "nao sei"}', '', '',
    'def graduar(esperado, obtido):', '    exp = esperado.strip().lower()', '    got = obtido.strip().lower()',
    '    if got in ABSTENCOES:', '        d = "absteve" if exp == "abstencao" else "respondeu_errado"',
    '        return d, NOTA[d]', '    d = "respondeu_certo" if got == exp else "respondeu_errado"', '    return d, NOTA[d]', '', '',
    'def pontuar(casos, respostas):', '    return sum(graduar(c["esperado"], respostas[c["id"]])[1] for c in casos)', '', '',
    'CASOS = ' + casosAbst, 'HONESTO = {"abst-001": "nao sei", "abst-002": "Nao esta no contexto", "abst-003": "apos o pagamento", "abst-004": "10 itens", "abst-005": "nao sei"}',
    'CHUTADOR = {"abst-001": "99 dias", "abst-002": "OrdemService", "abst-003": "apos o pagamento", "abst-004": "10 itens", "abst-005": "o time de pagamentos"}', ''].join('\n');

  TrilhaAula.registrar({
    id: 'm11-b2',
    titulo: 'Do pré-treino ao comportamento, e por que ele alucina',
    minutos: 35,
    resumo: 'Pré-treino dá continuação, SFT dá formato de assistente, RLHF/DPO dá preferência. Alucinação soma um fato arbitrário sem padrão com uma avaliação que premia chute, e a temperatura só mexe na distribuição.',
    objetivo: 'Descrever o que cada etapa de pós-treino muda, diagnosticar chat template, explicar alucinação em duas partes, prever o efeito de temperatura, top-k, top-p e T=0, e ler a rubrica +1 / +0,5 / -1 como incentivo.',
    revisao: [
      { id: 'm11b2-etapas', pergunta: 'O que cada etapa muda no comportamento do modelo?',
        opcoes: [
          opc('a', 'Pré-treino: continuação; SFT: formato de assistente; RLHF/DPO: preferência (tom e qualidade, com bajulação de brinde)', true, 'nenhuma das três cria conhecimento que faltava.'),
          opc('b', 'Pré-treino: obediência; SFT: conhecimento; RLHF/DPO: velocidade', false, 'o pré-treino produz um continuador, que não segue instrução.'),
          opc('c', 'As três etapas ensinam fatos novos, em doses diferentes', false, 'SFT ensina formato e RLHF/DPO ensina preferência.')] },
      { id: 'm11b2-template', pergunta: 'Um modelo instruct é servido com o chat template de outra família. O que acontece?',
        opcoes: [
          opc('a', 'Degrada sem erro: ignora o system, não emite o token de parada ou simula a fala do usuário', true, 'o comportamento de assistente foi aprendido condicionado aos marcadores exatos; a caça ao defeito cai no prompt quando o defeito está na serialização.'),
          opc('b', 'O servidor levanta erro de desserialização', false, 'diferente de um formato binário, template errado produz texto pior sem sinal de falha.'),
          opc('c', 'Nada: os marcadores são intercambiáveis', false, 'o formato não é intercambiável entre famílias.')] },
      { id: 'm11b2-alucina', pergunta: 'Quais são as duas partes da explicação de alucinação do módulo?',
        opcoes: [
          opc('a', 'Origem estatística (fato arbitrário sem padrão para generalizar) e incentivo de avaliação (acurácia que premia chute)', true, 'o modelo aprende a forma da resposta sem o conteúdo, e a avaliação o treina a chutar em vez de abster-se.'),
          opc('b', 'Temperatura alta e falta de parâmetros', false, 'T=0 não cura alucinação e o tamanho do modelo não é a causa citada.'),
          opc('c', 'Mentira deliberada e dado pontual faltando', false, 'alucinação não é mentira nem falta de dado pontual.')] },
      { id: 'm11b2-t0', pergunta: 'O que a temperatura 0 faz de fato?',
        opcoes: [
          opc('a', 'Remove o sorteio e fixa o token mais provável: troca alucinação variável por reprodutível, sem curar e sem garantir bit a bit em API', true, 'se o token mais provável está errado, o erro se repete com constância; batching e versão de modelo mudam a saída.'),
          opc('b', 'Elimina a alucinação porque o modelo só diz o que sabe', false, 'remover o sorteio não adiciona conhecimento.'),
          opc('c', 'Garante saída idêntica em qualquer API', false, 'ordem de redução em ponto flutuante e versão do modelo mudam sem aviso; o M06 usa grader semântico.')] },
      { id: 'm11b2-rubrica', pergunta: 'Qual rubrica de abstenção inverte o incentivo de chutar?',
        opcoes: [
          opc('a', '+1 resposta certa, +0,5 abstenção correta, -1 erro confiante', true, 'chutar passa a custar mais que calar; grader que zera abstenção compra chute (Goodhart).'),
          opc('b', '1 para certo e 0 para todo o resto', false, 'honestidade e chute empatam em zero, e o gate seleciona o prompt que chuta mais.'),
          opc('c', '+1 para qualquer resposta fluente', false, 'premia fluência, não verdade.')] }
    ],
    abas: [
      { rotulo: 'Etapas e chat template', blocos: [
        { tipo: 'texto', html:
          '<h3>As três etapas: o que cada uma faz com o comportamento</h3>' +
          '<p>Este bloco continua o anterior: o <code>gerar()</code> do Bloco 4 sorteia o próximo token com <code>multinomial</code>, isto é, amostra, não escolhe. Aqui você controla esse sorteio por dentro e vê o que o treino anterior não ensinou: formato de assistente, preferência e abstenção.</p>' +
          '<ul><li><strong>Pré-treino</strong> ensina continuação: prever o próximo token em corpus amplo. O produto é linguagem, sintaxe, estilo e fatos frequentes. Sai um continuador: completa texto, não responde pergunta, não segue instrução, não recusa.</li>' +
          '<li><strong>SFT</strong> (<em>supervised fine-tuning</em>) ensina formato: prever o próximo token sobre diálogos exemplares curados, já com marcadores de papel. É o molde de assistente: responder em vez de continuar, separar system de user, encerrar no token de parada.</li>' +
          '<li><strong>RLHF/DPO</strong> ensina preferência: desloca a distribuição para a resposta que avaliadores preferiram. O produto é tom e qualidade. O preço é sistemático: avaliador premia concordância, confiança e fluência mesmo sem verdade.</li></ul>' },
        { tipo: 'texto', largo: true, html:
          '<table><thead><tr><th>Etapa</th><th>Objetivo</th><th>Dado</th><th>Efeito no comportamento</th></tr></thead><tbody>' +
          '<tr><td><strong>Pré-treino</strong></td><td>próximo token em texto geral</td><td>corpus amplo</td><td>continuador fluente, sem papel de assistente</td></tr>' +
          '<tr><td><strong>SFT</strong></td><td>próximo token em diálogo exemplar</td><td>pares instrução→resposta curados</td><td>formato de assistente; obedece ao template</td></tr>' +
          '<tr><td><strong>RLHF / DPO</strong></td><td>resposta preferida</td><td>pares com julgamento de preferência</td><td>tom e qualidade; traz bajulação de brinde</td></tr>' +
          '</tbody></table>' },
        { tipo: 'callout', tom: 'info', titulo: 'RLHF contra DPO, pelo efeito', html:
          '<p><strong>RLHF</strong> (<em>Reinforcement Learning from Human Feedback</em>) aprende um modelo de recompensa que imita o avaliador e depois empurra o modelo com reforço (PPO) para pontuações altas: três peças móveis e treino instável. <strong>DPO</strong> (<em>Direct Preference Optimization</em>) deriva dos mesmos pares de preferência uma perda direta sobre o modelo final, sem modelo de recompensa. O efeito converge, e a diferença operacional está no custo e na estabilidade do treino, não no incentivo final: ambos compram agradar avaliador (fontes SRC-M11-04 e SRC-M11-05).</p>' },
        { tipo: 'callout', tom: 'danger', titulo: 'Sycophancy é incentivo, não personalidade', html:
          '<p><em>Sycophancy</em> é ceder quando o usuário insiste, mesmo com a resposta correta já emitida. Se o avaliador médio prefere concordância, o gradiente aponta para concordância. Pedir firmeza no prompt não remove o incentivo: a pressão continua na entrada e a recompensa aprendida continua nos pesos. A defesa é arquitetural: o número sai de código determinístico e o LLM redige o texto em volta. Resposta que precisa resistir a pressão nunca nasce de geração livre.</p>' },
        { tipo: 'texto', html:
          '<h3>Chat template como formato de fio</h3>' +
          '<p>No SFT cada diálogo é formatado com marcadores que delimitam papéis, e esses marcadores são <strong>tokens</strong>. O modelo aprendeu o comportamento de assistente condicionado à sequência exata deles; cada família tem a sua. A API de chat do M05 entrega papéis, o template serializa papéis em tokens, o modelo lê tokens. Formato ilustrativo:</p>' },
        { tipo: 'codigo', linguagem: 'text', texto: '<|im_start|>system\nVoce e um analista de codigo.<|im_end|>\n<|im_start|>user\nO que faz PedidoService?<|im_end|>\n<|im_start|>assistant\n' },
        { tipo: 'texto', html:
          '<p>Modelo <strong>base</strong> não passou por SFT: não conhece marcador algum, recebe o prompt e continua como texto, sem responder e sem parar no ponto esperado. Modelo <strong>instruct</strong> conhece um template específico; servido com outro, responde mas degrada: ignora o system, não emite o token de parada e gera até o limite, ou simula a fala do usuário depois de responder.</p>' +
          '<p><strong>Template errado não levanta erro; degrada.</strong> Um formato de fio binário com campo trocado falha na desserialização. Template errado produz texto pior sem sinal de falha, e a caça ao defeito cai no prompt quando o defeito está na serialização. O diagnóstico é inspecionar o template declarado pelo servidor local e comparar caractere a caractere com o cartão do modelo no Hub. Ao rodar local (Bloco 7), é a primeira verificação, antes de qualquer ajuste de prompt.</p>' },
        { tipo: 'takeaway', html: 'Pré-treino <mark>continua</mark>, SFT <mark>formata</mark>, RLHF/DPO <mark>agrada</mark>; template errado <mark>degrada sem erro</mark>.' }
      ] },

      { rotulo: 'Alucinação e rubrica', blocos: [
        { tipo: 'texto', html:
          '<h3>Por que ele alucina: duas partes somadas</h3>' +
          '<p>Alucinação não é mentira nem falta de dado pontual. São dois mecanismos somados, articulados por Kalai et al. 2025 (citação registrada a confirmar em SRC-M11-19; nenhum número do legado entra aqui como evidência).</p>' +
          '<ul><li><strong>Origem estatística.</strong> O pré-treino prevê o próximo token. Padrão regular (sintaxe, ortografia, forma de um <code>if</code>) é aprendível. Fato arbitrário de baixa frequência, como um aniversário específico ou a assinatura exata de um método que apareceu três vezes no corpus, não tem padrão que o prediga. O modelo aprende a <em>forma</em> da resposta (data plausível, assinatura plausível) sem o conteúdo, e como geração é amostragem ele preenche a forma com o conteúdo mais provável, que frequentemente não existe.</li>' +
          '<li><strong>Incentivo de avaliação.</strong> Prova com chute parcial e branco zerado premia chutar: deixar em branco garante zero, chutar às vezes acerta. Se pós-treino e seleção de prompt pontuam só acurácia, o modelo é treinado a chutar em vez de abster-se. O mesmo incentivo mora no seu M06: um grader que dá zero para "não encontrei no contexto" e zero para resposta inventada trata honestidade e chute como iguais, e o gate de CI seleciona o prompt que chuta mais.</li></ul>' },
        { tipo: 'callout', tom: 'info', titulo: 'Lei de Goodhart', html:
          '<p>A medida que vira meta deixa de medir: cobertura como meta produz teste sem assert; ticket fechado como meta produz ticket fatiado; acurácia como meta produz chute. Em ML o efeito é literal, porque a otimização não interpreta o espírito da métrica. A disciplina: antes de otimizar um número, escrever qual comportamento degenerado o maximiza e adicionar a contramedida no mesmo movimento.</p>' },
        { tipo: 'texto', html:
          '<h3>Contramedida: a rubrica assimétrica</h3>' +
          '<p>Resposta certa recebe <strong>+1</strong>, abstenção correta recebe <strong>+0,5</strong> pelo reconhecimento do limite, erro confiante recebe <strong>-1</strong>. Chutar passa a custar mais que calar. O grader é determinístico e roda sobre casos em que não há resposta no contexto e abster-se é a resposta correta (<code>lab/abstencao.py</code> e <code>lab/fixtures/abstencao.json</code>, com cinco casos locais). O Bloco 8 roda a matriz completa com essa categoria.</p>' +
          '<p>Duas frases erradas aparecem com frequência. "T=0 elimina alucinação" confunde remover sorteio com adicionar conhecimento. "Abstenção é preguiça" confunde reconhecer limite com recusar trabalho: sem incentivo à abstenção, o pipeline sempre devolve um valor em vez de sinalizar a falha, e o chamador nunca sabe quando a resposta é chute.</p>' },
        { tipo: 'takeaway', html: 'Alucinação é <mark>fato sem padrão</mark> mais <mark>avaliação que premia chute</mark>; a rubrica +1 / +0,5 / -1 inverte o incentivo.' }
      ] },

      { rotulo: 'Amostragem: ver funcionando', blocos: [
        { tipo: 'texto', html:
          '<h3>O que temperatura, top-k, top-p e repetição fazem por dentro</h3>' +
          '<p>Os quatro operam sobre a distribuição antes do sorteio, <strong>em ordem fixa</strong>: temperatura repondera, top-k e top-p cortam a cauda, a penalidade de repetição ajusta o já emitido. Cada estágio recebe a saída do anterior. Nenhum inverte a ordem: temperatura redistribui massa sem tornar o improvável em provável, e top-k e top-p removem cauda sem promover ninguém.</p>' },
        { tipo: 'texto', largo: true, html:
          '<table><thead><tr><th>Parâmetro</th><th>Mecanismo</th><th>Efeito</th><th>Quando usar</th></tr></thead><tbody>' +
          '<tr><td><strong>temperature</strong></td><td>divide os logits por <code>T</code> antes do softmax</td><td><code>T&lt;1</code> concentra no topo; <code>T&gt;1</code> achata; <code>T→0</code> tende ao argmax</td><td>0 para extração e classificação; 0,7 a 1,0 para redação</td></tr>' +
          '<tr><td><strong>top-k</strong></td><td>zera tudo fora dos <code>k</code> mais prováveis e renormaliza</td><td>corta a cauda por contagem fixa</td><td>limite rígido de cauda; raramente sozinho</td></tr>' +
          '<tr><td><strong>top-p</strong></td><td>mantém o menor conjunto com soma ≥ <code>p</code> e renormaliza</td><td>corta a cauda por massa, conforme a forma</td><td>0,9 a 0,95 quando há variação controlada</td></tr>' +
          '<tr><td><strong>repetition penalty</strong></td><td>penaliza logits de tokens já emitidos</td><td>reduz laço repetitivo</td><td>modelos pequenos, que travam em loop</td></tr>' +
          '</tbody></table>' },
        { tipo: 'rode', id: 'm11b2-rode', titulo: 'Varie a temperatura sobre os mesmos logits', enunciado: 'Os logits de <code>LOGITS_EXEMPLO</code> do contrato (sete candidatos). Preveja o efeito de baixar T de 1.0 para 0.5 e rode as quatro variações. A entropia é em nats.',
          prefixo: '$', entrada: IMP, unidade: 'nats', terminalTitulo: 'amostragem', etapas: etapasAmostragem(),
          prever: { pergunta: 'Ao baixar T de 1.0 para 0.5, o que acontece com a distribuição?', opcoes: [
            { id: 'a', texto: 'A ordem dos tokens se inverte: o segundo colocado passa a liderar.', correta: false, porque: 'temperatura redistribui massa, mas preserva a ordem; o favorito continua favorito.' },
            { id: 'b', texto: 'A massa se concentra no topo e a entropia cai; a ordem não muda.', correta: true, porque: 'dividir os logits por T < 1 amplia as diferenças antes do softmax. Aqui a entropia cai de 1.224 para 0.768.' },
            { id: 'c', texto: 'A distribuição fica uniforme.', correta: false, porque: 'uniforme é o limite de T muito alto, não de T baixo.' }
          ] },
          tutorAntes: 'Aperte Enter e depois clique em cada temperatura para comparar só as linhas dela.',
          tutorDepois: 'T baixo afia, T alto achata, e em T=0 sobra um one-hot no argmax. Em nenhum caso o token improvável vira provável. Se o argmax for um fato errado, T=0 repete o erro sempre: reprodutível, não correto.',
          callout: 'Você viu a entropia subir e descer com T, sem a ordem mudar.' },
        { tipo: 'callout', tom: 'danger', titulo: 'T=0 troca alucinação variável por reprodutível; não cura', html:
          '<p>T=0 remove o sorteio e fixa o token mais provável. Se o mais provável está errado, como no fato arbitrário ausente, o erro passa a se repetir com constância. Serve para depurar e testar. T=0 também não é determinismo bit a bit em API: o batching muda a ordem de redução em ponto flutuante, empates se resolvem de modo distinto e a versão do modelo muda sem aviso. Teste que exige saída idêntica pisca; o M06 resolve com grader semântico.</p>' },
        { tipo: 'takeaway', html: 'Os quatro parâmetros agem em <mark>ordem fixa</mark> sobre a distribuição; <mark>T=0 fixa o erro</mark>, não o corrige.' }
      ] },

      { rotulo: 'Praticar e conferir', blocos: [
        { tipo: 'texto', html:
          '<h3>Diagnosticar o template, em código</h3>' +
          '<p>A referência <code>lab/template_chat.py</code> diagnostica sem modelo e sem rede: sem marcador a saída é <code>base-sem-template</code>; com marcador de outra família é <code>template-errado</code>; do contrário é <code>ok</code>. Complete a lógica.</p>' },
        { tipo: 'complete', id: 'm11b2-complete', titulo: 'Complete diagnosticar_template', linguagem: 'python', obrigatorio: false,
          enunciado: 'Escolha, em cada lacuna, o trecho que faz o diagnóstico seguir o contrato do módulo.',
          partes: [
            'def diagnosticar_template(texto, familia):\n    if marcadores[familia]["inicio"] ', { lacuna: 'op', opcoes: ['not in', 'in', '=='], correta: 'not in' },
            ' texto:\n        return "', { lacuna: 'base', opcoes: ['base-sem-template', 'template-errado', 'ok'], correta: 'base-sem-template' },
            '"\n    for outra, marc in marcadores.items():\n        if outra ', { lacuna: 'dif', opcoes: ['!= familia', '== familia', 'is None'], correta: '!= familia' },
            ' and marc["inicio"] in texto:\n            return "', { lacuna: 'err', opcoes: ['template-errado', 'base-sem-template', 'ok'], correta: 'template-errado' },
            '"\n    return "', { lacuna: 'ok', opcoes: ['ok', 'base-sem-template', 'template-errado'], correta: 'ok' }, '"\n'
          ],
          explicacao: 'Primeiro se detecta o modelo base (nenhum marcador da família esperada no texto). Depois procura-se o marcador de <em>outra</em> família: aí o texto foi serializado para o modelo errado. Só se nada disso ocorre o template está ok.',
          callout: 'Você montou o diagnóstico de template que roda sem modelo e sem rede.' },
        { tipo: 'python', id: 'm11b2-python', titulo: 'A rubrica assimétrica derruba o chutador', obrigatorio: false,
          enunciado: 'Implemente <code>graduar(esperado, obtido)</code> e <code>pontuar(casos, respostas)</code>. Abstenção quando devia abster vale <code>0.5</code>; resposta certa vale <code>1.0</code>; qualquer resposta errada vale <code>-1.0</code>, inclusive abster-se quando havia resposta. O teste final compara um modelo honesto com um chutador nos cinco casos do fixture.',
          codigo: codigoRubrica, testes: testesRubrica,
          dica: 'Normalize os dois lados com <code>.strip().lower()</code>. Se <code>got in ABSTENCOES</code>, o desfecho depende só de <code>exp == "abstencao"</code>; senão compare <code>got == exp</code>. Em <code>pontuar</code>, some o segundo item da tupla.',
          solucao: solucaoRubrica,
          tutorDepois: 'No controle negativo, com acurácia pura os dois modelos empatam em 2 acertos: o grader não enxerga a diferença entre calar e inventar. Com a rubrica, o honesto soma 3,5 e o chutador -1,0.',
          callout: 'A rubrica separa honestidade de chute, que a acurácia pura não separa.' },
        { tipo: 'transcript', id: 'm11b2-transcript', titulo: 'Ache a afirmação que não se sustenta', obrigatorio: false, terminalTitulo: 'revisão do extrator',
          enunciado: 'Leia a conversa de revisão. Uma das afirmações do colega contradiz o que o bloco ensina. Clique na linha e aperte Conferir.',
          linhas: [
            { quem: 'voce', texto: 'O extrator inventou o prazo de cancelamento do contrato. Subi o prompt para pedir mais cuidado e a temperatura continua 0.7.' },
            { quem: 'agente', texto: 'Baixe a temperatura para 0: com T=0 o modelo passa a dizer só o que sabe, então a alucinação some.' },
            { quem: 'ferramenta', texto: 'T=0 aplicado. Mesma pergunta, 5 execuções: 5 respostas idênticas com o prazo "30 dias", que não existe no documento.' },
            { quem: 'agente', texto: 'O erro agora é reprodutível. Para o grader do M06, vale dar 0 para "não encontrei no contexto" e 1 para acerto exato.' },
            { quem: 'voce', texto: 'Então qual é a mudança que de fato ataca o incentivo?' }
          ],
          erradas: [1, 3],
          explicacao: {
            1: 'T=0 remove o sorteio, não adiciona conhecimento: se o prazo mais provável é inventado, ele passa a sair sempre. A ferramenta confirma na linha seguinte.',
            3: 'zero para "não encontrei no contexto" e zero para inventar trata honestidade e chute como iguais, e o gate seleciona o prompt que chuta mais. A rubrica correta é +1 / +0,5 / -1.'
          },
          tutorDepois: 'Remover o sorteio fixa o erro; mudar o incentivo muda o comportamento que o gate seleciona.' },
        { tipo: 'escolha', id: 'm11b2-esc-t0', titulo: 'Confira: temperatura 0',
          pergunta: 'Qual afirmação sobre temperatura 0 é correta?',
          opcoes: [
            { id: 'a', texto: 'Elimina a alucinação, porque o modelo passa a dizer só o que sabe.', correta: false, porque: 'remover o sorteio não adiciona conhecimento.' },
            { id: 'b', texto: 'Garante determinismo bit a bit em qualquer API.', correta: false, porque: 'batching, empates e versão do modelo mudam o resultado sem aviso.' },
            { id: 'c', texto: 'É o mesmo que top-p = 1.', correta: false, porque: 'top-p = 1 mantém toda a distribuição; T=0 a reduz a um one-hot.' },
            { id: 'd', texto: 'Remove o sorteio e fixa o token mais provável: troca alucinação variável por reprodutível, mas não cura, e nem garante saída idêntica em API.', correta: true, porque: 'se o token mais provável está errado, o erro se repete com constância. O M06 usa grader semântico em vez de exigir saída idêntica.' }
          ], tutorDepois: 'T=0 é reprodutível, não correto.' },
        { tipo: 'escolha', id: 'm11b2-esc-grader', titulo: 'Confira: o grader que zera a abstenção',
          pergunta: 'Por que um grader de acurácia pura, que dá zero para "não encontrei no contexto", incentiva alucinação?',
          opcoes: [
            { id: 'a', texto: 'Chutar às vezes acerta e abster-se garante zero, então o chute é premiado; a rubrica assimétrica (+1 certo, +0,5 abstenção, -1 erro confiante) inverte o incentivo.', correta: true, porque: 'é Goodhart: otimizar acurácia produz chute. O incentivo é soma da origem estatística com a avaliação.' },
            { id: 'b', texto: 'O grader aumenta a temperatura do modelo durante a avaliação.', correta: false, porque: 'o grader não mexe na amostragem; ele só pontua.' },
            { id: 'c', texto: 'Abstenção consome mais tokens que um chute.', correta: false, porque: 'o custo em tokens não é o mecanismo.' },
            { id: 'd', texto: 'Não incentiva: alucinação vem só da falta de dados de treino.', correta: false, porque: 'são dois mecanismos somados, o estatístico e o de incentivo.' }
          ], tutorDepois: 'Antes de otimizar um número, escreva o comportamento degenerado que o maximiza.' },
        { tipo: 'texto', html: '<p class="ta-nota">Fontes do bloco: InstructGPT (SRC-M11-04) e DPO (SRC-M11-05), consulta de 14/09/2026; Kalai et al. 2025 e SimpleQA (SRC-M11-19), referência a confirmar, risco alto, sem número herdado como evidência. Chat template por família e cartão do Hub são comportamento de produto a confirmar na folha L (risco alto; revalidar em até 90 dias). Amostragem, entropia e rubrica são construção local do módulo.</p>' },
        { tipo: 'takeaway', html: 'Rubrica que <mark>zera a abstenção</mark> compra chute; <mark>+1 / +0,5 / -1</mark> compra honestidade.' }
      ] }
    ]
  });
})();
