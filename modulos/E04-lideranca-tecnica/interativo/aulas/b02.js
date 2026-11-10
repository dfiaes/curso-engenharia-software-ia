/* E04 · Bloco 2: Decisão em grupo. Fonte: E04.html#b02. */
(function () {
  var L = function (kind, text) { return { kind: kind, text: text }; };
  function opc(id, texto, correta, porque) { return { id: id, texto: texto, correta: correta, porque: porque }; }

  var codigo = `def validar_rfc(rfc):
    """Devolve a lista de problemas mecânicos de um RFC (lista vazia = estrutura ok).

    Códigos, nesta ordem de checagem:
      REVISORES     sem revisores nomeados, ou algum deles é "o time"
      PRAZO         sem data limite de comentários
      TIPO          tipo da decisão diferente de "reversivel" ou "irreversivel"
      ALTERNATIVAS  menos de duas, ou nenhuma delas é "não fazer nada"
      RISCOS        algum risco sem "sinal" observável
      ABERTAS       nenhuma pergunta em aberto
      TODO          a palavra TODO aparece no texto
    """
    problemas = []
    return problemas


rfc = {"revisores": ["o time"], "prazo": None, "tipo": "talvez", "alternativas": ["fila"],
       "riscos": [{"risco": "lag", "sinal": ""}], "abertas": [], "texto": "TODO"}
print(validar_rfc(rfc))
`;
  var testes = `BOM = {
    "revisores": ["Marina", "Caio", "Beatriz"],
    "prazo": "2026-10-20",
    "tipo": "reversivel",
    "alternativas": ["fila durável", "chamada síncrona com retry", "não fazer nada"],
    "riscos": [{"risco": "fila atrasa", "sinal": "p95 do fluxo normal acima de 800 ms"}],
    "abertas": ["Qual o tamanho máximo de extrato aceitável?"],
    "texto": "Mover o processamento de extratos para fila durável.",
}


def com(**mudancas):
    r = dict(BOM)
    r.update(mudancas)
    return r


def test_rfc_bom_nao_tem_problemas():
    assert validar_rfc(BOM) == []


def test_revisor_generico_e_sem_prazo():
    assert "REVISORES" in validar_rfc(com(revisores=["o time"]))
    assert "REVISORES" in validar_rfc(com(revisores=[]))
    assert "PRAZO" in validar_rfc(com(prazo=None))


def test_alternativas_exigem_duas_e_nao_fazer_nada():
    assert "ALTERNATIVAS" in validar_rfc(com(alternativas=["não fazer nada"]))
    assert "ALTERNATIVAS" in validar_rfc(com(alternativas=["fila", "fila com outro broker"]))


def test_risco_sem_sinal_perguntas_e_todo():
    assert "RISCOS" in validar_rfc(com(riscos=[{"risco": "lag", "sinal": ""}]))
    assert "ABERTAS" in validar_rfc(com(abertas=[]))
    assert "TODO" in validar_rfc(com(texto="Decidir depois. TODO"))
    assert "TIPO" in validar_rfc(com(tipo="talvez"))


def test_controle_negativo_estrutura_ok_nao_prova_julgamento():
    ruim_mas_valido = com(texto="Trocar tudo por microsserviços porque sim.")
    assert validar_rfc(ruim_mas_valido) == []
`;
  var solucao = `def validar_rfc(rfc):
    problemas = []
    revisores = rfc.get("revisores") or []
    if not revisores or any(r.strip().lower() == "o time" for r in revisores):
        problemas.append("REVISORES")
    if not rfc.get("prazo"):
        problemas.append("PRAZO")
    if rfc.get("tipo") not in ("reversivel", "irreversivel"):
        problemas.append("TIPO")
    alternativas = rfc.get("alternativas") or []
    if len(alternativas) < 2 or not any("não fazer nada" in a.lower() for a in alternativas):
        problemas.append("ALTERNATIVAS")
    if any(not r.get("sinal") for r in rfc.get("riscos") or []):
        problemas.append("RISCOS")
    if not rfc.get("abertas"):
        problemas.append("ABERTAS")
    if "TODO" in rfc.get("texto", ""):
        problemas.append("TODO")
    return problemas
`;

  TrilhaAula.registrar({
    id: 'e04-b2',
    titulo: 'Decisão em grupo: RFC, design review, ADR e desacordo',
    minutos: 35,
    resumo: 'Times seniores raramente falham por falta de ideias; falham por decisões que ninguém sabe se foram tomadas, quem tomou e com que informação. O processo de decisão é um sistema: entrada, crítica, saída registrada.',
    objetivo: 'Escolher o artefato certo (RFC, design review, ADR), calibrar o esforço pela reversibilidade e fechar um desacordo registrando a objeção e o ponto de revisão.',
    revisao: [
      { id: 'e04b2-artefatos', pergunta: 'Que pergunta cada artefato responde: RFC, design review e ADR?',
        opcoes: [
          opc('a', 'RFC: estamos de acordo com esta direção? Review: que riscos o grupo vê que o autor não viu? ADR: o que foi decidido, por quê e o que descartamos?', true, 'o RFC é assíncrono (5 a 10 dias úteis), a review síncrona (60 min) e o ADR sai em até 24 h.'),
          opc('b', 'Os três respondem "quem é o responsável".', false, 'cada artefato tem uma pergunta própria, e o decisor é nomeado na review.'),
          opc('c', 'O ADR vem antes do RFC para travar o escopo.', false, 'o ADR registra a decisão depois que ela foi tomada.')] },
      { id: 'e04b2-reversivel', pergunta: 'Como calibrar o processo de uma decisão pelo tipo 1 e tipo 2 (Bezos, carta de 2016)?',
        opcoes: [
          opc('a', 'Tipo 2 (mão dupla) rápido, por indivíduos ou grupos pequenos; tipo 1 (mão única) merece processo pesado; e reduza o custo de reverter quando puder.', true, 'o erro das organizações médias é aplicar processo tipo 1 a tudo.'),
          opc('b', 'Todas as decisões passam por RFC completo.', false, 'é processo tipo 1 aplicado a tudo.'),
          opc('c', 'Decisões se calibram pelo cargo de quem decide.', false, 'o critério é o custo e o tempo de voltar atrás.')] },
      { id: 'e04b2-origem', pergunta: 'De onde costuma vir um desacordo técnico entre pessoas competentes, e como tratar cada origem?',
        opcoes: [
          opc('a', 'Fato diferente (traga o fato), valor diferente (explicite o trade-off e deixe o decisor escolher), risco percebido diferente (peça o cenário concreto e o sinal).', true, 'cada origem tem tratamento próprio; votar não resolve nenhuma.'),
          opc('b', 'De falta de hierarquia; resolve-se com votação.', false, 'votar dilui a decisão e não registra o desacordo.'),
          opc('c', 'De personalidade; resolve-se com mais reuniões.', false, 'o bloco mostra três origens técnicas com tratamentos concretos.')] },
      { id: 'e04b2-dac', pergunta: 'Que duas condições tornam "discordo e apoio" legítimo e não coação?',
        opcoes: [
          opc('a', 'Cada lado teve voz antes e existe um ponto de revisão baseado em dado.', true, 'sem o ponto de revisão, vira derrota silenciosa.'),
          opc('b', 'O decisor é o mais sênior e a reunião foi curta.', false, 'senioridade e brevidade não dão legitimidade.'),
          opc('c', 'Todos concordam por escrito sem registrar a objeção.', false, 'a objeção precisa ficar registrada no ADR, com o sinal de revisão.')] },
      { id: 'e04b2-teatro', pergunta: 'Qual destes é um erro comum do processo de decisão?',
        opcoes: [
          opc('a', 'Escrever o RFC depois da decisão tomada: teatro, e o revisor percebe e para de comentar.', true, 'outros erros: design review sem decisor e decisão registrada sem o desacordo.'),
          opc('b', 'Nomear um facilitador diferente do autor.', false, 'é prática recomendada.'),
          opc('c', 'Fixar uma data limite de comentários.', false, 'é prática recomendada; comentário fora da data pede justificativa.')] }
    ],
    abas: [
      { rotulo: 'Entender', blocos: [
        { tipo: 'texto', html:
          '<p>Times seniores raramente falham por falta de ideias. Falham por decisões que ninguém sabe se foram tomadas, quem tomou, com que informação, e que reaparecem seis meses depois. O processo de decisão é um sistema: tem <strong>entrada</strong> (problema e evidência), <strong>processamento</strong> (crítica) e <strong>saída</strong> (decisão registrada). O formato dos documentos, em especial o ADR, está no M04; aqui está o processo humano em volta deles.</p>' +
          '<h3>O fluxo: RFC, design review, ADR</h3>' },
        { tipo: 'texto', largo: true, html:
          '<table><thead><tr><th>Artefato</th><th>Pergunta que responde</th><th>Quando usar</th><th>Prazo típico</th></tr></thead><tbody>' +
          '<tr><td><strong>RFC</strong> (pedido de comentários, assíncrono)</td><td>"Estamos de acordo com esta direção?"</td><td>Mudança que afeta mais de um time, interface pública, dependência nova relevante</td><td>5 a 10 dias úteis de comentários, data limite explícita</td></tr>' +
          '<tr><td><strong>Design review</strong> (síncrona, 60 min)</td><td>"Quais riscos o grupo vê que o autor não viu?"</td><td>Depois que os comentários escritos foram lidos; para os temas que pedem conversa</td><td>Uma reunião; no máximo duas</td></tr>' +
          '<tr><td><strong>ADR</strong></td><td>"O que foi decidido, por quê, e o que descartamos?"</td><td>Decisão difícil de reverter ou que alguém vai questionar depois</td><td>Até 24 h após a decisão</td></tr>' +
          '</tbody></table>' },
        { tipo: 'texto', html:
          '<p>O template do laboratório (<code>templates/rfc.md</code>) impõe o que faz a diferença: <strong>revisores nomeados</strong> (não "o time"), data limite de comentários, tipo de decisão (reversível ou não), no mínimo duas alternativas incluindo "não fazer nada", riscos com sinal observável e uma seção <strong>perguntas em aberto</strong>. A última é a mais valiosa e a mais ausente: um autor que declara o que não sabe mostra ao revisor onde ajudar.</p>' +
          '<h3>Conduzindo uma design review (60 min)</h3>' +
          '<p>O roteiro completo está em <code>templates/design-review.md</code>. A estrutura que sustenta:</p>' +
          '<ul><li><strong>Pergunta explícita.</strong> O convite começa com "o que preciso que o grupo decida ou critique é...". Sem isso, a reunião vira recital de slides.</li>' +
          '<li><strong>Comentário escrito antes.</strong> Quem não leu pede adiamento. Resumir ao vivo para quem não leu pune quem leu.</li>' +
          '<li><strong>Facilitador diferente do autor e decisor nomeado.</strong> O autor defende; o facilitador administra o tempo; o decisor decide.</li>' +
          '<li><strong>Temas ordenados por risco</strong>, cada um terminando em: aceito, ajustar (com dono) ou desacordo registrado.</li>' +
          '<li>Leitura em voz alta das decisões e ações nos últimos cinco minutos.</li></ul>' },
        { tipo: 'takeaway', html: 'RFC assíncrono com <mark>prazo</mark> → design review com <mark>pergunta e decisor</mark> → ADR em <mark>24 h</mark>.' }
      ] },

      { rotulo: 'Ver funcionando', blocos: [
        { tipo: 'texto', html:
          '<h3>Reversível ou irreversível: calibre o esforço</h3>' +
          '<p>Jeff Bezos, na carta aos acionistas da Amazon de 2016, separou decisões em <strong>tipo 1</strong> (de mão única, difíceis ou impossíveis de reverter) e <strong>tipo 2</strong> (de mão dupla). A regra prática: as de tipo 2 devem ser tomadas rápido, por indivíduos ou grupos pequenos; as de tipo 1 merecem processo pesado. O erro das organizações médias é aplicar processo tipo 1 a tudo. Pergunte sempre: quanto custa voltar atrás e em quanto tempo?</p>' },
        { tipo: 'texto', largo: true, html:
          '<table><thead><tr><th>Decisão</th><th>Custo de reverter</th><th>Tratamento</th></tr></thead><tbody>' +
          '<tr><td>Nome de função interna, biblioteca de teste</td><td>Horas</td><td>Quem implementa decide; sem RFC</td></tr>' +
          '<tr><td>Adicionar fila durável ao fluxo de importação</td><td>Um sprint; mensagens publicadas permanecem</td><td>RFC curto + review; ADR</td></tr>' +
          '<tr><td>Formato de ID público em API, esquema de particionamento de dados</td><td>Migração com clientes externos</td><td>RFC completo, protótipo, review ampliada, ADR</td></tr>' +
          '<tr><td>Escolha de provedor de LLM com SDK no código inteiro</td><td>Depende do acoplamento; reduza com uma camada de abstração fina</td><td>Experimento e critério de saída antes; reduza o custo de reverter em vez de discutir mais</td></tr>' +
          '</tbody></table>' },
        { tipo: 'texto', html:
          '<p>Há uma terceira via: <strong>diminuir o custo de reverter</strong>. Feature flag, dual write temporário, adaptador fino, migração em duas fases. Muitas decisões "de mão única" viram "de mão dupla" com um dia de engenharia, e isso é mais barato que um mês de debate.</p>' +
          '<h3>Desacordo: do conflito à decisão</h3>' +
          '<p>O desacordo técnico entre pessoas competentes costuma ter uma de três origens, cada uma com tratamento próprio:</p>' +
          '<ul><li><strong>Fato diferente</strong> (um viu o incidente, outro não): traga o fato (log, medição, protótipo de dois dias). Encerre a opinião.</li>' +
          '<li><strong>Valor diferente</strong> (velocidade versus robustez): explicite o trade-off e deixe o decisor escolher conscientemente. Registre qual valor foi priorizado.</li>' +
          '<li><strong>Risco percebido diferente</strong>: peça o cenário concreto que falha ("em que condição isso quebra?") e o sinal que mostraria que o risco se concretizou. Transforme em monitoramento.</li></ul>' +
          '<p><strong>Discordo e apoio</strong> (<em>disagree and commit</em>, também da carta de 2016) funciona quando o decisor ouviu, decidiu e quem discordou assume a execução com lealdade. Duas condições o tornam legítimo e não coação: (1) cada lado teve voz antes; (2) existe um <strong>ponto de revisão baseado em dado</strong> ("reavaliamos se o p95 passar de 800 ms"). Sem o ponto de revisão, vira derrota silenciosa.</p>' +
          '<p>Rafael defende manter a chamada síncrona; Marina, a fila durável. A reunião não converge. Veja o roteiro de fechamento do decisor.</p>' },
        { tipo: 'rode', id: 'b2-rode', titulo: 'Roteiro do decisor ao fechar um desacordo', obrigatorio: true,
          enunciado: 'Faça a previsão e rode o roteiro (2 minutos por lado, depois a decisão).',
          prefixo: 'Prompt', entrada: 'decisor fecha o desacordo: fila durável (Marina) x chamada síncrona (Rafael)', unidade: 'min', terminalTitulo: 'sala de decisão',
          prever: { pergunta: 'O decisor escolhe a fila durável. O que acontece com a objeção do Rafael?', opcoes: [
            { id: 'a', texto: 'Some da ata, para não criar clima.', correta: false, porque: 'quando a objeção se confirmar, ninguém lembra que alguém avisou, e a confiança cai.' },
            { id: 'b', texto: 'Fica registrada no ADR, com o sinal de revisão (p95 acima de 800 ms reabre).', correta: true, porque: 'objeção registrada com ponto de revisão por dado é o que legitima o "discordo e apoio".' },
            { id: 'c', texto: 'Vira voto vencido e encerra o assunto.', correta: false, porque: 'votar não trata a origem do desacordo (fato, valor ou risco).' }
          ] },
          etapas: [
            { id: 'ouvir', nome: 'Ouvir as duas posições', descricao: '2 min por lado', tom: 'dns', ms: 4, linhas: [
              L('info', 'Rafael: manter chamada síncrona porque a latência fim a fim importa e a fila adiciona um componente a operar.'),
              L('info', 'Marina: fila durável porque 3 dos 5 timeouts de setembro vieram de extratos grandes.'),
              L('hint', 'origens: valor (latência x robustez) e fato (os timeouts de setembro)')] },
            { id: 'decidir', nome: 'Decidir e classificar', descricao: 'Tipo da decisão', tom: 'request', ms: 1, linhas: [
              L('cmd', 'Decido por fila durável, tipo de decisão: reversível com custo (um sprint).'),
              L('hint', 'o decisor nomeado decide depois de ouvir as duas posições')] },
            { id: 'registrar', nome: 'Registrar objeção e sinal de revisão', descricao: 'No ADR', tom: 'response', ms: 1, linhas: [
              L('out', 'Rafael, sua objeção fica registrada no ADR, com o sinal de revisão:'),
              L('out', 'se a latência p95 do fluxo normal passar de 800 ms, reabrimos.'),
              L('hint', 'ponto de revisão baseado em dado')] },
            { id: 'confirmar', nome: 'Pedir confirmação por escrito', descricao: 'Até amanhã', tom: 'ink', ms: 1, linhas: [
              L('in', 'Cada um confirma por escrito até amanhã: "discordo e apoio" ou "concordo", ou traga um fato novo.'),
              L('hint', 'ADR em até 24 h')] }
          ] },
        { tipo: 'callout', tom: 'danger', titulo: 'Armadilha que pega sênior: ganhar com autoridade', html:
          '<p>Um sênior com 20 anos "vence" porque os demais cedem, não porque convenceu. O sintoma: decisões que ninguém contesta na reunião e todos contestam no corredor. <strong>Contramedida:</strong> fale por último, peça primeiro a objeção mais forte contra a sua posição e escreva-a no documento. Se você não consegue enunciar a melhor objeção contra sua proposta, você ainda não terminou de pensar.</p>' },
        { tipo: 'takeaway', html: 'Classifique o desacordo (<mark>fato, valor ou risco</mark>), decida, e registre a <mark>objeção com ponto de revisão por dado</mark>.' }
      ] },

      { rotulo: 'Praticar', blocos: [
        { tipo: 'texto', html:
          '<h3>Do RFC ao ADR com linter</h3>' +
          '<p>O repositório do lab traz <code>exemplos/rfc-bom.md</code>: um RFC sobre mover o processamento de extratos para fila durável, com contexto numérico (3 dos 5 timeouts, 1 a 2% de conciliações duplicadas), três revisores nomeados, data limite e tipo de decisão. O linter <code>leadkit check rfc</code> valida a estrutura (seções obrigatórias, no mínimo duas alternativas, nenhum TODO). Ele não valida julgamento: um RFC pode passar no linter e ser ruim. O linter existe para barrar o que é mecânico, de modo que o tempo humano vá para a crítica.</p>' +
          '<p>Escreva uma versão didática desse tipo de checagem, sobre um dicionário, com as regras do template listadas na aba Entender. Não é o código do <code>leadkit</code>; é um exercício do mesmo princípio.</p>' },
        { tipo: 'python', id: 'b2-python', titulo: 'Linter mecânico de RFC', obrigatorio: false,
          enunciado: 'Implemente <code>validar_rfc(rfc)</code>: devolve a lista de códigos de problema na ordem da docstring. Lista vazia significa estrutura ok.',
          codigo: codigo, testes: testes,
          dica: 'Acrescente o código à lista em cada <code>if</code>. Para "não fazer nada", compare em minúsculas com <code>any("não fazer nada" in a.lower() for a in alternativas)</code>. Use <code>rfc.get(chave)</code> para tolerar chaves ausentes.',
          solucao: solucao,
          tutorDepois: 'O último teste é o controle negativo: o linter passa um RFC vazio de julgamento. É o limite que o bloco descreve.',
          callout: 'O linter barra o mecânico (revisores, prazo, alternativas, TODO) e deixa o julgamento para a revisão humana.' },
        { tipo: 'cenario', id: 'b2-cenario', titulo: 'A reunião que não converge', obrigatorio: false,
          inicio: 'inicio',
          nos: {
            inicio: { texto: 'Rafael e Marina, ambos seniores, discordam sobre fila durável versus chamada síncrona. A design review está no minuto 50 sem convergir. Você é o decisor nomeado.', opcoes: [
              { texto: 'Pedir um voto do grupo', vai: 'fim_voto', consequencia: 'O voto dilui a decisão e não trata a origem do desacordo.', tom: 'ruim' },
              { texto: 'Perguntar de onde vem: fato, valor ou risco percebido?', vai: 'origem', consequencia: 'Transforma opinião em algo tratável.', tom: 'ok' },
              { texto: 'Marcar mais uma design review', vai: 'fim_pensar', consequencia: 'Termina em "vamos pensar mais": revisão sem decisor decidindo.', tom: 'ruim' }
            ] },
            origem: { texto: 'É valor (latência versus robustez) e fato (3 dos 5 timeouts de setembro vieram de extratos grandes). Qual o próximo passo?', opcoes: [
              { texto: 'Decidir pela fila durável, classificar como reversível com custo (um sprint) e registrar a objeção do Rafael no ADR com o sinal de revisão', vai: 'registro', consequencia: 'Você explicita o trade-off e o ponto de revisão por dado.', tom: 'ok' },
              { texto: 'Decidir pela fila durável e não citar a objeção, para não criar clima', vai: 'fim_silencio', consequencia: 'Quando a latência subir, ninguém lembra que alguém avisou.', tom: 'ruim' }
            ] },
            registro: { texto: 'A decisão está tomada. Falta fechar com as duas pessoas. O que pede?', opcoes: [
              { texto: 'Que cada um confirme por escrito até amanhã: "discordo e apoio", "concordo" ou um fato novo', vai: 'fim_bom', consequencia: 'Cada lado teve voz e há ponto de revisão: legítimo, não coação.', tom: 'ok' },
              { texto: 'Nada: quem discorda que se adapte', vai: 'fim_coacao', consequencia: 'Sem confirmação nem ponto de revisão, é derrota silenciosa.', tom: 'ruim' }
            ] }
          },
          finais: {
            fim_bom: { texto: 'Decisão registrada em até 24 h: fila durável, objeção do Rafael no ADR, reabertura se o p95 passar de 800 ms.', bom: true },
            fim_voto: { texto: 'A votação decidiu sem tratar a origem do desacordo. Volte e classifique-o.', bom: false },
            fim_pensar: { texto: 'A decisão voltou na semana seguinte, como todo trimestre. Review sem decisor decidindo.', bom: false },
            fim_silencio: { texto: 'Sem a objeção registrada, a confiança cai quando o risco se confirma.', bom: false },
            fim_coacao: { texto: 'Sem voz registrada nem ponto de revisão, o "apoio" virou derrota silenciosa.', bom: false }
          } },
        { tipo: 'takeaway', html: 'A estrutura (<mark>revisores, prazo, alternativas</mark>) é mecânica e vai para o linter; o <mark>julgamento</mark> fica com as pessoas.' }
      ] },

      { rotulo: 'Conferir', blocos: [
        { tipo: 'texto', html:
          '<h3>Trade-offs e erros comuns</h3>' +
          '<ul><li><strong>RFC assíncrono</strong> é mais inclusivo e mais lento: bom para times distribuídos e para quem pensa por escrito, ruim para decisões urgentes. Defina o prazo e respeite-o: comentário fora da data pede justificativa.</li>' +
          '<li><strong>Consenso versus decisão.</strong> Consenso é custoso e dilui. Procure consentimento: "alguém tem uma objeção fundamentada?". Ausência de objeção sustentada basta.</li>' +
          '<li><strong>Documento versus protótipo.</strong> Quando o risco está em desempenho ou integração, dois dias de protótipo valem mais que dez páginas.</li></ul>' +
          '<p>Erros comuns: RFC depois da decisão (teatro); design review sem decisor; registrar a decisão sem o desacordo; usar o ADR para tudo (se ninguém questionaria depois, não precisa); pedir opinião a quem não tem custo no resultado e ignorar quem vai operar o sistema às 3 da manhã.</p>' },
        { tipo: 'escolha', id: 'b2-esc1', titulo: 'SDK espalhado pelo código',
          pergunta: 'Seu produto usa o SDK de um provedor de LLM espalhado pelo código inteiro, e o grupo trava na escolha. Qual a melhor jogada?',
          opcoes: [
            { id: 'a', texto: 'Reduzir o custo de reverter (camada fina de abstração) e definir experimento com critério de saída, em vez de debater mais.', correta: true, porque: 'a terceira via é diminuir o custo de reverter.' },
            { id: 'b', texto: 'Marcar três design reviews até haver consenso.', correta: false, porque: 'cria processo pesado para algo que pode virar reversível.' },
            { id: 'c', texto: 'Deixar o autor decidir sozinho: é decisão de mão dupla.', correta: false, porque: 'com o acoplamento atual, a decisão é cara de desfazer.' }
          ] },
        { tipo: 'escolha', id: 'b2-esc2', titulo: 'Quando o RFC não é necessário',
          pergunta: 'A equipe vai trocar a biblioteca de teste interna, algo que se desfaz em horas. Qual o tratamento?',
          opcoes: [
            { id: 'a', texto: 'RFC completo, protótipo e review ampliada.', correta: false, porque: 'é processo tipo 1 aplicado a uma decisão tipo 2.' },
            { id: 'b', texto: 'Quem implementa decide, sem RFC.', correta: true, porque: 'custo de reverter em horas pede decisão rápida, por indivíduo ou grupo pequeno.' },
            { id: 'c', texto: 'ADR sem decisão: só para constar.', correta: false, porque: 'ADR é para decisão difícil de reverter ou que alguém vai questionar depois.' }
          ] },
        { tipo: 'takeaway', html: 'Registre a <mark>objeção</mark>, não só a decisão. Se ninguém questionaria depois, <mark>não precisa de ADR</mark>.' }
      ] }
    ]
  });
})();
