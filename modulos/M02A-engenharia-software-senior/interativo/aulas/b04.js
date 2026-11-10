/* M02A · Bloco 4: contratos, compatibilidade e interoperabilidade. Fonte: M02A.html#b4. */
(function () {
  var L = function (kind, text) { return { kind: kind, text: text }; };
  function opc(id, texto, correta, porque) { return { id: id, texto: texto, correta: correta, porque: porque }; }

  var codigo = [
    'from decimal import Decimal', '', '',
    'def decimal_valido(texto):', '    # string decimal com no máximo duas casas ("10", "10.5", "10.50"); sem float, sem sinal, sem vazio',
    '    # devolve Decimal ou levanta ValueError', '    return Decimal(0)', '', '',
    'def compatibilidade(mudanca, consumidor_estrito):', '    # mudanca: "adicao_opcional" | "remocao" | "troca_de_tipo"',
    '    # devolve "compativel" ou "quebra"; adição opcional só quebra consumidor estrito (schema fechado)', '    return "compativel"', ''].join('\n');
  var testes = [
    'def test_decimal_aceita_ate_duas_casas():',
    '    assert decimal_valido("10") == Decimal("10")', '    assert decimal_valido("0.10") == Decimal("0.10")', '', '',
    'def test_decimal_rejeita_tres_casas_float_e_vazio():',
    '    for ruim in ["0.123", "1e3", "", "-1", "abc", "1,5"]:',
    '        try:', '            decimal_valido(ruim)', '        except ValueError:', '            continue',
    '        raise AssertionError(ruim)', '', '',
    'def test_decimal_nao_tem_erro_binario():', '    assert decimal_valido("0.1") + decimal_valido("0.2") == Decimal("0.3")', '', '',
    'def test_matriz_de_compatibilidade():',
    '    assert compatibilidade("adicao_opcional", False) == "compativel"', '    assert compatibilidade("adicao_opcional", True) == "quebra"',
    '    assert compatibilidade("remocao", False) == "quebra"', '    assert compatibilidade("troca_de_tipo", False) == "quebra"', ''].join('\n');
  var solucao = [
    'import re', 'from decimal import Decimal', '', '',
    'def decimal_valido(texto):', '    if not isinstance(texto, str) or not re.fullmatch(r"\\d+(\\.\\d{1,2})?", texto):',
    '        raise ValueError(texto)', '    return Decimal(texto)', '', '',
    'def compatibilidade(mudanca, consumidor_estrito):', '    if mudanca == "adicao_opcional":', '        return "quebra" if consumidor_estrito else "compativel"',
    '    return "quebra"', ''].join('\n');

  TrilhaAula.registrar({
    id: 'm02a-b4',
    titulo: 'Contratos, compatibilidade e interoperabilidade',
    minutos: 35,
    resumo: 'JSON válido não garante integração correta: contrato tem forma, significado e comportamento operacional, e compatibilidade é relação dirigida com o consumidor.',
    objetivo: 'Separar as três camadas do contrato, desenhar uma trust boundary que recusa ambiguidade e decidir se uma mudança v1 para v2 quebra algum consumidor.',
    revisao: [
      { id: 'm02ab4-camadas', pergunta: 'Quais as três camadas de um contrato?',
        opcoes: [
          opc('a', 'Sintática (forma), semântica (significado e efeito) e operacional (timeout, erro, limite, evolução).', true, 'nenhuma notação as impõe integralmente; JSON Schema valida instâncias, OpenAPI descreve HTTP, AsyncAPI mensagens.'),
          opc('b', 'JSON, XML e Protobuf.', false, 'são formatos, não camadas.'),
          opc('c', 'Cliente, servidor e banco.', false, 'são participantes.')] },
      { id: 'm02ab4-forbid', pergunta: 'Por que <code>extra="forbid"</code> e <code>additionalProperties: false</code> na borda?',
        opcoes: [
          opc('a', 'Impedem que um campo como <code>is_admin</code> atravesse a fronteira e vire comportamento em outra camada.', true, 'schema fechado reduz forma inesperada, mas não substitui autorização nem policy.'),
          opc('b', 'Por estética.', false, 'a decisão tem função de segurança.'),
          opc('c', 'Para garantir que o texto seja verdadeiro.', false, 'schema não prova veracidade.')] },
      { id: 'm02ab4-compat', pergunta: '"Adicionar campo opcional é compatível." Quando isso é falso?',
        opcoes: [
          opc('a', 'Para consumidor com schema fechado ou que assina o payload inteiro.', true, 'compatibilidade é relação entre mudança, consumidor e modo de uso.'),
          opc('b', 'Nunca é falso.', false, 'depende do consumidor.'),
          opc('c', 'Só para APIs públicas.', false, 'o critério é o consumidor.')] },
      { id: 'm02ab4-decimal', pergunta: 'Por que o corpus aceita decimal como string de até duas casas e não float?',
        opcoes: [
          opc('a', 'Float cria representação binária ambígua para valor monetário; produtor e consumidor declaram unidade, escala e representação e testam no corpus.', true, '0.1 + 0.2 em float dá 0.30000000000000004; a regra não manda toda API do mundo usar string.'),
          opc('b', 'Porque JSON não tem números.', false, 'tem, mas o problema é a representação binária.'),
          opc('c', 'Para economizar bytes.', false, 'não é o motivo.')] },
      { id: 'm02ab4-remocao', pergunta: 'Você quer remover da v1 um campo que "ninguém parece usar". Primeiro passo?',
        opcoes: [
          opc('a', 'Identificar consumidores, declarar depreciação (janela, owner, telemetria) e só então contrair (expand-contract).', true, 'compatibilidade é propriedade dos consumidores, não do produtor.'),
          opc('b', 'Remover e esperar reclamação.', false, 'transfere o custo para quem consome.'),
          opc('c', 'Renomear para ver quem quebra em produção.', false, 'é remoção disfarçada.')] }
    ],
    abas: [
      { rotulo: 'Entender', blocos: [
        { tipo: 'texto', html:
          '<p>Uma integração quebra mesmo quando os dois lados aceitam JSON: o campo pode ter nome e tipo corretos e representar a unidade errada; a resposta pode seguir o schema e omitir a garantia de idempotência; a operação pode funcionar na primeira chamada e falhar em timeout, paginação ou erro. <strong>Contrato</strong> é a porção do comportamento sobre a qual produtor e consumidor precisam concordar.</p>' },
        { tipo: 'texto', largo: true, html:
          '<table><thead><tr><th>Camada</th><th>Pergunta</th><th>No work-intake</th><th>O que não prova</th></tr></thead><tbody>' +
          '<tr><td>sintática</td><td>forma, campos, tipos e restrições são aceitos?</td><td>JSON Schema fecha <code>WorkRequest</code> e proíbe campo extra</td><td>que budget seja lido na unidade certa</td></tr>' +
          '<tr><td>semântica</td><td>qual significado, invariante e efeito?</td><td>advisory não revoga proibição de policy</td><td>que a operação sobreviva a timeout ou retry</td></tr>' +
          '<tr><td>operacional</td><td>como timeout, auth, erro, limite e evolução se comportam?</td><td>reason code e versão de contrato entram na decisão e evidência</td><td>que dois runtimes serializem bytes iguais sem corpus</td></tr>' +
          '</tbody></table>' },
        { tipo: 'texto', html:
          '<p>JSON Schema valida instâncias JSON; <strong>OpenAPI</strong> descreve uma superfície HTTP; <strong>AsyncAPI</strong> descreve interfaces dirigidas a mensagens. Nenhum substitui policy de domínio, observabilidade ou teste contra uma implementação.</p>' +
          '<h3>Trust boundary: recusar ambiguidade cedo</h3>' +
          '<p>Uma <strong>trust boundary</strong> é onde dado externo ganha significado interno. O parser aceita texto JSON, identifica a versão, valida a forma e constrói <code>WorkRequest</code>. <code>extra="forbid"</code> / <code>additionalProperties: false</code> impede que <code>is_admin</code> atravesse em silêncio. A referência também verifica formato decimal, timezone e intenção em branco; <code>Decimal</code> só é construído depois que o texto decimal foi validado.</p>' },
        { tipo: 'codigo', linguagem: 'python', texto: '# Trecho conceitual: a versão escolhe o modelo explícito.\nif version == "1.0":\n    model_type = WorkRequestV1\nelif version == "2.0":\n    model_type = WorkRequestV2\nelse:\n    raise BoundaryError(("schema_version",))\nmodel = model_type.model_validate(payload)' },
        { tipo: 'callout', tom: 'danger', titulo: 'Quase correto: schema como autorização', html:
          '<p>Schema fechado reduz forma inesperada. Não decide se o tenant pode executar a ação, se o usuário tem escopo ou se o texto é verdadeiro. Autorização, policy e integridade de dados são responsabilidades distintas; confundir validação com segurança completa deixa a fronteira mais fraca.</p>' },
        { tipo: 'takeaway', html: 'Contrato tem <mark>forma</mark>, <mark>significado</mark> e <mark>comportamento operacional</mark>; schema fecha só a forma.' }
      ] },

      { rotulo: 'Evolução e semântica', blocos: [
        { tipo: 'texto', html:
          '<h3>Evoluir v1 para v2 começa pelo consumidor</h3>' +
          '<p>Compatibilidade não é atributo da versão isolada: é uma relação entre uma mudança, um consumidor e um modo de uso. Identifique quem produz, quem consome, que versões coexistem e o que cada lado aceita.</p>' },
        { tipo: 'texto', largo: true, html:
          '<table><thead><tr><th>Mudança</th><th>Consumidor v1 estrito</th><th>Consumidor v2 do laboratório</th><th>Decisão</th></tr></thead><tbody>' +
          '<tr><td>adicionar <code>source</code> opcional em v2</td><td>não recebe v2; schema v1 fecha campos</td><td>aceita v1 e v2; default <code>import</code></td><td>compatível só na matriz declarada</td></tr>' +
          '<tr><td>remover <code>idempotency_key</code></td><td>falha: obrigatório ausente</td><td>falha: a invariante perde entrada</td><td>quebra; bloquear gate</td></tr>' +
          '<tr><td>decimal de string para número</td><td>falha ou lê outro tipo</td><td>falha no modelo estrito</td><td>quebra; versão ou migração explícita</td></tr>' +
          '</tbody></table>' },
        { tipo: 'codigo', linguagem: 'json', texto: '{\n  "current_consumer": "2.0",\n  "accepted_inputs": ["1.0", "2.0"],\n  "v2_changes": [{"field": "source", "kind": "optional_addition", "default": "import"}]\n}' },
        { tipo: 'texto', html:
          '<p>A matriz <code>contracts/compatibility.json</code> declara que o consumidor 2.0 aceita inputs 1.0 e 2.0; não afirma que um consumidor 1.0 aceita v2 (assimetria intencional). O corpus tem uma fixture por versão, para o comportamento não virar só uma frase em ADR. Versão no path, header, media type, envelope ou campo tem trade-offs de descoberta, cache, governança e migração; o laboratório usa o campo <code>schema_version</code> porque trabalha com fixtures offline, o que não faz dele a política certa para HTTP público, eventos ou banco. Depreciação precisa de janela, consumidores identificados, telemetria de uso, owner e condição de remoção.</p>' +
          '<h3>Tempo, decimal, enum, UTF-8 e erro carregam semântica</h3>' },
        { tipo: 'texto', largo: true, html:
          '<table><thead><tr><th>Valor</th><th>Representação do corpus</th><th>Risco evitado</th></tr></thead><tbody>' +
          '<tr><td>tempo</td><td>RFC 3339 com offset; parser exige timezone</td><td>hora local sem zona, ordem impossível de reconstruir</td></tr>' +
          '<tr><td>decimal</td><td>string decimal de até duas casas antes de <code>Decimal</code></td><td>arredondamento binário e escala implícita</td></tr>' +
          '<tr><td>enum</td><td>valores fechados (<code>normal</code>, <code>critical</code>)</td><td>casing, sinônimo ou estado desconhecido aceito em silêncio</td></tr>' +
          '<tr><td>texto</td><td>UTF-8 e <code>ensure_ascii=False</code></td><td>perda de caracteres e diferença invisível entre runtimes</td></tr>' +
          '<tr><td>erro</td><td><code>BoundaryError.fields</code> e reason codes estáveis</td><td>parser interno, mensagem humana e contrato externo misturados</td></tr>' +
          '</tbody></table>' },
        { tipo: 'texto', html:
          '<p>RFC 9457 padroniza <em>problem details</em> para HTTP; não obriga a CLI local a falar HTTP nem substitui um código de domínio. O princípio transferível: mensagem segura para o consumidor, causa preservada para operação e código estável para automação. A coincidência de reason codes e serialização entre chamada em processo e CLI instalada <strong>permanece pendente</strong> até a execução do corpus diferencial (veja o B14).</p>' +
          '<p><strong>Panorama:</strong> o State of the API 2025 da Postman (mais de 5.700 pessoas) relata uso amplo de APIs e diferença entre testes funcionais e contract testing; é sinal industrial de coordenação, com viés de amostra e vínculo com fornecedor, não fonte normativa. Domine schema, corpus golden, compatibilidade e erros antes de escolher plataforma (Pact, Schemathesis, Dredd são ferramentas).</p>' },
        { tipo: 'takeaway', html: 'Compatibilidade é <mark>relação dirigida</mark> entre mudança e consumidor; tempo, decimal, enum, encoding e erro são <mark>decisões de semântica</mark>.' }
      ] },

      { rotulo: 'Praticar e conferir', blocos: [
        { tipo: 'rode', id: 'b4-rode', titulo: 'Campo extra na fronteira', obrigatorio: false,
          enunciado: 'Fixture adversarial com <code>is_admin</code>. Saída ilustrativa (exemplo).',
          prefixo: '$', entrada: 'work-intake submit request-extra-field.json  # exemplo', unidade: 'ms', terminalTitulo: 'exemplo (saída variável)',
          prever: { pergunta: 'O payload tem um campo desconhecido <code>is_admin</code>. O que a borda faz?', opcoes: [
            { id: 'a', texto: 'Ignora o campo e segue.', correta: false, porque: 'ignorar em silêncio deixa o campo viver em outra camada.' },
            { id: 'b', texto: 'Rejeita com BoundaryError listando o campo.', correta: true, porque: 'o modelo fechado recusa ambiguidade cedo.' }] },
          etapas: [
            { id: 'p', nome: 'Parse', descricao: 'versão e forma', tom: 'dns', ms: 1, linhas: [L('cmd', 'work-intake submit fixtures/adversarial/request-extra-field.json'), L('info', 'schema_version=1.0')] },
            { id: 'v', nome: 'Valida', descricao: 'modelo estrito', tom: 'response', ms: 1, linhas: [L('out', 'BoundaryError fields=("is_admin",)'), L('hint', 'exit=2 (exemplo)')] }
          ] },
        { tipo: 'python', id: 'b4-python', titulo: 'Decimal na borda e matriz de compatibilidade', obrigatorio: false,
          enunciado: 'Implemente <code>decimal_valido(texto)</code> (string decimal de até duas casas; <code>ValueError</code> caso contrário) e <code>compatibilidade(mudanca, consumidor_estrito)</code>.',
          codigo: codigo, testes: testes,
          dica: '<code>re.fullmatch(r"\\d+(\\.\\d{1,2})?", texto)</code> antes de construir <code>Decimal</code>. Adição opcional só quebra consumidor estrito.',
          solucao: solucao, callout: 'Borda e matriz verificadas por teste.' },
        { tipo: 'cenario', id: 'b4-cenario', titulo: 'Remover o campo "que ninguém usa"', obrigatorio: false,
          enunciado: 'Um campo da v1 parece morto. Decida como removê-lo.',
          inicio: 'i',
          nos: { i: { texto: 'Primeiro passo?', opcoes: [
            { texto: 'Remover e esperar quem reclama.', vai: 'f-ruim', tom: 'ruim', consequencia: 'o custo vai para o consumidor.' },
            { texto: 'Descobrir consumidores e declarar a depreciação com janela e owner.', vai: 'n2', tom: 'ok', consequencia: 'compatibilidade é propriedade dos consumidores.' }] },
            n2: { texto: 'Como saber se o campo morreu?', opcoes: [
              { texto: 'Telemetria de uso por consumidor; contrair só após todos declararem a versão nova.', vai: 'f-bom', tom: 'ok', consequencia: 'expand-contract com evidência.' },
              { texto: 'Perguntar em um canal de chat.', vai: 'f-chat', tom: 'ruim', consequencia: 'ausência de resposta não é ausência de uso.' }] } },
          finais: { 'f-bom': { bom: true, texto: 'Remoção segura: janela, telemetria e confirmação dos consumidores.' }, 'f-ruim': { bom: false, texto: 'Quebra em produção descoberta por um cliente.' }, 'f-chat': { bom: false, texto: 'Consumidor silencioso quebrou depois da remoção.' } },
          callout: 'Você começou pelo consumidor.' },
        { tipo: 'escolha', id: 'b4-esc1', titulo: 'Confira: dinheiro no contrato', pergunta: 'Um valor monetário trafega como número JSON e dá 0,30000000000000004 no consumidor. Qual desenho é mais seguro?',
          opcoes: [
            { id: 'a', texto: 'Seguir com float: o JSON é válido.', correta: false, porque: 'validade de forma não garante significado.' },
            { id: 'b', texto: 'Representação decimal explícita (string decimal ou centavos inteiros) mais moeda, documentada no contrato e testada no corpus.', correta: true, porque: 'cada consumidor arredondando por conta própria é divergência garantida.' },
            { id: 'c', texto: 'Trocar JSON por XML.', correta: false, porque: 'o problema é a representação, não o formato.' }] },
        { tipo: 'escolha', id: 'b4-esc2', titulo: 'Confira: v2 no produtor', pergunta: 'v2 funciona no produtor e v1 quebra. Qual a hipótese?',
          opcoes: [
            { id: 'a', texto: 'Compatibilidade declarada sem consumidor definido; falta matriz e fixture do consumidor antigo.', correta: true, porque: 'registre a direção da compatibilidade ou versione a mudança.' },
            { id: 'b', texto: 'O consumidor v1 está errado por definição.', correta: false, porque: 'compatibilidade é do consumidor, não do produtor.' }] },
        { tipo: 'takeaway', html: 'Corpus <mark>golden</mark> e caso <mark>incompatível</mark> tornam a matriz executável.' }
      ] }
    ]
  });
})();
