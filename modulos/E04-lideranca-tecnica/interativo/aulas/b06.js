/* E04 · Bloco 6: Adoção de IA no time. Fonte: E04.html#b06. Fontes verificadas em 11/10/2026; a saída do leadkit dora vem de execução real com dados fictícios. */
(function () {
  var L = function (kind, text) { return { kind: kind, text: text }; };
  function opc(id, texto, correta, porque) { return { id: id, texto: texto, correta: correta, porque: porque }; }

  var codigo = `import math
from statistics import median


def percentil(valores, p):
    """Posto mais próximo (nearest-rank): ordena e devolve o elemento de posição ceil(p/100*n), base 1."""
    return valores[0]


def metricas_dora(deploys, incidentes, janela_dias):
    """deploys: [(id_deploy, lead_time_horas)].
    incidentes: [(id_deploy, horas_ate_recuperar)]; None = incidente ainda em aberto.

    Devolve um dicionário com:
      freq_semana         deploys por semana (n / janela_dias * 7)
      lead_mediana        mediana do lead time
      lead_p85            P85 do lead time
      taxa_falha          deploys distintos com incidente / total de deploys
                          (dois incidentes no mesmo deploy contam uma mudança falha)
      mttr_mediana        mediana da recuperação só dos incidentes fechados (None se não houver)
      incidentes_abertos  quantidade de incidentes em aberto
    Sem deploys, levanta ValueError.
    """
    return {}


deploys = [("d1", 2), ("d2", 4), ("d3", 6), ("d4", 50)]
incidentes = [("d1", 1.0), ("d1", 3.0), ("d3", None)]
print(metricas_dora(deploys, incidentes, 14))
`;
  var testes = `DEPLOYS = [("d1", 2), ("d2", 4), ("d3", 6), ("d4", 50)]
INCIDENTES = [("d1", 1.0), ("d1", 3.0), ("d3", None)]


def test_percentil_nearest_rank():
    assert percentil([50, 2, 6, 4], 85) == 50
    assert percentil([10, 20, 30, 40, 50], 50) == 30


def test_frequencia_e_lead_time():
    m = metricas_dora(DEPLOYS, INCIDENTES, 14)
    assert m["freq_semana"] == 2.0
    assert m["lead_mediana"] == 5
    assert m["lead_p85"] == 50


def test_dois_incidentes_no_mesmo_deploy_sao_uma_mudanca_falha():
    assert metricas_dora(DEPLOYS, INCIDENTES, 14)["taxa_falha"] == 0.5


def test_incidente_em_aberto_fora_da_mediana_mas_contado():
    m = metricas_dora(DEPLOYS, INCIDENTES, 14)
    assert m["mttr_mediana"] == 2.0
    assert m["incidentes_abertos"] == 1


def test_sem_incidentes():
    m = metricas_dora(DEPLOYS, [], 14)
    assert m["taxa_falha"] == 0
    assert m["mttr_mediana"] is None
    assert m["incidentes_abertos"] == 0


def test_sem_deploys_e_erro():
    try:
        metricas_dora([], [], 14)
    except ValueError:
        return
    assert False, "deveria lançar ValueError"
`;
  var solucao = `import math
from statistics import median


def percentil(valores, p):
    ordenados = sorted(valores)
    posicao = math.ceil(p / 100 * len(ordenados))
    return ordenados[max(1, posicao) - 1]


def metricas_dora(deploys, incidentes, janela_dias):
    if not deploys:
        raise ValueError("sem deploys")
    leads = [lead for _, lead in deploys]
    com_falha = {id_deploy for id_deploy, _ in incidentes}
    fechados = [h for _, h in incidentes if h is not None]
    return {
        "freq_semana": len(deploys) / janela_dias * 7,
        "lead_mediana": median(leads),
        "lead_p85": percentil(leads, 85),
        "taxa_falha": len(com_falha) / len(deploys),
        "mttr_mediana": median(fechados) if fechados else None,
        "incidentes_abertos": sum(1 for _, h in incidentes if h is None),
    }
`;

  TrilhaAula.registrar({
    id: 'e04-b6',
    titulo: 'Adoção de IA no time: política, harness, onde acelera e atrapalha, e como medir',
    minutos: 40,
    resumo: 'O time vai usar IA com ou sem você. A decisão do líder é entre adoção sem regra e adoção desenhada, e é a decisão em que a evidência externa é mais contraditória, o que torna a medição local indispensável.',
    objetivo: 'Ler a evidência externa com suas datas e limites, decidir onde a IA acelera ou atrapalha pelo custo de verificação, escrever uma política mínima, medir com DORA mais uma dimensão de percepção e conduzir um experimento antes de qualquer mandato.',
    revisao: [
      { id: 'e04b6-verificacao', pergunta: 'Qual o critério decisivo para saber se a IA acelera uma tarefa?',
        opcoes: [
          opc('a', 'O custo de verificação: se verificar o resultado é barato (teste existe, contrato claro), acelera; se exige reconstruir o raciocínio, só desloca o trabalho de escrever para ler.', true, 'ler é mais difícil que escrever.'),
          opc('b', 'O tamanho do modelo usado.', false, 'não é o critério do bloco.'),
          opc('c', 'A senioridade de quem pede.', false, 'o critério é o custo de verificar o resultado.')] },
      { id: 'e04b6-padrao', pergunta: 'O painel mostra deploy mais frequente e lead time menor, mas falha de mudança e retrabalho maiores. Qual a leitura?',
        opcoes: [
          opc('a', 'A geração passou à frente da verificação: investir em testes, review e lotes pequenos antes de escalar, e medir por time, não por pessoa.', true, 'é o padrão que a pesquisa DORA descreve.'),
          opc('b', 'A IA funciona: olhe só frequência e lead time.', false, 'ignora a instabilidade.'),
          opc('c', 'A IA piora tudo e deve ser proibida.', false, 'generaliza a partir de um indicador.')] },
      { id: 'e04b6-metr', pergunta: 'O que o ensaio METR (jul/2025, 16 desenvolvedores) ensina, e qual o limite de leitura?',
        opcoes: [
          opc('a', 'As tarefas levaram em média 19% mais tempo, embora os participantes achassem ter sido mais rápidos: percepção e medida divergem. Amostra pequena e modelos de 2025; não generalize.', true, 'a lição é medir no seu time, com métricas de fluxo.'),
          opc('b', 'A IA sempre torna desenvolvedores experientes 19% mais lentos.', false, 'generaliza uma amostra pequena em contexto específico.'),
          opc('c', 'A IA torna todo desenvolvedor 20% mais rápido.', false, 'foi o que os participantes acreditavam, não o que se mediu.')] },
      { id: 'e04b6-goodhart', pergunta: 'Como usar as métricas DORA sem cair na lei de Goodhart?',
        opcoes: [
          opc('a', 'Para o time enxergar o próprio sistema, nunca para ranking de pessoas ou times, nem para bônus.', true, 'quando uma métrica vira meta, deixa de ser boa métrica; linhas e PRs por pessoa medem quanto o agente digitou.'),
          opc('b', 'Como meta individual atrelada a bônus.', false, 'é exatamente o que a lei de Goodhart desaconselha.'),
          opc('c', 'Medindo linhas de código por pessoa.', false, 'com agentes, mede quanto o agente digitou.')] },
      { id: 'e04b6-experimento', pergunta: 'O que um experimento de adoção deve ter definido antes de começar?',
        opcoes: [
          opc('a', 'Hipótese, grupo, duração, métricas de fluxo mais percepção, critério de parada e a decisão ao final (expandir, ajustar ou parar).', true, 'o critério de parada é definido ANTES.'),
          opc('b', 'Só a ferramenta e a data de início.', false, 'sem hipótese e critério de parada o piloto não decide nada.'),
          opc('c', 'A lista de pessoas que serão avaliadas individualmente.', false, 'nenhuma métrica por pessoa.')] }
    ],
    abas: [
      { rotulo: 'Entender', blocos: [
        { tipo: 'texto', html:
          '<p>O time vai usar IA com ou sem você. A decisão do líder é entre <strong>adoção sem regra</strong> (cada um com a sua ferramenta, dados sensíveis em serviços não aprovados, qualidade irregular) e <strong>adoção desenhada</strong>. Também é a decisão em que a evidência externa é mais contraditória, o que torna a medição local indispensável.</p>' +
          '<h3>O que a evidência diz (com datas)</h3>' },
        { tipo: 'texto', largo: true, html:
          '<table><thead><tr><th>Fonte</th><th>Achado</th><th>Cuidado de leitura</th></tr></thead><tbody>' +
          '<tr><td>DORA, "State of AI-assisted Software Development" (set/2025), ≈5.000 profissionais</td><td>90% usam IA (alta de 14% sobre o ano anterior); mais de 80% relatam ganho de produtividade; só 24% confiam muito. A adoção passou a se associar a maior throughput de entrega, mas continua ligada a maior instabilidade quando a base não é sólida. A IA atua como "espelho e multiplicador": amplifica o que a organização já é. Propõe sete arquétipos de time e um modelo de sete capacidades que potencializam a IA.</td><td>Autorrelato em grande parte; correlação, não experimento</td></tr>' +
          '<tr><td>DORA, "ROI of AI-assisted Software Development" (listado em dora.dev/ai como "último relatório"; confirme a data na página)</td><td>Propõe um quadro para decidir investimento, incluindo o dip inicial de produtividade na adoção. Um resumo secundário (Kodus, jul/2026) destaca a curva em J, o "imposto de verificação" e o review como alavanca, e trata os números do cenário de 500 engenheiros como ilustração, não benchmark.</td><td>O resumo é de terceiros; leia o original antes de citar números</td></tr>' +
          '<tr><td>METR, ensaio randomizado (jul/2025), 16 desenvolvedores experientes em repositórios próprios</td><td>Com ferramentas de IA da época, as tarefas levaram em média 19% mais tempo, embora os participantes esperassem e depois acreditassem ter sido mais rápidos (cerca de 20% a mais).</td><td>Amostra pequena, contexto específico (repositórios maduros que o desenvolvedor conhece bem), modelos de 2025. Valores conferidos com a divulgação, de memória: releia o paper (arXiv 2507.09089) antes de citar</td></tr>' +
          '</tbody></table>' },
        { tipo: 'texto', html:
          '<p><strong>Leitura honesta:</strong> a IA acelera em alguns contextos, atrapalha em outros, e as pessoas julgam mal o próprio ganho. É um argumento para medir no seu time, com métricas de fluxo, não para aceitar nem rejeitar a promessa. Números de pesquisa externa mudam em meses: fontes verificadas em 11/10/2026, revalide em até 90 dias.</p>' +
          '<h3>Onde acelera e onde atrapalha</h3>' },
        { tipo: 'texto', largo: true, html:
          '<table><thead><tr><th>Tende a acelerar</th><th>Tende a atrapalhar</th></tr></thead><tbody>' +
          '<tr><td>Código novo, padronizado, com especificação clara e testes</td><td>Código legado denso, com contexto implícito que o agente não vê</td></tr>' +
          '<tr><td>Testes de caracterização, scaffolding, migração mecânica</td><td>Decisões de desenho com trade-offs sutis</td></tr>' +
          '<tr><td>Exploração de API desconhecida, rascunho de documentação</td><td>Depuração de problemas de concorrência e de estado distribuído</td></tr>' +
          '<tr><td>Primeira revisão automática de PR</td><td>Mudanças que exigem conhecimento de domínio não escrito</td></tr>' +
          '<tr><td>Trabalhos paralelos com isolamento (worktrees, M01)</td><td>Qualquer tarefa onde verificar custa mais que fazer</td></tr>' +
          '</tbody></table>' },
        { tipo: 'texto', html:
          '<p>O critério decisivo é o <strong>custo de verificação</strong>. Se verificar o resultado é barato (teste existe, contrato claro), a IA acelera. Se verificar exige reconstruir o raciocínio, ela só desloca o trabalho de escrever para ler, e ler é mais difícil.</p>' },
        { tipo: 'takeaway', html: 'A evidência é <mark>mista</mark>: ganho de throughput, instabilidade se a base é fraca, percepção descalibrada. Decida pelo <mark>custo de verificação</mark> e meça no seu time.' }
      ] },

      { rotulo: 'Ver funcionando', blocos: [
        { tipo: 'texto', html:
          '<h3>Política mínima do time</h3>' +
          '<p>Uma página, versionada no repositório, com decisões e não aspirações:</p>' +
          '<ul><li><strong>Ferramentas aprovadas</strong> e o que cada uma pode ver (código, logs, dados). Tudo fora da lista exige exceção.</li>' +
          '<li><strong>Dados proibidos</strong> em qualquer prompt: segredos, dados pessoais de clientes, código sob NDA de terceiros (alinhe com a política de segurança e com E03, LGPD).</li>' +
          '<li><strong>Responsabilidade:</strong> o autor do PR responde por todo o código, gerado ou não.</li>' +
          '<li><strong>Revisão:</strong> o checklist de review de IA vale para PRs gerados; PR gerado em área crítica exige segundo revisor.</li>' +
          '<li><strong>Divulgação:</strong> o PR indica quando houve uso substancial de agente (contexto para o revisor, não punição).</li>' +
          '<li><strong>Revisão da política:</strong> trimestral, com base nas métricas e incidentes.</li></ul>' +
          '<p>Sem direção explícita, as pessoas ocultam o uso por medo de julgamento e você perde o dado. A capacidade "postura clara e comunicada sobre IA" é uma das capacidades do modelo DORA justamente por isso.</p>' +
          '<h3>Harness compartilhado</h3>' +
          '<p>Em vez de cada pessoa treinar seu agente do zero, o time mantém um <strong>harness</strong> comum: arquivo de instruções do repositório (convenções, comandos de teste, o que nunca fazer), guardrails mecânicos (hooks, linters, gates de CI), prompts e skills reutilizáveis e ambientes isolados para execução. O detalhe técnico está no M01; o papel do líder é três decisões: <strong>quem mantém</strong> (dono nomeado, revisão por PR), <strong>o que é obrigatório</strong> versus opcional (gates em CI: obrigatório; prompts: recomendado) e <strong>como se aprende com falhas</strong> (todo erro recorrente do agente vira regra no harness, no mesmo PR que corrige o código).</p>' +
          '<h3>Medir: DORA, SPACE e DevEx</h3>' +
          '<ul><li><strong>DORA (entrega):</strong> frequência de deploy, lead time de mudança, taxa de falha de mudança e tempo de recuperação; a pesquisa mais recente trata também retrabalho. Medem o sistema de entrega, não pessoas (Forsgren, Humble e Kim, <em>Accelerate</em>, 2018).</li>' +
          '<li><strong>SPACE</strong> (Forsgren et al., ACM Queue, 2021): satisfação e bem-estar, desempenho, atividade, comunicação e colaboração, eficiência e fluxo. Nenhuma métrica sozinha; combine ao menos três dimensões, incluindo uma percepção.</li>' +
          '<li><strong>DevEx</strong> (Noda, Storey, Forsgren e Greiler, ACM Queue, 2023): ciclos de feedback, carga cognitiva e estado de fluxo. Útil para achar o atrito que a IA remove ou cria.</li></ul>' +
          '<p>O lab calcula as quatro primeiras métricas DORA a partir de dois CSV (deploys e incidentes), com um mês de dados fictícios. Faça a previsão e rode.</p>' },
        { tipo: 'rode', id: 'b6-rode', titulo: 'leadkit dora: um mês de dados fictícios', obrigatorio: true,
          enunciado: 'Rode o cálculo. A saída é a execução real do laboratório, com dados fictícios.',
          prefixo: '$', entrada: 'uv run leadkit dora data/deploys.csv data/incidents.csv', unidade: 'ms', terminalTitulo: 'leadkit dora',
          prever: { pergunta: 'Um incidente ainda está em aberto no CSV. Como o cálculo trata o tempo de recuperação?', opcoes: [
            { id: 'a', texto: 'Ignora em silêncio: não tem duração.', correta: false, porque: 'omitir em silêncio seria otimista; o cálculo precisa dizer que omitiu.' },
            { id: 'b', texto: 'Conta a duração até agora dentro da mediana.', correta: false, porque: 'incidente aberto não entra na mediana de recuperação.' },
            { id: 'c', texto: 'Fica fora da mediana e gera um aviso explícito.', correta: true, porque: 'a omissão explícita evita o otimismo escondido.' }
          ] },
          etapas: [
            { id: 'dora', nome: 'Métricas DORA', descricao: '37 deploys em 29 dias', tom: 'response', ms: 40, linhas: [
              L('cmd', 'uv run leadkit dora data/deploys.csv data/incidents.csv'),
              L('out', 'janela: 29.0 dias  deploys: 37'),
              L('out', 'frequência de deploy:        8.9 por semana'),
              L('out', 'lead time (commit->deploy):  mediana 14.6 h  P85 52.7 h'),
              L('out', 'taxa de falha de mudança:    13.5% (5/37 deploys)'),
              L('out', 'tempo de recuperação:        mediana 1.2 h'),
              L('hint', 'atenção: 1 incidente(s) em aberto fora do tempo de recuperação')] }
          ] },
        { tipo: 'texto', html:
          '<p>Três decisões do cálculo merecem discussão: (1) dois incidentes no mesmo deploy contam como <strong>uma</strong> mudança falha (a taxa é por mudança, não por incidente); (2) incidente em aberto não entra na mediana de recuperação (omitir seria otimista, por isso o aviso explícito); (3) lead time usa mediana e P85, porque a média é dominada por poucos deploys que ficaram parados num fim de semana.</p>' +
          '<p><strong>Como usar com IA:</strong> compare antes e durante o experimento, no mesmo time. O padrão a procurar é o que a pesquisa DORA descreve: frequência de deploy e lead time melhoram, mas a taxa de falha de mudança e o retrabalho pioram. Significa que a velocidade de geração passou ao largo de verificação, e a ação é investir em testes, review e lotes pequenos, não em mais geração.</p>' },
        { tipo: 'callout', tom: 'danger', titulo: 'Lei de Goodhart', html:
          '<p>Quando uma métrica vira meta, deixa de ser boa métrica. Métricas DORA são para o time enxergar o próprio sistema, <strong>nunca</strong> para ranking de pessoas ou de times, nem para bônus. Contagem de linhas ou de PRs por pessoa, com agentes, mede quanto o agente digitou.</p>' },
        { tipo: 'takeaway', html: 'Meça com <mark>DORA mais uma dimensão de percepção</mark>, por time, e leia <mark>falha de mudança e retrabalho</mark> ao lado da velocidade.' }
      ] },

      { rotulo: 'Praticar', blocos: [
        { tipo: 'texto', html:
          '<p>Reimplemente o cálculo com as três decisões do lab: falha por <em>deploy distinto</em>, recuperação só dos incidentes fechados (contando os abertos à parte) e lead time por mediana e P85 (posto mais próximo). Os dados do teste são inventados e minúsculos.</p>' },
        { tipo: 'python', id: 'b6-python', titulo: 'Métricas DORA a partir de listas', obrigatorio: false,
          enunciado: 'Implemente <code>percentil</code> (posto mais próximo) e <code>metricas_dora</code> com os seis campos da docstring.',
          codigo: codigo, testes: testes,
          dica: 'Use um <code>set</code> dos ids de deploy com incidente para a taxa de falha. Separe <code>fechados = [h for _, h in incidentes if h is not None]</code> e conte os abertos à parte. Percentil: <code>ceil(p/100*n)</code> como posição (base 1) na lista ordenada.',
          solucao: solucao,
          tutorDepois: 'Troque o conjunto por uma lista e a taxa de falha sobe para 0,75: é a diferença entre contar incidentes e contar mudanças.',
          callout: 'As três decisões do lab ficaram explícitas: falha por mudança, abertos fora da mediana e lead time por mediana e P85.' },
        { tipo: 'texto', html:
          '<h3>Experimento antes de mandato</h3>' +
          '<p>Em vez de "todo mundo usa" ou "ninguém usa", conduza um experimento pequeno e honesto:</p>' },
        { tipo: 'codigo', linguagem: 'text', texto:
          'Hipótese:        Com o agente + harness do time, o lead time mediano cai 20%\n' +
          '                 sem aumento da taxa de falha de mudança.\n' +
          'Grupo:           3 de 7 pessoas (voluntárias), mesmos tipos de tarefa.\n' +
          'Duração:         4 semanas, com 1 semana de aprendizado descartada da análise.\n' +
          'Métricas:        lead time (mediana e P85), tamanho de PR, tempo até primeira\n' +
          '                 revisão, taxa de falha, retrabalho (PRs de correção em 7 dias),\n' +
          '                 + pesquisa de 5 perguntas (carga cognitiva, confiança, frustração).\n' +
          'Critério de parada (definido ANTES):\n' +
          '                 taxa de falha acima de 2x a linha de base por duas semanas, ou\n' +
          '                 qualquer incidente com dado sensível em prompt.\n' +
          'Decisão ao final: expandir, ajustar o harness, ou parar. Publicar os números.' },
        { tipo: 'texto', html:
          '<p>Limitações a declarar: amostra pequena, voluntários são otimistas, efeito de novidade, tarefas diferentes. O experimento não prova; reduz a incerteza o bastante para decidir. E o resultado negativo é um resultado: "não ajudou neste tipo de tarefa" é informação valiosa. Quando o mandato vem de cima antes do experimento, responda com o desenho acima, não com resistência. Pratique no cenário.</p>' },
        { tipo: 'cenario', id: 'b6-cenario', titulo: 'A diretoria exige agentes na segunda-feira', obrigatorio: false,
          inicio: 'inicio',
          nos: {
            inicio: { texto: 'A diretoria exige que todos usem agentes na segunda-feira. Como você responde?', opcoes: [
              { texto: 'Recusar: não temos evidência de que funciona', vai: 'fim_recusa', consequencia: 'Resistência sem alternativa vira oposição ao objetivo, não a um método.', tom: 'ruim' },
              { texto: '"Concordo com o objetivo. Proponho um piloto de quatro semanas que nos dá números antes de escalar. Qual métrica o senhor quer ver melhor ao final?"', vai: 'piloto', consequencia: 'Você troca oposição por patrocínio de um método.', tom: 'ok' },
              { texto: 'Aceitar e medir linhas de código por pessoa para provar adoção', vai: 'fim_goodhart', consequencia: 'Com agentes, linhas mede quanto o agente digitou.', tom: 'ruim' }
            ] },
            piloto: { texto: 'O piloto foi aceito. O que você define antes de começar?', opcoes: [
              { texto: 'Hipótese, grupo de voluntários, duração, métricas de fluxo (lead time, tamanho de PR, tempo de review, falha, retrabalho) mais percepção e critério de parada', vai: 'politica', consequencia: 'O critério de parada definido antes evita decidir sob viés depois.', tom: 'ok' },
              { texto: 'Só a ferramenta, e decidimos pelo clima do time', vai: 'fim_clima', consequencia: 'Sem hipótese nem critério de parada, o piloto não decide nada.', tom: 'ruim' }
            ] },
            politica: { texto: 'E os dados e a responsabilidade durante o piloto?', opcoes: [
              { texto: 'Política mínima de uma página: ferramentas aprovadas, dados proibidos em prompt, o autor do PR responde pelo código, divulgação do uso como contexto de review e nenhuma métrica por pessoa', vai: 'fim_bom', consequencia: 'As pessoas deixam de ocultar o uso e você ganha o dado.', tom: 'ok' },
              { texto: 'Cada pessoa usa a ferramenta que quiser, com o que quiser no prompt', vai: 'fim_solto', consequencia: 'Adoção sem regra: dados sensíveis em serviços não aprovados.', tom: 'ruim' }
            ] }
          },
          finais: {
            fim_bom: { texto: 'Piloto com hipótese, métricas de fluxo mais percepção, critério de parada anterior, política mínima e nenhuma métrica por pessoa: ao final você expande, ajusta o harness ou para, e publica os números.', bom: true },
            fim_recusa: { texto: 'Recusar sem alternativa não responde ao mandato. Volte e proponha um piloto.', bom: false },
            fim_goodhart: { texto: 'A métrica virou meta e deixou de medir. Evite métricas por pessoa.', bom: false },
            fim_clima: { texto: 'Decidir pelo clima é decidir pela opinião de entusiastas ou de céticos.', bom: false },
            fim_solto: { texto: 'Sem política, a qualidade fica irregular e o risco de dados sensíveis sobe.', bom: false }
          } },
        { tipo: 'takeaway', html: 'Experimento com <mark>hipótese, grupo, prazo e critério de parada</mark> definido antes de qualquer mandato.' }
      ] },

      { rotulo: 'Conferir', blocos: [
        { tipo: 'texto', html:
          '<h3>Trade-offs e erros comuns</h3>' +
          '<ul><li><strong>Padronização versus liberdade.</strong> Uma ferramenta única facilita suporte e segurança; várias dão espaço para descoberta. Padronize o que toca dados e CI, deixe o editor livre.</li>' +
          '<li><strong>Velocidade de adoção versus dívida de verificação.</strong> Acelerar a geração sem acelerar o review move o gargalo para a fila de PRs.</li>' +
          '<li><strong>Medir percepção ou comportamento.</strong> Percepção erra (como no estudo METR); comportamento mede só o que registra. Use os dois.</li></ul>' +
          '<p>Erros comuns: medir produtividade por linhas, commits ou PRs por pessoa; concluir pelo piloto com os entusiastas e escalar para quem não escolheu usar; política sem dono nem revisão (vira PDF esquecido); culpar o agente por incidentes sem corrigir o gate que deixou passar.</p>' },
        { tipo: 'callout', tom: 'danger', titulo: 'Armadilha que pega sênior: n=1', html:
          '<p>Julgar a IA pela sua experiência individual. Você tem 20 anos de contexto, ótimos prompts e sabe verificar rápido: seu ganho (ou perda) não é o do time. O mesmo vale para o cético que testou um modelo antigo numa tarefa inadequada. Meça no time, nos tipos de tarefa do time, e atualize a conclusão a cada trimestre, porque as ferramentas mudam mais rápido que a sua opinião.</p>' },
        { tipo: 'escolha', id: 'b6-esc1', titulo: 'Painel DORA depois dos agentes',
          pergunta: 'Após adotar agentes, o painel DORA mostra deploy mais frequente e lead time menor, mas taxa de falha de mudança e retrabalho maiores. Leitura correta?',
          opcoes: [
            { id: 'a', texto: 'A IA funciona: só olhe frequência e lead time.', correta: false, porque: 'ignora a instabilidade.' },
            { id: 'b', texto: 'A IA piora tudo e deve ser proibida.', correta: false, porque: 'generaliza a partir de um indicador.' },
            { id: 'c', texto: 'A geração passou à frente da verificação: acelere review, testes e gates antes de escalar, e meça por time, não por pessoa.', correta: true, porque: 'é o padrão que a pesquisa DORA descreve.' }
          ] },
        { tipo: 'escolha', id: 'b6-esc2', titulo: 'Quando acelera',
          pergunta: 'Qual tarefa tem mais chance de ser acelerada por um agente?',
          opcoes: [
            { id: 'a', texto: 'Depurar uma condição de corrida em estado distribuído.', correta: false, porque: 'concorrência e estado distribuído tendem a atrapalhar.' },
            { id: 'b', texto: 'Escrever testes de caracterização para um módulo com contrato claro, em que verificar é barato.', correta: true, porque: 'verificar é barato: é o caso que tende a acelerar.' },
            { id: 'c', texto: 'Decidir um desenho com trade-offs sutis e conhecimento de domínio não escrito.', correta: false, porque: 'verificar custa mais que fazer.' }
          ] },
        { tipo: 'takeaway', html: 'Política curta e versionada, harness com <mark>dono</mark>, review como alavanca. Nenhuma <mark>métrica por pessoa</mark>.' }
      ] }
    ]
  });
})();
