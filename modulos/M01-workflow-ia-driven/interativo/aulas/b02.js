/* M01 · Bloco 2: harness engineering (guardrails mecânicos, não pedidos educados). Fonte: M01.html#b02. Saídas do rode: execução real do lab (check, runner). Fontes técnicas verificadas em 14/08/2026. */
(function () {
  var L = function (kind, text) { return { kind: kind, text: text }; };
  function opc(id, texto, correta, porque) { return { id: id, texto: texto, correta: correta, porque: porque }; }

  var etapasRunner = function () {
    return [
      { id: 'check', nome: 'Gate do contrato', descricao: 'check executa o gate tokenizado', tom: 'dns', ms: 12, linhas: [
        L('cmd', 'python -m sdd_lab check examples/feature.valid.json --evidence evidence/run.json'),
        L('hint', 'exit=0 (sem saída no terminal: o resultado vai para evidence/run.json)')] },
      { id: 'evidencia', nome: 'Evidência persistida', descricao: 'evidence/run.json', tom: 'tcp', ms: 12, linhas: [
        L('cmd', 'cat evidence/run.json'),
        L('out', '"argv": ["python", "-c", "print(\'gate semântico demonstrativo: OK\')"],'),
        L('out', '"duration_ms": 12,'),
        L('out', '"exit_code": 0,'),
        L('out', '"timed_out": false,'),
        L('out', '"stdout": "gate semântico demonstrativo: OK\\n",'),
        L('out', '"tool_version": "Python 3.13.16",'),
        L('out', '"policy_reason": null'),
        L('hint', 'duração e versão mudam a cada máquina e execução: não são números de aceite (também há cwd e started_at)')] },
      { id: 'timeout', nome: 'Timeout', descricao: 'Estourou o prazo: 124', tom: 'tls', ms: 500, linhas: [
        L('cmd', 'run_command(RunSpec(("python", "-c", "import time; time.sleep(5)"), cwd, timeout_seconds=0.5), policy)'),
        L('in', 'exit_code=124 timed_out=True'),
        L('hint', '124 é o código próprio do runner para timeout: distinto de falha de teste')] },
      { id: 'politica', nome: 'Política nega', descricao: 'Fora da policy: 126', tom: 'request', ms: 0, linhas: [
        L('cmd', 'run_command(RunSpec(("deploy.sh",), cwd), policy)'),
        L('in', 'exit_code=126 policy_reason=shell_script_requires_review'),
        L('cmd', 'run_command(RunSpec(("curl", "http://x"), cwd), policy)'),
        L('in', 'exit_code=126 policy_reason=executable_not_allowlisted'),
        L('cmd', 'run_command(RunSpec(("python", "-c", "print(1)"), cwd_fora_do_workspace), policy)'),
        L('in', 'exit_code=126 policy_reason=cwd_outside_workspace'),
        L('hint', 'duration_ms=0: nada foi executado; a negação vem antes do processo existir')] }
    ];
  };

  var codigoGate = String.raw`def classificar_exit(ferramenta, codigo):
    """Devolve "aprovado" ou "bloqueado" para o exit code de um gate."""
    # 1. exit 124 (timeout do runner) e 126 (policy negou) sempre bloqueiam
    # 2. no pytest, 0 aprova; 5 (nenhum teste coletado) BLOQUEIA
    # 3. nas demais ferramentas, só 0 aprova
    return "aprovado"


def controle_negativo(baseline, mutante, casos):
    """O gate só é forte se o baseline passa em todos os casos E o mutante é rejeitado em algum."""
    baseline_passa = True   # todos os casos: baseline(entrada) == esperado
    mutante_rejeitado = False   # algum caso: mutante(entrada) != esperado
    return baseline_passa and mutante_rejeitado


print(classificar_exit("pytest", 5))
print(controle_negativo(lambda x: x * 2, lambda x: x + 2, [(1, 2), (3, 6)]))
`;
  var testesGate = String.raw`def test_zero_aprova():
    assert classificar_exit("mypy", 0) == "aprovado"
    assert classificar_exit("pytest", 0) == "aprovado"


def test_pytest_cinco_bloqueia():
    assert classificar_exit("pytest", 5) == "bloqueado"


def test_timeout_e_policy_bloqueiam():
    assert classificar_exit("pytest", 124) == "bloqueado"
    assert classificar_exit("ruff", 126) == "bloqueado"


def test_cinco_em_outra_ferramenta_nao_e_aprovacao():
    assert classificar_exit("ruff", 5) == "bloqueado"


def test_controle_negativo_forte():
    assert controle_negativo(lambda x: x * 2, lambda x: x + 2, [(1, 2), (3, 6)]) is True


def test_oraculo_fraco_e_exposto():
    ident = lambda x: x
    assert controle_negativo(ident, ident, [(1, 1)]) is False


def test_baseline_quebrado_nao_e_forte():
    assert controle_negativo(lambda x: x + 1, lambda x: x + 2, [(1, 5)]) is False


def test_sem_casos_e_erro():
    try:
        controle_negativo(lambda x: x, lambda x: x, [])
    except ValueError:
        return
    assert False, "esperado ValueError"
`;
  var solucaoGate = String.raw`def classificar_exit(ferramenta, codigo):
    if codigo in (124, 126):
        return "bloqueado"
    return "aprovado" if codigo == 0 else "bloqueado"


def controle_negativo(baseline, mutante, casos):
    amostras = list(casos)
    if not amostras:
        raise ValueError("controle negativo exige ao menos um caso")
    baseline_passa = all(baseline(x) == esperado for x, esperado in amostras)
    mutante_rejeitado = any(mutante(x) != esperado for x, esperado in amostras)
    return baseline_passa and mutante_rejeitado
`;
  var codigoErro = String.raw`def sucesso_integral(p, n, c=0.0):
    """Chance de n passos independentes darem certo, cada um com acerto p.

    Um gate que detecta a fração c das falhas (e permite refazer o passo)
    eleva o acerto efetivo por passo para p + (1 - p) * c.
    """
    efetivo = p  # 1. aplique o gate
    return 0.0   # 2. eleve ao número de passos


print(round(sucesso_integral(0.95, 20), 3))
`;
  var testesErro = String.raw`def test_sem_gate_vinte_passos():
    assert round(sucesso_integral(0.95, 20), 2) == 0.36


def test_gate_que_pega_80_por_cento():
    assert round(sucesso_integral(0.95, 20, 0.8), 3) == 0.818


def test_borda_zero_passos():
    assert sucesso_integral(0.5, 0) == 1.0


def test_gate_perfeito_vira_certeza():
    assert sucesso_integral(0.5, 10, 1.0) == 1.0
`;
  var solucaoErro = String.raw`def sucesso_integral(p, n, c=0.0):
    efetivo = p + (1 - p) * c
    return efetivo ** n
`;

  TrilhaAula.registrar({
    id: 'm01-b2',
    titulo: 'Harness engineering: guardrails mecânicos, não pedidos educados',
    minutos: 35,
    resumo: 'Prompt e contexto são probabilísticos; só o harness é determinístico. Cinco guardrails transformam regra inegociável em controle executável com caso negativo e evidência.',
    objetivo: 'Separar prompt, contexto e harness, explicar por que o agente degrada em tarefa longa, listar os cinco guardrails e ler um runner que registra argv, versão, duração, saída e exit code sem shell implícito.',
    revisao: [
      { id: 'm01b2-niveis', pergunta: 'Sua instrução de AGENTS.md diz "não reescreva o código". Qual é a leitura de harness engineering?',
        opcoes: [
          opc('a', 'É um pedido probabilístico: a regra inegociável precisa virar controle executável (policy, teste, gate) com caso negativo e evidência', true, 'prompt e contexto são probabilísticos; só o harness é determinístico.'),
          opc('b', 'Basta escrevê-la em maiúsculas', false, 'ênfase continua sendo probabilidade melhor, não certeza.'),
          opc('c', 'Contexto bem escolhido garante o cumprimento', false, 'o modelo pode ignorar o que vê.')] },
      { id: 'm01b2-exit5', pergunta: 'Num projeto com pytest, um passo do runner retorna exit code 5. Como o harness deve tratar?',
        opcoes: [
          opc('a', 'Como bloqueio: o 5 significa que nenhum teste foi coletado, logo nada foi verificado', true, 'cada ferramenta define seus códigos; tratar 5 como aviso cria a ilusão de gate verde sem verificação.'),
          opc('b', 'Como sucesso, pois não houve falha de teste', false, 'sem teste coletado, nada foi verificado.'),
          opc('c', 'Como aviso a ignorar', false, 'um aviso ignorado deixa o gate verde sem checar nada.')] },
      { id: 'm01b2-independencia', pergunta: 'Você pede ao mesmo modelo que revise o próprio texto gerado. O que isso NÃO garante?',
        opcoes: [
          opc('a', 'Independência: falhas correlacionadas fazem o revisor repetir o erro do gerador', true, 'priorize parser, type checker, teste com oráculo forte, controle negativo e revisão humana por risco.'),
          opc('b', 'Que haverá algum comentário de revisão', false, 'isso ele produz; o problema é a falta de independência.'),
          opc('c', 'Que o código compile', false, 'compilar é verificação do type checker/parser, não do revisor.')] },
      { id: 'm01b2-guardrails', pergunta: 'Qual lista são os cinco guardrails mecânicos do harness?',
        opcoes: [
          opc('a', 'Gates por passo, unidades pequenas, estado externalizado, fronteiras de permissão e verificação independente', true, 'se uma propriedade é inegociável, ela precisa de controle executável, caso negativo e evidência.'),
          opc('b', 'Prompts longos, contexto grande, mais ferramentas, mais agentes e revisão no fim', false, 'janela maior não corrige contexto irrelevante nem objetivo mal definido.'),
          opc('c', 'Ruff, mypy, pytest, uv e Git', false, 'são ferramentas; os guardrails são as camadas que elas implementam.')] },
      { id: 'm01b2-teste-acido', pergunta: 'Qual é o teste ácido do estado externalizado?',
        opcoes: [
          opc('a', 'Uma nova sessão consegue retomar do último estado confirmado, só dos artefatos, sem repetir efeito?', true, 'conversa ajuda na exploração, mas não pode ser o único ledger operacional.'),
          opc('b', 'O chat cabe inteiro na janela de contexto', false, 'janela maior não substitui estado confirmado.'),
          opc('c', 'O agente lembra o que fez há três turnos', false, 'a sessão é descartável; o estado, não.')] }
    ],
    abas: [
      { rotulo: 'Entender', blocos: [
        { tipo: 'texto', html:
          '<h3>De "pedir educadamente" a "o sistema não deixa"</h3>' +
          '<p>No M00 você viu na pele que instrução em prompt é pedido, não garantia: a skill v1 mandava "não reescreva o código" e o agente reescreveu tudo. A v2 melhorou com técnica de prompt, mas prompt melhor é probabilidade melhor, não certeza. <strong>Harness engineering</strong> é o passo seguinte: tirar as regras inegociáveis do prompt e pô-las em mecanismos que não dependem de obediência.</p>' },
        { tipo: 'texto', largo: true, html:
          '<table><thead><tr><th>Disciplina</th><th>Controla</th><th>Pergunta que responde</th><th>Natureza</th></tr></thead><tbody>' +
          '<tr><td>Prompt engineering</td><td>o que você diz</td><td>"como formulo a instrução?"</td><td>probabilística: o modelo pode desobedecer</td></tr>' +
          '<tr><td>Context engineering</td><td>o que o modelo vê</td><td>"o que entra na janela, e o que fica fora?"</td><td>probabilística: o modelo pode ignorar o que vê</td></tr>' +
          '<tr><td>Harness engineering</td><td>o que o sistema permite</td><td>"o que acontece quando o modelo erra?"</td><td>determinística: o erro é barrado por código</td></tr>' +
          '</tbody></table>' +
          '<p>Uma instrução pede um comportamento; contexto fornece informação para escolhê-lo; um <strong>gate</strong> executa uma verificação e pode impedir o avanço. Pedir que o agente preserve o contrato é diferente de executar um teste que falha quando o contrato muda. O harness liga essas peças e define o que fazer quando a verificação falha.</p>' },
        { tipo: 'texto', html:
          '<h3>Por que o agente degrada em tarefa longa</h3>' +
          '<p>Para desenhar o harness certo você precisa do modelo mental certo do modo de falha. Quatro mecanismos conhecidos:</p>' },
        { tipo: 'abas', rotulo: 'Modos de falha', itens: [
          { rotulo: 'Context rot', blocos: [{ tipo: 'texto', html: '<p><strong>Apodrecimento de contexto.</strong> A janela enche com histórico de edições, saídas de comando e versões antigas de código; o sinal (a instrução original, a spec) dilui no ruído. O modelo dá mais peso ao que está perto do fim da janela, as próprias ações recentes, e menos ao objetivo. Sintoma clássico: refatorar código que já estava pronto.</p>' }] },
          { rotulo: 'Perto do limite', blocos: [{ tipo: 'texto', html: '<p><strong>Degradação perto do limite de contexto.</strong> Não atribua uma intenção ao modelo a partir de uma resposta curta. Procure sinais: compactação registrada pelo harness, requisito antigo ausente da entrada, passos que crescem sem gate, checks omitidos ou retomada sem estado confirmado. O tratamento começa por unidade de trabalho menor, estado externalizado e medição; um prompt pedindo "não esqueça" não torna o diagnóstico confiável.</p>' }] },
          { rotulo: 'Falhas correlacionadas', blocos: [{ tipo: 'texto', html: '<p>Pedir ao mesmo modelo, ou a outro parecido, que verifique texto gerado não cria independência por si só. Priorize parser, type checker, teste com oráculo forte, controle negativo e revisão humana orientada por risco. Um segundo agente pode ampliar perspectivas, mas a independência dele precisa ser <em>demonstrada</em>, não presumida.</p>' }] },
          { rotulo: 'Erro composto', blocos: [{ tipo: 'texto', html: '<p>Como ilustração matemática, <em>não</em> como taxa medida de agentes: vinte passos independentes com 95% de sucesso cada dão 0,95<sup>20</sup> ≈ 36% de sucesso integral. Na prática as falhas não são independentes, o que reforça a necessidade de medir e de criar gates entre estados. Você calcula isso na aba Praticar.</p>' }] }
        ] },
        { tipo: 'callout', tom: 'neutral', titulo: 'Fundamento de engenharia: fail fast, shift left e a economia do erro', html:
          '<p>Dois princípios clássicos sustentam todo harness, e agora se aplicam a um "dev" que produz mil linhas por minuto:</p>' +
          '<ul><li><strong>Fail fast onde continuar é inseguro:</strong> invariante quebrada, contrato inválido e autorização negada bloqueiam o avanço. Falhas recuperáveis podem usar retry limitado ou degradação explícita. A política precisa distinguir essas classes em vez de aplicar "abortar tudo" universalmente.</li>' +
          '<li><strong>Feedback próximo da mudança:</strong> quanto antes uma divergência observável aparece, menor tende a ser o blast radius e mais contexto local existe para diagnosticá-la. Não há multiplicador universal: meça tempo até feedback, retrabalho e escapes por tipo de controle.</li></ul>' },
        { tipo: 'takeaway', html: 'Prompt é o que você <mark>diz</mark>, contexto é o que ele <mark>vê</mark>, harness é o que o sistema <mark>permite</mark>: só o terceiro é determinístico.' }
      ] },

      { rotulo: 'Os cinco guardrails', blocos: [
        { tipo: 'texto', html:
          '<h3>O harness tem cinco camadas</h3>' +
          '<p>A regra que as une: se uma propriedade é inegociável, ela precisa de <strong>controle executável, caso negativo e evidência</strong>. O modelo propõe e o harness decide se o erro passa.</p>' +
          '<ol>' +
          '<li><strong>Gates de qualidade por passo.</strong> Depois de uma unidade coerente de edição, rode as verificações rápidas adequadas ao risco: Ruff, mypy estrito e testes focados. O adapter pode ligar isso a hook, CI ou runner local, mas o contrato é o mesmo: resultado real, timeout e evidência persistida.</li>' +
          '<li><strong>Unidades de trabalho pequenas e verificáveis.</strong> Janela maior não corrige contexto irrelevante, truncamento ou objetivo mal definido. Cada etapa termina em estado verificável e retomável; divida quando evidência, revisão ou rollback deixarem de ser locais.</li>' +
          '<li><strong>Estado externalizado, sessão substituível.</strong> O progresso confirmado mora em spec, checkpoint, diff, testes e evidência. Teste ácido: uma nova sessão consegue retomar do último estado confirmado sem repetir efeito? A conversa ajuda na exploração, mas não deve ser o único ledger operacional.</li>' +
          '<li><strong>Fronteiras de permissão.</strong> Declare capabilities mínimas, paths, comandos e aprovações por tarefa. O nome do campo varia entre produtos; a policy efetiva precisa ser <em>testada</em>. No lab, produção é inacessível e qualquer escape de root é negado.</li>' +
          '<li><strong>Verificação independente.</strong> Quem avalia não pode ser quem fez: suíte escrita antes (ou revisada por você), revisor de contexto limpo (subagente com critérios de revisão explícitos) e, no limite, você lendo o diff. A rubrica é objetiva: a definição de "pronto" mora no <code>contract.md</code> (bloco 5), não na opinião do executor.</li></ol>' },
        { tipo: 'callout', tom: 'info', titulo: 'Exit code, a moeda dos guardrails', html:
          '<p>Processos comunicam estado por exit code, mas <strong>cada ferramenta define os seus</strong>. No pytest, zero significa testes coletados e aprovados; <strong>cinco</strong> significa que nenhum teste foi coletado, e isso deve bloquear o curso, não virar aviso ignorado. O runner registra argv, versão, duração, saída e código. A documentação do <code>subprocess</code> do Python recomenda argumentos como sequência e alerta para as responsabilidades extras de invocar um shell explicitamente.</p>' +
          '<p>Exit code é um sinal de protocolo; sozinho, não prova que o oráculo representa a necessidade real.</p>' },
        { tipo: 'callout', tom: 'success', titulo: 'O teste do prompt supérfluo', html:
          '<p>Pegue qualquer instrução do <code>AGENTS.md</code> e pergunte: <em>que evidência aparece se isto for ignorado?</em> Se a resposta é "nenhuma", transforme a instrução em policy, schema, teste ou aprovação, ou registre conscientemente que ela continua sendo orientação probabilística.</p>' },
        { tipo: 'texto', html:
          '<h3>Do agente ao repositório, em quatro paradas</h3>' +
          '<ol><li><strong>Agente propõe edição.</strong> O modelo erra; o harness decide se o erro passa.</li>' +
          '<li><strong>Gate: ruff, mypy, testes.</strong> O exit code é sinal de protocolo, não prova semântica.</li>' +
          '<li><strong>Estado: spec, diff, evidência.</strong> Uma sessão nova consegue retomar daqui.</li>' +
          '<li><strong>Repositório: commit atômico.</strong> Falhou? Corrija a etapa, não remende no chat.</li></ol>' },
        { tipo: 'texto', html:
          '<h3>O runner, caso negativo e evidência</h3>' +
          '<p>A sequência causal: a policy aceita apenas executáveis e diretórios permitidos; o runner usa lista de argumentos e <code>shell=False</code>; a evidência persiste argv, versão, duração, saída e exit code. <code>uv</code> gerencia ambiente e lock; Ruff verifica formatação e padrões; mypy analisa anotações de tipo; <code>unittest</code> executa os testes. O runner passa argumentos separados com <code>subprocess.run([...], shell=False)</code>, sem pedir ao shell para interpretar uma string. Cada ferramenta observa uma dimensão; nenhuma prova sozinha a adequação do produto.</p>' +
          '<p>No laboratório você observa: o contrato válido passa; a fixture inválida retorna 20 sem mutação; o mypy localiza o erro de tipo semeado; o controle negativo elimina um mutante; timeout retorna 124; shell, path e executável não autorizados retornam 126. Preveja o que o runner registra antes de rodar.</p>' },
        { tipo: 'rode', id: 'm01b2-rode', titulo: 'Rode o gate e leia a evidência', enunciado: 'Rode o <code>check</code> do laboratório. As etapas seguintes mostram o que o runner registra e o que ele nega. Saídas reais do laboratório; versão e duração variam por máquina.',
          prefixo: '$', entrada: 'python -m sdd_lab check examples/feature.valid.json --evidence evidence/run.json', unidade: 'ms', terminalTitulo: 'lab M01', etapas: etapasRunner(),
          prever: { pergunta: 'Um gate chama um processo que dorme 5 s, com timeout de 0,5 s. O que o runner registra?', opcoes: [
            { id: 'a', texto: 'Exit code 1, como qualquer falha.', correta: false, porque: 'o runner distingue timeout de falha de teste.' },
            { id: 'b', texto: 'Exit code 124 e timed_out=true, e o gate bloqueia.', correta: true, porque: '124 é o código de timeout do runner; a evidência fica registrada.' },
            { id: 'c', texto: 'Espera os 5 s e devolve 0.', correta: false, porque: 'o timeout interrompe a execução; sucesso seria uma evidência falsa.' }
          ] },
          tutorAntes: 'Aperte Enter e clique, em ordem, em "Evidência persistida", "Timeout" e "Política nega".',
          tutorDepois: 'Quatro situações, quatro registros: 0 com stdout, 124 para timeout, 126 com <code>policy_reason</code> para o que a policy nega. Nada disso depende de o agente ter obedecido.',
          callout: 'Você viu o gate produzir evidência e a policy negar antes de o processo existir.' },
        { tipo: 'takeaway', html: 'Regra inegociável vira <mark>controle executável</mark> com <mark>caso negativo</mark> e evidência; exit code é sinal, não prova semântica.' }
      ] },

      { rotulo: 'Praticar', blocos: [
        { tipo: 'texto', html:
          '<h3>Monte o runner por argv</h3>' +
          '<p>A chamada que executa o gate é pequena, e cada argumento é uma decisão de segurança. Escolha a peça certa em cada lacuna.</p>' },
        { tipo: 'complete', id: 'm01b2-complete', titulo: 'Complete a chamada do runner', linguagem: 'python',
          enunciado: 'Escolha, em cada lacuna, o trecho que impede o shell de interpretar uma string e mantém o resultado inspecionável.',
          partes: [
            'completed = subprocess.run(\n    ', { lacuna: 'cmd', opcoes: ['list(spec.argv)', '" ".join(spec.argv)', 'spec.argv[0]'], correta: 'list(spec.argv)' },
            ',\n    cwd=spec.cwd,\n    capture_output=True,\n    text=True,\n    timeout=', { lacuna: 'prazo', opcoes: ['spec.timeout_seconds', 'None', '0'], correta: 'spec.timeout_seconds' },
            ',\n    check=', { lacuna: 'check', opcoes: ['False', 'True'], correta: 'False' },
            ',   # o exit code vira evidência, não exceção\n    shell=', { lacuna: 'shell', opcoes: ['False', 'True'], correta: 'False' },
            ',\n)\n'
          ],
          explicacao: 'Lista de argumentos mais <code>shell=False</code> impede que o shell reinterprete a string (aspas, <code>;</code>, <code>$()</code>). O <code>timeout</code> é o que produz o 124; <code>check=False</code> deixa o runner registrar o exit code em vez de lançar exceção. Antes disso a policy já filtrou executável e diretório.',
          callout: 'Chamada montada: argv em lista, sem shell, com prazo e exit code como evidência.' },
        { tipo: 'python', id: 'm01b2-python', titulo: 'Exit code e controle negativo', obrigatorio: false,
          enunciado: 'Complete <code>classificar_exit(ferramenta, codigo)</code> (124 e 126 bloqueiam; só 0 aprova; no pytest, 5 bloqueia) e <code>controle_negativo(baseline, mutante, casos)</code>: o gate é forte quando o baseline passa em <em>todos</em> os casos e o mutante é rejeitado em <em>algum</em>. Sem casos, lance <code>ValueError</code>.',
          codigo: codigoGate, testes: testesGate,
          dica: 'Use <code>all(...)</code> para o baseline e <code>any(...)</code> para o mutante. Não tente aprovar o 5: nenhum teste coletado significa nada verificado.',
          solucao: solucaoGate,
          tutorDepois: 'O oráculo fraco (identidade contra identidade) é exposto porque nenhum mutante é rejeitado. É o <code>test_weak_oracle_is_exposed</code> do laboratório: um gate que nunca reprova nunca provou nada.',
          callout: 'Exit codes tratados por ferramenta e o controle negativo medindo a força do gate.' },
        { tipo: 'python', id: 'm01b2-python-erro', titulo: 'Calcule o erro composto', obrigatorio: false,
          enunciado: 'Implemente <code>sucesso_integral(p, n, c)</code>: com <code>n</code> passos independentes de acerto <code>p</code>, a chance de terminar tudo certo é <code>p<sup>n</sup></code>. Um gate que detecta a fração <code>c</code> das falhas e permite refazer o passo eleva o acerto efetivo para <code>p + (1 - p)·c</code>. É ilustração matemática, não taxa medida de agentes.',
          codigo: codigoErro, testes: testesErro,
          dica: 'Calcule primeiro o acerto efetivo por passo e só então eleve ao número de passos com <code>**</code>.',
          solucao: solucaoErro,
          tutorDepois: 'Vinte passos a 95% dão cerca de 36%; com um gate que pega 80% das falhas, o acerto efetivo por passo vai a 99% e o total sobe para cerca de 82%. As falhas reais não são independentes: meça, não presuma.',
          callout: 'Você viu quanto um gate entre passos vale, na matemática da ilustração.' },
        { tipo: 'takeaway', html: 'Argumentos em <mark>lista</mark>, <mark>shell=False</mark>, prazo e exit code registrado: o runner é onde a autoridade de executar <mark>termina</mark>.' }
      ] },

      { rotulo: 'Conferir', blocos: [
        { tipo: 'cenario', id: 'm01b2-cenario', titulo: 'A regra que o agente ignorou', obrigatorio: false,
          enunciado: 'O AGENTS.md diz "não reescreva o código". O agente reescreveu mesmo assim. Escolha a resposta e veja o custo.',
          inicio: 'inicio',
          nos: {
            inicio: { texto: 'A regra existe no prompt e foi violada. O que você faz com ela?', opcoes: [
              { texto: 'Reescrevo em maiúsculas e repito a regra no início de cada mensagem.', vai: 'f-prompt', tom: 'ruim', consequencia: 'é a mesma probabilidade com mais volume; ainda não há evidência quando for ignorada.' },
              { texto: 'Aplico o teste do prompt supérfluo e transformo a regra em controle: lista fechada de arquivos por etapa, gate e evidência.', vai: 'gate', tom: 'ok', consequencia: 'agora violar a regra produz um resultado observável.' }
            ] },
            gate: { texto: 'O gate roda pytest e devolve exit code 5 num passo. O que o harness faz?', opcoes: [
              { texto: 'Trata como sucesso: não houve falha de teste.', vai: 'f-verde', tom: 'ruim', consequencia: 'gate verde sem nenhum teste coletado: nada foi verificado.' },
              { texto: 'Bloqueia: 5 é "nenhum teste coletado", e o controle negativo confirma que o gate reprova um defeito conhecido.', vai: 'f-bom', tom: 'ok', consequencia: 'o gate tem oráculo, caso negativo e evidência.' }
            ] }
          },
          finais: {
            'f-bom': { bom: true, texto: 'A regra virou controle: qualquer violação aparece na evidência, e o gate prova que reprova o que deve.' },
            'f-prompt': { bom: false, texto: 'A regra continua sendo um pedido; a próxima sessão degrada e ninguém vê.' },
            'f-verde': { bom: false, texto: 'O build ficou verde sem verificar nada, a ilusão mais cara do harness.' }
          },
          callout: 'Você tirou a regra do prompt e a pôs num gate que reprova o que deve.' },
        { tipo: 'escolha', id: 'm01b2-esc-indep', titulo: 'Confira: o revisor que repete o erro',
          pergunta: 'Para verificar o código gerado por um agente, você pede ao mesmo modelo que revise o próprio texto. O que isso NÃO garante?',
          opcoes: [
            { id: 'a', texto: 'Que haverá algum comentário de revisão.', correta: false, porque: 'comentário ele produz; o problema é a independência.' },
            { id: 'b', texto: 'Independência: falhas correlacionadas fazem o revisor repetir o erro do gerador.', correta: true, porque: 'verificador do mesmo modelo (ou semelhante) não é independente por definição; independência de um segundo agente precisa ser demonstrada.' },
            { id: 'c', texto: 'Que o código compile.', correta: false, porque: 'compilar é papel do parser e do type checker.' },
            { id: 'd', texto: 'Que o contexto caiba na janela.', correta: false, porque: 'isso é outro eixo, o de context engineering.' }
          ], tutorDepois: 'Priorize parser, type checker, teste com oráculo forte, controle negativo e revisão humana por risco.' },
        { tipo: 'escolha', id: 'm01b2-esc-exit', titulo: 'Confira: exit code 5',
          pergunta: 'Num projeto com pytest, um passo do runner retorna exit code 5. Como o harness deve tratar?',
          opcoes: [
            { id: 'a', texto: 'Como sucesso, pois não houve falha de teste.', correta: false, porque: 'sem teste coletado, nada foi verificado.' },
            { id: 'b', texto: 'Como aviso a ignorar.', correta: false, porque: 'cria a ilusão de gate verde sem verificação.' },
            { id: 'c', texto: 'Como erro de sintaxe do Python.', correta: false, porque: 'erro de sintaxe tem outro código; cada ferramenta define os seus.' },
            { id: 'd', texto: 'Como bloqueio: o 5 significa que nenhum teste foi coletado, logo nada foi verificado.', correta: true, porque: 'zero é aprovado; cinco, nenhum teste coletado, e deve bloquear o curso.' }
          ], tutorDepois: 'Exit code é sinal de protocolo: leia o que a ferramenta específica quer dizer com ele.' },
        { tipo: 'texto', html: '<p class="ta-nota">Fontes técnicas (documentação do <code>subprocess</code>, pytest, Ruff, mypy, uv) verificadas em 14/08/2026; reconfirmar comandos e versões no máximo a cada 90 dias.</p>' },
        { tipo: 'takeaway', html: 'Pergunte <mark>que evidência aparece se isto for ignorado</mark>: se nenhuma, vire <mark>controle</mark>.' }
      ] }
    ]
  });
})();
