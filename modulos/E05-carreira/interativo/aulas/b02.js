/* E05 · Bloco 2: portfólio, o capstone como estudo de caso. Fonte: E05.html#b02. Números dos READMEs e do currículo são ilustrativos. */
(function () {
  function opc(id, texto, correta, porque) { return { id: id, texto: texto, correta: correta, porque: porque }; }
  var L = function (kind, text) { return { kind: kind, text: text }; };

  TrilhaAula.registrar({
    id: 'e05-b2',
    titulo: 'Portfólio: o capstone como estudo de caso',
    minutos: 35,
    resumo: 'Contar o Cartógrafo em camadas, com decisões, números, custo e falhas que um estranho consegue verificar.',
    objetivo: 'Transformar o capstone em estudo de caso, checar mecanicamente se o README conta a história e reescrever o currículo em ação, escala, resultado e mecanismo.',
    abas: [
      { rotulo: 'Entender', blocos: [
        { tipo: 'texto', html:
          '<p>Quem lê seu portfólio tem poucos minutos e uma pergunta: "essa pessoa toma boas decisões sob incerteza?". Uma lista de repositórios não responde. Um projeto com decisões justificadas, avaliação com números, custo medido e falhas honestas responde. O M13 já produziu a matéria-prima; falta empacotá-la. Regra geral: <strong>um projeto fundo vale mais que dez rasos</strong>.</p>' +
          '<h3>Anatomia de um estudo de caso</h3>' +
          '<p>Estruture em camadas, da mais curta à mais longa. O leitor para onde a curiosidade acabar.</p>' },
        { tipo: 'texto', largo: true, html:
          '<table><thead><tr><th>Camada</th><th>Tamanho</th><th>Conteúdo</th><th>Quem lê</th></tr></thead><tbody>' +
          '<tr><td>Frase de abertura</td><td>1 a 2 linhas</td><td>Problema, usuário, resultado medido</td><td>Recrutador, feed</td></tr>' +
          '<tr><td>README</td><td>1 a 2 telas</td><td>Problema, arquitetura, decisões, avaliação, custo, falhas, como rodar, demo</td><td>Engenheiro que está triando</td></tr>' +
          '<tr><td>Demo</td><td>2 a 3 min</td><td>Jornada de valor ponta a ponta, incluindo uma falha tratada</td><td>Quem não vai clonar</td></tr>' +
          '<tr><td>ADRs e documentos de desenho</td><td>páginas</td><td>Alternativas rejeitadas e porquê</td><td>Entrevistador técnico</td></tr>' +
          '<tr><td>Artigo de estudo de caso</td><td>1.500 a 2.500 palavras</td><td>O que tentou, o que quebrou, o que mediu</td><td>Quem decide contratação e a comunidade</td></tr>' +
          '</tbody></table>' },
        { tipo: 'texto', html:
          '<h3>As cinco evidências que o entrevistador procura</h3>' +
          '<ol><li><strong>Decisões com alternativa rejeitada.</strong> "PostgreSQL com pgvector em vez de banco vetorial dedicado: uma peça a menos para operar; perdi recursos de ajuste fino." O formato ADR do M04 resolve.</li>' +
          '<li><strong>Avaliação com números.</strong> Tamanho do conjunto, origem dos casos, métrica, resultado, linha de base (M06 e o gate do M13, B11).</li>' +
          '<li><strong>Custo e latência medidos.</strong> Custo por pergunta, p50 e p95, em quantas execuções, com a data da cotação do provedor, porque preço muda (M05).</li>' +
          '<li><strong>Falhas e o que faria diferente.</strong> O sinal mais forte de maturidade: o que quebrou, como detectou, o que mudou.</li>' +
          '<li><strong>Reprodutibilidade.</strong> Alguém roda em 5 minutos? Dependências travadas (<code>uv sync --frozen</code>), fixtures incluídas, comandos exatos.</li></ol>' },
        { tipo: 'callout', tom: 'info', titulo: 'Honestidade de escopo', html:
          'O projeto final usa corpus autorizado e fixtures; exemplo sintético não comprova valor de mercado. Diga no README: "validado em corpus de teste com N casos; não houve piloto com usuários reais". Declarar o limite aumenta a credibilidade e evita a pergunta incômoda na entrevista.' },
        { tipo: 'takeaway', html: 'Cada camada é <mark>verificável</mark>; as cinco evidências são <mark>decisão, número, custo, falha e reprodução</mark>.' }
      ] },

      { rotulo: 'Ver funcionando', blocos: [
        { tipo: 'texto', html:
          '<h3>README fraco contra README bom</h3>' +
          '<p>O laboratório traz dois READMEs em <code>examples/</code>. O fraco:</p>' },
        { tipo: 'codigo', linguagem: 'markdown', texto: '# Meu projeto de IA\n\nUm chatbot incrível com RAG e agentes, usando as tecnologias mais modernas.\n\n## Arquitetura\nUsa FastAPI, Postgres e um LLM.\n\n## Avaliação\nFunciona muito bem nos testes que fiz e as respostas são ótimas.\n\n## Instalação\nRode `pip install -r requirements.txt`.' },
        { tipo: 'texto', html:
          '<p>Problemas: sem problema nem usuário; arquitetura é lista de nomes; avaliação sem número; sem custo, decisões, falhas e demo. Trechos do bom (os números são <strong>ilustrativos do exemplo didático</strong>, não resultados do seu projeto):</p>' },
        { tipo: 'codigo', linguagem: 'markdown', texto: '## Decisões e trade-offs\n- PostgreSQL com pgvector em vez de um banco vetorial dedicado: uma peça a menos\n  para operar, ao custo de menos recursos de ajuste fino.\n- Reranking só nas 20 melhores candidatas: +180 ms no p95, +9 pontos de recall@5.\n\n## Avaliação\nConjunto de 120 perguntas com fonte rotulada. recall@5 = 0,86; abstenção correta\nem 17 de 20 perguntas sem resposta.\n\n## Falhas e o que faria diferente\nO chunking por tamanho fixo quebrava funções longas e derrubou o recall em 14\npontos antes da troca por chunking por símbolo. Faria o conjunto de avaliação\nantes do primeiro índice, não depois.' },
        { tipo: 'transcript', id: 'b2-transcript', titulo: 'Quais frases do README não são verificáveis?',
          enunciado: 'Cada linha é uma frase de um README. Marque as que um estranho <strong>não</strong> consegue verificar.',
          linhas: [
            { quem: 'agente', texto: 'Um chatbot incrível com RAG e agentes, usando as tecnologias mais modernas.' },
            { quem: 'agente', texto: 'recall@5 = 0,86 em 120 perguntas com fonte rotulada, contra 0,71 sem reranking.' },
            { quem: 'agente', texto: 'As respostas são ótimas e o custo é baixo.' },
            { quem: 'agente', texto: 'Reranking nas 20 melhores candidatas: +180 ms no p95 (30 execuções).' },
            { quem: 'agente', texto: 'Funciona muito bem nos testes que fiz.' },
            { quem: 'agente', texto: 'Validado em corpus de teste com 120 casos; sem piloto com usuários reais.' }
          ],
          erradas: [0, 2, 4],
          explicacao: {
            0: 'adjetivo e lista de moda: nenhum fato checável.',
            2: '"ótimas" e "baixo" sem métrica, número nem linha de base.',
            4: '"muito bem" e "testes que fiz" não dizem qual conjunto, qual métrica, qual valor.'
          },
          callout: 'Cada frase boa tem um número, uma condição de medição e implica uma decisão.' },
        { tipo: 'texto', html:
          '<h3>Demo, escrita e open source</h3>' +
          '<ul><li><strong>Demo (2 a 3 min).</strong> Siga a jornada de valor do projeto final: fixture, job, pergunta, resposta com referência ou abstenção, diagnóstico de uma falha. Comece pelo resultado, não pelo terminal vazio; mostre uma abstenção ou erro tratado; legende a tela; nunca exponha chaves ou dados pessoais (grave em ambiente limpo). Assista como um estranho: se precisar explicar falando, está incompleto.</li>' +
          '<li><strong>Artigo.</strong> Ensina uma lição que o projeto permitiu: pós-mortem de decisão, estudo de custo com tabela antes e depois, ou guia de uma armadilha. Estrutura: título que promete uma lição, resumo de três linhas, o que tentei, o que medi, o que não funcionou, limites, como reproduzir. Considere versão em inglês dos textos mais fortes.</li>' +
          '<li><strong>Open source</strong>, em ordem de custo-benefício: (1) reproduzir um bug com teste mínimo e reportar bem (versão, passos, esperado contra obtido); (2) corrigir documentação enganosa; (3) corrigir um bug pequeno com teste; (4) manter um pequeno pacote seu, com testes e versionamento. Um PR aceito mostra código revisado por estranhos. Respeite o guia de contribuição e discuta antes de mudanças grandes.</li></ul>' },
        { tipo: 'takeaway', html: 'Frase verificável = <mark>número + condição de medição</mark>. Adjetivo não é evidência.' }
      ] },

      { rotulo: 'Praticar', blocos: [
        { tipo: 'texto', html:
          '<h3>Checagem estrutural do README</h3>' +
          '<p>O laboratório automatiza a checagem estrutural: a seção existe, tem corpo e, onde precisa, tem número. Aqui você escreve a regra de uma seção. O julgamento de verdade continua humano.</p>' },
        { tipo: 'python', id: 'b2-readme', obrigatorio: false, titulo: 'Classifique a seção Avaliação',
          enunciado: 'Complete <code>avaliar_secao(corpo)</code>: devolva <code>"ausente"</code> se o corpo for vazio ou só espaços; <code>"weak"</code> se tiver menos de 8 palavras <em>ou</em> nenhum dígito; senão <code>"ok"</code>.',
          codigo: 'def avaliar_secao(corpo):\n    # ausente: vazio; weak: < 8 palavras ou sem dígito; ok: o resto\n    return "ok"\n\n\nprint(avaliar_secao("Funciona muito bem nos testes que fiz e as respostas são ótimas."))\n',
          testes: 'def test_ausente():\n    assert avaliar_secao("") == "ausente"\n    assert avaliar_secao("   \\n ") == "ausente"\n\n\ndef test_sem_numero_e_weak():\n    assert avaliar_secao("Funciona muito bem nos testes que fiz e as respostas são ótimas.") == "weak"\n\n\ndef test_curto_e_weak():\n    assert avaliar_secao("recall 0,86") == "weak"\n\n\ndef test_ok():\n    assert avaliar_secao("Conjunto de 120 perguntas com fonte rotulada. recall@5 = 0,86 contra 0,71 sem reranking.") == "ok"\n\n\ndef test_borda_oito_palavras_com_digito():\n    assert avaliar_secao("a b c d e f g 1") == "ok"\n    assert avaliar_secao("a b c d e f 1") == "weak"\n',
          dica: 'Use <code>corpo.split()</code> para contar palavras e <code>any(c.isdigit() for c in corpo)</code> para achar dígito.',
          solucao: 'def avaliar_secao(corpo):\n    if not corpo.strip():\n        return "ausente"\n    palavras = corpo.split()\n    tem_digito = any(c.isdigit() for c in corpo)\n    if len(palavras) < 8 or not tem_digito:\n        return "weak"\n    return "ok"\n',
          tutorDepois: 'A regra pega "ótimas" e "baixo custo" sem números, mas não sabe se o número é verdadeiro. Por isso a checagem é porta de entrada, não selo de qualidade.',
          callout: 'Você transformou "tem número?" em regra executável.' },
        { tipo: 'escreva', id: 'b2-curriculo', titulo: 'Reescreva um item do currículo', obrigatorio: false,
          enunciado: 'Reescreva "Liderei equipe." no formato <strong>ação + escala + resultado + mecanismo</strong>. Use colchetes <code>[N]</code>, <code>[A]</code>, <code>[B]</code> no lugar de valores que você só pode preencher com números comprováveis.',
          placeholder: 'Conduzi [N] pessoas…',
          rubrica: [
            'Tem uma <strong>ação</strong> concreta no início.',
            'Tem <strong>escala</strong> (número de pessoas, sistemas ou volume).',
            'Tem <strong>resultado</strong> mensurável (de [A] para [B]).',
            'Diz o <strong>mecanismo</strong> (como o resultado veio), sem inventar valor.'
          ],
          modelo: '<p>Conduzi [N] pessoas na adoção de desenvolvimento orientado a especificação com IA, definindo revisão de código gerado e política de dados; tempo de entrega de módulo novo caiu de [A] para [B].</p><p><strong>Reprova:</strong> "responsável por liderar equipe" (lista responsabilidade) ou adjetivo sem fato.</p>' },
        { tipo: 'texto', html:
          '<p>No perfil público: a primeira linha diz o que você resolve (por exemplo, "Engenheiro sênior (.NET e Python) construindo sistemas de IA com avaliação, segurança e operação"), o repositório principal está fixado com README que passa no checklist, e a seção "sobre" menciona um resultado, uma especialidade e o que você procura. Remova do currículo o que o mercado de IA não valoriza e que não mostra liderança, mas <strong>não esconda</strong> o contexto regulado e de grande escala: é diferencial.</p>' +
          '<ul><li><strong>Público contra privado.</strong> Código de empregador é confidencial: descreva o trabalho profissional em nível de arquitetura e resultado, sem dados nem nomes internos; em dúvida, autorização por escrito.</li>' +
          '<li><strong>Demonstração contra rigor.</strong> Demo bonita atrai clique, número verificável convence. Faça os dois, nessa prioridade.</li></ul>' },
        { tipo: 'takeaway', html: 'O código prova que você sabe <mark>fazer</mark>; o texto prova que você sabe <mark>decidir</mark>.' }
      ] },

      { rotulo: 'Conferir', blocos: [
        { tipo: 'escolha', id: 'b2-esc-escopo', titulo: 'Confira: honestidade de escopo',
          pergunta: 'Seu projeto foi validado só com corpus de teste e fixtures. Como tratar isso no README?',
          opcoes: [
            opc('a', 'Omitir: o entrevistador não precisa saber.', false, 'o sênior pergunta, e a omissão custa credibilidade.'),
            opc('b', 'Dizer que foi validado "em produção", já que o fluxo é completo.', false, 'fluxo completo não é produção.'),
            opc('c', 'Declarar o limite: "validado em corpus de teste com N casos; sem piloto com usuários reais".', true, 'aumenta a credibilidade e evita a pergunta incômoda.')
          ] },
        { tipo: 'escolha', id: 'b2-esc-cv', titulo: 'Confira: currículo de impacto',
          pergunta: 'Qual reescrita segue ação + escala + resultado + mecanismo?',
          opcoes: [
            opc('a', '"Projetei integração assíncrona com idempotência e retomada entre o hub de cadastro e sistemas legados, reduzindo reprocessamento manual de [X] para [Y] por semana."', true, 'tem ação, escala, resultado e mecanismo, com valores comprováveis.'),
            opc('b', '"Responsável por integrações com sistemas legados em .NET."', false, 'lista responsabilidade.'),
            opc('c', '"Trabalho com IA e sempre busco inovação."', false, 'adjetivo sem fato.')
          ] },
        { tipo: 'takeaway', html: 'Publicar o <mark>sistema</mark> sem a <mark>narrativa</mark> deixa o projeto parecido com o de qualquer pessoa.' }
      ] }
    ],
    revisao: [
      { id: 'r1', pergunta: 'Quais são as cinco evidências que o entrevistador procura num projeto?', opcoes: [
        opc('a', 'Decisão com alternativa rejeitada, avaliação com números, custo e latência medidos, falhas e o que faria diferente, reprodutibilidade.', true, 'são as cinco do bloco.'),
        opc('b', 'Número de estrelas, linguagens usadas, tamanho do código, commits e licença.', false, 'métricas de vitrine, não evidência de julgamento.')] },
      { id: 'r2', pergunta: 'Por que mostrar uma falha do projeto ajuda mais do que esconder?', opcoes: [
        opc('a', 'Porque o entrevistador procura julgamento: falha com causa, medida e correção prova que você avalia o que construiu.', true, 'projeto sem falha relatada sugere que ninguém mediu.'),
        opc('b', 'Porque falha dá pena ao leitor.', false, 'não é a razão.')] },
      { id: 'r3', pergunta: 'Seu README diz "RAG com ótimos resultados". O que falta para virar evidência?', opcoes: [
        opc('a', 'Conjunto descrito (tamanho, origem), métrica nomeada, número e linha de base: "recall@5 de 0,86 em 120 perguntas, contra 0,71 sem reranking".', true, '"ótimo" não é verificável.'),
        opc('b', 'Trocar "ótimos" por "excelentes".', false, 'adjetivo por adjetivo.')] },
      { id: 'r4', pergunta: 'Qual a ordem de custo-benefício para contribuir em open source com pouco tempo?', opcoes: [
        opc('a', 'Reportar bug com teste mínimo, corrigir documentação, corrigir bug pequeno com teste, manter um pequeno pacote seu.', true, 'a ordem do bloco.'),
        opc('b', 'Começar por uma funcionalidade grande.', false, 'raramente é a contribuição relevante.')] },
      { id: 'r5', pergunta: 'Quais as camadas do estudo de caso, da mais curta à mais longa?', opcoes: [
        opc('a', 'Frase de abertura, README, demo, ADRs, artigo.', true, 'o leitor para onde a curiosidade acabar.'),
        opc('b', 'Artigo, README, frase de abertura.', false, 'a ordem é inversa e incompleta.')] }
    ]
  });
})();
