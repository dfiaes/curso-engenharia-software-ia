/* LT01 · Bloco 5: saturação, Little's Law e observabilidade do runtime. Fonte: LT01.html#b05. Degraus derivados pela Little's Law a partir dos valores do simulador do bloco (8 workers, 100 ms); demais números são exemplo variável. */
(function () {
  var L = function (kind, text) { return { kind: kind, text: text }; };
  function opc(id, texto, correta, porque) { return { id: id, texto: texto, correta: correta, porque: porque }; }

  var refCarga = `"""Carga e tempo: dois relógios, vazão, Little e breakdown local/upstream.
Referencia executavel do Bloco 5. So STDLIB (time).
Trabalho injetado pelo chamador; nenhuma rede, nenhum container.
"""
from __future__ import annotations
import time
from collections.abc import Callable

def medir_tempos[T](trabalho: Callable[[], T]) -> dict[str, float]:
    """Executa o trabalho uma vez; publica cpu_s (process_time) e parede_s (perf_counter)."""
    inicio_cpu = time.process_time()
    inicio_parede = time.perf_counter()
    trabalho()
    return {
        "cpu_s": time.process_time() - inicio_cpu,
        "parede_s": time.perf_counter() - inicio_parede,
    }

def taxa_vazao(concluidas: int, parede_s: float) -> float:
    """Conclusões por segundo; parede não positiva levanta ValueError."""
    if concluidas < 0:
        raise ValueError("concluidas não pode ser negativo")
    if not parede_s > 0:
        raise ValueError("parede_s precisa ser positiva")
    return concluidas / parede_s

def lei_little(vazao: float, latencia_s: float) -> float:
    """Concorrência média = vazão x latência; entradas negativas levantam ValueError."""
    if not vazao >= 0:
        raise ValueError("vazao não pode ser negativa")
    if not latencia_s >= 0:
        raise ValueError("latencia_s não pode ser negativa")
    return vazao * latencia_s

def dividir_latencias(local_s: float, upstream_s: float) -> dict[str, float]:
    """Breakdown do AT-042: publica local_s, upstream_s e total_s; negativos levantam ValueError."""
    if not local_s >= 0:
        raise ValueError("local_s não pode ser negativo")
    if not upstream_s >= 0:
        raise ValueError("upstream_s não pode ser negativo")
    return {"local_s": local_s, "upstream_s": upstream_s, "total_s": local_s + upstream_s}`;

  var refMemoria = `"""Memória RSS: residente atual, crescimento e veredito em três leituras.
Referencia executavel do Bloco 5. So STDLIB (os, resource).
POSIX: fora de plataforma com resource, indisponibilidade registrada.
Conversão ru_maxrss em bytes na semântica Linux documentada no contrato.
"""
from __future__ import annotations
import os
import resource

def rss_bytes() -> int:
    """Residente atual do processo em bytes (semântica Linux: ru_maxrss x 1024)."""
    _ = os.getpid()
    pico = resource.getrusage(resource.RUSAGE_SELF).ru_maxrss
    return int(pico) * 1024

def crescimento_bytes(antes: int, depois: int) -> int:
    """Diferença entre duas leituras; entradas negativas levantam ValueError."""
    if antes < 0 or depois < 0:
        raise ValueError("leituras de RSS não podem ser negativas")
    return depois - antes

def classificar_crescimento(baseline: int, pico: int, apos_limpeza: int, tolerancia: int) -> str:
    """Veredito do AT-041: 'vazamento', 'cache' ou 'baseline'.
    Pico alto que a limpeza reverte até a tolerância é cache;
    patamar que não volta até a tolerância é vazamento;
    o resto é baseline. Entradas negativas ou tolerância negativa: ValueError.
    """
    for valor in (baseline, pico, apos_limpeza):
        if valor < 0:
            raise ValueError("leituras de RSS não podem ser negativas")
    if tolerancia < 0:
        raise ValueError("tolerancia não pode ser negativa")
    if apos_limpeza > baseline + tolerancia:
        return "vazamento"
    if pico > baseline + tolerancia:
        return "cache"
    return "baseline"`;

  var refPercentis = `"""Percentis e cardinalidade: cauda resumida, custo contido.
Referencia executavel do Bloco 5. So STDLIB (threading).
Amostras em memória; guarda com teto declarado e recusa explícita.
"""
from __future__ import annotations
import math
import threading

def percentil(amostras: list[float], p: float) -> float:
    """Latência abaixo da qual cai p por cento das amostras.
    Ordena a cópia; p fora de [0, 100] ou lista vazia: ValueError.
    """
    if not amostras:
        raise ValueError("amostras vazia não tem percentil")
    if not 0 <= p <= 100:
        raise ValueError("p precisa estar em [0, 100]")
    ordenadas = sorted(amostras)
    if p == 0:
        return ordenadas[0]
    posicao = math.ceil(p / 100 * len(ordenadas)) - 1
    return ordenadas[max(0, min(posicao, len(ordenadas) - 1))]

def resumo(amostras: list[float]) -> dict[str, float]:
    """Publica contagem, p50, p95 e máximo para o oráculo AT-040."""
    return {
        "contagem": float(len(amostras)),
        "p50": percentil(amostras, 50),
        "p95": percentil(amostras, 95),
        "maximo": percentil(amostras, 100),
    }

class GuardaCardinalidade:
    """Teto declarado de séries; acima do teto, recusa sem expulsar.
    A chave da série é (nome, rótulos ordenados): path com segmento
    livre vira uma série por operação — a explosão do AT-050.
    """
    def __init__(self, teto: int) -> None:
        if teto < 1:
            raise ValueError("teto precisa ser ao menos 1")
        self._teto = teto
        self._series: set[tuple[str, tuple[tuple[str, str], ...]]] = set()
        self._recusadas = 0
        self._trava = threading.Lock()

    def registrar(self, nome: str, rotulos: dict[str, str]) -> bool:
        """True se a série cabe ou já existe; False se recusada pelo teto."""
        chave = (nome, tuple(sorted(rotulos.items())))
        with self._trava:
            if chave in self._series:
                return True
            if len(self._series) >= self._teto:
                self._recusadas += 1
                return False
            self._series.add(chave)
            return True

    def remover(self, nome: str, rotulos: dict[str, str]) -> None:
        """Remove a série problemática; diagnóstico das demais preservado."""
        chave = (nome, tuple(sorted(rotulos.items())))
        with self._trava:
            self._series.discard(chave)

    def contagem(self) -> int:
        """Séries distintas retidas no momento."""
        with self._trava:
            return len(self._series)

    def recusadas(self) -> int:
        """Total recusado pelo teto desde a criação."""
        with self._trava:
            return self._recusadas`;

  var etapasKnee = function () {
    return [
      { id: 'd50', nome: 'Degrau 50%', descricao: 'Oferta de 40 req/s', tom: 'dns', ms: 40, linhas: [
        L('info', 'capacidade = 8 workers / 0,1 s = 80 req/s'),
        L('out', 'throughput 40 req/s; concorrência L = 40 x 0,1 = 4 de 8 slots; sem fila'),
        L('hint', 'abaixo do joelho, o throughput acompanha a oferta')] },
      { id: 'd100', nome: 'Degrau 100%', descricao: 'Oferta de 80 req/s', tom: 'tcp', ms: 80, linhas: [
        L('out', 'throughput 80 req/s; concorrência L = 80 x 0,1 = 8 de 8 slots'),
        L('hint', 'slots cheios: qualquer rajada já espera')] },
      { id: 'd150', nome: 'Degrau 150%', descricao: 'Oferta de 120 req/s', tom: 'tls', ms: 80, linhas: [
        L('out', 'throughput continua em 80 req/s'),
        L('info', 'o excedente de 40 req/s vira fila; a latência sobe a cada segundo sem contrapressão'),
        L('hint', 'knee point: a oferta virou espera, não conclusão')] }
    ];
  };

  var codigoP = [
    'import math',
    '',
    '',
    'def percentil(amostras, p):',
    '    # nearest-rank: ordene a CÓPIA; posição = ceil(p/100 * n) - 1, presa em [0, n-1]',
    '    # p == 0 devolve o menor; lista vazia ou p fora de [0, 100] -> ValueError',
    '    return sum(amostras) / len(amostras)',
    '',
    '',
    'def classificar(baseline, pico, apos_limpeza, tolerancia):',
    '    # o veredito mora na terceira leitura:',
    '    # patamar após a limpeza acima de baseline + tolerancia -> "vazamento"',
    '    # senão, pico acima de baseline + tolerancia -> "cache"',
    '    # senão -> "baseline"',
    '    if pico > baseline + tolerancia:',
    '        return "vazamento"',
    '    return "baseline"',
    '',
    '',
    'lat = [100] * 97 + [1500] * 3',
    'print(percentil(lat, 50), percentil(lat, 95), sum(lat) / len(lat))'
  ].join("\n");
  var testesP = [
    'def test_media_esconde_a_cauda():',
    '    lat = [100] * 97 + [1500] * 3',
    '    assert percentil(lat, 50) == 100',
    '    assert percentil(lat, 95) == 100',
    '    assert percentil(lat, 98) == 1500',
    '    assert percentil(lat, 100) == 1500',
    '',
    '',
    'def test_cauda_de_seis_por_cento_aparece_no_p95():',
    '    lat = [100] * 94 + [1500] * 6',
    '    assert percentil(lat, 95) == 1500',
    '',
    '',
    'def test_nao_altera_a_entrada_e_valida():',
    '    lat = [3, 1, 2]',
    '    assert percentil(lat, 0) == 1 and lat == [3, 1, 2]',
    '    for ruim in ([], [1, 2]):',
    '        try:',
    '            percentil(ruim, 101 if ruim else 50)',
    '        except ValueError:',
    '            continue',
    '        assert False, "esperava ValueError"',
    '',
    '',
    'def test_tres_leituras():',
    '    assert classificar(100, 180, 150, 10) == "vazamento"',
    '    assert classificar(100, 180, 105, 10) == "cache"',
    '    assert classificar(100, 108, 104, 10) == "baseline"',
    '',
    '',
    'def test_controle_negativo_pico_sozinho_nao_acusa():',
    '    assert classificar(100, 900, 100, 10) == "cache"'
  ].join("\n");
  var solucaoP = [
    'import math',
    '',
    '',
    'def percentil(amostras, p):',
    '    if not amostras:',
    '        raise ValueError("amostras vazia não tem percentil")',
    '    if not 0 <= p <= 100:',
    '        raise ValueError("p precisa estar em [0, 100]")',
    '    ordenadas = sorted(amostras)',
    '    if p == 0:',
    '        return ordenadas[0]',
    '    posicao = math.ceil(p / 100 * len(ordenadas)) - 1',
    '    return ordenadas[max(0, min(posicao, len(ordenadas) - 1))]',
    '',
    '',
    'def classificar(baseline, pico, apos_limpeza, tolerancia):',
    '    if apos_limpeza > baseline + tolerancia:',
    '        return "vazamento"',
    '    if pico > baseline + tolerancia:',
    '        return "cache"',
    '    return "baseline"'
  ].join("\n");

  TrilhaAula.registrar({
    id: 'lt01-b5',
    titulo: 'Saturação, Little\'s Law e observabilidade do runtime',
    minutos: 50,
    resumo: 'Quando tudo dos Blocos 1 a 4 está certo e a API ainda degrada: qual recurso saturou primeiro, e qual número prova. Little\'s Law e knee point, dois relógios, RSS em três leituras, percentis, USE, golden signals e cardinalidade como custo.',
    objetivo: 'Explicar por que dobrar a carga parou de entregar throughput, separar vazamento de cache pela terceira leitura, ler p50 contra p95 e conter cardinalidade sem perder o diagnóstico.',
    revisao: [
      { id: 'lt01b5-little', pergunta: 'Concorrência média de 40 requisições em curso e latência média de 200 ms. Qual o throughput pela Little\'s Law?',
        opcoes: [
          opc('a', '200 req/s', true, 'L = λ × W, logo λ = L / W = 40 / 0,2 s; vale para médias em regime estável.'),
          opc('b', '8 req/s', false, 'multiplicou em vez de dividir.'),
          opc('c', '80 req/s', false, 'a conta é 40 dividido por 0,2.')] },
      { id: 'lt01b5-knee', pergunta: 'O throughput para de subir num degrau de carga e a latência começa a subir. Como ler?',
        opcoes: [
          opc('a', 'Knee point: um recurso saturou, e a conclusão nomeia o recurso com o relógio que o prova', true, 'acima do joelho, a oferta vira espera, não conclusão.'),
          opc('b', 'O código ficou lento de repente', false, 'o joelho é de um recurso, não do código em abstrato.'),
          opc('c', 'A média está errada', false, 'o problema é capacidade, não estatística.')] },
      { id: 'lt01b5-p95', pergunta: 'A média está boa, o p50 estável e o p95 sobe em degrau. Leitura?',
        opcoes: [
          opc('a', 'Contenção intermitente que atinge poucos (fila, loop em rajada, pool no limite); a média esconde a cauda', true, 'p50 e p95 subindo juntos indicaria degradação geral.'),
          opc('b', 'Não há problema: a média é boa', false, 'a média soma e divide; a cauda some nela.'),
          opc('c', 'O p50 deveria subir também', false, 'quando só a cauda sobe, a contenção é intermitente.')] },
      { id: 'lt01b5-rss', pergunta: 'Onde mora o veredito entre vazamento e cache?',
        opcoes: [
          opc('a', 'Na terceira leitura: patamar após a limpeza acima da tolerância é vazamento; pico que reverte é cache', true, 'pico alto sozinho não acusa nada; patamar que não volta acusa tudo.'),
          opc('b', 'No pico sob carga', false, 'pico é comportamento de cache.'),
          opc('c', 'Na memória virtual', false, 'virtual pode ser muito maior que o RSS sem nada errado.')] },
      { id: 'lt01b5-card', pergunta: 'Uma métrica ganhou o rótulo <code>user_id</code> e o backend ficou lento e caro. Problema e defesa?',
        opcoes: [
          opc('a', 'Cardinalidade explosiva; teto de séries, recusa explícita e remoção cirúrgica, preservando o diagnóstico com rótulos de baixa cardinalidade', true, 'cada valor de rótulo cria uma série; cardinalidade é custo.'),
          opc('b', 'Falta de CPU no serviço', false, 'quem degradou foi o observador.'),
          opc('c', 'Apagar a métrica inteira', false, 'apagão do instrumento perde o diagnóstico.')] }
    ],
    abas: [
      { rotulo: 'Little e o knee point', blocos: [
        { tipo: 'texto', html:
          '<p>Os Blocos 1 a 4 entregaram processo observado, filesystem confinado, caminho da conexão e conversa HTTP com pool, prazo e cancelamento. Este responde à pergunta que resta quando tudo isso está certo e a API ainda degrada: <strong>qual recurso saturou primeiro, e qual número prova</strong>. Todo exemplo é Python 3.14 só com stdlib (<code>time</code>, <code>os</code>, <code>resource</code>, <code>threading</code>).</p>' +
          '<h3>O trabalho tem três números</h3>' +
          '<p><strong>Throughput</strong> (vazão) é quantas operações concluem por segundo. <strong>Latência</strong> é quanto cada operação leva. <strong>Concorrência</strong> é quantas estão em curso ao mesmo tempo. <strong>Fila</strong> é onde a excedente espera por um slot: toda espera por recurso contado é fila, chame-se pool, backlog ou buffer.</p>' +
          '<p>A <strong>Little\'s Law</strong> amarra os três em regime estável: <code>L = λ × W</code>, concorrência média igual a throughput vezes latência média. Não prevê o futuro nem descreve transiente: vale para médias num intervalo em que entrada e saída se equilibram. O uso é inverso: medir dois números e derivar o terceiro.</p>' },
        { tipo: 'texto', largo: true, html:
          '<table><thead><tr><th>Termo</th><th>Definição e mecanismo</th><th>Limite</th></tr></thead><tbody>' +
          '<tr><td>Throughput</td><td>Conclusões dividido pelos segundos de parede do intervalo.</td><td>Conta conclusão, não tentativa: retry infla a entrada sem mover a saída.</td></tr>' +
          '<tr><td>Latência</td><td>Segundos por operação, do primeiro ao último evento observável.</td><td>Média resume, cauda acusa.</td></tr>' +
          '<tr><td>Concorrência</td><td>Operações em curso: trabalho mais fila. Derivada pela lei, não chutada.</td><td>Oferecer mais simultaneidade que o recurso aguenta converte folga em fila.</td></tr>' +
          '<tr><td>Knee point</td><td>O degrau onde o throughput para de subir e a latência passa a subir.</td><td>O joelho é do recurso que saturou primeiro: a conclusão nomeia o recurso, com o relógio que o prova.</td></tr>' +
          '<tr><td>Backpressure</td><td>O estágio saturado avisa o anterior para conter a entrada: fila limitada, recusa explícita, descarte com registro.</td><td>Sem contrapressão a fila cresce sem teto: aceitar sem limite é exaustão adiada.</td></tr>' +
          '</tbody></table>' },
        { tipo: 'rode', id: 'knee-rode', titulo: 'Suba a carga por degraus', obrigatorio: false,
          enunciado: 'Oito workers, 100 ms de serviço por requisição. Rode os três degraus e leia, em cada um, throughput, concorrência e fila (derivados pela Little\'s Law, sem medição).',
          prefixo: '$', entrada: 'degraus --workers 8 --servico-ms 100 --carga 50,100,150', unidade: 'req/s', terminalTitulo: 'carga por degraus', etapas: etapasKnee(),
          prever: { pergunta: 'No degrau de 150% (120 req/s oferecidas), qual é o throughput?', opcoes: [
            { id: 'a', texto: '120 req/s: o sistema acompanha a oferta.', correta: false, porque: 'acima da capacidade, a oferta não vira conclusão.' },
            { id: 'b', texto: '80 req/s: a capacidade; o excedente vira fila e latência.', correta: true, porque: 'capacidade = 8 / 0,1 s = 80 req/s.' },
            { id: 'c', texto: '40 req/s: o sistema desaba pela metade.', correta: false, porque: 'sem outra falha, a vazão fica na capacidade e a fila cresce.' }
          ] },
          tutorAntes: 'Aperte Enter e clique em "Degrau 150%" para ler o joelho.',
          tutorDepois: 'Um único ponto de carga não separa folga de saturação; por isso se sobe por degraus, e cada degrau publica carga, throughput, p95, erros e recursos.',
          callout: 'Você localizou o joelho em 80 req/s e viu a oferta excedente virar fila.' },
        { tipo: 'codigo', linguagem: 'python', texto: refCarga },
        { tipo: 'takeaway', html: '<mark>L = λ × W</mark>: acima do joelho, a oferta vira <mark>espera</mark>, não conclusão. Nomeie o recurso que saturou.' }
      ] },

      { rotulo: 'CPU, memória e exaustão', blocos: [
        { tipo: 'texto', html:
          '<h3>Dois relógios para um trabalho</h3>' +
          '<p><strong>Tempo de parede</strong> (wall-clock) é o que o relógio da sala marcaria, incluindo toda espera. <strong>Tempo de CPU</strong> é quanto o processador gastou executando o trabalho, sem a espera. Em Python, <code>time.perf_counter</code> mede a parede e <code>time.process_time</code> a CPU do processo. Parede muito acima da CPU é I/O-bound; os dois andando juntos é CPU-bound: a decisão do Bloco 1, agora com instrumento.</p>' +
          '<p><strong>Load average</strong> declara quantos processos estiveram prontos para rodar ou em espera ininterrupta, em média nos últimos 1, 5 e 15 minutos: um comprimento de fila, não um percentual. Load 4 em 4 CPUs é equilíbrio tenso; em 1 CPU, fila permanente. <strong>Throttling</strong> é o teto imposto de fora (quota de CPU do container que pausa o processo): CPU medida abaixo do esperado com latência subindo. Leia a quota antes de culpar o código. Nenhum dos dois é lido pelos scripts do lab, que só usam stdlib: aparecem como vocabulário do veredito.</p>' },
        { tipo: 'callout', tom: 'danger', titulo: '"CPU no teto, então o código é CPU-bound"', html:
          '<p>Nem sempre. Laço sem prazo, retry sem teto e fila de reprocessamento mantêm a CPU ocupada sem concluir nada: a CPU sobe, o throughput fica parado, e o gargalo real é espera convertida em giro. CPU alta com parede proporcional acusa conta; CPU alta com throughput parado e fila crescendo acusa giro sobre espera. Correlação temporal nunca é causa.</p>' },
        { tipo: 'texto', html:
          '<h3>Memória: RSS, virtual, vazamento contra cache</h3>' +
          '<p><strong>RSS</strong> (resident set size) é a memória física que o processo ocupa de fato. <strong>Memória virtual</strong> é o espaço de endereçamento reservado, que inclui mapeamentos não tocados e bibliotecas compartilhadas e pode ser ordens de magnitude maior sem nada errado. Em POSIX, <code>resource.getrusage</code> lê o pico de RSS do processo (<code>ru_maxrss</code>).</p>' +
          '<p>O procedimento tem três leituras: <strong>baseline</strong> (em repouso), <strong>pico</strong> (sob carga) e <strong>pós-limpeza</strong>. <strong>Vazamento</strong> é crescimento que a limpeza não reverte; <strong>cache</strong> é crescimento que a limpeza reverte até a tolerância. O veredito mora na terceira leitura.</p>' +
          '<p><strong>Exhaustion</strong> é decorada pelo mecanismo: CPU esgotada converte oferta em fila; memória esgotada converte alocação em erro ou morte pelo sistema; FD e socket recusam abertura nova (Bloco 2); pool falha na aquisição (Bloco 4); event loop saturado atrasa inocentes com CPU baixa (Bloco 1); upstream lento prende slot local e vira fila interna. A conclusão nomeia o primeiro recurso saturado, com o sinal que o prova e os demais declarados saudáveis.</p>' },
        { tipo: 'codigo', linguagem: 'python', texto: refMemoria },
        { tipo: 'callout', tom: 'neutral', titulo: 'Leia a referência com ceticismo', html:
          '<p>A docstring de <code>rss_bytes</code> diz "residente atual", mas <code>ru_maxrss</code> é o <em>pico</em> de residência do processo, como o próprio texto do bloco descreve. Pico nunca desce: a leitura pós-limpeza precisa de um instrumento de residente atual (por exemplo, <code>/proc/self/status</code> no Linux), ou o veredito vira "vazamento" sempre.</p>' },
        { tipo: 'cenario', id: 'upstream-cenario', titulo: 'O total degradou, o local não', obrigatorio: false,
          enunciado: 'A latência total da API degradou. O breakdown publica local baixo e upstream alto, lado a lado. A primeira reação do time é reescrever o handler.',
          inicio: 'inicio',
          nos: {
            inicio: { texto: 'O que o breakdown diz?', opcoes: [
              { texto: 'Que o código local está lento e precisa ser reescrito.', vai: 'f-reescreve', tom: 'ruim', consequencia: 'o local estava saudável; a reescrita não move o total.' },
              { texto: 'Que a espera externa está presa em slot local e virou fila interna: sintoma aqui, causa no upstream.', vai: 'mitiga', tom: 'ok', consequencia: 'sintoma e causa ficam separados.' }
            ] },
            mitiga: { texto: 'Como separar mitigação de correção?', opcoes: [
              { texto: 'Mitigar com prazo coerente e contenção da entrada (fila limitada, recusa explícita); corrigir no dono da lentidão, com o breakdown como evidência.', vai: 'f-bom', tom: 'ok', consequencia: 'o slot local deixa de ficar preso, e o dono do upstream recebe a prova.' },
              { texto: 'Aumentar o pool para o upstream e retry sem teto.', vai: 'f-tempestade', tom: 'ruim', consequencia: 'mais pressão sobre quem já está lento.' }
            ] }
          },
          finais: {
            'f-bom': { bom: true, texto: 'Prazo e contrapressão contiveram a fila local, e a correção foi pedida ao dono do upstream com o breakdown anexado.' },
            'f-reescreve': { bom: false, texto: 'Duas semanas de reescrita, o mesmo total degradado.' },
            'f-tempestade': { bom: false, texto: 'O upstream saturou de vez e arrastou outros clientes junto.' }
          },
          callout: 'Você separou sintoma local de causa externa e mitigou sem amplificar.' },
        { tipo: 'takeaway', html: 'O <mark>relógio duplo</mark> decide entre conta e giro; o <mark>patamar após a limpeza</mark> decide entre vazamento e cache.' }
      ] },

      { rotulo: 'Percentis, USE e cardinalidade', blocos: [
        { tipo: 'texto', html:
          '<h3>A média esconde a cauda</h3>' +
          '<p><strong>Percentil</strong> é a latência abaixo da qual cai uma fração das amostras: <strong>p50</strong> é a mediana; <strong>p95</strong> é o teto de 95%, e só uma em vinte operações foi mais lenta. A média soma e divide: dez respostas rápidas e uma catastrófica dão média saudável e um usuário sem resposta. O p95 ordena antes de resumir, e fila, retry e cabeça de fila moram nos piores.</p>' +
          '<p>Leitura: p50 parado com p95 subindo em degrau acusa <strong>contenção intermitente</strong> (fila que atinge poucos, loop bloqueado por rajadas, pool no limite). p50 e p95 subindo juntos acusam <strong>degradação geral</strong> (CPU saturada, upstream lento para todos, throttling). p95 oscilando sem carga correspondente acusa amostra pequena ou warm-up misturado: o conserto é método, não arquitetura.</p>' },
        { tipo: 'python', id: 'p95-python', titulo: 'Percentil e as três leituras', obrigatorio: false,
          enunciado: 'Complete <code>percentil(amostras, p)</code> pelo método nearest-rank do contrato (ordene a cópia; posição <code>ceil(p/100 × n) − 1</code>, presa ao intervalo; <code>p == 0</code> devolve o menor; lista vazia ou <code>p</code> fora de [0, 100] levanta <code>ValueError</code>) e <code>classificar(baseline, pico, apos_limpeza, tolerancia)</code> com o veredito da terceira leitura.',
          codigo: codigoP, testes: testesP,
          dica: 'Use <code>sorted(amostras)</code>, que não altera a lista original. No <code>classificar</code>, teste primeiro o patamar após a limpeza; só depois o pico.',
          solucao: solucaoP,
          tutorDepois: 'Repare no primeiro teste: com 3% de lentas, nem o p95 vê a cauda (ela fica acima dele) e só o p98 a mostra; com 6%, o p95 já acusa. A média de 142 ms não contaria nenhuma das duas histórias.',
          callout: 'Percentil e veredito de memória implementados como o contrato pede.' },
        { tipo: 'texto', html:
          '<h3>Observar por método</h3>' +
          '<p><strong>USE method</strong> (Brendan Gregg), recurso por recurso: <strong>Utilization</strong> (fração do tempo ocupado), <strong>Saturation</strong> (fila esperando pelo recurso) e <strong>Errors</strong>. Utilização sem saturação é folga ocupada; saturação sem utilização alta é espera por outro recurso; erro sem os dois é defeito lógico. <strong>Golden signals</strong> (Google SRE) olham o serviço por fora: latência (com a cauda), tráfego, erros e saturação. A ronda alterna os dois: o sinal dourado acusa o sintoma, o USE localiza o recurso, o breakdown separa local de externo.</p>' +
          '<p>As <strong>semânticas OTel</strong> (convenções do OpenTelemetry para sistema, processo e HTTP) dão nome estável a cada sinal. O bloco não versiona campo algum: convenções em desenvolvimento mudam e as fontes são de alto risco de obsolescência. O hábito congelado é cada número publicado declarar recurso, fase e instrumento.</p>' +
          '<h3>Cardinalidade é custo</h3>' +
          '<p><strong>Cardinalidade</strong> é quantas séries distintas uma métrica produz: cada combinação de nome e valores de rótulo é uma série armazenada e indexada. Rótulo com poucos valores (método, status, fase) multiplica por constante pequena; rótulo por operação (id de requisição, id de usuário, path com segmento livre, mensagem de erro) multiplica por cada operação. O primeiro sintoma é o observador degradando junto. A defesa tem duas metades: na escrita, a <strong>guarda</strong> (teto de séries, recusa explícita com contador, remoção cirúrgica, nunca apagão do instrumento); na modelagem, rótulos de baixa cardinalidade por construção.</p>' },
        { tipo: 'complete', id: 'rotulos-complete', titulo: 'Rotule sem explodir', obrigatorio: false, linguagem: 'python',
          enunciado: 'Escolha, em cada lacuna, o valor de rótulo que preserva o diagnóstico sem criar uma série por operação.',
          partes: [
            'guarda.registrar("http_server_duracao", {\n    "metodo": "GET",\n    "rota": ', { lacuna: 'rota', opcoes: ['"/pedidos/{id}"', '"/pedidos/8812"', 'req.url_completa'], correta: '"/pedidos/{id}"' },
            ',\n    "status": ', { lacuna: 'status', opcoes: ['"500"', 'str(erro)', 'traceback'], correta: '"500"' },
            ',\n    "fase": "upstream",\n    ', { lacuna: 'extra', opcoes: ['"balde": "1s-2s"', '"user_id": usuario.id', '"request_id": req.id'], correta: '"balde": "1s-2s"' },
            ',\n})\n'
          ],
          explicacao: 'Rota com template, código de status em vez da mensagem e balde em vez de valor contínuo têm poucos valores possíveis. Path bruto, texto de erro, id de usuário e id de requisição criam uma série por operação, sem amostra suficiente para percentil e com custo de armazenamento. O diagnóstico que sobrevive é o agregado bem rotulado: p95 por fase e desfecho.',
          callout: 'Rótulos de baixa cardinalidade, diagnóstico preservado.' },
        { tipo: 'codigo', linguagem: 'python', texto: refPercentis },
        { tipo: 'takeaway', html: 'O <mark>p95</mark> conta a cauda que a média esconde; <mark>cardinalidade é custo</mark>: teto, recusa explícita e remoção cirúrgica.' }
      ] },

      { rotulo: 'Conferir e diagnosticar', blocos: [
        { tipo: 'transcript', id: 'b5-transcript', titulo: 'Ache as conclusões sem número', obrigatorio: false, terminalTitulo: 'sessão: revisão de capacidade',
          enunciado: 'O agente revisa a saúde da API. Duas conclusões dele não se sustentam no que as ferramentas mostram. Clique nelas e aperte Conferir.',
          linhas: [
            { quem: 'voce', texto: 'Usuários reclamam de lentidão em horários de pico. Avalie.' },
            { quem: 'ferramenta', texto: '$ resumo latencias.json\n{"contagem": 2000, "media_ms": 140, "p50_ms": 95, "p95_ms": 1400}' },
            { quem: 'agente', texto: 'A média de 140 ms está ótima: o sistema está saudável e as reclamações são pontuais.' },
            { quem: 'ferramenta', texto: '$ rss --leituras\nbaseline 210 MB, pico 480 MB, pos_limpeza 215 MB (tolerância 10 MB)' },
            { quem: 'agente', texto: 'O pico de 480 MB prova um vazamento de memória; vamos caçar a referência retida.' },
            { quem: 'agente', texto: 'Antes de concluir, vou subir a carga por degraus e registrar throughput, p95, erros e recursos em cada um.' }
          ],
          erradas: [2, 4],
          explicacao: {
            2: 'p50 em 95 ms com p95 em 1400 ms é cauda degradada: contenção intermitente que atinge poucos. A média esconde essa cauda.',
            4: 'O patamar pós-limpeza (215 MB) está dentro da tolerância do baseline (210 + 10): é cache, não vazamento. Pico sozinho não acusa nada.'
          },
          tutorDepois: 'A última decisão do agente é a certa: degraus com os quatro números antes do veredito.' },
        { tipo: 'escolha', id: 'b5-escolha-cpu', titulo: 'Confira: CPU no teto, dois casos',
          pergunta: 'CPU no teto e throughput parado. Caso A: parede proporcional à CPU no trabalho nomeado. Caso B: parede muito acima da CPU, com fila e retry sem teto. Qual a prescrição?',
          opcoes: [
            { id: 'a', texto: 'A: paralelizar com processos (conta real). B: conter o giro com teto e prazo (espera convertida em giro).', correta: true, porque: 'o relógio duplo decide entre conta e giro.' },
            { id: 'b', texto: 'Os dois: mais réplicas.', correta: false, porque: 'no caso B, mais réplicas só multiplicam o giro sobre a espera.' },
            { id: 'c', texto: 'Os dois: aumentar o timeout.', correta: false, porque: 'timeout maior alimenta o giro do caso B e não toca a conta do A.' }
          ], tutorDepois: 'O relógio decide, não o teto de CPU.' },
        { tipo: 'escreva', id: 'b5-escreva', titulo: 'A ronda por fora e por dentro', obrigatorio: false,
          enunciado: 'Descreva a ronda que combina golden signals por fora com USE por dentro, e diga para onde desce cada achado: p95 alto com tráfego estável; erros concentrados num recurso; saturação sem utilização alta.',
          placeholder: 'Por fora, olho… Por dentro, recurso a recurso… p95 alto com tráfego estável aponta para…',
          rubrica: [
            'Ordena os golden signals (latência, tráfego, erros, saturação) no serviço e o USE (utilização, saturação, erros) por recurso.',
            'Mapeia p95 alto com tráfego estável a <strong>cauda</strong> (contenção que atinge poucos) e erros concentrados a <strong>falha localizada</strong> naquele recurso.',
            'Declara <strong>saturação sem utilização alta como espera por outro recurso</strong>, e usa o breakdown para separar local de externo.'
          ],
          modelo: '<p>Por fora, leio os golden signals: latência com p95, tráfego oferecido, taxa de erros e saturação. Eles acusam o sintoma. Por dentro, aplico o USE a cada recurso (CPU, memória, FD, pool, event loop): utilização, saturação e erros. p95 alto com tráfego estável é cauda: contenção intermitente, então procuro o recurso com saturação em rajadas. Erros concentrados num recurso são falha localizada ali. Saturação sem utilização alta é espera por outro recurso, por exemplo o pool cheio esperando um upstream lento; o breakdown local contra upstream confirma de quem é a espera.</p>' },
        { tipo: 'texto', largo: true, html:
          '<h3>Tabela de diagnóstico</h3>' +
          '<table><thead><tr><th>Sintoma</th><th>Causa provável</th><th>Conserto</th></tr></thead><tbody>' +
          '<tr><td>Throughput para de subir enquanto p95 e fila sobem em degrau</td><td>Knee point: primeiro recurso saturado</td><td>Declarar o degrau com os quatro números, nomear o recurso e fixar o limite de capacidade; nunca aumentar a oferta</td></tr>' +
          '<tr><td>CPU no teto, throughput parado, fila crescendo</td><td>Giro sobre espera, ou CPU-bound sem paralelismo</td><td>Medir os dois relógios; giro pede teto e prazo, conta pede processos</td></tr>' +
          '<tr><td>Latência sobe para todos com CPU abaixo do esperado</td><td>Throttling de quota</td><td>Ler a quota antes de culpar o código; dimensionar pela fração contratada</td></tr>' +
          '<tr><td>RSS sobe e nunca volta após a limpeza</td><td>Vazamento: referência retida</td><td>Comparar as três leituras, localizar o ciclo que eleva o patamar, confirmar baseline após a correção</td></tr>' +
          '<tr><td>Pico alto que volta ao patamar, tratado como vazamento</td><td>Cache confundido com leak</td><td>Aplicar a terceira leitura; dimensionar o cache com teto e expiração</td></tr>' +
          '<tr><td>Local saudável, total degradado; culpa no código próprio</td><td>Causa no upstream</td><td>Breakdown lado a lado; mitigar com prazo e contenção; corrigir no dono da lentidão</td></tr>' +
          '<tr><td>p95 degradado com p50 e média saudáveis</td><td>Cauda escondida pela média</td><td>Percentis com amostra e warm-up registrados; investigar o p95 contra a carga</td></tr>' +
          '<tr><td>Backend de observação lento, séries aos milhares</td><td>Cardinalidade explosiva</td><td>Remover a série pela guarda, preservar p95 por fase e desfecho, publicar séries antes e depois</td></tr>' +
          '</tbody></table>' },
        { tipo: 'callout', tom: 'neutral', titulo: 'Fontes e versões', html:
          '<p>OpenTelemetry (convenções de sistema, processo e HTTP): padrão aberto, risco alto, revalidar em até 90 dias. Google SRE (Monitoring, Handling Overload): canônica industrial, consultada em 14/08/2026. Brendan Gregg, USE Method: canônica. Documentação do Python 3.14 (<code>time</code>, <code>os</code>, <code>resource</code>): oficial. Little\'s Law, load average e RSS contra virtual: invariantes. Curvas, latências e contagens citadas são exemplo variável; os números observados nascem na folha B05-L.</p>' },
        { tipo: 'takeaway', html: 'Veredito sem <mark>percentil</mark> é palpite com gráfico; sem <mark>recurso nomeado</mark>, é correlação.' }
      ] }
    ]
  });
})();
