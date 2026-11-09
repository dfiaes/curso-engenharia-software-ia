/* Trilha rápida · mecanismos de aprendizagem com evidência forte.
   Carregue depois de trilha-aula.js e antes das aulas. Tudo é opcional por aula; veja engine/README.md.
   Este arquivo traz: calibração de confiança, revisão espaçada (Leitner), tela "Revisão do dia",
   window.CursoRevisao e os exercícios complete, escreva, cenario, transcript e python.
   (prever em rode/quebre, confiança em escolha e o botão "Perguntar ao tutor" ficam em trilha-aula.js.) */
(function () {
  'use strict';
  var TA = window.TrilhaAula;
  if (!TA || !TA._i) { console.error('trilha-aprender.js: carregue trilha-aula.js antes.'); return; }
  var I = TA._i, h = I.h, T = I.T, Html = I.Html, Painel = I.Painel, TutorLive = I.TutorLive, semAinda = I.semAinda, cap = I.cap;
  var React = window.React, useState = React.useState, useRef = React.useRef, useEffect = React.useEffect;
  var Button = T.Button, Badge = T.Badge, Callout = T.Callout, Tutor = T.TutorBubble, Card = T.Card;

  /* ---------- armazenamento (sempre em try/catch) ---------- */
  function lerJson(k, def) { try { var v = JSON.parse(localStorage.getItem(k) || 'null'); return v == null ? def : v; } catch (e) { return def; } }
  function gravarJson(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  function avisar() { try { window.dispatchEvent(new Event('curso:srs')); } catch (e) {} }
  function p2(n) { return n < 10 ? '0' + n : '' + n; }
  function dataStr(d) { return d.getFullYear() + '-' + p2(d.getMonth() + 1) + '-' + p2(d.getDate()); }
  function hoje() { return dataStr(new Date()); }
  function somarDias(str, n) { var a = str.split('-'); return dataStr(new Date(+a[0], +a[1] - 1, +a[2] + n)); }
  function embaralhar(arr) { var a = arr.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function plural(n, a, b) { return n === 1 ? a : b; }

  /* ---------- calibração ---------- */
  var CAL_KEY = 'curso.calibracao.v1';
  var NIVEIS = [{ id: 'chuto', rotulo: 'Chuto' }, { id: 'acho', rotulo: 'Acho' }, { id: 'certeza', rotulo: 'Tenho certeza' }];
  function lerCal() { var a = lerJson(CAL_KEY, []); return Array.isArray(a) ? a : []; }
  function registrarCalibracao(r) {
    var a = lerCal();
    a.push({ aula: r.aula || '', exercicio: r.exercicio || '', confianca: r.confianca, acertou: !!r.acertou, data: new Date().toISOString() });
    if (a.length > 1000) a = a.slice(-1000);
    gravarJson(CAL_KEY, a);
    avisar();
  }
  function resumoCalibracao() {
    var cal = lerCal(), r = {};
    NIVEIS.forEach(function (n) {
      var xs = cal.filter(function (c) { return c.confianca === n.id; });
      var ok = xs.filter(function (c) { return c.acertou; }).length;
      r[n.id] = { n: xs.length, acertos: ok, taxa: xs.length ? ok / xs.length : null };
    });
    r.total = cal.length;
    r.frase = frase(r, cal);
    return r;
  }
  function pct(x) { return Math.round(x * 100) + '%'; }
  function frase(r, cal) {
    var c = r.certeza, ch = r.chuto;
    if (c.n >= 3 && c.taxa < 0.8) {
      var cont = {};
      cal.forEach(function (x) { if (x.confianca === 'certeza' && !x.acertou && x.aula) cont[x.aula] = (cont[x.aula] || 0) + 1; });
      var top = Object.keys(cont).sort(function (a, b) { return cont[b] - cont[a]; }).slice(0, 2).map(function (id) { return '“' + tituloAula(id) + '”'; });
      return 'Quando você tem certeza, acerta ' + pct(c.taxa) + (top.length ? ': revise ' + top.join(' e ') + '.' : ': desconfie das respostas em que você sentiu certeza e errou.');
    }
    if (ch.n >= 3 && ch.taxa >= 0.6) return 'Seus chutes acertam ' + pct(ch.taxa) + ': você sabe mais do que imagina.';
    if (c.n >= 3) return 'Quando você tem certeza, acerta ' + pct(c.taxa) + ': sua confiança acompanha o acerto.';
    return 'Responda mais algumas perguntas com confiança (pelo menos 3 em “Tenho certeza”) para ver sua leitura.';
  }
  function Confianca(p) {
    var ref = useRef(null);
    useEffect(function () {
      // Sem seleção, nenhum botão do SegmentedControl é focável; o primeiro entra na ordem de tabulação.
      var r = ref.current; if (!r || p.value) return;
      var b = r.querySelector('.tr-seg-item'); if (b) b.setAttribute('tabindex', '0');
    });
    return h('div', { ref: ref }, h(T.SegmentedControl, {
      options: NIVEIS.map(function (n) { return { value: n.id, label: n.rotulo }; }), value: p.value || '', onChange: p.onChange, 'aria-label': 'Nível de confiança'
    }));
  }
  function CalibracaoPainel() {
    var r = resumoCalibracao();
    return h(Card, { variant: 'raised', title: 'Sua calibração', subtitle: 'Quanto você acerta em cada nível de confiança', className: 'ta-calib' },
      r.total === 0
        ? h('p', { className: 'ta-nota-inline' }, 'Ainda sem dados. Responda perguntas de múltipla escolha dizendo o quanto confia na resposta.')
        : h('div', { className: 'ta-calib-linhas' }, NIVEIS.map(function (n) {
          var x = r[n.id];
          return h('div', { key: n.id, className: 'ta-calib-linha' },
            h(T.ProgressBar, { value: x.taxa || 0, tone: 'brand', label: n.rotulo + ' · ' + (x.n ? x.acertos + ' de ' + x.n : 'sem respostas'), showValue: x.n > 0, 'aria-label': 'Acerto quando: ' + n.rotulo }));
        })),
      r.total > 0 && h('p', { className: 'ta-calib-frase' }, r.frase));
  }

  /* ---------- revisão espaçada (Leitner, 5 caixas) ---------- */
  var SRS_KEY = 'curso.srs.v1', INTERVALOS = [1, 3, 7, 16, 35];
  function lerSrs() {
    var o = lerJson(SRS_KEY, null);
    if (!o || typeof o !== 'object' || !o.itens) o = { v: 1, itens: {}, dias: [] };
    if (!Array.isArray(o.dias)) o.dias = [];
    return o;
  }
  function gravarSrs(o) { gravarJson(SRS_KEY, o); avisar(); }
  /* Pseudo-aula "diario": itens vêm de window.DIARIO_REVISAO (gerado por tools/build_diario.py; opcional). */
  var DIARIO_MAX_DIA = 3, DIARIO_JANELA = 30;
  function esc(t) { return String(t == null ? '' : t).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function diarioLista() { var d = window.DIARIO_REVISAO; return Array.isArray(d) ? d : []; }
  function dataBr(iso) { var a = String(iso || '').split('-'); return a.length === 3 ? a[2] + '/' + a[1] : ''; }
  function diarioItem(id) {
    var d = diarioLista().filter(function (x) { return x && x.id === id && Array.isArray(x.opcoes) && x.opcoes.length; })[0];
    if (!d) return null;
    return {
      id: d.id, pergunta: esc(d.pergunta), diario: { data: d.data, url: d.url },
      opcoes: d.opcoes.map(function (o, i) { return { id: String.fromCharCode(97 + i), texto: esc(o.texto), correta: !!o.correta, porque: o.correta ? esc(d.porque) : '' }; })
    };
  }
  function itemDe(aulaId, id) {
    if (aulaId === 'diario') return diarioItem(id);
    var a = I.aula(aulaId);
    var vivo = a && a.revisao ? a.revisao.filter(function (x) { return x.id === id; })[0] : null;
    if (vivo) return vivo;
    // Aula de outro módulo (não carregada nesta página): usa a cópia gravada na matrícula.
    var sv = (lerSrs().itens[aulaId + ':' + id] || {}).q;
    return sv && sv.pergunta && Array.isArray(sv.opcoes) ? sv : null;
  }
  function tituloAula(aulaId) {
    if (I.aula(aulaId)) return I.tituloDe(aulaId);
    var its = lerSrs().itens, k = Object.keys(its).filter(function (x) { return its[x].aula === aulaId && its[x].t; })[0];
    return k ? its[k].t : I.tituloDe(aulaId);
  }
  // Matrícula automática: últimos 30 dias, só itens novos, no máximo 3 por dia (contador em diarioMatriculaEm/diarioMatriculaN).
  function diarioMatricular() {
    var lista = diarioLista(); if (!lista.length) return;
    var srs = lerSrs(), hj = hoje(), corte = somarDias(hj, -DIARIO_JANELA);
    var n = srs.diarioMatriculaEm === hj ? (+srs.diarioMatriculaN || 0) : 0, mudou = false;
    lista.filter(function (d) { return d && d.id && d.data >= corte && d.data <= hj && !srs.itens['diario:' + d.id] && diarioItem(d.id); })
      .sort(function (a, b) { return a.data < b.data ? 1 : a.data > b.data ? -1 : (a.id < b.id ? -1 : 1); })
      .forEach(function (d) {
        if (n >= DIARIO_MAX_DIA) return;
        srs.itens['diario:' + d.id] = { aula: 'diario', id: d.id, caixa: 1, prox: hj, ultima: null };
        n++; mudou = true;
      });
    if (mudou) { srs.diarioMatriculaEm = hj; srs.diarioMatriculaN = n; gravarSrs(srs); }
  }
  function matricular(aulaId) {
    var a = I.aula(aulaId); if (!a || !a.revisao || !a.revisao.length) return;
    var srs = lerSrs(), mudou = false;
    a.revisao.forEach(function (it) {
      var k = aulaId + ':' + it.id;
      var q = { pergunta: it.pergunta, opcoes: it.opcoes };
      if (!srs.itens[k]) { srs.itens[k] = { aula: aulaId, id: it.id, caixa: 1, prox: somarDias(hoje(), INTERVALOS[0]), ultima: null, t: a.titulo, q: q }; mudou = true; }
      else if (JSON.stringify(srs.itens[k].q) !== JSON.stringify(q) || srs.itens[k].t !== a.titulo) { srs.itens[k].q = q; srs.itens[k].t = a.titulo; mudou = true; }
    });
    if (mudou) gravarSrs(srs);
  }
  function intercalar(arr, limite) {
    var grupos = [], idx = {};
    arr.forEach(function (it) { if (idx[it.aula] == null) { idx[it.aula] = grupos.length; grupos.push([]); } grupos[idx[it.aula]].push(it); });
    var out = [];
    while (out.length < limite && grupos.some(function (g) { return g.length; })) {
      grupos.forEach(function (g) { if (g.length && out.length < limite) out.push(g.shift()); });
    }
    return out;
  }
  function vencidos(estrito) {
    var srs = lerSrs(), hj = hoje();
    var arr = Object.keys(srs.itens).map(function (k) { return srs.itens[k]; }).filter(function (it) {
      if (it.prox > hj) return false;
      if (estrito) return !!itemDe(it.aula, it.id);
      if (it.aula === 'diario') return !!itemDe(it.aula, it.id);
      return !I.aula(it.aula) || !!itemDe(it.aula, it.id);
    });
    arr.sort(function (a, b) { return a.prox < b.prox ? -1 : a.prox > b.prox ? 1 : 0; });
    return arr;
  }
  function copia(it) { return { aula: it.aula, id: it.id, caixa: it.caixa, prox: it.prox }; }
  function pendentes(limite) { return intercalar(vencidos(false), limite == null ? 10 : limite).map(copia); }
  function pendentesResolvidos(limite) { return intercalar(vencidos(true), limite == null ? 10 : limite).map(copia); }
  function registrar(aulaId, id, acertou, confianca, opts) {
    var srs = lerSrs(), k = aulaId + ':' + id, it = srs.itens[k] || { aula: aulaId, id: id, caixa: 1, prox: hoje(), ultima: null };
    var res = { caixa: it.caixa, prox: it.prox, treino: !!(opts && opts.treino) };
    if (!res.treino) {
      var caixa = acertou ? Math.min(5, it.caixa + 1) : 1;
      it.caixa = caixa; it.prox = somarDias(hoje(), INTERVALOS[caixa - 1]); it.ultima = hoje();
      srs.itens[k] = it;
      if (srs.dias.indexOf(hoje()) < 0) srs.dias.push(hoje());
      gravarSrs(srs);
      res = { caixa: caixa, prox: it.prox, intervalo: INTERVALOS[caixa - 1], treino: false };
    }
    if (confianca) registrarCalibracao({ aula: aulaId, exercicio: 'revisao:' + id, confianca: confianca, acertou: acertou });
    return res;
  }
  function sequencia() {
    var srs = lerSrs(), set = {}; srs.dias.forEach(function (d) { set[d] = true; });
    var d = hoje(), feitoHoje = !!set[d]; if (!feitoHoje) d = somarDias(d, -1);
    var n = 0; while (set[d]) { n++; d = somarDias(d, -1); }
    return { dias: n, hoje: feitoHoje };
  }
  function total() { return Object.keys(lerSrs().itens).length; }
  // API pequena para o portal mostrar o card "Revisão do dia" depois (não depende das aulas carregadas).
  window.CursoRevisao = {
    diarioMatricular: diarioMatricular, pendentes: pendentes, registrar: registrar, total: total, sequencia: sequencia, calibracao: resumoCalibracao,
    intervalos: INTERVALOS.slice()
  };
  diarioMatricular();
  TA._aprender = {
    Confianca: Confianca, CalibracaoPainel: CalibracaoPainel, registrarCalibracao: registrarCalibracao, matricular: matricular,
    pendentesResolvidos: pendentesResolvidos, RevisaoDia: RevisaoDia
  };

  /* ---------- tela "Revisão do dia" ---------- */
  function todosItens(soMatriculados) {
    var out = [], srs = lerSrs();
    var aulas = I.aulas();
    Object.keys(aulas).forEach(function (id) {
      (aulas[id].revisao || []).forEach(function (it) {
        if (!soMatriculados || srs.itens[id + ':' + it.id]) out.push({ aula: id, id: it.id, caixa: (srs.itens[id + ':' + it.id] || {}).caixa || 1 });
      });
    });
    return out;
  }
  function montarFila(refs) {
    return refs.map(function (r) {
      var it = itemDe(r.aula, r.id);
      return { aula: r.aula, id: r.id, caixa: r.caixa, pergunta: it.pergunta, diario: it.diario, opcoes: embaralhar(it.opcoes || []) };
    });
  }
  function RevisaoDia(p) {
    var s = useState(function () {
      diarioMatricular();
      var refs = pendentesResolvidos(10);
      return refs.length ? { fase: 'perguntando', fila: montarFila(refs), i: 0, sel: null, conf: null, res: null, resultados: [], treino: false } : { fase: 'vazio', fila: [], i: 0, resultados: [], treino: false };
    }), S = s[0];
    function set(patch) { s[1](function (o) { return Object.assign({}, o, patch); }); }
    function treinar() {
      var todos = todosItens(true); if (!todos.length) todos = todosItens(false);
      var refs = embaralhar(todos).slice(0, 5);
      if (!refs.length) return;
      s[1]({ fase: 'perguntando', fila: montarFila(refs), i: 0, sel: null, conf: null, res: null, resultados: [], treino: true });
    }
    function conferir() {
      var q = S.fila[S.i], o = q.opcoes.filter(function (x) { return x.id === S.sel; })[0];
      if (!o || !S.conf) return;
      var r = registrar(q.aula, q.id, !!o.correta, S.conf, { treino: S.treino });
      set({ res: { opcao: o, acertou: !!o.correta, reg: r }, resultados: S.resultados.concat([{ aula: q.aula, id: q.id, acertou: !!o.correta }]) });
    }
    function proxima() {
      if (S.i + 1 >= S.fila.length) set({ fase: 'fim' }); else set({ i: S.i + 1, sel: null, conf: null, res: null });
    }
    var seq = sequencia();
    var blocoSeq = h('p', { className: 'ta-seq' }, h('strong', null, 'Sequência: ' + seq.dias + ' ' + plural(seq.dias, 'dia', 'dias')),
      seq.dias ? ' seguidos com revisão feita.' : ' Faça uma revisão hoje para começar.', h('span', { className: 'ta-nota-inline' }, ' Sem pontos, sem ranking: só o hábito.'));

    if (S.fase === 'vazio') {
      return h('div', { className: 'ta-blocos' },
        h(Card, { variant: 'panel', title: 'Revisão do dia' },
          h('div', { className: 'ta-preparo' },
            h('p', { style: { margin: 0 } }, 'Nada para revisar hoje. Volte amanhã.'),
            h('p', { className: 'ta-nota-inline', style: { margin: 0 } }, total() ? 'Os itens voltam em 1, 3, 7, 16 e 35 dias, conforme você acerta.' : 'Os itens entram aqui quando você conclui uma aula.'),
            h(Button, { variant: 'tinted', onClick: treinar, disabled: todosItens(false).length === 0 }, 'Revisar mesmo assim (5 aleatórios)'),
            blocoSeq)),
        h(CalibracaoPainel));
    }
    if (S.fase === 'fim') {
      var ok = S.resultados.filter(function (r) { return r.acertou; }).length;
      var erradas = S.resultados.filter(function (r) { return !r.acertou; }), aulasErr = [];
      erradas.forEach(function (r) { if (r.aula !== 'diario' && aulasErr.indexOf(r.aula) < 0) aulasErr.push(r.aula); });
      return h('div', { className: 'ta-blocos' },
        h(Card, { variant: 'panel', title: S.treino ? 'Treino concluído' : 'Revisão concluída' },
          h('div', { className: 'ta-preparo' },
            h('p', { style: { margin: 0 } }, 'Você acertou ', h('strong', null, ok + ' de ' + S.resultados.length), '.',
              S.treino ? ' Treino livre: as caixas não mudaram.' : ''),
            aulasErr.length > 0 && h('div', null, h('span', { className: 'ta-field-label' }, 'Para rever'),
              h('ul', { className: 'ta-rever' }, aulasErr.map(function (id) { return h('li', { key: id }, I.aula(id) ? h('a', { href: '#aula=' + encodeURIComponent(id) + '&aba=1' }, tituloAula(id)) : tituloAula(id)); }))),
            blocoSeq,
            h('div', { className: 'ta-acoes' }, h(Button, { variant: 'gray', onClick: p.onSair }, 'Voltar às aulas')))),
        h(CalibracaoPainel));
    }
    var q = S.fila[S.i], r = S.res;
    var tutor = r ? { tom: r.acertou ? 'success' : 'danger', lead: r.acertou ? 'Certo.' : 'Ainda não:', html: (function () {
      var c = q.opcoes.filter(function (x) { return x.correta; })[0] || {};
      if (r.acertou) return r.opcao.porque || '';
      var pq = semAinda(r.opcao.porque || '');
      var fim = function (t) { t = String(t || '').trim(); return t && !/[.!?]$/.test(t.replace(/<[^>]+>/g, '')) ? t + '.' : t; };
      return (pq ? fim(pq) + ' <br>' : '') + 'A correta é: ' + fim(c.texto) + (c.porque ? ' ' + fim(c.porque) : '');
    })() } : { tom: 'neutral', html: 'Escolha uma resposta, diga o quanto confia nela e aperte Conferir.' };
    if (r && q.diario && q.diario.url) tutor.html += ' <br><a href="' + I.raiz() + esc(q.diario.url) + '">Ler a edição de ' + dataBr(q.diario.data) + '</a>';
    var proxTxt = r ? (r.reg.treino ? 'Treino: a caixa não muda.' : (r.acertou ? 'Sobe para a caixa ' + r.reg.caixa : 'Volta para a caixa 1') + ' · revisão de novo em ' + r.reg.intervalo + ' ' + plural(r.reg.intervalo, 'dia', 'dias') + '.') : '';
    return h('div', { className: 'ta-blocos' },
      h(Card, { variant: 'panel', className: 'ta-panel', title: h('span', { className: 'ta-ptitle' }, S.treino ? 'Treino livre' : 'Revisão do dia', h(Badge, { tone: 'brand' }, 'Pergunta ' + (S.i + 1) + ' de ' + S.fila.length), h(Badge, null, q.diario ? 'Diário · ' + dataBr(q.diario.data) : tituloAula(q.aula))) },
        h('p', { className: 'ta-pergunta' }, h(Html, { tag: 'span', html: q.pergunta })),
        h('ul', { className: 'ta-opts' }, q.opcoes.map(function (o, i) {
          var sel = S.sel === o.id, estado = r ? (o.correta ? 'certa' : (sel ? 'errada' : undefined)) : (sel ? 'sel' : undefined);
          return h('li', { key: o.id }, h('button', { type: 'button', className: 'ta-opt', disabled: !!r, 'aria-pressed': sel, 'data-estado': estado, onClick: function () { set({ sel: o.id }); } },
            h('span', { className: 'ta-opt-letra', 'aria-hidden': true }, String.fromCharCode(65 + i)),
            h('span', { className: 'ta-opt-corpo' }, h(Html, { tag: 'span', html: o.texto })),
            r && (o.correta || sel) && h(Badge, { tone: o.correta ? 'brand' : 'highlight' }, o.correta ? 'Correta' : 'Ainda não')));
        })),
        !r && h('div', { className: 'ta-conf' },
          h('span', { className: 'ta-field-label' }, 'Quanto você confia nessa resposta?'),
          h('div', { className: 'ta-segwrap' }, h(Confianca, { value: S.conf, onChange: function (v) { set({ conf: v }); } })),
          h('div', { className: 'ta-acoes' }, h(Button, { disabled: !S.sel || !S.conf, onClick: conferir }, 'Conferir'),
            (!S.sel || !S.conf) && h('span', { className: 'ta-nota-inline' }, !S.sel ? 'Escolha uma resposta.' : 'Escolha o nível de confiança.'))),
        h(TutorLive, { tutor: tutor }),
        r && h('div', { className: 'ta-acoes' }, h('span', { className: 'ta-nota-inline' }, proxTxt),
          h(Button, { trailing: '→', onClick: proxima }, S.i + 1 >= S.fila.length ? 'Ver resumo' : 'Próxima'))));
  }

  /* ---------- complete (Parsons / fill-in) ---------- */
  function Complete(p) {
    var ex = p.ex, partes = ex.partes || [];
    var lacs = partes.filter(function (x) { return typeof x === 'object' && x; });
    var s = useState({ resp: {}, erradas: {}, ok: false, tutor: null }), S = s[0];
    function escolher(id, v) {
      var er = Object.assign({}, S.erradas); delete er[id];
      s[1](Object.assign({}, S, { resp: Object.assign({}, S.resp, (function () { var o = {}; o[id] = v; return o; })()), erradas: er }));
    }
    function conferir() {
      var er = {}, n = 0;
      lacs.forEach(function (l) { if (S.resp[l.lacuna] === l.correta) n++; else er[l.lacuna] = true; });
      if (n === lacs.length) {
        s[1](Object.assign({}, S, { erradas: {}, ok: true, tutor: { tom: 'success', lead: 'Certo.', html: ex.explicacao || 'Todas as lacunas estão certas.' } }));
        p.onDone(ex.id, 'ok');
      } else {
        s[1](Object.assign({}, S, { erradas: er, tutor: { tom: 'danger', lead: 'Ainda não:', html: n + ' de ' + lacs.length + ' lacunas estão certas. Revise as destacadas e confira de novo.' } }));
      }
    }
    var k = 0;
    var tutor = S.tutor || { tom: 'neutral', html: ex.tutorAntes || 'Escolha o trecho certo em cada lacuna e aperte Conferir.' };
    return h(Painel, { ex: ex, feito: p.feito, onDone: p.onDone },
      h('div', { className: 'ta-codigo ta-complete' },
        h('div', { className: 'ta-codigo-head' }, h('span', null, ex.linguagem || 'texto')),
        h('pre', null, h('code', null, partes.map(function (x, i) {
          if (typeof x === 'string') return h('span', { key: i }, x);
          k++;
          var erro = !!S.erradas[x.lacuna], ok = S.ok;
          return h('select', { key: i, className: 'ta-sel', 'aria-label': 'Lacuna ' + k + ' de ' + lacs.length, value: S.resp[x.lacuna] || '', disabled: ok, 'data-erro': erro ? 'true' : undefined, 'aria-invalid': erro || undefined,
            onChange: function (e) { escolher(x.lacuna, e.target.value); } },
            h('option', { value: '' }, '— escolha —'), (x.opcoes || []).map(function (o) { return h('option', { key: o, value: o }, o); }));
        })))),
      h('div', { className: 'ta-acoes' }, h(Button, { onClick: conferir, disabled: S.ok }, 'Conferir')),
      h(TutorLive, { tutor: tutor }));
  }

  /* ---------- escreva (produção livre com rubrica) ---------- */
  function Escreva(p) {
    var ex = p.ex, rub = ex.rubrica || [];
    var s = useState({ texto: '', enviado: false, marcas: {}, modelo: false, copiado: false }), S = s[0];
    var ta = useRef(null);
    function set(patch) { s[1](function (o) { return Object.assign({}, o, patch); }); }
    function mudar(v) { set({ texto: v }); I.lembrarTrabalho({ aula: p.aulaId, aba: p.abaIdx, titulo: ex.titulo, texto: v }); }
    function marcar(i) { var m = Object.assign({}, S.marcas); if (m[i]) delete m[i]; else m[i] = true; set({ marcas: m }); }
    var nMarcadas = rub.filter(function (_, i) { return S.marcas[i]; }).length;
    useEffect(function () {
      if (S.enviado && rub.length && nMarcadas === rub.length && !p.feito) p.onDone(ex.id, 'ok');
    }, [nMarcadas, S.enviado]);
    function pedirRevisao() {
      var a = I.aula(p.aulaId) || {};
      var aba = (a.abas && a.abas[p.abaIdx]) ? a.abas[p.abaIdx].rotulo : '';
      var txt = I.promptTutor({ aula: a.titulo || p.aulaId, aba: aba, objetivo: a.objetivo || a.resumo, aluno: { titulo: ex.titulo, texto: S.texto },
        extra: 'Exercício: ' + String(ex.enunciado || '').replace(/<[^>]+>/g, '') + '\nRubrica da resposta:\n' + rub.map(function (r) { return '- ' + r; }).join('\n') +
          '\nO aluno pede revisão da resposta contra a rubrica. Não reescreva o texto e não mostre uma resposta modelo: pergunte sobre o item da rubrica mais fraco.' });
      I.copiar(txt, function () { set({ copiado: true }); });
    }
    var tutor = !S.enviado ? { tom: 'neutral', html: ex.tutorAntes || 'Escreva com as suas palavras. Depois do envio, você compara com a rubrica e com uma resposta modelo.' }
      : nMarcadas === rub.length ? { tom: 'success', lead: 'Certo.', html: ex.tutorDepois || 'Sua resposta cobre a rubrica inteira.' }
        : { tom: 'neutral', html: 'Marque os itens que a sua resposta cobre. O que ficar sem marca é o que vale reescrever. Se quiser, veja a resposta modelo.' };
    var id = ex.id + '-txt';
    return h(Painel, { ex: ex, feito: p.feito, onDone: p.onDone },
      h('div', null,
        h('label', { className: 'ta-field-label', htmlFor: id }, 'Sua resposta'),
        h('textarea', { id: id, ref: ta, className: 'ta-area', rows: 6, value: S.texto, readOnly: S.enviado, placeholder: ex.placeholder || 'Escreva aqui…', onChange: function (e) { mudar(e.target.value); } })),
      h('div', { className: 'ta-acoes' },
        !S.enviado && h(Button, { disabled: S.texto.trim().length < 10, onClick: function () { set({ enviado: true }); } }, 'Enviar resposta'),
        !S.enviado && S.texto.trim().length < 10 && h('span', { className: 'ta-nota-inline' }, 'Escreva pelo menos uma frase.'),
        S.enviado && h(Button, { variant: 'gray', onClick: function () { set({ enviado: false, marcas: {}, modelo: false }); if (ta.current) ta.current.focus(); } }, 'Editar minha resposta'),
        h(Button, { variant: 'tinted', disabled: S.texto.trim().length < 10, onClick: pedirRevisao }, 'Pedir revisão ao tutor')),
      S.copiado && h('div', { 'aria-live': 'polite' }, h(Callout, { tone: 'success', title: 'Prompt copiado — cole no seu agente (Claude, Cursor, Codex…)' }, 'O prompt inclui a sua resposta e a rubrica; o tutor não deve entregar o modelo.')),
      S.enviado && h('fieldset', { className: 'ta-rubrica' },
        h('legend', { className: 'ta-field-label' }, 'Autoavaliação: o que a sua resposta cobre? (' + nMarcadas + ' de ' + rub.length + ')'),
        rub.map(function (r, i) {
          return h('label', { key: i, className: 'ta-check' }, h('input', { type: 'checkbox', checked: !!S.marcas[i], onChange: function () { marcar(i); } }), h(Html, { tag: 'span', html: r }));
        })),
      S.enviado && h('div', { className: 'ta-acoes' }, h(Button, { variant: 'gray', onClick: function () { set({ modelo: !S.modelo }); }, 'aria-expanded': S.modelo }, S.modelo ? 'Esconder resposta modelo' : 'Ver resposta modelo')),
      S.enviado && S.modelo && h(Callout, { tone: 'info', title: 'Resposta modelo' }, h(Html, { tag: 'span', html: ex.modelo })),
      h(TutorLive, { tutor: tutor }));
  }

  /* ---------- cenario (ramificado) ---------- */
  function Cenario(p) {
    var ex = p.ex, nos = ex.nos || {}, finais = ex.finais || {};
    var s = useState({ atual: ex.inicio, caminho: [], final: null }), S = s[0];
    function escolher(o) {
      var passo = { de: S.atual, decisao: o.texto, consequencia: o.consequencia, tom: o.tom === 'ruim' ? 'ruim' : 'ok' };
      var caminho = S.caminho.concat([passo]);
      if (finais[o.vai]) {
        s[1]({ atual: S.atual, caminho: caminho, final: o.vai });
        if (finais[o.vai].bom) p.onDone(ex.id, 'ok');
      } else if (nos[o.vai]) s[1]({ atual: o.vai, caminho: caminho, final: null });
      else console.error('cenario: destino inexistente', o.vai);
    }
    function reiniciar() { s[1]({ atual: ex.inicio, caminho: [], final: null }); }
    var fin = S.final ? finais[S.final] : null, no = nos[S.atual] || {};
    var custos = S.caminho.filter(function (c) { return c.tom === 'ruim'; }).length;
    var tutor = fin ? (fin.bom ? { tom: 'success', lead: 'Final bom.', html: ex.tutorDepois || 'Você chegou a um bom resultado. Veja quanto cada decisão custou no caminho.' }
      : { tom: 'danger', lead: 'Ainda não:', html: 'Esse caminho termina mal. Veja qual decisão custou mais e tente outro caminho.' })
      : { tom: 'neutral', html: ex.tutorAntes || 'Leia a situação e escolha. Cada decisão tem uma consequência, e você pode voltar e tentar outro caminho.' };
    return h(Painel, { ex: ex, feito: p.feito, onDone: p.onDone },
      S.caminho.length > 0 && h('div', null, h('span', { className: 'ta-field-label' }, 'Caminho percorrido'),
        h('ol', { className: 'ta-caminho' }, S.caminho.map(function (c, i) {
          return h('li', { key: i, 'data-tom': c.tom },
            h('span', { className: 'ta-caminho-d' }, h(Html, { tag: 'span', html: c.decisao })),
            h(Badge, { tone: c.tom === 'ruim' ? 'highlight' : 'brand' }, c.tom === 'ruim' ? 'Custo' : 'Boa decisão'),
            c.consequencia && h(Html, { tag: 'span', className: 'ta-caminho-c', html: c.consequencia }));
        }))),
      !fin && h('div', { className: 'ta-no' }, h(Html, { className: 'ta-enunciado', html: no.texto }),
        h('ul', { className: 'ta-opts' }, (no.opcoes || []).map(function (o, i) {
          return h('li', { key: i }, h('button', { type: 'button', className: 'ta-opt', onClick: function () { escolher(o); } },
            h('span', { className: 'ta-opt-letra', 'aria-hidden': true }, String.fromCharCode(65 + i)), h('span', { className: 'ta-opt-corpo' }, h(Html, { tag: 'span', html: o.texto }))));
        }))),
      fin && h(Callout, { tone: fin.bom ? 'success' : 'danger', title: fin.bom ? 'Final bom' : 'Ainda não: final ruim' },
        h(Html, { tag: 'span', html: fin.texto }), ' ', h('strong', null, custos + ' de ' + S.caminho.length + ' ' + plural(S.caminho.length, 'decisão teve', 'decisões tiveram') + ' custo.')),
      h('div', { className: 'ta-acoes' }, S.caminho.length > 0 && h(Button, { variant: fin ? 'filled' : 'gray', onClick: reiniciar }, 'Tentar outro caminho')),
      h(TutorLive, { tutor: tutor }));
  }

  /* ---------- transcript ("ache o erro") ---------- */
  var QUEM = { voce: 'você', agente: 'agente', ferramenta: 'ferramenta' };
  function Transcript(p) {
    var ex = p.ex, linhas = ex.linhas || [], certas = ex.erradas || [], expl = ex.explicacao || {};
    var s = useState({ marcadas: {}, conferido: false, ok: false, tutor: null }), S = s[0];
    function alternar(i) {
      if (S.ok) return;
      var m = Object.assign({}, S.marcadas); if (m[i]) delete m[i]; else m[i] = true;
      s[1](Object.assign({}, S, { marcadas: m, conferido: false, tutor: null }));
    }
    function conferir() {
      var marc = Object.keys(S.marcadas).map(Number);
      var acertos = marc.filter(function (i) { return certas.indexOf(i) >= 0; }), erros = marc.filter(function (i) { return certas.indexOf(i) < 0; });
      var faltam = certas.filter(function (i) { return !S.marcadas[i]; });
      if (!marc.length) { s[1](Object.assign({}, S, { tutor: { tom: 'danger', lead: 'Ainda não:', html: 'Clique em pelo menos uma linha antes de conferir.' } })); return; }
      if (!erros.length && !faltam.length) {
        s[1](Object.assign({}, S, { conferido: true, ok: true, tutor: { tom: 'success', lead: 'Certo.', html: ex.tutorDepois || 'Você achou o ponto em que a sessão saiu do trilho.' } }));
        p.onDone(ex.id, 'ok');
      } else {
        var msg = [];
        if (erros.length) msg.push(erros.length + ' ' + plural(erros.length, 'linha marcada está', 'linhas marcadas estão') + ' correta' + (erros.length > 1 ? 's' : '') + '.');
        if (faltam.length) msg.push('Falta ' + (faltam.length > 1 ? faltam.length + ' linhas' : '1 linha') + ' errada' + (faltam.length > 1 ? 's' : '') + '.');
        s[1](Object.assign({}, S, { conferido: true, tutor: { tom: 'danger', lead: 'Ainda não:', html: msg.join(' ') + ' Releia a sessão do ponto de vista de quem confere evidência.' } }));
      }
    }
    var tutor = S.tutor || { tom: 'neutral', html: ex.tutorAntes || 'Leia a sessão e clique na linha (ou nas linhas) em que algo deu errado. Depois aperte Conferir.' };
    return h(Painel, { ex: ex, feito: p.feito, onDone: p.onDone },
      h('div', { className: 'ta-tr', role: 'group', 'aria-label': 'Sessão com o agente' },
        h('div', { className: 'ta-tr-head' }, ex.terminalTitulo || 'sessão'),
        h('ol', { className: 'ta-tr-lista' }, linhas.map(function (l, i) {
          var marc = !!S.marcadas[i], errada = certas.indexOf(i) >= 0;
          var estado = S.conferido && marc ? (errada ? 'certa' : 'errada') : (marc ? 'sel' : undefined);
          var fb = S.conferido && marc ? (errada ? (expl[i] || 'Aqui a sessão deu errado.') : 'Esta linha está correta.') : (S.ok && errada ? expl[i] : null);
          return h('li', { key: i },
            h('button', { type: 'button', className: 'ta-tr-l', 'data-quem': l.quem, 'data-estado': estado, 'aria-pressed': marc, disabled: S.ok, onClick: function () { alternar(i); } },
              h('span', { className: 'ta-tr-n', 'aria-hidden': true }, i + 1),
              h('span', { className: 'ta-tr-q' }, QUEM[l.quem] || l.quem),
              h('span', { className: 'ta-tr-t' }, l.texto)),
            fb && h('div', { className: 'ta-tr-fb', 'data-estado': estado || 'certa' },
              h('strong', null, S.conferido && marc && !errada ? 'Ainda não: ' : '✓ '), h(Html, { tag: 'span', html: fb })));
        }))),
      h('div', { className: 'ta-acoes' }, h(Button, { onClick: conferir, disabled: S.ok }, 'Conferir'),
        h('span', { className: 'ta-nota-inline' }, Object.keys(S.marcadas).length + ' ' + plural(Object.keys(S.marcadas).length, 'linha marcada', 'linhas marcadas'))),
      h(TutorLive, { tutor: tutor }));
  }

  /* ---------- python (Pyodide sob demanda) ---------- */
  var PYODIDE_URL = 'https://cdn.jsdelivr.net/pyodide/v0.26.4/full/pyodide.js';
  var pyPromise = null;
  function carregarPython() {
    if (pyPromise) return pyPromise;
    var base = new Promise(function (res, rej) {
      if (window.loadPyodide) { res(); return; }
      var sc = document.createElement('script'); sc.src = PYODIDE_URL; sc.async = true; sc.crossOrigin = 'anonymous';
      var to = setTimeout(function () { sc.remove(); rej(new Error('tempo esgotado')); }, 60000);
      sc.onload = function () { clearTimeout(to); res(); };
      sc.onerror = function () { clearTimeout(to); sc.remove(); rej(new Error('sem rede')); };
      document.head.appendChild(sc);
    }).then(function () { return window.loadPyodide({ indexURL: PYODIDE_URL.replace(/pyodide\.js$/, '') }); });
    pyPromise = base;
    base.catch(function () { if (pyPromise === base) pyPromise = null; }); // permite tentar de novo
    return base;
  }
  var HARNESS = [
    '__resultados = []',
    '__linhas = __TESTES.splitlines()',
    'for __nome in [n for n in list(globals()) if n.startswith("test_")]:',
    '    __f = globals()[__nome]',
    '    if not callable(__f):',
    '        continue',
    '    try:',
    '        __f()',
    '        __resultados.append((__nome, True, ""))',
    '    except AssertionError as __e:',
    '        __tb = __e.__traceback__; __ln = 0',
    '        while __tb is not None:',
    '            if __tb.tb_frame.f_code.co_name == __nome:',
    '                __ln = __tb.tb_lineno',
    '            __tb = __tb.tb_next',
    '        __src = __linhas[__ln - 1].strip() if 0 < __ln <= len(__linhas) else ""',
    '        __msg = str(__e)',
    '        __resultados.append((__nome, False, (__src + ("   # " + __msg if __msg else "")) if __src else (__msg or "AssertionError")))',
    '    except Exception as __e:',
    '        __resultados.append((__nome, False, type(__e).__name__ + ": " + str(__e)))'
  ].join('\n');
  function limparErro(e) {
    var lin = String(e && e.message || e).split('\n');
    var k = -1; lin.forEach(function (l, i) { if (k < 0 && l.indexOf('"<exec>"') >= 0) k = i; });
    if (k > 0) lin = ['Traceback (most recent call last):'].concat(lin.slice(k));
    return lin.filter(function (l) { return l.trim() !== ''; });
  }
  function executarPython(py, codigo, testes) {
    var out = [];
    py.setStdout({ batched: function (m) { out.push({ kind: 'out', text: m }); } });
    py.setStderr({ batched: function (m) { out.push({ kind: 'err', text: m }); } });
    var g = py.globals.get('dict')();
    var r = { out: out, erro: false, testes: null };
    try {
      g.set('__name__', '__main__');
      try { py.runPython(codigo, { globals: g }); }
      catch (e) { limparErro(e).forEach(function (t) { out.push({ kind: 'err', text: t, prefix: false }); }); r.erro = true; return r; }
      if (testes != null) {
        try {
          g.set('__TESTES', testes);
          py.runPython(testes, { globals: g });
          py.runPython(HARNESS, { globals: g });
          var px = g.get('__resultados'); r.testes = px.toJs(); px.destroy();
        } catch (e) { limparErro(e).forEach(function (t) { out.push({ kind: 'err', text: t, prefix: false }); }); r.erro = true; }
      }
    } finally { try { g.destroy(); } catch (e) {} }
    return r;
  }
  function Python(p) {
    var ex = p.ex;
    var s = useState({ codigo: ex.codigo || '', fase: 'idle', linhas: null, testes: null, dica: false, solucao: false, tentou: false, tutor: null, copiado: false }), S = s[0];
    var gut = useRef(null), livre = useRef(false);
    function set(patch) { s[1](function (o) { return Object.assign({}, o, patch); }); }
    function mudar(v) { set({ codigo: v, testes: null }); I.lembrarTrabalho({ aula: p.aulaId, aba: p.abaIdx, titulo: ex.titulo, texto: v, linguagem: 'python' }); }
    function onKey(e) {
      if (e.key === 'Escape') { livre.current = true; return; }
      if (e.key === 'Tab' && !e.shiftKey && !livre.current) {
        e.preventDefault();
        var t = e.target, a = t.selectionStart, b = t.selectionEnd, v = t.value.slice(0, a) + '    ' + t.value.slice(b);
        mudar(v);
        requestAnimationFrame(function () { t.selectionStart = t.selectionEnd = a + 4; });
      } else if (e.key !== 'Tab' && e.key !== 'Shift') livre.current = false;
    }
    function executar(comTestes) {
      if (S.fase === 'carregando' || S.fase === 'rodando') return;
      set({ fase: 'carregando', tutor: null, linhas: [{ kind: 'info', text: 'Carregando Python (~10 MB, só na primeira vez)…', prefix: false }] });
      carregarPython().then(function (py) {
        set({ fase: 'rodando' });
        setTimeout(function () {
          var r;
          try { r = executarPython(py, S.codigo, comTestes ? ex.testes : null); }
          catch (e) { set({ fase: 'pronto', linhas: [{ kind: 'err', text: String(e && e.message || e), prefix: false }] }); return; }
          var linhas = r.out.slice();
          if (comTestes && r.testes) {
            r.testes.forEach(function (t) {
              linhas.push({ kind: t[1] ? 'in' : 'err', prefix: false, text: (t[1] ? '✓ ' : '✗ ') + t[0] });
              if (!t[1] && t[2]) linhas.push({ kind: 'out', prefix: false, text: '    ' + t[2] });
            });
            var ok = r.testes.filter(function (t) { return t[1]; }).length;
            linhas.push({ kind: 'info', prefix: false, text: ok + ' de ' + r.testes.length + ' ' + plural(r.testes.length, 'teste passou', 'testes passaram') });
            var todos = r.testes.length > 0 && ok === r.testes.length;
            set({ fase: 'pronto', linhas: linhas, testes: r.testes, tentou: true,
              tutor: todos ? { tom: 'success', lead: 'Certo.', html: ex.tutorDepois || 'Todos os testes passaram.' } : { tom: 'danger', lead: 'Ainda não:', html: (r.testes.length - ok) + ' ' + plural(r.testes.length - ok, 'teste falhou', 'testes falharam') + '. Leia a linha do ✗: ela mostra o assert que quebrou.' } });
            if (todos) p.onDone(ex.id, 'ok');
          } else {
            if (!linhas.length && !r.erro) linhas.push({ kind: 'hint', prefix: false, text: '(o código rodou e não imprimiu nada)' });
            set({ fase: 'pronto', linhas: linhas, tentou: comTestes ? true : S.tentou, tutor: r.erro ? { tom: 'danger', lead: 'Ainda não:', html: 'o Python devolveu um erro. Leia a última linha do traceback.' } : null });
          }
        }, 30);
      }, function () {
        set({ fase: 'offline', linhas: null });
      });
    }
    var linhas = S.linhas || [{ kind: 'hint', prefix: false, text: 'Aperte Rodar para executar ou Testar para rodar os testes.' }];
    var n = S.codigo.split('\n').length;
    var ocupado = S.fase === 'carregando' || S.fase === 'rodando';
    var tutor = S.tutor || { tom: 'neutral', html: ex.tutorAntes || 'Edite o código, aperte Rodar para ver a saída e Testar quando achar que está pronto.' };
    return h(Painel, { ex: ex, feito: p.feito, onDone: p.onDone },
      S.fase === 'offline' && h(Callout, { tone: 'neutral', title: 'Python indisponível offline; use o lab local' }, 'Não deu para baixar o interpretador (CDN). Rode este exercício no laboratório local do curso ou use “Pular exercício” abaixo.'),
      h('div', null,
        h('label', { className: 'ta-field-label', htmlFor: ex.id + '-ed' }, 'Código (Tab insere 4 espaços; Esc e depois Tab sai do editor)'),
        h('div', { className: 'ta-ed' },
          h('pre', { className: 'ta-ed-gut', ref: gut, 'aria-hidden': true }, Array.apply(null, Array(Math.max(n, 6))).map(function (_, i) { return i + 1; }).join('\n')),
          h('textarea', { id: ex.id + '-ed', className: 'ta-ed-ta', rows: Math.min(Math.max(n + 1, 8), 22), wrap: 'off', spellCheck: false, autoCapitalize: 'off', autoCorrect: 'off', value: S.codigo,
            onChange: function (e) { mudar(e.target.value); }, onKeyDown: onKey, onScroll: function (e) { if (gut.current) gut.current.scrollTop = e.target.scrollTop; } }))),
      h('div', { className: 'ta-acoes' },
        h(Button, { variant: 'glass', disabled: ocupado, onClick: function () { executar(false); } }, 'Rodar'),
        h(Button, { disabled: ocupado || !ex.testes, onClick: function () { executar(true); } }, 'Testar'),
        ex.dica && h(Button, { variant: 'plain', onClick: function () { set({ dica: !S.dica }); } }, S.dica ? 'Esconder dica' : 'Ver dica'),
        ex.solucao && h(Button, { variant: 'plain', disabled: !S.tentou, onClick: function () { set({ solucao: !S.solucao }); } }, S.solucao ? 'Esconder solução' : 'Ver solução'),
        h(Button, { variant: 'plain', onClick: function () { mudar(ex.codigo || ''); } }, 'Restaurar código inicial'),
        ex.solucao && !S.tentou && h('span', { className: 'ta-nota-inline' }, 'A solução libera depois da primeira tentativa de Testar.')),
      S.dica && h(Tutor, null, h(Html, { tag: 'span', html: ex.dica })),
      S.solucao && h('div', { className: 'ta-codigo' }, h('div', { className: 'ta-codigo-head' }, h('span', null, 'solução')), h('pre', null, h('code', null, ex.solucao))),
      h('div', { className: 'ta-term' }, h(T.Terminal, { lines: linhas, title: 'python', live: true, caret: ocupado })),
      h('p', { className: 'ta-nota-inline', style: { margin: 0 } }, 'O Python roda no seu navegador, na própria aba: um loop infinito trava a aba (recarregue a página se acontecer).'),
      h(TutorLive, { tutor: tutor }));
  }

  ['complete', 'escreva', 'cenario', 'transcript', 'python'].forEach(function (t) {
    TA._estender(t, { complete: Complete, escreva: Escreva, cenario: Cenario, transcript: Transcript, python: Python }[t]);
  });
})();
