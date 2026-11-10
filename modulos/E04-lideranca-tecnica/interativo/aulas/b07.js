/* E04 · Bloco 7: Operação e cultura. Fonte: E04.html#b07. Saídas do leadkit check postmortem são execuções reais do laboratório. */
(function () {
  var L = function (kind, text) { return { kind: kind, text: text }; };
  function opc(id, texto, correta, porque) { return { id: id, texto: texto, correta: correta, porque: porque }; }

  var codigo = `import re
import unicodedata

CULPA = r"erro humano|human error|\\bculpa\\b|negligenc\\w*|descuido|falta de atencao"
DONO = r"(?<!\\w)@[\\w.-]+"
DATA = r"\\b\\d{4}-\\d{2}-\\d{2}\\b"


def sem_acento(texto):
    decomposto = unicodedata.normalize("NFKD", texto.lower())
    return "".join(c for c in decomposto if not unicodedata.combining(c))


def verificar_postmortem(causas, acoes):
    """Devolve uma lista de achados (codigo, indice): primeiro as causas, depois as ações.

    ("CULPA", i)  a causa i atribui o erro a uma pessoa (padrão CULPA, sem acento nem caixa)
    ("ACAO", i)   a ação i não tem @dono E data AAAA-MM-DD
    """
    return []


print(verificar_postmortem(["Causa raiz: erro humano. O Caio rodou a migração."], ["Tomar mais cuidado."]))
`;
  var testes = `CAUSAS_OK = [
    "O runbook não distinguia o terminal de produção do de homologação",
    "A migração não tinha verificação de ambiente",
    "Não existe alerta de latência para esse endpoint; a detecção veio de reclamação de cliente 38 minutos depois",
]
ACOES_OK = [
    "Exigir confirmação do nome do ambiente em migrações destrutivas. @caio 2026-10-30",
    "Adicionar teste de contrato para campo opcional ausente. @marina 2026-10-23",
]


def test_postmortem_bom():
    assert verificar_postmortem(CAUSAS_OK, ACOES_OK) == []


def test_causa_atribuida_a_pessoa():
    assert verificar_postmortem(["Causa raiz: erro humano. O Caio rodou a migração em produção."], ACOES_OK) == [("CULPA", 0)]
    assert ("CULPA", 1) in verificar_postmortem(CAUSAS_OK[:1] + ["Houve NEGLIGÊNCIA na revisão"], ACOES_OK)
    assert ("CULPA", 0) in verificar_postmortem(["Falta de atenção do plantão"], ACOES_OK)


def test_acao_sem_dono_ou_sem_data():
    assert verificar_postmortem(CAUSAS_OK, ["Tomar mais cuidado ao fazer deploy."]) == [("ACAO", 0)]
    assert verificar_postmortem(CAUSAS_OK, ["Criar alerta. @caio"]) == [("ACAO", 0)]
    assert verificar_postmortem(CAUSAS_OK, ["Criar alerta. 2026-10-30"]) == [("ACAO", 0)]
    assert verificar_postmortem(CAUSAS_OK, ["Criar alerta. @caio 30/10"]) == [("ACAO", 0)]


def test_controle_negativo_palavra_parecida_nao_e_culpa():
    assert verificar_postmortem(["Pedimos desculpa aos clientes afetados"], ACOES_OK) == []


def test_varios_achados_em_ordem():
    achados = verificar_postmortem(["erro humano", "ok"], ["ruim", ACOES_OK[0], "pior"])
    assert achados == [("CULPA", 0), ("ACAO", 0), ("ACAO", 2)]
`;
  var solucao = `import re
import unicodedata

CULPA = r"erro humano|human error|\\bculpa\\b|negligenc\\w*|descuido|falta de atencao"
DONO = r"(?<!\\w)@[\\w.-]+"
DATA = r"\\b\\d{4}-\\d{2}-\\d{2}\\b"


def sem_acento(texto):
    decomposto = unicodedata.normalize("NFKD", texto.lower())
    return "".join(c for c in decomposto if not unicodedata.combining(c))


def verificar_postmortem(causas, acoes):
    achados = []
    for i, causa in enumerate(causas):
        if re.search(CULPA, sem_acento(causa)):
            achados.append(("CULPA", i))
    for i, acao in enumerate(acoes):
        if not (re.search(DONO, acao) and re.search(DATA, acao)):
            achados.append(("ACAO", i))
    return achados
`;

  TrilhaAula.registrar({
    id: 'e04-b7',
    titulo: 'Operação e cultura: incidente, postmortem blameless, on-call sustentável e executivos',
    minutos: 40,
    resumo: 'A cultura de um time aparece no pior dia. No incidente, as pessoas mostram se acreditam que podem falar o que sabem sem punição; no postmortem, se a organização aprende ou procura culpado.',
    objetivo: 'Exercer o papel de comandante do incidente, escrever um postmortem blameless com ações verificáveis, desenhar um on-call sustentável e comunicar impacto a executivos pela conclusão e pelo pedido.',
    revisao: [
      { id: 'e04b7-ic', pergunta: 'O que faz o comandante do incidente (IC) e o que ele não faz?',
        opcoes: [
          opc('a', 'Mantém a visão do todo, atribui tarefas, decide mitigar versus investigar e o rollback, e delega comunicação; não mexe no sistema nem investiga em profundidade.', true, 'quem tem as mãos no sistema são os resolvedores; comunicação é um papel separado.'),
          opc('b', 'É o melhor resolvedor e conserta o sistema.', false, 'erro comum: o IC vira o melhor resolvedor e deixa o canal sem coordenação.'),
          opc('c', 'Espera achar a causa raiz antes de agir.', false, 'a regra é mitigar antes de entender.')] },
      { id: 'e04b7-cadencia', pergunta: 'Qual a cadência das atualizações durante o incidente?',
        opcoes: [
          opc('a', 'A cada 20 a 30 minutos, mesmo que seja "sem novidade, ainda investigando X".', true, 'silêncio gera ansiedade e interrupções.'),
          opc('b', 'Só quando a causa for conhecida.', false, 'má notícia tarde é pior que má notícia incompleta agora.'),
          opc('c', 'Uma atualização no fim do incidente.', false, 'a cadência fixa é parte do papel.')] },
      { id: 'e04b7-blameless', pergunta: 'O que significa postmortem blameless?',
        opcoes: [
          opc('a', 'Localizar a causa nas condições do sistema e nas decisões razoáveis dadas as informações da hora, não numa falha individual; não significa sem responsabilidade.', true, 'se pessoas são punidas, escondem erros, e a organização não corrige seus sistemas.'),
          opc('b', 'Ninguém é responsável por nada.', false, 'blameless não é sem responsabilidade.'),
          opc('c', 'Apagar o nome de quem executou a ação.', false, 'o ponto não é o anonimato, e sim a causa estar no sistema.')] },
      { id: 'e04b7-acao', pergunta: 'Quais são as características de uma boa ação de postmortem?',
        opcoes: [
          opc('a', 'Verbo, resultado verificável, @dono e data, no mesmo backlog do produto.', true, 'ações sem dono ou data, fora do backlog, apodrecem e destroem a confiança no processo.'),
          opc('b', '"Tomar mais cuidado ao fazer deploy."', false, 'se a prevenção depende de atenção humana, o sistema não mudou.'),
          opc('c', '"Treinar a equipe."', false, 'não tem dono, data nem verificação.')] },
      { id: 'e04b7-oncall', pergunta: 'Quais parâmetros o livro SRE do Google usa como referência para um on-call sustentável?',
        opcoes: [
          opc('a', 'Ao menos 8 pessoas na rotação em um único fuso (6 por site em dois fusos) e no máximo cerca de 2 incidentes por turno de 12 horas.', true, 'acima disso o problema é o sistema, não o plantonista.'),
          opc('b', 'Duas pessoas e quantos incidentes vierem.', false, 'produz burnout e rotatividade.'),
          opc('c', 'Só os seniores no plantão, porque sabem.', false, 'concentra risco e conhecimento.')] }
    ],
    abas: [
      { rotulo: 'Entender', blocos: [
        { tipo: 'texto', html:
          '<p>A cultura de um time aparece no pior dia. No incidente, as pessoas mostram se acreditam que podem falar o que sabem sem punição; no postmortem, se a organização aprende ou procura culpado. O líder técnico define esse padrão com seus gestos pequenos: quem pergunta primeiro, como reage à má notícia, o que cobra depois. O formato do postmortem e da prática de release está no M04 e no LT04; aqui entram os papéis humanos e o comportamento.</p>' +
          '<h3>Incident commander: coordenar, não consertar</h3>' +
          '<p>Em incidente sério, três papéis separados evitam o caos. O modelo vem de sistemas de comando de incidentes aplicados a operações de software (o capítulo de resposta a incidentes do livro SRE do Google o descreve).</p>' },
        { tipo: 'texto', largo: true, html:
          '<table><thead><tr><th>Papel</th><th>Faz</th><th>Não faz</th></tr></thead><tbody>' +
          '<tr><td><strong>Comandante (IC)</strong></td><td>Mantém a visão do todo, atribui tarefas, decide mitigar versus investigar, decide rollback, delega comunicação</td><td>Mexer no sistema; investigar em profundidade</td></tr>' +
          '<tr><td><strong>Operações / resolvedores</strong></td><td>Executam: investigam, aplicam mitigação, revertem</td><td>Decidir sozinhos algo arriscado sem avisar o IC</td></tr>' +
          '<tr><td><strong>Comunicação</strong></td><td>Atualiza stakeholders em ritmo fixo, mantém a linha do tempo</td><td>Especular sobre causa</td></tr>' +
          '</tbody></table>' },
        { tipo: 'texto', html:
          '<p>Princípios do comandante:</p>' +
          '<ul><li><strong>Mitigar antes de entender.</strong> Rollback, feature flag desligada, desvio de tráfego: restaure o serviço primeiro, investigue depois com calma.</li>' +
          '<li><strong>Uma voz, um canal.</strong> Todas as decisões e hipóteses vão para o canal do incidente, com horário. É a base da linha do tempo.</li>' +
          '<li><strong>Cadência.</strong> Atualização a cada 20 a 30 minutos, mesmo que seja "sem novidade, ainda investigando X". Silêncio gera ansiedade e interrupções.</li>' +
          '<li><strong>Passagem de comando explícita.</strong> Em incidente longo, o IC cansa: "Passo o comando para a Beatriz. Beatriz, confirma?" "Assumo o comando."</li>' +
          '<li><strong>Hipóteses em voz alta</strong>, descartadas por evidência, uma por vez, com dono.</li></ul>' },
        { tipo: 'codigo', linguagem: 'text', texto:
          'Mensagem de abertura (IC):\n' +
          '"14:05 UTC. Sou o IC. Impacto: importação de extratos retorna 500 para ~30% dos\n' +
          'clientes desde 13:52. Beatriz e Caio investigam, Marina é comunicação.\n' +
          'Hipótese inicial: deploy d020 das 13:30. Primeira ação: avaliar rollback.\n' +
          'Próxima atualização às 14:30, ou antes se mudar algo."\n\n' +
          'Atualização (comunicação, a cada 30 min):\n' +
          '"14:30 UTC. Rollback do d020 concluído às 14:18. Taxa de erro caiu de 30% para 1%.\n' +
          'Monitorando por 30 min antes de encerrar. Causa ainda em investigação."' },
        { tipo: 'takeaway', html: 'O comandante <mark>coordena e comunica</mark>; quem tem as mãos no sistema executa. <mark>Mitigar antes de entender</mark>.' }
      ] },

      { rotulo: 'Ver funcionando', blocos: [
        { tipo: 'texto', html:
          '<h3>Postmortem blameless</h3>' +
          '<p><strong>Blameless</strong> não significa sem responsabilidade; significa localizar a causa nas condições do sistema e nas decisões razoáveis dadas as informações da hora, não numa falha individual. O argumento é prático: se pessoas são punidas por erros, escondem erros, e uma organização que não vê erros não corrige seus sistemas. A tradição vem da segurança aeronáutica e foi popularizada em software por John Allspaw (Etsy) e pelo capítulo de cultura de postmortem do livro SRE do Google.</p>' +
          '<p>O template do lab (<code>templates/postmortem.md</code>) tem: resumo em três frases, impacto numérico, linha do tempo em UTC (um fato por linha), causas contribuintes (no plural, em camadas), o que funcionou e ações com verbo, resultado verificável, @dono e data. O linter <code>leadkit check postmortem</code> barra o que é mecânico: seção vazia, "erro humano"/"culpa"/"negligência" e ação sem dono ou prazo. Faça a previsão e rode (saída real do laboratório).</p>' },
        { tipo: 'rode', id: 'b7-rode', titulo: 'O linter nos postmortems ruim e bom', obrigatorio: true,
          enunciado: 'Rode o linter nos dois exemplos do laboratório.',
          prefixo: '$', entrada: 'python -m leadkit check postmortem exemplos/postmortem-ruim.md', unidade: 'ms', terminalTitulo: 'leadkit check postmortem',
          prever: { pergunta: 'O postmortem-ruim.md atribui a causa a uma pessoa em duas linhas e tem duas ações sem dono ou prazo. Quantos achados o linter relata?', opcoes: [
            { id: 'a', texto: '2: só as causas com culpa.', correta: false, porque: 'as ações sem @dono e data também são barradas.' },
            { id: 'b', texto: '4: duas causas atribuídas a pessoa e duas ações sem dono ou prazo.', correta: true, porque: 'cada linha ruim vira um achado com seu código.' },
            { id: 'c', texto: '1: ele agrupa tudo.', correta: false, porque: 'o linter lista um achado por linha.' }
          ] },
          etapas: [
            { id: 'ruim', nome: 'postmortem-ruim.md', descricao: 'Quatro achados, exit 1', tom: 'request', ms: 30, linhas: [
              L('cmd', 'python -m leadkit check postmortem exemplos/postmortem-ruim.md'),
              L('out', 'postmortem-ruim.md:5: [julgamento] causa atribuída a pessoa; descreva a condição do sistema que permitiu o erro'),
              L('out', 'postmortem-ruim.md:18: [julgamento] causa atribuída a pessoa; descreva a condição do sistema que permitiu o erro'),
              L('out', 'postmortem-ruim.md:22: [acao-sem-dono-ou-prazo] ação precisa de @dono e data AAAA-MM-DD'),
              L('out', 'postmortem-ruim.md:23: [acao-sem-dono-ou-prazo] ação precisa de @dono e data AAAA-MM-DD'),
              L('out', '4 problema(s)'),
              L('hint', 'exit=1')] },
            { id: 'bom', nome: 'postmortem-bom.md', descricao: 'Estrutura ok, exit 0', tom: 'response', ms: 25, linhas: [
              L('cmd', 'python -m leadkit check postmortem exemplos/postmortem-bom.md'),
              L('in', 'postmortem-bom.md: ok (postmortem)'),
              L('hint', 'exit=0')] }
          ] },
        { tipo: 'texto', largo: true, html:
          '<table><thead><tr><th>Em vez de (culpa)</th><th>Escreva (sistema)</th></tr></thead><tbody>' +
          '<tr><td>"Causa raiz: erro humano. O Caio rodou a migração em produção."</td><td>"Contribuíram: (1) o runbook não distinguia o terminal de produção do de homologação; (2) a migração não tinha verificação de ambiente; (3) o alerta de latência não existe para esse endpoint, e a detecção veio de reclamação de cliente 38 minutos depois."</td></tr>' +
          '<tr><td>"Ação: tomar mais cuidado ao fazer deploy."</td><td>"Ação: exigir confirmação do nome do ambiente em migrações destrutivas. @caio 2026-10-30."</td></tr>' +
          '<tr><td>"Deveríamos ter testado mais."</td><td>"Ação: adicionar teste de contrato para o formato de extrato com campo opcional ausente. @marina 2026-10-23. Verificação: o teste falha no commit que causou o incidente."</td></tr>' +
          '</tbody></table>' },
        { tipo: 'texto', html:
          '<p>Perguntas do facilitador para sair da culpa: "O que tornou essa ação razoável naquele momento?", "O que, no sistema, teria impedido ou detectado antes?", "Como a próxima pessoa teria evitado isso sem ser mais cuidadosa?". A terceira é a mais forte: se a prevenção depende de atenção humana, ela vai falhar de novo.</p>' +
          '<p>Duas práticas finais: (1) a reunião de postmortem acontece em até cinco dias úteis, com o documento já rascunhado e os envolvidos presentes; (2) as ações entram no mesmo backlog do trabalho de produto, com prioridade visível. Postmortem cujas ações apodrecem destrói a confiança no processo mais rápido do que nenhum postmortem.</p>' },
        { tipo: 'callout', tom: 'danger', titulo: 'Armadilha que pega sênior: blameless na teoria, culpado na prática', html:
          '<p>O documento diz "causas contribuintes", mas na reunião você pergunta "e quem aprovou isso?" ou o gerente da pessoa recebe um e-mail. Em um mês ninguém escreve mais com honestidade. <strong>Teste:</strong> depois do último incidente, alguém foi tratado diferente na avaliação, no escalonamento ou na conversa de corredor? Se sim, nenhum template conserta.</p>' },
        { tipo: 'takeaway', html: 'Causas <mark>contribuintes em camadas</mark>; ações com <mark>verbo, @dono, data e verificação</mark>.' }
      ] },

      { rotulo: 'Praticar', blocos: [
        { tipo: 'texto', html:
          '<p>Escreva uma versão didática do linter de postmortem. O padrão de culpa segue o mesmo princípio do <code>leadkit</code>: expressões comparadas sem acento nem caixa, com limite de palavra, para não acusar "desculpa" por causa de "culpa".</p>' },
        { tipo: 'python', id: 'b7-python', titulo: 'Linter de postmortem blameless', obrigatorio: false,
          enunciado: 'Implemente <code>verificar_postmortem(causas, acoes)</code>: devolve os achados <code>("CULPA", i)</code> e <code>("ACAO", i)</code>, as causas primeiro e depois as ações, em ordem.',
          codigo: codigo, testes: testes,
          dica: 'Aplique <code>re.search(CULPA, sem_acento(causa))</code>. Para a ação, exija <code>re.search(DONO, acao)</code> E <code>re.search(DATA, acao)</code>; uma data como "30/10" não casa com <code>AAAA-MM-DD</code>.',
          solucao: solucao,
          tutorDepois: 'O linter barra o mecânico, não a culpa na reunião: ele não vê quem recebeu o e-mail do gerente.',
          callout: 'O linter reproduz o diagnóstico do lab: causa atribuída a pessoa e ação sem @dono ou data.' },
        { tipo: 'texto', html:
          '<p>Agora leia o canal de um incidente. O IC é você. Duas decisões contradizem o que o bloco ensina.</p>' },
        { tipo: 'transcript', id: 'b7-transcript', titulo: 'Ache as decisões erradas do comandante', obrigatorio: false,
          enunciado: 'A importação de extratos retorna 500 para cerca de 30% dos clientes; houve deploy 20 minutos antes e a causa não está clara. Clique nas linhas em que o IC (você) erra e aperte Conferir.',
          linhas: [
            { quem: 'ferramenta', texto: '13:52 alerta: importação retorna 500 para ~30% dos clientes' },
            { quem: 'voce', texto: '14:05 UTC. Sou o IC. Beatriz e Caio investigam, Marina é comunicação. Hipótese inicial: deploy d020 das 13:30. Primeira ação: avaliar rollback. Próxima atualização às 14:30.' },
            { quem: 'agente', texto: 'Beatriz: abri o painel de erros e estou olhando o d020.' },
            { quem: 'voce', texto: 'Vou entrar no servidor eu mesmo para depurar o pool de conexões enquanto a Beatriz reverte.' },
            { quem: 'agente', texto: 'Caio: rollback do d020 concluído às 14:18.' },
            { quem: 'ferramenta', texto: '14:19 taxa de erro: 30% -> 1%' },
            { quem: 'voce', texto: 'Monitoramos por 30 minutos antes de encerrar. A Marina atualiza às 14:30.' },
            { quem: 'voce', texto: 'Depois disso, sem novidade até acharmos a causa raiz: não vamos atualizar o canal para não especular.' }
          ],
          erradas: [3, 7],
          explicacao: {
            3: 'o IC coordena e delega; quem mexe no sistema são os resolvedores. Investigar em profundidade é papel de Beatriz e Caio.',
            7: 'a cadência é fixa, mesmo sem novidade ("sem novidade, ainda investigando X"). Silêncio gera ansiedade e interrupções; não especular é papel da comunicação, não motivo para calar.'
          } },
        { tipo: 'takeaway', html: 'O IC <mark>coordena</mark>, a comunicação mantém <mark>cadência</mark>, e a causa vem depois da <mark>mitigação</mark>.' }
      ] },

      { rotulo: 'Conferir', blocos: [
        { tipo: 'abas', rotulo: 'Para consolidar', itens: [
          { rotulo: 'On-call sustentável', blocos: [
            { tipo: 'texto', html:
              '<p>On-call mal desenhado produz burnout e rotatividade, justamente das pessoas que conhecem o sistema. Parâmetros práticos que você pode defender:</p>' +
              '<ul><li><strong>Rotação grande o bastante.</strong> O livro SRE do Google calcula ao menos 8 pessoas para um plantão em um único fuso e 6 por site em dois fusos, para que cada pessoa fique de plantão uma fração pequena do tempo. Com menos, reduza o escopo do que page ou divida a rotação com outro time.</li>' +
              '<li><strong>Orçamento de alertas.</strong> O livro SRE usa como referência no máximo cerca de 2 incidentes por turno de 12 horas; se um plantão recebe mais que isso em média, o problema é o sistema, não o plantonista. Meça páginas por turno e proporção de alertas acionáveis.</li>' +
              '<li>Todo alerta que acorda alguém precisa ser <strong>acionável, urgente e ter runbook</strong>. Os demais viram ticket para o horário comercial.</li>' +
              '<li><strong>Compensação e descanso.</strong> Folga após noite com incidente; pagamento ou compensação clara. Pessoas que se sentem exploradas saem.</li>' +
              '<li>Passagem de turno escrita (o que está aberto, o que está frágil, o que mudou).</li>' +
              '<li>Revisão trimestral do plantão: os 3 alertas mais frequentes viram trabalho de engenharia.</li></ul>' +
              '<p>Com IA, a tentação é acrescentar alertas gerados sem critério ou usar o agente como primeira linha de triagem. Pode funcionar para classificação e coleta de contexto (logs, deploys recentes), mas ações em produção continuam com humano no circuito e política de permissão mínima (detalhe no LT04).</p>' }
          ] },
          { rotulo: 'Executivos', blocos: [
            { tipo: 'texto', html:
              '<p>Um executivo tem 3 minutos, muitas prioridades e decide com o que você entrega. Estrutura que funciona (<strong>BLUF</strong>, bottom line up front): (1) conclusão e pedido primeiro ("Precisamos de duas pessoas por seis semanas para a migração, ou aceitar risco de segurança a partir de março."); (2) por que agora (dinheiro, prazo, cliente ou risco regulatório); (3) duas ou três opções e a recomendação, com o custo de cada uma; (4) riscos e o sinal observável; (5) o que você precisa dele e para quando.</p>' },
            { tipo: 'texto', largo: true, html:
              '<table><thead><tr><th>Evite</th><th>Prefira</th></tr></thead><tbody>' +
              '<tr><td>"Estamos com muita dívida técnica."</td><td>"Cada release custa hoje 6 dias a mais que há um ano; isso retira 15% da capacidade."</td></tr>' +
              '<tr><td>"O sistema caiu por causa de uma race condition no pool de conexões."</td><td>"A importação ficou indisponível por 52 minutos para 30% dos clientes. A causa foi um limite de conexões que subimos no deploy anterior. Revertemos, e adicionamos um alerta e um teste de carga."</td></tr>' +
              '<tr><td>"Temos 95% de confiança."</td><td>"Em 85 de cada 100 cenários simulados terminamos em 32 dias; em 95 de 100, em 35."</td></tr>' +
              '</tbody></table>' },
            { tipo: 'texto', html:
              '<p>Em crise, o executivo precisa saber três coisas: o que está acontecendo (impacto), o que estamos fazendo (mitigação) e quando saberemos mais. Não adivinhe a causa; diga o que sabe, o que não sabe e quando atualizará. Má notícia tarde é pior que má notícia incompleta agora.</p>' }
          ] },
          { rotulo: 'Cultura e trade-offs', blocos: [
            { tipo: 'texto', html:
              '<p>Cultura é o conjunto das coisas que você recompensa e tolera. Gestos de baixo custo e alto efeito: agradecer publicamente quem trouxe uma má notícia cedo; admitir seu próprio erro no postmortem como primeiro exemplo; recusar o atalho que viola o acordo mesmo sob pressão (uma vez, em público); proteger o tempo de foco do time (reuniões concentradas, dias sem reunião); e não pedir ao time o que você mesmo evita.</p>' +
              '<ul><li><strong>Rapidez de resposta versus descanso.</strong> Recompensar heroísmo noturno ensina que o sistema precisa de heróis.</li>' +
              '<li><strong>Transparência versus pânico.</strong> Comunicar cedo exige comunicar com calibragem: fato, impacto, próximo passo.</li>' +
              '<li><strong>Postmortem para todos os incidentes versus só os graves.</strong> Defina limiar (severidade, impacto em cliente, quase-acidente instrutivo). Incidentes pequenos recebem versão curta.</li></ul>' +
              '<p>Erros comuns: comandante que vira o melhor resolvedor e deixa o canal sem coordenação; postmortem que termina em "treinar a equipe" ou "tomar mais cuidado"; ações sem dono ou data, sem acompanhamento na semana seguinte; plantão só dos seniores "porque eles sabem"; reportar a executivos o jargão da causa em vez do impacto.</p>' }
          ] }
        ] },
        { tipo: 'escolha', id: 'b7-esc1', titulo: 'Decisão do comandante',
          pergunta: 'Incidente sério em andamento; houve deploy 20 minutos antes do início, mas a causa não está clara. Qual a decisão do comandante?',
          opcoes: [
            { id: 'a', texto: 'Avaliar rollback agora: mitigar antes de entender, investigar depois com calma.', correta: true, porque: 'o IC coordena e decide mitigar; logs e a linha do tempo preservam a evidência.' },
            { id: 'b', texto: 'Esperar identificar a causa raiz para não mascarar a evidência.', correta: false, porque: 'prolonga o impacto; logs e linha do tempo já preservam a evidência.' },
            { id: 'c', texto: 'Entrar no sistema para ajudar a depurar.', correta: false, porque: 'o IC não mexe no sistema nem investiga em profundidade.' }
          ] },
        { tipo: 'escolha', id: 'b7-esc2', titulo: 'Rascunho do postmortem',
          pergunta: 'O rascunho diz "causa raiz: erro humano, o Caio rodou a migração em produção". O que fazer?',
          opcoes: [
            { id: 'a', texto: 'Manter, porque nomear o responsável dá accountability.', correta: false, porque: 'o blameless localiza a causa nas condições do sistema.' },
            { id: 'b', texto: 'Reescrever com causas contribuintes em camadas (runbook ambíguo, sem verificação de ambiente, sem alerta) e ações com dono, data e verificação.', correta: true, porque: 'se a prevenção depende de atenção humana, o sistema não mudou.' },
            { id: 'c', texto: 'Trocar por "tomar mais cuidado ao fazer deploy".', correta: false, porque: 'é a ação que o linter barra: sem dono, data nem verificação.' }
          ] },
        { tipo: 'takeaway', html: 'Com executivos, comece pela <mark>conclusão, o impacto e o pedido</mark>. Cultura é o que você <mark>repete</mark>.' }
      ] }
    ]
  });
})();
