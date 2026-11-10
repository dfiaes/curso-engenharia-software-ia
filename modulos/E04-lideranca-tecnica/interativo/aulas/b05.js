/* E04 · Bloco 5: Desenvolver pessoas. Fonte: E04.html#b05. Saídas do leadkit check sbi são execuções reais do laboratório. */
(function () {
  var L = function (kind, text) { return { kind: kind, text: text }; };
  function opc(id, texto, correta, porque) { return { id: id, texto: texto, correta: correta, porque: porque }; }

  var codigo = `import unicodedata

JULGAMENTO = ["sempre", "nunca", "agressiv", "arrogante", "preguic", "desleix", "irresponsave",
              "imatur", "quiet", "egois", "ma vontade", "atitude", "postura", "voce e",
              "displicen", "negligente", "desinteress"]


def normalizar(texto):
    """Minúsculas e sem acentos: "Você é" vira "voce e"."""
    return texto.lower()


def verificar_sbi(situacao, comportamento, impacto, pedido):
    """Devolve a lista de problemas de um feedback SBI + Pedido, nesta ordem:

      SITUACAO_VAGA         menos de 4 palavras
      COMPORTAMENTO_VAZIO   vazio
      JULGAMENTO            comportamento contém alguma palavra de JULGAMENTO
      IMPACTO_VAZIO         vazio
      PEDIDO_VAZIO          vazio
      PEDIDO_SEM_PERGUNTA   pedido sem "?"  (só se o pedido não estiver vazio)
    """
    return []


print(verificar_sbi("Na review", "Você é agressivo.", "", "Seja gentil"))
`;
  var testes = `BOM = (
    "Na design review de quinta, com sete pessoas",
    "Você interrompeu a Marina duas vezes antes de ela terminar o slide 3 e disse 'isso não vai funcionar' sem citar o cenário",
    "Ela parou de apresentar e o grupo ficou 10 minutos sem discutir",
    "Na próxima, deixe o apresentador terminar e escreva sua objeção no documento um dia antes. Combinamos de rever isso no 1:1 de quinta?",
)


def test_feedback_bom_sem_problemas():
    assert verificar_sbi(*BOM) == []


def test_julgamento_no_comportamento():
    s, c, i, p = BOM
    assert "JULGAMENTO" in verificar_sbi(s, "Você é agressivo nas reviews.", i, p)
    assert "JULGAMENTO" in verificar_sbi(s, "Você SEMPRE corta a palavra dos outros", i, p)


def test_normaliza_acentos_e_caixa():
    assert normalizar("Você é") == "voce e"
    assert normalizar("PREGUIÇA") == "preguica"


def test_partes_vazias_e_pedido_sem_pergunta():
    s, c, i, p = BOM
    assert verificar_sbi(s, "", i, p) == ["COMPORTAMENTO_VAZIO"]
    assert verificar_sbi(s, c, "", p) == ["IMPACTO_VAZIO"]
    assert verificar_sbi(s, c, i, "") == ["PEDIDO_VAZIO"]
    assert verificar_sbi(s, c, i, "Seja mais gentil na próxima.") == ["PEDIDO_SEM_PERGUNTA"]
    assert verificar_sbi("Ontem", c, i, p) == ["SITUACAO_VAGA"]


def test_controle_negativo_julgamento_so_vale_no_comportamento():
    s, c, i, p = BOM
    assert verificar_sbi(s, c, "O time ficou sem postura clara e sempre sem direção", p) == []
`;
  var solucao = `import unicodedata

JULGAMENTO = ["sempre", "nunca", "agressiv", "arrogante", "preguic", "desleix", "irresponsave",
              "imatur", "quiet", "egois", "ma vontade", "atitude", "postura", "voce e",
              "displicen", "negligente", "desinteress"]


def normalizar(texto):
    decomposto = unicodedata.normalize("NFKD", texto.lower())
    return "".join(c for c in decomposto if not unicodedata.combining(c))


def verificar_sbi(situacao, comportamento, impacto, pedido):
    problemas = []
    if len(situacao.split()) < 4:
        problemas.append("SITUACAO_VAGA")
    if not comportamento.strip():
        problemas.append("COMPORTAMENTO_VAZIO")
    elif any(p in normalizar(comportamento) for p in JULGAMENTO):
        problemas.append("JULGAMENTO")
    if not impacto.strip():
        problemas.append("IMPACTO_VAZIO")
    if not pedido.strip():
        problemas.append("PEDIDO_VAZIO")
    elif "?" not in pedido:
        problemas.append("PEDIDO_SEM_PERGUNTA")
    return problemas
`;

  TrilhaAula.registrar({
    id: 'e04-b5',
    titulo: 'Desenvolver pessoas: mentoria, delegação, feedback, 1:1, contratação e o júnior na era da IA',
    minutos: 40,
    resumo: 'Seu teto como líder é a capacidade das pessoas que você desenvolveu. E, na era da IA, há uma pergunta nova: se um agente faz o trabalho que antes treinava o júnior, como se forma o próximo sênior?',
    objetivo: 'Diferenciar mentoria, coaching e sponsorship, delegar resultado com contrato, dar feedback em SBI + Pedido, conduzir 1:1, montar uma rubrica de contratação e reorganizar o aprendizado do júnior com agentes.',
    revisao: [
      { id: 'e04b5-tres', pergunta: 'Qual a diferença entre mentoria, coaching e sponsorship?',
        opcoes: [
          opc('a', 'Mentoria compartilha experiência; coaching pergunta para a pessoa chegar à própria conclusão; sponsorship usa seu capital para dar visibilidade e oportunidade.', true, 'mentoria custa tempo; sponsorship custa reputação, por isso é o mais raro e valioso.'),
          opc('b', 'São nomes diferentes da mesma prática.', false, 'cada uma tem frase típica, momento e custo diferentes para você.'),
          opc('c', 'Sponsorship é dar conselhos; mentoria é indicar para vagas.', false, 'inverte as definições.')] },
      { id: 'e04b5-contrato', pergunta: 'O que entra num contrato de delegação de seis linhas?',
        opcoes: [
          opc('a', 'Resultado esperado, por que importa, limites, critério de pronto, checkpoints e seu papel.', true, 'ajuste a intensidade pelo par competência × risco.'),
          opc('b', 'Só o prazo e o responsável.', false, 'sem limites e critério de pronto, o sintoma é ser surpreendido.'),
          opc('c', 'O passo a passo detalhado da implementação.', false, 'é micro-gestão; delegar é transferir o resultado com contexto e critério.')] },
      { id: 'e04b5-sbi', pergunta: 'Quais são as partes do feedback SBI + Pedido e o que é um Comportamento bem escrito?',
        opcoes: [
          opc('a', 'Situação, Comportamento, Impacto e Pedido; o Comportamento é o que uma câmera registraria, sem adjetivo, "sempre/nunca" ou diagnóstico de intenção.', true, 'o Pedido é verificável e termina com uma pergunta aberta.'),
          opc('b', 'Sentimento, Bronca, Intenção e Prazo.', false, 'não é o modelo.'),
          opc('c', 'Elogio, crítica, elogio e despedida.', false, 'o sanduíche dilui o elogio e a crítica.')] },
      { id: 'e04b5-1on1', pergunta: 'Quais são sinais de alerta num 1:1?',
        opcoes: [
          opc('a', 'Respostas que viram "tudo bem", cancelamento duas vezes seguidas e a pessoa parar de trazer pauta: informação sobre confiança, não sobre agenda.', true, 'o 1:1 é da pessoa, não seu.'),
          opc('b', 'A pessoa trazer muitas pautas.', false, 'é o comportamento saudável.'),
          opc('c', 'O 1:1 durar mais que o planejado.', false, 'duração não é o sinal citado.')] },
      { id: 'e04b5-junior', pergunta: 'Qual a resposta do bloco para formar juniores quando o agente faz o trabalho pequeno?',
        opcoes: [
          opc('a', 'Não proibir o agente: entender antes de aceitar, depurar bugs reais, escrever à mão o fundamental, participar de decisões e interrogar o agente.', true, 'o agente é um tutor paciente que também mente com confiança.'),
          opc('b', 'Proibir o agente para juniores.', false, 'a resposta não é proibir, e sim reorganizar o aprendizado.'),
          opc('c', 'Medir o júnior pelo volume entregue com agentes.', false, 'os critérios incluem verificação, depuração e comunicação, não só volume.')] }
    ],
    abas: [
      { rotulo: 'Entender', blocos: [
        { tipo: 'texto', html:
          '<p>Seu teto como líder é a capacidade das pessoas que você desenvolveu. Cada pessoa promovida, cada decisão delegada, cada contratação certa multiplica o que você consegue. E, na era da IA, há uma pergunta nova: se um agente faz o trabalho que antes treinava o júnior, como se forma o próximo sênior? Quem não responde isso conscientemente descobre em três anos que não tem pipeline de talento.</p>' +
          '<h3>Mentoria, coaching e sponsorship: três coisas diferentes</h3>' },
        { tipo: 'texto', largo: true, html:
          '<table><thead><tr><th>Prática</th><th>O que você faz</th><th>Frase típica</th><th>Quando</th></tr></thead><tbody>' +
          '<tr><td><strong>Mentoria</strong></td><td>Compartilha experiência e contexto</td><td>"Quando passei por isso, o que me ajudou foi..."</td><td>A pessoa quer atalhos de quem já viu o problema</td></tr>' +
          '<tr><td><strong>Coaching</strong></td><td>Faz perguntas para a pessoa chegar à própria conclusão</td><td>"O que você já tentou? Se tivesse que escolher uma hipótese, qual seria?"</td><td>A pessoa sabe o suficiente e precisa estruturar o raciocínio</td></tr>' +
          '<tr><td><strong>Sponsorship</strong></td><td>Usa seu capital para dar à pessoa visibilidade e oportunidade</td><td>"Indiquei você para liderar a migração; falei com a diretora sobre o seu trabalho."</td><td>A pessoa está pronta e falta acesso</td></tr>' +
          '</tbody></table>' },
        { tipo: 'texto', html:
          '<p>A diferença é de custo para você. Mentoria custa tempo; sponsorship custa reputação, porque você arrisca seu nome. Por isso é o mais raro e o mais valioso. Um líder que só faz mentoria desenvolve pessoas que sabem, mas não chegam onde as decisões são tomadas.</p>' +
          '<h3>Delegação: o que, para quem, com que contrato</h3>' +
          '<p>Delegar não é descartar. É transferir <strong>responsabilidade pelo resultado</strong> com contexto, critério e acompanhamento proporcional ao risco. Um contrato de delegação cabe em seis linhas:</p>' },
        { tipo: 'codigo', linguagem: 'text', texto:
          'Resultado esperado:   Migrar o job de conciliação noturna para a fila nova.\n' +
          'Por que importa:      Elimina os 3 timeouts/mês e libera o fechamento de novembro.\n' +
          'Limites:              Decide sozinha desenho interno e biblioteca. Me consulta se\n' +
          '                      mudar o contrato do evento publicado ou o custo mensal > R$ 500.\n' +
          'Critério de pronto:   Duas semanas sem timeout, dashboard de fila, runbook revisado.\n' +
          'Checkpoints:          Terça e sexta, 15 min. Primeiro: desenho em 1 página até quinta.\n' +
          'Meu papel:            Revisor do desenho e patrocinador com o time de plataforma.' },
        { tipo: 'texto', html:
          '<p>Ajuste a intensidade pelo par <strong>competência × risco</strong>: pessoa nova em área crítica ganha checkpoints curtos e frequentes; pessoa experiente em área de baixo risco ganha autonomia e um check de resultado. O erro oposto à micro-gestão é a abdicação, e ambos têm o mesmo sintoma: você é surpreendido. E delegue as tarefas boas também: um líder que fica com o trabalho interessante e delega só o burocrático ensina ao time que crescimento não é para eles.</p>' +
          '<h3>1:1 que funciona</h3>' +
          '<p>O 1:1 é da pessoa, não seu. O roteiro em <code>templates/one-on-one.md</code>: abertura aberta ("o que está na sua cabeça?", com silêncio de 10 segundos), pauta da pessoa, carreira em semanas alternadas, feedback nos dois sentidos e fecho com compromissos relidos. Mantenha um registro privado compartilhado só com a pessoa. Sinais de alerta: respostas que viram "tudo bem", cancelamento duas vezes seguidas, a pessoa para de trazer pauta; qualquer um é informação sobre confiança, não sobre agenda.</p>' +
          '<p>Perguntas de reserva que produzem sinal: "Qual tarefa dos últimos 15 dias você evitaria repetir?"; "Em que decisão você sentiu que não teve voz?"; "Se você fosse a tech lead, o que mudaria primeiro?". Para carreira: "Em seis meses, o que você gostaria de fazer que hoje não faz? O que falta e qual é o próximo passo concreto?".</p>' },
        { tipo: 'takeaway', html: 'Mentoria passa <mark>experiência</mark>, coaching estrutura <mark>raciocínio</mark>, sponsorship arrisca <mark>capital</mark>. Delegue <mark>resultado</mark> com limites e critério de pronto.' }
      ] },

      { rotulo: 'Ver funcionando', blocos: [
        { tipo: 'texto', html:
          '<h3>Feedback SBI</h3>' +
          '<p><strong>SBI</strong> (Situação, Comportamento, Impacto), do Center for Creative Leadership, funciona porque separa o observável do interpretado. Acrescentamos o <strong>Pedido</strong> porque feedback sem pedido é descrição sem direção.</p>' +
          '<ul><li><strong>Situação:</strong> quando e onde, específico. "Na review de quinta, com sete pessoas."</li>' +
          '<li><strong>Comportamento:</strong> o que uma câmera registraria. Sem adjetivo, sem "sempre/nunca", sem diagnóstico de intenção.</li>' +
          '<li><strong>Impacto:</strong> o efeito concreto em você, no time, no produto. Aqui cabe sentimento, se verdadeiro e sóbrio.</li>' +
          '<li><strong>Pedido:</strong> o que você quer daqui para frente, verificável. Termine com uma pergunta aberta.</li></ul>' },
        { tipo: 'texto', largo: true, html:
          '<table><thead><tr><th>Ruim (julgamento)</th><th>Bom (SBI)</th></tr></thead><tbody>' +
          '<tr><td>"Você é agressivo nas reviews."</td><td>"Na design review de quinta (S), você interrompeu a Marina duas vezes antes de ela terminar o slide 3 e disse \'isso não vai funcionar\' sem citar o cenário (B). Ela parou de apresentar e o grupo ficou 10 minutos sem discutir; eu saí sem saber que risco você via (I). Na próxima, deixe o apresentador terminar e escreva sua objeção no documento um dia antes, com o cenário que falha. Combinamos de rever isso no 1:1 de quinta? (P)"</td></tr>' +
          '<tr><td>"Você é muito quieto."</td><td>"Nas últimas três dailies (S), você disse \'sem bloqueios\' e na quarta descobri pelo Caio que a integração estava parada há dois dias (B). Perdemos o prazo de dependência e o Caio replanejou sem você (I). Quando algo estiver parado mais de um dia, escreva uma linha no canal do time. O que dificulta isso hoje? (P)"</td></tr>' +
          '</tbody></table>' },
        { tipo: 'texto', html:
          '<p>O lab inclui <code>exemplos/sbi-ruim.md</code> e <code>sbi-bom.md</code> e um linter (<code>leadkit check sbi</code>) que detecta palavras de julgamento no Comportamento, seções vazias e TODO esquecido. É um exercício de calibragem, não um substituto de juízo: você ainda precisa ler o feedback com os olhos de quem recebe. Faça a previsão e rode (saída real do laboratório).</p>' },
        { tipo: 'rode', id: 'b5-rode', titulo: 'O linter de SBI no exemplo ruim e no bom', obrigatorio: true,
          enunciado: 'Rode o linter nos dois exemplos do laboratório.',
          prefixo: '$', entrada: 'python -m leadkit check sbi exemplos/sbi-ruim.md', unidade: 'ms', terminalTitulo: 'leadkit check sbi',
          prever: { pergunta: 'O sbi-ruim.md tem julgamento no Comportamento, a seção Pedido vazia e um TODO esquecido. Quantos problemas o linter relata?', opcoes: [
            { id: 'a', texto: '1: ele para no primeiro.', correta: false, porque: 'o linter lista todos os achados, com a linha de cada um.' },
            { id: 'b', texto: '3: julgamento, seção vazia e placeholder.', correta: true, porque: 'cada achado tem um código: julgamento, secao-vazia e placeholder.' },
            { id: 'c', texto: '0: ele só avisa e não conta.', correta: false, porque: 'o linter devolve exit 1 e a contagem de problemas.' }
          ] },
          etapas: [
            { id: 'ruim', nome: 'sbi-ruim.md', descricao: 'Três achados, exit 1', tom: 'request', ms: 30, linhas: [
              L('cmd', 'python -m leadkit check sbi exemplos/sbi-ruim.md'),
              L('out', 'sbi-ruim.md:9: [julgamento] julgamento ou generalização no Comportamento; descreva o que foi visto/ouvido'),
              L('out', "sbi-ruim.md:15: [secao-vazia] seção 'pedido' sem conteúdo"),
              L('out', 'sbi-ruim.md:17: [placeholder] TODO ainda no documento'),
              L('out', '3 problema(s)'),
              L('hint', 'exit=1')] },
            { id: 'bom', nome: 'sbi-bom.md', descricao: 'Estrutura ok, exit 0', tom: 'response', ms: 25, linhas: [
              L('cmd', 'python -m leadkit check sbi exemplos/sbi-bom.md'),
              L('in', 'sbi-bom.md: ok (sbi)'),
              L('hint', 'exit=0')] }
          ] },
        { tipo: 'texto', html:
          '<p>Feedback positivo usa a mesma estrutura e é subusado: "No incidente de terça (S), você pediu rollback antes de investigar a causa (B). Isso reduziu o impacto de 40 para 12 minutos (I). Continue priorizando mitigação (P)". É a forma mais barata de reforçar comportamento que você quer ver repetido. Não misture elogio e crítica no mesmo SBI ("sanduíche"): o elogio perde valor e a crítica se dilui.</p>' },
        { tipo: 'takeaway', html: 'SBI + Pedido, <mark>sem adjetivos</mark>: o Comportamento é o que uma <mark>câmera</mark> registraria.' }
      ] },

      { rotulo: 'Praticar', blocos: [
        { tipo: 'texto', html:
          '<p>Escreva a versão didática do verificador de SBI. A peça-chave é <code>normalizar</code>: o feedback chega com acento e caixa alta, e a lista de julgamento está sem acento. O linter real do <code>leadkit</code> usa outra lista de palavras; o princípio é o mesmo.</p>' },
        { tipo: 'python', id: 'b5-python', titulo: 'Verificador de SBI + Pedido', obrigatorio: false,
          enunciado: 'Implemente <code>normalizar</code> e <code>verificar_sbi</code>, com os códigos da docstring. Julgamento só vale no Comportamento.',
          codigo: codigo, testes: testes,
          dica: '<code>unicodedata.normalize("NFKD", texto.lower())</code> separa as letras dos acentos; filtre com <code>unicodedata.combining(c)</code>. Para o pedido: vazio e sem "?" são problemas diferentes, e o segundo só vale se o pedido não for vazio.',
          solucao: solucao,
          tutorDepois: 'O último teste é um controle negativo: "sempre" no Impacto não é julgamento do Comportamento. O verificador também não substitui ler o feedback com os olhos de quem recebe.',
          callout: 'O verificador acusa julgamento e partes vazias, e deixa o juízo de leitura para você.' },
        { tipo: 'escreva', id: 'b5-escreva', titulo: 'Reescreva "Você é muito quieto" em SBI + Pedido', obrigatorio: false,
          enunciado: 'Um colega responde "sem bloqueios" nas dailies, mas a integração dele estava parada há dois dias. Escreva o feedback em quatro partes.',
          placeholder: 'Situação: … Comportamento: … Impacto: … Pedido: …?',
          rubrica: [
            '<strong>Situação</strong> específica (quando e onde).',
            '<strong>Comportamento</strong> observável, sem adjetivo, "sempre/nunca" ou intenção.',
            '<strong>Impacto</strong> concreto no time ou no produto.',
            '<strong>Pedido</strong> verificável, terminando em pergunta aberta.'
          ],
          modelo: '<p>Nas últimas três dailies, você disse "sem bloqueios" e na quarta descobri pelo Caio que a integração estava parada há dois dias. Perdemos o prazo de dependência e o Caio replanejou sem você. Quando algo estiver parado mais de um dia, escreva uma linha no canal do time. O que dificulta isso hoje?</p>' +
            '<p><strong>Reprova:</strong> manter "você é muito quieto" ou esperar a avaliação semestral.</p>' },
        { tipo: 'takeaway', html: 'Feedback bom tem <mark>pedido verificável</mark> e termina em <mark>pergunta aberta</mark>.' }
      ] },

      { rotulo: 'Conferir', blocos: [
        { tipo: 'abas', rotulo: 'Para consolidar', itens: [
          { rotulo: 'Contratação e rubrica', blocos: [
            { tipo: 'texto', html:
              '<p>Entrevista sem rubrica mede carisma e semelhança com o entrevistador. Uma rubrica tem: (1) competências relevantes ao papel (3 a 5), (2) evidência esperada para cada nível, (3) perguntas ou exercício que geram essa evidência, (4) escala com âncoras de comportamento e (5) regra de decisão (quem tem voto, o que é veto). Exemplo para engenheiro sênior de backend em sistema com IA:</p>' },
            { tipo: 'texto', largo: true, html:
              '<table><thead><tr><th>Competência</th><th>Sinal forte</th><th>Sinal fraco</th><th>Como gerar o sinal</th></tr></thead><tbody>' +
              '<tr><td>Desenho sob incerteza</td><td>Pergunta requisitos, nomeia trade-offs, propõe o menor passo reversível</td><td>Vai direto à tecnologia; desenho único sem alternativa</td><td>Caso: "Importação de extratos falha 3% das vezes. Como investigar e desenhar?"</td></tr>' +
              '<tr><td>Julgamento sobre código gerado</td><td>Verifica antes de confiar; sabe quando não usar o agente</td><td>Aceita saída plausível; ou rejeita IA por princípio</td><td>Mostrar PR gerado com 2 defeitos plantados; pedir review em voz alta</td></tr>' +
              '<tr><td>Comunicação escrita</td><td>Texto estruturado, decisão clara, objeções reconhecidas</td><td>Texto longo sem recomendação</td><td>Exercício de 30 min: escrever um mini-RFC sobre o caso</td></tr>' +
              '<tr><td>Colaboração e feedback</td><td>Dá e recebe correção sem defensividade</td><td>Culpa terceiros; evita falar de erros</td><td>Pedir um erro significativo e o que mudou depois</td></tr>' +
              '</tbody></table>' },
            { tipo: 'texto', html:
              '<p>Boas práticas: cada entrevistador pontua antes de conversar com os outros (evita ancoragem); o mesmo exercício para todos os candidatos; pontuação por evidência observada, não por impressão ("senti que..."). Pergunte também sobre o que o candidato não sabe e observe se a resposta é honesta. Erro comum: rubrica criada depois da entrevista para justificar a decisão já tomada.</p>' }
          ] },
          { rotulo: 'O júnior na era da IA', blocos: [
            { tipo: 'texto', html:
              '<p>O trabalho que formava juniores (tarefas pequenas, bem delimitadas, escrever muito código) é exatamente o que o agente faz bem. Risco: o júnior vira operador de agente sem construir o modelo mental que o tornaria sênior. A resposta não é proibir o agente, e sim reorganizar o aprendizado:</p>' +
              '<ul><li><strong>Entender antes de aceitar.</strong> Regra do PR: o autor explica, sem o agente, cada trecho não óbvio. Se não consegue, estuda antes de pedir review.</li>' +
              '<li><strong>Ler muito código e depurar.</strong> A habilidade que o agente não substitui é diagnosticar. Dê bugs reais para investigar com <code>git bisect</code>, logs e debugger, antes de qualquer sugestão do agente.</li>' +
              '<li><strong>Escrever à mão o que é fundamental.</strong> Estruturas de dados, SQL, um cliente HTTP, um parser simples. O objetivo é o modelo mental, não o artefato.</li>' +
              '<li><strong>Exposição a decisões.</strong> Inclua o júnior em design reviews como escriba e depois como autor de um RFC pequeno.</li>' +
              '<li><strong>Revisões como ensino.</strong> Revise o PR do júnior explicando o porquê, não só o quê.</li>' +
              '<li><strong>Progressão por evidência.</strong> Critérios por nível que incluem verificação, depuração e comunicação, não só volume entregue.</li></ul>' +
              '<p>O ponto contraintuitivo: o júnior bom com agentes aprende mais rápido se for ensinado a interrogar o agente ("por que esta abordagem e não aquela?", "qual caso de borda você não cobriu?"). O agente é um tutor paciente que também mente com confiança; o júnior precisa aprender a desconfiar, e isso se ensina.</p>' }
          ] },
          { rotulo: 'Trade-offs e erros', blocos: [
            { tipo: 'texto', html:
              '<ul><li><strong>Feedback imediato versus no 1:1.</strong> Elogio imediato; correção em privado e logo. Segurar correção por semanas piora o impacto e vira ressentimento.</li>' +
              '<li><strong>Delegar o que você faz melhor</strong> custa qualidade no curto prazo para ganhar capacidade. Calcule o ponto de equilíbrio e aceite o buraco.</li>' +
              '<li><strong>Contratar para a cultura versus para a lacuna.</strong> "Adição" de cultura (o que falta) supera "encaixe" (quem é parecido).</li></ul>' +
              '<p>Erros comuns: guardar feedback para a avaliação semestral (ninguém muda comportamento com seis meses de atraso); 1:1 usado como status report. <strong>Armadilha de sênior:</strong> "estilo de gestão" como desculpa para não preparar. Prepare-se 5 minutos antes: releia os compromissos, defina seus dois itens, escreva o SBI que você vai dar. A consistência pesa mais que a eloquência.</p>' }
          ] }
        ] },
        { tipo: 'escolha', id: 'b5-esc1', titulo: 'Comportamento bem escrito',
          pergunta: 'Qual destes é um Comportamento bem escrito em SBI?',
          opcoes: [
            { id: 'a', texto: '"Você é agressivo nas reviews."', correta: false, porque: 'é julgamento, não o que uma câmera registraria.' },
            { id: 'b', texto: '"Você interrompeu a Marina duas vezes antes de ela terminar o slide 3 e disse \'isso não vai funcionar\' sem citar o cenário."', correta: true, porque: 'é o que uma câmera registraria.' },
            { id: 'c', texto: '"Você sempre corta a palavra dos outros."', correta: false, porque: '"sempre" generaliza; o Comportamento é um fato específico.' }
          ] },
        { tipo: 'escolha', id: 'b5-esc2', titulo: 'Qual prática?',
          pergunta: 'Uma pessoa está pronta para liderar a migração, mas ninguém na diretoria conhece o trabalho dela. Qual prática resolve?',
          opcoes: [
            { id: 'a', texto: 'Mentoria: compartilhar o que você viveu em migrações.', correta: false, porque: 'ela já sabe; falta acesso.' },
            { id: 'b', texto: 'Coaching: perguntar qual hipótese ela escolheria.', correta: false, porque: 'ela não precisa estruturar o raciocínio.' },
            { id: 'c', texto: 'Sponsorship: indicá-la para liderar e falar com a diretoria sobre o trabalho dela, arriscando sua reputação.', correta: true, porque: 'sponsorship é para quem está pronto e falta acesso.' }
          ] },
        { tipo: 'takeaway', html: 'Rubrica <mark>antes</mark> da entrevista; júnior com IA: <mark>entender antes de aceitar</mark> e interrogar o agente.' }
      ] }
    ]
  });
})();
