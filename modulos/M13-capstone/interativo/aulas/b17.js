/* M13 · Bloco 17: deploy, dados e rollback. Fonte: M13.html#h-b17. Saídas do rode são a execução registrada no bloco (evidence/m13/B17). */
(function () {
  var L = function (kind, text) { return { kind: kind, text: text }; };
  function opc(id, texto, correta, porque) { return { id: id, texto: texto, correta: correta, porque: porque }; }

  var codigoDep = String.raw`import hashlib
import json

def state_hash(state):
    # LACUNA: SHA-256 do JSON canonico (chaves ordenadas) do estado.
    return ""

def deploy(state, migrations):
    # LACUNA: valide ANTES de escrever que toda migration tem "down";
    # aplique "up" em ordem, so as de version > state["schema_version"].
    return state

def rollback(state, migrations, to_version):
    # LACUNA: aplique "down" em ordem reversa ate chegar em to_version.
    return state
`;
  var solucaoDep = String.raw`import hashlib
import json

def state_hash(state):
    canon = json.dumps(state, sort_keys=True, separators=(",", ":"))
    return hashlib.sha256(canon.encode("utf-8")).hexdigest()

def deploy(state, migrations):
    for m in migrations:
        if not callable(m.get("down")):
            raise ValueError("migration " + str(m["version"]) + " sem down")
    for m in sorted(migrations, key=lambda m: m["version"]):
        if m["version"] > state["schema_version"]:
            m["up"](state["data"])
            state["schema_version"] = m["version"]
    return state

def rollback(state, migrations, to_version):
    for m in sorted(migrations, key=lambda m: m["version"], reverse=True):
        if state["schema_version"] >= m["version"] > to_version:
            m["down"](state["data"])
            state["schema_version"] = m["version"] - 1
    return state
`;
  var testesDep = String.raw`def mig(v, campo):
    return {
        "version": v,
        "up": lambda d: d.__setitem__(campo, v),
        "down": lambda d: d.pop(campo),
    }

def novo():
    return {"schema_version": 0, "data": {"base": 1}}

def test_aplica_em_ordem_e_e_idempotente():
    s = novo()
    ms = [mig(2, "b"), mig(1, "a")]
    deploy(s, ms)
    assert s["schema_version"] == 2 and s["data"] == {"base": 1, "a": 1, "b": 2}
    h = state_hash(s)
    deploy(s, ms)
    assert state_hash(s) == h

def test_release_ruim_nao_escreve_nada():
    s = novo()
    antes = state_hash(s)
    ruim = [mig(1, "a"), {"version": 2, "up": lambda d: None}]
    try:
        deploy(s, ruim)
    except ValueError:
        assert state_hash(s) == antes
        return
    assert False, "deveria levantar ValueError"

def test_rollback_restaura_hash_exato():
    s = novo()
    antes = state_hash(s)
    ms = [mig(1, "a"), mig(2, "b")]
    deploy(s, ms)
    assert state_hash(s) != antes
    rollback(s, ms, 0)
    assert state_hash(s) == antes

def test_rollback_parcial():
    s = novo()
    ms = [mig(1, "a"), mig(2, "b")]
    deploy(s, ms)
    rollback(s, ms, 1)
    assert s["schema_version"] == 1 and s["data"] == {"base": 1, "a": 1}

def test_hash_ignora_ordem_das_chaves():
    assert state_hash({"a": 1, "b": 2}) == state_hash({"b": 2, "a": 1})
`;

  TrilhaAula.registrar({
    id: 'm13-b17',
    titulo: 'Deploy, dados e rollback',
    minutos: 30,
    resumo: 'Deploy é um documento declarativo; o motor aplica o declarado. Release ruim não entra, e rollback é determinístico: provado por hash igual do estado, não por sensação.',
    objetivo: 'Explicar o HealthGate antes de qualquer escrita, a ordem das migrations up e down, o que o hash do estado prova que "testes passaram" não prova e o que muda do simulador para Kubernetes real.',
    revisao: [
      { id: 'm13b17-decl', pergunta: 'O que significa deploy como documento declarativo?',
        opcoes: [
          opc('a', 'Versão, migrations e estratégia descritas num documento; o motor aplica exatamente o declarado, sem improvisar', true, 'o documento (<code>release_design()</code>) é portável para IaC; K8s real está BLOCKED.'),
          opc('b', 'Um script que o plantão ajusta na hora', false, 'improvisar é o oposto do declarativo.'),
          opc('c', 'Uma planilha de checagem', false, 'o motor executa o documento; não é lista manual.')] },
      { id: 'm13b17-gate', pergunta: 'Quando o <code>HealthGate</code> age e o que acontece com o estado?',
        opcoes: [
          opc('a', 'Antes de qualquer escrita: release ruim não entra e o estado fica intacto', true, 'invariantes checáveis decidem, não opinião; gate manual deixa passar quem está com pressa.'),
          opc('b', 'Depois do deploy, revertendo', false, 'o gate barra antes de escrever.'),
          opc('c', 'Só avisa', false, 'release que não passa não entra.')] },
      { id: 'm13b17-hash', pergunta: 'O hash SHA-256 do estado é igual antes do deploy e depois do ciclo deploy→rollback. O que isso prova que "os testes passaram" não prova?',
        opcoes: [
          opc('a', 'Que o rollback devolveu o estado byte a byte, e não apenas "parece que voltou"', true, 'rollback determinístico com migrations <code>down</code> em ordem reversa.'),
          opc('b', 'Que o código novo está correto', false, 'o hash não diz nada sobre a correção do código novo.'),
          opc('c', 'Que o HealthGate está desligado', false, 'não tem relação.')] },
      { id: 'm13b17-down', pergunta: 'Por que migration sem <code>down</code> é problema?',
        opcoes: [
          opc('a', 'Torna o rollback impossível por construção; <code>down</code> é obrigatório e testado', true, 'e redeploy que reaplica migration faz o estado derivar: idempotência por <code>schema_version</code>.'),
          opc('b', 'Deixa o deploy mais lento', false, 'o problema é a irreversibilidade.'),
          opc('c', 'Não é problema', false, 'é o primeiro item do diagnóstico.')] }
    ],
    abas: [
      { rotulo: 'Entender', blocos: [
        { tipo: 'texto', html:
          '<h3>A release que entra com pressa</h3>' +
          '<p>Sexta, 17h: a release tem um problema que só aparece nos dados. Alguém aprova o "health check" na mão porque está com pressa, a migration roda e não existe caminho de volta. Os controles do bloco existem para que a pressa não decida.</p>' +
          '<ul><li><strong>Documento declarativo:</strong> versão, migrations e estratégia; o motor aplica exatamente o declarado.</li>' +
          '<li><strong>HealthGate:</strong> reprova <em>antes</em> de qualquer escrita; o estado fica intacto. A decisão vem de invariantes checáveis.</li>' +
          '<li><strong>Idempotência:</strong> o redeploy não reaplica migration, pois a versão é controlada por <code>schema_version</code>.</li>' +
          '<li><strong>Rollback determinístico:</strong> migrations <code>down</code> em ordem reversa. O teste prova <strong>igualdade de hash SHA-256 do estado</strong> antes e depois do ciclo deploy→rollback.</li>' +
          '<li><strong>Backup e restore:</strong> o restore verifica o hash antes de escrever; backup corrompido é rejeitado (<code>restore-report.json</code>).</li></ul>' +
          '<p>As fontes do bloco incluem o padrão <strong>expand/contract</strong> (Fowler): expandir o esquema de modo compatível, migrar os dados, e só então contrair. É a estratégia segura sob deploy contínuo porque cada passo tem versão antiga e nova convivendo.</p>' +
          '<p><strong>Limite:</strong> Kubernetes e cloud reais estão <strong>BLOCKED</strong> (sem cluster nem credenciais). O motor prova a semântica de gate e rollback localmente; o documento declarativo é portável, mas a execução real num cluster não foi feita.</p>' },
        { tipo: 'ordene', id: 'b17-ordene', titulo: 'Ponha o ciclo na ordem',
          enunciado: 'Ponha as etapas do ciclo deploy→rollback na ordem em que o bloco as descreve.',
          itens: [
            { id: 'rollback', texto: 'Rollback: aplicar as migrations <code>down</code> em ordem reversa' },
            { id: 'hash0', texto: 'Registrar o hash SHA-256 do estado antes' },
            { id: 'up', texto: 'Aplicar as migrations <code>up</code> declaradas' },
            { id: 'gate', texto: 'HealthGate: reprovar a release ruim antes de qualquer escrita' },
            { id: 'hash1', texto: 'Comparar o hash depois do ciclo com o de antes' }
          ], solucao: ['hash0', 'gate', 'up', 'rollback', 'hash1'],
          dica: 'O hash inicial vem antes de tudo e a comparação só faz sentido no fim; o gate vem antes da primeira escrita.',
          tutorDepois: 'Hash, gate, up, rollback e comparação. Hash igual é a prova de que "voltou" é byte igual.' },
        { tipo: 'takeaway', html: 'Gate <mark>antes</mark> de escrever; rollback provado por <mark>hash igual</mark>.' }
      ] },

      { rotulo: 'Ver funcionando', blocos: [
        { tipo: 'rode', id: 'b17-rode', titulo: 'Rode os oráculos de deploy', enunciado: 'Aperte Enter e acompanhe. Saída registrada no bloco (<code>evidence/m13/B17</code>).',
          prefixo: '$', entrada: 'uv run pytest tests/test_deploy.py -v', unidade: 'testes', terminalTitulo: 'lab M13 (saída registrada)',
          prever: { pergunta: 'O que o teste de release ruim exige do estado quando o HealthGate reprova?', opcoes: [
            { id: 'a', texto: 'Que o estado fique intacto, porque nada foi escrito', correta: true, porque: '<code>test_release_ruim_reprovada_por_health_gate</code>: o gate barra antes de qualquer escrita.' },
            { id: 'b', texto: 'Que o estado seja restaurado depois por rollback', correta: false, porque: 'não houve escrita a desfazer; o gate agiu antes.' },
            { id: 'c', texto: 'Que a migration rode e seja marcada como falha', correta: false, porque: 'migration não roda quando o gate reprova.' }
          ] },
          etapas: [
            { id: 'aplica', nome: 'Aplicação', descricao: 'Ordem e idempotência', tom: 'dns', ms: 2, linhas: [
              L('cmd', 'uv run pytest tests/test_deploy.py -v'),
              L('out', 'test_deploy_aplica_migrations_em_ordem_e_idempotente PASSED'),
              L('out', 'test_release_ruim_reprovada_por_health_gate PASSED')] },
            { id: 'volta', nome: 'Rollback', descricao: 'Hash igual antes e depois', tom: 'request', ms: 2, linhas: [
              L('out', 'test_rollback_deterministico_restaura_estado PASSED'),
              L('hint', 'prova de igualdade de hash SHA-256, não impressão')] },
            { id: 'dados', nome: 'Backup e design', descricao: 'Restore verificado, release declarativa', tom: 'response', ms: 2, linhas: [
              L('out', 'test_backup_restore_com_hash_e_integridade PASSED'),
              L('out', 'test_release_design_declarativo_completo PASSED'),
              L('in', '5 passed'),
              L('hint', 'Kubernetes real: BLOCKED (sem cluster nem credenciais)')] }
          ],
          tutorAntes: 'Responda a previsão e aperte Enter.',
          callout: 'Você viu os cinco oráculos de deploy passarem.' },
        { tipo: 'takeaway', html: '<mark>Hash igual</mark> prova rollback; <mark>K8s real</mark> segue BLOCKED.' }
      ] },

      { rotulo: 'Praticar e conferir', blocos: [
        { tipo: 'python', id: 'b17-python', titulo: 'Deploy com gate e rollback por hash', obrigatorio: false,
          enunciado: 'Implemente <code>state_hash(state)</code> (SHA-256 do JSON com chaves ordenadas), <code>deploy(state, migrations)</code> (valida que toda migration tem <code>down</code> <em>antes</em> de escrever; aplica <code>up</code> em ordem só acima de <code>schema_version</code>) e <code>rollback(state, migrations, to_version)</code> (<code>down</code> em ordem reversa). Versão reduzida do <code>deploy.py</code> do bloco.',
          codigo: codigoDep, testes: testesDep,
          dica: 'Valide num primeiro laço sem escrever nada. Depois ordene por <code>version</code>; no rollback, ordene ao contrário e desça <code>schema_version</code> a cada <code>down</code>.',
          solucao: solucaoDep,
          tutorDepois: 'Repare no teste de release ruim: o hash do estado não muda, porque a validação veio antes do primeiro <code>up</code>.',
          callout: 'Seu deploy barra release ruim e seu rollback devolve o hash exato.' },
        { tipo: 'escolha', id: 'b17-esc1', titulo: 'Restore', pergunta: 'Um backup chega corrompido. O que o restore faz?',
          opcoes: [
            opc('a', 'Verifica o hash antes de escrever e rejeita o backup corrompido', true, 'restore sem verificação de integridade restaura lixo com confiança.'),
            opc('b', 'Restaura o que der e avisa', false, 'restauraria estado inválido.'),
            opc('c', 'Restaura e depois roda o health check', false, 'a verificação vem antes da escrita.')] },
        { tipo: 'escolha', id: 'b17-esc2', titulo: 'Gate manual', pergunta: 'O time propõe um "health gate" em que alguém aprova na mão quando houver urgência. Qual a leitura?',
          opcoes: [
            opc('a', 'Release ruim entra quando alguém está com pressa; o gate deve ser invariante checável', true, 'é o último item do diagnóstico do bloco.'),
            opc('b', 'É mais flexível e portanto melhor', false, 'flexibilidade sob pressão é o risco.'),
            opc('c', 'Aceitável se houver dois aprovadores', false, 'dois humanos sob pressão continuam sendo opinião.')] },
        { tipo: 'takeaway', html: 'Restore e gate <mark>verificam</mark> antes de escrever.' }
      ] }
    ]
  });
})();
