/* M02 · Bloco 1: uv e o ecossistema. Fonte: M02.html#b1. Data-base 15/08/2026; revalidar documentação de ferramenta em até 90 dias. */
(function () {
  var L = function (kind, text) { return { kind: kind, text: text }; };
  function opc(id, texto, correta, porque) { return { id: id, texto: texto, correta: correta, porque: porque }; }
  var py = function (l) { return l.join('\n') + '\n'; };

  var codigo = py([
    'import tomllib',
    '',
    '',
    'def nome_pacote(requisito):',
    '    # "pydantic>=2.11,<3" -> "pydantic"',
    '    return requisito',
    '',
    '',
    'def resumo_projeto(texto):',
    '    dados = tomllib.loads(texto)',
    '    # 1. sem a tabela [project], levante ValueError("sem [project]")',
    '    # 2. devolva (nome, deps, dev): deps e dev sao listas de NOMES de pacote',
    '    #    dev vem de [dependency-groups].dev e e [] quando o grupo nao existe',
    '    return ("", [], [])'
  ]);
  var testes = py([
    'BASE = """',
    '[project]',
    'name = "csv-cleaner"',
    'version = "0.1.0"',
    'requires-python = ">=3.14"',
    'dependencies = ["pydantic>=2.11,<3"]',
    '',
    '[dependency-groups]',
    'dev = ["pytest>=8.0", "mypy>=1.10", "ruff>=0.5"]',
    '"""',
    '',
    '',
    'def test_caminho_feliz():',
    '    assert resumo_projeto(BASE) == ("csv-cleaner", ["pydantic"], ["pytest", "mypy", "ruff"])',
    '',
    '',
    'def test_sem_grupo_dev():',
    '    txt = "[project]\\nname = \\"x\\"\\ndependencies = []\\n"',
    '    assert resumo_projeto(txt) == ("x", [], [])',
    '',
    '',
    'def test_nome_pacote_borda():',
    '    assert nome_pacote("pydantic>=2.11,<3") == "pydantic"',
    '    assert nome_pacote("pytest") == "pytest"',
    '',
    '',
    'def test_sem_project_falha():',
    '    try:',
    '        resumo_projeto("[tool.ruff]\\nline-length = 100\\n")',
    '    except ValueError as e:',
    '        assert "project" in str(e)',
    '    else:',
    '        assert False, "deveria levantar ValueError"'
  ]);
  var solucao = py([
    'import re',
    'import tomllib',
    '',
    '',
    'def nome_pacote(requisito):',
    '    return re.split(r"[<>=!~;\\[ ]", requisito, maxsplit=1)[0]',
    '',
    '',
    'def resumo_projeto(texto):',
    '    dados = tomllib.loads(texto)',
    '    if "project" not in dados:',
    '        raise ValueError("sem [project]")',
    '    proj = dados["project"]',
    '    deps = [nome_pacote(r) for r in proj.get("dependencies", [])]',
    '    dev = [nome_pacote(r) for r in dados.get("dependency-groups", {}).get("dev", [])]',
    '    return (proj["name"], deps, dev)'
  ]);

  TrilhaAula.registrar({
    id: 'm02-b1',
    titulo: 'uv e o ecossistema: projeto, dependências, versões',
    minutos: 30,
    resumo: 'Padrão Python e ferramenta não são a mesma coisa. pyproject.toml declara, uv.lock registra a resolução do uv, o wheel é o que se entrega, e só a instalação fora do checkout prova o artefato.',
    objetivo: 'Separar contrato (pyproject.toml, wheel, sdist) de adapter (uv), explicar o que cada arquivo e comando prova e montar a prova de que o wheel funciona fora do checkout.',
    abas: [
      { rotulo: 'Entender', blocos: [
        { tipo: 'texto', html:
          '<h3>Contrato primeiro, comando depois</h3>' +
          '<p>O ecossistema Python separa responsabilidades: <strong>interpretador</strong>, <strong>ambiente</strong>, <strong>metadata</strong>, <strong>build backend</strong>, <strong>resolvedor</strong>, <strong>lock</strong>, <strong>instalador</strong>, <strong>runner</strong> e <strong>registry</strong>. O <strong>uv</strong> integra várias dessas tarefas e é o adapter que o curso escolheu, mas não define o padrão. <code>pyproject.toml</code>, wheel, sdist, entry points e <code>pylock.toml</code> pertencem à camada PyPA; pip, uv, Hatch, PDM ou Poetry consomem subconjuntos diferentes. Identifique o contrato e só depois o comando.</p>' },
        { tipo: 'texto', largo: true, html:
          '<table><thead><tr><th>Responsabilidade</th><th>Artefato ou ferramenta</th><th>Função e limite</th></tr></thead><tbody>' +
          '<tr><td>Interpretador</td><td>CPython 3.14</td><td>Executa o programa; a versão precisa ser conhecida.</td></tr>' +
          '<tr><td>Definição do projeto</td><td><code>pyproject.toml</code></td><td>Declara metadados, dependências e configuração.</td></tr>' +
          '<tr><td>Resolução reproduzível</td><td><code>uv.lock</code></td><td>Registra as dependências resolvidas para a ferramenta usada.</td></tr>' +
          '<tr><td>Ambiente</td><td><code>uv sync --locked</code></td><td>Sincroniza o ambiente sem atualizar o lock.</td></tr>' +
          '<tr><td>Execução</td><td><code>uv run</code></td><td>Executa comandos no ambiente do projeto.</td></tr>' +
          '<tr><td>Distribuição</td><td>wheel e PyPI</td><td>Wheel é o artefato instalável; PyPI é um índice de distribuições.</td></tr></tbody></table>' },
        { tipo: 'texto', html:
          '<h3>O que um venv isola, e o que não prova</h3>' +
          '<p>Um <strong>virtual environment</strong> dá ao projeto um prefixo e um diretório de instalação isolados. O executável pode ser cópia, link ou launcher conforme a plataforma e a ferramenta; o contrato é <code>sys.prefix</code>/<code>site-packages</code> isolado, não "uma cópia completa do Python". O uv gerencia <code>.venv/</code> ao lado do projeto. Confirme o interpretador que rodou com <code>sys.executable</code> e <code>sys.prefix</code> e nunca versione o ambiente.</p>' +
          '<h3>Panorama de prática vigente</h3>' +
          '<p>O Octoverse 2025 do GitHub observou que quase metade dos novos projetos públicos de IA analisados em agosto de 2025 usava Python como linguagem principal, e destacou ferramentas de packaging como o uv entre as de crescimento acelerado. O dado descreve repositórios públicos do GitHub: não mede vagas, empresas privadas, Brasil, qualidade de arquitetura nem a melhor ferramenta para todo time.</p>' +
          '<p>O laboratório usa uv, Ruff, mypy, Pydantic e pytest porque tornam as decisões observáveis, não porque definam "Python profissional". Trocar um adapter não elimina a obrigação de explicar o artefato entregue, a fronteira validada e a evidência produzida.</p>' },
        { tipo: 'takeaway', html: 'Identifique o <mark>contrato</mark> (pyproject, wheel, sdist) antes do <mark>adapter</mark> (uv); o uv é a escolha do curso, não o padrão.' }
      ] },

      { rotulo: 'Ver funcionando', blocos: [
        { tipo: 'texto', html:
          '<h3>Anatomia de um projeto instalável</h3>' +
          '<ul><li><code>pyproject.toml</code>: nome, versão, dependências e configuração das ferramentas.</li><li><code>uv.lock</code>: versões exatas, commitado; gerado, nunca editado à mão.</li><li><code>.venv/</code>: o ambiente, não commitado.</li><li><code>.python-version</code>: versão do interpretador do projeto, commitada.</li><li><code>src/meu_projeto/</code>: o pacote em snake_case, com <code>__init__.py</code>; <code>tests/</code> ao lado.</li></ul>' +
          '<p>Três nomes diferentes: a <strong>distribuição</strong> (<code>csv-cleaner</code>), o <strong>import package</strong> (<code>python_senior_lab</code>) e o <strong>comando instalado</strong> (<code>csv-cleaner</code>). Um arquivo <code>.py</code> é módulo; uma pasta com <code>__init__.py</code> é regular package; um namespace package existe sem esse arquivo. O import usa finders e loaders sobre <code>sys.path</code>, specs e o cache <code>sys.modules</code>.</p>' },
        { tipo: 'codigo', linguagem: 'toml', texto:
          '[build-system]\nrequires = ["hatchling>=1.27"]\nbuild-backend = "hatchling.build"  # adapter substituível; metadata segue PyPA\n\n[project]\nname = "csv-cleaner"              # nome da distribuição\nversion = "0.1.0"\nrequires-python = ">=3.14"        # runtime mínimo suportado\ndependencies = [\n    "pydantic>=2.11,<3",         # faixa declarada, resolvida pelo lock\n]\n\n[project.scripts]\ncsv-cleaner = "python_senior_lab.cli:main"  # distribuição, import e comando são contratos distintos\n\n[dependency-groups]\ndev = ["pytest>=8.0", "mypy>=1.10", "ruff>=0.5"]  # só desenvolvimento\n\n[tool.ruff]\nline-length = 100\n\n[tool.mypy]\nstrict = true' },
        { tipo: 'texto', html:
          '<p>Os comandos abaixo são referência de arquitetura; o laboratório do módulo os executa numa cópia temporária. A saída mostrada é <strong>exemplo</strong>: versões e hashes variam por execução e por máquina.</p>' },
        { tipo: 'rode', id: 'uv-rode', titulo: 'Do projeto ao wheel instalado', obrigatorio: false,
          enunciado: 'Percorra os cinco estados e leia o que cada um prova. Antes, preveja o que o último comando prova.',
          prefixo: '$', entrada: 'uv build', unidade: 'ms', terminalTitulo: 'exemplo · csv-cleaner',
          etapas: [
            { id: 'init', nome: 'Projeto', descricao: 'uv init + pin do Python', tom: 'dns', ms: 8, linhas: [
              L('cmd', 'uv init csv-cleaner --package && cd csv-cleaner && uv python pin 3.14'),
              L('hint', 'prova: layout src e arquivo .python-version; uv run python -VV mostra um Python 3.14 real')] },
            { id: 'deps', nome: 'Resolução', descricao: 'uv add + lock', tom: 'tcp', ms: 9, linhas: [
              L('cmd', 'uv add pydantic && uv add --dev pytest mypy ruff hypothesis && uv lock --check'),
              L('hint', 'prova: dependências nos grupos certos; uv.lock traz a resolução completa, inclusive pydantic-core como transitiva')] },
            { id: 'iso', nome: 'Isolamento', descricao: 'runner do projeto', tom: 'tls', ms: 7, linhas: [
              L('cmd', 'uv run python -c "import pydantic; print(pydantic.VERSION)"'),
              L('hint', 'identifica a versão resolvida pelo projeto'),
              L('cmd', 'python -c "import pydantic"'),
              L('hint', 'pode falhar ou alcançar uma instalação global: não prova o ambiente do projeto')] },
            { id: 'build', nome: 'Build', descricao: 'sdist e wheel', tom: 'request', ms: 10, linhas: [
              L('cmd', 'uv build'),
              L('out', 'exemplo: dist/csv_cleaner-0.1.0.tar.gz  dist/csv_cleaner-0.1.0-py3-none-any.whl'),
              L('hint', 'dist/ passa a conter sdist e wheel')] },
            { id: 'fora', nome: 'Fora do checkout', descricao: 'wheel isolado', tom: 'response', ms: 10, linhas: [
              L('cmd', 'uv run --isolated --no-project --with ./dist/csv_cleaner-0.1.0-py3-none-any.whl csv-cleaner --help'),
              L('hint', 'prova: o comando instalado responde fora do checkout. Se só passa com o projeto em sys.path, você validou o source tree, não o artefato')] }
          ],
          prever: { pergunta: 'O último comando roda o csv-cleaner de dentro de um ambiente isolado só com o wheel. O que a resposta de --help prova?', opcoes: [
            opc('a', 'Que os testes do projeto passam.', false, 'testes são outro gate (pytest); aqui se verifica a instalação.'),
            opc('b', 'Que o artefato distribuído instala e expõe o entry point sem depender do checkout.', true, 'wheel instalado em ambiente isolado e sem o projeto no caminho: se algo faltasse no pacote, o comando falharia.'),
            opc('c', 'Que o build é reproduzível bit a bit.', false, 'nenhuma camada isolada prova isso; o gate exige resolução conhecida e artefato instalável.')] },
          tutorDepois: 'Declarar (uv add), executar (uv run), restaurar (uv sync --locked) e entregar (uv build) são verbos diferentes, cada um com sua evidência.',
          callout: 'Você leu o que cada estado do projeto prova.' },
        { tipo: 'callout', tom: 'info', titulo: 'Reprodutibilidade tem camadas', html:
          'A faixa no <code>pyproject.toml</code> expressa compatibilidade declarada; o lock captura uma resolução; wheel e sdist capturam o que é distribuído; imagem ou ambiente captura runtime e sistema. Nenhuma camada sozinha prova build reproduzível bit a bit.' },
        { tipo: 'takeaway', html: 'Cada comando prova uma coisa: <mark>uv add</mark> declara, <mark>uv run</mark> executa, <mark>uv sync --locked</mark> restaura, <mark>uv build</mark> produz o que será instalado.' }
      ] },

      { rotulo: 'Praticar', blocos: [
        { tipo: 'texto', html:
          '<p>Monte o <code>pyproject.toml</code> do <code>csv-cleaner</code> escolhendo a peça certa em cada lacuna.</p>' },
        { tipo: 'complete', id: 'uv-complete', titulo: 'Complete o pyproject.toml', linguagem: 'toml', obrigatorio: false,
          enunciado: 'Escolha o trecho que mantém dependências de produção separadas das de desenvolvimento e declara o comando instalado.',
          partes: [
            '[project]\nname = "csv-cleaner"\nrequires-python = ', { lacuna: 'py', opcoes: ['">=3.14"', '"3.14.0"', '"python"'], correta: '">=3.14"' },
            '\ndependencies = ["pydantic>=2.11,<3"]\n\n[project.scripts]\ncsv-cleaner = ', { lacuna: 'ep', opcoes: ['"python_senior_lab.cli:main"', '"csv-cleaner"', '"src/python_senior_lab/cli.py"'], correta: '"python_senior_lab.cli:main"' },
            '\n\n', { lacuna: 'grp', opcoes: ['[dependency-groups]', '[tool.uv.lock]', '[project.optional-urls]'], correta: '[dependency-groups]' },
            '\ndev = ["pytest>=8.0", "mypy>=1.10", "ruff>=0.5"]\n\n[tool.mypy]\nstrict = true\n'
          ],
          explicacao: '<code>requires-python</code> é o runtime mínimo suportado (faixa, não versão exata). O entry point liga o <em>comando</em> a <code>pacote.módulo:função</code>; distribuição, import package e comando são contratos distintos. O grupo <code>dev</code> não vai para produção, e a configuração das ferramentas mora no próprio <code>pyproject.toml</code>.',
          callout: 'pyproject montado: runtime, comando e grupo de desenvolvimento nos lugares certos.' },
        { tipo: 'python', id: 'uv-python', titulo: 'Leia o pyproject por código', obrigatorio: false,
          enunciado: 'Complete <code>nome_pacote(requisito)</code> (devolve só o nome de "pydantic>=2.11,&lt;3") e <code>resumo_projeto(texto)</code>, que usa <code>tomllib</code> e devolve <code>(nome, deps, dev)</code> com listas de nomes. Sem <code>[project]</code>, levante <code>ValueError</code>; sem grupo <code>dev</code>, devolva <code>[]</code>.',
          codigo: codigo, testes: testes,
          dica: 'Corte o requisito no primeiro caractere de operador ou espaço: <code>re.split(r"[&lt;&gt;=!~;\\[ ]", r, maxsplit=1)[0]</code>. O grupo vem de <code>dados.get("dependency-groups", {}).get("dev", [])</code>.',
          solucao: solucao,
          tutorDepois: 'Intenção (faixa) e nome são coisas diferentes: o lock é quem fixa a versão. O caso sem [project] mostra a falha explícita em vez de um KeyError.',
          callout: 'Você leu a intenção declarada do projeto, que o uv.lock depois resolve.' },
        { tipo: 'takeaway', html: 'O <mark>pyproject.toml</mark> declara a intenção; o <mark>uv.lock</mark> fixa a resolução; os dois entram no controle de versão em aplicações.' }
      ] },

      { rotulo: 'Conferir', blocos: [
        { tipo: 'texto', html:
          '<h3>Os erros de ambiente que todo mundo comete</h3>' +
          '<ul><li><code>pip install X</code> ou <code>uv pip install X</code> sem ambiente explícito pode instalar no destino errado. No lab: <code>uv add</code> declara, <code>uv run</code> executa.</li>' +
          '<li><code>python script.py</code> em vez do runner do projeto pode escolher outro interpretador. Diante de <code>ModuleNotFoundError</code>, confirme executable, prefix, import spec e instalação antes de concluir a causa.</li>' +
          '<li>Editar <code>uv.lock</code> à mão: nunca. É gerado.</li>' +
          '<li>Formatos: <code>requirements.txt</code> continua útil em alguns fluxos; <code>uv.lock</code> é específico do uv; <code>pylock.toml</code> é padronizado. Escolha pelo consumidor.</li></ul>' +
          '<p>Para instalar o uv, a documentação oficial deve informar origem e versão antes de executar qualquer script remoto; depois, <code>uv --version</code> responde com a versão realmente instalada e essa é a que a evidência registra.</p>' },
        { tipo: 'escolha', id: 'uv-esc-arquivos', titulo: 'Confira: os dois arquivos',
          pergunta: 'Qual é o papel de <code>pyproject.toml</code> e de <code>uv.lock</code>?',
          opcoes: [
            { id: 'a', texto: 'uv.lock é editado à mão; pyproject.toml é gerado e ignorado pelo Git.', correta: false, porque: 'é o contrário: o lock é gerado e não se edita.' },
            { id: 'b', texto: 'Os dois são equivalentes; o uv escolhe um conforme o sistema operacional.', correta: false, porque: 'têm papéis distintos: intenção e resolução.' },
            { id: 'c', texto: 'pyproject.toml declara metadados e dependências pretendidas; uv.lock registra a resolução exata feita pelo uv.', correta: true, porque: 'você escreve restrições, a ferramenta resolve e trava; versionar só um dos dois perde reprodutibilidade.' },
            { id: 'd', texto: 'pyproject.toml guarda as versões exatas e uv.lock guarda só o nome do projeto.', correta: false, porque: 'as versões exatas estão no lock.' }
          ], tutorDepois: 'Intenção versus resolução.' },
        { tipo: 'escolha', id: 'uv-esc-ci', titulo: 'Confira: o comando do CI',
          pergunta: 'No CI você quer reconstruir o ambiente como o lock descreve e falhar se o lock estiver desatualizado em relação ao <code>pyproject.toml</code>. Qual comando?',
          opcoes: [
            { id: 'a', texto: '<code>uv sync --locked</code>', correta: true, porque: '--locked verifica o lock e dá erro se ele não bate, em vez de reescrevê-lo em silêncio.' },
            { id: 'b', texto: '<code>uv add .</code>', correta: false, porque: 'adiciona dependência; não restaura o ambiente.' },
            { id: 'c', texto: '<code>uv lock --upgrade</code> seguido de <code>uv run</code>', correta: false, porque: '--upgrade muda versões: o oposto de reproduzir.' },
            { id: 'd', texto: '<code>pip install -r pyproject.toml</code>', correta: false, porque: 'pyproject.toml não é um arquivo de requirements.' }
          ], tutorDepois: 'Em CI, previsibilidade vale mais que conveniência.' },
        { tipo: 'takeaway', html: 'Em CI, <mark>uv sync --locked</mark>; para provar a entrega, o <mark>wheel instalado fora do checkout</mark>.' }
      ] }
    ],
    revisao: [
      { id: 'm02b1-arquivos', pergunta: 'Qual a diferença entre pyproject.toml e uv.lock?', opcoes: [
        opc('a', 'pyproject declara a intenção (faixas); uv.lock registra a resolução exata do uv', true, 'intenção versus resolução; ambos são versionados em aplicações.'),
        opc('b', 'São o mesmo arquivo com nomes diferentes', false, 'têm papéis distintos.'),
        opc('c', 'uv.lock deve ser editado à mão para fixar versões', false, 'o lock é gerado; nunca se edita.')] },
      { id: 'm02b1-locked', pergunta: 'O que uv sync --locked faz no CI?', opcoes: [
        opc('a', 'Restaura o ambiente do lock e falha se o lock não bate com o pyproject', true, 'previsibilidade em vez de reescrever o lock em silêncio.'),
        opc('b', 'Atualiza todas as dependências para a última versão', false, 'isso é lock --upgrade.'),
        opc('c', 'Instala no Python global', false, 'sincroniza o ambiente do projeto.')] },
      { id: 'm02b1-fora', pergunta: 'Por que provar o wheel fora do checkout?', opcoes: [
        opc('a', 'Dentro do checkout o source tree mascara arquivo ou módulo faltando no artefato', true, 'se só passa com o projeto em sys.path, você validou o source tree, não o artefato entregue.'),
        opc('b', 'Wheels só funcionam fora de pastas Git', false, 'não há essa restrição.'),
        opc('c', 'Para evitar o uso de venv', false, 'o ambiente isolado continua sendo usado.')] },
      { id: 'm02b1-nomes', pergunta: 'Para csv-cleaner, quais são os três nomes distintos?', opcoes: [
        opc('a', 'Distribuição csv-cleaner, import package python_senior_lab e comando csv-cleaner (entry point)', true, 'são namespaces diferentes: distribuição, import e comando.'),
        opc('b', 'Todos devem ser idênticos', false, 'não precisam ser, e confundi-los gera ModuleNotFoundError.'),
        opc('c', 'Só o nome da pasta importa', false, 'a pasta não define a distribuição nem o comando.')] },
      { id: 'm02b1-camadas', pergunta: 'O que a reprodutibilidade em camadas exige?', opcoes: [
        opc('a', 'Resolução conhecida e artefato instalável, sem prometer reprodução bit a bit', true, 'nenhuma camada isolada prova build bit a bit; o gate mede o que de fato verifica.'),
        opc('b', 'Basta o lock para garantir build bit a bit', false, 'o lock fixa a resolução, não o artefato nem o sistema.'),
        opc('c', 'Basta a faixa no pyproject', false, 'faixa é compatibilidade declarada.')] }
    ]
  });
})();
