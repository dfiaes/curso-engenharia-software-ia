/* F02 · Bloco 6: erros e exceções. Fonte: F02.html#b06. Saídas de execução real em 11/10/2026 (Python 3.14.7). */
(function () {
  var L = function (kind, text) { return { kind: kind, text: text }; };
  function opc(id, texto, correta, porque) { return { id: id, texto: texto, correta: correta, porque: porque }; }
  var J = function (a) { return a.join('\n') + '\n'; };

  TrilhaAula.registrar({
    id: 'f02-b6',
    titulo: 'Erros e exceções',
    minutos: 40,
    resumo: 'Robustez é decidir quem captura o quê, onde e que informação sobrevive até quem pode agir: hierarquia própria, raise from, EAFP e context managers que limpam sem esconder a falha.',
    objetivo: 'Explicar como uma exceção desenrola a pilha, ordenar try/except/else/finally, desenhar uma hierarquia de exceções com dados em atributos, encadear causas e escrever um context manager que não suprime o que não conhece.',
    revisao: [
      { id: 'f02b6-ordem', pergunta: 'Em que ordem rodam try, except, else e finally?',
        opcoes: [
          opc('a', 'try; se levantou e casa, o except; se não levantou, o else; o finally sempre, por último', true, 'o else mantém o try curto: só o que pode falhar fica dentro; o finally roda antes de o valor do return ser entregue.'),
          opc('b', 'try, except, else e finally sempre, nessa ordem', false, 'except e else são excludentes.'),
          opc('c', 'finally primeiro, depois try', false, 'o finally roda ao sair do bloco.')] },
      { id: 'f02b6-from', pergunta: 'O que raise Nova from original acrescenta?',
        opcoes: [
          opc('a', 'Grava __cause__ e mantém a causa original no traceback; sem from, o Python registra só o __context__ implícito', true, 'raise X from None suprime o encadeamento quando a causa é ruído.'),
          opc('b', 'Converte Nova numa subclasse de original', false, 'o encadeamento não altera a hierarquia.'),
          opc('c', 'Apaga a exceção original', false, 'ela é preservada, é essa a ideia.')] },
      { id: 'f02b6-base', pergunta: 'except Exception captura Ctrl+C (KeyboardInterrupt)?',
        opcoes: [
          opc('a', 'Não: KeyboardInterrupt herda de BaseException, fora de Exception; except: sem tipo engole o Ctrl+C', true, 'por isso except Exception é seguro na fronteira, e except: sem tipo não é.'),
          opc('b', 'Sim: todo erro é Exception', false, 'SystemExit, KeyboardInterrupt e GeneratorExit ficam de fora de propósito.'),
          opc('c', 'Depende do sistema operacional', false, 'a hierarquia é da linguagem.')] },
      { id: 'f02b6-exit', pergunta: 'O que acontece quando __exit__ devolve verdadeiro?',
        opcoes: [
          opc('a', 'A exceção do corpo do with é suprimida: o programa segue como se nada tivesse acontecido', true, 'suprima só um tipo conhecido (suppress(FileNotFoundError)), nunca "tudo".'),
          opc('b', 'A exceção é relançada com mais contexto', false, 'só ocorre se __exit__ devolve falso ou None.'),
          opc('c', 'O programa termina com exit code 1', false, 'o contrário: a exceção some.')] },
      { id: 'f02b6-eafp', pergunta: 'Por que Python favorece EAFP em vez de LBYL (if path.exists(): ler(path))?',
        opcoes: [
          opc('a', 'A verificação prévia é uma corrida (TOCTOU), duplica a lógica do open e não cobre permissão ou disco', true, 'exceção à regra: verificação barata, sem corrida, que melhora a mensagem.'),
          opc('b', 'Porque try é mais rápido mesmo quando levanta', false, 'sem exceção o try custa quase zero; levantar custa mais.'),
          opc('c', 'Porque exists() não existe em pathlib', false, 'existe; o problema é a corrida.')] }
    ],
    abas: [
      { rotulo: 'O modelo', blocos: [
        { tipo: 'texto', html:
          '<h3>Quem captura o quê, onde, e o que sobrevive</h3>' +
          '<p>Software de produção é, em boa parte, tratamento de falha: arquivo ausente, byte inválido, valor fora do domínio, disco cheio. A linguagem oferece exceções; o que separa código robusto de código frágil é <em>quem</em> captura <em>o quê</em>, <em>onde</em>, e <em>que informação sobrevive</em> até o ponto em que alguém pode agir. Dois extremos produzem os piores sistemas: o <code>except: pass</code> que apaga o erro, e o programa que despeja um traceback cru para o usuário.</p>' +
          '<h3>Levantar, desenrolar, capturar</h3>' +
          '<p>Uma exceção é um objeto (instância de <code>BaseException</code>) levantado com <code>raise</code>. Quando isso ocorre, a execução abandona a linha atual e <strong>desenrola a pilha</strong>: sobe frame a frame procurando um <code>except</code> cujo tipo case; se nenhum casa, o programa termina com o traceback e exit code 1 (F01). Se <code>g</code> levanta e <code>f</code> não tem <code>except</code>, <code>g</code> e <code>f</code> saem da pilha (rodando o <code>finally</code> que tiverem) até <code>main</code>, que captura e segue. O objeto carrega a mensagem (<code>args</code>), o <code>__traceback__</code> e, quando encadeado, <code>__cause__</code> e <code>__context__</code>.</p>' +
          '<p>A hierarquia padrão tem uma divisão fundamental:</p>' },
        { tipo: 'codigo', linguagem: 'text', texto:
          'BaseException\n ├─ SystemExit, KeyboardInterrupt, GeneratorExit      (NÃO capture, em geral)\n └─ Exception\n     ├─ ArithmeticError (ZeroDivisionError, OverflowError)\n     ├─ LookupError (KeyError, IndexError)\n     ├─ OSError (FileNotFoundError, PermissionError, ...)\n     ├─ ValueError (UnicodeError → UnicodeDecodeError)\n     ├─ TypeError, AttributeError, RuntimeError, ...\n     └─ as suas, derivadas de Exception\n\n>>> [c.__name__ for c in FileNotFoundError.__mro__]\n[\'FileNotFoundError\', \'OSError\', \'Exception\', \'BaseException\', \'object\']\n>>> [c.__name__ for c in KeyError.__mro__]\n[\'KeyError\', \'LookupError\', \'Exception\', \'BaseException\', \'object\']' },
        { tipo: 'texto', html:
          '<p><code>SystemExit</code> e <code>KeyboardInterrupt</code> ficam fora de <code>Exception</code> de propósito, para que um <code>except Exception</code> não impeça o programa de terminar nem o usuário de interromper com Ctrl+C. Capturar a superclasse captura toda a família: <code>except OSError</code> pega <code>FileNotFoundError</code> e <code>PermissionError</code>; <code>except LookupError</code> pega <code>KeyError</code> e <code>IndexError</code>.</p>' +
          '<h3><code>try</code>, <code>except</code>, <code>else</code>, <code>finally</code></h3>' },
        { tipo: 'texto', largo: true, html:
          '<table><thead><tr><th>Cláusula</th><th>Executa quando</th><th>Use para</th></tr></thead><tbody>' +
          '<tr><td><code>try</code></td><td>sempre começa</td><td>só o mínimo que pode falhar</td></tr>' +
          '<tr><td><code>except T as e</code></td><td>o <code>try</code> levantou algo que casa com <code>T</code> (primeiro que casar, de cima para baixo)</td><td>tratar ou traduzir o erro</td></tr>' +
          '<tr><td><code>else</code></td><td>o <code>try</code> terminou <em>sem</em> exceção</td><td>o que depende do sucesso e não deve ser protegido pelo <code>except</code></td></tr>' +
          '<tr><td><code>finally</code></td><td>sempre, ao sair do bloco (sucesso, erro, <code>return</code>)</td><td>limpeza que não pode faltar</td></tr></tbody></table>' +
          '<p>O <code>finally</code> roda <em>antes</em> de o valor ser entregue ao chamador: <code>def f(): try: return "try" finally: print("finally roda")</code> imprime "finally roda" e depois devolve <code>\'try\'</code>. O <code>else</code> existe para que o escopo do <code>except</code> seja estreito: se você coloca no <code>try</code> também a lógica posterior, um erro nela é capturado pelo handler pensado para outra coisa e mascarado.</p>' +
          '<ul><li><strong>Capture o tipo mais específico</strong> que você sabe tratar. <code>except Exception</code> só na fronteira de um processo ou de uma tarefa (para registrar e seguir ou terminar com código de erro), nunca no meio da lógica.</li>' +
          '<li><strong><code>except:</code> sem tipo</strong> captura inclusive <code>KeyboardInterrupt</code>; <code>except Exception: pass</code> apaga evidência. Se não sabe tratar, não capture: deixe subir.</li>' +
          '<li><strong>Mantenha o <code>try</code> curto</strong>: a linha que falha, não a função inteira.</li>' +
          '<li>No Python 3.14 vários tipos podem ser listados sem parênteses (PEP 758): <code>except ValueError, TypeError:</code> (sem <code>as</code>); o formato com parênteses continua válido e é o que funciona em versões anteriores.</li></ul>' },
        { tipo: 'escolha', id: 'f02b6-esc-ordem', titulo: 'Confira: o que sai na tela',
          pergunta: 'Em try: print("a") / except: print("b") / else: print("c") / finally: print("d"), sem nenhuma exceção, o que sai na tela?',
          opcoes: [
            { id: 'a', texto: 'a d', correta: false, porque: 'sem exceção, o else também roda.' },
            { id: 'b', texto: 'a b d', correta: false, porque: 'o except só roda se o try levantar.' },
            { id: 'c', texto: 'a c d', correta: true, porque: 'roda o try, depois o else, e por fim o finally, que roda sempre (com ou sem erro, com ou sem return).' },
            { id: 'd', texto: 'a c', correta: false, porque: 'o finally roda sempre.' }
          ], tutorDepois: 'O else mantém o try curto: só o que pode falhar fica dentro.' },
        { tipo: 'takeaway', html: 'Exceção é um objeto que <mark>desenrola a pilha</mark> até um <code>except</code> que case; <code>Exception</code> é a raiz do que é seu, <code>BaseException</code> inclui o que <mark>não se captura</mark>.' }
      ] },

      { rotulo: 'Desenhar os erros', blocos: [
        { tipo: 'texto', html:
          '<h3>Encadear: <code>raise ... from</code></h3>' +
          '<p>Camadas de código traduzem erros: o parser vê um <code>ValueError</code>; o domínio quer um <code>InvalidRowError</code> com linha e campo. Se você levanta uma nova exceção dentro de um <code>except</code>, o Python guarda a original em <code>__context__</code> ("durante o tratamento de X, ocorreu Y"). Com <code>raise Nova from original</code>, a relação é declarada: grava <code>__cause__</code> ("Y foi causado diretamente por X"), e o traceback mostra as duas.</p>' },
        { tipo: 'codigo', linguagem: 'python', texto:
          '>>> try:\n...     try: int("x")\n...     except ValueError as e: raise RuntimeError("config inválida") from e\n... except RuntimeError as e:\n...     print(repr(e), "| cause:", repr(e.__cause__))\nRuntimeError(\'config inválida\') | cause: ValueError("invalid literal for int() with base 10: \'x\'")' },
        { tipo: 'complete', id: 'f02b6-complete', titulo: 'Traduza na fronteira, preservando a causa', obrigatorio: false,
          enunciado: 'Complete a tradução do erro do parser para o erro de domínio, sem perder a causa original.',
          linguagem: 'python',
          partes: [
            'def parse_amount(line, texto):\n    try:\n        return Decimal(texto)\n    ',
            { lacuna: 'exc', opcoes: ['except InvalidOperation as err:', 'except:', 'except BaseException:'], correta: 0 },
            '\n        raise InvalidRowError(line, "amount", f"valor inválido: {texto!r}") ',
            { lacuna: 'from', opcoes: ['from err', 'from None', 'and err'], correta: 0 },
            '\n'
          ],
          explicacao: 'Capture o tipo específico que o parser levanta (InvalidOperation) e declare a causa com from err: o traceback mostra as duas. from None só serve quando a causa é ruído; except: sem tipo engoliria até Ctrl+C.' },
        { tipo: 'texto', html:
          '<p><code>raise X from None</code> suprime o encadeamento (use quando a causa é ruído, não informação). Para anexar contexto sem trocar de tipo: <code>e.add_note("linha 9 do arquivo")</code> e <code>raise</code> (as notas aparecem no traceback). Para vários erros simultâneos (tarefas concorrentes, validação em lote), existe <code>ExceptionGroup</code> com <code>except*</code>, que separa por tipo; o uso principal é concorrência estruturada (<code>asyncio.TaskGroup</code>, M02).</p>' },
        { tipo: 'codigo', linguagem: 'python', texto:
          '>>> try:\n...     raise ExceptionGroup("lote", [ValueError("a"), TypeError("b"), ValueError("c")])\n... except* ValueError as eg: print("VE", [str(e) for e in eg.exceptions])\n... except* TypeError as eg: print("TE", [str(e) for e in eg.exceptions])\nVE [\'a\', \'c\']\nTE [\'b\']' },
        { tipo: 'texto', html:
          '<h3>Exceções próprias: desenhe a hierarquia</h3>' +
          '<p>Uma biblioteca ou módulo deve ter <strong>uma exceção-base</strong> sua, para que o chamador capture a família inteira sem capturar <code>Exception</code>. As subclasses carregam <em>dados estruturados</em> como atributos, além do texto, porque quem trata precisa de campos, não de <code>regex</code> sobre mensagem. Assim é o <code>errors.py</code> do laboratório:</p>' },
        { tipo: 'codigo', linguagem: 'python', texto:
          'class ExpensesError(Exception):\n    """Base class for every error this package raises on purpose."""\n\nclass MissingColumnError(ExpensesError):\n    def __init__(self, columns: list[str]) -> None:\n        self.columns = columns\n        super().__init__("colunas obrigatórias ausentes: " + ", ".join(columns))\n\nclass InvalidRowError(ExpensesError):\n    def __init__(self, line: int, field: str, message: str) -> None:\n        self.line, self.field, self.message = line, field, message\n        super().__init__(f"linha {line}, campo {field!r}: {message}")' },
        { tipo: 'texto', html:
          '<p>O nome termina em <code>Error</code>, descreve a falha (não o lugar), e a mensagem está em português porque a CLI a mostra ao usuário. A CLI mapeia a hierarquia para o contrato de exit codes do F01: <code>0</code> tudo válido; <code>1</code> dados inválidos; <code>2</code> problema de uso ou ambiente (arquivo ausente, encoding errado, coluna faltando). Sem a base comum, esse mapeamento seria uma lista de tipos; com ela, <code>except ExpensesError</code> cobre o domínio e <code>FileNotFoundError</code> é tratado à parte.</p>' +
          '<h3>EAFP versus LBYL</h3>' +
          '<p><strong>LBYL</strong> ("look before you leap") verifica antes: <code>if path.exists(): ler(path)</code>. <strong>EAFP</strong> ("easier to ask forgiveness than permission") tenta e trata: <code>try: ler(path) except FileNotFoundError: ...</code>. Python favorece EAFP, por razões mecânicas: a verificação prévia é uma <em>corrida</em> (o arquivo pode sumir entre o <code>exists()</code> e o <code>open()</code>, TOCTOU), duplica a lógica que o próprio <code>open</code> já faz, e não cobre as outras falhas (permissão, disco). Exceção à regra: quando a verificação é barata, sem corrida e melhora a mensagem (validar entrada de usuário antes de gastar trabalho). Em CPython 3.11+ o <code>try</code> sem exceção custa praticamente zero; levantar custa mais, então use o fluxo normal para o caso comum (<code>dict.get</code> / <code>in</code> quando a ausência é frequente).</p>' },
        { tipo: 'abas', rotulo: 'LBYL e EAFP', itens: [
          { rotulo: 'LBYL (olhe antes)', blocos: [{ tipo: 'codigo', linguagem: 'python', texto: 'if "chave" in d:\n    valor = d["chave"]\nelse:\n    valor = padrao' }, { tipo: 'texto', html: '<p>Duas consultas e uma janela de corrida em dados compartilhados (o estado pode mudar entre o teste e o uso).</p>' }] },
          { rotulo: 'EAFP (peça perdão)', blocos: [{ tipo: 'codigo', linguagem: 'python', texto: 'try:\n    valor = d["chave"]\nexcept KeyError:\n    valor = padrao' }, { tipo: 'texto', html: '<p>Idiomático em Python e atômico para o caso comum; reserve para falhas raras. Para este caso específico, <code>d.get("chave", padrao)</code> é ainda mais simples.</p>' }] }
        ] },
        { tipo: 'texto', html:
          '<p>Há um terceiro modo, usado pelo <code>scan</code>: <em>erros como valores</em>. Quando falhas são esperadas, numerosas e não devem interromper o fluxo (linhas inválidas num CSV), devolver o erro como item do resultado evita um <code>try</code> por elemento e deixa o chamador decidir (estrito ou tolerante). Lançar é melhor para o caso excepcional que torna o resto inútil (coluna ausente).</p>' },
        { tipo: 'cenario', id: 'f02b6-cenario', titulo: 'A CLI que despeja traceback', obrigatorio: false,
          enunciado: 'A CLI de relatório mostra um traceback cru quando uma linha do CSV é inválida, e um agente propõe uma correção. Escolha.',
          inicio: 'inicio',
          nos: {
            inicio: { texto: 'Uma linha com amount "abc" derruba o programa com traceback e exit code 1. O que fazer?', opcoes: [
              { texto: 'Envolver main() em except Exception: pass para o programa nunca quebrar.', vai: 'f-pass', tom: 'ruim', consequencia: 'o erro some, o relatório sai errado e o exit code é 0.' },
              { texto: 'Levantar InvalidRowError(line, field, message) na borda do parser e capturar ExpensesError na CLI.', vai: 'saida', tom: 'ok', consequencia: 'a CLI mostra "linha 6, campo amount: valor inválido" e decide o exit code.' }
            ] },
            saida: { texto: 'O arquivo estava em Latin-1 e o UTF-8 estrito falhou na decodificação. Que exit code e mensagem?', opcoes: [
              { texto: 'Exit code 1, como qualquer dado inválido.', vai: 'f-um', tom: 'ruim', consequencia: 'o CI não distingue dado ruim de ambiente errado.' },
              { texto: 'Traduzir para EncodingMismatchError com raise from, exit code 2 e a mensagem com o byte e a posição.', vai: 'f-bom', tom: 'ok', consequencia: 'é problema de ambiente, não de dado, e a causa original fica no traceback.' }
            ] }
          },
          finais: {
            'f-bom': { bom: true, texto: '0 tudo válido; 1 dados inválidos; 2 uso ou ambiente: o contrato do F01, mapeado a partir da hierarquia.' },
            'f-pass': { bom: false, texto: 'except Exception: pass apaga evidência: nada fica registrado e o sistema segue errado.' },
            'f-um': { bom: false, texto: 'Funciona, mas mistura classes de falha que quem automatiza precisa separar.' }
          },
          callout: 'Você traduziu na fronteira e deixou a hierarquia decidir o exit code.' },
        { tipo: 'takeaway', html: 'Defina uma <mark>exceção-base por pacote</mark>, dê <mark>atributos</mark> às subclasses e preserve a causa com <mark>raise from</mark>; prefira EAFP, e use erros como valores quando falhar é esperado e em volume.' }
      ] },

      { rotulo: 'Context managers', blocos: [
        { tipo: 'texto', html:
          '<h3>Limpeza como protocolo</h3>' +
          '<p>O <code>with</code> garante que a limpeza ocorra, e é a forma correta de segurar recursos (arquivo, lock, conexão, transação, diretório temporário). O protocolo tem dois métodos: <code>__enter__()</code> (devolve o valor de <code>as</code>) e <code>__exit__(tipo, valor, tb)</code>, chamado <em>sempre</em> ao sair do bloco; se <code>__exit__</code> devolver verdadeiro, a exceção é <strong>suprimida</strong>.</p>' },
        { tipo: 'codigo', linguagem: 'python', texto:
          'class A:\n    def __enter__(self): print("enter"); return self\n    def __exit__(self, t, v, tb): print("exit", t.__name__ if t else None); return True\n\n>>> with A(): raise RuntimeError\nenter\nexit RuntimeError\n>>> print("seguiu: __exit__ engoliu")\nseguiu: __exit__ engoliu' },
        { tipo: 'texto', html:
          '<p>A forma curta é <code>contextlib.contextmanager</code>, em que um gerador com um único <code>yield</code> faz as vezes de enter/exit (o código antes do <code>yield</code> é o enter; o depois, dentro de <code>try/finally</code>, é o exit). <code>contextlib.suppress(FileNotFoundError)</code> ignora um tipo específico de forma explícita, e <code>ExitStack</code> compõe um número dinâmico de contextos.</p>' },
        { tipo: 'codigo', linguagem: 'python', texto:
          'from contextlib import contextmanager\n\n@contextmanager\ndef cm():\n    print("antes")\n    try:\n        yield 1\n    finally:\n        print("depois")\n\n>>> with cm() as v: print(v)\nantes\n1\ndepois' },
        { tipo: 'texto', html:
          '<h3>Exemplo trabalhado: gravar um arquivo de forma atômica</h3>' +
          '<p>Problema: gravar o relatório JSON sem nunca deixar um arquivo pela metade. Com <code>open(alvo, "w")</code>, o arquivo é <em>truncado ao abrir</em>; se o programa falhar no meio, o conteúdo antigo já foi destruído. A solução do laboratório é um context manager que escreve num temporário ao lado e só no fim <strong>renomeia</strong> sobre o alvo (<code>os.replace</code> é atômico no mesmo sistema de arquivos). Preveja o que o arquivo contém depois de uma falha no meio da escrita, nas duas versões.</p>' },
        { tipo: 'rode', id: 'f02b6-rode', titulo: 'Escrita atômica contra open("w")', enunciado: 'Rode o experimento: o corpo do <code>with</code> escreve "metade" e levanta <code>RuntimeError("boom")</code>. O arquivo de saída tinha "antigo".',
          prefixo: '$', entrada: 'python atomico.py', unidade: 'etapa', terminalTitulo: 'terminal',
          etapas: [
            { id: 'antes', nome: 'Estado inicial', descricao: 'out.txt = "antigo"', tom: 'dns', ms: 1, linhas: [
              L('cmd', 'cat out.txt'), L('out', 'antigo')] },
            { id: 'atomico', nome: 'AtomicWriter', descricao: 'Escreve em out.txt.tmp', tom: 'tcp', ms: 2, linhas: [
              L('info', 'with AtomicWriter(out) as f: f.write("metade"); raise RuntimeError("boom")'),
              L('out', 'RuntimeError: boom   (a exceção original NÃO é suprimida)'),
              L('cmd', 'cat out.txt; ls out.txt.tmp'),
              L('in', 'antigo'),
              L('in', "ls: cannot access 'out.txt.tmp': No such file or directory"),
              L('hint', '__exit__ viu a exceção, descartou o temporário e não trocou o destino')] },
            { id: 'ingenuo', nome: 'open(alvo, "w")', descricao: 'Trunca ao abrir', tom: 'tls', ms: 3, linhas: [
              L('info', 'with open(out, "w") as f: f.write("metade"); raise RuntimeError("boom")'),
              L('cmd', 'cat out.txt'),
              L('in', 'metade'),
              L('hint', 'o conteúdo antigo foi destruído; o teste de controle negativo prova isso')] }
          ],
          prever: { pergunta: 'Depois do RuntimeError dentro do with, o que out.txt contém na versão com AtomicWriter e na com open("w")?', opcoes: [
            { id: 'a', texto: 'Nas duas: "metade", porque a escrita já aconteceu.', correta: false, porque: 'no AtomicWriter a escrita foi no temporário, descartado na falha.' },
            { id: 'b', texto: 'Com AtomicWriter: "antigo". Com open("w"): "metade".', correta: true, porque: 'open("w") trunca ao abrir; o AtomicWriter só faz os.replace no sucesso.' },
            { id: 'c', texto: 'Nas duas: "antigo", porque a exceção desfaz a escrita.', correta: false, porque: 'exceção não desfaz escrita em arquivo; só o desenho atômico protege.' }
          ] },
          tutorAntes: 'Digite o comando já preenchido e aperte Enter. Clique em "open(alvo, w)" para ver o contraste.',
          tutorDepois: 'Os testes do laboratório cobrem os quatro papéis: caminho feliz (test_atomic_writer_commits_on_success), falha injetada (o corpo levanta RuntimeError("boom") e o arquivo antigo permanece, sem sobra de .tmp) e o controle negativo, que prova que o teste consegue falhar: a mesma falha com open comum destrói o conteúdo.',
          callout: 'Você viu o destino intacto depois da falha, e o desenho ingênuo destruí-lo.' },
        { tipo: 'python', id: 'f02b6-python', titulo: 'Escreva o AtomicWriter', obrigatorio: false,
          enunciado: 'Complete <code>__exit__</code> de <code>AtomicWriter</code>: feche o handle; se não houve exceção (<code>exc_type is None</code>), troque o temporário sobre o alvo com <code>os.replace</code>; se houve, apague o temporário (<code>unlink(missing_ok=True)</code>). Devolva <code>None</code>: a exceção original <strong>não</strong> pode ser suprimida.',
          codigo: J([
            'import os',
            'import tempfile',
            'from pathlib import Path',
            '',
            '',
            'class AtomicWriter:',
            '    def __init__(self, target, *, encoding="utf-8"):',
            '        self.target = Path(target)',
            '        self.encoding = encoding',
            '        self._tmp = self.target.with_name(self.target.name + ".tmp")',
            '        self._handle = None',
            '',
            '    def __enter__(self):',
            '        self._handle = self._tmp.open("w", encoding=self.encoding, newline="\\n")',
            '        return self._handle',
            '',
            '    def __exit__(self, exc_type, exc, tb):',
            '        # 1. feche o handle',
            '        # 2. sucesso: os.replace(self._tmp, self.target)',
            '        # 3. falha: apague o temporario (missing_ok=True)',
            '        # 4. devolva None: nao suprima a excecao',
            '        pass'
          ]),
          testes: J([
            'def _dir():',
            '    return Path(tempfile.mkdtemp())',
            '',
            '',
            'def test_sucesso_troca_o_arquivo():',
            '    alvo = _dir() / "out.txt"',
            '    with AtomicWriter(alvo) as f:',
            '        f.write("novo")',
            '    assert alvo.read_text(encoding="utf-8") == "novo"',
            '    assert not alvo.with_name("out.txt.tmp").exists()',
            '',
            '',
            'def test_falha_preserva_o_antigo_e_nao_deixa_tmp():',
            '    alvo = _dir() / "out.txt"',
            '    alvo.write_text("antigo", encoding="utf-8")',
            '    try:',
            '        with AtomicWriter(alvo) as f:',
            '            f.write("metade")',
            '            raise RuntimeError("boom")',
            '    except RuntimeError:',
            '        pass',
            '    assert alvo.read_text(encoding="utf-8") == "antigo"',
            '    assert not alvo.with_name("out.txt.tmp").exists()',
            '',
            '',
            'def test_a_excecao_original_nao_e_suprimida():',
            '    alvo = _dir() / "out.txt"',
            '    try:',
            '        with AtomicWriter(alvo):',
            '            raise KeyError("x")',
            '    except KeyError:',
            '        return',
            '    raise AssertionError("a excecao foi engolida")',
            '',
            '',
            'def test_destino_inexistente_continua_inexistente_apos_falha():',
            '    alvo = _dir() / "novo.txt"',
            '    try:',
            '        with AtomicWriter(alvo) as f:',
            '            f.write("x")',
            '            raise RuntimeError("boom")',
            '    except RuntimeError:',
            '        pass',
            '    assert not alvo.exists()',
            '',
            '',
            'def test_controle_negativo_open_comum_destroi_o_antigo():',
            '    alvo = _dir() / "out.txt"',
            '    alvo.write_text("antigo", encoding="utf-8")',
            '    try:',
            '        with alvo.open("w", encoding="utf-8") as f:',
            '            f.write("metade")',
            '            raise RuntimeError("boom")',
            '    except RuntimeError:',
            '        pass',
            '    assert alvo.read_text(encoding="utf-8") == "metade"'
          ]),
          dica: 'Comece com <code>if self._handle is not None: self._handle.close()</code>. Depois <code>if exc_type is None: os.replace(self._tmp, self.target)</code> e, no <code>else</code>, <code>self._tmp.unlink(missing_ok=True)</code>. Não escreva <code>return True</code>.',
          solucao: J([
            'import os',
            'import tempfile',
            'from pathlib import Path',
            '',
            '',
            'class AtomicWriter:',
            '    def __init__(self, target, *, encoding="utf-8"):',
            '        self.target = Path(target)',
            '        self.encoding = encoding',
            '        self._tmp = self.target.with_name(self.target.name + ".tmp")',
            '        self._handle = None',
            '',
            '    def __enter__(self):',
            '        self._handle = self._tmp.open("w", encoding=self.encoding, newline="\\n")',
            '        return self._handle',
            '',
            '    def __exit__(self, exc_type, exc, tb):',
            '        if self._handle is not None:',
            '            self._handle.close()',
            '        if exc_type is None:',
            '            os.replace(self._tmp, self.target)',
            '        else:',
            '            self._tmp.unlink(missing_ok=True)'
          ]),
          tutorDepois: 'Três detalhes de projeto: o __exit__ devolve None, então a exceção original não é suprimida (um context manager de limpeza nunca deve esconder a falha); newline="\\n" e encoding explícito tornam a saída idêntica em qualquer sistema; e o laboratório traduz OSError para ExportError com raise from.',
          callout: 'A limpeza roda sempre e a falha continua visível.' },
        { tipo: 'takeaway', html: 'Context manager garante <mark>limpeza</mark> e não deve <mark>suprimir</mark> o que não conhece; a escrita atômica troca o destino só no <mark>sucesso</mark> (<code>os.replace</code>).' }
      ] },

      { rotulo: 'Conferir', blocos: [
        { tipo: 'texto', html:
          '<h3>Decisões e erros comuns</h3>' +
          '<ul><li><strong>Traduza na fronteira entre camadas</strong> (<code>OSError</code> → <code>ExportError</code>, <code>ValueError</code> → <code>InvalidRowError</code>), sempre com <code>from</code>.</li>' +
          '<li><strong>Não use exceção para fluxo normal</strong> frequente nem para devolver status; também não devolva <code>None</code>/<code>-1</code>/<code>False</code> para sinalizar erro que o chamador pode esquecer de checar.</li>' +
          '<li><strong><code>assert</code> não é validação de entrada</strong>: some com <code>python -O</code>. Use-o para invariantes internas (e nos testes); valide entrada com <code>if ... raise</code>.</li>' +
          '<li><strong>Log e relance, não log e engula</strong>; e registre a exceção uma vez só, na fronteira.</li>' +
          '<li><strong>Mensagens com dados e ação:</strong> "linha 6, campo \'amount\': valor inválido: \'abc\'" diz onde e o quê.</li></ul>' },
        { tipo: 'callout', tom: 'danger', titulo: 'Armadilha que pega sênior: __exit__ que devolve verdadeiro, e except largo demais, engolem bugs', html:
          '<p>Um <code>__exit__</code> terminado em <code>return True</code> (ou um <code>@contextmanager</code> com <code>except Exception: pass</code> em volta do <code>yield</code>) transforma o bloco <code>with</code> em um buraco negro: qualquer erro do corpo, inclusive um <code>NameError</code> por typo, desaparece e o programa "segue". Revise todo gerenciador de contexto procurando o retorno e o que o <code>except</code> captura. A regra: suprima só um tipo conhecido (<code>suppress(FileNotFoundError)</code>), nunca "tudo". E vale o corolário do bloco 3: <code>return</code>/<code>continue</code> em <code>finally</code> faz o mesmo e hoje gera <code>SyntaxWarning</code>.</p>' },
        { tipo: 'escolha', id: 'f02b6-esc-base', titulo: 'Confira: o Ctrl+C',
          pergunta: 'except Exception: captura a interrupção do usuário com Ctrl+C?',
          opcoes: [
            { id: 'a', texto: 'Sim, qualquer erro é Exception', correta: false, porque: 'KeyboardInterrupt, SystemExit e GeneratorExit não são Exception.' },
            { id: 'b', texto: 'Não: KeyboardInterrupt herda de BaseException, fora de Exception', correta: true, porque: 'por isso except Exception é seguro, enquanto except: sem tipo (ou BaseException) engole o Ctrl+C e impede o programa de encerrar.' },
            { id: 'c', texto: 'Sim, mas só dentro de laços', correta: false, porque: 'a hierarquia não depende do contexto.' },
            { id: 'd', texto: 'Depende da versão do sistema operacional', correta: false, porque: 'a hierarquia é da linguagem, não do SO.' }
          ], tutorDepois: 'BaseException é a raiz de tudo; Exception é a raiz do que é "erro de programa".' },
        { tipo: 'texto', html: '<p class="ta-nota">Saídas de execução real em 11/10/2026 com Python 3.14.7. A sintaxe de <code>except</code> sem parênteses (PEP 758) e o aviso de <code>finally</code> (PEP 765) são do 3.14.</p>' },
        { tipo: 'takeaway', html: 'Suprima só um <mark>tipo conhecido</mark>; <mark>log e relance</mark>, não log e engula; <code>assert</code> não valida entrada.' }
      ] }
    ]
  });
})();
