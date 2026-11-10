/* M02A · Bloco 13: Python sênior aplicado: produto instalável e diagnóstico. Fonte: M02A.html#b13. */
(function () {
  var L = function (kind, text) { return { kind: kind, text: text }; };
  function opc(id, texto, correta, porque) { return { id: id, texto: texto, correta: correta, porque: porque }; }

  var codigo = [
    'from pathlib import PurePath', '', '',
    'def instalacao_limpa(modulo_importado, checkout):', '    # True só se a origem do módulo NÃO está dentro do checkout (normalize "\\\\" para "/")', '    return True', '', '',
    'def normalizar_entrada(texto, caminho):', '    # LF único, caixa dobrada (casefold) e caminho em forma posix dobrada; devolve (chave, caminho)', '    return (texto, str(caminho))', '', '',
    'def admitir_pedido(dado_bruto):', '    # fronteira: exige dict com "tenant" (str não vazia) e "valor" (str decimal, ex. "10.50"); NUNCA aceita float',
    '    # devolve ("admitido", dado) ou ("rejeitado", motivo) com motivo "tenant" ou "valor"', '    return ("admitido", dado_bruto)', ''].join('\n');
  var testes = [
    'def test_origem_instalada_vs_checkout():',
    '    assert instalacao_limpa("/venv/lib/site-packages/work_intake/__init__.py", "/home/dev/repo")',
    '    assert not instalacao_limpa("/home/dev/repo/src/work_intake/__init__.py", "/home/dev/repo")',
    '    assert not instalacao_limpa("C:\\\\repo\\\\src\\\\m.py", "C:\\\\repo")', '', '',
    'def test_newline_casing_e_path():',
    '    a = normalizar_entrada("Olá\\r\\nMUNDO\\rfim", PurePath("Dir/Arq.TXT"))',
    '    b = normalizar_entrada("olá\\nmundo\\nfim", PurePath("dir/arq.txt"))', '    assert a == b == ("olá\\nmundo\\nfim", "dir/arq.txt")', '', '',
    'def test_fronteira_valida_em_runtime():',
    '    assert admitir_pedido({"tenant": "t1", "valor": "10.50"})[0] == "admitido"',
    '    assert admitir_pedido({"tenant": "t1", "valor": 10.5}) == ("rejeitado", "valor")',
    '    assert admitir_pedido({"tenant": "", "valor": "1"}) == ("rejeitado", "tenant")',
    '    assert admitir_pedido("lixo")[0] == "rejeitado"', ''].join('\n');
  var solucao = [
    'import re', 'from pathlib import PurePath', '', '',
    'def instalacao_limpa(modulo_importado, checkout):', '    origem = str(modulo_importado).replace("\\\\", "/")', '    base = str(checkout).replace("\\\\", "/")',
    '    return bool(origem) and not origem.startswith(base)', '', '',
    'def normalizar_entrada(texto, caminho):', '    plano = texto.replace("\\r\\n", "\\n").replace("\\r", "\\n")',
    '    return (plano.casefold(), PurePath(caminho).as_posix().casefold())', '', '',
    'def admitir_pedido(dado_bruto):', '    if not isinstance(dado_bruto, dict):', '        return ("rejeitado", "tenant")',
    '    t = dado_bruto.get("tenant")', '    if not isinstance(t, str) or not t.strip():', '        return ("rejeitado", "tenant")',
    '    v = dado_bruto.get("valor")', '    if not isinstance(v, str) or not re.fullmatch(r"\\d+(\\.\\d{1,2})?", v):', '        return ("rejeitado", "valor")',
    '    return ("admitido", dado_bruto)', ''].join('\n');

  TrilhaAula.registrar({
    id: 'm02a-b13',
    titulo: 'Python sênior aplicado: produto instalável e diagnóstico',
    minutos: 40,
    resumo: '"Passou no checkout" é só proximidade do código-fonte: o teste que importa executa o produto instalado, a partir de outro diretório, e separa defeito de produto de diferença de plataforma.',
    objetivo: 'Decidir construções idiomáticas por responsabilidade, legibilidade e custo, validar a fronteira em runtime, provar a instalação limpa e depurar com método entre plataformas.',
    revisao: [
      { id: 'm02ab13-idiom', pergunta: 'O que torna uma construção "idiomática" num contexto sênior?',
        opcoes: [
          opc('a', 'Responsabilidade, legibilidade e custo de execução já conhecidos, com custo medido no volume real; elegante que esconde alocação é estilo, não engenharia.', true, 'otimizar sem workload, amostra bruta e digest é o experimento sem threshold que o B11 rejeitou.'),
          opc('b', 'Ser a mais curta.', false, 'corpo longo numa comprehension vira enigma.'),
          opc('c', 'Ser a mais rápida em microbenchmark.', false, 'sem workload é palpite.')] },
      { id: 'm02ab13-tipos', pergunta: 'Anotação de tipo garante o valor em runtime?',
        opcoes: [
          opc('a', 'Não: é declaração para leitor e verificador; a fronteira valida em runtime e o domínio tipa. Coerção ajuda e mente, e construção sem validador ou mutação pós-validação contornam a garantia.', true, 'tipar tudo, validar só a fronteira: validação espalhada duplica regra e diverge.'),
          opc('b', 'Sim, o interpretador barra o tipo errado.', false, 'o Python não barra a chamada.'),
          opc('c', 'Só com mypy.', false, 'o verificador estático não vê o dado externo.')] },
      { id: 'm02ab13-instalado', pergunta: 'Qual é a prova de que o produto instalado funciona?',
        opcoes: [
          opc('a', 'API e CLI executadas de outro diretório, com o checkout fora do caminho de imports e a origem do módulo afirmada (wheel, ponto de entrada declarado em <code>pyproject.toml</code>).', true, 'o defeito clássico é o import acidental: teste verde porque o diretório corrente contém o fonte.'),
          opc('b', 'Os testes passam no checkout.', false, 'proximidade do código-fonte, não evidência.'),
          opc('c', 'Copiar o diretório-fonte.', false, 'isso não é distribuição.')] },
      { id: 'm02ab13-metodo', pergunta: 'Qual a ordem de perguntas da depuração com método?',
        opcoes: [
          opc('a', 'Imports, memória, entrada e saída, concorrência; com evidência em cada parada.', true, 'reproduzir o mínimo, levantar hipótese e isolar, não tentar mudanças ao acaso.'),
          opc('b', 'Reinstalar tudo.', false, 'não é método.'),
          opc('c', 'Trocar de máquina.', false, 'esconde a diferença.')] },
      { id: 'm02ab13-plat', pergunta: 'O CLI funciona no Linux e quebra no Windows ao ler arquivo com acentos. Causa e defesa?',
        opcoes: [
          opc('a', 'Encoding padrão dependente da plataforma; explicite <code>encoding="utf-8"</code> e trate newline nas fronteiras. Normalize na entrada, decida no formato interno, formate na saída.', true, 'newline (LF, CRLF, CR), casing (casefold) e paths (pathlib) são as três diferenças que mais falsificam defeito.'),
          opc('b', 'O Windows não suporta acentos.', false, 'suporta; o padrão é que difere.'),
          opc('c', 'O arquivo está corrompido.', false, 'a hipótese é a plataforma.')] }
    ],
    abas: [
      { rotulo: 'Entender', blocos: [
        { tipo: 'texto', html:
          '<p>O gate do B12 só vale se o objeto testado for o produto instalado, não o checkout do autor. "Funciona na minha máquina" e "o teste passou no checkout" parecem evidência e são só proximidade do código-fonte. Este bloco trata escolhas idiomáticas, fronteiras tipadas, empacotamento e depuração entre plataformas.</p>' +
          '<h3>Escolhas idiomáticas por responsabilidade, legibilidade e custo</h3>' +
          '<p>Idiomático não é "curto" nem "pythônico" por gosto: é a construção cuja responsabilidade (qual camada decide), legibilidade (quanto um revisor leva para provar o comportamento sem executar) e custo de execução são conhecidos. O erro sênior é otimizar sem oráculo; patamares do material são exemplo variável, válidos para seed, amostra e digest declarados.</p>' },
        { tipo: 'texto', largo: true, html:
          '<table><thead><tr><th>Escolha</th><th>Quando ajuda</th><th>Quando cobra</th></tr></thead><tbody>' +
          '<tr><td>comprehension sobre laço com append</td><td>transformação única, curta, sem efeito colateral</td><td>corpo longo com ramificações: enigma de uma linha</td></tr>' +
          '<tr><td>gerador sobre lista materializada</td><td>consumo item a item em volume grande</td><td>reiterar ou medir tamanho exige materializar; gerador esgotado em silêncio</td></tr>' +
          '<tr><td>dataclass sobre dicionário solto</td><td>forma interna com campos conhecidos e invariantes locais</td><td>fronteira externa sem validação: dicionário tipado não valida</td></tr>' +
          '<tr><td>função pequena com nome de decisão</td><td>regra P0 com oráculo próprio e mutante que a mata</td><td>fragmentação em dez helpers sem owner</td></tr>' +
          '</tbody></table>' },
        { tipo: 'texto', html: '<p>A construção mais mentirosa é a elegante que esconde alocação: uma cadeia "limpa" que materializa a coleção três vezes. Se o volume cabe na memória por acidente, o gate passa e a produção paga.</p>' +
          '<h3>Fronteiras tipadas que preservam a verdade de runtime</h3>' +
          '<p>Anotação é declaração para leitor e verificador estático; <strong>verdade de runtime</strong> é o valor que realmente chega. O interpretador não barra a chamada com tipo errado. A fronteira de confiança (CLI, arquivo, rede) valida em runtime; o domínio recebe valor já admitido e tipado. Limites declarados: coerção ajuda e mente (cada coerção aceita entradas que o domínio nunca desenhou; o modo estrito existe para exatidão); construção que contorna a validação e mutação pós-validação quebram a garantia. Decisão: tipar tudo, validar só a fronteira.</p>' },
        { tipo: 'codigo', linguagem: 'python', texto: 'def admitir_pedido(fronteira, dado_bruto):\n    # valida em runtime; o domínio recebe valor já admitido\n    pedido = fronteira.validar(dado_bruto)\n    if not pedido.ok:\n        return ("rejeitado", pedido.motivo)\n    return ("admitido", pedido.valor)' },
        { tipo: 'takeaway', html: 'Idiomático sem <mark>medida</mark> é estilo; <mark>tipar tudo, validar a fronteira</mark>.' }
      ] },

      { rotulo: 'Instalado e plataformas', blocos: [
        { tipo: 'texto', html:
          '<h3>Empacotar, instalar e executar fora do checkout</h3>' +
          '<p>O <strong>source tree</strong> (checkout) é o diretório com o código-fonte; o <strong>produto instalado</strong> é o pacote copiado para o ambiente, descoberto pelo mecanismo de imports sem enxergar o checkout. O <code>pyproject.toml</code> declara nome, versão, dependências e build; os <strong>pontos de entrada</strong> nomeiam os comandos da CLI instalada; o <strong>wheel</strong> é o artefato versionado que atravessa ambientes. O oráculo: API e CLI executadas de outro diretório, com o checkout fora do caminho de imports, e a origem do módulo afirmada. O defeito clássico é o <em>import acidental</em>.</p>' },
        { tipo: 'codigo', linguagem: 'python', texto: 'def instalacao_limpa(modulo_importado, checkout):\n    # origem instalada, nunca o source tree\n    origem = str(modulo_importado).replace("\\\\", "/")\n    base = str(checkout).replace("\\\\", "/")\n    return bool(origem) and not origem.startswith(base)' },
        { tipo: 'texto', largo: true, html:
          '<table><thead><tr><th>Peça</th><th>Decisão</th><th>Erro clássico</th></tr></thead><tbody>' +
          '<tr><td><code>pyproject.toml</code></td><td>projeto, versão, dependências e builder</td><td>metadado no instalador improvisado</td></tr>' +
          '<tr><td>pontos de entrada</td><td>qual função atende cada comando</td><td>script solto que some no instalado</td></tr>' +
          '<tr><td>wheel versionado</td><td>artefato idêntico entre ambientes</td><td>copiar o diretório-fonte e chamar de distribuição</td></tr>' +
          '<tr><td>oráculo fora do source tree</td><td>o instalado executa sem importar o checkout</td><td>teste verde só com o diretório corrente sobre o fonte</td></tr>' +
          '</tbody></table>' },
        { tipo: 'callout', tom: 'info', titulo: 'Limite', html: '<p>O wheel prova o recorte local instalável, não um release público: publicar num índice, assinar artefato e gerir versões concorrentes têm oráculos próprios. Versões, tamanhos e tempos citados são exemplo variável.</p>' },
        { tipo: 'texto', html:
          '<h3>Depurar com método e atravessar plataformas</h3>' +
          '<p>Quatro perguntas, na mesma ordem, com evidência em cada parada: <strong>imports</strong> (o nome resolve para o módulo pretendido?), <strong>memória</strong> (o objeto vive e morre onde deveria?), <strong>entrada e saída</strong> (bytes, texto e prazos atravessam sem perda?) e <strong>concorrência</strong> (timeout e cancelamento fazem cleanup sem task órfã? O B14 aprofunda). As três diferenças de plataforma: <strong>newline</strong> (LF, CRLF e CR legado: converter para quebra única na entrada), <strong>casing</strong> (dobrar com <code>casefold</code> antes de comparar) e <strong>paths</strong> (construir com <code>pathlib</code>, nunca com separador literal).</p>' },
        { tipo: 'codigo', linguagem: 'python', texto: 'def normalizar_entrada(texto, caminho):\n    # newline, casing e paths antes da regra\n    plano = texto.replace("\\r\\n", "\\n").replace("\\r", "\\n")\n    chave = plano.casefold()\n    return (chave, caminho.as_posix().casefold())' },
        { tipo: 'texto', html: '<p>Regra: normalizar na entrada, decidir no formato interno, formatar na saída. Nenhuma regra de domínio compara texto bruto nem monta caminho com separador literal. Código do laboratório: <code>diagnostico.py</code>.</p>' +
          '<p><strong>Fontes</strong> (revalidar por release): PyPA Packaging User Guide; PEP 621, 518 e 517; Python 3.14 (import system, <code>pathlib</code>, text sequence types).</p>' },
        { tipo: 'takeaway', html: 'Produto <mark>instalado</mark> executado <mark>fora do checkout</mark>; <mark>normalizar na entrada</mark>, decidir no interno, formatar na saída.' }
      ] },

      { rotulo: 'Praticar e conferir', blocos: [
        { tipo: 'rode', id: 'b13-rode', titulo: 'Passa no checkout, falha instalado', obrigatorio: false,
          enunciado: 'Saída ilustrativa (exemplo) de um diagnóstico de ambiente.',
          prefixo: '$', entrada: 'cd /tmp && python -c "import work_intake; print(work_intake.__file__)"  # exemplo', unidade: 'ms', terminalTitulo: 'exemplo (saída variável)',
          prever: { pergunta: 'O teste passa dentro do repositório. Por que ele não prova o produto instalado?', opcoes: [
            { id: 'a', texto: 'O diretório corrente pode estar fornecendo o fonte (import acidental): a origem do módulo é o checkout.', correta: true, porque: 'afirme a origem instalada, de outro diretório.' },
            { id: 'b', texto: 'Porque o pytest é lento.', correta: false, porque: 'não tem relação.' }] },
          etapas: [
            { id: 'a', nome: 'No checkout', descricao: '', tom: 'dns', ms: 1, linhas: [L('out', '/home/dev/repo/src/work_intake/__init__.py'), L('hint', 'origem dentro do checkout: import acidental')] },
            { id: 'b', nome: 'Fora do checkout', descricao: '', tom: 'response', ms: 1, linhas: [L('out', '/venv/lib/python3.14/site-packages/work_intake/__init__.py'), L('hint', 'origem instalada: oráculo atendido')] }
          ] },
        { tipo: 'python', id: 'b13-python', titulo: 'Origem instalada, normalização e fronteira', obrigatorio: false,
          enunciado: 'Implemente <code>instalacao_limpa</code>, <code>normalizar_entrada</code> (LF, <code>casefold</code>, path posix) e <code>admitir_pedido</code> (valida em runtime; rejeita float no valor).',
          codigo: codigo, testes: testes,
          dica: 'Normalize "\\\\" para "/" antes de <code>startswith</code>. Newline: troque "\\r\\n" primeiro, depois "\\r". Valor: <code>re.fullmatch</code> sobre string.',
          solucao: solucao, callout: 'Instalação limpa, normalização e fronteira verificadas.' },
        { tipo: 'transcript', id: 'b13-transcript', titulo: 'Qual afirmação não se sustenta?', obrigatorio: false, terminalTitulo: 'sessão de depuração',
          enunciado: 'Clique na afirmação que a evidência não sustenta.',
          linhas: [
            { quem: 'voce', texto: 'O CLI quebra no cliente. O que você viu?' },
            { quem: 'agente', texto: 'Rodei pytest no repositório: tudo verde.' },
            { quem: 'ferramenta', texto: '$ python -c "import work_intake; print(work_intake.__file__)"\n/home/dev/repo/src/work_intake/__init__.py' },
            { quem: 'agente', texto: 'Logo o produto instalado está correto.' }],
          erradas: [3], explicacao: { 3: 'a origem do módulo é o checkout: o teste usou o fonte, não o wheel. Falta executar de outro diretório com o pacote instalado e afirmar a origem.' } },
        { tipo: 'escolha', id: 'b13-esc1', titulo: 'Confira: CLI que não existe', pergunta: 'A CLI instalada não existe ou abre o fonte errado. Hipótese?',
          opcoes: [
            { id: 'a', texto: 'Ponto de entrada ausente ou script solto fora do pacote; declare o script no projeto e redistribua o wheel.', correta: true, porque: 'verifique o nome do comando nos artefatos do wheel.' },
            { id: 'b', texto: 'O PATH do usuário.', correta: false, porque: 'o script solto some no instalado.' }] },
        { tipo: 'escolha', id: 'b13-esc2', titulo: 'Confira: valor tipado que viola a regra', pergunta: 'O objeto é válido no tipo e inválido na fronteira. Hipótese?',
          opcoes: [
            { id: 'a', texto: 'Construção sem validador ou mutação pós-validação; valide na fronteira e declare quem pode mutar e quando.', correta: true, porque: 'tipo estático não valida o dado externo.' },
            { id: 'b', texto: 'O mypy está errado.', correta: false, porque: 'a garantia é de runtime.' }] },
        { tipo: 'takeaway', html: 'Depure por <mark>imports, memória, I/O e concorrência</mark>, com um oráculo por parada.' }
      ] }
    ]
  });
})();
