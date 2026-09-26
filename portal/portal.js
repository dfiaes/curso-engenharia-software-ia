(function () {
  "use strict";

  const manifestNode = document.getElementById("course-manifest");
  const manifest = JSON.parse(manifestNode.textContent);
  const routeManifestNode = document.getElementById("study-route-manifest");
  const routeManifest = JSON.parse(routeManifestNode.textContent);
  const Progress = window.CourseProgress;
  const STORAGE_KEY = "tutor-ia.course-progress.v1";
  const MAX_IMPORT_BYTES = 1024 * 1024;
  const unitByCode = new Map(manifest.units.map((unit) => [unit.code, unit]));
  const blockById = new Map(manifest.units.flatMap((unit) => unit.blocks.map((block) => [block.id, { unit, block }])));
  const STUDY_ROUTE = routeManifest.stages;
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
      return raw ? Progress.sanitize(JSON.parse(raw), manifest, routeManifest) : Progress.emptyState(manifest.courseVersion, routeManifest);
    } catch (error) {
      storageAvailable = false;
      return Progress.emptyState(manifest.courseVersion, routeManifest);
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
    if (parts[0] === "roteiro") {
      return { view: "roteiro", stage: STUDY_ROUTE.find((stage) => stage.id === parts[1]) || null };
    }
    const namedViews = new Set(["inicio", "curriculo", "roteiro", "unidades", "progresso"]);
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

  function navigateToStudyStage(stage) {
    if (!stage) return;
    state.studyRoute.lastVisited = stage.id;
    saveState();
    location.hash = `#/roteiro/${stage.id}`;
  }

  function handleRoute() {
    const route = parseRoute();
    setView(route.view);
    closeMobileMenu();
    if (route.view === "estudar") showStudy(route.unit, route.block);
    else {
      if (route.view === "roteiro" && route.stage) {
        if (state.studyRoute.lastVisited !== route.stage.id) {
          state.studyRoute.lastVisited = route.stage.id;
          saveState();
        }
        const target = document.getElementById(`route-stage-${route.stage.id}`);
        if (target) target.scrollIntoView({ block: "start" });
      }
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
    const next = Progress.nextStudyStage(routeManifest, state);
    const summary = Progress.studyRouteStats(routeManifest, state);
    const button = document.getElementById("continue-button");
    const nextIndex = routeManifest.stages.findIndex((stage) => stage.id === next.id);
    button.textContent = summary.completedStages === summary.totalStages
      ? "Revisar etapa final"
      : (state.studyRoute.lastVisited || summary.completedStages > 0)
        ? `Continuar: etapa ${nextIndex + 1}`
        : "Começar etapa 1";
    button.onclick = () => navigateToStudyStage(next);
    const visible = routeManifest.stages.slice(nextIndex, nextIndex + 3);
    document.getElementById("home-unit-strip").innerHTML = visible.map((stage) => {
      const index = routeManifest.stages.indexOf(stage) + 1;
      const complete = state.studyRoute.completed[stage.id] === true;
      return `<a class="mini-unit" href="#/roteiro/${stage.id}" data-open-route-stage="${stage.id}"><span class="eyebrow">Etapa ${index} · ${complete ? "Concluída" : stage.id === next.id ? "Próxima" : "A seguir"}</span><strong>${escapeHtml(stage.title)}</strong><small>${escapeHtml(stage.summary)}</small></a>`;
    }).join("");
  }

  function statusLabel(status) {
    return ({ not_started: "Não iniciada", in_progress: "Em andamento", completed: "Concluída" })[status];
  }

  function renderExternalRoute() {
    document.getElementById("external-route-list").innerHTML = routeManifest.stages.map((stage, index) => {
      const completed = state.studyRoute.completed[stage.id] === true;
      const resources = (role) => stage.resources.filter((resource) => resource.role === role).map((resource) => `
        <li><a href="${escapeHtml(resource.url)}" target="_blank" rel="noopener noreferrer" data-open-route-stage="${stage.id}">
          <strong>${escapeHtml(resource.title)}</strong>
          <span>${escapeHtml(resource.organization)} · ${escapeHtml(resource.scope)}</span>
          <small>${resourceTypeLabel(resource.type)}</small>
        </a></li>`).join("");
      const localReferences = stage.localReferences.map((code) => {
        const unit = unitByCode.get(code);
        return unit ? `<a href="${firstRoute(unit)}">${escapeHtml(unit.code)} · ${escapeHtml(unit.title)}</a>` : "";
      }).filter(Boolean).join("");
      return `
        <article class="route-stage${completed ? " completed" : ""}" id="route-stage-${stage.id}" data-route-card="${stage.id}">
          <div class="route-stage-head"><span class="route-stage-number">${String(index + 1).padStart(2, "0")}</span><div><h2><a href="#/roteiro/${stage.id}" data-open-route-stage="${stage.id}">${escapeHtml(stage.title)}</a></h2><p>${escapeHtml(stage.summary)}</p></div></div>
          <p class="route-synthesis">${escapeHtml(stage.synthesis)}</p>
          <h3>Leitura essencial</h3><ul class="route-resources">${resources("essential")}</ul>
          ${stage.resources.some((resource) => resource.role === "deepening") ? `<details class="route-deepening"><summary>Aprofundar (${stage.resources.filter((resource) => resource.role === "deepening").length})</summary><ul class="route-resources">${resources("deepening")}</ul></details>` : ""}
          ${localReferences ? `<p class="route-local-reference"><strong>Acervo local relacionado:</strong> ${localReferences}</p>` : ""}
          <p class="route-outcome"><strong>Consolidação opcional:</strong> ${escapeHtml(stage.outcome)}</p>
          <label class="route-complete"><input type="checkbox" data-route-step="${stage.id}" ${completed ? "checked" : ""}><span>Marcar etapa ${index + 1} como concluída</span></label>
        </article>`;
    }).join("");
    document.getElementById("optional-track-list").innerHTML = routeManifest.optionalTracks.map((track) => {
      const unit = track.unitCode && unitByCode.get(track.unitCode);
      const href = unit ? firstRoute(unit) : track.url;
      return `<article class="optional-track"><h3><a href="${escapeHtml(href)}">${escapeHtml(track.title)}</a></h3><p>${escapeHtml(track.summary)}</p></article>`;
    }).join("");
    document.getElementById("route-curated-at").textContent = routeManifest.curatedAt;
    updateExternalRouteProgress();
  }

  function resourceTypeLabel(type) {
    return ({
      normative: "Especificação / padrão",
      official: "Documentação oficial",
      vendor: "Documentação específica do produto",
      practitioner: "Artigo practitioner · estudo de caso",
      research: "Pesquisa original",
      course: "Curso aberto",
      canonical: "Referência canônica",
    })[type] || "Fonte de referência";
  }

  function updateExternalRouteProgress() {
    const summary = Progress.studyRouteStats(routeManifest, state);
    document.getElementById("route-progress-label").textContent = `${summary.completedStages} de ${summary.totalStages} etapas concluídas`;
    document.getElementById("route-progress-bar").style.width = `${summary.percent}%`;
    const legacyCount = Object.values(state.legacyExternalRoute).filter(Boolean).length;
    const legacyNote = document.getElementById("legacy-route-note");
    if (legacyNote) {
      legacyNote.hidden = legacyCount === 0;
      legacyNote.textContent = legacyCount ? `O progresso do roteiro anterior (${legacyCount} de 9 etapas marcadas) foi mantido como histórico; nenhuma marcação foi transferida para esta trilha.` : "";
    }
    for (const stage of routeManifest.stages) {
      const card = document.querySelector(`[data-route-card="${stage.id}"]`);
      if (!card) continue;
      card.classList.toggle("completed", state.studyRoute.completed[stage.id] === true);
      const checkbox = card.querySelector("[data-route-step]");
      if (checkbox) checkbox.checked = state.studyRoute.completed[stage.id] === true;
    }
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
    const summary = Progress.studyRouteStats(routeManifest, state);
    const percent = `${summary.percent}%`;
    document.getElementById("progress-percent").textContent = percent;
    document.getElementById("progress-dial").style.background = `conic-gradient(var(--teal) ${summary.percent}%, #e3e9f0 ${summary.percent}%)`;
    document.getElementById("wide-progress-bar").style.width = percent;
    document.getElementById("progress-heading").textContent = summary.completedStages === summary.totalStages
      ? "Trilha curada concluída."
      : summary.completedStages
        ? `${summary.completedStages} de ${summary.totalStages} etapas marcadas.`
        : "Você ainda não iniciou a trilha curada.";
    document.getElementById("progress-description").textContent = `${summary.totalStages - summary.completedStages} etapas restantes. O progresso dos 19 módulos locais é exibido separadamente abaixo.`;
    document.getElementById("storage-warning").hidden = storageAvailable;
    const localSummary = Progress.stats(manifest, state);
    document.getElementById("local-progress-label").textContent = `${localSummary.completedBlocks} de ${manifest.totalBlocks} blocos marcados`;
    document.getElementById("progress-units").innerHTML = manifest.units.map((unit) => {
      const done = unit.blocks.filter((block) => state.blocks[block.id] === "completed").length;
      return `<article class="progress-unit"><span class="progress-unit-code">${unit.code}</span><div><h3>${escapeHtml(unit.title)}</h3><small>${done} de ${unit.blocks.length} blocos · ${statusLabel(Progress.unitStatus(unit, state))}</small></div><meter min="0" max="${unit.blocks.length}" value="${done}">${done} de ${unit.blocks.length}</meter></article>`;
    }).join("");
  }

  function renderProgressEverywhere() {
    const summary = Progress.studyRouteStats(routeManifest, state);
    const localSummary = Progress.stats(manifest, state);
    const percent = `${summary.percent}%`;
    document.getElementById("header-progress-label").textContent = `${summary.completedStages} de ${summary.totalStages} etapas`;
    document.getElementById("header-progress-bar").style.width = percent;
    document.getElementById("home-progress-percent").textContent = percent;
    document.getElementById("home-route-done").textContent = `${summary.completedStages} / ${summary.totalStages}`;
    document.getElementById("home-blocks-done").textContent = `${localSummary.completedBlocks} / ${manifest.totalBlocks}`;
    const last = STUDY_ROUTE.find((stage) => stage.id === state.studyRoute.lastVisited);
    document.getElementById("home-route-last").textContent = last ? last.title : "Ainda não iniciada";
    renderHome();
    renderProgressView();
    updateExternalRouteProgress();
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
    const imported = Progress.sanitize(parsed, manifest, routeManifest);
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
    const routeStageLink = event.target.closest("[data-open-route-stage]");
    if (routeStageLink) {
      const stage = STUDY_ROUTE.find((item) => item.id === routeStageLink.dataset.openRouteStage);
      if (stage && state.studyRoute.lastVisited !== stage.id) {
        state.studyRoute.lastVisited = stage.id;
        saveState();
      }
    }
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
    const routeStep = event.target.closest("[data-route-step]");
    if (routeStep) {
      const stageId = routeStep.dataset.routeStep;
      state.studyRoute.lastVisited = stageId;
      state.studyRoute.completed[stageId] = routeStep.checked;
      if (!routeStep.checked) delete state.studyRoute.completed[stageId];
      saveState();
      return;
    }
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
    if (!confirm("Limpar o progresso da trilha curada, do acervo local e do roteiro antigo neste navegador?")) return;
    state = Progress.emptyState(manifest.courseVersion, routeManifest);
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
  renderExternalRoute();
  renderCurriculum();
  renderCatalog();
  renderProgressEverywhere();
  handleRoute();
})();
