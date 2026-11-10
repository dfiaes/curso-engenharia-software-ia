/* F01 · Bloco 1: o sistema operacional visto do terminal. Fonte: F01.html#b01. Saídas de terminal: execução real de 11/10/2026 com Git 2.34.1 (fonte); PIDs e caminhos variam a cada execução. */
(function () {
  var L = function (kind, text) { return { kind: kind, text: text }; };
  function opc(id, texto, correta, porque) { return { id: id, texto: texto, correta: correta, porque: porque }; }
  function py(linhas) { return linhas.join('\n') + '\n'; }

  var CMD = 'false | true; echo "sem pipefail=$?"; set -o pipefail; false | true; echo "com pipefail=$?"';

  var etapasPipe = function () {
    return [
      { id: 'sem', nome: 'Sem pipefail', descricao: 'O status é o do último comando', tom: 'dns', ms: 1, linhas: [
        L('info', 'false | true: os dois processos rodam ao mesmo tempo, ligados por um pipe'),
        L('out', 'sem pipefail=0'),
        L('hint', 'false saiu com 1, true saiu com 0; o shell devolveu só o último')] },
      { id: 'com', nome: 'Com pipefail', descricao: 'O status é o do último que falhou', tom: 'tcp', ms: 1, linhas: [
        L('cmd', 'set -o pipefail'),
        L('out', 'com pipefail=1'),
        L('hint', 'agora a falha de qualquer estágio contamina o status do pipeline')] },
      { id: 'efeito', nome: 'O efeito no CI', descricao: './build.sh | tee build.log', tom: 'ink', ms: 1, linhas: [
        L('info', 'build.sh falha com 1; tee grava o log e sai com 0'),
        L('in', 'sem pipefail o pipeline "passou" com o build quebrado'),
        L('hint', 'com pipefail o custo é que o 141 de um produtor encerrado por head também conta como falha')] }
    ];
  };

  var codigoStatus = py([
    'def status_pipeline(codigos, pipefail=False):',
    '    """codigos: exit code de cada estágio do pipeline, da esquerda para a direita."""',
    '    if not pipefail:',
    '        return codigos[-1]',
    '    # com pipefail: o status é o do estágio MAIS À DIREITA que falhou (ou 0)',
    '    return 0',
    '',
    '',
    'def descrever_status(code):',
    '    """0 ok; 126 não executável; 127 não encontrado; 128+n sinal n; o resto, falha."""',
    '    if code == 0:',
    '        return "ok"',
    '    return "falha"',
    '',
    '',
    'print(status_pipeline([1, 0]), status_pipeline([1, 0], pipefail=True))',
    'print(descrever_status(130))'
  ]);
  var testesStatus = py([
    'def test_sem_pipefail_vale_o_ultimo():',
    '    assert status_pipeline([1, 0]) == 0',
    '    assert status_pipeline([3]) == 3',
    '',
    'def test_pipefail_pega_a_falha():',
    '    assert status_pipeline([1, 0], pipefail=True) == 1',
    '    assert status_pipeline([141, 0], pipefail=True) == 141',
    '',
    'def test_pipefail_devolve_o_mais_a_direita():',
    '    assert status_pipeline([0, 2, 1, 0], pipefail=True) == 1',
    '',
    'def test_controle_negativo_tudo_ok():',
    '    assert status_pipeline([0, 0], pipefail=True) == 0',
    '',
    'def test_descrever_codigos_do_shell():',
    '    assert descrever_status(0) == "ok"',
    '    assert descrever_status(127) == "nao_encontrado"',
    '    assert descrever_status(126) == "nao_executavel"',
    '',
    'def test_descrever_sinais():',
    '    assert descrever_status(130) == "sinal:2"',
    '    assert descrever_status(137) == "sinal:9"',
    '    assert descrever_status(141) == "sinal:13"',
    '    assert descrever_status(143) == "sinal:15"',
    '',
    'def test_borda_128_e_falha_comum():',
    '    assert descrever_status(128) == "falha"',
    '    assert descrever_status(2) == "falha"'
  ]);
  var solucaoStatus = py([
    'def status_pipeline(codigos, pipefail=False):',
    '    if not pipefail:',
    '        return codigos[-1]',
    '    for code in reversed(codigos):',
    '        if code != 0:',
    '            return code',
    '    return 0',
    '',
    '',
    'def descrever_status(code):',
    '    if code == 0:',
    '        return "ok"',
    '    if code == 126:',
    '        return "nao_executavel"',
    '    if code == 127:',
    '        return "nao_encontrado"',
    '    if code > 128:',
    '        return "sinal:" + str(code - 128)',
    '    return "falha"'
  ]);

  TrilhaAula.registrar({
    id: 'f01-b1',
    titulo: 'O sistema operacional visto do terminal',
    minutos: 30,
    resumo: 'Tudo o que o terminal faz é combinação de cinco peças: processo, descritores de arquivo, exit code, sinais e ambiente.',
    objetivo: 'Prever o que um pipeline faz com exit codes, descritores e sinais; dizer o que um processo filho herda; explicar como um comando é achado no PATH.',
    revisao: [
      { id: 'f01b1-pipeline', pergunta: 'Sem <code>set -o pipefail</code>, o que <code>false | true; echo $?</code> imprime?',
        opcoes: [
          opc('a', '0', true, 'o status padrão do pipeline é o do último comando; os dois rodam em paralelo e só o último conta.'),
          opc('b', '1', false, 'isso só acontece com <code>pipefail</code>, que propaga a falha de qualquer estágio.'),
          opc('c', '141', false, 'o 141 (128+13, SIGPIPE) aparece quando o produtor escreve num pipe cujo leitor já saiu.')] },
      { id: 'f01b1-export', pergunta: 'Um script faz <code>export FOO=1</code> e termina. De volta ao terminal que o executou com <code>./script.sh</code>, o que <code>echo $FOO</code> mostra?',
        opcoes: [
          opc('a', 'Nada: o ambiente é uma cópia entregue ao filho, nunca de volta', true, 'o filho recebe uma cópia no execve; o que ele muda morre com ele. Com <code>source script.sh</code> o efeito aparece, porque roda no shell atual.'),
          opc('b', '1, porque export publica a variável no sistema todo', false, 'export só marca a variável para ser herdada por filhos futuros daquele processo.'),
          opc('c', 'Um erro, porque a variável foi destruída', false, 'variável não definida expande para vazio, sem erro.')] },
      { id: 'f01b1-exit', pergunta: 'Um log mostra "exit 137". O que isso quase sempre significa?',
        opcoes: [
          opc('a', 'O processo foi morto por SIGKILL (128 + 9); em container, costuma ser falta de memória', true, 'o código 128+n é do shell: o processo nem escolheu o status, o kernel o encerrou por sinal.'),
          opc('b', 'O programa escolheu sair com o valor 137', false, 'valores acima de 128 são reservados pelo shell para sinais; programas devem evitá-los.'),
          opc('c', 'Comando não encontrado', false, 'comando não encontrado é 127.')] },
      { id: 'f01b1-path', pergunta: 'Dois diretórios do PATH têm um executável <code>ls</code>. Qual roda, e como ver todos os candidatos?',
        opcoes: [
          opc('a', 'O do primeiro diretório, da esquerda para a direita; <code>type -a ls</code> lista todos', true, 'ativar um venv só põe <code>.venv/bin</code> na frente do PATH. <code>command -v</code> mostra o escolhido.'),
          opc('b', 'O do último diretório, que é o mais específico', false, 'a busca para no primeiro executável que casa.'),
          opc('c', 'O do diretório corrente, se houver um', false, 'o diretório corrente não está no PATH de propósito, para que um <code>ls</code> malicioso numa pasta não rode.')] },
      { id: 'f01b1-cd', pergunta: 'Por que <code>cd</code> é um builtin do shell e não um programa externo?',
        opcoes: [
          opc('a', 'O diretório corrente é atributo do processo; um filho não altera o do pai', true, 'um <code>cd</code> externo mudaria o diretório de um processo que morre em seguida.'),
          opc('b', 'Por desempenho apenas', false, 'a razão é semântica, não de velocidade.'),
          opc('c', 'Porque o kernel proíbe programas de mudar diretório', false, 'cada processo pode mudar o próprio cwd; o que ele não faz é mudar o do pai.')] }
    ],
    abas: [
      { rotulo: 'Entender', blocos: [
        { tipo: 'texto', html:
          '<h3>Três falhas, um defeito de modelo mental</h3>' +
          '<p>Um pipeline de CI mostra verde, mas o deploy não aconteceu: <code>build.sh | tee build.log</code> devolve o exit code do <code>tee</code>, não o do build. Um script funciona no terminal e falha no cron porque o PATH é outro. O agente de código roda o seu teste, lê "0" e declara sucesso, sem olhar o stderr. Nos três, o defeito está no modelo mental, não no comando.</p>' +
          '<p>O modelo cabe em cinco peças: <strong>processo</strong>, <strong>descritores de arquivo</strong>, <strong>exit code</strong>, <strong>sinais</strong> e <strong>ambiente</strong>. Tudo que o terminal faz é combinação delas.</p>' },
        { tipo: 'texto', html:
          '<h3>Terminal, shell e processo são três coisas</h3>' +
          '<p>O <strong>terminal</strong> (emulador) é a janela: recebe teclas e desenha caracteres. Por baixo, o kernel expõe um <strong>tty</strong> (na prática, um pseudo-terminal) que a liga aos programas. O <strong>shell</strong> (bash, zsh, sh, PowerShell) é um programa comum que roda nesse tty, lê linhas e as interpreta: expande variáveis, aplica redirecionamentos, procura executáveis e dispara processos. Fechar o terminal envia SIGHUP ao shell.</p>' +
          '<p>Um <strong>processo</strong> é um programa em execução com identidade própria: um <strong>PID</strong> (número único), um <strong>PPID</strong> (o pai), um espaço de memória, um diretório corrente (<strong>cwd</strong>), um ambiente, uma tabela de descritores abertos e um estado de saída. Todo processo, exceto o primeiro, nasce de outro: o resultado é uma árvore de processos.</p>' },
        { tipo: 'codigo', linguagem: 'bash', texto:
          '$ echo "este shell: $$   pai: $PPID"\neste shell: 14   pai: 13\n\n' +
          '$ sleep 30 & echo "filho em background: $!"; ps -o pid,ppid,stat,comm -p $$,$!; kill $!\nfilho em background: 17\n    PID    PPID STAT COMMAND\n     16      15 S    bash\n     17      16 S    sleep' },
        { tipo: 'texto', html: '<p>O PPID do <code>sleep</code> é o PID do <code>bash</code>: a relação pai-filho é o que importa; os números mudam a cada execução.</p>' },
        { tipo: 'callout', tom: 'info', titulo: 'Fundamento · fork e exec', html:
          '<p>Unix cria processos em dois passos. <code>fork()</code> duplica o processo atual (o filho começa como cópia do pai, com a mesma tabela de descritores). Depois o filho chama <code>execve()</code>, que substitui a imagem do programa pelo executável pedido, mantendo o PID, os descritores abertos e o ambiente que o pai montou. A separação torna o redirecionamento barato: entre o <code>fork</code> e o <code>exec</code> o shell reorganiza os descritores do filho, e o programa executado nem sabe que sua saída vai para um arquivo.</p>' +
          '<p>Daí um fato que confunde veteranos: <code>cd</code> é <strong>builtin</strong> (executado dentro do próprio shell). O cwd é atributo do processo, e um filho não altera o do pai. Se <code>cd</code> fosse externo, mudaria o diretório de um processo que morre em seguida.</p>' +
          '<pre style="margin:0"><code>$ cd /tmp; (cd /; pwd); pwd\n/\n/tmp</code></pre>' },
        { tipo: 'texto', html:
          '<h3>Três descritores e a filosofia do fluxo</h3>' +
          '<p>Para um processo, um arquivo aberto é um inteiro pequeno, o <strong>descritor de arquivo</strong> (fd), índice numa tabela mantida pelo kernel. Por convenção todo processo nasce com três: <strong>stdin</strong> (0), de onde lê a entrada; <strong>stdout</strong> (1), para onde escreve o resultado; <strong>stderr</strong> (2), para onde escreve diagnósticos. Os três apontam, por padrão, para o terminal. O ponto de separar 1 de 2 é que o resultado pode ser canalizado para o próximo programa enquanto os avisos continuam visíveis para a pessoa.</p>' },
        { tipo: 'codigo', linguagem: 'bash', texto:
          '$ ls -l /proc/self/fd > saida.txt 2> erro.txt < /dev/null; awk "NR>1{print \\$9, \\$10, \\$11}" saida.txt\n0 -> /dev/null\n1 -> /tmp/demo-b1/saida.txt\n2 -> /tmp/demo-b1/erro.txt\n3 -> /proc/21/fd' },
        { tipo: 'texto', html:
          '<p>Com <code>&lt; /dev/null</code>, <code>&gt; saida.txt</code> e <code>2&gt; erro.txt</code> o shell religou os fds 0, 1 e 2 antes do <code>exec</code>. O fd 3 é o diretório que o próprio <code>ls</code> abriu para listar.</p>' +
          '<p>Considere <code>cat dados.txt | grep alvo | tr a-z A-Z &gt; saida.txt</code>: três processos filhos do shell (PIDs distintos), ligados por dois pipes (o stdout de um é o stdin do seguinte). Só o último tem o fd 1 redirecionado para arquivo; o stderr de cada um segue para o terminal.</p>' },
        { tipo: 'takeaway', html: 'Terminal exibe, shell interpreta, <mark>processo executa</mark>; redirecionar é <mark>religar descritores</mark> antes do exec.' }
      ] },

      { rotulo: 'Ver funcionando', blocos: [
        { tipo: 'texto', html:
          '<h3>Exit code: a resposta de um processo</h3>' +
          '<p>Quando um processo termina, deixa um inteiro de 0 a 255, o <strong>exit code</strong> (ou status). O pai o recolhe (<code>wait</code>) e o shell o expõe em <code>$?</code>. A convenção é universal: 0 é sucesso; qualquer outro valor, falha ou resultado especial. O shell reserva alguns:</p>' },
        { tipo: 'texto', largo: true, html:
          '<table><thead><tr><th>Código</th><th>Significado</th><th>Origem</th></tr></thead><tbody>' +
          '<tr><td>0</td><td>sucesso</td><td>convenção</td></tr>' +
          '<tr><td>1</td><td>falha genérica (ou "não achei", em <code>grep</code>/<code>diff</code>)</td><td>cada programa decide</td></tr>' +
          '<tr><td>2</td><td>uso incorreto / erro de verdade (<code>grep</code>, <code>ls</code>, <code>argparse</code>)</td><td>convenção forte</td></tr>' +
          '<tr><td>126</td><td>achou o arquivo, mas não é executável</td><td>shell</td></tr>' +
          '<tr><td>127</td><td>comando não encontrado</td><td>shell</td></tr>' +
          '<tr><td>128 + n</td><td>morto pelo sinal n (130 = SIGINT, 141 = SIGPIPE, 143 = SIGTERM, 137 = SIGKILL)</td><td>shell</td></tr>' +
          '</tbody></table>' },
        { tipo: 'codigo', linguagem: 'bash', texto:
          '$ true; echo "true=$?"; false; echo "false=$?"\ntrue=0\nfalse=1\n$ ls /nao/existe; echo "ls=$?"\nls: cannot access \'/nao/existe\': No such file or directory\nls=2\n$ comando-que-nao-existe; echo "inexistente=$?"\nbash: line 1: comando-que-nao-existe: command not found\ninexistente=127\n$ echo "echo hi" > naoexec.sh; ./naoexec.sh; echo "sem-x=$?"\nbash: line 1: ./naoexec.sh: Permission denied\nsem-x=126\n$ sh -c "kill -INT \\$\\$"; echo "SIGINT=$?"\nSIGINT=130\n$ sh -c "kill -TERM \\$\\$"; echo "SIGTERM=$?"\nTerminated\nSIGTERM=143' },
        { tipo: 'texto', html:
          '<p>Há duas camadas. O exit code do programa é escolha de quem o escreveu (<code>exit 7</code>). O código 128+n é do shell: o processo nem chegou a escolher, o kernel o encerrou por sinal. A distinção importa ao ler logs: "exit 137" quase sempre é SIGKILL, e em container isso costuma significar que o kernel matou o processo por falta de memória.</p>' +
          '<p>Agora a previsão. Dois processos rodam ligados por um pipe: o primeiro falha, o segundo termina bem.</p>' },
        { tipo: 'rode', id: 'b1-rode-pipe', titulo: 'O pipeline que mente', enunciado: 'Rode a mesma linha duas vezes no mesmo shell: antes e depois de ligar <code>pipefail</code>.',
          prefixo: '$', entrada: CMD, unidade: 'passo', terminalTitulo: 'bash', etapas: etapasPipe(),
          prever: { pergunta: 'Sem <code>pipefail</code>, o que <code>false | true; echo $?</code> mostra?', opcoes: [
            { id: 'a', texto: '1: qualquer falha no pipeline se propaga.', correta: false, porque: 'isso só vale com <code>pipefail</code>; por padrão a falha de um estágio do meio some.' },
            { id: 'b', texto: '0: o status do pipeline é o do último comando.', correta: true, porque: 'os dois rodam em paralelo e só o último conta.' },
            { id: 'c', texto: '141: o <code>true</code> fecha o pipe antes da hora.', correta: false, porque: '141 é SIGPIPE: aparece quando o produtor escreve num pipe cujo leitor já saiu, não aqui.' }
          ] },
          tutorAntes: 'Aperte Enter com a linha já preenchida e clique em cada etapa para ler só as linhas dela.',
          tutorDepois: 'Sem <code>pipefail</code> o pipeline devolve 0 com o primeiro estágio quebrado; com ele devolve 1. Em script de CI, a combinação segura é <code>set -euo pipefail</code> mais teste explícito do que você espera que falhe.',
          callout: 'Você viu o status do pipeline mudar de 0 para 1 só por ligar o pipefail.' },
        { tipo: 'callout', tom: 'danger', titulo: 'Armadilha que pega sênior: o status do pipeline é o do último comando', html:
          '<p>Em <code>cmd_que_falha | tee log</code>, o shell devolve o exit code do <code>tee</code> (0): o build falhou e o pipeline "passou". Com <code>set -o pipefail</code> (bash, zsh, e POSIX desde a edição de 2024), o status é o do último comando que falhou. Mas o <code>pipefail</code> tem custo: o 141 de um produtor encerrado por <code>head</code> agora conta como falha.</p>' +
          '<p>Há um segundo buraco no mesmo terreno: <code>local x=$(cmd)</code> devolve o status do <code>local</code> (0), mascarando a falha do <code>cmd</code>; declare e atribua em linhas separadas. Lembre também que <code>$?</code> guarda só o último status: salve com <code>rc=$?</code> se precisar dele duas vezes.</p>' },
        { tipo: 'takeaway', html: 'Zero é sucesso, <mark>128+n</mark> é sinal, e o status de um pipeline é o do <mark>último comando</mark>, salvo <code>pipefail</code>.' }
      ] },

      { rotulo: 'Sinais, ambiente e PATH', blocos: [
        { tipo: 'texto', html:
          '<h3>Sinais</h3>' +
          '<p>Um <strong>sinal</strong> é uma notificação assíncrona que o kernel entrega a um processo. Ele interrompe o fluxo normal e dispara um handler; se o processo não instalou um, vale a ação padrão (quase sempre terminar).</p>' +
          '<ul>' +
          '<li><strong>SIGINT (2):</strong> Ctrl-C. O driver do tty, ao receber o byte 0x03, envia o sinal ao <em>grupo de processos</em> em primeiro plano, não só ao programa à frente; por isso Ctrl-C interrompe um pipeline inteiro.</li>' +
          '<li><strong>SIGTERM (15):</strong> pedido educado de encerramento (<code>kill PID</code>). O processo pode capturá-lo e fazer limpeza.</li>' +
          '<li><strong>SIGKILL (9):</strong> encerramento imposto pelo kernel. Não pode ser capturado nem ignorado; nenhuma limpeza roda.</li>' +
          '<li><strong>SIGPIPE (13):</strong> escrita em pipe cujo leitor já fechou. A ação padrão mata o escritor; é o que encerra <code>yes | head -1</code>.</li></ul>' +
          '<p>Shutdown gracioso, grace period e o papel do PID 1 em container ficam no LT01, bloco 1. Aqui basta fixar que um programa bem-comportado trata SIGINT e SIGPIPE de propósito, e é isso que o laboratório faz. O trecho central do <code>pgrep.py</code> (um <code>grep</code> mínimo em Python):</p>' },
        { tipo: 'codigo', linguagem: 'python', texto:
          'def main(argv: list[str] | None = None) -> int:\n    args = _build_parser().parse_args(argv)\n    try:\n        return _run(args)\n    except KeyboardInterrupt:          # Python traduz SIGINT em exceção\n        return EXIT_SIGINT             # 130 = 128 + 2\n    except BrokenPipeError:            # leitor do pipe fechou (SIGPIPE ignorado pelo Python)\n        os.dup2(os.open(os.devnull, os.O_WRONLY), sys.stdout.fileno())\n        return EXIT_SIGPIPE            # 141 = 128 + 13' },
        { tipo: 'texto', html: '<p>O Python ignora SIGPIPE por padrão e levanta <code>BrokenPipeError</code> na escrita. O <code>dup2</code> para <code>/dev/null</code> evita um segundo erro quando o interpretador tenta descarregar o stdout ao sair. O teste do laboratório prova o contrato: fecha o lado de leitura do pipe e exige 141.</p>' },
        { tipo: 'texto', html:
          '<h3>Ambiente: o que o filho herda</h3>' +
          '<p>O <strong>ambiente</strong> é uma lista de pares <code>NOME=valor</code> que o processo recebe no <code>execve</code>. Ele é <em>copiado</em> para o filho; depois disso pai e filho divergem sem se afetar. O shell mantém dois conjuntos: variáveis de shell (internas) e variáveis <strong>exportadas</strong> (as que entram na cópia).</p>' },
        { tipo: 'codigo', linguagem: 'bash', texto:
          '$ export SEGREDO=abc; bash -c "echo filho vê: \\$SEGREDO"; unset SEGREDO; bash -c "echo filho vê: [\\$SEGREDO]"\nfilho vê: abc\nfilho vê: []\n$ X=1; bash -c "echo sem export: [\\$X]"; export X; bash -c "echo com export: [\\$X]"\nsem export: []\ncom export: [1]' },
        { tipo: 'texto', html:
          '<p>Duas consequências. Nenhum programa altera o ambiente de quem o chamou, e por isso <code>source venv/bin/activate</code> precisa ser <em>sourced</em> (executado no shell atual). E o ambiente não é cofre: todo filho herda tudo que foi exportado.</p>' },
        { tipo: 'callout', tom: 'danger', titulo: 'Armadilha que pega sênior: variável de ambiente não é segredo', html:
          '<p>Exportar <code>API_KEY</code> a entrega a todo filho e a qualquer processo do mesmo usuário via <code>/proc/&lt;pid&gt;/environ</code>. Passe o valor só ao comando que precisa (<code>API_KEY=... comando</code>) ou leia de arquivo com permissão restrita. Mais no LT01, bloco 2.</p>' },
        { tipo: 'texto', html:
          '<h3>PATH: como um comando é encontrado</h3>' +
          '<p>Quando você digita <code>python3</code>, o shell segue uma ordem. Monte-a você mesmo.</p>' },
        { tipo: 'ordene', id: 'b1-ordene-path', titulo: 'Ordene a resolução de um comando',
          enunciado: 'Ponha na ordem em que o shell procura o que executar quando você digita um nome.',
          itens: [
            { id: 'path', texto: 'Percorrer os diretórios de <code>PATH</code>, da esquerda para a direita, e executar o primeiro arquivo executável com esse nome' },
            { id: 'alias', texto: 'Apelido (<code>alias</code>)' },
            { id: 'barra', texto: 'Se o nome contém barra (<code>./run.sh</code>, <code>/usr/bin/ls</code>), usar o caminho direto, sem procurar' },
            { id: 'builtin', texto: 'Builtin do shell' },
            { id: 'funcao', texto: 'Função do shell' }
          ], solucao: ['alias', 'funcao', 'builtin', 'barra', 'path'],
          dica: 'Do mais interno ao shell para o mais externo: primeiro o que o próprio shell define, depois o sistema de arquivos.',
          tutorDepois: 'O resultado fica em cache (<code>hash</code>). Para diagnosticar "qual binário é esse?", use <code>type -a nome</code> (todos os candidatos, em ordem) e <code>command -v nome</code> (o escolhido). Evite <code>which</code> em scripts: não é padronizado e não enxerga builtins nem aliases.',
          callout: 'Ordem fixada: alias, função, builtin, caminho direto e só então o PATH.' },
        { tipo: 'codigo', linguagem: 'bash', texto:
          '$ type -a python3 | head -3; command -v ls; type cd\npython3 is /usr/bin/python3\npython3 is /bin/python3\n/usr/bin/ls\ncd is a shell builtin\n\n$ mkdir bin; printf "#!/bin/sh\\necho meu ls\\n" > bin/ls; chmod +x bin/ls; PATH="$PWD/bin:$PATH" ls; PATH="$PWD/bin:$PATH" command -v ls; ls | head -2\nmeu ls\n/tmp/demo-b1/bin/ls\nbin\nerro.txt' },
        { tipo: 'texto', html:
          '<p>O primeiro PATH que contém um <code>ls</code> vence. É assim que um ambiente virtual Python funciona: ativar apenas põe <code>.venv/bin</code> na frente do PATH, e <code>python</code> passa a resolver para o interpretador do projeto. O diretório corrente não está no PATH de propósito: se estivesse, entrar numa pasta com um <code>ls</code> malicioso o executaria.</p>' },
        { tipo: 'abas', rotulo: 'Seu shell', itens: [
          { rotulo: 'macOS / Linux (bash, zsh)', blocos: [{ tipo: 'texto', html: '<p>Os comandos canônicos do módulo: <code>$?</code> para o exit code, <code>$PATH</code> com separador <code>:</code>, <code>type -a</code> e <code>command -v</code> para resolver comandos.</p>' }] },
          { rotulo: 'Windows (PowerShell)', blocos: [{ tipo: 'texto', html: '<p>O modelo é o mesmo. Exit code do último programa externo: <code>$LASTEXITCODE</code>. Ambiente: <code>$env:PATH</code> (separador <code>;</code>). Resolução de comando: <code>Get-Command python</code>. O pipe passa objetos, não bytes. Os comandos canônicos do módulo são de macOS/Linux; no Windows, o caminho mais simples é o WSL2.</p>' }] }
        ] },
        { tipo: 'takeaway', html: 'O ambiente é uma <mark>cópia entregue ao filho</mark>, nunca de volta; o comando é achado pelo <mark>PATH</mark>, da esquerda para a direita.' }
      ] },

      { rotulo: 'Praticar e conferir', blocos: [
        { tipo: 'texto', html:
          '<h3>Transforme o modelo em código</h3>' +
          '<p>Duas funções pequenas fixam a tabela de exit codes e a regra do pipeline. Os códigos são os da tabela da aba anterior.</p>' },
        { tipo: 'python', id: 'b1-python-status', titulo: 'Status de pipeline e exit codes', obrigatorio: false,
          enunciado: 'Complete <code>status_pipeline(codigos, pipefail)</code> (sem <code>pipefail</code>, o último; com ele, o do estágio mais à direita que falhou, ou 0) e <code>descrever_status(code)</code>: <code>"ok"</code>, <code>"nao_executavel"</code> (126), <code>"nao_encontrado"</code> (127), <code>"sinal:N"</code> para 128+N e <code>"falha"</code> nos demais.',
          codigo: codigoStatus, testes: testesStatus,
          dica: 'Percorra <code>reversed(codigos)</code> e devolva o primeiro valor diferente de zero. Para sinais, o teste é <code>code &gt; 128</code> (o 128 sozinho não é sinal nenhum) e o número é <code>code - 128</code>.',
          solucao: solucaoStatus,
          tutorDepois: 'Repare no controle negativo: com tudo 0, o <code>pipefail</code> não inventa falha. E o 128 puro cai em "falha": 128+n só vale para n a partir de 1.',
          callout: 'A regra do pipeline e a tabela de exit codes agora estão em código.' },
        { tipo: 'transcript', id: 'b1-transcript-python', titulo: 'Qual Python é esse?', obrigatorio: false, terminalTitulo: 'sessão de diagnóstico',
          enunciado: 'O <code>pip install</code> funciona e o <code>import</code> falha. O agente diagnostica, mas uma das afirmações dele não é sustentada pela saída da ferramenta. Clique na linha e aperte Conferir.',
          linhas: [
            { quem: 'voce', texto: 'O pip install requests passou, mas import requests falha. Diagnostique.' },
            { quem: 'agente', texto: 'Vou ver quem o PATH escolheu para cada nome.' },
            { quem: 'ferramenta', texto: '$ command -v python python3 pip\n/home/ada/proj/.venv/bin/python\n/usr/bin/python3\n/usr/bin/pip' },
            { quem: 'agente', texto: 'O python é o do .venv e o pip é o de /usr/bin: são dois ambientes. Vou instalar com python -m pip, que garante o par certo.' },
            { quem: 'ferramenta', texto: '$ echo "$VIRTUAL_ENV"\n/home/ada/proj/.venv' },
            { quem: 'agente', texto: 'Como VIRTUAL_ENV está vazio, não há venv ativo neste shell, e o pip de /usr/bin é o único ambiente envolvido.' }
          ],
          erradas: [5],
          explicacao: { 5: 'a saída mostra <code>VIRTUAL_ENV=/home/ada/proj/.venv</code>, não vazio: há um venv ativo, e o <code>pip</code> de <code>/usr/bin</code> é que está fora dele. A conclusão contradiz o que a ferramenta devolveu. O diagnóstico anterior (dois ambientes) está certo, e o conserto é <code>python -m pip</code>.' },
          tutorDepois: 'Confira a afirmação contra a saída, não contra o que soa plausível. Vazio em <code>$VIRTUAL_ENV</code> significaria nenhum venv ativo; aqui não está vazio.',
          callout: 'Você pegou a conclusão que contradizia a saída da ferramenta.' },
        { tipo: 'escolha', id: 'b1-escolha-export', titulo: 'Confira: o ambiente do script',
          pergunta: 'O script <code>./setup.sh</code> contém <code>export FOO=1</code>. Você o executa e, no mesmo terminal, roda <code>echo "[$FOO]"</code>. Como fazer a variável aparecer?',
          opcoes: [
            { id: 'a', texto: 'Executar com <code>source setup.sh</code> (ou <code>. setup.sh</code>), que roda no shell atual.', correta: true, porque: 'o processo filho só altera a própria cópia do ambiente; <code>source</code> executa dentro do shell, sem filho.' },
            { id: 'b', texto: 'Trocar para <code>export -g FOO=1</code> dentro do script.', correta: false, porque: 'não existe esse efeito: nenhum filho altera o ambiente do pai.' },
            { id: 'c', texto: 'Rodar o script com <code>sudo</code>.', correta: false, porque: 'o sudo cria outro processo; o problema é a direção da herança, não a permissão.' }
          ], tutorDepois: 'É também por isso que <code>source venv/bin/activate</code> precisa ser sourced.' },
        { tipo: 'escolha', id: 'b1-escolha-exit', titulo: 'Confira: o código de saída das suas ferramentas',
          pergunta: 'Você escreve um utilitário que procura um padrão. Quais exit codes ele deve usar para "achei", "não achei" e "uso incorreto"?',
          opcoes: [
            { id: 'a', texto: '0 achou, 1 não achou (condição negativa esperada), 2 uso incorreto ou erro real.', correta: true, porque: 'é a convenção de <code>grep</code>; evite 126, 127 e valores acima de 128, que o shell já usa.' },
            { id: 'b', texto: '0 achou, 127 não achou, 1 uso incorreto.', correta: false, porque: '127 é "comando não encontrado" para o shell: confundiria quem lê o log.' },
            { id: 'c', texto: '0 sempre, e a diferença vai no stdout.', correta: false, porque: 'o exit code é a interface pela qual um agente de código ou um pipeline decide se o comando funcionou.' }
          ], tutorDepois: 'Dados no stdout, diagnóstico no stderr, resultado no exit code: é o contrato que torna o programa composível.' },
        { tipo: 'callout', tom: 'info', titulo: 'Decisões e limites', html:
          '<ul><li><strong>sh ou bash?</strong> <code>#!/bin/sh</code> promete só POSIX; <code>#!/usr/bin/env bash</code> libera arrays e <code>pipefail</code>. Passou de umas 30 linhas ou ganhou estruturas de dados: reescreva em Python.</li>' +
          '<li><code>command not found</code> (127) quase nunca é "não instalado": é "não está no PATH <em>deste</em> shell". Cron, systemd, IDE e container têm PATH próprio.</li>' +
          '<li>Com <code>uv run</code>, adotado no curso, o ambiente do projeto é resolvido sem ativação.</li></ul>' },
        { tipo: 'takeaway', html: 'Diagnostique com <mark>command -v</mark> e <mark>type -a</mark>, leia o <mark>exit code</mark> antes do texto e nunca confie em "passou" sem olhar o status.' }
      ] }
    ]
  });
})();
