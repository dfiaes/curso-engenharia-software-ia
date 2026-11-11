/* M13 · Bloco 20: lançamento, portfólio e defesa técnica. Fonte: M13.html#h-b20. */
(function () {
  var L = function (kind, text) { return { kind: kind, text: text }; };
  function opc(id, texto, correta, porque) { return { id: id, texto: texto, correta: correta, porque: porque }; }

  var codigo = String.raw`import re

SENSIVEIS = (re.compile(r"sk-[A-Za-z0-9]{12,}"), re.compile(r"AKIA[0-9A-Z]{16}"))

def build_dossier(metricas, existentes):
    # LACUNA: cada metrica {"nome","valor","evidencia"}; se alguma evidencia nao esta em
    # 'existentes', levante ValueError("evidencia ausente: [...]"). Senao devolva o markdown.
    return "\n".join("- " + m["nome"] + ": " + m["valor"] for m in metricas)

def scan_public_text(text):
    # LACUNA: um problema por padrao sensivel encontrado;
    # e se houver "BLOCKED" sem a palavra "honesto" (qualquer caixa), um problema de rotulo.
    return []
`;
  var solucao = String.raw`import re

SENSIVEIS = (re.compile(r"sk-[A-Za-z0-9]{12,}"), re.compile(r"AKIA[0-9A-Z]{16}"))

def build_dossier(metricas, existentes):
    faltantes = [m["evidencia"] for m in metricas if m["evidencia"] not in existentes]
    if faltantes:
        raise ValueError("evidencia ausente: " + str(faltantes))
    return "\n".join("- " + m["nome"] + ": " + m["valor"] + " (evidencia " + m["evidencia"] + ")"
                     for m in metricas)

def scan_public_text(text):
    problemas = []
    for p in SENSIVEIS:
        if p.search(text):
            problemas.append("padrao sensivel encontrado: " + p.pattern)
    if "BLOCKED" in text and "honesto" not in text.lower():
        problemas.append("BLOCKED precisa ser rotulado honestamente")
    return problemas
`;
  var testes = String.raw`M = [{"nome": "p95", "valor": "12ms", "evidencia": "evidence/m13/B16"},
     {"nome": "gate", "valor": "125/125", "evidencia": "evidence/m13/B20"}]
EX = {"evidence/m13/B16", "evidence/m13/B20"}

def test_dossier_completo_aponta_evidencia():
    md = build_dossier(M, EX)
    assert "evidence/m13/B16" in md and "evidence/m13/B20" in md

def test_dossier_falha_se_evidencia_nao_existe():
    try:
        build_dossier(M, {"evidence/m13/B16"})
    except ValueError as e:
        assert "evidence/m13/B20" in str(e)
        return
    assert False, "claim sem fonte nao compila"

def test_scan_detecta_segredos():
    assert len(scan_public_text("chave sk-ABCDEFGHIJKL1234")) == 1
    assert len(scan_public_text("AKIAABCDEFGHIJKLMNOP")) == 1

def test_scan_exige_blocked_rotulado():
    assert scan_public_text("Piloto: BLOCKED") != []
    assert scan_public_text("Ambientalmente BLOCKED (honesto)") == []

def test_controle_negativo_texto_limpo():
    assert scan_public_text("Cartografo v1, 3 metricas rastreaveis") == []
`;

  TrilhaAula.registrar({
    id: 'm13-b20',
    titulo: 'Lançamento, portfólio e defesa técnica',
    minutos: 35,
    resumo: 'O dossier público é gerado por código que falha se uma métrica não aponta para evidência no disco. A versão vem do git, um scan barra segredos e a defesa declara o que é medido, modelo e BLOCKED.',
    objetivo: 'Explicar por que "toda métrica aponta para evidência" é regra de build, de onde vem a versão, o que o scan de sigilo cobre e como a defesa declara limites antes de perguntarem.',
    revisao: [
      { id: 'm13b20-claim', pergunta: 'O build do dossier encontra uma métrica sem arquivo de evidência no disco. O que acontece?',
        opcoes: [
          opc('a', 'O build falha: claim sem fonte não compila', true, '<code>build_dossier()</code> levanta <code>ValueError("evidência ausente: …")</code>.'),
          opc('b', 'Publica com um aviso', false, 'aviso é revisão humana, e a regra é de build.'),
          opc('c', 'Publica e marca como pendente', false, 'pendente publicado é claim sem fonte.')] },
      { id: 'm13b20-versao', pergunta: 'De onde vem a versão do dossier?',
        opcoes: [
          opc('a', 'De <code>git describe</code> real, com fallback para <code>__version__</code>', true, 'versão hardcoded diverge do repositório.'),
          opc('b', 'De uma constante no README', false, 'diverge do repositório.'),
          opc('c', 'Digitada na hora do release', false, 'nunca hardcoded no dossier.')] },
      { id: 'm13b20-scan', pergunta: 'O que <code>scan_public_text()</code> faz?',
        opcoes: [
          opc('a', 'Varre o texto final por padrões de segredo (API keys, PEMs) antes da publicação e exige que BLOCKED seja rotulado honestamente', true, 'é um oráculo executável sobre o bruto público.'),
          opc('b', 'Revisa a qualidade da escrita', false, 'não avalia estilo.'),
          opc('c', 'Remove os segredos automaticamente', false, 'ele aponta o problema, não corrige.')] },
      { id: 'm13b20-defesa', pergunta: 'O que uma boa resposta de defesa declara?',
        opcoes: [
          opc('a', 'O que foi medido, o que é modelo declarado e o que é BLOCKED, antes de perguntarem', true, 'defesa que só descreve componentes não defende.'),
          opc('b', 'Só os números favoráveis', false, 'limitações são seção obrigatória.'),
          opc('c', 'A lista de componentes', false, 'defender é explicar trade-offs e incidentes.')] }
    ],
    abas: [
      { rotulo: 'Entender', blocos: [
        { tipo: 'texto', html:
          '<h3>Marketing que não compila</h3>' +
          '<p>O README diz "p95 de 12 ms" digitado à mão, e depois a medida muda. Landing page sem limitações vira marketing. O <strong>dossier</strong> é o documento público de release; neste bloco ele é gerado por código.</p>' +
          '<h3>Modelo mental</h3>' +
          '<ul><li><strong>Versão derivada:</strong> <code>resolve_version()</code> usa <code>git describe --tags --always --dirty</code>, com fallback para <code>__version__</code>. Nunca hardcoded.</li>' +
          '<li><strong>Métrica com evidência:</strong> cada <code>MetricRef</code> tem nome, valor e um caminho que precisa existir. <code>build_dossier()</code> falha com <code>ValueError</code> se algum não existir.</li>' +
          '<li><strong>Seções:</strong> changelog, métricas (todas com evidência), limitações conhecidas (obrigatória) e "Ambientalmente BLOCKED (honesto)".</li>' +
          '<li><strong>Scan de sigilo:</strong> padrões de <code>sk-…</code>, chave privada PEM e <code>AKIA…</code>, mais a exigência de que BLOCKED seja rotulado como honesto. Roda depois, sobre o texto final.</li>' +
          '<li><strong>Demo em 5 atos:</strong> ingestão idempotente, pergunta com abstenção, grafo com proveniência, game day com rollback ao vivo e relatório de capacidade com percentis medidos.</li>' +
          '<li><strong>Defesa:</strong> as respostas declaram o que é medido, o que é modelo e o que é BLOCKED.</li></ul>' +
          '<p>Exemplo de resposta curada: o p50/p95/p99 e o throughput de saturação são medidos por <code>time.perf_counter</code> com ambiente registrado; a estimativa de capacidade e a comparação cloud são modelo declarado.</p>' },
        { tipo: 'ordene', id: 'b20-ordene', titulo: 'Ponha o demo em 5 atos na ordem', obrigatorio: false,
          enunciado: 'Ponha os cinco atos do <code>DEMO_SCRIPT</code> na ordem.',
          itens: [
            { id: 'gd', texto: 'Executar o game day: injetar release ruim e demonstrar o rollback ao vivo' },
            { id: 'ing', texto: 'Mostrar ingestão idempotente com progresso real do job' },
            { id: 'cap', texto: 'Abrir o relatório de capacidade e os percentis medidos' },
            { id: 'grafo', texto: 'Mostrar grafo de dependências com proveniência por aresta' },
            { id: 'perg', texto: 'Rodar pergunta com retrieval e abstenção quando faltar evidência' }
          ], solucao: ['ing', 'perg', 'grafo', 'gd', 'cap'],
          dica: 'Entra o dado, depois a pergunta, o grafo, a operação sob falha e por fim os números.',
          tutorDepois: 'O demo segue o fluxo do produto até a operação, e fecha com medida, não com promessa.' },
        { tipo: 'takeaway', html: 'Claim <mark>sem fonte</mark> não compila; versão <mark>do git</mark>, nunca digitada.' }
      ] },

      { rotulo: 'Ver funcionando', blocos: [
        { tipo: 'texto', html: '<p>Execução registrada no bloco: <code>release-dossier.md</code> gerado com 3 métricas rastreáveis, limitações e a seção "Ambientalmente BLOCKED (honesto)"; scan de sigilo limpo.</p>' },
        { tipo: 'rode', id: 'b20-rode', titulo: 'Os cinco oráculos do lançamento', enunciado: 'Aperte Enter. A saída reproduz a execução registrada no bloco.',
          prefixo: '$', entrada: 'uv run pytest tests/test_portfolio.py -v', unidade: 'testes', terminalTitulo: 'execução registrada no bloco (test_portfolio.py)',
          prever: { pergunta: 'Qual teste prova que uma métrica sem fonte não chega ao dossier?', opcoes: [
            { id: 'a', texto: 'test_versao_resolvida_nao_vazia', correta: false, porque: 'esse cobre a versão.' },
            { id: 'b', texto: 'test_dossier_falha_se_evidencia_nao_existe', correta: true, porque: 'a montagem do dossier falha se o caminho de evidência não existir.' },
            { id: 'c', texto: 'test_scan_public_text_detecta_segredos', correta: false, porque: 'esse cobre segredos no texto final.' }
          ] },
          etapas: [
            { id: 'orac', nome: 'Oráculos', descricao: 'Testes do portfólio', tom: 'request', ms: 3, linhas: [
              L('cmd', 'uv run pytest tests/test_portfolio.py -v'),
              L('out', 'test_versao_resolvida_nao_vazia PASSED'),
              L('out', 'test_dossier_falha_se_evidencia_nao_existe PASSED'),
              L('out', 'test_dossier_completo_toda_metrica_aponta_para_arquivo PASSED'),
              L('out', 'test_demo_script_cobre_os_cinco_atos_e_perguntas_honestas PASSED'),
              L('out', 'test_scan_public_text_detecta_segredos PASSED'),
              L('in', '5 passed')] },
            { id: 'saida', nome: 'Saída real', descricao: 'release-dossier.md', tom: 'response', ms: 1, linhas: [
              L('info', 'release-dossier.md: 3 métricas rastreáveis, limitações, seção BLOCKED honesta'),
              L('hint', 'scan de sigilo limpo')] }
          ],
          tutorAntes: 'Responda a previsão e aperte Enter.',
          callout: 'Você viu a regra de build, a versão, o demo e o scan sob teste.' },
        { tipo: 'takeaway', html: 'A regra é de <mark>build</mark>, não de <mark>revisão humana</mark>.' }
      ] },

      { rotulo: 'Praticar', blocos: [
        { tipo: 'python', id: 'b20-python', titulo: 'Dossier com evidência e scan de sigilo', obrigatorio: false,
          enunciado: 'Implemente <code>build_dossier(metricas, existentes)</code> (falha com <code>ValueError</code> se alguma evidência não está em <code>existentes</code>) e <code>scan_public_text(text)</code>. Versão reduzida do <code>portfolio.py</code> do bloco, sem git nem disco.',
          codigo: codigo, testes: testes,
          dica: 'Junte as evidências faltantes numa lista e levante o erro com ela. No scan, um problema por padrão que casar, mais o de rótulo BLOCKED.',
          solucao: solucao,
          tutorDepois: 'O build recusa o claim sem fonte, e o scan roda sobre o texto final, que é o que vai a público.',
          callout: 'Seu dossier só compila com fonte e o texto final passa pelo scan.' },
        { tipo: 'cenario', id: 'b20-cenario', titulo: 'A pergunta que você mais teme', obrigatorio: false,
          inicio: 'inicio',
          nos: {
            inicio: { texto: 'Na defesa, a banca pergunta: "O piloto validou o problema?" Você não tem sessão humana.',
              opcoes: [
                { texto: 'Dizer que os usuários de teste gostaram.', vai: 'mente', consequencia: 'Não há sessão consentida. O validador levanta exceção sem ela; sua fala contradiz o repositório.', tom: 'ruim' },
                { texto: 'Responder: "Não houve sessão humana neste ambiente (BLOCKED). O validador levanta exceção sem consentimento real e o kit de recrutamento está pronto."', vai: 'honesto', consequencia: 'Resposta que aponta uma evidência concreta e declara o limite antes de a banca insistir.', tom: 'ok' },
                { texto: 'Mudar de assunto para o p95.', vai: 'foge', consequencia: 'Evitar a pergunta sugere que há algo a esconder; e o p95 é outra evidência.', tom: 'ruim' }
              ] },
            mente: { texto: 'A banca pede o dado. Você não tem.', opcoes: [{ texto: 'Voltar e responder de novo', vai: 'inicio', consequencia: 'A defesa declara o que é BLOCKED antes de perguntarem.', tom: 'ok' }] },
            foge: { texto: 'A banca repete a pergunta.', opcoes: [{ texto: 'Voltar e responder de novo', vai: 'inicio', consequencia: 'Defender é apontar uma evidência para cada pergunta.', tom: 'ok' }] }
          },
          finais: { honesto: { texto: 'A banca anota o BLOCKED como limite declarado e passa para a próxima pergunta. A credibilidade do que foi medido fica intacta.', bom: true } } },
        { tipo: 'transcript', id: 'b20-transcript', titulo: 'Rascunho do dossier público', obrigatorio: false,
          enunciado: 'Leia o rascunho e marque as linhas que o build ou o scan do bloco barrariam.',
          linhas: [
            { quem: 'agente', texto: 'Cartógrafo v1.0 (versão lida de git describe).' },
            { quem: 'agente', texto: 'Métrica: p95 de 12 ms (digitado no README, sem caminho de evidência).' },
            { quem: 'agente', texto: 'Limitações: sem cluster real, sem piloto humano.' },
            { quem: 'agente', texto: 'Configuração de exemplo: OPENAI_KEY=sk-ABCDEFGHIJKL1234.' },
            { quem: 'agente', texto: 'Ambientalmente BLOCKED (honesto): piloto com usuário.' }
          ],
          erradas: [1, 3],
          explicacao: { 1: 'métrica sem caminho de evidência: o build_dossier falha, claim sem fonte não compila.', 3: 'padrão sk-… é segredo: o scan_public_text barra antes da publicação.' } },
        { tipo: 'takeaway', html: 'Defesa que <mark>declara limites</mark> e aponta <mark>evidência</mark>.' }
      ] },

      { rotulo: 'Conferir', blocos: [
        { tipo: 'escolha', id: 'b20-esc1', titulo: 'Landing page', pergunta: 'A landing page lista só as qualidades do produto. O que o bloco diz?',
          opcoes: [
            opc('a', 'É marketing: limitações são seção obrigatória do dossier', true, 'está na tabela de diagnóstico do bloco.'),
            opc('b', 'Está certo, limitações assustam', false, 'omitir limitações é o problema.'),
            opc('c', 'Basta um link para o README', false, 'o dossier traz as limitações.')] },
        { tipo: 'escolha', id: 'b20-esc2', titulo: 'Versão', pergunta: 'O dossier traz "v1.0" digitada à mão. Qual é a correção?',
          opcoes: [
            opc('a', 'Derivar do <code>git describe</code>, com fallback para <code>__version__</code>', true, 'versão hardcoded diverge do repositório.'),
            opc('b', 'Atualizar a constante a cada release', false, 'continua digitada.'),
            opc('c', 'Remover a versão', false, 'release versionada é invariante.')] },
        { tipo: 'takeaway', html: 'Regra de <mark>build</mark>, versão do <mark>git</mark> e limitações à <mark>vista</mark>.' }
      ] }
    ]
  });
})();
