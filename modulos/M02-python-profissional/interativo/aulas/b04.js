/* M02 · Bloco 4: Pydantic v2 e trust boundary. Fonte: M02.html#b4. */
(function () {
  var L = function (kind, text) { return { kind: kind, text: text }; };
  function opc(id, texto, correta, porque) { return { id: id, texto: texto, correta: correta, porque: porque }; }
  var py = function (l) { return l.join('\n') + '\n'; };

  var codigo = py([
    'from decimal import Decimal, InvalidOperation',
    '',
    'CAMPOS = {"id", "amount", "currency"}',
    'MOEDAS = {"BRL", "EUR", "USD"}',
    '',
    '',
    'def validar(payload):',
    '    # Contrato do exercicio (porteiro de fronteira, no estilo de extra="forbid" + strict):',
    '    # 1. conjunto de chaves EXATAMENTE igual a CAMPOS, senao ValueError("campos")',
    '    # 2. id: str nao vazia, senao ValueError("id")',
    '    # 3. currency em MOEDAS, senao ValueError("currency")',
    '    # 4. amount: STR com decimal > 0 (float nunca), senao ValueError("amount")',
    '    # devolva {"id": ..., "amount": Decimal, "currency": ...}',
    '    return {}'
  ]);
  var testes = py([
    'from decimal import Decimal',
    '',
    'OK = {"id": "t1", "amount": "10.50", "currency": "BRL"}',
    '',
    '',
    'def erro(p):',
    '    try:',
    '        validar(p)',
    '    except ValueError as e:',
    '        return str(e)',
    '    return None',
    '',
    '',
    'def test_valido():',
    '    r = validar(OK)',
    '    assert r == {"id": "t1", "amount": Decimal("10.50"), "currency": "BRL"}',
    '',
    '',
    'def test_campo_extra_rejeitado():',
    '    assert erro(dict(OK, admin=True)) == "campos"',
    '',
    '',
    'def test_campo_faltando_rejeitado():',
    '    assert erro({"id": "t1", "currency": "BRL"}) == "campos"',
    '',
    '',
    'def test_regras_de_valor():',
    '    assert erro(dict(OK, id="")) == "id"',
    '    assert erro(dict(OK, currency="reais")) == "currency"',
    '    assert erro(dict(OK, amount="-5")) == "amount"',
    '    assert erro(dict(OK, amount="abc")) == "amount"',
    '',
    '',
    'def test_float_nunca():',
    '    assert erro(dict(OK, amount=0.1)) == "amount"',
    '',
    '',
    'def test_controle_negativo_decimal_exato():',
    '    assert validar(dict(OK, amount="0.1"))["amount"] == Decimal("0.1")',
    '    assert Decimal(0.1) != Decimal("0.1")'
  ]);
  var solucao = py([
    'from decimal import Decimal, InvalidOperation',
    '',
    'CAMPOS = {"id", "amount", "currency"}',
    'MOEDAS = {"BRL", "EUR", "USD"}',
    '',
    '',
    'def validar(payload):',
    '    if set(payload) != CAMPOS:',
    '        raise ValueError("campos")',
    '    if not isinstance(payload["id"], str) or not payload["id"]:',
    '        raise ValueError("id")',
    '    if payload["currency"] not in MOEDAS:',
    '        raise ValueError("currency")',
    '    bruto = payload["amount"]',
    '    if not isinstance(bruto, str):',
    '        raise ValueError("amount")',
    '    try:',
    '        valor = Decimal(bruto)',
    '    except InvalidOperation:',
    '        raise ValueError("amount") from None',
    '    if not valor.is_finite() or valor <= 0:',
    '        raise ValueError("amount")',
    '    return {"id": payload["id"], "amount": valor, "currency": payload["currency"]}'
  ]);

  TrilhaAula.registrar({
    id: 'm02-b4',
    titulo: 'Pydantic v2 e contratos de trust boundary',
    minutos: 35,
    resumo: 'O checker não observou os dados que chegam em runtime. Pydantic transforma dado não confiável em estrutura tipada e erros localizados, mas só nos caminhos em que a validação roda.',
    objetivo: 'Desenhar um modelo de fronteira (extra="forbid", strict, Decimal), ler um ValidationError, nomear os caminhos sem validação e separar o que Pydantic garante do que é domínio.',
    abas: [
      { rotulo: 'Entender', blocos: [
        { tipo: 'texto', html:
          '<h3>Validação em runtime começa numa fronteira explícita</h3>' +
          '<p>JSON de request, linha de CSV, resposta de API externa e saída de LLM chegam em runtime; o checker não os viu. O <strong>Pydantic</strong> combina parsing, coerção, validação e serialização e produz estrutura tipada com erros localizados. Ele não substitui autorização, regra de negócio nem consistência entre registros, e não prova que todo caminho de construção validou. <code>model_construct()</code> cria instâncias sem validação; atribuições não são revalidadas por padrão. Uma instância que veio de um caminho de validação satisfez as regras executadas <em>naquele momento</em>.</p>' +
          '<p><strong>Parse, don\'t validate:</strong> converta o dado cru numa representação mais específica e pare de carregar o formato ambíguo. Isso reduz estados inválidos; não elimina bypass, mutação, concorrência nem invariantes que dependem de banco ou serviço.</p>' +
          '<p><strong>Trust boundary:</strong> a linha em que proveniência, privilégios ou garantias mudam. Usuário, rede, arquivo e saída de LLM são tratados segundo ameaça e contrato. O Pydantic pode ser o adapter de parsing na borda; autenticação, autorização, limites e sanitização de efeitos são controles próprios.</p>' },
        { tipo: 'texto', html: '<h3>O vocabulário do BaseModel</h3>' },
        { tipo: 'codigo', linguagem: 'python', texto:
          'class Transacao(BaseModel):\n    """Uma linha do extrato: o contrato da fronteira de ingestão."""\n    model_config = ConfigDict(\n        frozen=True,          # impede reatribuição normal; não congela objetos internos\n        extra="forbid",       # campo desconhecido = erro (não ignore em silêncio!)\n        str_strip_whitespace=True,\n    )\n    data: date                                    # "2026-08-12" -> date, sozinho\n    descricao: str = Field(min_length=1, max_length=200)\n    valor: Decimal = Field(gt=0)                  # > 0, validado na construção\n    categoria: str | None = None                  # opcional com default\n    tags: list[str] = Field(default_factory=list) # default mutável: SEMPRE factory\n\n    @field_validator("descricao")\n    @classmethod\n    def sem_pii_obvia(cls, v: str) -> str:\n        if "@" in v:\n            raise ValueError("descrição não pode conter e-mail")\n        return v' },
        { tipo: 'texto', html:
          '<p>Um <strong>decorador</strong> (<code>@nome</code>) é uma função que recebe a definição de baixo e devolve uma versão transformada, no momento da definição. Você o vê em <code>@app.get(...)</code>, <code>@pytest.fixture</code>, <code>@dataclass</code>.</p>' +
          '<p>Os três verbos: <code>Transacao.model_validate(dado_bruto)</code> (executa as regras ou lança <code>ValidationError</code>), <code>t.model_dump()</code> (instância para dict) e <code>t.model_dump_json()</code> (para string JSON).</p>' },
        { tipo: 'takeaway', html: 'O Pydantic valida <mark>só onde roda</mark>: a fronteira precisa chamar <mark>model_validate</mark> em toda entrada externa.' }
      ] },

      { rotulo: 'Ver funcionando', blocos: [
        { tipo: 'texto', html:
          '<h3>O erro é estruturado</h3>' +
          '<p>Cada problema vem com caminho, tipo e mensagem. O Pydantic agrega vários erros quando consegue continuar, mas não prometa que toda falha possível sai numa única passagem. Frameworks como FastAPI adaptam esses detalhes para HTTP (assunto do M03).</p>' +
          '<p>Cenário do módulo: um payload válido e <strong>cinco hostis</strong> (id sem prefixo, tipo desconhecido, valor negativo, moeda "reais", campo extra "admin": true). Um é aceito e cinco são rejeitados. Antes de rodar, preveja o que muda com <code>strict=True</code> para <code>"valor_centavos": "1000"</code>.</p>' },
        { tipo: 'rode', id: 'pyd-rode', titulo: 'Laxo versus estrito', obrigatorio: false,
          enunciado: 'A saída é <strong>exemplo</strong> do contraste descrito no módulo: o texto das mensagens varia com a versão do Pydantic.',
          prefixo: '$', entrada: 'uv run python -m exemplo_fronteira', unidade: 'ms', terminalTitulo: 'exemplo · pydantic',
          etapas: [
            { id: 'lax', nome: 'Modo laxo', descricao: 'valor_centavos: "1000"', tom: 'dns', ms: 3, linhas: [
              L('cmd', 'Contrato.model_validate({"valor_centavos": "1000", ...})'),
              L('out', 'aceito: a string numérica é coagida para o inteiro 1000'),
              L('hint', 'a coerção documentada é conveniente e pode mascarar um contrato frouxo')] },
            { id: 'strict', nome: 'strict=True', descricao: 'mesma entrada', tom: 'tcp', ms: 3, linhas: [
              L('cmd', 'ContratoEstrito.model_validate({"valor_centavos": "1000", ...})'),
              L('out', 'ValidationError: a string não é aceita onde se espera int'),
              L('hint', 'trade-off: aceitar a representação conveniente ou exigir o tipo exato na fronteira')] },
            { id: 'extra', nome: 'Campo extra', descricao: '"admin": true', tom: 'tls', ms: 3, linhas: [
              L('cmd', 'Contrato.model_validate({..., "admin": True})'),
              L('out', 'com extra="forbid": ValidationError (extra_forbidden)'),
              L('hint', 'o default do Pydantic ignora extras; ignorar só vira mass assignment se camadas seguintes vincularem esses dados')] },
            { id: 'constr', nome: 'model_construct', descricao: 'bypass deliberado', tom: 'request', ms: 2, linhas: [
              L('cmd', 'Transacao.model_construct(data="ontem", descricao="", valor=Decimal("-1"))'),
              L('out', 'instância criada sem validação: unsafe.data não é um date'),
              L('hint', 'só para dado já validado e confiável; em modelos simples pular a validação pode nem ser mais rápido')] }
          ],
          prever: { pergunta: 'Com strict=True, o que acontece com {"valor_centavos": "1000"} num campo int?', opcoes: [
            opc('a', 'É aceito: strict só afeta datas.', false, 'strict reduz coerções em geral.'),
            opc('b', 'É rejeitado: a string numérica passa no modo laxo e falha no estrito.', true, 'o contraste mostra o custo de aceitar a representação conveniente.'),
            opc('c', 'Vira o float 1000.0.', false, 'dinheiro nunca nasce float binário.')] },
          tutorDepois: 'Nem "CSV laxo, serviço estrito" nem o inverso é regra universal: decida por origem, ambiguidade tolerada, custo do erro e compatibilidade do contrato.',
          callout: 'Você viu a política de coerção virar uma decisão visível.' },
        { tipo: 'codigo', linguagem: 'python', texto:
          'try:\n    Transacao.model_validate({"data": "ontem", "descricao": "", "valor": -5})\nexcept ValidationError as e:\n    print(e.error_count(), "erros")\n    for err in e.errors():\n        print(err["loc"], err["type"], err["msg"])\n# 3 erros\n# (\'data\',) date_from_datetime_parsing  Input should be a valid date...\n# (\'descricao\',) string_too_short       String should have at least 1 character\n# (\'valor\',) greater_than               Input should be greater than 0' },
        { tipo: 'takeaway', html: '<mark>strict</mark> e <mark>extra="forbid"</mark> tornam a política da fronteira explícita; <mark>model_construct</mark> é bypass deliberado.' }
      ] },

      { rotulo: 'Praticar', blocos: [
        { tipo: 'texto', html:
          '<h3>Configuração tipada e dinheiro</h3>' +
          '<p><code>pydantic-settings</code> (pacote separado: <code>uv add pydantic-settings</code>) lê variáveis de ambiente e <code>.env</code> e valida na inicialização: o app com config faltando morre no boot, não às 3h no primeiro request. Campo sem default é obrigatório. <code>.env</code> no gitignore, <code>.env.example</code> commitado.</p>' +
          '<p>Dinheiro chega como texto decimal ou unidade mínima inteira, nunca como <code>float</code> binário: <code>float</code> não representa 0.1 exatamente.</p>' },
        { tipo: 'complete', id: 'pyd-complete', titulo: 'Monte o contrato estrito', linguagem: 'python', obrigatorio: false,
          enunciado: 'Escolha as peças que fazem a fronteira recusar campo extra, coerção e mutação inválida, e que mantêm dinheiro fora do float.',
          partes: [
            'class StrictTransactionInput(BaseModel):\n    model_config = ConfigDict(extra=', { lacuna: 'extra', opcoes: ['"forbid"', '"ignore"', '"allow"'], correta: '"forbid"' },
            ', strict=True, validate_assignment=', { lacuna: 'va', opcoes: ['True', 'False'], correta: 'True' },
            ')\n    id: str = Field(min_length=1)\n    amount: ', { lacuna: 'amount', opcoes: ['Decimal = Field(gt=0)', 'float = Field(gt=0)', 'str'], correta: 'Decimal = Field(gt=0)' },
            '\n    currency: ', { lacuna: 'cur', opcoes: ['Literal["BRL", "EUR", "USD"]', 'str', 'object'], correta: 'Literal["BRL", "EUR", "USD"]' },
            '\n    category: str = Field(min_length=1)\n    occurred_at: datetime\n'
          ],
          explicacao: '<code>extra="forbid"</code> recusa o que o contrato não declara; <code>strict=True</code> muda a política de coerção; <code>validate_assignment=True</code> revalida atribuições (opt-in); <code>Decimal</code> evita nascer float binário; <code>Literal</code> fecha o vocabulário de moedas. A camada de domínio recebe uma <code>Transaction</code> já válida, não um dict cru.',
          callout: 'Contrato de fronteira estrito montado.' },
        { tipo: 'python', id: 'pyd-python', titulo: 'Escreva o porteiro da fronteira', obrigatorio: false,
          enunciado: 'Sem Pydantic (só biblioteca padrão), implemente <code>validar(payload)</code> com as regras do comentário: chaves exatas, id não vazio, moeda conhecida e <code>amount</code> como <em>string</em> decimal maior que zero. As regras de id deste exercício são simplificadas.',
          codigo: codigo, testes: testes,
          dica: 'Compare <code>set(payload) != CAMPOS</code> primeiro. Para amount: rejeite o que não for <code>str</code>, converta com <code>Decimal(bruto)</code> capturando <code>InvalidOperation</code>, e exija <code>valor &gt; 0</code>.',
          solucao: solucao,
          tutorDepois: 'O controle negativo mostra por que o texto vence o float: Decimal(0.1) herda o erro binário, Decimal("0.1") não.',
          callout: 'Um payload aceito, os hostis recusados e o dinheiro exato.' },
        { tipo: 'takeaway', html: 'Dinheiro nasce <mark>Decimal(str)</mark> ou <mark>inteiro em centavos</mark>; a configuração falta, o app <mark>morre no boot</mark>.' }
      ] },

      { rotulo: 'Conferir', blocos: [
        { tipo: 'escolha', id: 'pyd-esc-coercao', titulo: 'Confira: coerção no modo laxo',
          pergunta: 'Com um <code>BaseModel</code> padrão do Pydantic v2 (modo laxo), o campo <code>idade: int</code> recebe <code>"42"</code>. Resultado?',
          opcoes: [
            { id: 'a', texto: 'Aceita e converte para 42; para recusar strings seria preciso modo strict (por campo, modelo ou chamada).', correta: true, porque: 'a coerção é útil em payloads de formulário, mas pode mascarar contratos frouxos.' },
            { id: 'b', texto: 'Sempre ValidationError, pois "42" é str.', correta: false, porque: 'no modo laxo a coerção documentada converte.' },
            { id: 'c', texto: 'Guarda a string "42" sem converter.', correta: false, porque: 'a anotação não é só decoração: o valor sai convertido.' },
            { id: 'd', texto: 'Converte para 42.0.', correta: false, porque: 'o campo é int.' }
          ], tutorDepois: 'Em fronteiras onde o tipo exato importa (dinheiro, ids), use strict e teste o caso negativo.' },
        { tipo: 'escolha', id: 'pyd-esc-caminho', titulo: 'Confira: o caminho sem validação',
          pergunta: 'Qual caminho cria uma instância de modelo Pydantic <strong>sem</strong> executar a validação?',
          opcoes: [
            { id: 'a', texto: '<code>Modelo.model_validate(dados)</code>', correta: false, porque: 'valida.' },
            { id: 'b', texto: '<code>Modelo(**dados)</code>', correta: false, porque: 'o construtor valida.' },
            { id: 'c', texto: '<code>Modelo.model_construct(**dados)</code>', correta: true, porque: 'confia no chamador; atribuições também não revalidam, a menos que validate_assignment esteja ligado.' },
            { id: 'd', texto: '<code>Modelo.model_validate_json(texto)</code>', correta: false, porque: 'valida.' }
          ], tutorDepois: 'Validação só protege os caminhos que de fato a executam.' },
        { tipo: 'takeaway', html: 'Saída de <mark>LLM</mark> é dado não confiável: o porteiro é <mark>model_validate</mark>, princípio que o curso carrega até o M12.' }
      ] }
    ],
    revisao: [
      { id: 'm02b4-checker', pergunta: 'Qual a divisão de trabalho entre checker e Pydantic?', opcoes: [
        opc('a', 'O checker analisa o código; o Pydantic valida valores nos caminhos em que a validação executa', true, 'o checker não observa dados de fora.'),
        opc('b', 'O Pydantic substitui o mypy', false, 'cobrem superfícies diferentes.'),
        opc('c', 'O mypy valida JSON de request', false, 'só analisa código estaticamente.')] },
      { id: 'm02b4-forbid', pergunta: 'O que faz extra="forbid" e por que o curso o usa nas fronteiras externas?', opcoes: [
        opc('a', 'Recusa campos não declarados; o default ignora extras em silêncio', true, 'o campo inesperado só vira mass assignment se camadas seguintes o vincularem, mas a recusa explicita o contrato.'),
        opc('b', 'Permite qualquer campo extra', false, 'isso é allow.'),
        opc('c', 'Remove o campo e valida o resto', false, 'forbid gera erro.')] },
      { id: 'm02b4-construct', pergunta: 'O que model_construct() garante?', opcoes: [
        opc('a', 'Nada sobre validade: cria a instância sem validar, só para dado já confiável', true, 'pode produzir instância inválida; atribuição também não revalida por padrão.'),
        opc('b', 'Valida mais rápido', false, 'pula a validação, e o ganho pode nem existir.'),
        opc('c', 'Revalida a cada atribuição', false, 'isso é validate_assignment.')] },
      { id: 'm02b4-dinheiro', pergunta: 'Como o dinheiro entra na fronteira?', opcoes: [
        opc('a', 'Como texto decimal (Decimal) ou inteiro em unidade mínima; nunca float binário', true, 'float não representa 0.1 exatamente; Decimal("0.1"), não Decimal(0.1).'),
        opc('b', 'Como float, para ser mais rápido', false, 'o float binário herda erro de representação.'),
        opc('c', 'Como qualquer tipo, desde que o mypy passe', false, 'o checker não vê o valor.')] },
      { id: 'm02b4-settings', pergunta: 'O que pydantic-settings faz com uma variável obrigatória ausente?', opcoes: [
        opc('a', 'Falha na inicialização (o app morre no boot)', true, 'campo sem default é obrigatório; melhor falhar no boot que no primeiro request.'),
        opc('b', 'Usa uma string vazia', false, 'sem default, falta é erro.'),
        opc('c', 'Ignora e segue', false, 'a validação é na inicialização.')] }
    ]
  });
})();
