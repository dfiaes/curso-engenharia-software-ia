/* E05 · Bloco 1: o mercado em 2026. Fonte: E05.html#b01. Dados verificados em 11/10/2026 (LinkedIn jan/2026, EUA; Stack Overflow 2025). */
(function () {
  var L = function (kind, text) { return { kind: kind, text: text }; };
  function opc(id, texto, correta, porque) { return { id: id, texto: texto, correta: correta, porque: porque }; }

  TrilhaAula.registrar({
    id: 'e05-b1',
    titulo: 'O mercado em 2026 e o seu reposicionamento',
    minutos: 30,
    resumo: 'Ler dados de carreira sem se enganar, separar papéis por responsabilidade e decifrar um anúncio.',
    objetivo: 'Classificar uma vaga como problema real, indefinida ou hype lendo o anúncio, e traduzir a experiência de .NET em vantagem de AI engineering.',
    abas: [
      { rotulo: 'Entender', blocos: [
        { tipo: 'texto', html:
          '<p>Quem muda de especialidade aos 20 anos de carreira tem dois riscos opostos. O primeiro é subestimar o que já sabe e aceitar uma vaga júnior de "prompt". O segundo é superestimar o campo novo e perseguir um título que o mercado ainda não definiu. Os dois se corrigem do mesmo jeito: olhar o que as vagas descrevem, com ceticismo sobre os números que circulam.</p>' +
          '<h3>O que os dados dizem</h3>' +
          '<ul><li><strong>LinkedIn, Jobs on the Rise 2026</strong> (EUA, janeiro de 2026): AI engineer aparece como o cargo de crescimento mais rápido. A mesma reportagem (Let\'s Data Science, 07/01/2026, consultada em 11/10/2026) lembra que o número de candidatos por vaga mais que dobrou desde a primavera de 2022 e que a contratação segue 23% abaixo do nível pré-pandemia. Cargo em alta num mercado frio é <em>concorrência por vaga boa</em>, não abundância.</li>' +
          '<li><strong>Stack Overflow Developer Survey 2025</strong> (29/07/2025): 84% usam ou planejam usar IA (76% em 2024); 46% desconfiam da exatidão (eram 31%); 31% já usam agentes; 45% citam como maior frustração que depurar código gerado por IA toma tempo. Adoção alta com confiança em queda é a lacuna que um engenheiro de avaliação, segurança e operação preenche.</li></ul>' },
        { tipo: 'callout', tom: 'danger', titulo: 'O que não entra como dado', html:
          'Uma página de consultoria de alocação cita "3,2 vagas por candidato qualificado" e "crescimento de 143% nas vagas" atribuídos a um relatório sem link, e dá dois valores diferentes (cerca de 25% e 18%) para o prêmio salarial de IA na mesma página. Nenhum desses números entra. O módulo também <strong>não encontrou fonte confiável e recente sobre volume de vagas e salários no Brasil</strong>: os dados de crescimento são dos EUA. Trate qualquer cifra isolada como hipótese.' },
        { tipo: 'callout', tom: 'info', titulo: 'Regra de leitura de estatística de carreira', html:
          'Antes de usar um número, pergunte: quem publicou e o que vende? Qual o período e a população (EUA ou Brasil, vagas ou candidatos)? Existe um segundo número da mesma fonte que contradiz o primeiro? Se alguma resposta falhar, o número vira <strong>indício</strong>, nunca <strong>dado</strong>.' },
        { tipo: 'texto', largo: true, html:
          '<h3>Papéis por responsabilidade, não por título</h3>' +
          '<table><thead><tr><th>Papel</th><th>Responsabilidade central</th><th>Onde o passado ajuda</th><th>Módulos</th></tr></thead><tbody>' +
          '<tr><td>AI engineer / LLM engineer</td><td>Recursos de produto sobre modelos prontos: integração, RAG, agentes, avaliação, custo</td><td>Muito: engenharia de software com um componente probabilístico</td><td>M05 a M10, M13</td></tr>' +
          '<tr><td>ML engineer</td><td>Treinar, ajustar e servir modelos; pipelines de dados e features</td><td>Médio: infraestrutura e dados sim; estatística e treino exigem estudo</td><td>M11, E02</td></tr>' +
          '<tr><td>Plataforma de IA / MLOps / LLMOps</td><td>Gateway, observabilidade, implantação, custos, governança</td><td>Muito: plataforma, filas, SRE, segurança</td><td>M05, M06, M12, P01</td></tr>' +
          '<tr><td>Engenheiro de avaliação</td><td>Conjuntos dourados, juízes, regressão, análise de falhas</td><td>Alto: teste e rigor, com estatística básica nova</td><td>M06</td></tr>' +
          '<tr><td>Arquiteto / staff de IA aplicada</td><td>Decidir onde IA entra, trade-offs, riscos, construir ou comprar</td><td>Muito alto: a função mais alinhada a 20 anos</td><td>E01, E03, E04</td></tr>' +
          '<tr><td>Pesquisa (research scientist)</td><td>Novos métodos e modelos; publicações</td><td>Baixo no curto prazo</td><td>fora do escopo</td></tr>' +
          '</tbody></table>' +
          '<p>Os cinco primeiros são alvos reais; pesquisa pede formação e publicações que este caminho não substitui. A descrição de <em>AI engineer</em> como função distinta de pesquisador e de ML engineer vem do ensaio <em>The Rise of the AI Engineer</em> (Latent Space, 2023; URL conhecida, não reaberta em 11/10/2026) e serve como vocabulário, mesmo que os anúncios o apliquem de forma irregular.</p>' },
        { tipo: 'takeaway', html: 'AI engineer lidera listas de crescimento, mas o mercado é competitivo e a confiança em IA cai: o valor está em quem torna sistemas de IA <mark>confiáveis</mark>. Número sem fonte é <mark>indício</mark>.' }
      ] },

      { rotulo: 'Ver funcionando', blocos: [
        { tipo: 'texto', html:
          '<h3>Reposicionar é mapear e provar</h3>' +
          '<p>O reposicionamento honesto não é "troquei C# por Python". É traduzir competências para o vocabulário do campo e provar a parte nova. O passado transfere assim:</p>' },
        { tipo: 'texto', largo: true, html:
          '<table><thead><tr><th>Você tem (em .NET)</th><th>Em AI engineering</th><th>Prova a mostrar</th></tr></thead><tbody>' +
          '<tr><td>Integração com legados, filas, Durable Functions</td><td>Orquestração de longa duração, idempotência, retomada</td><td>Job assíncrono do Cartógrafo com retry e deduplicação (M13, B3)</td></tr>' +
          '<tr><td>Contratos de API, versionamento, OpenAPI</td><td>Contrato de ferramenta, saída estruturada</td><td>OpenAPI congelado e Problem Details (M13, B10)</td></tr>' +
          '<tr><td>Observabilidade, incidentes, SLO</td><td>Rastreamento de chamadas de modelo, custo por requisição, orçamento de erro</td><td>Telemetria e runbook (M12)</td></tr>' +
          '<tr><td>Segurança de aplicação, multi-tenant</td><td>Injeção de prompt, isolamento por tenant, ACL na recuperação</td><td>Hardening e ACL no retrieval (M13, B6 e B12)</td></tr>' +
          '<tr><td>Testes automatizados, CI</td><td>Evals como teste, gate de regressão</td><td>Conjunto dourado com gate (M13, B11)</td></tr>' +
          '<tr><td>Liderança técnica, decisões de arquitetura</td><td>Construir ou comprar, política de uso de IA</td><td>ADRs e revisão de código gerado (E04)</td></tr>' +
          '</tbody></table>' +
          '<p>O que <em>não</em> transfere sozinho: estatística de avaliação (variabilidade, tamanho de amostra), ecossistema Python e julgamento sobre o comportamento de modelos. O capstone fornece essa evidência; o Bloco 2 mostra como apresentá-la.</p>' },
        { tipo: 'texto', html:
          '<h3>Decifrar um anúncio</h3>' +
          '<p>O anúncio abaixo é composto para o exemplo, no estilo de anúncios reais:</p>' +
          '<blockquote>Buscamos AI Engineer sênior. Você vai construir nosso copiloto para atendimento. Requisitos: 5+ anos com LLMs, domínio de LangChain, experiência com fine-tuning de GPT, Python, conhecimento de prompts avançados. Diferencial: Kubernetes.</blockquote>' },
        { tipo: 'rode', id: 'b1-anuncio', titulo: 'Leia o anúncio linha a linha',
          enunciado: 'Passe pelas etapas e veja como um engenheiro lê cada trecho do anúncio. Antes de rodar, preveja.',
          prefixo: '$', entrada: 'ler-anuncio copiloto-atendimento.txt', unidade: 'linha', terminalTitulo: 'leitura do anúncio',
          prever: { pergunta: 'O requisito "5+ anos com LLMs" torna a vaga ruim?', opcoes: [
            opc('a', 'Sim: um requisito impossível descarta a vaga.', false, 'o requisito literal é irreal, mas isso costuma ser RH copiando texto; o sinal está no que o anúncio descreve do trabalho.'),
            opc('b', 'Não necessariamente: indica anúncio não revisado, e a vaga fica indefinida até você perguntar como medem qualidade.', true, 'interprete como "tem algo real em produção, não só demo" e use a entrevista para descobrir se o time define o problema.'),
            opc('c', 'Sim, mas só se a empresa for pequena.', false, 'o tamanho da empresa não muda a leitura do requisito.')
          ] },
          etapas: [
            { id: 'anos', nome: '"5+ anos com LLMs"', descricao: 'Requisito literal', tom: 'dns', ms: 5, linhas: [
              L('cmd', 'ler-anuncio --trecho "5+ anos com LLMs"'),
              L('out', 'impossível como especificação literal'),
              L('hint', 'interprete: experiência real em produção, não só demo')] },
            { id: 'ferram', nome: 'LangChain e fine-tuning', descricao: 'Lista de ferramentas', tom: 'tcp', ms: 4, linhas: [
              L('out', 'ferramentas citadas; avaliação, custo, segurança e dados: nenhuma menção'),
              L('hint', 'sinal de problema ainda não definido. Pergunta de triagem: "como vocês medem hoje se o copiloto está bom?"')] },
            { id: 'dominio', nome: 'Copiloto para atendimento', descricao: 'O domínio', tom: 'tls', ms: 6, linhas: [
              L('out', 'domínio com dados pessoais, risco reputacional e erro caro'),
              L('hint', 'boa oportunidade para quem sabe de segurança e ACL, se a empresa reconhece isso')] },
            { id: 'k8s', nome: 'Diferencial: Kubernetes', descricao: 'Plataforma como acessório', tom: 'request', ms: 3, linhas: [
              L('out', 'plataforma tratada como acessório'),
              L('hint', 'pergunte quem opera')] },
            { id: 'veredito', nome: 'Veredito', descricao: 'Indefinida, não ruim', tom: 'ink', ms: 2, linhas: [
              L('in', 'vaga indefinida: a entrevista mostra se o time aceita definir o problema')] }
          ],
          tutorDepois: 'A vaga não é ruim: é indefinida. A entrevista é onde você descobre se o time quer defini-la.',
          callout: 'Você separou o requisito literal do sinal útil do anúncio.' },
        { tipo: 'texto', largo: true, html:
          '<table><thead><tr><th>Sinal de vaga com problema real</th><th>Sinal de hype</th></tr></thead><tbody>' +
          '<tr><td>Descreve o problema do usuário e como se mede sucesso</td><td>Descreve só tecnologias da moda</td></tr>' +
          '<tr><td>Menciona avaliação, observabilidade, custo, segurança</td><td>Promete "revolucionar" com IA sem métrica</td></tr>' +
          '<tr><td>Produto já tem usuários ou piloto com dados reais</td><td>"Vamos descobrir o que fazer com IA"</td></tr>' +
          '<tr><td>Responsável técnico identificável e orçamento definido</td><td>Cargo criado por pressão de diretoria, sem dono</td></tr>' +
          '<tr><td>Aceita que o primeiro ciclo seja medir antes de otimizar</td><td>Espera demonstração impressionante em semanas</td></tr>' +
          '<tr><td>Agentes com limites e aprovação humana</td><td>"Agente autônomo" sem falar de falha</td></tr>' +
          '</tbody></table>' },
        { tipo: 'takeaway', html: 'Leia o anúncio pelo <mark>problema descrito</mark> e pelo que ele omite (avaliação, custo, dono), não pelo ano exigido.' }
      ] },

      { rotulo: 'Praticar', blocos: [
        { tipo: 'texto', html:
          '<h3>Triagem mecânica de anúncios</h3>' +
          '<p>O método do módulo: colete 20 anúncios dos cargos que você quer (Brasil e remoto internacional) numa planilha e marque as exigências de cada um, uma hora por semana, durante quatro semanas. O resultado é a <em>sua</em> distribuição de habilidades pedidas, com data e fonte. Complete com três conversas de 20 minutos com quem faz o trabalho ("o que fez seu último mês ser difícil?"). Aqui você automatiza a parte mecânica: contar sinais.</p>' },
        { tipo: 'python', id: 'b1-triagem', obrigatorio: false, titulo: 'Conte os sinais do anúncio',
          enunciado: 'Complete <code>triar(texto)</code>: devolva <code>(sinais_problema, sinais_hype)</code>, contando quantas palavras de cada lista aparecem no texto (sem diferenciar maiúsculas). Cada palavra conta uma vez, mesmo que se repita.',
          codigo: 'PROBLEMA = ["avaliação", "custo", "segurança", "observabilidade", "métrica", "piloto"]\nHYPE = ["revolucionar", "autônomo", "disruptivo", "descobrir o que fazer"]\n\n\ndef triar(texto):\n    t = texto.lower()\n    # conte as palavras de PROBLEMA e de HYPE presentes em t\n    return 0, 0\n\n\nprint(triar("Vamos revolucionar o atendimento com um agente autônomo"))\n',
          testes: 'def test_hype():\n    assert triar("Vamos revolucionar o atendimento com um agente autônomo") == (0, 2)\n\n\ndef test_problema():\n    assert triar("Medimos avaliação e custo por métrica, com piloto em produção") == (4, 0)\n\n\ndef test_borda_vazio():\n    assert triar("") == (0, 0)\n\n\ndef test_repeticao_conta_uma_vez():\n    assert triar("custo custo custo") == (1, 0)\n\n\ndef test_maiusculas():\n    assert triar("SEGURANÇA e Observabilidade") == (2, 0)\n\n\ndef test_controle_negativo_so_ferramentas():\n    assert triar("LangChain, fine-tuning de GPT e Kubernetes") == (0, 0)\n',
          dica: 'Use <code>sum(1 for p in PROBLEMA if p in t)</code> para cada lista.',
          solucao: 'PROBLEMA = ["avaliação", "custo", "segurança", "observabilidade", "métrica", "piloto"]\nHYPE = ["revolucionar", "autônomo", "disruptivo", "descobrir o que fazer"]\n\n\ndef triar(texto):\n    t = texto.lower()\n    return (sum(1 for p in PROBLEMA if p in t),\n            sum(1 for h in HYPE if h in t))\n',
          tutorDepois: 'O controle negativo mostra o limite: um anúncio só de ferramentas dá (0, 0). Contar palavras não substitui ler; serve para ordenar 20 anúncios antes de você ler os melhores.',
          callout: 'A triagem mecânica ordena a pilha; o julgamento continua seu.' },
        { tipo: 'cenario', id: 'b1-cenario', titulo: 'Oferta de nível abaixo do seu', obrigatorio: false,
          enunciado: 'Chega uma vaga de "AI engineer pleno" numa empresa que atende o setor financeiro. Escolha como reagir e veja o custo de cada decisão.',
          inicio: 'inicio',
          nos: {
            inicio: { texto: 'Você só tem aplicado a cargos "sênior" ou "principal". A vaga de pleno descreve problema real: avaliação, custo e um dono técnico identificável. O que faz?', opcoes: [
              { texto: 'Descartar: pleno é abaixo do seu nível.', vai: 'f-orgulho', tom: 'ruim', consequencia: 'o título é irregular em área nova; você descartou escopo bom por orgulho.' },
              { texto: 'Perguntar o que o cargo decide, a quem responde e como a função evolui.', vai: 'escopo', tom: 'ok', consequencia: 'o que importa é o escopo e quem decide, não como o cargo se chama.' },
              { texto: 'Aceitar na hora, "só para entrar".', vai: 'f-abaixo', tom: 'ruim', consequencia: 'aceitar abaixo do que você é, sem condição, pode custar anos de promoção.' }
            ] },
            escopo: { texto: 'A resposta: decide a arquitetura da avaliação e responde ao líder técnico; o título é de uma tabela salarial antiga. O que faz?', opcoes: [
              { texto: 'Seguir, pedindo por escrito o escopo, a quem responde e as métricas dos primeiros 90 dias.', vai: 'f-bom', tom: 'ok', consequencia: 'escopo vago vira atribuição infinita; por escrito, vira acordo.' },
              { texto: 'Seguir sem formalizar, confiando na conversa.', vai: 'f-vago', tom: 'ruim', consequencia: 'sem registro, o cargo vira o que a empresa precisar.' }
            ] }
          },
          finais: {
            'f-bom': { bom: true, texto: 'Você entra pelo escopo certo, com nível e métricas registrados.' },
            'f-orgulho': { bom: false, texto: 'A vaga ficou sem resposta, e a melhor oportunidade da lista foi descartada pelo título.' },
            'f-abaixo': { bom: false, texto: 'Você entrou, mas o nível ficou preso ao título de entrada.' },
            'f-vago': { bom: false, texto: 'Meses depois, o escopo é qualquer coisa e ninguém lembra o combinado.' }
          },
          callout: 'Você perguntou o que o cargo decide, não só como ele se chama.' },
        { tipo: 'takeaway', html: 'Automatize a <mark>contagem</mark>, mas a decisão de se candidatar depende do <mark>escopo e de quem decide</mark>.' }
      ] },

      { rotulo: 'Conferir', blocos: [
        { tipo: 'escolha', id: 'b1-esc-numero', titulo: 'Confira: número sem fonte',
          pergunta: 'Uma página de consultoria de alocação cita "crescimento de 143% nas vagas" atribuído a um relatório sem link, e dá dois valores diferentes para o prêmio salarial de IA na mesma página. O que fazer com esses números?',
          opcoes: [
            opc('a', 'Usar o maior: é o mais animador para a negociação.', false, 'escolher o número pelo efeito é o erro que a regra de leitura evita.'),
            opc('b', 'Tratá-los como indício, não como dado: a fonte vende contratação, não tem link e se contradiz. Não entram no plano.', true, 'quem publica, o que vende, período e população e contradição interna: falhou em qualquer um, vira indício.'),
            opc('c', 'Fazer a média dos dois valores.', false, 'a média de dois números sem fonte continua sem fonte.')
          ], tutorDepois: 'Para o Brasil, a amostra datada de 20 anúncios vale mais que qualquer cifra isolada.' },
        { tipo: 'escolha', id: 'b1-esc-transfere', titulo: 'Confira: o que transfere',
          pergunta: 'Qual parte da experiência de 20 anos em .NET é mais difícil de substituir em AI engineering?',
          opcoes: [
            opc('a', 'A sintaxe de C#.', false, 'a linguagem é o que menos pesa.'),
            opc('b', 'Contratos de API, concorrência, idempotência, observabilidade e operação de sistema em produção.', true, 'modelo é componente; a maior parte do risco está no sistema ao redor.'),
            opc('c', 'O conhecimento do ecossistema Python.', false, 'esse é justamente um dos pontos que não transfere sozinho e exige evidência nova.')
          ], tutorDepois: 'O capstone existe para provar a parte nova: estatística de avaliação, Python e julgamento sobre modelos.' },
        { tipo: 'takeaway', html: 'Seu passado vale quando é <mark>traduzido</mark> para o vocabulário do campo e <mark>provado</mark> com o capstone.' }
      ] }
    ],
    revisao: [
      { id: 'r1', pergunta: 'Qual a regra de leitura de uma estatística de carreira?', opcoes: [
        opc('a', 'Perguntar quem publicou e o que vende, o período e a população, e se há um segundo número que contradiz o primeiro; se falhar, é indício.', true, 'a regra do bloco.'),
        opc('b', 'Usar o número mais recente.', false, 'recente não é confiável por si.'),
        opc('c', 'Usar o número que a maioria cita.', false, 'repetição não é fonte.')] },
      { id: 'r2', pergunta: 'Um anúncio pede "5+ anos de experiência com LLMs". O que isso diz?', opcoes: [
        opc('a', 'Que a vaga é ruim e deve ser descartada.', false, 'normalmente é RH copiando texto.'),
        opc('b', 'Que o requisito não foi revisado contra a realidade; o sinal útil é o que o anúncio descreve do trabalho.', true, 'avaliação, produção e integração importam mais que o ano.')] },
      { id: 'r3', pergunta: 'Qual é um sinal de vaga com problema real?', opcoes: [
        opc('a', 'Descreve o problema do usuário e como se mede sucesso, e cita avaliação, custo e segurança.', true, 'e tem dono técnico identificável.'),
        opc('b', 'Promete revolucionar o negócio com IA.', false, 'é sinal de hype.'),
        opc('c', 'Lista apenas tecnologias da moda.', false, 'é sinal de hype.')] },
      { id: 'r4', pergunta: 'Qual a armadilha de nível para o sênior?', opcoes: [
        opc('a', 'Candidatar-se só a cargos sênior e descartar pleno por orgulho, ou aceitar abaixo do nível sem condição. Pergunte o que o cargo decide.', true, 'em área nova o título é irregular.'),
        opc('b', 'Aceitar sempre a primeira vaga.', false, 'não é a armadilha descrita.')] },
      { id: 'r5', pergunta: 'Como pesquisar o mercado do Brasil sem fonte confiável de salários?', opcoes: [
        opc('a', 'Coletar 20 anúncios datados numa planilha e conversar com três pessoas que fazem o trabalho.', true, 'é o método do módulo.'),
        opc('b', 'Confiar em uma cifra de uma página de fornecedor.', false, 'fornecedor vende contratação.')] }
    ]
  });
})();
