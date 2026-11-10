/* S01 · Bloco 1: Código legível. Fonte: S01.html#b01. Saídas do medidor são execuções reais do laboratório (11/10/2026). */
(function () {
  var L = function (kind, text) { return { kind: kind, text: text }; };
  function opc(id, texto, correta, porque) { return { id: id, texto: texto, correta: correta, porque: porque }; }
  var CMD = 'uv run python -m design_lab.cli complexidade src/design_lab/exemplos/b01_legivel.py';
  var CAB = 'arquivo:funcao                                       linhas ciclo aninh';
  var P = 'src/design_lab/exemplos/b01_legivel.py:';

  TrilhaAula.registrar({
    id: 's01-b1',
    titulo: 'Código legível: nomes, complexidade e guard clauses',
    minutos: 40,
    resumo: 'Legibilidade é o custo de reconstruir o modelo mental de um trecho de código. Nomes com domínio e unidade, um nível de abstração por função, guard clauses e a diferença entre ciclomática e aninhamento.',
    objetivo: 'Medir e reduzir a complexidade de uma função com guard clauses e funções de um só nível de abstração, sem confundir curto com legível.',
    revisao: [
      { id: 's01b1-medidas', pergunta: 'Duas funções têm ciclomática 5, mas uma tem aninhamento 3 e a outra, 1. O que a diferença revela?',
        opcoes: [
          opc('a', 'A ciclomática conta caminhos (casos de teste mínimos); o aninhamento mostra o esforço de leitura que ela não vê.', true, 'cinco decisões em sequência plana e cinco encaixadas têm o mesmo número ciclomático.'),
          opc('b', 'As duas têm o mesmo esforço de leitura, porque o número é igual.', false, 'a ciclomática ignora aninhamento, nomes e mistura de níveis de abstração.'),
          opc('c', 'A de aninhamento 1 tem menos casos de teste.', false, 'os caminhos independentes são os mesmos nas duas.')] },
      { id: 's01b1-guard', pergunta: 'O que uma guard clause muda no código?',
        opcoes: [
          opc('a', 'Põe a recusa ao lado da sua condição e deixa o caminho feliz sem indentação.', true, 'o leitor não precisa carregar na cabeça o contexto de todas as condições abertas.'),
          opc('b', 'Reduz a ciclomática de 5 para 2.', false, 'a ciclomática é a mesma; mudam o aninhamento e a leitura.'),
          opc('c', 'Elimina a necessidade de testar as recusas.', false, 'cada caminho continua exigindo um caso de teste.')] },
      { id: 's01b1-nivel', pergunta: 'Qual é o critério operacional mais útil para uma função ser "pequena"?',
        opcoes: [
          opc('a', 'Um nível de abstração por função, não um número de linhas.', true, 'misturar "o que o importador faz" com "como se lê uma linha" é o que torna a função difícil de reusar e testar.'),
          opc('b', 'No máximo 10 linhas.', false, 'o limite de linhas vira meta e produz funções _passo2 sem sentido.'),
          opc('c', 'Ciclomática menor que 5.', false, 'limites numéricos servem como alarme, não como meta.')] },
      { id: 's01b1-extrair', pergunta: 'Quando extrair uma função melhora a leitura?',
        opcoes: [
          opc('a', 'Quando a parte tem nome de domínio e entradas e saídas claras.', true, 'se o chamador não lê melhor do que lia o bloco inline, desfaça.'),
          opc('b', 'Sempre que a métrica passar do limite.', false, 'dividir em _passo1.._passo9 baixa o número e aumenta o custo de leitura.'),
          opc('c', 'Quando o comentário de bloco ficou muito longo.', false, 'o comentário de bloco é o nome da função que falta, mas o critério é o nome de domínio, não o tamanho do comentário.')] },
      { id: 's01b1-comentario', pergunta: 'Qual comentário vale a pena manter?',
        opcoes: [
          opc('a', 'Um que registra o porquê: restrição externa, decisão ou armadilha que o código não diz.', true, 'o código diz o que e como; só o humano sabe por quê.'),
          opc('b', 'Um que repete em prosa o que a linha faz.', false, 'apodrece na primeira edição e vira mentira.'),
          opc('c', 'Um que descreve o nome da função.', false, 'melhore o nome em vez de comentar.')] }
    ],
    abas: [
      { rotulo: 'Entender', blocos: [
        { tipo: 'texto', html:
          '<p>Código é lido muito mais vezes do que escrito, e cada leitura reconstrói um modelo mental: o que entra, o que sai, o que pode dar errado, o que mais isso toca. <strong>Legibilidade</strong> é a medida do custo dessa reconstrução. Ela decide quanto tempo uma revisão leva, se um incidente às 3h da manhã termina em 20 minutos ou em duas horas e se um agente de código consegue alterar o trecho sem quebrar uma regra que só estava implícita. Um agente lê melhor o que é explícito: nomes que dizem o domínio, funções com uma responsabilidade, erros no tipo de retorno em vez de em comentários.</p>' +
          '<p>Este bloco trata do nível mais baixo do design: nomes, tamanho e forma de função, e como medir. As regras são poucas; o que importa é o mecanismo de cada uma e a medida que a verifica.</p>' +
          '<h3>Nomes são a documentação que não apodrece</h3>' +
          '<p>Um nome é uma promessa sobre o que a coisa é ou faz. Três defeitos custam mais que os outros:</p>' +
          '<ul><li><strong>Nome genérico</strong> (<code>data</code>, <code>info</code>, <code>process</code>, <code>handle</code>): obriga a ler o corpo.</li>' +
          '<li><strong>Nome que mente</strong>: <code>get_user</code> que também cria o usuário, <code>is_valid</code> que lança exceção.</li>' +
          '<li><strong>Unidade escondida</strong>: <code>timeout = 30</code> são segundos ou milissegundos? Para dinheiro e tempo, a unidade entra no nome ou no tipo: <code>preco_centavos</code>, <code>prazo_s</code>, ou o alias <code>type Centavos = int</code> usado no lab, que ao menos documenta e é checado pelo mypy em assinaturas.</li></ul>' +
          '<p>Regras verificáveis em revisão: função que devolve valor leva substantivo ou pergunta (<code>subtotal</code>, <code>esta_vencido</code>); função que age leva verbo (<code>fechar</code>, <code>salvar</code>); booleano se lê como afirmação (<code>pago</code>, <code>tem_pereciveis</code>); escopo curto aceita nome curto (<code>i</code> em três linhas) e escopo longo exige nome longo. Se você não consegue nomear uma função sem usar "e" ("valida e salva"), ela provavelmente faz duas coisas.</p>' },
        { tipo: 'texto', html:
          '<h3>Uma função, um nível de abstração</h3>' +
          '<p>O critério operacional para "função pequena" não são linhas: é <strong>um nível de abstração por função</strong>. A função abaixo percorre linhas, faz <code>split</code>, normaliza vírgula decimal, valida dígitos e imprime avisos. Mistura "o que o importador faz" com "como se lê uma linha" (versão do lab em <code>exemplos/b01_legivel.py</code>).</p>' },
        { tipo: 'abas', rotulo: 'Versão', itens: [
          { rotulo: 'Misturada', blocos: [
            { tipo: 'codigo', linguagem: 'python', texto: [
              'def importar_misturado(linhas: list[str]) -> int:',
              '    total = 0',
              '    for linha in linhas:',
              '        partes = linha.split(";")',
              '        if len(partes) != 2:',
              '            print(f"linha ignorada: {linha!r}")',
              '            continue',
              '        nome, valor = partes[0].strip(), partes[1].strip().replace(",", ".")',
              '        if not nome or not valor.replace(".", "", 1).isdigit():',
              '            print(f"linha ignorada: {linha!r}")',
              '            continue',
              '        total += round(float(valor) * 100)',
              '    return total'].join('\n') },
            { tipo: 'texto', html: '<p>Os problemas são concretos, não estéticos: o <code>print</code> impede reusar a função em outro contexto (o chamador não decide o que fazer com as linhas rejeitadas); a regra de "linha válida" aparece duplicada; e testar o parsing exige passar pelo laço.</p>' }
          ] },
          { rotulo: 'Separada', blocos: [
            { tipo: 'codigo', linguagem: 'python', texto: [
              'def _ler_linha(linha: str) -> int | None:',
              '    """Return the amount in centavos, or None when the line is malformed."""',
              '    partes = [p.strip() for p in linha.split(";")]',
              '    if len(partes) != 2 or not partes[0]:',
              '        return None',
              '    valor = partes[1].replace(",", ".")',
              '    if not valor.replace(".", "", 1).isdigit():',
              '        return None',
              '    return round(float(valor) * 100)',
              '',
              '',
              'def importar(linhas: list[str]) -> tuple[int, list[str]]:',
              '    """Return (total in centavos, rejected lines). No printing: the caller decides."""',
              '    total = 0',
              '    rejeitadas = []',
              '    for linha in linhas:',
              '        valor = _ler_linha(linha)',
              '        if valor is None:',
              '            rejeitadas.append(linha)',
              '        else:',
              '            total += valor',
              '    return total, rejeitadas'].join('\n') },
            { tipo: 'texto', html: '<p>Duas mudanças maiores que "quebrar em funções". Primeiro, o <strong>efeito saiu</strong>: a função devolve a lista de rejeitadas e o chamador decide (log, relatório, abortar). Segundo, a <strong>falha de parsing virou valor</strong> (<code>None</code>) em vez de exceção ou mensagem: a decisão fica no nível que tem contexto. Quando <code>None</code> carregar significado ambíguo, o próximo passo é um tipo de resultado explícito; para dados de fronteira, o M02 mostra Pydantic.</p>' }
          ] }
        ] },
        { tipo: 'takeaway', html: 'Nomes dizem o <mark>domínio e a unidade</mark>; a função tem <mark>um nível de abstração</mark> e devolve valor em vez de imprimir.' }
      ] },

      { rotulo: 'Ver funcionando', blocos: [
        { tipo: 'texto', html:
          '<h3>Ciclomática e cognitiva medem coisas diferentes</h3>' +
          '<p>A <strong>complexidade ciclomática</strong> (McCabe, 1976) é o número de caminhos linearmente independentes do grafo de controle: 1 + decisões, em que cada <code>if</code>, laço, <code>except</code>, <code>case</code> e cada <code>and</code>/<code>or</code> contam uma decisão. Duas leituras práticas: é um limite inferior do número de casos de teste para cobrir todos os ramos e correlaciona com defeitos. O que ela <em>não vê</em> é aninhamento: cinco decisões em sequência plana e cinco encaixadas têm o mesmo número.</p>' +
          '<p>A <strong>complexidade cognitiva</strong> (SonarSource, 2017) tenta medir o esforço de leitura penalizando aninhamento e quebras de fluxo. É uma heurística de fornecedor, útil como segunda opinião, não como verdade. O lab traz um medidor mínimo baseado em <code>ast</code> (<code>complexidade.py</code>) que reporta ciclomática e profundidade de aninhamento por função, aplicado a duas formas do mesmo reembolso.</p>' },
        { tipo: 'rode', id: 'b1-rode', titulo: 'Meça as duas formas do mesmo reembolso', enunciado: 'Rode o medidor do lab no arquivo de exemplos e clique em cada etapa para ler só as linhas dela. Saída de execução real em 11/10/2026.',
          prefixo: '$', entrada: CMD, unidade: 'linhas', terminalTitulo: 'design_lab complexidade',
          etapas: [
            { id: 'decidir', nome: 'decidir × decidir_aninhado', descricao: 'Mesmo comportamento, duas formas', tom: 'dns', ms: 14, linhas: [
              L('cmd', CMD), L('info', CAB),
              L('out', P + 'decidir_aninhado     14     5     3'),
              L('out', P + 'decidir               8     5     1'),
              L('hint', 'mesma ciclomática (5), aninhamento 3 contra 1: a diferença que o número ciclomático esconde')] },
            { id: 'importar', nome: 'importar_misturado × importar', descricao: 'Efeito separado da leitura', tom: 'request', ms: 13, linhas: [
              L('out', P + 'importar_misturado     13     5     2'),
              L('out', P + 'importar                11     3     2'),
              L('hint', 'o parsing saiu para _ler_linha; o laço ficou só com a decisão de acumular ou rejeitar')] },
            { id: 'ler', nome: '_ler_linha', descricao: 'A regra de linha válida em um lugar', tom: 'response', ms: 9, linhas: [
              L('out', P + '_ler_linha          9     5     1'),
              L('hint', 'ciclomática 5 com aninhamento 1: cinco caminhos para testar, nenhum encaixado')] }
          ],
          prever: { pergunta: 'decidir_aninhado e decidir têm o mesmo comportamento. O medidor mostra a mesma ciclomática para as duas?', opcoes: [
            { id: 'a', texto: 'Sim, 5 nas duas; muda só o aninhamento (3 contra 1).', correta: true, porque: 'a aninhada tem 4 if (1 + 4 = 5); a de guard clauses tem 3 if e 1 or (1 + 3 + 1 = 5). Os mesmos caminhos precisam de teste.' },
            { id: 'b', texto: 'Não: a versão com guard clauses tem ciclomática menor.', correta: false, porque: 'guard clause não muda o número de caminhos, muda a forma de ler.' },
            { id: 'c', texto: 'Não: a versão aninhada tem ciclomática maior por causa da indentação.', correta: false, porque: 'a ciclomática não vê indentação; é por isso que o medidor mostra a segunda coluna.' }
          ] },
          tutorAntes: 'Digite o comando já preenchido e aperte Enter. Depois clique em cada etapa.',
          tutorDepois: 'As duas colunas medem coisas diferentes. A ciclomática diz quantos casos de teste você precisa; o aninhamento diz quanto contexto o leitor carrega.',
          callout: 'Você viu a ciclomática igual e o aninhamento diferente: meça os dois.' },
        { tipo: 'texto', html:
          '<h3>Guard clauses: tratar o que não presta primeiro</h3>' +
          '<p>O padrão: validar pré-condições no topo e retornar (ou lançar) cedo, deixando o caminho feliz no nível de indentação mais externo. Na versão aninhada de <code>calcular_frete</code>, para saber qual erro corresponde a qual condição o leitor desce quatro níveis e volta.</p>' },
        { tipo: 'abas', rotulo: 'Forma', itens: [
          { rotulo: 'Aninhada', blocos: [
            { tipo: 'codigo', linguagem: 'python', texto: [
              'def calcular_frete(pedido):',
              '    if pedido is not None:',
              '        if pedido.itens:',
              '            if pedido.cep_valido:',
              '                if pedido.peso_kg <= 30:',
              '                    return FRETE_POR_KG[pedido.zona] * pedido.peso_kg',
              '                else:',
              '                    raise ValueError("peso acima do limite")',
              '            else:',
              '                raise ValueError("CEP inválido")',
              '        else:',
              '            raise ValueError("pedido vazio")',
              '    else:',
              '        raise ValueError("pedido ausente")'].join('\n') }
          ] },
          { rotulo: 'Guard clauses', blocos: [
            { tipo: 'codigo', linguagem: 'python', texto: [
              'def calcular_frete(pedido):',
              '    if pedido is None:',
              '        raise ValueError("pedido ausente")',
              '    if not pedido.itens:',
              '        raise ValueError("pedido vazio")',
              '    if not pedido.cep_valido:',
              '        raise ValueError("CEP inválido")',
              '    if pedido.peso_kg > 30:',
              '        raise ValueError("peso acima do limite")',
              '    return FRETE_POR_KG[pedido.zona] * pedido.peso_kg'].join('\n') },
            { tipo: 'texto', html: '<ul><li>Ciclomática: igual (5), os mesmos caminhos precisam de teste.</li><li>Cognitiva: cai de cerca de 14 para 4 (cada <code>if</code> aninhado custa 1 + o nível, e cada <code>else</code> soma 1).</li><li>Comportamento observável: idêntico, que é o que define uma refatoração.</li></ul>' }
          ] }
        ] },
        { tipo: 'texto', html:
          '<p>No exemplo do reembolso, a condição "supervisor aprova qualquer valor" também virou uma expressão (<code>r.valor &lt;= LIMITE_AGENTE or papel == "supervisor"</code>): guard clause não é só <em>early return</em>, é também achatar o que é uma única decisão.</p>' +
          '<ul><li>Não use guard clause quando as duas saídas são igualmente "normais": um <code>if/else</code> simétrico lê melhor.</li>' +
          '<li>Muitos <code>return</code> em funções com recursos a liberar pedem <code>with</code> ou <code>try/finally</code> (veja o M02).</li></ul>' },
        { tipo: 'takeaway', html: 'Ciclomática conta <mark>caminhos e casos de teste</mark>; aninhamento conta <mark>esforço de leitura</mark>. Meça os dois.' }
      ] },

      { rotulo: 'Praticar', blocos: [
        { tipo: 'python', id: 'b1-python', titulo: 'Escreva o medidor de complexidade', obrigatorio: false,
          enunciado: 'Complete duas lacunas do medidor: cada <code>and</code>/<code>or</code> soma <em>operandos menos um</em> decisões, e um <code>if</code> sozinho no <code>else</code> (um <code>elif</code>) fica no mesmo nível do pai. Os testes usam as duas formas do reembolso: ciclomática 5 nas duas e aninhamento 3 contra 1.',
          codigo: [
      "import ast",
      "",
      "DECISOES = (ast.If, ast.For, ast.While, ast.AsyncFor, ast.IfExp, ast.ExceptHandler, ast.match_case)",
      "NIVEIS = (ast.If, ast.For, ast.While, ast.AsyncFor, ast.Try, ast.With, ast.Match)",
      "",
      "",
      "def ciclomatica(fonte):",
      "    \"\"\"1 + decisões: if, laços, except, case, compreensões e cada and/or.\"\"\"",
      "    total = 1",
      "    for no in ast.walk(ast.parse(fonte)):",
      "        if isinstance(no, DECISOES):",
      "            total += 1",
      "        elif isinstance(no, ast.comprehension):",
      "            total += 1 + len(no.ifs)",
      "        elif isinstance(no, ast.BoolOp):",
      "            total += 0  # lacuna: quantas decisões um and/or com N operandos soma?",
      "    return total",
      "",
      "",
      "def _fundo(no, nivel):",
      "    maior = nivel",
      "    for filho in ast.iter_child_nodes(no):",
      "        if isinstance(filho, NIVEIS):",
      "            e_elif = False  # lacuna: quando o If do else é só um elif?",
      "            maior = max(maior, _fundo(filho, nivel if e_elif else nivel + 1))",
      "        else:",
      "            maior = max(maior, _fundo(filho, nivel))",
      "    return maior",
      "",
      "",
      "def aninhamento(fonte):",
      "    \"\"\"Maior número de blocos de controle encaixados.\"\"\"",
      "    return _fundo(ast.parse(fonte), 0)",
      "",
      "",
      "print(ciclomatica(\"def f(a, b):\\n    return a and b\\n\"))"
    ].join('\n'),
          testes: [
      "ANINHADO = '''",
      "def decidir_aninhado(r, papel):",
      "    if r.pago:",
      "        if r.dias <= 30:",
      "            if r.valor <= 100:",
      "                return \"aprovado\"",
      "            else:",
      "                if papel == \"supervisor\":",
      "                    return \"aprovado\"",
      "                else:",
      "                    return \"escalar\"",
      "        else:",
      "            return \"recusado: prazo\"",
      "    else:",
      "        return \"recusado: não pago\"",
      "'''",
      "",
      "GUARDAS = '''",
      "def decidir(r, papel):",
      "    if not r.pago:",
      "        return \"recusado: não pago\"",
      "    if r.dias > 30:",
      "        return \"recusado: prazo\"",
      "    if r.valor <= 100 or papel == \"supervisor\":",
      "        return \"aprovado\"",
      "    return \"escalar\"",
      "'''",
      "",
      "",
      "def test_funcao_reta_tem_ciclomatica_1():",
      "    assert ciclomatica(\"def f(x):\\n    return x + 1\\n\") == 1",
      "",
      "",
      "def test_and_or_contam_uma_decisao_por_operador():",
      "    assert ciclomatica(\"def f(a, b, c):\\n    return a and b and c\\n\") == 3",
      "",
      "",
      "def test_mesma_ciclomatica_nas_duas_formas():",
      "    assert ciclomatica(ANINHADO) == 5",
      "    assert ciclomatica(GUARDAS) == 5",
      "",
      "",
      "def test_aninhamento_distingue_as_duas_formas():",
      "    assert aninhamento(ANINHADO) == 3",
      "    assert aninhamento(GUARDAS) == 1",
      "",
      "",
      "def test_elif_nao_aprofunda():",
      "    cadeia = \"def f(x):\\n    if x == 1:\\n        return 1\\n    elif x == 2:\\n        return 2\\n    elif x == 3:\\n        return 3\\n    return 0\\n\"",
      "    assert ciclomatica(cadeia) == 4",
      "    assert aninhamento(cadeia) == 1",
      "",
      "",
      "def test_laco_com_if_dentro_tem_aninhamento_2():",
      "    assert aninhamento(\"def f(xs):\\n    for x in xs:\\n        if x:\\n            pass\\n\") == 2"
    ].join('\n'),
          dica: 'Em <code>ast.BoolOp</code>, <code>len(no.values)</code> é o número de operandos; <code>a and b and c</code> soma 2. Para o elif: o filho é um elif quando o pai é um <code>ast.If</code> e <code>no.orelse == [filho]</code>.',
          solucao: [
      "import ast",
      "",
      "DECISOES = (ast.If, ast.For, ast.While, ast.AsyncFor, ast.IfExp, ast.ExceptHandler, ast.match_case)",
      "NIVEIS = (ast.If, ast.For, ast.While, ast.AsyncFor, ast.Try, ast.With, ast.Match)",
      "",
      "",
      "def ciclomatica(fonte):",
      "    \"\"\"1 + decisões: if, laços, except, case, compreensões e cada and/or.\"\"\"",
      "    total = 1",
      "    for no in ast.walk(ast.parse(fonte)):",
      "        if isinstance(no, DECISOES):",
      "            total += 1",
      "        elif isinstance(no, ast.comprehension):",
      "            total += 1 + len(no.ifs)",
      "        elif isinstance(no, ast.BoolOp):",
      "            total += len(no.values) - 1",
      "    return total",
      "",
      "",
      "def _fundo(no, nivel):",
      "    maior = nivel",
      "    for filho in ast.iter_child_nodes(no):",
      "        if isinstance(filho, NIVEIS):",
      "            # elif é um If sozinho no else: fica no nível do pai",
      "            e_elif = isinstance(no, ast.If) and no.orelse == [filho]",
      "            maior = max(maior, _fundo(filho, nivel if e_elif else nivel + 1))",
      "        else:",
      "            maior = max(maior, _fundo(filho, nivel))",
      "    return maior",
      "",
      "",
      "def aninhamento(fonte):",
      "    \"\"\"Maior número de blocos de controle encaixados.\"\"\"",
      "    return _fundo(ast.parse(fonte), 0)"
    ].join('\n'),
          tutorDepois: 'O medidor do lab faz o mesmo com <code>ast</code>. Repare que os testes fixam as duas colunas: um medidor que só conta caminhos não distinguiria as duas formas.',
          callout: 'O medidor passou nos testes: você mede ciclomática e aninhamento do mesmo código.' },
        { tipo: 'transcript', id: 'b1-transcript', titulo: 'Aceitar ou recusar a divisão em passo1..passo9', obrigatorio: false, terminalTitulo: 'revisão de PR (exemplo)',
          enunciado: 'Um agente recebe o pedido de reduzir a complexidade de uma função com ciclomática 28. Uma das afirmações dele não é sustentada pelo que a sessão mostra. Clique na linha e aperte Conferir.',
          linhas: [
            { quem: 'voce', texto: 'A função processar tem ciclomática 28. Reduza a complexidade sem mudar o comportamento.' },
            { quem: 'agente', texto: 'Dividi em nove funções: _passo1 a _passo9. A maior ciclomática agora é 4.' },
            { quem: 'ferramenta', texto: '$ grep -n "self\\._" src/processar.py | head -3\nself._acc = []\nself._estado = "inicio"\nself._atual = None' },
            { quem: 'agente', texto: 'O código ficou mais legível, porque cada função é pequena.' }
          ],
          erradas: [3],
          explicacao: { 3: 'a métrica caiu, a leitura não: nomes vagos (<code>_passo2</code>) e estado compartilhado por atributos de instância obrigam o leitor a pular entre definições para reconstruir a sequência. Extrair só vale com nome de domínio e entradas e saídas claras. Regra de bolso: se o chamador não lê melhor do que lia o bloco inline, desfaça.' },
          tutorDepois: 'Recuse a divisão: peça guard clauses, tabela de despacho e funções com nome de domínio antes de extrair por extrair.' },
        { tipo: 'texto', html:
          '<h3>Coesão e comentários</h3>' +
          '<p><strong>Coesão</strong> é o grau em que as partes de um módulo ou classe existem pelo mesmo motivo. Teste prático: liste os métodos e os atributos que cada um usa; se a classe se parte em dois grupos que não compartilham atributos, são duas classes coladas. Sintoma frequente: <code>Utils</code> ou <code>helpers.py</code> que cresce sem fim, porque nada une os itens além de "não sabíamos onde pôr". O antídoto é nomear o módulo pelo conceito (<code>frete.py</code>, <code>descontos.py</code>) e deixar a função morar onde o dado que ela usa mora. O par da coesão é o <strong>acoplamento</strong>: quanto uma parte precisa saber da outra. Alvo: alta coesão dentro, baixo acoplamento entre; o bloco 4 volta a isso como SRP.</p>' +
          '<p>Comentário explica o <strong>porquê</strong>. O código diz o que e como; só o humano sabe por que. Valem: a decisão e sua razão ("desconto é arredondado para baixo porque contabilidade fecha em centavos inteiros"), a restrição externa ("a API do gateway devolve OK em maiúsculas"), o aviso ("não reordene: o desconto precisa vir antes do frete") e a referência (RFC, ticket). Se você sente necessidade de comentar um bloco para explicar o que ele faz, extraia-o para uma função com esse nome: comentários de bloco no meio de uma função grande são os nomes das funções que faltam. Docstring documenta o contrato (entrada, saída, erros); comentário inline documenta a decisão.</p>' },
        { tipo: 'takeaway', html: 'Extrair só vale com <mark>nome de domínio</mark>: número menor não é legibilidade maior.' }
      ] },

      { rotulo: 'Conferir', blocos: [
        { tipo: 'escolha', id: 'b1-esc-medidas', titulo: 'Qual métrica separa as duas funções?',
          pergunta: 'Duas funções têm complexidade ciclomática 6. A primeira tem cinco <code>if</code> em sequência; a segunda tem cinco <code>if</code> aninhados uns dentro dos outros. Qual métrica distingue o esforço de leitura delas?',
          opcoes: [
            { id: 'a', texto: 'Nenhuma: se a ciclomática é igual, o esforço de leitura é igual.', correta: false, porque: 'a ciclomática ignora aninhamento.' },
            { id: 'b', texto: 'A ciclomática, porque ela já conta os níveis de indentação.', correta: false, porque: 'ela conta caminhos, não níveis.' },
            { id: 'c', texto: 'A complexidade cognitiva (ou o aninhamento): a segunda é bem mais difícil de ler, embora precise do mesmo número mínimo de casos de teste.', correta: true, porque: 'a cognitiva penaliza aninhamento e quebras de fluxo; meça as duas, uma sozinha engana.' },
            { id: 'd', texto: 'O número de linhas, que sempre difere entre as duas.', correta: false, porque: 'linhas não medem caminhos nem esforço de leitura.' }
          ] },
        { tipo: 'escolha', id: 'b1-esc-comentario', titulo: 'Qual comentário agrega valor?',
          pergunta: 'Qual comentário agrega valor e não apodrece?',
          opcoes: [
            { id: 'a', texto: '<code># Arredonda para cima: o gateway cobra por minuto iniciado</code>', correta: true, porque: 'registra o porquê (restrição externa) que o código não consegue dizer.' },
            { id: 'b', texto: '<code># incrementa i em 1</code>', correta: false, porque: 'repete o código e vira mentira na primeira edição.' },
            { id: 'c', texto: '<code># retorna o resultado</code>', correta: false, porque: 'ruído: o <code>return</code> já diz isso.' },
            { id: 'd', texto: '<code># função que calcula o total</code>', correta: false, porque: 'o nome da função deve dizer isso; melhore o nome.' }
          ] },
        { tipo: 'callout', tom: 'neutral', titulo: 'Trade-offs', html:
          '<p><em>Early return</em> espalha pontos de saída; para quem depura com um único breakpoint de saída ou precisa de limpeza, é custo real (resolvido com <code>with</code>). Limites numéricos (ciclomática &le; 10) servem como alarme, não como meta: um <code>match</code> sobre 30 variantes de um enum chega a 30 sem ser difícil. Linters como <code>ruff</code> (regra C901 para McCabe, PLR para tamanho) automatizam o alarme; a decisão continua humana.</p>' },
        { tipo: 'takeaway', html: 'Limite numérico é <mark>alarme</mark>, não meta; a decisão sobre extrair continua <mark>humana</mark>.' }
      ] }
    ]
  });
})();
