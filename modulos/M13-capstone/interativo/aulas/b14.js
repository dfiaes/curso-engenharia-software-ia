/* M13 · Bloco 14: observabilidade, SLO e burn rate. Fonte: M13.html#h-b14. Saídas do rode: pytest registrado no bloco e cálculo do simulador do bloco (SLO 99,9%, erro 1%). */
(function () {
  var L = function (kind, text) { return { kind: kind, text: text }; };
  function opc(id, texto, correta, porque) { return { id: id, texto: texto, correta: correta, porque: porque }; }

  var codigoObs = String.raw`import re

def burn_rate(slo, error_rate):
    # LACUNA: burn = taxa de erro observada / taxa orcada (1 - slo).
    # SLO >= 1 nao deixa orcamento: ValueError.
    return error_rate

def slo_alert(slo, error_rate, threshold=14.4):
    # LACUNA: None se burn < threshold; senao "fast-burn: burn rate <numero>"
    return None

def sanitize_log(text):
    # LACUNA: e-mail e pares chave=valor sensiveis viram [REDACTED].
    return text
`;
  var solucaoObs = String.raw`import re

def burn_rate(slo, error_rate):
    budget = 1 - slo
    if budget <= 0:
        raise ValueError("SLO de 100% nao deixa orcamento: burn rate indefinido")
    return round(error_rate / budget, 6)

def slo_alert(slo, error_rate, threshold=14.4):
    br = burn_rate(slo, error_rate)
    if br >= threshold:
        return "fast-burn: burn rate " + str(br)
    return None

EMAIL = re.compile(r"[\w.+-]+@[\w-]+\.[\w.-]+")
KV = re.compile(r"(?i)\b(api[_-]?key|token|password|secret|authorization)\s*[:=]\s*\S+")

def sanitize_log(text):
    text = EMAIL.sub("[REDACTED]", text)
    return KV.sub("[REDACTED]", text)
`;
  var testesObs = String.raw`def test_burn_rate_exato():
    assert burn_rate(0.999, 0.01) == 10.0
    assert burn_rate(0.99, 0.01) == 1.0

def test_slo_100_e_indefinido():
    try:
        burn_rate(1.0, 0.0)
    except ValueError:
        return
    assert False, "deveria levantar ValueError"

def test_falha_injetada_dispara_fast_burn():
    msg = slo_alert(0.999, 0.10)
    assert msg is not None and "fast-burn" in msg and "100.0" in msg

def test_trafego_saudavel_nao_alerta():
    assert slo_alert(0.999, 0.0005) is None

def test_alerta_carrega_o_numero_calculado():
    assert "20.0" in slo_alert(0.999, 0.02)

def test_log_sem_pii_nem_segredo():
    s = sanitize_log("usuario ana@exemplo.com falhou; api_key=abc123 token: xyz")
    assert "ana@exemplo.com" not in s and "abc123" not in s and "xyz" not in s
    assert "[REDACTED]" in s and "usuario" in s
`;

  TrilhaAula.registrar({
    id: 'm13-b14',
    titulo: 'Observabilidade: traces, métricas, log sanitizado e SLO/burn rate',
    minutos: 30,
    resumo: 'Telemetria boa responde, sem reunião, onde quebrou e se o budget está queimando rápido demais. SLO é conta, e o alerta é derivado do número.',
    objetivo: 'Calcular error budget e burn rate, explicar por que SLO de 100% é inoperável, por que o alerta vem do número e não de flag, e por que o log é sanitizado antes de existir.',
    revisao: [
      { id: 'm13b14-burn', pergunta: 'SLO de 99,9% e taxa de erro observada de 1%. Qual o burn rate?',
        opcoes: [
          opc('a', '10×', true, 'orçamento = 0,1%; burn = 1% ÷ 0,1% = 10. Nesse ritmo o orçamento de 30 dias dura cerca de 3 dias.'),
          opc('b', '0,1×', false, 'esse seria o inverso da conta.'),
          opc('c', '100×', false, '100× seria 10% de erro contra o mesmo SLO.')] },
      { id: 'm13b14-100', pergunta: 'Por que SLO de 100% torna o burn rate indefinido?',
        opcoes: [
          opc('a', 'O orçamento é zero e a divisão por zero; qualquer erro o estoura, então perfeição não é meta operável', true, 'é a lição do simulador do bloco.'),
          opc('b', 'Porque 100% é fácil de atingir', false, 'o problema é a ausência de orçamento.'),
          opc('c', 'Porque o burn rate vira 1×', false, 'não vira 1×; é indefinido.')] },
      { id: 'm13b14-alerta', pergunta: 'Como o alerta de SLO deve ser disparado?',
        opcoes: [
          opc('a', 'Derivado do burn rate calculado; a mensagem carrega o número, não uma flag', true, 'alerta por flag põe dedo humano no caminho do incidente.'),
          opc('b', 'Por uma flag ligada manualmente', false, 'é o antipadrão apontado no diagnóstico do bloco.'),
          opc('c', 'Por média móvel inventada', false, 'percentil sobre média inventada é mentira estatística.')] },
      { id: 'm13b14-log', pergunta: 'Qual a ordem correta entre logar e sanitizar?',
        opcoes: [
          opc('a', 'Sanitizar é pré-condição de emissão: e-mail e chaves viram <code>[REDACTED]</code> antes de o log existir', true, 'log primeiro e sanitizar depois deixa a PII já vazada.'),
          opc('b', 'Logar e limpar depois', false, 'a PII já saiu do processo.'),
          opc('c', 'Não logar nada', false, 'o bloco quer log estruturado, porém sanitizado.')] }
    ],
    abas: [
      { rotulo: 'Entender', blocos: [
        { tipo: 'texto', html:
          '<h3>Duas perguntas, sem reunião</h3>' +
          '<p>Telemetria boa responde <em>onde quebrou</em> e <em>estou queimando budget rápido demais</em>. Se for preciso juntar três pessoas para responder, falta instrumentação.</p>' +
          '<ul><li><strong>Trace local:</strong> spans com <code>trace_id</code> comum e pai/filho explícito, duração medida com <code>time.monotonic</code>. O teste garante que o filho termina dentro do pai. Span sem parentesco vira log com formato bonito.</li>' +
          '<li><strong>Métricas:</strong> contadores e amostras reais com percentil exato; nada de número decorativo.</li>' +
          '<li><strong>Log sanitizado:</strong> <code>sanitize_log</code> troca e-mail e chaves sensíveis por <code>[REDACTED]</code>; PII e segredo não saem do processo por padrão.</li></ul>' +
          '<h3>SLO é conta</h3>' +
          '<p><strong>Error budget</strong> = 1 − SLO. <strong>Burn rate</strong> = taxa de erro observada ÷ taxa orçada. <code>slo_alert</code> dispara quando o burn rate cruza o limiar: a injeção de falha com 10% de erro dispara <code>fast-burn</code> e o tráfego saudável não. O teste <code>test_alerta_derivado_do_numero_nao_de_flag</code> mostra que a mensagem carrega o número calculado.</p>' +
          '<p>O limiar 14,4× é o valor ilustrativo do SRE Workbook para janela de 1 h (consome 2% do orçamento de 30 dias); o do laboratório pode diferir. <strong>Limite:</strong> burn rate distingue falha aguda (alto) de crônica tolerável (perto de 1×), mas depende de o SLO estar bem escolhido.</p>' },
        { tipo: 'takeaway', html: 'Orçamento = <mark>1 − SLO</mark>; alerta vem do <mark>burn rate</mark>; log é <mark>sanitizado antes</mark>.' }
      ] },

      { rotulo: 'Ver funcionando', blocos: [
        { tipo: 'rode', id: 'b14-rode', titulo: 'Rode os oráculos e a conta do SLO', enunciado: 'Aperte Enter. A primeira etapa é a saída registrada no bloco; a segunda é o cálculo do simulador do bloco (SLO 99,9%, erro 1%).',
          prefixo: '$', entrada: 'uv run pytest tests/test_observability.py -v', unidade: 'etapas', terminalTitulo: 'lab M13 (registrado + cálculo)',
          prever: { pergunta: 'Com SLO 99,9% e 1% de erro, em quanto tempo o orçamento de 30 dias acaba?', opcoes: [
            { id: 'a', texto: 'Cerca de 3 dias', correta: true, porque: 'burn = 10×; 720 h ÷ 10 = 72 h = 3 dias.' },
            { id: 'b', texto: 'Cerca de 30 dias', correta: false, porque: '30 dias seria burn de 1×, o ritmo sustentável.' },
            { id: 'c', texto: 'Cerca de 7 horas', correta: false, porque: '7 horas seria um burn de uns 100×.' }
          ] },
          etapas: [
            { id: 'pytest', nome: 'Oráculos', descricao: 'Trace, métricas, log, SLO', tom: 'dns', ms: 6, linhas: [
              L('cmd', 'uv run pytest tests/test_observability.py -v'),
              L('out', 'test_trace_parent_child_mesmo_trace_id PASSED'),
              L('out', 'test_metricas_contador_e_percentil_real PASSED'),
              L('out', 'test_log_sanitizado_remove_pii_e_segredo PASSED'),
              L('out', 'test_slo_matematica_exata PASSED'),
              L('out', 'test_failure_injection_dispara_alerta_correto PASSED'),
              L('out', 'test_alerta_derivado_do_numero_nao_de_flag PASSED'),
              L('in', '6 passed')] },
            { id: 'conta', nome: 'Conta do SLO', descricao: 'Simulador do bloco: 99,9% e 1%', tom: 'request', ms: 3, linhas: [
              L('info', 'Orçamento de erro: 0,10% das requisições'),
              L('out', 'Burn rate: 10,00×'),
              L('out', 'orçamento de 30 dias acaba em 3,0 dias'),
              L('hint', 'abaixo de 14,4×: atenção, slow-burn (abra ticket), não fast-burn')] },
            { id: 'fast', nome: 'Falha injetada', descricao: '10% de erro', tom: 'response', ms: 2, linhas: [
              L('out', 'burn rate: 10% ÷ 0,1% = 100×'),
              L('in', 'ALERTA fast-burn: acima do limiar'),
              L('hint', 'é o caso de <code>test_failure_injection_dispara_alerta_correto</code>')] }
          ],
          tutorAntes: 'Responda a previsão e aperte Enter.',
          callout: 'Você viu a conta do orçamento e o alerta derivado do número.' },
        { tipo: 'cenario', id: 'b14-cenario', titulo: 'O SLO de 100%', obrigatorio: false,
          enunciado: 'A diretoria pede "SLO de 100%, nenhum erro tolerado". Decida. Cenário de exemplo.',
          inicio: 'inicio',
          nos: {
            inicio: { texto: 'Você precisa configurar o alerta de burn rate para esse SLO. O que acontece com a conta?', opcoes: [
              { texto: 'Configurar o alerta com SLO 100% e seguir.', vai: 'f-div', tom: 'ruim', consequencia: 'o orçamento é zero e o burn rate é indefinido: qualquer erro o estoura.' },
              { texto: 'Explicar que perfeição não é meta operável e propor um SLO com orçamento (por exemplo, 99,9%).', vai: 'alerta', tom: 'ok', consequencia: 'o orçamento de 0,1% torna o burn rate calculável.' }
            ] },
            alerta: { texto: 'Com 99,9% definido, como o alerta deve disparar?', opcoes: [
              { texto: 'Por uma flag que o plantão liga quando achar grave.', vai: 'f-flag', tom: 'ruim', consequencia: 'o dedo humano entra no caminho do incidente.' },
              { texto: 'Pelo burn rate calculado, com o número na mensagem.', vai: 'f-bom', tom: 'ok', consequencia: 'o alerta é reproduzível e auditável.' }
            ] }
          },
          finais: {
            'f-div': { texto: 'A conta quebra por divisão por zero e o alerta nunca é confiável.', bom: false },
            'f-flag': { texto: 'O alerta depende de quem olha o painel, não do número.', bom: false },
            'f-bom': { texto: 'SLO com orçamento e alerta derivado do burn rate.', bom: true }
          } },
        { tipo: 'takeaway', html: '<mark>Perfeição</mark> não é meta; <mark>orçamento</mark> é o que torna o alerta calculável.' }
      ] },

      { rotulo: 'Praticar e conferir', blocos: [
        { tipo: 'python', id: 'b14-python', titulo: 'Burn rate, alerta e log sanitizado', obrigatorio: false,
          enunciado: 'Implemente <code>burn_rate(slo, error_rate)</code> (arredonde a 6 casas; SLO ≥ 1 levanta <code>ValueError</code>), <code>slo_alert(slo, error_rate, threshold=14.4)</code> (devolve <code>None</code> ou <code>"fast-burn: burn rate &lt;número&gt;"</code>) e <code>sanitize_log(text)</code>. Versão reduzida do <code>observability.py</code>.',
          codigo: codigoObs, testes: testesObs,
          dica: '<code>round(error_rate / (1 - slo), 6)</code> evita a sujeira de ponto flutuante. Para o log, duas regex: e-mail e <code>chave[:=]valor</code>.',
          solucao: solucaoObs,
          tutorDepois: 'A mensagem do alerta contém o número calculado, que é o que o teste de flag exige.',
          callout: 'Seu alerta sai do número e seu log sai sanitizado.' },
        { tipo: 'escolha', id: 'b14-esc1', titulo: 'Percentil', pergunta: 'Um painel mostra "p99 = 80 ms" calculado sobre uma média móvel inventada. Qual a leitura?',
          opcoes: [
            opc('a', 'Mentira estatística: percentil exige amostra real', true, 'o bloco usa amostras reais com percentil exato.'),
            opc('b', 'Aceitável se for suave', false, 'suavizar esconde a cauda.'),
            opc('c', 'Equivale à média', false, 'percentil e média respondem perguntas diferentes.')] },
        { tipo: 'takeaway', html: 'Telemetria sem <mark>amostra real</mark> é decoração.' }
      ] }
    ]
  });
})();
