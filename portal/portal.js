(function () {
  "use strict";
  const KEY = "tutor-ia.course-progress.v2";
  const MAX = 1024 * 1024;
  const M = window.COURSE_MANIFEST;
  const P = window.CourseProgress;
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  let state = P.emptyState(M.courseVersion);

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) state = P.sanitize(JSON.parse(raw), M);
    } catch (e) { state = P.emptyState(M.courseVersion); }
  }
  function save() { try { localStorage.setItem(KEY, P.serialize(state)); } catch (e) { /* sem armazenamento */ } }
  function say(text, bad) { const m = $("msg"); m.textContent = text; m.style.color = bad ? "var(--bad)" : "var(--ok)"; }

  function card(href, code, title, desc, extra, hl) {
    return `<li><a class="p-card${hl ? " p-hl" : ""}" href="${esc(href)}"><span class="p-code">${esc(code)}</span><h3>${esc(title)}</h3><p>${esc(desc)}</p>${extra || ""}</a></li>`;
  }

  function featured() {
    const next = P.nextBlock(M, state);
    const started = Object.keys(state.blocks).length > 0 || state.lastVisited;
    const cont = next
      ? card(`${next.block.file || next.unit.file}#${next.block.anchor}`, started ? "Continuar" : "Começar", started ? "Continuar de onde parei" : "Começar o curso",
          `${next.unit.code} · ${next.block.title}`, "", true)
      : card("#phases", "Em breve", "Continuar de onde parei", "Os módulos estão em escrita.", "", true);
    $("featured").innerHTML = cont
      + card("trilha-rapida/TR.html", "Trilha rápida", "Trilha rápida: desenvolvimento com agentes", "Caminho curto para trabalhar com agentes de código antes de percorrer o currículo completo.")
      + card("docs/nivelamento.md", "Nivelamento", "Nivelamento", "Descubra por onde começar de acordo com a sua experiência.")
      + card("kit/README.md", "Kit", "Kit de arranque", "Ambiente, modelos e arquivos iniciais para acompanhar os laboratórios.");
  }

  function unitCard(u) {
    const c = P.unitCounts(u, state);
    const st = P.unitStatus(u, state);
    const label = st === "writing" ? "Em escrita" : `${c.done} de ${c.total} blocos`;
    const pre = u.prerequisites.length ? u.prerequisites.join(", ") : "nenhum";
    return `<li data-search="${esc([u.code, u.title, u.description, u.phase, ...(u.keywords || [])].join(" ").toLowerCase())}">
      <a class="p-card" href="${esc(u.file)}"><span class="p-code">${esc(u.code)}</span><h3>${esc(u.title)}</h3><p>${esc(u.description)}</p>
      <span class="p-small">≈ ${u.hours} h · pré-requisitos: ${esc(pre)}</span>
      <span class="p-bar" role="progressbar" aria-label="Progresso de ${esc(u.code)}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${c.percent}"><span style="width:${c.percent}%"></span></span>
      <span class="p-small">${label}</span></a></li>`;
  }

  function phases() {
    $("phases").innerHTML = M.phases.map((ph, i) => {
      const units = ph.units.map((code) => M.units.find((u) => u.code === code));
      return `<section class="p-phase" aria-labelledby="ph${i}"><h3 id="ph${i}">${esc(ph.name)}</h3><ul class="p-grid">${units.map(unitCard).join("")}</ul></section>`;
    }).join("");
    applyFilter();
  }

  function applyFilter() {
    const q = $("q").value.trim().toLowerCase();
    let shown = 0;
    document.querySelectorAll(".p-phase").forEach((sec) => {
      let n = 0;
      sec.querySelectorAll("li[data-search]").forEach((li) => {
        const ok = !q || li.dataset.search.includes(q);
        li.hidden = !ok; if (ok) n += 1;
      });
      sec.hidden = n === 0; shown += n;
    });
    $("empty").hidden = shown !== 0;
  }

  function exportProgress() {
    const url = URL.createObjectURL(new Blob([P.serialize(state)], { type: "application/json" }));
    const a = document.createElement("a");
    a.href = url; a.download = `progresso-curso-${new Date().toISOString().slice(0, 10)}.json`; a.click();
    URL.revokeObjectURL(url);
    say("Progresso exportado.");
  }
  async function importProgress(file) {
    if (!file) return;
    if (file.size > MAX) throw new Error("O arquivo ultrapassa o limite de 1 MB.");
    state = P.sanitize(JSON.parse(await file.text()), M);
    save(); featured(); phases();
    say("Progresso importado com sucesso.");
  }

  const total = M.units.length;
  $("hero-sub").textContent = `${total} módulos em cinco fases, cerca de ${M.totalHours} horas de estudo. Cada módulo abre com um diagnóstico rápido: acertou tudo, vá direto ao checkpoint.`;
  load(); featured(); phases();
  $("q").addEventListener("input", applyFilter);
  $("export").addEventListener("click", exportProgress);
  $("import").addEventListener("change", async (e) => {
    try { await importProgress(e.target.files[0]); } catch (err) { say(err instanceof Error ? err.message : "Não foi possível importar.", true); }
    e.target.value = "";
  });
  window.addEventListener("pageshow", () => { load(); featured(); phases(); });
})();
