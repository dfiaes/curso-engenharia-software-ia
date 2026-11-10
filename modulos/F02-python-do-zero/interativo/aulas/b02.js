/* F02 · Bloco 2: valores, tipos e o modelo de objetos. Fonte: F02.html#b02. Saídas de execução real em 11/10/2026 (Python 3.14.7). */
(function () {
  var L = function (kind, text) { return { kind: kind, text: text }; };
  function opc(id, texto, correta, porque) { return { id: id, texto: texto, correta: correta, porque: porque }; }
  var J = function (a) { return a.join('\n') + '\n'; };

  TrilhaAula.registrar({
    id: 'f02-b2',
    titulo: 'Valores, tipos e o modelo de objetos',
    minutos: 40,
    resumo: 'Nomes são rótulos presos a objetos; atribuir não copia. Mutabilidade, int/float/Decimal e str versus bytes explicam a maior parte dos defeitos misteriosos de Python.',
    objetivo: 'Raciocinar com nomes, identidade, mutabilidade e passagem por atribuição; escolher entre int, float, Decimal, str e bytes com critério.',
    revisao: [
      { id: 'f02b2-atrib', pergunta: 'a = [1, 2]; b = a; b.append(3). O que vale a, e o que b = a copiou?',
        opcoes: [
          opc('a', 'a vale [1, 2, 3]; b = a não copiou nada, só criou outro nome para o mesmo objeto', true, 'variável em Python é rótulo preso a um objeto, não uma caixa com valor.'),
          opc('b', 'a vale [1, 2]; b = a copiou a lista', false, 'a atribuição nunca copia objeto.'),
          opc('c', 'a vale [1, 2, 3] porque b = a copiou a lista e a sincroniza', false, 'não existe sincronização: existe um só objeto com dois nomes.')] },
      { id: 'f02b2-float', pergunta: 'Por que 0.1 + 0.2 == 0.3 é False, e o que usar para dinheiro?',
        opcoes: [
          opc('a', 'O float é binário (IEEE 754) e 0.1 não tem representação finita em base 2; para quantias, Decimal construído de str (ou inteiro de centavos)', true, 'Decimal(0.1) herda o erro do float porque converte o valor já aproximado.'),
          opc('b', 'É um bug do Python 3 corrigido com round()', false, 'round() depende da representação binária e também arredonda metade para o par.'),
          opc('c', 'Porque o + de float perde precisão só em somas longas', false, 'o erro está na representação de 0.1, já em operações simples.')] },
      { id: 'f02b2-iadd', pergunta: 'Dado def f(l): l += [4] e xs = [1], o que vale xs depois de f(xs)?',
        opcoes: [
          opc('a', '[1, 4]: += em lista é in-place (__iadd__) e muta o objeto compartilhado', true, 'l = l + [4] criaria outra lista e só religaria o nome local.'),
          opc('b', '[1]: o parâmetro é uma cópia', false, 'o parâmetro é um novo nome para o mesmo objeto.'),
          opc('c', 'Erro: não se pode alterar um argumento', false, 'mutar o objeto recebido é permitido; é o chamador que enxerga o efeito.')] },
      { id: 'f02b2-latin', pergunta: 'Um arquivo UTF-8 com "ação" é lido com encoding="latin-1". O que acontece?',
        opcoes: [
          opc('a', 'Lê sem erro, mas vira "aÃ§Ã£o": corrupção silenciosa', true, 'todo byte é válido em Latin-1; já o contrário (Latin-1 lido como UTF-8) costuma falhar alto.'),
          opc('b', 'UnicodeDecodeError, porque Latin-1 detecta UTF-8', false, 'Latin-1 nunca falha na decodificação.'),
          opc('c', 'Lê perfeitamente: Latin-1 é superconjunto de UTF-8', false, 'não é: cada byte do UTF-8 vira um caractere isolado.')] },
      { id: 'f02b2-is', pergunta: 'Quando usar is e quando usar ==?',
        opcoes: [
          opc('a', 'is só para singletons (None, True, False, sentinelas); == para valores', true, 'is compara identidade; o reaproveitamento de inteiros pequenos é otimização de implementação, não contrato.'),
          opc('b', 'is para inteiros e strings, == para listas', false, 'depender da identidade de int ou str é frágil e o CPython até avisa com SyntaxWarning.'),
          opc('c', 'São equivalentes para tipos imutáveis', false, 'int("1000") is int("1000") dá False.')] }
    ],
    abas: [
      { rotulo: 'Nomes e objetos', blocos: [
        { tipo: 'texto', html:
          '<h3>Uma lista alterada à distância, um centavo que some</h3>' +
          '<p>A maior parte dos defeitos "misteriosos" de Python vem de um modelo mental herdado de C ou Java: pensar que <code>b = a</code> copia o valor, que uma função recebe "uma cópia" ou "uma referência" do argumento, que <code>float</code> serve para dinheiro, que texto é uma sequência de bytes. Essas crenças funcionam em exemplos pequenos e quebram em produção: uma lista alterada à distância, um centavo que some de um total, um acento que vira <code>Ã§</code>.</p>' +
          '<h3>Nomes são rótulos presos a objetos</h3>' +
          '<p>Em Python, todo valor é um <strong>objeto</strong> no heap, com três atributos: <em>identidade</em> (nunca muda; no CPython é o endereço; <code>id(x)</code>), <em>tipo</em> (<code>type(x)</code>) e <em>valor</em>. Uma <strong>variável</strong> não contém o objeto: é um <em>nome</em> num espaço de nomes (um dicionário, na prática) que <em>aponta</em> para ele. Atribuir é <strong>ligar um nome a um objeto</strong>, sem copiar nada.</p>' },
        { tipo: 'texto', html:
          '<p><code>is</code> compara <strong>identidade</strong> (mesmo objeto); <code>==</code> compara <strong>valor</strong> (chama <code>__eq__</code>). Regra: use <code>is</code> só para singletons (<code>None</code>, <code>True</code>, <code>False</code>, sentinelas suas) e <code>==</code> para o resto. O CPython até avisa quando você erra: <code>x is 1</code> gera <code>SyntaxWarning: "is" with \'int\' literal. Did you mean "=="?</code>.</p>' +
          '<p>Esse <code>True</code> é enganoso: inteiros pequenos e constantes iguais no mesmo trecho compilado são reaproveitados por <em>otimização de implementação</em>, não por contrato da linguagem. Dois inteiros iguais vindos de fontes diferentes (<code>int("1000") is int("1000")</code>) dão <code>False</code>. Nunca escreva código cuja correção depende disso.</p>' },
        { tipo: 'callout', tom: 'info', titulo: 'Contagem de referências', html:
          '<p>O ciclo de vida é por <strong>contagem de referências</strong>: cada nome, elemento de contêiner ou frame que aponta para o objeto soma 1; quando chega a zero, o CPython libera a memória na hora. Um coletor de ciclos cuida dos objetos que apontam entre si. Consequência: <code>__del__</code> e a liberação de arquivos "no fim do escopo" funcionam no CPython, mas não são garantia da linguagem (PyPy difere). Recurso se fecha com <code>with</code> (bloco 6).</p>' },
        { tipo: 'takeaway', html: 'Variável é um <mark>rótulo</mark>; atribuir <mark>liga</mark> um nome a um objeto e não copia. <code>is</code> é identidade, <code>==</code> é valor.' }
      ] },

      { rotulo: 'Mutabilidade', blocos: [
        { tipo: 'texto', html:
          '<p>Um script curto mostra a regra que explica tudo: ligar dois nomes ao mesmo objeto, mutar por um deles, e uma função que muta e depois religa. Antes de rodar, preveja o resultado.</p>' },
        { tipo: 'rode', id: 'f02b2-rode', titulo: 'Mutar é visível, religar não é', enunciado: 'Rode o script e compare o que o chamador enxerga depois de <code>f(q)</code>.',
          prefixo: '$', entrada: 'python nomes.py', unidade: 'linha', terminalTitulo: 'terminal',
          etapas: [
            { id: 'fonte', nome: 'O script', descricao: 'nomes.py', tom: 'dns', ms: 1, linhas: [
              L('cmd', 'cat nomes.py'),
              L('out', 'a = [1, 2]; b = a; b.append(3)'),
              L('out', 'print(a, a is b)'),
              L('out', 'def f(lst):'),
              L('out', '    lst.append(1)   # muta o objeto compartilhado'),
              L('out', '    lst = [9]       # religa só o nome local'),
              L('out', '    return lst'),
              L('out', 'q = []'),
              L('out', 'print(f(q), q)')] },
            { id: 'alias', nome: 'b = a', descricao: 'Segundo nome, mesmo objeto', tom: 'tcp', ms: 2, linhas: [
              L('in', '[1, 2, 3] True'),
              L('hint', 'a atribuição não copiou: b.append(3) aparece em a')] },
            { id: 'chamada', nome: 'f(q)', descricao: 'Chamada por atribuição', tom: 'tls', ms: 3, linhas: [
              L('in', '[9] [1]'),
              L('hint', 'o parâmetro lst é um novo nome para o MESMO objeto de q')] },
            { id: 'regra', nome: 'A regra', descricao: 'Mutar versus religar', tom: 'ink', ms: 4, linhas: [
              L('info', 'append mutou o objeto: q = [1], visível de fora'),
              L('info', 'lst = [9] religou só o nome local: q não mudou'),
              L('hint', '"por valor" e "por referência" estão ambos errados: é chamada por atribuição')] }
          ],
          prever: { pergunta: 'Depois de f(q), com q = [], o que o script imprime para f(q) e para q?', opcoes: [
            { id: 'a', texto: '[9] e []: a função trabalha numa cópia.', correta: false, porque: 'o parâmetro é o mesmo objeto de q; o append é visível ao chamador.' },
            { id: 'b', texto: '[9] e [1]: o append muta o objeto compartilhado, e a religação só vale dentro da função.', correta: true, porque: 'mutar o objeto é visível de fora; religar o nome local não.' },
            { id: 'c', texto: '[1, 9] e [1, 9]: a lista é estendida e depois substituída no chamador.', correta: false, porque: 'atribuir a lst nunca altera o nome q do chamador.' }
          ] },
          tutorAntes: 'Digite o comando já preenchido, aperte Enter e depois clique em "A regra".',
          tutorDepois: 'Python passa a referência por valor, ou, mais limpo, faz chamada por atribuição. Mutar o objeto é visível de fora; religar o nome não é.',
          callout: 'Você viu a diferença entre mutar o objeto e religar o nome.' },
        { tipo: 'texto', largo: true, html:
          '<h3>Imutáveis e mutáveis</h3>' +
          '<table><thead><tr><th>Imutáveis (valor não muda após criado)</th><th>Mutáveis (mudam no lugar)</th></tr></thead><tbody>' +
          '<tr><td><code>int</code>, <code>float</code>, <code>bool</code>, <code>complex</code>, <code>Decimal</code>, <code>str</code>, <code>bytes</code>, <code>tuple</code>, <code>frozenset</code>, <code>None</code></td><td><code>list</code>, <code>dict</code>, <code>set</code>, <code>bytearray</code>, instâncias de classes comuns</td></tr></tbody></table>' +
          '<p>Imutável não significa "profundamente imutável": a tupla guarda <em>referências</em> imutáveis, e o objeto apontado pode ser mutável.</p>' },
        { tipo: 'codigo', linguagem: 'python', texto:
          '>>> t = (1, [2, 3])\n>>> t[1] += [4]\nTypeError: \'tuple\' object does not support item assignment\n>>> t\n(1, [2, 3, 4])' },
        { tipo: 'texto', html:
          '<p>O <code>+=</code> executa em duas etapas: primeiro <code>t[1].__iadd__([4])</code>, que muta a lista com sucesso; depois tenta atribuir o resultado em <code>t[1]</code>, o que a tupla proíbe. O erro e o efeito acontecem juntos. Isso também define <strong>hashabilidade</strong>: só objetos cujo valor não muda podem ser chave de <code>dict</code> ou elemento de <code>set</code> (<code>hash([1])</code> levanta <code>TypeError: unhashable type: \'list\'</code>), e uma tupla com lista dentro herda a proibição.</p>' },
        { tipo: 'escolha', id: 'f02b2-esc-iadd', titulo: 'Confira: += numa função',
          pergunta: 'Dado def f(l): l += [4] e xs = [1], o que vale xs depois de f(xs)?',
          opcoes: [
            { id: 'a', texto: '[1]: o parâmetro é uma cópia', correta: false, porque: 'o parâmetro é só outro nome para o mesmo objeto.' },
            { id: 'b', texto: '[1]: += religa o nome local', correta: false, porque: 'em lista, += chama __iadd__ e estende no lugar.' },
            { id: 'c', texto: '[1, 4]: += em lista muta o objeto no lugar', correta: true, porque: 'l = l + [4] criaria outra lista; o mesmo += numa tupla ou int religa, porque eles são imutáveis.' },
            { id: 'd', texto: 'Erro: não se pode alterar um argumento', correta: false, porque: 'nada impede mutar o objeto recebido.' }
          ], tutorDepois: 'Mutar o objeto é visível; religar o nome não é.' },
        { tipo: 'takeaway', html: 'Argumento é passado <mark>por atribuição</mark>: <mark>mutar</mark> o objeto se vê de fora, <mark>religar</mark> o nome não. Imutável não é profundamente imutável.' }
      ] },

      { rotulo: 'Números e texto', blocos: [
        { tipo: 'texto', html:
          '<h3>Números: três famílias, três contratos</h3>' +
          '<p><strong><code>int</code> tem precisão arbitrária.</strong> Não existe overflow: <code>2**100</code> é exato (<code>1267650600228229401496703205376</code>) e ocupa só os bytes de que precisa. O custo é aritmética proporcional ao tamanho, e um limite de segurança: converter inteiros de mais de 4300 dígitos para <code>str</code> levanta <code>ValueError</code> (<code>sys.get_int_max_str_digits()</code>), defesa contra negação de serviço por entrada hostil. A divisão inteira e o módulo seguem o <em>piso</em>: <code>7 // -2</code> é <code>-4</code> e <code>7 % -2</code> é <code>-1</code>, de modo que <code>(a // b) * b + a % b == a</code> sempre. <code>bool</code> é subclasse de <code>int</code> (<code>True + True == 2</code>).</p>' +
          '<p><strong><code>float</code> é o IEEE 754 binário de 64 bits</strong>: 53 bits de mantissa, cerca de 15 a 17 dígitos decimais significativos. A maioria dos decimais finitos não é representável em base 2, então o <code>float</code> guarda o racional binário mais próximo.</p>' },
        { tipo: 'codigo', linguagem: 'python', texto:
          '>>> 0.1 + 0.2, 0.1 + 0.2 == 0.3\n(0.30000000000000004, False)\n>>> (0.1).as_integer_ratio()\n(3602879701896397, 36028797018963968)\n>>> from decimal import Decimal\n>>> Decimal(0.1)\nDecimal(\'0.1000000000000000055511151231257827021181583404541015625\')' },
        { tipo: 'texto', html:
          '<p>O <code>0.1</code> real armazenado é 3602879701896397 / 2<sup>55</sup>. Comparação com tolerância usa <code>math.isclose</code>, nunca <code>==</code>. Acima de 2<sup>53</sup>, inteiros consecutivos deixam de ser representáveis (<code>float(2**53) + 1 == float(2**53)</code>). Há ainda <code>nan</code> (que não é igual a si mesmo) e <code>inf</code>.</p>' +
          '<p><strong><code>Decimal</code> é aritmética decimal</strong> com precisão e arredondamento configuráveis (padrão: 28 dígitos, <code>ROUND_HALF_EVEN</code>). Regras que importam: construa de <strong><code>str</code></strong> ou <code>int</code> (<code>Decimal("0.1")</code>; de <code>float</code> herda o erro acima); misturar com <code>float</code> é proibido de propósito (<code>Decimal("1") + 1.5</code> levanta <code>TypeError</code>); arredonde com <code>quantize</code>, escolhendo o modo da regra de negócio.</p>' },
        { tipo: 'codigo', linguagem: 'python', texto:
          '>>> from decimal import Decimal, ROUND_HALF_UP\n>>> d = Decimal("2.665")\n>>> d.quantize(Decimal("0.01")), d.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)\n(Decimal(\'2.66\'), Decimal(\'2.67\'))\n>>> round(2.5), round(3.5), round(2.665, 2)\n(2, 4, 2.67)' },
        { tipo: 'texto', html:
          '<p>O <code>round()</code> embutido também arredonda metade para o par (2.5 vira 2). Em <code>float</code>, <code>round(2.665, 2)</code> dá 2.67 porque o valor binário real é um pouco maior que 2.665: o resultado depende da representação, não da regra. Dinheiro pede <code>Decimal</code> (como no laboratório) ou inteiro de centavos; a regra de arredondamento (fiscal, contratual) é decisão de negócio, não de biblioteca. Estatística e ML usam <code>float</code> de propósito: velocidade e erro relativo pequeno importam mais que exatidão decimal.</p>' },
        { tipo: 'abas', rotulo: 'Qual tipo para quê', itens: [
          { rotulo: 'int', blocos: [{ tipo: 'texto', html: '<p>Exato e de tamanho ilimitado: <code>2**200</code> é calculado sem estouro. Divisão <code>/</code> devolve <code>float</code>; use <code>//</code> para a divisão inteira.</p>' }] },
          { rotulo: 'float', blocos: [{ tipo: 'texto', html: '<p>Binário aproximado (IEEE 754): <code>0.1 + 0.2 == 0.3</code> é <code>False</code>. Compare com <code>math.isclose</code> e nunca use float para dinheiro.</p>' }] },
          { rotulo: 'Decimal', blocos: [{ tipo: 'texto', html: '<p>Decimal exato <em>quando construído de <code>str</code></em>: <code>Decimal("0.10")</code>. <code>Decimal(0.1)</code> herda o erro binário do float. Escolha o contexto (precisão e arredondamento) explicitamente.</p>' }] }
        ] },
        { tipo: 'python', id: 'f02b2-python', titulo: 'Some dinheiro sem perder o centavo', obrigatorio: false,
          enunciado: 'Complete <code>total_monetario(valores)</code>: <code>valores</code> é uma lista de <code>str</code> como <code>"0.10"</code>. Construa cada <code>Decimal</code> a partir da <code>str</code>, some, e devolva o total arredondado para dois decimais com <code>ROUND_HALF_UP</code>. Um <code>float</code> na lista deve levantar <code>TypeError</code> (ele já chega aproximado). Lista vazia dá <code>Decimal("0.00")</code>.',
          codigo: J([
            'from decimal import Decimal, ROUND_HALF_UP',
            '',
            '',
            'def total_monetario(valores):',
            '    total = Decimal(0)',
            '    for v in valores:',
            '        # 1. recuse float com TypeError',
            '        # 2. some Decimal(v), construido de str',
            '        pass',
            '    # 3. arredonde para 0.01 com ROUND_HALF_UP',
            '    return total',
            '',
            '',
            'print(total_monetario(["0.10"] * 10))'
          ]),
          testes: J([
            'def test_dez_vezes_zero_dez_da_um_exato():',
            '    assert total_monetario(["0.10"] * 10) == Decimal("1.00")',
            '',
            '',
            'def test_arredonda_metade_para_cima():',
            '    assert total_monetario(["2.665"]) == Decimal("2.67")',
            '',
            '',
            'def test_lista_vazia():',
            '    r = total_monetario([])',
            '    assert r == Decimal("0.00") and str(r) == "0.00"',
            '',
            '',
            'def test_float_e_recusado():',
            '    try:',
            '        total_monetario(["1.00", 0.1])',
            '    except TypeError:',
            '        return',
            '    raise AssertionError("esperava TypeError")',
            '',
            '',
            'def test_controle_negativo_float_acumulado_erra():',
            '    t = 0.0',
            '    for _ in range(10):',
            '        t += 0.1',
            '    assert t != 1.0'
          ]),
          dica: 'Dentro do laço: <code>if isinstance(v, float): raise TypeError(v)</code> e <code>total += Decimal(v)</code>. No fim: <code>total.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)</code>.',
          solucao: J([
            'from decimal import Decimal, ROUND_HALF_UP',
            '',
            '',
            'def total_monetario(valores):',
            '    total = Decimal(0)',
            '    for v in valores:',
            '        if isinstance(v, float):',
            '            raise TypeError(v)',
            '        total += Decimal(v)',
            '    return total.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)'
          ]),
          tutorDepois: 'O controle negativo mostra que o laço manual com float de fato erra (0.9999999999999999). Desde o Python 3.12, o sum() de float usa soma compensada e devolve 1.0: o defeito foi mascarado ali e continua em qualquer acumulador escrito à mão.',
          callout: 'Dinheiro entra como texto decimal, vira Decimal e é arredondado pela regra escolhida.' },
        { tipo: 'texto', html:
          '<h3><code>str</code> versus <code>bytes</code>: texto não é byte</h3>' +
          '<p><code>str</code> é uma sequência imutável de <strong>pontos de código Unicode</strong>. <code>bytes</code> é uma sequência imutável de inteiros de 0 a 255. A ponte é a <strong>codificação</strong>: <code>str.encode(enc)</code> produz bytes; <code>bytes.decode(enc)</code> volta. Sem saber a codificação, bytes não são texto.</p>' },
        { tipo: 'codigo', linguagem: 'python', texto:
          '>>> s = "café"\n>>> len(s), len(s.encode("utf-8")), s.encode("utf-8"), s.encode("latin-1")\n(4, 5, b\'caf\\xc3\\xa9\', b\'caf\\xe9\')\n>>> b"\\xe9".decode("utf-8")\nUnicodeDecodeError: \'utf-8\' codec can\'t decode byte 0xe9 in position 0: unexpected end of data\n>>> b"\\xe9".decode("utf-8", errors="replace")\n\'\ufffd\'' },
        { tipo: 'texto', html:
          '<p>O mesmo "é" ocupa 1 byte em Latin-1 e 2 em UTF-8; o byte <code>0xE9</code> não é UTF-8 válido, e a falha explícita é <em>melhor</em> que o <code>errors="replace"</code>, que troca o dado por <code>\ufffd</code> e esconde o erro. Dois fatos de Unicode à mão:</p>' +
          '<ul><li><strong>Normalização.</strong> "é" pode ser um ponto de código (NFC) ou "e" mais acento combinante (NFD). Visualmente idênticos, <code>==</code> diz <code>False</code> e o comprimento difere (4 contra 5). Chaves, buscas e deduplicação pedem <code>unicodedata.normalize("NFC", s)</code> antes de comparar. O laboratório faz isso em <code>normalize_category</code>.</li>' +
          '<li><strong>Caixa.</strong> Para comparar sem diferenciar maiúsculas use <code>casefold()</code>, não <code>lower()</code>: <code>"ß".casefold() == "ss"</code>, enquanto <code>"ß".lower()</code> continua <code>"ß"</code>.</li></ul>' +
          '<p>E um aviso de modelo: <code>len()</code> conta pontos de código, não "caracteres que o usuário vê". Uma bandeira como 🇧🇷 tem 2 pontos de código; a família 👨‍👩‍👧 tem 5. Cortar uma <code>str</code> no meio desses clusters produz lixo visual; segmentar por grafema exige biblioteca externa.</p>' },
        { tipo: 'takeaway', html: '<code>int</code> é exato, <code>float</code> é <mark>binário aproximado</mark>, <code>Decimal</code> é exato <mark>quando construído de str</mark>; <code>str</code> é texto, <code>bytes</code> são bytes, e a <mark>codificação</mark> é o contrato entre eles.' }
      ] },

      { rotulo: 'Aplicar e conferir', blocos: [
        { tipo: 'texto', html:
          '<h3>Exemplo trabalhado: por que o laboratório rejeita <code>٣٤</code></h3>' +
          '<p>No <code>expenses/parsing.py</code>, o valor é validado com <code>[0-9]+(?:[.,][0-9]{1,2})?</code>, e um comentário explica por que não <code>\\d</code>. Em padrões de <code>str</code>, <code>\\d</code> casa qualquer dígito Unicode, inclusive o árabe-índico, e <code>int("٣")</code> até converte sem erro (<code>"٣".isdigit()</code> é <code>True</code>). Um campo "valor" com dígitos de outro sistema numérico passaria pela validação e viraria número. Com a classe explícita <code>[0-9]</code>, o dado é recusado na borda com mensagem precisa, o comportamento certo para entrada não confiável.</p>' },
        { tipo: 'codigo', linguagem: 'python', texto:
          '>>> parse_amount(1, "12,5"), parse_amount(1, " 7 ")\n(Decimal(\'12.50\'), Decimal(\'7.00\'))\n>>> parse_amount(3, "٣٤")\nInvalidRowError: linha 3, campo \'amount\': valor inválido: \'٣٤\'\n>>> sum([0.1] * 10), sum([parse_amount(1, "0.10")] * 10)\n(1.0, Decimal(\'1.00\'))' },
        { tipo: 'transcript', id: 'f02b2-transcript', titulo: 'Desconfie do relato do agente', obrigatorio: false,
          enunciado: 'Um agente revisou o módulo de pagamentos e relatou o que fez. Marque as linhas em que o relato esconde um defeito do modelo de tipos ou de objetos.',
          linhas: [
            { quem: 'voce', texto: 'Revise o módulo de pagamentos: totais, comparação de categoria e serialização do relatório.' },
            { quem: 'agente', texto: 'Troquei float por Decimal. Construo os valores com Decimal(0.1) para manter o décimo exato.' },
            { quem: 'ferramenta', texto: 'pytest: 14 passed' },
            { quem: 'agente', texto: 'Para comparar a categoria usei: if categoria is "café". Passou nos testes.' },
            { quem: 'agente', texto: 'O relatório JSON serializa o total como string decimal ("12.50") e o parse do CSV valida com [0-9] em vez de \\d.' },
            { quem: 'agente', texto: 'Antes de comparar chaves, normalizo a categoria com unicodedata.normalize("NFC", ...).' }
          ],
          erradas: [1, 3],
          explicacao: {
            1: 'Decimal(0.1) converte o float já aproximado e herda o erro binário; o certo é Decimal("0.1").',
            3: 'is compara identidade; strings iguais podem ser objetos distintos. Passar nos testes pode ser reaproveitamento de implementação. Use == para valores.'
          },
          callout: 'As linhas 4 e 5 mostram o desenho certo: texto decimal na fronteira e comparação depois de normalizar.' },
        { tipo: 'texto', html:
          '<h3>Decisões e erros comuns</h3>' +
          '<ul><li><strong>Dinheiro:</strong> <code>Decimal</code> de <code>str</code> (ou centavos inteiros), com <code>quantize</code> e modo de arredondamento explícitos. <strong>Medida física, estatística, ML:</strong> <code>float</code>, comparando com tolerância.</li>' +
          '<li><strong>Igualdade:</strong> <code>==</code> para valores; <code>is</code> para <code>None</code> e sentinelas.</li>' +
          '<li><strong>Texto:</strong> decodifique na entrada, trabalhe em <code>str</code>, codifique na saída, sempre com <code>encoding=</code> explícito. Normalize antes de comparar chaves.</li>' +
          '<li><strong>Booleanos de contêiner:</strong> <code>if not itens:</code> é idiomático para "vazio"; mas <code>if valor:</code> trata <code>0</code>, <code>""</code>, <code>0.0</code> e <code>[]</code> como falsos, o que é bug quando <code>0</code> é valor legítimo. Para ausência use <code>is None</code>.</li></ul>' },
        { tipo: 'callout', tom: 'danger', titulo: 'Armadilha que pega sênior: Decimal(0.1) e json reintroduzem o erro do float', html:
          '<p>Dois caminhos trazem o <code>float</code> de volta sem aviso: construir <code>Decimal</code> a partir de um <code>float</code> (já arredondado em binário) e passar dinheiro por JSON, onde o número é um literal que a maioria dos leitores converte para <code>float</code>. Por isso o <code>report_payload</code> do laboratório serializa os <code>Decimal</code> como <strong>strings</strong>. A regra vale na fronteira: o dado monetário atravessa APIs, CSV e filas como texto decimal (ou centavos inteiros) e só vira <code>Decimal</code> dentro do domínio.</p>' },
        { tipo: 'escolha', id: 'f02b2-esc-decimal', titulo: 'Confira: Decimal e float',
          pergunta: 'O que Decimal(0.1) == Decimal("0.1") devolve?',
          opcoes: [
            { id: 'a', texto: 'True: os dois representam um décimo', correta: false, porque: 'o literal 0.1 já é um float aproximado (0.1000000000000000055...).' },
            { id: 'b', texto: 'True, mas só depois de quantize', correta: false, porque: 'quantize não desfaz o erro de construção a partir do float.' },
            { id: 'c', texto: 'Erro de tipo', correta: false, porque: 'Decimal aceita float no construtor; é misturar na aritmética que levanta TypeError.' },
            { id: 'd', texto: 'False: Decimal(0.1) converte o float aproximado, com dezenas de dígitos', correta: true, porque: 'só Decimal("0.1") guarda um décimo. Construa de str ou de inteiros.' }
          ], tutorDepois: 'Regra: exatidão decimal começa pela construção a partir de str.' },
        { tipo: 'texto', html: '<p class="ta-nota">Saídas de execução real em 11/10/2026 com Python 3.14.7 (Linux). Tamanhos em bytes e textos de mensagens de erro mudam entre versões menores.</p>' },
        { tipo: 'takeaway', html: 'Na <mark>fronteira</mark>, dinheiro é <mark>texto decimal</mark>; dentro do domínio é <code>Decimal</code> construído de <code>str</code>; texto é normalizado antes de virar chave.' }
      ] }
    ]
  });
})();
