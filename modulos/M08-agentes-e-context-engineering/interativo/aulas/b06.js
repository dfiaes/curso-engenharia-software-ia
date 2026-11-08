/* M08 · Bloco 6: Memória e multi-agente. Fonte: M08.html#b06. Exemplo condutor: o agente investigador e a tabela fatos_agente. */
(function () {
  var L = function (kind, text) { return { kind: kind, text: text }; };
  function opc(id, texto, correta, porque) { return { id: id, texto: texto, correta: correta, porque: porque }; }

  var codigoMem = String.raw`class Memoria:
    """Fatos duráveis com evidência e validade (espelha a tabela fatos_agente)."""

    def __init__(self):
        self.fatos = []

    def registrar(self, fato, evidencia, commit):
        """evidencia: lista de (caminho, linha_ini, linha_fim). Devolve True se gravou."""
        # TODO 1: fato sem evidência não entra
        # TODO 2: o mesmo (fato, commit) não duplica
        self.fatos.append({"fato": fato, "evidencia": evidencia,
                           "valido_para": commit, "invalidado_em": None})
        return True

    def invalidar(self, caminhos_alterados, commit_novo):
        """Marca invalidado_em nos fatos vigentes cuja evidência cita um arquivo alterado.
        Não apaga: o histórico serve para auditoria. Devolve quantos foram invalidados."""
        # TODO 3
        return 0

    def vigentes(self):
        return [f["fato"] for f in self.fatos if f["invalidado_em"] is None]
`;
  var solucaoMem = String.raw`class Memoria:
    def __init__(self):
        self.fatos = []

    def registrar(self, fato, evidencia, commit):
        if not evidencia:
            return False
        if any(f["fato"] == fato and f["valido_para"] == commit for f in self.fatos):
            return False
        self.fatos.append({"fato": fato, "evidencia": evidencia,
                           "valido_para": commit, "invalidado_em": None})
        return True

    def invalidar(self, caminhos_alterados, commit_novo):
        n = 0
        for f in self.fatos:
            if f["invalidado_em"] is not None:
                continue
            if any(caminho in caminhos_alterados for caminho, _, _ in f["evidencia"]):
                f["invalidado_em"] = commit_novo
                n += 1
        return n

    def vigentes(self):
        return [f["fato"] for f in self.fatos if f["invalidado_em"] is None]
`;
  var testesMem = String.raw`def test_fato_com_evidencia_entra():
    m = Memoria()
    assert m.registrar("fechar_pedido chama calcular_total", [("loja.py", 12, 20)], "c1")
    assert m.vigentes() == ["fechar_pedido chama calcular_total"]


def test_fato_sem_evidencia_nao_entra():
    m = Memoria()
    assert m.registrar("achei que sim", [], "c1") is False
    assert m.vigentes() == []


def test_mesmo_fato_no_mesmo_commit_nao_duplica():
    m = Memoria()
    m.registrar("F", [("a.py", 1, 2)], "c1")
    assert m.registrar("F", [("a.py", 1, 2)], "c1") is False
    assert len(m.fatos) == 1


def test_mudanca_no_arquivo_citado_invalida_so_o_que_depende_dele():
    m = Memoria()
    m.registrar("F1", [("loja.py", 1, 5)], "c1")
    m.registrar("F2", [("outro.py", 1, 5)], "c1")
    assert m.invalidar({"loja.py"}, "c2") == 1
    assert m.vigentes() == ["F2"]


def test_invalidar_nao_apaga_o_historico():
    m = Memoria()
    m.registrar("F1", [("loja.py", 1, 5)], "c1")
    m.invalidar({"loja.py"}, "c2")
    assert len(m.fatos) == 1 and m.fatos[0]["invalidado_em"] == "c2"
    assert m.invalidar({"loja.py"}, "c3") == 0
`;

  TrilhaAula.registrar({
    id: 'm08-b6',
    titulo: 'Memória e multi-agente',
    minutos: 40,
    resumo: 'Memória e multi-agente resolvem problemas específicos: se você não consegue nomear o problema, não precisa deles. Memória é cache com política de invalidação; multi-agente só compensa com isolamento de contexto ou paralelismo real, e ambos exigem medição.',
    objetivo: 'Separar observação de fato durável, gravar fatos com evidência e gatilho de invalidação, e aplicar o teste honesto antes de partir para multi-agente.',
    revisao: [
      { id: 'm08b6-fato', pergunta: 'Qual destes itens merece virar memória durável do agente?',
        opcoes: [
          opc('a', '"O método Processar é chamado por 7 classes", com evidência (arquivo:linha) e commit de referência', true, 'fato durável exige evidência e gatilho de invalidação (o commit mudou, o fato pode ter morrido).'),
          opc('b', '"O arquivo X tem 400 linhas"', false, 'observação temporária: vale nesta execução.'),
          opc('c', '"A busca devolveu 12 resultados"', false, 'observação temporária, propriedade de um passo.'),
          opc('d', '"O usuário perguntou sobre pagamentos às 14h"', false, 'é histórico episódico, não fato do mundo.')] },
      { id: 'm08b6-multi', pergunta: 'As subtarefas do seu agente são sequenciais: a segunda usa o resultado da primeira. Multi-agente ajuda?',
        opcoes: [
          opc('a', 'Não: dependência entre subtarefas é sequencial; ele só compensa com independência real (paralelismo) ou isolamento de contexto medido', true, 'multi-agente tem custos reais: tokens multiplicados, perda na fronteira, N traces e coordenação.'),
          opc('b', 'Sim: sempre que há mais de uma subtarefa', false, 'duas subtarefas em ordem fixa são um workflow.'),
          opc('c', 'Sim: reduz tokens por multiplicar contextos', false, 'multiplicar contextos aumenta tokens, não reduz.')] },
      { id: 'm08b6-cache', pergunta: 'Por que memória de agente é "cache com política de invalidação" e não "banco de tudo"?',
        opcoes: [
          opc('a', 'Servir fato velho não gera erro: gera afirmação confiante e errada, então todo item precisa de chave, validade e gatilho de invalidação', true, 'as mesmas perguntas do cache: chave, TTL, o que invalida, custo de servir dado velho.'),
          opc('b', 'Porque bancos são lentos demais para o agente', false, 'o problema não é velocidade.'),
          opc('c', 'Porque o agente só lembra de 10 itens', false, 'não há esse limite: há política.')] },
      { id: 'm08b6-just', pergunta: 'Quais são as duas justificativas legítimas para multi-agente?',
        opcoes: [
          opc('a', 'Isolamento de contexto (lê 50 mil tokens, devolve 1,5 mil de resumo) e paralelismo real de tarefas independentes', true, 'ambas exigem medição prévia; sem número, subagente é decoração.'),
          opc('b', 'Parecer mais sofisticado e dividir o prompt em papéis', false, 'a metáfora de papéis induz multi-agente onde não precisa.'),
          opc('c', 'Economizar tokens e simplificar a depuração', false, 'multi-agente multiplica tokens e traces.')] },
      { id: 'm08b6-tipos', pergunta: 'Onde vive a memória procedimental ("como fazer as coisas aqui")?',
        opcoes: [
          opc('a', 'No system prompt, nas skills e no AGENTS.md', true, 'a de trabalho vive na janela e nas notas; a episódica e a semântica, em banco ou índice.'),
          opc('b', 'Na janela de contexto', false, 'a janela é escopo de trabalho, a memória de curto prazo.'),
          opc('c', 'No histórico de execuções', false, 'esse é o episódico.')] }
    ],
    abas: [
      { rotulo: 'Entender', blocos: [
        { tipo: 'texto', html:
          '<p>Dois assuntos que o mercado trata como sinônimo de sofisticação e que, mal aplicados, só adicionam custo e modos de falha. A regra que atravessa o bloco: <strong>memória e multi-agente resolvem problemas específicos; se você não consegue nomear o problema, não precisa deles</strong>.</p>' +
          '<h3>O vocabulário de "memória"</h3>' +
          '<p>A palavra cobre pelo menos quatro coisas. <strong>Curto prazo</strong> é a janela de contexto: não é memória, é escopo de trabalho. <strong>Longo prazo</strong> é persistência entre sessões, o assunto deste bloco. <strong>Semântica × episódica</strong> vem da psicologia cognitiva: fatos sobre o mundo × registros de eventos vividos. <strong>Procedimental</strong> é como fazer, e na prática mora no prompt e nas skills. Bibliotecas como mem0, Zep/Graphiti e os módulos dos frameworks implementam recortes diferentes disso, quase sempre combinando um banco de fatos com recuperação vetorial. Adotar uma sem dizer qual dos quatro tipos você precisa, e o que invalida cada item, é comprar um cache sem política de invalidação.</p>' },
        { tipo: 'texto', largo: true, html:
          '<table><thead><tr><th>Tipo</th><th>O que guarda</th><th>Vive onde</th><th>No Capstone</th></tr></thead><tbody>' +
          '<tr><td>De trabalho (curto prazo)</td><td>o estado da tarefa atual</td><td>janela de contexto + notas do bloco 4</td><td>fatos estabelecidos durante uma investigação</td></tr>' +
          '<tr><td>Episódica</td><td>o que aconteceu em sessões anteriores</td><td>banco: histórico de execuções, perguntas feitas</td><td>"você já perguntou isso ontem; a resposta foi X"</td></tr>' +
          '<tr><td>Semântica (conhecimento durável)</td><td>fatos sobre o mundo/domínio que valem além da sessão</td><td>banco/índice: o corpus indexado (M07) e, no M10, o grafo</td><td>"a tabela PEDIDO é acessada por 12 classes"</td></tr>' +
          '<tr><td>Procedimental</td><td>como fazer as coisas aqui</td><td>system prompt, skills, AGENTS.md</td><td>"ao investigar impacto, comece pela definição"</td></tr>' +
          '</tbody></table>' },
        { tipo: 'texto', html:
          '<h3>Observação × fato</h3>' +
          '<p>O erro clássico de "memória de agente" é gravar tudo o que aconteceu e recuperar por similaridade: sai um RAG ruim sobre lixo conversacional, e o agente "lembra" de coisas que eram temporárias. A disciplina separa três coisas:</p>' +
          '<ul><li><strong>Observação temporária</strong>: "o arquivo X tem 400 linhas", "a busca devolveu 12 resultados". Vale nesta execução e não vira memória.</li>' +
          '<li><strong>Fato durável</strong>: "o método Processar é chamado por 7 classes (evidência: …)". Vale até o código mudar. Vira memória, com validade.</li>' +
          '<li><strong>Preferência do usuário</strong>: "este cliente quer o relatório em português, sem jargão". Vale até ele mudar de ideia. Vira memória, com origem declarada.</li></ul>' +
          '<p>Se você não consegue dizer quando um item deixa de valer, ele não deveria estar lá. Todo fato durável precisa de <strong>evidência</strong> (de onde veio) e de <strong>gatilho de invalidação</strong> (o commit mudou, o fato sobre o código pode ter morrido). O M10 formaliza isso com grafo temporal.</p>' },
        { tipo: 'callout', tom: 'danger', titulo: 'Memória é cache, e cache velho mente com confiança', html:
          '<p>As mesmas perguntas do cache (M05 bloco 5): qual a chave? qual o TTL? o que invalida? qual o custo de servir dado velho? A diferença é que aqui servir dado velho não gera erro: gera uma <strong>afirmação confiante e errada</strong>, que é pior.</p>' },
        { tipo: 'takeaway', html: 'Sem saber <mark>quando o item deixa de valer</mark>, ele não é fato durável: é <mark>observação</mark>.' }
      ] },

      { rotulo: 'Ver funcionando', blocos: [
        { tipo: 'texto', html:
          '<h3>Memória sem virar RAG ruim</h3>' +
          '<p>A tabela guarda o fato, a evidência (caminho e faixa de linhas), a origem, o commit em que o fato foi estabelecido e o momento em que deixou de valer. O índice parcial indexa só o que vale.</p>' },
        { tipo: 'codigo', linguagem: 'sql', texto: [
          'CREATE TABLE fatos_agente (',
          '  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,',
          '  tenant_id bigint NOT NULL REFERENCES tenants(id),',
          '  repo_id bigint NOT NULL REFERENCES repos(id),',
          '  fato text NOT NULL,',
          '  evidencia jsonb NOT NULL,        -- [{caminho, linha_ini, linha_fim}]',
          "  origem text NOT NULL,            -- 'investigacao' | 'parse' | 'usuario'",
          '  valido_para text NOT NULL,       -- o commit em que o fato foi estabelecido',
          '  invalidado_em timestamptz,       -- NULL = ainda vale',
          '  criado_em timestamptz NOT NULL DEFAULT now(),',
          '  UNIQUE (tenant_id, repo_id, fato, valido_para)',
          ');',
          'CREATE INDEX ix_fatos_vigentes ON fatos_agente (tenant_id, repo_id)',
          '  WHERE invalidado_em IS NULL;     -- índice parcial: só o que vale'].join('\n') },
        { tipo: 'texto', html:
          '<p>Três regras de operação fazem essa tabela funcionar: (1) <strong>fato sem evidência não entra</strong>, a mesma exigência de citação do M07; (2) mudança de commit nos arquivos citados <strong>invalida</strong> os fatos correspondentes, com um <code>UPDATE … SET invalidado_em = now()</code> na ingestão incremental e não um <code>DELETE</code>, porque o histórico serve para auditoria; (3) o agente lê os fatos vigentes como <strong>contexto inicial</strong>, o que economiza a redescoberta, e é aqui que a memória se paga.</p>' },
        { tipo: 'complete', id: 'b6-complete-invalida', titulo: 'Complete a invalidação', linguagem: 'sql',
          enunciado: 'Na ingestão incremental, o arquivo <code>loja.py</code> mudou no commit novo. Escolha a peça certa em cada lacuna.',
          partes: [
            '-- fatos cuja evidência cita loja.py deixam de valer\n',
            { lacuna: 'cmd', opcoes: ['UPDATE fatos_agente SET invalidado_em = now()', 'DELETE FROM fatos_agente', 'TRUNCATE fatos_agente'], correta: 'UPDATE fatos_agente SET invalidado_em = now()' },
            '\n WHERE tenant_id = :t AND repo_id = :r\n   AND ',
            { lacuna: 'vig', opcoes: ['invalidado_em IS NULL', 'valido_para = :commit_novo', 'origem = \'usuario\''], correta: 'invalidado_em IS NULL' },
            '\n   AND evidencia @> ',
            { lacuna: 'ev', opcoes: ['\'[{"caminho": "loja.py"}]\'', '\'loja.py\'', '\'[]\''], correta: '\'[{"caminho": "loja.py"}]\'' },
            ';\n'
          ],
          explicacao: 'UPDATE preserva o histórico para auditoria; DELETE o destrói. O filtro <code>invalidado_em IS NULL</code> casa com o índice parcial e evita reinvalidar. O operador <code>@&gt;</code> do jsonb procura o arquivo citado na evidência.',
          callout: 'Invalidação montada: marca em vez de apagar, só nos fatos vigentes que citam o arquivo alterado.' },
        { tipo: 'texto', html:
          '<h3>Multi-agente: quando compensa</h3>' +
          '<p>Multi-agente é o orchestrator-workers do bloco 2 levado a sério, com duas justificativas legítimas:</p>' +
          '<ul><li><strong>Isolamento de contexto.</strong> Um subagente explora 50 mil tokens de código e devolve 1.500 de resumo; o coordenador nunca vê os 50 mil. É o motivo mais forte e o mais frequentemente correto (bloco 4).</li>' +
          '<li><strong>Paralelismo real.</strong> Três investigações independentes simultâneas reduzem a latência total, desde que sejam mesmo independentes (M01 bloco 4: interseção vazia).</li></ul>' +
          '<p>Os custos que quase ninguém contabiliza: <strong>multiplicação de tokens</strong> (cada subagente repete instruções e contexto base), <strong>perda de informação na fronteira</strong> (o resumo descarta o que o coordenador precisaria), <strong>depuração</strong> (agora são N traces) e <strong>coordenação</strong> (decompor mal custa N execuções ruins em vez de uma).</p>' },
        { tipo: 'callout', tom: 'info', titulo: 'O teste honesto antes de partir para multi-agente', html:
          '<ol><li>As subtarefas são realmente independentes, ou uma depende do resultado da outra? Se dependem, é sequencial e dispensa multi-agente.</li>' +
          '<li>O resumo de 1 a 2 mil tokens basta para o coordenador decidir? Se ele precisar do detalhe, o isolamento não funciona.</li>' +
          '<li>Você mediu que o agente único falha por contexto? Se não mediu, resolve um problema hipotético.</li></ol>' +
          '<p>No começo, quase sempre é overengineering: a arquitetura certa é agente único com ferramentas boas e compactação. O ponto em que passa a valer é mensurável: o contexto estoura de forma consistente, ou a latência sequencial vira problema de produto.</p>' },
        { tipo: 'takeaway', html: 'Fato <mark>sem evidência não entra</mark>, mudança no arquivo citado <mark>invalida</mark> (marca, não apaga); multi-agente só <mark>depois de medir</mark>.' }
      ] },

      { rotulo: 'Praticar', blocos: [
        { tipo: 'texto', largo: true, html:
          '<h3>Padrões de multi-agente</h3>' +
          '<table><thead><tr><th>Padrão</th><th>Estrutura</th><th>Quando</th><th>Risco</th></tr></thead><tbody>' +
          '<tr><td>Supervisor</td><td>um coordenador delega a especialistas e sintetiza</td><td>o mais comum e o mais previsível</td><td>coordenador vira gargalo e ponto único de erro de decomposição</td></tr>' +
          '<tr><td>Hierárquico</td><td>supervisores de supervisores</td><td>tarefas realmente grandes (raro)</td><td>custo e latência explodem; depuração inviável</td></tr>' +
          '<tr><td>Rede (peer-to-peer)</td><td>agentes conversam sem hierarquia</td><td>quase nunca em produto</td><td>não termina; custo imprevisível; sem ponto de controle</td></tr>' +
          '<tr><td>Pipeline de especialistas</td><td>saída de um é entrada do outro, em ordem fixa</td><td>quando a ordem é conhecida</td><td>nenhum relevante, mas isso é um workflow (bloco 1), não multi-agente</td></tr>' +
          '</tbody></table>' +
          '<p>Metade do que o mercado chama de "sistema multi-agente" é um workflow com agentes nos nós. É bom: previsível e depurável. Só não chame de autonomia.</p>' },
        { tipo: 'python', id: 'b6-python-memoria', titulo: 'Escreva a memória de fatos', obrigatorio: false,
          enunciado: 'Implemente <code>registrar</code> (sem evidência não entra; o mesmo fato no mesmo commit não duplica) e <code>invalidar</code> (marca <code>invalidado_em</code> nos fatos vigentes cuja evidência cita um arquivo alterado, sem apagar). Biblioteca padrão, sem banco.',
          codigo: codigoMem, testes: testesMem,
          dica: 'Em registrar, devolva False cedo se evidencia estiver vazia ou se já existir um item com o mesmo fato e valido_para. Em invalidar, percorra os fatos ainda vigentes e confira se algum caminho da evidência está em caminhos_alterados.',
          solucao: solucaoMem,
          tutorDepois: 'É a tabela fatos_agente em miniatura: a segunda pergunta igual fica mais barata porque os fatos vigentes entram como contexto inicial, e deixa de valer quando o arquivo citado muda.',
          callout: 'Memória com evidência obrigatória, sem duplicata e com invalidação que preserva o histórico.' },
        { tipo: 'cenario', id: 'b6-cenario-multi', titulo: 'Dividir em subagentes?', obrigatorio: false,
          enunciado: 'O agente investigador responde bem, mas uma pergunta de impacto ficou lenta. Alguém propõe três subagentes. Decida.',
          inicio: 'inicio',
          nos: {
            inicio: { texto: 'A proposta: um supervisor com três subagentes, um por módulo. Ninguém mediu o pico de contexto do agente único. O que você faz primeiro?', opcoes: [
              { texto: 'Aprovar: três agentes são mais rápidos que um.', vai: 'f-decoracao', tom: 'ruim', consequencia: 'sem medição, o subagente é decoração e multiplica tokens.' },
              { texto: 'Medir o pico de contexto do agente único e perguntar se as subtarefas são independentes.', vai: 'medido', tom: 'ok', consequencia: 'o teste honesto começa por medir, não por desenhar.' }
            ] },
            medido: { texto: 'O pico passa de dezenas de milhares de tokens, mas a segunda busca depende do resultado da primeira. O que sai disso?', opcoes: [
              { texto: 'Manter sequencial, com compactação e notas; se o pico for o problema, usar um subagente-ferramenta com contrato (entrada estruturada, orçamento próprio menor, resumo de 1 a 2 mil tokens).', vai: 'f-bom', tom: 'ok', consequencia: 'isolamento de contexto medido justifica o subagente; paralelismo não se aplica a passos dependentes.' },
              { texto: 'Paralelizar os três módulos mesmo assim.', vai: 'f-dependente', tom: 'ruim', consequencia: 'passos dependentes não paralelizam: você paga três contextos e espera o mesmo tempo.' }
            ] }
          },
          finais: {
            'f-bom': { bom: true, texto: 'Decisão com número: o subagente entra como ferramenta com contrato, só onde o pico de contexto justifica.' },
            'f-decoracao': { bom: false, texto: 'Arquitetura mais cara, com N traces para depurar e nenhum ganho medido.' },
            'f-dependente': { bom: false, texto: 'Custo multiplicado por três e latência igual: a dependência entre as buscas não foi respeitada.' }
          },
          callout: 'Você mediu antes de dividir e deu ao subagente um contrato, não uma autonomia.' },
        { tipo: 'takeaway', html: 'Subagente é uma <mark>ferramenta com contrato</mark>: entrada estruturada, <mark>orçamento próprio menor</mark>, saída resumida.' }
      ] },

      { rotulo: 'Conferir', blocos: [
        { tipo: 'escolha', id: 'b6-escolha-fato', titulo: 'Confira: o que vira memória',
          pergunta: 'Ao fim de uma investigação, o agente tem quatro candidatos a memória. Qual deve ser gravado como fato durável?',
          opcoes: [
            { id: 'a', texto: '"A busca devolveu 12 resultados."', correta: false, porque: 'observação desta execução.' },
            { id: 'b', texto: '"fechar_pedido chama calcular_total" com caminho e linhas e o commit de referência.', correta: true, porque: 'tem evidência e um gatilho de invalidação claro: o commit mudou nos arquivos citados.' },
            { id: 'c', texto: '"O arquivo tem 400 linhas."', correta: false, porque: 'propriedade volátil que o próximo commit muda.' },
            { id: 'd', texto: '"O usuário perguntou às 14h."', correta: false, porque: 'é episódico, vive no histórico de execuções.' }
          ], tutorDepois: 'Se você não sabe quando o item deixa de valer, ele não devia estar lá.' },
        { tipo: 'escolha', id: 'b6-escolha-multi', titulo: 'Confira: o resumo basta?',
          pergunta: 'Um coordenador delega a um subagente que lê 30 mil tokens e devolve 1,5 mil. O coordenador erra porque precisava de um detalhe que o resumo descartou. Qual custo do multi-agente se materializou?',
          opcoes: [
            { id: 'a', texto: 'Multiplicação de tokens.', correta: false, porque: 'é um custo real, mas não é o que aconteceu aqui.' },
            { id: 'b', texto: 'Perda de informação na fronteira: o isolamento só funciona se 1 a 2 mil tokens bastam para o coordenador decidir.', correta: true, porque: 'é a segunda pergunta do teste honesto; o contrato de saída deve pedir fatos + evidências.' },
            { id: 'c', texto: 'Dificuldade de depuração.', correta: false, porque: 'também existe, mas o sintoma descrito é o resumo insuficiente.' }
          ], tutorDepois: 'Contrato de saída vago ou orçamento pequeno demais gera resumo inútil: marque a resposta como parcial.' },
        { tipo: 'takeaway', html: 'Memória é <mark>cache com política</mark>; multi-agente é <mark>medido antes</mark>, nunca por moda.' }
      ] }
    ]
  });
})();
