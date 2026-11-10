/* E04 · Bloco 4: Planejamento e risco. Fonte: E04.html#b04. Saídas do leadkit são execuções reais do laboratório (11/10/2026, dados fictícios). */
(function () {
  var L = function (kind, text) { return { kind: kind, text: text }; };
  function opc(id, texto, correta, porque) { return { id: id, texto: texto, correta: correta, porque: porque }; }

  var codigo = `import math
import random

# quatro das oito tarefas do CSV do laboratório: (nome, mínimo, provável, máximo) em dias-pessoa
TAREFAS = [
    ("Modelar tabelas e migrações", 2, 3, 6),
    ("API de importação de extratos", 3, 5, 10),
    ("Regras de conciliação automática", 5, 8, 20),
    ("Integração com o sistema legado de contas", 4, 8, 25),
]


def pert(rng, minimo, provavel, maximo):
    """Sorteio PERT: Beta com alfa = 1 + 4*(provável-mín)/(máx-mín) e beta = 1 + 4*(máx-provável)/(máx-mín),
    esticada para [mín, máx]. Se máx == mín, devolve mín."""
    return minimo


def percentil(ordenado, p):
    """Menor valor tal que pelo menos p% dos valores são menores ou iguais a ele (lista já ordenada)."""
    return ordenado[0]


def simular(tarefas, riscos=(), execucoes=2000, semente=42):
    """Devolve a lista ordenada dos totais. riscos: [(probabilidade, impacto_em_dias)]."""
    if not tarefas:
        raise ValueError("sem tarefas")
    rng = random.Random(semente)
    totais = []
    for _ in range(execucoes):
        total = sum(pert(rng, lo, prov, hi) for _, lo, prov, hi in tarefas)
        for prob, impacto in riscos:
            if rng.random() < prob:
                total += impacto
        totais.append(total)
    return sorted(totais)


def resumo(tarefas, riscos=(), execucoes=2000, semente=42):
    totais = simular(tarefas, riscos, execucoes, semente)
    return {
        "soma_provaveis": sum(t[2] for t in tarefas),
        "p50": percentil(totais, 50),
        "p85": percentil(totais, 85),
        "p95": percentil(totais, 95),
    }


print(resumo(TAREFAS))
`;
  var testes = `def test_percentil_em_lista_conhecida():
    xs = list(range(1, 101))
    assert percentil(xs, 50) == 50
    assert percentil(xs, 85) == 85
    assert percentil(xs, 100) == 100


def test_pert_fica_dentro_da_faixa():
    rng = random.Random(1)
    valores = [pert(rng, 2, 3, 6) for _ in range(500)]
    assert all(2 <= v <= 6 for v in valores)
    assert max(valores) - min(valores) > 1


def test_pert_faixa_degenerada():
    assert pert(random.Random(1), 4, 4, 4) == 4


def test_soma_dos_provaveis_fica_abaixo_do_p50():
    r = resumo(TAREFAS)
    assert r["soma_provaveis"] == 24
    assert r["p50"] > r["soma_provaveis"]
    assert r["p50"] < r["p85"] < r["p95"]


def test_mesma_semente_mesmo_resultado():
    assert resumo(TAREFAS, semente=7) == resumo(TAREFAS, semente=7)


def test_risco_certo_desloca_a_distribuicao():
    base = resumo(TAREFAS)["p50"]
    com_risco = resumo(TAREFAS, riscos=[(1.0, 5)])["p50"]
    assert 4 < com_risco - base < 6


def test_sem_tarefas_e_erro():
    try:
        simular([])
    except ValueError:
        return
    assert False, "deveria lançar ValueError"
`;
  var solucao = `import math
import random

TAREFAS = [
    ("Modelar tabelas e migrações", 2, 3, 6),
    ("API de importação de extratos", 3, 5, 10),
    ("Regras de conciliação automática", 5, 8, 20),
    ("Integração com o sistema legado de contas", 4, 8, 25),
]


def pert(rng, minimo, provavel, maximo):
    if maximo == minimo:
        return minimo
    largura = maximo - minimo
    alfa = 1 + 4 * (provavel - minimo) / largura
    beta = 1 + 4 * (maximo - provavel) / largura
    return minimo + largura * rng.betavariate(alfa, beta)


def percentil(ordenado, p):
    indice = math.ceil(p / 100 * len(ordenado)) - 1
    return ordenado[max(0, min(indice, len(ordenado) - 1))]


def simular(tarefas, riscos=(), execucoes=2000, semente=42):
    if not tarefas:
        raise ValueError("sem tarefas")
    rng = random.Random(semente)
    totais = []
    for _ in range(execucoes):
        total = sum(pert(rng, lo, prov, hi) for _, lo, prov, hi in tarefas)
        for prob, impacto in riscos:
            if rng.random() < prob:
                total += impacto
        totais.append(total)
    return sorted(totais)


def resumo(tarefas, riscos=(), execucoes=2000, semente=42):
    totais = simular(tarefas, riscos, execucoes, semente)
    return {
        "soma_provaveis": sum(t[2] for t in tarefas),
        "p50": percentil(totais, 50),
        "p85": percentil(totais, 85),
        "p95": percentil(totais, 95),
    }
`;

  TrilhaAula.registrar({
    id: 'e04-b4',
    titulo: 'Planejamento e risco: faixa, Monte Carlo, dívida e "não" com alternativas',
    minutos: 40,
    resumo: 'Um líder técnico é cobrado por previsibilidade mais do que por velocidade. A estimativa de um número só esconde a incerteza; a alternativa é estimar por faixa, simular, prometer um percentil e tratar riscos como itens de primeira classe.',
    objetivo: 'Decompor, estimar por três pontos, simular com semente fixa, prometer um percentil com as hipóteses, traduzir dívida técnica em custo e dizer "não" com alternativas.',
    revisao: [
      { id: 'e04b4-soma', pergunta: 'A soma dos "prováveis" é 41 dias-pessoa e o P85 simulado é 53. O que prometer?',
        opcoes: [
          opc('a', 'Um percentil (P85 ou P95), com as hipóteses declaradas.', true, 'a cauda direita empurra média e P50 acima da soma dos prováveis; prometer 41 tem probabilidade bem abaixo de 50%.'),
          opc('b', '41: é o número mais provável.', false, 'a soma dos prováveis não é um percentil da distribuição.'),
          opc('c', 'O P50: é a mediana.', false, 'prometer o P50 é falhar metade das vezes.')] },
      { id: 'e04b4-independencia', pergunta: 'Como a independência assumida pelo simulador afeta o P85?',
        opcoes: [
          opc('a', 'Tarefas reais se correlacionam; o P85 real tende a ser maior, e o resultado é piso de honestidade, não teto.', true, 'correlação positiva alarga a distribuição: os atrasos vêm juntos.'),
          opc('b', 'Não afeta, porque 10.000 rodadas anulam o efeito.', false, 'repetir rodadas não cria independência que o modelo não tem.'),
          opc('c', 'O P85 real é menor, porque as tarefas se compensam.', false, 'a correlação positiva é o caso comum (mesma pessoa, mesmo legado).')] },
      { id: 'e04b4-semente', pergunta: 'Por que fixar a semente do simulador?',
        opcoes: [
          opc('a', 'A execução fica reproduzível: duas pessoas rodando o mesmo CSV veem os mesmos números, e a estimativa pode ser revisada como código.', true, 'sem semente fixa os números mudam a cada execução e ninguém reproduz.'),
          opc('b', 'Deixa o resultado mais otimista.', false, 'a semente não muda a distribuição, só a torna reproduzível.'),
          opc('c', 'Dispensa registrar as hipóteses.', false, 'as hipóteses continuam obrigatórias.')] },
      { id: 'e04b4-nao', pergunta: 'Quais são os quatro movimentos de um "não" com alternativas?',
        opcoes: [
          opc('a', 'Reconhecer o objetivo, dizer o fato, oferecer 2 a 3 opções, recomendar e pedir a decisão.', true, 'inclua a opção que você rejeitou e por quê; mostra que foi considerada.'),
          opc('b', 'Recusar, justificar, repetir e encerrar.', false, 'um "não" seco encerra a conversa e cria um adversário.'),
          opc('c', 'Citar a lei de Brooks e esperar.', false, 'diga o gargalo concreto, não cite o livro.')] },
      { id: 'e04b4-divida', pergunta: 'Como transformar "precisamos refatorar" em argumento de negócio?',
        opcoes: [
          opc('a', 'Custo hoje, o que acontece se esperarmos, quanto custa corrigir e como saberemos que funcionou, em dias por trimestre ou incidentes.', true, 'dívida sem custo mensurável nem prazo é candidata honesta a ser aceita.'),
          opc('b', 'Dizer que o código está feio e a cobertura é baixa.', false, 'não traduz em custo que o negócio entende.'),
          opc('c', 'Esperar o próximo incidente.', false, 'não é um argumento.')] }
    ],
    abas: [
      { rotulo: 'Entender', blocos: [
        { tipo: 'texto', html:
          '<p>Um líder técnico é cobrado por <strong>previsibilidade</strong> mais do que por velocidade. Prazos curtos prometidos e quebrados custam mais confiança do que prazos honestos e longos. A estimativa de um número só é uma aposta mal formulada: esconde a incerteza e transfere o risco para quem a recebe. A alternativa é estimar por faixa, simular, prometer um percentil e tratar os riscos como itens de primeira classe.</p>' +
          '<h3>Decomposição</h3>' +
          '<p>Estimativa sem decomposição é palpite sobre algo que você ainda não entende. Decomponha até que cada parte seja (a) de um tamanho em que você já errou antes, e (b) entregável e verificável por si só.</p>' +
          '<ul><li>Fatie por valor entregável <strong>verticalmente</strong> (uma importação ponta a ponta), não por camada (primeiro todo o banco).</li>' +
          '<li>Itens de mais de 5 a 8 dias-pessoa ainda estão grandes demais; quebre ou marque a incerteza como alta.</li>' +
          '<li>Inclua o que sempre é esquecido: migração de dados, observabilidade, runbook, rollout gradual, teste de carga, revisão de segurança, integração com o legado.</li>' +
          '<li>Separe <strong>tarefas</strong> (trabalho que você sabe fazer) de <strong>riscos</strong> (eventos que podem ou não acontecer). Misturar os dois infla o plano e esconde o que importa.</li></ul>' +
          '<h3>Estimativa por faixa: três pontos</h3>' +
          '<p>Para cada tarefa, três números: <strong>mínimo</strong> (quase tudo dá certo), <strong>provável</strong> (o que você espera) e <strong>máximo</strong> (um problema sério, mas não catástrofe). A distribuição que emerge é assimétrica: a cauda direita é mais longa porque atrasar é ilimitado e adiantar é limitado pelo zero. O arquivo <code>data/projeto-conciliacao.csv</code> do lab tem oito tarefas assim:</p>' },
        { tipo: 'codigo', linguagem: 'text', texto: 'name,low,likely,high\nModelar tabelas e migrações,2,3,6\nAPI de importação de extratos,3,5,10\nRegras de conciliação automática,5,8,20\n...\nIntegração com o sistema legado de contas,4,8,25' },
        { tipo: 'texto', html:
          '<p>Soma dos "prováveis": <strong>41 dias-pessoa</strong>. Esse é o número que costuma ir ao slide.</p>' +
          '<h3>Monte Carlo: o mecanismo</h3>' +
          '<p>A simulação sorteia, para cada tarefa, uma duração de uma distribuição definida pelos três pontos (<strong>triangular</strong>, ou <strong>PERT</strong>, uma Beta suavizada com média (min + 4·provável + max)/6), soma o sorteio de todas as tarefas, soma os riscos que "dispararam" naquela rodada (cada um com probabilidade e impacto) e repete 10.000 vezes. O resultado é a distribuição do total, lida por <strong>percentis</strong>: P50 (metade das rodadas termina até ali), P85, P95. A <strong>semente fixa</strong> torna a execução reproduzível: duas pessoas rodando o mesmo CSV veem os mesmos números, o que viabiliza revisar a estimativa como código.</p>' },
        { tipo: 'takeaway', html: 'Estime por <mark>três pontos</mark>, separe <mark>tarefas de riscos</mark> e simule: a distribuição do total é assimétrica.' }
      ] },

      { rotulo: 'Ver funcionando', blocos: [
        { tipo: 'texto', html:
          '<p>As saídas abaixo são execuções reais do <code>leadkit</code> (11/10/2026, dados fictícios; os seus serão outros). Antes de rodar, faça a previsão.</p>' },
        { tipo: 'rode', id: 'b4-rode', titulo: 'Onde cai a soma dos prováveis?', obrigatorio: true,
          enunciado: 'Rode o estimador sem riscos e depois com os dois riscos e capacidade de 1,8 dia-pessoa por dia corrido.',
          prefixo: '$', entrada: 'uv run leadkit estimate data/projeto-conciliacao.csv', unidade: 'dias (P85)', terminalTitulo: 'leadkit estimate',
          prever: { pergunta: 'A soma dos "prováveis" é 41 dias-pessoa. Onde ela cai na distribuição simulada?', opcoes: [
            { id: 'a', texto: 'Perto do P50: é o valor mais provável.', correta: false, porque: 'a cauda direita empurra média e P50 para a direita da soma dos prováveis.' },
            { id: 'b', texto: 'Bem abaixo do P50 (cerca de 13% abaixo): prometer 41 falha mais da metade das vezes.', correta: true, porque: 'no lab, P50 = 47,0 e a soma dos prováveis fica -13% em relação a ele.' },
            { id: 'c', texto: 'Acima do P95, porque as tarefas se compensam.', correta: false, porque: 'com cauda direita mais longa, o total tende a ficar acima da soma dos prováveis.' }
          ] },
          etapas: [
            { id: 'sem-risco', nome: 'Sem riscos', descricao: '10.000 execuções, PERT', tom: 'request', ms: 53, linhas: [
              L('cmd', 'uv run leadkit estimate data/projeto-conciliacao.csv'),
              L('out', 'tarefas: 8  riscos: 0  execuções: 10000  semente: 42  distribuição: pert'),
              L('out', "soma dos 'provável' (estimativa de ponto): 41.0 dias-pessoa"),
              L('out', 'esforço   média 47.4  mín 33.7  máx 67.3'),
              L('out', 'P50:   47.0 dias-pessoa  ->    47.0 dias corridos'),
              L('out', 'P85:   53.0 dias-pessoa  ->    53.0 dias corridos'),
              L('out', 'P95:   56.5 dias-pessoa  ->    56.5 dias corridos'),
              L('hint', "a soma dos 'provável' fica -13% em relação ao P50")] },
            { id: 'com-risco', nome: 'Com riscos e capacidade 1,8', descricao: 'Dois riscos de dependência', tom: 'response', ms: 32, linhas: [
              L('cmd', 'uv run leadkit estimate data/projeto-conciliacao.csv --risks data/projeto-conciliacao-riscos.csv --capacity 1.8'),
              L('out', 'tarefas: 8  riscos: 2  execuções: 10000  semente: 42  distribuição: pert'),
              L('out', "soma dos 'provável' (estimativa de ponto): 41.0 dias-pessoa"),
              L('out', 'esforço   média 50.3  mín 34.4  máx 77.1'),
              L('out', 'P50:   49.7 dias-pessoa  ->    27.6 dias corridos'),
              L('out', 'P85:   57.1 dias-pessoa  ->    31.7 dias corridos'),
              L('out', 'P95:   61.9 dias-pessoa  ->    34.4 dias corridos'),
              L('hint', "a soma dos 'provável' fica -17% em relação ao P50")] }
          ] },
        { tipo: 'texto', html:
          '<p><strong>Leitura:</strong> prometer 41 dias é prometer algo com probabilidade bem abaixo de 50% de se cumprir. O P85 (53) é a promessa que quebra em uma a cada sete execuções. A média (47,4) supera a soma dos prováveis: a assimetria das caudas empurra a média para a direita.</p>' +
          '<p><strong>Riscos e capacidade.</strong> Os riscos entram em <code>data/projeto-conciliacao-riscos.csv</code>: "time do legado atrasa o ambiente de homologação" (30%, +5 dias) e "requisito regulatório novo muda o formato do extrato" (15%, +10 dias). O parâmetro <code>--capacity</code> converte dias-pessoa em dias corridos: três pessoas com 60% de foco entregam 1,8 dia-pessoa por dia corrido. Tradução para o gerente de produto: "Com três pessoas e 60% de foco, 85% de confiança em 32 dias corridos; se precisar de 95%, 35. Os dois riscos de dependência explicam cerca de 3 dias-pessoa de P50 e a maior parte da cauda".</p>' +
          '<h3>Limites do modelo (diga em voz alta)</h3>' +
          '<ul><li><strong>Independência.</strong> O simulador sorteia tarefas de forma independente. Na vida, elas se correlacionam (a mesma pessoa, o mesmo legado, o mesmo requisito vago). Correlação positiva alarga a distribuição: o P85 real é maior que o simulado. Trate o resultado como piso de honestidade, não como teto.</li>' +
          '<li><strong>Escolha da distribuição.</strong> Com triangular, o mesmo CSV e os mesmos riscos dão P85 de 64,8 dias-pessoa contra 57,1 do PERT. É um julgamento: mostre as duas e justifique a usada (<code>--dist triangular</code>).</li>' +
          '<li><strong>Entrada ruim, saída ruim.</strong> Se as faixas vêm de otimismo, o percentil é otimista. Calibre comparando estimado versus realizado de entregas passadas.</li>' +
          '<li><strong>Sequencial.</strong> O modelo soma as tarefas (um fluxo de trabalho). Caminho crítico paralelo pede outra modelagem (máximo de ramos).</li>' +
          '<li><strong>Alternativa baseada em fluxo.</strong> Com histórico estável, simule a partir do throughput real por semana (itens entregues) em vez de estimativas subjetivas; é mais difícil de enviesar.</li></ul>' +
          '<p>A <strong>falácia do planejamento</strong> (Kahneman e Tversky): mesmo sabendo da regra, tendemos a estimar pelo cenário ideal do projeto atual e ignorar a distribuição de projetos parecidos. A visão de fora ("projetos como este costumam estourar em X%") é o corretivo.</p>' },
        { tipo: 'takeaway', html: 'No lab: soma <mark>41</mark>, P50 <mark>47,0</mark>, P85 <mark>53,0</mark>, P95 <mark>56,5</mark>. O modelo é <mark>piso</mark>, não teto.' }
      ] },

      { rotulo: 'Praticar', blocos: [
        { tipo: 'texto', html:
          '<p>Reimplemente o núcleo do simulador em Python puro, com quatro das tarefas do CSV (soma dos prováveis: 24 dias-pessoa). Os números não serão os do <code>leadkit</code> (outro conjunto de tarefas e menos execuções), mas o padrão é o mesmo: P50 acima da soma dos prováveis.</p>' },
        { tipo: 'python', id: 'b4-python', titulo: 'Monte Carlo com semente fixa', obrigatorio: false,
          enunciado: 'Implemente <code>pert</code> (Beta esticada para [mín, máx]) e <code>percentil</code> (menor valor com pelo menos p% dos valores abaixo ou iguais). <code>simular</code> e <code>resumo</code> já estão prontos.',
          codigo: codigo, testes: testes,
          dica: 'Com <code>largura = máx - mín</code>: <code>alfa = 1 + 4*(provável-mín)/largura</code>, <code>beta = 1 + 4*(máx-provável)/largura</code> e <code>mín + largura*rng.betavariate(alfa, beta)</code>. Percentil: <code>math.ceil(p/100*n) - 1</code>, limitado a [0, n-1].',
          solucao: solucao,
          tutorDepois: 'Mude <code>semente</code> e veja o P85 oscilar pouco; sem semente fixa, dois colegas nunca reproduzem o seu número.',
          callout: 'O simulador reproduz o padrão do bloco: a soma dos prováveis fica abaixo do P50, e um risco certo desloca a distribuição inteira.' },
        { tipo: 'texto', html:
          '<h3>Roadmap e dívida técnica em termos de negócio</h3>' +
          '<p>Um roadmap útil não lista funcionalidades com datas; expõe apostas, nível de confiança por horizonte (agora, próximo, depois) e o que depende de quê. Datas só nos horizontes onde há confiança. Para dívida técnica, abandone "o código está feio" e traduza em custo:</p>' },
        { tipo: 'texto', largo: true, html:
          '<table><thead><tr><th>Em vez de</th><th>Diga</th></tr></thead><tbody>' +
          '<tr><td>"Precisamos refatorar o módulo de conciliação."</td><td>"Cada regra nova de conciliação leva hoje 9 dias; nos módulos equivalentes bem estruturados, 3. Com 4 regras por trimestre, isso custa 24 dias-pessoa por trimestre. A refatoração custa 20 dias e se paga em um trimestre."</td></tr>' +
          '<tr><td>"A cobertura de testes é baixa."</td><td>"30% dos incidentes dos últimos 6 meses vieram desse módulo; cada um consumiu em média 11 horas de 3 pessoas. Testes de caracterização custam 8 dias."</td></tr>' +
          '<tr><td>"Estamos em uma versão antiga do framework."</td><td>"O suporte de segurança acaba em março. Depois dessa data, qualquer vulnerabilidade exige correção por nossa conta. A migração custa 15 dias agora ou 25 sob pressão."</td></tr>' +
          '</tbody></table>' },
        { tipo: 'texto', html:
          '<p>Quatro perguntas organizam o argumento: o que isso nos custa hoje (tempo, incidentes, risco), o que acontece se esperarmos (custo cresce? prazo externo?), quanto custa corrigir e como saberemos que funcionou (a métrica que muda). A dívida sem custo mensurável e sem prazo é candidata honesta a ser aceita.</p>' +
          '<h3>Dizer não com alternativas</h3>' +
          '<p>Um "não" seco encerra a conversa e cria um adversário. Um "não" com alternativas abre uma negociação sobre escopo, prazo ou risco, que é o terreno certo: (1) reconheça o objetivo; (2) diga o fato; (3) ofereça 2 a 3 opções; (4) recomende e peça a decisão. Incluir a opção que você rejeitou ("adicionar duas pessoas") mostra que foi considerada, e por quê. A lei de Brooks (adicionar gente a projeto atrasado o atrasa mais) é um argumento antigo e útil, mas diga o gargalo concreto, não cite o livro. Pratique no cenário.</p>' },
        { tipo: 'cenario', id: 'b4-cenario', titulo: 'O gerente quer 41 dias', obrigatorio: false,
          inicio: 'inicio',
          nos: {
            inicio: { texto: 'O fechamento de novembro não pode passar sem a conciliação automática, e está a 24 dias corridos. Com três pessoas e 60% de foco, 85% de confiança é 32 dias corridos. Como responde ao gerente?', opcoes: [
              { texto: '"Não dá."', vai: 'fim_seco', consequencia: 'Um "não" seco encerra a conversa e cria um adversário.', tom: 'ruim' },
              { texto: '"Fechamos no prazo, a gente dá um jeito."', vai: 'fim_aceita', consequencia: 'Você promete algo bem abaixo de 50% de chance.', tom: 'ruim' },
              { texto: 'Reconhecer o objetivo e dar o fato: "85% de confiança é 32 dias corridos; o fechamento está a 24"', vai: 'opcoes', consequencia: 'São os dois primeiros movimentos.', tom: 'ok' }
            ] },
            opcoes: { texto: 'Quais opções oferecer?', opcoes: [
              { texto: '(A) regra de conciliação exata agora e a aproximada em dezembro, com revisão manual das exceções; (B) mais duas pessoas, com 2 semanas de onboarding, o que não adianta porque o gargalo é o legado; (C) mover o fechamento para 15 de dezembro', vai: 'recomenda', consequencia: 'Duas opções reais e uma rejeitada com o gargalo concreto.', tom: 'ok' },
              { texto: 'Só (B): adicionar gente', vai: 'fim_brooks', consequencia: 'Com onboarding de duas semanas e o gargalo no legado, atrasa mais.', tom: 'ruim' }
            ] },
            recomenda: { texto: 'Falta o último movimento.', opcoes: [
              { texto: '"Recomendo (A). Preciso da sua decisão até quinta para manter o plano."', vai: 'fim_bom', consequencia: 'A negociação é sobre escopo, prazo e risco, não sobre sim ou não.', tom: 'ok' },
              { texto: 'Listar as opções e deixar a escolha em aberto', vai: 'fim_aberto', consequencia: 'Sem recomendação nem prazo de decisão, o plano não se mantém.', tom: 'ruim' }
            ] }
          },
          finais: {
            fim_bom: { texto: 'Você recomendou (A) com fato, opções e prazo de decisão: o "não" virou negociação de escopo.', bom: true },
            fim_seco: { texto: 'O gerente saiu sem opção e com um adversário a mais.', bom: false },
            fim_aceita: { texto: 'Você prometeu o impossível e vai falhar mais da metade das vezes.', bom: false },
            fim_brooks: { texto: 'Adicionar gente a um projeto cujo gargalo é o legado o atrasa mais.', bom: false },
            fim_aberto: { texto: 'Sem recomendação e sem prazo, ninguém decidiu nada.', bom: false }
          } },
        { tipo: 'takeaway', html: 'Diga "não" com <mark>fato, opções e recomendação</mark>; converta dívida em <mark>dias por trimestre</mark> e incidentes.' }
      ] },

      { rotulo: 'Conferir', blocos: [
        { tipo: 'texto', html:
          '<h3>Trade-offs e erros comuns</h3>' +
          '<ul><li><strong>Precisão aparente.</strong> Dois decimais num P85 passam confiança que o modelo não tem. Arredonde ao dia e diga as hipóteses.</li>' +
          '<li><strong>Buffer escondido versus percentil declarado.</strong> Pessoas somam buffer em cada tarefa e a pressão o consome (lei de Parkinson). Um percentil global, declarado, é mais honesto.</li>' +
          '<li><strong>Estimar tudo versus fatiar e entregar.</strong> Quando a incerteza é alta, estime só o primeiro corte e replaneje com o que aprendeu.</li>' +
          '<li><strong>Estimativas de IA.</strong> Assistentes ajudam a listar tarefas esquecidas e riscos; as faixas devem vir do histórico do time, não do modelo.</li></ul>' +
          '<p>Erros comuns: entregar um número só ao gerente e uma faixa só ao time; prometer o P50 como prazo; não revisitar a estimativa quando um risco dispara ou uma tarefa estoura; ignorar o custo de coordenação ao somar pessoas (capacidade de 3 pessoas não é 3 × 1,0).</p>' },
        { tipo: 'callout', tom: 'danger', titulo: 'Armadilha que pega sênior: cobrir o risco com autoridade', html:
          '<p>"Eu já fiz isso antes, 30 dias, pode confiar." Sua experiência é dado valioso, mas é um dado e não um argumento: se está certo, a simulação com suas faixas vai concordar, e agora o gerente pode ver o que acontece quando um risco dispara. Se a simulação discorda de você, ou você subestimou as caudas ou o modelo tem uma hipótese errada. As duas descobertas são melhores antes do compromisso.</p>' },
        { tipo: 'escolha', id: 'b4-esc1', titulo: 'O gerente quer 41',
          pergunta: 'A soma dos prováveis é 41 dias-pessoa e o P85 da simulação é 53. O gerente quer 41. O que você responde?',
          opcoes: [
            { id: 'a', texto: '41 serve, é o número mais provável.', correta: false, porque: 'a soma dos prováveis não é o número mais provável do total.' },
            { id: 'b', texto: '41 tem probabilidade bem abaixo de 50%; a promessa honesta é um percentil (P85 ou P95), com as hipóteses declaradas.', correta: true, porque: 'a cauda direita empurra média e P50 acima da soma dos prováveis.' },
            { id: 'c', texto: 'Prometo o P50, que é a mediana.', correta: false, porque: 'prometer o P50 é falhar metade das vezes.' }
          ] },
        { tipo: 'escolha', id: 'b4-esc2', titulo: 'Tarefas correlacionadas',
          pergunta: 'As tarefas do projeto compartilham a mesma pessoa e o mesmo legado. Como isso afeta o P85 simulado, que sorteia tarefas de forma independente?',
          opcoes: [
            { id: 'a', texto: 'O P85 real tende a ser maior: correlação positiva alarga a distribuição. O resultado é piso de honestidade, não teto.', correta: true, porque: 'os atrasos vêm juntos.' },
            { id: 'b', texto: 'Nada: a independência não importa com 10.000 rodadas.', correta: false, porque: 'repetir rodadas não cria independência que o modelo não tem.' },
            { id: 'c', texto: 'O P85 real é menor, porque as tarefas se compensam.', correta: false, porque: 'a correlação positiva faz os atrasos virem juntos, não se compensarem.' }
          ] },
        { tipo: 'takeaway', html: 'Prometa um <mark>percentil</mark> (P85 ou P95 conforme o custo de falhar), com <mark>hipóteses</mark>, arredondado ao dia.' }
      ] }
    ]
  });
})();
