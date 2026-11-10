/* M02 · Bloco 3: typing gradual. Fonte: M02.html#b3. Mensagens do mypy mostradas como exemplo: o texto exato varia com a versão. */
(function () {
  var L = function (kind, text) { return { kind: kind, text: text }; };
  function opc(id, texto, correta, porque) { return { id: id, texto: texto, correta: correta, porque: porque }; }
  var py = function (l) { return l.join('\n') + '\n'; };

  var codigo = py([
    'from decimal import Decimal',
    '',
    '',
    'def total(valores):',
    '    # comece em Decimal("0"), nao em int 0',
    '    return 0',
    '',
    '',
    'def media(valores):',
    '    # lista vazia e falha de VALOR, nao de tipo: levante ValueError("lista vazia")',
    '    return Decimal("0")'
  ]);
  var testes = py([
    'from decimal import Decimal',
    '',
    '',
    'def test_total_e_decimal():',
    '    t = total([Decimal("0.1"), Decimal("0.2")])',
    '    assert isinstance(t, Decimal)',
    '    assert t == Decimal("0.3")',
    '',
    '',
    'def test_total_vazio_e_decimal_zero():',
    '    t = total([])',
    '    assert isinstance(t, Decimal) and t == Decimal("0")',
    '',
    '',
    'def test_media():',
    '    assert media([Decimal("1"), Decimal("2")]) == Decimal("1.5")',
    '',
    '',
    'def test_media_lista_vazia_falha():',
    '    try:',
    '        media([])',
    '    except ValueError as e:',
    '        assert "vazia" in str(e)',
    '    else:',
    '        assert False, "lista vazia deveria levantar ValueError"'
  ]);
  var solucao = py([
    'from decimal import Decimal',
    '',
    '',
    'def total(valores):',
    '    soma = Decimal("0")',
    '    for v in valores:',
    '        soma += v',
    '    return soma',
    '',
    '',
    'def media(valores):',
    '    if not valores:',
    '        raise ValueError("lista vazia")',
    '    return total(valores) / len(valores)'
  ]);

  TrilhaAula.registrar({
    id: 'm02-b3',
    titulo: 'Typing gradual: hints, Protocol, narrowing e genéricos',
    minutos: 35,
    resumo: 'Annotations alimentam análise estática e não validam nada em runtime. O checker pega erro de tipo, não de valor; Protocol dá compatibilidade estrutural; Any é contagioso.',
    objetivo: 'Dizer o que mypy cobre e o que continua com Pydantic e testes, usar Protocol, TypeIs e variância com critério e separar bug de tipo de bug de valor.',
    abas: [
      { rotulo: 'Entender', blocos: [
        { tipo: 'texto', html:
          '<h3>Typing é gradual; o checker é ferramenta</h3>' +
          '<p>Python continua dinamicamente tipado. As <strong>annotations</strong> alimentam análise estática, IDEs, geração de schema e introspecção, mas não impõem tipos em runtime por padrão. A <strong>typing specification</strong> define a semântica compartilhada; mypy e pyright são implementações cujos diagnósticos e opções podem divergir. O lab fixa o mypy e sua configuração para o gate ser reproduzível, sem chamar uma implementação de "compilador do Python".</p>' },
        { tipo: 'texto', largo: true, html:
          '<table><thead><tr><th>Verificação</th><th>Mecanismo</th><th>Limite</th></tr></thead><tbody>' +
          '<tr><td>Compatibilidade estática</td><td>mypy ou pyright</td><td>Depende das anotações, do código visível e da configuração.</td></tr>' +
          '<tr><td>Anotações em execução</td><td>Metadados da definição</td><td>Não impõem validação automaticamente.</td></tr>' +
          '<tr><td>Dados externos</td><td>Pydantic no laboratório</td><td>Valida só o caminho que for executado.</td></tr></tbody></table>' +
          '<p>Testes e invariantes de domínio continuam necessários para verificar comportamento.</p>' },
        { tipo: 'texto', largo: true, html:
          '<h3>Vocabulário de tipos</h3><table><thead><tr><th>Conceito</th><th>Python</th><th>Interpretação</th></tr></thead><tbody>' +
          '<tr><td>Valores básicos</td><td><code>str</code>, <code>int</code>, <code>float</code>, <code>bool</code></td><td>Decimal exato usa <code>decimal.Decimal</code> conforme o domínio.</td></tr>' +
          '<tr><td>Coleções</td><td><code>list[T]</code>, <code>dict[K, V]</code>, <code>set[T]</code></td><td>Sequência mutável, associação e conjunto.</td></tr>' +
          '<tr><td>Ausência permitida</td><td><code>str | None</code></td><td>O uso exige distinguir os dois casos.</td></tr>' +
          '<tr><td>Valor desconhecido</td><td><code>object</code></td><td>Exige refinar o tipo antes de operar; <code>Any</code> permite operar sem essa prova.</td></tr>' +
          '<tr><td>Retorno sem resultado</td><td><code>-> None</code></td><td>Sem valor útil para o consumidor.</td></tr>' +
          '<tr><td>Função como valor</td><td><code>Callable[[int], str]</code></td><td>De <code>collections.abc</code>.</td></tr>' +
          '<tr><td>Tipo parametrizado</td><td><code>def primeiro[T](itens: list[T]) -> T</code></td><td>Relaciona itens e retorno, sem validar valores.</td></tr>' +
          '<tr><td>Vocabulário finito</td><td><code>StrEnum</code></td><td>Serialização e compatibilidade precisam de contrato.</td></tr>' +
          '<tr><td>Registro de dados</td><td><code>dataclass</code></td><td>Gera métodos; não é validação de fronteira.</td></tr>' +
          '<tr><td>Contrato estrutural</td><td><code>Protocol</code></td><td>Descreve os membros que o consumidor precisa.</td></tr></tbody></table>' },
        { tipo: 'texto', html:
          '<h3>Forma, estado e narrowing explícito</h3>' +
          '<p><code>TypedDict</code> descreve a forma estática de um mapping, mas não cria classe nem valida JSON. <code>Literal</code> restringe valores conhecidos; <code>Self</code> preserva o subtipo em APIs fluentes; <code>Never</code> torna a exaustividade verificável. <code>TypeIs</code> refina os ramos verdadeiro <em>e</em> falso quando o tipo retornado é compatível; <code>TypeGuard</code> refina principalmente o verdadeiro e admite transformações mais flexíveis. <code>cast</code> não verifica nada em runtime.</p>' },
        { tipo: 'codigo', linguagem: 'python', texto:
          'class RawTransaction(TypedDict):\n    id: str\n    amount: str\n    source: Literal["csv", "webhook"]\n\ndef is_non_empty_text(value: object) -> TypeIs[str]:\n    return isinstance(value, str) and bool(value.strip())\n\ndef assert_never(value: Never) -> Never:\n    raise AssertionError(f"caso não tratado: {value!r}")' },
        { tipo: 'texto', html:
          '<h3>Variância e annotations diferidas</h3>' +
          '<p>Um produtor só de <code>T</code> pode ser covariante; um consumidor só de <code>T</code>, contravariante; uma coleção mutável que lê e escreve tende a ser <strong>invariante</strong>. Se <code>list[Dog]</code> servisse como <code>list[Animal]</code>, alguém inseriria um <code>Cat</code>. Modele a direção da informação e peça ao checker para rejeitar a substituição plantada.</p>' +
          '<p>O Python 3.14 muda a avaliação de annotations e oferece <code>annotationlib</code> para recuperá-las em formatos apropriados; código de framework não deve depender de avaliar nomes arbitrários por acidente. O lab compara <code>__annotations__</code> com <code>annotationlib.get_annotations()</code> e testa uma forward reference sem importar a dependência prematuramente.</p>' },
        { tipo: 'takeaway', html: 'Hints não validam nada em runtime: o <mark>checker</mark> cobre o código que você escreve, o <mark>Pydantic</mark> os dados de fora, os <mark>testes</mark> o comportamento.' }
      ] },

      { rotulo: 'Ver funcionando', blocos: [
        { tipo: 'texto', html:
          '<h3>Protocol: compatibilidade estrutural</h3>' +
          '<p>Uma relação <strong>nominal</strong> depende da identidade declarada do tipo; um <code>Protocol</code> permite compatibilidade <strong>estrutural</strong>: serve quem expõe os membros com assinaturas compatíveis, sem herança. O consumidor declara o menor contrato de que precisa e adapta bibliotecas de terceiros. Isso reduz acoplamento nominal, mas não dispensa provar a substituibilidade por testes e semântica.</p>' },
        { tipo: 'codigo', linguagem: 'python', texto:
          'class Notificador(Protocol):\n    """O CONSUMIDOR define o contrato que precisa. Ninguém \'implementa\' isto."""\n    def enviar(self, destino: str, mensagem: str) -> bool: ...\n\nclass EmailNotificador:          # NÃO herda de Notificador\n    def enviar(self, destino: str, mensagem: str) -> bool:\n        print(f"email para {destino}: {mensagem}")\n        return True\n\ndef alertar(n: Notificador, destino: str) -> None:\n    n.enviar(destino, "alerta!")\n\nalertar(EmailNotificador(), "a@exemplo.com")  # mypy: OK, a forma bate\nalertar("uma string", "x")                    # mypy: erro, str não tem .enviar' },
        { tipo: 'texto', html:
          '<p>O <code>...</code> no corpo é literal: o "sem implementação" do Python. Rode <code>uv run mypy --strict</code> nesse arquivo com a última linha e veja o erro <em>antes</em> de executar: o runtime nunca foi tocado.</p>' +
          '<p>Agora a fixture de defeitos (<code>fixtures/generated_defects/</code>): cinco bugs plantados. Preveja quais o <code>uv run mypy --strict src tests</code> encontra.</p>' },
        { tipo: 'rode', id: 'typ-rode', titulo: 'O que o mypy estrito encontra', obrigatorio: false,
          enunciado: 'As mensagens são <strong>exemplo</strong> (o texto exato varia com a versão do mypy). O que a fonte afirma: 1, 3 e 5 são achados imediatos; o 2 aparece conforme a versão; o 4 não aparece.',
          prefixo: '$', entrada: 'uv run mypy --strict src tests', unidade: 'bug', terminalTitulo: 'exemplo · mypy',
          etapas: [
            { id: 'b1', nome: 'Bug 1', descricao: 'return None em -> Decimal', tom: 'dns', ms: 1, linhas: [
              L('out', 'exemplo: Incompatible return value type (got "None", expected "Decimal")'),
              L('hint', 'política a decidir: Decimal | None obriga cada chamador a tratar ausência; uma exceção centraliza a regra')] },
            { id: 'b2', nome: 'Bug 2', descricao: 'soma = 0 (int)', tom: 'tcp', ms: 1, linhas: [
              L('out', 'aparece como incompatibilidade na soma/retorno, conforme a versão'),
              L('hint', 'o acumulador nasceu int e o retorno promete Decimal')] },
            { id: 'b3', nome: 'Bug 3', descricao: 'typo .uper()', tom: 'tls', ms: 1, linhas: [
              L('out', 'exemplo: "str" has no attribute "uper"')] },
            { id: 'b4', nome: 'Bug 4', descricao: 'média de lista vazia', tom: 'request', ms: 1, linhas: [
              L('info', 'nenhum diagnóstico'),
              L('hint', 'divisão por zero em lista vazia é falha de VALOR, não de tipo: só um teste cobre')] },
            { id: 'b5', nome: 'Bug 5', descricao: 'str + Decimal', tom: 'response', ms: 1, linhas: [
              L('out', 'exemplo: Unsupported operand types for + ("str" and "Decimal")'),
              L('hint', 'o sinal desejado depois da correção é "Success: no issues found", e esse silêncio não substitui o teste de valor')] }
          ],
          prever: { pergunta: 'Qual bug da fixture o mypy estrito NÃO detecta?', opcoes: [
            opc('a', 'Bug 1: return None numa função que promete Decimal.', false, 'o retorno viola a assinatura declarada: o checker vê.'),
            opc('b', 'Bug 3: método inexistente por typo.', false, 'atributo inexistente é achado imediato.'),
            opc('c', 'Bug 4: média de lista vazia (divisão por zero).', true, 'é falha de valor, não de tipo: o type checker elimina uma classe de erros e o teste cobre a lista vazia.'),
            opc('d', 'Bug 5: str + Decimal.', false, 'operando incompatível é achado imediato.')] },
          tutorDepois: 'Type checker pega erro de tipo, não de valor. A lista vazia é decisão de domínio e pede teste.',
          callout: 'Você separou o que o checker enxerga do que só o teste enxerga.' },
        { tipo: 'takeaway', html: 'Com <mark>Protocol</mark> importa a forma, não a árvore de herança; o <mark>mypy</mark> acusa antes de rodar, mas não vê erro de <mark>valor</mark>.' }
      ] },

      { rotulo: 'Praticar', blocos: [
        { tipo: 'complete', id: 'typ-complete', titulo: 'Escolha a ferramenta de tipo certa', linguagem: 'python', obrigatorio: false,
          enunciado: 'Em cada lacuna, escolha o recurso que cumpre o papel descrito no comentário.',
          partes: [
            'def e_texto(v: object) -> ', { lacuna: 'ti', opcoes: ['TypeIs[str]', 'cast[str]', 'Any'], correta: 'TypeIs[str]' },
            ':  # refina o ramo verdadeiro E o falso\n    return isinstance(v, str) and bool(v.strip())\n\ndef nao_tratado(v: ', { lacuna: 'nv', opcoes: ['Never', 'Any', 'None'], correta: 'Never' },
            ') -> Never:  # exaustividade verificável\n    raise AssertionError(v)\n\nclass Fonte(', { lacuna: 'pr', opcoes: ['Protocol', 'ABC', 'TypedDict'], correta: 'Protocol' },
            '):  # o CONSUMIDOR define o contrato; quem tem a forma, serve\n    def ler(self) -> str: ...\n\nsource: ', { lacuna: 'lit', opcoes: ['Literal["csv", "webhook"]', 'str', 'object'], correta: 'Literal["csv", "webhook"]' },
            '  # só estes valores\n'
          ],
          explicacao: '<code>TypeIs</code> refina os dois ramos; <code>cast</code> não verifica nada em runtime; <code>Any</code> desliga a prova estática. <code>Never</code> faz o checker acusar um caso que ninguém tratou. <code>Protocol</code> é o contrato do consumidor, e <code>Literal</code> restringe valores conhecidos.',
          callout: 'As quatro peças de tipo nos papéis certos.' },
        { tipo: 'python', id: 'typ-python', titulo: 'O que o tipo não pega, o teste pega', obrigatorio: false,
          enunciado: 'Corrija <code>total</code> (o acumulador deve ser <code>Decimal</code>, nunca <code>int</code>) e <code>media</code> (lista vazia é falha de valor: levante <code>ValueError("lista vazia")</code>). São os bugs 2 e 4 da fixture.',
          codigo: codigo, testes: testes,
          dica: 'Comece com <code>soma = Decimal("0")</code>. Em <code>media</code>, cheque <code>if not valores</code> antes de dividir por <code>len(valores)</code>.',
          solucao: solucao,
          tutorDepois: 'Levantar ValueError é uma política: a alternativa, Decimal | None, empurra o tratamento da ausência para cada chamador.',
          callout: 'O caso que o checker não vê agora tem teste.' },
        { tipo: 'takeaway', html: 'O retorno ausente tem duas políticas: <mark>Decimal | None</mark> (cada chamador trata) ou <mark>exceção</mark> (a regra fica centralizada).' }
      ] },

      { rotulo: 'Conferir', blocos: [
        { tipo: 'texto', html:
          '<h3>Limites que o checker não elimina</h3><ul>' +
          '<li><strong>Hints não validam runtime.</strong> O gate declara checker e versão; a trust boundary ainda precisa de parsing e validação.</li>' +
          '<li><strong><code>Any</code> reduz a prova estática.</strong> Delimite esses valores nas fronteiras e use anotação e validação proporcionais ao risco.</li>' +
          '<li><strong>Sem sobrecarga de método real.</strong> Um nome, uma função; <code>@overload</code> existe só para o verificador. O idioma é parâmetro com default ou union.</li>' +
          '<li><strong>Variáveis não têm tipo; valores têm.</strong> <code>x = 1</code> seguido de <code>x = "a"</code> é legal em runtime; o mypy reclama.</li>' +
          '<li><strong>Mutabilidade por convenção.</strong> Sem <code>readonly</code>: <code>Final</code>, <code>frozen=True</code> e o verificador. O prefixo <code>_</code> é "private por contrato social".</li></ul>' },
        { tipo: 'escolha', id: 'typ-esc-runtime', titulo: 'Confira: anotação em runtime',
          pergunta: 'Com <code>def dobra(x: int) -> int: return x * 2</code>, o que acontece ao rodar <code>dobra("ab")</code>?',
          opcoes: [
            { id: 'a', texto: 'TypeError imediato, porque o interpretador valida as anotações.', correta: false, porque: 'o interpretador não valida annotations.' },
            { id: 'b', texto: 'O Python converte "ab" para inteiro automaticamente.', correta: false, porque: 'não há conversão.' },
            { id: 'c', texto: 'O programa nem inicia: anotações são checadas no import.', correta: false, porque: 'não são checadas.' },
            { id: 'd', texto: 'Executa sem objeção e devolve "abab"; só o mypy (ou outro checker) apontaria o erro antes de rodar.', correta: true, porque: 'por isso o curso separa três defesas: checker, Pydantic para dado externo e testes para comportamento.' }
          ], tutorDepois: 'Anotações não são validação em runtime.' },
        { tipo: 'escolha', id: 'typ-esc-protocol', titulo: 'Confira: Protocol sem herança',
          pergunta: 'A classe <code>Mongo</code> tem os métodos que o <code>Protocol Repo</code> exige, mas não herda dele. O que é verdade?',
          opcoes: [
            { id: 'a', texto: 'Precisa herdar de Repo, senão o mypy rejeita.', correta: false, porque: 'importa a forma, não a herança.' },
            { id: 'b', texto: 'O checker a aceita como Repo (subtipagem estrutural); isinstance só funcionaria com @runtime_checkable e então confere apenas a presença dos nomes.', correta: true, porque: 'runtime_checkable verifica nomes, não tipos de argumentos nem retorno.' },
            { id: 'c', texto: 'isinstance(m, Repo) funciona sempre e valida as assinaturas.', correta: false, porque: 'sem runtime_checkable falha; com ele, só confere nomes.' },
            { id: 'd', texto: 'Protocol exige registrar a classe com Repo.register.', correta: false, porque: 'register é de ABC, não de Protocol.' }
          ], tutorDepois: 'Compatibilidade estrutural: a ressalva do runtime é a armadilha.' },
        { tipo: 'takeaway', html: '<mark>Any</mark> é contagioso: estanque nas fronteiras. <mark>runtime_checkable</mark> confere nomes, não assinaturas.' }
      ] }
    ],
    revisao: [
      { id: 'm02b3-runtime', pergunta: 'O que as annotations fazem em runtime por padrão?', opcoes: [
        opc('a', 'Nada de validação: servem a checkers, IDEs, schema e introspecção', true, 'a validação de dados externos é do Pydantic; o comportamento é dos testes.'),
        opc('b', 'Validam os tipos a cada chamada', false, 'o interpretador não impõe annotations.'),
        opc('c', 'Convertem os valores para o tipo anotado', false, 'não há conversão.')] },
      { id: 'm02b3-valor', pergunta: 'Qual bug o mypy estrito não pega?', opcoes: [
        opc('a', 'Divisão por zero numa média de lista vazia (falha de valor)', true, 'type checker pega erro de tipo, não de valor; teste cobre.'),
        opc('b', 'Typo de nome de método', false, 'atributo inexistente é achado.'),
        opc('c', 'return None em função que promete Decimal', false, 'viola a assinatura: o checker vê.')] },
      { id: 'm02b3-protocol', pergunta: 'O que é compatibilidade estrutural de um Protocol?', opcoes: [
        opc('a', 'Serve o tipo que expõe os membros com assinaturas compatíveis, sem herança', true, 'o consumidor define o contrato que precisa.'),
        opc('b', 'Exige herdar do Protocol', false, 'isso é nominal.'),
        opc('c', 'Só vale em runtime', false, 'é compatibilidade verificada pelo checker.')] },
      { id: 'm02b3-variancia', pergunta: 'Por que list[Dog] não pode servir como list[Animal]?', opcoes: [
        opc('a', 'Coleção mutável que lê e escreve é invariante: alguém inseriria um Cat', true, 'só produtor puro é covariante; consumidor puro, contravariante.'),
        opc('b', 'Porque Dog não herda de Animal', false, 'o problema é a escrita, não a herança.'),
        opc('c', 'Porque listas são hashable', false, 'listas não são hashable.')] },
      { id: 'm02b3-typeis', pergunta: 'Qual a diferença entre TypeIs e TypeGuard?', opcoes: [
        opc('a', 'TypeIs refina os ramos verdadeiro e falso; TypeGuard refina principalmente o verdadeiro e aceita transformações mais flexíveis', true, 'e cast não verifica nada em runtime.'),
        opc('b', 'São sinônimos', false, 'diferem no ramo falso.'),
        opc('c', 'TypeIs valida em runtime com Pydantic', false, 'ambos são só para o checker.')] }
    ]
  });
})();
