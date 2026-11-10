/* F02 · Bloco 7: arquivos, texto e módulos. Fonte: F02.html#b07. Saídas de execução real em 11/10/2026 (Python 3.14.7, Linux, locale UTF-8). */
(function () {
  var L = function (kind, text) { return { kind: kind, text: text }; };
  function opc(id, texto, correta, porque) { return { id: id, texto: texto, correta: correta, porque: porque }; }
  var J = function (a) { return a.join('\n') + '\n'; };

  TrilhaAula.registrar({
    id: 'f02-b7',
    titulo: 'Arquivos, texto e módulos',
    minutos: 45,
    resumo: 'Os defeitos da fronteira com arquivos têm três causas: caminho montado como texto, codificação assumida e formato tratado na unha. O sistema de import decide como o código se divide sem se quebrar.',
    objetivo: 'Ler e gravar arquivos com pathlib e codificação explícita, usar csv e json sem improviso, explicar o que o import faz (sys.modules, módulo parcialmente inicializado) e desfazer um ciclo.',
    revisao: [
      { id: 'f02b7-encoding', pergunta: 'open("a.txt") sem encoding= funciona na sua máquina e falha na do colega. Por quê?',
        opcoes: [
          opc('a', 'Sem encoding o Python usa o padrão da localidade, que muda entre ambientes; texto exige encoding="utf-8" explícito', true, 'o PEP 686 torna o modo UTF-8 padrão no Python 3.15, mas hoje não se deve depender disso.'),
          opc('b', 'O arquivo só abre uma vez por máquina', false, 'o problema é a codificação, não o acesso.'),
          opc('c', 'open só funciona com caminhos absolutos', false, 'caminhos relativos funcionam, ancorados no diretório corrente.')] },
      { id: 'f02b7-latin', pergunta: 'Qual a diferença entre ler UTF-8 como Latin-1 e Latin-1 como UTF-8?',
        opcoes: [
          opc('a', 'UTF-8 lido como Latin-1 nunca falha, mas corrompe em silêncio (mojibake); Latin-1 lido como UTF-8 costuma falhar alto com UnicodeDecodeError', true, 'todo byte é válido em Latin-1; por isso o laboratório usa decodificação estrita por padrão.'),
          opc('b', 'Os dois falham sempre com UnicodeDecodeError', false, 'Latin-1 aceita qualquer byte.'),
          opc('c', 'Os dois funcionam e dão o mesmo texto', false, 'cada byte do UTF-8 vira um caractere isolado.')] },
      { id: 'f02b7-path', pergunta: 'O que Path("base") / "/etc/passwd" devolve e por que importa?',
        opcoes: [
          opc('a', 'PosixPath("/etc/passwd"): componente absoluto reinicia o caminho; com entrada não confiável, resolva e confirme is_relative_to(base.resolve())', true, 'é a origem clássica de path traversal; ".." escapa da base do mesmo jeito.'),
          opc('b', 'PosixPath("base/etc/passwd")', false, 'esse seria o caso de um componente relativo.'),
          opc('c', 'ValueError', false, 'o pathlib aceita e descarta o que veio antes.')] },
      { id: 'f02b7-import', pergunta: 'O que o import faz, e por que um import circular depende do ponto de entrada?',
        opcoes: [
          opc('a', 'Consulta sys.modules, localiza o arquivo, registra o módulo ANTES de executar o corpo e então o executa uma vez; o segundo import de um módulo em construção vê um módulo parcialmente inicializado', true, 'from m import nome falha se nome ainda não foi definido; import m e acesso tardio ao atributo funciona. O remédio é extrair o que ambos precisam para um módulo-folha.'),
          opc('b', 'Copia o arquivo para dentro do seu, executando-o a cada import', false, 'o corpo roda uma só vez: o módulo é singleton por interpretador.'),
          opc('c', 'Só procura em site-packages', false, 'procura em todo sys.path, na ordem.')] },
      { id: 'f02b7-bom', pergunta: 'Um CSV exportado do Excel traz BOM e usa ";" como separador. Como ler?',
        opcoes: [
          opc('a', 'encoding="utf-8-sig", newline="" e csv com delimiter=";"; o resto (número, data, Decimal) é validação sua', true, '"12,50" existe porque a vírgula é separador decimal na localidade brasileira.'),
          opc('b', 'linha.split(",") com encoding padrão', false, 'erra campos entre aspas e vírgulas dentro do campo.'),
          opc('c', 'Ler em binário e converter à mão', false, 'o csv já resolve; o problema é declarar a codificação.')] }
    ],
    abas: [
      { rotulo: 'Arquivos e codificação', blocos: [
        { tipo: 'texto', html:
          '<h3>A fronteira onde quase tudo quebra</h3>' +
          '<p>Quase todo programa real lê dados de algum lugar e os escreve em outro, e quase todo defeito dessa fronteira tem uma de três causas: <strong>caminho</strong> montado como texto (separadores, diretório corrente), <strong>codificação</strong> assumida em vez de declarada, e <strong>formato</strong> tratado "na unha" (CSV com vírgula dentro do campo, JSON com número monetário). Do outro lado do mesmo bloco, o sistema de import decide como seu código se divide em arquivos sem se quebrar: quem o desconhece cria ciclos, sombreia a stdlib e depende de ordem de execução.</p>' +
          '<h3><code>pathlib</code>: caminhos como objetos</h3>' +
          '<p><code>pathlib.Path</code> representa um caminho como objeto imutável, com o operador <code>/</code> para compor, atributos para decompor e métodos para o sistema de arquivos. Substitui a manipulação de strings e a maior parte do <code>os.path</code>.</p>' },
        { tipo: 'codigo', linguagem: 'python', texto:
          '>>> from pathlib import Path\n>>> p = Path("/tmp/f02x/dados") / "sub" / "arq.tar.gz"\n>>> p.name, p.stem, p.suffix, p.suffixes\n(\'arq.tar.gz\', \'arq.tar\', \'.gz\', [\'.tar\', \'.gz\'])\n>>> p.parent, p.with_suffix(".zip").name\n(PosixPath(\'/tmp/f02x/dados/sub\'), \'arq.zip\')\n>>> Path("a") / "/etc"            # componente absoluto REINICIA o caminho\nPosixPath(\'/etc\')' },
        { tipo: 'callout', tom: 'danger', titulo: 'Armadilha de segurança: o componente absoluto', html:
          '<p><code>base / nome_do_usuario</code> com <code>nome_do_usuario = "/etc/passwd"</code> escapa da pasta-base (e <code>..</code> também). Para entrada não confiável, resolva e confirme que o resultado continua dentro da base: <code>resolved.is_relative_to(base.resolve())</code>.</p>' },
        { tipo: 'texto', html:
          '<p>Os métodos de uso diário: <code>exists()</code>, <code>is_file()</code>, <code>mkdir(parents=True, exist_ok=True)</code>, <code>glob("*.csv")</code>/<code>rglob</code>, <code>iterdir()</code>, <code>read_text(encoding=...)</code>, <code>write_text(...)</code>, <code>read_bytes()</code>, <code>unlink(missing_ok=True)</code>, <code>stat()</code>. Para arquivos temporários, <code>tempfile</code> (e, nos testes, o fixture <code>tmp_path</code>). Caminhos relativos dependem do <strong>diretório corrente</strong> (F01), não da pasta do script: ancore em <code>Path(__file__).parent</code> quando o dado viaja com o código.</p>' +
          '<h3>Abrir, ler, escrever: texto versus binário</h3>' +
          '<p><code>open(caminho, modo, encoding=..., newline=...)</code> devolve um objeto de arquivo. Dois mundos, escolhidos pelo modo: <strong>texto</strong> (<code>"r"</code>, <code>"w"</code>, <code>"a"</code>) lê e escreve <code>str</code>, decodificando e codificando com <code>encoding</code> e traduzindo fins de linha; <strong>binário</strong> (<code>"rb"</code>, <code>"wb"</code>) lê e escreve <code>bytes</code> sem tradução, para imagens, hashes, protocolos e quando <em>você</em> controla a decodificação.</p>' +
          '<p>Sempre dentro de <code>with</code> (bloco 6) e <strong>sempre com <code>encoding="utf-8"</code> em texto</strong>. Sem o argumento, o Python usa a codificação da localidade (<code>locale.getencoding()</code>), que difere entre máquinas e CI: o bug "só falha na máquina do colega". Na versão testada (3.14.7, Linux, locale UTF-8) o padrão acidentalmente coincide, e é por isso que o bug passa nos testes locais. O PEP 686 torna o modo UTF-8 padrão a partir do Python 3.15; até lá, e para código que precisa rodar em várias versões, declare.</p>' },
        { tipo: 'codigo', linguagem: 'python', texto:
          '>>> f = tmp / "x.txt"; f.write_text("ação\\n", encoding="utf-8")\n>>> f.read_bytes(), f.stat().st_size\n(b\'a\\xc3\\xa7\\xc3\\xa3o\\n\', 7)\n>>> f.read_text(encoding="latin-1")          # leitura na codificação ERRADA: não falha, corrompe\n\'aÃ§Ã£o\\n\'\n>>> import locale, sys; locale.getencoding(), sys.flags.utf8_mode\n(\'UTF-8\', 0)' },
        { tipo: 'texto', html:
          '<p>Ler UTF-8 como Latin-1 <em>nunca</em> falha (todo byte é válido em Latin-1), só produz mojibake silencioso; o contrário (Latin-1 lido como UTF-8) normalmente falha alto, com <code>UnicodeDecodeError</code>, o que é desejável. Daí a regra de decisão do laboratório: <strong>decodificação estrita por padrão</strong>, e erro com mensagem útil em vez de <code>errors="replace"</code>.</p>' +
          '<p>Fins de linha: no modo texto, <code>\\r\\n</code> e <code>\\r</code> lidos viram <code>\\n</code> (<em>universal newlines</em>) e, na escrita, <code>\\n</code> vira o separador da plataforma, a não ser que se passe <code>newline=""</code> (sem tradução) ou <code>newline="\\n"</code>. Um byte-order mark (BOM) de UTF-8, comum em CSV exportado do Excel, aparece como <code>\\ufeff</code> grudado no primeiro campo se você abrir com <code>"utf-8"</code>; com <code>"utf-8-sig"</code> ele é removido. O teste <code>test_bom_breaks_utf8_header_but_utf8_sig_reads_it</code> fixa ambos os lados.</p>' +
          '<p>Leitura: <code>for linha in arquivo</code> itera preguiçosamente (bloco 5); <code>.read()</code> carrega tudo; <code>.read(n)</code> lê em blocos. Escrita: <code>.write()</code> não acrescenta <code>\\n</code> sozinho. Para gravar sem corromper o destino em caso de falha no meio, veja o <code>AtomicWriter</code> do bloco 6; durabilidade contra queda de energia pediria também <code>flush()</code> e <code>os.fsync()</code>, que o laboratório omite de propósito (fora de escopo).</p>' },
        { tipo: 'escolha', id: 'f02b7-esc-latin', titulo: 'Confira: a codificação errada',
          pergunta: 'Um arquivo foi gravado em UTF-8 contendo "ação". Você o lê com open(p, encoding="latin-1"). O que acontece?',
          opcoes: [
            { id: 'a', texto: 'UnicodeDecodeError, pois latin-1 detecta UTF-8', correta: false, porque: 'Latin-1 mapeia qualquer byte para algum caractere, então nunca falha.' },
            { id: 'b', texto: 'Lê sem erro, mas o texto vira "aÃ§Ã£o": corrupção silenciosa', correta: true, porque: 'cada byte do UTF-8 é interpretado isoladamente. UTF-8 é mais rigoroso e falha alto: declare encoding sempre e trate o erro de decodificação como informação.' },
            { id: 'c', texto: 'Lê perfeitamente: Latin-1 é um superconjunto de UTF-8', correta: false, porque: 'não é: é uma codificação de um byte por caractere.' },
            { id: 'd', texto: 'Lê só os caracteres ASCII', correta: false, porque: 'lê todos os bytes, interpretados como Latin-1.' }
          ], tutorDepois: 'Encoding declarado e decodificação estrita são o padrão do laboratório.' },
        { tipo: 'takeaway', html: 'Texto é <code>str</code> com <mark>encoding explícito</mark>, nunca o padrão da plataforma; componente absoluto <mark>reinicia</mark> o <code>Path</code>; Latin-1 lido como UTF-8 falha alto, o contrário <mark>corrompe em silêncio</mark>.' }
      ] },

      { rotulo: 'CSV, JSON e a CLI', blocos: [
        { tipo: 'texto', html:
          '<h3>O caminho de um dado pelo laboratório</h3>' +
          '<p><code>cli.py</code> recebe um <code>Path</code> (argparse, <code>type=Path</code>); <code>scan</code> abre com <code>encoding</code> explícito e <code>newline=""</code>; <code>csv.DictReader</code> separa os campos; <code>parse_row</code> converte texto em <code>Decimal</code>/<code>date</code>/<code>str</code> normalizada (bloco 2) e levanta <code>InvalidRowError</code> com linha e campo (bloco 6); o resultado é um fluxo preguiçoso (bloco 5) agregado em <code>dict</code> (bloco 4); a saída vai em JSON com <code>Decimal</code> como string, via escrita atômica. Preveja o que acontece quando o arquivo está em Latin-1 e a CLI não foi avisada.</p>' },
        { tipo: 'rode', id: 'f02b7-rode', titulo: 'Latin-1 sem avisar a codificação', enunciado: 'O arquivo <code>lat.csv</code> foi gravado em Latin-1 (o byte <code>0xE9</code> é o "é" de "Café"). Rode a CLI sem e com <code>--encoding latin-1</code>.',
          prefixo: '$', entrada: 'python -m expenses report lat.csv', unidade: 'etapa', terminalTitulo: 'terminal',
          etapas: [
            { id: 'arq', nome: 'O arquivo', descricao: 'Latin-1, byte 0xE9', tom: 'dns', ms: 1, linhas: [
              L('cmd', "printf 'date,category,amount,description\\n2026-01-01,Caf\\xe9,1.00,x\\n' > lat.csv"),
              L('info', 'lat.csv tem o byte 0xE9, inválido em UTF-8')] },
            { id: 'estrito', nome: 'UTF-8 estrito', descricao: 'Sem --encoding', tom: 'tcp', ms: 2, linhas: [
              L('cmd', 'python -m expenses report lat.csv; echo "exit=$?"'),
              L('in', 'expenses: lat.csv não é utf-8 válido (byte 47: invalid continuation byte)'),
              L('in', 'exit=2'),
              L('hint', 'o UnicodeDecodeError virou EncodingMismatchError: problema de ambiente (exit 2), não de dado; a mensagem diz qual byte e onde')] },
            { id: 'latin', nome: '--encoding latin-1', descricao: 'Codificação declarada', tom: 'tls', ms: 3, linhas: [
              L('cmd', 'python -m expenses report lat.csv --encoding latin-1; echo "exit=$?"'),
              L('out', 'café                        1.00'),
              L('out', 'total                       1.00'),
              L('out', 'exit=0'),
              L('hint', 'com a codificação certa, o mesmo arquivo é lido e a categoria é normalizada para café')] }
          ],
          prever: { pergunta: 'Sem --encoding, o que a CLI faz com o arquivo em Latin-1?', opcoes: [
            { id: 'a', texto: 'Lê normalmente e mostra "CafÃ©", e sai com código 0.', correta: false, porque: 'esse é o comportamento de ler UTF-8 como Latin-1; o contrário, Latin-1 lido como UTF-8, falha alto.' },
            { id: 'b', texto: 'Recusa com uma mensagem que aponta o byte e a posição, e sai com código 2.', correta: true, porque: 'decodificação estrita por padrão; o erro vira EncodingMismatchError e exit 2 (ambiente, não dado).' },
            { id: 'c', texto: 'Troca o byte inválido por um caractere de substituição e segue com exit 0.', correta: false, porque: 'errors="replace" troca o dado por um caractere de substituição e esconde o erro; o laboratório evita isso.' }
          ] },
          tutorAntes: 'Digite o comando já preenchido e aperte Enter. Clique em "--encoding latin-1" para o segundo comando.',
          tutorDepois: 'O contrato de exit codes do F01 em ação: 0 tudo válido; 1 dados inválidos; 2 uso ou ambiente. A mensagem de erro diz onde e o quê, que é o que quem automatiza precisa.',
          callout: 'Você viu a decodificação estrita virar um erro claro e a codificação declarada resolver.' },
        { tipo: 'texto', html:
          '<h3>CSV e JSON: nunca na unha</h3>' +
          '<p>O módulo <code>csv</code> trata o que o <code>split(",")</code> erra: campos entre aspas, vírgulas e quebras de linha dentro do campo, aspas escapadas por duplicação.</p>' },
        { tipo: 'codigo', linguagem: 'python', texto:
          '>>> import csv, io\n>>> buf = io.StringIO(); csv.writer(buf).writerow([\'a,b\', \'c"d\', \'e\\nf\']); buf.getvalue()\n\'"a,b","c""d","e\\nf"\\r\\n\'\n>>> list(csv.reader(io.StringIO(\'x;y\\n"1,5";2\\n\'), delimiter=";"))\n[[\'x\', \'y\'], [\'1,5\', \'2\']]' },
        { tipo: 'texto', html:
          '<p>Dois requisitos: abrir o arquivo com <code>newline=""</code> (para que o <code>csv</code>, e não o modo texto, interprete as quebras dentro de campos) e escolher o <code>delimiter</code> conforme a origem: CSV de Excel em localidade brasileira usa <code>;</code> porque a vírgula é separador decimal, e o valor "12,50" do arquivo de exemplo do laboratório existe por isso. <code>DictReader</code> devolve cada linha como <code>dict</code> pelo cabeçalho; <code>reader.line_num</code> dá a linha física. Tudo que sai do <code>csv</code> é <code>str</code>: converter para número, data ou Decimal e validar é trabalho seu (<code>parsing.py</code>).</p>' +
          '<p>O <code>json</code> converte entre texto e <code>dict</code>/<code>list</code>/<code>str</code>/<code>int</code>/<code>float</code>/<code>bool</code>/<code>None</code>. Comportamentos que viram bug:</p>' },
        { tipo: 'codigo', linguagem: 'python', texto:
          '>>> import json\n>>> json.dumps({"s": "ação"}), json.dumps({"s": "ação"}, ensure_ascii=False)\n(\'{"s": "a\\\\u00e7\\\\u00e3o"}\', \'{"s": "ação"}\')\n>>> json.dumps({"d": Decimal("1.1")})\nTypeError: Object of type Decimal is not JSON serializable\n>>> json.loads("1e400"), json.loads("NaN"), json.loads(\'{"a":1,"a":2}\')\n(inf, nan, {\'a\': 2})\n>>> json.dumps(float("nan"), allow_nan=False)\nValueError: Out of range float values are not JSON compliant: nan\n>>> json.dumps({1: "a", None: "b"}), json.loads(json.dumps((1, 2)))\n(\'{"1": "a", "null": "b"}\', [1, 2])' },
        { tipo: 'texto', html:
          '<p><code>ensure_ascii=True</code> (padrão) escapa tudo que não é ASCII, válido mas ilegível; use <code>False</code> e grave em UTF-8. O JSON não tem <code>Decimal</code>, datas nem tuplas (viram lista); chaves viram <code>str</code> (<code>1</code> e <code>None</code> → <code>"1"</code>, <code>"null"</code>, e podem colidir); o parser aceita <code>NaN</code>/<code>Infinity</code> (que não são JSON válido pela especificação) e chaves duplicadas (vence a última, em silêncio); números fora da faixa viram <code>inf</code>. Para a fronteira de uma API, a validação estrita é trabalho do Pydantic (M02). No laboratório, a regra é a do bloco 2: dinheiro trafega como <em>string</em> decimal.</p>' },
        { tipo: 'python', id: 'f02b7-python', titulo: 'Importe um CSV do Excel brasileiro', obrigatorio: false,
          enunciado: 'Complete <code>importar(dados, encoding="utf-8-sig")</code>: <code>dados</code> são <code>bytes</code> de um CSV com <code>;</code>, colunas <code>categoria</code> e <code>valor</code>. Decodifique (um <code>UnicodeDecodeError</code> vira <code>ValueError</code> com <code>raise ... from</code>), leia com <code>csv.DictReader</code> e <code>delimiter=";"</code>, normalize a categoria para NFC, valide o valor com <code>[0-9]+(?:[.,][0-9]{1,2})?</code> (nunca <code>\\d</code>) e devolva uma lista de <code>(categoria, Decimal)</code> com duas casas. Valor inválido: <code>ValueError</code> citando a linha.',
          codigo: J([
            'import csv',
            'import io',
            'import re',
            'import unicodedata',
            'from decimal import Decimal',
            '',
            'PADRAO = re.compile(r"[0-9]+(?:[.,][0-9]{1,2})?")',
            '',
            '',
            'def importar(dados, encoding="utf-8-sig"):',
            '    try:',
            '        texto = dados.decode(encoding)',
            '    except UnicodeDecodeError as err:',
            '        raise ValueError("codificação inválida") from err',
            '    leitor = csv.DictReader(io.StringIO(texto, newline=""), delimiter=";")',
            '    linhas = []',
            '    for row in leitor:',
            '        # 1. categoria: strip e normalize NFC',
            '        # 2. valor: valide com PADRAO.fullmatch; senao ValueError com leitor.line_num',
            '        # 3. troque a virgula por ponto e use Decimal(...).quantize(Decimal("0.01"))',
            '        pass',
            '    return linhas',
            '',
            '',
            'bruto = "categoria;valor\\ncafé;12,5\\n".encode("utf-8")',
            'print(importar(bruto))'
          ]),
          testes: J([
            'def test_caminho_feliz_com_virgula_decimal():',
            '    bruto = "categoria;valor\\ncafé;12,5\\npão;3.40\\n".encode("utf-8")',
            '    assert importar(bruto) == [("café", Decimal("12.50")), ("pão", Decimal("3.40"))]',
            '',
            '',
            'def test_bom_e_removido_pelo_utf_8_sig():',
            '    bruto = "categoria;valor\\nx;1\\n".encode("utf-8-sig")',
            '    assert importar(bruto) == [("x", Decimal("1.00"))]',
            '',
            '',
            'def test_categoria_nfd_vira_nfc():',
            '    nfd = unicodedata.normalize("NFD", "café")',
            '    bruto = f"categoria;valor\\n{nfd};1\\n".encode("utf-8")',
            '    assert importar(bruto)[0][0] == "café"',
            '    assert len(importar(bruto)[0][0]) == 4',
            '',
            '',
            'def test_digito_arabe_e_recusado_com_a_linha():',
            '    bruto = "categoria;valor\\nx;1\\ny;٣٤\\n".encode("utf-8")',
            '    try:',
            '        importar(bruto)',
            '    except ValueError as err:',
            '        assert "2" in str(err) or "3" in str(err)',
            '        return',
            '    raise AssertionError("esperava ValueError")',
            '',
            '',
            'def test_latin1_sem_avisar_falha_alto_e_mantem_a_causa():',
            '    bruto = "categoria;valor\\ncafé;1\\n".encode("latin-1")',
            '    try:',
            '        importar(bruto)',
            '    except ValueError as err:',
            '        assert isinstance(err.__cause__, UnicodeDecodeError)',
            '        return',
            '    raise AssertionError("esperava ValueError")',
            '',
            '',
            'def test_latin1_com_encoding_declarado_funciona():',
            '    bruto = "categoria;valor\\ncafé;1\\n".encode("latin-1")',
            '    assert importar(bruto, encoding="latin-1") == [("café", Decimal("1.00"))]',
            '',
            '',
            'def test_controle_negativo_utf8_comum_deixa_o_bom_no_cabecalho():',
            '    bruto = "categoria;valor\\nx;1\\n".encode("utf-8-sig")',
            '    assert bruto.decode("utf-8").startswith("\\ufeff")'
          ]),
          dica: 'Dentro do laço: <code>categoria = unicodedata.normalize("NFC", row["categoria"].strip())</code>; <code>bruto = row["valor"].strip()</code>; se <code>PADRAO.fullmatch(bruto)</code> for <code>None</code>, <code>raise ValueError(f"linha {leitor.line_num}: valor inválido: {bruto!r}")</code>; depois <code>Decimal(bruto.replace(",", ".")).quantize(Decimal("0.01"))</code>.',
          solucao: J([
            'import csv',
            'import io',
            'import re',
            'import unicodedata',
            'from decimal import Decimal',
            '',
            'PADRAO = re.compile(r"[0-9]+(?:[.,][0-9]{1,2})?")',
            '',
            '',
            'def importar(dados, encoding="utf-8-sig"):',
            '    try:',
            '        texto = dados.decode(encoding)',
            '    except UnicodeDecodeError as err:',
            '        raise ValueError("codificação inválida") from err',
            '    leitor = csv.DictReader(io.StringIO(texto, newline=""), delimiter=";")',
            '    linhas = []',
            '    for row in leitor:',
            '        categoria = unicodedata.normalize("NFC", row["categoria"].strip())',
            '        bruto = row["valor"].strip()',
            '        if PADRAO.fullmatch(bruto) is None:',
            '            raise ValueError(f"linha {leitor.line_num}: valor inválido: {bruto!r}")',
            '        valor = Decimal(bruto.replace(",", ".")).quantize(Decimal("0.01"))',
            '        linhas.append((categoria, valor))',
            '    return linhas'
          ]),
          tutorDepois: 'Cada decisão vem de um bloco: encoding explícito e utf-8-sig (este), Decimal de str (bloco 2), ValueError com from (bloco 6) e [0-9] em vez de \\d (bloco 2). O controle negativo mostra o BOM grudado no cabeçalho quando se decodifica com "utf-8".',
          callout: 'Encoding declarado, formato validado na borda e causa preservada.' },
        { tipo: 'takeaway', html: 'Use <code>csv</code> (com <mark>newline=""</mark> e o <code>delimiter</code> da origem) e <code>json</code>; dinheiro vai como <mark>string</mark>; <code>utf-8-sig</code> só para entrada de Excel.' }
      ] },

      { rotulo: 'Import e ciclos', blocos: [
        { tipo: 'texto', html:
          '<h3>O sistema de import</h3>' +
          '<p><code>import x</code> não é "incluir um arquivo". É uma operação com cache, em quatro passos: procura <code>x</code> em <strong><code>sys.modules</code></strong> (um <code>dict</code> nome → módulo) e, se está lá, devolve o objeto, de modo que <strong>o código do módulo não roda de novo</strong>; se não, percorre os <em>finders</em> em <code>sys.meta_path</code>, que procuram nos diretórios de <code>sys.path</code> (pasta do script ou diretório corrente, stdlib, <code>site-packages</code> do ambiente, e o que o <code>.pth</code> de uma instalação editável acrescenta); cria o objeto módulo vazio e <strong>o registra em <code>sys.modules</code></strong>; e só então <strong>executa o corpo do arquivo</strong>, de cima a baixo, no espaço de nomes do módulo. As funções e classes que existem são as que o corpo já definiu até aquele ponto.</p>' },
        { tipo: 'ordene', id: 'f02b7-ordene', titulo: 'Ordene o primeiro import', obrigatorio: false,
          enunciado: 'Ordene o que acontece no primeiro <code>import util</code>. Repare em <em>quando</em> o módulo é registrado: é isso que torna o import circular possível.',
          itens: [
            { id: 'c', texto: 'Cria o objeto módulo e o registra em sys.modules' },
            { id: 'e', texto: 'Liga o nome no namespace de quem importou' },
            { id: 'a', texto: 'Procura o nome em sys.modules; se já está lá, devolve e termina' },
            { id: 'd', texto: 'Executa o corpo do módulo, de cima para baixo, uma única vez' },
            { id: 'b', texto: 'Localiza o arquivo percorrendo sys.path' }
          ],
          solucao: ['a', 'b', 'c', 'd', 'e'],
          dica: 'O registro em sys.modules vem antes da execução do corpo.',
          callout: 'Registrar antes de executar é o que deixa um segundo import ver um módulo pela metade.' },
        { tipo: 'texto', html:
          '<p>Dois corolários: um módulo é <strong>um singleton por interpretador</strong> (estado global de módulo é compartilhado por todos que o importam), e o efeito colateral no topo (conexão, <code>print</code>, leitura de arquivo) acontece uma vez, no primeiro import, na ordem em que ele ocorrer. Mantenha o topo dos módulos só com definições; trabalho vai em funções.</p>' +
          '<p>Um <strong>pacote</strong> é uma pasta importável (tradicionalmente com <code>__init__.py</code>, que define a "cara" do pacote: o que reexporta, <code>__all__</code>); um <strong>módulo</strong> é um arquivo <code>.py</code>. Importar <code>pacote.d</code> importa antes o pacote <code>pacote</code> e executa seu <code>__init__.py</code>. <code>__main__.py</code> dentro do pacote é o que roda com <code>python -m pacote</code>. Pastas sem <code>__init__.py</code> viram <em>pacotes de namespace</em>, úteis em casos específicos e fonte de confusão nos demais: inclua o arquivo.</p>' +
          '<p>Duas formas de import: <strong>absoluto</strong> (<code>from expenses.model import Expense</code>, preferido: claro de qualquer lugar) e <strong>relativo</strong> (<code>from .model import Expense</code>, só dentro de pacote). Em projetos reais use o <strong>layout <code>src/</code></strong> (<code>src/expenses/...</code>), como o laboratório: o pacote só é importável depois de instalado (editável, via <code>uv sync</code>), o que impede o teste de passar "por acaso" porque a pasta corrente estava no <code>sys.path</code>. Estilo: <code>import modulo</code> e <code>from pacote import item</code> no <strong>topo do arquivo</strong>, agrupados (stdlib, terceiros, locais; o <code>ruff</code> com regra <code>I</code> ordena). Evite <code>from x import *</code>. Importar dentro de função é legítimo para dependência opcional ou pesada (<code>python -X importtime</code> mostra o tempo por módulo; <code>import json</code> custa ≈2 ms aqui) e para quebrar ciclos.</p>' +
          '<h3>Import circular</h3>' +
          '<p>Um ciclo ocorre quando A importa B e B importa A. Como o módulo é registrado em <code>sys.modules</code> <em>antes</em> de seu corpo executar, o segundo import encontra um módulo <strong>parcialmente inicializado</strong>. O que acontece depende de <em>como</em> se importa.</p>' },
        { tipo: 'abas', rotulo: 'O mesmo ciclo, dois jeitos', itens: [
          { rotulo: 'from pacote.a import fa', blocos: [
            { tipo: 'codigo', linguagem: 'python', texto: '# pacote/a.py                         # pacote/b.py\nfrom pacote import b                   from pacote.a import fa\ndef fa(): return "a"                   def fb(): return fa()\n\n$ python -c "import pacote.a"\n  File ".../pacote/a.py", line 1, in <module>\n    from pacote import b\n  File ".../pacote/b.py", line 1, in <module>\n    from pacote.a import fa\nImportError: cannot import name \'fa\' from partially initialized module \'pacote.a\'\n(most likely due to a circular import)' },
            { tipo: 'texto', html: '<p><code>a</code> começa e, na linha 1, importa <code>b</code>; <code>b</code> executa e pede o <em>nome</em> <code>fa</code> de <code>a</code>, mas o corpo de <code>a</code> ainda não passou da linha 1, e <code>fa</code> ainda não existe.</p>' }] },
          { rotulo: 'import pacote.d as d', blocos: [
            { tipo: 'codigo', linguagem: 'python', texto: '# pacote/c.py                          # pacote/d.py\nimport pacote.d as d                   import pacote.c as c\ndef fc(): return d.fd()                def fd(): return "d"\n                                       def uso(): return c.fc()\n$ python -c "import pacote.c as c; print(c.fc())"\ninit pacote\nd' },
            { tipo: 'texto', html: '<p>Nenhum módulo precisa de um nome do outro <em>durante o import</em>; os atributos só são resolvidos quando as funções rodam, com os dois módulos completos.</p>' }] }
        ] },
        { tipo: 'texto', html:
          '<p>Mas funcionar não significa estar certo: <strong>o ciclo é sintoma de acoplamento mal desenhado</strong>. Os remédios, em ordem de preferência: (1) <strong>extrair</strong> o que ambos precisam para um terceiro módulo que não importe nenhum dos dois (tipos, constantes, exceções): por isso <code>errors.py</code> e <code>model.py</code> do laboratório são folhas; (2) <strong>inverter a dependência</strong>: A recebe B por parâmetro (ou um <code>Protocol</code>, M02) em vez de importá-lo; (3) <strong>adiar o import</strong> para dentro da função que o usa, como paliativo; (4) para anotações de tipo, importar sob <code>if TYPE_CHECKING:</code> (M02). Ordem de dependência do laboratório, sem ciclo: <code>errors</code> e <code>model</code> → <code>parsing</code> → <code>reader</code> → <code>aggregate</code>/<code>export</code> → <code>cli</code>.</p>' },
        { tipo: 'cenario', id: 'f02b7-cenario', titulo: 'O import que só quebra num ponto de entrada', obrigatorio: false,
          enunciado: 'O módulo pedidos importa clientes e clientes importa pedidos. python -m app funciona; o teste de clientes quebra com ImportError. Decida.',
          inicio: 'inicio',
          nos: {
            inicio: { texto: 'O ImportError diz "cannot import name ... from partially initialized module". O que você faz?', opcoes: [
              { texto: 'Mover o import para dentro da função e seguir em frente.', vai: 'f-paliativo', tom: 'ruim', consequencia: 'funciona, mas o acoplamento continua e o próximo ciclo reaparece em outro ponto de entrada.' },
              { texto: 'Extrair o que os dois usam (tipos, constantes, exceções) para um módulo-folha que não importa nenhum dos dois.', vai: 'f-bom', tom: 'ok', consequencia: 'a dependência passa a ter um só sentido, como errors e model no laboratório.' },
              { texto: 'Trocar a ordem dos imports no topo até o erro sumir.', vai: 'f-ordem', tom: 'ruim', consequencia: 'o erro some num ponto de entrada e volta noutro; a correção depende de ordem de execução.' }
            ] }
          },
          finais: {
            'f-bom': { bom: true, texto: 'Dependências em uma direção, sem depender da ordem em que alguém importou primeiro.' },
            'f-paliativo': { bom: false, texto: 'Adiar o import é o remédio de terceira preferência: serve de paliativo, não de desenho.' },
            'f-ordem': { bom: false, texto: 'A ordem de import vira acoplamento oculto, o pior tipo.' }
          },
          callout: 'Você desfez o ciclo no desenho, não na ordem.' },
        { tipo: 'takeaway', html: '<code>import</code> consulta <mark>sys.modules</mark>, executa o corpo <mark>uma vez</mark> e registra o módulo antes de terminá-lo; o remédio do ciclo é <mark>extrair a dependência comum</mark>.' }
      ] },

      { rotulo: 'Conferir', blocos: [
        { tipo: 'texto', html:
          '<h3>Decisões e erros comuns</h3>' +
          '<ul><li><strong>Caminhos:</strong> <code>Path</code>, não concatenação de strings; ancore dados do pacote em <code>__file__</code>, dados do usuário em argumentos.</li>' +
          '<li><strong>Texto:</strong> <code>encoding="utf-8"</code> explícito em toda leitura e escrita; <code>utf-8-sig</code> só para entrada de Excel; formato de saída decidido por você, não pela plataforma.</li>' +
          '<li><strong>Formatos:</strong> <code>csv</code> e <code>json</code> da stdlib; um parser caseiro vira dívida.</li>' +
          '<li><strong>Arquivos grandes:</strong> iterar linha a linha; <code>read()</code> só quando sabe que cabe.</li>' +
          '<li><strong>Módulos:</strong> topo só com definições; dependências em uma direção; nomes que não colidem com a stdlib.</li></ul>' },
        { tipo: 'callout', tom: 'danger', titulo: 'Armadilha que pega sênior: importlib.reload e estado de módulo não são o que parecem', html:
          '<p>Como o módulo é um singleton em <code>sys.modules</code>, "re-importar" não recarrega nada. <code>importlib.reload(m)</code> re-executa o corpo no <em>mesmo</em> objeto módulo, mas quem fez <code>from m import f</code> continua segurando a função <em>antiga</em>, e instâncias de classes velhas não viram instâncias das novas. Em REPL ou notebook isso gera "corrigi o código e o comportamento não mudou" ou, pior, mistura de versões. Em testes, estado global de módulo (cache, singleton, configuração) vaza entre testes: isole com fixtures (<code>monkeypatch</code>) ou elimine o estado global. Reiniciar o processo é a única garantia.</p>' },
        { tipo: 'escolha', id: 'f02b7-esc-path', titulo: 'Confira: o caminho absoluto',
          pergunta: 'O que Path("base") / "/etc/passwd" devolve?',
          opcoes: [
            { id: 'a', texto: 'PosixPath("/etc/passwd"): um componente absoluto reinicia o caminho', correta: true, porque: 'igual a os.path.join. É fonte clássica de path traversal: valide com resolve() e is_relative_to() antes de usar nome vindo do usuário.' },
            { id: 'b', texto: 'PosixPath("base/etc/passwd")', correta: false, porque: 'só um componente relativo seria concatenado.' },
            { id: 'c', texto: 'PosixPath("base//etc/passwd")', correta: false, porque: 'o pathlib normaliza separadores e ainda descarta a base.' },
            { id: 'd', texto: 'Erro de valor', correta: false, porque: 'não há erro: o resultado é silencioso, e é isso que torna o caso perigoso.' }
          ], tutorDepois: 'Entrada não confiável nunca entra num caminho sem validar que o resultado continua dentro da base.' },
        { tipo: 'escolha', id: 'f02b7-esc-circular', titulo: 'Confira: o ciclo que funciona',
          pergunta: 'Dois módulos se importam. Com "import pacote.d as d" e acesso a d.fd() só dentro de funções, o ciclo não quebra. Por que ainda assim é um problema?',
          opcoes: [
            { id: 'a', texto: 'Porque o ciclo é sintoma de acoplamento mal desenhado; o remédio é extrair a dependência comum para um módulo-folha', correta: true, porque: 'funcionar nesse ponto de entrada não garante que funcione noutro; depende de ordem de execução.' },
            { id: 'b', texto: 'Porque import com "as" é proibido em ciclos', correta: false, porque: 'o "as" só renomeia; o que vale é importar o módulo e resolver o atributo tarde.' },
            { id: 'c', texto: 'Não é um problema: funcionou, está certo', correta: false, porque: 'o ciclo continua frágil a qualquer mudança de ordem de import.' }
          ], tutorDepois: 'Dependências em uma direção, sempre.' },
        { tipo: 'texto', html: '<p class="ta-nota">Saídas de execução real em 11/10/2026 com Python 3.14.7 (Linux, locale UTF-8). O padrão de codificação coincide com UTF-8 nesse ambiente, e é por isso que o bug de encoding passa nos testes locais. O PEP 686 (UTF-8 como padrão) tem como alvo o Python 3.15: revalide antes de remover <code>encoding=</code>.</p>' },
        { tipo: 'takeaway', html: 'Topo do módulo só com <mark>definições</mark>; dependências em <mark>uma direção</mark>; estado global de módulo vaza entre testes e <code>reload</code> não é garantia.' }
      ] }
    ]
  });
})();
