(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.CourseProgress = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const SCHEMA_VERSION = 1;
  const STATUSES = new Set(["not_started", "in_progress", "completed"]);
  const LEGACY_ROUTE_STEPS = new Set(Array.from({ length: 9 }, (_, index) => String(index + 1)));

  function emptyState(courseVersion, routeManifest) {
    return {
      schemaVersion: SCHEMA_VERSION,
      courseVersion,
      updatedAt: null,
      lastVisited: null,
      blocks: {},
      optional: {},
      studyRoute: {
        version: routeManifest ? routeManifest.version : "curated-v1",
        completed: {},
        lastVisited: null,
      },
      legacyExternalRoute: {},
    };
  }

  function knownBlockIds(manifest) {
    return new Set(manifest.units.flatMap((unit) => unit.blocks.map((block) => block.id)));
  }

  function sanitize(input, manifest, routeManifest) {
    if (!input || typeof input !== "object" || Array.isArray(input)) throw new Error("O arquivo não contém um objeto de progresso.");
    if (input.schemaVersion !== SCHEMA_VERSION) throw new Error("A versão do arquivo de progresso não é compatível.");
    if (input.courseVersion !== manifest.courseVersion) throw new Error("O arquivo pertence a outra versão do curso.");
    const knownBlocks = knownBlockIds(manifest);
    const knownUnits = new Set(manifest.units.map((unit) => unit.code));
    const state = emptyState(manifest.courseVersion, routeManifest);

    if (input.blocks && (typeof input.blocks !== "object" || Array.isArray(input.blocks))) throw new Error("A lista de blocos é inválida.");
    for (const [id, status] of Object.entries(input.blocks || {})) {
      if (!knownBlocks.has(id)) throw new Error(`Bloco desconhecido no arquivo: ${id}.`);
      if (!STATUSES.has(status)) throw new Error(`Estado inválido para ${id}.`);
      if (status !== "not_started") state.blocks[id] = status;
    }

    if (input.lastVisited !== null && input.lastVisited !== undefined) {
      if (!input.lastVisited || !knownUnits.has(input.lastVisited.unit) || !knownBlocks.has(input.lastVisited.block)) {
        throw new Error("O último ponto visitado é inválido.");
      }
      state.lastVisited = { unit: input.lastVisited.unit, block: input.lastVisited.block };
    }

    if (input.optional && (typeof input.optional !== "object" || Array.isArray(input.optional))) throw new Error("Os recursos opcionais são inválidos.");
    for (const [code, value] of Object.entries(input.optional || {})) {
      if (!knownUnits.has(code) || !value || typeof value !== "object" || Array.isArray(value)) throw new Error(`Recurso opcional inválido: ${code}.`);
      state.optional[code] = { lab: value.lab === true, checkpoint: value.checkpoint === true };
    }
    for (const legacyRoute of [input.legacyExternalRoute, input.externalRoute]) {
      if (legacyRoute === undefined) continue;
      if (!legacyRoute || typeof legacyRoute !== "object" || Array.isArray(legacyRoute)) {
        throw new Error("O progresso do roteiro anterior é inválido.");
      }
      for (const [step, completed] of Object.entries(legacyRoute)) {
        if (!LEGACY_ROUTE_STEPS.has(step)) throw new Error(`Etapa desconhecida no roteiro anterior: ${step}.`);
        if (typeof completed !== "boolean") throw new Error(`Estado inválido para a etapa anterior ${step}.`);
        if (completed) state.legacyExternalRoute[step] = true;
      }
    }

    if (input.studyRoute !== undefined) {
      if (!input.studyRoute || typeof input.studyRoute !== "object" || Array.isArray(input.studyRoute)) {
        throw new Error("O progresso da trilha curada é inválido.");
      }
      const expectedVersion = routeManifest ? routeManifest.version : "curated-v1";
      if (input.studyRoute.version !== expectedVersion) throw new Error("O arquivo pertence a outra versão da trilha.");
      const stages = routeManifest ? routeManifest.stages : [];
      const knownStageIds = new Set(stages.map((stage) => stage.id));
      const completed = input.studyRoute.completed || {};
      if (!completed || typeof completed !== "object" || Array.isArray(completed)) {
        throw new Error("A lista de etapas da trilha é inválida.");
      }
      for (const [stageId, isComplete] of Object.entries(completed)) {
        if (!knownStageIds.has(stageId)) throw new Error(`Etapa desconhecida na trilha: ${stageId}.`);
        if (typeof isComplete !== "boolean") throw new Error(`Estado inválido para a etapa ${stageId}.`);
        if (isComplete) state.studyRoute.completed[stageId] = true;
      }
      if (input.studyRoute.lastVisited !== null && input.studyRoute.lastVisited !== undefined) {
        if (!knownStageIds.has(input.studyRoute.lastVisited)) throw new Error("A última etapa visitada da trilha é inválida.");
        state.studyRoute.lastVisited = input.studyRoute.lastVisited;
      }
    }
    state.updatedAt = typeof input.updatedAt === "string" ? input.updatedAt : null;
    return state;
  }

  function unitStatus(unit, state) {
    const statuses = unit.blocks.map((block) => state.blocks[block.id] || "not_started");
    if (statuses.every((status) => status === "completed")) return "completed";
    if (statuses.some((status) => status !== "not_started")) return "in_progress";
    return "not_started";
  }

  function stats(manifest, state) {
    let completedBlocks = 0;
    let inProgressBlocks = 0;
    let completedUnits = 0;
    for (const unit of manifest.units) {
      for (const block of unit.blocks) {
        const status = state.blocks[block.id] || "not_started";
        if (status === "completed") completedBlocks += 1;
        if (status === "in_progress") inProgressBlocks += 1;
      }
      if (unitStatus(unit, state) === "completed") completedUnits += 1;
    }
    return {
      completedBlocks,
      inProgressBlocks,
      completedUnits,
      percent: Math.round((completedBlocks / manifest.totalBlocks) * 100),
    };
  }

  function studyRouteStats(routeManifest, state) {
    const totalStages = routeManifest.stages.length;
    const completedStages = routeManifest.stages.filter((stage) => state.studyRoute.completed[stage.id] === true).length;
    return {
      completedStages,
      totalStages,
      percent: totalStages ? Math.round((completedStages / totalStages) * 100) : 0,
    };
  }

  function nextStudyStage(routeManifest, state) {
    const lastVisited = routeManifest.stages.find((stage) => stage.id === state.studyRoute.lastVisited);
    if (lastVisited && !state.studyRoute.completed[lastVisited.id]) return lastVisited;
    return routeManifest.stages.find((stage) => !state.studyRoute.completed[stage.id])
      || routeManifest.stages[routeManifest.stages.length - 1];
  }

  function nextBlock(manifest, state) {
    if (state.lastVisited) {
      const unit = manifest.units.find((item) => item.code === state.lastVisited.unit);
      const block = unit && unit.blocks.find((item) => item.id === state.lastVisited.block);
      if (block && (state.blocks[block.id] || "not_started") !== "completed") return { unit, block };
    }
    for (const unit of manifest.units) {
      const block = unit.blocks.find((item) => (state.blocks[item.id] || "not_started") !== "completed");
      if (block) return { unit, block };
    }
    const unit = manifest.units[manifest.units.length - 1];
    return { unit, block: unit.blocks[unit.blocks.length - 1] };
  }

  function serialize(state) {
    return JSON.stringify({ ...state, updatedAt: new Date().toISOString() }, null, 2) + "\n";
  }

  return {
    SCHEMA_VERSION,
    STATUSES,
    LEGACY_ROUTE_STEPS,
    emptyState,
    sanitize,
    unitStatus,
    stats,
    studyRouteStats,
    nextStudyStage,
    nextBlock,
    serialize,
  };
});
