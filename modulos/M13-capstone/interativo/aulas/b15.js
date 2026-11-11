/* M13 · Bloco 15: experiência web mínima, onboarding e Diátaxis. Fonte: M13.html#h-b15. Saídas do rode são a execução registrada no bloco (evidence/m13/B15). */
(function () {
  var L = function (kind, text) { return { kind: kind, text: text }; };
  function opc(id, texto, correta, porque) { return { id: id, texto: texto, correta: correta, porque: porque }; }

  var codigoA11y = String.raw`import re

def a11y_audit(html):
    # LACUNA: devolva a lista ordenada de violacoes entre
    # "lang", "h1", "alt", "label", "aria-live".
    return []
`;
  var solucaoA11y = String.raw`import re

def a11y_audit(html):
    v = []
    if not re.search(r"<html[^>]*\blang=", html):
        v.append("lang")
    if len(re.findall(r"<h1\b", html)) != 1:
        v.append("h1")
    if any(not re.search(r"\balt=", t) for t in re.findall(r"<img\b[^>]*>", html)):
        v.append("alt")
    for t in re.findall(r"<input\b[^>]*>", html):
        m = re.search(r"\bid=\"([^\"]+)\"", t)
        if not m or not re.search(r"<label[^>]*\bfor=\"" + re.escape(m.group(1)) + "\"", html):
            v.append("label")
            break
    if "data-state=\"progress\"" in html and "aria-live" not in html:
        v.append("aria-live")
    return sorted(v)
`;
  var testesA11y = String.raw`BOA = ('<html lang="pt-BR"><body><h1>Cartografo</h1>'
       '<label for="q">Pergunta</label><input id="q" type="text">'
       '<img src="a.png" alt="Grafo">'
       '<div data-state="progress" aria-live="polite">analisando</div></body></html>')

def test_pagina_boa_passa():
    assert a11y_audit(BOA) == []

def test_sem_lang():
    assert a11y_audit(BOA.replace(' lang="pt-BR"', "")) == ["lang"]

def test_dois_h1():
    assert a11y_audit(BOA.replace("</body>", "<h1>Outro</h1></body>")) == ["h1"]

def test_imagem_sem_alt():
    assert a11y_audit(BOA.replace(' alt="Grafo"', "")) == ["alt"]

def test_input_sem_label():
    assert a11y_audit(BOA.replace('<label for="q">Pergunta</label>', "")) == ["label"]

def test_progresso_sem_aria_live():
    assert a11y_audit(BOA.replace(' aria-live="polite"', "")) == ["aria-live"]

def test_pagina_violadora_item_por_item():
    ruim = '<html><body><img src="a.png"><input id="x"><div data-state="progress"></div></body></html>'
    assert a11y_audit(ruim) == ["alt", "aria-live", "h1", "label", "lang"]
`;

  TrilhaAula.registrar({
    id: 'm13-b15',
    titulo: 'Experiência web mínima, onboarding e documentação Diátaxis',
    minutos: 30,
    resumo: 'A promessa é uma jornada sem intervenção do autor: cadastro, ingestão, primeira pergunta, relatório. O render é função pura, a acessibilidade tem oráculo e a documentação tem quatro tipos.',
    objetivo: 'Explicar por que o render determinístico é propriedade de engenharia, o que o oráculo estrutural de acessibilidade cobre e não cobre, e o que separa os quatro tipos Diátaxis.',
    revisao: [
      { id: 'm13b15-puro', pergunta: 'Por que o render como função pura estado→HTML importa?',
        opcoes: [
          opc('a', 'Mesma entrada, mesmos bytes: a página é versionável e testável byte a byte', true, 'render com efeito colateral (rede, hora) gera página impossível de versionar.'),
          opc('b', 'Por estética', false, 'é propriedade de engenharia, não de estilo.'),
          opc('c', 'Porque dispensa teste', false, 'o teste compara duas renderizações byte a byte.')] },
      { id: 'm13b15-escape', pergunta: 'Qual a regra para conteúdo vindo de fora na página?',
        opcoes: [
          opc('a', 'Todo conteúdo externo passa por <code>html.escape</code>, testado com um payload <code>&lt;script&gt;</code> real', true, 'interpolação sem escape é XSS de manual.'),
          opc('b', 'Escapar só mensagens de erro', false, 'o escape é para todo conteúdo externo.'),
          opc('c', 'Confiar no framework', false, 'o bloco não usa framework de frontend.')] },
      { id: 'm13b15-wcag', pergunta: 'O <code>a11y_audit</code> passou nos quatro estados. Isso prova WCAG 2.2 AA?',
        opcoes: [
          opc('a', 'Não: cobre critérios estruturais; texto alternativo bom, contraste real e uso com teclado ou leitor de tela pedem julgamento humano', true, 'acessibilidade declarada sem oráculo não conta, mas o oráculo não substitui pessoas.'),
          opc('b', 'Sim, o oráculo é completo', false, 'ele checa lang, h1 único, alt, label e aria-live.'),
          opc('c', 'Sim, se o mypy passar', false, 'tipos não dizem nada sobre acessibilidade.')] },
      { id: 'm13b15-estados', pergunta: 'Quais são os quatro estados com markup explícito e por que o empty importa?',
        opcoes: [
          opc('a', 'empty, progress (<code>aria-live</code>), error (<code>role="alert"</code>) e result; empty é projetado para o usuário saber que não quebrou', true, 'estado vazio em branco deixa dúvida entre vazio e quebrado.'),
          opc('b', 'loading, ready, done e fail', false, 'não são os estados do bloco.'),
          opc('c', 'Só erro e sucesso', false, 'faltariam empty e progress.')] }
    ],
    abas: [
      { rotulo: 'Entender', blocos: [
        { tipo: 'texto', html:
          '<h3>A jornada sem o autor por perto</h3>' +
          '<p>Um usuário novo deve ir de cadastro a ingestão, primeira pergunta e relatório sem pedir ajuda ao autor. Sem framework de frontend, o render é uma <strong>função pura</strong> estado→HTML (<code>render_page</code>): o teste compara duas renderizações byte a byte.</p>' +
          '<ul><li><strong>Escape:</strong> todo conteúdo externo passa por <code>html.escape</code>; o teste injeta <code>&lt;script&gt;</code> na mensagem de erro.</li>' +
          '<li><strong>Quatro estados:</strong> empty, progress (<code>aria-live</code>), error (<code>role="alert"</code>) e result.</li>' +
          '<li><strong>Acessibilidade como oráculo:</strong> <code>a11y_audit</code> exige <code>lang</code>, exatamente um <code>&lt;h1&gt;</code>, <code>alt</code> em imagem, label em input e <code>aria-live</code> no progresso. Aprova os quatro estados e reprova uma página violadora item por item.</li>' +
          '<li><strong>Diátaxis:</strong> quatro arquivos (tutorial, how-to, reference, explanation), e um teste exige o tipo declarado em cada um. Escrito como outro tipo, o documento vira depósito.</li></ul>' +
          '<p><strong>Limite:</strong> WCAG 2.2 AA tem critérios que exigem julgamento humano. Usabilidade com piloto humano está fora do ambiente automatizado; os problemas observáveis aqui são os que os oráculos capturam.</p>' },
        { tipo: 'takeaway', html: 'Render <mark>puro</mark>, escape <mark>sempre</mark> e acessibilidade com <mark>oráculo</mark>, que não é a norma inteira.' }
      ] },

      { rotulo: 'Ver funcionando', blocos: [
        { tipo: 'rode', id: 'b15-rode', titulo: 'Rode os oráculos da experiência web', enunciado: 'Aperte Enter e acompanhe. Saída registrada no bloco (<code>evidence/m13/B15</code>).',
          prefixo: '$', entrada: 'uv run pytest tests/test_webexp.py -v', unidade: 'testes', terminalTitulo: 'lab M13 (saída registrada)',
          prever: { pergunta: 'O teste injeta <code>&lt;script&gt;</code> na mensagem de erro. O que ele verifica na página renderizada?', opcoes: [
            { id: 'a', texto: 'Que o conteúdo aparece escapado, sem tag executável', correta: true, porque: '<code>test_conteudo_externo_escapado</code>: todo conteúdo externo passa por <code>html.escape</code>.' },
            { id: 'b', texto: 'Que a página não renderiza erros', correta: false, porque: 'o estado error existe e é renderizado.' },
            { id: 'c', texto: 'Que o script roda no navegador', correta: false, porque: 'o objetivo é impedir exatamente isso.' }
          ] },
          etapas: [
            { id: 'render', nome: 'Render e estados', descricao: 'Bytes iguais, escape, quatro estados', tom: 'dns', ms: 3, linhas: [
              L('cmd', 'uv run pytest tests/test_webexp.py -v'),
              L('out', 'test_render_deterministico_mesmos_bytes PASSED'),
              L('out', 'test_conteudo_externo_escapado PASSED'),
              L('out', 'test_estados_empty_progress_error_result PASSED')] },
            { id: 'a11y', nome: 'Acessibilidade', descricao: 'Aprova e reprova item por item', tom: 'request', ms: 2, linhas: [
              L('out', 'test_a11y_audit_aprova_paginas_e_reprova_violacoes PASSED'),
              L('hint', 'passa nos quatro estados e reprova uma página violadora item por item')] },
            { id: 'jornada', nome: 'Onboarding e docs', descricao: 'Jornada e quatro tipos Diátaxis', tom: 'response', ms: 2, linhas: [
              L('out', 'test_onboarding_deterministico_e_completo PASSED'),
              L('out', 'test_diataxis_quatro_tipos_presentes PASSED'),
              L('in', '6 passed')] }
          ],
          tutorAntes: 'Responda a previsão e aperte Enter.',
          callout: 'Você viu os seis oráculos da experiência web passarem.' },
        { tipo: 'transcript', id: 'b15-transcript', titulo: 'Ache o selo que não existe', obrigatorio: false, terminalTitulo: 'sessão de PR (exemplo)',
          enunciado: 'O agente fecha o item de acessibilidade. Uma afirmação não é sustentada pelo que a sessão mostra. Clique na linha e aperte Conferir. Valores de exemplo.',
          linhas: [
            { quem: 'voce', texto: 'A página está em conformidade com WCAG 2.2 AA?' },
            { quem: 'ferramenta', texto: '$ uv run pytest tests/test_webexp.py -k a11y\n1 passed' },
            { quem: 'agente', texto: 'O a11y_audit passou nos quatro estados: lang, um h1, alt, label e aria-live.' },
            { quem: 'agente', texto: 'Logo a página está em conformidade com WCAG 2.2 AA, inclusive contraste e leitor de tela.' }
          ],
          erradas: [3],
          explicacao: { 3: 'o oráculo é estrutural. Contraste real, qualidade do texto alternativo e uso com teclado ou leitor de tela pedem julgamento humano. O que se pode afirmar é que os critérios estruturais testados passaram.' },
          tutorDepois: 'A frase 2 é sustentada; a 3 vai além do que o oráculo mede.' },
        { tipo: 'takeaway', html: 'Diga o que o oráculo <mark>mede</mark>, não o que a norma <mark>inteira</mark> pede.' }
      ] },

      { rotulo: 'Praticar e conferir', blocos: [
        { tipo: 'python', id: 'b15-python', titulo: 'Escreva o oráculo de acessibilidade', obrigatorio: false,
          enunciado: 'Implemente <code>a11y_audit(html)</code>: devolva a lista ordenada de violações entre <code>lang</code>, <code>h1</code> (diferente de exatamente um), <code>alt</code>, <code>label</code> (input com <code>id</code> sem <code>&lt;label for&gt;</code>) e <code>aria-live</code> (elemento <code>data-state="progress"</code> sem <code>aria-live</code>). Versão reduzida e por regex do oráculo do bloco.',
          codigo: codigoA11y, testes: testesA11y,
          dica: 'Use <code>re.findall</code> em <code>&lt;img&gt;</code> e <code>&lt;input&gt;</code>; para o label, procure o <code>id</code> do input e depois <code>&lt;label ... for="id"&gt;</code>.',
          solucao: solucaoA11y,
          tutorDepois: 'Note a diferença entre checar a <em>presença</em> do atributo e julgar a <em>qualidade</em> do texto alternativo: só a primeira cabe num oráculo.',
          callout: 'Seu oráculo aprova a página boa e reprova a violadora item por item.' },
        { tipo: 'escolha', id: 'b15-esc1', titulo: 'Tipo Diátaxis', pergunta: 'Um arquivo de "tutorial" lista todas as opções de configuração em tabela. Qual a leitura?',
          opcoes: [
            opc('a', 'É reference escrito como tutorial: o tipo declarado não corresponde ao conteúdo', true, 'docs sem tipo Diátaxis viram depósito: tutorial, how-to, reference e explanation são coisas diferentes.'),
            opc('b', 'Está certo, tutorial tem tabelas', false, 'um tutorial conduz o aprendiz por uma jornada; a tabela exaustiva é referência.'),
            opc('c', 'Deve virar explanation', false, 'explanation dá contexto e porquês, não lista opções.')] },
        { tipo: 'escolha', id: 'b15-esc2', titulo: 'Estado vazio', pergunta: 'A página mostra uma área em branco enquanto não há análises. O que o bloco pede?',
          opcoes: [
            opc('a', 'Projetar o estado empty com markup explícito', true, 'o usuário não pode ficar sem saber se quebrou ou se está vazio.'),
            opc('b', 'Deixar em branco', false, 'em branco é ambíguo.'),
            opc('c', 'Mostrar o estado de erro', false, 'vazio não é erro.')] },
        { tipo: 'takeaway', html: 'Estado <mark>vazio</mark> é projetado; documento tem <mark>um tipo</mark>.' }
      ] }
    ]
  });
})();
