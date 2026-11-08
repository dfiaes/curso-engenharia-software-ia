/* M05 · Bloco 2: structured output, o fim do parsing com regex. Fonte: M05.html#b02. Exemplo condutor: análise de arquivos de código legado (Achado, AnaliseArquivo). Modelo e provedor, aqui, são fakes determinísticos. */
(function () {
  var L = function (kind, text) { return { kind: kind, text: text }; };
  function opc(id, texto, correta, porque) { return { id: id, texto: texto, correta: correta, porque: porque }; }
  var PY = function (a) { return a.join('\n') + '\n'; };

  var etapasValidacao = function () {
    return [
      { id: 'parada', nome: 'stop_reason', descricao: 'A saída está completa?', tom: 'dns', ms: 1, linhas: [
        L('cmd', 'python validar.py saidas/pedido_service.json'),
        L('info', 'stop_reason: end_turn (não veio max_tokens: a saída não foi truncada)')] },
      { id: 'json', nome: 'JSON', descricao: 'Sintaxe válida, sem prosa em volta', tom: 'tcp', ms: 1, linhas: [
        L('out', 'json.loads: ok (nenhuma prosa em volta do JSON)')] },
      { id: 'schema', nome: 'Schema', descricao: 'Campos, tipos, enum e limites', tom: 'tls', ms: 1, linhas: [
        L('out', 'campos obrigatórios presentes: linguagem, responsabilidade, achados, depende_de'),
        L('out', 'tipos corretos; risco dentro do enum (baixo, medio, alto); achados: 1 item (limite 5)'),
        L('out', 'AnaliseArquivo validado: 100% das saídas válidas neste lote')] },
      { id: 'verdade', nome: 'Verdade', descricao: 'Fora do alcance do schema', tom: 'request', ms: 1, linhas: [
        L('body', '{"titulo": "SQL concatenado", "risco": "alto", "linha_inicial": 42, ...}'),
        L('in', 'arquivo analisado tem 31 linhas: linha_inicial 42 não existe'),
        L('hint', 'o schema aceitou 42 porque 42 é um inteiro maior ou igual a 1; "a linha existe no arquivo" só o seu código sabe')] },
      { id: 'leitura', nome: 'Leitura', descricao: 'O que 100% válido significa', tom: 'ink', ms: 1, linhas: [
        L('hint', 'schema resolve forma, não verdade: verdade é assunto do M06 (evals)')] }
    ];
  };

  var codigoPy = PY([
    'import json',
    '',
    'RISCOS = {"baixo", "medio", "alto"}',
    '',
    '',
    'def exigir(condicao, mensagem):',
    '    if not condicao:',
    '        raise ValueError(mensagem)',
    '',
    '',
    'def analisar(stop_reason, bruto):',
    '    """Fronteira de confianca: a saida do modelo e dado nao confiavel."""',
    '    # 1. truncada (stop_reason == "max_tokens")? levante ValueError antes de qualquer parsing',
    '    try:',
    '        dado = json.loads(bruto)',
    '    except json.JSONDecodeError as exc:',
    '        raise ValueError("JSON invalido") from exc',
    '    for campo in ("linguagem", "responsabilidade", "achados"):',
    '        exigir(campo in dado, "campo ausente: " + campo)',
    '    exigir(len(dado["responsabilidade"]) <= 200, "responsabilidade longa")',
    '    # 2. no maximo 5 achados (limite no schema, nao no prompt); lista vazia e abstencao valida',
    '    for achado in dado["achados"]:',
    '        # 3. risco precisa estar em RISCOS; linha_inicial: int >= 1 (bool nao vale);',
    '        #    titulo <= 80 caracteres',
    '        pass',
    '    dado.setdefault("depende_de", [])',
    '    return dado',
    '',
    '',
    'print(analisar("end_turn", \'{"linguagem": "csharp", "responsabilidade": "x", "achados": []}\'))'
  ]);
  var solucaoPy = PY([
    'import json',
    '',
    'RISCOS = {"baixo", "medio", "alto"}',
    '',
    '',
    'def exigir(condicao, mensagem):',
    '    if not condicao:',
    '        raise ValueError(mensagem)',
    '',
    '',
    'def analisar(stop_reason, bruto):',
    '    """Fronteira de confianca: a saida do modelo e dado nao confiavel."""',
    '    exigir(stop_reason != "max_tokens", "resposta truncada: aumente max_tokens")',
    '    try:',
    '        dado = json.loads(bruto)',
    '    except json.JSONDecodeError as exc:',
    '        raise ValueError("JSON invalido") from exc',
    '    for campo in ("linguagem", "responsabilidade", "achados"):',
    '        exigir(campo in dado, "campo ausente: " + campo)',
    '    exigir(len(dado["responsabilidade"]) <= 200, "responsabilidade longa")',
    '    exigir(len(dado["achados"]) <= 5, "achados demais (limite 5)")',
    '    for achado in dado["achados"]:',
    '        exigir(achado["risco"] in RISCOS, "risco fora do enum: " + str(achado["risco"]))',
    '        linha = achado["linha_inicial"]',
    '        exigir(type(linha) is int and linha >= 1, "linha_inicial invalida")',
    '        exigir(len(achado["titulo"]) <= 80, "titulo longo")',
    '    dado.setdefault("depende_de", [])',
    '    return dado',
    '',
    '',
    'print(analisar("end_turn", \'{"linguagem": "csharp", "responsabilidade": "x", "achados": []}\'))'
  ]);
  var testesPy = PY([
    'import json',
    '',
    '',
    'def achado(**extra):',
    '    base = {"titulo": "SQL concatenado", "risco": "alto", "linha_inicial": 12, "justificativa": "usa + na query"}',
    '    base.update(extra)',
    '    return base',
    '',
    '',
    'def saida(achados):',
    '    return json.dumps({"linguagem": "csharp", "responsabilidade": "repositorio de pedidos", "achados": achados})',
    '',
    '',
    'def rejeita(stop, bruto):',
    '    try:',
    '        analisar(stop, bruto)',
    '    except ValueError:',
    '        return True',
    '    return False',
    '',
    '',
    'def test_caminho_feliz():',
    '    r = analisar("end_turn", saida([achado()]))',
    '    assert r["achados"][0]["risco"] == "alto"',
    '    assert r["depende_de"] == []',
    '',
    '',
    'def test_abstencao_e_valida():',
    '    assert analisar("end_turn", saida([]))["achados"] == []',
    '',
    '',
    'def test_limite_de_cinco_achados():',
    '    assert len(analisar("end_turn", saida([achado()] * 5))["achados"]) == 5',
    '    assert rejeita("end_turn", saida([achado()] * 6))',
    '',
    '',
    'def test_truncamento_e_erro():',
    '    assert rejeita("max_tokens", saida([achado()]))',
    '',
    '',
    'def test_prosa_em_volta_do_json():',
    '    assert rejeita("end_turn", "Claro! Aqui esta: " + saida([achado()]))',
    '',
    '',
    'def test_enum_e_faixa():',
    '    assert rejeita("end_turn", saida([achado(risco="critico")]))',
    '    assert rejeita("end_turn", saida([achado(linha_inicial=0)]))',
    '',
    '',
    'def test_controle_negativo_bool_nao_e_linha():',
    '    assert rejeita("end_turn", saida([achado(linha_inicial=True)]))',
    '',
    '',
    'def test_campo_ausente_e_titulo_longo():',
    '    assert rejeita("end_turn", json.dumps({"linguagem": "csharp", "achados": []}))',
    '    assert rejeita("end_turn", saida([achado(titulo="x" * 81)]))'
  ]);

  TrilhaAula.registrar({
    id: 'm05-b2',
    titulo: 'Structured output: o fim do parsing com regex',
    minutos: 30,
    resumo: 'Se o modelo devolve prosa, o seu sistema tem um problema de parsing. Structured output impõe o contrato na geração; a validação continua na fronteira, e o schema resolve forma, não verdade.',
    objetivo: 'Usar o Pydantic como fonte única do schema, validar a saída do modelo como dado não confiável, dizer o que o schema garante e o que não garante e desenhar um schema que dê uma saída válida para "não sei".',
    revisao: [
      { id: 'm05b2-forma-verdade', pergunta: 'Sua extração retorna 100% de saídas válidas contra o schema. Qual conclusão é correta?',
        opcoes: [
          opc('a', 'É só a linha de partida: o schema garante forma, não verdade, completude nem sentido dos valores', true, 'linha_inicial 42 pode ser invenção; o modelo pode listar 1 achado onde havia 7. Verdade é assunto do M06.'),
          opc('b', 'A qualidade está garantida: não precisa de evals', false, 'saída válida não é saída verdadeira.'),
          opc('c', 'O modelo deixou de alucinar', false, 'o schema restringe o formato da geração, não o conteúdo.')] },
      { id: 'm05b2-nao-sei', pergunta: 'Qual desenho de schema reduz alucinação quando a informação pode não existir no documento?',
        opcoes: [
          opc('a', 'Dar uma saída válida para "não sei": lista vazia, campo opcional (str | None) ou enum com indeterminado', true, 'modelo sem alternativa legítima inventa; a abstenção estrutural vence a instrução em linguagem natural.'),
          opc('b', 'Campo obrigatório de texto livre com a instrução "não invente"', false, 'sem alternativa legítima, o campo obrigatório empurra o modelo a inventar.'),
          opc('c', 'Aumentar max_tokens', false, 'o teto de saída não muda a tendência de inventar.')] },
      { id: 'm05b2-validar', pergunta: 'Por que validar com Pydantic se o provedor já impôs o schema?',
        opcoes: [
          opc('a', 'Saída de LLM é dado não confiável, e "imposto pelo provedor" é garantia operacional: o provedor pode ter bug ou o gateway pode trocar para um que não suporte a restrição', true, 'custa microssegundos e converte uma classe de falha em exceção clara na fronteira.'),
          opc('b', 'Porque o schema do provedor não valida tipos', false, 'valida; a questão é que a garantia é operacional, não uma lei da física.'),
          opc('c', 'Para o Pydantic gerar o JSON Schema', false, 'o JSON Schema vem de model_json_schema(); a validação é outra função: model_validate_json.')] },
      { id: 'm05b2-limite-no-schema', pergunta: 'Onde limitar o número de achados e o tamanho das strings?',
        opcoes: [
          opc('a', 'No schema (max_length), que é mecânico; "liste no máximo 5" no prompt é só um pedido', true, 'o limite no schema também evita a resposta prolixa que estoura o max_tokens.'),
          opc('b', 'No prompt de sistema, em linguagem natural', false, 'pedido no prompt não é restrição.'),
          opc('c', 'Em um regex depois da resposta', false, 'parsing de prosa é a fase 1 que o structured output substitui.')] },
      { id: 'm05b2-agnostico', pergunta: 'O que é comum entre os provedores no structured output?',
        opcoes: [
          opc('a', 'O JSON Schema; a moldura do parâmetro muda por provedor, por isso o Pydantic é a fonte única', true, 'o modelo de dados é seu e o adaptador é fino: trocar de provedor não reescreve o contrato.'),
          opc('b', 'O nome do parâmetro na API', false, 'cada provedor tem a sua sintaxe.'),
          opc('c', 'O suporte a qualquer recurso de JSON Schema, inclusive oneOf aninhado', false, 'recursos exóticos podem não ser suportados; schema plano funciona em todo lugar.')] }
    ],
    abas: [
      { rotulo: 'Entender', blocos: [
        { tipo: 'texto', html:
          '<h3>Prosa vira problema de parsing</h3>' +
          '<p>Se o modelo devolve prosa, o seu sistema tem um problema de parsing, e parsing de linguagem natural é onde produtos de IA morrem. A história tem três fases, e vale conhecer as três porque você vai encontrar código de todas elas.</p>' +
          '<ol>' +
          '<li><strong>Pedir educadamente</strong> ("responda apenas com JSON") e torcer, com regex para extrair o JSON do meio da prosa e retry quando falha.</li>' +
          '<li><strong>Tool calling como truque:</strong> declarar uma ferramenta falsa só para forçar o modelo a preencher um schema.</li>' +
          '<li><strong>Structured output nativo:</strong> o provedor <em>restringe a geração</em> para que a saída obedeça ao JSON Schema.</li></ol>' +
          '<p>Hoje só a fase 3 é aceitável em produção, e ela mudou de estatuto: na API da Anthropic saiu de beta e virou parâmetro estável (<code>output_config.format</code>), sem header especial.</p>' },
        { tipo: 'callout', tom: 'info', titulo: 'Contrato imposto na geração, não na validação', html:
          '<p>Structured output é <strong>contract-first aplicado ao modelo</strong>: o schema é o contrato, e a restrição acontece na geração. O modelo é impedido de emitir um token que quebre o schema, em vez de ser corrigido depois. É a diferença entre validar entrada com <code>if</code> e ter uma constraint que torna o estado inválido impossível: um verifica, o outro impede.</p>' },
        { tipo: 'texto', html:
          '<h3>Pydantic como fonte única do schema</h3>' +
          '<p>Um <code>BaseModel</code> Pydantic <em>é</em> um JSON Schema (<code>Model.model_json_schema()</code>). Isso dá um contrato único que serve para instruir o modelo, validar a resposta, tipar o código e documentar a API. Nunca escreva o JSON Schema à mão.</p>' },
        { tipo: 'takeaway', html: 'O schema é o <mark>contrato</mark>, imposto na <mark>geração</mark>; o Pydantic é a <mark>fonte única</mark> dele.' }
      ] },

      { rotulo: 'Ver funcionando', blocos: [
        { tipo: 'texto', html:
          '<p><em>Exemplo de adapter. A trilha live é opcional e exige chave de API; o laboratório executável usa fakes.</em> O exemplo condutor analisa um arquivo de código legado e devolve um contrato validado.</p>' },
        { tipo: 'codigo', linguagem: 'python', texto:
          '# extract.py (adapter de provedor)\n' +
          'from __future__ import annotations\n\n' +
          'from enum import StrEnum\n\n' +
          'import anthropic\n' +
          'from pydantic import BaseModel, Field\n\n' +
          'from llm_lab.settings import settings\n\n' +
          'client = anthropic.Anthropic(api_key=settings.anthropic_api_key)\n\n\n' +
          'class Risco(StrEnum):\n' +
          '    BAIXO = "baixo"\n' +
          '    MEDIO = "medio"\n' +
          '    ALTO = "alto"\n\n\n' +
          'class Achado(BaseModel):\n' +
          '    """Um problema encontrado em um arquivo de código legado."""\n\n' +
          '    titulo: str = Field(max_length=80, description="Resumo em uma linha")\n' +
          '    risco: Risco\n' +
          '    linha_inicial: int = Field(ge=1, description="Primeira linha afetada")\n' +
          '    justificativa: str = Field(\n' +
          '        max_length=400,\n' +
          '        description="Por que isto é um risco de modernização. Cite o que está no código.",\n' +
          '    )\n\n\n' +
          'class AnaliseArquivo(BaseModel):\n' +
          '    """Contrato de saída da análise de UM arquivo."""\n\n' +
          '    linguagem: str\n' +
          '    responsabilidade: str = Field(\n' +
          '        max_length=200, description="O que este arquivo faz, em uma frase"\n' +
          '    )\n' +
          '    achados: list[Achado] = Field(max_length=5)\n' +
          '    depende_de: list[str] = Field(\n' +
          '        default_factory=list, description="Namespaces/módulos externos referenciados"\n' +
          '    )\n\n\n' +
          'PROMPT_SISTEMA = (\n' +
          '    "You are a senior software archaeologist analyzing legacy code for a "\n' +
          '    "modernization assessment. Report only what is evidenced in the code. "\n' +
          '    "If you cannot determine something, use an empty list rather than guessing."\n' +
          ')\n\n\n' +
          'def analisar(codigo: str, caminho: str) -> AnaliseArquivo:\n' +
          '    """Analisa um arquivo e devolve o contrato validado (ou levanta)."""\n' +
          '    resposta = client.messages.create(\n' +
          '        model="MODELO-VERSIONADO",  # pinne o identificador completo (bloco 1)\n' +
          '        max_tokens=2000,\n' +
          '        temperature=0,\n' +
          '        system=PROMPT_SISTEMA,\n' +
          '        messages=[{"role": "user", "content": f"# {caminho}\\n\\n{codigo}"}],\n' +
          '        output_config={\n' +
          '            "format": {\n' +
          '                "type": "json_schema",\n' +
          '                "schema": AnaliseArquivo.model_json_schema(),\n' +
          '            }\n' +
          '        },\n' +
          '    )\n\n' +
          '    if resposta.stop_reason == "max_tokens":\n' +
          '        raise ValueError(f"resposta truncada para {caminho}: aumente max_tokens")\n\n' +
          '    bruto = resposta.content[0].text          # já é JSON válido conforme o schema\n' +
          '    return AnaliseArquivo.model_validate_json(bruto)   # a fronteira, mesmo assim' },
        { tipo: 'callout', tom: 'danger', titulo: 'Por que validar com Pydantic se o schema já foi imposto?', html:
          '<p>Porque <strong>saída de LLM é dado não confiável</strong> (M02, bloco 3: fronteira de confiança), e "imposto pelo provedor" é uma garantia operacional, não uma lei da física. O provedor pode ter bug; você pode trocar de provedor via gateway (bloco 6) para um que não suporte a restrição; o modo pode cair silenciosamente em degradação. A validação custa microssegundos e converte uma classe inteira de falha em exceção clara na fronteira. <strong>Sempre valide.</strong> É o mesmo raciocínio de checar o retorno de uma stored procedure mesmo que ela "sempre" devolva o que promete.</p>' },
        { tipo: 'rode', id: 'm05b2-rode', titulo: 'Valide uma saída "100% válida"', enunciado: 'Rode a validação fake sobre uma saída do modelo. Cada etapa mostra o que foi checado.',
          prefixo: '$', entrada: 'python validar.py saidas/pedido_service.json', unidade: 'checks', terminalTitulo: 'validador', etapas: etapasValidacao(),
          prever: { pergunta: 'A saída passa em todas as checagens do schema. O que isso prova sobre o campo linha_inicial: 42?', opcoes: [
            { id: 'a', texto: 'Que a linha 42 existe e contém o problema descrito.', correta: false, porque: 'o schema só sabe que 42 é um inteiro maior ou igual a 1.' },
            { id: 'b', texto: 'Que o formato está correto; se a linha existe é outra pergunta, que o schema não responde.', correta: true, porque: 'schema resolve forma, não verdade: a conferência semântica é assunto do M06.' },
            { id: 'c', texto: 'Que o modelo não alucinou, já que a geração foi restrita.', correta: false, porque: 'a restrição é de formato; o conteúdo continua sendo gerado pelo modelo.' }
          ] },
          tutorAntes: 'Aperte Enter no comando já preenchido. Depois clique em Verdade para ler só as linhas dela.',
          tutorDepois: 'Todas as checagens de forma passaram e, mesmo assim, linha_inicial 42 apontava para uma linha que o arquivo de 31 linhas não tem. Comemorar "100% de saídas válidas" achando que isso é qualidade é o erro comum de time novato: é só a linha de partida.',
          callout: 'Você viu a forma passar e a verdade escapar.' },
        { tipo: 'takeaway', html: 'Valide sempre na <mark>fronteira</mark>: a garantia do provedor é <mark>operacional</mark>, não uma lei.' }
      ] },

      { rotulo: 'Limites e design', blocos: [
        { tipo: 'texto', html:
          '<h3>O que o schema garante, e o que não garante</h3>' },
        { tipo: 'texto', largo: true, html:
          '<table><thead><tr><th>Garante</th><th>Não garante</th></tr></thead><tbody>' +
          '<tr><td>JSON sintaticamente válido</td><td>Que os valores sejam <strong>verdadeiros</strong>: <code>linha_inicial: 42</code> pode ser invenção</td></tr>' +
          '<tr><td>Campos obrigatórios presentes</td><td>Que os campos estejam <strong>preenchidos com sentido</strong>: string vazia, "N/A", "desconhecido"</td></tr>' +
          '<tr><td>Tipos corretos (int é int)</td><td>Faixa semântica: <code>ge=1</code> o Pydantic cobra, mas "a linha existe no arquivo" só você</td></tr>' +
          '<tr><td>Enum dentro dos valores permitidos</td><td>Que a <em>escolha</em> do enum esteja certa (risco "baixo" para algo crítico)</td></tr>' +
          '<tr><td>Ausência de prosa em volta do JSON</td><td>Completude: o modelo pode listar 1 achado onde havia 7</td></tr>' +
          '</tbody></table>' +
          '<p>Resumo da fronteira: <strong>schema resolve forma, não verdade</strong>. Verdade é assunto do M06 (evals), e é por isso que os dois módulos são vizinhos.</p>' },
        { tipo: 'texto', html:
          '<h3>Três decisões de design de schema</h3>' +
          '<ul>' +
          '<li><strong>Descrições são prompt.</strong> O campo <code>description</code> do Pydantic vai para o schema e o modelo lê. "Por que isto é um risco de modernização. Cite o que está no código." vale mais que um parágrafo no prompt de sistema, porque está no ponto exato do preenchimento. Escreva descrições como instrução, não como documentação.</li>' +
          '<li><strong>Dê uma saída válida para "não sei".</strong> Modelo sem alternativa legítima inventa. Lista vazia, campo opcional (<code>str | None</code>) ou um enum com <code>indeterminado</code> reduzem alucinação mais do que qualquer instrução de "não invente". É a versão structured do princípio de abstenção que o M07 formaliza.</li>' +
          '<li><strong>Limite tamanho no schema, não no prompt.</strong> <code>max_length=5</code> numa lista é mecânico; "liste no máximo 5" no prompt é pedido (M01, bloco 2). O mesmo vale para <code>max_length</code> em strings: evita a resposta prolixa que estoura o <code>max_tokens</code>.</li></ul>' },
        { tipo: 'abas', rotulo: 'O mesmo contrato em qualquer provedor', itens: [
          { rotulo: 'Anthropic', blocos: [
            { tipo: 'codigo', linguagem: 'python', texto: 'output_config={"format": {"type": "json_schema", "schema": Risco.model_json_schema()}}' },
            { tipo: 'texto', html: '<p>Parâmetro estável (saiu de beta), sem header especial. O schema vem do Pydantic.</p>' }] },
          { rotulo: 'OpenAI', blocos: [
            { tipo: 'codigo', linguagem: 'python', texto: 'response_format={"type": "json_schema", "json_schema": {"name": "risco", "strict": True, "schema": ...}}' },
            { tipo: 'texto', html: '<p>Mesmo JSON Schema, outra moldura, com <code>strict: true</code>.</p>' }] },
          { rotulo: 'O que é comum', blocos: [
            { tipo: 'texto', html: '<p>O <strong>JSON Schema</strong>, e por isso o Pydantic é a fonte única: o modelo de dados é seu, o adaptador é fino, e trocar de provedor não reescreve o contrato. Em modo estrito costuma ser exigido <code>additionalProperties: false</code> (o Pydantic gera isso com <code>extra="forbid"</code>), e recursos exóticos (<code>allOf</code> complexo, <code>$ref</code> profundo, <code>oneOf</code> aninhado) podem não ser suportados. Schema chato e plano funciona em todo lugar.</p>' }] }
        ] },
        { tipo: 'quebre', id: 'm05b2-quebre', titulo: 'Ache o que o parser pega primeiro', obrigatorio: false,
          enunciado: 'Rode a validação sem falha e depois com cada falha. Veja em que etapa cada problema é pego.',
          prefixo: '$', entrada: 'python validar.py saidas/pedido_service.json', unidade: 'checks', terminalTitulo: 'validador', etapas: etapasValidacao(),
          falhas: [
            { id: 'trunc', rotulo: 'resposta truncada por max_tokens', efeito: { etapaFalha: 'parada', linhasErro: [
              L('out', 'stop_reason: max_tokens'),
              L('out', 'ValueError: resposta truncada para pedido_service.cs: aumente max_tokens'),
              L('hint', 'o código confere stop_reason antes de validar: JSON cortado no meio nem chega ao parser')], tutor: 'truncamento é erro explícito. O limite de tamanho no schema (max_length) também evita a resposta prolixa que estoura o teto.' } },
            { id: 'prosa', rotulo: 'prosa em volta do JSON', efeito: { etapaFalha: 'json', linhasErro: [
              L('body', 'Claro! Aqui está a análise: {"linguagem": "csharp", ...}'),
              L('out', 'JSONDecodeError: Expecting value: line 1 column 1 (char 0)'),
              L('hint', 'com structured output nativo a prosa não deveria aparecer; se aparecer, é erro, não motivo para regex')], tutor: 'a fase 1 (pedir educadamente e extrair com regex) é o que o structured output substitui. Se vier prosa, trate como falha da fronteira.' } },
            { id: 'enum', rotulo: 'risco fora do enum ("critico")', efeito: { etapaFalha: 'schema', linhasErro: [
              L('out', 'ValueError: risco fora do enum: critico'),
              L('hint', 'defesa em profundidade: o provedor deveria impor o enum, e a validação confirma na fronteira')], tutor: 'a garantia do provedor é operacional. Um gateway pode trocar para um provedor sem a restrição; a validação converte a falha em exceção clara.' } }
          ],
          tutorAntes: 'Comece por Sem falha. Depois escolha uma falha e rode de novo.',
          tutorDepois: 'Cada falha caiu numa etapa diferente: parada, JSON, schema. Nenhuma delas é a falha de "verdade", que nenhuma etapa de forma pega.',
          callout: 'Você viu em que etapa cada falha de forma é pega.' },
        { tipo: 'takeaway', html: 'Schema garante <mark>forma</mark>; dê ao modelo uma <mark>saída válida para "não sei"</mark> e ponha os limites no schema, não no prompt.' }
      ] },

      { rotulo: 'Praticar e conferir', blocos: [
        { tipo: 'texto', html:
          '<h3>Escreva a fronteira</h3>' +
          '<p>No laboratório guiado você valida a saída de um extrator fake contra um arquivo conhecido. Aqui, escreva a fronteira de confiança sem Pydantic: só <code>json</code> e a biblioteca padrão, o que mostra o que cada regra do schema faz.</p>' },
        { tipo: 'python', id: 'm05b2-python', titulo: 'Valide a saída como dado não confiável', obrigatorio: false,
          enunciado: 'Complete <code>analisar(stop_reason, bruto)</code>: truncamento levanta <code>ValueError</code> antes do parsing; no máximo 5 achados (lista vazia é abstenção válida); cada achado exige <code>risco</code> em <code>RISCOS</code>, <code>linha_inicial</code> inteira maior ou igual a 1 (<code>True</code> não vale) e <code>titulo</code> com até 80 caracteres.',
          codigo: codigoPy, testes: testesPy,
          dica: 'Confira <code>stop_reason</code> primeiro. Para excluir booleano, use <code>type(linha) is int</code> em vez de <code>isinstance</code>: em Python, <code>True</code> é um <code>int</code>.',
          solucao: solucaoPy,
          tutorDepois: 'O controle negativo do bool é o tipo de borda que o schema não pega sozinho: em Python, True é um int. E repare que nada aqui prova que a linha existe no arquivo: isso é eval (M06).',
          callout: 'A fronteira rejeita truncamento, prosa, enum e faixa inválidos, e aceita a abstenção.' },
        { tipo: 'cenario', id: 'm05b2-cenario', titulo: 'O arquivo trivial que ganhou três achados', obrigatorio: false,
          enunciado: 'O extrator analisa um helper de 10 linhas sem nenhum problema. Em produção, ele devolve três achados inventados. Decida como desenhar o schema e veja o custo.',
          inicio: 'inicio',
          nos: {
            inicio: { texto: 'O schema atual exige pelo menos um achado, e o prompt diz "não invente". O que você muda?', opcoes: [
              { texto: 'Acrescentar ao prompt um parágrafo mais duro sobre não inventar.', vai: 'f-prompt', tom: 'ruim', consequencia: 'instrução em linguagem natural não cria uma alternativa legítima para o modelo.' },
              { texto: 'Dar uma saída válida para "não sei": permitir lista vazia de achados.', vai: 'vazia', tom: 'ok', consequencia: 'o modelo ganha como responder "nada a reportar" sem violar o contrato.' },
              { texto: 'Manter o mínimo de um achado e filtrar os falsos depois com regex.', vai: 'f-regex', tom: 'ruim', consequencia: 'volta à fase 1: parsing de prosa para remediar um contrato mal desenhado.' }
            ] },
            vazia: { texto: 'Agora a lista pode vir vazia, mas algumas respostas listam quinze achados e estouram o teto de saída. Onde limitar?', opcoes: [
              { texto: 'No schema, com max_length=5 na lista e max_length nas strings, e descrições que digam o que vai em cada campo.', vai: 'f-bom', tom: 'ok', consequencia: 'o limite é mecânico e a descrição é instrução no ponto exato do preenchimento.' },
              { texto: 'No prompt: "liste no máximo 5".', vai: 'f-pedido', tom: 'ruim', consequencia: 'é só um pedido; o modelo pode ignorá-lo e a resposta estoura o max_tokens.' }
            ] }
          },
          finais: {
            'f-bom': { bom: true, texto: 'Arquivo trivial devolve lista vazia, o tamanho é limitado pelo contrato e a validação na fronteira continua ligada. A qualidade dos achados é assunto do M06.' },
            'f-prompt': { bom: false, texto: 'O modelo continuou inventando: sem saída legítima, o campo obrigatório pede invenção.' },
            'f-regex': { bom: false, texto: 'Você reconstruiu a fase 1: regex frágil e retries para consertar um schema.' },
            'f-pedido': { bom: false, texto: 'O limite no prompt falhou de vez em quando, e a resposta truncada derrubou o parser.' }
          },
          callout: 'Você deu ao modelo uma abstenção legítima e pôs os limites no schema.' },
        { tipo: 'escolha', id: 'm05b2-escolha-fonte', titulo: 'Confira: a fonte única do schema',
          pergunta: 'Você precisa trocar de provedor via gateway e o novo usa outra moldura de parâmetro para structured output. O que muda e o que fica?',
          opcoes: [
            { id: 'a', texto: 'Muda o adaptador fino; o contrato (Pydantic e o JSON Schema gerado) fica.', correta: true, porque: 'o JSON Schema é o que é comum entre provedores, e o Pydantic é a fonte única.' },
            { id: 'b', texto: 'Muda o contrato inteiro: cada provedor exige reescrever o schema.', correta: false, porque: 'o contrato é seu; só a moldura do parâmetro muda.' },
            { id: 'c', texto: 'Nada muda: o nome do parâmetro é o mesmo em todos os provedores.', correta: false, porque: 'na Anthropic é output_config.format; na OpenAI, response_format com strict true.' },
            { id: 'd', texto: 'A validação Pydantic deixa de ser necessária, porque o gateway valida.', correta: false, porque: 'o novo provedor pode não suportar a restrição, e é justamente por isso que a fronteira valida sempre.' }
          ], tutorDepois: 'Contrato seu, adaptador fino.' },
        { tipo: 'escolha', id: 'm05b2-escolha-tool', titulo: 'Confira: a ferramenta "responder"',
          pergunta: 'Num código antigo, uma ferramenta falsa chamada <code>responder</code> existe só para conseguir JSON do modelo. Qual é a leitura certa hoje?',
          opcoes: [
            { id: 'a', texto: 'Gambiarra da era pré-structured output: substituir pelo parâmetro nativo de schema.', correta: true, porque: 'a fase 2 do histórico; hoje só a fase 3 é aceitável em produção.' },
            { id: 'b', texto: 'Boa prática: tool calling é sempre mais seguro que structured output.', correta: false, porque: 'são mecanismos diferentes, e a ferramenta falsa era um truque para obter JSON.' },
            { id: 'c', texto: 'Aceitável, desde que se use regex para limpar a saída.', correta: false, porque: 'regex sobre saída de modelo é a fase 1.' },
            { id: 'd', texto: 'Obrigatória para o Pydantic funcionar.', correta: false, porque: 'o Pydantic só gera o schema e valida; não depende de ferramenta.' }
          ], tutorDepois: 'Fase 3: structured output nativo.' },
        { tipo: 'takeaway', html: '<mark>Forma imposta, verdade verificada</mark>: structured output e Pydantic cobrem a forma; a verdade vem de <mark>evals</mark>.' }
      ] }
    ]
  });
})();
