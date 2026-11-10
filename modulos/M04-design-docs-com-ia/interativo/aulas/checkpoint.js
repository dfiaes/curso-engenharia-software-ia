/* M04 · Checkpoint: sete cenários, avaliação sem consulta. Rubrica = "Basta"; modelo = resposta esperada. Os entregáveis verificados (gates do lab, mutante, ADR e postmortem no verificador) são do Laboratório guiado, fora desta página. */
(function () {
  var reprova = function (t) { return '<p><strong>Reprova:</strong> ' + t + '</p>'; };
  function opc(id, texto, correta, porque) { return { id: id, texto: texto, correta: correta, porque: porque }; }

  TrilhaAula.registrar({
    id: 'm04-checkpoint',
    titulo: 'Checkpoint M04',
    minutos: 40,
    resumo: 'Sete cenários sobre documentação como insumo de execução, sem consulta. Responda com as suas palavras; a rubrica diz o que basta e o que reprova.',
    objetivo: 'Verificar, sem consulta, se você explica a inversão econômica da documentação, defende e critica ADRs, escolhe o nível de diagrama, separa o mecânico do semântico no doc drift e escreve um postmortem blameless.',
    revisao: [
      { id: 'm04cp-poison', pergunta: 'Qual a ordem de confiança que o agente deve seguir quando doc e código divergem?',
        opcoes: [
          opc('a', 'Teste que roda, código, doc gerada, doc escrita à mão', true, 'a doc escrita à mão é a primeira a ser tratada como bug.'),
          opc('b', 'Doc escrita à mão, doc gerada, código, teste', false, 'inverte a hierarquia.'),
          opc('c', 'A mais recente', false, 'data não é critério.')] },
      { id: 'm04cp-adr', pergunta: 'Um ADR é atacado: "por que não Mongo?". Qual defesa é válida?',
        opcoes: [
          opc('a', 'Apontar o custo declarado e o "o que me faria mudar de ideia", ou reconhecer o erro e abrir um ADR que substitui', true, 'ambos valem; "porque é melhor" sem restrição reprova.'),
          opc('b', '"Porque é melhor."', false, 'sem restrição real não é defesa.'),
          opc('c', 'Editar o ADR antigo para incluir o argumento', false, 'ADR é imutável.')] },
      { id: 'm04cp-diagrama', pergunta: 'Qual é a diferença entre container e componente no C4?',
        opcoes: [
          opc('a', 'Container é unidade executável ou implantável (L2); componente é um bloco dentro de um container (L3)', true, 'e o L4 (código) se gera, não se desenha.'),
          opc('b', 'São sinônimos', false, 'são níveis diferentes de zoom.'),
          opc('c', 'Componente é o banco; container é a API', false, 'ambos podem ser containers.')] },
      { id: 'm04cp-drift', pergunta: 'Por que só uma das quatro classes de doc drift justifica chamar um LLM?',
        opcoes: [
          opc('a', 'As outras são mecânicas e determinísticas; a contradição semântica exige ler diff e doc juntos', true, 'mecânico primeiro, semântico depois.'),
          opc('b', 'LLM é grátis para a classe semântica', false, 'custa tokens; por isso o gate.'),
          opc('c', 'As outras classes são raras', false, 'as três primeiras são 80% dos casos.')] },
      { id: 'm04cp-post', pergunta: 'O que o postmortem blameless exige como saída obrigatória?',
        opcoes: [
          opc('a', 'Ações com dono e prazo, que só fecham quando as ações fecham', true, 'sem ação rastreável é redação.'),
          opc('b', 'O nome de quem errou', false, 'culpa esconde informação.'),
          opc('c', 'Um parágrafo de desculpas ao cliente', false, 'não é a saída do documento técnico.')] }
    ],
    abas: [
      { rotulo: 'Economia, decisão e diagrama', blocos: [
        { tipo: 'texto', html:
          '<p>Uma pergunta por vez, sem consulta. Cada pergunta é um cenário; a rubrica diz o que basta. Reprovar é permitido: volte ao bloco indicado e tente de novo. Os entregáveis verificados (gates do laboratório, mutante de referência quebrada, ADR e postmortem passando no verificador, prompt do revisor versionado) você mostra rodando no Laboratório guiado.</p>' },

        { tipo: 'escolha', id: 'cp-esc-p1', titulo: 'P1 · Aquecimento: o leitor agente',
          pergunta: 'Um agente lê um <code>ARCHITECTURE.md</code> que diz "lote de 100" enquanto o código usa 500. Por que isso é pior que não ter doc?',
          opcoes: [
            { id: 'a', texto: 'O agente obedece com confiança e produz código coerente com um sistema que não existe mais; doc ausente ao menos dispara a pergunta.', correta: true, porque: 'doc velha vira erro confiante: o context poisoning.' },
            { id: 'b', texto: 'Doc velha gasta mais tokens que doc ausente.', correta: false, porque: 'o custo em tokens não é o problema.' },
            { id: 'c', texto: 'O agente desconfia e confere o código, atrasando a tarefa.', correta: false, porque: 'quem desconfia é o humano.' }
          ] },
        { tipo: 'escreva', id: 'cp-p1', titulo: 'P1 · Inversão econômica', obrigatorio: false,
          enunciado: 'Explique, com os dois consumidores (humano e agente), por que doc desatualizada é pior que ausente para um agente. Classifique três documentos que você conhece pela taxonomia e por Diátaxis. <em>Bloco 1.</em>',
          placeholder: 'O humano… O agente… Documento 1: categoria… tipo Diátaxis…',
          rubrica: [
            'Contrasta humano e agente: o humano <strong>desconfia</strong> e pergunta; o agente <strong>obedece com confiança</strong> e, sem doc, <strong>inventa</strong> uma premissa.',
            'Nomeia o <strong>context poisoning</strong> e a hierarquia <strong>teste &gt; código &gt; doc gerada &gt; doc à mão</strong>.',
            'Classifica pelas cinco categorias (produto, decisão, guidelines, arquitetura, operação).',
            'Usa Diátaxis <strong>sem misturar tipos</strong> (tutorial, how-to, reference, explanation).'
          ],
          modelo: '<p>O leitor humano percebe que o documento está velho e pergunta ao colega; o agente não tem colega nem faro, lê tudo e obedece com confiança. Sem doc, ele inventa uma premissa plausível, o que é ruim mas verificável; com doc velha, produz código coerente com um sistema que não existe mais, e o erro só aparece na integração: é o context poisoning. Por isso a hierarquia é teste que roda, código, doc gerada, doc escrita à mão. Exemplos: um ADR de banco é decisão e explanation; o AGENTS.md é guidelines e reference; o runbook de deploy é operação e how-to.</p>' + reprova('tratar a doc desatualizada como neutra, ou misturar tutorial com referência no mesmo documento.') },

        { tipo: 'escreva', id: 'cp-p2', titulo: 'P2 · Defesa de ADR', obrigatorio: false,
          enunciado: 'Pegue um ADR do laboratório e ataque a decisão com dois argumentos reais. Depois defenda-a com "o que me faria mudar de ideia" ou reconheça o erro: ambos valem. <em>Bloco 3.</em>',
          placeholder: 'Ataque 1… Ataque 2… Defesa… Gatilho de revisão…',
          rubrica: [
            'Os ataques apontam <strong>restrições ou opções reais</strong>, não gosto pessoal.',
            'A defesa cita o <strong>custo declarado</strong> nas consequências.',
            'Nomeia o <strong>gatilho de revisão</strong> ("o que me faria mudar de ideia") com um número ou um fato.',
            'Se reconhece o erro, propõe <strong>novo ADR que substitui</strong>, sem editar o antigo.'
          ],
          modelo: '<p>Ataque 1: o AGE é menos maduro que o Neo4j, e a pergunta que mais vende o produto é de grafo. Ataque 2: depender de Postgres gerenciado que aceite extensões limita onde o produto roda. Defesa: o ADR já declara os dois como custo; a decisão vale enquanto o gargalo do primeiro ano for custo operacional e instalação local, e o gatilho de revisão está escrito: passar de cerca de 5M de vetores por tenant, ou a primeira consulta de grafo que o AGE não expressar em tempo aceitável. Se o gatilho disparar, escrevo um novo ADR que substitui este e marco este como "substituída por".</p>' + reprova('"porque é melhor", sem restrição, custo ou gatilho.') },

        { tipo: 'escreva', id: 'cp-p3', titulo: 'P3 · Imutabilidade e critério', obrigatorio: false,
          enunciado: 'Por que um ADR nunca é editado? Qual é o mecanismo correto quando o time muda de ideia? E o que merece ou não ADR pelo custo de reversão? <em>Bloco 3.</em>',
          placeholder: 'ADR é imutável porque… Quando mudamos de ideia… Merece ADR… Não merece…',
          rubrica: [
            'ADR registra o que se decidiu <strong>naquele contexto</strong>; editar o passado destrói a sequência histórica.',
            '<strong>Novo ADR</strong> que substitui, e o antigo marcado como <strong>substituído por NNNN</strong>.',
            'Aplica o <strong>teste de bolso</strong>: mais de uma semana de trabalho ou migração de dado.',
            'Dá exemplos dos dois lados e cita o ADR do <strong>"por que NÃO fizemos o óbvio"</strong>.'
          ],
          modelo: '<p>ADR registra o raciocínio de um momento; o valor está na sequência, que mostra como e por que o sistema evoluiu. Mudou de ideia? Escrevo um novo ADR com "Substitui ADR-0007" e marco o 0007 como "substituída por ADR-0019". Pelo teste de bolso, merece ADR o que custa mais de uma semana ou envolve migração de dado para reverter: banco, fila, provedor de LLM, multi-tenancy, contrato público de API. Não merece a biblioteca de datas, o nome de variável ou a ordem de parâmetros de função privada. E vale registrar por que não usamos o óbvio, como um framework de agentes, porque a pergunta volta sempre.</p>' + reprova('editar o ADR antigo, ou escrever ADR para toda decisão.') },

        { tipo: 'escolha', id: 'cp-esc-p4', titulo: 'P4 · Aquecimento: nível de diagrama',
          pergunta: 'Qual diagrama responde "o que é implantado e como as peças se falam", e deve ter no máximo cerca de sete elementos?',
          opcoes: [
            { id: 'a', texto: 'C4 L2 (containers).', correta: true, porque: 'é o mapa do deploy, o nível mais útil no dia a dia.' },
            { id: 'b', texto: 'C4 L4 (código), desenhado à mão.', correta: false, porque: 'L4 se gera a partir do código.' },
            { id: 'c', texto: 'Um diagrama único com tudo, para ninguém precisar de outro.', correta: false, porque: 'diagrama que responde a tudo não responde a nada.' }
          ] },
        { tipo: 'escreva', id: 'cp-p4', titulo: 'P4 · C4 e Mermaid', obrigatorio: false,
          enunciado: 'Explique a diferença entre container e componente, por que o L4 se gera e onde a alternativa textual (Mermaid versus Structurizr) entra. <em>Bloco 2.</em>',
          placeholder: 'Container é… Componente é… O L4 se gera porque… Mermaid… Structurizr…',
          rubrica: [
            'Container = <strong>unidade executável/implantável</strong>; componente = bloco <strong>dentro</strong> de um container.',
            'O L4 se <strong>gera</strong> (derivado do código); contexto de negócio se escreve.',
            '<strong>Um diagrama, uma pergunta, no máximo ~7 elementos</strong>, legenda se a cor significa algo.',
            'Mermaid/C4 é <strong>experimental e de layout manual</strong>; Structurizr DSL tem layout automático. Diagrama como <strong>texto no repositório</strong>, com "existe hoje × planejado".'
          ],
          modelo: '<p>Container é o que se implanta e roda (API, worker, banco); componente é um bloco dentro de um container (router, service, repository). O L4 mostra classes e schemas, que são derivados do fonte: gerá-los é sempre correto, desenhá-los à mão envelhece. O contexto de negócio, que nenhum parser infere, se escreve. Cada diagrama responde a uma pergunta, tem até cerca de sete elementos e legenda se há cor. O C4 do Mermaid é experimental e o layout é manual; aceito o visual imperfeito para manter tudo no repositório e no diff, ou uso Structurizr DSL, com layout automático, e exporto. Planejado e existente se distinguem no título.</p>' + reprova('misturar níveis na mesma figura ou desenhar o L4 à mão.') },
        { tipo: 'takeaway', html: 'Doc velha é <mark>erro confiante</mark>; ADR é <mark>imutável</mark> com <mark>custo declarado</mark>; diagrama é <mark>uma pergunta</mark> por figura.' }
      ] },

      { rotulo: 'Drift, postmortem e gabarito', blocos: [
        { tipo: 'escolha', id: 'cp-esc-p5', titulo: 'P5 · Aquecimento: quem cobra',
          pergunta: 'Qual afirmação sobre doc drift está certa?',
          opcoes: [
            { id: 'a', texto: 'Referência quebrada, estrutura e idade são do linter; só a contradição semântica vai ao agente, que acusa e não edita.', correta: true, porque: 'mecânico primeiro, semântico depois; o humano decide.' },
            { id: 'b', texto: 'O agente conta as seções do ADR, e o linter lê o diff.', correta: false, porque: 'inverte as responsabilidades; contar seções é caro e não determinístico para um modelo.' },
            { id: 'c', texto: 'O agente deve corrigir as docs sozinho para não atrasar o PR.', correta: false, porque: 'doc sem revisão humana é como commitar direto na main.' }
          ] },
        { tipo: 'escreva', id: 'cp-p5', titulo: 'P5 · Drift e linter', obrigatorio: false,
          enunciado: 'Enumere as quatro classes de drift, diga por que só uma justifica LLM e mostre (descrevendo a execução) o verificador reprovando um ADR sem "porque". <em>Bloco 4.</em>',
          placeholder: 'As quatro classes… Só a … justifica LLM porque… O verificador reprova assim…',
          rubrica: [
            'As quatro classes: <strong>referência quebrada, estrutura violada, obsolescência por idade, contradição semântica</strong>.',
            '<strong>Mecânico no linter, semântico no agente</strong>, nessa ordem; o agente só roda com o linter verde.',
            'Descreve o ADR sem "porque" sendo reprovado com <strong>exit 1</strong> (regra <code>adr-sem-porque</code>).',
            'Cita o <strong>mutante rejeitado</strong> (referência quebrada acusada e revertida) e <code>fetch-depth: 0</code> para a regra de idade.'
          ],
          modelo: '<p>Referência quebrada, estrutura violada e obsolescência por idade são mecânicas: o linter as cobra em microssegundos com exit code. A contradição semântica ("lote de 100" versus 500) exige ler diff e doc juntos, então só ela justifica gastar tokens, e o agente só roda depois que o linter ficou verde. Mostro o verificador rodando sobre um ADR cuja Decisão diz "Usamos X." sem "porque": sai a violação <code>adr-sem-porque</code> e exit 1; corrijo para "Escolhi X porque…" e passa. O mutante de referência quebrada (citar um arquivo removido) é acusado e revertido. No CI uso <code>fetch-depth: 0</code> para a regra de obsolescência contar commits.</p>' + reprova('usar o agente para contar seções.') },

        { tipo: 'escreva', id: 'cp-p6', titulo: 'P6 · Postmortem', obrigatorio: false,
          enunciado: 'Por que os fatores contribuintes ficam no plural? Para que serve "o que funcionou"? Escreva um fator contribuinte e três ações do incidente da migration que travou a tabela (índice sem CONCURRENTLY). <em>Bloco 3.</em>',
          placeholder: 'Plural porque… "O que funcionou" serve para… Fator… Ações (dono e prazo)…',
          rubrica: [
            'Incidente real quase nunca tem <strong>causa única</strong>; insistir em uma conserta a coisa errada.',
            '"O que funcionou" evita que o documento vire flagelação.',
            'Linha do tempo com <strong>horários</strong> (revela o tempo de detecção).',
            'Ações com <strong>dono e prazo</strong>, sem <strong>culpado nomeado</strong>.'
          ],
          modelo: '<p>Os fatores são plurais porque o incidente teve vários: o alerta de latência estava calibrado para outra ordem de grandeza, a migration não foi testada com volume de produção e levou 24 minutos para alguém olhar o dashboard. "O que funcionou" (o rollback levou 2 minutos porque foi ensaiado) mantém o documento honesto e faz o próximo postmortem ser escrito. Ações: o CI recusa migration com CREATE INDEX sem CONCURRENTLY (dono: SRE, prazo: 1 sprint); alerta de p95 acima do SLO por 3 minutos (SRE, 1 sprint); rodar migrations contra dump de produção no staging (backend, 2 sprints). Ninguém é nomeado como culpado: a pergunta é que mecanismo permitiu.</p>' + reprova('nomear o engenheiro como culpado, ou ações sem dono e prazo.') },

        { tipo: 'escreva', id: 'cp-p7', titulo: 'P7 · Runbook e gabarito', obrigatorio: false,
          enunciado: 'Converta este parágrafo de operação em "sintoma, então comando": "Quando a fila de ingestão cresce demais, o ideal é verificar se o worker está vivo e, se não estiver, reiniciá-lo e acompanhar o consumo". Depois explique o que um produto que gera docs pode gerar e o que só pode propor. <em>Bloco 4.</em>',
          placeholder: 'Sintoma: … Passo 1: <comando> … Passo 2… Pode gerar… Só propõe…',
          rubrica: [
            'Formato <strong>sintoma, então o que fazer</strong>, com <strong>comandos executáveis</strong> em cada passo, nunca prosa para pensar às 3h.',
            'O gerador pode <strong>gerar</strong> o derivável do código (C4, grafo de dependências).',
            'ADR retroativo só como <strong>"decisão aparente" proposta</strong> para o humano confirmar: a <strong>linha anti-ficção</strong>.',
            'Doc com <strong>front matter</strong> (por exemplo <code>documenta:</code>) para o verificador cobrar a idade.'
          ],
          modelo: '<p>Sintoma: fila de ingestão acima do limite. 1) Conferir o worker: <code>docker compose ps worker</code> (esperado: Up). 2) Se não estiver Up: <code>docker compose restart worker</code>. 3) Acompanhar o consumo: <code>docker compose logs -f worker</code> até a fila cair. O runbook tem front matter com <code>documenta:</code> apontando para o diretório do worker, para o linter cobrar a idade. O produto gera o que se deriva do código (C4 e grafo de dependências) e só propõe, como "decisões aparentes" para confirmação humana, qualquer ADR retroativo: sem essa linha ele vira gerador de mentiras convincentes.</p>' + reprova('prosa para pensar no meio da madrugada, ou ADR retroativo apresentado como fato.') },

        { tipo: 'escolha', id: 'cp-esc-p7', titulo: 'P7 · Fechamento: o que o gerador faz',
          pergunta: 'O Capstone gera documentação. O que ele pode produzir como fato, e o que deve apenas propor?',
          opcoes: [
            { id: 'a', texto: 'Gera C4 e grafo de dependências (deriváveis do código); propõe "decisões aparentes" para o humano confirmar.', correta: true, porque: 'inventar ADR retroativo como se fosse fato transforma o produto em gerador de mentiras convincentes.' },
            { id: 'b', texto: 'Gera os ADRs retroativos como fato, para completar o histórico.', correta: false, porque: 'o porquê não é recuperável lendo o código.' },
            { id: 'c', texto: 'Não gera nada: tudo é escrito à mão.', correta: false, porque: 'o derivável deve ser gerado.' }
          ] },
        { tipo: 'texto', html: '<p class="ta-nota">Fontes verificadas em 14/09/2026 (Diátaxis, C4 model, MADR 4.0, Google SRE workbook, Mermaid docs, Structurizr DSL). Sintaxe de ferramenta (Mermaid) é informação de alto risco: revalidar em até 90 dias. Sinais de mercado citados (arquivos de instrução, renderização no GitHub) são contextuais e não fundamentam regras.</p>' },
        { tipo: 'takeaway', html: 'Mecânico no <mark>linter</mark>, semântico no <mark>agente</mark>; postmortem com <mark>ações</mark>; o gerador <mark>propõe</mark> o que não deriva do código.' }
      ] }
    ]
  });
})();
