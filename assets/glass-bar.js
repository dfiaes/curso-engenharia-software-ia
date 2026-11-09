/* Barra de vidro flutuante: encolhe ao rolar para baixo, volta ao rolar para cima e acompanha o ponteiro com um reflexo.
   Vale para as barras de topo das páginas em texto (.c-top, .p-top, .dr-top, .top). O visual está em course.css / diario.css. */
(function () {
  "use strict";
  if (window.__glassBar) return;
  window.__glassBar = true;
  var SEL = ".c-top,.p-top,.dr-top,.top";
  function mq(q) { try { return window.matchMedia(q).matches; } catch (e) { return false; } }

  var last = window.pageYOffset || 0, busy = false;
  function set(on) {
    var bars = document.querySelectorAll(SEL);
    for (var i = 0; i < bars.length; i++) bars[i].classList.toggle("is-collapsed", on);
  }
  window.addEventListener("scroll", function () {
    if (busy) return;
    busy = true;
    requestAnimationFrame(function () {
      var y = window.pageYOffset, d = y - last;
      if (y < 80) set(false); else if (d > 6) set(true); else if (d < -6) set(false);
      last = y; busy = false;
    });
  }, { passive: true });

  /* reflexo que segue o ponteiro (desligado com "reduzir movimento") */
  var raf = 0;
  document.addEventListener("pointermove", function (e) {
    if (raf || !e.target || !e.target.closest || mq("(prefers-reduced-motion: reduce)")) return;
    var bar = e.target.closest(SEL);
    if (!bar) return;
    raf = requestAnimationFrame(function () {
      raf = 0;
      var r = bar.getBoundingClientRect();
      bar.style.setProperty("--lg-x", ((e.clientX - r.left) / r.width * 100).toFixed(1) + "%");
      bar.style.setProperty("--lg-y", ((e.clientY - r.top) / r.height * 100).toFixed(1) + "%");
    });
  }, { passive: true });
})();
