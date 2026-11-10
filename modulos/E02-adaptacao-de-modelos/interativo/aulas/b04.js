/* E02 · Bloco 4: preferência (RLHF, DPO) e destilação, com dados sintéticos. Fonte: E02.html#b04. Números do funil e do DPO são ilustrativos/calculados; o caso "os dois polos caem" foi calculado para esta aula com a fórmula da fonte. */
(function () {
  var L = function (kind, text) { return { kind: kind, text: text }; };
  var J = function (a) { return a.join('\n'); };
  function opc(id, texto, correta, porque) { return { id: id, texto: texto, correta: correta, porque: porque }; }

  var etapasDpo = function () {
    return [
      { id: 'ini', nome: 'Início: política = referência', descricao: 'Margem zero', tom: 'dns', ms: 0.693, linhas: [
        L('cmd', 'python dpo.py --beta 0.1 --lw 0 --ll 0'),
        L('out', 'margem = 0.1 x (0 - 0) = 0.000   sigma = 0.500'),
        L('out', 'L = -log sigma(0) = ln 2 = 0.693')] },
      { id: 'passos', nome: 'Alguns passos depois', descricao: 'Preferida sobe 0,4; rejeitada cai 0,2', tom: 'tcp', ms: 0.664, linhas: [
        L('cmd', 'python dpo.py --beta 0.1 --lw 0.4 --ll -0.2'),
        L('out', 'margem = 0.1 x (0.4 - (-0.2)) = 0.060   sigma = 0.515'),
        L('out', 'L = 0.664'),
        L('hint', 'a queda é pequena porque β é pequeno e a margem é pequena: preferência é lenta e delicada por desenho')] },
      { id: 'polos', nome: 'Os dois polos caem', descricao: 'Preferida -0,5; rejeitada -2,0', tom: 'tls', ms: 0.621, linhas: [
        L('cmd', 'python dpo.py --beta 0.1 --lw -0.5 --ll -2.0'),
        L('out', 'margem = 0.1 x (-0.5 - (-2.0)) = 0.150   sigma = 0.537'),
        L('out', 'L = 0.621   (menor que 0.664)'),
        L('hint', 'a perda caiu mais, mas a probabilidade da resposta preferida também diminuiu em relação à referência'),
        L('hint', 'exemplo construído para a aula com a fórmula do bloco; valores ilustrativos')] },
      { id: 'ler', nome: 'O que monitorar', descricao: 'Perda não basta', tom: 'ink', ms: 1, linhas: [
        L('in', 'monitore a log-probabilidade da preferida e o comprimento médio, não só a perda'),
        L('hint', 'a perda só exige a razão entre preferida e rejeitada contra a referência')] }
    ];
  };

  var codigoDpo = J([
    'import math',
    '',
    '',
    'def sigmoide(x: float) -> float:',
    '    return 1.0 / (1.0 + math.exp(-x))',
    '',
    '',
    'def dpo_loss(lr_preferida: float, lr_rejeitada: float, beta: float) -> float:',
    '    """lr_* = log(pi_theta/pi_ref) de cada resposta.',
    '    L = -log sigmoide(beta * (lr_preferida - lr_rejeitada))"""',
    '    return 0.0',
    '',
    '',
    'def polos_caem(lr_preferida: float, lr_rejeitada: float) -> bool:',
    '    """True se a perda melhora por razão, mas a preferida ficou MENOS provável que na referência."""',
    '    return False',
    '',
    '',
    'print(round(dpo_loss(0.4, -0.2, 0.1), 3), polos_caem(-0.5, -2.0))',
    ''
  ]);
  var testesDpo = J([
    'def test_inicio_vale_ln2():',
    '    assert abs(dpo_loss(0.0, 0.0, 0.1) - math.log(2)) < 1e-12',
    '',
    '',
    'def test_exemplo_numerico_da_fonte():',
    '    assert round(dpo_loss(0.4, -0.2, 0.1), 3) == 0.664',
    '',
    '',
    'def test_beta_maior_acelera_a_queda():',
    '    assert dpo_loss(0.4, -0.2, 0.5) < dpo_loss(0.4, -0.2, 0.1)',
    '',
    '',
    'def test_perda_cai_mas_polos_caem():',
    '    assert dpo_loss(-0.5, -2.0, 0.1) < dpo_loss(0.4, -0.2, 0.1)',
    '    assert polos_caem(-0.5, -2.0) is True',
    '',
    '',
    'def test_controle_negativo_preferida_sobe():',
    '    assert polos_caem(0.4, -0.2) is False',
    '',
    '',
    'def test_margem_negativa_aumenta_a_perda():',
    '    assert dpo_loss(-1.0, 1.0, 0.1) > math.log(2)',
    ''
  ]);
  var solucaoDpo = J([
    'import math',
    '',
    '',
    'def sigmoide(x: float) -> float:',
    '    return 1.0 / (1.0 + math.exp(-x))',
    '',
    '',
    'def dpo_loss(lr_preferida: float, lr_rejeitada: float, beta: float) -> float:',
    '    return -math.log(sigmoide(beta * (lr_preferida - lr_rejeitada)))',
    '',
    '',
    'def polos_caem(lr_preferida: float, lr_rejeitada: float) -> bool:',
    '    return lr_preferida < 0 and lr_preferida > lr_rejeitada',
    ''
  ]);

  var codigoFunil = J([
    'def funil(gerados: int, pct_unicos: float, pct_aprovados: float, taxa_erro: float) -> dict:',
    '    """Cada estágio é aplicado sobre o anterior. taxa_erro é a taxa auditada (0 a 1)."""',
    '    unicos = 0',
    '    aprovados = 0',
    '    errados = 0',
    '    return {"unicos": unicos, "aprovados": aprovados, "errados": errados}',
    '',
    '',
    'def aceita(taxa_erro: float, tolerancia: float) -> bool:',
    '    """O número que decide é a taxa de erro auditada, não o volume."""',
    '    return True',
    '',
    '',
    'print(funil(20_000, 0.57, 0.70, 0.06), aceita(0.06, 0.01))',
    ''
  ]);
  var testesFunil = J([
    'def test_funil_do_bloco():',
    '    f = funil(20_000, 0.57, 0.70, 0.06)',
    '    assert f["unicos"] == 11_400',
    '    assert f["aprovados"] == 7_980',
    '    assert round(f["errados"]) == 479',
    '',
    '',
    'def test_funil_do_checkpoint():',
    '    f = funil(30_000, 0.55, 0.80, 0.03)',
    '    assert (f["unicos"], f["aprovados"], round(f["errados"])) == (16_500, 13_200, 396)',
    '',
    '',
    'def test_volume_nao_decide():',
    '    # classificação de 40 categorias tolera 8%; extração de valores monetários não tolera 1%',
    '    assert aceita(0.06, 0.08) is True',
    '    assert aceita(0.06, 0.01) is False',
    '',
    '',
    'def test_controle_negativo_funil_vazio():',
    '    f = funil(0, 0.5, 0.5, 0.5)',
    '    assert f == {"unicos": 0, "aprovados": 0, "errados": 0}',
    ''
  ]);
  var solucaoFunil = J([
    'def funil(gerados: int, pct_unicos: float, pct_aprovados: float, taxa_erro: float) -> dict:',
    '    unicos = round(gerados * pct_unicos)',
    '    aprovados = round(unicos * pct_aprovados)',
    '    errados = aprovados * taxa_erro',
    '    return {"unicos": unicos, "aprovados": aprovados, "errados": errados}',
    '',
    '',
    'def aceita(taxa_erro: float, tolerancia: float) -> bool:',
    '    return taxa_erro <= tolerancia',
    ''
  ]);

  TrilhaAula.registrar({
    id: 'e02-b4',
    titulo: 'Preferência e destilação, e dados sintéticos',
    minutos: 40,
    resumo: 'SFT ensina a imitar uma resposta; preferência ensina qual resposta é melhor; destilação transfere comportamento de um modelo caro para um barato. As duas dependem de dados que muitas vezes são sintéticos, com riscos próprios.',
    objetivo: 'Distinguir RLHF, DPO e destilação pelo que cada um muda, ler a perda do DPO sem se enganar e tratar dado sintético como dado de produção, decidindo pela taxa de erro auditada.',
    revisao: [
      { id: 'e02b4-dpo', pergunta: 'DPO reduz a perda de 0,69 para 0,50, mas as respostas pioram e ficam mais longas. O que verificar primeiro?',
        opcoes: [
          opc('a', 'A log-probabilidade absoluta da preferida (os dois polos podem cair) e o viés de comprimento nos pares', true, 'a perda só exige a razão contra a referência; pares em que a preferida é mais longa ensinam "longo = bom".'),
          opc('b', 'Se β é maior que 2', false, 'β é um botão de rigidez, não explica respostas piores e mais longas.'),
          opc('c', 'O tamanho do vocabulário', false, 'não tem relação com o sintoma.')] },
      { id: 'e02b4-rlhf', pergunta: 'Por que o KL aparece no RLHF?',
        opcoes: [
          opc('a', 'É a rédea que mantém a política perto da referência e limita o reward hacking contra o modelo de recompensa (um proxy)', true, 'sem ele a política explora o proxy com respostas longas, bajuladoras e formatadas.'),
          opc('b', 'Para acelerar o treino do modelo de recompensa', false, 'o KL atua na otimização da política.'),
          opc('c', 'Para aumentar o tamanho do batch', false, 'não tem a ver com o batch.')] },
      { id: 'e02b4-teto', pergunta: 'Qual é o teto de qualidade de um modelo aluno destilado?',
        opcoes: [
          opc('a', 'O professor nos seus dados: o aluno raramente o supera, e herda e solidifica os erros sistemáticos dele', true, 'meça o professor primeiro e leia a licença antes de gerar o dataset.'),
          opc('b', 'O aluno sempre supera o professor', false, 'raramente supera.'),
          opc('c', 'Não há teto', false, 'o teto é o professor nos seus dados.')] },
      { id: 'e02b4-funil', pergunta: 'No funil sintético, qual número decide aceitar o dataset?',
        opcoes: [
          opc('a', 'A taxa de erro auditada, contra o que a tarefa tolera (classificação talvez, valores monetários não)', true, 'o volume final não decide; 6% de 7.980 deixa ≈ 479 exemplos errados.'),
          opc('b', 'O número de exemplos gerados', false, 'gerar muito não diz nada sobre a qualidade.'),
          opc('c', 'A taxa de aprovação do verificador', false, 'o verificador deixa passar erros; a auditoria humana mede.')] },
      { id: 'e02b4-colapso', pergunta: 'O que é colapso de modelo e quando o risco cresce?',
        opcoes: [
          opc('a', 'Perda de diversidade e deterioração das caudas ao treinar recursivamente em dados gerados por modelos; cresce sem dado real fresco e filtrado', true, 'Shumailov et al.; o risco é maior geração após geração sobre dados próprios.'),
          opc('b', 'O modelo para de responder em produção', false, 'isso é indisponibilidade, não colapso de treino.'),
          opc('c', 'Um erro de memória na GPU', false, 'não é falha de hardware.')] }
    ],
    abas: [
      { rotulo: 'RLHF e DPO', blocos: [
        { tipo: 'texto', html:
          '<h3>De "a resposta certa" para "esta é melhor que aquela"</h3>' +
          '<p>SFT ensina o modelo a imitar uma resposta. Muitas qualidades que você quer não se exprimem como "a resposta certa", e sim como "esta é melhor que aquela": mais concisa, mais cautelosa, mais útil. É o território da <strong>otimização por preferência</strong>. O M11 B05 deu o mapa; aqui está o mecanismo.</p>' +
          '<h3>RLHF e seus pontos de falha</h3>' +
          '<p><strong>RLHF</strong> (<em>reinforcement learning from human feedback</em>, InstructGPT, Ouyang et al., 2022) tem três estágios: (1) SFT inicial; (2) treinar um <strong>modelo de recompensa</strong> <code>r(x, y)</code> a partir de comparações humanas, tipicamente sob o modelo de Bradley–Terry, em que <code>P(y_w ≻ y_l | x) = σ(r(x,y_w) − r(x,y_l))</code>; (3) otimizar a política contra a recompensa com RL (PPO), com uma penalidade <strong>KL</strong> que a mantém perto da referência.</p>' +
          '<p>Os pontos de falha são conhecidos. O modelo de recompensa é um proxy, e a política o explora (<strong>reward hacking</strong>: respostas longas, bajuladoras, formatadas, que o proxy ama e o humano não); o KL é a rédea que limita isso; e o pipeline é caro e instável (quatro modelos em memória: política, referência, recompensa, valor).</p>' +
          '<h3>DPO: preferência sem modelo de recompensa</h3>' +
          '<p><strong>DPO</strong> (Rafailov et al., 2023) mostra que, sob o mesmo objetivo de RLHF com KL, a recompensa ótima pode ser reescrita em função das log-probabilidades da política e da referência. O treino vira uma perda de classificação sobre pares:</p>' },
        { tipo: 'codigo', linguagem: 'texto', texto: 'L = -log σ( β · [ log πθ(y_w|x)/π_ref(y_w|x)  -  log πθ(y_l|x)/π_ref(y_l|x) ] )' },
        { tipo: 'texto', html:
          '<p>Em palavras: aumente a probabilidade relativa da resposta preferida <code>y_w</code> sobre a rejeitada <code>y_l</code>, medida contra a referência congelada; <code>β</code> controla a rigidez (valores altos mantêm a política perto da referência). O formato prático é um JSONL com <code>input</code> (mensagens), <code>preferred_output</code> e <code>non_preferred_output</code>, o que a API da OpenAI documenta (turno único, respostas como última mensagem do assistente, beta entre 0 e 2).</p>' },
        { tipo: 'callout', tom: 'danger', titulo: 'Quatro cuidados reais com DPO', html:
          '<ul>' +
          '<li><strong>Os dois polos caem.</strong> A perda só exige a razão; é comum a probabilidade absoluta da preferida também diminuir, e a qualidade cair. Monitore a log-probabilidade da preferida, não só a perda.</li>' +
          '<li><strong>Viés de comprimento.</strong> Se as preferidas são mais longas, o modelo aprende "longo = bom". Controle por pareamento de comprimento ou penalidade.</li>' +
          '<li><strong>Dados fora da política.</strong> Pares de outro modelo informam menos que pares amostrados do próprio modelo ajustado. Recomendação comum: SFT primeiro, depois DPO com pares amostrados do SFT.</li>' +
          '<li><strong>A qualidade da preferência é a qualidade do modelo.</strong> Julgamentos inconsistentes viram política inconsistente; se o juiz é outro LLM, herdam-se os vieses dele (M06 B03).</li></ul>' },
        { tipo: 'texto', html:
          '<p><strong>RL com recompensa verificável</strong> (GRPO e variantes, DeepSeekMath, 2024; DeepSeek-R1, 2025) troca o modelo de recompensa humana por um verificador programático: o código passa nos testes, a resposta numérica confere. É a base dos modelos de raciocínio (bloco 5) e só funciona onde há verificador barato.</p>' },
        { tipo: 'takeaway', html: 'DPO elimina o modelo de recompensa, mas a perda mede só a <mark>razão</mark>: monitore a <mark>probabilidade da preferida</mark> e o comprimento.' }
      ] },

      { rotulo: 'Ver funcionando', blocos: [
        { tipo: 'texto', html:
          '<p>Exemplo numérico da perda do DPO com β = 0,1. No início, a política é a referência e a margem é zero. Preveja o tamanho da queda depois de alguns passos.</p>' },
        { tipo: 'rode', id: 'b4-rode', titulo: 'A perda do DPO, passo a passo', enunciado: 'Rode e clique nas etapas. A barra mostra a perda. Os comandos desta tela são um script ilustrativo (a conta é a do módulo, feita à mão), não parte do lab.',
          prefixo: '$', entrada: 'python dpo.py --beta 0.1 --passos 3', unidade: '', terminalTitulo: 'cálculo ilustrativo', etapas: etapasDpo(),
          prever: { pergunta: 'Depois de alguns passos, a log-razão é +0,4 para a preferida e -0,2 para a rejeitada, com β = 0,1. A perda parte de 0,693. Para onde ela vai?', opcoes: [
            { id: 'a', texto: 'Para perto de zero: o modelo já separa bem as respostas.', correta: false, porque: 'a margem é 0,1 x 0,6 = 0,06, pequena; σ(0,06) é só 0,515.' },
            { id: 'b', texto: 'Para 0,664: uma queda pequena, porque β e a margem são pequenos.', correta: true, porque: 'L = -log σ(0,06) = 0,664; o treino de preferência é lento e delicado por desenho.' },
            { id: 'c', texto: 'Sobe, porque a rejeitada ficou menos provável.', correta: false, porque: 'preferida sobe e rejeitada cai: a margem é positiva e a perda cai.' }
          ] },
          tutorAntes: 'Aperte Enter e abra "Os dois polos caem".',
          tutorDepois: 'A perda caiu de 0,693 para 0,664. No terceiro caso, a perda cai ainda mais (0,621) com a preferida menos provável que na referência: a perda não distingue "preferida subiu" de "rejeitada caiu mais". Esse terceiro cálculo é um exemplo construído para esta aula, com a fórmula do bloco.',
          callout: 'Você viu a perda cair sem que a resposta preferida melhorasse.' },
        { tipo: 'python', id: 'b4-python-dpo', titulo: 'A perda do DPO e o alarme dos polos', obrigatorio: false,
          enunciado: 'Implemente <code>dpo_loss(lr_preferida, lr_rejeitada, beta)</code>, em que <code>lr_*</code> é a log-razão contra a referência, e <code>polos_caem</code>, que devolve <code>True</code> quando a preferida ficou menos provável que na referência (log-razão negativa) embora a margem ainda seja positiva.',
          codigo: codigoDpo, testes: testesDpo,
          dica: 'A perda é <code>-math.log(sigmoide(beta * (lr_preferida - lr_rejeitada)))</code>. Para <code>polos_caem</code>: preferida negativa e ainda maior que a rejeitada.',
          solucao: solucaoDpo,
          tutorDepois: 'Monitore <code>lr_preferida</code> ao longo do treino: se ficar negativa enquanto a perda cai, o alarme dispara antes de você olhar as respostas.',
          callout: 'A perda do DPO e o seu ponto cego estão em código.' },
        { tipo: 'transcript', id: 'b4-transcript', titulo: 'Ache a conclusão que não se sustenta', obrigatorio: false, terminalTitulo: 'revisão do DPO',
          enunciado: 'Leia a conversa de revisão de um DPO (valores ilustrativos, inventados para o exercício). Duas afirmações contradizem o bloco. Clique nas linhas e aperte Conferir.',
          linhas: [
            { quem: 'voce', texto: 'Rodei DPO por três épocas. A perda caiu de 0,69 para 0,50. Os avaliadores acham as respostas mais longas e piores.' },
            { quem: 'agente', texto: 'A perda caiu quase 30%, então o treino funcionou. As respostas ruins devem ser ruído da avaliação.' },
            { quem: 'ferramenta', texto: 'log-probabilidade média da preferida: -41.2 (referência: -33.8) · comprimento médio: 212 tokens (antes: 148)' },
            { quem: 'agente', texto: 'Os pares vieram de outro modelo e não passaram por SFT. Isso é irrelevante: os pares só precisam ter preferida e rejeitada.' },
            { quem: 'voce', texto: 'Então o que eu faço?' }
          ],
          erradas: [1, 3],
          explicacao: {
            1: 'a perda só exige a razão entre preferida e rejeitada contra a referência. A ferramenta mostra o contrário do sucesso: a log-probabilidade da preferida caiu e o comprimento subiu 43%.',
            3: 'pares fora da política informam menos que pares amostrados do próprio modelo; a recomendação é SFT primeiro e DPO com pares amostrados do SFT, controlando o comprimento.'
          },
          tutorDepois: 'Perda caindo, probabilidade da preferida caindo e comprimento subindo: o diagnóstico é viés de comprimento e dados fora da política.' },
        { tipo: 'takeaway', html: 'Perda de preferência baixa é <mark>alarme a investigar</mark>, não sucesso.' }
      ] },

      { rotulo: 'Destilação', blocos: [
        { tipo: 'texto', html:
          '<p>A <strong>destilação</strong> treina um modelo <em>aluno</em> (pequeno) a reproduzir um <em>professor</em> (grande). Em Hinton et al. (2015), o aluno aprende as distribuições suavizadas do professor: <code>KL( softmax(z_t/T) ‖ softmax(z_s/T) )</code> multiplicado por <code>T²</code>, em que a temperatura <code>T &gt; 1</code> revela a "matéria escura" (a probabilidade relativa das classes erradas, que carrega informação sobre semelhança).</p>' +
          '<p>Com LLMs acessados por API você tem texto, não logits; a forma dominante é a <strong>destilação em nível de sequência</strong>: gerar saídas com o professor e fazer SFT do aluno nelas. Duas variantes úteis: destilar o <em>raciocínio</em> (o aluno aprende com a cadeia de passos do professor) e destilar um <em>prompt longo</em> (o aluno aprende o comportamento que o professor tinha só porque recebia 1.800 tokens de instrução, o caso do exemplo do bloco 1). É a forma mais comum de o fine-tuning realmente se pagar.</p>' },
        { tipo: 'texto', largo: true, html:
          '<table><thead><tr><th>Aspecto</th><th>Pergunta de verificação</th></tr></thead><tbody>' +
          '<tr><td>Teto</td><td>O aluno raramente supera o professor; o teto é o professor nos seus dados. Meça o professor primeiro.</td></tr>' +
          '<tr><td>Licença</td><td>Os termos de uso do professor permitem treinar outro modelo com as saídas dele? Muitos fornecedores restringem treinar modelos concorrentes. Leia antes de gerar o dataset.</td></tr>' +
          '<tr><td>Cobertura</td><td>As entradas usadas na geração cobrem a distribuição real, incluindo casos raros e adversariais?</td></tr>' +
          '<tr><td>Erros do professor</td><td>O aluno herda e solidifica os erros sistemáticos. Há verificador ou amostra auditada?</td></tr>' +
          '</tbody></table>' },
        { tipo: 'escolha', id: 'b4-esc-dest', titulo: 'Confira: destilar sem medir o professor',
          pergunta: 'Um time gera 50 mil saídas com um modelo grande, treina o aluno e descobre que ele acerta 71%. Ninguém avaliou o professor. Qual é o problema?',
          opcoes: [
            { id: 'a', texto: 'Nenhum: o aluno sempre supera o professor.', correta: false, porque: 'o aluno raramente supera o professor na tarefa.' },
            { id: 'b', texto: 'Sem o número do professor não se sabe o teto nem se os 71% são herança de erros sistemáticos dele; e falta ler a licença.', correta: true, porque: 'o teto da qualidade é o professor nos seus dados, e o aluno solidifica os erros do professor.' },
            { id: 'c', texto: 'Falta aumentar a temperatura de geração a 2.', correta: false, porque: 'mais temperatura aumenta diversidade, não corrige o teto nem a licença.' }
          ], tutorDepois: 'Meça o professor primeiro; leia a licença antes de gerar.' },
        { tipo: 'takeaway', html: 'O teto do aluno é o <mark>professor medido</mark> nos seus dados, e a <mark>licença</mark> vem antes da geração.' }
      ] },

      { rotulo: 'Dados sintéticos', blocos: [
        { tipo: 'texto', html:
          '<h3>O funil, com medição em cada estágio</h3>' +
          '<p>Dado sintético é barato e escala, e é onde projetos acumulam erro silencioso. O desenho seguro é um funil:</p>' +
          '<ol>' +
          '<li><strong>Semente real.</strong> Parta de entradas reais ou de especialistas; o gerador amplia, não inventa a distribuição.</li>' +
          '<li><strong>Geração diversa</strong> (temperaturas, persona, variação de instrução), registrando modelo, versão e prompt do gerador em cada linha.</li>' +
          '<li><strong>Deduplicação por similaridade</strong> (embeddings do M07; limiar a calibrar).</li>' +
          '<li><strong>Verificação automática</strong> onde possível (executa, valida esquema, confere com fonte) e juiz LLM onde não, com a ressalva de vieses.</li>' +
          '<li><strong>Auditoria humana por amostra</strong> e decisão por taxa de erro.</li>' +
          '<li><strong>Isolamento do teste:</strong> nenhuma entrada do teste, nem parafraseada, entra na geração.</li></ol>' },
        { tipo: 'ordene', id: 'b4-ordene', titulo: 'Ordene os estágios do funil',
          enunciado: 'O isolamento do teste vale em todos os estágios. Ordene os cinco estágios de produção do dado.',
          itens: [
            { id: 'audit', texto: 'Auditoria humana de uma amostra e decisão por taxa de erro' },
            { id: 'gera', texto: 'Geração diversa, registrando modelo, versão e prompt do gerador em cada linha' },
            { id: 'verif', texto: 'Verificação automática (executa, valida esquema, confere com fonte) e juiz LLM onde não houver' },
            { id: 'semente', texto: 'Semente real: entradas reais ou de especialistas' },
            { id: 'dedup', texto: 'Deduplicação por similaridade' }
          ], solucao: ['semente', 'gera', 'dedup', 'verif', 'audit'],
          dica: 'Comece pelo que ancora a distribuição e termine no que decide aceitar.',
          tutorDepois: 'Semente, geração, deduplicação, verificação e auditoria. A auditoria por amostra é o que mede a taxa de erro que decide.' },
        { tipo: 'python', id: 'b4-python-funil', titulo: 'As contas do funil', obrigatorio: false,
          enunciado: 'Implemente <code>funil</code>, em que cada estágio é aplicado sobre o anterior, e <code>aceita</code>, que decide pela taxa de erro auditada contra a tolerância da tarefa. Números do bloco (ilustrativos): 20.000 gerados, 57% únicos (11.400), 70% aprovados (7.980) e 6% de erro auditado (≈ 479).',
          codigo: codigoFunil, testes: testesFunil,
          dica: '<code>unicos = round(gerados * pct_unicos)</code>, depois aprovados sobre únicos, e <code>errados = aprovados * taxa_erro</code>. <code>aceita</code> compara a taxa com a tolerância.',
          solucao: solucaoFunil,
          tutorDepois: 'Aceitar ou não depende de a tarefa tolerar 6% de rótulo errado: classificação com 40 categorias talvez; extração de valores monetários, não. O número que decide é a taxa de erro auditada, não o volume.',
          callout: 'O funil e a regra de aceitação estão em código.' },
        { tipo: 'callout', tom: 'danger', titulo: 'Colapso, contaminação e homogeneidade', html:
          '<ul><li><strong>Colapso de modelo.</strong> Treinar recursivamente em dados gerados por modelos reduz a diversidade e deteriora as caudas da distribuição (Shumailov et al., 2023/2024). O risco é maior ao retreinar geração após geração sobre dados próprios, e menor quando o sintético é misturado a dado real fresco e filtrado.</li>' +
          '<li><strong>Contaminação.</strong> Um dataset gerado por um modelo que viu o seu benchmark pode carregar o benchmark para dentro do treino.</li>' +
          '<li><strong>Homogeneidade.</strong> Saídas de um único gerador têm estilo e vieses dele; o aluno os herda como "a verdade".</li></ul>' },
        { tipo: 'callout', tom: 'danger', titulo: 'Armadilha que pega sênior: preferência vira bajulação', html:
          '<p>Qualquer sinal de preferência humana ou de juiz recompensa respostas que concordam com o usuário, soam confiantes e são longas. Treinar mais nessa direção melhora o placar do juiz e piora o produto, de forma gradual e sem alarme. Inclua na suíte-guarda casos em que o usuário afirma algo falso com convicção, casos em que a resposta correta é curta e casos em que a resposta correta é "não sei", e compare o <strong>comprimento médio</strong> antes e depois como métrica de primeira classe.</p>' },
        { tipo: 'escolha', id: 'b4-esc-juiz', titulo: 'Confira: gerador e juiz',
          pergunta: 'Um time gera o dataset sintético com o modelo X e usa o modelo X como juiz para filtrar. Qual é o risco?',
          opcoes: [
            { id: 'a', texto: 'O juiz aprova o próprio estilo: o filtro não mede qualidade, mede semelhança com o gerador.', correta: true, porque: 'é um dos erros comuns; use verificador automático onde der e auditoria humana por amostra.' },
            { id: 'b', texto: 'Nenhum: o mesmo modelo é mais barato.', correta: false, porque: 'o custo não é o risco; o viés compartilhado é.' },
            { id: 'c', texto: 'O dataset fica pequeno demais.', correta: false, porque: 'o risco é de viés, não de tamanho.' }
          ], tutorDepois: 'Gerador e juiz diferentes, mais verificador automático e auditoria humana.' },
        { tipo: 'takeaway', html: 'Sintético exige <mark>funil medido</mark>, <mark>teste isolado</mark> e dado real fresco para evitar colapso.' }
      ] }
    ]
  });
})();
