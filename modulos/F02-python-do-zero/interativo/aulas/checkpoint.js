/* F02 · Checkpoint: dez cenários, avaliação sem consulta. Fonte: F02.html#checkpoint. Rubrica = "Basta"; modelo = resposta esperada + "Reprova". */
(function () {
  var reprova = function (t) { return '<p><strong>Reprova:</strong> ' + t + '</p>'; };
  function opc(id, texto, correta, porque) { return { id: id, texto: texto, correta: correta, porque: porque }; }

  TrilhaAula.registrar({
    id: 'f02-checkpoint',
    titulo: 'Checkpoint F02',
    minutos: 60,
    resumo: 'Dez cenários de Python do zero, sem consulta. Responda com as suas palavras, pelo mecanismo, e confira com a rubrica.',
    objetivo: 'Verificar, sem consulta, se você diagnostica ambiente e caminho de busca, raciocina com o modelo de objetos, trata dinheiro e texto com o tipo certo, escolhe coleções pelo custo, entende geradores, desenha exceções, grava arquivos com segurança, desfaz ciclos de import e julga se um teste consegue falhar.',
    revisao: [
      { id: 'f02cp-lru', pergunta: 'Quando functools.lru_cache é a ferramenta certa para um cache em vez de def f(x, cache={})?',
        opcoes: [
          opc('a', 'Quando os argumentos são hashable e o cache tem limite (maxsize); o default mutável persiste porque é avaliado uma vez no def', true, 'o cache vive tanto quanto a função: sem limite, vaza memória em processo longo.'),
          opc('b', 'Sempre, para qualquer argumento, inclusive listas', false, 'argumentos precisam ser hashable.'),
          opc('c', 'Nunca: cache em função é proibido', false, 'é uma técnica válida; o erro é o default mutável.')] },
      { id: 'f02cp-ordem', pergunta: 'Como deduplicar uma lista preservando a ordem de inserção?',
        opcoes: [
          opc('a', 'dict.fromkeys(itens)', true, 'o set não tem ordem garantida; o dict preserva a inserção desde o 3.7.'),
          opc('b', 'set(itens)', false, 'a ordem de iteração do set não é garantida.'),
          opc('c', 'sorted(itens)', false, 'ordena, não preserva a ordem original.')] },
      { id: 'f02cp-exit', pergunta: 'Qual o mapeamento coerente de exit codes de uma CLI de importação?',
        opcoes: [
          opc('a', '0 tudo válido; 1 dados inválidos; 2 problema de uso ou ambiente (arquivo ausente, encoding errado, coluna faltando)', true, 'a hierarquia de exceções própria (base ExpensesError) torna esse mapeamento uma única captura.'),
          opc('b', '0 sucesso; 1 para qualquer falha', false, 'o CI não distingue dado ruim de ambiente errado.'),
          opc('c', 'Sempre 0, com a falha só no log', false, 'o exit code é o que shell, CI e agente enxergam.')] },
      { id: 'f02cp-negativo', pergunta: 'Para que serve um teste de controle negativo?',
        opcoes: [
          opc('a', 'Provar que o teste consegue falhar: a mesma falha, com a versão ingênua, quebra o comportamento', true, 'sem ele, não se sabe se o teste positivo verifica alguma coisa.'),
          opc('b', 'Aumentar a cobertura de linhas', false, 'cobertura é consequência, não objetivo.'),
          opc('c', 'Testar entradas negativas', false, 'não tem relação com o sinal dos números.')] },
      { id: 'f02cp-bom', pergunta: 'Um CSV do Excel brasileiro precisa ser lido com que parâmetros?',
        opcoes: [
          opc('a', 'encoding utf-8-sig (ou o declarado, como latin-1), newline="" e delimiter=";"', true, 'a vírgula é separador decimal na localidade brasileira, daí o ponto e vírgula.'),
          opc('b', 'encoding padrão e split(",")', false, 'depende da localidade e erra campos entre aspas.'),
          opc('c', 'Em binário, com errors="replace"', false, 'replace esconde o erro de decodificação.')] }
    ],
    abas: [
      { rotulo: 'Ambiente, objetos e dinheiro', blocos: [
        { tipo: 'texto', html:
          '<p>Uma pergunta por vez, sem consulta. Cada pergunta é um cenário; a rubrica diz o que <strong>basta</strong> e o modelo mostra uma resposta esperada e o que <strong>reprova</strong>. Reprovar é permitido: volte ao bloco indicado e tente de novo.</p>' },

        { tipo: 'escolha', id: 'cp-esc-p1', titulo: 'P1 · Aquecimento: o pip e o import',
          pergunta: 'O pip install funcionou, mas o import falha com ModuleNotFoundError. Qual é o primeiro passo?',
          opcoes: [
            { id: 'a', texto: 'Comparar sys.executable (quem roda) com python -m pip --version (quem instala) e instalar pelo interpretador.', correta: true, porque: 'o pip do PATH pode pertencer a outro Python; a correção é chamar o instalador pelo interpretador.' },
            { id: 'b', texto: 'Reinstalar o Python e todas as dependências.', correta: false, porque: 'trata o sintoma e apaga a evidência.' },
            { id: 'c', texto: 'Instalar com sudo no Python do sistema.', correta: false, porque: 'mistura dependências do projeto com as do SO.' }
          ] },
        { tipo: 'escreva', id: 'cp-p1', titulo: 'P1 · Qual Python é esse?', obrigatorio: false,
          enunciado: 'Um colega instala uma dependência, o <code>import</code> falha, e o <code>pytest</code> solto não acha o seu pacote enquanto <code>python -m pytest</code> acha. Explique os dois sintomas e a investigação. <em>Bloco 1.</em>',
          placeholder: 'O pip e o python são… sys.executable… O sys.path[0]…',
          rubrica: [
            'Interpretadores ou ambientes <strong>diferentes</strong>: compara <code>sys.executable</code> e <code>python -m pip --version</code>; instala com <code>python -m pip</code>.',
            '<code>sys.path[0]</code> é o <strong>diretório corrente</strong> com <code>-m</code> e a <strong>pasta do script</strong> com arquivo.',
            'Menciona <strong><code>uv</code>/venv por projeto</strong> (um projeto, um ambiente, um lockfile).'
          ],
          modelo: '<p>O <code>pip</code> do PATH pertence a outro Python que o que executa o código: comparo <code>sys.executable</code> com o caminho que <code>python -m pip --version</code> mostra e instalo sempre pelo interpretador (<code>python -m pip</code>, ou <code>uv add</code> / <code>uv run</code>). O segundo sintoma é <code>sys.path[0]</code>: com <code>python -m pytest</code> entra o diretório corrente, que é a raiz do projeto, e o pacote é achado; com o executável solto entra a pasta do script, que não é a raiz. Resolvo com ambiente virtual por projeto (<code>uv</code>) e o pacote instalado em modo editável, sem depender do diretório corrente.</p>' + reprova('"reinstale tudo".') },

        { tipo: 'escolha', id: 'cp-esc-p2', titulo: 'P2 · Aquecimento: mutar ou religar',
          pergunta: 'def f(l): l.append(1); l = [9] e q = []. Depois de f(q), o que vale q?',
          opcoes: [
            { id: 'a', texto: '[1]: o append muta o objeto compartilhado; atribuir a l só religa o nome local.', correta: true, porque: 'chamada por atribuição: mutar é visível de fora, religar não.' },
            { id: 'b', texto: '[]: a função trabalha numa cópia.', correta: false, porque: 'o parâmetro é outro nome para o mesmo objeto.' },
            { id: 'c', texto: '[9]: a religação vale para o chamador.', correta: false, porque: 'atribuir a l nunca altera q.' }
          ] },
        { tipo: 'escreva', id: 'cp-p2', titulo: 'P2 · Quem mudou a minha lista?', obrigatorio: false,
          enunciado: 'Uma função recebe uma lista e o chamador vê a lista alterada; em outra, atribuir ao parâmetro não altera nada. Explique com o modelo de objetos e diga o que <code>copy</code> e <code>deepcopy</code> mudam. <em>Blocos 2 e 4.</em>',
          placeholder: 'Nomes são rótulos… Mutar… Religar… copy… deepcopy…',
          rubrica: [
            'Nomes como <strong>rótulos</strong> presos a objetos; atribuir não copia.',
            '<strong>Chamada por atribuição</strong>: <strong>mutar</strong> o objeto é visível, <strong>religar</strong> o nome não.',
            'A <strong>cópia rasa</strong> compartilha o interior; a <strong>profunda</strong> duplica o grafo.'
          ],
          modelo: '<p>Variável é um rótulo ligado a um objeto; o parâmetro é um novo nome para o mesmo objeto (chamada por atribuição). <code>lst.append</code> muta o objeto compartilhado e o chamador vê; <code>lst = [9]</code> religa só o nome local e ninguém mais vê. <code>copy.copy</code> (ou <code>.copy()</code>) cria um contêiner novo que ainda compartilha os elementos mutáveis internos; <code>copy.deepcopy</code> duplica o grafo inteiro, ao custo proporcional ao tamanho.</p>' + reprova('"Python passa por referência" ou "por valor" sem mais.') },

        { tipo: 'escreva', id: 'cp-p3', titulo: 'P3 · O centavo que sumiu', obrigatorio: false,
          enunciado: 'Um total soma 0,10 dez vezes e o relatório de auditoria difere. Diagnostique, corrija e diga como o valor trafega pelo JSON. <em>Bloco 2.</em>',
          placeholder: 'O float é… Corrijo com… No JSON…',
          rubrica: [
            '<code>float</code> é <strong>binário</strong> (IEEE 754): 0.1 não tem representação finita.',
            '<code>Decimal</code> construído de <strong><code>str</code></strong> (ou inteiro de centavos); nunca <code>Decimal(0.1)</code>.',
            '<code>quantize</code> com o <strong>modo de arredondamento</strong> escolhido pela regra de negócio.',
            'No JSON, <strong>string</strong> decimal (ou centavos inteiros).',
            'Ressalva: o <code>sum()</code> de float usa soma compensada desde o 3.12 e <strong>mascara</strong> o erro; o laço manual ainda erra.'
          ],
          modelo: '<p>O <code>float</code> guarda o racional binário mais próximo de 0.1, então somas acumulam erro (o laço manual dá 0.9999999999999999). Uso <code>Decimal</code> construído de <code>str</code> (<code>Decimal("0.10")</code>) ou inteiros de centavos, e arredondo com <code>quantize</code> e o modo que a regra de negócio manda (<code>ROUND_HALF_UP</code>, por exemplo). No JSON, o dinheiro atravessa como string decimal, porque leitores converteriam um literal numérico para <code>float</code>. Desde o 3.12 o <code>sum()</code> de float usa soma compensada e devolve 1.0, o que mascara o defeito, mas ele continua em qualquer acumulador escrito à mão.</p>' + reprova('"use <code>round()</code>".') },

        { tipo: 'escreva', id: 'cp-p4', titulo: 'P4 · O cache que cresce', obrigatorio: false,
          enunciado: 'Uma função com <code>def f(x, cache={})</code> "funciona" e depois vaza memória e mistura resultados. Explique o mecanismo, a correção e quando <code>lru_cache</code> é a ferramenta certa. <em>Bloco 3.</em>',
          placeholder: 'O default é avaliado… A correção… lru_cache…',
          rubrica: [
            'O default é <strong>avaliado uma vez</strong>, quando o <code>def</code> executa, e fica em <code>f.__defaults__</code>.',
            '<strong><code>None</code></strong> como sentinela e criar o contêiner dentro da função.',
            '<code>lru_cache(maxsize=...)</code> com argumentos <strong>hashable</strong> e <strong>limite</strong>, ciente de que vive tanto quanto a função.'
          ],
          modelo: '<p>O <code>def</code> executa uma vez e avalia o default naquele momento; o dicionário fica em <code>f.__defaults__</code> e é compartilhado por todas as chamadas, por isso persiste, mistura resultados e cresce sem limite. A correção é <code>cache=None</code> e criar o contêiner dentro (ou uma sentinela própria se <code>None</code> for valor legítimo). Para memoização, <code>functools.lru_cache(maxsize=...)</code> é a ferramenta certa quando os argumentos são hashable e há um limite, lembrando que o cache vive tanto quanto a função.</p>' + reprova('não explicar por que o dicionário persiste.') },
        { tipo: 'takeaway', html: 'Ambiente: <mark>quem roda</mark> e <mark>de onde carrega</mark>. Objetos: <mark>mutar</mark> versus <mark>religar</mark>. Dinheiro: <mark>Decimal de str</mark>. Default: <mark>avaliado uma vez</mark>.' }
      ] },

      { rotulo: 'Coleções, iteração e erros', blocos: [
        { tipo: 'escolha', id: 'cp-esc-p5', titulo: 'P5 · Aquecimento: lista ou conjunto',
          pergunta: 'Um laço de 1 milhão de linhas faz if id in ids_validos, com ids_validos uma lista. Qual é a correção?',
          opcoes: [
            { id: 'a', texto: 'Converter uma vez para set (ou dict): pertinência O(1) médio em vez de O(n).', correta: true, porque: 'a correção não serve se a ordem importa (use dict.fromkeys) ou se os elementos não são hashable.' },
            { id: 'b', texto: 'Ordenar a lista a cada iteração.', correta: false, porque: 'ordenar é O(n log n) por volta e piora tudo.' },
            { id: 'c', texto: 'Trocar o laço por uma comprehension.', correta: false, porque: 'a busca continua linear dentro dela.' }
          ] },
        { tipo: 'escreva', id: 'cp-p5', titulo: 'P5 · Lista ou conjunto?', obrigatorio: false,
          enunciado: 'Um laço de 1 milhão de linhas faz <code>if id in ids_validos</code> com <code>ids_validos</code> lista. Estime o custo, corrija, e diga quando a correção <em>não</em> serve (ordem, elementos não hashable, memória). <em>Bloco 4.</em>',
          placeholder: 'O custo é… Converto para… Não serve quando…',
          rubrica: [
            '<strong>O(n)</strong> por busca contra <strong>O(1) médio</strong> no conjunto: o laço vira O(n²).',
            '<strong>Conversão única</strong> para <code>set</code>/<code>dict</code> fora do laço.',
            'O contrato <strong><code>==</code>/<code>hash</code></strong> e a exigência de elementos hashable.',
            '<code>dict.fromkeys</code> quando a <strong>ordem</strong> importa; custo extra de <strong>memória</strong>.'
          ],
          modelo: '<p>Cada <code>in</code> numa lista varre até achar, O(n); com 1 milhão de linhas e uma lista grande o laço vira O(n²). Converto <code>ids_validos</code> uma vez para <code>set</code> (ou <code>dict</code>), com busca por hash de O(1) médio, apoiada no contrato de que valores iguais têm o mesmo hash. Não serve quando os elementos não são hashable (listas), quando a ordem importa (use <code>dict.fromkeys</code>, que deduplica preservando a inserção) ou quando a memória é a restrição, porque a tabela de hash ocupa bem mais que a lista.</p>' + reprova('"set é sempre melhor".') },

        { tipo: 'escreva', id: 'cp-p6', titulo: 'P6 · O gerador mudo', obrigatorio: false,
          enunciado: 'Uma função devolve um gerador que lê um arquivo; o erro de arquivo inexistente só aparece num módulo distante, e uma segunda varredura vem vazia. Explique ambos e o desenho que corrige. <em>Bloco 5.</em>',
          placeholder: 'O corpo só roda… O gerador é… Para falhar cedo…',
          rubrica: [
            'O corpo da função geradora roda <strong>sob demanda</strong>, no primeiro <code>next()</code>; chamar só cria o gerador.',
            'Gerador é <strong>passagem única</strong>: esgotado, devolve vazio; guarde lista ou crie outro.',
            '<strong>Validar fora do gerador</strong> (função comum que devolve o gerador) ou tratar o erro onde se consome.',
            '<code>closing</code>/<code>with</code> para liberar o <strong>recurso</strong> de um gerador abandonado.'
          ],
          modelo: '<p>Chamar uma função geradora não executa o corpo: o <code>open</code> e o <code>FileNotFoundError</code> só acontecem no primeiro <code>next()</code>, possivelmente num módulo distante. E um gerador é de passagem única: depois de esgotado, <code>list()</code> devolve <code>[]</code>. Para falhar cedo, valido o caminho numa função comum que devolve o gerador (ou trato o erro no ponto em que consumo, como a CLI faz); se precisar percorrer duas vezes, materializo ou crio outro gerador. Se o consumidor pode abandonar no meio, uso <code>with contextlib.closing(gerador)</code> para liberar o arquivo.</p>' + reprova('envolver tudo em <code>try/except Exception</code>.') },

        { tipo: 'escreva', id: 'cp-p7', titulo: 'P7 · Exceção bem desenhada', obrigatorio: false,
          enunciado: 'Projete as exceções de um módulo de importação de pedidos (linha inválida, arquivo ilegível, coluna ausente) e a tradução para exit codes. Justifique base comum, atributos, <code>raise ... from</code> e o que <em>não</em> capturar. <em>Bloco 6.</em>',
          placeholder: 'A raiz… Atributos… from… Exit codes… Não capturo…',
          rubrica: [
            'Hierarquia com <strong>raiz própria</strong> (como <code>ExpensesError</code>), nomes terminados em <code>Error</code>.',
            'Dados em <strong>atributos</strong> (linha, campo, colunas), não só na mensagem.',
            'Causa <strong>preservada</strong> com <code>raise ... from</code>, traduzindo na fronteira.',
            '<code>Exception</code> só na <strong>fronteira</strong>; nunca <code>except:</code> sem tipo nem engolir <code>KeyboardInterrupt</code>.',
            'Exit codes <strong>0/1/2</strong> coerentes: válido, dado inválido, uso ou ambiente.'
          ],
          modelo: '<p>Crio <code>PedidosError(Exception)</code> como raiz e subclasses <code>InvalidRowError(line, field, message)</code>, <code>MissingColumnError(columns)</code> e <code>UnreadableFileError</code>, com os dados em atributos para a CLI tratar sem regex em mensagem. Na fronteira traduzo <code>OSError</code> e <code>UnicodeDecodeError</code> para os meus tipos com <code>raise ... from err</code>, preservando a causa. A CLI captura <code>PedidosError</code>: 0 para tudo válido, 1 para dados inválidos, 2 para problema de uso ou ambiente (arquivo ausente, encoding errado, coluna faltando). Não capturo <code>BaseException</code> nem uso <code>except: pass</code>; <code>Exception</code> só na fronteira do processo, para registrar uma vez e terminar com código de erro.</p>' + reprova('<code>except: pass</code> ou mensagens sem contexto.') },
        { tipo: 'takeaway', html: 'Custo vem do <mark>mecanismo</mark>; gerador só roda no <mark>consumo</mark>; exceção bem desenhada tem <mark>raiz própria</mark>, <mark>atributos</mark> e <mark>causa preservada</mark>.' }
      ] },

      { rotulo: 'Arquivo, import e testes', blocos: [
        { tipo: 'escreva', id: 'cp-p8', titulo: 'P8 · Texto e arquivo', obrigatorio: false,
          enunciado: 'Um CSV do Excel brasileiro (ponto e vírgula, Latin-1 ou UTF-8 com BOM, vírgula decimal) precisa ser importado e um relatório gravado sem risco de arquivo pela metade. Descreva leitura, validação e escrita. <em>Blocos 6 e 7.</em>',
          placeholder: 'Leio com encoding… delimiter… Valido… Gravo de forma atômica…',
          rubrica: [
            '<code>encoding</code> <strong>explícito</strong> (<code>utf-8-sig</code> para BOM, ou o declarado, como <code>latin-1</code>), decodificação estrita.',
            '<code>newline=""</code> e <code>delimiter=";"</code> no módulo <code>csv</code>; vírgula decimal tratada na validação.',
            '<strong>Normalização Unicode</strong> e validação com <code>[0-9]</code>, convertendo para <code>Decimal</code>.',
            '<strong>Escrita atômica</strong>: temporário ao lado e <code>os.replace</code>, descartando o temporário na falha.'
          ],
          modelo: '<p>Abro com <code>encoding</code> explícito (<code>utf-8-sig</code> para o BOM; <code>latin-1</code> só quando declarado, porque o padrão estrito falha alto) e <code>newline=""</code>, e leio com <code>csv.DictReader(delimiter=";")</code>. Cada campo sai como <code>str</code>: normalizo a categoria em NFC, valido o valor com <code>[0-9]+(?:[.,][0-9]{1,2})?</code> (nunca <code>\\d</code>), troco a vírgula decimal e converto para <code>Decimal</code>, com erro que cita linha e campo. Gravo o relatório JSON num temporário ao lado e só no sucesso faço <code>os.replace</code> sobre o destino; na falha o temporário é descartado e o arquivo antigo permanece.</p>' + reprova('<code>split(",")</code> e <code>open(..., "w")</code> direto no destino.') },

        { tipo: 'escolha', id: 'cp-esc-p9', titulo: 'P9 · Aquecimento: o ciclo de import',
          pergunta: 'a.py faz "from pacote import b" e b.py faz "from pacote.a import fa". Por que dá ImportError ao importar a?',
          opcoes: [
            { id: 'a', texto: 'O módulo a é registrado em sys.modules antes de executar o corpo; quando b pede o nome fa, ele ainda não foi definido.', correta: true, porque: 'o remédio é extrair o que ambos precisam para um módulo-folha; mover o import para a função é só paliativo.' },
            { id: 'b', texto: 'O Python não permite dois módulos no mesmo pacote.', correta: false, porque: 'pacotes têm vários módulos.' },
            { id: 'c', texto: 'O import de nome (from ... import) é proibido em pacotes.', correta: false, porque: 'é permitido; o problema é o momento em que o nome existe.' }
          ] },
        { tipo: 'escreva', id: 'cp-p9', titulo: 'P9 · Import circular', obrigatorio: false,
          enunciado: 'Dois módulos se importam e a falha só ocorre em um dos pontos de entrada. Explique por que depende do caminho de import e como desfazer o ciclo. <em>Bloco 7.</em>',
          placeholder: 'sys.modules… from m import nome versus import m… Desfaço com…',
          rubrica: [
            '<code>sys.modules</code> e o módulo <strong>parcialmente inicializado</strong>: registrado antes de o corpo terminar.',
            '<code>from m import nome</code> falha se o nome ainda não existe; <code>import m</code> com acesso tardio ao atributo funciona.',
            'Desfazer por <strong>módulo-folha</strong> comum ou <strong>inversão de dependência</strong>.'
          ],
          modelo: '<p>O import registra o módulo em <code>sys.modules</code> antes de executar o corpo; quem entra primeiro vê o outro módulo completo ou pela metade, e por isso a falha depende do ponto de entrada. Com <code>from pacote.a import fa</code> o nome é exigido durante o import e ainda não existe (ImportError "partially initialized module"); com <code>import pacote.c as c</code> e acesso a <code>c.fc()</code> só dentro de funções, funciona. O ciclo é sintoma de acoplamento: extraio o que ambos usam para um módulo-folha que não importa nenhum dos dois (como <code>errors</code> e <code>model</code>) ou inverto a dependência passando o colaborador por parâmetro.</p>' + reprova('só mover o import para dentro da função sem discutir o acoplamento.') },

        { tipo: 'escolha', id: 'cp-esc-p10', titulo: 'P10 · Aquecimento: a cobertura de 100%',
          pergunta: 'Um agente entrega 20 testes verdes e cobertura de 100% para uma função de arredondamento. O que isso garante?',
          opcoes: [
            { id: 'a', texto: 'Que todas as linhas foram executadas; nada diz que algum teste falharia se o bug existisse.', correta: true, porque: 'a pergunta útil é se estragar a linha deixa algum teste vermelho (mutação manual, controle negativo).' },
            { id: 'b', texto: 'Que a função está correta.', correta: false, porque: 'cobertura mede execução, não correção.' },
            { id: 'c', texto: 'Que os testes são determinísticos.', correta: false, porque: 'determinismo é outra propriedade.' }
          ] },
        { tipo: 'escreva', id: 'cp-p10', titulo: 'P10 · O teste que nunca falha', obrigatorio: false,
          enunciado: 'Um agente entrega 20 testes verdes para uma função de arredondamento. Como você descobre se eles protegem alguma coisa? <em>Bloco 8.</em>',
          placeholder: 'Eu estragaria… Procuraria… Exigiria…',
          rubrica: [
            '<strong>Mutação manual</strong>: estragar o código e ver o teste ficar vermelho.',
            '<strong>Controle negativo</strong> e <strong>valores esperados escritos à mão</strong> (nunca calculados pelo próprio código).',
            '<code>raises</code> com <strong>tipo</strong> e <code>match</code>; casos de <strong>borda</strong> e <code>parametrize</code>.',
            'Desconfia de <code>assert</code> sobre tupla, <code>raises(Exception)</code> e parametrização calculada do código sob teste.'
          ],
          modelo: '<p>Faço mutação manual: troco o modo de arredondamento ou inverto uma comparação e confirmo que algum teste fica vermelho; se nenhum fica, os testes não protegem nada. Exijo valores esperados escritos à mão (2.665 deve virar 2.67), um controle negativo que prove que o teste consegue falhar, <code>pytest.raises</code> com o tipo e <code>match</code>, bordas (vazio, limite, Unicode) e <code>parametrize</code> para os casos. Desconfio de <code>assert (x, "msg")</code>, de <code>raises(Exception)</code> e de testes cujo esperado vem do próprio código. A cobertura é consequência, não prova.</p>' + reprova('"a cobertura está em 100%".') },

        { tipo: 'texto', html:
          '<h3>Entregáveis verificados (mostrar rodando)</h3>' +
          '<ol><li>Gates do lab verdes: <code>pytest</code> (52 testes), <code>ruff check</code>, <code>ruff format --check</code>, <code>mypy --strict</code>.</li>' +
          '<li>Relatório do exemplo em modo estrito (exit 1) e tolerante (exit 1, JSON com <code>rejected_rows: 2</code>), e o caso Latin-1 (exit 2 e depois 0 com <code>--encoding latin-1</code>).</li>' +
          '<li>Mutações 1, 2 e 3 rejeitadas pela suíte e revertidas.</li>' +
          '<li>A extensão <code>--month</code>, testes primeiro, com os quatro tipos de teste e os gates verdes.</li></ol>' },
        { tipo: 'texto', html: '<p class="ta-nota">Os entregáveis acima são feitos no laboratório guiado do F02 (pacote <code>expenses</code>). Versões verificadas em 11/10/2026: Python 3.14.7, uv 0.12.13, pytest 9.1.1; versões e comportamento do <code>uv</code> são de alto risco (revalidar em até 90 dias).</p>' },
        { tipo: 'takeaway', html: 'Em cada resposta: o <mark>mecanismo</mark> primeiro e, depois, o que <mark>reprova</mark>; prove que o teste <mark>pode falhar</mark>.' }
      ] }
    ]
  });
})();
