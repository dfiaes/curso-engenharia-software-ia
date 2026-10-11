(function () {
  "use strict";

  const manifest = JSON.parse(document.getElementById("course-manifest").textContent);
  const Progress = window.CourseProgress;
  const STORAGE_KEY = "tutor-ia.course-progress.v2";
  const LEGACY_STORAGE_KEY = "tutor-ia.course-progress.v1";
  const MAX_IMPORT_BYTES = 1024 * 1024;
  const unitByCode = new Map(manifest.units.map((unit) => [unit.code, unit]));
  const blockById = new Map(manifest.units.flatMap((unit) => unit.blocks.map((block) => [block.id, { unit, block }])));
  const studyUnits = manifest.units.filter((unit) => unit.blocks.length);
  const flatBlocks = studyUnits.flatMap((unit) => unit.blocks.map((block) => ({ unit, block })));
  const NAMED_VIEWS = new Set(["inicio", "curriculo", "progresso"]);
  const VIEW_ALIASES = { unidades: "curriculo", roteiro: "curriculo" };
  let storageAvailable = true;
  let activeFilter = "all";
  let state = loadState();

  const dom = {
    main: document.getElementById("main-content"),
    sidebar: document.getElementById("course-sidebar"),
    scrim: document.getElementById("sidebar-scrim"),
    menu: document.getElementById("menu-button"),
    search: document.getElementById("course-search"),
    sidebarUnits: document.getElementById("sidebar-units"),
    frame: document.getElementById("course-frame"),
    frameLoading: document.getElementById("frame-loading"),
    outline: document.getElementById("study-outline"),
    message: document.getElementById("progress-message"),
  };

  function escapeHtml(value) {
    return String(value).replace(/[&<>"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[character]);
  }

  function normalize(value) {
    return String(value).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  }

  function loadState() {
    try {
      const probe = "__course_portal_probe__";
      localStorage.setItem(probe, "1");
      localStorage.removeItem(probe);
    } catch (error) {
      storageAvailable = false;
      return Progress.emptyState(manifest.courseVersion);
    }
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return Progress.sanitize(JSON.parse(raw), manifest);
    } catch (error) {
      return Progress.emptyState(manifest.courseVersion);
    }
    try {
      // First visit after the five-phase restructuring: carry over the blocks that still exist.
      const legacy = localStorage.getItem(LEGACY_STORAGE_KEY);
      if (legacy) {
        const migrated = Progress.sanitize(JSON.parse(legacy), manifest);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
        return migrated;
      }
    } catch (error) {
      /* unreadable legacy data: start clean */
    }
    return Progress.emptyState(manifest.courseVersion);
  }

  function saveState() {
    state.updatedAt = new Date().toISOString();
    if (storageAvailable) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      } catch (error) {
        storageAvailable = false;
      }
    }
    renderProgressEverywhere();
  }

  function routeFor(unit, block) {
    return `#/${unit.code}/b${String(block.number).padStart(2, "0")}`;
  }

  function resumeBlock(unit) {
    return unit.blocks.find((block) => state.blocks[block.id] !== "completed") || unit.blocks[0];
  }

  function parseRoute() {
    const parts = location.hash.replace(/^#\/?/, "").split("/").filter(Boolean);
    if (!parts.length) return { view: "inicio" };
    const name = VIEW_ALIASES[parts[0]] || parts[0];
    if (NAMED_VIEWS.has(name)) return { view: name };
    const unit = unitByCode.get(parts[0].toUpperCase());
    if (!unit) return { view: "inicio" };
    if (!unit.blocks.length) return { view: "curriculo", focusUnit: unit.code };
    const number = Number((parts[1] || "").replace(/^b/i, ""));
    const block = unit.blocks.find((item) => item.number === number) || unit.blocks[0];
    return { view: "estudar", unit, block };
  }

  function setView(name) {
    document.querySelectorAll(".portal-view").forEach((view) => { view.hidden = view.dataset.view !== name; });
    document.querySelectorAll("[data-view-link]").forEach((link) => {
      const active = link.dataset.viewLink === name;
      link.classList.toggle("active", active);
      if (active) link.setAttribute("aria-current", "page"); else link.removeAttribute("aria-current");
    });
    dom.main.classList.toggle("study-main", name === "estudar");
  }

  function navigateTo(unit, block) {
    location.hash = routeFor(unit, block);
  }

  function handleRoute() {
    const route = parseRoute();
    setView(route.view);
    closeMobileMenu();
    if (route.view === "estudar") {
      showStudy(route.unit, route.block);
      return;
    }
    renderProgressEverywhere();
    if (route.view === "curriculo") renderCurriculum();
    dom.main.focus({ preventScroll: true });
    if (route.focusUnit) {
      const target = document.getElementById(`unit-${route.focusUnit}`);
      if (target) target.scrollIntoView({ block: "center" });
    }
  }

  function phaseParts(name) {
    const [label, ...rest] = name.split(" · ");
    return { label, title: rest.join(" · ") || name };
  }

  function statusLabel(status) {
    return ({ not_started: "Não iniciado", in_progress: "Em andamento", completed: "Concluído", writing: "Em escrita" })[status];
  }

  function renderSidebar() {
    dom.sidebarUnits.innerHTML = manifest.phases.map((phase) => `
      <p class="sidebar-phase">${escapeHtml(phase.name)}</p>
      ${phase.units.map((code) => {
        const unit = unitByCode.get(code);
        const search = normalize([unit.code, unit.title, unit.keywords.join(" "), ...unit.blocks.map((block) => block.title)].join(" "));
        const disabled = unit.blocks.length ? "" : " disabled";
        return `<button class="sidebar-unit" type="button" data-open-unit="${unit.code}" data-search="${escapeHtml(search)}"${disabled}>
          <span class="sidebar-code">${unit.code}</span>
          <span class="sidebar-title">${escapeHtml(unit.title)}</span>
          <span class="sidebar-count">${unit.blocks.length ? unit.blocks.length : "em escrita"}</span>
        </button>`;
      }).join("")}
    `).join("");
  }

  function unitMatches(unit, query) {
    const status = Progress.unitStatus(unit, state);
    const filterOk = activeFilter === "all"
      || (activeFilter === "not-started" && status === "not_started")
      || (activeFilter === "in-progress" && status === "in_progress")
      || (activeFilter === "completed" && status === "completed")
      || (activeFilter === "writing" && status === "writing");
    if (!filterOk) return false;
    if (!query) return true;
    return normalize([unit.code, unit.title, unit.description, unit.keywords.join(" "), ...unit.blocks.map((block) => block.title)].join(" ")).includes(query);
  }

  function renderUnitCard(unit) {
    const status = Progress.unitStatus(unit, state);
    const counts = Progress.unitCounts(unit, state);
    const prerequisites = unit.prerequisites.length ? unit.prerequisites.join(", ") : "nenhum";
    const action = unit.blocks.length
      ? `<a class="secondary-button" href="${routeFor(unit, resumeBlock(unit))}">${status === "not_started" ? "Abrir módulo" : status === "completed" ? "Revisar módulo" : "Continuar módulo"}</a>`
      : `<span class="writing-badge">Em escrita</span>`;
    const blocks = unit.blocks.length
      ? `<details class="block-details"><summary>Blocos (${unit.blocks.length})</summary><ol class="block-list">${unit.blocks.map((block) => `<li><a href="${routeFor(unit, block)}">${escapeHtml(block.title)}</a>${state.blocks[block.id] === "completed" ? ' <span class="block-done">concluído</span>' : ""}</li>`).join("")}</ol></details>`
      : "";
    return `<article class="unit-card" id="unit-${unit.code}">
      <div class="unit-card-head"><span class="unit-badge">${unit.code}</span><div><h3>${escapeHtml(unit.title)}</h3><p>${escapeHtml(unit.description)}</p></div></div>
      <dl class="unit-facts">
        <div><dt>Carga</dt><dd>${unit.hours} h</dd></div>
        <div><dt>Pré-requisitos</dt><dd>${escapeHtml(prerequisites)}</dd></div>
        <div><dt>Blocos</dt><dd>${unit.blocks.length || "—"}</dd></div>
        <div><dt>Progresso</dt><dd>${unit.blocks.length ? `${counts.done} / ${counts.total}` : "—"}</dd></div>
      </dl>
      ${unit.blocks.length ? `<meter min="0" max="${counts.total}" value="${counts.done}" aria-label="Progresso em ${unit.code}">${counts.done} de ${counts.total}</meter>` : ""}
      <div class="unit-actions">${action}<span class="unit-state">${statusLabel(status)}</span></div>
      ${blocks}
    </article>`;
  }

  function renderCurriculum() {
    const query = normalize(dom.search.value.trim());
    let shown = 0;
    const open = new Set(Array.from(document.querySelectorAll(".block-details[open]")).map((node) => node.closest(".unit-card").id));
    document.getElementById("curriculum-phases").innerHTML = manifest.phases.map((phase) => {
      const units = phase.units.map((code) => unitByCode.get(code)).filter((unit) => unitMatches(unit, query));
      if (!units.length) return "";
      shown += units.length;
      const parts = phaseParts(phase.name);
      const index = manifest.phases.indexOf(phase);
      return `<section class="phase-section" aria-labelledby="phase-title-${index}">
        <header class="phase-head"><p class="eyebrow">${escapeHtml(parts.label)}</p><h2 id="phase-title-${index}">${escapeHtml(parts.title)}</h2><span class="phase-count">${units.length} ${units.length === 1 ? "módulo" : "módulos"}</span></header>
        <div class="unit-grid">${units.map(renderUnitCard).join("")}</div>
      </section>`;
    }).join("");
    document.querySelectorAll(".unit-card").forEach((card) => {
      if (open.has(card.id)) card.querySelector(".block-details")?.setAttribute("open", "");
    });
    document.getElementById("catalog-empty").hidden = shown !== 0;
  }

  function renderHome() {
    const summary = Progress.stats(manifest, state);
    const next = Progress.nextBlock(manifest, state);
    const started = Boolean(state.lastVisited) || summary.completedBlocks > 0 || summary.inProgressBlocks > 0;
    const button = document.getElementById("continue-button");
    if (!next) {
      button.textContent = "Ver o currículo";
      button.onclick = () => { location.hash = "#/curriculo"; };
    } else {
      button.textContent = summary.completedBlocks === summary.totalBlocks
        ? "Revisar o último bloco"
        : started ? `Continuar: ${next.unit.code} · bloco ${next.block.number}` : `Começar por ${next.unit.code}`;
      button.onclick = () => navigateTo(next.unit, next.block);
    }
    const strip = document.getElementById("home-unit-strip");
    if (!next) { strip.innerHTML = ""; return; }
    const pending = studyUnits.filter((unit) => Progress.unitStatus(unit, state) !== "completed");
    const from = Math.max(0, pending.findIndex((unit) => unit.code === next.unit.code));
    strip.innerHTML = pending.slice(from, from + 4).map((unit) => {
      const counts = Progress.unitCounts(unit, state);
      const target = unit.code === next.unit.code ? next.block : resumeBlock(unit);
      return `<a class="mini-unit" href="${routeFor(unit, target)}"><span class="eyebrow">${unit.code} · ${escapeHtml(phaseParts(unit.phase).label)}</span><strong>${escapeHtml(unit.title)}</strong><small>${unit.hours} h · ${counts.done} de ${counts.total} blocos</small></a>`;
    }).join("");
  }

  function renderProgressView() {
    const summary = Progress.stats(manifest, state);
    const percent = `${summary.percent}%`;
    document.getElementById("progress-percent").textContent = percent;
    document.getElementById("progress-dial").style.background = `conic-gradient(var(--teal) ${summary.percent}%, #e3e9f0 ${summary.percent}%)`;
    document.getElementById("wide-progress-bar").style.width = percent;
    document.getElementById("progress-heading").textContent = summary.completedBlocks === 0 && summary.inProgressBlocks === 0
      ? "Você ainda não iniciou o curso."
      : `${summary.completedBlocks} de ${summary.totalBlocks} blocos concluídos.`;
    document.getElementById("progress-description").textContent = `${summary.completedUnits} de ${manifest.availableUnits} módulos disponíveis concluídos. ${manifest.totalUnits - manifest.availableUnits} módulos ainda estão em escrita.`;
    document.getElementById("storage-warning").hidden = storageAvailable;
    document.getElementById("progress-phases").innerHTML = manifest.phases.map((phase) => {
      const parts = phaseParts(phase.name);
      return `<section class="progress-phase" aria-label="${escapeHtml(phase.name)}"><h2>${escapeHtml(parts.label)} · ${escapeHtml(parts.title)}</h2>
        <div class="progress-units">${phase.units.map((code) => {
          const unit = unitByCode.get(code);
          const counts = Progress.unitCounts(unit, state);
          const detail = unit.blocks.length ? `${counts.done} de ${counts.total} blocos · ${statusLabel(Progress.unitStatus(unit, state))}` : "Em escrita";
          return `<article class="progress-unit"><span class="progress-unit-code">${unit.code}</span><div><h3>${escapeHtml(unit.title)}</h3><small>${detail}</small></div>${unit.blocks.length ? `<meter min="0" max="${counts.total}" value="${counts.done}" aria-label="Progresso em ${unit.code}">${counts.done} de ${counts.total}</meter>` : ""}</article>`;
        }).join("")}</div></section>`;
    }).join("");
  }

  function renderProgressEverywhere() {
    const summary = Progress.stats(manifest, state);
    const percent = `${summary.percent}%`;
    document.getElementById("header-progress-label").textContent = `${summary.completedBlocks} de ${summary.totalBlocks} blocos`;
    document.getElementById("header-progress-bar").style.width = percent;
    document.getElementById("home-progress-percent").textContent = percent;
    document.getElementById("home-blocks-done").textContent = `${summary.completedBlocks} / ${summary.totalBlocks}`;
    document.getElementById("home-units-done").textContent = `${summary.completedUnits} / ${manifest.availableUnits}`;
    document.getElementById("home-units-available").textContent = `${manifest.availableUnits} / ${manifest.totalUnits}`;
    const last = state.lastVisited && blockById.get(state.lastVisited.block);
    document.getElementById("home-last").textContent = last ? `${last.unit.code} · bloco ${last.block.number}` : "Ainda não iniciado";
    const route = parseRoute();
    renderHome();
    renderProgressView();
    if (route.view === "curriculo") renderCurriculum();
    updateActiveStatusButtons();
    if (route.view === "estudar") renderOutline(route.unit, route.block);
  }

  function showStudy(unit, block) {
    state.lastVisited = { unit: unit.code, block: block.id };
    saveState();
    document.getElementById("study-code").textContent = unit.code;
    document.getElementById("study-unit-title").textContent = unit.title;
    document.getElementById("study-block-title").textContent = block.title;
    dom.frame.title = `${unit.code} · ${block.title}`;
    document.querySelectorAll(".sidebar-unit").forEach((button) => button.classList.toggle("active", button.dataset.openUnit === unit.code));
    renderOutline(unit, block);
    updateActiveStatusButtons();

    const target = `${block.file}#${encodeURIComponent(block.anchor)}`;
    if (dom.frame.dataset.blockId !== block.id) {
      dom.frameLoading.hidden = false;
      dom.frame.dataset.blockId = block.id;
      dom.frame.src = target;
    }
    const index = flatBlocks.findIndex((item) => item.block.id === block.id);
    document.getElementById("previous-block").disabled = index <= 0;
    document.getElementById("next-block").disabled = index >= flatBlocks.length - 1;
    document.getElementById("previous-block").onclick = () => index > 0 && navigateTo(flatBlocks[index - 1].unit, flatBlocks[index - 1].block);
    document.getElementById("next-block").onclick = () => index < flatBlocks.length - 1 && navigateTo(flatBlocks[index + 1].unit, flatBlocks[index + 1].block);
  }

  function renderOutline(unit, activeBlock) {
    const optional = state.optional[unit.code] || { lab: false, checkpoint: false };
    dom.outline.innerHTML = `<div class="outline-head"><strong>${unit.code} · ${unit.hours} h</strong><small>${unit.blocks.length} blocos · ${escapeHtml(unit.phase)}</small></div>
      ${unit.blocks.map((block) => {
        const status = state.blocks[block.id] || "not_started";
        return `<button class="outline-block${block.id === activeBlock.id ? " active" : ""}" type="button" data-open-block="${block.id}" data-status="${status}"${block.id === activeBlock.id ? ' aria-current="true"' : ""}><span class="outline-state" aria-hidden="true"></span><span>${escapeHtml(block.title)}<span class="visually-hidden"> (${statusLabel(status).toLowerCase()})</span></span></button>`;
      }).join("")}
      <div class="optional-box"><strong>Registro do módulo</strong>
        <label class="optional-check"><input type="checkbox" data-optional="lab" ${optional.lab ? "checked" : ""}> Laboratório realizado</label>
        <label class="optional-check"><input type="checkbox" data-optional="checkpoint" ${optional.checkpoint ? "checked" : ""}> Checkpoint realizado</label>
      </div>`;
  }

  function updateActiveStatusButtons() {
    const route = parseRoute();
    if (route.view !== "estudar") return;
    const status = state.blocks[route.block.id] || "not_started";
    document.querySelectorAll("[data-set-status]").forEach((button) => {
      const active = button.dataset.setStatus === status;
      button.classList.toggle("active", active);
      button.setAttribute("aria-pressed", String(active));
    });
  }

  function setBlockStatus(status) {
    const route = parseRoute();
    if (route.view !== "estudar") return;
    if (status === "not_started") delete state.blocks[route.block.id];
    else state.blocks[route.block.id] = status;
    saveState();
  }

  function openMobileMenu() {
    dom.sidebar.classList.add("open");
    dom.scrim.hidden = false;
    dom.menu.setAttribute("aria-expanded", "true");
  }

  function closeMobileMenu() {
    dom.sidebar.classList.remove("open");
    dom.scrim.hidden = true;
    dom.menu.setAttribute("aria-expanded", "false");
  }

  function exportProgress() {
    const blob = new Blob([Progress.serialize(state)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `progresso-curso-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
    showMessage("Progresso exportado.");
  }

  async function importProgress(file) {
    if (!file) return;
    if (file.size > MAX_IMPORT_BYTES) throw new Error("O arquivo ultrapassa o limite de 1 MB.");
    state = Progress.sanitize(JSON.parse(await file.text()), manifest);
    saveState();
    showMessage("Progresso importado com sucesso.");
  }

  function showMessage(text, isError) {
    dom.message.textContent = text;
    dom.message.style.color = isError ? "var(--danger)" : "var(--teal)";
  }

  function resolveMessageRoute(data) {
    if (!data || data.type !== "course:navigate" || typeof data.unit !== "string") return null;
    const unit = unitByCode.get(data.unit);
    if (!unit) return null;
    if (typeof data.anchor === "string") {
      const block = unit.blocks.find((item) => item.anchor === data.anchor);
      if (block) return { unit, block };
    }
    if (typeof data.href === "string") {
      let url;
      try { url = new URL(data.href, dom.frame.src); } catch (error) { return null; }
      for (const candidate of manifest.units) {
        const block = candidate.blocks.find((item) => decodeURIComponent(url.pathname).endsWith(item.file) && (!url.hash || item.anchor === decodeURIComponent(url.hash.slice(1))));
        if (block) return { unit: candidate, block };
      }
      const byFile = manifest.units.find((candidate) => candidate.blocks.length && decodeURIComponent(url.pathname).endsWith(candidate.file));
      if (byFile) return { unit: byFile, block: byFile.blocks[0] };
    }
    return null;
  }

  document.addEventListener("click", (event) => {
    const unitButton = event.target.closest("[data-open-unit]");
    if (unitButton) { const unit = unitByCode.get(unitButton.dataset.openUnit); if (unit && unit.blocks.length) navigateTo(unit, resumeBlock(unit)); }
    const blockButton = event.target.closest("[data-open-block]");
    if (blockButton) { const found = blockById.get(blockButton.dataset.openBlock); if (found) navigateTo(found.unit, found.block); }
    const statusButton = event.target.closest("[data-set-status]");
    if (statusButton) setBlockStatus(statusButton.dataset.setStatus);
    const filter = event.target.closest("[data-filter]");
    if (filter) {
      activeFilter = filter.dataset.filter;
      document.querySelectorAll("[data-filter]").forEach((item) => {
        item.classList.toggle("active", item === filter);
        item.setAttribute("aria-pressed", String(item === filter));
      });
      renderCurriculum();
    }
  });

  document.addEventListener("change", (event) => {
    const optional = event.target.closest("[data-optional]");
    if (!optional) return;
    const route = parseRoute();
    if (route.view !== "estudar") return;
    state.optional[route.unit.code] = state.optional[route.unit.code] || { lab: false, checkpoint: false };
    state.optional[route.unit.code][optional.dataset.optional] = optional.checked;
    saveState();
  });

  dom.search.addEventListener("input", () => {
    const query = normalize(dom.search.value.trim());
    document.querySelectorAll(".sidebar-unit").forEach((button) => { button.hidden = Boolean(query) && !button.dataset.search.includes(query); });
    if (parseRoute().view !== "curriculo") location.hash = "#/curriculo";
    else renderCurriculum();
  });
  dom.menu.addEventListener("click", () => dom.sidebar.classList.contains("open") ? closeMobileMenu() : openMobileMenu());
  dom.scrim.addEventListener("click", closeMobileMenu);
  document.addEventListener("keydown", (event) => { if (event.key === "Escape" && dom.sidebar.classList.contains("open")) { closeMobileMenu(); dom.menu.focus(); } });
  dom.frame.addEventListener("load", () => { dom.frameLoading.hidden = true; });
  document.getElementById("export-progress").addEventListener("click", exportProgress);
  document.getElementById("import-progress").addEventListener("change", async (event) => {
    try { await importProgress(event.target.files[0]); } catch (error) { showMessage(error instanceof Error ? error.message : "Não foi possível importar o arquivo.", true); }
    event.target.value = "";
  });
  document.getElementById("reset-progress").addEventListener("click", () => {
    if (!confirm("Limpar todo o progresso salvo neste navegador?")) return;
    state = Progress.emptyState(manifest.courseVersion);
    saveState();
    showMessage("Progresso limpo.");
  });
  window.addEventListener("message", (event) => {
    if (event.source !== dom.frame.contentWindow) return;
    const resolved = resolveMessageRoute(event.data);
    if (resolved) navigateTo(resolved.unit, resolved.block);
  });
  window.addEventListener("hashchange", handleRoute);

  renderSidebar();
  renderProgressEverywhere();
  handleRoute();
})();
