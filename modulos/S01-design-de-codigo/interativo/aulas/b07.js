/* S01 · Bloco 7: TDD. Fonte: S01.html#b07. Saídas de pytest são execuções reais do laboratório (11/10/2026). */
(function () {
  var L = function (kind, text) { return { kind: kind, text: text }; };
  function opc(id, texto, correta, porque) { return { id: id, texto: texto, correta: correta, porque: porque }; }
  var KATA = 'uv run pytest -q tests/test_kata_duration.py | tail -5';

  TrilhaAula.registrar({
    id: 's01-b7',
    titulo: 'TDD: ciclo, test doubles e testabilidade como sinal de design',
    minutos: 55,
    resumo: 'TDD transforma o desenho do código em decisões pequenas e verificáveis e usa a dificuldade de escrever o teste como sinal de design ruim. Ciclo vermelho-verde-refatorar, dublês com vocabulário preciso, contrato e quando não mockar.',
    objetivo: 'Conduzir TDD de verdade, escolher o dublê certo e ler a dificuldade de testar como sinal de design.',
    revisao: [
      { id: 's01b7-ciclo', pergunta: 'No ciclo vermelho, verde, refatorar, o que significa "vermelho pelo motivo certo"?',
        opcoes: [
          opc('a', 'O teste falha numa asserção sobre o comportamento, não por NameError ou ImportError.', true, 'se falha por falta da casca, crie o esqueleto e veja a asserção falhar: é a prova de que o teste detecta o defeito.'),
          opc('b', 'Qualquer falha prova que o teste é válido.', false, 'um erro de nome não demonstra que a asserção funciona.'),
          opc('c', 'O teste falha só quando o CI roda.', false, 'o vermelho é visto localmente, em segundos.')] },
      { id: 's01b7-doubles', pergunta: 'Qual é a diferença entre stub, spy, fake e mock?',
        opcoes: [
          opc('a', 'Stub devolve respostas prontas; spy registra as chamadas; fake é implementação simplificada funcional; mock verifica interações esperadas.', true, 'com stub, spy e fake verifica-se o estado; com mock, o diálogo.'),
          opc('b', 'São sinônimos de mock.', false, 'a imprecisão custa: cada tipo tem um modo de falhar.'),
          opc('c', 'Fake é um mock sem verificação.', false, 'fake tem comportamento funcional (RepositorioEmMemoria).')] },
      { id: 's01b7-estado', pergunta: 'Quando o mock (verificação de interação) é a escolha certa?',
        opcoes: [
          opc('a', 'Quando a chamada é o comportamento: enviar e-mail, publicar evento, cobrar cartão; sempre com autospec.', true, 'testes de estado sobrevivem a refatorações que mantêm o resultado; os de interação quebram quando muda o como.'),
          opc('b', 'Sempre que houver uma dependência.', false, 'prefira estado.'),
          opc('c', 'Nunca.', false, 'efeitos no mundo externo só se verificam pela chamada.')] },
      { id: 's01b7-nao-mockar', pergunta: 'Seu código usa uma biblioteca HTTP de terceiros. Como evitar testes frágeis?',
        opcoes: [
          opc('a', 'Envolver a biblioteca num adapter seu, usar um fake do adapter nos testes e testar o adapter contra o real (teste de contrato).', true, 'mockar a biblioteca amarra o teste ao uso atual: ao trocar requests por httpx todos quebram sem o comportamento mudar.'),
          opc('b', 'Mockar a biblioteca com patch profundo em todo teste.', false, 'é a fragilidade que se quer evitar.'),
          opc('c', 'Fazer chamadas reais à internet na suíte inteira.', false, 'lento, instável e depende de rede.')] },
      { id: 's01b7-design', pergunta: 'O que significa "preciso de muitos mock.patch para testar uma função"?',
        opcoes: [
          opc('a', 'Dependências escondidas e acoplamento alto; o remédio é injetar por construtor ou parâmetro.', true, 'dificuldade de testar é diagnóstico de design.'),
          opc('b', 'Falta de cobertura de linhas.', false, 'cobertura não corrige acoplamento.'),
          opc('c', 'O framework de teste é ruim.', false, 'o sinal é do design do código.')] }
    ],
    abas: [
      { rotulo: 'Entender', blocos: [
        { tipo: 'texto', html:
          '<p><strong>TDD</strong> (<em>test-driven development</em>) é frequentemente descrito como "escrever testes antes". Isso é a casca. O que ele faz é transformar o desenho do código em uma sequência de decisões pequenas e verificáveis, com feedback em segundos, e usar a dificuldade de escrever o teste como sinal de que o design está ruim. Quem pratica bem escreve menos código especulativo, descobre a interface do ponto de vista de quem chama antes de implementar e mantém uma rede de segurança para refatorar sem medo (bloco 6). Quem pratica mal escreve testes acoplados à implementação, que quebram a cada refator e que a equipe aprende a ignorar. Com agentes de código, o teste ganha um papel adicional: é a especificação executável que delimita o que o agente pode mudar.</p>' +
          '<h3>O ciclo: vermelho, verde, refatorar</h3>' +
          '<ul><li><strong>Vermelho.</strong> Escreva um teste que expressa o próximo comportamento e veja-o falhar <em>pelo motivo certo</em>. Se não falhar, ou ele não testa nada, ou o comportamento já existia. Se falhar por <code>ImportError</code>, falta só a casca; crie-a e veja o teste falhar de verdade.</li>' +
          '<li><strong>Verde.</strong> Escreva o código mais simples que faz passar, mesmo que feio ou óbvio demais (retornar a constante é permitido). A tentação de generalizar já é a de implementar o que ainda não foi pedido.</li>' +
          '<li><strong>Refatorar.</strong> Com tudo verde, limpe duplicação e nomes, em passos pequenos, rodando os testes a cada um. Aqui moram as decisões de design.</li></ul>' +
          '<p>O ritmo é de minutos por volta, não de horas. Cada teste novo força uma decisão: o que a função devolve em caso de erro? Aceita espaço? A ordem importa? Essas decisões ficam escritas como testes.</p>' },
        { tipo: 'ordene', id: 'b7-ordene', titulo: 'Ponha o ciclo de TDD na ordem', obrigatorio: false,
          enunciado: 'Use os botões para ordenar as etapas de uma volta do ciclo.',
          itens: [
            { id: 'refatorar', texto: 'Refatorar o código e o teste, sem mudar comportamento' },
            { id: 'verde-codigo', texto: 'Escrever o mínimo de código de produção para o teste passar' },
            { id: 'teste', texto: 'Escrever um teste pequeno que descreve o próximo comportamento' },
            { id: 'rerodar', texto: 'Rodar a suíte de novo e confirmar que continua tudo verde' },
            { id: 'ver-vermelho', texto: 'Rodar e ver o teste falhar pelo motivo certo (vermelho)' },
            { id: 'ver-verde', texto: 'Rodar e ver o teste passar (verde)' }
          ],
          solucao: ['teste', 'ver-vermelho', 'verde-codigo', 'ver-verde', 'refatorar', 'rerodar'],
          dica: 'O teste vem primeiro e é visto falhar antes de qualquer código de produção.',
          tutorDepois: 'Sem ver o vermelho, não há prova de que a asserção detecta o defeito; sem rodar de novo depois de refatorar, não há prova de que o comportamento ficou igual.',
          callout: 'Ciclo na ordem: teste, vermelho, mínimo, verde, refatorar, suíte verde.' },
        { tipo: 'texto', html:
          '<h3>Exemplo trabalhado: o kata parse_duration</h3>' +
          '<p>O lab traz um kata com oito voltas (<code>tests/test_kata_duration.py</code>, comentadas por volta): converter <code>"1h30m"</code> em segundos. A sequência mostra como o design emerge:</p>' },
        { tipo: 'codigo', linguagem: 'python', texto: [
          '# volta 1 - o mais simples que pode falhar',
          'def test_segundos_puros() -> None:',
          '    assert parse_duration("90s") == 90',
          '# verde mínimo: casar "(\\d+)s" e devolver int(...)',
          '',
          '# volta 2 - generalizar a unidade (parametrizado: 5m, 2h, 1d)',
          '# volta 3 - combinar: "1h30m" == 5400 ; "1d2h3m4s"',
          '# volta 4 - decisão: espaços entre as partes e ordem livre ("30m1h" == 5400)',
          '# volta 5 - vazio é erro com mensagem própria ("duração vazia")',
          '# volta 6 - formato inválido: "abc", "10", "1x", "h", "-5m", "1.5h", "1h30" -> ValueError("inválida")',
          '# volta 7 - unidade repetida é ambígua: "1h1h" -> ValueError("unidade repetida: h")',
          '# volta 8 - depois do refator: propriedade com semente fixa (300 combinações d/h/m/s)'].join('\n') },
        { tipo: 'texto', html:
          '<p>A implementação final tem pouco mais de 20 linhas e um regex de validação do texto inteiro separado do regex que extrai as partes. Na volta 6, a lista de entradas inválidas inclui <code>"1h30"</code> (número sem unidade no final) e <code>"1.5h"</code>: um regex de extração sozinho (<code>findall</code>) aceitaria lixo em volta silenciosamente. O teste de entrada inválida é o que força a validação completa (<code>fullmatch</code>). A volta 8 é a refatoração: com o comportamento fixado, trocar a implementação é seguro, e o teste de propriedade confere 300 valores aleatórios contra a fórmula direta. Dois sinais de bom TDD: cada teste tem um motivo para falhar e um nome que descreve comportamento (não método); e as decisões de borda (espaços, ordem livre, repetição) aparecem como testes, não como suposições no código.</p>' },
        { tipo: 'takeaway', html: 'Vermelho <mark>pelo motivo certo</mark>, verde com o mínimo, refatorar com tudo verde; cada teste <mark>fixa uma decisão de borda</mark>.' }
      ] },

      { rotulo: 'Ver funcionando', blocos: [
        { tipo: 'rode', id: 'b7-rode', titulo: 'Estenda o kata: semanas', enunciado: 'Requisito novo: aceitar semanas (<code>"1w"</code> = 604800 s). Escreva o teste primeiro, veja-o falhar, faça o mínimo e rode de novo. Saídas de execução real do lab em 11/10/2026.',
          prefixo: '$', entrada: KATA, unidade: 'testes', terminalTitulo: 'tests/test_kata_duration.py',
          etapas: [
            { id: 'vermelho', nome: 'Vermelho', descricao: 'O teste novo, antes de qualquer código', tom: 'request', ms: 18, linhas: [
              L('cmd', 'cat >> tests/test_kata_duration.py <<\'EOF\'\ndef test_semanas() -> None:\n    assert parse_duration("1w") == 604800\nEOF'),
              L('cmd', KATA),
              L('out', "E           ValueError: duração inválida: '1w'"),
              L('out', 'FAILED tests/test_kata_duration.py::test_semanas - ValueError: duração inváli...'),
              L('out', '1 failed, 17 passed in 0.01s'),
              L('hint', 'vermelho pelo motivo certo: a unidade não é aceita, não um erro de importação')] },
            { id: 'verde', nome: 'Verde', descricao: 'O mínimo: "w": 604_800 e w nas classes de caractere', tom: 'response', ms: 18, linhas: [
              L('info', 'src/design_lab/kata/duration.py: acrescenta "w": 604_800 ao dicionário e w às duas classes de caractere ([wdhms])'),
              L('cmd', 'uv run pytest -q tests/test_kata_duration.py | tail -2'),
              L('out', '..................                                                       [100%]'),
              L('out', '18 passed in 0.01s')] }
          ],
          prever: { pergunta: 'Você escreveu <code>test_semanas</code> e ainda não mexeu em <code>duration.py</code>. Qual o resultado e por quê?', opcoes: [
            { id: 'a', texto: '1 falhando: a função existe, mas rejeita "1w" como duração inválida.', correta: true, porque: 'é o vermelho certo: a asserção do comportamento novo falha, não uma importação.' },
            { id: 'b', texto: 'Todos passam: a função já aceita qualquer unidade.', correta: false, porque: 'o regex só conhece d, h, m e s.' },
            { id: 'c', texto: 'Erro de importação, porque a função de semanas não existe.', correta: false, porque: 'parse_duration existe; só a unidade é nova.' }
          ] },
          tutorAntes: 'Aperte Enter, leia o vermelho e depois abra o verde.',
          tutorDepois: 'Refatoração do passo seguinte: o dicionário e os regex repetem a lista de unidades; derive os regex do dicionário (<code>"".join(_SEGUNDOS)</code>) e rode de novo. Nenhum teste deve mudar na refatoração.',
          callout: 'Você viu um vermelho pelo motivo certo e o verde com o mínimo.' },
        { tipo: 'texto', html:
          '<h3>Test doubles: um vocabulário preciso</h3>' +
          '<p>"Mock" virou sinônimo de qualquer dublê, e a imprecisão custa: cada tipo serve a um propósito e tem um modo de falhar. A taxonomia de Meszaros (<em>xUnit Test Patterns</em>), com os exemplos de <code>tests/test_servico.py</code>:</p>' },
        { tipo: 'texto', largo: true, html:
          '<table><thead><tr><th>Dublê</th><th>Faz</th><th>No lab</th></tr></thead><tbody>' +
          '<tr><td>Dummy</td><td>Preenche um parâmetro que não é usado</td><td>Serviço criado sem ouvintes (<code>test_dummy_ouvintes_nao_sao_necessarios</code>)</td></tr>' +
          '<tr><td>Stub</td><td>Devolve respostas prontas</td><td><code>RelogioFixo</code>: sempre a mesma data</td></tr>' +
          '<tr><td>Spy</td><td>Registra como foi chamado, para verificar depois</td><td><code>Espiao</code>: lista de registros recebidos</td></tr>' +
          '<tr><td>Fake</td><td>Implementação funcional, simplificada</td><td><code>RepositorioEmMemoria</code></td></tr>' +
          '<tr><td>Mock</td><td>Verifica interações esperadas</td><td><code>create_autospec(RepositorioPedidos)</code> com <code>assert_called_once()</code></td></tr>' +
          '<tr><td>Injeção de falha</td><td>Dublê que falha de propósito</td><td><code>RepositorioQueFalha</code> (<code>OSError("disco cheio")</code>)</td></tr>' +
          '</tbody></table>' },
        { tipo: 'texto', html:
          '<p>O eixo é a diferença entre <strong>verificação de estado</strong> e <strong>verificação de interação</strong>. Com stub, spy e fake você verifica o resultado ("o repositório contém o pedido <code>p1</code>"). Com mock você verifica o diálogo ("<code>salvar</code> foi chamado uma vez com <code>p1</code>"). Testes de estado sobrevivem a refatorações que mantêm o resultado; testes de interação quebram quando você muda como chega lá. Regra: prefira estado; use interação só quando a chamada <em>é</em> o comportamento (enviar um e-mail, publicar um evento, cobrar o cartão: o efeito no mundo externo).</p>' +
          '<p>Quando usar mock, use <strong>com especificação</strong>. Um <code>Mock()</code> solto aceita qualquer atributo, e o teste passa enquanto o código de produção chama um método que não existe. O lab prova a diferença:</p>' },
        { tipo: 'codigo', linguagem: 'python', texto: [
          'repo = mock.create_autospec(RepositorioPedidos, instance=True)',
          'repo.salvar_tudo()            # AttributeError: o Protocol não tem salvar_tudo'].join('\n') },
        { tipo: 'takeaway', html: 'Prefira <mark>verificar estado</mark>; mock só quando a chamada é o comportamento, e <mark>sempre com autospec</mark>.' }
      ] },

      { rotulo: 'Praticar', blocos: [
        { tipo: 'python', id: 'b7-python', titulo: 'Faça as voltas 5 a 7 do kata', obrigatorio: false,
          enunciado: 'A primeira parte de <code>parse_duration</code> já passa nas voltas 1 a 4. Complete as voltas 5 a 7: vazio é erro com mensagem própria, o texto <em>inteiro</em> é validado com <code>fullmatch</code> e unidade repetida é recusada. Os testes estão numerados como as voltas do lab e incluem a propriedade da volta 8, com semente fixa.',
          codigo: [
      "import re",
      "",
      "_SEGUNDOS = {\"d\": 86_400, \"h\": 3_600, \"m\": 60, \"s\": 1}",
      "_UNIDADES = \"\".join(_SEGUNDOS)",
      "_TUDO = re.compile(r\"\\s*(?:\\d+[\" + _UNIDADES + r\"]\\s*)+\")",
      "_PARTE = re.compile(r\"(\\d+)([\" + _UNIDADES + r\"])\")",
      "",
      "",
      "def parse_duration(texto):",
      "    # volta 5: vazio é erro com mensagem própria (\"duração vazia\")",
      "    # volta 6: valide o texto INTEIRO com _TUDO.fullmatch (\"duração inválida: ...\")",
      "    # volta 7: unidade repetida é ambígua (\"unidade repetida: h\")",
      "    total = 0",
      "    for n, u in _PARTE.findall(texto):",
      "        total += int(n) * _SEGUNDOS[u]",
      "    return total",
      "",
      "",
      "print(parse_duration(\"1h30m\"))"
    ].join('\n'),
          testes: [
      "def esperar(texto, trecho):",
      "    try:",
      "        parse_duration(texto)",
      "    except ValueError as e:",
      "        assert trecho in str(e), (texto, str(e))",
      "        return",
      "    raise AssertionError(f\"{texto!r} deveria lançar ValueError\")",
      "",
      "",
      "def test_volta_1_segundos_puros():",
      "    assert parse_duration(\"90s\") == 90",
      "",
      "",
      "def test_volta_2_cada_unidade():",
      "    assert parse_duration(\"5m\") == 300",
      "    assert parse_duration(\"2h\") == 7200",
      "    assert parse_duration(\"1d\") == 86400",
      "",
      "",
      "def test_volta_3_combinadas():",
      "    assert parse_duration(\"1h30m\") == 5400",
      "    assert parse_duration(\"1d2h3m4s\") == 86400 + 7200 + 180 + 4",
      "",
      "",
      "def test_volta_4_espacos_e_ordem_livre():",
      "    assert parse_duration(\"1h 30m\") == 5400",
      "    assert parse_duration(\"30m1h\") == 5400",
      "",
      "",
      "def test_volta_5_vazio_tem_mensagem_propria():",
      "    esperar(\"\", \"vazia\")",
      "    esperar(\"   \", \"vazia\")",
      "",
      "",
      "def test_volta_6_formato_invalido_e_recusado():",
      "    for ruim in [\"abc\", \"10\", \"1x\", \"h\", \"-5m\", \"1.5h\", \"1h30\"]:",
      "        esperar(ruim, \"inválida\")",
      "",
      "",
      "def test_volta_7_unidade_repetida_e_ambigua():",
      "    esperar(\"1h1h\", \"unidade repetida: h\")",
      "",
      "",
      "def test_volta_8_propriedade_com_semente_fixa():",
      "    import random",
      "",
      "    rng = random.Random(2026)",
      "    for _ in range(300):",
      "        d, h, m, s = (rng.randint(0, 9) for _ in range(4))",
      "        texto = f\"{d}d{h}h{m}m{s}s\"",
      "        assert parse_duration(texto) == d * 86400 + h * 3600 + m * 60 + s"
    ].join('\n'),
          dica: 'Três guardas no topo, nesta ordem: <code>if not texto.strip()</code> (duração vazia); <code>if not _TUDO.fullmatch(texto)</code> (duração inválida); e, no laço, um conjunto <code>vistas</code> para detectar a unidade repetida. Cada guarda lança <code>ValueError</code> com a mensagem do teste.',
          solucao: [
      "import re",
      "",
      "_SEGUNDOS = {\"d\": 86_400, \"h\": 3_600, \"m\": 60, \"s\": 1}",
      "_UNIDADES = \"\".join(_SEGUNDOS)",
      "_TUDO = re.compile(r\"\\s*(?:\\d+[\" + _UNIDADES + r\"]\\s*)+\")",
      "_PARTE = re.compile(r\"(\\d+)([\" + _UNIDADES + r\"])\")",
      "",
      "",
      "def parse_duration(texto):",
      "    if not texto.strip():",
      "        raise ValueError(\"duração vazia\")",
      "    if not _TUDO.fullmatch(texto):  # valida o texto INTEIRO",
      "        raise ValueError(f\"duração inválida: {texto!r}\")",
      "    total, vistas = 0, set()",
      "    for n, u in _PARTE.findall(texto):",
      "        if u in vistas:",
      "            raise ValueError(f\"unidade repetida: {u}\")",
      "        vistas.add(u)",
      "        total += int(n) * _SEGUNDOS[u]",
      "    return total"
    ].join('\n'),
          tutorDepois: 'A volta 6 é a que justifica o <code>fullmatch</code>: só <code>findall</code> aceitaria <code>"1h30"</code> ignorando o <code>30</code> solto. O teste de entrada inválida foi o que forçou a validação do texto inteiro, e a volta 8 só é possível porque o comportamento já estava fixado.',
          callout: 'Kata completo: cada decisão de borda ficou escrita como teste.' },
        { tipo: 'texto', html:
          '<h3>Quando não mockar</h3>' +
          '<ul><li><strong>Tipos que você é dono e são baratos</strong> (dataclasses, funções puras, o domínio): use os reais. Mockar <code>Pedido</code> testa o mock.</li>' +
          '<li><strong>Coisas que você não é dono</strong> (SDK de nuvem, <code>requests</code>, cliente SQL): não mocke a biblioteca diretamente; envolva-a num adapter (bloco 5), teste o adapter contra o real (ou um servidor local fiel) e use fake do seu contrato nos demais testes. Mockar a biblioteca amarra o teste ao seu uso atual dela: ao trocar <code>requests</code> por <code>httpx</code>, todos quebram, sem que o comportamento tenha mudado.</li>' +
          '<li><strong>Banco de dados quando você quer provar a consulta</strong>: use o banco de verdade (SQLite em memória no lab; PostgreSQL em contêiner no M03). Um mock não executa o SQL.</li>' +
          '<li><strong>Quando o mock reproduz a implementação linha a linha</strong>: o teste é o código escrito duas vezes.</li></ul>' +
          '<p>A solução do lab é o <strong>teste de contrato</strong>: uma mesma suíte parametrizada roda contra o fake e contra o adapter real. Se os dois passam em ida-e-volta, inexistente (<code>None</code>), id duplicado (<code>PedidoJaExiste</code>) e listagem ordenada, o fake é um substituto confiável. Sem o teste de contrato, o fake é uma hipótese; com ele, é um fato verificável.</p>' },
        { tipo: 'cenario', id: 'b7-cenario', titulo: 'O teste passa com Mock() e a produção quebra', obrigatorio: false,
          enunciado: 'O teste do serviço usa <code>Mock()</code> do repositório e passa. Em produção, <code>repo.salvar_tudo()</code> não existe. Decida a correção.',
          inicio: 'inicio',
          nos: {
            inicio: { texto: 'O serviço chama <code>repo.salvar_tudo()</code>, método que o repositório real nunca teve. O <code>Mock()</code> aceitou qualquer atributo. Qual é a primeira correção?', opcoes: [
              { texto: 'Aumentar a cobertura de linhas do serviço.', vai: 'f-cobertura', tom: 'ruim', consequencia: 'a linha já estava coberta: o teste executava tudo e não protegia nada.' },
              { texto: 'Trocar por <code>create_autospec(RepositorioPedidos, instance=True)</code>.', vai: 'design', tom: 'ok', consequencia: 'o mock passa a recusar atributo que o Protocol não tem: AttributeError no teste.' }
            ] },
            design: { texto: 'A correção mínima fecha este buraco. E a de design, para o resto dos testes do serviço?', opcoes: [
              { texto: 'Um fake em memória que implementa o contrato, testado contra o mesmo contrato do adapter real; mock só onde a interação é o comportamento.', vai: 'f-bom', tom: 'ok', consequencia: 'o fake passa a ser fato verificável, e os testes de estado sobrevivem a refatorações.' },
              { texto: 'Manter autospec em todo teste e verificar chamadas em todos.', vai: 'f-interacao', tom: 'ruim', consequencia: 'o buraco do atributo inexistente fecha, mas os testes ficam acoplados ao como e quebram a cada refator.' }
            ] }
          },
          finais: {
            'f-cobertura': { bom: false, texto: 'Cobertura de linhas não é prova: um teste pode executar tudo e afirmar nada. O diagnóstico certo é "o mock não tem especificação".' },
            'f-interacao': { bom: false, texto: 'Autospec é necessário, mas verificar interação em todo teste prende a suíte à implementação. Prefira estado, com fake validado por contrato.' },
            'f-bom': { bom: true, texto: 'Correção mínima (autospec) e de design (fake com teste de contrato, estado em vez de interação). Falta de cobertura não era o problema.' }
          } },
        { tipo: 'takeaway', html: '<mark>Não mocke o que você não é dono</mark>: adapter próprio, fake do seu contrato e <mark>teste de contrato</mark> contra o real.' }
      ] },

      { rotulo: 'Conferir', blocos: [
        { tipo: 'texto', largo: true, html:
          '<h3>Testabilidade como sinal de design</h3>' +
          '<p>Se é difícil testar, o código está dizendo algo. Cada sintoma tem uma causa de design e um remédio já visto neste módulo:</p>' +
          '<table><thead><tr><th>Dificuldade no teste</th><th>Sinal de design</th><th>Remédio</th></tr></thead><tbody>' +
          '<tr><td>Preciso de muitos <code>mock.patch</code> para uma função</td><td>Dependências escondidas, acoplamento alto</td><td>Injetar por construtor ou parâmetro (bloco 5)</td></tr>' +
          '<tr><td>O teste depende da data, do relógio, de sorte</td><td>Efeito misturado à regra</td><td>Passar <code>hoje</code>; núcleo puro (bloco 3)</td></tr>' +
          '<tr><td>O setup tem 40 linhas</td><td>Classe com responsabilidades demais</td><td>Separar, parameter object (blocos 1 e 4)</td></tr>' +
          '<tr><td>Não consigo verificar o resultado, só o efeito</td><td>Função faz e não devolve</td><td>Devolver um valor; mover o efeito para a casca</td></tr>' +
          '<tr><td>Para testar a regra preciso do banco</td><td>Regra acoplada à persistência</td><td>Porta + fake (blocos 4 e 5)</td></tr>' +
          '<tr><td>Quebro 30 testes ao renomear um método interno</td><td>Testes acoplados à implementação</td><td>Testar comportamento pela interface pública</td></tr>' +
          '</tbody></table>' +
          '<p>Os testes do núcleo de preços no lab dispensam qualquer dublê, porque as regras são funções puras. Só o serviço, a casca, usa fake de repositório e stub de relógio. O que decide é testado sem dublês; o que orquestra, com poucos.</p>' },
        { tipo: 'escolha', id: 'b7-esc-vermelho', titulo: 'Esse vermelho está correto?',
          pergunta: 'No ciclo vermelho/verde/refatorar, um teste novo falha com <code>NameError</code> porque a função ainda nem existe. Esse vermelho está correto?',
          opcoes: [
            { id: 'a', texto: 'Não é o vermelho certo: o teste deve falhar pelo motivo certo (asserção sobre o comportamento). Crie o esqueleto, veja a asserção falhar e então implemente.', correta: true, porque: 'ver a asserção falhar é a prova de que o teste consegue detectar o defeito e fixa uma decisão de borda.' },
            { id: 'b', texto: 'Sim: qualquer falha prova que o teste é válido.', correta: false, porque: 'um erro de nome não demonstra que a asserção funciona.' },
            { id: 'c', texto: 'Sim, e deve-se pular direto para o refatorar.', correta: false, porque: 'refatorar vem depois do verde.' },
            { id: 'd', texto: 'Não importa: o vermelho serve só para cumprir o ritual.', correta: false, porque: 'um vermelho nunca visto pode estar verde por razão errada.' }
          ] },
        { tipo: 'escolha', id: 'b7-esc-http', titulo: 'Biblioteca HTTP de terceiros',
          pergunta: 'Seu código chama uma biblioteca HTTP de terceiros. Como evitar testes frágeis que dependem de mockar essa biblioteca?',
          opcoes: [
            { id: 'a', texto: 'Mockar a biblioteca em todo teste com patch profundo.', correta: false, porque: 'amarra o teste ao uso atual dela.' },
            { id: 'b', texto: 'Nunca testar o código que usa rede.', correta: false, porque: 'a fronteira é exatamente o que precisa de teste.' },
            { id: 'c', texto: 'Fazer chamadas reais à internet em toda a suíte.', correta: false, porque: 'lento, instável e dependente de rede.' },
            { id: 'd', texto: 'Envolver a biblioteca em um adapter seu e usar um fake do adapter nos testes; o adapter em si é testado contra o real (teste de contrato).', correta: true, porque: 'a fronteira é sua; o fake é barato e o teste de contrato dá a ele o direito de substituir o real.' }
          ] },
        { tipo: 'callout', tom: 'danger', titulo: 'Armadilha que pega sênior', html:
          '<p><strong>Cobertura de linhas como prova.</strong> Um teste que executa todas as linhas sem afirmar nada dá 100% de cobertura e zero proteção; um teste com <code>assert True</code>, ou que repete a implementação, idem. A medida honesta é a mutação (alterar o código e ver se algum teste falha), que o lab faz à mão com o teto de 20% mudado para 25. Segunda: TDD escrevendo o teste depois "para fingir": o teste que nunca foi visto vermelho pode estar verde por razão errada. Terceira: teste que passa em qualquer ordem só por acaso; estado global compartilhado entre testes (o <code>_total_global</code> do bloco 3) cria dependência de ordem. Rode com ordem aleatória de vez em quando.</p>' },
        { tipo: 'callout', tom: 'neutral', titulo: 'Limites e variações do TDD', html:
          '<p>O estilo "londrino" (mockist) projeta de fora para dentro e usa mocks para descobrir colaboradores; o estilo "clássico" (de Detroit) prefere objetos reais e verificação de estado, e usa dublês nas fronteiras. Nenhum é uma verdade; o curso adota o clássico com fakes verificados por contrato, pela resistência a refatoração. TDD também não é a ferramenta única: para algoritmos com muitas combinações, <em>property-based testing</em> (Hypothesis) explora o espaço melhor que exemplos (a volta 8 do kata usa a ideia com semente fixa); para UI e design vago, um protótipo descartável (<em>spike</em>) antes dos testes é legítimo; e para I/O pesado, testes de integração ocupam o papel central (estratégia por camada, no M02A, bloco 8). <strong>Trade-offs:</strong> TDD custa tempo no início de cada unidade e devolve em depuração e refator; é rápido para lógica de domínio e mais lento para código de colagem. Fakes exigem manutenção: se o contrato muda, o fake e o teste de contrato mudam juntos. Testes de interação rápidos são baratos hoje e caros em cada refator.</p>' },
        { tipo: 'takeaway', html: 'Dificuldade de testar é <mark>diagnóstico de design</mark>: dependência escondida, responsabilidade demais, efeito misturado à regra.' }
      ] }
    ]
  });
})();
