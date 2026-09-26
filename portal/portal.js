(function () {
  "use strict";

  const manifestNode = document.getElementById("course-manifest");
  const manifest = JSON.parse(manifestNode.textContent);
  const Progress = window.CourseProgress;
  const STORAGE_KEY = "tutor-ia.course-progress.v1";
  const MAX_IMPORT_BYTES = 1024 * 1024;
  const unitByCode = new Map(manifest.units.map((unit) => [unit.code, unit]));
  const blockById = new Map(manifest.units.flatMap((unit) => unit.blocks.map((block) => [block.id, { unit, block }])));
  const EXTERNAL_ROUTE = [
    { id: "1", title: "Python e primeiros testes", summary: "Fundamentos para ler, escrever e testar programas.", outcome: "Um programa pequeno que lê um arquivo, valida entradas e testa um caso normal e uma falha.", resources: [["CS50P · Harvard", "https://cs50.harvard.edu/python/"], ["Tutorial oficial de Python", "https://docs.python.org/3/tutorial/"], ["pytest · primeiros testes", "https://docs.pytest.org/en/stable/getting-started.html"]] },
    { id: "2", title: "Git e engenharia de software", summary: "Versionamento e práticas para manter software ao longo do tempo.", outcome: "Descreva uma decisão técnica e faça uma mudança pequena com diff e teste legíveis.", resources: [["Pro Git · capítulos 1–3", "https://git-scm.com/book/en/v2"], ["Software Engineering at Google", "https://abseil.io/resources/swe-book/html/toc.html"], ["pytest · primeiros testes", "https://docs.pytest.org/en/stable/getting-started.html"]] },
    { id: "3", title: "HTTP, APIs e banco relacional", summary: "Como a Web funciona, como descrever contratos e persistir dados.", outcome: "Modele duas entidades relacionadas e descreva endpoints e erros esperados.", resources: [["Como a Web funciona · MDN", "https://developer.mozilla.org/en-US/docs/Learn_web_development/Getting_started/Web_standards/How_the_web_works"], ["Visão geral de HTTP · MDN", "https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Overview"], ["Aprenda OpenAPI", "https://learn.openapis.org/"], ["Tutorial do PostgreSQL", "https://www.postgresql.org/docs/current/tutorial.html"]] },
    { id: "4", title: "Serviço Python e entrega", summary: "Construa uma API local; container e CI são extensões, não bloqueios.", outcome: "Execute uma API testável localmente; não é necessário publicar em nuvem.", resources: [["Tutorial do FastAPI", "https://fastapi.tiangolo.com/tutorial/"], ["Docker Get Started", "https://docs.docker.com/get-started/"], ["GitHub Actions · quickstart", "https://docs.github.com/en/actions/get-started/quickstart"]] },
    { id: "5", title: "Aplicações com modelos de linguagem", summary: "Prompts, chamadas de ferramentas e escolha entre fluxo simples e agente.", outcome: "Desenhe o fluxo, permissões e validação; justifique quando uma chamada direta basta.", resources: [["Prompt engineering · OpenAI", "https://developers.openai.com/api/docs/guides/prompt-engineering"], ["Prompt engineering · Anthropic", "https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/overview"], ["Building effective agents · Anthropic", "https://www.anthropic.com/engineering/building-effective-agents"], ["Using tools · OpenAI", "https://developers.openai.com/api/docs/guides/tools"]] },
    { id: "6", title: "Avaliação e RAG", summary: "Avalie respostas com critérios e entenda o papel da recuperação de fontes.", outcome: "Monte perguntas com respostas e fontes esperadas; localize falhas de busca, evidência ou resposta.", resources: [["Demystifying evals · Anthropic", "https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents"], ["Artigo original de RAG · NeurIPS", "https://arxiv.org/abs/2005.11401"], ["Contextual Retrieval · Anthropic", "https://www.anthropic.com/engineering/contextual-retrieval"]] },
    { id: "7", title: "Contexto, agentes e protocolos", summary: "Organize contexto e exponha ferramentas por contratos interoperáveis.", outcome: "Exponha uma operação local de baixo risco com entrada, saída, erros e permissões documentados.", resources: [["Effective context engineering · Anthropic", "https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents"], ["MCP Python SDK · Get started", "https://py.sdk.modelcontextprotocol.io/get-started/"], ["Especificação MCP", "https://modelcontextprotocol.io/specification/2026-07-28"], ["A2A · leitura complementar", "https://a2a-protocol.org/en/docs"]] },
    { id: "8", title: "Observabilidade, segurança e operação", summary: "Entenda sinais operacionais, incidentes e riscos específicos de aplicações com IA.", outcome: "Documente um cenário de falha, como detectá-lo, recuperar-se e limitar seu impacto.", resources: [["OpenTelemetry · Python", "https://opentelemetry.io/docs/languages/python/getting-started/"], ["Google SRE · livro", "https://sre.google/sre-book/table-of-contents/"], ["OWASP GenAI Top 10 2026", "https://genai.owasp.org/resource/owasp-genai-llm-top-10/"]] },
    { id: "9", title: "Projeto integrado · Cartógrafo local", summary: "Una API, documentos autorizados, recuperação de fontes, testes e operação.", outcome: "Entregue contrato, serviço testado, perguntas de avaliação, trace/falha e instruções locais.", resources: [["Enunciado do Capstone local", "docs/projeto-final.md"]] },
  ];
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

  function renderExternalRoute() {
    document.getElementById("external-route-list").innerHTML = EXTERNAL_ROUTE.map((step) => `
      <article class="route-stage${state.externalRoute[step.id] ? " completed" : ""}" data-route-card="${step.id}">
        <div class="route-stage-head"><span class="route-stage-number">${step.id.padStart(2, "0")}</span><div><h2>${escapeHtml(step.title)}</h2><p>${escapeHtml(step.summary)}</p></div></div>
        <p class="route-outcome"><strong>Para consolidar:</strong> ${escapeHtml(step.outcome)}</p>
        <ul class="route-resources">${step.resources.map(([label, href]) => `<li><a href="${escapeHtml(href)}" target="_blank" rel="noopener">${escapeHtml(label)} ↗</a></li>`).join("")}</ul>
        <label class="route-complete"><input type="checkbox" data-route-step="${step.id}" ${state.externalRoute[step.id] ? "checked" : ""}><span>Marcar etapa ${step.id} como concluída</span></label>
      </article>`).join("");
    updateExternalRouteProgress();
  }

  function updateExternalRouteProgress() {
    const completed = EXTERNAL_ROUTE.filter((step) => state.externalRoute[step.id] === true).length;
    document.getElementById("route-progress-label").textContent = `${completed} de ${EXTERNAL_ROUTE.length} etapas concluídas`;
    document.getElementById("route-progress-bar").style.width = `${Math.round((completed / EXTERNAL_ROUTE.length) * 100)}%`;
    for (const step of EXTERNAL_ROUTE) {
      const card = document.querySelector(`[data-route-card="${step.id}"]`);
      if (!card) continue;
      card.classList.toggle("completed", state.externalRoute[step.id] === true);
      const checkbox = card.querySelector("[data-route-step]");
      if (checkbox) checkbox.checked = state.externalRoute[step.id] === true;
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
    const routeStep = event.target.closest("[data-route-step]");
    if (routeStep) {
      state.externalRoute[routeStep.dataset.routeStep] = routeStep.checked;
      if (!routeStep.checked) delete state.externalRoute[routeStep.dataset.routeStep];
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
    if (!confirm("Limpar o progresso dos blocos e do roteiro externo neste navegador?")) return;
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
  renderExternalRoute();
  renderCurriculum();
  renderCatalog();
  renderProgressEverywhere();
  handleRoute();
})();
