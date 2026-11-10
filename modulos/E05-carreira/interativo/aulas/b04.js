/* E05 · Bloco 4: evolução contínua. Fonte: E05.html#b04. Valores de CLT/PJ são aproximação didática; confirme com um contador. */
(function () {
  var L = function (kind, text) { return { kind: kind, text: text }; };
  function opc(id, texto, correta, porque) { return { id: id, texto: texto, correta: correta, porque: porque }; }

  TrilhaAula.registrar({
    id: 'e05-b4',
    titulo: 'Evolução contínua',
    minutos: 40,
    resumo: 'Fontes primárias, rotina de 5 horas, revisão espaçada de Leitner, aprender em público e negociação pelo líquido anual.',
    objetivo: 'Montar uma rotina sustentável com saída verificável, entender o mecanismo do Leitner como decisão de engenharia e comparar propostas pelo líquido anual.',
    abas: [
      { rotulo: 'Entender', blocos: [
        { tipo: 'texto', html:
          '<p>Neste campo, parte do que você aprende expira em meses: nomes de modelos, preços, APIs, bibliotecas. O que dura é o modelo mental (avaliação, contenção de risco, trade-off de custo) e o hábito de verificar. Sem rotina, o sênior estuda três semanas, esgota-se e para; ou consome feeds por inércia e acredita estar aprendendo. A saída é um sistema pequeno, sustentável e com produção pública.</p>' +
          '<h3>Fontes primárias primeiro</h3>' +
          '<p>Hierarquia de confiança, da mais para a menos durável:</p>' +
          '<ol><li><strong>Documentação oficial e changelogs</strong>: dizem o que mudou e o que foi descontinuado. Leia as notas de versão antes dos posts sobre elas.</li>' +
          '<li><strong>Artigos originais</strong> (arXiv, relatórios técnicos de laboratórios): resumo, método, experimentos e a seção de limitações. Procure o conjunto de avaliação e as condições.</li>' +
          '<li><strong>Relatos de engenharia de quem opera</strong>: falhas e números reais.</li>' +
          '<li><strong>Padrões e frameworks de risco</strong>, como o OWASP Top 10 para aplicações com LLM, que dão vocabulário estável de ameaças.</li>' +
          '<li><strong>Resumos, newsletters, vídeos</strong>: úteis para saber o que existe, perigosos como fonte de fato. Trate como índice.</li></ol>' +
          '<p>Quando um resumo afirmar algo que mude uma decisão sua, vá à fonte antes de agir. Em produto e preço, confirme a data: página de preço e limite de uso mudam sem aviso.</p>' },
        { tipo: 'texto', largo: true, html:
          '<h3>Rotina sustentável: 5 horas por semana</h3>' +
          '<p>Um orçamento repetível supera uma maratona mensal.</p>' +
          '<table><thead><tr><th>Bloco semanal</th><th>Tempo</th><th>Atividade</th><th>Saída verificável</th></tr></thead><tbody>' +
          '<tr><td>Fonte primária</td><td>1 h</td><td>Nota de versão, artigo ou relato lido com perguntas</td><td>3 linhas: o que mudou, o que eu faria diferente</td></tr>' +
          '<tr><td>Prática</td><td>2 h</td><td>Experimento no seu projeto: medir, quebrar, melhorar</td><td>Um número novo no README ou uma falha no registro</td></tr>' +
          '<tr><td>Revisão espaçada</td><td>3 x 10 min</td><td>Banco de perguntas com o Leitner do laboratório</td><td>Caixas movendo-se; lapsos listados</td></tr>' +
          '<tr><td>Produção pública</td><td>1 h</td><td>Nota, post curto, PR ou resposta fundamentada</td><td>Um artefato por semana ou quinzena</td></tr>' +
          '</tbody></table>' +
          '<p>Defina também o que <em>não</em> acompanhar: escolha dois ou três eixos (por exemplo avaliação, agentes e segurança) e trate o resto como ruído até aparecer num anúncio real que você quer.</p>' },
        { tipo: 'callout', tom: 'info', titulo: 'Aprender em público', html:
          'Mantenha a barra baixa e o padrão de honestidade alto: notas com a fonte citada, experimentos pequenos com números, "errei isto e descobri aquilo". Evite "dez truques que ninguém conta". Três hábitos: cite a fonte e a data; registre o que não funcionou; responda crítica com dados ou admita o erro e corrija o texto com nota de correção visível. Respeite a confidencialidade do empregador, de clientes e de entrevistas.' },
        { tipo: 'takeaway', html: 'Rotina curta e repetível, com <mark>saída verificável</mark> por bloco; resumo é <mark>índice</mark>, a fonte é a prova.' }
      ] },

      { rotulo: 'Ver funcionando', blocos: [
        { tipo: 'texto', html:
          '<h3>Revisão espaçada: o mecanismo</h3>' +
          '<p>Revisar logo antes de esquecer fortalece a memória mais do que reler em bloco: é o efeito de espaçamento, bem estabelecido (por exemplo, a metanálise de Cepeda e colegas, <em>Psychological Bulletin</em> 132(3), 2006, citada de memória, sem releitura). O <strong>sistema Leitner</strong> implementa isso com caixas: acertou, a carta sobe e o intervalo cresce; errou, volta à caixa 1. No laboratório, os intervalos são <strong>1, 2, 4, 8 e 16 dias</strong>.</p>' +
          '<p>Para o software, isso exige três decisões que você já toma: um <strong>relógio injetável</strong> (testar "daqui a 3 dias" sem esperar), <strong>estado persistente gravado de forma atômica</strong> (uma queda no meio da gravação não zera meses de progresso) e <strong>estado corrompido que falha em voz alta</strong> (<code>erro: cannot load state</code>, saída 2) em vez de recomeçar em silêncio.</p>' +
          '<p>Cuidado com o que memorizar: fatos voláteis (preço, nome de modelo) não pertencem ao banco; mecanismos, trade-offs e modos de falha pertencem. Reescreva cartas que você acerta por reconhecer o texto, não por produzir a resposta.</p>' },
        { tipo: 'rode', id: 'b4-leitner', titulo: 'Uma carta atravessando as caixas',
          enunciado: 'Acompanhe uma carta acertada cinco vezes seguidas e depois errada. Preveja antes de rodar.',
          prefixo: '$', entrada: 'leitner simular --acertos 5 --erro-no-fim', unidade: 'dias', terminalTitulo: 'simulação de Leitner',
          prever: { pergunta: 'Uma carta da caixa 5 é respondida errada. Para onde vai e quando volta?', opcoes: [
            opc('a', 'Desce para a caixa 4 e volta em 8 dias.', false, 'o Leitner do laboratório não desce uma caixa: o erro zera.'),
            opc('b', 'Volta à caixa 1 e reaparece no dia seguinte.', true, 'acerto sobe e alarga o intervalo; erro volta à caixa 1 com revisão em 1 dia.'),
            opc('c', 'Fica na caixa 5 e espera mais 16 dias.', false, 'erro nunca mantém o intervalo.')
          ] },
          etapas: [
            { id: 'd0', nome: 'Dia 0', descricao: 'Carta na caixa 1', tom: 'dns', ms: 1, linhas: [
              L('cmd', 'leitner simular --acertos 5 --erro-no-fim'),
              L('info', 'dia 0: carta nova na caixa 1, vence hoje')] },
            { id: 'sobe', nome: 'Acertos 1 a 4', descricao: 'Sobe e alarga', tom: 'tcp', ms: 16, linhas: [
              L('out', 'dia 0 acerto -> caixa 2, próxima em 2 dias (dia 2)'),
              L('out', 'dia 2 acerto -> caixa 3, próxima em 4 dias (dia 6)'),
              L('out', 'dia 6 acerto -> caixa 4, próxima em 8 dias (dia 14)'),
              L('out', 'dia 14 acerto -> caixa 5, próxima em 16 dias (dia 30)')] },
            { id: 'topo', nome: 'Acerto 5', descricao: 'Teto da caixa 5', tom: 'tls', ms: 16, linhas: [
              L('out', 'dia 30 acerto -> caixa 5 (teto), próxima em 16 dias (dia 46)'),
              L('hint', 'a caixa 5 é o teto: o intervalo para de crescer em 16 dias')] },
            { id: 'erro', nome: 'Erro', descricao: 'Volta à caixa 1', tom: 'request', ms: 1, linhas: [
              L('out', 'dia 46 erro -> caixa 1, próxima em 1 dia (dia 47)')] },
            { id: 'fim', nome: 'Resumo', descricao: '1 lapso registrado', tom: 'ink', ms: 1, linhas: [
              L('in', 'cartas com lapso: 1 de 1. Fatos acertados por reconhecimento merecem reescrita.')] }
          ],
          tutorDepois: 'Erro volta à caixa 1 mesmo depois de meses de acerto: o intervalo longo só vale enquanto a memória se sustenta.',
          callout: 'Você viu o intervalo crescer com o acerto e zerar com o erro.' },
        { tipo: 'texto', html:
          '<p>Um trimestre de evolução, como exemplo de meta com artefatos: ser a pessoa a quem o time recorre para avaliação de IA. Semana 1: ler a seção de limitações de dois artigos sobre LLM como juiz e escrever 3 linhas de cada. Semanas 2 a 4: no Cartógrafo, calibrar o juiz contra 40 casos rotulados por humano, registrar a concordância e publicar a nota com números e limitações. Semanas 5 a 8: um issue bem reportado num projeto de avaliação de código aberto. Semanas 9 a 12: transformar a nota em estudo de caso, no README e no currículo. Revisão espaçada de 10 minutos por dia em <code>evals</code> e <code>producao</code>. No fim, a meta tem artefatos (nota, issue, estudo de caso) e perguntas respondidas com número próprio.</p>' },
        { tipo: 'takeaway', html: 'Acerto <mark>sobe e alarga</mark>; erro <mark>volta à caixa 1</mark>. Relógio injetável e estado atômico são decisões de engenharia.' }
      ] },

      { rotulo: 'Praticar', blocos: [
        { tipo: 'texto', html:
          '<h3>Seu Leitner, com relógio injetável</h3>' +
          '<p>Implemente a regra de transição. O dia atual entra como argumento (<code>hoje</code>), e não por <code>datetime.now()</code>, para testar sem esperar.</p>' },
        { tipo: 'python', id: 'b4-leitner-py', obrigatorio: false, titulo: 'Transição do Leitner',
          enunciado: 'Complete <code>avaliar(carta, acertou, hoje)</code>. <code>carta</code> é um dict com <code>box</code> (1 a 5) e <code>due</code> (dia). Devolva uma <em>nova</em> carta: se acertou, sobe uma caixa (teto 5) e <code>due = hoje + INTERVALOS[nova_caixa - 1]</code>; se errou, volta à caixa 1 com <code>due = hoje + 1</code>. Não altere a carta de entrada. Complete também <code>vencidas(cartas, hoje)</code>: as cartas com <code>due &lt;= hoje</code>.',
          codigo: 'INTERVALOS = [1, 2, 4, 8, 16]\n\n\ndef avaliar(carta, acertou, hoje):\n    # acertou: sobe (teto 5), due = hoje + intervalo da nova caixa\n    # errou: caixa 1, due = hoje + 1\n    return dict(carta)\n\n\ndef vencidas(cartas, hoje):\n    return []\n\n\nprint(avaliar({"box": 1, "due": 0}, True, 0))\n',
          testes: 'def test_acerto_sobe():\n    assert avaliar({"box": 1, "due": 0}, True, 0) == {"box": 2, "due": 2}\n    assert avaliar({"box": 3, "due": 6}, True, 6) == {"box": 4, "due": 14}\n\n\ndef test_erro_volta():\n    assert avaliar({"box": 4, "due": 14}, False, 14) == {"box": 1, "due": 15}\n\n\ndef test_teto_na_caixa_5():\n    assert avaliar({"box": 5, "due": 30}, True, 30) == {"box": 5, "due": 46}\n\n\ndef test_nao_altera_entrada():\n    c = {"box": 2, "due": 2}\n    avaliar(c, True, 2)\n    assert c == {"box": 2, "due": 2}\n\n\ndef test_vencidas():\n    cs = [{"box": 1, "due": 3}, {"box": 2, "due": 5}, {"box": 3, "due": 4}]\n    assert vencidas(cs, 4) == [cs[0], cs[2]]\n\n\ndef test_controle_negativo_nada_vence():\n    assert vencidas([{"box": 2, "due": 9}], 3) == []\n',
          dica: 'Acerto: <code>box = min(5, carta["box"] + 1)</code> e <code>due = hoje + INTERVALOS[box - 1]</code>. Para <code>vencidas</code>, uma list comprehension com <code>c["due"] &lt;= hoje</code>.',
          solucao: 'INTERVALOS = [1, 2, 4, 8, 16]\n\n\ndef avaliar(carta, acertou, hoje):\n    nova = dict(carta)\n    if acertou:\n        nova["box"] = min(5, carta["box"] + 1)\n        nova["due"] = hoje + INTERVALOS[nova["box"] - 1]\n    else:\n        nova["box"] = 1\n        nova["due"] = hoje + 1\n    return nova\n\n\ndef vencidas(cartas, hoje):\n    return [c for c in cartas if c["due"] <= hoje]\n',
          tutorDepois: 'O relógio vem de fora: o teste "daqui a 14 dias" roda em milissegundos. Falta a persistência atômica (gravar em arquivo temporário e trocar com <code>os.replace</code>), que o laboratório cobre.',
          callout: 'Sua regra de Leitner é testável sem esperar dias.' },
        { tipo: 'texto', html:
          '<h3>Negociação: compare o líquido anual</h3>' +
          '<p>Negociação começa antes da proposta: tenha alternativas, saiba o que você valoriza e, se puder, não revele seu número primeiro; pergunte a faixa do cargo. Compare <strong>líquido anual</strong>, não bruto. O que muda em cada vínculo:</p>' },
        { tipo: 'abas', rotulo: 'Vínculo', itens: [
          { rotulo: 'CLT', blocos: [{ tipo: 'texto', html: '<ul><li>Líquido mensal, 13º salário, férias com adicional de 1/3.</li><li>FGTS depositado pelo empregador (reserva, não entra no caixa mensal).</li><li>Benefícios: saúde, alimentação, previdência, participação nos lucros.</li><li>Proteções trabalhistas embutidas.</li></ul>' }] },
          { rotulo: 'PJ ou contractor', blocos: [{ tipo: 'texto', html: '<ul><li>Desconte impostos efetivos e contador.</li><li>Sem 13º, férias remuneradas nem FGTS: o valor de um mês parado sai do seu bolso.</li><li>Plano de saúde e previdência por sua conta; reserva para períodos sem contrato.</li><li>Um bruto PJ maior pode ser equivalente ou menor.</li></ul>' }] },
          { rotulo: 'Remoto internacional', blocos: [{ tipo: 'texto', html: '<ul><li>Câmbio e risco cambial; meio de recebimento e tributação no Brasil.</li><li>Contratação: contractor direto ou empregador de registro (EOR).</li><li>Quem paga equipamento; propriedade intelectual; cláusulas de rescisão.</li><li>Contrato por escrito, revisado por profissional qualificado.</li></ul>' }] }
        ] },
        { tipo: 'python', id: 'b4-proposta', titulo: 'Comparador pelo líquido anual', obrigatorio: false,
          enunciado: 'Os valores são ilustrativos; use os seus e confirme com um contador. Complete <code>liquido_clt(bruto, desc_pct, ben_mes, plr)</code>: <code>liq = bruto * (1 - desc_pct/100)</code>; total = <code>liq*13 + liq/3 + ben_mes*12 + plr + bruto*0.08*13</code> (13º, férias com 1/3, benefícios, PLR e FGTS). E <code>liquido_pj(fat, imp_pct, contador, meses_sem, saude)</code>: meses faturados = <code>12 - meses_sem</code>; total = <code>fat*meses*(1 - imp_pct/100) - contador*12 - saude*12</code>.',
          codigo: 'def liquido_clt(bruto, desc_pct, ben_mes, plr):\n    return 0.0\n\n\ndef liquido_pj(fat, imp_pct, contador, meses_sem, saude):\n    return 0.0\n\n\nprint(liquido_clt(15000, 22, 1500, 0), liquido_pj(22000, 10, 400, 1, 900))\n',
          testes: 'def perto(a, b):\n    return abs(a - b) < 0.01\n\n\ndef test_clt():\n    assert perto(liquido_clt(15000, 22, 1500, 0), 189600.0)\n\n\ndef test_pj():\n    assert perto(liquido_pj(22000, 10, 400, 1, 900), 202200.0)\n\n\ndef test_plr_soma():\n    assert perto(liquido_clt(15000, 22, 1500, 5000), 194600.0)\n\n\ndef test_pj_sem_contrato_reduz():\n    assert liquido_pj(22000, 10, 400, 3, 900) < liquido_pj(22000, 10, 400, 1, 900)\n\n\ndef test_controle_negativo_bruto_pj_maior_nao_e_melhor():\n    assert liquido_pj(16000, 10, 400, 2, 900) < liquido_clt(15000, 22, 1500, 0)\n',
          dica: 'Escreva as fórmulas do enunciado diretamente; a diferença entre CLT e PJ está nos termos que um lado tem e o outro não.',
          solucao: 'def liquido_clt(bruto, desc_pct, ben_mes, plr):\n    liq = bruto * (1 - desc_pct / 100)\n    return liq * 13 + liq / 3 + ben_mes * 12 + plr + bruto * 0.08 * 13\n\n\ndef liquido_pj(fat, imp_pct, contador, meses_sem, saude):\n    meses = 12 - meses_sem\n    return fat * meses * (1 - imp_pct / 100) - contador * 12 - saude * 12\n',
          tutorDepois: 'Aproximação didática: ignora tabela de IR, previdência própria e a segurança jurídica da CLT. Para remoto internacional, some câmbio, tributação e contratação, e leia o contrato com profissional.',
          callout: 'Você comparou propostas por líquido anual, não por bruto.' },
        { tipo: 'texto', html:
          '<ul><li><strong>Negocie o pacote:</strong> escopo e título, orçamento de estudo e conferências, tempo para open source, horas, revisão salarial por marcos, dias de folga.</li>' +
          '<li><strong>Escopo e nível:</strong> por escrito, o que a função decide, a quem responde e as métricas de sucesso dos primeiros 90 dias. Escopo vago vira atribuição infinita.</li>' +
          '<li><strong>Ofertas de mercado:</strong> cite alternativas reais, nunca blefe; a pesquisa de anúncios do Bloco 1 é referência de função, não "valor de mercado" garantido.</li></ul>' },
        { tipo: 'takeaway', html: 'Compare <mark>líquido anual</mark> dos dois lados e negocie o <mark>pacote inteiro</mark>, não só o número.' }
      ] },

      { rotulo: 'Conferir', blocos: [
        { tipo: 'escolha', id: 'b4-esc-leitner', titulo: 'Confira: caixa 4, resposta errada',
          pergunta: 'No Leitner do laboratório, uma carta da caixa 4 é respondida errada. O que acontece?',
          opcoes: [
            opc('a', 'Volta à caixa 1, com revisão no dia seguinte.', true, 'acertou, sobe e o intervalo cresce (1, 2, 4, 8, 16 dias); errou, volta à caixa 1.'),
            opc('b', 'Fica na caixa 4 e espera o mesmo intervalo.', false, 'erro não preserva o intervalo.'),
            opc('c', 'Desce para a caixa 3.', false, 'o laboratório não desce uma caixa.')
          ] },
        { tipo: 'escolha', id: 'b4-esc-proposta', titulo: 'Confira: bruto igual',
          pergunta: 'Uma proposta PJ em dólar e outra CLT em reais têm o mesmo número "bruto". Estão equivalentes?',
          opcoes: [
            opc('a', 'Sim, se o câmbio for igual.', false, 'ainda faltam encargos, férias, 13º, FGTS e risco.'),
            opc('b', 'Não: compare o líquido anual depois de impostos, encargos, férias, 13º, FGTS, benefícios, câmbio e risco de contratação; PJ assume sozinho o que a CLT embute.', true, 'bruto nominal engana; refaça com os seus números e, se possível, com um contador.'),
            opc('c', 'Sim, se o PJ for maior em 20%.', false, 'um percentual fixo não substitui a conta.')
          ] },
        { tipo: 'escolha', id: 'b4-esc-fonte', titulo: 'Confira: resumo ou fonte',
          pergunta: 'Qual a diferença de valor entre ler o resumo de um artigo de modelo e a fonte primária?',
          opcoes: [
            opc('a', 'O resumo transmite a conclusão; a fonte mostra o desenho do experimento, as condições e os limites. A conclusão envelhece primeiro, e a ressalva se perde na cópia.', true, 'em campo que muda rápido, vá à fonte antes de agir.'),
            opc('b', 'Não há diferença se o resumo for de fonte conhecida.', false, 'a ressalva é o que se perde.')
          ] },
        { tipo: 'callout', tom: 'danger', titulo: 'Armadilha que pega sênior', html: 'Confundir experiência com atualização. Quem tem 20 anos tende a pular a fonte primária porque "já viu esse filme", e avaliação de sistema probabilístico não se resolve com a intuição de teste determinístico. Seja iniciante onde o campo diverge do que você conhece, e meça em vez de supor.' },
        { tipo: 'takeaway', html: 'Experiência acelera; <mark>fonte primária</mark> e <mark>medição</mark> corrigem quando o campo diverge.' }
      ] }
    ],
    revisao: [
      { id: 'r1', pergunta: 'No Leitner do laboratório, quais são os intervalos e o que o erro faz?', opcoes: [
        opc('a', '1, 2, 4, 8 e 16 dias; o erro volta a carta à caixa 1.', true, 'acerto sobe de caixa e alarga o intervalo.'),
        opc('b', '1, 3, 7, 14 e 30 dias; o erro desce uma caixa.', false, 'não são os intervalos do laboratório.')] },
      { id: 'r2', pergunta: 'Por que o Leitner exige relógio injetável e estado atômico?', opcoes: [
        opc('a', 'Para testar "daqui a 3 dias" sem esperar e para que uma queda na gravação não zere o progresso; estado corrompido falha em voz alta.', true, 'são decisões de engenharia que você já toma.'),
        opc('b', 'Por desempenho: gravar em bloco é mais rápido.', false, 'o motivo é testabilidade e integridade.')] },
      { id: 'r3', pergunta: 'Como se divide a rotina de 5 horas semanais?', opcoes: [
        opc('a', 'Fonte primária 1 h, prática 2 h, revisão espaçada 3 x 10 min e produção pública 1 h, cada uma com saída verificável.', true, 'inclui também o que não acompanhar.'),
        opc('b', 'Cinco horas de vídeos e newsletters.', false, 'resumos são índice, não prática.')] },
      { id: 'r4', pergunta: 'O que comparar entre uma proposta PJ e uma CLT?', opcoes: [
        opc('a', 'O líquido anual: impostos, contador, 13º, férias, FGTS, benefícios, reserva, câmbio e risco de contratação.', true, 'bruto nominal não é comparação.'),
        opc('b', 'Apenas o valor mensal bruto.', false, 'ignora o que a CLT embute.')] },
      { id: 'r5', pergunta: 'Que fatos não pertencem ao banco de cartas?', opcoes: [
        opc('a', 'Fatos voláteis, como preço e nome de modelo; mecanismos, trade-offs e modos de falha pertencem.', true, 'e reescreva cartas acertadas só por reconhecimento.'),
        opc('b', 'Mecanismos e modos de falha.', false, 'esses pertencem ao banco.')] }
    ]
  });
})();
