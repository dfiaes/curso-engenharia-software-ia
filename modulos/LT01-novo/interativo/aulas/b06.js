/* LT01 · Bloco 6: incidente, diagnosticar a API degradada. Fonte: LT01.html#b06. Saídas do runbook são as do contrato (AlvoLocal, valores fixos); demais números são exemplo variável. */
(function () {
  var L = function (kind, text) { return { kind: kind, text: text }; };
  function opc(id, texto, correta, porque) { return { id: id, texto: texto, correta: correta, porque: porque }; }

  var refRegistro = `"""Registro de incidente: hipótese antes da leitura, incident.md em seções fixas.
Referencia executavel do Bloco 6. So STDLIB (dataclasses).
Toda evidencia referencia hipotese previa; veredito em vocabulario fechado.
"""
from __future__ import annotations
from dataclasses import dataclass, field

VEREDITOS = ("confirma", "refuta", "inconclusiva")

@dataclass
class Hipotese:
    """Afirmacao testavel com o sinal que a leitura deve mostrar."""
    hipotese_id: str
    enunciado: str
    sinal_esperado: str

@dataclass
class Evidencia:
    """Leitura confrontada com a hipotese que a autorizou."""
    hipotese_id: str
    observacao: str
    veredito: str

@dataclass
class Incidente:
    """Registro vivo: impacto, baseline, hipoteses e evidencias em ordem."""
    identificador: str
    impacto: str
    baseline: str
    hipoteses: dict[str, Hipotese] = field(default_factory=dict)
    evidencias: list[Evidencia] = field(default_factory=list)

def criar_incidente(identificador: str, impacto: str, baseline: str) -> Incidente:
    """Abre o registro com impacto declarado e baseline de comparacao."""
    for nome, valor in (("identificador", identificador), ("impacto", impacto)):
        if not valor.strip():
            raise ValueError(f"{nome} não pode ser vazio")
    if not baseline.strip():
        raise ValueError("baseline não pode ser vazia")
    return Incidente(identificador=identificador, impacto=impacto, baseline=baseline)

def registrar_hipotese(incidente: Incidente, hipotese_id: str, enunciado: str, sinal_esperado: str) -> Hipotese:
    """Registra a hipotese antes de qualquer leitura; id duplicado: ValueError."""
    if not hipotese_id.strip():
        raise ValueError("hipotese_id não pode ser vazio")
    if hipotese_id in incidente.hipoteses:
        raise ValueError(f"hipotese duplicada: {hipotese_id}")
    if not enunciado.strip() or not sinal_esperado.strip():
        raise ValueError("enunciado e sinal_esperado não podem ser vazios")
    hipotese = Hipotese(hipotese_id, enunciado, sinal_esperado)
    incidente.hipoteses[hipotese_id] = hipotese
    return hipotese

def registrar_evidencia(incidente: Incidente, hipotese_id: str, observacao: str, veredito: str) -> Evidencia:
    """Confronta a leitura com a hipotese previa; sem hipotese: ValueError."""
    if hipotese_id not in incidente.hipoteses:
        raise ValueError(f"sem hipotese previa: {hipotese_id}")
    if veredito not in VEREDITOS:
        raise ValueError(f"veredito precisa estar em {VEREDITOS}")
    if not observacao.strip():
        raise ValueError("observacao não pode ser vazia")
    evidencia = Evidencia(hipotese_id, observacao, veredito)
    incidente.evidencias.append(evidencia)
    return evidencia

def gerar_incident_md(incidente: Incidente) -> str:
    """Publica o incident.md em secoes fixas a partir do registro vivo."""
    linhas = [
        f"# Incidente {incidente.identificador}",
        "",
        f"Impacto: {incidente.impacto}",
        f"Baseline: {incidente.baseline}",
        "",
        "## Hipoteses",
    ]
    for hipotese in incidente.hipoteses.values():
        linhas.append(f"- {hipotese.hipotese_id}: {hipotese.enunciado}")
        linhas.append(f"  Sinal esperado: {hipotese.sinal_esperado}")
    linhas.append("")
    linhas.append("## Evidencias")
    for evidencia in incidente.evidencias:
        linhas.append(f"- {evidencia.hipotese_id}: {evidencia.veredito}")
        linhas.append(f"  Observado: {evidencia.observacao}")
    return "\\n".join(linhas) + "\\n"`;

  var refRunbook = `"""Runbook exercitado contra degradacao simulada local.
Referencia executavel do Bloco 6. So STDLIB (dataclasses, collections.abc).
O alvo degrada por modo declarado; mitigar contem, nunca apaga o sinal.
"""
from __future__ import annotations
from collections.abc import Callable
from dataclasses import dataclass, field

MODOS = ("saudavel", "latencia_alta", "erros_altos")
ACOES = ("conter_entrada", "reverter_mudanca", "isolar_upstream")

@dataclass
class AlvoLocal:
    """Degradacao simulada local: modo declarado, leitura por dicionario."""
    modo: str = "saudavel"
    mitigado: bool = False

    def __post_init__(self) -> None:
        if self.modo not in MODOS:
            raise ValueError(f"modo precisa estar em {MODOS}")

    def observar(self) -> dict[str, float]:
        """Publica p95_ms e taxa_erro do modo atual; exemplo variavel."""
        if self.modo == "latencia_alta":
            return {"p95_ms": 900.0, "taxa_erro": 0.01}
        if self.modo == "erros_altos":
            return {"p95_ms": 120.0, "taxa_erro": 0.25}
        return {"p95_ms": 80.0, "taxa_erro": 0.001}

    def aplicar_mitigacao(self, acao: str) -> dict[str, str]:
        """Contem o impacto com acao do vocabulario; fora dele: ValueError."""
        if acao not in ACOES:
            raise ValueError(f"acao precisa estar em {ACOES}")
        self.mitigado = True
        return {"acao": acao, "efeito": "impacto_contido_causa_aberta"}

@dataclass
class Passo:
    """Passo do runbook: nome e sinal esperado antes da leitura."""
    nome: str
    sinal_esperado: str

@dataclass
class ResultadoPasso:
    """Conformidade de um passo: o observado contra o esperado."""
    nome: str
    conforme: bool
    observado: dict[str, float] = field(default_factory=dict)

def executar_passo(alvo: AlvoLocal, passo: Passo, checagem: Callable[[dict[str, float]], bool]) -> ResultadoPasso:
    """Executa um passo contra o alvo e publica a conformidade."""
    if not passo.nome.strip() or not passo.sinal_esperado.strip():
        raise ValueError("passo precisa de nome e sinal_esperado")
    observado = alvo.observar()
    return ResultadoPasso(passo.nome, bool(checagem(observado)), observado)

def veredito_runbook(resultados: list[ResultadoPasso]) -> str:
    """Mitigado só com lista não vazia e todos os passos conformes."""
    if not resultados:
        raise ValueError("runbook vazio não tem veredito")
    if all(resultado.conforme for resultado in resultados):
        return "mitigado"
    return "nao_mitigado"`;

  var refRestauracao = `"""Restauracao como oraculo: faults desligados e verificacao verde.
Referencia executavel do Bloco 6. So STDLIB (collections.abc).
Restaurado exige as duas metades; "voltou ao normal" sem prova reprova.
"""
from __future__ import annotations
from collections.abc import Callable

def desligar_faults(faults: dict[str, bool]) -> dict[str, bool]:
    """Desliga cada degradacao declarada; publica o mapa desligado."""
    return {nome: False for nome in faults}

def smoke_verde(sondas: dict[str, Callable[[], bool]]) -> dict[str, bool]:
    """Executa cada sonda sobre o ambiente restaurado; vazio: ValueError."""
    if not sondas:
        raise ValueError("sem sondas não há verificacao verde")
    return {nome: bool(sonda()) for nome, sonda in sondas.items()}

def veredito_restauracao(faults: dict[str, bool], resultados: dict[str, bool]) -> str:
    """Restaurado só com todos os faults desligados e todas as sondas verdes."""
    if not resultados:
        raise ValueError("sem resultados não há veredito")
    todos_desligados = all(desligado is False for desligado in faults.values())
    todas_verdes = all(passou for passou in resultados.values())
    if todos_desligados and todas_verdes:
        return "restaurado"
    return "pendente"`;

  var etapasRunbook = function () {
    return [
      { id: 'obs', nome: 'Observar', descricao: 'AlvoLocal(modo="latencia_alta").observar()', tom: 'dns', ms: 900, linhas: [
        L('cmd', 'alvo = AlvoLocal(modo="latencia_alta"); alvo.observar()'),
        L('out', "{'p95_ms': 900.0, 'taxa_erro': 0.01}"),
        L('hint', 'contra o baseline do modo saudável: p95_ms 80.0, taxa_erro 0.001')] },
      { id: 'mit', nome: 'Mitigar', descricao: 'Conter a entrada', tom: 'tcp', ms: 900, linhas: [
        L('cmd', 'alvo.aplicar_mitigacao("conter_entrada"); alvo.observar()'),
        L('out', "{'acao': 'conter_entrada', 'efeito': 'impacto_contido_causa_aberta'}"),
        L('out', "{'p95_ms': 900.0, 'taxa_erro': 0.01}"),
        L('hint', 'a mitigação contém o impacto e não apaga o sinal: a causa segue aberta, com dono')] },
      { id: 'res', nome: 'Restaurar', descricao: 'Desligar o fault e rodar as sondas', tom: 'response', ms: 80, linhas: [
        L('cmd', 'veredito_restauracao({"latencia_alta": True}, {"p95": True})'),
        L('out', "'pendente'"),
        L('cmd', 'veredito_restauracao(desligar_faults({"latencia_alta": True}), {"p95": True})'),
        L('out', "'restaurado'"),
        L('hint', 'restaurado só com as duas metades: faults desligados e verificação verde')] }
    ];
  };

  var codigoInc = [
    'VEREDITOS = ("confirma", "refuta", "inconclusiva")',
    '',
    '',
    'def novo_incidente(impacto, baseline):',
    '    return {"impacto": impacto, "baseline": baseline, "hipoteses": {}, "evidencias": []}',
    '',
    '',
    'def registrar_hipotese(inc, hid, enunciado, sinal_esperado):',
    '    # no máximo três hipóteses iniciais; id duplicado ou sinal vazio -> ValueError',
    '    inc["hipoteses"][hid] = {"enunciado": enunciado, "sinal": sinal_esperado}',
    '',
    '',
    'def registrar_evidencia(inc, hid, observacao, veredito):',
    '    # recuse (ValueError) evidência sem hipótese prévia e veredito fora de VEREDITOS',
    '    inc["evidencias"].append({"hipotese": hid, "observado": observacao, "veredito": veredito})',
    '',
    '',
    'def veredito_restauracao(faults, sondas):',
    '    # faults: nome -> ativo (bool); sondas: nome -> passou (bool); sondas vazias -> ValueError',
    '    # "restaurado" só com TODOS os faults desligados E TODAS as sondas verdes; senão "pendente"',
    '    return "restaurado"',
    '',
    '',
    'inc = novo_incidente("p95 de /pedidos em 900 ms para 30% das requisições", "p95 de 80 ms")',
    'registrar_hipotese(inc, "H1", "pool esgotado", "fila de aquisição crescente com destino no prazo")',
    'print(veredito_restauracao({"latencia_alta": True}, {"p95": True}))'
  ].join("\n");
  var testesInc = [
    'def recusa(f, *args):',
    '    try:',
    '        f(*args)',
    '    except ValueError:',
    '        return True',
    '    return False',
    '',
    '',
    'def montar():',
    '    inc = novo_incidente("p95 de /pedidos em 900 ms", "p95 de 80 ms")',
    '    registrar_hipotese(inc, "H1", "pool esgotado", "fila de aquisição crescente")',
    '    return inc',
    '',
    '',
    'def test_evidencia_com_hipotese_previa_entra():',
    '    inc = montar()',
    '    registrar_evidencia(inc, "H1", "fila em 0 durante o pico", "refuta")',
    '    assert inc["evidencias"][0]["veredito"] == "refuta"',
    '',
    '',
    'def test_evidencia_sem_hipotese_e_recusada():',
    '    inc = montar()',
    '    assert recusa(registrar_evidencia, inc, "H9", "CPU em 40%", "confirma")',
    '    assert inc["evidencias"] == []',
    '',
    '',
    'def test_veredito_fora_do_vocabulario_e_recusado():',
    '    assert recusa(registrar_evidencia, montar(), "H1", "fila subiu", "acho que sim")',
    '',
    '',
    'def test_hipoteses_duplicada_sem_sinal_e_quarta_sao_recusadas():',
    '    inc = montar()',
    '    assert recusa(registrar_hipotese, inc, "H1", "outra", "sinal")',
    '    assert recusa(registrar_hipotese, inc, "H2", "upstream lento", " ")',
    '    registrar_hipotese(inc, "H2", "upstream lento", "breakdown com upstream alto")',
    '    registrar_hipotese(inc, "H3", "deploy das 14h", "degrau começa no deploy")',
    '    assert recusa(registrar_hipotese, inc, "H4", "DNS", "NXDOMAIN")',
    '',
    '',
    'def test_restauracao_exige_as_duas_metades():',
    '    assert veredito_restauracao({"latencia_alta": False}, {"p95": True, "erros": True}) == "restaurado"',
    '    assert veredito_restauracao({"latencia_alta": True}, {"p95": True}) == "pendente"',
    '    assert veredito_restauracao({"latencia_alta": False}, {"p95": False}) == "pendente"',
    '    assert recusa(veredito_restauracao, {"latencia_alta": False}, {})'
  ].join("\n");
  var solucaoInc = [
    'VEREDITOS = ("confirma", "refuta", "inconclusiva")',
    '',
    '',
    'def novo_incidente(impacto, baseline):',
    '    return {"impacto": impacto, "baseline": baseline, "hipoteses": {}, "evidencias": []}',
    '',
    '',
    'def registrar_hipotese(inc, hid, enunciado, sinal_esperado):',
    '    if hid in inc["hipoteses"]:',
    '        raise ValueError(f"hipotese duplicada: {hid}")',
    '    if not enunciado.strip() or not sinal_esperado.strip():',
    '        raise ValueError("enunciado e sinal esperado são obrigatórios")',
    '    if len(inc["hipoteses"]) >= 3:',
    '        raise ValueError("no máximo três hipóteses iniciais")',
    '    inc["hipoteses"][hid] = {"enunciado": enunciado, "sinal": sinal_esperado}',
    '',
    '',
    'def registrar_evidencia(inc, hid, observacao, veredito):',
    '    if hid not in inc["hipoteses"]:',
    '        raise ValueError(f"sem hipotese previa: {hid}")',
    '    if veredito not in VEREDITOS:',
    '        raise ValueError(f"veredito precisa estar em {VEREDITOS}")',
    '    inc["evidencias"].append({"hipotese": hid, "observado": observacao, "veredito": veredito})',
    '',
    '',
    'def veredito_restauracao(faults, sondas):',
    '    if not sondas:',
    '        raise ValueError("sem sondas não há verificação verde")',
    '    desligados = all(ativo is False for ativo in faults.values())',
    '    verdes = all(sondas.values())',
    '    return "restaurado" if desligados and verdes else "pendente"'
  ].join("\n");

  TrilhaAula.registrar({
    id: 'lt01-b6',
    titulo: 'Incidente: diagnosticar a API degradada',
    minutos: 50,
    resumo: 'A API degrada em produção e ninguém sabe a camada. Conduzir o incidente por hipótese e evidência: triagem com impacto e baseline, hipóteses antes da leitura, mitigar sem esconder, corrigir com regressão e provar a restauração.',
    objetivo: 'Conduzir um cenário inédito com orçamento declarado: impacto e baseline publicados, até três hipóteses com sinal esperado, camada localizada, mitigação que não esconde, correção com regressão e restauração provada.',
    revisao: [
      { id: 'lt01b6-hipotese', pergunta: 'Você olhou três gráficos sem hipótese e foi andando de um número para o próximo. Qual regra foi violada?',
        opcoes: [
          opc('a', 'Nenhuma leitura sem hipótese registrada antes, com o sinal esperado declarado', true, 'leitura sem expectativa prévia não refuta nada e vira passeio.'),
          opc('b', 'Deve-se sempre começar pelo código', false, 'começa-se pelo impacto e pelo baseline.'),
          opc('c', 'Deve-se reiniciar o serviço primeiro', false, 'reiniciar apaga evidência sem testar hipótese.')] },
      { id: 'lt01b6-ulimit', pergunta: 'Para conter um vazamento de FD, alguém sugere dobrar o <code>ulimit -n</code>. Como classificar?',
        opcoes: [
          opc('a', 'Esconderijo: ganha tempo e apaga o sinal; a correção é fechar o recurso, com patch mínimo e regressão', true, 'mitigação legítima contém sem apagar o sinal que provaria a causa.'),
          opc('b', 'Correção definitiva', false, 'a causa continua armada.'),
          opc('c', 'Boa prática de rotina', false, 'foi vedada no Bloco 2: elevar o limite sem fechar adia e esconde.')] },
      { id: 'lt01b6-normal', pergunta: '"Voltou ao normal" basta para fechar o incidente?',
        opcoes: [
          opc('a', 'Não: o fechamento exige correção sobre causa provada, regressão que falha antes e passa depois, e restauração com faults desligados e verificação verde', true, 'sintoma que some sem explicação é incidente em pausa.'),
          opc('b', 'Sim, se o dashboard ficou verde por um minuto', false, 'calma no gráfico sem os três artefatos é silêncio, não saúde.'),
          opc('c', 'Sim, se ninguém mais reclamou', false, 'ausência de reclamação não prova a causa removida.')] },
      { id: 'lt01b6-regressao', pergunta: 'O teste de regressão passa antes do patch e continua passando depois. O que isso prova?',
        opcoes: [
          opc('a', 'Nada: a regressão não reproduz a causa; precisa falhar no estado degradado (controle negativo)', true, 'regressão que não falha antes é oráculo decorativo.'),
          opc('b', 'Que o patch está correto', false, 'passaria também sem o patch.'),
          opc('c', 'Que o incidente não existiu', false, 'prova só que o teste não olha a causa.')] },
      { id: 'lt01b6-restauro', pergunta: 'Por que cada metade do oráculo de restauração sozinha reprova?',
        opcoes: [
          opc('a', 'Faults desligados sem verificação verde é fé; verificação verde com fault residual é teatro', true, '"restaurado" só se escreve com as duas publicadas lado a lado.'),
          opc('b', 'Porque o postmortem precisa vir antes', false, 'a ordem do postmortem não decide a restauração.'),
          opc('c', 'Não reprova: uma metade basta', false, 'cada metade sozinha deixa uma forma de erro passar.')] }
    ],
    abas: [
      { rotulo: 'Triagem e hipóteses', blocos: [
        { tipo: 'texto', html:
          '<p>Os Blocos 1 a 5 entregaram processo, filesystem, caminho da conexão, conversa HTTP e saturação medida. Este responde à pergunta que resta quando a API degrada em produção e ninguém sabe a camada: <strong>como conduzir o incidente por hipótese e evidência</strong>, do primeiro sintoma ao retorno provado ao baseline. O vocabulário dos blocos anteriores vira repertório de hipóteses. Todo exemplo é Python 3.14 só com stdlib (<code>dataclasses</code>, <code>collections.abc</code>).</p>' +
          '<h3>Triagem: impacto e baseline antes da causa</h3>' +
          '<p><strong>Incidente</strong> é a degradação observada que exige resposta coordenada; <strong>problema</strong> é a causa ainda desconhecida por trás dele. Primeiro se declara o que o usuário sente e desde quando, depois se investiga o porquê. <strong>Triagem</strong> é essa primeira declaração, curta e datada: serviço, sintoma, alcance, início. <strong>Impacto</strong> é quem sofre e quanto, com percentil e não com média. <strong>Baseline</strong> é o comportamento saudável de comparação: carga, throughput, p95, erros e recursos fora do incidente. Sem baseline, "p95 alto" não acusa nada.</p>' +
          '<p><strong>Timeline</strong> é o registro ordenado do incidente: quando cada sintoma apareceu, cada mudança entrou, cada leitura foi feita e o que concluiu. Durante o incidente, impede testar duas vezes a hipótese refutada; depois, sustenta o postmortem com linhas datadas, não com memória.</p>' },
        { tipo: 'callout', tom: 'info', titulo: 'Mudança recente é hipótese, não veredito', html:
          '<p>"O que mudou?" abre quase todo diagnóstico, mas correlação temporal não é prova. A mudança recente entra na lista como uma hipótese entre as concorrentes, com sinal esperado e leitura que confirma ou refuta. "Foi o deploy, revertemos" sem a leitura que liga o deploy ao sintoma deixa a próxima mudança idêntica passar sem guarda.</p>' },
        { tipo: 'texto', html:
          '<h3>Hipótese antes da leitura</h3>' +
          '<p><strong>Hipótese</strong> é uma afirmação testável sobre a camada da falha, com o sinal que a leitura deveria mostrar se ela for verdadeira. "O pool esgotou" é palpite; "o pool esgotou: a leitura de aquisição deve mostrar fila crescente com timeout, enquanto o destino responde no prazo" é hipótese. O contrato exige <strong>no máximo três hipóteses iniciais</strong>, distintas o bastante para cobrir camadas diferentes: uma de recurso local, uma de dependência externa, uma de mudança recente.</p>' +
          '<p>Regra de ouro: <strong>nenhuma leitura sem hipótese registrada antes</strong>. Com a hipótese escrita antes, a leitura tem três desfechos honestos: <em>confirma</em> (mitigar e corrigir), <em>refuta</em> (descartar e passar à próxima) ou <em>inconclusiva</em> (refinar a hipótese, nunca forçar o veredito). O diagnóstico por eliminação segue a ordem fixa <strong>sintoma, hipótese, evidência, correção</strong>. Corrigir na suspeita produz o incidente duplo.</p>' },
        { tipo: 'callout', tom: 'danger', titulo: '"Vou olhando até achar"', html:
          '<p>Não. Leitura sem hipótese parece velocidade, mas troca diagnóstico por passeio: cada número é reinterpretado para caber na suspeita favorita, até o orçamento acabar com dez observações e zero vereditos. O sintoma no registro: muitas leituras e nenhuma hipótese descartada. Três hipóteses testadas valem mais que trinta leituras órfãs.</p>' },
        { tipo: 'python', id: 'inc-python', titulo: 'Registro que recusa leitura órfã', obrigatorio: false,
          enunciado: 'Complete o registro do incidente. <code>registrar_hipotese</code> recusa (<code>ValueError</code>) id duplicado, enunciado ou sinal vazio e uma quarta hipótese inicial. <code>registrar_evidencia</code> recusa evidência sem hipótese prévia e veredito fora de <code>VEREDITOS</code>. <code>veredito_restauracao(faults, sondas)</code> devolve <code>"restaurado"</code> só com todos os faults desligados e todas as sondas verdes, <code>"pendente"</code> nos outros casos, e recusa sondas vazias.',
          codigo: codigoInc, testes: testesInc,
          dica: 'As recusas vêm antes do append. Para os faults, compare com <code>is False</code>; para as sondas, <code>all(sondas.values())</code>.',
          solucao: solucaoInc,
          tutorDepois: 'O registro torna a disciplina mecânica: não há como anexar uma leitura que não testa nada, nem declarar restauração com uma metade só.',
          callout: 'O registro recusa leitura órfã, veredito fora do vocabulário e restauração pela metade.' },
        { tipo: 'codigo', linguagem: 'python', texto: refRegistro },
        { tipo: 'takeaway', html: 'Impacto e <mark>baseline</mark> antes da causa; <mark>hipótese antes da leitura</mark>, com o sinal esperado escrito.' }
      ] },

      { rotulo: 'Conduza o incidente', blocos: [
        { tipo: 'cenario', id: 'inc-cenario', titulo: 'A API de pedidos degradou às 14h', obrigatorio: false,
          enunciado: 'Às 14h10 o p95 de <code>/pedidos</code> passou de 80 ms (baseline) para 900 ms, com taxa de erro de 1%. Às 14h houve deploy. O orçamento é de três hipóteses iniciais. Conduza.',
          inicio: 'inicio',
          nos: {
            inicio: { texto: 'O canal está cheio de palpites. Qual o primeiro movimento?', opcoes: [
              { texto: 'Reverter o deploy agora: foi ele.', vai: 'f-reverte', tom: 'ruim', consequencia: 'a mudança recente virou veredito sem a leitura que a liga ao sintoma.' },
              { texto: 'Publicar a triagem: serviço, sintoma, alcance, início, impacto em percentil e baseline; abrir a timeline.', vai: 'hipoteses', tom: 'ok', consequencia: 'toda leitura seguinte passa a ter comparação.' },
              { texto: 'Abrir todos os painéis e ir olhando até achar.', vai: 'f-passeio', tom: 'ruim', consequencia: 'leituras sem hipótese não refutam nada.' }
            ] },
            hipoteses: { texto: 'Quais hipóteses você registra, antes de ler qualquer coisa?', opcoes: [
              { texto: 'H1 pool esgotado (fila de aquisição crescente, destino no prazo); H2 upstream lento (breakdown com upstream alto e local baixo); H3 deploy das 14h (degrau começa no instante do deploy).', vai: 'leitura', tom: 'ok', consequencia: 'três camadas distintas, cada uma com o sinal que a decide.' },
              { texto: 'Uma só: "o sistema está lento".', vai: 'f-palpite', tom: 'ruim', consequencia: 'não prevê sinal nenhum, então nenhuma leitura a refuta.' }
            ] },
            leitura: { texto: 'A leitura mostra: fila de aquisição em zero durante o pico; breakdown com local em 60 ms e upstream em 840 ms; o degrau começou às 14h08, antes do deploy terminar de rolar. Vereditos?', opcoes: [
              { texto: 'H1 refuta, H2 confirma, H3 inconclusiva: refinar H3 depois; seguir com H2.', vai: 'mitigar', tom: 'ok', consequencia: 'a refutada sai da lista e nunca vira patch.' },
              { texto: 'Aumentar o pool "por garantia" e seguir.', vai: 'f-duplo', tom: 'ruim', consequencia: 'corrigir na hipótese refutada abre o incidente duplo.' }
            ] },
            mitigar: { texto: 'H2 confirmada. Como conter?', opcoes: [
              { texto: 'Isolar o upstream lento e conter a entrada, declarando o que conteve, o que preservou e o que resta aberto, com dono.', vai: 'corrigir', tom: 'ok', consequencia: 'o usuário é protegido e o sinal continua visível.' },
              { texto: 'Retry sem teto contra o upstream até ele responder.', vai: 'f-tempestade', tom: 'ruim', consequencia: 'mais carga sobre quem já está lento.' }
            ] },
            corrigir: { texto: 'O dono do upstream acha a causa: uma consulta sem índice. Como fechar?', opcoes: [
              { texto: 'Patch mínimo sobre a causa provada, teste de regressão que falha antes e passa depois, restauração com faults desligados e verificação verde, e incident.md com registros sanitizados.', vai: 'f-bom', tom: 'ok', consequencia: 'a cadeia hipótese, evidência, correção e regressão está completa.' },
              { texto: 'O gráfico já está calmo depois da mitigação: encerrar.', vai: 'f-pausa', tom: 'ruim', consequencia: 'a causa segue armada sob gráfico calmo.' }
            ] }
          },
          finais: {
            'f-bom': { bom: true, texto: 'Incidente fechado com a cadeia completa e o baseline de volta, provado lado a lado. O postmortem sem culpa registra a guarda que faltava e o risco residual.' },
            'f-reverte': { bom: false, texto: 'O deploy foi revertido e o p95 continuou em 900 ms: o degrau tinha começado antes dele.' },
            'f-passeio': { bom: false, texto: 'Quarenta minutos de painéis, dez leituras, nenhuma hipótese descartada.' },
            'f-palpite': { bom: false, texto: 'Toda leitura "confirmava" a lentidão, e nenhuma dizia onde.' },
            'f-duplo': { bom: false, texto: 'O pool maior empurrou mais pressão para o upstream lento, e o incidente ganhou uma segunda timeline.' },
            'f-tempestade': { bom: false, texto: 'O upstream saturou de vez, e outros clientes dele também degradaram.' },
            'f-pausa': { bom: false, texto: 'Na semana seguinte, a mesma consulta voltou a degradar a API: incidente em pausa, não resolvido.' }
          },
          callout: 'Você conduziu o incidente da triagem à restauração, com cada passo sustentado por evidência.' },
        { tipo: 'ordene', id: 'inc-ordene', titulo: 'Ordene a resposta ao incidente', obrigatorio: false,
          enunciado: 'Coloque as etapas na ordem em que um diagnóstico disciplinado as executa.',
          itens: [
            { id: 'e', texto: 'Corrigir a causa com patch mínimo e teste de regressão' },
            { id: 'b', texto: 'Registrar hipóteses com o sinal esperado de cada uma' },
            { id: 'g', texto: 'Escrever o incident.md e o postmortem sem culpa' },
            { id: 'a', texto: 'Triagem: serviço, sintoma, alcance, impacto e baseline' },
            { id: 'd', texto: 'Mitigar sem esconder o sinal' },
            { id: 'f', texto: 'Restaurar e provar: faults desligados e verificação verde' },
            { id: 'c', texto: 'Ler a evidência e confrontar com o sinal esperado' }
          ], solucao: ['a', 'b', 'c', 'd', 'e', 'f', 'g'],
          tutorDepois: 'Mitigar vem antes de corrigir: com o usuário protegido, o patch pode ser mínimo e a regressão escrita sem pressa.' },
        { tipo: 'takeaway', html: 'Sintoma, <mark>hipótese</mark>, <mark>evidência</mark>, correção: a refutada sai da lista e nunca vira patch.' }
      ] },

      { rotulo: 'Mitigar, corrigir, restaurar', blocos: [
        { tipo: 'texto', html:
          '<h3>Mitigar sem esconder, depois corrigir</h3>' +
          '<p><strong>Mitigação</strong> contém o impacto sem remover a causa: conter a entrada, reverter a mudança, isolar o upstream lento, derrubar a série explosiva. <strong>Correção</strong> remove a causa: o patch mínimo sobre o defeito provado. Mitigar primeiro compra o tempo da correção certa; corrigir primeiro, sob impacto aberto, produz o patch apressado.</p>' +
          '<p>Mitigação que apaga o sinal é <strong>esconderijo</strong>: elevar o limite de descritores sem fechar o vazamento, aumentar o pool sem drenar a fila, desligar a verificação de certificado "para passar o teste" (vedados nos Blocos 2 a 4). A legítima declara o que conteve, o que preservou e o que resta. <strong>Patch mínimo</strong> é a menor mudança que remove a causa provada sem alterar o saudável: cada linha além dela é hipótese não testada indo para produção. <strong>Teste de regressão</strong> falha antes do patch e passa depois: correção sem regressão é relato; com regressão, é garantia.</p>' },
        { tipo: 'texto', largo: true, html:
          '<table><thead><tr><th>Mitigação (contém)</th><th>Correção (remove a causa)</th><th>Esconderijo (evite)</th></tr></thead><tbody>' +
          '<tr><td>Conter a entrada (limitar taxa, fila limitada)</td><td>Fechar o recurso que vazava (descritor, corpo, sessão)</td><td>Dobrar o ulimit sem fechar o vazamento</td></tr>' +
          '<tr><td>Reverter a mudança suspeita</td><td>Corrigir a divisão de prazo</td><td>Aumentar o pool sem drenar a fila</td></tr>' +
          '<tr><td>Isolar o upstream lento</td><td>Adicionar o teto de retries</td><td>Desligar a verificação de certificado "para passar o teste"</td></tr>' +
          '<tr><td>Derrubar a série de métrica explosiva</td><td>Teste de regressão que falha antes e passa depois</td><td></td></tr>' +
          '<tr><td>Reduz o impacto agora; a causa continua armada</td><td>Só depois dela o incidente se fecha</td><td>Apaga o sinal que provaria a causa</td></tr>' +
          '</tbody></table>' },
        { tipo: 'texto', html:
          '<h3>Runbook e restauração</h3>' +
          '<p><strong>Runbook</strong> é o procedimento que transforma o aprendizado em conduta repetível: passos nomeados, cada um com o sinal esperado e o limite que o aprova. Runbook só lido é lista de desejos; por isso a folha B06-L o exercita contra degradação simulada local, com prazo e veredito de mitigação.</p>' +
          '<p><strong>Restauração</strong> é o retorno controlado ao estado anterior, em ordem: desligar o que foi injetado, reverter o que foi contido, ler o ambiente limpo. O oráculo tem duas metades inseparáveis: <strong>faults desligados</strong> e <strong>verificação verde</strong>. Restauração incompleta se reconhece pelo patamar: a verificação curta passa, mas descritores ficam acima do repouso, a fila não zera, o p95 tem degrau residual. Restauração se prova por igualdade ao baseline, lado a lado.</p>' },
        { tipo: 'rode', id: 'runbook-rode', titulo: 'Exercite o runbook no alvo local', obrigatorio: false,
          enunciado: 'O <code>AlvoLocal</code> degrada em modo <code>latencia_alta</code>. Rode a observação, a mitigação e a restauração com o contrato do lab (as saídas são os valores fixos do contrato).',
          prefixo: '$', entrada: 'python -c "from exercicio_runbook import *; from restauracao_baseline import *; ..."', unidade: 'ms', terminalTitulo: 'lab/', etapas: etapasRunbook(),
          prever: { pergunta: 'Depois de aplicar_mitigacao("conter_entrada"), o que observar() devolve?', opcoes: [
            { id: 'a', texto: 'O baseline: p95_ms 80.0, porque a mitigação resolveu.', correta: false, porque: 'mitigar contém o impacto; não remove a causa nem apaga o sinal.' },
            { id: 'b', texto: 'O mesmo p95_ms 900.0: o impacto está contido e a causa continua aberta.', correta: true, porque: 'o efeito publicado é "impacto_contido_causa_aberta".' },
            { id: 'c', texto: 'Nada: a mitigação desliga a observação.', correta: false, porque: 'isso seria esconderijo.' }
          ] },
          tutorAntes: 'Aperte Enter e clique em "Mitigar" e depois em "Restaurar".',
          tutorDepois: 'O sinal só voltou ao patamar quando o fault foi desligado, e o veredito só disse "restaurado" com as duas metades.',
          callout: 'Você viu a mitigação conter sem apagar e a restauração exigir as duas metades.' },
        { tipo: 'codigo', linguagem: 'python', texto: refRunbook },
        { tipo: 'codigo', linguagem: 'python', texto: refRestauracao },
        { tipo: 'texto', html:
          '<h3>O registro que sobrevive</h3>' +
          '<p><strong>incident.md</strong> tem seções fixas: identificação, impacto, baseline, timeline, hipóteses com sinais esperados, evidências com vereditos, mitigação, correção, regressão e restauração; cada evidência referencia a hipótese que testa, cada correção a evidência que a autorizou. Os registros são <strong>sanitizados</strong>: sem segredos, sem dados de usuário, sem detalhe que exponha a operação (segredo no relatório é o segundo incidente, do Bloco 2). O <strong>postmortem sem culpa</strong> (blameless) pergunta pelo sistema, nunca pelo culpado: quais guardas faltavam para que uma ação razoável produzisse o incidente. Onde o erro é punido, a timeline é editada antes de publicada. Termina com causas sistêmicas, ações com dono, a regressão que as garante e o risco residual declarado.</p>' },
        { tipo: 'takeaway', html: 'Mitigação <mark>contém</mark>, correção <mark>remove</mark>, esconderijo <mark>apaga o sinal</mark>; restaurado só com as <mark>duas metades</mark>.' }
      ] },

      { rotulo: 'Conferir e diagnosticar', blocos: [
        { tipo: 'transcript', id: 'b6-transcript', titulo: 'Ache os fechamentos sem prova', obrigatorio: false, terminalTitulo: 'canal do incidente',
          enunciado: 'Leia o fim de um incidente. Duas mensagens declaram algo que a evidência não sustenta. Clique nelas e aperte Conferir.',
          linhas: [
            { quem: 'agente', texto: 'Mitigação aplicada: isolamos o upstream lento. Contido: impacto em /pedidos. Preservado: o sinal no breakdown. Aberto: a causa no upstream, dono time de catálogo.' },
            { quem: 'ferramenta', texto: '$ pytest tests/test_regressao_catalogo.py -q\n1 passed   (rodado antes e depois do patch)' },
            { quem: 'agente', texto: 'A regressão passou antes e depois do patch: está provado que o patch corrige.' },
            { quem: 'ferramenta', texto: '$ verificar --sondas\np95 ok, erros ok\n$ contar_fd\n412 (baseline em repouso: 120)' },
            { quem: 'agente', texto: 'Sondas verdes: ambiente restaurado. Encerrando o incidente.' }
          ],
          erradas: [2, 4],
          explicacao: {
            2: 'Regressão que passa antes do patch não reproduz a causa: é oráculo decorativo. Ela precisa falhar no estado degradado.',
            4: 'Verificação verde com descritores acima do repouso indica fault residual: restaurado exige faults desligados e igualdade ao baseline.'
          },
          tutorDepois: 'A primeira mensagem é o modelo de mitigação legítima: declara o contido, o preservado e o aberto.' },
        { tipo: 'escolha', id: 'b6-escolha-hip', titulo: 'Confira: três hipóteses, três destinos',
          pergunta: 'Uma leitura confirma a hipótese de dependência externa, refuta a de recurso local e deixa a de mudança recente inconclusiva. O que fazer com cada uma?',
          opcoes: [
            { id: 'a', texto: 'Mitigar e corrigir a confirmada, descartar a refutada e refinar a inconclusiva.', correta: true, porque: 'a refutada sai da lista e nunca vira patch; corrigi-la "por garantia" abre o incidente duplo.' },
            { id: 'b', texto: 'Corrigir as três por garantia.', correta: false, porque: 'patch sobre camada não provada adiciona sua própria timeline.' },
            { id: 'c', texto: 'Manter as três abertas até o fim.', correta: false, porque: 'manter a refutada aberta repete leituras e gasta o orçamento.' }
          ], tutorDepois: 'Cada desfecho prescreve o próximo passo: confirma, refuta ou inconclusiva.' },
        { tipo: 'escolha', id: 'b6-escolha-runbook', titulo: 'Confira: qual runbook decide sob pressão?',
          pergunta: 'Três runbooks: um com passos sem sinal esperado, um exercitado contra degradação local com prazo, um só lido e nunca executado. Qual decide sob pressão?',
          opcoes: [
            { id: 'a', texto: 'O exercitado: passo sem critério não decide, e runbook só lido não foi provado.', correta: true, porque: 'os outros dois devem ser reescritos com sinal, limite e exercício.' },
            { id: 'b', texto: 'O só lido, porque é o mais completo.', correta: false, porque: 'runbook só lido é lista de desejos, não conduta.' },
            { id: 'c', texto: 'Qualquer um, se a equipe for experiente.', correta: false, porque: 'sob pressão, só o critério escrito decide.' }
          ], tutorDepois: 'O que passou no exercício pode ser confiado no incidente.' },
        { tipo: 'escreva', id: 'b6-escreva', titulo: 'O fechamento e seus defeitos', obrigatorio: false,
          enunciado: 'Descreva a ordem do fechamento (mitigação, patch mínimo, regressão, incident.md) e aponte onde falha cada defeito catalogado: mitigação que apaga o sinal, patch amplo sob pressão, regressão que passa antes do patch.',
          placeholder: 'Primeiro contenho… Depois corrijo… A regressão… O incident.md…',
          rubrica: [
            'Ordena conter sem esconder, corrigir o mínimo sobre causa provada, fixar com regressão e registrar no incident.md.',
            'Mapeia mitigação que apaga o sinal à <strong>mitigação</strong>, patch amplo à <strong>correção</strong> e regressão que passa antes ao <strong>teste de regressão</strong>.',
            'Declara que <strong>regressão que não falha antes não prova nada</strong>.'
          ],
          modelo: '<p>Primeiro contenho o impacto sem apagar o sinal, declarando o contido, o preservado e o aberto; mitigação que esconde (dobrar ulimit, aumentar pool, desligar verificação) viola este passo. Com o usuário protegido, aplico o patch mínimo sobre a causa provada; patch amplo sob pressão viola este passo, porque cada linha extra é uma hipótese não testada. Fixo a causa com um teste de regressão que falha no estado degradado e passa após o patch; regressão que passa antes não reproduz a causa e não prova nada. Por fim, restauro com faults desligados e verificação verde e publico o incident.md com registros sanitizados e o postmortem sem culpa.</p>' },
        { tipo: 'texto', largo: true, html:
          '<h3>Tabela de diagnóstico</h3>' +
          '<table><thead><tr><th>Sintoma</th><th>Causa provável</th><th>Conserto</th></tr></thead><tbody>' +
          '<tr><td>Dezenas de leituras, nenhuma hipótese descartada, orçamento esgotado</td><td>Leitura sem hipótese prévia</td><td>Até três hipóteses com sinais esperados; cada evidência contra a hipótese que a autorizou; refutada sai da lista</td></tr>' +
          '<tr><td>Correção aplicada e o incidente dobra</td><td>Correção na suspeita</td><td>Reverter ao estado mitigado, retomar a eliminação e só corrigir sobre causa confirmada, com regressão</td></tr>' +
          '<tr><td>Sintoma some após a mitigação e o incidente é encerrado</td><td>Mitigação que apaga o sinal confundida com correção</td><td>Manter aberto com dono; exigir patch mínimo e regressão antes do fechamento</td></tr>' +
          '<tr><td>Regressão passa antes do patch e depois</td><td>Teste que não reproduz a causa</td><td>Reescrever para falhar no estado degradado (controle negativo) e só então validar</td></tr>' +
          '<tr><td>Runbook seguido à risca e a mitigação não contém</td><td>Passo sem sinal esperado nem limite</td><td>Reescrever cada passo com sinal e critério; exercitar contra degradação local com prazo</td></tr>' +
          '<tr><td>Verificação verde com recurso acima do baseline</td><td>Fault residual</td><td>Comparar os quatro números lado a lado; localizar o residual pelo recurso que não voltou</td></tr>' +
          '<tr><td>Postmortem aponta a pessoa; o próximo incidente repete o roteiro</td><td>Análise com culpa</td><td>Reescrever sem culpa: causas sistêmicas, ações com dono, regressão e risco residual</td></tr>' +
          '</tbody></table>' },
        { tipo: 'callout', tom: 'neutral', titulo: 'Fontes e versões', html:
          '<p>Google SRE (Monitoring; Handling Overload; Postmortem Culture): canônica industrial, consultada em 14/08/2026. Google SRE workbook, Incident Response: prática de praticante, rotulada como tal. Documentação do Python 3.14 (<code>dataclasses</code>, <code>collections.abc</code>): oficial. Hipótese antes da leitura, mitigação contra correção e restauração em duas metades: invariantes de resposta a incidentes, construção da trilha. Latências, taxas e contagens citadas são exemplo variável; os números observados nascem na folha B06-L.</p>' },
        { tipo: 'takeaway', html: '"Voltou ao normal" <mark>não é veredito</mark>: correção, regressão e restauração provada, <mark>as três</mark>.' }
      ] }
    ]
  });
})();
