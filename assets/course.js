/* Curso — navegação, tema, progresso e componentes interativos compartilhados.
   Uso numa página de módulo:
   <script src="../../assets/course-manifest.js"></script>
   <script src="../../assets/course.js" data-unit="F01" defer></script>  */
(function () {
  "use strict";
  var script = document.currentScript;
  var UNIT = (script && script.dataset.unit) || "";
  var ROOT = script ? new URL("../", script.src) : new URL("./", location.href);
  var STORAGE_KEY = "tutor-ia.course-progress.v2";
  var THEME_KEY = "curso.theme";
  var M = window.COURSE_MANIFEST || { units: [], phases: [] };
  var ready = (window.__courseQ || []).slice();

  function store(get, key, value) {
    try {
      if (get) return localStorage.getItem(key);
      localStorage.setItem(key, value);
    } catch (e) { return null; }
    return null;
  }
  function el(tag, attrs, html) {
    var n = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) { n.setAttribute(k, attrs[k]); });
    if (html !== undefined) n.innerHTML = html;
    return n;
  }
  function href(path) { return new URL(path, ROOT).href; }
  var ICON = {
    menu: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M4 6h16M4 12h16M4 18h16"/></svg>',
    sun: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>',
    moon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>',
    up: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M12 19V5M5 12l7-7 7 7"/></svg>'
  };

  /* ---------- Tema ---------- */
  function currentTheme() {
    var t = document.documentElement.dataset.theme;
    if (t) return t;
    return window.matchMedia && matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  function applyTheme(t) {
    document.documentElement.dataset.theme = t;
    store(false, THEME_KEY, t);
    var b = document.querySelector(".c-theme");
    if (b) { b.innerHTML = t === "dark" ? ICON.sun : ICON.moon; b.setAttribute("aria-label", t === "dark" ? "Usar tema claro" : "Usar tema escuro"); }
  }
  var saved = store(true, THEME_KEY);
  if (saved === "dark" || saved === "light") document.documentElement.dataset.theme = saved;

  /* ---------- Progresso (mesmo formato do portal) ---------- */
  function loadState() {
    var raw = store(true, STORAGE_KEY), s = null;
    try { s = raw ? JSON.parse(raw) : null; } catch (e) { s = null; }
    if (!s || s.schemaVersion !== 2) s = { schemaVersion: 2, courseVersion: M.courseVersion, updatedAt: null, lastVisited: null, blocks: {}, optional: {} };
    s.blocks = s.blocks || {}; s.optional = s.optional || {};
    return s;
  }
  function saveState(s) { s.updatedAt = new Date().toISOString(); store(false, STORAGE_KEY, JSON.stringify(s)); }

  function unitInfo() {
    for (var i = 0; i < M.units.length; i++) if (M.units[i].code === UNIT) return { unit: M.units[i], index: i };
    return { unit: null, index: -1 };
  }

  /* ---------- Estrutura da página ---------- */
  function buildLayout() {
    var info = unitInfo(), unit = info.unit;
    var body = document.body;
    var kids = Array.prototype.slice.call(body.childNodes).filter(function (n) { return !(n.tagName === "SCRIPT"); });
    var top = el("header", { "class": "c-top" });
    top.innerHTML =
      '<a class="skip-link" href="#conteudo">Pular para o conteúdo</a>' +
      '<button class="c-iconbtn c-menu" type="button" aria-label="Abrir sumário" aria-expanded="false">' + ICON.menu + '</button>' +
      '<a class="c-home" href="' + href("index.html") + '">Curso</a>' +
      '<span class="c-crumb">' + (unit ? unit.phase + ' · <b>' + unit.code + '</b> · ' + unit.title : (document.title || "")) + '</span>' +
      '<button class="c-iconbtn c-theme" type="button"></button>' +
      '<div class="c-progress" aria-hidden="true"></div>';
    var layout = el("div", { "class": "c-layout" });
    var side = el("nav", { "class": "c-side", "aria-label": "Sumário do módulo" });
    var main = el("main", { "class": "c-main", id: "conteudo", tabindex: "-1" });
    kids.forEach(function (n) { main.appendChild(n); });
    layout.appendChild(side); layout.appendChild(main);
    body.insertBefore(el("div", { "class": "c-scrim" }), body.firstChild);
    body.insertBefore(layout, body.firstChild);
    body.insertBefore(top, body.firstChild);
    buildSidebar(side, unit);
    if (unit) buildPager(main, info.index);
    var totop = el("button", { "class": "c-iconbtn c-totop", type: "button", "aria-label": "Voltar ao topo" }, ICON.up);
    totop.addEventListener("click", function () { window.scrollTo({ top: 0, behavior: "smooth" }); });
    body.appendChild(totop);

    var menu = top.querySelector(".c-menu");
    function toggle(open) { body.classList.toggle("side-open", open); menu.setAttribute("aria-expanded", open ? "true" : "false"); }
    menu.addEventListener("click", function () { toggle(!body.classList.contains("side-open")); });
    body.querySelector(".c-scrim").addEventListener("click", function () { toggle(false); });
    side.addEventListener("click", function (e) { if (e.target.closest("a")) toggle(false); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") toggle(false); });
    var tb = top.querySelector(".c-theme");
    applyTheme(currentTheme());
    tb.addEventListener("click", function () { applyTheme(currentTheme() === "dark" ? "light" : "dark"); });
  }

  function slug(s) { return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60); }
  function sections() {
    var hs = Array.prototype.slice.call(document.querySelectorAll(".c-main h2"));
    hs.forEach(function (h) {
      if (h.id) return;
      var sec = h.closest("section[id]");
      var id = sec && !sec.querySelector("h2[id]") ? sec.id : slug(h.textContent) || "secao";
      while (document.getElementById(id) && document.getElementById(id) !== sec) id += "-x";
      if (sec && sec.id === id) { sec.removeAttribute("id"); }
      h.id = id;
    });
    return hs.filter(function (h) { return !h.closest(".c-side"); });
  }
  function blockOf(h2) {
    var m = /^(?:Bloco|B)\s*0?(\d+)\b/i.exec(h2.textContent.trim());
    return m ? UNIT + ":b" + (m[1].length < 2 ? "0" + m[1] : m[1]) : null;
  }

  function buildSidebar(side, unit) {
    var state = loadState();
    var html = "";
    if (unit) {
      html += '<h2>Este módulo</h2><div class="c-unit-title">' + unit.code + " · " + unit.title + '</div>';
      html += '<div class="c-unit-meta">' + (unit.hours ? "≈ " + unit.hours + " h · " : "") + (unit.blocks ? unit.blocks.length : 0) + " blocos</div>";
    }
    html += '<h2>Seções</h2><ol class="c-sec">';
    sections().forEach(function (h) {
      var id = blockOf(h), st = id ? state.blocks[id] : null;
      var cls = st === "completed" ? "is-done" : st === "in_progress" ? "is-doing" : "";
      var label = h.textContent.replace(/[#¶]\s*$/, "").trim();
      html += '<li class="' + cls + '" data-block="' + (id || "") + '"><a href="#' + h.id + '"><span class="c-dot" aria-hidden="true"></span><span>' + label + "</span></a></li>";
    });
    html += "</ol>";
    html += '<h2>Curso</h2><ul><li><a href="' + href("index.html") + '">Todas as fases e módulos</a></li>' +
      '<li><a href="' + href("trilha-rapida/TR.html") + '">Trilha rápida: dev com agentes</a></li>' +
      '<li><a href="' + href("docs/nivelamento.md") + '">Nivelamento</a></li></ul>';
    side.innerHTML = html;
  }

  function buildPager(main, i) {
    var prev = M.units[i - 1], next = M.units[i + 1];
    var nav = el("nav", { "class": "c-pager", "aria-label": "Módulo anterior e próximo" });
    if (prev) nav.appendChild(el("a", { href: href(prev.file), "class": "prev" }, "<small>← Anterior</small>" + prev.code + " · " + prev.title));
    if (next) nav.appendChild(el("a", { href: href(next.file), "class": "next" }, "<small>Próximo →</small>" + next.code + " · " + next.title));
    main.appendChild(nav);
  }

  /* ---------- Melhorias de leitura ---------- */
  function enhanceReading() {
    var main = document.querySelector(".c-main") || document.body;
    main.querySelectorAll("table").forEach(function (t) {
      if (t.parentElement.classList.contains("table-wrap")) return;
      var w = el("div", { "class": "table-wrap" }); t.parentNode.insertBefore(w, t); w.appendChild(t);
    });
    main.querySelectorAll("pre").forEach(function (pre) {
      if (pre.querySelector(".c-copy")) return;
      var b = el("button", { "class": "c-copy", type: "button", "aria-label": "Copiar código" }, "Copiar");
      b.addEventListener("click", function () {
        var text = (pre.querySelector("code") || pre).innerText;
        var done = function () { b.textContent = "Copiado"; setTimeout(function () { b.textContent = "Copiar"; }, 1400); };
        if (navigator.clipboard) navigator.clipboard.writeText(text).then(done, function () {}); else done();
      });
      pre.appendChild(b);
    });
    main.querySelectorAll("h2[id],h3[id]").forEach(function (h) {
      if (h.querySelector(".section-link")) return;
      h.appendChild(el("a", { "class": "section-link", href: "#" + h.id, "aria-label": "Link para esta seção" }, "#"));
    });
  }

  function trackProgress() {
    var bar = document.querySelector(".c-progress"), totop = document.querySelector(".c-totop");
    var heads = sections(), links = {};
    document.querySelectorAll(".c-side .c-sec a").forEach(function (a) { links[a.getAttribute("href").slice(1)] = a; });
    var state = loadState();

    // botão "marcar como lido" ao fim de cada bloco
    heads.forEach(function (h, idx) {
      var id = blockOf(h); if (!id) return;
      var nextH = heads[idx + 1];
      var wrap = el("div", { "class": "c-mark" });
      var btn = el("button", { type: "button", "aria-pressed": state.blocks[id] === "completed" ? "true" : "false" });
      function label() { btn.textContent = btn.getAttribute("aria-pressed") === "true" ? "✓ Bloco concluído" : "Marcar bloco como concluído"; }
      label();
      btn.addEventListener("click", function () {
        var s = loadState(), on = btn.getAttribute("aria-pressed") !== "true";
        if (on) s.blocks[id] = "completed"; else delete s.blocks[id];
        saveState(s); btn.setAttribute("aria-pressed", on ? "true" : "false"); label();
        var li = document.querySelector('.c-side li[data-block="' + id + '"]');
        if (li) { li.classList.toggle("is-done", on); li.classList.remove("is-doing"); }
      });
      wrap.appendChild(btn);
      if (nextH) nextH.parentNode.insertBefore(wrap, nextH); else h.parentNode.appendChild(wrap);
    });

    var ticking = false;
    function onScroll() {
      if (ticking) return; ticking = true;
      requestAnimationFrame(function () {
        ticking = false;
        var doc = document.documentElement, max = doc.scrollHeight - doc.clientHeight;
        if (bar) bar.style.width = (max > 0 ? (doc.scrollTop / max) * 100 : 0) + "%";
        if (totop) totop.classList.toggle("show", doc.scrollTop > 900);
        var cur = null;
        for (var i = 0; i < heads.length; i++) { if (heads[i].getBoundingClientRect().top < 120) cur = heads[i]; else break; }
        Object.keys(links).forEach(function (k) { links[k].classList.toggle("is-active", !!cur && k === cur.id); });
        if (cur) {
          var id = blockOf(cur);
          if (id) {
            var s = loadState(), changed = false;
            if (!s.blocks[id]) { s.blocks[id] = "in_progress"; changed = true; var li = document.querySelector('.c-side li[data-block="' + id + '"]'); if (li) li.classList.add("is-doing"); }
            if (!s.lastVisited || s.lastVisited.block !== id) { s.lastVisited = { unit: UNIT, block: id }; changed = true; }
            if (changed) saveState(s);
          }
        }
      });
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  /* ---------- Componentes interativos ---------- */
  function initQuiz(root) {
    root.querySelectorAll(".quiz").forEach(function (q) {
      if (q.dataset.ready) return; q.dataset.ready = "1";
      q.classList.add("ix");
      var answer = q.dataset.answer;
      q.querySelectorAll("li[data-opt]").forEach(function (li) {
        var b = el("button", { type: "button" }); b.innerHTML = li.innerHTML; li.innerHTML = ""; li.appendChild(b);
        b.addEventListener("click", function () {
          q.querySelectorAll("li button").forEach(function (x) { x.classList.remove("right", "wrong"); });
          var ok = li.dataset.opt === answer;
          b.classList.add(ok ? "right" : "wrong");
          if (!ok) { var r = q.querySelector('li[data-opt="' + answer + '"] button'); if (r) r.classList.add("right"); }
          q.classList.add("answered");
        });
      });
    });
  }
  function initFlashcards(root) {
    root.querySelectorAll(".fc").forEach(function (c) {
      if (c.dataset.ready) return; c.dataset.ready = "1";
      var inner = el("div", { "class": "fc-in" });
      while (c.firstChild) inner.appendChild(c.firstChild);
      c.appendChild(inner); c.setAttribute("tabindex", "0"); c.setAttribute("role", "button");
      c.setAttribute("aria-label", "Cartão: clique para virar");
      function flip() { c.classList.toggle("flipped"); }
      c.addEventListener("click", flip);
      c.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); flip(); } });
    });
  }
  var tabSeq = 0;
  function initTabs(root) {
    root.querySelectorAll(".tabs").forEach(function (t) {
      if (t.dataset.ready) return; t.dataset.ready = "1";
      var panels = Array.prototype.slice.call(t.children).filter(function (c) { return c.dataset && c.dataset.tab; });
      var list = el("div", { role: "tablist" });
      panels.forEach(function (p, i) {
        var id = "tab-" + (++tabSeq);
        var b = el("button", { role: "tab", type: "button", id: id, "aria-selected": i === 0 ? "true" : "false" }, p.dataset.tab);
        p.setAttribute("role", "tabpanel"); p.setAttribute("aria-labelledby", id); if (i) p.hidden = true;
        b.addEventListener("click", function () {
          list.querySelectorAll("[role=tab]").forEach(function (x) { x.setAttribute("aria-selected", "false"); });
          panels.forEach(function (x) { x.hidden = true; });
          b.setAttribute("aria-selected", "true"); p.hidden = false;
        });
        list.appendChild(b);
      });
      t.insertBefore(list, t.firstChild);
    });
  }
  function initSteppers(root) {
    root.querySelectorAll(".stepper").forEach(function (s) {
      if (s.dataset.ready) return; s.dataset.ready = "1";
      s.classList.add("ix");
      var frames = s.querySelectorAll(".frame"); if (!frames.length) return;
      var i = 0;
      var nav = el("div", { "class": "st-nav" });
      var prev = el("button", { type: "button", "class": "ix-btn" }, "← Anterior");
      var next = el("button", { type: "button", "class": "ix-btn primary" }, "Próximo →");
      var cap = el("div", { "class": "st-cap", "aria-live": "polite" });
      var dots = el("div", { "class": "st-dots", "aria-hidden": "true" });
      frames.forEach(function () { dots.appendChild(el("span")); });
      nav.appendChild(prev); nav.appendChild(cap); nav.appendChild(dots); nav.appendChild(next);
      s.appendChild(nav);
      function show(k) {
        i = Math.max(0, Math.min(frames.length - 1, k));
        frames.forEach(function (f, j) { f.classList.toggle("on", j === i); });
        dots.querySelectorAll("span").forEach(function (d, j) { d.classList.toggle("on", j === i); });
        cap.textContent = (i + 1) + "/" + frames.length + " · " + (frames[i].dataset.caption || "");
        prev.disabled = i === 0; next.disabled = i === frames.length - 1;
      }
      prev.addEventListener("click", function () { show(i - 1); });
      next.addEventListener("click", function () { show(i + 1); });
      show(0);
    });
  }
  function initOrder(root) {
    root.querySelectorAll("ol.order").forEach(function (o) {
      if (o.dataset.ready) return; o.dataset.ready = "1";
      var sol = (o.dataset.solution || "").split(",").map(function (x) { return x.trim(); });
      var items = Array.prototype.slice.call(o.children);
      // embaralha de forma determinística (inverte) para não começar resolvido
      items.reverse().forEach(function (li) { o.appendChild(li); });
      o.querySelectorAll("li").forEach(function (li) {
        var mv = el("span", { "class": "mv" });
        var up = el("button", { type: "button", "aria-label": "Mover para cima" }, "▲");
        var dn = el("button", { type: "button", "aria-label": "Mover para baixo" }, "▼");
        up.addEventListener("click", function () { if (li.previousElementSibling) o.insertBefore(li, li.previousElementSibling); });
        dn.addEventListener("click", function () { if (li.nextElementSibling) o.insertBefore(li.nextElementSibling, li); });
        mv.appendChild(up); mv.appendChild(dn); li.insertBefore(mv, li.firstChild);
      });
      var res = el("div", { "class": "order-result", "aria-live": "polite" });
      var check = el("button", { type: "button", "class": "ix-btn primary" }, "Conferir ordem");
      check.addEventListener("click", function () {
        var got = Array.prototype.map.call(o.querySelectorAll("li"), function (li) { return li.dataset.id; });
        var ok = got.join(",") === sol.join(",");
        o.classList.toggle("right", ok);
        res.textContent = ok ? "✓ Ordem correta." : "Ainda não. Reveja a dependência entre os passos.";
      });
      var box = el("div", { "class": "ix-row" }); box.appendChild(check); box.appendChild(res);
      o.parentNode.insertBefore(box, o.nextSibling);
    });
  }
  function initChecklists(root) {
    root.querySelectorAll("ul.checklist[data-key]").forEach(function (ul) {
      if (ul.dataset.ready) return; ul.dataset.ready = "1";
      var key = "curso.check." + ul.dataset.key, saved = {};
      try { saved = JSON.parse(store(true, key) || "{}"); } catch (e) { saved = {}; }
      ul.querySelectorAll("li").forEach(function (li, i) {
        var span = el("span"); while (li.firstChild) span.appendChild(li.firstChild);
        var cb = el("input", { type: "checkbox", "aria-label": "Marcar item " + (i + 1) });
        cb.checked = !!saved[i]; li.classList.toggle("done", cb.checked);
        cb.addEventListener("change", function () { saved[i] = cb.checked; li.classList.toggle("done", cb.checked); store(false, key, JSON.stringify(saved)); });
        li.appendChild(cb); li.appendChild(span);
      });
    });
  }
  function initAll(root) {
    root = root || document;
    initQuiz(root); initFlashcards(root); initTabs(root); initSteppers(root); initOrder(root); initChecklists(root);
  }

  function start() {
    if (document.body.dataset.layout !== "none") { buildLayout(); trackProgress(); }
    else { applyTheme(currentTheme()); }
    enhanceReading();
    initAll(document);
    if (location.hash) { var t = document.getElementById(decodeURIComponent(location.hash.slice(1))); if (t) t.scrollIntoView(); }
    ready.forEach(function (fn) { try { fn(window.Course); } catch (e) { console.error(e); } });
    ready = null;
  }

  window.Course = {
    unit: UNIT, manifest: M, root: ROOT.href, el: el, init: initAll, applyTheme: applyTheme,
    ready: function (fn) { if (ready) ready.push(fn); else fn(window.Course); }
  };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start); else start();
})();
