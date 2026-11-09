/* Trilha rápida · motor de aulas interativas. Sem build: React.createElement + window.Trilha. */
(function () {
  'use strict';
  var React = window.React, ReactDOM = window.ReactDOM, T = window.Trilha, h = React.createElement;
  var useState = React.useState, useRef = React.useRef, useEffect = React.useEffect;
  var Button = T.Button, Badge = T.Badge, Card = T.Card, Callout = T.Callout, Tutor = T.TutorBubble;

  /* Configuração do curso/módulo. Padrão = Trilha rápida; outro módulo chama TrilhaAula.curso({...}) antes de registrar as aulas. */
  var C = { chave: 'trilha.tr.v1', nome: 'Trilha rápida', subtitulo: 'Desenvolvimento com agentes', texto: 'TR-texto.html', portal: '../index.html', contexto: 'da Trilha rápida (desenvolvimento com agentes)', unidade: 'trilha', raiz: '../' };
  var registry = {}, order = [];
  var ALIAS = {
    'passo-0': 'mapa-do-ciclo', 'passo-1': 'preparar-repositorio', 'passo-2': 'fluxos-por-tipo', 'passo-3': 'jira-github',
    'passo-4': 'esteira', 'passo-5': 'docs-atualizados', 'passo-6': 'paralelismo-revisao', 'passo-7': 'mcp',
    'passo-8': 'comandos', 'passo-9': 'skills', 'passo-10': 'avaliar-skills-modelos', 'passo-11': 'onde-fica-cada-coisa',
    'passo-12': 'cartao-de-bolso'
  };
  var PASSO = { conceitos: 'passo-11' };
  Object.keys(ALIAS).forEach(function (k) { PASSO[ALIAS[k]] = k; });
  var TITULOS = {
    'mapa-do-ciclo': 'O mapa do ciclo', 'conceitos': 'Conceitos e vocabulário', 'preparar-repositorio': 'Preparar o repositório',
    'fluxos-por-tipo': 'Fluxos por tipo de trabalho', 'jira-github': 'Jira e GitHub juntos', 'esteira': 'Esteira dev, cert e prod',
    'docs-atualizados': 'Documentação sempre atualizada', 'paralelismo-revisao': 'Paralelismo e revisão', 'elephant-goldfish': 'Elephant-Goldfish',
    'mcp': 'MCP na prática', 'comandos': 'Comandos reutilizáveis', 'skills': 'Skills na prática', 'avaliar-skills-modelos': 'Avaliar skills e modelos',
    'onde-fica-cada-coisa': 'Onde fica cada coisa', 'cartao-de-bolso': 'Cartão de bolso'
  };
  function tituloDe(id) { return registry[id] ? registry[id].titulo : (TITULOS[id] || id); }
  var EX = { rode: 1, quebre: 1, escolha: 1, ordene: 1, chat: 1, esteira: 1 };
  /* Tipos de exercício registrados por engine/trilha-aprender.js (complete, escreva, cenario, transcript, python). */
  var EXT = {};
  var CFG = { confianca: true };   // TrilhaAula.config({confianca:false}) desliga a pergunta de confiança em todas as escolhas
  function AP() { return window.TrilhaAula && window.TrilhaAula._aprender || null; }

  /* ---------- utilidades ---------- */
  function reduzido() { try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; } }
  function Html(p) { return h(p.tag || 'div', { className: p.className, dangerouslySetInnerHTML: { __html: p.html || '' } }); }
  function semAinda(t) { return String(t || '').replace(/^\s*Ainda não:\s*/i, ''); }
  function cap(t) { t = String(t || ''); return t.replace(/^(\s*(?:<[^>]+>\s*)*)([a-zà-ú])/, function (m, a, b) { return a + b.toUpperCase(); }); }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function useStore(init) {
    var s = useState(0), ref = useRef(init);
    return [function () { return ref.current; }, function (patch) {
      ref.current = Object.assign({}, ref.current, typeof patch === 'function' ? patch(ref.current) : patch);
      s[1](function (n) { return n + 1; });
    }];
  }
  function useTimers() {
    var ref = useRef([]);
    useEffect(function () { return function () { ref.current.forEach(clearTimeout); ref.current = []; }; }, []);
    return {
      sched: function (ms, fn) { if (reduzido()) { fn(); return; } ref.current.push(setTimeout(fn, ms)); },
      clear: function () { ref.current.forEach(clearTimeout); ref.current = []; }
    };
  }
  function useMarcaFalha(ref, idx) {
    useEffect(function () {
      var r = ref.current; if (!r) return;
      var els = r.querySelectorAll('.tr-step');
      for (var i = 0; i < els.length; i++) els[i].removeAttribute('data-falha');
      if (idx >= 0 && els[idx]) els[idx].setAttribute('data-falha', 'true');
    });
  }

  /* ---------- armazenamento (sempre em try/catch) ---------- */
  function lerStore() {
    try { var o = JSON.parse(localStorage.getItem(C.chave) || 'null'); if (o && typeof o === 'object' && o.aulas) return o; } catch (e) {}
    return { v: 1, atual: null, aulas: {} };
  }
  function gravarStore(s) { try { localStorage.setItem(C.chave, JSON.stringify(s)); } catch (e) {} }
  function aulaSt(s, id) { return (s.aulas && s.aulas[id]) || { aba: 0, feitos: {}, concluida: false }; }

  /* ---------- rotas ---------- */
  function lerHash() {
    var x = (location.hash || '').replace(/^#/, '');
    if (!x) return null;
    if (x === 'revisao') return { revisao: true };
    if (ALIAS[x]) return { aula: ALIAS[x], aba: 0 };
    var p = {};
    x.split('&').forEach(function (kv) {
      var i = kv.indexOf('='); if (i < 1) return;
      try { p[decodeURIComponent(kv.slice(0, i))] = decodeURIComponent(kv.slice(i + 1)); } catch (e) {}
    });
    if (p.aula) return { aula: p.aula, aba: Math.max(0, (parseInt(p.aba, 10) || 1) - 1) };
    return null;
  }
  function hashDe(id, aba) { return '#aula=' + encodeURIComponent(id) + '&aba=' + (aba + 1); }

  /* ---------- API pública ---------- */
  function coletar(blocos, out) {
    (blocos || []).forEach(function (b) {
      if (!b) return;
      if (EX[b.tipo] || EXT[b.tipo]) out.push(b);
      else if (b.tipo === 'abas') (b.itens || []).forEach(function (it) { coletar(it.blocos, out); });
    });
    return out;
  }
  function normalizar(a) {
    (a.abas || []).forEach(function (aba, i) {
      var n = 0;
      coletar(aba.blocos, []).forEach(function (ex) { n++; if (!ex.id) ex.id = 'a' + (i + 1) + '-' + ex.tipo + n; });
    });
    return a;
  }
  var TrilhaAula = {
    registrar: function (a) {
      if (!a || !a.id) { console.error('TrilhaAula.registrar: falta id'); return; }
      registry[a.id] = normalizar(a);
    },
    ordem: function (ids) { order = ids.slice(); },
    config: function (c) { Object.assign(CFG, c || {}); },
    curso: function (c) {
      c = c || {};
      ['chave', 'nome', 'subtitulo', 'texto', 'portal', 'contexto', 'unidade', 'raiz'].forEach(function (k) { if (c[k] !== undefined) C[k] = c[k]; });
      if (c.contexto === undefined && c.nome) C.contexto = 'do módulo ' + c.nome + (c.subtitulo ? ' (' + c.subtitulo + ')' : '');
      if (c.alias || c.passo) { ALIAS = c.alias || {}; PASSO = Object.assign({}, c.passo || {}); Object.keys(ALIAS).forEach(function (k) { if (!PASSO[ALIAS[k]]) PASSO[ALIAS[k]] = k; }); }
      if (c.titulos) TITULOS = c.titulos;
    },
    _estender: function (tipo, comp) { EXT[tipo] = comp; },
    _aprender: null,
    montar: function (sel) {
      var el = typeof sel === 'string' ? document.querySelector(sel) : sel;
      ReactDOM.createRoot(el).render(h(App));
    }
  };
  window.TrilhaAula = TrilhaAula;
  TrilhaAula._i = {
    raiz: function () { return C.raiz; },
    h: h, T: T, Html: Html, Painel: Painel, TutorLive: TutorLive, semAinda: semAinda, cap: cap, clamp: clamp, copiar: copiarTexto,
    useStore: useStore, useTimers: useTimers, reduzido: reduzido, tituloDe: tituloDe, promptTutor: promptTutor, lembrarTrabalho: lembrarTrabalho,
    aula: function (id) { return registry[id] || null; }, aulas: function () { return registry; }, ordemIds: function () { return order.slice(); }
  };

  /* ---------- tutor por prompt ----------
     futuro: tutor embutido no curso. Hoje o botão só monta um prompt socrático e copia para a área de transferência;
     o aluno cola no agente que já usa (Claude, Cursor, Codex...). */
  var trabalho = null; // último texto/código escrito pelo aluno: {aula, aba, titulo, texto, linguagem}
  function lembrarTrabalho(t) { trabalho = t; }
  function textoPuro(x) { return String(x || '').replace(/<[^>]+>/g, '').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim(); }
  function promptTutor(o) {
    // o: {aula, aba, objetivo, aluno:{titulo, texto, linguagem}, extra}
    var L = [];
    L.push('Você é um tutor socrático. Responda em português do Brasil, com frases curtas.');
    L.push('');
    L.push('Contexto: aula "' + o.aula + '", aba "' + o.aba + '" ' + C.contexto + '.');
    if (o.objetivo) L.push('Objetivo da aula: ' + textoPuro(o.objetivo));
    if (o.extra) { L.push(''); L.push(o.extra); }
    if (o.aluno && o.aluno.texto) {
      L.push('');
      L.push('O que o aluno escreveu' + (o.aluno.titulo ? ' (' + textoPuro(o.aluno.titulo) + ')' : '') + ':');
      L.push('```' + (o.aluno.linguagem || ''));
      L.push(o.aluno.texto);
      L.push('```');
    }
    L.push('');
    L.push('Regras:');
    L.push('- Não entregue a resposta.');
    L.push('- Faça uma pergunta por vez.');
    L.push('- Dê pistas graduais: comece pela mais vaga e só fique mais específico se o aluno continuar travado.');
    L.push('- Peça para o aluno explicar com as palavras dele antes de você corrigir.');
    L.push('');
    L.push(o.aluno && o.aluno.texto ? 'Comece apontando uma pergunta sobre o ponto mais frágil do que o aluno escreveu.' : 'Comece perguntando o que o aluno já entende sobre o objetivo.');
    return L.join('\n');
  }

  /* ---------- blocos de conteúdo ---------- */
  function TakeawayBloco(p) {
    var partes = String(p.html || '').split(/(<mark>[\s\S]*?<\/mark>)/);
    var filhos = partes.map(function (s, i) {
      var m = /^<mark>([\s\S]*)<\/mark>$/.exec(s);
      return m ? h(T.Mark, { key: i }, h(Html, { tag: 'span', html: m[1] })) : h(Html, { tag: 'span', key: i, html: s });
    });
    return h('div', { className: 'ta-takeaway' }, h(T.Takeaway, null, filhos));
  }
  function copiarTexto(texto, ok) {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) { navigator.clipboard.writeText(texto).then(ok, fallback); return; }
    } catch (e) {}
    fallback();
    function fallback() {
      try {
        var t = document.createElement('textarea'); t.value = texto; t.setAttribute('readonly', ''); t.style.position = 'fixed'; t.style.opacity = '0';
        document.body.appendChild(t); t.select(); var r = document.execCommand('copy'); document.body.removeChild(t); if (r !== false) ok();
      } catch (e) {}
    }
  }
  function Codigo(p) {
    var c = useState(false);
    function copiar() { copiarTexto(p.texto, function () { c[1](true); setTimeout(function () { c[1](false); }, 1800); }); }
    return h('div', { className: 'ta-codigo' },
      h('div', { className: 'ta-codigo-head' }, h('span', null, p.linguagem || 'texto'),
        h(Button, { variant: 'plain', size: 'sm', onClick: copiar, 'aria-label': 'Copiar código' }, c[0] ? 'Copiado' : 'Copiar')),
      h('pre', null, h('code', null, p.texto)));
  }
  function Abas(p) {
    var itens = p.itens || [];
    var s = useState(itens[0] ? '0' : null);
    var i = parseInt(s[0], 10) || 0;
    return h('div', { className: 'ta-abas' },
      h('div', { className: 'ta-segwrap' }, h(T.SegmentedControl, {
        options: itens.map(function (it, k) { return { value: String(k), label: it.rotulo }; }),
        value: s[0], onChange: s[1], 'aria-label': p.rotulo || 'Escolha uma opção'
      })),
      h(Blocos, { blocos: (itens[i] || {}).blocos, ctx: p.ctx, k: p.k + '-' + i }));
  }
  function Bloco(p) {
    var b = p.bloco, ctx = p.ctx;
    switch (b.tipo) {
      case 'texto': return h(Html, { className: 'ta-texto' + (b.largo ? ' ta-largo' : ''), html: b.html });
      case 'takeaway': return h(TakeawayBloco, { html: b.html });
      case 'callout': return h(Callout, { tone: b.tom || 'info', title: b.titulo }, h(Html, { html: b.html }));
      case 'tutor': return h(Tutor, { tone: b.tom || 'neutral' }, h(Html, { tag: 'span', html: b.html }));
      case 'codigo': return h(Codigo, { linguagem: b.linguagem, texto: b.texto });
      case 'abas': return h(Abas, { itens: b.itens, rotulo: b.rotulo, ctx: ctx, k: p.k });
      case 'rode': case 'quebre': return h(RodePainel, { ex: b, feito: ctx.feitos[b.id], onDone: ctx.concluir });
      case 'escolha': return h(Escolha, { ex: b, feito: ctx.feitos[b.id], onDone: ctx.concluir, aulaId: ctx.aulaId });
      case 'ordene': return h(Ordene, { ex: b, feito: ctx.feitos[b.id], onDone: ctx.concluir });
      case 'chat': return h(Chat, { ex: b, feito: ctx.feitos[b.id], onDone: ctx.concluir });
      case 'esteira': return h(Esteira, { ex: b, feito: ctx.feitos[b.id], onDone: ctx.concluir });
    }
    if (EXT[b.tipo]) return h(EXT[b.tipo], { ex: b, feito: ctx.feitos[b.id], onDone: ctx.concluir, aulaId: ctx.aulaId, abaIdx: ctx.aba });
    console.warn('Bloco desconhecido:', b.tipo);
    return null;
  }
  function Blocos(p) {
    return h('div', { className: 'ta-blocos' }, (p.blocos || []).map(function (b, i) {
      return h(Bloco, { key: p.k + '-' + i, bloco: b, ctx: p.ctx, k: p.k + '-' + i });
    }));
  }

  /* ---------- moldura comum dos exercícios ---------- */
  function Painel(p) {
    var ex = p.ex, feito = p.feito;
    var ok = feito === 'ok', pulado = feito === 'pulado';
    var obrig = ex.obrigatorio !== false;
    var cb = ex.callout;
    var cbHtml = typeof cb === 'string' ? cb : (cb && cb.html);
    var cbTitulo = (cb && typeof cb === 'object' && cb.titulo) || 'Concluído.';
    var titulo = h('span', { className: 'ta-ptitle' }, ex.titulo || 'Exercício',
      ok && h(Badge, { tone: 'brand' }, 'Concluído'), pulado && h(Badge, null, 'Pulado'), !obrig && !feito && h(Badge, null, 'Opcional'));
    return h(Card, { variant: 'panel', className: 'ta-panel', title: titulo, 'aria-label': ex.titulo || 'Exercício' },
      ok && h(Callout, { tone: 'success', title: cbTitulo }, cbHtml ? h(Html, { tag: 'span', html: cbHtml }) : 'Você concluiu este exercício.'),
      pulado && h(Callout, { tone: 'neutral', title: 'Pulado.' }, 'Você marcou este exercício como já sabido. Pode fazê-lo quando quiser.'),
      ex.enunciado && h(Html, { className: 'ta-enunciado', html: ex.enunciado }),
      p.children,
      !feito && h('div', { className: 'ta-panel-foot' },
        h('span', null, obrig ? 'Conta para liberar o Continuar.' : 'Exercício opcional.'),
        h(Button, { variant: 'plain', size: 'sm', onClick: function () { p.onDone(ex.id, 'pulado'); } }, 'Pular exercício')));
  }
  function TutorLive(p) {
    return h('div', { className: 'ta-tutor', 'aria-live': 'polite' }, p.tutor && h(Tutor, { tone: p.tutor.tom || 'neutral', lead: p.tutor.lead },
      h(Html, { tag: 'span', html: p.tutor.html })));
  }
  function dur(e) { return e.duracao != null ? e.duracao : (e.ms || 0); }
  var TONS = ['dns', 'tcp', 'tls', 'request', 'response'];

  /* ---------- prever antes de rodar ---------- */
  function Prever(p) {
    var cfg = p.cfg;
    return h('div', { className: 'ta-prever', role: 'group', 'aria-label': 'Sua previsão' },
      h('span', { className: 'ta-field-label' }, 'Antes de rodar, preveja'),
      h('p', { className: 'ta-pergunta' }, h(Html, { tag: 'span', html: cfg.pergunta })),
      h('ul', { className: 'ta-opts' }, (cfg.opcoes || []).map(function (o, i) {
        var sel = p.valor === o.id;
        var estado = p.revelar ? (o.correta ? 'certa' : (sel ? 'errada' : undefined)) : (sel ? 'sel' : undefined);
        return h('li', { key: o.id }, h('button', { type: 'button', className: 'ta-opt', disabled: p.travado, 'aria-pressed': sel, 'data-estado': estado, onClick: function () { p.onChange(o.id); } },
          h('span', { className: 'ta-opt-letra', 'aria-hidden': true }, String.fromCharCode(65 + i)),
          h('span', { className: 'ta-opt-corpo' }, h(Html, { tag: 'span', html: o.texto })),
          p.revelar && (o.correta || sel) && h(Badge, { tone: o.correta ? 'brand' : 'highlight' }, o.correta ? 'Real' : 'Sua previsão')));
      })));
  }

  /* ---------- rode e quebre ---------- */
  function RodePainel(p) {
    var ex = p.ex, quebre = ex.tipo === 'quebre';
    var etapas = ex.etapas || [], falhas = ex.falhas || [];
    var prefixo = ex.prefixo || '$';
    var st = useStore({ fase: 'idle', n: 0, falhaIdx: -1, lines: [], sel: null, tutor: null, viuFalha: false, rodouOk: false, prev: null, prevUsada: null });
    var S = st[0](), set = st[1];
    var T0 = useTimers();
    var val = useState(ex.entrada || ''), rodando = S.fase === 'rodando';
    var seg = useState(quebre && falhas[0] ? falhas[0].id : 'nenhuma');
    var tlRef = useRef(null);
    useMarcaFalha(tlRef, S.falhaIdx);
    var total = etapas.reduce(function (m, e) { return m + dur(e); }, 0) || 1;
    var starts = [], acc = 0;
    etapas.forEach(function (e) { starts.push(acc); acc += dur(e); });

    function cmdLine() {
      var t = (val[0] || ex.entrada || '').trim() || ex.entrada || '';
      return prefixo === '$' ? { kind: 'cmd', text: t } : { kind: 'cmd', prefix: false, text: prefixo + ': ' + t };
    }
    var pv = ex.prever || null;
    function comparar() {
      var id = st[0]().prevUsada;
      if (!pv || !id) return '';
      var op = (pv.opcoes || []).filter(function (o) { return o.id === id; })[0];
      var real = (pv.opcoes || []).filter(function (o) { return o.correta; })[0];
      if (!op || !real) return '';
      var por = real.porque ? ' ' + (op.correta ? cap(semAinda(real.porque)) : 'Porque ' + semAinda(real.porque).replace(/^./, function (c) { return c.toLowerCase(); })) : '';
      var fim = function (t) { return String(t).replace(/[.\s]+$/, ''); };
      return op.correta
        ? 'Você previu <strong>' + fim(op.texto) + '</strong> e acertou.' + por + '<br>'
        : 'Você previu <strong>' + fim(op.texto) + '</strong>; o real foi <strong>' + fim(real.texto) + '</strong>.' + por + '<br>';
    }
    function play() {
      if (rodando) return;
      if (pv && !S.prev) return;
      var falha = null;
      if (quebre && seg[0] !== 'nenhuma') falha = falhas.filter(function (f) { return f.id === seg[0]; })[0] || null;
      var idxF = -1;
      if (falha) etapas.forEach(function (e, i) { if (e.id === falha.efeito.etapaFalha) idxF = i; });
      var limite = idxF >= 0 ? idxF : etapas.length - 1;
      T0.clear();
      set({ fase: 'rodando', n: 0, falhaIdx: -1, lines: [cmdLine()], sel: null, tutor: null, prevUsada: st[0]().prev });
      var t = 0;
      etapas.slice(0, limite + 1).forEach(function (e, i) {
        var d = clamp(dur(e) * 5, 450, 1100);
        var falhou = i === idxF;
        var ls = (falhou ? falha.efeito.linhasErro : e.linhas) || [];
        T0.sched(t, function () { set(function (s) { return { n: i + 1, falhaIdx: falhou ? i : s.falhaIdx }; }); });
        ls.forEach(function (l, j) {
          var o = typeof l === 'string' ? { kind: falhou ? 'err' : 'out', text: l } : l;
          T0.sched(t + (j + 1) * d / (ls.length + 1), function () {
            set(function (s) {
              var kind = o.kind || 'out';
              return { lines: s.lines.concat([{ kind: kind, text: (kind === 'err' && o.prefix !== false ? '! ' : '') + o.text, prefix: kind === 'err' ? false : o.prefix, etapa: e.id }]) };
            });
          });
        });
        t += d;
      });
      T0.sched(t + 60, function () {
        if (falha) {
          var ok = st[0]().rodouOk;
          var cmp = comparar();
          set({ fase: 'fim', viuFalha: true, tutor: { tom: 'danger', lead: cmp ? 'Previsão e resultado.' : 'Ainda não:', html: cmp + semAinda(falha.efeito.tutor) } });
          if (ok) p.onDone(ex.id, 'ok');
        } else if (quebre && !st[0]().viuFalha) {
          set({ fase: 'fim', rodouOk: true, tutor: { tom: 'neutral', html: comparar() + 'Rodou sem falha. Agora escolha uma falha e rode de novo para ver onde ela quebra.' } });
        } else {
          set({ fase: 'fim', rodouOk: true, tutor: { tom: 'success', html: comparar() + (ex.tutorDepois || 'Pronto. Você viu o caminho completo.') } });
          p.onDone(ex.id, 'ok');
        }
      });
    }
    var terminal = S.fase === 'idle'
      ? [{ kind: 'hint', prefix: false, text: ex.dicaTerminal || 'Aperte Enter para rodar.' }]
      : S.lines.map(function (l) { return { kind: l.kind, text: l.text, prefix: l.prefix, dim: S.sel != null && l.etapa != null && l.etapa !== S.sel }; });
    var passos = etapas.map(function (e, i) {
      var base = { id: e.id, name: e.nome, description: e.descricao, tone: e.tom || TONS[i % 5] };
      if (i < S.n) {
        base.start = starts[i]; base.duration = dur(e);
        if (i === S.falhaIdx) base.description = 'Falhou aqui. ' + (e.descricao || '');
        return base;
      }
      return { id: e.id, name: e.nome, description: e.descricao };
    });
    var semPrev = !!pv && !S.prev;
    var tutor = S.tutor || { tom: 'neutral', html: semPrev ? 'Antes do Enter, escolha o que você acha que vai acontecer. Errar a previsão ensina mais do que só ver o resultado.' : (ex.tutorAntes || 'Aperte Enter para rodar e observe as etapas acenderem.') };
    var opcoes = falhas.map(function (f) { return { value: f.id, label: f.rotulo }; }).concat([{ value: 'nenhuma', label: 'Sem falha' }]);
    return h(Painel, { ex: ex, feito: p.feito, onDone: p.onDone },
      quebre && h('div', null, h('span', { className: 'ta-field-label', id: ex.id + '-lbl' }, 'Falha a provocar'),
        h('div', { className: 'ta-segwrap' }, h(T.SegmentedControl, { options: opcoes, value: seg[0], onChange: function (v) { seg[1](v); if (pv) set({ prev: null }); }, 'aria-label': 'Falha a provocar' }))),
      pv && h(Prever, { cfg: pv, valor: S.prev, travado: rodando, revelar: S.fase === 'fim' && S.prevUsada === S.prev, onChange: function (id) { set({ prev: id }); } }),
      h('div', { className: 'ta-run' },
        h(T.TextField, {
          prefix: prefixo, mono: true, value: val[0], disabled: rodando, hint: semPrev ? 'Faça a previsão acima para liberar o Enter.' : ex.dica,
          onChange: function (e) { val[1](e.target.value); },
          onKeyDown: function (e) { if (e.key === 'Enter') { e.preventDefault(); play(); } },
          trailing: h(Button, { size: 'sm', disabled: rodando || semPrev, onClick: play, 'aria-label': 'Rodar (Enter)' }, 'Enter ↵')
        })),
      h('div', { className: 'ta-cols' },
        h('div', { className: 'ta-steps', ref: tlRef }, h(T.StepTimeline, {
          steps: passos, total: total, unit: ex.unidade || 'ms', selected: S.sel, onSelect: function (id) { set({ sel: id }); }, showTotal: S.n > 0
        })),
        h('div', { className: 'ta-term' }, h(T.Terminal, { lines: terminal, title: ex.terminalTitulo || (prefixo === '$' ? 'terminal' : prefixo === 'Prompt' ? 'agente' : 'requisição'), live: true, caret: rodando }))),
      h(TutorLive, { tutor: tutor }));
  }

  /* ---------- escolha (com confiança opcional) ---------- */
  function Escolha(p) {
    var ex = p.ex, ops = ex.opcoes || [];
    var A = AP();
    var usaConf = !!(A && CFG.confianca && ex.confianca !== false);
    var s = useState({ erradas: [], certa: null, tutor: null, sel: null, conf: null, tentou: false }), S = s[0];
    function pick(o, conf) {
      if (S.certa) return;
      var primeira = !S.tentou;
      if (primeira && A && conf && !p.feito) A.registrarCalibracao({ aula: p.aulaId || '', exercicio: ex.id, confianca: conf, acertou: !!o.correta });
      if (o.correta) { s[1](Object.assign({}, S, { certa: o.id, tutor: { tom: 'success', lead: 'Certo.', html: o.porque }, tentou: true })); p.onDone(ex.id, 'ok'); }
      else s[1](Object.assign({}, S, { erradas: S.erradas.concat([o.id]), certa: null, sel: null, tutor: { tom: 'danger', lead: 'Ainda não:', html: semAinda(o.porque) }, tentou: true }));
    }
    function clicar(o) {
      if (S.certa) return;
      if (usaConf && !S.tentou) s[1](Object.assign({}, S, { sel: o.id })); else pick(o, null);
    }
    function conferir() {
      var o = ops.filter(function (x) { return x.id === S.sel; })[0];
      if (o && S.conf) pick(o, S.conf);
    }
    var pedeConf = usaConf && !S.tentou && !S.certa;
    var tutor = S.tutor || { tom: 'neutral', html: ex.tutorAntes || (usaConf ? 'Escolha uma resposta, diga o quanto você confia nela e aperte Conferir.' : 'Escolha a resposta que você acha certa.') };
    return h(Painel, { ex: ex, feito: p.feito, onDone: p.onDone },
      h('p', { className: 'ta-pergunta' }, h(Html, { tag: 'span', html: ex.pergunta })),
      h('ul', { className: 'ta-opts' }, ops.map(function (o, i) {
        var errada = S.erradas.indexOf(o.id) >= 0, certa = S.certa === o.id, sel = S.sel === o.id;
        return h('li', { key: o.id }, h('button', {
          type: 'button', className: 'ta-opt', disabled: !!S.certa || errada, 'aria-pressed': pedeConf ? sel : undefined, 'data-estado': certa ? 'certa' : errada ? 'errada' : sel ? 'sel' : undefined, onClick: function () { clicar(o); }
        }, h('span', { className: 'ta-opt-letra', 'aria-hidden': true }, String.fromCharCode(65 + i)),
          h('span', { className: 'ta-opt-corpo' }, h(Html, { tag: 'span', html: o.texto }),
            (S.certa || errada) && o.porque && h(Html, { tag: 'span', className: 'ta-opt-porque', html: (certa ? 'Correta. ' + cap(semAinda(o.porque)) : 'Ainda não: ' + semAinda(o.porque)) })),
          (certa || errada) && h(Badge, { tone: certa ? 'brand' : 'highlight' }, certa ? 'Correta' : 'Ainda não')));
      })),
      pedeConf && h('div', { className: 'ta-conf' },
        h('span', { className: 'ta-field-label' }, 'Quanto você confia nessa resposta?'),
        h('div', { className: 'ta-segwrap' }, h(A.Confianca, { value: S.conf, onChange: function (v) { s[1](Object.assign({}, S, { conf: v })); } })),
        h('div', { className: 'ta-acoes' }, h(Button, { disabled: !S.sel || !S.conf, onClick: conferir }, 'Conferir'),
          (!S.sel || !S.conf) && h('span', { className: 'ta-nota-inline' }, !S.sel ? 'Escolha uma resposta.' : 'Escolha o nível de confiança.'))),
      h(TutorLive, { tutor: tutor }));
  }

  /* ---------- ordene ---------- */
  function Ordene(p) {
    var ex = p.ex, itens = ex.itens || [], sol = ex.solucao || [];
    var byId = {}; itens.forEach(function (i) { byId[i.id] = i; });
    var s = useState(function () {
      var o = itens.map(function (i) { return i.id; });
      if (o.join() === sol.join()) o.reverse();
      return { ordem: o, res: null, tutor: null, foco: null, tick: 0 };
    }), S = s[0];
    useEffect(function () {
      if (!S.foco) return;
      var q = function (d) { return document.querySelector('[data-ord="' + ex.id + ':' + S.foco.id + ':' + d + '"]'); };
      var el = q(S.foco.dir); if (!el || el.disabled) el = q(S.foco.dir === 'up' ? 'down' : 'up');
      if (el) el.focus();
    }, [S.tick]);
    function mover(i, d) {
      var j = i + d, o = S.ordem.slice();
      if (j < 0 || j >= o.length) return;
      var t = o[i]; o[i] = o[j]; o[j] = t;
      s[1]({ ordem: o, res: null, tutor: S.tutor && S.tutor.tom === 'success' ? S.tutor : null, foco: { id: o[j], dir: d < 0 ? 'up' : 'down' }, tick: S.tick + 1 });
    }
    function conferir() {
      var certos = S.ordem.map(function (id, i) { return sol[i] === id; });
      var n = certos.filter(Boolean).length;
      if (n === sol.length) { s[1](Object.assign({}, S, { res: certos, foco: null, tutor: { tom: 'success', lead: 'Certo.', html: ex.tutorDepois || 'Essa é a ordem.' } })); p.onDone(ex.id, 'ok'); }
      else s[1](Object.assign({}, S, { res: certos, foco: null, tutor: { tom: 'danger', lead: 'Ainda não:', html: n + ' de ' + sol.length + ' itens estão na posição certa. Mova os outros com as setas e confira de novo.' + (ex.dica ? ' ' + ex.dica : '') } }));
    }
    var tutor = S.tutor || { tom: 'neutral', html: ex.tutorAntes || 'Use as setas para colocar os itens na ordem e aperte Conferir.' };
    return h(Painel, { ex: ex, feito: p.feito, onDone: p.onDone },
      h('ol', { className: 'ta-ord' }, S.ordem.map(function (id, i) {
        var it = byId[id] || { texto: id };
        return h('li', { key: id, 'data-ok': S.res ? String(S.res[i]) : undefined },
          h('span', { className: 'ta-ord-n', 'aria-hidden': true }, i + 1),
          h(Html, { tag: 'span', className: 'ta-ord-t', html: it.texto }),
          S.res && S.res[i] && h(Badge, { tone: 'brand' }, 'Na posição'),
          h('span', { className: 'ta-ord-btns' },
            h(Button, { variant: 'gray', size: 'sm', disabled: i === 0, 'data-ord': ex.id + ':' + id + ':up', 'aria-label': 'Subir: ' + String(it.texto).replace(/<[^>]+>/g, ''), onClick: function () { mover(i, -1); } }, '↑'),
            h(Button, { variant: 'gray', size: 'sm', disabled: i === S.ordem.length - 1, 'data-ord': ex.id + ':' + id + ':down', 'aria-label': 'Descer: ' + String(it.texto).replace(/<[^>]+>/g, ''), onClick: function () { mover(i, 1); } }, '↓')));
      })),
      h('div', { className: 'ta-acoes' }, h(Button, { onClick: conferir }, 'Conferir')),
      h(TutorLive, { tutor: tutor }));
  }

  /* ---------- chat com o agente ---------- */
  function Chat(p) {
    var ex = p.ex, rodadas = ex.rodadas || [];
    var s = useState(function () { return { r: 0, msgs: rodadas[0] ? [{ de: 'agente', html: rodadas[0].agente }] : [], erradas: [], fb: null, fim: false }; }), S = s[0];
    var logRef = useRef(null);
    useEffect(function () { var l = logRef.current; if (l) l.scrollTop = l.scrollHeight; }, [S.msgs.length]);
    function escolher(o, i) {
      var msgs = S.msgs.concat([{ de: 'voce', html: o.texto }]);
      if (o.resposta) msgs.push({ de: 'agente', html: o.resposta });
      if (o.boa) {
        var fim = S.r >= rodadas.length - 1;
        if (!fim) msgs.push({ de: 'agente', html: rodadas[S.r + 1].agente });
        s[1]({ r: fim ? S.r : S.r + 1, msgs: msgs, erradas: [], fb: { tom: 'success', titulo: 'Boa escolha:', html: o.porque }, fim: fim });
        if (fim) p.onDone(ex.id, 'ok');
      } else {
        s[1]({ r: S.r, msgs: msgs, erradas: S.erradas.concat([i]), fb: { tom: 'danger', titulo: 'Ainda não:', html: semAinda(o.porque) }, fim: false });
      }
    }
    var rod = rodadas[S.r];
    return h(Painel, { ex: ex, feito: p.feito, onDone: p.onDone },
      h('div', { className: 'ta-chat', role: 'log', 'aria-live': 'polite', 'aria-label': 'Conversa com o agente', ref: logRef },
        S.msgs.map(function (m, i) {
          return m.de === 'agente' ? h(Tutor, { key: i, avatar: 'A' }, h(Html, { tag: 'span', html: m.html })) : h('div', { key: i, className: 'ta-msg-voce' }, h(Html, { tag: 'span', html: m.html }));
        })),
      S.fb && h(Callout, { tone: S.fb.tom, title: S.fb.titulo }, h(Html, { tag: 'span', html: S.fb.html })),
      !S.fim && rod && h('div', null, h('span', { className: 'ta-field-label' }, 'Sua resposta ao agente (' + (S.r + 1) + ' de ' + rodadas.length + ')'),
        h('ul', { className: 'ta-opts' }, rod.opcoes.map(function (o, i) {
          var errada = S.erradas.indexOf(i) >= 0;
          return h('li', { key: i }, h('button', { type: 'button', className: 'ta-opt', disabled: errada, 'data-estado': errada ? 'errada' : undefined, onClick: function () { escolher(o, i); } },
            h('span', { className: 'ta-opt-letra', 'aria-hidden': true }, String.fromCharCode(65 + i)),
            h('span', { className: 'ta-opt-corpo' }, h(Html, { tag: 'span', html: o.texto })),
            errada && h(Badge, { tone: 'highlight' }, 'Ainda não')));
        }))));
  }

  /* ---------- esteira dev -> cert -> prod ---------- */
  function Esteira(p) {
    var ex = p.ex, ambs = ex.ambientes || [];
    var SHA = ex.artefato || 'a3f9c21';
    var st = useStore({ fase: 'idle', prox: 0, gates: {}, envs: {}, aguard: null, falhaKey: null, falhaPos: null, corrigidos: {}, lines: [], sel: null, tutor: null, pilha: [], concluido: false });
    var S = st[0](), set = st[1];
    var T0 = useTimers();
    var tlRef = useRef(null);
    var pipeline = [];
    ambs.forEach(function (a, ei) { (a.gates || []).forEach(function (g, gi) { pipeline.push({ ei: ei, gi: gi, a: a, g: g, key: a.id + ':' + g.id, d: g.tipo === 'aprovacao' ? 90 : 12 + ((ei * 7 + gi * 5) % 4) * 6 }); }); });
    var total = pipeline.reduce(function (m, x) { return m + x.d; }, 0) || 1;
    var falhaIdx = -1, ac = 0;
    var passos = pipeline.map(function (x, i) {
      var g = S.gates[x.key], tipo = x.g.tipo === 'aprovacao' ? 'Aprovação humana' : 'Automático';
      var base = { id: x.key, name: x.a.nome + ' · ' + x.g.rotulo, tone: TONS[x.ei % 5] };
      if (g === 'ok') { base.start = ac; base.duration = x.d; ac += x.d; base.description = tipo; return base; }
      base.description = g === 'rodando' ? tipo + ' · rodando' : g === 'aguardando' ? 'Aguardando você' : tipo;
      if (g === 'falhou') { falhaIdx = i; base.start = ac; base.duration = x.d; base.description = 'Falhou aqui. ' + tipo; }
      return base;
    });
    useMarcaFalha(tlRef, falhaIdx);
    function add(ls) { set(function (s) { return { lines: s.lines.concat(ls) }; }); }
    function stGate(key, v) { set(function (s) { var g = Object.assign({}, s.gates); if (v == null) delete g[key]; else g[key] = v; return { gates: g }; }); }
    function go(ei, gi) {
      var a = ambs[ei];
      if (gi >= a.gates.length) return implantar(ei);
      var g = a.gates[gi], key = a.id + ':' + g.id;
      if (g.tipo === 'aprovacao') {
        stGate(key, 'aguardando');
        set({ fase: 'aguardando', aguard: { ei: ei, gi: gi }, tutor: { tom: 'neutral', html: 'A pipeline parou em <strong>' + g.rotulo + '</strong>. Só uma pessoa libera: clique em Aprovar.' } });
        add([{ kind: 'info', text: 'aguardando aprovação: ' + g.rotulo, etapa: key }]);
        return;
      }
      stGate(key, 'rodando');
      set({ fase: 'rodando', tutor: { tom: 'neutral', html: 'Rodando <strong>' + g.rotulo + '</strong> em ' + a.nome + '.' } });
      add([g.comando ? { kind: 'cmd', text: g.comando, etapa: key } : { kind: 'info', text: a.id + ' · ' + g.rotulo, etapa: key }]);
      T0.sched(700, function () {
        if (g.falhaPossivel && !st[0]().corrigidos[key]) {
          var fp = g.falhaPossivel, ls = (fp && fp.linhas) || [g.rotulo + ': falhou', 'pipeline interrompida em ' + a.nome];
          stGate(key, 'falhou');
          add(ls.map(function (t) { return { kind: 'err', prefix: false, text: '! ' + t, etapa: key }; }));
          set({ fase: 'falhou', falhaPos: { ei: ei, gi: gi }, falhaKey: key, tutor: { tom: 'danger', lead: 'Ainda não:', html: (fp && fp.tutor) || 'o gate <strong>' + g.rotulo + '</strong> falhou e a promoção parou. Corrija a causa e rode o gate de novo, sem pular.' } });
          return;
        }
        stGate(key, 'ok');
        add([{ kind: 'in', text: g.saida || (g.rotulo + ': ok'), etapa: key }]);
        go(ei, gi + 1);
      });
    }
    function implantar(ei) {
      var a = ambs[ei], ultimo = ei === ambs.length - 1;
      add([{ kind: 'cmd', text: 'deploy ' + a.id + ' --artefato app:' + SHA, etapa: a.id + ':deploy' },
        { kind: 'out', text: 'mesmo artefato do ambiente anterior, sem rebuild', etapa: a.id + ':deploy' },
        { kind: 'in', text: a.nome + ': no ar, health check ok', etapa: a.id + ':deploy' }]);
      set(function (s) { var e = Object.assign({}, s.envs); e[a.id] = 'no ar'; return { envs: e, pilha: s.pilha.concat([ei]) }; });
      if (ultimo) {
        set({ fase: 'pronto', prox: ei + 1, concluido: true, tutor: { tom: 'success', html: ex.tutorDepois || 'O mesmo artefato chegou a produção passando por todos os gates. Se algo der errado, o rollback volta ao anterior.' } });
        p.onDone(ex.id, 'ok');
      } else set({ fase: 'idle', prox: ei + 1, tutor: { tom: 'neutral', html: a.nome + ' está no ar. Promova para <strong>' + ambs[ei + 1].nome + '</strong>.' } });
    }
    function promover() { if (S.fase === 'idle' && S.prox < ambs.length) { set({ aguard: null }); go(S.prox, 0); } }
    function aprovar() {
      var ag = S.aguard; if (!ag) return;
      var g = ambs[ag.ei].gates[ag.gi], key = ambs[ag.ei].id + ':' + g.id;
      stGate(key, 'ok'); set({ aguard: null });
      add([{ kind: 'in', text: 'aprovado por você: ' + g.rotulo, etapa: key }]);
      go(ag.ei, ag.gi + 1);
    }
    function corrigir() {
      var fp = S.falhaPos; if (!fp) return;
      var key = S.falhaKey;
      set(function (s) { var c = Object.assign({}, s.corrigidos); c[key] = true; return { corrigidos: c, falhaPos: null, falhaKey: null }; });
      add([{ kind: 'info', text: 'correção aplicada num novo commit; o gate roda de novo', etapa: key }]);
      stGate(key, null);
      set({ fase: 'idle' });
      go(fp.ei, fp.gi);
    }
    function rollback() {
      var pil = S.pilha; if (!pil.length) return;
      var ei = pil[pil.length - 1], a = ambs[ei];
      add([{ kind: 'cmd', text: 'deploy rollback ' + a.id + ' --para app:anterior', etapa: a.id + ':deploy' },
        { kind: 'in', text: a.nome + ': versão anterior no ar, health check ok', etapa: a.id + ':deploy' }]);
      set(function (s) {
        var e = Object.assign({}, s.envs); e[a.id] = 'revertido';
        var g = Object.assign({}, s.gates); a.gates.forEach(function (x) { delete g[a.id + ':' + x.id]; });
        return { envs: e, gates: g, pilha: s.pilha.slice(0, -1), prox: ei, fase: 'idle', aguard: null, tutor: { tom: 'neutral', html: 'Rollback em ' + a.nome + ': voltou o artefato anterior em segundos, sem novo build. Promova de novo quando a causa estiver resolvida.' } };
      });
    }
    var ocupado = S.fase === 'rodando' || S.fase === 'aguardando' || S.fase === 'falhou';
    var terminal = S.lines.length
      ? S.lines.map(function (l) { return { kind: l.kind, text: l.text, prefix: l.prefix, dim: S.sel != null && l.etapa !== S.sel }; })
      : [{ kind: 'hint', prefix: false, text: 'Aperte Promover para começar.' }];
    var tutor = S.tutor || { tom: 'neutral', html: ex.tutorAntes || 'Promova o mesmo artefato de dev até produção. Alguns gates pedem a sua aprovação.' };
    var proximo = ambs[S.prox];
    return h(Painel, { ex: ex, feito: p.feito, onDone: p.onDone },
      h('div', { className: 'ta-envs' }, ambs.map(function (a, i) {
        var e = S.envs[a.id];
        return h('div', { key: a.id, className: 'ta-env', 'data-atual': S.prox === i && !S.concluido ? 'true' : undefined },
          h('strong', null, a.nome), h(Badge, { tone: e === 'no ar' ? 'brand' : e === 'revertido' ? 'highlight' : 'neutral' }, e || 'pendente'));
      })),
      h('div', { className: 'ta-acoes' },
        h(Button, { disabled: !(S.fase === 'idle' && proximo), onClick: promover, trailing: '→' }, proximo ? 'Promover para ' + proximo.nome : 'Tudo no ar'),
        S.fase === 'aguardando' && h(Button, { variant: 'brand', onClick: aprovar }, 'Aprovar'),
        S.fase === 'falhou' && h(Button, { variant: 'tinted', onClick: corrigir }, 'Corrigir e rodar de novo'),
        h(Button, { variant: 'gray', disabled: !S.pilha.length || S.fase === 'rodando', onClick: rollback }, 'Rollback')),
      h('div', { className: 'ta-cols' },
        h('div', { className: 'ta-steps', ref: tlRef }, h(T.StepTimeline, { steps: passos, total: total, unit: 's', selected: S.sel && pipeline.some(function (x) { return x.key === S.sel; }) ? S.sel : null, onSelect: function (id) { set({ sel: id }); }, showTotal: ac > 0 })),
        h('div', { className: 'ta-term' }, h(T.Terminal, { lines: terminal, title: 'deploy', live: true, caret: S.fase === 'rodando' }))),
      h(TutorLive, { tutor: tutor }));
  }

  /* ---------- aplicação ---------- */
  function App() {
    var rs = useState(lerHash), route = rs[0];
    var ss = useState(lerStore), store = ss[0];
    var ds = useState(false), drawer = ds[0];
    var cs = useState(false), confirma = cs[0];
    var tk = useState(0), copiado = useState(null);
    useEffect(function () {
      function f() { tk[1](function (n) { return n + 1; }); }
      window.addEventListener('curso:srs', f); return function () { window.removeEventListener('curso:srs', f); };
    }, []);
    var ts = useState(function () { return document.documentElement.getAttribute('data-theme') || ''; });
    useEffect(function () {
      function f() { rs[1](lerHash()); }
      window.addEventListener('hashchange', f); return function () { window.removeEventListener('hashchange', f); };
    }, []);
    function mut(fn) { ss[1](function (s) { var n = JSON.parse(JSON.stringify(s)); fn(n); gravarStore(n); return n; }); }
    var ids = order.length ? order : Object.keys(registry);
    var pri = store.atual && ids.indexOf(store.atual.aula) >= 0 ? store.atual : { aula: ids[0], aba: 0 };
    var emRevisao = !!(route && route.revisao && AP());
    var oculta = !!(route && route.aula && ids.indexOf(route.aula) < 0 && registry[route.aula] && registry[route.aula].escondida);
    var cur = route && route.aula && (ids.indexOf(route.aula) >= 0 || oculta) ? route : pri;
    var aula = registry[cur.aula], idx = ids.indexOf(cur.aula);
    var abas = aula ? aula.abas || [] : [];
    var aba = clamp(cur.aba || 0, 0, Math.max(0, abas.length - 1));
    var sa = aulaSt(store, cur.aula);

    useEffect(function () {
      mut(function (n) { n.atual = { aula: cur.aula, aba: aba }; n.aulas[cur.aula] = Object.assign({ aba: 0, feitos: {}, concluida: false }, n.aulas[cur.aula], { aba: aba }); });
      window.scrollTo(0, 0); ds[1](false); copiado[1](null);
      document.title = (aula ? aula.titulo : 'Em preparo') + ' · ' + C.nome;
    }, [cur.aula, aba]);
    useEffect(function () { if (emRevisao) { window.scrollTo(0, 0); ds[1](false); document.title = 'Revisão do dia · ' + C.nome; } }, [emRevisao]);
    // Aulas já concluídas entram na revisão espaçada (idempotente).
    useEffect(function () {
      var A = AP(); if (!A) return;
      ids.forEach(function (id) { if (aulaSt(store, id).concluida) A.matricular(id); });
    }, [store]);

    function ir(id, a) { var nh = hashDe(id, a || 0); if (location.hash === nh) rs[1](lerHash()); else location.hash = nh; }
    function concluir(exId, status) { mut(function (n) { var a = n.aulas[cur.aula] || (n.aulas[cur.aula] = { aba: aba, feitos: {}, concluida: false }); a.feitos = a.feitos || {}; if (!a.feitos[exId]) a.feitos[exId] = status; }); }
    function abaStats(i) {
      var exs = coletar((abas[i] || {}).blocos, []).filter(function (e) { return e.obrigatorio !== false; });
      var feitos = exs.filter(function (e) { return sa.feitos && sa.feitos[e.id]; });
      return { exs: exs, feitos: feitos, pend: exs.filter(function (e) { return !(sa.feitos && sa.feitos[e.id]); }) };
    }
    var ctx = { feitos: sa.feitos || {}, concluir: concluir, aulaId: cur.aula, aba: aba };
    var stats = aula ? abaStats(aba) : { exs: [], feitos: [], pend: [] };
    var pode = !aula || stats.pend.length === 0;
    var ultimaAba = aba >= abas.length - 1, ultimaAula = oculta || idx >= ids.length - 1;
    var DICAS = { rode: 'Aperte Enter para rodar', quebre: 'Escolha uma falha, rode, depois rode sem falha', escolha: 'Escolha uma resposta', ordene: 'Ordene os itens e aperte Conferir', chat: 'Escolha a melhor resposta ao agente', esteira: 'Promova o artefato até produção', complete: 'Preencha as lacunas e aperte Conferir', escreva: 'Escreva, envie e marque a rubrica', cenario: 'Chegue a um final bom', transcript: 'Marque a linha onde a sessão errou e aperte Conferir', python: 'Faça todos os testes passarem' };
    var dica = aula && stats.pend[0] ? (stats.pend[0].dica || DICAS[stats.pend[0].tipo]) : null;
    if (dica) { var _t = document.createElement('textarea'); _t.innerHTML = String(dica).replace(/<[^>]+>/g, ''); dica = _t.value; }
    if (dica) dica = String(dica).replace(/\s+/g, ' ').trim().replace(/[.\s]+$/, '');
    function continuar() {
      if (!pode) return;
      if (!aula) { if (!ultimaAula) ir(ids[idx + 1], 0); return; }
      if (!ultimaAba) { ir(cur.aula, aba + 1); return; }
      mut(function (n) { n.aulas[cur.aula].concluida = true; });
      if (AP()) AP().matricular(cur.aula);
      if (!oculta && !ultimaAula) ir(ids[idx + 1], 0);
    }
    function voltar() { if (aba > 0) ir(cur.aula, aba - 1); else if (!oculta && idx > 0) ir(ids[idx - 1], 0); }
    function irAba(i) {
      for (var k = 0; k < i; k++) if (abaStats(k).pend.length) return;
      ir(cur.aula, i);
    }
    var feitasN = ids.filter(function (id) { return aulaSt(store, id).concluida; }).length;
    var rotulo = !aula ? 'Próxima aula' : ultimaAba ? (oculta ? 'Concluir aula' : ultimaAula ? 'Concluir ' + C.unidade : 'Próxima aula') : 'Continuar';
    var podeFinal = !aula ? !ultimaAula : pode;
    var A_ = AP(), nRev = A_ ? A_.pendentesResolvidos(10).length : 0;
    function perguntarTutor() {
      var t = trabalho && trabalho.aula === cur.aula && trabalho.aba === aba ? trabalho : null;
      var txt = promptTutor({ aula: aula ? aula.titulo : tituloDe(cur.aula), aba: aula && abas[aba] ? abas[aba].rotulo : '', objetivo: aula ? (aula.objetivo || aula.resumo) : '', aluno: t });
      copiarTexto(txt, function () { copiado[1](Date.now()); });
    }

    function tema() {
      var atual = document.documentElement.getAttribute('data-theme');
      if (!atual) { try { atual = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'; } catch (e) { atual = 'light'; } }
      var novo = atual === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', novo);
      try { localStorage.setItem('curso.theme', novo); } catch (e) {}
      ts[1](novo);
    }
    var escuro = (document.documentElement.getAttribute('data-theme') || (function () { try { return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'; } catch (e) { return 'light'; } })()) === 'dark';

    var lateral = h('aside', { className: 'ta-side', 'data-aberta': drawer ? 'true' : 'false', 'aria-label': 'Aulas da trilha' },
      h('h2', { className: 'ta-brand' }, C.nome, h('small', null, C.subtitulo)),
      h(T.ProgressBar, { value: ids.length ? feitasN / ids.length : 0, tone: 'brand', label: feitasN + ' de ' + ids.length + ' aulas', showValue: true }),
      A_ && h('nav', { 'aria-label': 'Revisão' }, h(T.List, null, h(T.ListRow, {
        title: 'Revisão do dia (' + nRev + ')', subtitle: nRev ? 'Itens vencidos, de várias aulas' : 'Nada vencido hoje', chevron: false, current: emRevisao,
        leading: h('span', { className: 'ta-num', 'aria-hidden': true }, '↻'), onClick: function () { location.hash = '#revisao'; }
      }))),
      h('nav', { 'aria-label': 'Lista de aulas' }, h(T.List, null, ids.map(function (id, i) {
        var r = registry[id], s = aulaSt(store, id);
        return h(T.ListRow, {
          key: id, title: tituloDe(id), subtitle: r ? r.minutos + ' min' : 'em preparo', chevron: false, current: !emRevisao && id === cur.aula, done: !!s.concluida,
          leading: h('span', { className: 'ta-num' }, s.concluida ? '✓' : String(i + 1)), onClick: function () { ir(id, r ? (s.aba || 0) : 0); }
        });
      }))),
      h('div', { className: 'ta-side-links' },
        h('a', { href: C.portal }, '← Portal do curso'),
        C.texto && h('a', { href: C.texto }, 'Versão em texto'),
        h(Button, { variant: 'plain', onClick: tema }, escuro ? 'Tema claro' : 'Tema escuro'),
        confirma
          ? h(Button, { variant: 'tinted', onClick: function () { mut(function (n) { n.aulas = {}; n.atual = null; }); cs[1](false); ir(ids[0], 0); } }, 'Confirmar: apagar progresso')
          : h(Button, { variant: 'plain', onClick: function () { cs[1](true); } }, 'Recomeçar ' + C.unidade)));

    var corpo;
    if (emRevisao) {
      corpo = h(A_.RevisaoDia, { onSair: function () { ir(pri.aula, pri.aba); } });
    } else if (!aula) {
      var passo = PASSO[cur.aula];
      corpo = h(Card, { variant: 'panel', title: 'Esta aula está em preparo' },
        h('div', { className: 'ta-preparo' }, h('p', { style: { margin: 0 } }, 'A versão interativa ainda não foi escrita. O conteúdo desta aula já existe em texto.'),
          C.texto && h('a', { href: C.texto + (passo ? '#' + passo : '') }, 'Ler a versão em texto')));
    } else {
      corpo = h(Blocos, { blocos: abas[aba] ? abas[aba].blocos : [], ctx: ctx, k: cur.aula + '-' + aba });
    }
    var passoAtual = PASSO[cur.aula];
    var mbar = h('div', { className: 'ta-mbar' }, h(Button, { variant: 'gray', size: 'sm', onClick: function () { ds[1](!drawer); }, 'aria-expanded': drawer }, 'Aulas'), h('strong', null, emRevisao ? 'Revisão do dia' : tituloDe(cur.aula)));
    var scrim = h('button', { type: 'button', className: 'ta-scrim', 'data-aberta': drawer ? 'true' : 'false', 'aria-label': 'Fechar lista de aulas', onClick: function () { ds[1](false); }, tabIndex: drawer ? 0 : -1 });
    if (emRevisao) {
      return h('div', { className: 'ta-app' }, lateral, scrim,
        h('div', { className: 'ta-main' }, h('div', { className: 'ta-top' }, mbar), h('main', { className: 'ta-aula', id: 'conteudo' }, corpo)));
    }
    return h('div', { className: 'ta-app' }, lateral, scrim,
      h('div', { className: 'ta-main' },
        h('div', { className: 'ta-top' }, mbar,
          h(T.LessonToolbar, {
            steps: aula ? abas.map(function (a, i) { var s = abaStats(i); return { label: a.rotulo, progress: s.exs.length ? s.feitos.length / s.exs.length : (i <= aba ? 1 : 0) }; }) : [{ label: 'Em preparo', progress: 0 }],
            current: aula ? aba : 0, onStep: aula ? irAba : undefined, onBack: (aba > 0 || idx > 0) ? voltar : undefined,
            hint: pode ? undefined : dica, canContinue: podeFinal, onContinue: continuar, continueLabel: rotulo
          })),
        h('main', { className: 'ta-aula', id: 'conteudo' },
          h('header', { className: 'ta-head' },
            h('div', { className: 'ta-meta' }, h(Badge, { tone: 'brand' }, oculta ? 'Aula escondida' : 'Aula ' + (idx + 1) + ' de ' + ids.length), aula && h(Badge, null, aula.minutos + ' min'),
              C.texto && passoAtual && h('a', { href: C.texto + '#' + passoAtual, style: { fontSize: 13 } }, 'Ler em texto')),
            h('h1', null, tituloDe(cur.aula)),
            aula && aula.resumo && h('p', null, aula.resumo)),
          corpo,
          h('div', { className: 'ta-foot' },
            h('div', { className: 'ta-foot-l' },
              aula && h(Button, { variant: 'tinted', onClick: perguntarTutor }, 'Perguntar ao tutor'),
              h('span', null, pode ? '' : (dica ? 'Falta: ' + dica.replace(/^./, function (c) { return c.toLowerCase(); }) + '. Ou use Pular exercício.' : 'Conclua os exercícios para continuar.'))),
            h(Button, { disabled: !podeFinal, trailing: '→', onClick: continuar }, rotulo)),
          copiado[0] && h('div', { 'aria-live': 'polite' }, h(Callout, { tone: 'success', title: 'Prompt copiado — cole no seu agente (Claude, Cursor, Codex…)' }, 'O tutor vai conduzir você por perguntas, sem entregar a resposta.')))));
  }
})();
