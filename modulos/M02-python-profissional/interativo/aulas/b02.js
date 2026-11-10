/* M02 · Bloco 2: objetos, imports, recursos e exceções. Fonte: M02.html#b2. */
(function () {
  var L = function (kind, text) { return { kind: kind, text: text }; };
  function opc(id, texto, correta, porque) { return { id: id, texto: texto, correta: correta, porque: porque }; }
  var py = function (l) { return l.join('\n') + '\n'; };

  var codigo = py([
    'def acumular(item, itens=[]):',
    '    # 1. troque o default [] por None (sentinela)',
    '    # 2. crie a lista nova DENTRO da funcao quando itens for None',
    '    itens.append(item)',
    '    return itens',
    '',
    '',
    'def copiar_na_fronteira(ids):',
    '    # devolva uma TUPLA com os ids: a lista de quem chamou nao pode vazar',
    '    return ids'
  ]);
  var testes = py([
    'def test_chamadas_independentes():',
    '    assert acumular("a") == ["a"]',
    '    assert acumular("b") == ["b"]',
    '',
    '',
    'def test_lista_do_chamador_e_usada():',
    '    base = ["x"]',
    '    assert acumular("y", base) == ["x", "y"]',
    '    assert base == ["x", "y"]',
    '',
    '',
    'def test_fronteira_imutavel():',
    '    ids = ["A"]',
    '    t = copiar_na_fronteira(ids)',
    '    ids.append("B")',
    '    assert t == ("A",)',
    '    assert isinstance(t, tuple)',
    '',
    '',
    'def test_fronteira_vazia():',
    '    assert copiar_na_fronteira([]) == ()'
  ]);
  var solucao = py([
    'def acumular(item, itens=None):',
    '    if itens is None:',
    '        itens = []',
    '    itens.append(item)',
    '    return itens',
    '',
    '',
    'def copiar_na_fronteira(ids):',
    '    return tuple(ids)'
  ]);

  TrilhaAula.registrar({
    id: 'm02-b2',
    titulo: 'Objetos, imports, recursos e exceções',
    minutos: 30,
    resumo: 'Variável é nome ligado a objeto; frozen é raso; import busca, cria, executa e cacheia; with e raise from fazem recursos e exceções virarem contrato.',
    objetivo: 'Prever aliasing e default mutável, ordenar as etapas do import, explicar o limite de frozen/slots e escrever cleanup e cadeia de causa corretos.',
    abas: [
      { rotulo: 'Entender', blocos: [
        { tipo: 'texto', html:
          '<h3>Nome ligado a objeto</h3>' +
          '<p>Em Python, atribuir normalmente <strong>liga um nome a um objeto</strong>; não copia o objeto nem declara um slot com tipo fixo. Dois nomes podem apontar para a mesma lista, e mutar por um é visível pelo outro. Reatribuir um nome só troca o <em>binding</em>.</p>' },
        { tipo: 'codigo', linguagem: 'python', texto:
          'original = ["a"]\nalias = original\nalias.append("b")\nassert original == ["a", "b"]   # o mesmo objeto foi mutado\nalias = ["x"]\nassert original == ["a", "b"]   # só o nome alias foi religado\nassert alias is not original' },
        { tipo: 'texto', html:
          '<p><code>==</code> pergunta igualdade de valor segundo o tipo; <code>is</code> pergunta <strong>identidade</strong> e serve para singletons como <code>None</code>, não para strings ou números. O hash precisa ficar estável enquanto o objeto é chave de dict ou membro de set: por isso listas não são hashable e uma dataclass mutável não ganha hash seguro sozinha.</p>' +
          '<p><strong>Default mutável.</strong> A expressão default é avaliada quando a função é <em>definida</em>, não a cada chamada: <code>def add(x, itens=[])</code> compartilha a mesma lista entre chamadas. Use <code>None</code> como sentinela, ou factory em dataclasses e Pydantic.</p>' +
          '<h3>Imutabilidade rasa não é isolamento</h3>' },
        { tipo: 'codigo', linguagem: 'python', texto:
          '@dataclass(frozen=True, slots=True)\nclass Batch:\n    ids: list[str]\n\nb = Batch(ids=["A"])\nb.ids.append("B")       # permitido: a LISTA interna continua mutável\n# b.ids = []             # bloqueado: o atributo não pode ser religado' },
        { tipo: 'texto', html:
          '<p><code>frozen=True</code> impede a atribuição normal aos campos; <code>slots=True</code> controla layout e atributos e pode reduzir memória. Nenhum dos dois dá imutabilidade profunda, atomicidade ou segurança entre threads. Se a invariante exige coleção imutável, use <code>tuple[str, ...]</code> e teste a fronteira.</p>' },
        { tipo: 'takeaway', html: 'Nome é <mark>binding</mark>, não cópia; <mark>frozen</mark> trava o nome dentro da instância, não o conteúdo do objeto apontado.' }
      ] },

      { rotulo: 'Ver funcionando', blocos: [
        { tipo: 'texto', html:
          '<h3>Import é busca, criação, execução e cache</h3>' +
          '<p>Um arquivo <code>.py</code> é módulo. Um pacote regular tem <code>__init__.py</code>, mas Python também suporta <strong>namespace packages</strong> sem ele; "toda pasta precisa de <code>__init__.py</code>" é regra de projeto possível, não definição da linguagem. Na primeira importação, o sistema procura uma <em>spec</em>, cria o módulo, o coloca em <code>sys.modules</code> e executa o corpo. Importar tem efeitos e cache.</p>' +
          '<p>Antes de rodar, preveja: <code>util.py</code> tem um <code>print("carregando")</code> no topo e dois arquivos fazem <code>import util</code> no mesmo processo.</p>' },
        { tipo: 'rode', id: 'imp-rode', titulo: 'Quantas vezes o topo executa?', obrigatorio: false,
          enunciado: 'Rode a sequência e leia cada etapa. A saída é <strong>exemplo</strong> do mecanismo descrito no módulo.',
          prefixo: '$', entrada: 'python main.py', unidade: 'etapa', terminalTitulo: 'exemplo · sys.modules',
          etapas: [
            { id: 'a', nome: 'import em a.py', descricao: 'primeiro import', tom: 'dns', ms: 6, linhas: [
              L('info', 'sys.modules não tem "util": finders procuram a spec (pasta, zip, namespace package: quem acha primeiro, vence)'),
              L('out', 'carregando'),
              L('hint', 'o módulo é criado, registrado em sys.modules e só então o corpo executa')] },
            { id: 'b', nome: 'import em b.py', descricao: 'segundo import', tom: 'tcp', ms: 2, linhas: [
              L('info', 'sys.modules["util"] existe: acerto no cache'),
              L('hint', 'nada é reexecutado; o print não aparece de novo')] },
            { id: 'rl', nome: 'importlib.reload', descricao: 'a exceção explícita', tom: 'tls', ms: 5, linhas: [
              L('cmd', 'importlib.reload(util)'),
              L('out', 'carregando'),
              L('hint', 'reload reexecuta o corpo; é exceção, não regra')] }
          ],
          prever: { pergunta: 'Dois arquivos fazem import util, que tem print no topo. Quantas vezes a mensagem aparece, no mesmo processo?', opcoes: [
            opc('a', 'Duas, uma por arquivo que importa.', false, 'o segundo import acerta o cache em sys.modules.'),
            opc('b', 'Uma: o import executa o módulo uma vez e guarda o objeto em sys.modules.', true, 'por isso efeitos no topo (conexão, leitura de arquivo) acontecem uma vez, no primeiro import.'),
            opc('c', 'Nenhuma: o print é suprimido durante imports.', false, 'o corpo executa normalmente na primeira importação.'),
            opc('d', 'Depende da ordem alfabética dos arquivos.', false, 'a ordem muda quem paga o custo, não a contagem.')] },
          tutorDepois: 'O registro em sys.modules acontece antes da execução do corpo: é por isso que imports circulares enxergam o módulo pela metade.',
          callout: 'Você viu o cache de módulos agir.' },
        { tipo: 'texto', html:
          '<p>Layout <code>src/</code> ajuda a detectar import acidental do checkout, mas só a instalação do wheel em ambiente limpo prova que metadata e arquivos distribuídos estão certos. Não "conserte" import com <code>sys.path.append()</code>: descubra se o erro é ambiente, instalação, nome do package, ciclo ou artefato incompleto. Ciclo (domínio importa CLI para reusar uma constante, CLI importa domínio): mova o contrato compartilhado para um terceiro módulo estável.</p>' +
          '<h3>Recursos e exceções formam um contrato</h3>' +
          '<p><code>with</code> garante a chamada de saída do context manager no sucesso e na exceção. O paralelo mental com <code>using</code> ajuda, mas <code>__exit__</code> pode <em>suprimir</em> a exceção: faça isso só quando o contrato considera a falha tratada.</p>' },
        { tipo: 'codigo', linguagem: 'python', texto:
          '@contextmanager\ndef opened_utf8(path: Path) -> Iterator[object]:\n    stream = path.open("r", encoding="utf-8", newline="")\n    try:\n        yield stream\n    finally:\n        stream.close()\n\ndef load_text(path: Path) -> str:\n    try:\n        with opened_utf8(path) as stream:\n            return stream.read()  # type: ignore[attr-defined]\n    except OSError as exc:\n        raise RuntimeError(f"cannot read {path.name}") from exc' },
        { tipo: 'texto', html:
          '<p>O exemplo explicita encoding e newline e preserva a causa com <code>raise ... from exc</code>. No laboratório a porta é tipada com <code>TextIO</code>, eliminando o <code>ignore</code> usado aqui para tornar o problema visível: supressão de checker exige justificativa local e não pode esconder design incompleto.</p>' },
        { tipo: 'takeaway', html: 'O import <mark>cacheia</mark> em sys.modules e executa o topo uma vez; <mark>with</mark> e <mark>raise from</mark> tornam cleanup e causa explícitos.' }
      ] },

      { rotulo: 'Praticar', blocos: [
        { tipo: 'ordene', id: 'imp-ordene', titulo: 'Ordene o que o import faz', obrigatorio: false,
          enunciado: 'Ponha as etapas do primeiro import de um módulo na ordem em que ocorrem.',
          itens: [
            { id: 'topo', texto: 'Executa o corpo do módulo (efeitos do topo ocorrem agora, uma única vez)' },
            { id: 'cache', texto: 'Consulta <code>sys.modules</code>: se já está lá, devolve o objeto sem reexecutar' },
            { id: 'cria', texto: 'Cria o módulo a partir da spec e o registra' },
            { id: 'find', texto: 'Os finders percorrem os caminhos em busca da spec' }
          ], solucao: ['cache', 'find', 'cria', 'topo'],
          dica: 'Primeiro o cache; só se faltar, busca, criação e execução.',
          tutorDepois: 'Dentro de "cria", o registro acontece antes de executar o topo: ciclos veem o módulo pela metade.' },
        { tipo: 'python', id: 'obj-python', titulo: 'Corrija o default mutável e a fronteira', obrigatorio: false,
          enunciado: 'Corrija <code>acumular</code> (sentinela <code>None</code>; a lista do chamador continua sendo usada quando ele a passa) e faça <code>copiar_na_fronteira</code> devolver uma tupla, para que mutar a lista original depois não altere o resultado.',
          codigo: codigo, testes: testes,
          dica: 'Troque <code>itens=[]</code> por <code>itens=None</code> e use <code>if itens is None: itens = []</code>. Na fronteira, <code>tuple(ids)</code> copia a sequência.',
          solucao: solucao,
          tutorDepois: 'O default é avaliado uma vez, na definição. Em dataclass ou Pydantic o equivalente é default_factory. A tupla dá imutabilidade rasa, mas suficiente para strings.',
          callout: 'Independência entre chamadas e fronteira imutável, provadas por teste.' },
        { tipo: 'takeaway', html: 'Default mutável: <mark>None</mark> como sentinela; invariante de coleção imutável: <mark>tuple</mark> e teste na fronteira.' }
      ] },

      { rotulo: 'Conferir', blocos: [
        { tipo: 'escolha', id: 'obj-esc-frozen', titulo: 'Confira: o que frozen garante',
          pergunta: 'Um <code>@dataclass(frozen=True)</code> tem o campo <code>tags: list[str]</code>. O que o <code>frozen</code> garante?',
          opcoes: [
            { id: 'a', texto: 'A lista interna também fica imutável, em profundidade.', correta: false, porque: 'frozen não é profundo.' },
            { id: 'b', texto: 'O objeto passa a ser copiado a cada acesso ao atributo.', correta: false, porque: 'não há cópia.' },
            { id: 'c', texto: 'Nada: frozen só afeta a assinatura do __init__.', correta: false, porque: 'afeta a atribuição aos campos.' },
            { id: 'd', texto: 'Impede reatribuir o campo (<code>obj.tags = ...</code>), mas <code>obj.tags.append("x")</code> funciona.', correta: true, porque: 'frozen trava o nome dentro da instância, não o conteúdo do objeto apontado. Para imutabilidade de verdade use tuple/frozenset ou copie na fronteira.' }
          ], tutorDepois: 'Imutabilidade rasa não é isolamento.' },
        { tipo: 'escolha', id: 'obj-esc-with', titulo: 'Confira: with',
          pergunta: 'Qual afirmação sobre <code>with</code> está correta?',
          opcoes: [
            { id: 'a', texto: 'É idêntico a IDisposable/using, inclusive no tratamento da exceção.', correta: false, porque: 'o paralelo ajuda, mas __exit__ pode suprimir a exceção.' },
            { id: 'b', texto: 'Garante a chamada de saída no sucesso e na exceção; suprimir a exceção só é correto se o contrato considera a falha tratada.', correta: true, porque: 'é o contrato do context manager; quem suprime assume a falha.' },
            { id: 'c', texto: 'Só fecha o recurso se não houver exceção.', correta: false, porque: 'a saída roda também na exceção.' }
          ], tutorDepois: 'Cleanup determinístico, com decisão explícita sobre suprimir.' },
        { tipo: 'takeaway', html: 'Preserve a <mark>causa original</mark> com <mark>raise ... from exc</mark> e feche recursos no <mark>with</mark>.' }
      ] }
    ],
    revisao: [
      { id: 'm02b2-alias', pergunta: 'Depois de alias = original e alias.append("b"), o que acontece com original?', opcoes: [
        opc('a', 'Também contém "b": é o mesmo objeto mutado', true, 'atribuição liga nomes a objetos; não copia.'),
        opc('b', 'Fica intacto: append copia a lista', false, 'append muta o objeto compartilhado.'),
        opc('c', 'Dá erro, pois original é imutável', false, 'listas são mutáveis.')] },
      { id: 'm02b2-default', pergunta: 'Por que def add(x, itens=[]) é bug?', opcoes: [
        opc('a', 'O default é avaliado uma vez, na definição, e a mesma lista é reutilizada entre chamadas', true, 'use None como sentinela ou default_factory.'),
        opc('b', 'O default é recriado a cada chamada, o que é lento', false, 'é o contrário.'),
        opc('c', 'Python proíbe listas como default', false, 'permite, e é por isso que o bug existe.')] },
      { id: 'm02b2-is', pergunta: 'Quando usar is em vez de ==?', opcoes: [
        opc('a', 'Para identidade de singletons como None', true, '== é igualdade de valor segundo o tipo; is é identidade.'),
        opc('b', 'Para comparar strings e números', false, 'use == para valores.'),
        opc('c', 'Sempre que a comparação for lenta', false, 'a escolha é semântica, não de velocidade.')] },
      { id: 'm02b2-import', pergunta: 'O que acontece no primeiro import de um módulo?', opcoes: [
        opc('a', 'Busca da spec, criação, registro em sys.modules e execução do corpo, uma vez', true, 'o segundo import acerta o cache; reload é exceção explícita.'),
        opc('b', 'O corpo executa a cada import', false, 'o cache evita a reexecução.'),
        opc('c', 'Só a pasta com __init__.py pode ser importada', false, 'namespace packages existem sem ele.')] },
      { id: 'm02b2-from', pergunta: 'Para que serve raise RuntimeError(...) from exc?', opcoes: [
        opc('a', 'Preservar a cadeia de causa da falha original', true, 'a causa continua investigável.'),
        opc('b', 'Suprimir a exceção original', false, 'ela é encadeada, não escondida.'),
        opc('c', 'Reiniciar o programa', false, 'não tem esse efeito.')] }
    ]
  });
})();
