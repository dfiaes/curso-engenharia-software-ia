/* LT01 · Bloco 4: HTTP, proxies, pools, deadlines e cancelamento. Fonte: LT01.html#b04. Números são exemplo variável (a medição pertence ao lab/); os do simulador vêm do bloco. */
(function () {
  var L = function (kind, text) { return { kind: kind, text: text }; };
  function opc(id, texto, correta, porque) { return { id: id, texto: texto, correta: correta, porque: porque }; }

  var refPool = `"""Pool local de conexões: tamanho fixo, fila FIFO e prazo de aquisição.
Referencia executavel do Bloco 4. So STDLIB (queue, threading).
Conexões nascem da fabrica contratada; nenhum socket externo aqui.
"""
from __future__ import annotations
import queue
import threading
from collections.abc import Callable

class PoolEsgotado(TimeoutError):
    """Nenhum slot livre dentro do prazo de aquisição contratado."""

class PoolLocal:
    """Pool de tamanho fixo com fila FIFO e prazo de aquisição.
    A fabrica cria o recurso sob demanda até o teto; a partir daí,
    adquirir espera um slot livre até o prazo e levanta PoolEsgotado.
    """
    def __init__(self, fabrica: Callable[[], object], tamanho: int, prazo_aquisicao: float) -> None:
        if tamanho < 1:
            raise ValueError("tamanho precisa ser ao menos 1")
        if not prazo_aquisicao > 0:
            raise ValueError("prazo_aquisicao precisa ser positivo")
        self._fabrica = fabrica
        self._tamanho = tamanho
        self._prazo = prazo_aquisicao
        self._livres: queue.Queue[object] = queue.Queue()
        self._criadas = 0
        self._trava = threading.Lock()

    def adquirir(self) -> object:
        """Devolve recurso livre ou recém-criado; sem slot no prazo: PoolEsgotado."""
        try:
            return self._livres.get_nowait()
        except queue.Empty:
            pass
        with self._trava:
            pode_criar = self._criadas < self._tamanho
            if pode_criar:
                self._criadas += 1
        if pode_criar:
            return self._fabrica()
        try:
            return self._livres.get(timeout=self._prazo)
        except queue.Empty:
            raise PoolEsgotado(f"sem slot livre em {self._prazo}s") from None

    def liberar(self, item: object) -> None:
        """Devolve o slot à fila; quem adquiriu devolve exatamente uma vez."""
        self._livres.put(item)

    def estatisticas(self) -> dict[str, int]:
        """Publica tamanho, livres e em_uso para o oráculo AT-030."""
        livres = self._livres.qsize()
        with self._trava:
            criadas = self._criadas
        return {"tamanho": self._tamanho, "livres": livres, "em_uso": criadas - livres}

    def fechar(self) -> None:
        """Esvazia os slots livres; recursos em uso voltam e são descartados."""
        try:
            while True:
                self._livres.get_nowait()
        except queue.Empty:
            return`;

  var refDeadline = `"""Deadline end-to-end com orçamento por fase e retry só quando seguro.
Referencia executavel do Bloco 4. So STDLIB (time).
Relógio injetado pelo chamador: teste com relógio controlado.
"""
from __future__ import annotations
from collections.abc import Callable

METODOS_REPETIVEIS = frozenset({"GET", "HEAD", "OPTIONS", "PUT", "DELETE"})

class PrazoEstourado(TimeoutError):
    """Fase ou operação além do orçamento contratado."""

def orcamento_por_fase(prazo_total: float, pesos: dict[str, float]) -> dict[str, float]:
    """Divide o prazo total em orçamentos proporcionais aos pesos.
    Pesos precisam ser positivos; a soma dos orçamentos fecha no total.
    """
    if not prazo_total > 0:
        raise ValueError("prazo_total precisa ser positivo")
    if not pesos:
        raise ValueError("pesos vazio não orça fase alguma")
    total_pesos = 0.0
    for peso in pesos.values():
        if not peso > 0:
            raise ValueError("todo peso precisa ser positivo")
        total_pesos += peso
    return {fase: prazo_total * peso / total_pesos for fase, peso in pesos.items()}

def restante(inicio: float, prazo_total: float, agora: float) -> float:
    """Segundos que faltam do deadline; nunca negativo."""
    falta = inicio + prazo_total - agora
    return falta if falta > 0 else 0.0

def checar_prazo(inicio: float, prazo_total: float, agora: float) -> None:
    """Levanta PrazoEstourado quando o deadline já passou."""
    if agora - inicio >= prazo_total:
        raise PrazoEstourado(f"deadline de {prazo_total}s excedido")

def executar_fase[T](orcamento_fase: float, inicio: float, prazo_total: float,
                     agora: Callable[[], float], trabalho: Callable[[float], T]) -> T:
    """Executa o trabalho com o menor entre orçamento da fase e restante.
    Checa o deadline antes e depois; estouro vira PrazoEstourado.
    """
    checar_prazo(inicio, prazo_total, agora())
    disponivel = restante(inicio, prazo_total, agora())
    teto = orcamento_fase if orcamento_fase < disponivel else disponivel
    saida = trabalho(teto)
    checar_prazo(inicio, prazo_total, agora())
    return saida

def pode_repetir(metodo: str, tentativa: int, max_tentativas: int, restante_seg: float) -> bool:
    """Retry só quando seguro: idempotente, dentro do teto e com prazo.
    POST e método fora do conjunto repetível nunca repetem;
    sem prazo restante, nunca.
    """
    if tentativa >= max_tentativas:
        return False
    if restante_seg <= 0:
        return False
    return metodo.strip().upper() in METODOS_REPETIVEIS`;

  var refCancel = `"""Cancelamento cooperativo: o sinal viaja, o trabalho decide onde parar.
Referencia executavel do Bloco 4. So STDLIB (threading).
Nunca interrompe thread à força: o trabalho verifica nos limites.
"""
from __future__ import annotations
import threading
from collections.abc import Callable, Iterable, Iterator

class Cancelado(Exception):
    """Trabalho interrompido num limite após cancelar()."""

class SinalCancelamento:
    """Sinal manual e idempotente: cancelar() uma vez vale para sempre."""
    def __init__(self) -> None:
        self._evento = threading.Event()

    def cancelar(self) -> None:
        """Marca o sinal; chamar duas vezes não muda nada."""
        self._evento.set()

    @property
    def cancelado(self) -> bool:
        """Verdadeiro depois de cancelar(), falso antes."""
        return self._evento.is_set()

    def verificar(self) -> None:
        """Levanta Cancelado se o sinal foi marcado; senão, retorna."""
        if self._evento.is_set():
            raise Cancelado("trabalho cancelado pelo chamador")

    def aguardar(self, prazo: float | None = None) -> bool:
        """Espera o sinal até o prazo; devolve True se cancelado."""
        return self._evento.wait(timeout=prazo)

def executar_cancelavel[T](sinal: SinalCancelamento, trabalho: Callable[[], T]) -> T:
    """Verifica antes e depois; o cancelamento aparece no limite seguinte."""
    sinal.verificar()
    saida = trabalho()
    sinal.verificar()
    return saida

def iterar_cancelavel[T](sinal: SinalCancelamento, itens: Iterable[T]) -> Iterator[T]:
    """Produz item a item, verificando o sinal a cada passo."""
    for item in itens:
        sinal.verificar()
        yield item`;

  var etapasPool = function () {
    return [
      { id: 'p1', nome: 'Pedido 1', descricao: 'Teto não atingido: a fábrica cria', tom: 'dns', ms: 0.1, linhas: [
        L('in', 'adquirir() -> conexão nova (criadas 1 de 2)'),
        L('out', "{'tamanho': 2, 'livres': 0, 'em_uso': 1}")] },
      { id: 'p2', nome: 'Pedido 2', descricao: 'Ainda cabe: cria a segunda', tom: 'tcp', ms: 0.1, linhas: [
        L('in', 'adquirir() -> conexão nova (criadas 2 de 2)'),
        L('out', "{'tamanho': 2, 'livres': 0, 'em_uso': 2}")] },
      { id: 'p3', nome: 'Pedido 3', descricao: 'Teto atingido, ninguém libera: espera até o prazo', tom: 'tls', ms: 0.5, linhas: [
        L('in', 'adquirir() espera na fila FIFO por 0.5 s'),
        L('out', 'PoolEsgotado: sem slot livre em 0.5s'),
        L('hint', 'falhou antes de qualquer byte viajar; o destino pode estar ocioso')] },
      { id: 'lib', nome: 'Liberar', descricao: 'Quem adquiriu devolve exatamente uma vez', tom: 'response', ms: 0.1, linhas: [
        L('in', 'liberar(c1); liberar(c2)'),
        L('out', "{'tamanho': 2, 'livres': 2, 'em_uso': 0}"),
        L('hint', 'em_uso volta ao patamar; corpo não fechado jamais chega aqui')] }
    ];
  };

  var codigoRetry = [
    'def simular(deadline, timeout, retries, upstream, idempotente):',
    '    """Tempos em ms; relógio simulado. Devolve tentativas, sucesso e gasto."""',
    '    gasto, tentativas = 0, 0',
    '    while True:',
    '        tentativas += 1',
    '        # cada tentativa dura o menor entre timeout, resposta do upstream',
    '        # e o que resta do deadline; sucesso só se o upstream couber nesse teto',
    '        dura = min(timeout, upstream)',
    '        gasto += dura',
    '        if upstream <= timeout:',
    '            return {"tentativas": tentativas, "sucesso": True, "gasto_ms": gasto}',
    '        # retry seguro: idempotente, dentro do teto de retries e com prazo restante',
    '        if tentativas > retries:',
    '            return {"tentativas": tentativas, "sucesso": False, "gasto_ms": gasto}',
    '',
    '',
    'print(simular(3000, 1000, 2, 2500, True))'
  ].join("\n");
  var testesRetry = [
    'def test_upstream_lento_esgota_as_tentativas():',
    '    assert simular(3000, 1000, 2, 2500, True) == {"tentativas": 3, "sucesso": False, "gasto_ms": 3000}',
    '',
    '',
    'def test_upstream_rapido_passa_na_primeira():',
    '    assert simular(3000, 1000, 2, 800, True) == {"tentativas": 1, "sucesso": True, "gasto_ms": 800}',
    '',
    '',
    'def test_post_nao_repete():',
    '    assert simular(3000, 1000, 2, 2500, False) == {"tentativas": 1, "sucesso": False, "gasto_ms": 1000}',
    '',
    '',
    'def test_nunca_passa_do_deadline():',
    '    r = simular(2500, 1000, 5, 2500, True)',
    '    assert r["gasto_ms"] == 2500 and r["tentativas"] == 3 and r["sucesso"] is False',
    '',
    '',
    'def test_controle_negativo_timeout_folgado_conclui():',
    '    assert simular(3000, 3000, 2, 2500, True) == {"tentativas": 1, "sucesso": True, "gasto_ms": 2500}'
  ].join("\n");
  var solucaoRetry = [
    'def simular(deadline, timeout, retries, upstream, idempotente):',
    '    gasto, tentativas = 0, 0',
    '    while True:',
    '        tentativas += 1',
    '        teto = min(timeout, deadline - gasto)',
    '        dura = min(teto, upstream)',
    '        gasto += dura',
    '        if upstream <= teto:',
    '            return {"tentativas": tentativas, "sucesso": True, "gasto_ms": gasto}',
    '        pode = idempotente and tentativas <= retries and deadline - gasto > 0',
    '        if not pode:',
    '            return {"tentativas": tentativas, "sucesso": False, "gasto_ms": gasto}'
  ].join("\n");

  TrilhaAula.registrar({
    id: 'lt01-b4',
    titulo: 'HTTP, proxies, pools, deadlines e cancelamento',
    minutos: 50,
    resumo: 'Depois que a conversa abre: quanto custa, quanto pode durar e como termina sem deixar resto. Semântica contra framing, proxy com relógio próprio, pool contado, deadline dividido de cima para baixo, cancelamento cooperativo e retry só quando seguro.',
    objetivo: 'Explicar por que uma requisição lenta pode ser pool esgotado, prazo mal dividido ou cancelamento ignorado, e decidir quando repetir é permitido.',
    revisao: [
      { id: 'lt01b4-504', pergunta: 'Um 504 chega ao cliente e a equipe conclui "o serviço quebrou". Por que isso pode estar errado?',
        opcoes: [
          opc('a', 'Erro na borda declara o ponto de vista da borda: o proxy desistiu de esperar; a evidência está nos dois relógios', true, 'prazos se ordenam de fora para dentro: cliente acima do proxy acima do serviço acima do upstream.'),
          opc('b', '504 sempre significa que o serviço morreu', false, 'o proxy não viu o serviço morrer; viu o próprio prazo acabar.'),
          opc('c', '504 é erro do cliente', false, 'é o veredito da borda sobre a espera pelo upstream.')] },
      { id: 'lt01b4-corpo', pergunta: 'Um cliente HTTP/1.1 abandona respostas sem ler nem fechar o corpo. Sob carga, requisições novas esperam. Causa?',
        opcoes: [
          opc('a', 'Cada corpo abandonado prende uma conexão fora do pool até o timeout ocioso; a fila de aquisição cresce', true, 'é o vazamento do Bloco 2 com outro nome.'),
          opc('b', 'O DNS está falhando', false, 'o sintoma é fila de aquisição, não resolução.'),
          opc('c', 'O servidor é lento por natureza', false, 'o destino pode estar ocioso enquanto o cliente não tem slot.')] },
      { id: 'lt01b4-retry', pergunta: 'Quais são as três condições do retry seguro?',
        opcoes: [
          opc('a', 'Método idempotente, tentativa abaixo do teto e prazo restante acima de zero', true, 'faltando uma, a repetição é amplificação, não correção.'),
          opc('b', 'Qualquer método, desde que com backoff', false, 'POST repetido pode duplicar o efeito.'),
          opc('c', 'Repetir até dar certo', false, 'sem teto e sem prazo, a falha vira tempestade.')] },
      { id: 'lt01b4-deadline', pergunta: 'Qual divisão de prazo é coerente para um deadline end-to-end de 2 s?',
        opcoes: [
          opc('a', 'Dividir de cima para baixo entre as fases, propagando o restante, de modo que a soma nunca passe dos 2 s', true, 'cada fase recebe o menor entre o seu orçamento e o restante.'),
          opc('b', '2 s para cada fase', false, 'cinco fases somariam 10 s no pior caso.'),
          opc('c', 'Timeout infinito nas fases, deadline só no cliente', false, 'timeout único e infinito é falha catalogada.')] },
      { id: 'lt01b4-cancel', pergunta: 'O cliente desiste e o servidor segue trabalhando até o fim. O que falta?',
        opcoes: [
          opc('a', 'Propagação cooperativa: sinal marcado e verificado nos limites, com interrupção onde é seguro e liberação de slot, memória e upstream', true, 'o trabalho decide onde parar; nunca se mata a thread à força.'),
          opc('b', 'Matar a thread do handler à força', false, 'interromper no meio de uma escrita deixa resto.'),
          opc('c', 'Aumentar o pool', false, 'o trabalho sem dono continua prendendo o slot.')] }
    ],
    abas: [
      { rotulo: 'Semântica, framing e proxy', blocos: [
        { tipo: 'texto', html:
          '<p>O Bloco 3 entregou o caminho até o socket atendido. Este decide o que acontece depois que a conversa abre: <strong>quanto custa, quanto pode durar e como termina sem deixar resto</strong>. Pré-requisitos: M02, M03 e Blocos 1 a 3; o cancelamento cooperativo e os orçamentos de tempo retomam o M02A (B06/B08). Todo exemplo é Python 3.14 só com stdlib.</p>' +
          '<h3>A mensagem não é o fio</h3>' +
          '<p><strong>Semântica</strong> é o significado da troca: o método declara a intenção (GET lê, POST entrega para processar, PUT substitui, DELETE remove), o alvo declara sobre o quê, os campos (headers) carregam metadados, o status declara o desfecho e o corpo carrega a representação. <strong>Framing</strong> é como isso viaja codificado: texto com Content-Length no HTTP/1.1, quadros binários numerados no HTTP/2, fluxos sobre QUIC no HTTP/3. O mesmo GET e o mesmo 200 viajam nos três sem mudar de sentido. Conexão que não reutiliza, resposta que trava no meio, proxy que corta corpo grande: nenhum acusa o método ou o status; todos moram abaixo do significado.</p>' },
        { tipo: 'texto', largo: true, html:
          '<table><thead><tr><th>Termo</th><th>Definição e mecanismo</th><th>Limite</th></tr></thead><tbody>' +
          '<tr><td>Semântica</td><td>Intenção e desfecho: método, alvo, campos, status, corpo. Estável entre versões.</td><td>Status 200 declarado não prova corpo recebido: a prova mora no framing e no fechamento.</td></tr>' +
          '<tr><td>Framing</td><td>Codificação no transporte: texto + Content-Length no 1.1, quadros e streams no 2, fluxos QUIC no 3.</td><td>Cada framing trava e corta do seu jeito, sem a aplicação mudar uma linha.</td></tr>' +
          '<tr><td>Idempotente</td><td>Repetir produz o mesmo efeito que executar uma vez (GET, HEAD, OPTIONS, PUT, DELETE).</td><td>É declarada pela semântica, não verificada pelo fio: repetir POST porque "parece inofensivo" é decisão, não observação.</td></tr>' +
          '<tr><td>Corpo não fechado</td><td>Resposta cujo corpo o leitor abandona sem consumir nem fechar: a conexão não volta ao pool.</td><td>Cada corpo abandonado é um slot perdido até o timeout ocioso.</td></tr>' +
          '</tbody></table>' },
        { tipo: 'texto', html:
          '<h3>HTTP/1.1, 2 e 3</h3>' +
          '<p><strong>HTTP/1.1</strong> fala uma requisição por vez em cada conexão; o <strong>keep-alive</strong> reutiliza a conexão em sequência, mas enquanto uma resposta viaja as demais esperam: <strong>bloqueio de cabeça de fila</strong>. <strong>HTTP/2</strong> divide a conexão em <strong>streams</strong> multiplexados, e a lentidão de um não trava os outros no protocolo; resta o bloqueio do TCP único abaixo. <strong>HTTP/3</strong> roda sobre QUIC, com recuperação de perda por fluxo. A stdlib Python não implementa HTTP/2 nem HTTP/3: o que transfere é o raciocínio por camadas.</p>' },
        { tipo: 'texto', largo: true, html:
          '<table><thead><tr><th>Versão</th><th>O que muda no fio</th><th>Consequência para pool e prazo</th></tr></thead><tbody>' +
          '<tr><td>HTTP/1.1</td><td>Uma resposta por vez por conexão; keep-alive em sequência; cabeça de fila pune a fila inteira.</td><td>Pool é obrigatório: cada requisição simultânea prende uma conexão. Prazo por fase nasce aqui.</td></tr>' +
          '<tr><td>HTTP/2</td><td>Streams multiplexados numa conexão; cancelamento por stream (RST_STREAM) sem matar a conexão.</td><td>O limite migra para streams concorrentes e para o TCP único abaixo. Cancelar vira operação barata.</td></tr>' +
          '<tr><td>HTTP/3</td><td>Fluxos independentes sobre QUIC; perda isolada por fluxo; migração sem novo handshake completo.</td><td>Mesmos orçamentos, granulação mais fina: o deadline por operação continua valendo.</td></tr>' +
          '</tbody></table>' },
        { tipo: 'texto', html:
          '<h3>O meio tem opinião: reverse proxy</h3>' +
          '<p><strong>Reverse proxy</strong> recebe a requisição do cliente e a repassa ao serviço de trás: termina o TLS da borda, escolhe o destino, enfileira e aplica prazos próprios (leitura do cliente, espera pelo upstream, escrita da resposta). Para o diagnóstico, é uma segunda aplicação com fila e relógio. Proxy com prazo menor que o serviço aborta trabalho saudável; com prazo maior, segura conexão morta ocupando slot. Regra de coerência: prazos se ordenam <strong>de fora para dentro</strong>, cliente acima do proxy acima do serviço acima do upstream, cada prazo com dono e número.</p>' },
        { tipo: 'callout', tom: 'danger', titulo: '"O proxy devolveu 502/504, então o serviço quebrou"', html:
          '<p>Não necessariamente. Erro na borda declara o ponto de vista da borda: o proxy desistiu de esperar, não viu o serviço morrer. A evidência está nos dois lados do relógio (quanto o proxy esperou contra quanto o serviço levou) e na fila entre eles. Culpar o serviço prescreve o conserto errado: escalar aplicação para prazo de borda, reescrever handler para fila do meio.</p>' },
        { tipo: 'ordene', id: 'prazos-ordene', titulo: 'A cadeia de prazos', obrigatorio: false,
          enunciado: 'Ordene os prazos do maior para o menor, de fora para dentro, como a regra de coerência pede.',
          itens: [
            { id: 'servico', texto: 'Prazo do serviço' },
            { id: 'cliente', texto: 'Deadline do cliente (dono da operação)' },
            { id: 'upstream', texto: 'Prazo da chamada ao upstream' },
            { id: 'proxy', texto: 'Prazo do reverse proxy para esperar o serviço' }
          ], solucao: ['cliente', 'proxy', 'servico', 'upstream'],
          tutorDepois: 'Qualquer inversão produz um dos dois desperdícios: abortar o que ia concluir ou sustentar o que já morreu.' },
        { tipo: 'takeaway', html: 'O significado <mark>sobrevive à versão</mark>; o custo, não. Erro de borda é o relógio da <mark>borda</mark>, não prova contra o serviço.' }
      ] },

      { rotulo: 'Pool: rode e observe', blocos: [
        { tipo: 'texto', html:
          '<h3>O recurso é contado: pools de conexão</h3>' +
          '<p><strong>Pool de conexões</strong> é o conjunto contado e reutilizável de conexões abertas contra um destino: em vez de abrir TCP e TLS a cada requisição, o cliente retira uma livre, usa e devolve. Quatro parâmetros: a <strong>conexão</strong> (contra qual destino, com qual custo de abertura); o <strong>tamanho</strong> (teto; acima dele, o pedido espera); a <strong>fila</strong> (onde os excedentes aguardam, em ordem de chegada); o <strong>timeout de aquisição</strong> (quanto um pedido espera antes de desistir com erro próprio, antes de qualquer byte viajar).</p>' +
          '<p><strong>Esgotamento</strong> é todos os slots ocupados e a fila crescendo até o prazo: latência em degrau e erros de aquisição, nunca erro do serviço, e o destino pode estar ocioso. A "correção" ingênua, aumentar o pool, transfere a pressão ao destino, que satura e devolve lentidão a todos. Dimensionar pool é declarar quanta concorrência o destino aguenta, não quanta o cliente deseja.</p>' },
        { tipo: 'rode', id: 'pool-rode', titulo: 'Três pedidos, dois slots', obrigatorio: false,
          enunciado: 'Um <code>PoolLocal</code> de tamanho 2 e prazo de aquisição de 0,5 s recebe três pedidos sem que ninguém libere. Rode e leia as estatísticas de cada passo (formato do contrato; tempos são exemplo variável).',
          prefixo: '$', entrada: 'python -c "from pool_local import *; p = PoolLocal(object, 2, 0.5); ..."', unidade: 's', terminalTitulo: 'lab/', etapas: etapasPool(),
          prever: { pergunta: 'O que acontece com o terceiro pedido?', opcoes: [
            { id: 'a', texto: 'O pool cria uma terceira conexão.', correta: false, porque: 'o teto é 2; acima dele, o pedido espera.' },
            { id: 'b', texto: 'Espera na fila até o prazo e desiste com PoolEsgotado, sem tocar a rede.', correta: true, porque: 'é o esgotamento: falha antes de qualquer byte viajar.' },
            { id: 'c', texto: 'Recebe erro do servidor de destino.', correta: false, porque: 'o destino nem foi contatado.' }
          ] },
          tutorAntes: 'Aperte Enter e depois clique em "Pedido 3" para ler o esgotamento.',
          tutorDepois: 'Esgotamento é evidência do cliente, não do destino: compare as estatísticas do pool com uma sonda direta ao destino antes de nomear o culpado.',
          callout: 'Você viu a aquisição excedente esperar até o prazo e o em_uso voltar ao patamar quando os slots são devolvidos.' },
        { tipo: 'codigo', linguagem: 'python', texto: refPool },
        { tipo: 'cenario', id: 'pool-cenario', titulo: 'Dobrar o pool?', obrigatorio: false,
          enunciado: 'Sob carga, a latência sobe em degrau e aparecem PoolEsgotado. O destino responde rápido a sondas diretas. Alguém propõe dobrar o pool.',
          inicio: 'inicio',
          nos: {
            inicio: { texto: 'O que você faz primeiro?', opcoes: [
              { texto: 'Dobrar o pool agora; depois a gente olha.', vai: 'f-dobra', tom: 'ruim', consequencia: 'a pressão vai para o destino, e o slot perdido continua perdido.' },
              { texto: 'Ler tamanho, livres e em_uso, durante e depois da carga.', vai: 'stats', tom: 'ok', consequencia: 'em_uso não volta ao patamar quando a carga cessa.' }
            ] },
            stats: { texto: 'Depois da carga, em_uso segue alto e o destino está ocioso. Qual a hipótese?', opcoes: [
              { texto: 'Corpo de resposta abandonado sem fechar em algum caminho, inclusive no de erro.', vai: 'f-bom', tom: 'ok', consequencia: 'fechar o corpo em todos os caminhos devolve o slot, e em_uso volta ao patamar.' },
              { texto: 'O destino está lento e precisa escalar.', vai: 'f-escala', tom: 'ruim', consequencia: 'a sonda direta já dizia que o destino responde rápido.' }
            ] }
          },
          finais: {
            'f-bom': { bom: true, texto: 'Corpo fechado em todos os caminhos, em_uso de volta ao patamar e o tamanho do pool declarado pelo que o destino aguenta.' },
            'f-dobra': { bom: false, texto: 'O degrau voltou mais alto dias depois, e o destino passou a saturar nos picos.' },
            'f-escala': { bom: false, texto: 'O destino ganhou réplicas ociosas, e o pool continuou esgotado.' }
          },
          callout: 'Você separou esgotamento de lentidão do destino e achou o slot perdido.' },
        { tipo: 'takeaway', html: 'Pool <mark>conta</mark> conexões: esgotamento é fila até o prazo, <mark>nunca erro do destino</mark>; corpo abandonado é vazamento com outro nome.' }
      ] },

      { rotulo: 'Deadline, cancelamento e retry', blocos: [
        { tipo: 'texto', html:
          '<h3>O tempo tem dono</h3>' +
          '<p><strong>Timeout por fase</strong> é o teto de cada etapa: adquirir slot, conectar, enviar, aguardar resposta, ler o corpo. Timeout único e infinito é falha catalogada: uma etapa presa segura as demais sem declarar onde, e o diagnóstico recebe "lento" sem fase, número ou dono. <strong>Deadline end-to-end</strong> é o teto da operação inteira; o <strong>orçamento por fase</strong> o divide entre as etapas, e cada fase recebe o menor entre seu orçamento e o restante do deadline. Prazo se divide <strong>de cima para baixo</strong>, nunca se soma de baixo para cima: quando cada camada escolhe seu timeout sem conhecer o teto, a soma estoura por construção e o retry multiplica o estouro.</p>' +
          '<h3>O não precisa viajar</h3>' +
          '<p><strong>Cancelamento</strong> é a propagação do "não precisa mais": o cliente desiste e o servidor precisa saber para interromper o trabalho e liberar slot, memória e upstream. Sem propagação, o servidor trabalha de graça para entregar resposta a ninguém. Aqui ele é <strong>cooperativo</strong>: o sinal marca, o trabalho verifica nos limites e interrompe onde é seguro, nunca à força no meio de uma escrita.</p>' +
          '<p><strong>Retry seguro</strong> exige três condições juntas: <strong>idempotência</strong> (POST e métodos desconhecidos nunca repetem), <strong>teto de tentativas</strong> declarado e <strong>prazo restante</strong>. Retry além do deadline é a tempestade catalogada: cada cópia estoura o teto e pede mais cópias.</p>' },
        { tipo: 'callout', tom: 'danger', titulo: '"Falhou, tenta de novo: tentar nunca piora"', html:
          '<p>Piora. Repetir requisição não idempotente duplica o efeito: duas cobranças, dois registros, dois envios. Repetir sem teto transforma um upstream lento em dez upstreams lentos simultâneos. Repetir sem prazo empilha trabalho morto sobre deadline estourado.</p>' },
        { tipo: 'python', id: 'retry-python', titulo: 'Simule retry com deadline', obrigatorio: false,
          enunciado: 'Complete <code>simular(deadline, timeout, retries, upstream, idempotente)</code>, em ms. Cada tentativa tem teto igual ao menor entre <code>timeout</code> e o que resta do deadline, e dura o menor entre esse teto e <code>upstream</code>; é sucesso se o upstream couber no teto. Repita só se for idempotente, se ainda houver retries (tentativas feitas menor ou igual a <code>retries</code>) e se restar prazo. O caso do simulador do bloco: deadline 3000, timeout 1000, 2 retries, upstream 2500.',
          codigo: codigoRetry, testes: testesRetry,
          dica: 'Calcule <code>teto = min(timeout, deadline - gasto)</code> no começo de cada volta e use-o no lugar do <code>timeout</code>. A condição de repetir junta os três freios com <code>and</code>.',
          solucao: solucaoRetry,
          tutorDepois: 'Com o upstream em 2500 ms e timeout de 1000 ms, nenhuma tentativa conclui: os retries só gastam o deadline inteiro. O conserto é o prazo coerente com o upstream, não mais retries.',
          callout: 'O retry respeita os três freios e nunca passa do deadline.' },
        { tipo: 'codigo', linguagem: 'python', texto: refDeadline },
        { tipo: 'transcript', id: 'retry-transcript', titulo: 'Ache as decisões que amplificam', obrigatorio: false, terminalTitulo: 'sessão: cliente de cobrança',
          enunciado: 'O agente ajusta um cliente HTTP de cobrança. Duas decisões violam as regras do bloco. Clique nelas e aperte Conferir.',
          linhas: [
            { quem: 'voce', texto: 'O POST /cobrancas às vezes estoura o prazo de 3 s. Deixe o cliente mais robusto.' },
            { quem: 'agente', texto: 'Adicionei retry automático de até 5 vezes no POST /cobrancas: tentar nunca piora.' },
            { quem: 'agente', texto: 'Também dividi o deadline de 3 s em orçamentos por fase (aquisição, conexão, espera e leitura), e cada fase recebe o menor entre o seu orçamento e o restante.' },
            { quem: 'ferramenta', texto: '$ pytest tests/test_cliente.py -q\n4 passed' },
            { quem: 'agente', texto: 'Para o caso de o cliente desistir, o handler do servidor mata a thread do trabalho à força assim que a conexão cai.' }
          ],
          erradas: [1, 4],
          explicacao: {
            1: 'POST não é idempotente: repetir pode cobrar duas vezes. E 5 tentativas sem checar o prazo restante viram tempestade.',
            4: 'Cancelamento é cooperativo: o sinal marca e o trabalho verifica nos limites, interrompendo onde é seguro. Matar a thread à força pode deixar escrita pela metade.'
          },
          tutorDepois: 'A divisão do deadline estava certa; os dois erros estavam em repetir o que não se repete e em interromper à força.' },
        { tipo: 'codigo', linguagem: 'python', texto: refCancel },
        { tipo: 'takeaway', html: 'Prazo se <mark>divide de cima para baixo</mark>; cancelamento <mark>coopera</mark> nos limites; retry só <mark>idempotente, no teto e com prazo</mark>.' }
      ] },

      { rotulo: 'Conferir e diagnosticar', blocos: [
        { tipo: 'escolha', id: 'b4-escolha-retry', titulo: 'Confira: três pedidos de repetição',
          pergunta: 'Três falhas pedem repetição: (1) POST sem chave; (2) GET dentro do prazo, com tentativas restantes; (3) PUT sem prazo restante. Quais podem repetir?',
          opcoes: [
            { id: 'a', texto: 'Só o GET: o POST não é idempotente e o PUT ficou sem prazo.', correta: true, porque: 'as três condições valem juntas: método no conjunto, tentativa abaixo do teto e restante acima de zero.' },
            { id: 'b', texto: 'GET e PUT, porque os dois são idempotentes.', correta: false, porque: 'sem prazo restante, nunca: o PUT empilharia trabalho morto.' },
            { id: 'c', texto: 'Os três: tentar nunca piora.', correta: false, porque: 'o POST pode duplicar o efeito, e o PUT estoura o deadline.' }
          ], tutorDepois: 'Faltando um dos três freios, repetir é amplificação.' },
        { tipo: 'escolha', id: 'b4-escolha-soma', titulo: 'Confira: fases dentro, operação fora',
          pergunta: 'Cada fase respeita o seu timeout e ainda assim a operação excede o limite contratado. De onde vem o estouro?',
          opcoes: [
            { id: 'a', texto: 'Da soma de timeouts independentes acima do deadline; o conserto é dividir o deadline de cima para baixo, com cada fase recebendo o menor entre orçamento e restante.', correta: true, porque: 'orçamentos que fecham no total impedem o estouro por construção.' },
            { id: 'b', texto: 'De um bug na aplicação; aumentar o deadline resolve.', correta: false, porque: 'aumentar o deadline esconde a soma incoerente.' },
            { id: 'c', texto: 'Do DNS lento.', correta: false, porque: 'cada fase cumpriu o seu teto; o problema é a soma.' }
          ], tutorDepois: 'Prazo se divide; não se soma.' },
        { tipo: 'escreva', id: 'b4-escreva', titulo: 'A operação que ninguém espera mais', obrigatorio: false,
          enunciado: 'O cliente desiste no meio de uma operação longa: o trabalho segue até o fim e entrega resposta a ninguém, com slot e upstream presos. Descreva a propagação cooperativa que evita o desperdício e o observável que a prova.',
          placeholder: 'Quando o cliente desiste, o servidor… O trabalho verifica… A prova é…',
          rubrica: [
            'Descreve o <strong>sinal marcado uma vez</strong> (idempotente) e propagado do cliente ao servidor.',
            'Diz que o trabalho <strong>verifica nos limites</strong> e interrompe onde é seguro, sem interrupção forçada.',
            'Nomeia o observável: <strong>trabalho interrompido e recursos liberados</strong> (slot, memória, upstream), sem resíduo.'
          ],
          modelo: '<p>Quando o cliente fecha a conexão ou o stream, o servidor marca um sinal de cancelamento, que vale para sempre depois de marcado. O trabalho longo verifica esse sinal antes e depois de cada etapa e a cada item produzido, e interrompe no primeiro limite seguro, nunca no meio de uma escrita. Na saída, devolve o slot do pool, libera memória e cancela a chamada ao upstream. A prova é observável: o trabalho para logo após o cancelamento, em_uso do pool volta ao patamar e não sobra chamada pendente ao upstream.</p>' },
        { tipo: 'texto', largo: true, html:
          '<h3>Tabela de diagnóstico</h3>' +
          '<table><thead><tr><th>Sintoma</th><th>Causa provável</th><th>Conserto</th></tr></thead><tbody>' +
          '<tr><td>Latência em degrau e aquisições falhando com o destino ocioso</td><td>Pool esgotado</td><td>Ler tamanho, livres e em_uso; distinguir fila de lentidão do destino; dimensionar pelo que o destino aguenta</td></tr>' +
          '<tr><td>Conexões não voltam ao patamar após a carga</td><td>Corpo de resposta abandonado sem fechar</td><td>Consumir ou fechar todo corpo em todos os caminhos, inclusive erro</td></tr>' +
          '<tr><td>Requisição "lenta" sem fase, número ou dono</td><td>Timeout único ou infinito</td><td>Prazos próprios para aquisição, conexão, envio, espera e leitura; registrar a fase do estouro</td></tr>' +
          '<tr><td>Fases dentro do teto, operação além do limite</td><td>Soma dos timeouts estoura o deadline</td><td>Dividir o deadline de cima para baixo; cada fase recebe o menor entre orçamento e restante</td></tr>' +
          '<tr><td>Proxy aborta trabalho saudável ou segura conexão morta</td><td>Prazos incoerentes na cadeia</td><td>Ordenar de fora para dentro, cada prazo com dono, a soma dentro do deadline do cliente</td></tr>' +
          '<tr><td>Servidor trabalha até o fim para resposta que ninguém recebe</td><td>Cancelamento não propagado</td><td>Verificar o sinal nos limites e liberar slot, memória e upstream</td></tr>' +
          '<tr><td>Pico de carga logo após a primeira falha, com efeitos duplicados</td><td>Retry de não idempotente ou sem teto</td><td>Restringir ao conjunto repetível, declarar teto e exigir prazo restante</td></tr>' +
          '<tr><td>Cada retentativa estoura o prazo e pede outra</td><td>Retry além do deadline</td><td>Checar o restante antes de cada tentativa; abortar sem prazo e registrar</td></tr>' +
          '</tbody></table>' },
        { tipo: 'callout', tom: 'neutral', titulo: 'Fontes e versões', html:
          '<p>HTTP Semantics e HTTP/1.1, HTTP/2, HTTP/3: normativas, consultadas em 14/08/2026 (risco baixo). Documentação do Python 3.14 (<code>http.client</code>, <code>urllib</code>, <code>http.server</code>, <code>threading</code>): oficial. Ponte M02A-B06/B08 para cancelamento e orçamentos. Waterfall de latência por fase e métricas do pool: construção da trilha, medidos na folha B04-L (revalidar em até 90 dias). Latências, prazos e contagens citados são exemplo variável.</p>' },
        { tipo: 'takeaway', html: 'Lenta pode ser <mark>pool esgotado</mark>, <mark>prazo mal dividido</mark> ou <mark>cancelamento ignorado</mark>: cada um tem sua evidência.' }
      ] }
    ]
  });
})();
