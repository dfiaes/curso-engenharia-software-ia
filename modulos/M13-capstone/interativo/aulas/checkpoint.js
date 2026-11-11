/* M13 · Fechamento do capstone: decisão final. Fonte: M13.html#h-fechamento. Rubrica = "Basta"; modelo = resposta esperada + "Reprova". */
(function () {
  var reprova = function (t) { return '<p><strong>Reprova:</strong> ' + t + '</p>'; };
  function opc(id, texto, correta, porque) { return { id: id, texto: texto, correta: correta, porque: porque }; }

  var codigo = String.raw`def veredito_final(blocos):
    # blocos: dict bloco -> "PASS" | "BLOCKED" | "FAIL".
    # LACUNA: qualquer FAIL -> "NO-GO". Sem FAIL: "PASS com BLOCKEDs declarados" se houver
    # BLOCKED, senao "PASS". Devolva (veredito, lista_ordenada_de_blocos_blocked).
    return ("PASS", [])
`;
  var solucao = String.raw`def veredito_final(blocos):
    bloqueados = sorted(b for b, s in blocos.items() if s == "BLOCKED")
    if any(s == "FAIL" for s in blocos.values()):
        return ("NO-GO", bloqueados)
    if bloqueados:
        return ("PASS com BLOCKEDs declarados", bloqueados)
    return ("PASS", [])
`;
  var testes = String.raw`def test_pass_com_blocked_declarado():
    r = veredito_final({"B16": "PASS", "B19": "BLOCKED", "B20": "PASS"})
    assert r == ("PASS com BLOCKEDs declarados", ["B19"])

def test_tudo_pass():
    assert veredito_final({"B16": "PASS", "B18": "PASS"}) == ("PASS", [])

def test_fail_vence_blocked():
    v, b = veredito_final({"B17": "FAIL", "B19": "BLOCKED"})
    assert v == "NO-GO" and b == ["B19"]

def test_blocked_nao_vira_pass_silenciosamente():
    assert veredito_final({"B19": "BLOCKED"})[0] != "PASS"
`;

  TrilhaAula.registrar({
    id: 'm13-checkpoint',
    titulo: 'Fechamento do capstone',
    minutos: 40,
    resumo: 'A decisão final do capstone, sem consulta: o que passou, o que é BLOCKED por ambiente, o que é medido e o que é modelo. Responda com as suas palavras e aponte a evidência.',
    objetivo: 'Verificar, sem consulta, se você sustenta a decisão final do capstone: integra os blocos B16 a B20, separa PASS de BLOCKED, deriva números de evidência e defende NO-GO quando cabe.',
    revisao: [
      { id: 'm13cp-blocked', pergunta: 'Como o capstone trata B19 (piloto com usuário)?',
        opcoes: [
          opc('a', 'BLOCKED: sem humano real, e uma exceção estrutural impede a validação fabricada', true, 'é a decisão do fechamento, com a causa declarada.'),
          opc('b', 'PASS, com os dados de exemplo do scorecard', false, 'dado de exemplo nunca é piloto.'),
          opc('c', 'Omitido do resumo', false, 'o BLOCKED é declarado, não escondido.')] },
      { id: 'm13cp-medido', pergunta: 'Quais números do B16 são medidos e quais são modelo?',
        opcoes: [
          opc('a', 'Benchmarks reais com ambiente registrado são medidos; a comparação cloud é modelo declarado', true, 'PASS no B16 com cloud = modelo declarado.'),
          opc('b', 'Todos são medidos', false, 'a comparação cloud é modelo.'),
          opc('c', 'Todos são modelo', false, 'os percentis são medidos por perf_counter.')] },
      { id: 'm13cp-k8s', pergunta: 'O que prova o rollback do B17 sem cluster real?',
        opcoes: [
          opc('a', 'O rollback determinístico provado por hash; o K8s real é BLOCKED por ambiente', true, 'prova a semântica localmente; o cluster real está indisponível.'),
          opc('b', 'Um cluster de produção', false, 'cluster real indisponível.'),
          opc('c', 'Um diagrama de arquitetura', false, 'diagrama não executa rollback.')] },
      { id: 'm13cp-gate', pergunta: 'O que o fechamento registra como verificação final de B16 a B20?',
        opcoes: [
          opc('a', 'ruff check, ruff format, mypy strict (38 arquivos), pytest do bloco 28/28 e da suíte 125/125, com transcrições em <code>evidence/m13/</code>', true, 'o número tem transcrição como evidência.'),
          opc('b', 'Uma frase dizendo que tudo passou', false, 'sem transcrição, é claim sem fonte.'),
          opc('c', 'Só o pytest do bloco', false, 'o fechamento inclui lint, formato, tipos e suíte.')] },
      { id: 'm13cp-nogo', pergunta: 'Quando o PRR diz NO-GO e o prazo aperta, o que o capstone faz?',
        opcoes: [
          opc('a', 'Mantém o NO-GO com o plano de desbloqueio item a item', true, 'NO-GO com plano é entrega; GO forçado é dívida escondida.'),
          opc('b', 'Muda o veredito para GO', false, 'a decisão vem de evidência.'),
          opc('c', 'Oculta a área pendente', false, 'o plano nomeia cada pendência.')] }
    ],
    abas: [
      { rotulo: 'Decisão e evidência', blocos: [
        { tipo: 'texto', html:
          '<p>Uma pergunta por vez, sem consulta. Cada resposta nomeia a <strong>evidência</strong>: arquivo, teste ou transcrição. Reprovar é permitido: volte ao bloco indicado e tente de novo.</p>' +
          '<h3>O resumo que você vai defender</h3>' +
          '<table><thead><tr><th>Bloco</th><th>Decisão</th><th>Causa</th></tr></thead><tbody>' +
          '<tr><td>B1–B15</td><td>PASS (com BLOCKEDs ambientais declarados)</td><td>ver TOC dos blocos</td></tr>' +
          '<tr><td>B16</td><td>PASS</td><td>benchmarks reais medidos com ambiente registrado; cloud = modelo declarado</td></tr>' +
          '<tr><td>B17</td><td>PASS, K8s BLOCKED</td><td>rollback determinístico provado por hash; cluster real indisponível</td></tr>' +
          '<tr><td>B18</td><td>PASS (GO)</td><td>PRR 10/10 evidenciado no disco e game day com injeção real</td></tr>' +
          '<tr><td>B19</td><td>BLOCKED</td><td>sem humano real; exceção estrutural impede validação fabricada</td></tr>' +
          '<tr><td>B20</td><td>PASS</td><td>dossier com métricas verificadas no disco; scan de sigilo limpo</td></tr>' +
          '</tbody></table>' +
          '<p>Verificações finais de B16–B20: ruff check ✔, ruff format ✔, mypy strict ✔ (38 arquivos), pytest do bloco 28/28 e da suíte 125/125, 0 falhas. Transcrições em <code>evidence/m13/B16..B20/gates-ruff-format-mypy-pytest-completo.txt</code>.</p>', largo: true },

        { tipo: 'escolha', id: 'cp-esc-p1', titulo: 'P1 · Aquecimento: B19',
          pergunta: 'Alguém pede para trocar o B19 de BLOCKED para PASS porque o scorecard foi testado. Qual é a resposta?',
          opcoes: [
            { id: 'a', texto: 'Recusar: o scorecard testado com dados de exemplo não é piloto; sem sessão humana consentida o estado é BLOCKED.', correta: true, porque: 'a exceção estrutural existe para impedir a validação fabricada.' },
            { id: 'b', texto: 'Aceitar se o n do exemplo for maior que 5.', correta: false, porque: 'o n não troca dado de exemplo por piloto.' },
            { id: 'c', texto: 'Aceitar com uma nota de rodapé.', correta: false, porque: 'nota não muda o que foi medido.' }
          ] },
        { tipo: 'escreva', id: 'cp-p1', titulo: 'P1 · Defenda o BLOCKED do B19', obrigatorio: false,
          enunciado: 'Um avaliador diz que "BLOCKED é desistir". Defenda o B19 como decisão final, dizendo o que existe e o que falta. <em>Bloco 19.</em>',
          placeholder: 'O B19 está BLOCKED porque… O que está pronto é… Falta…',
          rubrica: [
            'Causa ambiental: <strong>sem humano real</strong> neste ambiente.',
            'BLOCKED é <strong>estrutural</strong>: <code>validacao()</code> levanta <code>PilotBlocked</code>; sessão sem consentimento é recusada.',
            'Pronto: <strong>kit de recrutamento</strong> e <strong>scorecard</strong> com a matemática da decisão, testados com dados <strong>rotulados como exemplo</strong>.',
            'Impossível um <strong>VALIDADO fabricado</strong>; hipótese rejeitada também é resultado legítimo.'
          ],
          modelo: '<p>O B19 está BLOCKED porque o ambiente não tem humano real, e isso é garantido no código: <code>PilotLog.validacao()</code> levanta <code>PilotBlocked</code> sem sessão consentida, e a sessão sem consentimento é recusada no registro. Está pronto o kit de recrutamento (roteiro, consentimento, canais, recompensa, critérios) e o scorecard com a matemática da decisão, exercitado só com dados rotulados como exemplo. Não é desistir: é impedir um VALIDADO fabricado e deixar o caminho pronto para quando houver humano.</p>' + reprova('"fazer um piloto com colegas" sem consentimento, ou tratar o dado de exemplo como piloto.') },

        { tipo: 'escreva', id: 'cp-p2', titulo: 'P2 · Medido, modelo e BLOCKED', obrigatorio: false,
          enunciado: 'Na defesa: "quais números são medidos e quais são modelo?" Responda classificando cada resultado do capstone. <em>Blocos 16, 17, 19 e 20.</em>',
          placeholder: 'Medido: … Modelo declarado: … BLOCKED: …',
          rubrica: [
            '<strong>Medido:</strong> p50/p95/p99 e throughput de saturação, por <code>time.perf_counter</code> com ambiente registrado.',
            '<strong>Modelo declarado:</strong> capacity estimate e comparação cloud.',
            '<strong>BLOCKED:</strong> K8s real (rollback provado por hash localmente), Stripe real, piloto humano.',
            'Declara isso <strong>antes</strong> de perguntarem e aponta a <strong>evidência</strong> de cada um.'
          ],
          modelo: '<p>Medidos: p50/p95/p99 e o throughput de saturação, por <code>time.perf_counter</code> com o ambiente registrado, em <code>evidence/m13/B16</code>. Modelo declarado: a estimativa de capacidade e a comparação com cloud. BLOCKED por ambiente: cluster Kubernetes real (o rollback é determinístico e provado por hash), integração real de billing e o piloto com humano. Cada resposta aponta o arquivo de evidência, e as limitações são declaradas antes da pergunta.</p>' + reprova('"está tudo medido" ou omitir os BLOCKEDs.') },

        { tipo: 'ordene', id: 'cp-ordene', titulo: 'P3 · A ordem da decisão final', obrigatorio: false,
          enunciado: 'Ponha, na ordem lógica, as etapas que sustentam o veredito final do capstone.',
          itens: [
            { id: 'dossier', texto: 'B20: dossier com cada métrica apontando para evidência e scan de sigilo limpo' },
            { id: 'gates', texto: 'Gates finais: ruff, format, mypy strict e pytest com transcrição' },
            { id: 'prr', texto: 'B18: PRR 10/10 evidenciado e game day com injeção real' },
            { id: 'decisao', texto: 'Resumo de decisão: PASS e BLOCKED, cada um com causa' },
            { id: 'rollback', texto: 'B17: deploy e rollback determinístico provado por hash' }
          ], solucao: ['rollback', 'prr', 'dossier', 'gates', 'decisao'],
          dica: 'Operação antes da revisão, publicação depois, e o resumo só depois das verificações.',
          tutorDepois: 'O resumo de decisão é o último artefato: só cita o que as etapas anteriores deixaram em disco.' },
        { tipo: 'takeaway', html: 'Decisão final: <mark>PASS</mark> com <mark>evidência</mark>, <mark>BLOCKED</mark> com causa.' }
      ] },

      { rotulo: 'Cenários e integração', blocos: [
        { tipo: 'cenario', id: 'cp-cenario', titulo: 'P4 · Sexta, 17h: o GO forçado', obrigatorio: false,
          inicio: 'inicio',
          nos: {
            inicio: { texto: 'O fechamento está quase pronto. O PRR mostra 9/10 (área "dados" sem evidência de restore) e o patrocinador quer a linha "GO" no resumo. O dossier ainda cita "p95 de 12 ms" digitado.',
              opcoes: [
                { texto: 'Marcar GO e registrar a pendência como "acompanhamento".', vai: 'go', consequencia: 'GO forçado: o PRR só aprova com 100% evidenciado e game day concluído.', tom: 'ruim' },
                { texto: 'Devolver NO-GO com o plano de desbloqueio e ligar o p95 a um arquivo de evidência.', vai: 'ok', consequencia: 'O veredito sai da evidência e a métrica passa a compilar com fonte.', tom: 'ok' },
                { texto: 'Esconder a área "dados" do resumo.', vai: 'esconde', consequencia: 'Omitir pendência é o contrário do BLOCKED honesto.', tom: 'ruim' }
              ] },
            go: { texto: 'O GO sai sem restore exercitado. Na primeira falha de dados ninguém sabe voltar.', opcoes: [{ texto: 'Voltar', vai: 'inicio', consequencia: 'Pressão iguala GO forçado.', tom: 'ok' }] },
            esconde: { texto: 'O resumo parece limpo e não reflete o disco.', opcoes: [{ texto: 'Voltar', vai: 'inicio', consequencia: 'O resumo declara PASS e BLOCKED com causa.', tom: 'ok' }] }
          },
          finais: { ok: { texto: 'NO-GO com plano, métrica com evidência e resumo fiel ao disco. Na segunda, o restore é exercitado e o PRR fecha 10/10.', bom: true } } },

        { tipo: 'transcript', id: 'cp-transcript', titulo: 'P5 · Relato de fechamento', obrigatorio: false,
          enunciado: 'Leia o relato do fechamento e marque as linhas que contradizem o que o capstone prova.',
          linhas: [
            { quem: 'agente', texto: 'B18: PRR 10/10 evidenciado no disco; game day com rollback em t+5min.' },
            { quem: 'agente', texto: 'B19: piloto validado, o scorecard deu hipótese apoiada com os dados do teste.' },
            { quem: 'agente', texto: 'B17: K8s real BLOCKED por ambiente; rollback provado por hash.' },
            { quem: 'agente', texto: 'B20: o p95 do dossier foi digitado a partir da conversa, sem arquivo de evidência.' },
            { quem: 'ferramenta', texto: 'pytest da suíte: 125 passed, mypy strict: 38 arquivos sem erro.' }
          ],
          erradas: [1, 3],
          explicacao: { 1: 'dado de exemplo não é piloto; sem sessão humana consentida o B19 é BLOCKED.', 3: 'claim sem fonte não compila: toda métrica do dossier aponta para evidência no disco.' } },

        { tipo: 'python', id: 'cp-python', titulo: 'P6 · Veredito final derivado', obrigatorio: false,
          enunciado: 'Implemente <code>veredito_final(blocos)</code>: qualquer <code>FAIL</code> dá <code>NO-GO</code>; sem FAIL, a presença de <code>BLOCKED</code> dá <code>"PASS com BLOCKEDs declarados"</code>; senão <code>PASS</code>. Devolva também a lista ordenada de blocos BLOCKED.',
          codigo: codigo, testes: testes,
          dica: 'Calcule primeiro a lista de bloqueados e depois decida na ordem FAIL, BLOCKED, PASS.',
          solucao: solucao,
          tutorDepois: 'O BLOCKED não vira PASS silencioso nem NO-GO: é um terceiro estado, declarado.',
          callout: 'Seu veredito é derivado dos estados, não digitado.' },

        { tipo: 'escolha', id: 'cp-esc-p7', titulo: 'P7 · Aquecimento: o resumo', pergunta: 'O resumo diz "PASS" para B17 sem mencionar o K8s. O que está errado?',
          opcoes: [
            { id: 'a', texto: 'Faltou declarar o K8s real como BLOCKED e dizer o que prova o rollback (hash).', correta: true, porque: 'o PASS de B17 vale para a semântica provada localmente, e o limite precisa estar à vista.' },
            { id: 'b', texto: 'Nada: PASS dispensa detalhes.', correta: false, porque: 'BLOCKED é declarado.' },
            { id: 'c', texto: 'Deveria ser FAIL por não ter cluster.', correta: false, porque: 'ambiente indisponível é BLOCKED, não FAIL.' }
          ] },
        { tipo: 'takeaway', html: 'Fechar é <mark>integrar a evidência</mark> e <mark>declarar o que falta</mark>.' }
      ] }
    ]
  });
})();
