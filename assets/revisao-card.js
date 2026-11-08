/* Resumo da "Revisão do dia" para o portal. Sem React; lê curso.srs.v1 e window.DIARIO_REVISAO (opcional).
   Mesmas regras de trilha-rapida/engine/trilha-aprender.js: Diário dos últimos 30 dias, no máximo 3 novos por dia. */
(function () {
  "use strict";
  var MAX_DIA = 3, JANELA = 30;
  function p2(n) { return n < 10 ? "0" + n : "" + n; }
  function str(d) { return d.getFullYear() + "-" + p2(d.getMonth() + 1) + "-" + p2(d.getDate()); }
  function soma(s, n) { var a = s.split("-"); return str(new Date(+a[0], +a[1] - 1, +a[2] + n)); }
  function ler() {
    try {
      var o = JSON.parse(localStorage.getItem("curso.srs.v1") || "null");
      if (o && typeof o === "object" && o.itens && typeof o.itens === "object") return o;
    } catch (e) { /* sem armazenamento */ }
    return { itens: {}, dias: [] };
  }
  function resumo() {
    var srs = ler(), hj = str(new Date());
    var dias = Array.isArray(srs.dias) ? srs.dias : [];
    var diario = Array.isArray(window.DIARIO_REVISAO) ? window.DIARIO_REVISAO : [];
    var noArquivo = {}; diario.forEach(function (d) { if (d && d.id) noArquivo[d.id] = true; });
    var vencidos = 0;
    Object.keys(srs.itens).forEach(function (k) {
      var it = srs.itens[k];
      if (!it || typeof it.prox !== "string" || it.prox > hj) return;
      if (it.aula === "diario" && !noArquivo[it.id]) return;
      vencidos++;
    });
    var jaHoje = srs.diarioMatriculaEm === hj ? (+srs.diarioMatriculaN || 0) : 0, corte = soma(hj, -JANELA);
    var novos = diario.filter(function (d) { return d && d.id && d.data >= corte && d.data <= hj && !srs.itens["diario:" + d.id]; }).length;
    novos = Math.max(0, Math.min(novos, MAX_DIA - jaHoje));
    var set = {}; dias.forEach(function (d) { set[d] = true; });
    var d = hj; if (!set[d]) d = soma(d, -1);
    var seq = 0; while (set[d]) { seq++; d = soma(d, -1); }
    return { n: vencidos + novos, seq: seq };
  }
  window.RevisaoCard = { resumo: resumo };
})();
