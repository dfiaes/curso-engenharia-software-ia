/* F02 · Bloco 1: como o Python executa. Fonte: F02.html#b01. Saídas de terminal vêm de execução real em 11/10/2026 (Python 3.14.7, uv 0.12.13); nomes de instruções do dis, texto de mensagens e layout do uv init mudam entre versões menores. */
(function () {
  var L = function (kind, text) { return { kind: kind, text: text }; };
  function opc(id, texto, correta, porque) { return { id: id, texto: texto, correta: correta, porque: porque }; }
  var J = function (a) { return a.join('\n') + '\n'; };

  TrilhaAula.registrar({
    id: 'f02-b1',
    titulo: 'Como o Python executa',
    minutos: 30,
    resumo: 'O CPython compila para bytecode e executa numa máquina virtual. Saber qual interpretador roda, de onde ele carrega código e com que nome o módulo de entrada nasce explica a maioria dos erros "de ambiente".',
    objetivo: 'Explicar o caminho do texto ao resultado no CPython, ler bytecode com dis, distinguir script de módulo (__main__, sys.path[0]) e descobrir qual Python está rodando.',
    revisao: [
      { id: 'f02b1-pyc', pergunta: 'Depois de rodar python app.py, em que app.py importa util.py, o que aparece em __pycache__?',
        opcoes: [
          opc('a', 'Só o .pyc de util: o módulo de entrada é compilado a cada execução e não é cacheado', true, 'o cache existe para acelerar importações; apagar __pycache__ é sempre seguro.'),
          opc('b', 'Os .pyc de app e de util', false, 'o script de entrada não é cacheado.'),
          opc('c', 'Nada: o .pyc só nasce com python -O', false, 'o .pyc é criado em qualquer import normal.')] },
      { id: 'f02b1-path0', pergunta: 'Você está em /proj e roda python src/app.py. Qual pasta entra em sys.path[0]?',
        opcoes: [
          opc('a', '/proj/src, a pasta do script', true, 'com python arquivo.py entra a pasta do script; com python -m pacote.modulo entra o diretório corrente.'),
          opc('b', '/proj, o diretório corrente', false, 'o diretório corrente entra com python -m, não com caminho de arquivo.'),
          opc('c', 'Nenhuma: o script não altera sys.path', false, 'a pasta do script sempre entra no início do caminho de busca (a menos que use -P).')] },
      { id: 'f02b1-main', pergunta: 'Para que serve o idioma if __name__ == "__main__":?',
        opcoes: [
          opc('a', 'Separar "rodar como programa" de "ser importado": sem ele, importar o arquivo executaria o programa inteiro', true, 'o módulo de entrada se chama __main__; qualquer outro recebe o nome do import.'),
          opc('b', 'Acelerar o arquivo, pulando a compilação', false, 'não tem relação com compilação ou cache.'),
          opc('c', 'Proteger o arquivo contra execução por outro usuário', false, 'não é controle de acesso.')] },
      { id: 'f02b1-pip', pergunta: 'O pip install funcionou, mas o import falha com ModuleNotFoundError. Qual a correção?',
        opcoes: [
          opc('a', 'Chamar o instalador pelo interpretador (python -m pip, uv add ou uv run), nunca "reinstalar tudo"', true, 'o pip do PATH pertencia a outro Python; sys.executable e python -m pip --version mostram a divergência.'),
          opc('b', 'Reinstalar o Python do sistema', false, 'trata o sintoma e mistura dependências do projeto com as do SO.'),
          opc('c', 'Instalar de novo com sudo no Python global', false, 'pip global mistura dependências e quebra ferramentas do sistema.')] },
      { id: 'f02b1-sombra', pergunta: 'Um random.py ao lado do seu script quebra um import random. Por quê?',
        opcoes: [
          opc('a', 'A pasta do script vem antes da biblioteca padrão em sys.path, então o seu arquivo ganha', true, 'diagnóstico: python -c "import modulo; print(modulo.__file__)"; prevenção: -P, -I e nomes que não colidem com a stdlib.'),
          opc('b', 'A stdlib é carregada por último e sempre perde para o disco', false, 'a ordem de sys.path é que decide, e a pasta do script está na frente.'),
          opc('c', 'O Python não aceita dois módulos com o mesmo nome em máquinas diferentes', false, 'o conflito é de caminho de busca, não de máquina.')] }
    ],
    abas: [
      { rotulo: 'Entender', blocos: [
        { tipo: 'texto', html:
          '<h3>Três falhas que parecem de ambiente</h3>' +
          '<p>Um script chamado <code>random.py</code> quebra qualquer programa vizinho que importe <code>random</code>. O teste passa com <code>python -m pytest</code> e falha com <code>pytest</code>. O <code>pip install</code> "funcionou", mas o <code>import</code> não acha o pacote porque o <code>pip</code> pertence a outro Python. Em todas, ninguém sabia <em>qual interpretador</em> estava rodando, <em>de onde</em> ele carregava código e <em>com que nome</em> o módulo de entrada nascia.</p>' +
          '<p>O modelo cabe em cinco peças: <strong>interpretador</strong> (CPython), <strong>bytecode</strong>, <strong>módulo de entrada</strong> (<code>__main__</code>), <strong>caminho de busca</strong> (<code>sys.path</code>) e <strong>ambiente virtual</strong>.</p>' },
        { tipo: 'texto', html:
          '<h3>CPython: compilador de bytecode mais máquina virtual</h3>' +
          '<p>"Python" é a linguagem; <strong>CPython</strong> é a implementação de referência, escrita em C, e a que o curso usa (existem PyPy, MicroPython e outras, com desempenho e compatibilidade diferentes). Contra a intuição de "linguagem interpretada", o CPython <em>compila</em> antes de executar.</p>' +
          '<ol><li><strong>Tokenização e parsing</strong>: o texto vira uma árvore sintática abstrata (<strong>AST</strong>). Erros de sintaxe aparecem aqui, antes de qualquer linha rodar.</li>' +
          '<li><strong>Compilação</strong>: a AST vira <strong>bytecode</strong>, uma sequência de instruções para uma máquina de pilha, guardada num <em>code object</em> por função.</li>' +
          '<li><strong>Execução</strong>: um laço (o <em>eval loop</em>) lê instruções e despacha cada uma. Desde o Python 3.11 o interpretador é <em>adaptativo</em>: instruções quentes são especializadas por tipo observado (por exemplo, soma de dois <code>int</code>), o que explica boa parte do ganho de velocidade das versões recentes.</li></ol>' },
        { tipo: 'callout', tom: 'info', titulo: 'O cache .pyc', html:
          '<p>Para módulos <em>importados</em>, o bytecode é guardado em <code>__pycache__/nome.cpython-314.pyc</code> e reaproveitado enquanto a fonte não mudar (a validade é checada por data e tamanho, por padrão). O script de entrada <strong>não</strong> é cacheado: é compilado a cada execução. O <code>.pyc</code> é um cache descartável, nunca um artefato de distribuição confiável: depende da versão do interpretador, e o nome carrega essa versão (<code>cpython-314</code>). Apagar <code>__pycache__</code> é sempre seguro; versioná-lo nunca é.</p>' },
        { tipo: 'texto', html:
          '<h3>Lendo bytecode com <code>dis</code></h3>' +
          '<p>O módulo <code>dis</code> mostra o que o compilador produziu. Não é de uso diário: é a ferramenta que encerra discussões sobre "o que o Python faz nessa linha".</p>' },
        { tipo: 'codigo', linguagem: 'bash', texto:
          '$ cat a.py\nimport dis\ndef soma(a, b):\n    return a + b * 2\ndis.dis(soma)\nprint(soma.__code__.co_consts, soma.__code__.co_varnames)\n$ python a.py\n  2           RESUME                   0\n\n  3           LOAD_FAST_BORROW_LOAD_FAST_BORROW 1 (a, b)\n              LOAD_SMALL_INT           2\n              BINARY_OP                5 (*)\n              BINARY_OP                0 (+)\n              RETURN_VALUE\n(2,) (\'a\', \'b\')' },
        { tipo: 'texto', html:
          '<p>Leia assim: empilha <code>a</code> e <code>b</code> (variáveis locais, acesso por índice, sem busca por nome), empilha o inteiro 2, multiplica, soma, devolve. A multiplicação vem antes da soma porque a precedência já foi resolvida na AST.</p>' },
        { tipo: 'callout', tom: 'danger', titulo: 'Use dis para entender, nunca para depender', html:
          '<p>Os nomes exatos das instruções (<code>LOAD_FAST_BORROW_LOAD_FAST_BORROW</code>, <code>LOAD_SMALL_INT</code>) <strong>mudam entre versões menores</strong>: o bytecode é detalhe de implementação, sem garantia de compatibilidade. Para desempenho, meça com <code>python -m timeit</code> e <code>cProfile</code>; o interpretador adaptativo torna palpite sobre custo de instrução pouco confiável.</p>' },
        { tipo: 'takeaway', html: 'O CPython <mark>compila</mark> para bytecode e executa numa máquina de pilha; só <mark>módulos importados</mark> vão para o cache <code>.pyc</code>, e o bytecode é detalhe de versão.' }
      ] },

      { rotulo: 'Ver funcionando', blocos: [
        { tipo: 'texto', html:
          '<p>Cenário real: um arquivo <code>random.py</code> na mesma pasta de <code>uso.py</code>, que faz <code>import random</code> e chama <code>random.randint(1, 6)</code>. Antes de rodar, preveja o que o Python faz com o seu arquivo.</p>' },
        { tipo: 'rode', id: 'f02b1-rode', titulo: 'Seu random.py sombreia a biblioteca padrão', enunciado: 'Rode <code>python uso.py</code> e leia o traceback. A barra de cada etapa é só a ordem em que as coisas acontecem.',
          prefixo: '$', entrada: 'python uso.py', unidade: 'etapa', terminalTitulo: 'terminal',
          etapas: [
            { id: 'arqs', nome: 'Arquivos', descricao: 'O que existe na pasta', tom: 'dns', ms: 1, linhas: [
              L('cmd', 'cat random.py'), L('out', 'print("meu random.py")'),
              L('cmd', 'cat uso.py'), L('out', 'import random'), L('out', 'print(random.randint(1, 6))')] },
            { id: 'path', nome: 'sys.path', descricao: 'Pasta do script na frente', tom: 'tcp', ms: 2, linhas: [
              L('info', 'sys.path[0] = pasta do script (antes da biblioteca padrão)'),
              L('hint', 'com python arquivo.py a pasta do script entra no início da busca')] },
            { id: 'import', nome: 'import random', descricao: 'Acha o arquivo local primeiro', tom: 'tls', ms: 3, linhas: [
              L('out', 'meu random.py'),
              L('hint', 'o print do SEU random.py rodou durante o import')] },
            { id: 'erro', nome: 'Traceback', descricao: 'O módulo não tem randint', tom: 'response', ms: 4, linhas: [
              L('out', 'Traceback (most recent call last):'),
              L('out', '  File "/tmp/f02x/sh/uso.py", line 2, in <module>'),
              L('out', '    print(random.randint(1, 6))'),
              L('out', '          ^^^^^^^^^^^^^^'),
              L('in', "AttributeError: module 'random' has no attribute 'randint' (consider renaming '/tmp/f02x/sh/random.py' since it has the same name as the standard library module named 'random' and prevents importing that standard library module)"),
              L('hint', 'as mensagens novas do Python 3.13+ já apontam a causa')] }
          ],
          prever: { pergunta: 'O que acontece com import random quando existe um random.py ao lado do uso.py?', opcoes: [
            { id: 'a', texto: 'O Python usa o random da biblioteca padrão e ignora o arquivo local.', correta: false, porque: 'a biblioteca padrão não tem prioridade: quem manda é a ordem de sys.path.' },
            { id: 'b', texto: 'O Python importa o random.py local, executa o print dele e depois falha ao procurar randint.', correta: true, porque: 'a pasta do script vem antes da stdlib em sys.path, então o seu arquivo ganhou e o corpo dele rodou.' },
            { id: 'c', texto: 'O Python recusa o import com um erro de nome duplicado antes de executar qualquer coisa.', correta: false, porque: 'não existe checagem de duplicidade: o primeiro arquivo achado em sys.path vence.' }
          ] },
          tutorAntes: 'Digite o comando já preenchido e aperte Enter. Clique em "Traceback" para ler só o erro.',
          tutorDepois: 'O erro aparece em AttributeError, não em ImportError: o import deu certo, só que com o módulo errado. Defesas: nunca nomeie arquivo como módulo da stdlib; use python -P (ou PYTHONSAFEPATH=1) para não pôr a pasta do script no caminho; use python -I (modo isolado) em scripts de sistema.',
          callout: 'Você viu o arquivo local vencer a stdlib: a ordem de sys.path decide.' },
        { tipo: 'callout', tom: 'danger', titulo: 'Armadilha que pega sênior: o erro aparece longe', html:
          '<p>Um <code>types.py</code>, <code>logging.py</code>, <code>queue.py</code> ou <code>test.py</code> ao lado do seu código sombreia o módulo padrão, e o erro surge dentro de <em>outra</em> biblioteca que importa o módulo da stdlib: o traceback aponta para código de terceiros, não para o seu arquivo. Diagnóstico em dez segundos: <code>python -c "import modulo; print(modulo.__file__)"</code>. Se o caminho cai na sua pasta, achou.</p>' },
        { tipo: 'takeaway', html: 'A pasta do script entra <mark>antes da stdlib</mark> em <code>sys.path</code>; <code>__file__</code> diz quem foi carregado.' }
      ] },

      { rotulo: 'Script, módulo e ambiente', blocos: [
        { tipo: 'texto', html:
          '<h3>REPL, script e módulo: três jeitos de começar</h3>' +
          '<p>O <strong>REPL</strong> (<code>python</code> sem argumentos) lê uma expressão, avalia e imprime; é excelente para explorar uma API (<code>help(obj)</code>, <code>dir(obj)</code>, <code>_</code> guarda o último resultado). Mas estado acumulado no REPL é a fonte clássica de "funciona aqui": um nome definido há duas horas continua vivo. Para qualquer coisa que importe, escreva o arquivo.</p>' +
          '<p>Há duas formas de executar um arquivo, e a diferença é <em>como o módulo de entrada é localizado</em>:</p>' },
        { tipo: 'codigo', linguagem: 'bash', texto:
          '$ cat m.py\nprint("__name__ =", __name__)\n$ python m.py          # caminho de arquivo\n__name__ = __main__\n$ python -m m          # nome de módulo, buscado em sys.path\n__name__ = __main__\n$ python -c "import m"\n__name__ = m' },
        { tipo: 'texto', html:
          '<p>Nos dois primeiros, o módulo vira <code>__main__</code>; no import, recebe o seu nome. Daí o idioma que separa <em>biblioteca</em> (funções importáveis sem efeito colateral) de <em>programa</em>. O <code>main()</code> devolve o exit code e o <code>SystemExit</code> liga este módulo ao F01: o código de saída é o que o shell, o CI e o agente enxergam. É a estrutura de <code>expenses/__main__.py</code> no laboratório.</p>' },
        { tipo: 'complete', id: 'f02b1-complete', titulo: 'Monte o ponto de entrada', obrigatorio: false,
          enunciado: 'Complete o idioma que roda o programa só quando o arquivo é o módulo de entrada e entrega o exit code ao sistema.',
          linguagem: 'python',
          partes: [
            'def main() -> int:\n    ...\n    return 0\n\n',
            { lacuna: 'cond', opcoes: ['if __name__ == "__main__":', 'if __name__ == "main":', 'if __file__ == "__main__":'], correta: 0 },
            '\n    ',
            { lacuna: 'saida', opcoes: ['raise SystemExit(main())', 'main()', 'print(main())'], correta: 0 },
            '\n'
          ],
          explicacao: 'O interpretador nomeia o módulo de entrada __main__ (a comparação é com a string "__main__", dois sublinhados). SystemExit(main()) transforma o inteiro devolvido em exit code do processo; chamar main() solto descartaria o código.' },
        { tipo: 'texto', html:
          '<h3><code>python arquivo.py</code> versus <code>python -m pacote.modulo</code></h3>' +
          '<p>A diferença está em <code>sys.path[0]</code>: no primeiro, a <strong>pasta do script</strong> entra no início do caminho de busca; no segundo, o <strong>diretório corrente</strong>. Por isso <code>python -m pytest</code> enxerga o seu código quando o diretório corrente é a raiz do projeto e o <code>pytest</code> solto às vezes não. E por isso <code>python -m pip</code> garante que o <code>pip</code> pertence <em>àquele</em> interpretador.</p>' },
        { tipo: 'python', id: 'f02b1-python', titulo: 'Monte o caminho de busca', obrigatorio: false,
          enunciado: 'Complete <code>montar_sys_path(modo, pasta_script, cwd, seguro=False)</code>. <code>base</code> é o resto do caminho (stdlib e site-packages). Com <code>modo="arquivo"</code> a pasta do script vai na frente; com <code>modo="modulo"</code>, o diretório corrente; com <code>seguro=True</code> (o <code>-P</code>) nenhuma das duas entra. Modo desconhecido levanta <code>ValueError</code>. A função <code>resolver</code> já está pronta: ela devolve a primeira pasta do caminho que contém o módulo.',
          codigo: J([
            'def montar_sys_path(modo, pasta_script, cwd, seguro=False):',
            '    base = ["/stdlib", "/site-packages"]',
            '    # 1. com seguro, devolva só a base',
            '    # 2. modo "arquivo": pasta do script na frente',
            '    # 3. modo "modulo": diretorio corrente na frente',
            '    # 4. outro modo: ValueError',
            '    return base',
            '',
            '',
            'def resolver(nome, caminho, conteudo):',
            '    for pasta in caminho:',
            '        if nome in conteudo.get(pasta, ()):',
            '            return pasta',
            '    raise ModuleNotFoundError(nome)',
            '',
            '',
            'conteudo = {"/proj": {"random"}, "/stdlib": {"random", "json"}}',
            'print(resolver("random", montar_sys_path("arquivo", "/proj", "/outro"), conteudo))'
          ]),
          testes: J([
            'CONTEUDO = {"/proj": {"random"}, "/stdlib": {"random", "json"}}',
            '',
            '',
            'def test_arquivo_poe_a_pasta_do_script_na_frente():',
            '    assert montar_sys_path("arquivo", "/proj", "/outro")[0] == "/proj"',
            '',
            '',
            'def test_modulo_poe_o_cwd_na_frente():',
            '    assert montar_sys_path("modulo", "/proj", "/outro")[0] == "/outro"',
            '',
            '',
            'def test_arquivo_local_sombreia_a_stdlib():',
            '    caminho = montar_sys_path("arquivo", "/proj", "/outro")',
            '    assert resolver("random", caminho, CONTEUDO) == "/proj"',
            '',
            '',
            'def test_seguro_nao_poe_pasta_nenhuma():',
            '    caminho = montar_sys_path("arquivo", "/proj", "/outro", seguro=True)',
            '    assert "/proj" not in caminho',
            '    assert resolver("random", caminho, CONTEUDO) == "/stdlib"',
            '',
            '',
            'def test_modo_desconhecido_falha():',
            '    try:',
            '        montar_sys_path("repl", "/proj", "/outro")',
            '    except ValueError:',
            '        return',
            '    raise AssertionError("esperava ValueError")',
            '',
            '',
            'def test_controle_negativo_modulo_ausente():',
            '    try:',
            '        resolver("nao_existe", montar_sys_path("arquivo", "/proj", "/outro"), CONTEUDO)',
            '    except ModuleNotFoundError:',
            '        return',
            '    raise AssertionError("esperava ModuleNotFoundError")'
          ]),
          dica: 'Comece por <code>if seguro: return base</code>. Depois use <code>[pasta_script] + base</code> e <code>[cwd] + base</code>, e termine com <code>raise ValueError(modo)</code>.',
          solucao: J([
            'def montar_sys_path(modo, pasta_script, cwd, seguro=False):',
            '    base = ["/stdlib", "/site-packages"]',
            '    if seguro:',
            '        return base',
            '    if modo == "arquivo":',
            '        return [pasta_script] + base',
            '    if modo == "modulo":',
            '        return [cwd] + base',
            '    raise ValueError(modo)',
            '',
            '',
            'def resolver(nome, caminho, conteudo):',
            '    for pasta in caminho:',
            '        if nome in conteudo.get(pasta, ()):',
            '            return pasta',
            '    raise ModuleNotFoundError(nome)'
          ]),
          tutorDepois: 'O controle negativo importa: sem o módulo em nenhuma pasta, o import falha alto. E com seguro=True o seu random.py deixa de ganhar da stdlib, que é o efeito do -P.',
          callout: 'A ordem do caminho de busca decide quem é importado, e agora ela está em código.' },
        { tipo: 'takeaway', html: 'O módulo de entrada se chama <mark>__main__</mark>; <code>python arquivo.py</code> põe a <mark>pasta do script</mark> em <code>sys.path[0]</code> e <code>python -m</code> põe o <mark>diretório corrente</mark>.' },

        { tipo: 'texto', html:
          '<h3>Ambientes virtuais e <code>uv</code></h3>' +
          '<p>Cada instalação de Python tem um <code>site-packages</code> onde o <code>pip</code> grava dependências. Se todo projeto instalasse no mesmo lugar, as versões colidiriam. Um <strong>ambiente virtual</strong> (venv) é uma pasta com um <code>pyvenv.cfg</code>, um link para o interpretador-base e um <code>site-packages</code> próprio; "ativar" só reordena o <code>PATH</code> do seu shell (F01). Você nunca precisa ativar nada se chamar <code>.venv/bin/python</code> diretamente.</p>' +
          '<p>O curso usa o <strong><code>uv</code></strong>, que reúne instalação de Python, venv, resolução e lockfile numa ferramenta.</p>' },
        { tipo: 'codigo', linguagem: 'bash', texto:
          '$ uv init proj\nInitialized project `proj` at `/tmp/f02x/proj`\n$ cd proj && cat .python-version\n3.14\n$ grep -E "requires-python|build-backend" pyproject.toml\nrequires-python = ">=3.14"\nbuild-backend = "uv_build"\n$ uv run python -c "import sys; print(sys.prefix != sys.base_prefix, sys.prefix.split(\'/\')[-1])"\nTrue .venv' },
        { tipo: 'texto', html:
          '<p><code>uv run</code> cria o <code>.venv</code> se não existir, sincroniza com o <code>uv.lock</code> e executa dentro dele. <code>uv sync --frozen</code> instala exatamente o que o lockfile diz, sem reescrevê-lo: é o comando dos labs. O <code>uv init</code> desta versão gera layout com <code>src/</code> e backend <code>uv_build</code>; o formato do scaffold muda entre versões do <code>uv</code>. Dependências, versões e empacotamento são o primeiro bloco do M02; aqui basta o modelo: <em>um projeto, um ambiente, um lockfile</em>.</p>' },
        { tipo: 'cenario', id: 'f02b1-cenario', titulo: 'Qual Python é esse?', obrigatorio: false,
          enunciado: 'O sintoma: <code>ModuleNotFoundError: No module named \'pytest\'</code> logo depois de um <code>pip install pytest</code> bem-sucedido. Escolha como investigar.',
          inicio: 'inicio',
          nos: {
            inicio: { texto: 'O pip disse "Successfully installed pytest" e o import falha. Qual o primeiro passo?', opcoes: [
              { texto: 'Reinstalar o Python e todas as dependências.', vai: 'f-reinstala', tom: 'ruim', consequencia: 'você apagou a evidência e o problema volta, porque a causa era qual pip foi chamado.' },
              { texto: 'Comparar o interpretador que roda (sys.executable) com o dono do pip (python -m pip --version).', vai: 'diag', tom: 'ok', consequencia: 'sem instalar nada, você descobre se os dois são o mesmo Python.' },
              { texto: 'Rodar de novo com sudo pip install no Python do sistema.', vai: 'f-global', tom: 'ruim', consequencia: 'mistura dependências do projeto com as do SO.' }
            ] },
            diag: { texto: 'sys.executable aponta para .venv/bin/python, mas python -m pip --version mostra o site-packages de outro Python. O que isso diz e como corrigir?', opcoes: [
              { texto: 'O pip do PATH instalou em outro ambiente; chamar o instalador pelo interpretador (python -m pip, uv add ou uv run).', vai: 'f-bom', tom: 'ok', consequencia: 'o pacote vai para o site-packages do interpretador que de fato roda o código.' },
              { texto: 'O pytest está corrompido; baixar de novo a mesma versão.', vai: 'f-reinstala', tom: 'ruim', consequencia: 'o pacote estava íntegro, só no ambiente errado.' }
            ] }
          },
          finais: {
            'f-bom': { bom: true, texto: 'O raciocínio é o mesmo do F01 sobre PATH e command -v, com sys.path como segundo mapa: um projeto, um ambiente, um lockfile.' },
            'f-reinstala': { bom: false, texto: 'Tempo perdido e a mesma falha depois: a correção é sempre chamar o instalador pelo interpretador, nunca "reinstalar tudo".' },
            'f-global': { bom: false, texto: 'Funcionou por acaso, e agora o Python do sistema tem dependências do projeto, que quebram ferramentas do SO.' }
          },
          callout: 'Você comparou quem roda com quem instala, sem mexer em nada.' },
        { tipo: 'takeaway', html: 'Para saber "qual Python", olhe <mark>sys.executable</mark> e <mark>sys.path</mark>; um projeto, <mark>um ambiente</mark>, um lockfile.' }
      ] },

      { rotulo: 'Conferir', blocos: [
        { tipo: 'texto', html:
          '<h3>Decisões e erros comuns</h3>' +
          '<ul><li><strong>Script solto versus pacote com <code>-m</code>.</strong> Script de uma tela: arquivo. Qualquer coisa com mais de um arquivo: pacote e <code>python -m pacote</code> (ou entry point), porque imports relativos e testes dependem de o pacote ser importável pelo nome.</li>' +
          '<li><strong><code>pip</code> global.</strong> Instalar no Python do sistema mistura dependências do projeto com as do SO. Use sempre ambiente por projeto.</li>' +
          '<li><strong>Versão do Python implícita.</strong> "Funciona na minha máquina" costuma ser 3.11 contra 3.14. Declare <code>requires-python</code> e <code>.python-version</code>.</li>' +
          '<li><strong>Tratar <code>.pyc</code> como fonte.</strong> Apagar <code>__pycache__</code> é sempre seguro; versioná-lo nunca é (está no <code>.gitignore</code>).</li>' +
          '<li><strong>Desempenho por intuição.</strong> Meça com <code>python -m timeit</code> e <code>cProfile</code>.</li></ul>' },
        { tipo: 'escolha', id: 'f02b1-esc-pyc', titulo: 'Confira: o cache',
          pergunta: 'Você roda python app.py e app.py importa util.py. Depois da primeira execução, o que aparece em __pycache__?',
          opcoes: [
            { id: 'a', texto: 'app.cpython-*.pyc e util.cpython-*.pyc', correta: false, porque: 'o módulo de entrada não é cacheado.' },
            { id: 'b', texto: 'Só util.cpython-*.pyc: o script de entrada é compilado a cada execução', correta: true, porque: 'o .pyc acelera importações e é específico da versão (cpython-3XX).' },
            { id: 'c', texto: 'Nada: o .pyc só é criado com python -O', correta: false, porque: 'o cache nasce em qualquer import normal.' },
            { id: 'd', texto: 'Só app.cpython-*.pyc', correta: false, porque: 'é o contrário: o importado é cacheado, o de entrada não.' }
          ], tutorDepois: 'Apagar __pycache__ é sempre seguro; versionar nunca.' },
        { tipo: 'escolha', id: 'f02b1-esc-path', titulo: 'Confira: sys.path[0]',
          pergunta: 'Você está em /proj e roda python src/app.py. Qual pasta entra em sys.path[0]?',
          opcoes: [
            { id: 'a', texto: '/proj, o diretório corrente', correta: false, porque: 'o diretório corrente entra com python -m pacote.modulo.' },
            { id: 'b', texto: 'O diretório do Python instalado', correta: false, porque: 'a stdlib e o site-packages vêm depois no caminho.' },
            { id: 'c', texto: '/proj/src, a pasta do script', correta: true, porque: 'com python arquivo.py, sys.path[0] é a pasta do script.' },
            { id: 'd', texto: 'Nenhuma: o script não altera sys.path', correta: false, porque: 'a pasta do script entra, a menos que você use -P.' }
          ], tutorDepois: 'Essa diferença explica por que um mesmo import funciona de um jeito e falha do outro.' },
        { tipo: 'texto', html: '<p class="ta-nota">Saídas de terminal deste bloco vêm de execução real em 11/10/2026 com Python 3.14.7 e uv 0.12.13 (Linux). Nomes de instruções do <code>dis</code>, textos de mensagens de erro e o layout do <code>uv init</code> mudam entre versões menores; comportamento do <code>uv</code> e de versões do Python é de alto risco (revalidar em até 90 dias).</p>' },
        { tipo: 'takeaway', html: 'Interpretador, <mark>caminho de busca</mark> e ambiente respondem a quase todo erro "de ambiente"; <mark>meça</mark> em vez de supor.' }
      ] }
    ]
  });
})();
