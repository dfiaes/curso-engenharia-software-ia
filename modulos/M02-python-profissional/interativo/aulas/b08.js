/* M02 · Bloco 8: estratégia de testes, CLI e entrega. Fonte: M02.html#b8. Baseline do lab: 51 testes aprovados (pode crescer; não é meta). */
(function () {
  var L = function (kind, text) { return { kind: kind, text: text }; };
  function opc(id, texto, correta, porque) { return { id: id, texto: texto, correta: correta, porque: porque }; }
  var py = function (l) { return l.join('\n') + '\n'; };

  var codigo = py([
    'from decimal import Decimal, InvalidOperation',
    '',
    '',
    'def parse_decimal(bruto):',
    '    # "1.234,56" -> Decimal("1234.56"); "10" -> Decimal("10"); "10,5" -> Decimal("10.5")',
    '    # vazio (ou so espacos) -> ValueError("valor vazio"); lixo -> ValueError("valor invalido")',
    '    return Decimal("0")'
  ]);
  var testes = py([
    'from decimal import Decimal',
    '',
    '',
    'def test_formatos():',
    '    assert parse_decimal("10") == Decimal("10")',
    '    assert parse_decimal("10,5") == Decimal("10.5")',
    '    assert parse_decimal("1.000,00") == Decimal("1000.00")',
    '    assert parse_decimal("1.234,56") == Decimal("1234.56")',
    '',
    '',
    'def test_vazio_explode():',
    '    for v in ("", "   "):',
    '        try:',
    '            parse_decimal(v)',
    '        except ValueError as e:',
    '            assert "valor vazio" in str(e)',
    '        else:',
    '            assert False, "vazio deveria falhar"',
    '',
    '',
    'def test_lixo_explode():',
    '    try:',
    '        parse_decimal("abc")',
    '    except ValueError as e:',
    '        assert "valor invalido" in str(e)',
    '    else:',
    '        assert False, "lixo deveria falhar"',
    '',
    '',
    'def test_propriedade_round_trip():',
    '    # a propriedade do modulo: aceito, serializado e lido de novo preserva o valor',
    '    for texto in ("0.01", "1234.50", "-3.10", "0"):',
    '        v = Decimal(texto)',
    '        escrito = format(v, "f").replace(".", ",")',
    '        assert parse_decimal(escrito) == v',
    '',
    '',
    'def test_controle_negativo_formula_copiada():',
    '    # um oraculo independente: 1.234,56 NAO e 1.23456',
    '    assert parse_decimal("1.234,56") != Decimal("1.23456")'
  ]);
  var solucao = py([
    'from decimal import Decimal, InvalidOperation',
    '',
    '',
    'def parse_decimal(bruto):',
    '    texto = bruto.strip()',
    '    if not texto:',
    '        raise ValueError("valor vazio")',
    '    normal = texto.replace(".", "").replace(",", ".")',
    '    try:',
    '        return Decimal(normal)',
    '    except InvalidOperation:',
    '        raise ValueError("valor invalido") from None'
  ]);

  TrilhaAula.registrar({
    id: 'm02-b8',
    titulo: 'Estratégia de testes, CLI e entrega',
    minutos: 40,
    resumo: 'Com código gerado por IA, o teste vira especificação executável: propriedade, caso negativo e mutação desafiam o oráculo. A entrega só existe quando o wheel roda fora do checkout.',
    objetivo: 'Escrever testes pytest com oráculo independente, usar fixtures, propriedades e controle negativo, ordenar os gates do lab e provar a distribuição fora do source tree.',
    abas: [
      { rotulo: 'Entender', blocos: [
        { tipo: 'texto', html:
          '<h3>Pytest: comportamento antes da implementação</h3>' +
          '<p>Funções e classes de teste são convenções de coleta, e <code>assert</code> é reescrito durante a importação e a coleta para dar diagnóstico rico. Isso não torna a suíte boa: o <strong>oráculo</strong> precisa distinguir comportamento correto de uma implementação plausível, mas errada.</p>' },
        { tipo: 'codigo', linguagem: 'python', texto:
          'def test_parse_valor_com_virgula() -> None:\n    assert parse_decimal("1.234,56") == Decimal("1234.56")\n\ndef test_parse_valor_vazio_explode() -> None:\n    with pytest.raises(ValueError, match="valor vazio"):   # Assert.Throws\n        parse_decimal("")\n\n@pytest.mark.parametrize(                                   # [Theory]/[InlineData]\n    ("bruto", "esperado"),\n    [("10", Decimal("10")), ("10,5", Decimal("10.5")), ("1.000,00", Decimal("1000.00"))],\n)\ndef test_parse_valor_formatos(bruto: str, esperado: Decimal) -> None:\n    assert parse_decimal(bruto) == esperado' },
        { tipo: 'texto', html:
          '<h3>Fixtures: composição, escopo e teardown</h3>' +
          '<p>Em vez de construtor/IClassFixture, você declara funções provedoras e os testes <strong>pedem pelo nome do parâmetro</strong>: injeção por nome, com escopo, teardown e composição. <code>tmp_path</code> é fixture builtin (pasta temporária única por teste). Antes do <code>yield</code> é o Arrange; depois, o teardown.</p>' },
        { tipo: 'codigo', linguagem: 'python', texto:
          '@pytest.fixture\ndef csv_sujo(tmp_path: Path) -> Path:\n    arquivo = tmp_path / "dados.csv"\n    arquivo.write_text("categoria;valor\\nmercado;100\\n\\n# comentário\\nfarmacia;abc\\n", encoding="utf-8")\n    return arquivo\n\n@pytest.fixture\ndef config_estrita() -> Iterator[Config]:\n    cfg = Config(modo="estrito")\n    yield cfg                    # antes = Arrange; depois = Dispose\n    cfg.limpar()\n\ndef test_ingestao_reporta_linha_invalida(csv_sujo: Path, config_estrita: Config) -> None:\n    resultado = ingerir(csv_sujo, config_estrita)      # pediu 2 fixtures pelo nome\n    assert resultado.rejeitadas == 1' },
        { tipo: 'texto', html:
          '<p>O que fixtures dão: <strong>composição</strong> (fixture usa fixture), <strong>escopos</strong> (<code>scope="session"</code> para o container de Postgres caro, que o M03 usa), <code>conftest.py</code> (fixtures compartilhadas por pasta, sem import) e <strong>override em camadas</strong>. Assíncrono: <code>pytest-asyncio</code>.</p>' +
          '<h3>A pirâmide na era da IA</h3>' +
          '<p>Muitos unitários rápidos, alguns de integração, poucos E2E, com a correção: quando a IA escreve o código, os testes mudam de papel, de rede de segurança para <strong>especificação executável</strong>. O agente otimiza para "testes verdes"; se os testes são fracos, ele entrega código fraco aprovado. Caminho triste e borda valem mais.</p>' },
        { tipo: 'takeaway', html: 'Teste é <mark>especificação executável</mark>: um teste que nunca falha por motivo nenhum não protege.' }
      ] },

      { rotulo: 'Ver funcionando', blocos: [
        { tipo: 'texto', html:
          '<h3>Propriedades, controle negativo e defeitos de IA</h3>' +
          '<p>Exemplos verificam casos conhecidos; <strong>propriedades</strong> relacionam muitas entradas e saídas. Para o parser: toda transação aceita, serializada e lida de novo preserva moeda e valor decimal; linhas rejeitadas nunca aparecem no CSV limpo. O Hypothesis gera e minimiza contraexemplos; fixe perfil, versões e seed só ao investigar reprodução.</p>' },
        { tipo: 'codigo', linguagem: 'python', texto:
          '@given(st.decimals(allow_nan=False, allow_infinity=False, places=2))\ndef test_decimal_round_trip(value: Decimal) -> None:\n    encoded = format(value, "f")\n    assert parse_decimal(encoded) == value' },
        { tipo: 'texto', html:
          '<p><strong>Teste do teste:</strong> remova uma regra crítica, troque o sinal de uma comparação ou use uma fixture defeituosa de <code>fixtures/generated_defects/</code>. Se a suíte continuar verde, o oráculo é fraco. O catálogo de defeitos de IA é revisado por tipo, semântica e risco operacional: "parece Python" não é evidência.</p>' +
          '<p>No lab, a CLI instalada normaliza um CSV válido; a entrada inválida produz diagnóstico no stderr e exit code 2, sem CSV parcial. Preveja o resultado do caso negativo.</p>' },
        { tipo: 'rode', id: 'cli-rode', titulo: 'Caminho feliz e caso negativo', obrigatorio: false,
          enunciado: 'Os hashes e a duração variam por execução; o contrato de formato e o exit code são a referência estável. As saídas abaixo são <strong>exemplo</strong>.',
          prefixo: '$', entrada: 'uv run csv-cleaner fixtures/csv/invalid_extra.csv invalid-output.csv', unidade: 'ms', terminalTitulo: 'exemplo · csv-cleaner',
          etapas: [
            { id: 'ok', nome: 'Caminho feliz', descricao: 'valid.csv', tom: 'dns', ms: 6, linhas: [
              L('cmd', 'uv run csv-cleaner fixtures/csv/valid.csv output.csv --evidence evidence/run.json'),
              L('out', 'exemplo: N transações normalizadas'),
              L('hint', 'stdout informa quantas transações; evidence/run.json guarda runtime, versões, duração, hashes e contagem')] },
            { id: 'neg', nome: 'Caso negativo', descricao: 'invalid_extra.csv', tom: 'tcp', ms: 5, linhas: [
              L('cmd', 'uv run csv-cleaner fixtures/csv/invalid_extra.csv invalid-output.csv'),
              L('out', 'stderr: diagnóstico da regra violada (campo que o contrato não aceita)'),
              L('cmd', 'echo $?   # PowerShell: $LASTEXITCODE'),
              L('out', '2'),
              L('hint', 'negação controlada: sem stack trace e sem CSV parcialmente gravado')] }
          ],
          prever: { pergunta: 'O fixture inválido adiciona um campo que o contrato não aceita. O que a CLI faz?', opcoes: [
            opc('a', 'Ignora o campo, grava a saída e retorna 0.', false, 'extra="forbid" recusa.'),
            opc('b', 'Escreve o diagnóstico no stderr, retorna exit code 2 e não grava CSV parcial.', true, 'qualquer linha inválida aborta a escrita de forma atômica.'),
            opc('c', 'Imprime uma stack trace e grava metade do arquivo.', false, 'o esperado é negação controlada.')] },
          tutorDepois: 'Diagnóstico no stderr e exit code documentado são o contrato que o teste por subprocesso verifica.',
          callout: 'Você leu o contrato da CLI: stdout, stderr e exit code.' },
        { tipo: 'takeaway', html: 'Propriedade, <mark>caso negativo</mark> e <mark>mutação</mark> mostram se o oráculo consegue falhar.' }
      ] },

      { rotulo: 'Praticar', blocos: [
        { tipo: 'texto', html:
          '<h3>Arquitetura do csv-cleaner</h3>' +
          '<p>A CLI lê CSV UTF-8 com cabeçalho fechado, converte valores monetários para <code>Decimal</code>, aplica o contrato Pydantic e as invariantes de domínio, e grava um CSV normalizado com newline estável. Não-objetivos: UTF-8 fixo e ausência de paralelismo. Domínio e ports não importam framework web nem provedor de IA (verificado por teste de import e revisão do grafo; Ruff não é detector universal de ciclos).</p>' +
          '<ul><li><code>domain.py</code>: invariantes sem framework.</li><li><code>parsing.py</code>: streaming, Decimal, encoding e erros.</li><li><code>ports.py</code>: Protocols e adapters locais.</li><li><code>async_pipeline.py</code>: ownership, cancelamento e backpressure.</li><li><code>diagnostics.py</code>: capabilities e observabilidade.</li><li><code>evidence.py</code>: registro reproduzível.</li><li><code>cli.py</code>: argparse, stdout/stderr e exit codes.</li></ul>' },
        { tipo: 'python', id: 'tst-python', titulo: 'Escreva o parser e seu oráculo', obrigatorio: false,
          enunciado: 'Implemente <code>parse_decimal</code> (formato brasileiro: ponto de milhar, vírgula decimal). Os testes incluem a propriedade de ida e volta e um controle negativo com oráculo independente.',
          codigo: codigo, testes: testes,
          dica: 'Tire espaços; vazio levanta <code>ValueError("valor vazio")</code>. Remova os pontos, troque a vírgula por ponto e use <code>Decimal(...)</code>, capturando <code>InvalidOperation</code>.',
          solucao: solucao,
          tutorDepois: 'O teste usa valores literais do domínio como oráculo, não a mesma fórmula da implementação: copiar a fórmula tornaria o teste uma tautologia.',
          callout: 'Parser, propriedade e controle negativo passaram.' },
        { tipo: 'ordene', id: 'tst-ordene', titulo: 'Ordene os gates', obrigatorio: false,
          enunciado: 'Ponha os comandos de verificação do laboratório na ordem em que o roteiro os executa.',
          itens: [
            { id: 'pytest', texto: '<code>uv run pytest -q</code>' },
            { id: 'sync', texto: '<code>uv sync --python 3.14 --locked</code>' },
            { id: 'help', texto: '<code>uv run python -m python_senior_lab.cli --help</code>' },
            { id: 'mypy', texto: '<code>uv run mypy --strict src tests</code>' },
            { id: 'fmt', texto: '<code>uv run ruff format --check .</code>' },
            { id: 'build', texto: '<code>uv build</code>' },
            { id: 'ruff', texto: '<code>uv run ruff check .</code>' }
          ], solucao: ['sync', 'fmt', 'ruff', 'mypy', 'pytest', 'build', 'help'],
          dica: 'Restaura o ambiente, depois formato, lint, tipos e testes; por fim build e CLI.',
          tutorDepois: 'A baseline registrada tem 51 testes aprovados. O número pode crescer; não é meta. O aceite é cada oráculo relevante executar e o wheel ser produzido sem depender do checkout.' },
        { tipo: 'takeaway', html: 'Nenhuma métrica única substitui os gates: <mark>formato, tipos, comportamento, propriedades, casos negativos e artefato</mark>.' }
      ] },

      { rotulo: 'Conferir', blocos: [
        { tipo: 'texto', html:
          '<h3>Entrega e evidência fora do checkout</h3>' +
          '<p>Construa sdist e wheel, valide os arquivos obrigatórios com <code>distribution.inspect_wheel()</code> e instale o wheel num ambiente temporário cujo diretório de trabalho não seja o repositório. Execute o entry point e confirme em <code>module.__file__</code> que o import veio de <code>site-packages</code>. Nenhum gate obrigatório depende de internet. O <code>evidence/run.json</code> registra comando, versões, SO, duração, contagem e hashes; os resultados reais não pertencem ao texto estático. O núcleo e os ports seguem sem framework HTTP, para o M03 adaptar sem inverter a dependência; riscos residuais e opcionais não executados entram na entrega, sem serem promovidos em silêncio.</p>' },
        { tipo: 'escolha', id: 'tst-esc-tautologia', titulo: 'Confira: o teste que copia a fórmula',
          pergunta: 'Um teste gerado por IA passa, mas copia a mesma fórmula da implementação para calcular o esperado. Por que isso é um risco?',
          opcoes: [
            { id: 'a', texto: 'Não há risco: teste verde significa código correto.', correta: false, porque: 'verde só diz que o teste não discordou da implementação.' },
            { id: 'b', texto: 'É uma tautologia: se a fórmula estiver errada, o teste herda o erro; um bom teste tem oráculo independente, e a mutação ou o controle negativo mostra se ele consegue falhar.', correta: true, porque: 'propriedades, casos negativos preparados e mutação sensibilizam a suíte contra código plausível.' },
            { id: 'c', texto: 'O risco é só de estilo.', correta: false, porque: 'é de correção.' },
            { id: 'd', texto: 'O pytest reprova automaticamente testes que repetem a fórmula.', correta: false, porque: 'não detecta isso.' }
          ], tutorDepois: 'Teste que nunca falha não protege.' },
        { tipo: 'escolha', id: 'tst-esc-fora', titulo: 'Confira: fora do checkout',
          pergunta: 'Por que o laboratório instala o wheel e roda a CLI <strong>fora</strong> do checkout?',
          opcoes: [
            { id: 'a', texto: 'Para o teste rodar mais rápido.', correta: false, porque: 'não é questão de velocidade.' },
            { id: 'b', texto: 'Porque wheels só funcionam fora de pastas Git.', correta: false, porque: 'não existe essa restrição.' },
            { id: 'c', texto: 'Porque dentro do checkout o código-fonte e os arquivos locais mascaram falhas de empacotamento (módulo ou dado faltando no wheel).', correta: true, porque: 'rodar da raiz faz o import cair no src/ local; um arquivo esquecido no pyproject só aparece no usuário final.' },
            { id: 'd', texto: 'Para evitar o uso de ambiente virtual.', correta: false, porque: 'o ambiente isolado continua sendo usado.' }
          ], tutorDepois: 'Distribuição só está entregue quando o artefato funciona sozinho.' },
        { tipo: 'takeaway', html: 'Teste que passa por <mark>copiar a fórmula</mark> prova nada; o wheel só está entregue quando roda <mark>fora do source tree</mark>.' }
      ] }
    ],
    revisao: [
      { id: 'm02b8-oraculo', pergunta: 'Por que teste vira especificação executável com código de IA?', opcoes: [
        opc('a', 'O agente otimiza para testes verdes: testes fracos aprovam código fraco', true, 'por isso valem mais caminho triste, borda, propriedade e mutação.'),
        opc('b', 'Porque a IA dispensa testes', false, 'o contrário.'),
        opc('c', 'Porque o pytest gera o oráculo sozinho', false, 'o oráculo é decisão humana.')] },
      { id: 'm02b8-fixture', pergunta: 'Como uma fixture chega ao teste?', opcoes: [
        opc('a', 'Pelo nome do parâmetro (injeção por nome), com escopo, teardown e composição', true, 'fixtures compartilhadas sobem para o conftest.py.'),
        opc('b', 'Por herança de classe de teste', false, 'isso é xUnit.'),
        opc('c', 'Por import explícito', false, 'conftest.py dispensa import.')] },
      { id: 'm02b8-negativo', pergunta: 'Como saber se o oráculo da suíte é fraco?', opcoes: [
        opc('a', 'Quebrar uma regra crítica, trocar um sinal ou usar fixture defeituosa: se continuar verde, é fraco', true, 'é o teste do teste.'),
        opc('b', 'Se a cobertura for 100%', false, 'cobertura não prova poder de detecção.'),
        opc('c', 'Se rodar rápido', false, 'velocidade não mede o oráculo.')] },
      { id: 'm02b8-cli', pergunta: 'O que a CLI faz com entrada inválida?', opcoes: [
        opc('a', 'Diagnóstico no stderr, exit code 2 e nenhum CSV parcial', true, 'abortar a escrita de forma atômica é o contrato.'),
        opc('b', 'Grava as linhas boas e ignora as ruins em silêncio', false, 'qualquer linha inválida aborta a escrita.'),
        opc('c', 'Imprime stack trace e retorna 0', false, 'exit code é contrato documentado.')] },
      { id: 'm02b8-wheel', pergunta: 'Qual a prova de que o wheel funciona?', opcoes: [
        opc('a', 'Instalá-lo num ambiente temporário fora do repositório, rodar o entry point e confirmar que o import veio de site-packages', true, 'dentro do checkout o source tree mascara falhas de empacotamento.'),
        opc('b', 'Rodar pytest na raiz', false, 'valida o source tree.'),
        opc('c', 'Conferir que dist/ existe', false, 'existir não prova que instala.')] }
    ]
  });
})();
