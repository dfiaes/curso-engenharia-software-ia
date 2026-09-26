(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.CourseProgress = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const SCHEMA_VERSION = 1;
  const STATUSES = new Set(["not_started", "in_progress", "completed"]);

  function emptyState(courseVersion) {
    return {
      schemaVersion: SCHEMA_VERSION,
      courseVersion,
      updatedAt: null,
      lastVisited: null,
      blocks: {},
      optional: {},
    };
  }

  function knownBlockIds(manifest) {
    return new Set(manifest.units.flatMap((unit) => unit.blocks.map((block) => block.id)));
  }

  function sanitize(input, manifest) {
    if (!input || typeof input !== "object" || Array.isArray(input)) throw new Error("O arquivo não contém um objeto de progresso.");
    if (input.schemaVersion !== SCHEMA_VERSION) throw new Error("A versão do arquivo de progresso não é compatível.");
    if (input.courseVersion !== manifest.courseVersion) throw new Error("O arquivo pertence a outra versão do curso.");
    const knownBlocks = knownBlockIds(manifest);
    const knownUnits = new Set(manifest.units.map((unit) => unit.code));
    const state = emptyState(manifest.courseVersion);

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

  return { SCHEMA_VERSION, STATUSES, emptyState, sanitize, unitStatus, stats, nextBlock, serialize };
});
