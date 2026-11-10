/* S01 · Checkpoint: oito cenários, avaliação sem consulta. Rubrica = "Basta"; modelo = resposta esperada + "Reprova". Fonte: S01.html#checkpoint. */
(function () {
  var reprova = function (t) { return '<p><strong>Reprova:</strong> ' + t + '</p>'; };
  function opc(id, texto, correta, porque) { return { id: id, texto: texto, correta: correta, porque: porque }; }

  TrilhaAula.registrar({
    id: 's01-checkpoint',
    titulo: 'Checkpoint S01',
    minutos: 50,
    resumo: 'Oito cenários sobre design de código, sem consulta. Responda com as suas palavras, justifique pelo mecanismo e compare com a rubrica. Reprovar é permitido.',
    objetivo: 'Verificar, sem consulta, se você mede complexidade, escolhe entre herança e composição, separa núcleo e casca, recusa abstração sem retorno, refatora legado sob caracterização e escolhe dublês com critério.',
    revisao: [
      { id: 's01cp-ciclo', pergunta: 'Uma função tem ciclomática 28 e o autor propõe dividi-la em 9 funções passo1..passo9. Qual é a resposta de revisão?',
        opcoes: [
          opc('a', 'Recusar a divisão por números: pedir nomes de domínio, entradas e saídas claras, guard clauses e tabelas antes de extrair por extrair; medir também o aninhamento.', true, 'o número caiu, mas o custo de leitura sobe com nomes vagos e estado compartilhado.'),
          opc('b', 'Aceitar, porque a ciclomática máxima caiu.', false, 'a ciclomática não mede esforço de leitura.'),
          opc('c', 'Aceitar se os testes passarem.', false, 'a suíte verde prova comportamento, não legibilidade.')] },
      { id: 's01cp-mro', pergunta: 'Dadas class A(Base), class B(Base), class C(A, B) com super() cooperativo, qual o MRO e o que acontece se B esquecer super()?',
        opcoes: [
          opc('a', 'C, A, B, Base, object; o que vem depois de B na cadeia (Base) não roda.', true, 'super() segue a MRO da instância, não os pais diretos.'),
          opc('b', 'C, A, Base, B, object.', false, 'o C3 põe Base depois de todos os seus filhos.'),
          opc('c', 'C, A, Base; B nunca roda.', false, 'B está na MRO e roda; é o que vem depois dele que fica de fora.')] },
      { id: 's01cp-nucleo', pergunta: 'Ao reorganizar uma função que lê pedido, aplica descontos pela data, grava e envia e-mail, o que o núcleo recebe e devolve?',
        opcoes: [
          opc('a', 'Recebe dados e a data como parâmetro e devolve um resultado puro; repositório e notificador injetados ficam na casca.', true, 'as regras se testam sem dublês; a casca testa a orquestração.'),
          opc('b', 'Recebe o repositório e chama date.today() por dentro.', false, 'dependências escondidas quebram a pureza.'),
          opc('c', 'Não recebe nada: lê tudo de variáveis globais.', false, 'estado global é o oposto de pureza.')] },
      { id: 's01cp-legado', pergunta: 'Qual é a sequência antes de mudar uma linha de uma função crítica, sem testes e dependente do relógio?',
        opcoes: [
          opc('a', 'Costura para o relógio, caracterização automática (golden), passos pequenos com suíte verde, diferencial, controle negativo e commits separados.', true, 'prova de não regressão com oráculo, não por amostragem manual.'),
          opc('b', 'Reescrever a função e comparar algumas saídas à mão.', false, 'amostragem manual perde bordas.'),
          opc('c', 'Corrigir os bugs que aparecerem durante a leitura.', false, 'mistura refator com comportamento.')] },
      { id: 's01cp-mock', pergunta: 'O teste com Mock() do repositório passa e a produção falha em repo.salvar_tudo(). Quais são as correções mínima e de design?',
        opcoes: [
          opc('a', 'Mínima: create_autospec(RepositorioPedidos). De design: fake com teste de contrato e verificação de estado.', true, 'o Mock solto aceita qualquer atributo; "falta cobertura" não é o diagnóstico.'),
          opc('b', 'Aumentar a cobertura de linhas.', false, 'a linha já estava coberta.'),
          opc('c', 'Mockar também o banco.', false, 'afasta ainda mais o teste da realidade.')] }
    ],
    abas: [
      { rotulo: 'Legibilidade e herança', blocos: [
        { tipo: 'texto', html:
          '<p>Uma pergunta por vez, sem consulta. Cada pergunta é um cenário; a rubrica diz o que basta e o modelo mostra uma resposta esperada, com o que reprova. Reprovar é permitido: volte ao bloco indicado e tente de novo.</p>' },

        { tipo: 'escolha', id: 'cp-esc-p1', titulo: 'P1 · Aquecimento: a divisão em passo1..passo9',
          pergunta: 'Um PR divide uma função de ciclomática 28 em nove funções <code>passo1</code> a <code>passo9</code> e a ciclomática máxima cai para 4. O que você faz?',
          opcoes: [
            { id: 'a', texto: 'Aceito: o número caiu.', correta: false, porque: 'o número menor não é legibilidade maior.' },
            { id: 'b', texto: 'Recuso a divisão como está: exijo nomes de domínio e entradas e saídas claras, e tento guard clauses e tabelas antes de extrair.', correta: true, porque: 'extrair só vale com nome de domínio; meça também o aninhamento, que a ciclomática não vê.' },
            { id: 'c', texto: 'Aceito se o autor prometer comentar cada passo.', correta: false, porque: 'comentário de bloco é o nome da função que falta; o problema é o nome vago e o estado compartilhado.' }
          ] },
        { tipo: 'escreva', id: 'cp-p1', titulo: 'P1 · Função de 90 linhas', obrigatorio: false,
          enunciado: 'Revisando um PR, você encontra uma função com ciclomática 28. O autor propõe dividir em 9 funções <code>passo1..passo9</code>. Aceite ou recuse e justifique com duas medidas. <em>Bloco 1.</em>',
          placeholder: 'Eu recusaria porque… Mediria… Antes de extrair, tentaria…',
          rubrica: [
            'Distingue <strong>ciclomática</strong> (caminhos e casos de teste) de <strong>aninhamento</strong> e nível de abstração (esforço de leitura).',
            'Exige <strong>nomes de domínio</strong> e entradas e saídas claras em cada função extraída.',
            'Propõe <strong>guard clauses</strong> e tabelas antes de extrair por extrair.',
            'Não aceita só porque o número caiu.'
          ],
          modelo: '<p>Eu recusaria a divisão como está. A ciclomática conta caminhos (e casos de teste), não esforço de leitura; eu mediria também o aninhamento. Funções chamadas <code>passo1</code> a <code>passo9</code> com estado compartilhado por atributos baixam o número e aumentam o custo de leitura, porque o leitor pula entre definições para reconstruir a sequência. Primeiro eu aplicaria guard clauses e, onde há cadeia sobre tipo, uma tabela de despacho; só extrairia partes com nome de domínio e entradas e saídas claras. Se o chamador não lê melhor do que lia o bloco inline, desfaço.</p>' + reprova('aceitar "porque o número caiu".') },

        { tipo: 'escreva', id: 'cp-p2', titulo: 'P2 · Herança ou composição', obrigatorio: false,
          enunciado: 'O time quer <code>class CacheRedis(ClienteHttp)</code> para reaproveitar <code>get()</code>. Decida e explique o que quebra quando <code>ClienteHttp</code> mudar. <em>Bloco 2.</em>',
          placeholder: 'Eu usaria composição porque… Quando o ClienteHttp mudar…',
          rubrica: [
            '<strong>Classe base frágil</strong>: a subclasse depende de quais métodos do pai chamam quais.',
            'Mudança compatível na interface pública do pai quebra a subclasse.',
            '<strong>Composição</strong> com o cliente injetado e uma porta definida pelo consumidor (<strong>Protocol</strong>).',
            'Reconhece a <strong>exceção legítima</strong> (pai projetado para extensão, substituibilidade total, hierarquia sob seu controle).'
          ],
          modelo: '<p>Um cache não é um cliente HTTP em nenhum sentido de substituibilidade; o que se quer é reuso. Com herança, o <code>CacheRedis</code> passa a depender de detalhes internos do <code>ClienteHttp</code> (por exemplo, se <code>get()</code> chama outro método interno). Quando o cliente mudar de modo compatível com a interface pública, a subclasse pode quebrar ou contar duas vezes, como na classe base frágil. Eu guardaria o cliente como atributo, delegaria e declararia num Protocol o que o cache precisa. Herdaria só se o pai fosse projetado para extensão ou a substituição fosse total.</p>' + reprova('"herança é sempre ruim", sem a exceção e sem o mecanismo.') },

        { tipo: 'escolha', id: 'cp-esc-p3', titulo: 'P3 · Aquecimento: a MRO',
          pergunta: 'Com <code>class A(Base)</code>, <code>class B(Base)</code> e <code>class C(A, B)</code>, todos com <code>super()</code> cooperativo, qual é o MRO de C?',
          opcoes: [
            { id: 'a', texto: 'C, A, Base, B, object.', correta: false, porque: 'o C3 põe cada classe antes dos seus pais, e Base é pai de A e B.' },
            { id: 'b', texto: 'C, A, B, Base, object.', correta: true, porque: 'a ordem declarada das bases é preservada e Base vem depois de todos os seus filhos.' },
            { id: 'c', texto: 'C, Base, A, B, object.', correta: false, porque: 'Base nunca vem antes de A e B.' }
          ] },
        { tipo: 'escreva', id: 'cp-p3', titulo: 'P3 · Ordem de super()', obrigatorio: false,
          enunciado: 'Dadas <code>class A(Base)</code>, <code>class B(Base)</code>, <code>class C(A, B)</code> com <code>super()</code> cooperativo, escreva a MRO e diga o que acontece se B esquecer o <code>super()</code>. <em>Bloco 2.</em>',
          placeholder: 'A MRO é… Se B esquecer super()…',
          rubrica: [
            'MRO: <code>C, A, B, Base, object</code>.',
            '<code>super()</code> segue a <strong>MRO da instância</strong>, não os pais diretos.',
            'O que vem depois de B (<code>Base</code>) <strong>não roda</strong>.',
            'Aponta a regra: todo método cooperativo chama <code>super()</code>, e <code>Classe.__mro__</code> confirma.'
          ],
          modelo: '<p>O MRO é C, A, B, Base, object (C3). <code>super()</code> significa "o próximo na MRO da instância", então o <code>super()</code> de A leva a B, e não a Base. Se B esquecer de chamar <code>super()</code>, a cadeia para em B: Base (e tudo depois) não roda, sem erro nem aviso. Por isso todo método cooperativo chama <code>super()</code>, o <code>__init__</code> cooperativo aceita <code>*args, **kwargs</code> e eu confirmo com <code>C.__mro__</code> quando duvido.</p>' + reprova('"super chama o pai".') },
        { tipo: 'takeaway', html: 'Meça <mark>ciclomática e aninhamento</mark>; <mark>composição</mark> por padrão e o MRO lido, não adivinhado.' }
      ] },

      { rotulo: 'Contratos, núcleo e SOLID', blocos: [
        { tipo: 'escolha', id: 'cp-esc-p4', titulo: 'P4 · Aquecimento: DIP não é DI',
          pergunta: 'Um serviço depende de um "repositório". Quem define a interface?',
          opcoes: [
            { id: 'a', texto: 'O consumidor (o serviço), no vocabulário do domínio; os adapters se adaptam a ela.', correta: true, porque: 'é o DIP; a injeção por construtor é só a técnica.' },
            { id: 'b', texto: 'A biblioteca de banco de dados.', correta: false, porque: 'o domínio passaria a importar o detalhe.' },
            { id: 'c', texto: 'Um módulo utils comum a todos.', correta: false, porque: 'sem dono nem direção de dependência.' }
          ] },
        { tipo: 'escreva', id: 'cp-p4', titulo: 'P4 · Protocol ou ABC', obrigatorio: false,
          enunciado: 'Um serviço depende de um "repositório". Quem define a interface, e qual mecanismo você usa para erro cedo e para testes? <em>Blocos 2 e 4.</em>',
          placeholder: 'A interface pertence a… Eu usaria… Para erro cedo…',
          rubrica: [
            'A interface <strong>pertence ao consumidor</strong> (DIP): o serviço declara o que precisa.',
            '<strong>Protocol</strong> + mypy para contratos do consumidor; <strong>ABC</strong> quando há gabarito e hierarquia própria.',
            '<code>runtime_checkable</code> só confere <strong>nomes</strong>, não assinaturas.',
            'Distingue <strong>DIP</strong> (quem define a interface) de <strong>injeção de dependência</strong> (a técnica).'
          ],
          modelo: '<p>A interface é do consumidor: o serviço declara num Protocol o que precisa do repositório (<code>obter</code>, <code>salvar</code>), no vocabulário dele, e qualquer adapter que tenha esses membros serve sem importar o serviço. O erro aparece no mypy, que roda no CI. Uso ABC só se for dona da hierarquia e quiser gabarito compartilhado e erro ao instanciar. <code>@runtime_checkable</code> só confere a presença dos nomes, então nunca é validação de contrato. Para testes, um fake em memória validado por teste de contrato. DIP é a decisão sobre quem define a interface; injetar pelo construtor é a técnica que a põe em prática.</p>' + reprova('confundir DIP com injeção de dependência.') },

        { tipo: 'escreva', id: 'cp-p5', titulo: 'P5 · Núcleo e casca', obrigatorio: false,
          enunciado: 'Dada uma função que lê pedido, aplica descontos pela data, grava e envia e-mail, reorganize em núcleo funcional e casca, listando o que cada um recebe e devolve e como testa. <em>Blocos 3 e 5.</em>',
          placeholder: 'O núcleo recebe… e devolve… A casca…',
          rubrica: [
            'A <strong>data entra como parâmetro</strong> do núcleo.',
            'O núcleo devolve um <strong>resultado puro</strong> (dados), sem I/O.',
            'A casca recebe <strong>repositório e notificador injetados</strong>, lê o relógio, grava e notifica.',
            'Os testes do núcleo <strong>não usam dublês</strong>; a casca é testada pela orquestração (ordem, falha sem notificar).'
          ],
          modelo: '<p>O núcleo é <code>calcular(pedido, hoje) -&gt; Resultado</code>: recebe o pedido e a data como dados e devolve o resultado, sem relógio, banco nem e-mail. A casca (<code>fechar</code>) recebe repositório, relógio e notificador por construtor, lê <code>hoje</code>, chama o núcleo, grava e notifica os ouvintes. Testo o núcleo com chamadas diretas, sem dublê; a casca, com fake de repositório, stub de relógio e spy de ouvinte, verificando a ordem e que a falha do repositório impede a notificação.</p>' + reprova('"mockar <code>date.today</code> e <code>smtplib</code>" sem pensar em design.') },

        { tipo: 'escreva', id: 'cp-p6', titulo: 'P6 · SOLID sob questionamento', obrigatorio: false,
          enunciado: 'Um colega propõe interface + implementação + factory + container para uma classe com uma só implementação. Argumente contra e diga o que mudaria sua opinião. <em>Bloco 4.</em>',
          placeholder: 'Eu perguntaria… Mudaria minha opinião se…',
          rubrica: [
            'Pergunta pela <strong>mudança concreta</strong> que a abstração torna barata.',
            '<strong>Abstrair na segunda ou terceira variante</strong>: duplique uma vez, abstraia na terceira.',
            'Abstrai <strong>fronteiras que se trocam</strong> (rede, relógio, banco), não a biblioteca padrão.',
            'Não recusa toda abstração nem aceita "por precaução".'
          ],
          modelo: '<p>Eu perguntaria qual mudança concreta, que já aconteceu ou está no roadmap, essa abstração barateia. Com uma só implementação, interface, factory e container são cerimônia paga em cada leitura, e abstrair cedo fixa a forma errada; extrair depois, com testes, é barato. Eu mudaria de opinião se aparecesse uma segunda variante real, ou se o teste precisasse trocar uma fronteira (rede, relógio, banco): aí um Protocol pequeno definido pelo consumidor e um composition root explícito bastam, sem container.</p>' + reprova('recusar toda abstração, ou aceitar "por precaução".') },
        { tipo: 'takeaway', html: 'A interface é do <mark>consumidor</mark>; o núcleo é <mark>puro</mark>; abstração exige <mark>mudança concreta</mark>.' }
      ] },

      { rotulo: 'Legado e dublês', blocos: [
        { tipo: 'escreva', id: 'cp-p7', titulo: 'P7 · Refatorar o legado', obrigatorio: false,
          enunciado: 'Função crítica de cobrança, sem testes, dependente do relógio. Descreva a sequência de passos antes de mudar uma linha e como prova que não houve regressão. <em>Bloco 6.</em>',
          placeholder: 'Primeiro… Depois… Prova…',
          rubrica: [
            '<strong>Costura</strong> para o relógio criada antes do refator, com o mínimo de edição.',
            '<strong>Caracterização automática</strong> (golden), cobrindo bordas e erros, sem editar o oráculo à mão.',
            '<strong>Passos pequenos</strong> com a suíte verde e <strong>teste diferencial</strong> em volume.',
            '<strong>Controle negativo</strong> (estragar o refator de propósito) e <strong>commits separados</strong> para refator e comportamento.'
          ],
          modelo: '<p>Primeiro crio a costura do relógio (um helper substituível) com o mínimo de edição no legado. Depois caracterizo: entradas que cobrem ramos, bordas e erros, saída gravada automaticamente num golden, preservado mesmo onde pareça bug. Refatoro em passos pequenos, rodando o golden a cada um, e a dependência do relógio vira parâmetro. Comparo refatorado e legado com um teste diferencial de milhares de casos com semente fixa e provo que a rede pega estragando o refator de propósito. Refator e mudança de comportamento ficam em commits separados.</p>' + reprova('reescrever e comparar "por amostragem manual".') },

        { tipo: 'escolha', id: 'cp-esc-p8', titulo: 'P8 · Aquecimento: o Mock que mente',
          pergunta: 'O teste do serviço usa <code>Mock()</code> do repositório e passa, mas em produção <code>repo.salvar_tudo()</code> não existe. Qual é a correção mínima?',
          opcoes: [
            { id: 'a', texto: 'Aumentar a cobertura de linhas.', correta: false, porque: 'a linha já era executada; o problema é o mock sem especificação.' },
            { id: 'b', texto: '<code>create_autospec(RepositorioPedidos, instance=True)</code>, que recusa atributo inexistente.', correta: true, porque: 'a correção de design é um fake com teste de contrato e verificação de estado.' },
            { id: 'c', texto: 'Adicionar um método <code>salvar_tudo</code> ao Mock.', correta: false, porque: 'esconde o bug em vez de revelá-lo.' }
          ] },
        { tipo: 'escreva', id: 'cp-p8', titulo: 'P8 · Mock que mente', obrigatorio: false,
          enunciado: 'O teste do serviço usa <code>Mock()</code> do repositório e passa; em produção, <code>repo.salvar_tudo()</code> não existe. Explique e dê duas correções, uma mínima e uma de design. <em>Bloco 7.</em>',
          placeholder: 'O Mock passa porque… A correção mínima é… A de design é…',
          rubrica: [
            'O <code>Mock()</code> solto <strong>aceita qualquer atributo</strong>: o teste não conhece o contrato.',
            'Correção mínima: <strong>autospec</strong> (<code>create_autospec</code> ou <code>spec=</code>).',
            'Correção de design: <strong>fake</strong> com <strong>teste de contrato</strong> compartilhado com o adapter real.',
            '<strong>Estado em vez de interação</strong>; mock só quando a chamada é o comportamento.'
          ],
          modelo: '<p>O <code>Mock()</code> sem especificação aceita qualquer atributo, então o teste passa mesmo chamando um método que o repositório nunca teve. A correção mínima é <code>create_autospec(RepositorioPedidos, instance=True)</code>, que recusa o atributo inexistente. A de design é trocar o mock por um fake em memória que implementa o contrato, validado pelos mesmos testes de contrato do adapter real, e verificar estado ("o repositório contém o pedido") em vez de interação. Mock só onde a chamada é o comportamento, como enviar e-mail ou cobrar o cartão.</p>' + reprova('"falta cobertura".') },
        { tipo: 'texto', html: '<p class="ta-nota">Estado verificado em 11/10/2026 (Python 3.14.7, pytest 9.1.1, ruff 0.17.0). Regras de lint e mensagens de erro mudam entre versões; revalide em até 90 dias.</p>' },
        { tipo: 'takeaway', html: 'Em cada resposta: o <mark>mecanismo</mark> primeiro e, depois, o <mark>custo ou limite</mark> da solução.' }
      ] }
    ]
  });
})();
