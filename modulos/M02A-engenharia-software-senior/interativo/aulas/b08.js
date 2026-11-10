/* M02A · Bloco 8: estratégia de testes e desenho para testabilidade. Fonte: M02A.html#b8. */
(function () {
  var L = function (kind, text) { return { kind: kind, text: text }; };
  function opc(id, texto, correta, porque) { return { id: id, texto: texto, correta: correta, porque: porque }; }

  var codigo = [
    'import random', '', '',
    'def normaliza(texto):', '    # canônico: sem espaços nas pontas, espaços internos colapsados em um, minúsculas', '    return texto', '', '',
    'def contraexemplo(propriedade, n, seed):', '    # gera n textos com Random(seed) (alfabeto "aB  ") e devolve o primeiro que viola a propriedade, ou None',
    '    return None', '', '',
    'def mutante_morto(suite, funcao):', '    # suite: lista de (entrada, esperado). O mutante morre se ALGUM caso discorda', '    return False', ''].join('\n');
  var testes = [
    'def test_normaliza_forma_canonica():',
    '    assert normaliza("  Ab   cD ") == "ab cd"', '    assert normaliza("") == ""', '', '',
    'def test_propriedade_idempotente_vale_para_a_boa():',
    '    prop = lambda s: normaliza(normaliza(s)) == normaliza(s)', '    assert contraexemplo(prop, 200, 7) is None', '', '',
    'def test_propriedade_caca_normalizacao_incompleta_e_e_reprodutivel():',
    '    ruim = lambda s: s.strip().replace("  ", " ").lower()',
    '    prop = lambda s: ruim(ruim(s)) == ruim(s)',
    '    c1 = contraexemplo(prop, 500, 7)', '    assert c1 is not None and not prop(c1)', '    assert c1 == contraexemplo(prop, 500, 7)', '', '',
    'def test_mutante_sobrevive_sem_caso_de_borda():',
    '    original = lambda o: "escalar" if o >= 1000 else "aceitar"',
    '    mutante = lambda o: "escalar" if o > 1000 else "aceitar"',
    '    fraca = [(500, "aceitar"), (2000, "escalar")]', '    forte = fraca + [(1000, "escalar")]',
    '    assert all(original(e) == x for e, x in forte)',
    '    assert mutante_morto(fraca, mutante) is False', '    assert mutante_morto(forte, mutante) is True', ''].join('\n');
  var solucao = [
    'import random', '', '',
    'def normaliza(texto):', '    return " ".join(texto.split()).lower()', '', '',
    'def contraexemplo(propriedade, n, seed):', '    rng = random.Random(seed)', '    for _ in range(n):',
    '        s = "".join(rng.choice("aB  ") for _ in range(rng.randint(0, 8)))', '        if not propriedade(s):', '            return s', '    return None', '', '',
    'def mutante_morto(suite, funcao):', '    return any(funcao(e) != esperado for e, esperado in suite)', ''].join('\n');

  TrilhaAula.registrar({
    id: 'm02a-b8',
    titulo: 'Estratégia de testes e desenho para testabilidade',
    minutos: 40,
    resumo: 'Contar testes não diz se a suíte protege: dimensione pelo risco, exija oráculo independente e prove a sensibilidade com propriedade, mutante e diferencial.',
    objetivo: 'Distribuir testes pelo risco, distinguir oráculo de tautologia e usar propriedade, mutação e teste diferencial com não-determinismo sob controle.',
    revisao: [
      { id: 'm02ab8-piramide', pergunta: 'Como usar a pirâmide de testes?',
        opcoes: [
          opc('a', 'Como heurística de custo, dimensionada pelo risco: fronteira e política recebem propriedade, mutante e diferencial; acessório recebe exemplo dirigido.', true, 'antes do próximo teste, localize o invariante que, quebrado, vira decisão errada, duplicata ou vazamento.'),
          opc('b', 'Como planta baixa obrigatória por camada.', false, 'o risco não mora uniformemente nas camadas.'),
          opc('c', 'Muitos testes e2e para tudo.', false, 'caro e redundante.')] },
      { id: 'm02ab8-oraculo', pergunta: 'Qual teste é tautologia?',
        opcoes: [
          opc('a', 'Comparar o hash com uma constante copiada da saída atual, ou reimplementar a política no teste.', true, 'congela o bug em vez de detectá-lo; o oráculo vem da especificação, de propriedade ou de outro caminho.'),
          opc('b', 'Propriedade: escalas decimais equivalentes dão o mesmo hash.', false, 'é um oráculo independente.'),
          opc('c', 'Contrato: campo fora do padrão falha indicando o campo.', false, 'também é oráculo.')] },
      { id: 'm02ab8-prop', pergunta: 'O que é uma propriedade e quando o invariante ainda não é uma?',
        opcoes: [
          opc('a', '"Para toda entrada X, vale Y"; se não cabe nessa frase, é exemplo com ambição. Escreva antes de escolher a ferramenta (Hypothesis ou laço com seed).', true, 'o contraexemplo precisa ser mínimo e reproduzível pelo seed.'),
          opc('b', 'Um teste com muitos exemplos.', false, 'exemplos não geram entradas.'),
          opc('c', 'Um teste aleatório sem seed.', false, 'não é reproduzível.')] },
      { id: 'm02ab8-mut', pergunta: 'Trocar <code>&gt;=</code> por <code>&gt;</code> e nenhum teste falhar indica o quê?',
        opcoes: [
          opc('a', 'Mutante sobrevivente: a suíte não é sensível àquela decisão de fronteira (ou o mutante é equivalente e deve ser justificado).', true, 'mutante morto prova sensibilidade, não correção; semeie pouco, no risco alto, e reverta sempre.'),
          opc('b', 'Que a suíte é excelente.', false, 'ela não percebeu a mudança.'),
          opc('c', 'Que a cobertura precisa de 100%.', false, 'cobertura diz que a linha rodou, não que alguém checou.')] },
      { id: 'm02ab8-diff', pergunta: 'O que o teste diferencial deste bloco compara e o que não prova?',
        opcoes: [
          opc('a', 'Fronteira estrita (JSON validado) contra domínio direto no mesmo corpus; divergência é alarme. Não prova API contra CLI instalada (isso é o B14) nem cobre além do corpus.', true, 'compare valores normalizados e motivos de rejeição, nunca mensagens internas.'),
          opc('b', 'API contra CLI instalada.', false, 'pertence ao B14.'),
          opc('c', 'Dois testes unitários.', false, 'diferencial compara caminhos, não testes.')] }
    ],
    abas: [
      { rotulo: 'Entender', blocos: [
        { tipo: 'texto', html:
          '<p>A entrega local do B07 já tem dono, chave e simulação determinística. A pergunta agora é como saber se a suíte que a protege realmente protege. Contar testes não responde: uma suíte grande aprova código quebrado quando cada teste repete a implementação com outras palavras. "Cobertura alta prova qualidade" e "teste que passa é teste bom" são meia decisão: cobertura mede linhas visitadas, não invariantes verificados.</p>' +
          '<h3>Pirâmide por risco, não por camada</h3>' +
          '<p>A pirâmide distribui testes por camada (muitos unitários, poucos ponta a ponta) e funciona como heurística de custo. O erro sênior é tratá-la como planta obrigatória: o risco não mora uniformemente nas camadas.</p>' },
        { tipo: 'texto', largo: true, html:
          '<table><thead><tr><th>Camada de risco</th><th>Recebe mais teste</th><th>Recebe menos</th></tr></thead><tbody>' +
          '<tr><td>fronteira JSON → domínio (tipos, dinheiro, prazo, UTF-8)</td><td>contrato estrito, propriedades de normalização, corpus diferencial</td><td>—</td></tr>' +
          '<tr><td>política e idempotência</td><td>propriedades de idempotência, mutantes sobre regras P0, reentrega com seed</td><td>—</td></tr>' +
          '<tr><td>orquestração (advisor, fallback, repositório)</td><td>contratos de porta com fake e adapter alternativo na mesma suíte</td><td>e2e redundantes que repetem o já coberto</td></tr>' +
          '<tr><td>apresentação (CLI, formatação, mensagens)</td><td>exemplos dirigidos nas bordas observáveis</td><td>propriedades e mutação</td></tr>' +
          '</tbody></table>' },
        { tipo: 'texto', html:
          '<p>Decisão: localize o risco. Se o invariante quebrado não vira decisão errada, duplicata ou vazamento, um exemplo dirigido basta (topo fino). Se cita dinheiro, prazo, chave ou segredo, o teste pertence à base larga: propriedade, mutante e corpus diferencial.</p>' +
          '<h3>Oráculo x tautologia</h3>' +
          '<p><strong>Oráculo</strong> é a fonte independente que diz qual resposta está certa. <strong>Tautologia</strong> é o teste que consulta a própria implementação e por isso nunca discorda dela: comparar com o que a função retornou na primeira execução aprova qualquer comportamento, inclusive o errado.</p>' },
        { tipo: 'texto', largo: true, html:
          '<table><thead><tr><th>Teste</th><th>Oráculo (independente)</th><th>Tautologia</th></tr></thead><tbody>' +
          '<tr><td>normalização de dinheiro e intenção</td><td>propriedade: escalas decimais equivalentes dão o mesmo hash</td><td>comparar o hash com constante copiada da saída atual</td></tr>' +
          '<tr><td>decisão da política</td><td>regra declarada: faixas de orçamento, escalada por risco</td><td>reimplementar a política no teste</td></tr>' +
          '<tr><td>rejeição na fronteira</td><td>contrato: campo fora do padrão falha indicando o campo</td><td>aceitar qualquer exceção</td></tr>' +
          '<tr><td>defeito injetado</td><td>gate correto: tipo no contrato, semântica na política, cancelamento no runtime</td><td>um teste genérico que falha sem dizer qual gate deveria pegar</td></tr>' +
          '</tbody></table>' },
        { tipo: 'takeaway', html: 'Todo teste declara um <mark>oráculo independente</mark>; saída congelada da própria implementação é <mark>tautologia</mark>.' }
      ] },

      { rotulo: 'Propriedade, mutação e controle', blocos: [
        { tipo: 'texto', html:
          '<h3>Property-based: gerar para descobrir</h3>' +
          '<p>Teste por exemplo diz "para esta entrada, espero esta saída"; por propriedade diz "para toda entrada desta forma, este invariante vale" e deixa a ferramenta gerar as entradas (escala decimal incomum, intenção com espaços e caixa misturados, prazo no limite do fuso). A biblioteca de referência é Hypothesis (versão conforme o lock; revalidar a API). Sem ela, um laço com <code>random.Random(seed)</code> documentado, sem redução automática de contraexemplo.</p>' },
        { tipo: 'codigo', linguagem: 'python', texto: 'def propriedade_normalizacao_idempotente(normalizar):\n    # para toda entrada válida: normalizar duas vezes\n    # equivale a normalizar uma vez\n    return lambda entrada: normalizar(normalizar(entrada)) == normalizar(entrada)' },
        { tipo: 'texto', largo: true, html:
          '<table><thead><tr><th>Propriedade</th><th>Invariante</th><th>Contraexemplo que caça</th></tr></thead><tbody>' +
          '<tr><td>normalização de dinheiro</td><td>decimais equivalentes dão o mesmo hash de intenção</td><td>escala ou arredondamento que muda o hash sem mudar o valor</td></tr>' +
          '<tr><td>normalização de intenção</td><td>caixa e espaços não mudam a intenção canônica</td><td>trim em um caminho e esquecido no outro</td></tr>' +
          '<tr><td>idempotência de repetição</td><td>mesma chave e intenção reutiliza a decisão</td><td>repetição que cria segunda decisão</td></tr>' +
          '<tr><td>colisão de intenção</td><td>mesma chave, intenção diferente: conflito</td><td>colisão absorvida como repetição</td></tr>' +
          '</tbody></table>' },
        { tipo: 'texto', html:
          '<h3>Mutação e falha semeada</h3>' +
          '<p>Mutação mede se a suíte sente dor: aplica-se uma alteração pequena e deliberada (remover uma condição, trocar um comparador, desativar uma escalada) e exige-se que algum teste falhe. O <strong>mutante sobrevivente</strong> denuncia teste decorativo onde o risco é alto. Não é módulo novo do produto. Mutante morto prova sensibilidade, não correção; semeie pouco, no risco alto, reverta sempre. Contagens e taxas citadas no material são exemplo variável; escore universal não é selo.</p>' },
        { tipo: 'texto', largo: true, html:
          '<table><thead><tr><th>Mutante ou defeito</th><th>Gate que precisa matar</th><th>Sobrevivência denuncia</th></tr></thead><tbody>' +
          '<tr><td>remover regra P0 (escalada por risco do advisor)</td><td>teste de política e propriedade de decisão</td><td>suíte aprova decisão sem a regra crítica</td></tr>' +
          '<tr><td>defeito de tipo</td><td>gate de tipos/contrato</td><td>fronteira aceita valor fora do contrato</td></tr>' +
          '<tr><td>defeito semântico</td><td>gate de política/decisão</td><td>oráculo repete a implementação</td></tr>' +
          '<tr><td>cancelamento ignorado</td><td>gate de runtime com cleanup observado</td><td>task órfã que a suíte não percebe</td></tr>' +
          '</tbody></table>' },
        { tipo: 'texto', html:
          '<h3>Clock, IDs e aleatoriedade sob controle</h3>' +
          '<p>Teste que depende de parede, sorte ou identidade global mente de vez em quando. Cada fonte de não-determinismo é dependência injetável: relógio fixo ou virtual, IDs fornecidos pelo teste, seed registrado, e dependências externas fora do recorte (fake, simulação ou ausência declarada).</p>' +
          '<h3>Differential entre caminhos Python</h3>' +
          '<p>Teste diferencial dispensa oráculo absoluto: dois caminhos independentes devem concordar sobre o mesmo corpus; a divergência é o alarme. No recorte: fronteira estrita (<code>application/boundary.py</code>, JSON validado com Pydantic) contra construção direta no domínio. O corpus é o golden do B04 mais casos gerados com seed (finito: cobre o conhecido). Compare valores normalizados e motivos de rejeição, nunca mensagens internas. API contra CLI instalada é o B14.</p>' +
          '<p><strong>Fontes:</strong> documentação oficial de Hypothesis (revalidar contra o lock), <code>random</code> do Python 3.14 e pytest; Jia e Harman, <em>An Analysis and Survey of the Development of Mutation Testing</em> (IEEE TSE 2011); McKeeman, <em>Differential Testing for Software</em> (DTJ 1998).</p>' },
        { tipo: 'takeaway', html: '<mark>Propriedade</mark> afirma o invariante para toda entrada gerada; <mark>mutante sobrevivente</mark> reprova a suíte, não o produto.' }
      ] },

      { rotulo: 'Praticar e conferir', blocos: [
        { tipo: 'rode', id: 'b8-rode', titulo: 'O mutante que ninguém percebeu', obrigatorio: false,
          enunciado: 'Regra P0: orçamento &ge; 1000 escala. Mutante troca <code>&gt;=</code> por <code>&gt;</code>. Saída ilustrativa (exemplo).',
          prefixo: '$', entrada: 'mutar regra P0 e rodar a suíte  # exemplo', unidade: 'ms', terminalTitulo: 'exemplo (saída variável)',
          prever: { pergunta: 'A suíte só tem casos com 500 e 2000. O mutante sobrevive?', opcoes: [
            { id: 'a', texto: 'Sim: ninguém testa o 1000.', correta: true, porque: 'a fronteira exata é a decisão que o mutante altera.' },
            { id: 'b', texto: 'Não: algum teste vai falhar.', correta: false, porque: '500 e 2000 dão a mesma resposta nas duas versões.' }] },
          etapas: [
            { id: 'f', nome: 'Suíte sem a borda', descricao: '500, 2000', tom: 'dns', ms: 1, linhas: [L('out', '2 passed  (mutante SOBREVIVEU)'), L('hint', 'teste decorativo onde o risco é alto')] },
            { id: 'b', nome: 'Com o caso 1000', descricao: '', tom: 'response', ms: 1, linhas: [L('out', '1 failed, 2 passed  (mutante MORTO)'), L('hint', 'sensibilidade, não prova de correção')] }
          ] },
        { tipo: 'python', id: 'b8-python', titulo: 'Normalização, contraexemplo e mutante', obrigatorio: false,
          enunciado: 'Implemente <code>normaliza</code>, <code>contraexemplo(propriedade, n, seed)</code> (reprodutível por seed) e <code>mutante_morto(suite, funcao)</code>.',
          codigo: codigo, testes: testes,
          dica: '<code>" ".join(texto.split()).lower()</code>. Gere textos com <code>rng.choice("aB  ")</code> e <code>random.Random(seed)</code>. O mutante morre se <code>any(funcao(e) != esperado ...)</code>.',
          solucao: solucao, callout: 'Propriedade com contraexemplo reproduzível e mutante morto por borda.' },
        { tipo: 'transcript', id: 'b8-transcript', titulo: 'Qual afirmação não se sustenta?', obrigatorio: false, terminalTitulo: 'revisão de PR',
          enunciado: 'Clique na afirmação que a evidência não sustenta.',
          linhas: [
            { quem: 'agente', texto: 'Adicionei o teste da política.' },
            { quem: 'ferramenta', texto: 'def test_politica():\n    assert decide(1000) == decide(1000)' },
            { quem: 'ferramenta', texto: 'coverage: 100% de linhas em policy.py' },
            { quem: 'agente', texto: 'Cobertura de 100%: a política está protegida.' }],
          erradas: [3], explicacao: { 3: 'o teste compara a função com ela mesma (tautologia) e cobertura mede linha visitada, não invariante verificado. Sem oráculo da especificação nem mutante P0 morto, a política não está protegida.' } },
        { tipo: 'escolha', id: 'b8-esc1', titulo: 'Confira: teste intermitente', pergunta: 'O teste falha só às vezes, sem mudança no código. Hipótese?',
          opcoes: [
            { id: 'a', texto: 'Relógio, ID ou aleatoriedade sem controle; fixe o instante, forneça IDs e registre o seed.', correta: true, porque: 'rerodar alterna o resultado.' },
            { id: 'b', texto: 'O pytest é instável.', correta: false, porque: 'o não-determinismo está nas dependências do teste.' }] },
        { tipo: 'escolha', id: 'b8-esc2', titulo: 'Confira: tautologia', pergunta: 'O teste calcula o esperado com a mesma função testada. Por que é um problema?',
          opcoes: [
            { id: 'a', texto: 'Oráculo e código compartilham o erro: se a função estiver errada, o esperado também estará.', correta: true, porque: 'o oráculo precisa ser independente (valor conhecido, propriedade ou outro caminho).' },
            { id: 'b', texto: 'Funções puras não podem ser testadas.', correta: false, porque: 'podem.' }] },
        { tipo: 'takeaway', html: 'Mutação e falha semeada provam <mark>sensibilidade</mark>; cobertura só diz que a linha rodou.' }
      ] }
    ]
  });
})();
