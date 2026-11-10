/* LT01 · Bloco 1: processo, thread, event loop, sinais e shutdown. Fonte: LT01.html#b01. Números de saída são exemplo variável (a medição pertence ao lab/). */
(function () {
  var L = function (kind, text) { return { kind: kind, text: text }; };
  function opc(id, texto, correta, porque) { return { id: id, texto: texto, correta: correta, porque: porque }; }

  var CMD = 'python -c "import asyncio, bloqueio_event_loop as b; print(asyncio.run(b.cenario_com_bloqueio(5.0)))"';
  var etapasLoop = function () {
    return [
      { id: 'coop', nome: 'Cooperativo', descricao: 'Duas tarefas com await asyncio.sleep(5)', tom: 'dns', ms: 5, linhas: [
        L('cmd', 'python -c "import asyncio, bloqueio_event_loop as b; print(asyncio.run(b.cenario_cooperativo(5.0)))"'),
        L('out', "{'tarefas': 2.0, 'relógio_s': 5.0}"),
        L('hint', 'exemplo variável: as duas esperas se sobrepõem; o conjunto dura pouco mais que uma tarefa')] },
      { id: 'bloq', nome: 'Com bloqueio', descricao: 'A usa time.sleep(5); B usa await asyncio.sleep(5)', tom: 'tcp', ms: 10, linhas: [
        L('info', 'A: time.sleep(5) pausa a thread; o loop fica parado de 0 a 5 s'),
        L('info', 'B: só começa a esperar quando o loop volta, em 5 s, e termina em 10 s'),
        L('hint', 'conjunto perto de 10 s e tarefas inocentes atrasadas (formato ilustrativo; a medição real é da folha B01-L)')] },
      { id: 'inocente', nome: 'Atraso da inocente', descricao: 'Medição do lab: tarefa de duração 0 atrás de time.sleep', tom: 'request', ms: 5, linhas: [
        L('cmd', CMD),
        L('out', "{'tarefas': 2.0, 'relógio_s': 5.0}"),
        L('hint', 'exemplo variável: a tarefa inocente (duração 0) só rodou depois que a espera bloqueante de 5 s terminou')] },
      { id: 'diag', nome: 'Sintoma em produção', descricao: 'Como o bloqueio aparece de fora', tom: 'response', ms: 1, linhas: [
        L('info', 'p95 de todas as rotas sobe em degrau, ao mesmo tempo'),
        L('info', 'CPU do worker baixa: a thread dorme, não computa'),
        L('info', 'nenhuma exceção nos logs'),
        L('hint', 'o degrau começa junto com o deploy que introduziu a chamada síncrona no caminho assíncrono')] }
    ];
  };

  var refLoop = `"""Bloqueio do event loop: time.sleep contra await.
Referencia executavel do Bloco 1. So STDLIB (asyncio, time).
"""
from __future__ import annotations
import asyncio
import time

async def tarefa_cooperativa(duracao: float, nome: str) -> str:
    """Cede o loop durante a espera; libera as demais tarefas."""
    await asyncio.sleep(duracao)
    return f"{nome}: cedeu o loop por {duracao}s"

def etapa_bloqueante(duracao: float) -> str:
    """Pausa a thread inteira; o loop fica parado junto."""
    time.sleep(duracao)
    return f"etapa sincrona de {duracao}s concluida"

async def cenario_cooperativo(duracao: float = 1.0) -> dict[str, float]:
    """Duas tarefas cooperativas; mede o tempo de relogio do conjunto."""
    inicio = time.monotonic()
    await asyncio.gather(
        tarefa_cooperativa(duracao, "a"),
        tarefa_cooperativa(duracao, "b"),
    )
    return {"tarefas": 2.0, "relógio_s": time.monotonic() - inicio}

async def cenario_com_bloqueio(duracao: float = 1.0) -> dict[str, float]:
    """Etapa bloqueante no meio do loop; mede o atraso da tarefa inocente."""
    inicio = time.monotonic()
    tarefa = asyncio.create_task(tarefa_cooperativa(0.0, "inocente"))
    etapa_bloqueante(duracao)  # o loop fica parado aqui; a inocente espera
    await tarefa
    return {"tarefas": 2.0, "relógio_s": time.monotonic() - inicio}`;

  var refShutdown = `"""Shutdown gracioso: fechar a entrada, cancelar, sair no prazo.
Referencia executavel do Bloco 1. So STDLIB (asyncio, signal).
Semantica POSIX; em Windows, SIGTERM nao tem o mesmo significado.
"""
from __future__ import annotations
import asyncio
import signal
from collections.abc import Callable

CODIGO_SAIDA_LIMPA = 0
CODIGO_SAIDA_INTERROMPIDA = 130

class Servidor:
    """Guarda o estado do shutdown: entrada aberta ou fechada."""
    def __init__(self) -> None:
        self.aceitando = True
        self.concluidas = 0
        self.canceladas = 0

    def fechar_entrada(self) -> None:
        """Passo 1: nenhum trabalho novo depois do sinal."""
        self.aceitando = False

    async def atender(self, duracao: float) -> str:
        """Trabalho cooperativo: responde a cancelamento."""
        if not self.aceitando:
            raise RuntimeError("entrada fechada: trabalho novo recusado")
        try:
            await asyncio.sleep(duracao)
        except asyncio.CancelledError:
            self.canceladas += 1
            raise
        self.concluidas += 1
        return "concluida"

async def desligar(servidor: Servidor, em_curso: set[asyncio.Task[object]], prazo: float) -> int:
    """Passos 2 e 3: cancela, aguarda ate o prazo, devolve o exit code."""
    servidor.fechar_entrada()
    for tarefa in em_curso:
        tarefa.cancel()
    decurso, pendentes = await asyncio.wait(em_curso, timeout=prazo)
    _ = (decurso, pendentes)
    return CODIGO_SAIDA_LIMPA

def instalar_handlers(loop: asyncio.AbstractEventLoop, ao_sinal: Callable[[], None]) -> None:
    """SIGTERM e SIGINT pedem shutdown; SIGKILL nao passa por aqui."""
    for numero in (signal.SIGTERM, signal.SIGINT):
        loop.add_signal_handler(numero, ao_sinal)`;

  var refZumbi = `"""Zombies e coleta: o filho morto aguarda o wait do pai.
Referencia executavel do Bloco 1. So STDLIB (os).
POSIX EXCLUSIVO: usa os.fork e os.waitpid, ausentes no Windows.
"""
from __future__ import annotations
import os

if not hasattr(os, "fork"):
    raise RuntimeError("coleta_zumbis exige POSIX (os.fork ausente nesta plataforma)")

def filho_que_termina(codigo: int) -> int:
    """No filho: termina com o codigo contratado. So retorna no pai."""
    pid = os.fork()
    if pid == 0:
        os._exit(codigo)
    return pid

def coletar(pid: int) -> int:
    """No pai: recolhe o exit code; so entao o zombie deixa de existir."""
    _, estado = os.waitpid(pid, 0)
    return os.waitstatus_to_exitcode(estado)

def demonstra() -> dict[str, int]:
    """Cria, aguarda a coleta e publica o codigo recolhido."""
    pid = filho_que_termina(3)
    codigo = coletar(pid)
    return {"pid_filho": pid, "exit_code_coletado": codigo}`;

  var codigoShut = [
    'def planejar_shutdown(restantes, grace, ignora_cancelamento=()):',
    '    # restantes: dict nome -> segundos que faltam para a requisição terminar',
    '    # 1. a entrada fecha (aceitando = False)',
    '    # 2. quem termina dentro do grace conclui; quem não cabe recebe cancelamento',
    '    # 3. cancelamento ignorado: o trabalho não sai e o SIGKILL chega no fim do grace',
    '    concluidas, canceladas, mortas = [], [], []',
    '    return {',
    '        "aceitando": True,',
    '        "concluidas": concluidas,',
    '        "canceladas": canceladas,',
    '        "mortas": mortas,',
    '        "saida": "limpa",',
    '    }',
    '',
    '',
    'r = planejar_shutdown({"relatorio": 12, "consulta": 2}, 30)',
    'print(r)'
  ].join("\n");
  var testesShut = [
    'def test_cabe_no_grace_conclui_tudo():',
    '    r = planejar_shutdown({"relatorio": 12, "consulta": 2}, 30)',
    '    assert r["concluidas"] == ["consulta", "relatorio"]',
    '    assert r["canceladas"] == [] and r["mortas"] == []',
    '    assert r["saida"] == "limpa"',
    '',
    '',
    'def test_entrada_fecha_sempre():',
    '    assert planejar_shutdown({}, 30)["aceitando"] is False',
    '    assert planejar_shutdown({"a": 99}, 30)["aceitando"] is False',
    '',
    '',
    'def test_borda_igual_ao_grace_conclui():',
    '    r = planejar_shutdown({"a": 30, "b": 31}, 30)',
    '    assert r["concluidas"] == ["a"]',
    '    assert r["canceladas"] == ["b"]',
    '',
    '',
    'def test_cancelamento_ignorado_vira_sigkill():',
    '    r = planejar_shutdown({"longo": 90}, 30, ignora_cancelamento=("longo",))',
    '    assert r["mortas"] == ["longo"] and r["canceladas"] == []',
    '    assert r["saida"] == "SIGKILL"',
    '',
    '',
    'def test_controle_negativo_curto_que_ignora_cancelamento_nao_morre():',
    '    r = planejar_shutdown({"curto": 3}, 30, ignora_cancelamento=("curto",))',
    '    assert r["concluidas"] == ["curto"] and r["mortas"] == []',
    '    assert r["saida"] == "limpa"'
  ].join("\n");
  var solucaoShut = [
    'def planejar_shutdown(restantes, grace, ignora_cancelamento=()):',
    '    concluidas, canceladas, mortas = [], [], []',
    '    for nome in sorted(restantes):',
    '        if restantes[nome] <= grace:',
    '            concluidas.append(nome)',
    '        elif nome in ignora_cancelamento:',
    '            mortas.append(nome)',
    '        else:',
    '            canceladas.append(nome)',
    '    return {',
    '        "aceitando": False,',
    '        "concluidas": concluidas,',
    '        "canceladas": canceladas,',
    '        "mortas": mortas,',
    '        "saida": "SIGKILL" if mortas else "limpa",',
    '    }'
  ].join("\n");

  TrilhaAula.registrar({
    id: 'lt01-b1',
    titulo: 'Processo, thread, event loop, sinais e shutdown',
    minutos: 45,
    resumo: 'Trocar "o servidor caiu" por processo observado, sinal compreendido e shutdown medido: quem troca de tarefa, o que cada sinal entrega, em que ordem a API sai e por que zombies se acumulam.',
    objetivo: 'Explicar o que acontece entre o SIGTERM e o exit code, diagnosticar loop travado por chamada bloqueante e shutdown que perde requisição, e decidir processo contra thread pelo tipo de trabalho.',
    revisao: [
      { id: 'lt01b1-loop', pergunta: 'Um <code>async def</code> chama <code>time.sleep(5)</code>. O que acontece com as outras requisições do mesmo worker?',
        opcoes: [
          opc('a', 'Ficam paradas por 5 s: a thread do loop dorme e o loop para junto, sem exceção e com CPU baixa', true, '<code>time.sleep</code> pausa a thread; <code>await asyncio.sleep</code> devolve o controle ao loop.'),
          opc('b', 'Só a coroutine que dormiu fica parada', false, 'o loop executa uma coroutine por vez na sua thread; sem <code>await</code>, ninguém mais anda.'),
          opc('c', 'Nada: cada coroutine tem a sua thread', false, 'coroutine mora dentro de uma thread e só troca em <code>await</code>.')] },
      { id: 'lt01b1-sinais', pergunta: 'O que diferencia SIGTERM de SIGKILL do ponto de vista do programa?',
        opcoes: [
          opc('a', 'SIGTERM entrega um pedido e depende de cooperação; SIGKILL remove o processo sem handler nem cleanup', true, 'por isso o orquestrador pede primeiro e só impõe depois do grace period.'),
          opc('b', 'SIGKILL pode ser tratado por handler, SIGTERM não', false, 'é o contrário: SIGKILL não entrega nada ao programa.'),
          opc('c', 'Ambos garantem a integridade dos dados', false, 'SIGKILL garante o término, nenhuma integridade.')] },
      { id: 'lt01b1-ordem', pergunta: 'Qual é o primeiro passo do shutdown cooperativo depois do SIGTERM?',
        opcoes: [
          opc('a', 'Fechar a entrada: parar de aceitar trabalho novo', true, 'toda requisição aceita depois do sinal disputa o grace period e pode ser cortada pelo SIGKILL.'),
          opc('b', 'Cancelar tudo que está em curso', false, 'vem depois; antes é preciso parar a chegada de trabalho novo.'),
          opc('c', 'Sair com exit code 0 o mais cedo possível', false, 'sair é o último passo, depois de concluir ou cancelar e descarregar.')] },
      { id: 'lt01b1-cpu', pergunta: 'Um endpoint CPU-bound recebe mais threads e o throughput para no teto com a latência subindo. Qual a prescrição?',
        opcoes: [
          opc('a', 'Processos: thread resolve espera, não conta', true, 'mais threads que núcleos num laço de cálculo só somam troca de contexto e contenção.'),
          opc('b', 'Ainda mais threads', false, 'é o erro que o sintoma denuncia.'),
          opc('c', 'Aumentar o timeout', false, 'o gargalo é CPU disputada, não espera.')] },
      { id: 'lt01b1-zombie', pergunta: 'Centenas de entradas <code>&lt;defunct&gt;</code> crescem no container cujo PID 1 lança helpers. Mecanismo e defesa?',
        opcoes: [
          opc('a', 'Zombies: filhos mortos cujo exit code ninguém coletou; o PID 1 deve fazer wait ou o container usar um init que colete', true, 'só o wait do pai libera a entrada; órfãos são adotados pelo PID 1.'),
          opc('b', 'Vazamento de memória nos helpers; reiniciar', false, 'zombie não consome memória de trabalho, consome vaga na tabela de processos.'),
          opc('c', 'Threads travadas; subir o ulimit', false, 'não são threads, e subir o limite só adia a tabela cheia.')] }
    ],
    abas: [
      { rotulo: 'Processo, thread, loop', blocos: [
        { tipo: 'texto', html:
          '<p>Este bloco troca "o servidor caiu" por <strong>processo observado, sinal compreendido e shutdown medido</strong>. Pré-requisitos: M02 (Python) e M03 (serviço HTTP com ciclo de vida); a cancelação cooperativa do M02A é usada, não reensinada. Todo exemplo é Python 3.14. Fork, exec e sinais são POSIX (Linux); no Windows <code>os.fork</code> não existe e sinais não têm o mesmo significado, então o caminho reproduzível é um Linux real (container ou WSL).</p>' +
          '<h3>O que é um processo</h3>' +
          '<p><strong>Processo</strong> é um programa em execução com identidade, memória e recursos próprios. O programa é o arquivo no disco; o processo é o que o sistema cria para executá-lo, com um número de identidade (PID), memória reservada e uma tabela de recursos abertos. Dois processos do mesmo programa não compartilham memória.</p>' +
          '<p>Todo processo nasce de outro, em dois passos. <strong>fork</strong> duplica o processo atual: cria um filho quase idêntico, com PID novo, que continua da mesma instrução. <strong>exec</strong> substitui o programa na memória do processo atual por outro, mantendo o PID. Só fork serve para delegar; fork seguido de exec serve para virar outro programa. Em Python, <code>subprocess</code> encapsula os dois ao lançar um programa externo; <code>os.fork</code> expõe o primeiro diretamente (só POSIX).</p>' },
        { tipo: 'texto', largo: true, html:
          '<table><thead><tr><th>Termo</th><th>Definição e mecanismo</th><th>Limite</th></tr></thead><tbody>' +
          '<tr><td>PID / PPID</td><td>PID identifica o processo; PPID é o PID do pai, que o criou. Todos formam uma árvore: cada processo tem um pai, exceto o primeiro.</td><td>PIDs são reciclados. Diagnóstico sério ancora o PID com instante e comando, nunca o número sozinho.</td></tr>' +
          '<tr><td>Exit code</td><td>Inteiro devolvido ao terminar: 0 declara sucesso, diferente de 0 declara falha. O pai lê esse número.</td><td>Não explica a causa. Só 0 como sucesso é universal; o resto é convenção do programa.</td></tr>' +
          '<tr><td>stdin / stdout / stderr</td><td>Fluxos padrão herdados do pai: entrada (0), saída (1) e erro (2). Redirecionar é trocar para onde cada número aponta.</td><td>São fluxos de bytes com buffer: a saída pode ficar retida e nunca aparecer se o processo morrer antes de descarregar.</td></tr>' +
          '<tr><td>Foreground / background</td><td>Foreground recebe o teclado do terminal. Background roda sem o teclado, mas segue recebendo sinais e escrevendo nos fluxos.</td><td>Background não isola nada: o processo morre com o terminal se for filho dele. Em produção, o lançador é o gerenciador do container ou do serviço.</td></tr>' +
          '<tr><td>PID 1</td><td>O primeiro processo do sistema e, num container, o primeiro do container. Adota os órfãos (filhos cujo pai morreu).</td><td>Se não coleta os adotados, eles viram zombies permanentes. A escolha do PID 1 é decisão de engenharia.</td></tr>' +
          '</tbody></table>' },
        { tipo: 'callout', tom: 'info', titulo: 'Isolamento é o preço e o produto', html:
          '<p>Memória separada por processo é o que mantém o serviço íntegro quando um worker morre no meio de uma requisição: o erro fica contido. O preço aparece no resto da trilha: processos não compartilham nada por padrão, então coordenar trabalho entre eles exige mecanismo explícito (fila, socket, arquivo), e observá-los de fora exige instrumento do sistema (<code>/proc</code>, Bloco 2), não leitura de variável.</p>' },
        { tipo: 'texto', html:
          '<h3>Processo, thread, coroutine</h3>' +
          '<p>Os três executam código; diferem no que compartilham e em quem decide a troca. <strong>Processo</strong> tem memória própria. <strong>Thread</strong> mora dentro de um processo e compartilha a memória dele: é mais barata de criar e corrompe o estado alheio com a mesma facilidade. <strong>Coroutine</strong> (<code>async def</code>) mora dentro de uma thread e só troca de tarefa em pontos explícitos de <code>await</code>.</p>' +
          '<p>Quem troca processo e thread é o <strong>scheduler</strong> do sistema operacional, que interrompe e retoma sem pedir licença (preempção). Quem troca coroutine é o <strong>event loop</strong>: um laço, dentro da sua thread, que executa cada coroutine até ela devolver o controle num <code>await</code> e passa à próxima pronta. O adjetivo que importa é <em>cooperativo</em>: o loop só anda se cada tarefa colaborar. Uma tarefa que nunca alcança um <code>await</code>, porque chama algo que bloqueia de verdade, segura o loop inteiro.</p>' +
          '<h3>CPU-bound contra I/O-bound</h3>' +
          '<p><strong>I/O-bound</strong> passa a maior parte do tempo esperando (banco, upstream, disco, rede). <strong>CPU-bound</strong> passa a maior parte computando (serialização pesada, compressão, cálculo, inferência local). A classificação é do gargalo, não do programa: a mesma API é I/O-bound na leitura e CPU-bound no endpoint de relatório.</p>' },
        { tipo: 'texto', largo: true, html:
          '<table><thead><tr><th>Trabalho</th><th>Escolha</th><th>Por quê</th></tr></thead><tbody>' +
          '<tr><td>I/O-bound com muitas conexões</td><td>Coroutines num event loop, ou threads</td><td>Enquanto uma tarefa espera a rede, outra usa a CPU. Coroutine é a mais barata por conexão; thread serve quando a biblioteca bloqueia e não tem versão assíncrona.</td></tr>' +
          '<tr><td>CPU-bound que precisa de várias CPUs</td><td>Processos</td><td>Memória separada elimina disputa pelo estado e escala por núcleo. O preço é a coordenação explícita.</td></tr>' +
          '<tr><td>Misto (a API típica da trilha)</td><td>Event loop para o I/O + processos workers</td><td>Cada worker atende muitas conexões cooperativamente; vários workers ocupam vários núcleos e isolam falhas.</td></tr>' +
          '</tbody></table>' },
        { tipo: 'callout', tom: 'danger', titulo: '"É CPU-bound, então jogo mais threads"', html:
          '<p>Não. Thread divide memória e núcleos, mas não multiplica velocidade quando o gargalo é CPU disputada com travas: mais threads que núcleos num laço de cálculo só adiciona troca de contexto e contenção. O sintoma que denuncia o erro: CPU no teto, throughput parado, latência subindo a cada thread nova. <strong>Thread resolve espera, não conta.</strong></p>' },
        { tipo: 'takeaway', html: 'Processo <mark>isola</mark>, thread <mark>divide memória</mark>, coroutine <mark>coopera</mark>; escolha pelo gargalo: espera pede loop ou thread, conta pede processo.' }
      ] },

      { rotulo: 'Event loop: rode e observe', blocos: [
        { tipo: 'texto', html:
          '<h3>time.sleep contra await</h3>' +
          '<p>O loop executa uma coroutine por vez na sua thread. Quando ela chega a <code>await asyncio.sleep(5)</code>, diz ao loop "nada a fazer pelos próximos 5 segundos, atenda as outras": o loop registra o despertar e passa adiante. Quando outra coroutine chama <code>time.sleep(5)</code>, a função síncrona que pausa a thread inteira, não há mensagem alguma ao loop: a thread dorme, o loop dorme junto e todas as conexões daquele worker esperam os mesmos 5 segundos. Nenhum erro é levantado; o sintoma é latência.</p>' },
        { tipo: 'codigo', linguagem: 'python', texto: [
          'import asyncio',
          'import time',
          '',
          'async def cooperativo() -> None:',
          '    await asyncio.sleep(5)  # devolve o controle; o loop atende outras tarefas',
          '',
          'async def bloqueante() -> None:',
          '    time.sleep(5)  # pausa a thread; o loop inteiro fica parado 5 s'].join('\n') },
        { tipo: 'texto', html:
          '<p>Abaixo, o contraste e a medição da referência <code>lab/bloqueio_event_loop.py</code> (código completo logo depois). Os números são <strong>exemplo variável</strong>: a medição real pertence à folha B01-L do laboratório.</p>' },
        { tipo: 'rode', id: 'loop-rode', titulo: 'Mesma duração, loop diferente', obrigatorio: false,
          enunciado: 'Rode as etapas em ordem. Compare o relógio do conjunto e leia o que o bloqueio faz com a tarefa inocente.',
          prefixo: '$', entrada: CMD, unidade: 's', terminalTitulo: 'lab/', etapas: etapasLoop(),
          prever: { pergunta: 'Duas tarefas de 5 s, mas uma delas chama time.sleep em vez de await asyncio.sleep. Quanto dura o conjunto?', opcoes: [
            { id: 'a', texto: 'Cerca de 5 s: as duas esperas ainda se sobrepõem.', correta: false, porque: 'só se sobrepõem quando as duas devolvem o controle ao loop; time.sleep não devolve.' },
            { id: 'b', texto: 'Cerca de 10 s: a espera bloqueante é serializada e atrasa as tarefas inocentes.', correta: true, porque: 'a thread dorme e o loop dorme junto; a outra tarefa só começa depois.' },
            { id: 'c', texto: 'O programa falha com uma exceção de loop bloqueado.', correta: false, porque: 'nenhum erro é levantado; o sintoma é latência com CPU baixa.' }
          ] },
          tutorAntes: 'Aperte Enter para rodar e depois clique em cada etapa para ler só as linhas dela.',
          tutorDepois: 'O sintoma completo: p95 em degrau para todas as rotas, CPU baixa, nenhuma exceção. A correção é tirar a chamada bloqueante do loop (thread dedicada ou alternativa assíncrona), nunca aumentar timeout.',
          callout: 'Você viu a espera bloqueante esticar o conjunto e o sintoma que ela deixa de fora.' },
        { tipo: 'callout', tom: 'info', titulo: 'Como reconhecer o loop bloqueado', html:
          '<p>Latência p95 sobe em degrau para <em>todas</em> as rotas ao mesmo tempo, a CPU do worker fica baixa e nenhuma exceção aparece. A confirmação vem da correlação: o degrau começa com o deploy que introduziu a chamada síncrona no caminho assíncrono. O oráculo do lab cobra os dois lados: reproduzir a degradação e mostrar a correção.</p>' },
        { tipo: 'codigo', linguagem: 'python', texto: refLoop },
        { tipo: 'escolha', id: 'loop-escolha', titulo: 'Confira: a rota lenta que derruba todas', obrigatorio: false,
          pergunta: 'Depois de um deploy, o p95 de todas as rotas sobe em degrau, a CPU do worker está baixa e não há exceções. Qual é a hipótese mais forte?',
          opcoes: [
            { id: 'a', texto: 'Chamada bloqueante (por exemplo <code>time.sleep</code> ou I/O síncrono) introduzida no caminho assíncrono.', correta: true, porque: 'a thread dorme, o loop para junto: todas as rotas degradam e a CPU fica baixa. Confirme pela correlação com o deploy.' },
            { id: 'b', texto: 'CPU saturada: falta capacidade, aumente as réplicas.', correta: false, porque: 'CPU baixa descarta saturação de CPU como causa.' },
            { id: 'c', texto: 'Rede instável com o upstream: aumente o timeout.', correta: false, porque: 'aumentar timeout esconde o sintoma; a degradação de todas as rotas aponta para o loop.' }
          ], tutorDepois: 'Todas as rotas juntas, CPU baixa, sem exceção: loop bloqueado até prova em contrário.' },
        { tipo: 'takeaway', html: '<mark>time.sleep</mark> para o loop inteiro; <mark>await</mark> o libera. O sintoma é degrau de latência em todas as rotas com CPU baixa.' }
      ] },

      { rotulo: 'Sinais e shutdown', blocos: [
        { tipo: 'texto', html:
          '<h3>Sinais: SIGINT, SIGTERM, SIGKILL</h3>' +
          '<p><strong>Sinal</strong> é uma notificação numerada que o sistema entrega a um processo: não carrega dados, carrega um pedido ("interrompa", "termine"). O processo pode registrar um <strong>handler</strong>, função que roda quando o sinal chega; sem handler vale a disposição padrão (terminar, ignorar ou pausar). Em Python, o módulo <code>signal</code> registra handlers; em asyncio a entrega precisa ser reconciliada com o loop (a referência <code>shutdown_gracioso.py</code> usa <code>loop.add_signal_handler</code>).</p>' },
        { tipo: 'texto', largo: true, html:
          '<table><thead><tr><th>Sinal</th><th>Quem envia</th><th>Mecanismo</th><th>Garantia</th></tr></thead><tbody>' +
          '<tr><td>SIGINT</td><td>Teclado ou equivalente</td><td>Entrega o pedido; o programa pode tratar, e o tratamento padrão termina o processo</td><td>Só a entrega: o handler pode ignorar</td></tr>' +
          '<tr><td>SIGTERM</td><td>Orquestrador, gerenciador do container, deploy novo</td><td>Entrega o pedido de encerramento; quem instalou handler faz o shutdown gracioso e sai</td><td>Só a entrega: o término depende da cooperação</td></tr>' +
          '<tr><td>SIGKILL</td><td>Orquestrador após esgotar o grace period, ou operador</td><td>O sistema remove o processo sem entregar nada: nenhum handler, nenhum cleanup</td><td>Término certo, integridade nenhuma</td></tr>' +
          '</tbody></table>' },
        { tipo: 'callout', tom: 'danger', titulo: '"Não terminou? SIGKILL de primeira"', html:
          '<p>Não. SIGKILL como primeira opção troca um problema visível (processo lento para sair) por <strong>corrupção silenciosa</strong>: requisição respondida pela metade, arquivo escrito pela metade, transação sem confirmação nem rollback limpo, conexão abandonada que o outro lado só descobre por timeout. O lento para sair é sintoma com causa (handler ausente, grace curto, trabalho que ignora cancelamento), e cada causa tem conserto. SIGKILL é o último recurso do orquestrador, depois do grace period.</p>' },
        { tipo: 'texto', html:
          '<h3>Grace period e shutdown cooperativo</h3>' +
          '<p><strong>Grace period</strong> é o intervalo que o orquestrador concede entre o SIGTERM e o SIGKILL: o tempo contratado para o processo sair sozinho. O <strong>shutdown cooperativo</strong> usa esse tempo em ordem fixa:</p>' +
          '<ol><li><strong>Parar de aceitar trabalho novo.</strong> Fechar a escuta e devolver "encerrando" antes de qualquer outra coisa. Cada requisição aceita depois do SIGTERM é uma que o SIGKILL vai matar.</li>' +
          '<li><strong>Encerrar ou cancelar o trabalho em curso.</strong> Requisições curtas terminam; trabalho longo recebe cancelamento cooperativo (o mecanismo do M02A) e libera recursos. Handler que ignora cancelamento deixa o grace escorrer sem que nada termine.</li>' +
          '<li><strong>Descarregar e sair com o exit code esperado.</strong> Fechar conexões, descarregar buffers, devolver 0 se foi limpo. Deploy que termina em SIGKILL registra a morte, não a saída.</li></ol>' +
          '<p>Timeline ilustrativa: no instante zero chega o SIGTERM; a API fecha a escuta e marca o deadline interno (por exemplo, grace de 30 s contratado com o orquestrador); as requisições breves concluem nos primeiros segundos; o trabalho longo é cancelado; no fim do prazo, o processo sai com o exit code esperado. A folha B01-L registra a timeline real.</p>' },
        { tipo: 'ordene', id: 'shut-ordene', titulo: 'Ponha o shutdown na ordem', obrigatorio: false,
          enunciado: 'O SIGTERM acaba de chegar. Ordene o que a API faz, do primeiro ao último passo.',
          itens: [
            { id: 'cancelar', texto: 'Cancelar o trabalho longo que não cabe no grace period e liberar seus recursos' },
            { id: 'sair', texto: 'Descarregar buffers, fechar conexões e sair com o exit code contratado' },
            { id: 'handler', texto: 'Handler de SIGTERM roda e marca o deadline interno dentro do grace period' },
            { id: 'fechar', texto: 'Fechar a escuta: recusar trabalho novo com resposta de "encerrando"' },
            { id: 'concluir', texto: 'Deixar as requisições breves concluírem normalmente' }
          ], solucao: ['handler', 'fechar', 'concluir', 'cancelar', 'sair'],
          tutorDepois: 'A entrada fecha antes de qualquer decisão sobre o trabalho em curso; sem isso, o trabalho nunca para de chegar.' },
        { tipo: 'cenario', id: 'shut-cenario', titulo: 'O deploy que mata a cauda', obrigatorio: false,
          enunciado: 'A API tem grace period de 30 s. A cada deploy, a maioria das requisições passa e algumas, as mais longas, morrem no meio. Decida o conserto e veja o custo.',
          inicio: 'inicio',
          nos: {
            inicio: { texto: 'O serviço não instala handler de SIGTERM. O time propõe três saídas. Qual você adota?', opcoes: [
              { texto: 'Mandar SIGKILL direto no processo antigo para acelerar a rolagem.', vai: 'f-kill', tom: 'ruim', consequencia: 'troca o processo lento por corrupção silenciosa: nada roda, nada é limpo.' },
              { texto: 'Aumentar o timeout dos clientes para absorver a cauda.', vai: 'f-timeout', tom: 'ruim', consequencia: 'esconde o sintoma; a requisição cortada continua sendo cortada.' },
              { texto: 'Instalar handlers de SIGTERM e SIGINT e desenhar o shutdown em ordem.', vai: 'ordem', tom: 'ok', consequencia: 'o pedido do orquestrador passa a ser ouvido.' }
            ] },
            ordem: { texto: 'O handler existe. O que ele faz primeiro?', opcoes: [
              { texto: 'Fecha a escuta para tráfego novo e marca o deadline interno; depois conclui o breve e cancela o longo.', vai: 'cancel', tom: 'ok', consequencia: 'o trabalho em curso deixa de crescer e o prazo passa a ser medido.' },
              { texto: 'Cancela tudo e só então fecha a entrada.', vai: 'f-ordem', tom: 'ruim', consequencia: 'entre o cancelamento e o fechamento, requisições novas entram e disputam o grace.' }
            ] },
            cancel: { texto: 'O trabalho longo é um relatório de 90 s que ignora o cancelamento. O que você faz?', opcoes: [
              { texto: 'Tornar o trabalho cancelável (propagar CancelledError, liberar recursos) e medir contra o deadline interno.', vai: 'f-bom', tom: 'ok', consequencia: 'o cancelamento é ouvido e o processo sai antes do SIGKILL.' },
              { texto: 'Deixar como está: o SIGKILL ao fim do grace resolve.', vai: 'f-kill2', tom: 'ruim', consequencia: 'o relatório morre no estado em que estava, e o grace inteiro foi desperdiçado.' }
            ] }
          },
          finais: {
            'f-bom': { bom: true, texto: 'Entrada fechada primeiro, curto concluído, longo cancelado dentro do prazo e saída com o exit code contratado, medida na timeline.' },
            'f-kill': { bom: false, texto: 'Os deploys ficaram rápidos e as requisições passaram a morrer pela metade, sem rastro.' },
            'f-timeout': { bom: false, texto: 'Os clientes esperam mais, e as requisições cortadas continuam cortadas.' },
            'f-ordem': { bom: false, texto: 'Requisições aceitas depois do SIGTERM morreram no SIGKILL: defeito de shutdown catalogado.' },
            'f-kill2': { bom: false, texto: 'O trabalho longo perdeu o resultado, e o grace period foi consumido sem que nada terminasse.' }
          },
          callout: 'Você fechou a entrada primeiro e tornou o trabalho longo cancelável antes do SIGKILL.' },
        { tipo: 'python', id: 'shut-python', titulo: 'Planeje o shutdown', obrigatorio: false,
          enunciado: 'Complete <code>planejar_shutdown(restantes, grace, ignora_cancelamento)</code>. <code>restantes</code> mapeia requisição para segundos que faltam. A entrada fecha sempre; quem cabe no grace (tempo restante menor ou igual ao grace) conclui; quem não cabe é cancelado, exceto se estiver em <code>ignora_cancelamento</code>: esse vai para <code>mortas</code> e a saída é <code>"SIGKILL"</code>. Sem mortas, a saída é <code>"limpa"</code>. Listas em ordem alfabética.',
          codigo: codigoShut, testes: testesShut,
          dica: 'Percorra <code>sorted(restantes)</code>. Primeiro compare com o grace; só depois pergunte se o nome ignora cancelamento. Um trabalho curto que ignora cancelamento nunca precisou ser cancelado.',
          solucao: solucaoShut,
          tutorDepois: 'O controle negativo importa: ignorar cancelamento só custa caro para o que não cabe no grace.',
          callout: 'O plano de shutdown separa concluídas, canceladas e mortas, e a saída registra a diferença.' },
        { tipo: 'codigo', linguagem: 'python', texto: refShutdown },
        { tipo: 'takeaway', html: 'SIGTERM <mark>pede</mark>, SIGKILL <mark>impõe</mark>; o shutdown fecha a <mark>entrada primeiro</mark>, cancela dentro do grace e sai com o exit code contratado.' }
      ] },

      { rotulo: 'Zombies e conferir', blocos: [
        { tipo: 'texto', html:
          '<h3>Zombies, coleta e o PID 1 do container</h3>' +
          '<p>Quando um processo termina, não desaparece de imediato: vira <strong>zombie</strong>, um corpo morto que guarda exit code e estatísticas até o pai lê-los com <code>wait</code>. A <strong>coleta</strong> (<code>wait</code>/<code>waitpid</code>) é essa leitura; só então o sistema libera a entrada. Zombie não gasta CPU nem memória de trabalho, gasta uma vaga na tabela de processos, e aos milhares esgota a tabela.</p>' +
          '<p>O contrato é entre pai e filho: só o pai coleta. Se o pai morre antes, o filho é adotado pelo PID 1. Se o pai vive mas nunca chama <code>wait</code>, cada filho morto vira zombie permanente.</p>' },
        { tipo: 'codigo', linguagem: 'text', texto: [
          '# pai cria filho (fork); filho trabalha e termina (exit);',
          '# filho vira zombie: morto, aguardando leitura;',
          '# pai chama waitpid: lê o exit code, o sistema libera a entrada.',
          '# sem o waitpid, o zombie permanece até o pai morrer ou coletar.'].join('\n') },
        { tipo: 'callout', tom: 'info', titulo: 'PID 1 do container: init que coleta', html:
          '<p>Se o processo principal do container lança filhos e não os coleta, os zombies se acumulam pelo tempo de vida do container, semanas em produção. A defesa tem duas formas: o PID 1 instala coleta para os adotados, ou o PID 1 é um init mínimo que faz isso por ofício. A contagem de zombies entra na observabilidade do Bloco 5.</p>' },
        { tipo: 'callout', tom: 'neutral', titulo: 'Nota de plataforma', html:
          '<p>Zombie reaping é POSIX. <code>os.fork</code>, <code>os.waitpid</code> e a semântica de zombie não existem no Windows, e SIGTERM não tem lá o mesmo significado. A referência <code>coleta_zumbis.py</code> declara POSIX no cabeçalho; fora de Linux rende erro, não aprendizado. Onde o ambiente estiver ausente, o oráculo nasce <em>BLOCKED</em> com registro, nunca simulado.</p>' },
        { tipo: 'codigo', linguagem: 'python', texto: refZumbi },
        { tipo: 'transcript', id: 'b1-transcript', titulo: 'Ache as afirmações sem sustentação', obrigatorio: false, terminalTitulo: 'sessão de incidente',
          enunciado: 'Uma sessão de diagnóstico tem duas afirmações do agente que o resto da sessão não sustenta. Clique nelas e aperte Conferir.',
          linhas: [
            { quem: 'voce', texto: 'Depois do deploy das 14h o p95 de todas as rotas subiu em degrau. CPU do worker baixa, sem exceção nos logs.' },
            { quem: 'agente', texto: 'CPU baixa quer dizer que o problema é rede com o upstream. Vou aumentar o timeout do cliente.' },
            { quem: 'ferramenta', texto: '$ git diff HEAD~1 -- app/handlers.py\n+async def exporta(req):\n+    time.sleep(5)\n+    return await consulta(req)' },
            { quem: 'agente', texto: 'Achei: time.sleep dentro de async def pausa a thread do loop. Movo a espera para fora do loop.' },
            { quem: 'voce', texto: 'E o processo antigo, que demora a sair no deploy?' },
            { quem: 'agente', texto: 'Mando SIGKILL logo de primeira para acelerar a rolagem; é equivalente a SIGTERM.' }
          ],
          erradas: [1, 5],
          explicacao: {
            1: 'CPU baixa com degrau em todas as rotas é a assinatura do loop bloqueado, não de rede; aumentar timeout esconde o sintoma.',
            5: 'SIGKILL não é um SIGTERM mais forte: não entrega nada ao programa, nenhum handler ou cleanup roda. Como primeira opção, troca lentidão por corrupção silenciosa.'
          },
          tutorDepois: 'As duas falhas tratam o número ou o sinal como diagnóstico, sem o mecanismo por trás.' },
        { tipo: 'escreva', id: 'b1-escreva', titulo: 'A ordem do shutdown e seus defeitos', obrigatorio: false,
          enunciado: 'Descreva a ordem do shutdown cooperativo em três passos e aponte o passo em que falha cada um dos defeitos catalogados: aceitar trabalho novo após o sinal, ignorar cancelamento, sair sem o exit code contratado.',
          placeholder: 'Ao receber SIGTERM, primeiro… Depois… Por fim… O defeito de aceitar trabalho novo viola o passo…',
          rubrica: [
            'Ordena <strong>fechar a entrada</strong>, depois concluir ou cancelar no prazo, depois descarregar e sair.',
            'Mapeia aceitar trabalho novo ao <strong>passo 1</strong>, ignorar cancelamento ao <strong>passo 2</strong> e sair sem o exit code contratado ao <strong>passo 3</strong>.',
            'Liga o custo: o que o SIGKILL leva se algum passo falhar.'
          ],
          modelo: '<p>Ao receber o SIGTERM, a API (1) fecha a escuta e recusa trabalho novo; (2) deixa as requisições breves concluírem e cancela cooperativamente as longas dentro do grace period; (3) descarrega buffers, fecha conexões e sai com o exit code contratado. Aceitar trabalho novo viola o passo 1: cada requisição aceita depois do sinal será cortada pelo SIGKILL. Ignorar cancelamento viola o passo 2: o grace escorre sem que nada termine. Sair sem o exit code contratado viola o passo 3: o deploy registra a morte, não a saída.</p>' },
        { tipo: 'escolha', id: 'b1-escolha-zombie', titulo: 'Confira: o serviço que acumula processos',
          pergunta: 'Um serviço lança um filho por lote e a contagem de processos cresce dia após dia, sem CPU nem memória acompanhando. O que são essas entradas e quem as remove?',
          opcoes: [
            { id: 'a', texto: 'Zombies: filhos terminados à espera de leitura; só o <code>wait</code> do pai libera a entrada, com o exit code recolhido.', correta: true, porque: 'o contrato de coleta é do pai; matar zombie com sinal não funciona, ele já está morto.' },
            { id: 'b', texto: 'Threads vazadas; basta enviar SIGKILL a elas.', correta: false, porque: 'não são threads, e zombie já está morto: sinal não o remove.' },
            { id: 'c', texto: 'Cache do sistema; some sozinho com o tempo.', correta: false, porque: 'não some enquanto o pai viver sem coletar.' }
          ], tutorDepois: 'Zombie é problema de contrato pai-filho, não de recurso de trabalho.' },
        { tipo: 'escolha', id: 'b1-escolha-cpu', titulo: 'Confira: mais threads para o relatório',
          pergunta: 'Um endpoint de relatório CPU-bound recebe mais threads "para acelerar"; o throughput para no teto e a latência sobe a cada thread nova. Aceitar a decisão?',
          opcoes: [
            { id: 'a', texto: 'Sim: mais threads sempre dividem a conta.', correta: false, porque: 'thread divide espera, não conta; só soma contenção e troca de contexto.' },
            { id: 'b', texto: 'Não: o gargalo é CPU; paralelize com processos e mantenha o event loop para o I/O.', correta: true, porque: 'memória separada permite escalar por núcleo e isolar falhas, ao custo de coordenação explícita.' },
            { id: 'c', texto: 'Sim, desde que o timeout aumente junto.', correta: false, porque: 'timeout maior não altera o gargalo.' }
          ], tutorDepois: 'Thread resolve espera; processo paraleliza conta.' },
        { tipo: 'texto', largo: true, html:
          '<h3>Tabela de diagnóstico</h3>' +
          '<table><thead><tr><th>Sintoma</th><th>Causa provável</th><th>Conserto</th></tr></thead><tbody>' +
          '<tr><td>Todas as rotas degradam em degrau, CPU baixa, sem exceção</td><td>Chamada bloqueante no caminho assíncrono</td><td>Mover a chamada para fora do loop (thread dedicada ou alternativa assíncrona) e confirmar antes/depois</td></tr>' +
          '<tr><td>Deploy mata requisições no meio; a cauda morre</td><td>Handler de SIGTERM ausente ou fora de ordem</td><td>Instalar handlers, fechar a entrada primeiro, cancelar dentro do grace e publicar a timeline</td></tr>' +
          '<tr><td>Grace escorre sem que nada termine</td><td>Trabalho que ignora cancelamento</td><td>Propagar o cancelamento do asyncio, liberar recursos e medir contra o deadline interno</td></tr>' +
          '<tr><td>Requisições aceitas após o SIGTERM morrem no SIGKILL</td><td>Entrada ainda aberta</td><td>Fechar a escuta como passo 1; recusar com "encerrando"</td></tr>' +
          '<tr><td>Contagem de processos só cresce</td><td>Pai nunca chama wait; ou PID 1 não coleta adotados</td><td>waitpid em todo filho; init que coleta; monitorar zombies no Bloco 5</td></tr>' +
          '<tr><td>Exit code diferente de zero sem causa nos logs</td><td>SIGKILL após o grace, ou convenção de códigos não documentada</td><td>Distinguir saída limpa de morte imposta pela timeline; documentar os códigos</td></tr>' +
          '<tr><td>AttributeError ao exercitar fork/sinais no Windows</td><td>Semântica POSIX fora do Linux</td><td>Executar em Linux (container ou WSL); oráculo BLOCKED registrado onde faltar</td></tr>' +
          '</tbody></table>' },
        { tipo: 'callout', tom: 'neutral', titulo: 'Fontes e versões', html:
          '<p>Linux man-pages, signal(7), proc(5): normativas, consultadas em 14/08/2026, revalidar em até 90 dias. Documentação do Python 3.14 (asyncio tasks, signal): oficial. Grace period, ordem do shutdown e PID 1 em container: comportamento de orquestrador e construção da trilha, medido na folha B01-L. Timelines e contagens do bloco são exemplo variável, não evidência.</p>' },
        { tipo: 'takeaway', html: 'Filho morto vira <mark>zombie</mark> até o <mark>wait do pai</mark>; no container, o <mark>PID 1</mark> responde pelos órfãos.' }
      ] }
    ]
  });
})();
