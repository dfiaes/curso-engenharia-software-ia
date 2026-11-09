/* LT04 · Bloco 1: Versionamento e changelog. Fonte: LT04.html#b01. Saídas do terminal vêm de execução local de lab/versao_release.py (exemplo, não evidência do lab). */
(function () {
  var L = function (kind, text) { return { kind: kind, text: text }; };
  function opc(id, texto, correta, porque) { return { id: id, texto: texto, correta: correta, porque: porque }; }

  var codigoVersao = [
    'import re',
    '',
    'SEMVER = re.compile(r"^(0|[1-9]\\d*)\\.(0|[1-9]\\d*)\\.(0|[1-9]\\d*)$")',
    'SHA = re.compile(r"sha256:[0-9a-f]{64}")',
    '',
    '',
    'def parse(versao):',
    '    # SemVer estrito: devolva (major, minor, patch) como INTEIROS;',
    '    # versão que não casa com SEMVER levanta ValueError',
    '    return tuple(versao.split("."))',
    '',
    '',
    'def comparar(a, b):',
    '    # -1 se a < b, 0 se iguais, +1 se a > b (compare as tuplas de parse)',
    '    return 0',
    '',
    '',
    'def changelog_valido(entradas):',
    '    problemas = []',
    '    vistas = []',
    '    for i, e in enumerate(entradas):',
    '        # acuse campo ausente: f"entrada {i}: campo {campo!r} ausente"',
    '        # acuse versão inválida: f"entrada {i}: versao invalida"',
    '        pass',
    '    # acuse quebra de ordem decrescente: f"entrada {i}: fora de ordem decrescente"',
    '    return problemas',
    '',
    '',
    'def vincular_digest(versao, digest):',
    '    # versão válida e digest sha256:<64 hex>; senão ValueError',
    '    return {"versao": versao, "digest": digest}',
    '',
    '',
    'print(parse("1.10.0"), comparar("1.10.0", "1.9.9"))'
  ].join("\n");
  var testesVersao = [
    'def test_parse_aceita_estrito():',
    '    assert parse("1.2.3") == (1, 2, 3)',
    '    assert parse(" 0.0.1 ") == (0, 0, 1)',
    '',
    '',
    'def test_parse_recusa_invalidas():',
    '    for ruim in ("latest", "1.02.3", "1.2", "v1.2.3"):',
    '        try:',
    '            parse(ruim)',
    '        except ValueError:',
    '            continue',
    '        assert False, ruim',
    '',
    '',
    'def test_ordem_numerica_nao_lexicografica():',
    '    assert comparar("1.10.0", "1.9.9") == 1',
    '    assert comparar("1.2.0", "1.10.0") == -1',
    '    assert comparar("2.0.0", "2.0.0") == 0',
    '',
    '',
    'def test_changelog_sao_nao_acusa_nada():',
    '    ok = [',
    '        {"versao": "1.1.0", "data": "2026-03-02", "resumo": "novo filtro"},',
    '        {"versao": "1.0.0", "data": "2026-01-10", "resumo": "primeira"},',
    '    ]',
    '    assert changelog_valido(ok) == []',
    '',
    '',
    'def test_changelog_acusa_por_posicao_sem_mascara():',
    '    ruim = [',
    '        {"versao": "1.0.0", "data": "2026-01-10", "resumo": "primeira"},',
    '        {"versao": "1.1.0", "data": "", "resumo": "novo filtro"},',
    '    ]',
    '    p = changelog_valido(ruim)',
    '    assert "entrada 1: campo \'data\' ausente" in p',
    '    assert "entrada 1: fora de ordem decrescente" in p',
    '',
    '',
    'def test_changelog_versao_invalida():',
    '    p = changelog_valido([{"versao": "latest", "data": "2026-01-10", "resumo": "x"}])',
    '    assert "entrada 0: versao invalida" in p',
    '',
    '',
    'def test_digest_vincula_e_recusa_tag():',
    '    d = "sha256:" + "a" * 64',
    '    assert vincular_digest("2.1.0", d) == {"versao": "2.1.0", "digest": d}',
    '    for versao, dig in (("latest", d), ("2.1.0", "latest"), ("2.1.0", "sha256:abc")):',
    '        try:',
    '            vincular_digest(versao, dig)',
    '        except ValueError:',
    '            continue',
    '        assert False, (versao, dig)'
  ].join("\n");
  var solucaoVersao = [
    'import re',
    '',
    'SEMVER = re.compile(r"^(0|[1-9]\\d*)\\.(0|[1-9]\\d*)\\.(0|[1-9]\\d*)$")',
    'SHA = re.compile(r"sha256:[0-9a-f]{64}")',
    '',
    '',
    'def parse(versao):',
    '    m = SEMVER.match(versao.strip())',
    '    if m is None:',
    '        raise ValueError(f"versao invalida: {versao!r}")',
    '    return (int(m.group(1)), int(m.group(2)), int(m.group(3)))',
    '',
    '',
    'def comparar(a, b):',
    '    pa, pb = parse(a), parse(b)',
    '    return (pa > pb) - (pa < pb)',
    '',
    '',
    'def changelog_valido(entradas):',
    '    problemas = []',
    '    vistas = []',
    '    for i, e in enumerate(entradas):',
    '        for campo in ("versao", "data", "resumo"):',
    '            if not e.get(campo, "").strip():',
    '                problemas.append(f"entrada {i}: campo {campo!r} ausente")',
    '        try:',
    '            vistas.append(parse(e.get("versao", "")))',
    '        except ValueError:',
    '            problemas.append(f"entrada {i}: versao invalida")',
    '    for i in range(1, len(vistas)):',
    '        if vistas[i - 1] <= vistas[i]:',
    '            problemas.append(f"entrada {i}: fora de ordem decrescente")',
    '    return problemas',
    '',
    '',
    'def vincular_digest(versao, digest):',
    '    parse(versao)',
    '    if not SHA.fullmatch(digest):',
    '        raise ValueError(f"digest invalido: {digest!r}")',
    '    return {"versao": versao.strip(), "digest": digest}'
  ].join("\n");

  TrilhaAula.registrar({
    id: 'lt04-b1',
    titulo: 'Versionamento e changelog',
    minutos: 30,
    resumo: '"Subimos a latest" não identifica nada. Versão é um número ordenado, o changelog é a história legível, e quem identifica o artefato é o digest, não a tag.',
    objetivo: 'Ordenar releases por SemVer estrito, acusar changelog com campo ausente ou fora de ordem por posição e vincular cada versão a um digest imutável, recusando tag como identidade.',
    revisao: [
      { id: 'lt04b1-ordem', pergunta: 'Qual é a ordem decrescente correta de release para 1.9.9, 1.2.0 e 1.10.0?',
        opcoes: [
          opc('a', '1.10.0, 1.9.9, 1.2.0', true, 'SemVer compara MAJOR, MINOR e PATCH como números. Como string, "1.9.9" vem antes de "1.10.0" porque "9" é maior que "1".'),
          opc('b', '1.9.9, 1.2.0, 1.10.0', false, 'é a ordem lexicográfica, justamente a que inverte o release mais novo.'),
          opc('c', '1.10.0, 1.2.0, 1.9.9', false, 'o campo MINOR vem primeiro entre os três, mas 9 é maior que 2: 1.9.9 precede 1.2.0.')] },
      { id: 'lt04b1-tag', pergunta: 'Por que a tag <code>app:v2.0</code> não serve de alvo de rollback?',
        opcoes: [
          opc('a', 'Tag é apelido mutável: pode ser reempurrada com outro conteúdo; só o digest identifica o conteúdo', true, 'o rollback por tag pode restaurar um conteúdo que você nunca testou. Promova e reverta pelo par versão mais <code>sha256:…</code>.'),
          opc('b', 'O prefixo v torna a tag inválida', false, 'o prefixo é um problema de formato de versão, não de identidade.'),
          opc('c', 'Registries não aceitam tags com número de versão', false, 'aceitam, e geralmente permitem sobrescrevê-las.')] },
      { id: 'lt04b1-changelog', pergunta: 'O que cada entrada de changelog precisa ter, e em que ordem ficam as entradas?',
        opcoes: [
          opc('a', 'Versão válida, data e resumo; da mais nova para a mais antiga', true, 'entrada sem data é história sem tempo; sem resumo é número sem decisão; a ordem decrescente serve a quem lê de cima para baixo.'),
          opc('b', 'Só a versão, em ordem de publicação', false, 'versão sozinha não carrega tempo nem decisão.'),
          opc('c', 'Versão e autor, em ordem alfabética', false, 'o contrato exige versão, data e resumo, e a ordem é decrescente por versão.')] },
      { id: 'lt04b1-invalida', pergunta: 'Quais destas strings o <code>parse</code> estrito recusa?',
        opcoes: [
          opc('a', '<code>latest</code>, <code>1.02.3</code>, <code>1.2</code> e <code>v1.2.3</code>', true, 'não é X.Y.Z, tem zero à esquerda, falta o PATCH e tem prefixo v, que não faz parte do número. Recusar não é adivinhar.'),
          opc('b', 'Só <code>latest</code>', false, 'zero à esquerda, campo faltando e prefixo v também são recusados.'),
          opc('c', 'Nenhuma: o parse corrige o que entender', false, 'parse estrito recusa, não adivinha: número ambíguo vira ValueError.')] },
      { id: 'lt04b1-digest', pergunta: 'O que o vínculo de versão com digest aceita?',
        opcoes: [
          opc('a', 'Versão SemVer válida mais <code>sha256:</code> seguido de 64 hexadecimais minúsculos', true, 'recusa <code>latest</code> nos dois lados e digest malformado; o contrato prova o vínculo, não a criptografia.'),
          opc('b', 'Qualquer tag mais qualquer digest', false, 'tag como identidade é o defeito raiz do bloco.'),
          opc('c', 'Versão válida mais uma tag estável', false, 'tag nunca é identidade, nem estável.')] }
    ],
    abas: [
      { rotulo: 'Entender', blocos: [
        { tipo: 'texto', html:
          '<p>"Subimos a latest." Na terça funcionou. Na sexta ninguém sabe qual conteúdo era esse, qual release veio antes, nem para onde voltar. O problema não é a ferramenta: é que o rótulo que você usou não identifica coisa nenhuma.</p>' +
          '<p>Este bloco troca esse rótulo por <strong>identidade ordenada</strong> e <strong>história legível</strong>. Três resultados saem daqui:</p>' +
          '<ul><li>aplicar <strong>SemVer</strong> estrito como ordem total de release: número que decide precedência, não enfeite;</li>' +
          '<li>exigir <strong>changelog</strong> com versão, data e resumo em ordem decrescente, legível por humano e por máquina;</li>' +
          '<li>vincular versão a <strong>digest</strong> imutável: tag mutável nunca é identidade do artefato.</li></ul>' +
          '<p>Pré-requisitos: dicionários e expressões regulares (M02). Todo exemplo é Python 3.14 só com a biblioteca padrão, e cada termo novo é definido onde aparece. Os números das saídas são exemplo variável; a medição real pertence ao <code>lab/</code>.</p>' },
        { tipo: 'texto', html:
          '<h3>SemVer: o número que decide precedência</h3>' +
          '<p><strong>SemVer</strong> escreve a versão como <code>MAJOR.MINOR.PATCH</code>: MAJOR quebra compatibilidade, MINOR adiciona sem quebrar, PATCH corrige. A comparação é <strong>numérica por campo</strong>, não lexicográfica: <code>1.10.0</code> é posterior a <code>1.9.9</code>, e a ordenação de strings diria o contrário.</p>' +
          '<p>O oráculo exige <strong>ordem total</strong>: para qualquer par de versões, menor, igual ou maior, sem empate ambíguo. Para isso o formato é estrito:</p>' },
        { tipo: 'texto', largo: true, html:
          '<table><thead><tr><th>Entrada</th><th><code>parse</code></th><th>Motivo</th></tr></thead><tbody>' +
          '<tr><td><code>1.2.3</code></td><td>aceita, <code>(1, 2, 3)</code></td><td>X.Y.Z, três inteiros</td></tr>' +
          '<tr><td><code>1.02.3</code></td><td>recusa</td><td>zero à esquerda: número ambíguo</td></tr>' +
          '<tr><td><code>v1.2.3</code></td><td>recusa</td><td>o prefixo <code>v</code> não faz parte do número</td></tr>' +
          '<tr><td><code>1.2</code></td><td>recusa</td><td>falta o PATCH</td></tr>' +
          '<tr><td><code>latest</code></td><td>recusa</td><td>não é versão, é apelido</td></tr>' +
          '</tbody></table>' },
        { tipo: 'texto', html:
          '<h3>Changelog: a história que humano e máquina leem</h3>' +
          '<p><strong>Changelog</strong> é o registro intencional de mudança por versão. Cada entrada carrega <strong>versão válida, data e resumo</strong> do que mudou para quem consome, e as entradas ficam em <strong>ordem decrescente</strong>: a mais nova primeiro, porque o leitor de release lê de cima para baixo.</p>' +
          '<p>Entrada sem data é história sem tempo; sem resumo é número sem decisão. O oráculo lista cada problema com a <strong>posição</strong> da entrada, e campo ausente e quebra de ordem são acusados separadamente, sem que um mascare o outro.</p>' },
        { tipo: 'callout', tom: 'info', titulo: 'Por que acusar por posição', html:
          '<p>"Changelog inválido" não conserta nada. <code>entrada 1: campo \'data\' ausente</code> e <code>entrada 1: fora de ordem decrescente</code> dizem onde olhar e que são dois defeitos distintos.</p>' },
        { tipo: 'takeaway', html: 'SemVer é <mark>ordem total numérica</mark>, e o changelog é <mark>versão, data e resumo</mark> em ordem decrescente, acusado <mark>por posição</mark>.' }
      ] },

      { rotulo: 'Ver funcionando', blocos: [
        { tipo: 'texto', html:
          '<h3>Digest: a identidade que a tag não é</h3>' +
          '<p><strong>Digest</strong> (<code>sha256:…</code>) identifica o <em>conteúdo</em> do artefato. <strong>Tag</strong> é um apelido mutável que pode apontar para outro conteúdo amanhã. Promover por tag é promover por boato: o oráculo só aceita o par <strong>versão válida mais digest bem formado</strong> e recusa <code>latest</code> nos dois lados.</p>' +
          '<p>Veja o que acontece com uma tag em três momentos.</p>' },
        { tipo: 'abas', rotulo: 'A tag no tempo', itens: [
          { rotulo: 'Dia 1', blocos: [
            { tipo: 'codigo', linguagem: 'text', texto: [
              'app:v2.1  (tag, apelido)  ->  sha256:aaaa...  (conteúdo A)',
              'testado, aprovado'].join('\n') },
            { tipo: 'texto', html: '<p>No dia 1, tag e conteúdo coincidem e tudo parece identidade.</p>' }] },
          { rotulo: 'Dia 3', blocos: [
            { tipo: 'codigo', linguagem: 'text', texto: [
              'app:v2.1  (tag, apelido)  ->  sha256:bbbb...  (conteúdo B, empurrado depois, sem ninguém notar)',
              'sha256:aaaa...  (conteúdo A)  ->  já não é apontado pela tag'].join('\n') },
            { tipo: 'texto', html: '<p>A tag é mutável: o nome é o mesmo e o conteúdo mudou.</p>' }] },
          { rotulo: 'Rollback', blocos: [
            { tipo: 'codigo', linguagem: 'text', texto: [
              'rollback por tag     "volta para v2.1"       -> sha256:bbbb...  (B: nunca testado aqui)  destino errado',
              'rollback por digest  par versão + sha256     -> sha256:aaaa...  (A: o que rodava)        destino provado'].join('\n') },
            { tipo: 'texto', html: '<p>Identidade é o digest; a tag é só o rótulo. Assinatura e registry reais pertencem à trilha externa (BLOCKED com registro onde ausentes): aqui o contrato prova o <em>vínculo</em>, não a criptografia.</p>' }] }
        ] },
        { tipo: 'texto', html:
          '<h3>Rode as quatro funções do contrato</h3>' +
          '<p>O contrato é <code>lab/versao_release.py</code>: um arquivo, só <code>re</code>, determinístico. A saída abaixo veio de uma execução local; digests aparecem abreviados e os valores são exemplo variável, não evidência do lab.</p>' },
        { tipo: 'rode', id: 'b1-rode', titulo: 'Quatro chamadas, quatro vereditos',
          enunciado: 'Aperte Enter e clique em cada etapa para ver a chamada e o que o oráculo devolveu.',
          prefixo: '$', entrada: 'python3 -c "from versao_release import *"   # dentro de lab/', unidade: 'chamadas', terminalTitulo: 'lab/versao_release.py',
          prever: { pergunta: 'O que <code>comparar("1.10.0", "1.9.9")</code> devolve?', opcoes: [
            { id: 'a', texto: '-1: "1.10.0" vem antes de "1.9.9" na ordem de texto.', correta: false, porque: 'é a ordem lexicográfica, que o contrato não usa.' },
            { id: 'b', texto: '0: são o mesmo release com formatos diferentes.', correta: false, porque: 'são tuplas diferentes, (1, 10, 0) e (1, 9, 9).' },
            { id: 'c', texto: '1: a comparação é numérica por campo e 1.10.0 é o mais novo.', correta: true, porque: '(1, 10, 0) > (1, 9, 9) porque 10 > 9 no campo MINOR.' }
          ] },
          etapas: [
            { id: 'parse', nome: 'parse estrito', descricao: 'Aceita X.Y.Z, recusa o resto', tom: 'dns', ms: 4, linhas: [
              L('cmd', 'parse("1.2.3")'), L('out', '(1, 2, 3)'),
              L('cmd', 'parse("latest")'), L('out', "ValueError: versao invalida: 'latest'"),
              L('cmd', 'parse("1.02.3")'), L('out', "ValueError: versao invalida: '1.02.3'"),
              L('cmd', 'parse("1.2")'), L('out', "ValueError: versao invalida: '1.2'"),
              L('hint', 'recusar não é adivinhar: número ambíguo vira erro')] },
            { id: 'comparar', nome: 'comparar', descricao: 'Ordem total numérica', tom: 'tcp', ms: 1, linhas: [
              L('cmd', 'comparar("1.10.0", "1.9.9")'), L('out', '1'),
              L('hint', 'tupla numérica (1, 10, 0) > (1, 9, 9); como string, o resultado seria o oposto')] },
            { id: 'changelog', nome: 'changelog_valido', descricao: 'Acusa por posição, sem máscara', tom: 'tls', ms: 1, linhas: [
              L('cmd', 'changelog_valido([{"versao": "1.0.0", "data": "2026-01-10", "resumo": "a"},'),
              L('cmd', '                  {"versao": "1.1.0", "data": "", "resumo": "b"}])'),
              L('out', "[\"entrada 1: campo 'data' ausente\", 'entrada 1: fora de ordem decrescente']"),
              L('hint', 'dois defeitos na mesma entrada, acusados separadamente')] },
            { id: 'digest', nome: 'vincular_digest', descricao: 'Versão válida mais sha256 bem formado', tom: 'request', ms: 2, linhas: [
              L('cmd', 'vincular_digest("2.1.0", "sha256:bbbb...")   # 64 hex, abreviado aqui'),
              L('out', "{'versao': '2.1.0', 'digest': 'sha256:bbbb...'}"),
              L('cmd', 'vincular_digest("latest", "sha256:bbbb...")'),
              L('out', "ValueError: versao invalida: 'latest'"),
              L('hint', 'digest malformado também levanta ValueError: digest invalido')] }
          ],
          tutorAntes: 'Antes do Enter, escolha o que <code>comparar("1.10.0", "1.9.9")</code> devolve.',
          tutorDepois: 'Quatro chamadas, quatro recusas ou vereditos com motivo: o contrato nunca devolve "talvez".',
          callout: 'Você viu o contrato inteiro de versão em quatro chamadas.' },
        { tipo: 'callout', tom: 'neutral', titulo: 'No laboratório', html:
          '<p>A folha B01-L implementa este contrato verbatim em <code>lab/versao_release.py</code> e o confere com 1 arquivo de teste (SemVer, changelog, digest). Na cópia de trabalho do Laboratório guiado LT04-T1, rode o comando logo abaixo.</p>' +
          '<p>Deploy e registry reais pertencem à trilha externa: BLOCKED com registro, nunca simulados.</p>' },
        { tipo: 'codigo', linguagem: 'sh', texto: 'uv run pytest -q tests/test_at001_versao.py' },
        { tipo: 'takeaway', html: 'A tag é <mark>apelido mutável</mark>; quem identifica o artefato é o <mark>digest</mark>, e o contrato recusa o que não é <mark>versão estrita</mark>.' }
      ] },

      { rotulo: 'Praticar', blocos: [
        { tipo: 'ordene', id: 'b1-ordene', titulo: 'Ordene os releases do mais novo para o mais antigo',
          enunciado: 'Use os botões ↑ e ↓ para colocar as versões em ordem decrescente de release e aperte Conferir.',
          itens: [
            { id: 'v1_2_0', texto: '1.2.0' }, { id: 'v1_9_10', texto: '1.9.10' }, { id: 'v1_0_0', texto: '1.0.0' },
            { id: 'v1_10_0', texto: '1.10.0' }, { id: 'v1_9_9', texto: '1.9.9' }
          ],
          solucao: ['v1_10_0', 'v1_9_10', 'v1_9_9', 'v1_2_0', 'v1_0_0'],
          dica: 'Compare o MINOR como número: 10 > 9 > 2 > 0. Dentro do 1.9, o PATCH 10 vence o 9.',
          tutorDepois: 'Como string, "1.9.9" ficaria acima de "1.9.10" e de "1.10.0". Por isso o parse devolve tupla de inteiros.',
          callout: 'Ordem total numérica: nenhum empate ambíguo.' },
        { tipo: 'transcript', id: 'b1-transcript', titulo: 'Ache a afirmação que a sessão não sustenta', terminalTitulo: 'sessão de release',
          enunciado: 'O agente promove a v2.1 e prepara o rollback. Uma afirmação dele é contradita pelo que a ferramenta mostrou. Clique na linha e aperte Conferir.',
          linhas: [
            { quem: 'voce', texto: 'Promova a v2.1 e deixe o rollback pronto para a v2.0.' },
            { quem: 'agente', texto: 'Promovi registry/app:v2.1 e planejei o rollback reapontando para registry/app:v2.0.' },
            { quem: 'ferramenta', texto: 'histórico de release (exemplo): 2.0.0 -> sha256:aaaa...\nconsulta à tag app:v2.0: aponta para sha256:bbbb... (reempurrada hoje, 09:12)' },
            { quem: 'agente', texto: 'Rollback seguro: uma tag com número de versão é imutável.' },
            { quem: 'agente', texto: 'Registrei o par 2.1.0 mais o digest do que promovi, e o rollback mira o digest sha256:aaaa..., o do histórico.' }
          ],
          erradas: [3],
          explicacao: { 3: 'a consulta acabou de mostrar que <code>app:v2.0</code> foi reempurrada e hoje aponta para outro conteúdo. Registries geralmente permitem sobrescrever uma tag; só o digest identifica o conteúdo. A linha 5 é o conserto: promover e reverter pelo par versão mais digest.' },
          tutorDepois: 'Número de versão na tag não a torna imutável. O que prova o destino do rollback é o digest do histórico.' },
        { tipo: 'python', id: 'b1-python', titulo: 'Implemente o contrato de versão', obrigatorio: false,
          enunciado: 'Complete <code>parse</code>, <code>comparar</code>, <code>changelog_valido</code> e <code>vincular_digest</code>. O <code>parse</code> inicial devolve strings: é a lacuna que inverte 1.10.0 e 1.9.9. As mensagens de erro precisam ser exatamente as dos comentários, porque os testes as conferem. Python no navegador, só biblioteca padrão.',
          codigo: codigoVersao, testes: testesVersao,
          dica: 'Use <code>SEMVER.match(versao.strip())</code> e devolva <code>tuple(int(g) for g in m.groups())</code>. Em <code>comparar</code>, <code>(pa &gt; pb) - (pa &lt; pb)</code> dá -1, 0 ou 1. No changelog, um laço para campos e <code>try</code> em torno de <code>parse</code>; a ordem só compara entradas válidas vizinhas.',
          solucao: solucaoVersao,
          tutorDepois: 'Repare que o changelog acusa campo ausente e quebra de ordem em passos separados: um defeito não esconde o outro.',
          callout: 'O contrato de versão passou nos testes: feliz, borda (zero à esquerda, prefixo v) e falha (digest malformado).' },
        { tipo: 'takeaway', html: 'Provar <mark>ordem</mark> exige tupla numérica; provar <mark>identidade</mark> exige <mark>digest</mark>.' }
      ] },

      { rotulo: 'Conferir', blocos: [
        { tipo: 'texto', largo: true, html:
          '<h3>Diagnóstico B01: erros reais, na ordem em que costumam aparecer</h3>' +
          '<table><thead><tr><th>Sintoma</th><th>Causa provável</th><th>Conserto</th></tr></thead><tbody>' +
          '<tr><td>Ordenação põe 1.9.9 depois de 1.10.0</td><td>Comparação lexicográfica de strings em vez de tupla numérica</td><td>Comparar <code>parse</code> campo a campo; testar 1.10.0 contra 1.9.9</td></tr>' +
          '<tr><td>Release sem data nem resumo passa no parse</td><td>Changelog validado só pela versão: história sem tempo nem decisão</td><td>Exigir versão, data e resumo por entrada; acusar por posição</td></tr>' +
          '<tr><td>Rollback aponta para conteúdo diferente do lançado</td><td>Identidade por tag mutável: o apelido mudou de dono</td><td>Vincular versão a digest; promover e reverter por digest</td></tr>' +
          '<tr><td>Versão com zero à esquerda entra no release</td><td>Regex permissiva aceita <code>1.02.3</code>: número ambíguo</td><td>SemVer estrito <code>(0|[1-9]\\d*)</code>; recusar com <code>ValueError</code></td></tr>' +
          '</tbody></table>' },
        { tipo: 'escolha', id: 'b1-escolha-ordem', titulo: 'Confira: a lista do script',
          pergunta: 'Um script ordena em ordem decrescente as versões 1.9.9, 1.2.0 e 1.10.0 como strings. Qual lista é a ordem decrescente correta de release, e por que a de strings engana?',
          opcoes: [
            { id: 'a', texto: '1.9.9, 1.2.0, 1.10.0: é a ordem que o script devolve, logo é a ordem do release.', correta: false, porque: 'confia no script em vez do contrato.' },
            { id: 'b', texto: '1.10.0, 1.2.0, 1.9.9: o campo MINOR manda, depois o PATCH.', correta: false, porque: 'o MINOR é numérico, e 9 é maior que 2: 1.9.9 precede 1.2.0.' },
            { id: 'c', texto: '1.10.0, 1.9.9, 1.2.0: a comparação é numérica por campo, e a de strings põe o 1.10.0 por último porque "1" vem antes de "9".', correta: true, porque: 'a comparação de strings é caractere a caractere e inverte 1.10.0 e 1.9.9.' },
            { id: 'd', texto: 'Tanto faz: SemVer só exige que a lista tenha versões válidas.', correta: false, porque: 'a ordem total é justamente o que decide qual release é o mais novo.' }
          ], tutorDepois: 'Ordem total numérica: para qualquer par, menor, igual ou maior.' },
        { tipo: 'escolha', id: 'b1-escolha-tag', titulo: 'Confira: o rollback da v2.0',
          pergunta: 'O time promove <code>registry/app:v2.1</code> e, na crise, planeja reverter para <code>registry/app:v2.0</code>. Qual é o defeito de identidade, e qual é o conserto?',
          opcoes: [
            { id: 'a', texto: 'Nenhum: tags com número de versão são imutáveis por definição do registry.', correta: false, porque: 'registries geralmente permitem sobrescrever uma tag.' },
            { id: 'b', texto: 'Tag é apelido mutável: alguém pode reempurrar v2.0 com outro conteúdo; promova e reverta pelo par versão mais <code>sha256:…</code>.', correta: true, porque: 'reverter por tag pode restaurar um conteúdo que você nunca testou; o digest identifica o conteúdo.' },
            { id: 'c', texto: 'O defeito é o prefixo v: sem ele a tag seria imutável.', correta: false, porque: 'o prefixo é questão de formato de versão, não de identidade.' },
            { id: 'd', texto: 'O conserto é usar <code>latest</code>, que sempre aponta para o último release bom.', correta: false, porque: '<code>latest</code> é a forma mais extrema do mesmo erro.' }
          ], tutorDepois: 'Tudo que deriva da tag (rollback, auditoria, reprodução) herda a mentira.' },
        { tipo: 'callout', tom: 'neutral', titulo: 'Fontes e versões', html:
          '<ul><li><strong>Semantic Versioning 2.0.0</strong> (normativa): precedência e formato X.Y.Z. <code>semver.org</code>, versão 2.0.0, risco baixo, revalidar em até 90 dias.</li>' +
          '<li><strong>Keep a Changelog 1.1.0</strong> (orientação de praticante, rotulada): formato de changelog por versão. <code>keepachangelog.com/en/1.1.0/</code>, risco médio.</li>' +
          '<li><strong>SLSA Specification 1.2</strong> (normativa, SRC-LT04-10): digest e provenance como identidade, risco médio.</li>' +
          '<li>O contrato de <code>lab/versao_release.py</code> e os números citados são construção desta trilha; os valores medidos nascem na folha B01-L. A fonte do módulo não registra data de verificação: confirme as versões antes de citar.</li></ul>' },
        { tipo: 'takeaway', html: 'Promova e reverta pelo <mark>par versão + digest</mark>, nunca pela <mark>tag</mark>.' }
      ] }
    ]
  });
})();
