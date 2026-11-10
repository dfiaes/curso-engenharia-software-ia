/* LT03 · Bloco 1: Cloud, failure domains e artefatos OCI. Fonte: LT03.html#b01. Saídas de terminal são exemplo variável, não evidência. */
(function () {
  var L = function (kind, text) { return { kind: kind, text: text }; };
  function opc(id, texto, correta, porque) { return { id: id, texto: texto, correta: correta, porque: porque }; }

  var codigo = [
    'import re', '',
    'PADRAO = re.compile(r"^\\s*([A-Za-z]+)\\s+(.*?)\\s*$")', '', '',
    'def instrucoes(texto):',
    '    saidas = []',
    '    for linha in texto.splitlines():',
    '        sem = linha.split("#", 1)[0]',
    '        if not sem.strip():',
    '            continue',
    '        m = PADRAO.match(sem)',
    '        if m:',
    '            saidas.append((m.group(1).upper(), m.group(2).strip()))',
    '    return saidas', '', '',
    'def usuario_final(texto):',
    '    # ultimo USER declarado; None se ausente (roda como root)',
    '    return None', '', '',
    'def digest_pinado_na_base_final(texto):',
    '    # a ULTIMA base apos FROM referencia conteudo exato via "@sha256:"',
    '    return False', '', '',
    'def aprovada(texto):',
    '    # non-root (USER existe e nao e root nem 0) E digest pinado na base final',
    '    return False', ''].join('\n');

  var solucao = [
    'import re', '',
    'PADRAO = re.compile(r"^\\s*([A-Za-z]+)\\s+(.*?)\\s*$")', '', '',
    'def instrucoes(texto):',
    '    saidas = []',
    '    for linha in texto.splitlines():',
    '        sem = linha.split("#", 1)[0]',
    '        if not sem.strip():',
    '            continue',
    '        m = PADRAO.match(sem)',
    '        if m:',
    '            saidas.append((m.group(1).upper(), m.group(2).strip()))',
    '    return saidas', '', '',
    'def usuario_final(texto):',
    '    usuarios = [a.split()[0] for n, a in instrucoes(texto) if n == "USER"]',
    '    return usuarios[-1] if usuarios else None', '', '',
    'def digest_pinado_na_base_final(texto):',
    '    bases = [a.split()[0] for n, a in instrucoes(texto) if n == "FROM"]',
    '    return bool(bases) and "@sha256:" in bases[-1]', '', '',
    'def aprovada(texto):',
    '    u = usuario_final(texto)',
    '    return u is not None and u not in ("root", "0") and digest_pinado_na_base_final(texto)', ''].join('\n');

  var testes = [
    'BOM = "FROM python:3.14-slim@sha256:abc\\nUSER app\\nCMD python\\n"', '', '',
    'def test_usuario_final_e_o_ultimo():',
    '    assert usuario_final("FROM x\\nUSER a\\nUSER b\\n") == "b"', '', '',
    'def test_sem_user_roda_como_root():',
    '    assert usuario_final("FROM x\\n") is None', '', '',
    'def test_digest_vale_so_para_a_base_final():',
    '    assert not digest_pinado_na_base_final("FROM a@sha256:1 AS build\\nFROM python:3.14-slim\\n")', '', '',
    'def test_tag_solta_nao_e_digest():',
    '    assert not digest_pinado_na_base_final("FROM python:latest\\n")', '', '',
    'def test_caminho_feliz_aprova():',
    '    assert aprovada(BOM)', '', '',
    'def test_root_explicito_reprova():',
    '    assert not aprovada(BOM.replace("USER app", "USER root"))', '', '',
    'def test_sem_user_reprova():',
    '    assert not aprovada("FROM python:3.14-slim@sha256:abc\\nCMD python\\n")', ''].join('\n');

  TrilhaAula.registrar({
    id: 'lt03-b1',
    titulo: 'Cloud, failure domains e artefatos OCI',
    minutos: 40,
    resumo: 'Subir para a nuvem não é uma decisão: é um conjunto de responsabilidades, domínios de falha e custos. E a imagem que roda hoje só é a de ontem se for referenciada pelo digest, nunca pela tag.',
    objetivo: 'Localizar responsabilidade, failure domain e custo de uma decisão de cloud; explicar a imagem OCI e por que digest é identidade e tag é apelido; projetar uma imagem Python mínima, non-root e sem segredo; e ordenar o shutdown do container (drenar, concluir ou cancelar, sair).',
    revisao: [
      { id: 'lt03b1-fd', pergunta: 'Três réplicas rodam no mesmo nó e a equipe diz que é alta disponibilidade. Qual é o erro?',
        opcoes: [
          opc('a', 'Réplicas no mesmo failure domain falham juntas; HA exige espalhar por nós e zonas', true, 'failure domain é a unidade que falha junta: três réplicas no mesmo nó são um ponto único de falha com três cópias.'),
          opc('b', 'Faltam réplicas: com cinco seria HA', false, 'o número de réplicas não muda o domínio compartilhado.'),
          opc('c', 'HA só existe com banco replicado', false, 'o banco também é um domínio, mas o erro aqui é o nó único.')] },
      { id: 'lt03b1-digest', pergunta: 'O que a promoção e o rollback devem referenciar?',
        opcoes: [
          opc('a', 'O digest sha256 da imagem validada', true, 'tag é apelido mutável e pode ser movida entre a validação e o deploy; digest é o hash do conteúdo.'),
          opc('b', 'A tag app:stable', false, 'a tag pode apontar para outro conteúdo a qualquer momento.'),
          opc('c', 'A tag com a data do build', false, 'continua sendo tag: mutável, sem garantia de conteúdo.')] },
      { id: 'lt03b1-camada', pergunta: 'Um segredo é copiado numa camada e removido na instrução seguinte. Qual é a situação?',
        opcoes: [
          opc('a', 'Segredo publicado: a camada anterior continua na imagem e no histórico', true, 'camada nunca é removida por instrução posterior; segredo fica fora do build e entra na execução.'),
          opc('b', 'Seguro: a instrução de remoção apaga o arquivo da imagem', false, 'apaga só da visão final do filesystem, não da camada.'),
          opc('c', 'Seguro, desde que a tag mude', false, 'a tag não altera o conteúdo das camadas.')] },
      { id: 'lt03b1-sigterm', pergunta: 'Na ordem do shutdown em container, o que vem primeiro depois do SIGTERM?',
        opcoes: [
          opc('a', 'Drenar: fechar a entrada para tráfego novo', true, 'cada requisição aceita após o sinal é uma futura vítima do SIGKILL.'),
          opc('b', 'Concluir o trabalho em curso', false, 'concluir vem depois de fechar a entrada.'),
          opc('c', 'Sair com o exit code', false, 'sair é o último passo, dentro do grace.')] },
      { id: 'lt03b1-rebuild', pergunta: 'Rebuild do mesmo commit gera digest distinto. Causa provável?',
        opcoes: [
          opc('a', 'Entradas flutuantes: base sem digest ou dependência sem lock', true, 'build reproduzível exige Dockerfile versionado, lockfile e base pinada por digest.'),
          opc('b', 'O registry está lento', false, 'velocidade não altera conteúdo.'),
          opc('c', 'A tag latest está desatualizada', false, 'tag fixa não resolve: o problema é a entrada que muda.')] }
    ],
    abas: [
      { rotulo: 'Cloud e failure domains', blocos: [
        { tipo: 'texto', html:
          '<p>&ldquo;Subi para a nuvem&rdquo; não diz quem opera o quê, o que falha junto nem quanto custa. <strong>Cloud</strong> é acesso por rede a recursos computacionais compartilhados, provisionados sob demanda e medidos por uso. Três ideias a separam de &ldquo;servidor alugado&rdquo;: o provisionamento é por chamada (não por chamado), a capacidade é elástica dentro de limites (não infinita) e tudo é medido, com preço por unidade. A fonte normativa das características e modelos é o NIST SP 800-145.</p>' +
          '<h3>Responsabilidade compartilhada</h3>' +
          '<p>É a linha que diz quem opera o quê. Cada degrau troca controle por operação delegada, e cada delegação tem preço, limite e saída, que precisam constar na decisão.</p>' +
          '<ul><li><strong>IaaS</strong> (infraestrutura como serviço): compute, rede e storage crus. O provedor opera o físico e a virtualização; sistema operacional, runtime e aplicação são seus.</li>' +
          '<li><strong>PaaS</strong> (plataforma como serviço): o provedor opera runtime, banco e fila gerenciados; você opera código, dado e configuração.</li>' +
          '<li><strong>SaaS</strong> (software como serviço): aplicativo pronto; você opera identidade, dado e uso.</li></ul>' },
        { tipo: 'texto', largo: true, html:
          '<table><thead><tr><th>Termo</th><th>Definição e mecanismo</th><th>Limite</th></tr></thead><tbody>' +
          '<tr><td>Região / zona</td><td>Região é um conjunto geográfico de zonas; zona é um ou mais datacenters com energia e rede independentes. Entre zonas sobrevive à perda de uma; entre regiões, à perda de uma geografia.</td><td>Cada travessia cobra latência e egress. Zona não protege contra erro de configuração replicado em todas.</td></tr>' +
          '<tr><td>Failure domain</td><td>Unidade que falha junta: nó, rack, zona, região, ou dependência compartilhada (um banco único, um DNS). Desenhar é listar o que falha junto e provar que o crítico não mora no mesmo domínio.</td><td>Duas réplicas no mesmo nó não são alta disponibilidade.</td></tr>' +
          '<tr><td>Egress</td><td>Tráfego que sai da rede do provedor, medido e cobrado por volume. Entrada costuma ser gratuita; saída, nunca.</td><td>Cruzar fronteira de rede a cada requisição converte latência em fatura.</td></tr>' +
          '<tr><td>Quota</td><td>Teto administrativo de consumo: CPUs, endereços, taxa de chamadas.</td><td>Quota estourada no pico é indisponibilidade com outro nome; peça o aumento antes.</td></tr>' +
          '<tr><td>Elasticidade / capacidade</td><td>Elasticidade é variar recursos sob demanda; capacidade é o teto físico e contratual do momento. Escalar é pedir; atender depende de haver.</td><td>Não é instantânea: subir réplica leva tempo de imagem, inicialização e aquecimento.</td></tr>' +
          '</tbody></table>' },
        { tipo: 'texto', html:
          '<h3>Custo e portabilidade</h3>' +
          '<p><strong>Custo fixo</strong> é o que você paga parado (reserva, disco provisionado, endereço); <strong>variável</strong> acompanha o uso (CPU-hora, egress, requisições). O erro clássico é desenhar como se tudo fosse variável e descobrir o fixo na fatura, ou o inverso e pagar o pico o mês inteiro. Sobre portabilidade: cada serviço gerenciado acelera hoje e cobra saída amanhã (formato proprietário, egress de extração, reescrita). A decisão honesta registra <strong>responsabilidade, egress e saída</strong> por escrito, na tabela de decisão.</p>' +
          '<p>O sintoma de quem acreditou em &ldquo;está na nuvem, então é elástico e portável&rdquo;: a fatura cresce junto com o tráfego, a latência não melhora e ninguém sabe dizer o que cada parte custa nem como sair.</p>' },
        { tipo: 'escolha', id: 'b1-escolha-ha', titulo: 'Aquecimento: a alta disponibilidade de um nó só', obrigatorio: false,
          pergunta: 'Três réplicas do serviço rodam no mesmo nó, e a equipe diz que isso é alta disponibilidade. Qual é o erro?',
          opcoes: [
            opc('a', 'Faltam réplicas: com cinco seria HA.', false, 'mais réplicas no mesmo nó continuam falhando juntas.'),
            opc('b', 'Réplicas no mesmo failure domain falham juntas; HA exige espalhar por domínios diferentes.', true, 'três réplicas no mesmo nó são um ponto único de falha com três cópias. Espalhe por nós e zonas e confirme que cabem nos domínios restantes.'),
            opc('c', 'Alta disponibilidade só existe com banco replicado.', false, 'o banco é outro domínio possível, mas não é o erro descrito.'),
            opc('d', 'O erro é o tamanho da imagem.', false, 'tamanho não altera o domínio de falha.')] },
        { tipo: 'takeaway', html: 'Toda decisão de cloud nomeia <mark>responsabilidade</mark>, <mark>failure domain</mark>, <mark>egress</mark> e <mark>saída</mark>; réplicas no mesmo domínio não são HA.' }
      ] },

      { rotulo: 'Imagem OCI e Dockerfile', blocos: [
        { tipo: 'texto', html:
          '<p>A <strong>imagem OCI</strong> é um empacotamento padronizado de tudo que o processo precisa para rodar: filesystem, config de execução e o ponteiro imutável que a identifica. Quatro peças compõem o pacote. O <strong>registry</strong> (distribuição) é a prateleira; o <strong>índice</strong> (index) lista variantes por arquitetura sob um mesmo nome.</p>' },
        { tipo: 'texto', largo: true, html:
          '<table><thead><tr><th>Peça</th><th>O que é</th><th>Limite</th></tr></thead><tbody>' +
          '<tr><td>Camada (layer)</td><td>Tarball de diferenças do filesystem, empilhado sobre as anteriores. Camadas idênticas são armazenadas e transferidas uma vez.</td><td>Nunca é removida por instrução posterior: arquivo apagado continua no histórico e no tamanho. Segredo copiado numa camada é segredo publicado.</td></tr>' +
          '<tr><td>Config</td><td>Como executar: arquitetura, sistema, comando padrão, usuário, variáveis, portas. Tem digest próprio.</td><td>Declara intenção, não impõe: o usuário pode ser sobrescrito na execução. A prova está no runtime.</td></tr>' +
          '<tr><td>Manifest</td><td>Referencia a config e cada camada pelos digests, mais anotações. Ler o manifest é ver a composição exata sem baixar o conteúdo.</td><td>Descreve uma arquitetura; o multi-arch mora no índice.</td></tr>' +
          '<tr><td>Digest</td><td>Hash do conteúdo (<code>sha256:…</code>): a identidade. Mesmo byte, mesmo digest.</td><td>Ilegível por humanos: identifica, não explica. Versão legível mora ao lado, nunca no lugar.</td></tr>' +
          '<tr><td>Tag</td><td>Apelido mutável que aponta para um digest e pode ser movido a qualquer momento.</td><td>Tag move; digest não. Promoção e rollback referenciam digest.</td></tr>' +
          '<tr><td>Registry</td><td>Guarda e serve blobs e manifests: publica, lista tags, resolve digest, controla acesso.</td><td>É dependência de deploy: indisponível, nada novo sobe.</td></tr>' +
          '</tbody></table>' },
        { tipo: 'texto', html:
          '<p>Três detalhes de execução. O processo principal é o <strong>PID 1</strong>: pai dos órfãos e destinatário do SIGTERM do runtime. O <strong>usuário</strong> de execução decide o dano alcançável: root no container compartilha o kernel com o host, e container não é VM nem fronteira absoluta. O filesystem é a soma das camadas, gravável por padrão; raiz read-only move a escrita para volumes explícitos. Identidade é conteúdo; nome é conveniência: promoção move o mesmo digest, rollback volta ao digest anterior, auditoria cita digest.</p>' },
        { tipo: 'rode', id: 'b1-rode-tag', titulo: 'A tag que mudou de lugar', obrigatorio: false,
          enunciado: 'Acompanhe as três etapas. Valores de sha256 abreviados são exemplo.',
          prefixo: '$', entrada: 'crane digest registry.exemplo/app:1.4', unidade: 'ms', terminalTitulo: 'registry (exemplo)',
          prever: { pergunta: 'Na segunda etapa, ninguém alterou o código nem a tag app:1.4. O deploy resolve a tag. O que roda?', opcoes: [
            { id: 'a', texto: 'O mesmo conteúdo da primeira etapa, porque o nome é igual.', correta: false, porque: 'o nome é igual, o conteúdo não precisa ser.' },
            { id: 'b', texto: 'Um conteúdo possivelmente distinto: a tag foi movida para outro digest.', correta: true, porque: 'tag é apelido mutável; só o digest identifica o conteúdo exato.' },
            { id: 'c', texto: 'O deploy falha, porque a tag já existia.', correta: false, porque: 'mover uma tag é uma operação normal do registry, sem aviso.' }
          ] },
          etapas: [
            { id: 'ontem', nome: 'Ontem', descricao: 'Teste em homologação', tom: 'dns', ms: 1, linhas: [
              L('cmd', 'crane digest registry.exemplo/app:1.4'), L('out', 'sha256:aaa…'), L('hint', 'exemplo: app:1.4 aponta para sha256:aaa e foi testado')] },
            { id: 'hoje', nome: 'Hoje', descricao: 'Deploy em produção', tom: 'request', ms: 2, linhas: [
              L('cmd', 'crane digest registry.exemplo/app:1.4'), L('out', 'sha256:bbb…'), L('hint', 'exemplo: mesmo nome, outro conteúdo; nada avisou ninguém')] },
            { id: 'digest', nome: 'Por digest', descricao: 'Promoção referencia o hash', tom: 'response', ms: 1, linhas: [
              L('cmd', 'deploy registry.exemplo/app@sha256:aaa…'), L('in', 'roda o conteúdo exato que foi testado'), L('hint', 'a tag fica como rótulo para humanos')] }
          ],
          tutorDepois: 'Esse é o incidente &ldquo;ontem funcionava&rdquo;: o registry com tag mutável é o mecanismo.',
          callout: 'Você viu a tag mover e o digest ficar.' },
        { tipo: 'takeaway', html: '<mark>Tag</mark> é apelido que move; <mark>digest</mark> é a identidade do conteúdo. Promoção e rollback citam o digest.' },
        { tipo: 'texto', html:
          '<h3>Imagem Python mínima, non-root, reproduzível</h3>' +
          '<p>Cinco decisões, cada uma com mecanismo e verificação:</p>' +
          '<ul><li><strong>Base mínima.</strong> Variante enxuta (<code>slim</code>, <code>alpine</code>, <code>distroless</code>), nunca a imagem completa com toolchain: menos pacote é menos superfície e pull mais curto. A checagem local é heurística (nome da variante); o tamanho real se mede na trilha externa.</li>' +
          '<li><strong>Build em estágios.</strong> Um estágio monta (instala dependências, compila); o final carrega só o artefato. O que fica no estágio descartado não entra em camada alguma da imagem final.</li>' +
          '<li><strong>Dependências bloqueadas.</strong> Versões exatas em lockfile: o mesmo manifesto resolve o mesmo conjunto hoje e daqui a meses. Sem lock, rebuild é sorteio silencioso.</li>' +
          '<li><strong>Usuário non-root.</strong> Criar usuário sem privilégio e declarar <code>USER</code> antes do comando. Verificação estática na folha (último <code>USER</code>); prova no runtime.</li>' +
          '<li><strong>Dockerfile versionado, sem segredo.</strong> No Git, revisado como código: base pinada por digest, nenhuma credencial em instrução, nenhum arquivo de segredo copiado.</li></ul>' +
          '<p>Os três defeitos catalogados (root por preguiça, segredo na camada, base flutuante) passam verdes no build. Por isso a validação é estática e prévia: o <code>lab/validar_dockerfile.py</code> lê o texto antes de qualquer build e recusa os três. <strong>Reproduzível</strong> significa: mesmo Dockerfile, mesmo lockfile e mesma base por digest produzem o mesmo digest de imagem.</p>' },
        { tipo: 'takeaway', html: 'Os três defeitos da imagem (<mark>root</mark>, <mark>segredo em camada</mark>, <mark>base flutuante</mark>) passam verdes no build: só o <mark>validador estático</mark> os pega.' }
      ] },

      { rotulo: 'SIGTERM e drenagem', blocos: [
        { tipo: 'texto', html:
          '<p>No container, o SIGTERM chega ao PID 1 pelo runtime, e o <strong>grace period</strong> é o tempo contratado entre esse pedido e o SIGKILL imposto. O mecanismo é o do LT01-B01 (shutdown cooperativo), com uma etapa a mais na frente: a <strong>drenagem</strong>.</p>' +
          '<ol><li><strong>Drenar:</strong> parar de receber tráfego novo. O endpoint sai do balanceamento antes de qualquer outra coisa. Shutdown que aceita trabalho novo durante o grace é defeito catalogado: cada aceita é uma futura vítima do SIGKILL.</li>' +
          '<li><strong>Encerrar ou cancelar o trabalho em curso.</strong> Requisições breves concluem; trabalho longo recebe cancelamento cooperativo. Handler que ignora cancelamento desperdiça o grace inteiro.</li>' +
          '<li><strong>Sair com o exit code contratado, dentro do prazo.</strong> Morte por SIGKILL registra a morte, não a saída.</li></ol>' },
        { tipo: 'rode', id: 'b1-rode-drenar', titulo: 'Timeline de um shutdown',
          enunciado: 'Exemplo variável com <code>drenagem_grace.py</code>: 3 requisições em curso (1 s, 2 s, 30 s) e grace de 5 s. Os números não são evidência; a folha B01-L mede.',
          prefixo: '$', entrada: 'kill -TERM 1   # exemplo, dentro do container', unidade: 's', terminalTitulo: 'container (exemplo)',
          prever: { pergunta: 'Chega o SIGTERM com 3 requisições em curso (1 s, 2 s e 30 s) e grace de 5 s. Qual o resultado esperado de uma drenagem correta?', opcoes: [
            { id: 'a', texto: '2 concluídas, 1 cancelada, entrada fechada no instante do sinal, saída com código 0 dentro do prazo.', correta: true, porque: 'fecha a entrada, deixa o que cabe no grace concluir, cancela o resto e sai limpo.' },
            { id: 'b', texto: 'As 3 concluem, mesmo a de 30 s, porque o grace espera.', correta: false, porque: 'o grace é um prazo: o que não cabe é cancelado, não esperado.' },
            { id: 'c', texto: 'As 3 morrem por SIGKILL, porque o sinal é imediato.', correta: false, porque: 'SIGTERM é o pedido; SIGKILL só vem depois do grace.' }
          ] },
          etapas: [
            { id: 'sinal', nome: 'SIGTERM', descricao: 'Runtime entrega o sinal ao PID 1', tom: 'dns', ms: 0, linhas: [
              L('info', 't=0   SIGTERM recebido; deadline interno = grace (5 s)')] },
            { id: 'fechar', nome: 'Fechar entrada', descricao: 'Passo 1', tom: 'tcp', ms: 0, linhas: [
              L('out', 'servico.fechar_entrada()   aceitando=False'), L('hint', 'nova requisição: RuntimeError entrada fechada')] },
            { id: 'concluir', nome: 'Concluir ou cancelar', descricao: 'Passo 2', tom: 'request', ms: 5, linhas: [
              L('in', 't=1   requisição de 1 s concluída'), L('in', 't=2   requisição de 2 s concluída'), L('out', 't=5   requisição de 30 s cancelada (CancelledError)')] },
            { id: 'sair', nome: 'Sair', descricao: 'Passo 3', tom: 'response', ms: 5, linhas: [
              L('body', '{"concluidas": 2, "canceladas": 1, "relogio_s": 5.0, "codigo_saida": 0}'), L('hint', 'exemplo variável, formato ilustrativo')] }
          ],
          tutorDepois: 'Entrada fechada no instante do sinal: é isso que impede que o trabalho novo vire vítima do SIGKILL.',
          callout: 'Você leu a timeline completa da drenagem.' },
        { tipo: 'ordene', id: 'b1-ordene', titulo: 'Ordene o shutdown', obrigatorio: false,
          enunciado: 'O SIGTERM chegou ao PID 1. Coloque os passos na ordem certa.',
          itens: [
            { id: 'sair', texto: 'Sair com o exit code contratado, dentro do prazo' },
            { id: 'concluir', texto: 'Concluir as requisições breves e cancelar cooperativamente o trabalho longo' },
            { id: 'sinal', texto: 'Receber o SIGTERM do runtime no PID 1' },
            { id: 'fechar', texto: 'Fechar a entrada: nenhum tráfego novo' }],
          solucao: ['sinal', 'fechar', 'concluir', 'sair'],
          dica: 'Antes de mexer no que está em curso, impeça que entre mais trabalho.',
          tutorDepois: 'Trocar &ldquo;fechar a entrada&rdquo; por &ldquo;concluir&rdquo; deixa chegar trabalho que o SIGKILL vai matar.' },
        { tipo: 'callout', tom: 'info', titulo: 'O que a folha local prova e o que não prova', html:
          '<p>A folha B01-L prova o contrato do Dockerfile e o comportamento de sinal e grace. Build, publicação, inspeção de manifest e camadas, execução pelo digest, tamanho e cold start são da trilha externa com Docker; onde Docker estiver ausente, esses oráculos nascem <strong>BLOCKED</strong> com registro, nunca simulados e nunca com número hardcoded.</p>' },
        { tipo: 'takeaway', html: 'Ordem do shutdown: <mark>drenar</mark>, <mark>concluir ou cancelar</mark> no grace, <mark>sair</mark> com o exit code.' }
      ] },

      { rotulo: 'Praticar e conferir', blocos: [
        { tipo: 'python', id: 'b1-python', titulo: 'Escreva o validador de Dockerfile', obrigatorio: false,
          enunciado: 'Complete <code>usuario_final</code> (último <code>USER</code>, ou <code>None</code>), <code>digest_pinado_na_base_final</code> (só a última base conta) e <code>aprovada</code> (non-root e digest pinado). É um recorte de <code>lab/validar_dockerfile.py</code>.',
          codigo: codigo, testes: testes,
          dica: '<code>instrucoes(texto)</code> devolve pares (INSTRUCAO, argumentos). Filtre <code>USER</code> e <code>FROM</code>, pegue o primeiro token dos argumentos e use o último da lista.',
          solucao: solucao,
          tutorDepois: 'Repare no caso do multi-stage: digest só no estágio de build não pina a imagem final.',
          callout: 'O validador estático recusa root, base flutuante e Dockerfile sem USER.' },
        { tipo: 'transcript', id: 'b1-transcript', titulo: 'Ache a afirmação que a evidência não sustenta', obrigatorio: false, terminalTitulo: 'revisão de imagem',
          enunciado: 'A pessoa que montou a imagem diz que está tudo certo. Uma afirmação não é sustentada pelo que o terminal mostra. Clique na linha e aperte Conferir.',
          linhas: [
            { quem: 'voce', texto: 'Mostre o Dockerfile e o relatório estático.' },
            { quem: 'ferramenta', texto: '$ cat Dockerfile\nFROM python:3.14-slim\nCOPY . /app\nUSER app\nCMD ["python", "-m", "app"]' },
            { quem: 'ferramenta', texto: '$ python validar_dockerfile.py Dockerfile\n{"nao_root": true, "digest_pinado": false, "base_minima": true, "expoe_segredo": false, "aprovada": false}  # exemplo' },
            { quem: 'agente', texto: 'O usuário final é app, então a imagem roda como non-root.' },
            { quem: 'agente', texto: 'A imagem é reproduzível: o Dockerfile está versionado.' }
          ],
          erradas: [4],
          explicacao: { 4: 'o relatório mostra <code>digest_pinado: false</code>. Dockerfile versionado não basta: sem base pinada por digest (e sem lockfile) o rebuild do mesmo commit pode gerar digest distinto.' },
          tutorDepois: 'A primeira afirmação é sustentada pela linha <code>USER app</code> e por <code>nao_root: true</code>. A segunda ignora uma entrada flutuante.' },
        { tipo: 'cenario', id: 'b1-cenario', titulo: 'Ontem funcionava', obrigatorio: false,
          enunciado: 'Produção se comporta diferente da homologação, sem mudança de código.',
          inicio: 'inicio',
          nos: {
            inicio: { texto: 'O mesmo manifesto usa <code>app:1.4</code> e o comportamento mudou entre dois deploys. Por onde começar?', opcoes: [
              { texto: 'Culpar cache ou rede e repetir o deploy.', vai: 'f-cache', tom: 'ruim', consequencia: 'repetir o deploy resolve a mesma tag, possivelmente para o mesmo conteúdo errado.' },
              { texto: 'Comparar o digest que cada ambiente resolveu para a tag.', vai: 'digest', tom: 'ok', consequencia: 'o digest é a identidade: se diferem, a tag foi movida.' }] },
            digest: { texto: 'Os digests diferem: a tag foi movida. Qual é o conserto?', opcoes: [
              { texto: 'Criar outra tag fixa, como app:1.4-final.', vai: 'f-tag', tom: 'ruim', consequencia: 'outra tag é outro apelido mutável; o incidente se repete.' },
              { texto: 'Pinar por digest na promoção e na evidência; a tag vira rótulo de leitura.', vai: 'f-bom', tom: 'ok', consequencia: 'o deploy cita o conteúdo exato que foi testado.' }] }
          },
          finais: {
            'f-bom': { bom: true, texto: 'Promoção e rollback passam a referenciar o digest; a tag ficou como conveniência humana.' },
            'f-cache': { bom: false, texto: 'O incidente continuou, atribuído a &ldquo;instabilidade&rdquo;, sem causa.' },
            'f-tag': { bom: false, texto: 'Um novo apelido mutável: a mesma falha, com outro nome.' }
          },
          callout: 'Você achou a causa pelo digest e prescreveu a pinagem.' },
        { tipo: 'escreva', id: 'b1-escreva', titulo: 'Decida: aceite ou recuse cada escolha', obrigatorio: false,
          enunciado: 'Um Dockerfile parte de imagem completa, roda como root e embute credencial para &ldquo;agilizar o build&rdquo;. Aceite ou recuse cada escolha com o mecanismo e prescreva a alternativa.',
          placeholder: 'Para cada escolha: aceito ou recuso, por quê (mecanismo) e o que fazer no lugar.',
          rubrica: [
            'Recusa a imagem completa: superfície maior e pull lento; prescreve base enxuta e build em estágios.',
            'Recusa o root: dano alcançável, kernel compartilhado com o host; prescreve usuário non-root.',
            'Declara que camada com segredo é vazamento permanente, mesmo removido depois; prescreve segredo fora do build, montado na execução.'],
          modelo: '<p>Recuso as três. <strong>Imagem completa:</strong> traz toolchain e superfície que não uso e alonga o pull; uso variante slim com build em estágios. <strong>Root:</strong> qualquer escape ganha controle amplo, porque o container compartilha o kernel; declaro um <code>USER</code> sem privilégio. <strong>Credencial no build:</strong> camada com segredo é vazamento permanente, mesmo apagado na instrução seguinte; o segredo chega na execução por referência.</p><p><strong>Reprova:</strong> aprovar qualquer das três, ou dizer que remover o arquivo depois resolve.</p>' },
        { tipo: 'escolha', id: 'b1-escolha-promo', titulo: 'Confira: o que a promoção referencia',
          pergunta: 'Para promover uma imagem de homologação a produção com segurança, o que a promoção deve referenciar?',
          opcoes: [
            opc('a', 'A tag app:stable', false, 'pode ser reapontada entre a validação e o deploy.'),
            opc('b', 'A tag com a data do build', false, 'continua mutável.'),
            opc('c', 'O digest da imagem validada', true, 'o digest é a identidade do conteúdo; a tag fica como rótulo para humanos.'),
            opc('d', 'O nome do repositório', false, 'nomeia o lugar, não o conteúdo.')] },
        { tipo: 'escolha', id: 'b1-escolha-grace', titulo: 'Confira: o grace que escorre',
          pergunta: 'O grace period passa inteiro, nada termina e o SIGKILL encerra o processo. Qual é a causa provável e o conserto?',
          opcoes: [
            opc('a', 'O trabalho ignora cancelamento; torná-lo cancelável e medir contra o deadline interno.', true, 'handler que ignora cancelamento desperdiça o grace inteiro aguardando o incancelável.'),
            opc('b', 'O grace é curto demais; dobrar o valor resolve em qualquer caso.', false, 'prazo maior só adia o SIGKILL se o trabalho não cancela.'),
            opc('c', 'Trocar SIGTERM por SIGKILL logo no começo.', false, 'SIGKILL não deixa sair com exit code contratado.')] },
        { tipo: 'callout', tom: 'info', titulo: 'Fontes e validade', html:
          '<p>NIST SP 800-145 (cloud, consulta em 14/08/2026, risco baixo); OCI Image Specification 1.1.1, Runtime 1.3.0 e Distribution 1.1 (risco médio, revalidar em até 90 dias); CNCF Cloud Native Definition e FinOps Framework (risco médio, o FinOps é guia de praticante: sustenta a decisão, não define conceito). Grace, ordem da drenagem e PID 1 são comportamento de runtime medido nas folhas locais e na trilha externa. Timelines e tamanhos aqui são exemplo variável, não evidência.</p>' },
        { tipo: 'takeaway', html: 'Peça <mark>digest</mark> para identidade, <mark>validação estática</mark> para a imagem e <mark>drenagem</mark> antes de tudo no SIGTERM.' }
      ] }
    ]
  });
})();
