(function () {
  "use strict";

  const manifestNode = document.getElementById("course-manifest");
  const manifest = JSON.parse(manifestNode.textContent);
  const Progress = window.CourseProgress;
  const STORAGE_KEY = "tutor-ia.course-progress.v1";
  const MAX_IMPORT_BYTES = 1024 * 1024;
  const unitByCode = new Map(manifest.units.map((unit) => [unit.code, unit]));
  const blockById = new Map(manifest.units.flatMap((unit) => unit.blocks.map((block) => [block.id, { unit, block }])));
  let storageAvailable = true;
  let activeFilter = "all";
  let state = loadState();

  const dom = {
    shell: document.getElementById("app-shell"),
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
    return String(value).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  }

  function loadState() {
    try {
      const probe = "__course_portal_probe__";
      localStorage.setItem(probe, "1");
      localStorage.removeItem(probe);
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? Progress.sanitize(JSON.parse(raw), manifest) : Progress.emptyState(manifest.courseVersion);
    } catch (error) {
      storageAvailable = false;
      return Progress.emptyState(manifest.courseVersion);
    }
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

  function firstRoute(unit) {
    return routeFor(unit, unit.blocks[0]);
  }

  function parseRoute() {
    const parts = location.hash.replace(/^#\/?/, "").split("/").filter(Boolean);
    if (!parts.length) return { view: "inicio" };
    const namedViews = new Set(["inicio", "curriculo", "unidades", "progresso"]);
    if (namedViews.has(parts[0])) return { view: parts[0] };
    const unit = unitByCode.get(parts[0].toUpperCase());
    if (!unit) return { view: "inicio" };
    const number = Number((parts[1] || "").replace(/^b/i, ""));
    const block = unit.blocks.find((item) => item.number === number) || unit.blocks[0];
    return { view: "estudar", unit, block };
  }

  function setView(name) {
    document.querySelectorAll(".portal-view").forEach((view) => { view.hidden = view.dataset.view !== name; });
    document.querySelectorAll("[data-view-link]").forEach((link) => link.classList.toggle("active", link.dataset.viewLink === name));
    dom.main.classList.toggle("study-main", name === "estudar");
  }

  function navigateTo(unit, block) {
    location.hash = routeFor(unit, block);
  }

  function handleRoute() {
    const route = parseRoute();
    setView(route.view);
    closeMobileMenu();
    if (route.view === "estudar") showStudy(route.unit, route.block);
    else {
      renderProgressEverywhere();
      if (route.view === "unidades") renderCatalog();
      dom.main.focus({ preventScroll: true });
    }
  }

  function groupByPhase() {
    const phases = [];
    for (const unit of manifest.units) {
      let phase = phases.find((item) => item.name === unit.phase);
      if (!phase) { phase = { name: unit.phase, units: [] }; phases.push(phase); }
      phase.units.push(unit);
    }
    return phases;
  }

  function renderSidebar() {
    dom.sidebarUnits.innerHTML = groupByPhase().map((phase) => `
      <p class="sidebar-phase">${escapeHtml(phase.name)}</p>
      ${phase.units.map((unit) => `
        <button class="sidebar-unit" type="button" data-open-unit="${unit.code}" data-search="${escapeHtml(normalize([unit.code, unit.title, unit.keywords.join(" ")].join(" ")))}">
          <span class="sidebar-code">${unit.code}</span>
          <span class="sidebar-title">${escapeHtml(unit.title)}</span>
          <span class="sidebar-count">${unit.blocks.length}</span>
        </button>`).join("")}
    `).join("");
  }

  function renderCurriculum() {
    document.getElementById("curriculum-phases").innerHTML = groupByPhase().map((phase, index) => `
      <article class="phase-card">
        <div class="phase-label"><span>Etapa ${index + 1}</span><h2>${escapeHtml(phase.name)}</h2></div>
        <div class="phase-units">
          ${phase.units.map((unit) => `<a class="phase-unit" href="${firstRoute(unit)}"><b>${unit.code}</b><span>${escapeHtml(unit.title)}<small>${unit.blocks.length} blocos${unit.prerequisites.length ? ` · após ${unit.prerequisites.join(", ")}` : " · ponto de entrada"}</small></span></a>`).join("")}
        </div>
      </article>`).join("");
  }

  function renderHome() {
    const next = Progress.nextBlock(manifest, state);
    const button = document.getElementById("continue-button");
    button.textContent = state.lastVisited ? `Continuar em ${next.unit.code}` : "Começar pelo M00";
    button.onclick = () => navigateTo(next.unit, next.block);
    const startIndex = Math.max(0, manifest.units.indexOf(next.unit));
    const visible = [...manifest.units.slice(startIndex, startIndex + 4), ...manifest.units.slice(0, Math.max(0, 4 - (manifest.units.length - startIndex)))].slice(0, 4);
    document.getElementById("home-unit-strip").innerHTML = visible.map((unit) => {
      const status = Progress.unitStatus(unit, state);
      const done = unit.blocks.filter((block) => state.blocks[block.id] === "completed").length;
      return `<a class="mini-unit" href="${firstRoute(unit)}"><span class="eyebrow">${unit.code} · ${statusLabel(status)}</span><strong>${escapeHtml(unit.title)}</strong><small>${done} de ${unit.blocks.length} blocos concluídos</small></a>`;
    }).join("");
  }

  function statusLabel(status) {
    return ({ not_started: "Não iniciada", in_progress: "Em andamento", completed: "Concluída" })[status];
  }

  function renderCatalog() {
    const query = normalize(dom.search.value.trim());
    const catalog = document.getElementById("unit-catalog");
    const filtered = manifest.units.filter((unit) => {
      const status = Progress.unitStatus(unit, state);
      const haystack = normalize([unit.code, unit.title, unit.description, unit.keywords.join(" "), ...unit.blocks.map((block) => block.title)].join(" "));
      return (activeFilter === "all" || status === activeFilter) && (!query || haystack.includes(query));
    });
    catalog.innerHTML = filtered.map((unit) => {
      const status = Progress.unitStatus(unit, state);
      const done = unit.blocks.filter((block) => state.blocks[block.id] === "completed").length;
      return `<details class="unit-card">
        <summary><div class="unit-card-head"><span class="unit-badge">${unit.code}</span><div><h2>${escapeHtml(unit.title)}</h2><p>${escapeHtml(unit.description)}</p></div><span class="unit-card-meta">${statusLabel(status)}<br>${done}/${unit.blocks.length}</span></div></summary>
        <ol class="block-list">${unit.blocks.map((block) => `<li><a href="${routeFor(unit, block)}">${escapeHtml(block.title)}</a></li>`).join("")}</ol>
      </details>`;
    }).join("");
    document.getElementById("catalog-empty").hidden = filtered.length !== 0;
  }

  function renderProgressView() {
    const summary = Progress.stats(manifest, state);
    const percent = `${summary.percent}%`;
    document.getElementById("progress-percent").textContent = percent;
    document.getElementById("progress-dial").style.background = `conic-gradient(var(--teal) ${summary.percent}%, #e3e9f0 ${summary.percent}%)`;
    document.getElementById("wide-progress-bar").style.width = percent;
    document.getElementById("progress-heading").textContent = summary.completedBlocks === manifest.totalBlocks ? "Prévia concluída." : summary.completedBlocks ? `${summary.completedBlocks} blocos concluídos.` : "Você ainda não iniciou o percurso.";
    document.getElementById("progress-description").textContent = summary.completedBlocks === manifest.totalBlocks ? "Os laboratórios e checkpoints continuam disponíveis como aprofundamento opcional." : `${manifest.totalBlocks - summary.completedBlocks} blocos de leitura restantes; laboratórios e checkpoints não entram nessa conta.`;
    document.getElementById("storage-warning").hidden = storageAvailable;
    document.getElementById("progress-units").innerHTML = manifest.units.map((unit) => {
      const done = unit.blocks.filter((block) => state.blocks[block.id] === "completed").length;
      return `<article class="progress-unit"><span class="progress-unit-code">${unit.code}</span><div><h3>${escapeHtml(unit.title)}</h3><small>${done} de ${unit.blocks.length} blocos · ${statusLabel(Progress.unitStatus(unit, state))}</small></div><meter min="0" max="${unit.blocks.length}" value="${done}">${done} de ${unit.blocks.length}</meter></article>`;
    }).join("");
  }

  function renderProgressEverywhere() {
    const summary = Progress.stats(manifest, state);
    const percent = `${summary.percent}%`;
    document.getElementById("header-progress-label").textContent = `${summary.completedBlocks} de ${manifest.totalBlocks}`;
    document.getElementById("header-progress-bar").style.width = percent;
    document.getElementById("home-progress-percent").textContent = percent;
    document.getElementById("home-blocks-done").textContent = `${summary.completedBlocks} / ${manifest.totalBlocks}`;
    document.getElementById("home-units-done").textContent = `${summary.completedUnits} / ${manifest.totalUnits}`;
    document.getElementById("home-in-progress").textContent = String(summary.inProgressBlocks);
    const last = state.lastVisited && blockById.get(state.lastVisited.block);
    document.getElementById("home-last-visited").textContent = last ? `${last.unit.code} · bloco ${last.block.number}` : "Ainda não iniciada";
    renderHome();
    renderProgressView();
    updateActiveStatusButtons();
    if (parseRoute().view === "estudar") renderOutline(parseRoute().unit, parseRoute().block);
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
    const flat = manifest.units.flatMap((item) => item.blocks.map((candidate) => ({ unit: item, block: candidate })));
    const index = flat.findIndex((item) => item.block.id === block.id);
    document.getElementById("previous-block").disabled = index <= 0;
    document.getElementById("next-block").disabled = index >= flat.length - 1;
    document.getElementById("previous-block").onclick = () => index > 0 && navigateTo(flat[index - 1].unit, flat[index - 1].block);
    document.getElementById("next-block").onclick = () => index < flat.length - 1 && navigateTo(flat[index + 1].unit, flat[index + 1].block);
  }

  function renderOutline(unit, activeBlock) {
    const optional = state.optional[unit.code] || { lab: false, checkpoint: false };
    dom.outline.innerHTML = `<div class="outline-head"><strong>${unit.code}</strong><small>${unit.blocks.length} blocos · ${unit.phase}</small></div>
      ${unit.blocks.map((block) => {
        const status = state.blocks[block.id] || "not_started";
        return `<button class="outline-block${block.id === activeBlock.id ? " active" : ""}" type="button" data-open-block="${block.id}" data-status="${status}"><span class="outline-state" aria-hidden="true"></span><span>${escapeHtml(block.title)}</span></button>`;
      }).join("")}
      <div class="optional-box"><strong>Recursos opcionais</strong>
        <label class="optional-check"><input type="checkbox" data-optional="lab" ${optional.lab ? "checked" : ""}> Laboratório realizado</label>
        <label class="optional-check"><input type="checkbox" data-optional="checkpoint" ${optional.checkpoint ? "checked" : ""}> Checkpoint realizado</label>
      </div>`;
  }

  function updateActiveStatusButtons() {
    const route = parseRoute();
    if (route.view !== "estudar") return;
    const status = state.blocks[route.block.id] || "not_started";
    document.querySelectorAll("[data-set-status]").forEach((button) => button.classList.toggle("active", button.dataset.setStatus === status));
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
    const parsed = JSON.parse(await file.text());
    const imported = Progress.sanitize(parsed, manifest);
    state = imported;
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
    }
    return null;
  }

  document.addEventListener("click", (event) => {
    const unitButton = event.target.closest("[data-open-unit]");
    if (unitButton) { const unit = unitByCode.get(unitButton.dataset.openUnit); navigateTo(unit, unit.blocks[0]); }
    const blockButton = event.target.closest("[data-open-block]");
    if (blockButton) { const found = blockById.get(blockButton.dataset.openBlock); navigateTo(found.unit, found.block); }
    const statusButton = event.target.closest("[data-set-status]");
    if (statusButton) setBlockStatus(statusButton.dataset.setStatus);
    const filter = event.target.closest("[data-filter]");
    if (filter) {
      activeFilter = filter.dataset.filter;
      document.querySelectorAll("[data-filter]").forEach((item) => item.classList.toggle("active", item === filter));
      renderCatalog();
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
    if (parseRoute().view !== "unidades") location.hash = "#/unidades";
    renderCatalog();
  });
  dom.menu.addEventListener("click", () => dom.sidebar.classList.contains("open") ? closeMobileMenu() : openMobileMenu());
  dom.scrim.addEventListener("click", closeMobileMenu);
  dom.frame.addEventListener("load", () => { dom.frameLoading.hidden = true; });
  document.getElementById("export-progress").addEventListener("click", exportProgress);
  document.getElementById("import-progress").addEventListener("change", async (event) => {
    try { await importProgress(event.target.files[0]); } catch (error) { showMessage(error instanceof Error ? error.message : "Não foi possível importar o arquivo.", true); }
    event.target.value = "";
  });
  document.getElementById("reset-progress").addEventListener("click", () => {
    if (!confirm("Limpar todo o progresso desta prévia neste navegador?")) return;
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
  renderCurriculum();
  renderCatalog();
  renderProgressEverywhere();
  handleRoute();
})();
