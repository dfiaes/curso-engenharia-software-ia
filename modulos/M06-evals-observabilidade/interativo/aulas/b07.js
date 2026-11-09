/* M06 · Bloco 7: Avaliar agentes, skills e a troca de modelo. Fonte: M06.html#b07. Saídas do rode são cálculos reais (math.comb) das fórmulas do bloco; números de custo são hipotéticos, como na fonte. */
(function () {
  var L = function (kind, text) { return { kind: kind, text: text }; };
  function opc(id, texto, correta, porque) { return { id: id, texto: texto, correta: correta, porque: porque }; }

  var stIni = "from math import comb\n\n\ndef pass_k(p, k):\n    \"\"\"Confiabilidade: todas as k tentativas acertam.\"\"\"\n    return p\n\n\ndef pass_at_k(p, k):\n    \"\"\"Capacidade: alguma das k tentativas acerta.\"\"\"\n    return p\n\n\ndef mcnemar_exato(b, c):\n    \"\"\"p-valor exato bicaudal; b = só A acerta, c = só B acerta.\n\n    Sob \"A e B são iguais\", cada caso discordante cai para um lado com 50%:\n    p = 2 * P(X <= min(b, c)), X ~ Binomial(b + c, 0.5), limitado a 1.\n    \"\"\"\n    return 1.0\n";
  var stTestes = "def test_pass_k_cai_com_k():\n    assert abs(pass_k(0.9, 5) - 0.59049) < 1e-6\n    assert pass_k(0.9, 1) == 0.9\n\n\ndef test_pass_at_k_sobe_com_k():\n    assert abs(pass_at_k(0.5, 3) - 0.875) < 1e-9\n\n\ndef test_mcnemar_3_a_0_em_8_casos():\n    assert abs(mcnemar_exato(3, 0) - 0.25) < 1e-9\n\n\ndef test_mcnemar_mesmo_placar_com_mais_casos():\n    assert abs(mcnemar_exato(10, 2) - 79 / 2048) < 1e-9\n    assert mcnemar_exato(10, 2) < 0.05\n\n\ndef test_um_caso_a_menos_nao_distingue():\n    assert abs(mcnemar_exato(9, 2) - 67 / 1024) < 1e-9\n    assert mcnemar_exato(9, 2) > 0.05\n\n\ndef test_sem_discordancia_ou_empate_p_vale_1():\n    assert mcnemar_exato(0, 0) == 1.0\n    assert mcnemar_exato(5, 5) == 1.0\n\n\ndef test_simetrico():\n    assert mcnemar_exato(2, 10) == mcnemar_exato(10, 2)\n";
  var stSol = "from math import comb\n\n\ndef pass_k(p, k):\n    \"\"\"Confiabilidade: todas as k tentativas acertam.\"\"\"\n    return p ** k\n\n\ndef pass_at_k(p, k):\n    \"\"\"Capacidade: alguma das k tentativas acerta.\"\"\"\n    return 1 - (1 - p) ** k\n\n\ndef mcnemar_exato(b, c):\n    \"\"\"p-valor exato bicaudal; b = só A acerta, c = só B acerta.\"\"\"\n    n = b + c\n    if n == 0:\n        return 1.0\n    cauda = sum(comb(n, i) for i in range(min(b, c) + 1)) / 2 ** n\n    return min(1.0, 2 * cauda)\n";
  var cuIni = "def custo_por_sucesso(custo, p):\n    \"\"\"Falha detectável + retry: custo por tentativa / taxa de sucesso.\n    Com p <= 0 o retry nunca termina: levante ValueError.\"\"\"\n    return custo\n\n\ndef custo_silencioso(custo, p, erro):\n    \"\"\"Falha não detectável: cada erro chega a alguém e custa `erro`.\"\"\"\n    return custo\n\n\ndef precisao_revocacao(acionou_certo, acionou_total, devia_acionar):\n    \"\"\"Taxas de acionamento de uma skill, a partir das contagens.\n    Devolve (precisao, revocacao).\"\"\"\n    return 0.0, 0.0\n";
  var cuTestes = "def test_custo_por_sucesso_dos_dois_modelos():\n    assert abs(custo_por_sucesso(0.40, 0.85) - 0.4706) < 1e-3\n    assert abs(custo_por_sucesso(0.05, 0.60) - 0.0833) < 1e-3\n\n\ndef test_taxa_zero_nao_tem_custo_esperado():\n    try:\n        custo_por_sucesso(0.05, 0.0)\n    except ValueError:\n        return\n    raise AssertionError(\"p = 0 deveria levantar ValueError\")\n\n\ndef test_erro_silencioso_inverte_a_escolha():\n    grande = custo_silencioso(0.40, 0.85, 20)\n    barato = custo_silencioso(0.05, 0.60, 20)\n    assert abs(grande - 3.40) < 1e-9 and abs(barato - 8.05) < 1e-9\n    assert grande < barato\n\n\ndef test_sem_erro_o_custo_e_so_o_da_tentativa():\n    assert custo_silencioso(0.05, 0.60, 0) == 0.05\n\n\ndef test_precisao_e_revocacao_do_exemplo():\n    pr, rv = precisao_revocacao(24, 30, 30)\n    assert abs(pr - 0.8) < 1e-9 and abs(rv - 0.8) < 1e-9\n\n\ndef test_sem_falso_positivo_mas_com_falso_negativo():\n    pr, rv = precisao_revocacao(24, 24, 30)\n    assert pr == 1.0 and abs(rv - 0.8) < 1e-9\n";
  var cuSol = "def custo_por_sucesso(custo, p):\n    \"\"\"Falha detectável + retry: custo por tentativa / taxa de sucesso.\"\"\"\n    if p <= 0:\n        raise ValueError(\"taxa de sucesso zero: o retry nunca termina\")\n    return custo / p\n\n\ndef custo_silencioso(custo, p, erro):\n    \"\"\"Falha não detectável: cada erro chega a alguém e custa `erro`.\"\"\"\n    return custo + (1 - p) * erro\n\n\ndef precisao_revocacao(acionou_certo, acionou_total, devia_acionar):\n    \"\"\"Taxas de acionamento de uma skill, a partir das contagens.\"\"\"\n    return acionou_certo / acionou_total, acionou_certo / devia_acionar\n";
  var IMP = 'from stats import mcnemar_exato; ';

  TrilhaAula.registrar({
    id: 'm06-b7',
    titulo: 'Avaliar agentes, skills e a troca de modelo',
    minutos: 40,
    resumo: 'Um agente é um laço, não uma chamada: verifique o estado final, repita k vezes, compare em pares e conte o custo por sucesso, não por token.',
    objetivo: 'Responder com evidência a "essa skill ainda ajuda?" e "o modelo mais barato dá conta?", sabendo o que 8 casos conseguem e não conseguem dizer.',
    revisao: [
      { id: 'm06b7-estado', pergunta: 'O que verificar por máquina em um eval de agente, e para que serve a trajetória?',
        opcoes: [
          opc('a', 'O estado final (teste passa, arquivo existe, nada fora do escopo alterado); a trajetória é diagnóstico, não critério rígido', true, 'exigir "chamou a ferramenta X na ordem Y" pune soluções válidas diferentes da sua.'),
          opc('b', 'A trajetória exata de ferramentas, como critério de aprovação', false, 'dois agentes chegam ao mesmo resultado por caminhos diferentes; o que importa é o efeito.'),
          opc('c', 'Só o texto da resposta final', false, 'ignora efeitos no ambiente e comandos destrutivos pelo caminho.')] },
      { id: 'm06b7-passk', pergunta: 'Um agente acerta 90% por tentativa. Qual a chance de acertar 5 vezes seguidas, se as tentativas fossem independentes?',
        opcoes: [
          opc('a', 'Cerca de 59% (0,9 elevado a 5)', true, 'pass^k = p^k mede confiabilidade; pass@k = 1 - (1-p)^k mede capacidade. Na prática os casos são heterogêneos e a fórmula é ordem de grandeza.'),
          opc('b', '90%', false, 'esse é o pass@1; ele esconde a instabilidade.'),
          opc('c', 'Cerca de 99%', false, 'esse é o raciocínio de pass@k, não de pass^k.')] },
      { id: 'm06b7-mcnemar', pergunta: 'Dois modelos, 8 casos, o novo vence 3 a 0 nos casos que mudaram. O que dizer?',
        opcoes: [
          opc('a', 'p = 0,25 no McNemar exato: não distinguível de ruído; não prova que são iguais, peça 20 a 50 casos e repetições', true, 'três moedas dão três caras 12,5% das vezes; "não sei" não é "iguais".'),
          opc('b', 'O novo é melhor: nunca perdeu', false, 'ignora o poder da amostra.'),
          opc('c', 'São iguais, porque o teste não deu significativo', false, 'ausência de significância é falta de evidência, não evidência de igualdade.')] },
      { id: 'm06b7-custo', pergunta: 'Quando custo por sucesso = custo por tentativa / taxa de sucesso é uma boa conta?',
        opcoes: [
          opc('a', 'Quando a falha é detectável (o teste reprova) e você repete até acertar', true, 'sem verificação a falha vira erro silencioso: custo + (1 - p) x E, e quanto menos verificável a tarefa, mais barato sai o modelo caro.'),
          opc('b', 'Sempre, é só uma divisão', false, 'pressupõe que você sabe quando falhou.'),
          opc('c', 'Nunca: só o preço por token importa', false, 'preço por token não é custo de entrega.')] },
      { id: 'm06b7-skill', pergunta: 'Por que avaliar uma skill também em casos em que ela NÃO deve acionar?',
        opcoes: [
          opc('a', 'Sem casos negativos você mede só a revocação e nunca vê o falso positivo que gasta contexto no resto do trabalho', true, 'precisão = acionamentos corretos / todos os acionamentos; veredito neutro do kit é convite a enxugar ou remover.'),
          opc('b', 'Para aumentar o número de casos', false, 'o objetivo é medir o acionamento errado, não o tamanho da suíte.'),
          opc('c', 'Porque skill nunca deve acionar', false, 'ela só ajuda se for carregada nos casos certos.')] }
    ],
    abas: [
      { rotulo: 'Entender', blocos: [
        { tipo: 'texto', html:
          '<p>Até aqui o objeto avaliado era uma chamada: entrada, saída, grader. Um agente é outra coisa: um laço que lê, decide, executa ferramentas e muda o ambiente ao longo de dezenas de passos. Este bloco leva graders, comparação pareada e gate para esse objeto e responde duas perguntas que aparecem toda semana: <strong>"essa skill ainda ajuda?"</strong> e <strong>"o modelo mais barato dá conta?"</strong>. A versão prática, com o kit em mãos, está na Trilha rápida (Passo 10) e em <code>kit/template/evals</code>.</p>' +
          '<h3>Eval de prompt x eval de agente</h3>' +
          '<p>No eval de prompt você compara uma resposta com uma expectativa. No de agente, a resposta final é só parte do que importa:</p>' +
          '<ul><li><strong>Trajetória:</strong> quais ferramentas, em que ordem, quantas vezes, com que argumentos. Dois agentes chegam ao mesmo resultado, um em 6 passos e outro em 40 (com 7 vezes o custo) ou passando por um comando destrutivo.</li>' +
          '<li><strong>Efeitos no ambiente:</strong> o que se verifica é o <em>estado final</em> (o teste passa, o arquivo existe, o registro foi gravado, nada fora do escopo mudou). O caso carrega uma fixture e um comando de verificação, não uma resposta de referência.</li>' +
          '<li><strong>Não determinismo de várias etapas:</strong> se cada decisão tem alguma chance de desvio, o desvio se acumula ao longo dos passos. Uma execução diz pouco; repita o caso k vezes e olhe a distribuição.</li></ul>' +
          '<p>Regra prática: verifique o <strong>resultado</strong> por máquina e use a trajetória como <strong>diagnóstico</strong> (por que falhou, quanto custou), não como critério rígido.</p>' },
        { tipo: 'callout', tom: 'info', titulo: 'pass@1, pass@k e pass^k', html:
          '<p><strong>pass@1</strong> é a taxa média de acerto por tentativa. <strong>pass@k</strong> é a fração de casos em que <em>alguma</em> das k tentativas acertou (capacidade: você pode tentar de novo e escolher). <strong>pass^k</strong> é a fração em que <em>todas</em> acertaram (confiabilidade: o agente roda sem você).</p>' +
          '<p>Com tentativas independentes e chance de acerto <em>p</em>: pass^k = <em>p</em><sup>k</sup>. Com <em>p</em> = 0,9 e k = 5, 0,9<sup>5</sup> &asymp; 0,59: um agente "90% bom" acerta cinco vezes seguidas só 59% das vezes. Com <em>p</em> = 0,95 e k = 10, &asymp; 0,60. Já pass@k = 1 &minus; (1 &minus; <em>p</em>)<sup>k</sup>: com <em>p</em> = 0,5 e k = 3, 0,875.</p>' },
        { tipo: 'callout', tom: 'neutral', titulo: 'Duas ressalvas à fórmula', html:
          '<p>(1) Tentativas não são perfeitamente independentes (mesmo modelo, mesmo prompt, mesmo defeito na fixture): a fórmula é um guia de ordem de grandeza. (2) Casos são heterogêneos: a média de <em>p</em><sup>k</sup> por caso é maior que (média de <em>p</em>)<sup>k</sup>. No relatório do kit, pass@1 de 83% e k = 3 dariam 0,83<sup>3</sup> &asymp; 57% com casos iguais, mas o pass^k medido foi 75%, porque a maioria dos casos é determinística e poucos concentram a instabilidade. Medir por caso é o que revela isso.</p>' },
        { tipo: 'texto', html:
          '<h3>Tamanho de amostra e variância</h3>' +
          '<p>Com 8 casos e 7 acertos, a taxa observada é 87,5%, mas o intervalo de Wilson de 95% vai de cerca de <strong>53% a 98%</strong>: compatível com um sistema péssimo e com um excelente. Concluir "o modelo A é melhor" com 8 casos é o erro mais comum: a diferença cabe inteira no ruído. Por isso o kit avisa "decisão frágil" com menos de 20 casos e recomenda 20 a 50 casos com k = 3 a 5.</p>' +
          '<p>A variância tem duas fontes que se somam: a escolha dos casos (poucos casos, amostra enviesada) e a amostragem do modelo (o mesmo caso, resultados diferentes). Mais repetições reduzem a segunda; só mais casos reduzem a primeira.</p>' },
        { tipo: 'takeaway', html: 'Verifique o <mark>estado final</mark>, repita <mark>k vezes</mark>: pass^k mede <mark>confiabilidade</mark>, pass@k mede capacidade; com 8 casos, o intervalo é largo demais para decidir.' }
      ] },

      { rotulo: 'Ver funcionando', blocos: [
        { tipo: 'texto', html:
          '<h3>Comparação pareada e McNemar</h3>' +
          '<p>A e B rodam <em>os mesmos casos</em>, então a informação está nos casos em que <strong>discordam</strong>. Chame de <em>b</em> os casos em que só A acerta e de <em>c</em> os em que só B acerta (por pass^k, como no kit). Sob "A e B são iguais", cada caso discordante cai para cada lado com 50%, e o p-valor exato é o da binomial bicaudal: p = 2 &middot; P(X &le; min(<em>b</em>, <em>c</em>)), X ~ Binomial(<em>b</em> + <em>c</em>, 0,5).</p>' +
          '<p>Preveja, rode os três placares do bloco e compare. As saídas são cálculos reais dessa fórmula.</p>' },
        { tipo: 'rode', id: 'b7-rode', titulo: 'Três placares, três vereditos',
          enunciado: 'Aperte Enter e clique em cada etapa. Cada uma calcula o p-valor exato do McNemar para um placar do bloco.',
          prefixo: '$', entrada: 'python -c "from stats import mcnemar_exato; print(mcnemar_exato(3, 0))"', unidade: 's', terminalTitulo: 'McNemar exato',
          etapas: [
            { id: 'p8', nome: '8 casos, 3 a 0', descricao: 'b = 3, c = 0', tom: 'dns', ms: 1, linhas: [
              L('cmd', 'python -c "' + IMP + 'print(mcnemar_exato(3, 0))"'),
              L('out', '0.25'),
              L('hint', 'três contra zero parece decisivo, mas 3 moedas dão 3 caras 12,5% das vezes: p = 2 x 1/8')] },
            { id: 'p40', nome: '40 casos, 10 a 2', descricao: 'b = 10, c = 2', tom: 'request', ms: 1, linhas: [
              L('cmd', 'python -c "' + IMP + 'print(mcnemar_exato(10, 2))"'),
              L('out', '0.03857421875'),
              L('hint', 'abaixo de 0,05: com mais discordâncias, a diferença é detectável')] },
            { id: 'p9', nome: 'Quase lá: 9 a 2', descricao: 'b = 9, c = 2', tom: 'response', ms: 1, linhas: [
              L('cmd', 'python -c "' + IMP + 'print(mcnemar_exato(9, 2))"'),
              L('out', '0.0654296875'),
              L('hint', 'um único caso a menos de discordância muda o veredito: o limiar não é um muro')] }
          ],
          prever: { pergunta: 'O placar 3 a 0 (só três casos discordantes, todos a favor do novo modelo) dá um p-valor...', opcoes: [
            { id: 'a', texto: 'Abaixo de 0,05: nunca perdeu em nenhum caso.', correta: false, porque: 'só 3 discordâncias: a menor probabilidade possível já é 2 x 1/8.' },
            { id: 'b', texto: 'Em 0,25: não distinguível de ruído.', correta: true, porque: 'n = 3, P(X <= 0) = 1/8 = 0,125, bicaudal 0,25. Não prova igualdade; falta evidência.' },
            { id: 'c', texto: 'Em 1,0, porque 8 casos é pouco.', correta: false, porque: 'o p-valor depende das discordâncias, não do total de casos.' }
          ] },
          tutorAntes: 'Aperte Enter e clique nas três etapas, uma por uma.',
          tutorDepois: '"Não distinguível de ruído" não é "iguais": é "ainda não sei". Por isso a regra de decisão se declara antes de ver os dados.',
          callout: 'Você viu o mesmo tipo de placar mudar de veredito conforme o número de casos que discordam.' },
        { tipo: 'texto', html:
          '<p>O kit usa duas coisas separadas: a regra de negócio (a perda de pass^k cabe na tolerância? o custo cai?) e o teste de significância (o que vi passa do acaso?). Trocar de modelo com perda dentro da tolerância e diferença não significativa é aceitável, desde que você saiba que está decidindo com pouca evidência.</p>' },
        { tipo: 'abas', rotulo: 'Custo, skill e regressão', itens: [
          { rotulo: 'Custo por sucesso', blocos: [
            { tipo: 'texto', html:
              '<p>Preço por token não é custo de entrega. O que interessa é o custo por tarefa <strong>bem-sucedida</strong>. Se a falha é <strong>detectável</strong> (o teste reprova, o comando sai com erro) e você repete até acertar, o número de tentativas é geométrico e <strong>custo esperado = custo por tentativa / taxa de sucesso</strong>. Exemplo <em>hipotético</em>: modelo grande a US$ 0,40 e 85% de acerto; modelo barato a US$ 0,05 e 60%.</p>' +
              '<ul><li>Grande: 0,40 / 0,85 &asymp; <strong>US$ 0,47</strong>. Barato: 0,05 / 0,60 &asymp; <strong>US$ 0,083</strong>. O barato custa 5,6 vezes menos por sucesso mesmo errando mais, porque o preço cai mais do que o acerto.</li>' +
              '<li>Ressalvas: o tempo de espera (mais tentativas) e o teto de tentativas que você realmente aceita.</li></ul>' },
            { tipo: 'callout', tom: 'danger', titulo: 'Quando a falha não é detectável', html:
              '<p>Sem verificação, cada falha vira um erro silencioso que chega à revisão, à produção ou ao cliente, com custo <em>E</em>. Custo esperado por tentativa = custo + (1 &minus; <em>p</em>) &middot; <em>E</em>. Com <em>E</em> = US$ 20 (meia hora de uma pessoa para achar e corrigir): grande = 0,40 + 0,15 &middot; 20 = <strong>US$ 3,40</strong>; barato = 0,05 + 0,40 &middot; 20 = <strong>US$ 8,05</strong>. O ponto de equilíbrio é <em>E</em> = 0,35 / 0,25 = US$ 1,40: acima disso o caro compensa.</p>' +
              '<p>Quanto menos verificável a tarefa, mais a confiabilidade pesa e mais barato sai o modelo caro. Com teste automático, o barato com retry costuma ganhar; sem verificação, o custo do erro domina.</p>' }
          ] },
          { rotulo: 'Avaliar uma skill', blocos: [
            { tipo: 'texto', html:
              '<p>Uma skill é um pacote de instruções carregado sob demanda pela descrição. Ela pode ajudar, não fazer nada ou atrapalhar; só a medição diz qual dos três.</p>' +
              '<ul><li><strong>Teste A/B com e sem a skill.</strong> Mesmo agente, mesmo modelo, mesmos casos, k repetições; só a skill muda (no kit, <code>--skill-ab nome</code>, com <code>[variante.com_skill]</code> e <code>[variante.sem_skill]</code>). O ganho é a diferença de pass^k contra a tolerância, mais o McNemar.</li>' +
              '<li><strong>Precisão e revocação do acionamento.</strong> Precisão = acionamentos corretos / todos os acionamentos (o contrário é o <em>falso positivo</em>: acionou à toa). Revocação = acionamentos corretos / casos em que devia acionar (o contrário é o <em>falso negativo</em>). Exemplo <em>hipotético</em>: 30 casos em que deve acionar e 30 em que não deve; aciona em 24 dos primeiros e em 6 dos segundos. Precisão = 24/30 = 80%; revocação = 24/30 = 80%. Sem os 30 negativos você mediria só a revocação e nunca veria os 6 falsos positivos. O relatório do kit entrega as contagens; as taxas saem de uma divisão.</li>' +
              '<li><strong>Skill como dependência a aposentar.</strong> Custa contexto a cada acionamento e manutenção a cada mudança; um modelo novo pode já fazer sem ela. O veredito <em>neutra</em> do kit (sem ganho acima da tolerância) é convite a enxugar ou remover; <em>prejudicial</em>, motivo para remover já. Reavalie a cada troca de modelo.</li>' +
              '<li><strong>LLM-as-judge só calibrado.</strong> Se o critério é irredutivelmente subjetivo, use juiz com rubrica de notas discretas, de outro modelo que o avaliado, calibrado contra notas humanas em 30+ casos (bloco 3). Se dá para escrever um teste, escreva o teste. No kit, o juiz entra como script chamado pelo <code>verificar.comando</code> que devolve exit 0 ou 1.</li></ul>' }
          ] },
          { rotulo: 'Regressão contínua', blocos: [
            { tipo: 'texto', html:
              '<p>O mesmo nome de modelo pode mudar de comportamento sem que você mude uma linha. A avaliação do agente não é um evento, é uma rotina: guarde o relatório aprovado como referência e rode de novo ao <strong>trocar de modelo, criar ou editar uma skill, mudar o <code>AGENTS.md</code></strong> e quando o fornecedor atualizar o modelo.</p>' +
              '<ul><li>Suíte rápida no gate de CI (bloco 6): no PR, quando mexerem em <code>.agents/skills/</code> ou <code>AGENTS.md</code>.</li>' +
              '<li>Suíte agendada (nightly ou semanal), para pegar a mudança do lado do fornecedor sem nenhum commit seu.</li>' +
              '<li>A tolerância de pass^k é o limiar do gate, e a regra de decisão fica escrita antes. É a ideia das "evals contínuas da configuração do agente" do A01 (bloco 4), vista pelo lado da estatística.</li></ul>' }
          ] }
        ] },
        { tipo: 'callout', tom: 'danger', titulo: 'Armadilha que pega sênior', html:
          '<p>Comparar dois modelos com uma única execução por caso e <strong>concluir pelo pass@1</strong>. Com 10 casos e k = 1, uma diferença de 2 casos é ruído; e mesmo com muitos casos, o pass@1 esconde a instabilidade que o pass^k mostra. A variante sofisticada: avaliar a skill só nos casos em que ela <em>deve</em> acionar. Sem casos negativos você mede revocação e jamais vê o falso positivo que gasta contexto em todo o resto do trabalho.</p>' },
        { tipo: 'takeaway', html: 'Compare em <mark>pares</mark>: "ruído" significa <mark>não sei</mark>, não "iguais"; e sem verificação, o <mark>erro silencioso</mark> entra na conta de custo.' }
      ] },

      { rotulo: 'Praticar e conferir', blocos: [
        { tipo: 'texto', html: '<p>Duas funções pequenas fixam as contas do bloco: as estatísticas do eval e o custo por sucesso. Sem rede e sem pacotes, só biblioteca padrão.</p>' },
        { tipo: 'python', id: 'b7-python-stats', titulo: 'pass^k, pass@k e McNemar exato', obrigatorio: false,
          enunciado: 'Implemente <code>pass_k(p, k)</code> (todas acertam), <code>pass_at_k(p, k)</code> (alguma acerta) e <code>mcnemar_exato(b, c)</code>: p = 2 &middot; P(X &le; min(b, c)) com X ~ Binomial(b + c, 0,5), limitado a 1; sem discordâncias, p = 1.',
          codigo: stIni, testes: stTestes,
          dica: 'Com <code>n = b + c</code>, a cauda é <code>sum(comb(n, i) for i in range(min(b, c) + 1)) / 2 ** n</code>. Devolva <code>min(1.0, 2 * cauda)</code> e trate <code>n == 0</code> antes.',
          solucao: stSol,
          tutorDepois: 'O limite em 1 importa: com b = c, a conta bicaudal passaria de 1 e deixaria de ser probabilidade.',
          callout: 'As três funções reproduzem os números do bloco, inclusive o empate e o caso sem discordância.' },
        { tipo: 'python', id: 'b7-python-custo', titulo: 'Custo por sucesso, erro silencioso e acionamento', obrigatorio: false,
          enunciado: 'Implemente <code>custo_por_sucesso(custo, p)</code> (levanta <code>ValueError</code> se p &le; 0), <code>custo_silencioso(custo, p, erro)</code> = custo + (1 &minus; p) &middot; erro e <code>precisao_revocacao(acionou_certo, acionou_total, devia_acionar)</code>, que devolve <code>(precisao, revocacao)</code>.',
          codigo: cuIni, testes: cuTestes,
          dica: 'Custo por sucesso é <code>custo / p</code>. Silencioso: <code>custo + (1 - p) * erro</code>. Precisão divide por <code>acionou_total</code>; revocação divide por <code>devia_acionar</code>.',
          solucao: cuSol,
          tutorDepois: 'Repare que as duas contas de custo respondem a perguntas diferentes: a primeira supõe falha visível; a segunda, falha que chega a alguém.',
          callout: 'Custo com retry, custo com erro silencioso e acionamento da skill, todos calculados.' },
        { tipo: 'cenario', id: 'b7-cenario', titulo: 'Trocar para o modelo barato?', obrigatorio: false,
          enunciado: 'O time quer trocar para o modelo barato "porque o teste deu igual": 8 casos, uma execução cada, pass@1 parecido. As tarefas do agente não têm teste automático de aceite.',
          inicio: 'inicio',
          nos: {
            inicio: { texto: 'Você é o dono da decisão. Qual o primeiro passo?', opcoes: [
              { texto: 'Aprovar: ficou igual e o preço é menor.', vai: 'f-cego', tom: 'ruim', consequencia: 'com 8 casos e k = 1, "igual" é ruído; e pass@1 esconde a instabilidade.' },
              { texto: 'Pedir 20 a 50 casos, k = 3 a 5, e escrever a regra de decisão antes de ver os números.', vai: 'regra', tom: 'ok', consequencia: 'a amostra ganha poder de discriminar e a decisão deixa de ser retrofitada ao resultado.' }
            ] },
            regra: { texto: 'Resultado: pass^k do barato dentro da tolerância, McNemar sem significância. Mas as tarefas não têm verificação automática, e corrigir um erro silencioso custa cerca de meia hora de uma pessoa. Decida.', opcoes: [
              { texto: 'Trocar: dentro da tolerância e o custo por sucesso é bem menor.', vai: 'f-silencioso', tom: 'ruim', consequencia: 'a conta de retry supõe falha detectável; aqui o custo esperado inclui (1 - p) x E.' },
              { texto: 'Calcular o custo com erro silencioso; se E passar do ponto de equilíbrio, manter o modelo caro, ou criar verificação para a tarefa e então reavaliar.', vai: 'f-bom', tom: 'ok', consequencia: 'tarefa menos verificável pesa mais a confiabilidade, e o caro pode sair mais barato.' }
            ] }
          },
          finais: {
            'f-bom': { bom: true, texto: 'Decisão com amostra, pass^k, McNemar e custo com erro silencioso, com a regra escrita antes: dá para repetir e defender.' },
            'f-cego': { bom: false, texto: 'A troca saiu por um empate que era falta de evidência; a qualidade caiu e ninguém sabia medir.' },
            'f-silencioso': { bom: false, texto: 'O custo por token caiu e o custo de entrega subiu: cada erro silencioso chegou à revisão.' }
          },
          callout: 'Você decidiu com amostra suficiente e levou o custo do erro silencioso para a conta.' },
        { tipo: 'escolha', id: 'b7-esc-mcnemar', titulo: 'Confira: 3 a 0 em 8 casos',
          pergunta: 'Você compara dois modelos em 8 casos e o novo ganha de 3 a 0 nos casos que mudaram. O que dizer ao time?',
          opcoes: [
            { id: 'a', texto: 'O novo é melhor: nunca perdeu em nenhum caso.', correta: false, porque: 'um placar sem p-valor ignora que três moedas dão três caras 12,5% das vezes.' },
            { id: 'b', texto: 'Com 8 casos, 3 a 0 dá p = 0,25 no McNemar exato: não distinguível de ruído. Não prova que são iguais; peça mais casos (20 a 50) e repetições antes de decidir.', correta: true, porque: 'ausência de significância é falta de evidência, não evidência de igualdade.' },
            { id: 'c', texto: 'São iguais, porque o teste não deu significativo.', correta: false, porque: 'confunde "não sei" com "iguais".' }
          ] },
        { tipo: 'escolha', id: 'b7-esc-silencioso', titulo: 'Confira: o barato com erro silencioso',
          pergunta: 'O barato tem 60% de acerto a US$ 0,05 por tentativa; o caro, 85% a US$ 0,40. A falha do barato é silenciosa (sem teste automático) e corrigir cada erro custa US$ 20. Qual escolher?',
          opcoes: [
            { id: 'a', texto: 'O barato: custo por sucesso de 0,05/0,60, cerca de US$ 0,083.', correta: false, porque: 'a conta de retry pressupõe que você sabe quando falhou.' },
            { id: 'b', texto: 'O caro, sempre, porque é mais capaz.', correta: false, porque: 'com verificação automática o barato com retry sai bem mais em conta.' },
            { id: 'c', texto: 'O caro: com erro silencioso o custo esperado é custo + (1 - p) x E, que dá US$ 3,40 contra US$ 8,05.', correta: true, porque: 'sem verificação, cada falha vira erro que chega a alguém.' }
          ] },
        { tipo: 'escolha', id: 'b7-esc-skill', titulo: 'Confira: a skill sem casos negativos',
          pergunta: 'Você avalia uma skill só em 30 casos em que ela deve acionar e vê revocação de 80%. O que falta para concluir que ela ajuda?',
          opcoes: [
            { id: 'a', texto: 'Casos em que ela não deve acionar, para medir falsos positivos, e o A/B com e sem a skill com k repetições.', correta: true, porque: 'sem negativos você não vê o contexto gasto à toa; sem A/B não sabe se o ganho é da skill.' },
            { id: 'b', texto: 'Nada: 80% de revocação já prova o ganho.', correta: false, porque: 'revocação não diz nada sobre precisão nem sobre o efeito no resultado.' },
            { id: 'c', texto: 'Um juiz-LLM que dê nota à skill.', correta: false, porque: 'se dá para escrever um teste, escreva o teste; juiz só calibrado.' }
          ] },
        { tipo: 'takeaway', html: 'Decisão de modelo ou skill pede <mark>amostra</mark>, <mark>pass^k</mark>, <mark>regra escrita antes</mark> e <mark>casos negativos</mark>.' }
      ] }
    ]
  });
})();
