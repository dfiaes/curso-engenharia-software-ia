/* S01 · Bloco 6: Refatoração. Fonte: S01.html#b06. Saídas do laboratório (golden, diferencial, pytest) são execuções reais de 11/10/2026. */
(function () {
  var L = function (kind, text) { return { kind: kind, text: text }; };
  function opc(id, texto, correta, porque) { return { id: id, texto: texto, correta: correta, porque: porque }; }
  var GOLDEN = 'uv run python -m design_lab.cli golden';
  var DIF = 'uv run python -m design_lab.cli diferencial';
  var SUITE = 'uv run pytest -q | tail -4';

  var etapas = function () {
    return [
      { id: 'golden', nome: 'Golden', descricao: 'Legado contra o arquivo congelado', tom: 'dns', ms: 1, linhas: [
        L('cmd', GOLDEN), L('out', '34/34 casos iguais ao golden')] },
      { id: 'diferencial', nome: 'Diferencial', descricao: 'Refatorado contra o legado em volume', tom: 'request', ms: 1, linhas: [
        L('cmd', DIF), L('out', '2000 casos aleatórios (seed 2026), 0 divergências')] },
      { id: 'suite', nome: 'Suíte', descricao: 'pytest inteiro', tom: 'response', ms: 1, linhas: [
        L('cmd', 'uv run pytest -q | tail -1'), L('out', '165 passed in 0.34s')] }
    ];
  };

  TrilhaAula.registrar({
    id: 's01-b6',
    titulo: 'Refatoração: caracterização, costuras e passos seguros',
    minutos: 50,
    resumo: 'Refatorar é mudar a estrutura sem mudar o comportamento observável. Sem um teste que verifique isso, é reescrita. Smells, testes de caracterização, costuras, passos seguros, teste diferencial e controle negativo.',
    objetivo: 'Refatorar legado sob testes de caracterização, com passos que mantêm a suíte verde e uma rede que você provou que pega erro.',
    revisao: [
      { id: 's01b6-def', pergunta: 'O que separa refatorar de reescrever?',
        opcoes: [
          opc('a', 'Um meio de verificar que o comportamento observável ficou igual.', true, 'sem ele você reescreve, com risco de reescrita.'),
          opc('b', 'O tamanho do diff.', false, 'um diff pequeno sem verificação também é reescrita.'),
          opc('c', 'Usar uma ferramenta automática.', false, 'a ferramenta não substitui o oráculo.')] },
      { id: 's01b6-carac', pergunta: 'Qual é o primeiro passo para refatorar uma função legada sem testes, e o que ele garante?',
        opcoes: [
          opc('a', 'Testes de caracterização: fixam o que o código faz hoje, bugs inclusos; garantem que o refator preserva o comportamento, não que ele esteja certo.', true, 'se o código depende do relógio, antes cria-se uma costura.'),
          opc('b', 'Reescrever a função a partir da especificação.', false, 'o "segundo sistema" perde regras que só o legado conhece.'),
          opc('c', 'Corrigir os bugs óbvios.', false, 'corrigir de passagem esconde a regressão e destrói o registro do comportamento anterior.')] },
      { id: 's01b6-seam', pergunta: 'O que é uma costura (seam)?',
        opcoes: [
          opc('a', 'Um lugar onde se muda o comportamento sem editar o código naquele ponto, como o relógio do legado.', true, 'depois da caracterização, a dependência vira parâmetro: a costura mais honesta.'),
          opc('b', 'Um comentário que marca onde o código foi dividido.', false, 'costura é um ponto de substituição, não uma marca.'),
          opc('c', 'Um tipo especial de teste de CI.', false, 'é uma propriedade do código, não de um teste.')] },
      { id: 's01b6-neg', pergunta: 'Por que fazer o controle negativo (mudar TETO_PERCENTUAL de 20 para 25)?',
        opcoes: [
          opc('a', 'Para provar que o diferencial e a suíte pegam o erro: uma suíte que nunca viu falhar não prova nada.', true, 'resultado: 74 divergências e dois testes vermelhos, e o golden continua 34/34 porque observa o legado.'),
          opc('b', 'Para melhorar o desempenho do refator.', false, 'não tem relação.'),
          opc('c', 'Para atualizar o golden com o novo teto.', false, 'o golden é congelado; mudar comportamento é outro commit.')] },
      { id: 's01b6-commits', pergunta: 'Como separar refatoração de mudança de comportamento?',
        opcoes: [
          opc('a', 'Em commits distintos, com "dois chapéus": refator não muda testes de comportamento; comportamento não move código.', true, 'o mesmo vale para um agente: tarefas separadas, com a suíte de caracterização como critério de aceitação.'),
          opc('b', 'No mesmo commit, para o revisor ver tudo junto.', false, 'o revisor não sabe se uma diferença é intencional.'),
          opc('c', 'Atualizando o golden junto com o refator.', false, 'perde o único registro do comportamento anterior.')] }
    ],
    abas: [
      { rotulo: 'Entender', blocos: [
        { tipo: 'texto', html:
          '<p><strong>Refatorar</strong> é mudar a estrutura interna sem mudar o comportamento observável (Fowler). A segunda metade da definição é a que importa: sem um meio de verificar que o comportamento ficou igual, o que você faz é reescrever, com risco de reescrita. A maior parte do trabalho real de engenharia é em código que já existe, que funciona, que ninguém entende por inteiro e que gera receita. O legado não é um insulto: é código que sobreviveu. A habilidade sênior é mudá-lo em passos pequenos, reversíveis e verificados, de modo que dê para parar a qualquer momento com o sistema funcionando.</p>' +
          '<h3>Smells: sintomas que merecem atenção, não condenação</h3>' +
          '<p>Um <strong>code smell</strong> é um indício, não um defeito. Os que mais aparecem, com o remédio de manual:</p>' },
        { tipo: 'texto', largo: true, html:
          '<table><thead><tr><th>Smell</th><th>Como se reconhece</th><th>Movimento de refatoração</th></tr></thead><tbody>' +
          '<tr><td>Função longa / alta ciclomática</td><td>Muitos níveis, comentários de bloco, variáveis temporárias de longa vida</td><td>Extract Function; Replace Temp with Query</td></tr>' +
          '<tr><td>Condicional sobre tipo</td><td><code>if tipo == ...</code> repetido em vários lugares</td><td>Tabela de despacho, strategy, <code>match</code></td></tr>' +
          '<tr><td>Obsessão por primitivos</td><td>Dicionário ou <code>int</code> circula com significado implícito</td><td>Dataclass imutável, tipo de domínio</td></tr>' +
          '<tr><td>Lista de parâmetros longa</td><td>Cinco ou mais argumentos que viajam juntos</td><td>Introduce Parameter Object</td></tr>' +
          '<tr><td>Feature envy</td><td>Método usa mais dados de outro objeto que do próprio</td><td>Move Method</td></tr>' +
          '<tr><td>Mudança divergente / cirurgia de espingarda</td><td>Uma classe muda por vários motivos / um motivo muda vários arquivos</td><td>Separar / agrupar (SRP, coesão)</td></tr>' +
          '<tr><td>Duplicação</td><td>Lógica copiada com pequenas variações</td><td>Extrair, mas só após ver duas cópias reais</td></tr>' +
          '<tr><td>Dependência escondida</td><td><code>date.today()</code>, global, singleton no meio da regra</td><td>Parâmetro ou porta injetada (costura)</td></tr>' +
          '</tbody></table>' },
        { tipo: 'texto', html:
          '<p>O lab dá uma amostra concreta. O medidor do módulo, aplicado ao legado de preços e à versão refatorada (seleção de quatro linhas da saída completa, que lista todas as funções por ciclomática decrescente):</p>' },
        { tipo: 'codigo', linguagem: 'text', texto: [
          '$ uv run python -m design_lab.cli complexidade src/design_lab/legado.py src/design_lab/pedidos/precificacao.py src/design_lab/pedidos/frete.py src/design_lab/pedidos/descontos.py',
          'arquivo:funcao                                       linhas ciclo aninh',
          'src/design_lab/legado.py:calcular_pedido                 98    32     3',
          'src/design_lab/pedidos/frete.py:calcular_frete           22     5     1',
          'src/design_lab/pedidos/descontos.py:efeito_cliente        8     5     1',
          'src/design_lab/pedidos/precificacao.py:calcular          18     2     1'].join('\n') },
        { tipo: 'texto', html:
          '<p>Uma função de 98 linhas e ciclomática 32 (no mínimo 32 casos de teste para cobrir todos os ramos) virou funções cuja maior ciclomática é 5. Nada disso prova que o comportamento é o mesmo. É o que o resto do bloco resolve.</p>' },
        { tipo: 'takeaway', html: 'Refatorar <mark>preserva o comportamento observável</mark>; sem teste que o verifique, é <mark>reescrever</mark>.' }
      ] },

      { rotulo: 'Ver funcionando', blocos: [
        { tipo: 'texto', html:
          '<h3>Testes de caracterização: o oráculo é o próprio código</h3>' +
          '<p>Em legado sem testes, a pergunta "o que está certo?" é cara e frequentemente sem resposta (a documentação não existe, quem pediu a regra saiu da empresa). A pergunta que você consegue responder é "o que o código faz hoje?". Um <strong>teste de caracterização</strong> (Feathers) grava a saída observada e a transforma em oráculo: se depois da refatoração qualquer saída mudar, o teste acusa, certa ou errada que fosse a original. Procedimento:</p>' +
          '<ol><li>Escolha entradas que cubram ramos e bordas: cada limite (9 e 10 itens, 29.999 e 30.000 centavos), cada erro, cada combinação suspeita.</li>' +
          '<li>Observe a saída do código atual e grave <em>sem editar à mão</em>: a gravação é automática, para não "corrigir" o oráculo sem querer (no lab, <code>uv run python -m design_lab.cli golden --write</code>).</li>' +
          '<li>Revise com o negócio o que parecer estranho, mas preserve até haver decisão. Registre como pergunta, não como correção.</li>' +
          '<li>Rode contra o refatorado a cada passo.</li></ol>' +
          '<p>O arquivo <code>tests/golden/saidas.json</code> guarda 34 casos, com sucessos e erros. Alguns revelam comportamentos que ninguém escolheria no papel e que o refator tem de reproduzir:</p>' },
        { tipo: 'codigo', linguagem: 'text', texto: [
          'cupom_vazio_nao_e_none         : cupom "" vira {\'avisos\': [\'cupom inválido: \'], ...}   (string vazia é "cupom", não ausência)',
          'expresso_nao_ganha_frete_gratis: pedido de R$ 400,00 com expresso paga frete 3000 (R$ 30,00); a isenção por valor não vale',
          'expresso_com_cupom_fretegratis : o cupom não zera o frete expresso: apenas o divide por dois',
          'ouro_expresso_cupom_fretegratis: ouro ainda recebe metade do que sobrou (frete 750)'].join('\n') },
        { tipo: 'texto', html:
          '<p>Cada uma é uma pergunta para o dono do produto ("expresso deveria ficar de fora da frete grátis?"). A refatoração não é o momento de decidir; é o momento de não perder nada. Corrigir comportamento é uma mudança separada, com commit e teste próprios, depois.</p>' +
          '<h3>Costuras (seams): fazer o código testável sem reescrevê-lo</h3>' +
          '<p>Uma <strong>costura</strong> é um lugar onde se pode mudar o comportamento sem editar o código naquele ponto (Feathers). O legado do lab lê o relógio em um helper de módulo:</p>' },
        { tipo: 'codigo', linguagem: 'python', texto: [
          'def _hoje() -> datetime.date:',
          '    return datetime.date.today()',
          '# ... no meio de calcular_pedido:',
          'hoje = _hoje()',
          'if hoje.month == 11 and hoje.day == 28:      # Black Friday',
          '    pct = pct + 5',
          '',
          '# sem tocar a função, o teste substitui _hoje:',
          'def rodar_legado(caso: Caso) -> Saida:',
          '    with mock.patch.object(legado, "_hoje", return_value=caso.hoje):',
          '        return _normalizar(lambda: legado.calcular_pedido(...))'].join('\n') },
        { tipo: 'texto', html:
          '<p>Essa é uma costura de objeto/módulo (<em>monkeypatch</em>). Outras: parâmetro com default (<code>def f(x, relogio=date.today)</code>), subclasse que sobrescreve um método (<em>subclass and override</em>) e injeção no construtor. A preferência é pela de menor intrusão que resolve: monkeypatch temporário para a caracterização inicial e, ao refatorar de verdade, a dependência vira argumento (<code>calcular(pedido, hoje)</code>), a costura mais honesta. Regra: crie a costura <em>antes</em> do refator, com o mínimo de edição no legado, e use-a para colocar o legado sob teste.</p>' },
        { tipo: 'takeaway', html: 'Caracterização: grave o que o código faz hoje, <mark>preserve até decidir</mark> e registre dúvidas; a <mark>costura</mark> põe o legado sob teste.' }
      ] },

      { rotulo: 'Praticar', blocos: [
        { tipo: 'texto', html:
          '<h3>Passos seguros</h3>' +
          '<p>Refatoração segura é uma sequência de passos que mantêm a suíte verde, cada um commitável. Uma ordem que funciona, usada no laboratório. Um detalhe que o refator do lab precisou preservar: a <strong>ordem dos efeitos</strong>. O teto de 20% vale depois de somar cliente, volume, data e cupom percentual; o desconto fixo (<code>FIXO20</code>) entra depois do teto; o cupom de frete grátis e a isenção por valor interagem com expresso e com cliente ouro em uma ordem específica (dobra por expresso, depois isenção, depois metade para ouro). Mudar a ordem muda o valor, e os testes de caracterização existem para pegar justamente isso.</p>' },
        { tipo: 'ordene', id: 'b6-ordene', titulo: 'Ponha os passos da refatoração na ordem', obrigatorio: false,
          enunciado: 'Use os botões para ordenar os seis passos do laboratório, do primeiro ao último.',
          itens: [
            { id: 'diferencial', texto: 'Ligar o novo no antigo (ou o contrário) e comparar com o legado em volume: o teste diferencial' },
            { id: 'tipar', texto: 'Tipar as bordas: <code>Item</code>, <code>Cliente</code>, <code>Pedido</code>, <code>Resultado</code> como dataclasses imutáveis; um adapter (<code>compat.py</code>) aceita os dicionários antigos' },
            { id: 'remover', texto: 'Remover o legado só quando o diferencial ficar limpo por tempo suficiente em produção (ou nunca, se manter for barato)' },
            { id: 'caracterizar', texto: 'Caracterizar: golden mais costura do relógio, com a suíte verde contra o legado' },
            { id: 'tabelas', texto: 'Substituir a cadeia de <code>if</code> por tabelas (cupons, frete regional)' },
            { id: 'extrair', texto: 'Extrair regras puras uma de cada vez (cliente, volume, data, cupom), cada uma devolvendo um <code>Efeito</code>; rodar o golden entre extrações' }
          ],
          solucao: ['caracterizar', 'tipar', 'extrair', 'tabelas', 'diferencial', 'remover'],
          dica: 'Sem o oráculo (caracterização) nada pode mudar; o legado só sai por último.',
          tutorDepois: 'Cada passo deixa a suíte verde e pode ser commitado. O refator começa pelo oráculo e termina pela remoção, e só depois de evidência em produção.',
          callout: 'Sequência correta: oráculo primeiro, remoção por último.' },
        { tipo: 'quebre', id: 'b6-quebre', titulo: 'Estrague o refator de propósito', enunciado: 'O controle negativo prova que a rede pega. Escolha uma falha, rode, e depois rode "Sem falha" para fechar o exercício. Saídas de execução real do lab em 11/10/2026.',
          prefixo: '$', entrada: DIF, unidade: 'etapa', terminalTitulo: 'cópia de trabalho do S01', etapas: etapas(),
          prever: { pergunta: 'Você muda TETO_PERCENTUAL de 20 para 25 no refatorado. O comando <code>cli golden</code> passa a falhar?', opcoes: [
            { id: 'a', texto: 'Sim: o golden pega qualquer mudança de desconto.', correta: false, porque: 'o golden observa o legado, que você não tocou.' },
            { id: 'b', texto: 'Não: continua 34/34, porque ele observa o legado; quem guarda o refator é a suíte e o diferencial.', correta: true, porque: 'cli golden sem --write só confere o legado contra o arquivo.' },
            { id: 'c', texto: 'Só falha se o relógio estiver na Black Friday.', correta: false, porque: 'o teto de 20% não depende de data.' }
          ] },
          falhas: [
            { id: 'teto', rotulo: 'Mudar TETO_PERCENTUAL de 20 para 25', efeito: { etapaFalha: 'diferencial', linhasErro: [
              L('info', 'src/design_lab/pedidos/descontos.py: TETO_PERCENTUAL = 25  (era 20)'),
              L('cmd', DIF),
              L('out', "aleatorio_3: legado={'ok': {... 'desconto': 78761, ... 'avisos': ['black friday', 'desconto limitado a 20%']}} refatorado={'ok': {... 'desconto': 86637, ... 'avisos': ['black friday']}}"),
              L('out', '...'),
              L('out', '2000 casos aleatórios (seed 2026), 74 divergências'),
              L('hint', 'exit=1'),
              L('cmd', SUITE),
              L('out', 'FAILED tests/test_caracterizacao.py::test_refatorado_responde_como_o_legado[teto_20pct]'),
              L('out', 'FAILED tests/test_caracterizacao.py::test_diferencial_2000_casos_sem_divergencia'),
              L('out', '2 failed, 163 passed in 0.30s')
            ], tutor: 'tanto o caso golden da borda (<code>teto_20pct</code>) quanto o diferencial acusam. Note que <code>cli golden</code> continua 34/34, porque ele observa o legado, não o refator. Reverta a edição (25 para 20) e confirme os 165 verdes. Uma suíte que nunca viu falhar não prova nada.' } }
          ],
          tutorAntes: 'Escolha "Mudar TETO_PERCENTUAL", aperte Enter e leia as divergências. Depois rode sem falha.',
          tutorDepois: 'Limite do diferencial: só cobre o que o gerador sabe produzir, e para ser útil precisa incluir erros e bordas (o lab verifica que 40 a 300 das 2.000 entradas resultam em erro). Variante mais forte: property-based testing (Hypothesis) com o legado como oráculo.',
          callout: 'Você viu a rede pegar a mudança e, depois, passar limpa.' },
        { tipo: 'python', id: 'b6-python', titulo: 'Grave o golden e ache a divergência', obrigatorio: false,
          enunciado: 'Implemente <code>caracterizar(funcao, casos)</code>, que grava <code>{"ok": saída}</code> ou <code>{"erro": mensagem}</code> por caso, <em>sem contaminar a entrada</em> (o legado muta os argumentos), e use-a em <code>divergencias</code>. O controle negativo dos testes aponta a borda errada (<code>&gt;</code> no lugar de <code>&gt;=</code>) e a mudança só de mensagem de erro.',
          codigo: [
      "import copy",
      "",
      "",
      "def caracterizar(funcao, casos):",
      "    \"\"\"casos: {nome: tupla de argumentos}. Grava o que o código faz hoje, erros inclusos.\"\"\"",
      "    golden = {}",
      "    for nome, args in casos.items():",
      "        # lacuna 1: passe uma CÓPIA dos argumentos (o legado pode mutar a entrada)",
      "        # lacuna 2: uma exceção também é comportamento: grave {\"erro\": str(erro)}",
      "        golden[nome] = {\"ok\": funcao(*args)}",
      "    return golden",
      "",
      "",
      "def divergencias(golden, funcao, casos):",
      "    \"\"\"Nomes dos casos em que funcao já não responde como o golden gravado.\"\"\"",
      "    agora = caracterizar(funcao, casos)",
      "    return sorted(nome for nome in golden if agora.get(nome) != golden[nome])"
    ].join('\n'),
          testes: [
      "def legado(itens):",
      "    itens.append(0)  # muta a entrada, como o legado do lab",
      "    if len(itens) > 10:",
      "        raise ValueError(\"itens demais\")",
      "    return sum(itens) * (2 if len(itens) >= 10 else 1)",
      "",
      "",
      "def refatorado_quebrado(itens):",
      "    return sum(itens) * (2 if len(itens) + 1 > 10 else 1)  # borda errada: > em vez de >=",
      "",
      "",
      "CASOS = {",
      "    \"nove_itens\": ([1] * 8,),",
      "    \"dez_itens\": ([1] * 9,),",
      "    \"onze_itens\": ([1] * 10,),",
      "    \"vazio\": ([],),",
      "}",
      "",
      "",
      "def test_grava_sucessos_e_erros_no_mesmo_arquivo():",
      "    g = caracterizar(legado, CASOS)",
      "    assert g[\"nove_itens\"] == {\"ok\": 8}",
      "    assert g[\"dez_itens\"] == {\"ok\": 18}",
      "    assert g[\"onze_itens\"] == {\"erro\": \"itens demais\"}",
      "    assert g[\"vazio\"] == {\"ok\": 0}",
      "",
      "",
      "def test_nao_contamina_a_entrada():",
      "    args = ([1, 2],)",
      "    caracterizar(legado, {\"a\": args, \"b\": args})",
      "    assert args == ([1, 2],)",
      "    g = caracterizar(legado, {\"a\": args, \"b\": args})",
      "    assert g[\"a\"] == g[\"b\"] == {\"ok\": 3}",
      "",
      "",
      "def test_mesma_funcao_nao_diverge():",
      "    g = caracterizar(legado, CASOS)",
      "    assert divergencias(g, legado, CASOS) == []",
      "",
      "",
      "def test_controle_negativo_a_borda_quebrada_e_apontada():",
      "    g = caracterizar(legado, CASOS)",
      "    achados = divergencias(g, refatorado_quebrado, CASOS)",
      "    assert \"dez_itens\" in achados",
      "    assert \"nove_itens\" not in achados",
      "",
      "",
      "def test_mudar_so_a_mensagem_de_erro_tambem_diverge():",
      "    def outro_erro(itens):",
      "        itens.append(0)",
      "        if len(itens) > 10:",
      "            raise ValueError(\"lista grande demais\")",
      "        return sum(itens) * (2 if len(itens) >= 10 else 1)",
      "",
      "    g = caracterizar(legado, CASOS)",
      "    assert divergencias(g, outro_erro, CASOS) == [\"onze_itens\"]"
    ].join('\n'),
          dica: 'Use <code>copy.deepcopy(args)</code> antes de chamar a função, e envolva a chamada em <code>try/except Exception as erro</code>, gravando <code>{"erro": str(erro)}</code>. Erro também é comportamento.',
          solucao: [
      "import copy",
      "",
      "",
      "def caracterizar(funcao, casos):",
      "    \"\"\"casos: {nome: tupla de argumentos}. Grava o que o código faz hoje, erros inclusos.\"\"\"",
      "    golden = {}",
      "    for nome, args in casos.items():",
      "        copia = copy.deepcopy(args)  # o legado pode mutar a entrada",
      "        try:",
      "            golden[nome] = {\"ok\": funcao(*copia)}",
      "        except Exception as erro:",
      "            golden[nome] = {\"erro\": str(erro)}",
      "    return golden",
      "",
      "",
      "def divergencias(golden, funcao, casos):",
      "    \"\"\"Nomes dos casos em que funcao já não responde como o golden gravado.\"\"\"",
      "    agora = caracterizar(funcao, casos)",
      "    return sorted(nome for nome in golden if agora.get(nome) != golden[nome])"
    ].join('\n'),
          tutorDepois: 'O lab copia os itens com <code>dict(i)</code> antes de chamar o legado, pelo mesmo motivo: uma chamada não pode contaminar a seguinte. E o erro entra no golden: um refator que muda só a mensagem diverge.',
          callout: 'O oráculo registra sucessos e erros, não contamina a entrada e acusa a borda quebrada.' },
        { tipo: 'takeaway', html: 'Passos pequenos com <mark>suíte verde</mark>; o <mark>controle negativo</mark> prova que a rede pega.' }
      ] },

      { rotulo: 'Conferir', blocos: [
        { tipo: 'texto', html:
          '<h3>Refatorar e pedir revisão: separe os commits</h3>' +
          '<p>Um PR que mistura refatoração e mudança de comportamento é impossível de revisar: o revisor não sabe se uma diferença é intencional. Regra de equipe: commits de refatoração não mudam testes de comportamento; commits de comportamento não movem código. O chapéu muda de um para o outro (Beck: "dois chapéus"), nunca os dois ao mesmo tempo. Para um agente vale o mesmo: peça refatoração e comportamento em tarefas separadas, e rode a suíte de caracterização como critério de aceitação.</p>' },
        { tipo: 'escolha', id: 'b6-esc-arredondamento', titulo: 'Arredondamento errado no legado',
          pergunta: 'Ao escrever testes de caracterização, você percebe que o código arredonda errado em um caso. O que fazer na refatoração?',
          opcoes: [
            { id: 'a', texto: 'Corrigir o arredondamento no meio da refatoração, já que é a mesma região de código.', correta: false, porque: 'mistura correção com reestruturação, torna a revisão impossível e esconde regressão.' },
            { id: 'b', texto: 'Apagar o teste que falha.', correta: false, porque: 'destrói o oráculo.' },
            { id: 'c', texto: 'Preservar o comportamento atual no teste, registrar a dúvida e decidir a correção em um commit separado, depois da refatoração.', correta: true, porque: 'duas mudanças, dois commits, dois "chapéus"; o diff do golden vira o registro da decisão.' },
            { id: 'd', texto: 'Reescrever o módulo inteiro a partir da especificação ideal.', correta: false, porque: 'costuma perder regras que só o legado conhece.' }
          ] },
        { tipo: 'escolha', id: 'b6-esc-costura', titulo: 'O que é uma costura',
          pergunta: 'O que é uma costura (seam) e por que ela ajuda a testar código legado?',
          opcoes: [
            { id: 'a', texto: 'Um ponto onde o comportamento pode ser trocado sem editar o código ali (por exemplo, o relógio), permitindo testar sem reescrever tudo.', correta: true, porque: 'depois de achar a costura, ela vira parâmetro e a dependência fica explícita; é o primeiro passo seguro.' },
            { id: 'b', texto: 'Uma linha de comentário que marca onde o código foi dividido.', correta: false, porque: 'costura não é marca.' },
            { id: 'c', texto: 'Um tipo especial de teste que roda no CI.', correta: false, porque: 'é uma propriedade do código.' },
            { id: 'd', texto: 'Uma ferramenta que gera mocks automaticamente.', correta: false, porque: 'a costura é o lugar; o mock é uma técnica de substituição.' }
          ] },
        { tipo: 'callout', tom: 'danger', titulo: 'Armadilha que pega sênior', html:
          '<p><strong>Corrigir bugs "de passagem".</strong> Você vê o expresso com isenção estranha, conserta no meio do refator, e o golden quebra; você "atualiza o golden" e perde o único registro do comportamento anterior. Faça o contrário: o golden é congelado; o conserto é um commit posterior que muda conscientemente o caso e cujo diff do golden é o registro da decisão. Outras: caracterização com dados de produção sem anonimização (copiar pedidos reais para o repositório) e mutar o objeto de entrada no legado (o lab copia os itens com <code>dict(i)</code> antes de chamar).</p>' },
        { tipo: 'callout', tom: 'neutral', titulo: 'Trade-offs', html:
          '<p>Reescrever do zero parece mais limpo e quase sempre perde regras que só o legado conhece (o "segundo sistema" de Brooks). Refatorar incrementalmente custa mais passos e um período com dois caminhos de código, ao preço de nunca perder o sistema funcionando. Caracterizar tudo é caro; caracterize a área que vai mudar. Para uma mudança grande em fronteira de sistema (estrangular um módulo inteiro), use as técnicas do M02A (mudança incremental e reversibilidade); aqui a escala é a função e o módulo.</p>' },
        { tipo: 'takeaway', html: 'Refatoração e mudança de comportamento em <mark>commits e chapéus separados</mark>.' }
      ] }
    ]
  });
})();
