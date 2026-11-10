/* M02 · Bloco 7: Python idiomático com operabilidade. Fonte: M02.html#b7. */
(function () {
  var L = function (kind, text) { return { kind: kind, text: text }; };
  function opc(id, texto, correta, porque) { return { id: id, texto: texto, correta: correta, porque: porque }; }
  var py = function (l) { return l.join('\n') + '\n'; };

  var codigo = py([
    'def linhas_validas(linhas):',
    '    # GERADOR: ignore linhas vazias e comentarios (#); entregue cada linha sem espacos nas pontas',
    '    return []',
    '',
    '',
    'def totais(linhas):',
    '    # linhas: iteravel (uma unica passada!) de "categoria;valor" com valor inteiro',
    '    # devolva dict categoria -> soma; valor invalido -> ValueError("linha invalida: <linha>")',
    '    return {}'
  ]);
  var testes = py([
    'def test_filtra_e_aparara():',
    '    assert list(linhas_validas(["  a;1 ", "", "# nota", "b;2"])) == ["a;1", "b;2"]',
    '',
    '',
    'def test_e_gerador_e_se_esgota():',
    '    g = linhas_validas(["a;1"])',
    '    assert iter(g) is g',
    '    assert list(g) == ["a;1"]',
    '    assert list(g) == []',
    '',
    '',
    'def test_totais_soma_por_categoria():',
    '    assert totais(["m;100", "f;5", "m;20"]) == {"m": 120, "f": 5}',
    '',
    '',
    'def test_totais_aceita_gerador_de_uma_passada():',
    '    fonte = (l for l in ["a;1", "", "# x", "a;2"])',
    '    assert totais(fonte) == {"a": 3}',
    '',
    '',
    'def test_vazio():',
    '    assert totais([]) == {}',
    '',
    '',
    'def test_linha_invalida_falha_com_a_linha():',
    '    for ruim in ("m;abc", "semponto"):',
    '        try:',
    '            totais(["a;1", ruim])',
    '        except ValueError as e:',
    '            assert ruim in str(e)',
    '        else:',
    '            assert False, "deveria falhar"'
  ]);
  var solucao = py([
    'from collections import defaultdict',
    '',
    '',
    'def linhas_validas(linhas):',
    '    for linha in linhas:',
    '        limpa = linha.strip()',
    '        if limpa and not limpa.startswith("#"):',
    '            yield limpa',
    '',
    '',
    'def totais(linhas):',
    '    soma = defaultdict(int)',
    '    for linha in linhas_validas(linhas):',
    '        try:',
    '            cat, valor = linha.split(";")',
    '            soma[cat] += int(valor)',
    '        except ValueError:',
    '            raise ValueError(f"linha invalida: {linha}") from None',
    '    return dict(soma)'
  ]);

  TrilhaAula.registrar({
    id: 'm02-b7',
    titulo: 'Python idiomático com operabilidade',
    minutos: 30,
    resumo: 'Context managers, geradores, comprehensions e pattern matching trazem contratos de lifetime e mutabilidade. Ler código de IA com precisão é reconhecer hábitos de outra stack.',
    objetivo: 'Usar with e geradores com o lifetime certo, escolher a estrutura pela responsabilidade, evitar a armadilha dos nomes simples em match e refatorar um processador sem perder operabilidade.',
    abas: [
      { rotulo: 'Entender', blocos: [
        { tipo: 'texto', html:
          '<h3>Context managers: gestão determinística</h3>' +
          '<p>O protocolo síncrono usa <code>__enter__</code>/<code>__exit__</code> e o assíncrono, <code>__aenter__</code>/<code>__aexit__</code>. Eles dão cleanup determinístico; o GC não substitui fechar conexão, arquivo e lock em tempo. RAII estrito liga aquisição ao lifetime do objeto e não equivale exatamente a <code>with</code>. Vários recursos cabem num só <code>with</code>, e um context manager pode nascer de um gerador:</p>' },
        { tipo: 'codigo', linguagem: 'python', texto:
          'with open("in.csv") as origem, open("out.csv", "w") as destino:\n    destino.write(origem.read())\n\n@contextmanager\ndef cronometro(rotulo: str) -> Iterator[None]:\n    inicio = time.perf_counter()\n    try:\n        yield                       # <- aqui roda o corpo do with\n    finally:\n        print(f"{rotulo}: {time.perf_counter() - inicio:.3f}s")' },
        { tipo: 'texto', html:
          '<p>O padrão volta como transação de banco (M03), span de tracing (M06) e orçamento de tokens (M05). A versão assíncrona (<code>async with</code>) tem contrato próprio de entrada e saída.</p>' +
          '<h3>Geradores: preguiça, ownership e memória</h3>' +
          '<p>Um <strong>gerador</strong> entrega um item de cada vez e pausa em <code>yield</code>: um CSV de 10 GB cabe na memória de <em>uma</em> linha. Duas pegadinhas: ele <strong>se esgota</strong> (a segunda iteração vem vazia, sem erro; o <code>IEnumerable</code> do LINQ reexecuta, o gerador não; para duas passadas, <code>list(gen)</code>), e <strong>preguiça com recurso é armadilha</strong>: se o <code>with</code> do arquivo fechar antes do consumo, explode. Consuma dentro do escopo ou faça a função possuir o recurso.</p>' },
        { tipo: 'codigo', linguagem: 'python', texto:
          'def linhas_validas(caminho: str) -> Iterator[str]:\n    with open(caminho, encoding="utf-8") as f:\n        for linha in f:\n            limpa = linha.strip()\n            if limpa and not limpa.startswith("#"):\n                yield limpa' },
        { tipo: 'takeaway', html: 'Gerador: <mark>memória de uma linha</mark>, mas <mark>uso único</mark>; quem consome gasta.' }
      ] },

      { rotulo: 'Ver funcionando', blocos: [
        { tipo: 'texto', html:
          '<h3>Comprehensions e pattern matching</h3>' +
          '<p>Regra de revisor: comprehension com <em>uma</em> cláusula de filtro e <em>uma</em> transformação. Dois <code>for</code> aninhados e três <code>if</code> viram função nomeada.</p>' },
        { tipo: 'codigo', linguagem: 'python', texto:
          'valores = [t.valor for t in transacoes if t.categoria == "mercado"]   # Where + Select\npor_id  = {t.id: t for t in transacoes}                               # ToDictionary\nunicos  = {t.categoria for t in transacoes}                           # set: Distinct\ntotal   = sum(t.valor for t in transacoes)                            # gerador: sem lista intermediária' },
        { tipo: 'texto', html:
          '<p><code>match</code> seleciona um caso pela <em>forma</em> do valor e aceita uma condição com <code>if</code>. Uso legítimo: despachar sobre dado semi-estruturado (webhooks, mensagens de agente, respostas de LLM). Para dois casos, um <code>if</code> simples é mais claro.</p>' },
        { tipo: 'codigo', linguagem: 'python', texto:
          'def rotular(evento: dict[str, object]) -> str:\n    match evento:\n        case {"tipo": "pagamento", "valor": int(v)} if v > 100_000:\n            return f"pagamento grande: {v}"\n        case {"tipo": "pagamento"}:\n            return "pagamento comum"\n        case {"tipo": "estorno", "motivo": str(m)}:\n            return f"estorno: {m}"\n        case _:\n            return "desconhecido"' },
        { tipo: 'rode', id: 'idi-rode', titulo: 'O gerador que se esgota', obrigatorio: false,
          enunciado: 'Preveja a saída de <code>g = (x*x for x in range(3)); print(list(g)); print(list(g))</code> e rode.',
          prefixo: '>>>', entrada: 'g = (x*x for x in range(3)); print(list(g)); print(list(g))', unidade: 'ms', terminalTitulo: 'REPL',
          etapas: [
            { id: 'p1', nome: '1º list(g)', descricao: 'consome o gerador', tom: 'dns', ms: 1, linhas: [L('out', '[0, 1, 4]')] },
            { id: 'p2', nome: '2º list(g)', descricao: 'já esgotado', tom: 'tcp', ms: 1, linhas: [L('out', '[]'), L('hint', 'sem erro e sem StopIteration visível: list() trata o fim da iteração')] }
          ],
          prever: { pergunta: 'Qual é a saída?', opcoes: [
            opc('a', '[0, 1, 4] e depois [] : o gerador é de uso único e já foi consumido.', true, 'geradores têm estado e ownership: quem consome gasta.'),
            opc('b', '[0, 1, 4] duas vezes.', false, 'isso valeria para uma lista.'),
            opc('c', '[0, 1, 4] e depois StopIteration.', false, 'list() absorve o fim; o resultado é uma lista vazia.'),
            opc('d', '[] as duas vezes, pois é preguiçoso.', false, 'a primeira list(g) executa o gerador.')] },
          tutorDepois: 'Preciso de duas passadas? Materialize com list ou recrie o gerador. A preguiça economiza memória em troca de um contrato de lifetime.',
          callout: 'Você viu o uso único na prática.' },
        { tipo: 'takeaway', html: 'Comprehension com <mark>uma cláusula de cada</mark>; <mark>match</mark> despacha pela forma de dado semi-estruturado.' }
      ] },

      { rotulo: 'Praticar', blocos: [
        { tipo: 'texto', html:
          '<h3>Escolher a estrutura pela responsabilidade</h3>' +
          '<p>Heurística: valide dado externo num modelo de fronteira; represente dado interno com dataclass, mapping, tuple ou classe conforme comportamento e invariantes. A dataclass gera métodos, não valida tipos. <code>frozen=True</code> bloqueia a atribuição de campos, mas não congela objetos internos, e o hash só existe quando opções e campos permitem. Default mutável sempre com <code>field(default_factory=list)</code>.</p>' +
          '<p>Agora um defeito de outra stack (<code>fixtures/generated_defects/</code>): <code>CsvProcessor</code> com <code>LoadFile</code>/<code>GetTotals</code>, <code>open</code> e <code>close</code> manuais, <code>while</code> com índice, estado em <code>self.lines</code>. Refatore para funções puras.</p>' },
        { tipo: 'python', id: 'idi-python', titulo: 'Refatore o CsvProcessor', obrigatorio: false,
          enunciado: 'Implemente <code>linhas_validas(linhas)</code> como <strong>gerador</strong> e <code>totais(linhas)</code> em uma única passada, somando por categoria. Valor inválido ou linha sem <code>;</code> levanta <code>ValueError</code> citando a linha.',
          codigo: codigo, testes: testes,
          dica: 'Use <code>yield limpa</code> dentro de <code>for</code>. Em <code>totais</code>: <code>defaultdict(int)</code>, <code>cat, valor = linha.split(";")</code> e capture <code>ValueError</code> para relançar com a linha.',
          solucao: solucao,
          tutorDepois: 'Sem estado de instância, duas funções puras substituem a classe. Não existe meta de linhas: contrato preservado, menos estado e memória compatível com streaming são os critérios.',
          callout: 'O contrato foi preservado com menos estado e uma passada só.' },
        { tipo: 'complete', id: 'idi-complete', titulo: 'Complete o refator', linguagem: 'python', obrigatorio: false,
          enunciado: 'Escolha o idioma Python que substitui cada hábito de outra stack.',
          partes: [
            'def carregar(caminho: str) -> list[str]:\n    ', { lacuna: 'w', opcoes: ['with open(caminho, encoding="utf-8") as f:', 'f = open(caminho)  # e f.close() depois', 'open(caminho).read()'], correta: 'with open(caminho, encoding="utf-8") as f:' },
            '\n        return [l.strip() for l in f if l.strip() and not l.startswith("#")]\n\ndef somar(totals: dict[str, int], cat: str, val: int) -> None:\n    totals[cat] = ', { lacuna: 'get', opcoes: ['totals.get(cat, 0) + val', 'totals[cat] + val  # e if cat in totals', 'val'], correta: 'totals.get(cat, 0) + val' },
            '\n\nfor linha in ', { lacuna: 'it', opcoes: ['linhas', 'range(len(linhas))', 'iter(range(0))'], correta: 'linhas' },
            ':  # iteração direta, sem índice\n    ...\n'
          ],
          explicacao: '<code>with</code> fecha o arquivo mesmo com exceção; <code>dict.get</code> (ou <code>defaultdict</code>/<code>Counter</code>) expressa a soma; iterar direto substitui o índice. snake_case e type hints mostram intenção.',
          callout: 'Os três hábitos de outra stack foram trocados pelos idiomas.' },
        { tipo: 'texto', html:
          '<h3>Operabilidade</h3>' +
          '<p>Encoding UTF-8 e política explícita de newline definem a fronteira de texto; stdout carrega o resultado, stderr o diagnóstico e os exit codes são documentados. Correlation id, <code>raise ... from exc</code>, <code>perf_counter_ns()</code> e <code>tracemalloc</code> mantêm a falha e o custo investigáveis. Os testes por subprocesso separam stdout e stderr, validam bytes UTF-8 e exit code; o caso grande preserva memória compatível com streaming e o erro aponta para a causa original.</p>' },
        { tipo: 'takeaway', html: '<mark>stdout</mark> é resultado, <mark>stderr</mark> é diagnóstico, e o <mark>exit code</mark> é contrato documentado.' }
      ] },

      { rotulo: 'Conferir', blocos: [
        { tipo: 'escolha', id: 'idi-esc-match', titulo: 'Confira: nome simples em case',
          pergunta: 'Em <code>match cor:</code> com <code>case VERMELHO:</code> (nome simples, sem ponto), o que acontece?',
          opcoes: [
            { id: 'a', texto: 'Compara cor == VERMELHO usando a variável global.', correta: false, porque: 'nome simples não compara.' },
            { id: 'b', texto: 'Dá SyntaxError porque faltou o ponto.', correta: false, porque: 'é código válido.' },
            { id: 'c', texto: 'Casa só se cor for do mesmo tipo de VERMELHO.', correta: false, porque: 'não é teste de tipo.' },
            { id: 'd', texto: 'VERMELHO vira um padrão de captura: casa com qualquer valor e o liga ao nome. Para comparar com constante use nome pontuado (<code>Cor.VERMELHO</code>).', correta: true, porque: 'nomes simples capturam, nomes pontuados comparam. Um case assim no meio esconde os seguintes, que nunca rodam.' }
          ], tutorDepois: 'A armadilha clássica do pattern matching.' },
        { tipo: 'escolha', id: 'idi-esc-referencia', titulo: 'Confira: referência e igualdade',
          pergunta: 'Qual das afirmações está correta?',
          opcoes: [
            { id: 'a', texto: '<code>is</code> é Equals; <code>==</code> é ReferenceEquals.', correta: false, porque: 'está invertido.' },
            { id: 'b', texto: '<code>==</code> delega a igualdade ao tipo; <code>is</code> testa identidade e serve a singletons como None; um typo em atributo cria atributo novo, e <code>slots=True</code> barra isso.', correta: true, porque: 'tudo é referência; Python cria atributos on-the-fly.' },
            { id: 'c', texto: 'Atribuir b = a copia o objeto.', correta: false, porque: 'liga outro nome ao mesmo objeto.' }
          ], tutorDepois: 'Nomes ligados a objetos, igualdade delegada ao tipo.' },
        { tipo: 'takeaway', html: '<mark>Nomes simples capturam</mark>, <mark>nomes pontuados comparam</mark>; <mark>slots</mark> barra o typo que cria atributo.' }
      ] }
    ],
    revisao: [
      { id: 'm02b7-with', pergunta: 'O que o with garante?', opcoes: [
        opc('a', 'Cleanup determinístico no sucesso e na exceção; __exit__ pode suprimir a exceção', true, 'o paralelo com using ajuda, mas os protocolos não são idênticos.'),
        opc('b', 'Que o GC fecha o recurso depois', false, 'GC não substitui o fechamento oportuno.'),
        opc('c', 'Que a exceção sempre é suprimida', false, 'só se o __exit__ suprimir.')] },
      { id: 'm02b7-gerador', pergunta: 'Qual a armadilha dupla do gerador?', opcoes: [
        opc('a', 'Se esgota (segunda iteração vazia, sem erro) e, com recurso, falha se o with fechar antes do consumo', true, 'materialize com list para duas passadas e consuma dentro do escopo.'),
        opc('b', 'Executa tudo de uma vez', false, 'é preguiçoso.'),
        opc('c', 'Reexecuta a cada iteração, como o LINQ', false, 'o gerador não reexecuta.')] },
      { id: 'm02b7-comp', pergunta: 'Quando uma comprehension vira função nomeada?', opcoes: [
        opc('a', 'Ao passar de uma cláusula de filtro e uma transformação (for aninhados, vários if)', true, 'legibilidade é o critério.'),
        opc('b', 'Nunca', false, 'há limite de legibilidade.'),
        opc('c', 'Sempre que usar sum', false, 'sum com gerador é bom.')] },
      { id: 'm02b7-frozen', pergunta: 'O que frozen=True e slots=True fazem numa dataclass?', opcoes: [
        opc('a', 'frozen bloqueia reatribuir campos (não congela objetos internos); slots controla atributos e barra typo', true, 'default mutável exige field(default_factory=...).'),
        opc('b', 'Garantem imutabilidade profunda', false, 'não garantem.'),
        opc('c', 'Validam os tipos', false, 'dataclass não valida.')] },
      { id: 'm02b7-saida', pergunta: 'Como a CLI separa saída e diagnóstico?', opcoes: [
        opc('a', 'stdout leva o resultado, stderr o diagnóstico e o exit code é documentado', true, 'testes por subprocesso verificam as três coisas.'),
        opc('b', 'Tudo em stdout', false, 'mistura resultado e diagnóstico.'),
        opc('c', 'Tudo em stderr', false, 'quebra pipes.')] }
    ]
  });
})();
