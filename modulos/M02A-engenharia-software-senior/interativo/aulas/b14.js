/* M02A · Bloco 14: compatibilidade Python: API em processo e CLI instalada decidem igual. Fonte: M02A.html#b14. */
(function () {
  var L = function (kind, text) { return { kind: kind, text: text }; };
  function opc(id, texto, correta, porque) { return { id: id, texto: texto, correta: correta, porque: porque }; }

  var codigo = [
    'import json', '', '',
    'def normalizada(resp):', '    # tupla comparável (decisao, codigo, valores). Ignora a renderização (campo "render") e a ordem das chaves;',
    '    # "valores" vira uma tupla de pares ordenada', '    return resp', '', '',
    'def divergencias(entradas, api, cli):', '    # api/cli: funções entrada -> resp (dict). Devolve as entradas cujas tuplas normalizadas diferem (inclui inválidas)', '    return []', '', '',
    'def classificar(evento):', '    # evento: dict de flags. Ordem de decisão:', '    # processo_morto -> "morte-de-processo"; admitido == False -> "sobrecarga";',
    '    # cancelado_externo -> "cancelamento"; prazo_estourado -> "timeout"; senão "concluido"', '    return "concluido"', ''].join('\n');
  var testes = [
    'def test_normalizacao_ignora_render_e_ordem():',
    '    a = {"decisao": "review", "codigo": "P0", "valores": {"b": 1, "a": "x"}, "render": "Review (P0)"}',
    '    b = {"valores": {"a": "x", "b": 1}, "codigo": "P0", "decisao": "review", "render": "REVIEW / P0"}',
    '    assert normalizada(a) == normalizada(b)', '', '',
    'def test_acordo_total_nao_tem_divergencia():',
    '    f = lambda e: {"decisao": "accept", "codigo": "OK", "valores": {"n": e}, "render": str(e)}',
    '    g = lambda e: {"valores": {"n": e}, "codigo": "OK", "decisao": "accept", "render": "<%s>" % e}',
    '    assert divergencias([1, 2, 3], f, g) == []', '', '',
    'def test_invalido_aceito_de_um_lado_e_divergencia():',
    '    api = lambda e: {"decisao": "reject", "codigo": "VALOR", "valores": {}} if e == "x" else {"decisao": "accept", "codigo": "OK", "valores": {}}',
    '    cli = lambda e: {"decisao": "accept", "codigo": "OK", "valores": {}}',
    '    assert divergencias(["a", "x"], api, cli) == ["x"]', '', '',
    'def test_quatro_eventos_distintos():',
    '    assert classificar({"admitido": False}) == "sobrecarga"',
    '    assert classificar({"admitido": True, "prazo_estourado": True}) == "timeout"',
    '    assert classificar({"admitido": True, "cancelado_externo": True}) == "cancelamento"',
    '    assert classificar({"admitido": True, "processo_morto": True}) == "morte-de-processo"',
    '    assert classificar({"admitido": True}) == "concluido"', ''].join('\n');
  var solucao = [
    'import json', '', '',
    'def normalizada(resp):', '    valores = tuple(sorted((k, json.dumps(v, sort_keys=True)) for k, v in resp.get("valores", {}).items()))',
    '    return (resp["decisao"], resp["codigo"], valores)', '', '',
    'def divergencias(entradas, api, cli):', '    return [e for e in entradas if normalizada(api(e)) != normalizada(cli(e))]', '', '',
    'def classificar(evento):', '    if evento.get("processo_morto"):', '        return "morte-de-processo"', '    if evento.get("admitido") is False:', '        return "sobrecarga"',
    '    if evento.get("cancelado_externo"):', '        return "cancelamento"', '    if evento.get("prazo_estourado"):', '        return "timeout"', '    return "concluido"', ''].join('\n');

  TrilhaAula.registrar({
    id: 'm02a-b14',
    titulo: 'Compatibilidade Python: API em processo e CLI instalada decidem igual',
    minutos: 35,
    resumo: '"A CLI chama a mesma função" é intenção, não garantia: entre a chamada em processo e o comando instalado moram serialização, validação, códigos de saída e um processo separado.',
    objetivo: 'Provar que API e CLI decidem igual sobre o mesmo corpus (inclusive inválidos), trocar adapter no composition root e distinguir sobrecarga, timeout, cancelamento e morte de processo.',
    revisao: [
      { id: 'm02ab14-corpus', pergunta: 'Por que API e CLI são testadas contra o mesmo corpus, inclusive os inválidos?',
        opcoes: [
          opc('a', 'Para provar que decidem igual (valores e erros idênticos); divergências aparecem em coerção, arredondamento, encoding e mensagens de erro de cada adapter.', true, 'o corpus compartilhado é o oráculo; golden herdado do B04 mais gerados com seed.'),
          opc('b', 'Para a CLI rodar mais rápido.', false, 'não tem relação.'),
          opc('c', 'Porque a CLI não precisa de testes próprios.', false, 'precisa; o ponto é o acordo.')] },
      { id: 'm02ab14-tupla', pergunta: 'O que entra e o que fica fora da comparação diferencial?',
        opcoes: [
          opc('a', 'Entram decisão, reason code e valores serializados normalizados pelo contrato (inclusive no erro); ficam fora saída bruta, formatação e ordem de chaves.', true, 'comparar texto acusa divergência onde o contrato concorda; normalizar demais esconde divergência real.'),
          opc('b', 'O texto exato da saída.', false, 'a renderização não é contrato.'),
          opc('c', 'Só o caminho feliz.', false, 'inválidos entram no acordo.')] },
      { id: 'm02ab14-adapter', pergunta: 'O que garante que trocar o adapter não quebra o consumidor?',
        opcoes: [
          opc('a', 'Contrato como Protocol, ligação só no composition root e a mesma suíte comportamental verde no fake e no substituto; adapter que fortalece precondição ou altera semântica falha mesmo tipando certo.', true, 'o limite é comportamental, não nominal.'),
          opc('b', 'O type checker passar.', false, 'forma não é semântica.'),
          opc('c', 'Importar o concreto no consumidor.', false, 'quebra o isolamento.')] },
      { id: 'm02ab14-eventos', pergunta: 'Como se diferenciam sobrecarga, timeout, cancelamento e morte de processo?',
        opcoes: [
          opc('a', 'Sobrecarga: recusa na admissão, nada para limpar. Timeout: prazo estourado, operação cancelada com cleanup. Cancelamento cooperativo: propaga após os pontos de verificação. Morte de processo: código de saída anormal, sem garantia de cleanup.', true, 'o corpus registra qual evento cada entrada provoca.'),
          opc('b', 'São o mesmo evento.', false, 'cada um tem efeito e tratamento próprios.'),
          opc('c', 'O cancelamento cooperativo cobre a morte do processo.', false, 'depende de a tarefa ceder; morte exige recuperação (idempotência, retomada).')] },
      { id: 'm02ab14-net', pergunta: 'Há ponte com .NET neste bloco?',
        opcoes: [
          opc('a', 'Não: sem runtime .NET no recorte seria declaração sem oráculo; uma ponte com outra stack é trilha externa com corpus e ambiente próprios.', true, 'o B14 não cria adapter .NET nem transfere aprovação para outra linguagem.'),
          opc('b', 'Sim, a CLI roda em .NET.', false, 'o recorte é Python.'),
          opc('c', 'Sim, por JSON Schema.', false, 'o schema não executa a stack.')] }
    ],
    abas: [
      { rotulo: 'Entender', blocos: [
        { tipo: 'texto', html:
          '<p>Instalar fora do checkout não prova que os dois modos de usar o produto concordam. "A CLI chama a mesma função" é intenção, não garantia: entre a chamada em processo e o comando instalado moram a serialização, a fronteira de validação, os códigos de saída do sistema operacional e um processo separado que pode morrer sem avisar.</p>' +
          '<h3>A mesma decisão pelos dois caminhos</h3>' +
          '<p><strong>API em processo</strong>: chamada de função no mesmo interpretador, sem texto no meio. <strong>CLI instalada</strong>: ponto de entrada executado como comando num processo separado; argumentos e entrada viajam como texto, a resposta volta como texto na saída padrão e o desfecho aparece também no código de saída. O instrumento é o <strong>corpus diferencial</strong>: o subconjunto <em>golden</em> congelado do B04 mais entradas geradas com seed fixo. Cada entrada percorre os dois caminhos e as respostas são normalizadas pelo contrato.</p>' },
        { tipo: 'codigo', linguagem: 'python', texto: 'def comparar_caminhos(entradas, api_em_processo, cli_instalada):\n    # normaliza antes de comparar, inclui inválidos\n    for entrada in entradas:\n        a = api_em_processo.decidir(entrada).normalizada()\n        b = cli_instalada.decidir(entrada).normalizada()\n        assert (a.decisao, a.codigo, a.valores) == (b.decisao, b.codigo, b.valores)' },
        { tipo: 'texto', html:
          '<h3>Valores e erros idênticos, inclusive nos inválidos</h3>' +
          '<p>Atravessar a fronteira serializada (no recorte, JSON em texto) é converter o objeto e reconstruir do outro lado sem perder nem inventar significado. O oráculo exige que <strong>reason codes</strong> (códigos curtos e estáveis do motivo) e valores serializados coincidam nos dois caminhos. A preservação de tipos do B04 (decimal, timezone, UTF-8, enums) é herança: o B14 não a re-prova isolada, exige que os dois caminhos a preservem do mesmo jeito. A divergência clássica: a CLI coage texto em número na fronteira enquanto a API recebe o objeto já tipado.</p>' +
          '<p>Falha típica: comparar texto em vez de decisão (o teste acusa onde o contrato concorda) ou normalizar demais e esconder divergência real. Compare a tupla decisão, código e valores; deixe saída bruta, formatação e ordem de chaves de fora.</p>' },
        { tipo: 'takeaway', html: 'Normalize pelo contrato e compare <mark>decisão, código e valores</mark>, inclusive nos <mark>inválidos</mark>.' }
      ] },

      { rotulo: 'Adapters e falhas', blocos: [
        { tipo: 'texto', html:
          '<h3>Trocar o adapter sem tocar o consumidor</h3>' +
          '<p><strong>Adapter</strong> traduz o contrato interno para o mundo externo (avaliador, leitor de arquivo, provedor). O consumidor enxerga só o contrato, declarado como <code>Protocol</code> (PEP 544). O <strong>composition root</strong> é o único ponto autorizado a escolher a implementação concreta. O limite é comportamental, não nominal: adapter que fortalece precondição ou altera semântica falha no teste de contrato mesmo tipando certo. A troca vem com o mesmo corpus: a suíte comportamental única passa no fake e no substituto.</p>' },
        { tipo: 'codigo', linguagem: 'python', texto: 'def compor(avaliador):\n    # composition root: consumidor recebe contrato, nunca concreto\n    politica = Politica(avaliador=avaliador)\n    return (ApiEmProcesso(politica), CliInstalada(politica))' },
        { tipo: 'callout', tom: 'info', titulo: 'Limite: nada de .NET aqui', html: '<p>Sem runtime .NET instalado no recorte, qualquer comparação com outra linguagem seria declaração sem oráculo. Ponte com outra stack é trilha externa com corpus e ambiente próprios; o B14 não cria adapter .NET nem transfere aprovação para ela.</p>' },
        { tipo: 'texto', html: '<h3>Sobrecarga, timeout, cancelamento e morte de processo</h3>' },
        { tipo: 'texto', largo: true, html:
          '<table><thead><tr><th>Evento</th><th>Efeito observável</th><th>O que o cleanup garante</th></tr></thead><tbody>' +
          '<tr><td>sobrecarga na admissão</td><td>recusa explícita com motivo de capacidade; processo vivo</td><td>nada para limpar: a tarefa não foi criada</td></tr>' +
          '<tr><td>timeout da operação</td><td>operação possuída cancelada no prazo; sem órfã</td><td>cleanup executa; descarte contabilizado nos dois caminhos</td></tr>' +
          '<tr><td>cancelamento cooperativo</td><td>pedido externo propaga ao chamador após os pontos de verificação</td><td><code>finally</code> executa onde o ponto foi alcançado; fora dele, nada é prometido</td></tr>' +
          '<tr><td>término do processo da CLI</td><td>código de saída anormal; a resposta pode nunca chegar</td><td>nenhuma: <code>finally</code>, flush e escrita parcial podem não ocorrer</td></tr>' +
          '</tbody></table>' },
        { tipo: 'texto', html: '<p>O teste demonstra os três primeiros nos dois caminhos com cleanup observado e declara o quarto como <strong>não-garantia</strong>: encerrar o processo não é cancelamento com cleanup, é perda de efeito com código de saída. Código CPU-bound ou bloqueante não responde a cancelamento cooperativo. O corpus registra qual evento cada entrada provoca, para que sobrecarga nunca seja lida como timeout.</p>' +
          '<p><strong>Fontes</strong> (revalidar por release/revisão): Python 3.14 (<code>argparse</code>, <code>json</code>, <code>subprocess</code>, asyncio tasks e cancelamento); PEP 544; JSON Schema 2020-12; RFC 9457 (contraste: erro interoperável com motivo tipado).</p>' },
        { tipo: 'takeaway', html: '<mark>Morte de processo</mark> não é cancelamento: sem garantia de <mark>cleanup</mark>, exige recuperação idempotente.' }
      ] },

      { rotulo: 'Praticar e conferir', blocos: [
        { tipo: 'rode', id: 'b14-rode', titulo: 'Golden diverge num caminho só', obrigatorio: false,
          enunciado: 'Corpus diferencial com uma entrada inválida. Saída ilustrativa (exemplo).',
          prefixo: '$', entrada: 'pytest tests/test_compatibilidade.py  # exemplo', unidade: 'ms', terminalTitulo: 'exemplo (saída variável)',
          prever: { pergunta: 'A API rejeita o valor 10.123 (três casas) com código VALOR; a CLI o aceita porque coage o texto. O teste diferencial?', opcoes: [
            { id: 'a', texto: 'Passa: os dois caminhos funcionam.', correta: false, porque: 'funcionar não é decidir igual.' },
            { id: 'b', texto: 'Falha: o inválido é aceito de um lado e o reason code some.', correta: true, porque: 'alinhe validação e coerção na fronteira dos dois caminhos.' }] },
          etapas: [
            { id: 'a', nome: 'API em processo', descricao: '', tom: 'dns', ms: 1, linhas: [L('out', '("reject", "VALOR", ())')] },
            { id: 'b', nome: 'CLI instalada (outro processo)', descricao: '', tom: 'request', ms: 1, linhas: [L('out', '("accept", "OK", (("valor", "10.123"),))')] },
            { id: 'c', nome: 'Comparação', descricao: '', tom: 'response', ms: 1, linhas: [L('out', 'DIVERGÊNCIA entrada=10.123'), L('hint', 'mesma tupla decisão-código-valores nos dois caminhos')] }
          ] },
        { tipo: 'python', id: 'b14-python', titulo: 'Diferencial e classificação de eventos', obrigatorio: false,
          enunciado: 'Implemente <code>normalizada</code> (ignora render e ordem de chaves), <code>divergencias</code> e <code>classificar</code> (morte, sobrecarga, cancelamento, timeout).',
          codigo: codigo, testes: testes,
          dica: 'Tupla <code>(decisao, codigo, valores_ordenados)</code>; use <code>sorted</code> nos itens de <code>valores</code>. Siga a ordem de decisão do enunciado.',
          solucao: solucao, callout: 'Diferencial sobre valores normalizados e eventos distintos.' },
        { tipo: 'escolha', id: 'b14-esc1', titulo: 'Confira: troca de adapter', pergunta: 'A troca do adapter quebra a CLI. Hipótese?',
          opcoes: [
            { id: 'a', texto: 'Ligação fora do composition root ou precondição fortalecida; ligar só na raiz contra Protocol e rodar a suíte comportamental.', correta: true, porque: 'o consumidor importava o concreto ou recusava entrada contratada.' },
            { id: 'b', texto: 'O Protocol está errado.', correta: false, porque: 'forma não é o problema.' }] },
        { tipo: 'escolha', id: 'b14-esc2', titulo: 'Confira: cleanup que não vem', pergunta: 'A CLI morreu e o teste esperava cleanup. O que corrigir?',
          opcoes: [
            { id: 'a', texto: 'Declarar a não-garantia e observar só o código de saída e a ausência de resposta; término de processo não é cancelamento.', correta: true, porque: 'finally, flush e escrita parcial podem não acontecer.' },
            { id: 'b', texto: 'Aumentar o timeout.', correta: false, porque: 'timeout não cobre morte de processo.' }] },
        { tipo: 'takeaway', html: 'Sobrecarga, timeout, cancelamento e morte de processo têm <mark>sinal e tratamento</mark> próprios.' }
      ] }
    ]
  });
})();
