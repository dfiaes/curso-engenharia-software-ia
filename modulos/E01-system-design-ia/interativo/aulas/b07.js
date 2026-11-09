/* E01 · Bloco 7: Escrever e defender o design. Fonte: E01.html#b07. */
(function () {
  function opc(id, texto, correta, porque) { return { id: id, texto: texto, correta: correta, porque: porque }; }

  var codigoRubrica = [
    'CRITERIOS = ["requisitos", "estimativa", "desenho", "aprofundamento",',
    '             "tradeoffs", "qualidade", "falhas_custo", "comunicacao"]',
    'ELIMINATORIOS = ["requisitos", "estimativa", "falhas_custo"]', '', '',
    'def avaliar(notas):',
    '    """notas: dict criterio -> 0..3. Devolve (total, "APROVA" ou "REPROVA").',
    '',
    '    Menos de 2 em um critério eliminatório reprova, qualquer que seja o total.',
    '    Critério faltando, desconhecido ou nota fora de 0..3 levanta ValueError."""',
    '    if set(notas) != set(CRITERIOS):',
    '        raise ValueError("critérios devem ser exatamente os oito da rubrica")',
    '    total = 0',
    '    # lacuna: valide cada nota e some',
    '    return total, "APROVA"', '',
    'print(avaliar({c: 3 for c in CRITERIOS}))', ''].join('\n');
  var testesRubrica = [
    'def tudo(n, **mudancas):', '    d = {c: n for c in CRITERIOS}', '    d.update(mudancas)', '    return d', '', '',
    'def test_nota_maxima_aprova():', '    assert avaliar(tudo(3)) == (24, "APROVA")', '', '',
    'def test_brilho_no_desenho_nao_compensa_custo_baixo():',
    '    total, v = avaliar(tudo(3, falhas_custo=1))', '    assert total == 22 and v == "REPROVA"', '', '',
    'def test_nota_baixa_em_criterio_nao_eliminatorio_nao_reprova():',
    '    assert avaliar(tudo(2, comunicacao=0))[1] == "APROVA"', '', '',
    'def test_borda_duas_notas_exatamente_2():', '    assert avaliar(tudo(2)) == (16, "APROVA")', '', '',
    'def test_cada_eliminatorio_reprova():',
    '    for c in ELIMINATORIOS:', '        assert avaliar(tudo(3, **{c: 1}))[1] == "REPROVA"', '', '',
    'def test_entradas_invalidas():',
    '    ruins = [tudo(3, requisitos=4), tudo(3, estimativa=-1), {"requisitos": 3}]',
    '    for notas in ruins:', '        try:', '            avaliar(notas)', '        except ValueError:', '            continue',
    '        assert False, "deveria levantar ValueError"', ''].join('\n');
  var solucaoRubrica = [
    'CRITERIOS = ["requisitos", "estimativa", "desenho", "aprofundamento",',
    '             "tradeoffs", "qualidade", "falhas_custo", "comunicacao"]',
    'ELIMINATORIOS = ["requisitos", "estimativa", "falhas_custo"]', '', '',
    'def avaliar(notas):',
    '    if set(notas) != set(CRITERIOS):',
    '        raise ValueError("critérios devem ser exatamente os oito da rubrica")',
    '    total = 0',
    '    for c in CRITERIOS:',
    '        if not 0 <= notas[c] <= 3:',
    '            raise ValueError("nota fora de 0..3")',
    '        total += notas[c]',
    '    if any(notas[c] < 2 for c in ELIMINATORIOS):',
    '        return total, "REPROVA"',
    '    return total, "APROVA"', ''].join('\n');

  TrilhaAula.registrar({
    id: 'e01-b7',
    titulo: 'Escrever e defender o design',
    minutos: 40,
    resumo: 'Um bom design que ninguém entende ou aprova não vira sistema. O staff escreve para o leitor decidir em 15 minutos e defende distinguindo "não pensei nisso" de "pensei e descartei por este motivo".',
    objetivo: 'Estruturar um design doc de sistema com IA, conduzir os 45 minutos de uma sessão, responder às perguntas de staff com mecanismo e número, e se autoavaliar com a rubrica de oito critérios.',
    revisao: [
      { id: 'e01b7-ordem', pergunta: 'Qual é a lógica da ordem das seções do design doc?',
        opcoes: [
          opc('a', 'Contexto e objetivos antes de requisitos, estimativas antes de desenho, alternativas antes de riscos', true, 'a estimativa decide o que aprofundar; as alternativas só fazem sentido depois que o desenho existe.'),
          opc('b', 'A tecnologia primeiro, para o leitor se situar', false, 'começar pela tecnologia é o primeiro erro que reprova um design.'),
          opc('c', 'A ordem é livre, desde que tenha as 12 seções', false, 'a ordem tem lógica explícita no template do laboratório.')] },
      { id: 'e01b7-semllm', pergunta: 'Um staff pergunta "por que não resolver isso com regras e um modelo pequeno?". Qual resposta mostra senioridade?',
        opcoes: [
          opc('a', 'O baseline sem LLM medido numa amostra, onde as regras deixam de cobrir, custo e qualidade comparados e o gatilho para reconsiderar', true, 'a boa resposta reconhece o ponto, mede e muda o desenho se for o caso.'),
          opc('b', 'Defender o LLM: é o estado da arte', false, 'defender por preferência, sem dado, é o que o revisor staff pune.'),
          opc('c', 'Dizer que a decisão já foi aprovada por cima', false, 'não responde à pergunta.')] },
      { id: 'e01b7-eliminatorio', pergunta: 'Seu design tira 3 em desenho, API, dados e alternativas, mas 1 em custo. O que a rubrica diz?',
        opcoes: [
          opc('a', 'Reprova: menos de 2 em requisitos, estimativa, falhas ou custo reprova, qualquer que seja o total', true, 'critérios eliminatórios impedem que o brilho em desenho compense a falta de números, de falhas previstas ou de custo.'),
          opc('b', 'Aprova: a média passa de 2', false, 'a média não vale para os eliminatórios.'),
          opc('c', 'Depende do avaliador', false, 'a regra é objetiva.')] },
      { id: 'e01b7-tese', pergunta: 'Por que escrever o design como defesa de uma tese é uma armadilha?',
        opcoes: [
          opc('a', 'O revisor percebe as alternativas rebaixadas a rodapé, procura o ponto cego e, ao achar um, desconfia do resto', true, 'um doc melhor expõe a decisão em aberto, põe a alternativa mais forte ao lado e nomeia o que mudaria sua opinião.'),
          opc('b', 'Opinião forte é sempre um defeito', false, 'a opinião é bem-vinda; o problema é esconder a alternativa.'),
          opc('c', 'O doc fica longo demais', false, 'o problema é de conteúdo, não de tamanho.')] },
      { id: 'e01b7-sala', pergunta: 'Em 45 minutos de sessão, onde fica o maior bloco de tempo?',
        opcoes: [
          opc('a', 'No aprofundamento: 15 minutos no ponto que o interlocutor escolher ou onde estiver o risco', true, 'antes vêm 5 de requisitos, 5 de estimativa e 10 de desenho e API; depois, 5 de falhas, custo e evolução.'),
          opc('b', 'No desenho, para listar todos os componentes', false, 'o desenho leva 10 minutos.'),
          opc('c', 'Nos requisitos, que decidem tudo', false, 'requisitos e premissas levam 5 minutos, em voz alta e com confirmação.')] }
    ],
    abas: [
      { rotulo: 'O design doc', blocos: [
        { tipo: 'texto', html:
          '<h3>Por que escrever e defender importa</h3>' +
          '<p>Um bom design que ninguém entende ou aprova não vira sistema. A diferença entre um engenheiro sênior e um staff aparece menos no desenho e mais no <strong>documento</strong>: o staff escreve de modo que o leitor decida em 15 minutos, sabendo o que foi descartado e quais riscos permanecem.</p>' +
          '<p>E aparece na <strong>revisão</strong>: quem defende um design diante de perguntas hostis precisa distinguir "não pensei nisso" (a pergunta melhorou o design) de "pensei e descartei por este motivo" (a pergunta já tinha resposta no documento). Este bloco fecha o módulo com a estrutura do documento, as perguntas que um staff faz, os erros que reprovam e uma rubrica de autoavaliação.</p>' +
          '<p>O formato de design doc e o processo de revisão com IA estão no M04; aqui interessa o conteúdo específico de sistemas com LLM e a defesa.</p>' },
        { tipo: 'texto', largo: true, html:
          '<h3>Estrutura de um design doc de sistema com IA</h3>' +
          '<p>O template do laboratório (<code>template/DESIGN-DOC.md</code>) tem doze seções. A ordem tem lógica: contexto e objetivos antes de requisitos, estimativas antes de desenho, alternativas antes de riscos.</p>' +
          '<table><thead><tr><th>Seção</th><th>Pergunta que responde</th><th>Sinal de que está fraca</th></tr></thead><tbody>' +
          '<tr><td>1–2 Contexto, objetivos e não-objetivos</td><td>por que agora e o que ficará de fora?</td><td>objetivos que não dá para verificar ("melhorar o atendimento")</td></tr>' +
          '<tr><td>3 Requisitos</td><td>que números definem "funcionou"?</td><td>"baixa latência", "alta qualidade", sem valor nem forma de medir</td></tr>' +
          '<tr><td>4 Estimativas</td><td>qual a ordem de grandeza e quais premissas?</td><td>números soltos, sem premissa; custo ausente</td></tr>' +
          '<tr><td>5–6 API, dados e desenho</td><td>que contratos e fluxos, incluindo o de falha?</td><td>só o caminho feliz; sem identificação de dono do dado</td></tr>' +
          '<tr><td>7 Aprofundamento</td><td>quais 2 a 3 decisões determinam o projeto?</td><td>profundidade uniforme (o mesmo detalhe em tudo)</td></tr>' +
          '<tr><td>8 Alternativas</td><td>o que foi considerado e rejeitado, e por quê?</td><td>alternativas de palha ou ausentes</td></tr>' +
          '<tr><td>9 Avaliação e observabilidade</td><td>como saberemos se funciona e se piorou?</td><td>sem conjunto de avaliação, sem SLO de qualidade, sem política do que não registrar</td></tr>' +
          '<tr><td>10 Falhas, segurança e custo máximo</td><td>o que quebra, quem percebe, quanto pode custar no pior caso?</td><td>sem teto de gasto; sem resposta a falha do provedor</td></tr>' +
          '<tr><td>11–12 Entrega e riscos em aberto</td><td>o que é a V1, quando evoluir, o que não sabemos?</td><td>V1 igual ao sistema final; nenhum risco listado</td></tr>' +
          '</tbody></table>' },
        { tipo: 'texto', html:
          '<h3>Princípios de escrita</h3>' +
          '<ul><li>O resumo cabe em cinco linhas e contém a <strong>decisão pedida</strong>.</li>' +
          '<li>Cada número tem a sua premissa.</li>' +
          '<li>Cada recomendação tem a sua alternativa.</li>' +
          '<li>A seção 12 admite o que se ignora.</li></ul>' +
          '<p>Um doc que não declara incerteza passa a impressão de que o autor não a enxergou.</p>' },
        { tipo: 'takeaway', html: 'O leitor deve <mark>decidir em 15 minutos</mark>: resumo de cinco linhas, <mark>número com premissa</mark>, recomendação com <mark>alternativa</mark> e incerteza declarada.' }
      ] },

      { rotulo: 'A sala e a defesa', blocos: [
        { tipo: 'texto', html:
          '<h3>Do doc à sala: a primeira meia hora</h3>' +
          '<p>Em entrevista ou revisão presencial, o tempo é escasso (cerca de 45 minutos) e o método do bloco 1 vira roteiro. Anuncie o que você vai fazer e o que deixará de fora; comece simples e complique somente quando um número justificar. Quem começa por "vou usar Kafka, Redis e um banco vetorial" mostra repertório de componentes, não raciocínio. O E05 trata a preparação e o formato oral.</p>' },
        { tipo: 'ordene', id: 'b7-ordene', titulo: 'Os 45 minutos de uma sessão', obrigatorio: false,
          enunciado: 'Ordene as fases da sessão de system design, da primeira à última.',
          itens: [
            { id: 'd', texto: '15 min: aprofundar no ponto de risco' },
            { id: 'b', texto: '5 min: estimativa em um canto do quadro' },
            { id: 'e', texto: '5 min: falhas, custo e evolução' },
            { id: 'a', texto: '5 min: requisitos e premissas em voz alta (e peça a confirmação)' },
            { id: 'c', texto: '10 min: desenho e API' }
          ],
          solucao: ['a', 'b', 'c', 'd', 'e'],
          dica: 'A estimativa decide o que aprofundar, então vem antes do desenho; o aprofundamento (o maior bloco) vem depois do desenho.',
          tutorDepois: 'O aprofundamento vai para o ponto que o interlocutor escolher ou onde estiver o risco.' },
        { tipo: 'texto', largo: true, html:
          '<h3>Perguntas de staff (e o que elas procuram)</h3>' +
          '<table><thead><tr><th>Pergunta</th><th>O que o revisor procura</th><th>Resposta forte</th></tr></thead><tbody>' +
          '<tr><td>"Por que não fazer isto sem LLM?"</td><td>se o LLM é necessário ou moda</td><td>onde regras bastam, bastam; o LLM entra na parte em que a variabilidade da entrada inviabiliza regras, e há baseline sem LLM para comparar</td></tr>' +
          '<tr><td>"Quanto custa por usuário, e o que o dobra?"</td><td>modelo de custo e alavancas</td><td>custo por requisição com premissas, sensibilidade a tamanho de contexto e passos, teto e alerta</td></tr>' +
          '<tr><td>"O que acontece quando o provedor cai ou muda o modelo?"</td><td>dependência e regressão</td><td>fallback, degradação definida, versões fixas, avaliação na CI e canário</td></tr>' +
          '<tr><td>"Como você sabe que a qualidade não caiu?"</td><td>avaliação contínua</td><td>conjunto de ouro, amostra julgada em produção, alerta em SLI de qualidade</td></tr>' +
          '<tr><td>"Um tenant pode ver dado de outro?"</td><td>isolamento</td><td>filtro na consulta, cache escopado, teste de isolamento, auditoria</td></tr>' +
          '<tr><td>"E se a mesma ação rodar duas vezes?"</td><td>idempotência de efeitos</td><td>chave determinística, log de efeitos, verificação por leitura, aprovação humana onde não há verificação</td></tr>' +
          '<tr><td>"Onde isso quebra primeiro com 10× de carga?"</td><td>consciência de gargalo</td><td>cota de TPM e concorrência de streaming, depois custo; a infraestrutura clássica só depois</td></tr>' +
          '<tr><td>"O que você não vai construir na V1?"</td><td>disciplina de escopo</td><td>lista explícita, com o gatilho para construir</td></tr>' +
          '</tbody></table>' },
        { tipo: 'cenario', id: 'b7-cenario', titulo: 'A revisão com o staff', obrigatorio: false,
          enunciado: 'Você apresenta o design do assistente de suporte com RAG para um staff. Decida como reagir a cada momento da revisão.',
          inicio: 'inicio',
          nos: {
            inicio: { texto: 'O staff pergunta: "por que não resolver isso com regras e um modelo pequeno?". Como você responde?', opcoes: [
              { texto: 'Defender o LLM: é o estado da arte.', vai: 'f-moda', tom: 'ruim', consequencia: 'defesa por preferência, sem dado, é o que o revisor staff pune.' },
              { texto: 'Admitir que não pensou e propor refazer tudo.', vai: 'f-refaz', tom: 'ruim', consequencia: 'a pergunta tinha resposta: você mediu um baseline, só não o apresentou.' },
              { texto: 'Mostrar o baseline sem LLM medido numa amostra, onde as regras deixam de cobrir, custo e qualidade comparados, e o gatilho para reconsiderar.', vai: 'cego', tom: 'ok', consequencia: 'a pergunta já tinha resposta no documento; você a aponta com número.' }
            ] },
            cego: { texto: 'O staff acha um ponto que você não previu: o que acontece no primeiro pico, com a cota de TPM. Como você reage?', opcoes: [
              { texto: 'Tratar como ataque e defender o desenho como está.', vai: 'f-defende', tom: 'ruim', consequencia: 'defender em vez de decidir: o revisor passa a desconfiar do resto.' },
              { texto: 'Reconhecer o ponto, medir o TPM com as premissas do doc e mudar o desenho se o número pedir.', vai: 'doc', tom: 'ok', consequencia: 'aqui a pergunta melhorou o design: reconhecer, medir e, se for o caso, mudar.' },
              { texto: 'Dizer que fica para a V2, sem número.', vai: 'f-v2', tom: 'ruim', consequencia: 'sem número nem gatilho, a V2 é esperança.' }
            ] },
            doc: { texto: 'Na revisão seguinte, como o documento expõe a decisão?', opcoes: [
              { texto: 'Conclusão no título e as alternativas em notas de rodapé.', vai: 'f-tese', tom: 'ruim', consequencia: 'é o doc que defende uma tese: o revisor procura o ponto cego.' },
              { texto: 'Decisão pedida em aberto, recomendação com a alternativa mais forte ao lado e o que mudaria sua opinião (por exemplo, "se o hit rate de cache for menor que 5%, retiramos o cache").', vai: 'f-bom', tom: 'ok', consequencia: 'o revisor decide em 15 minutos, sabendo o que foi descartado e quais riscos ficam.' }
            ] }
          },
          finais: {
            'f-bom': { bom: true, texto: 'O staff aprovou: o doc pediu uma decisão, mostrou a alternativa mais forte e nomeou os gatilhos de revisão.' },
            'f-moda': { bom: false, texto: 'O staff concluiu que o LLM era moda e passou o resto da revisão procurando outros pontos fracos.' },
            'f-refaz': { bom: false, texto: 'A revisão virou recomeço: um design sólido foi descartado por falta de defesa.' },
            'f-defende': { bom: false, texto: 'O clima azedou e cada pergunta seguinte foi tratada como ataque.' },
            'f-v2': { bom: false, texto: 'O risco ficou sem dono: o primeiro pico chegou antes da V2.' },
            'f-tese': { bom: false, texto: 'O staff leu as alternativas de rodapé, achou um ponto cego e passou a duvidar do resto do documento.' }
          },
          callout: 'Você reconheceu o ponto, mediu e expôs a decisão com a alternativa ao lado.' },
        { tipo: 'takeaway', html: 'Na defesa: <mark>reconheça, meça e mude</mark> o desenho se for o caso; não trate toda pergunta como <mark>ataque</mark>.' }
      ] },

      { rotulo: 'Erros e rubrica', blocos: [
        { tipo: 'texto', html:
          '<h3>Erros comuns que reprovam um design</h3>' +
          '<ul><li><strong>Começar pela tecnologia</strong> em vez de pelo requisito e pelo número.</li>' +
          '<li><strong>Complexidade sem números:</strong> filas, sharding e cache semântico em um sistema de 4 QPS.</li>' +
          '<li><strong>Ausência de custo:</strong> o sistema funciona e é inviável financeiramente, e ninguém calculou.</li>' +
          '<li><strong>Qualidade como esperança:</strong> sem conjunto de avaliação, sem SLO de qualidade, sem rollback de prompt.</li>' +
          '<li><strong>Só caminho feliz:</strong> nenhuma resposta a 429, timeout, índice velho, loop de agente, saída inválida.</li>' +
          '<li><strong>Segurança como anexo:</strong> permissão aplicada no fim da cadeia, credencial no prompt.</li>' +
          '<li><strong>Alternativas de fachada:</strong> opções que ninguém escolheria, para parecer que houve análise.</li>' +
          '<li><strong>Defender, em vez de decidir:</strong> tratar toda pergunta como ataque. A boa resposta reconhece o ponto, mede e muda o desenho se for o caso.</li></ul>' },
        { tipo: 'texto', largo: true, html:
          '<h3>Rubrica de autoavaliação</h3>' +
          '<p>Pontue cada critério de 0 a 3 (0 ausente, 1 mencionado, 2 correto, 3 com números e alternativa). <strong>Menos de 2 em requisitos, estimativa, falhas ou custo reprova, qualquer que seja o total.</strong></p>' +
          '<table><thead><tr><th>Critério</th><th>3 pontos significam</th></tr></thead><tbody>' +
          '<tr><td>Requisitos e premissas</td><td>funcionais e não funcionais com valor e forma de medir; premissas escritas e questionadas</td></tr>' +
          '<tr><td>Estimativa</td><td>QPS de pico, concorrência, cota RPM e TPM, custo mensal, armazenamento; refazível por outra pessoa</td></tr>' +
          '<tr><td>Desenho e contratos</td><td>fluxo de ponta a ponta, API, modelo de dados, caminho de falha</td></tr>' +
          '<tr><td>Aprofundamento</td><td>os 2–3 pontos decisivos tratados com mecanismo, não só nome</td></tr>' +
          '<tr><td>Trade-offs e alternativas</td><td>cada decisão com a alternativa real, o custo da escolha e o gatilho para revisitar</td></tr>' +
          '<tr><td>Qualidade e avaliação</td><td>conjunto de ouro, eval contínua, SLO de qualidade, rollback</td></tr>' +
          '<tr><td>Falhas, segurança e custo máximo</td><td>tabela de falhas, isolamento, idempotência, teto de gasto, fallback</td></tr>' +
          '<tr><td>Comunicação</td><td>resumo de cinco linhas, decisão pedida explícita, incertezas declaradas</td></tr>' +
          '</tbody></table>' },
        { tipo: 'callout', tom: 'danger', titulo: 'Armadilha que pega sênior: escrever o design como defesa de uma tese', html:
          '<p>O sênior experiente tem opinião forte, e o doc sai com a conclusão no título e as alternativas rebaixadas a notas de rodapé. O revisor staff percebe, procura o ponto cego e, ao achar um, desconfia do resto. Um doc melhor <strong>expõe a decisão em aberto</strong>, apresenta a recomendação com a alternativa mais forte do lado e nomeia o que mudaria sua opinião: "se o hit rate de cache for menor que 5%, retiramos o cache; se a taxa de escalonamento passar de 40%, voltamos ao modelo único".</p>' },
        { tipo: 'takeaway', html: 'A rubrica tem <mark>critérios eliminatórios</mark>: sem <mark>números, falhas ou custo</mark>, brilho em desenho não salva o design.' }
      ] },

      { rotulo: 'Praticar e conferir', blocos: [
        { tipo: 'python', id: 'b7-python', titulo: 'A rubrica como código', obrigatorio: false,
          enunciado: 'Complete <code>avaliar(notas)</code>: valide que as oito chaves estão presentes e cada nota fica entre 0 e 3, some o total e devolva <code>"REPROVA"</code> se qualquer critério eliminatório (<code>requisitos</code>, <code>estimativa</code>, <code>falhas_custo</code>) tiver menos de 2, qualquer que seja o total; senão <code>"APROVA"</code>.',
          codigo: codigoRubrica, testes: testesRubrica,
          dica: 'Percorra <code>CRITERIOS</code>: levante <code>ValueError</code> se a nota sair de 0..3 e acumule em <code>total</code>. Depois, <code>any(notas[c] &lt; 2 for c in ELIMINATORIOS)</code> decide o veredito.',
          solucao: solucaoRubrica,
          tutorDepois: 'Um design com total 22 de 24 reprova se a nota de custo for 1: o eliminatório vence a média.',
          callout: 'A regra eliminatória passou nos testes, incluindo borda e entrada inválida.' },
        { tipo: 'escreva', id: 'b7-escreva-defesa', titulo: 'Responda ao staff em 90 segundos', obrigatorio: false,
          enunciado: 'Um staff pergunta: "por que não resolver isso com regras e um modelo pequeno?" (o assistente de suporte com RAG). Escreva a resposta como a diria em voz alta.',
          placeholder: 'Medi um baseline sem LLM em… As regras deixam de cobrir… Comparando custo e qualidade… Eu reconsideraria se…',
          rubrica: [
            'Baseline <strong>sem LLM</strong>, medido numa amostra.',
            'O ponto em que as <strong>regras deixam de cobrir</strong>.',
            '<strong>Custo e qualidade comparados</strong>, com números.',
            '<strong>Gatilho</strong> para reconsiderar.',
            'Tom de quem decide, não de quem defende.'
          ],
          modelo: '<p>Medi esse baseline: regras com um modelo pequeno, numa amostra rotulada. Elas cobrem bem os casos de formulação fixa, mas deixam de cobrir as perguntas com variação de linguagem, que são a maior parte do volume. Comparando, o LLM com RAG entrega mais qualidade pelo custo por requisição que calculei, e o baseline continua como fallback e como termo de comparação nas evals. Se a qualidade do baseline chegar perto da do LLM em uma nova amostra, ou se o custo por usuário passar do teto, eu reconsidero e voltamos ao desenho simples.</p><p><strong>Reprova:</strong> defender por preferência ("é o estado da arte") ou com tom defensivo, sem dado.</p>' },
        { tipo: 'escreva', id: 'b7-escreva-resumo', titulo: 'O resumo de cinco linhas', obrigatorio: false,
          enunciado: 'Escreva o resumo de cinco linhas de um design doc para a classificação automática de e-mails de um SAC (20 mil por dia, resposta em até 1 hora, 40 categorias, encaminhar a um humano ou responder com modelo pronto). Resuma o doc que você escreveria, com a decisão pedida.',
          placeholder: 'Decisão pedida… Recomendação… Alternativa mais forte… Números e premissas… O que mudaria minha opinião…',
          rubrica: [
            'A <strong>decisão pedida</strong> está explícita.',
            'Cada número vem com a sua <strong>premissa</strong>.',
            'A recomendação tem a <strong>alternativa</strong> mais forte ao lado.',
            'O que <strong>mudaria sua opinião</strong> (gatilho).',
            'Incerteza declarada, cabendo em cinco linhas.'
          ],
          modelo: '<p>Peço a decisão de adotar classificação por modelo pequeno com validação e revisão humana na baixa confiança. Premissa: 20 mil e-mails por dia em 12 horas, com pico de 3×, o que dá algo como 1,4 e-mails por segundo no pico. A alternativa mais forte é um classificador de regras com busca por palavras-chave, mais barato e previsível; foi descartada porque cobre mal as 40 categorias com variação de linguagem, ponto a medir no piloto. Eu mudaria a recomendação se a taxa de escalonamento ao modelo maior passar de 40% ou se o baseline de regras chegar perto da qualidade medida. O que não sei: a taxa real de baixa confiança, que o piloto vai medir.</p><p><strong>Reprova:</strong> uma lista de tecnologias sem números nem decisão pedida.</p>' },
        { tipo: 'escolha', id: 'b7-esc-semllm', titulo: 'Confira: a pergunta do staff',
          pergunta: 'Um staff pergunta "por que não resolver isso com regras e um modelo pequeno?". Qual resposta mostra senioridade?',
          opcoes: [
            { id: 'a', texto: 'Defender o LLM: é o estado da arte', correta: false, porque: 'preferência sem dado é o que o revisor staff pune.' },
            { id: 'b', texto: 'Admitir que não pensou e propor refazer tudo', correta: false, porque: 'joga fora um design que provavelmente tinha a resposta.' },
            { id: 'c', texto: 'Apresentar o baseline sem LLM medido numa amostra, onde as regras deixam de cobrir, o custo e a qualidade comparados e o gatilho para reconsiderar', correta: true, porque: 'a boa resposta reconhece o ponto, mede e muda o desenho se for o caso.' },
            { id: 'd', texto: 'Dizer que a decisão já foi aprovada por cima', correta: false, porque: 'não responde e soa defensivo.' }
          ], tutorDepois: 'Baseline medido é a resposta a "por que LLM".' },
        { tipo: 'escolha', id: 'b7-esc-rubrica', titulo: 'Confira: a regra eliminatória',
          pergunta: 'Autoavaliação de 0 a 3: seu design tira 3 em desenho, API, dados e alternativas, mas 1 em custo. O que a regra diz?',
          opcoes: [
            { id: 'a', texto: 'Reprova: menos de 2 em requisitos, estimativa, falhas ou custo reprova, qualquer que seja o total', correta: true, porque: 'a rubrica tem critérios eliminatórios para impedir que brilho em desenho compense a ausência de números, falhas previstas ou custo.' },
            { id: 'b', texto: 'Aprova: a média passa de 2', correta: false, porque: 'a média não vale para os eliminatórios.' },
            { id: 'c', texto: 'Aprova com ressalva se o orçamento for pequeno', correta: false, porque: 'a regra não tem exceção por orçamento.' },
            { id: 'd', texto: 'Depende do avaliador', correta: false, porque: 'a regra é objetiva.' }
          ], tutorDepois: 'Eliminatório vence a média.' },
        { tipo: 'takeaway', html: 'Um doc defensável tem <mark>decisão pedida</mark>, <mark>número com premissa</mark> e a <mark>alternativa</mark> mais forte ao lado.' }
      ] }
    ]
  });
})();
