/* E04 · Bloco 3: Code review como líder, inclusive de código gerado por IA. Fonte: E04.html#b03. */
(function () {
  var L = function (kind, text) { return { kind: kind, text: text }; };
  function opc(id, texto, correta, porque) { return { id: id, texto: texto, correta: correta, porque: porque }; }

  var codigo = `def prova_algo(teste, impl_nova, impl_antiga):
    """Aplica a regra "rode o teste novo contra o código antigo".

    teste(impl) devolve True se o teste passa com essa implementação.
    Uma exceção dentro do teste conta como teste que falhou.

    "quebrado":  o teste falha com a implementação nova
    "prova":     passa na nova e falha na antiga
    "nao_prova": passa nas duas
    """
    return "prova"


def total_novo(xs):
    return sum(xs)


def total_antigo(xs):
    return xs[0] + sum(xs[1:])  # IndexError com lista vazia


def teste_real(impl):
    return impl([]) == 0


def teste_tautologico(impl):
    esperado = 0
    return esperado == 0  # verifica a própria variável, não a implementação


print(prova_algo(teste_tautologico, total_novo, total_antigo))
`;
  var testes = `def test_teste_real_prova():
    assert prova_algo(teste_real, total_novo, total_antigo) == "prova"


def test_teste_tautologico_nao_prova_nada():
    assert prova_algo(teste_tautologico, total_novo, total_antigo) == "nao_prova"


def test_teste_que_falha_na_nova_esta_quebrado():
    assert prova_algo(lambda impl: impl([1, 2]) == 99, total_novo, total_antigo) == "quebrado"


def test_excecao_na_nova_tambem_e_falha():
    assert prova_algo(teste_real, total_antigo, total_antigo) == "quebrado"
`;
  var solucao = `def prova_algo(teste, impl_nova, impl_antiga):
    def passa(impl):
        try:
            return bool(teste(impl))
        except Exception:
            return False

    if not passa(impl_nova):
        return "quebrado"
    if passa(impl_antiga):
        return "nao_prova"
    return "prova"


def total_novo(xs):
    return sum(xs)


def total_antigo(xs):
    return xs[0] + sum(xs[1:])


def teste_real(impl):
    return impl([]) == 0


def teste_tautologico(impl):
    esperado = 0
    return esperado == 0
`;

  TrilhaAula.registrar({
    id: 'e04-b3',
    titulo: 'Code review como líder, inclusive de código gerado por IA',
    minutos: 35,
    resumo: 'Code review é a maior alavanca de ensino e a maior fila oculta do time. Com agentes, o volume de código subiu e a capacidade de revisão humana não: revisar bem e rápido virou política de capacidade.',
    objetivo: 'Revisar na ordem em que o erro é caro, escrever comentários que o outro consegue usar e verificar código gerado por IA com evidência, começando por rodar o teste novo contra o código antigo.',
    revisao: [
      { id: 'e04b3-ordem', pergunta: 'Qual a ordem do review de um líder?',
        opcoes: [
          opc('a', 'Intenção, tamanho e escopo, testes, desenho e fronteiras, risco operacional, legibilidade e nomes.', true, 'o líder inverte a pilha do novato: atenção onde o erro é caro, estilo para a máquina.'),
          opc('b', 'Estilo, nomes, testes, desenho, intenção.', false, 'é a pilha do revisor novato, que começa e para no estilo.'),
          opc('c', 'Cobertura, lint, formatação, depois intenção.', false, 'cobertura e lint são do gate automático.')] },
      { id: 'e04b3-teste-antigo', pergunta: 'Qual verificação é a mais barata e informativa num PR de agente com testes verdes e cobertura alta?',
        opcoes: [
          opc('a', 'Rodar o teste novo contra o código antigo: se passa, ele não prova nada.', true, 'um agente otimiza o sinal que lhe dão; cobertura alta com asserções fracas é o caso clássico.'),
          opc('b', 'Conferir o nome das variáveis.', false, 'nomes são o último item da pilha.'),
          opc('c', 'Confiar na cobertura já medida.', false, 'cobertura mede execução, não verificação.')] },
      { id: 'e04b3-prefixos', pergunta: 'Para que servem os prefixos bloqueante:, sugestão:, pergunta: e nit: nos comentários?',
        opcoes: [
          opc('a', 'Eliminar a ambiguidade sobre o que é obrigatório; combinados uma vez, economizam dezenas de ciclos de "isso é obrigatório?".', true, 'separar bloqueante de sugestão é o que mantém a velocidade.'),
          opc('b', 'Classificar o autor por nível de senioridade.', false, 'o comentário descreve o efeito, não a pessoa.'),
          opc('c', 'Substituir o SLA de revisão.', false, 'o SLA é um acordo à parte.')] },
      { id: 'e04b3-autor', pergunta: 'Quem responde por um PR gerado por agente?',
        opcoes: [
          opc('a', 'O autor que o abre, que deve explicar cada decisão não óbvia sem consultar o agente.', true, '"O agente fez" não é defesa nem justificativa; sem conseguir explicar, o PR não está pronto para revisão.'),
          opc('b', 'O agente.', false, 'o agente não responde por nada.'),
          opc('c', 'O revisor, porque aprovou.', false, 'o revisor valida; a responsabilidade é do autor.')] },
      { id: 'e04b3-aprovar', pergunta: 'Qual o critério do guia de code review do Google para aprovar?',
        opcoes: [
          opc('a', 'Aprovar quando a mudança melhora a saúde geral do código, mesmo que não seja como o revisor escreveria.', true, 'perfeição não é o padrão.'),
          opc('b', 'Aprovar só quando é idêntico ao que o revisor escreveria.', false, 'o padrão é melhoria da saúde do código.'),
          opc('c', 'Aprovar tudo que passa no CI.', false, 'o CI não avalia intenção nem desenho.')] }
    ],
    abas: [
      { rotulo: 'Entender', blocos: [
        { tipo: 'texto', html:
          '<p>Code review é a maior alavanca de ensino e a maior fila oculta do time. Cada PR esperando revisão é trabalho parado; cada comentário mal escrito é uma pessoa que passa a evitar você. Com agentes, o volume de código por pessoa subiu, mas a capacidade de revisão humana não. O relatório DORA 2026 sobre retorno de IA, resumido em imprensa técnica, destaca o review como ponto de alavanca: gerar código mais rápido perde valor se o review é lento ou raso (veja o bloco 6 e "Fontes"). Revisar bem e rápido deixou de ser cortesia e virou <strong>política de capacidade</strong>.</p>' +
          '<h3>A ordem do que revisar</h3>' +
          '<p>Revisores novatos começam pelo estilo e param no estilo. Um líder inverte a pilha: gasta atenção onde o erro é caro e deixa o que máquina verifica para a máquina.</p>' +
          '<ul><li><strong>Intenção.</strong> O PR resolve o problema declarado? Existe um problema declarado? Se a descrição não explica o porquê, devolva antes de ler código.</li>' +
          '<li><strong>Tamanho e escopo.</strong> Cabe em uma revisão com atenção (regra do lab: até 30 minutos)? Tem arquivos não relacionados? Devolver para dividir é um review legítimo.</li>' +
          '<li><strong>Testes.</strong> Falham sem a mudança? Cobrem borda e falha, ou só o caminho feliz? Verificam comportamento ou verificam mocks?</li>' +
          '<li><strong>Desenho e fronteiras.</strong> Responsabilidade no lugar certo, acoplamentos novos, contrato público, migração compatível.</li>' +
          '<li><strong>Risco operacional.</strong> Observabilidade, comportamento sob falha, rollback, dado sensível, custo.</li>' +
          '<li><strong>Legibilidade e nomes.</strong> Importa, mas é o último. Se formato e lint são automáticos (harness no M01), nenhum humano comenta estilo.</li></ul>' +
          '<p>O guia público de code review do Google resume o critério central: aprovar quando a mudança melhora a saúde geral do código, mesmo que não seja como o revisor escreveria. Perfeição não é o padrão. Separar "bloqueante" de "sugestão" é o que mantém a velocidade.</p>' },
        { tipo: 'ordene', id: 'b3-ordene', titulo: 'Ordene a pilha de um review de líder', obrigatorio: false,
          enunciado: 'Do primeiro ao último ponto de atenção. Use as setas e confira.',
          itens: [
            { id: 'nomes', texto: 'Legibilidade e nomes' },
            { id: 'risco', texto: 'Risco operacional: observabilidade, rollback, custo' },
            { id: 'intencao', texto: 'Intenção: o PR resolve o problema declarado?' },
            { id: 'testes', texto: 'Testes: falham sem a mudança? Cobrem borda e falha?' },
            { id: 'desenho', texto: 'Desenho e fronteiras: responsabilidade, contrato, migração' },
            { id: 'tamanho', texto: 'Tamanho e escopo: cabe em uma revisão com atenção?' }
          ],
          solucao: ['intencao', 'tamanho', 'testes', 'desenho', 'risco', 'nomes'],
          dica: 'Se a descrição nem diz o porquê, você devolve antes de ler código. Estilo vem por último.' },
        { tipo: 'takeaway', html: 'Revise na ordem: <mark>intenção, tamanho, testes, desenho, risco, legibilidade</mark>. O que a máquina verifica, deixe para a máquina.' }
      ] },

      { rotulo: 'Ver funcionando', blocos: [
        { tipo: 'texto', html:
          '<h3>Tom: escrever comentário que o outro consegue usar</h3>' +
          '<p>O comentário que funciona descreve o efeito ou a pergunta, não a pessoa, e diz se bloqueia.</p>' },
        { tipo: 'texto', largo: true, html:
          '<table><thead><tr><th>Em vez de</th><th>Escreva</th></tr></thead><tbody>' +
          '<tr><td>"Isso está errado."</td><td>"Se extrato vier vazio, a linha 48 lança <code>IndexError</code> e o worker reprocessa em loop. <strong>Bloqueante:</strong> precisa tratar o caso vazio."</td></tr>' +
          '<tr><td>"Por que você fez assim?"</td><td>"Qual foi a razão de abrir uma conexão por linha? Estou vendo 12 mil conexões em um extrato grande. Não bloqueante, mas quero entender se há restrição que não vi."</td></tr>' +
          '<tr><td>"Use um padrão melhor."</td><td>"Sugestão (não bloqueante): extrair a regra de conciliação para uma função pura facilita o teste. Posso fazer isso num PR separado se preferir."</td></tr>' +
          '<tr><td>"Ótimo!" (sem mais nada)</td><td>"Gostei de ter isolado o relógio em um parâmetro: o teste de fuso horário ficou simples."</td></tr>' +
          '</tbody></table>' },
        { tipo: 'texto', html:
          '<p>Prefixos curtos eliminam ambiguidade: <code>bloqueante:</code>, <code>sugestão:</code>, <code>pergunta:</code>, <code>nit:</code> (detalhe). Combine a convenção no time uma vez e ela economiza dezenas de ciclos de "isso é obrigatório?".</p>' +
          '<h3>Tempo de resposta e PRs pequenos</h3>' +
          '<p>O guia do Google estabelece que, fora emergência, o revisor responde no máximo em um dia útil; na prática, a primeira resposta em horas mantém o autor em contexto. Defina um acordo explícito do time (<strong>SLA de review</strong>): "primeira resposta em até 4 horas úteis; aprovação ou lista de bloqueantes em um dia". Meça o tempo até a primeira revisão e o tamanho mediano do PR: são indicadores de fluxo que você puxa do Git.</p>' +
          '<p>PRs pequenos não são preferência estética: são a mesma ideia de lotes pequenos que o DORA associa a melhor desempenho de entrega. O custo de revisão cresce mais que linearmente com o tamanho, porque a atenção do revisor decai. Alavancas: stacked PRs ou cadeia de commits revisáveis um a um, feature flags para mesclar incompleto com segurança e um limite sugerido (por exemplo, 400 linhas de diff "úteis", excluindo gerado) que dispara conversa, não bloqueio automático.</p>' +
          '<h3>Review de código gerado por IA</h3>' +
          '<p>Código gerado tem um perfil de falha diferente do humano. Raramente tem erro de sintaxe e quase sempre parece correto. Os problemas típicos estão na distância entre <strong>plausível</strong> e <strong>correto</strong>:</p>' +
          '<ul><li><strong>API inventada ou de versão errada:</strong> função que não existe na versão fixada, flag de CLI que nunca existiu.</li>' +
          '<li><strong>Teste tautológico:</strong> verifica o mock que o próprio agente configurou; passa com qualquer implementação.</li>' +
          '<li><strong>Tratamento de erro que engole:</strong> <code>except Exception: return []</code> devolve "plausível" no lugar de falhar.</li>' +
          '<li><strong>Dependência nova</strong> com nome parecido com a certa (typosquatting) ou licença incompatível.</li>' +
          '<li><strong>Escopo que cresce:</strong> o agente "melhora" arquivos que ninguém pediu, e o diff vira ilegível.</li>' +
          '<li><strong>Teste enfraquecido para passar:</strong> asserção afrouxada, teste pulado, tolerância ampliada.</li>' +
          '<li><strong>Duplicação:</strong> reimplementa um helper que já existe porque não o encontrou.</li></ul>' +
          '<p>O <code>templates/checklist-review-ia.md</code> do lab transforma isso em itens que exigem <em>evidência</em>, não "ok": link, trecho de teste, saída de comando. O item mais valioso e mais barato é rodar o teste novo contra o código antigo.</p>' },
        { tipo: 'rode', id: 'b3-rode', titulo: 'O teste novo detecta a mudança?', obrigatorio: true,
          enunciado: 'Faça a previsão e rode os comandos do checklist. As linhas mostram o resultado esperado em cada passo, não uma execução real.',
          prefixo: '$', entrada: 'git stash push -- src/ && uv run pytest tests/test_importacao.py', unidade: 's', terminalTitulo: 'verificação rápida',
          prever: { pergunta: 'Você tira só o código de produção e roda o teste novo. O teste PASSA. O que isso significa?', opcoes: [
            { id: 'a', texto: 'O teste é bom: passa com e sem a mudança, então é estável.', correta: false, porque: 'um teste que passa sem a mudança não distingue o código novo do antigo.' },
            { id: 'b', texto: 'O teste não prova nada sobre a mudança; provavelmente verifica um mock.', correta: true, porque: 'o teste novo DEVE falhar sem a mudança; se passa, não prova nada.' },
            { id: 'c', texto: 'A cobertura está alta, então tudo certo.', correta: false, porque: 'cobertura mede execução, não verificação.' }
          ] },
          etapas: [
            { id: 'stash', nome: 'Tirar o código de produção', descricao: 'Só src/', tom: 'dns', ms: 1, linhas: [
              L('cmd', 'git stash push -- src/'),
              L('hint', 'tira só o código de produção; os testes novos ficam')] },
            { id: 'pytest', nome: 'Rodar o teste novo', descricao: 'DEVE falhar', tom: 'request', ms: 4, linhas: [
              L('cmd', 'uv run pytest tests/test_importacao.py'),
              L('hint', 'esperado: o teste DEVE falhar. Se passar, não prova nada.')] },
            { id: 'pop', nome: 'Restaurar', descricao: 'Devolve a mudança', tom: 'response', ms: 1, linhas: [
              L('cmd', 'git stash pop'),
              L('hint', 'volta ao estado do PR')] }
          ] },
        { tipo: 'callout', tom: 'info', titulo: 'Responsabilidade no acordo do time', html:
          '<p>Quem abre o PR é o <strong>autor</strong>, independentemente de quem digitou. "O agente fez" não é defesa nem justificativa. O autor deve conseguir explicar cada decisão não óbvia sem consultar o agente. Se não consegue, o PR não está pronto para revisão: está pronto para o autor estudar.</p>' },
        { tipo: 'takeaway', html: 'Em código gerado, exija <mark>evidência</mark>: o teste novo precisa <mark>falhar sem a mudança</mark>.' }
      ] },

      { rotulo: 'Praticar', blocos: [
        { tipo: 'texto', html:
          '<p>Automatize a regra do teste contra o código antigo num mini-harness: dado um teste e duas implementações, diga se o teste prova alguma coisa. O exemplo é um <code>total(xs)</code> com um teste real e um tautológico.</p>' },
        { tipo: 'python', id: 'b3-python', titulo: 'O teste prova algo?', obrigatorio: false,
          enunciado: 'Implemente <code>prova_algo(teste, impl_nova, impl_antiga)</code> com os três resultados da docstring. Exceção dentro do teste conta como falha.',
          codigo: codigo, testes: testes,
          dica: 'Crie uma função interna <code>passa(impl)</code> com <code>try/except Exception</code> que devolve <code>False</code> em caso de erro. Cheque a nova primeiro: se falha, "quebrado".',
          solucao: solucao,
          tutorDepois: 'É a mesma ideia da mutação: um teste que não falha quando o código muda não está testando o código.',
          callout: 'O harness distingue teste que prova de teste que só acompanha o mock, que é o caso clássico de código gerado.' },
        { tipo: 'texto', html:
          '<h3>Exemplo trabalhado: PR de agente com 900 linhas</h3>' +
          '<p>Um colega abre um PR de 900 linhas, gerado por agente, "implementa a tela de revisão de exceções". Testes verdes, cobertura 94%. Seu review, em ordem: <strong>intenção</strong> ("bloqueante: descreva o comportamento esperado em 3 linhas e o que ficou fora"), <strong>tamanho</strong> ("bloqueante: divida em (a) migração + endpoint, (b) tela. Posso revisar (a) ainda hoje"), <strong>testes</strong> (o teste novo passa no código antigo: "bloqueante: este teste passa sem a mudança; ele verifica o mock do repositório. Preciso de um teste contra o banco de teste"), <strong>desenho</strong> (um helper de datas duplica <code>core/tempo.py</code>: "sugestão: reutilizar <code>core.tempo.para_utc</code>"). Você revisou pouco código e já devolveu valor: isso é muito mais útil que 40 comentários de nome de variável. Leia a sessão e ache a afirmação que a evidência não sustenta.</p>' },
        { tipo: 'transcript', id: 'b3-transcript', titulo: 'Ache a afirmação sem evidência', obrigatorio: false,
          enunciado: 'O agente defende o PR de 900 linhas. Uma das afirmações dele não é sustentada pelo que a sessão mostra. Clique na linha e aperte Conferir.',
          linhas: [
            { quem: 'agente', texto: 'Implementei a tela de revisão de exceções: 900 linhas, tela, endpoint e mudança de esquema.' },
            { quem: 'ferramenta', texto: 'pytest: 62 passed · cobertura 94%' },
            { quem: 'voce', texto: 'Rode o teste novo contra o código antigo.' },
            { quem: 'ferramenta', texto: 'git stash push -- src/ ; pytest tests/test_excecoes.py -> 1 passed' },
            { quem: 'agente', texto: 'Com 94% de cobertura, o teste novo está validado. Pode aprovar.' },
            { quem: 'voce', texto: 'Bloqueante: o teste passa sem a mudança; ele verifica o mock do repositório. Preciso de um teste contra o banco de teste.' }
          ],
          erradas: [4],
          explicacao: { 4: 'o teste passou com o código de produção removido, então não prova nada; cobertura mede execução, não verificação. Um agente otimiza o sinal que lhe dão.' } },
        { tipo: 'takeaway', html: 'Teste que <mark>passa sem a mudança</mark> não prova nada, por maior que seja a <mark>cobertura</mark>.' }
      ] },

      { rotulo: 'Conferir', blocos: [
        { tipo: 'texto', html:
          '<h3>Trade-offs e erros comuns</h3>' +
          '<ul><li><strong>Revisão por IA como primeira passada</strong> reduz erros mecânicos e acelera o ciclo; não substitui o humano para intenção, desenho e risco. Trate como lint inteligente, com falsos positivos, e nunca como aprovação.</li>' +
          '<li><strong>Dois revisores</strong> aumentam a pegada de erros e o tempo. Reserve para mudanças de alto risco (segurança, dinheiro, migração).</li>' +
          '<li><strong>Programar em par</strong> substitui parte do review assíncrono e é excelente para mudanças ambíguas; custa agenda.</li></ul>' +
          '<p>Erros comuns: aprovar com "LGTM" um PR que você não leu porque confia no autor ou no agente; reabrir no review uma decisão de desenho já tomada no RFC (o review valida a execução da decisão); comentar o que o formatador resolveria; deixar o PR sem resposta por dois dias e depois pedir uma refatoração grande.</p>' },
        { tipo: 'callout', tom: 'danger', titulo: 'Armadilha que pega sênior: cobertura como prova', html:
          '<p>Um agente otimiza o sinal que lhe dão: se o gate é "cobertura > 90%", ele escreve testes que cobrem sem verificar. O sênior confia no gate porque funcionou com humanos. Contra agentes, confie na <strong>mutação</strong> (o teste falha se eu quebrar o código?) e no teste contra o código antigo, não no número de cobertura.</p>' },
        { tipo: 'escolha', id: 'b3-esc1', titulo: 'PR de agente com cobertura 96%',
          pergunta: 'PR de agente: testes verdes, cobertura 96%. Qual verificação é a mais barata e informativa?',
          opcoes: [
            { id: 'a', texto: 'Conferir o nome das variáveis.', correta: false, porque: 'nomes são o último item da pilha.' },
            { id: 'b', texto: 'Rodar o teste novo contra o código antigo: se ele passa, não prova nada.', correta: true, porque: 'o teste tem que falhar sem a mudança.' },
            { id: 'c', texto: 'Confiar na cobertura, que já foi medida.', correta: false, porque: 'agentes otimizam o sinal do gate; cobertura alta com asserções fracas é o caso clássico.' }
          ] },
        { tipo: 'escolha', id: 'b3-esc2', titulo: 'Como devolver um PR de 900 linhas',
          pergunta: 'O PR mistura tela, endpoint e mudança de esquema. Qual comentário de líder é o melhor?',
          opcoes: [
            { id: 'a', texto: '"Isso está grande demais."', correta: false, porque: 'descreve o julgamento, não o efeito nem o caminho.' },
            { id: 'b', texto: '"Bloqueante: divida em (a) migração + endpoint e (b) tela. Posso revisar (a) ainda hoje."', correta: true, porque: 'diz se bloqueia, dá o caminho e oferece uma resposta rápida.' },
            { id: 'c', texto: '40 comentários sobre nomes de variáveis no PR inteiro.', correta: false, porque: 'estilo é o último item da pilha, e o tamanho já impede a revisão com atenção.' }
          ] },
        { tipo: 'takeaway', html: 'Prefixe comentários com <mark>bloqueante, sugestão, pergunta</mark>, combine um <mark>SLA</mark> e deixe claro que o <mark>autor</mark> responde pelo PR.' }
      ] }
    ]
  });
})();
