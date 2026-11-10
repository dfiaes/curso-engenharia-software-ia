/* LT01 · Bloco 2: filesystem, permissões, ambiente, limites e secrets. Fonte: LT01.html#b02. Contagens de FD do rastreador são determinísticas pelo contrato; o restante é exemplo variável. */
(function () {
  var L = function (kind, text) { return { kind: kind, text: text }; };
  function opc(id, texto, correta, porque) { return { id: id, texto: texto, correta: correta, porque: porque }; }

  var refFd = `"""Descritores e vazamento: abrir rastreado, fechar, voltar ao baseline.
Referencia executavel do Bloco 2. So STDLIB (os). Sem rede.
"""
from __future__ import annotations
import os

class RastreadorFD:
    """Conta descritores abertos por este modulo e ainda nao fechados."""
    def __init__(self) -> None:
        self._abertos: set[int] = set()

    def abrir(self, caminho: str) -> int:
        """Abre para leitura e registra o descritor."""
        fd = os.open(caminho, os.O_RDONLY)
        self._abertos.add(fd)
        return fd

    def fechar(self, fd: int) -> None:
        """Fecha e baixa do registro; fechar fora do registro e erro."""
        if fd not in self._abertos:
            raise ValueError("descritor fora do registro: feche por quem abriu")
        os.close(fd)
        self._abertos.discard(fd)

    def em_aberto(self) -> int:
        """Quantos descritores deste rastreador seguem sem fechar."""
        return len(self._abertos)

def listar_fd_visiveis() -> list[str]:
    """Nomes visiveis em /proc/self/fd; lista vazia onde nao ha proc."""
    try:
        entradas = os.listdir("/proc/self/fd")
    except OSError:
        return []
    return sorted(entradas)

def servir_sem_fechar(rastreador: RastreadorFD, caminho: str, vezes: int) -> int:
    """Lado da falha: abre N vezes sem fechar; publica o acumulado."""
    for _ in range(vezes):
        rastreador.abrir(caminho)
    return rastreador.em_aberto()

def servir_fechando(rastreador: RastreadorFD, caminho: str, vezes: int) -> int:
    """Lado da correcao: cada abertura e fechada; publica o restante."""
    for _ in range(vezes):
        fd = rastreador.abrir(caminho)
        rastreador.fechar(fd)
    return rastreador.em_aberto()`;

  var refCaminho = `"""Resolucao confinada: pedido nunca escapa da base.
Referencia executavel do Bloco 2. So STDLIB (pathlib). Nega antes de qualquer I/O.
"""
from __future__ import annotations
from pathlib import Path

class EscapeNegado(ValueError):
    """Pedido resolve para fora da base: negado antes de abrir."""

def resolver_confinado(base: str, pedido: str) -> str:
    """Resolve o pedido contra a base e publica o absoluto confinado.
    Symlinks do caminho sao resolvidos; se o resultado ficar fora
    da base, levanta EscapeNegado sem tocar no destino.
    """
    raiz = Path(base).resolve()
    destino = (raiz / pedido).resolve()
    if destino != raiz and not destino.is_relative_to(raiz):
        raise EscapeNegado(f"fora da base: {pedido!r}")
    return str(destino)

def ler_confinado(base: str, pedido: str) -> bytes:
    """Resolve, nega escape e so entao le os bytes."""
    caminho = resolver_confinado(base, pedido)
    with open(caminho, "rb") as arquivo:
        return arquivo.read()`;

  var refExec = `"""Execucao confinada: non-root, escrita permitida e segredo fora do codigo.
Referencia executavel do Bloco 2. So STDLIB (os, pathlib). Sem rede.
"""
from __future__ import annotations
import os
from pathlib import Path

class SegredoAusente(RuntimeError):
    """Variavel de ambiente obrigatoria ausente ou em branco."""

class EscritaNaoPermitida(PermissionError):
    """Destino fora do diretorio de dados declarado."""

def rodando_como_root() -> bool:
    """True somente com uid 0; fora de POSIX nao ha uid 0."""
    geteuid = getattr(os, "geteuid", None)
    if geteuid is None:
        return False
    return bool(geteuid() == 0)

def exige_non_root() -> None:
    """Recusa operar com privilegio total; o oraculo exige non-root."""
    if rodando_como_root():
        raise PermissionError("recusado: execute como usuario sem privilegio")

def carregar_segredo(nome: str) -> str:
    """Le segredo do ambiente; nunca do codigo, de argv ou de log."""
    valor = os.environ.get(nome, "").strip()
    if not valor:
        raise SegredoAusente(f"defina {nome} no ambiente")
    return valor

def destino_escrita_permitido(diretorio_dados: str, nome: str) -> str:
    """Publica o destino somente dentro do diretorio de dados."""
    raiz = Path(diretorio_dados).resolve()
    destino = (raiz / nome).resolve()
    if destino != raiz and not destino.is_relative_to(raiz):
        raise EscritaNaoPermitida(f"fora dos dados: {nome!r}")
    return str(destino)

def relatar_contexto(variavel_segredo: str) -> dict[str, str]:
    """Publica contexto sem jamais incluir o valor do segredo."""
    tem_segredo = "sim" if os.environ.get(variavel_segredo, "").strip() else "nao"
    return {"root": str(rodando_como_root()), "segredo_presente": tem_segredo}`;

  var CMDFD = 'python -c "from vazamento_fd import *; r = RastreadorFD(); print(servir_sem_fechar(r, \'/etc/hostname\', 3))"';
  var CMDFD2 = 'python -c "from vazamento_fd import *; r = RastreadorFD(); print(servir_fechando(r, \'/etc/hostname\', 3))"';
  var etapasFd = function () {
    return [
      { id: 'sem', nome: 'Sem fechar', descricao: 'Lado da falha: abre 3 vezes sem fechar', tom: 'dns', ms: 3, linhas: [
        L('cmd', CMDFD), L('out', '3'),
        L('hint', 'cada requisição deixou um descritor; sob carga a contagem só sobe, até o teto herdado')] },
      { id: 'com', nome: 'Fechando', descricao: 'Lado da correção: cada abertura é fechada', tom: 'response', ms: 1, linhas: [
        L('cmd', CMDFD2), L('out', '0'),
        L('hint', 'baseline restaurado: a contagem volta a zero')] },
      { id: 'sinal', nome: 'O que se vê de fora', descricao: 'Vazamento contra pico legítimo', tom: 'request', ms: 1, linhas: [
        L('info', 'erros de abertura sob carga sustentada, mas não no teste curto'),
        L('info', '/proc/<pid>/fd sobe em escada a cada onda e não desce no vale'),
        L('hint', 'pico legítimo volta ao baseline quando a carga cessa; vazamento fixa patamar novo (formato ilustrativo)')] }
    ];
  };

  var codigoConf = [
    'class EscapeNegado(ValueError):',
    '    pass',
    '',
    '',
    'def resolver(caminho, symlinks, limite=8):',
    '    """Resolve \'.\', \'..\' e symlinks (dict caminho -> alvo). Já pronta."""',
    '    pendentes = [p for p in caminho.split("/") if p][::-1]',
    '    atual, passos = [], 0',
    '    while pendentes:',
    '        p = pendentes.pop()',
    '        if p == ".":',
    '            continue',
    '        if p == "..":',
    '            if atual:',
    '                atual.pop()',
    '            continue',
    '        candidato = "/" + "/".join(atual + [p])',
    '        if candidato in symlinks:',
    '            passos += 1',
    '            if passos > limite:',
    '                raise OSError("loop de symlinks")',
    '            alvo = symlinks[candidato]',
    '            if alvo.startswith("/"):',
    '                atual = []',
    '            pendentes.extend([x for x in alvo.split("/") if x][::-1])',
    '            continue',
    '        atual.append(p)',
    '    return "/" + "/".join(atual)',
    '',
    '',
    'def resolver_confinado(base, pedido, symlinks):',
    '    # 1. junte: pedido absoluto substitui a base; relativo vai depois dela',
    '    # 2. resolva por completo com resolver()',
    '    # 3. negue (EscapeNegado) se o resultado sair da base, ANTES de abrir qualquer coisa',
    '    return base + "/" + pedido',
    '',
    '',
    'LINKS = {"/srv/dados/atalho": "/etc", "/srv/dados/interno": "relatorios"}',
    'print(resolver_confinado("/srv/dados", "a/b.txt", LINKS))'
  ].join("\n");
  var testesConf = [
    'BASE = "/srv/dados"',
    'LINKS = {"/srv/dados/atalho": "/etc", "/srv/dados/interno": "relatorios"}',
    '',
    '',
    'def nega(pedido, links=LINKS):',
    '    try:',
    '        resolver_confinado(BASE, pedido, links)',
    '    except EscapeNegado:',
    '        return True',
    '    return False',
    '',
    '',
    'def test_pedido_interno_e_resolvido():',
    '    assert resolver_confinado(BASE, "a/b.txt", LINKS) == "/srv/dados/a/b.txt"',
    '    assert resolver_confinado(BASE, "a/../b.txt", LINKS) == "/srv/dados/b.txt"',
    '',
    '',
    'def test_ponto_ponto_que_escapa_e_negado():',
    '    assert nega("../../etc/passwd")',
    '',
    '',
    'def test_symlink_para_fora_e_negado():',
    '    assert nega("atalho/passwd")',
    '',
    '',
    'def test_prefixo_de_string_nao_basta():',
    '    assert nega("../dados-privado/x")',
    '',
    '',
    'def test_absoluto_fora_da_base_e_negado():',
    '    assert nega("/etc/passwd")',
    '',
    '',
    'def test_controle_negativo_symlink_interno_e_permitido():',
    '    assert resolver_confinado(BASE, "interno/q1.csv", LINKS) == "/srv/dados/relatorios/q1.csv"',
    '    assert resolver_confinado(BASE, ".", LINKS) == "/srv/dados"'
  ].join("\n");
  var solucaoConf = [
    'class EscapeNegado(ValueError):',
    '    pass',
    '',
    '',
    'def resolver(caminho, symlinks, limite=8):',
    '    pendentes = [p for p in caminho.split("/") if p][::-1]',
    '    atual, passos = [], 0',
    '    while pendentes:',
    '        p = pendentes.pop()',
    '        if p == ".":',
    '            continue',
    '        if p == "..":',
    '            if atual:',
    '                atual.pop()',
    '            continue',
    '        candidato = "/" + "/".join(atual + [p])',
    '        if candidato in symlinks:',
    '            passos += 1',
    '            if passos > limite:',
    '                raise OSError("loop de symlinks")',
    '            alvo = symlinks[candidato]',
    '            if alvo.startswith("/"):',
    '                atual = []',
    '            pendentes.extend([x for x in alvo.split("/") if x][::-1])',
    '            continue',
    '        atual.append(p)',
    '    return "/" + "/".join(atual)',
    '',
    '',
    'def resolver_confinado(base, pedido, symlinks):',
    '    raiz = resolver(base, symlinks)',
    '    bruto = pedido if pedido.startswith("/") else raiz + "/" + pedido',
    '    destino = resolver(bruto, symlinks)',
    '    if destino != raiz and not destino.startswith(raiz + "/"):',
    '        raise EscapeNegado(f"fora da base: {pedido!r}")',
    '    return destino'
  ].join("\n");

  TrilhaAula.registrar({
    id: 'lt01-b2',
    titulo: 'Filesystem, permissões, ambiente, limites e secrets',
    minutos: 50,
    resumo: 'Trocar "funcionou no meu computador" por filesystem explicado, permissão mínima e segredo fora do código: o nome não é o arquivo, escrita atômica, descritores, limites herdados e o que nunca viaja impresso.',
    objetivo: 'Explicar por que um path alcançou arquivo fora da base, operar com permissão mínima, escrever sem meio-arquivo, distinguir vazamento de FD de pico e manter segredo fora de código, argv e log.',
    revisao: [
      { id: 'lt01b2-prefixo', pergunta: 'Por que conferir, na string, se o caminho começa com a base não protege contra path escape?',
        opcoes: [
          opc('a', 'Porque <code>..</code> e symlinks só revelam o destino real depois da resolução; a ordem é juntar, resolver tudo, conferir contenção e negar antes de abrir', true, 'conferência sem resolução é teatro; resolução sem conferência é entrega.'),
          opc('b', 'Porque strings não podem ser comparadas em Python', false, 'podem; o problema é o que a string ainda não resolveu.'),
          opc('c', 'Porque o prefixo precisa ser conferido depois de abrir o arquivo', false, 'abrir antes de conferir já é o acesso que se queria negar.')] },
      { id: 'lt01b2-umask', pergunta: 'Modo pedido 666 com umask 022: qual é o modo real do arquivo criado?',
        opcoes: [
          opc('a', '644: a máscara retira a escrita de grupo e outros', true, 'modo real é o pedido menos a máscara; a umask só restringe a criação.'),
          opc('b', '666: a umask não afeta arquivos', false, 'a máscara vale para toda criação do processo.'),
          opc('c', '600: a máscara retira tudo de grupo e outros', false, '022 retira só a escrita; a leitura de grupo e outros fica.')] },
      { id: 'lt01b2-rename', pergunta: 'Por que "temporário no mesmo diretório + rename" evita meio-arquivo?',
        opcoes: [
          opc('a', 'O rename dentro de um filesystem troca o nome numa operação atômica: o leitor vê o antigo ou o novo, nunca metade', true, 'entre filesystems o rename vira cópia e a atomicidade some; por isso o temporário nasce ao lado do destino.'),
          opc('b', 'Porque pathlib torna a escrita atômica', false, 'atomicidade mora no filesystem, não na linguagem.'),
          opc('c', 'Porque escrever direto no destino já é atômico', false, 'escrita direta publica cada prefixo do conteúdo.')] },
      { id: 'lt01b2-fd', pergunta: 'A contagem em <code>/proc/&lt;pid&gt;/fd</code> sobe em escada a cada onda e não desce no vale. Diagnóstico e conserto?',
        opcoes: [
          opc('a', 'Vazamento de FD: fechar no mesmo caminho que abriu e provar o retorno ao baseline', true, 'subir o RLIMIT adia o erro e apaga a evidência.'),
          opc('b', 'Aumentar o <code>ulimit -n</code> até o erro sumir', false, 'compra tempo e vende o diagnóstico.'),
          opc('c', 'Pico legítimo: ignorar', false, 'pico desce sozinho no vale; escada que não desce é vazamento.')] },
      { id: 'lt01b2-segredo', pergunta: 'Por que segredo em argv é um defeito, e qual é o veículo correto?',
        opcoes: [
          opc('a', 'argv fica visível a qualquer usuário local (lista de processos, <code>/proc/&lt;pid&gt;/cmdline</code>); o segredo chega pelo ambiente no boot, valor nunca impresso nem persistido', true, 'ausência rende erro explícito, nunca default embutido no código.'),
          opc('b', 'argv é seguro porque não aparece em log', false, 'aparece na lista de processos de qualquer usuário local.'),
          opc('c', 'O segredo vai no código com um comentário de "trocar depois"', false, 'viaja para repositório, clones, imagens e logs; a remoção não recolhe as cópias.')] }
    ],
    abas: [
      { rotulo: 'Nomes e confinamento', blocos: [
        { tipo: 'texto', html:
          '<p>O Bloco 1 mostrou onde o programa mora (o processo). Este mostra <strong>onde ele pisa</strong>: nomes, permissões, descritores e ambiente herdados desse processo. Pré-requisitos: M02, M03 e Bloco 1. Todo exemplo é Python 3.14 só com stdlib (<code>os</code>, <code>pathlib</code>).</p>' +
          '<h3>O nome não é o arquivo</h3>' +
          '<p><strong>Path</strong> é o nome que conduz a um arquivo. O <strong>absoluto</strong> parte da raiz e vale por si; o <strong>relativo</strong> só faz sentido contra o diretório de trabalho do processo, um estado mutável herdado do pai. Resolver dado importante por path relativo é confiar num estado que você não controla.</p>' +
          '<p><strong>Inode</strong> é o registro onde o filesystem guarda o que o arquivo é: tipo, dono, permissões, tamanho, ponteiros para os blocos e contador de nomes. O nome vive no diretório (uma tabela que liga nomes a inodes), não no inode. <strong>Hard link</strong> é um segundo nome, no mesmo filesystem, para o mesmo inode; apagar um nome só libera o conteúdo quando o último some. <strong>Symlink</strong> é um arquivo pequeno cujo conteúdo é outro path: é resolvido a cada abertura, pode apontar para fora, para nada (dangling) ou fechar loop, caso em que o sistema desiste com erro após um limite de resoluções.</p>' },
        { tipo: 'texto', largo: true, html:
          '<table><thead><tr><th>Termo</th><th>Definição e mecanismo</th><th>Limite</th></tr></thead><tbody>' +
          '<tr><td>Path absoluto / relativo</td><td>Absoluto parte da raiz; relativo, do diretório de trabalho. Juntar base com pedido do usuário é resolução, não concatenação de texto.</td><td>Conferir prefixo na string antes de resolver não protege: <code>..</code> e symlinks só revelam o destino depois da resolução completa.</td></tr>' +
          '<tr><td>Inode</td><td>Metadados e localização dos dados; nomes moram nos diretórios. Um inode pode ter vários nomes.</td><td>O número não é identidade estável entre filesystems: o par que identifica é dispositivo mais inode, na mesma montagem.</td></tr>' +
          '<tr><td>Hard link</td><td>Segundo nome para o mesmo inode, mesmo conteúdo e filesystem. Criar e remover mexe no contador de nomes, sem copiar dados.</td><td>Não atravessa filesystem nem aponta para diretório: não é vetor de escape entre montagens.</td></tr>' +
          '<tr><td>Symlink</td><td>Arquivo cujo conteúdo é outro path, resolvido a cada abertura. Aponta para qualquer lugar, inclusive fora da base.</td><td>É o vetor de escape do bloco: symlink dentro da base apontando para fora resolve para fora.</td></tr>' +
          '</tbody></table>' },
        { tipo: 'callout', tom: 'info', titulo: 'Resolver antes de confiar', html:
          '<p>Quase todo path escape nasce da ordem trocada: primeiro confere, depois resolve. A ordem fixa é <strong>juntar o pedido à base, resolver tudo (cada symlink dos componentes) e só então decidir se o resultado permanece dentro da base</strong>; fora dela, negar antes de abrir, ler ou escrever. O oráculo do lab usa um arquivo-carneirinho fora da base que a implementação correta jamais alcança.</p>' },
        { tipo: 'codigo', linguagem: 'text', texto: [
          '# juntar o pedido à base declarada;',
          '# resolver o resultado por completo (symlinks incluídos);',
          '# conferir se o resolvido permanece dentro da base;',
          '# fora da base: negar aqui, sem abrir nada.'].join('\n') },
        { tipo: 'python', id: 'conf-python', titulo: 'Resolva e confine o pedido', obrigatorio: false,
          enunciado: 'A função <code>resolver</code> já resolve <code>.</code>, <code>..</code> e symlinks (um dict caminho para alvo, sem tocar o disco). Complete <code>resolver_confinado(base, pedido, symlinks)</code>: pedido absoluto substitui a base, relativo vai depois dela; resolva por completo; levante <code>EscapeNegado</code> se o destino sair da base. Cuidado com a fronteira: <code>/srv/dados-privado</code> não está dentro de <code>/srv/dados</code>.',
          codigo: codigoConf, testes: testesConf,
          dica: 'Resolva a base e o pedido juntado com <code>resolver</code>. Dentro da base é <code>destino == raiz</code> ou <code>destino.startswith(raiz + "/")</code>; só <code>startswith(raiz)</code> deixa passar o diretório vizinho.',
          solucao: solucaoConf,
          tutorDepois: 'A conferência vem depois da resolução, e a fronteira exige a barra: sem ela, "/srv/dados-privado" passaria como se estivesse dentro de "/srv/dados".',
          callout: 'O confinamento resolve por completo e nega antes de abrir; o symlink interno continua permitido.' },
        { tipo: 'codigo', linguagem: 'python', texto: refCaminho },
        { tipo: 'takeaway', html: 'O nome não é o arquivo: <mark>resolva por completo</mark>, confira a contenção e <mark>negue antes de abrir</mark>. Conferência sem resolução é teatro.' }
      ] },

      { rotulo: 'Mount, permissões e escrita', blocos: [
        { tipo: 'texto', html:
          '<h3>Montagem e volume</h3>' +
          '<p><strong>Mount</strong> anexa um filesystem num ponto da árvore: dali em diante os paths servem o conteúdo montado. <strong>Volume</strong>, no vocabulário do laboratório, é uma montagem com origem e opções declaradas (leitura e escrita, ou só leitura). O programa distingue pelo comportamento: o que aceita escrita, o que recusa, o que sobrevive ao fim do container.</p>' +
          '<ul><li>O código mora numa árvore que deveria ser <strong>só de leitura</strong>; os dados moram num diretório declarado, o único gravável.</li>' +
          '<li>Escrita em montagem read-only falha com erro de filesystem só de leitura: é sintoma de arquitetura, não de permissão mal digitada. O conserto é apontar a escrita ao diretório de dados, nunca afrouxar a montagem.</li>' +
          '<li><code>/proc</code> é um filesystem virtual de observação (<code>/proc/&lt;pid&gt;/fd</code>, <code>cmdline</code>, <code>environ</code>, <code>limits</code>): ler ali diagnostica, nunca controla.</li></ul>' +
          '<p>Montagem gravável onde só leitura basta converte qualquer defeito de path em escrita permanente no código ou na configuração. Permissão restrita transforma bug em erro negado; permissão folgada transforma o mesmo bug em persistência.</p>' +
          '<h3>Usuário, grupo, mode, umask, ownership</h3>' +
          '<p>Cada processo carrega um <strong>uid</strong> (e grupos); cada arquivo declara dono e grupo. O <strong>mode</strong> são as permissões (leitura, escrita, execução) em três classes: dono, grupo e outros. O usuário total (uid 0, root) passa por cima da checagem, por isso defeito de permissão testado como root é invisível e o oráculo exige non-root. A <strong>umask</strong> é a máscara que o processo aplica a toda criação: permissões pedidas menos a máscara dão as permissões reais. Como é herdada do lançador, o serviço declara a própria no boot.</p>' },
        { tipo: 'texto', largo: true, html:
          '<table><thead><tr><th>Termo</th><th>Definição e mecanismo</th><th>Limite</th></tr></thead><tbody>' +
          '<tr><td>uid / gid</td><td>Identidade numérica do processo e do arquivo, comparada a cada abertura: dono, grupo ou outros decidem quais bits valem.</td><td>Uid 0 ignora a checagem: testar permissão como root prova nada.</td></tr>' +
          '<tr><td>mode</td><td>Nove bits (rwx para dono, grupo, outros) mais bits especiais. Leitura autoriza abrir; escrita, modificar; execução em diretório, atravessar.</td><td>Mode aberto demais nunca é conserto: escrita para outros num diretório de dados convida a squatting e a symlink plantado.</td></tr>' +
          '<tr><td>umask</td><td>Máscara subtraída na criação, herdada pelo processo inteiro. O serviço declara a sua em vez de presumir a do ambiente.</td><td>Só restringe criação; não repara arquivo já aberto demais.</td></tr>' +
          '<tr><td>ownership</td><td>Dono e grupo do arquivo. O diretório de dados pertence ao usuário de execução, nunca ao root do deploy.</td><td>Mudar dono exige privilégio: a correção acontece no provisionamento, não no código em produção.</td></tr>' +
          '</tbody></table>' },
        { tipo: 'escolha', id: 'umask-escolha', titulo: 'Calcule: modo pedido e umask', obrigatorio: false,
          pergunta: 'Um processo com umask <code>027</code> cria um arquivo pedindo modo <code>666</code>. Qual é o modo real e o que ele implica?',
          opcoes: [
            { id: 'a', texto: '640: o dono lê e escreve, o grupo só lê e outros não têm acesso.', correta: true, porque: '666 menos a máscara 027 (grupo perde a escrita, outros perdem tudo) resulta em rw-r-----.' },
            { id: 'b', texto: '666: a umask não afeta arquivos.', correta: false, porque: 'a máscara vale para toda criação do processo.' },
            { id: 'c', texto: '027: a umask é o modo do arquivo.', correta: false, porque: 'a máscara é o que se retira, não o que se concede.' },
            { id: 'd', texto: '600: a máscara retira tudo de grupo e outros.', correta: false, porque: '027 retira só a escrita do grupo; a leitura do grupo permanece.' }
          ], tutorDepois: 'Modo real é o pedido menos os bits da máscara. Como a máscara é herdada do lançador, o serviço declara a própria no boot.' },
        { tipo: 'cenario', id: 'perm-cenario', titulo: 'Permissão negada em produção', obrigatorio: false,
          enunciado: 'O serviço roda como usuário sem privilégio e, em produção, recebe "permissão negada" ao gravar em /app/cache. No desenvolvimento, como root, tudo passava. Decida e veja o custo.',
          inicio: 'inicio',
          nos: {
            inicio: { texto: 'O deploy está parado por esse erro. O que você faz?', opcoes: [
              { texto: 'Liberar geral: chmod 777 em /app e seguir o deploy.', vai: 'f-777', tom: 'ruim', consequencia: 'troca um diagnóstico preciso por uma superfície onde qualquer processo local escreve e planta symlink.' },
              { texto: 'Rodar o serviço como root em produção, igual ao desenvolvimento.', vai: 'f-root', tom: 'ruim', consequencia: 'o defeito de permissão volta a ficar invisível, e qualquer bug passa a ter privilégio total.' },
              { texto: 'Reproduzir como non-root e ler dono contra mode do destino.', vai: 'dados', tom: 'ok', consequencia: 'você descobre que o serviço escreve na árvore de código, que deveria ser só de leitura.' }
            ] },
            dados: { texto: '/app é montado só de leitura, e a escrita foi para dentro dele. Qual o conserto?', opcoes: [
              { texto: 'Apontar a escrita ao diretório de dados declarado, do usuário de execução, confinada pelo resolvedor.', vai: 'mascara', tom: 'ok', consequencia: 'o código segue só de leitura e a escrita tem um único destino.' },
              { texto: 'Montar /app gravável para acomodar o caminho.', vai: 'f-mount', tom: 'ruim', consequencia: 'o próximo path escape escreve onde o deploy mora, e a atualização carrega o lixo junto.' }
            ] },
            mascara: { texto: 'O diretório de dados existe. Falta decidir a umask dos arquivos que o serviço cria.', opcoes: [
              { texto: 'Declarar a máscara própria no boot e documentá-la junto do diretório de dados e do usuário de execução.', vai: 'f-bom', tom: 'ok', consequencia: 'a política deixa de depender do lançador, e o mapa de permissões vira evidência.' },
              { texto: 'Herdar a umask do ambiente: quem lançou sabe o que faz.', vai: 'f-herda', tom: 'ruim', consequencia: 'o serviço herda a política de quem o lançou, e ela muda sem aviso.' }
            ] }
          },
          finais: {
            'f-bom': { bom: true, texto: 'Non-root, código só de leitura, escrita confinada ao diretório de dados e máscara declarada: o erro negado virou operação, não incidente.' },
            'f-777': { bom: false, texto: 'O deploy passou. Meses depois, um job vizinho encontrou o diretório aberto.' },
            'f-root': { bom: false, texto: 'O erro sumiu, e o defeito ficou escondido até o dia em que um pedido com escape teve privilégio total.' },
            'f-mount': { bom: false, texto: 'A escrita no código passou a funcionar, até um pedido com escape gravar na configuração.' },
            'f-herda': { bom: false, texto: 'Arquivos nasceram com modos diferentes em cada ambiente, e ninguém soube qual política valia.' }
          },
          callout: 'Você manteve o erro negado, achou a causa e corrigiu o mínimo: destino de dados e máscara declarada.' },
        { tipo: 'texto', html:
          '<h3>Escrita que nunca entrega meio-arquivo</h3>' +
          '<p>Escrever direto no destino publica cada prefixo do conteúdo: um leitor concorrente ou um crash entrega meio-arquivo com nome íntegro, a corrupção mais difícil de detectar. O protocolo tem três passos: (1) criar um <strong>temporário exclusivo</strong> no mesmo diretório do destino; (2) escrever o conteúdo completo e descarregar; (3) <strong>rename atômico</strong> por cima do destino. Dentro do mesmo filesystem o rename troca o nome de uma vez: o observador vê o velho ou o novo, nunca uma mistura. Crash antes do rename deixa o temporário órfão; depois, deixa o novo completo.</p>' +
          '<p>O temporário tem disciplina própria: nome previsível (horário, PID, contador) num diretório compartilhado permite <strong>squatting</strong> (outro processo ocupa o nome) ou symlink plantado para um alvo sensível. Crie com exclusividade, em diretório privado ao usuário de execução, com nome aleatório, e remova em qualquer saída. Atomicidade mora no filesystem, não na linguagem; entre filesystems o rename vira cópia, por isso o temporário nasce ao lado do destino.</p>' },
        { tipo: 'complete', id: 'atomico-complete', titulo: 'Monte a escrita atômica', obrigatorio: false, linguagem: 'python',
          enunciado: 'Escolha, em cada lacuna, a peça que dá exclusividade ao temporário, descarrega os dados e troca o nome de uma vez.',
          partes: [
            'import os\nimport tempfile\n\n\ndef gravar(destino: str, dados: bytes) -> None:\n    pasta = os.path.dirname(destino)\n    fd, tmp = tempfile.mkstemp(dir=', { lacuna: 'dir', opcoes: ['pasta', '"/tmp"', '"."'], correta: 'pasta' },
            ')  # nome aleatório, criação exclusiva\n    try:\n        with os.fdopen(fd, "wb") as f:\n            f.write(dados)\n            f.flush()\n            os.', { lacuna: 'flush', opcoes: ['fsync', 'chmod', 'kill'], correta: 'fsync' },
            '(f.fileno())\n        os.', { lacuna: 'troca', opcoes: ['rename', 'symlink', 'chown'], correta: 'rename' },
            '(tmp, destino)\n    except BaseException:\n        os.unlink(tmp)\n        raise\n'
          ],
          explicacao: 'O temporário fica na <strong>mesma pasta</strong> do destino porque mesmo diretório implica mesmo filesystem, e só dentro de um filesystem o rename é indivisível. <code>mkstemp</code> cria com nome aleatório e exclusividade (falha se o nome existir). O descarregamento garante o conteúdo completo antes da troca, e a remoção no caminho de erro evita temporário órfão.',
          callout: 'Escrita montada: temporário exclusivo ao lado, descarga completa e troca atômica.' },
        { tipo: 'takeaway', html: 'Código <mark>só de leitura</mark>, escrita num <mark>diretório de dados</mark> sob usuário sem privilégio; o durável nasce <mark>ao lado e troca por cima</mark>.' }
      ] },

      { rotulo: 'FD, limites e segredos', blocos: [
        { tipo: 'texto', html:
          '<h3>Ambiente, descritores e limites</h3>' +
          '<p><strong>Environment</strong> é o bloco de pares nome-valor herdado do pai na criação: configuração que viaja com o processo. Herança também é exposição: o ambiente aparece em <code>/proc/&lt;pid&gt;/environ</code> para o mesmo usuário, é copiado para cada filho e vaza para dumps e páginas de erro quando a aplicação o despeja no log. Regra do bloco: o ambiente carrega configuração e referência a segredo no boot; o valor de segredo jamais é impresso, persistido ou devolvido em resposta.</p>' +
          '<p><strong>File descriptor</strong> (FD) é o inteiro que representa cada arquivo, socket ou pipe aberto: 0, 1 e 2 nascem como entrada, saída e erro. <strong>Vazamento de FD</strong> é abrir sem fechar no caminho quente: sob carga a contagem só cresce até o teto, e novas aberturas (arquivos, conexões, accepts) passam a falhar. <strong>Ulimit / RLIMIT</strong> é o teto herdado de recursos (número de descritores, tamanho de arquivo, memória travada), ajustável até um teto rígido. Limite estourado com contagem estável é capacidade; com contagem sempre crescente é vazamento: diagnósticos e consertos diferentes.</p>' },
        { tipo: 'rode', id: 'fd-rode', titulo: 'Abrir sem fechar contra fechar', obrigatorio: false,
          enunciado: 'Rode as duas faces do rastreador do lab (as saídas das duas primeiras etapas são determinísticas) e leia o sinal de fora na terceira.',
          prefixo: '$', entrada: CMDFD, unidade: 'FD', terminalTitulo: 'lab/', etapas: etapasFd(),
          prever: { pergunta: 'Três requisições abrem o mesmo arquivo sem fechar. Qual é a contagem em aberto?', opcoes: [
            { id: 'a', texto: '0: o Python fecha sozinho ao fim da função.', correta: false, porque: 'o rastreador guarda o descritor aberto; nada o fecha sem a chamada explícita.' },
            { id: 'b', texto: '3: cada abertura acumula um descritor.', correta: true, porque: 'é o patamar que a carga só faz subir até o teto herdado.' },
            { id: 'c', texto: '1: o mesmo arquivo reaproveita o descritor.', correta: false, porque: 'cada abertura consome um número novo.' }
          ] },
          tutorAntes: 'Aperte Enter para rodar e depois clique em "Fechando" para ver o baseline.',
          tutorDepois: 'Vazamento se corrige fechando no mesmo caminho que abriu (bloco de fechamento garantido). Elevar o RLIMIT sem fechar compra tempo e vende o diagnóstico.',
          callout: 'Você viu a contagem fixar um patamar sem o fechamento e voltar ao baseline com ele.' },
        { tipo: 'codigo', linguagem: 'python', texto: refFd },
        { tipo: 'texto', html:
          '<h3>Segredos: o que viaja com o processo e o que nunca viaja com o código</h3>' +
          '<p><strong>Secret exposure</strong> é o segredo alcançando quem não deveria, e cada veículo tem um mecanismo próprio. Argumentos de linha de comando são visíveis a qualquer usuário local pela lista de processos e por <code>/proc/&lt;pid&gt;/cmdline</code>. Logs persistem e replicam. O ambiente é o veículo menos pior, e por isso carrega só a referência no boot, com o valor presente apenas na memória de quem precisa dele. Segredo no código viaja para o repositório, cada clone, cada imagem e cada log de partida, e a remoção posterior não recolhe as cópias.</p>' +
          '<p>A conduta é fixa desde o primeiro dia: o segredo chega pelo ambiente no boot, o código declara só o nome da variável, o valor nunca é impresso nem persistido, e a ausência rende <strong>erro explícito</strong> em vez de default embutido.</p>' },
        { tipo: 'transcript', id: 'segredo-transcript', titulo: 'Ache as decisões que vazam segredo', obrigatorio: false, terminalTitulo: 'sessão: subir o serviço',
          enunciado: 'O agente sobe o serviço que precisa de um token. Duas afirmações dele quebram a regra do bloco. Clique nelas e aperte Conferir.',
          linhas: [
            { quem: 'voce', texto: 'O serviço precisa do token do provedor. Segredo não pode vazar de jeito nenhum.' },
            { quem: 'agente', texto: 'Passo o token como argumento, python serve.py --token $TOKEN. Argumento não vai para log, então é seguro.' },
            { quem: 'ferramenta', texto: '$ ps -eo pid,args | grep serve\n4121 python serve.py --token demo-123' },
            { quem: 'agente', texto: 'Corrigido: serve.py lê API_TOKEN do ambiente no boot e o código declara só o nome da variável.' },
            { quem: 'ferramenta', texto: '$ python serve.py\nSegredoAusente: defina API_TOKEN no ambiente' },
            { quem: 'agente', texto: 'Para o serviço subir mesmo sem a variável, embuto um valor padrão no código.' }
          ],
          erradas: [1, 5],
          explicacao: {
            1: 'argv é visível a qualquer usuário local (lista de processos, /proc/&lt;pid&gt;/cmdline): o próprio ps da sessão mostra o token.',
            5: 'O erro explícito é o comportamento certo; um default embutido faz o segredo viajar para repositório, clones, imagens e logs.'
          },
          tutorDepois: 'Segredo ausente é erro explícito; segredo presente vem do ambiente e não aparece em argv, log nem código.' },
        { tipo: 'codigo', linguagem: 'python', texto: refExec },
        { tipo: 'callout', tom: 'neutral', titulo: 'Privilégio mínimo é decisão de blast radius', html:
          '<p>Non-root, diretório de dados único e segredo por ambiente respondem à mesma pergunta: "quando (não se) este componente for comprometido, o que ele alcança?". Nenhuma das três impede o bug; juntas, convertem o bug em erro negado em vez de incidente. É a matriz SEC-03: identidade, menor privilégio e auditoria antes do primeiro deploy, com o mapa de permissões e a ausência de segredo como evidência.</p>' },
        { tipo: 'takeaway', html: 'Pico <mark>desce sozinho</mark>, vazamento <mark>fixa patamar</mark>; o segredo chega pelo <mark>ambiente</mark>, nunca por código, argv ou log.' }
      ] },

      { rotulo: 'Conferir e diagnosticar', blocos: [
        { tipo: 'escolha', id: 'b2-escolha-api', titulo: 'Confira: dois sintomas, um defeito?',
          pergunta: 'A API acumula descritores ao longo do dia e, em paralelo, a escrita no volume novo falha com erro de só-leitura. Como separar os dois?',
          opcoes: [
            { id: 'a', texto: 'São a mesma causa: falta de recurso. Aumentar o limite resolve os dois.', correta: false, porque: 'um sintoma é contagem, o outro é destino de escrita; limite maior não conserta nenhum deles.' },
            { id: 'b', texto: 'Duas faces: escada de FD sem retorno é vazamento (fechar no mesmo caminho); recusa imediata de escrita é destino fora dos dados (redirecionar para o diretório declarado).', correta: true, porque: 'a evidência separa: escada contra recusa imediata.' },
            { id: 'c', texto: 'Montar o volume gravável e reiniciar a cada onda.', correta: false, porque: 'afrouxar a montagem e reiniciar apagam as duas evidências.' }
          ], tutorDepois: 'Cada defeito tem seu sinal e seu conserto; tratar tudo como "falta de recurso" não corrige nenhum.' },
        { tipo: 'escolha', id: 'b2-escolha-link', titulo: 'Confira: hard link ou symlink?',
          pergunta: 'Qual dos dois é vetor de escape de uma base, e por quê?',
          opcoes: [
            { id: 'a', texto: 'Symlink: é resolvido a cada abertura e pode apontar para qualquer lugar, inclusive fora da base.', correta: true, porque: 'hard link compartilha o inode e não atravessa filesystem nem aponta para diretório.' },
            { id: 'b', texto: 'Hard link: aponta para outro filesystem.', correta: false, porque: 'hard link só existe dentro do mesmo filesystem.' },
            { id: 'c', texto: 'Os dois são equivalentes.', correta: false, porque: 'um é segundo nome do mesmo inode; o outro é um arquivo com outro path dentro.' }
          ], tutorDepois: 'Mesmo com resolvedor correto, existe a janela entre checar e usar (verificar e abrir em dois instantes): é uma corrida que mantém a porta aberta.' },
        { tipo: 'escreva', id: 'b2-escreva', titulo: 'Dois casos de transferência', obrigatorio: false,
          enunciado: 'Caso A: temporário com nome derivado do horário num diretório gravável por todos; um vizinho ocupa o nome primeiro. Caso B: token passado como argumento na partida, visível na lista de processos. Diga a conduta de cada caso e o custo de manter o comportamento.',
          placeholder: 'No caso A, o problema é… A conduta é… No caso B…',
          rubrica: [
            'Caso A: recusa <strong>nome previsível em diretório compartilhado</strong> (squatting, symlink plantado) e prescreve nome aleatório com criação exclusiva em diretório privado.',
            'Caso B: recusa <strong>segredo em argv</strong> e prescreve o segredo pelo ambiente, com o valor nunca impresso.',
            'Declara o custo: escrita desviada para onde o atacante escolheu; segredo publicado com cópias que não se recolhem.'
          ],
          modelo: '<p>No caso A, um nome previsível num diretório compartilhado deixa outro processo ocupar o nome ou plantar um symlink, e a escrita "temporária" aterrissa onde o atacante escolheu; a conduta é nome aleatório, criação exclusiva e diretório privado ao usuário de execução, removendo o temporário em qualquer saída. No caso B, argv é visível a qualquer usuário local; a conduta é receber o segredo pelo ambiente no boot e nunca imprimi-lo ou persisti-lo. Manter o comportamento custa escrita desviada e um segredo exposto cujas cópias não se recolhem, só se rotacionam.</p>' },
        { tipo: 'texto', largo: true, html:
          '<h3>Tabela de diagnóstico</h3>' +
          '<table><thead><tr><th>Sintoma</th><th>Causa provável</th><th>Conserto</th></tr></thead><tbody>' +
          '<tr><td>Aberturas falham sob carga sustentada; reiniciar "resolve" até a próxima onda</td><td>Vazamento de FD no caminho quente</td><td>Fechar no mesmo caminho que abriu; provar o retorno ao baseline; elevar o limite só adia</td></tr>' +
          '<tr><td>Pedido com <code>..</code> ou symlink alcança arquivo fora da base</td><td>Prefixo conferido na string, antes de resolver</td><td>Juntar, resolver por completo, conferir contenção e negar antes de qualquer I/O</td></tr>' +
          '<tr><td>Escrita falha com erro de só-leitura</td><td>Escrita na árvore de código ou montagem read-only</td><td>Apontar ao diretório de dados declarado; nunca afrouxar a montagem</td></tr>' +
          '<tr><td>Permissão negada em produção que passava no desenvolvimento</td><td>Teste como root, que ignora a checagem</td><td>Reproduzir como non-root, ler dono contra mode, corrigir o mínimo</td></tr>' +
          '<tr><td>Nome íntegro, conteúdo pela metade após crash ou leitura concorrente</td><td>Escrita direta no destino</td><td>Temporário exclusivo ao lado, descarga e rename atômico</td></tr>' +
          '<tr><td>Temporário ocupado por outro processo</td><td>Nome previsível em diretório compartilhado</td><td>Nome aleatório com criação exclusiva em diretório privado; remover em qualquer saída</td></tr>' +
          '<tr><td>Segredo em lista de processos, log ou histórico de versão</td><td>Segredo em argv, em log ou no código</td><td>Só pelo ambiente no boot; ausência rende erro explícito</td></tr>' +
          '<tr><td>Teto de descritores estoura com contagem estável</td><td>Limite herdado menor que a concorrência real</td><td>Platô é capacidade, escada é vazamento; declarar o limite e dimensionar com margem</td></tr>' +
          '</tbody></table>' },
        { tipo: 'callout', tom: 'neutral', titulo: 'Fontes e versões', html:
          '<p>Linux man-pages (paths, open, chmod, rename, symlink, mount) e proc(5): normativas, consultadas em 14/08/2026, revalidar em até 90 dias. Documentação do Python 3.14 (<code>os</code>, <code>pathlib</code>): oficial. Diretório de dados único, máscara declarada, escrita temporário mais rename e segredo por ambiente: construção da trilha, medida na folha B02-L. Contagens e patamares citados são exemplo variável, não evidência.</p>' },
        { tipo: 'takeaway', html: 'Privilégio mínimo converte <mark>bug em erro negado</mark>; permissão folgada converte o mesmo bug em <mark>persistência</mark>.' }
      ] }
    ]
  });
})();
