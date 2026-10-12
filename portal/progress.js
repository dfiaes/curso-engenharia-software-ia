(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.CourseProgress = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const SCHEMA_VERSION = 2;
  const LEGACY_SCHEMA_VERSION = 1;
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

  function isPlainObject(value) {
    return Boolean(value) && typeof value === "object" && !Array.isArray(value);
  }

  // Progress saved before the five-phase restructuring (schema 1). Block ids keep the
  // same shape (CODE:bNN), so every block that still exists is carried over; the rest
  // (removed modules, curated route, legacy route) is dropped without failing.
  function migrateLegacy(input, manifest) {
    const knownBlocks = knownBlockIds(manifest);
    const knownUnits = new Set(manifest.units.map((unit) => unit.code));
    const state = emptyState(manifest.courseVersion);
    if (isPlainObject(input.blocks)) {
      for (const [id, status] of Object.entries(input.blocks)) {
        if (knownBlocks.has(id) && STATUSES.has(status) && status !== "not_started") state.blocks[id] = status;
      }
    }
    if (isPlainObject(input.optional)) {
      for (const [code, value] of Object.entries(input.optional)) {
        if (knownUnits.has(code) && isPlainObject(value)) {
          state.optional[code] = { lab: value.lab === true, checkpoint: value.checkpoint === true };
        }
      }
    }
    const last = input.lastVisited;
    if (isPlainObject(last) && knownUnits.has(last.unit) && knownBlocks.has(last.block)) {
      state.lastVisited = { unit: last.unit, block: last.block };
    }
    state.updatedAt = typeof input.updatedAt === "string" ? input.updatedAt : null;
    return state;
  }

  function sanitize(input, manifest) {
    if (!isPlainObject(input)) throw new Error("O arquivo não contém um objeto de progresso.");
    if (input.schemaVersion === LEGACY_SCHEMA_VERSION) return migrateLegacy(input, manifest);
    if (input.schemaVersion !== SCHEMA_VERSION) throw new Error("A versão do arquivo de progresso não é compatível.");
    if (input.courseVersion !== manifest.courseVersion) throw new Error("O arquivo pertence a outra versão do curso.");
    const knownBlocks = knownBlockIds(manifest);
    const knownUnits = new Set(manifest.units.map((unit) => unit.code));
    const state = emptyState(manifest.courseVersion);

    if (input.blocks !== undefined && !isPlainObject(input.blocks)) throw new Error("A lista de blocos é inválida.");
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

    if (input.optional !== undefined && !isPlainObject(input.optional)) throw new Error("Os recursos opcionais são inválidos.");
    for (const [code, value] of Object.entries(input.optional || {})) {
      if (!knownUnits.has(code) || !isPlainObject(value)) throw new Error(`Recurso opcional inválido: ${code}.`);
      state.optional[code] = { lab: value.lab === true, checkpoint: value.checkpoint === true };
    }
    state.updatedAt = typeof input.updatedAt === "string" ? input.updatedAt : null;
    return state;
  }

  function unitStatus(unit, state) {
    if (!unit.blocks.length) return "writing";
    const statuses = unit.blocks.map((block) => state.blocks[block.id] || "not_started");
    if (statuses.every((status) => status === "completed")) return "completed";
    if (statuses.some((status) => status !== "not_started")) return "in_progress";
    return "not_started";
  }

  function unitCounts(unit, state) {
    const done = unit.blocks.filter((block) => state.blocks[block.id] === "completed").length;
    return { done, total: unit.blocks.length, percent: unit.blocks.length ? Math.round((done / unit.blocks.length) * 100) : 0 };
  }

  function stats(manifest, state) {
    let completedBlocks = 0;
    let inProgressBlocks = 0;
    let completedUnits = 0;
    let totalBlocks = 0;
    for (const unit of manifest.units) {
      for (const block of unit.blocks) {
        totalBlocks += 1;
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
      totalBlocks,
      percent: totalBlocks ? Math.round((completedBlocks / totalBlocks) * 100) : 0,
    };
  }

  function nextBlock(manifest, state) {
    const available = manifest.units.filter((unit) => unit.blocks.length);
    if (!available.length) return null;
    if (state.lastVisited) {
      const unit = available.find((item) => item.code === state.lastVisited.unit);
      const block = unit && unit.blocks.find((item) => item.id === state.lastVisited.block);
      if (block && (state.blocks[block.id] || "not_started") !== "completed") return { unit, block };
    }
    for (const unit of available) {
      const block = unit.blocks.find((item) => (state.blocks[item.id] || "not_started") !== "completed");
      if (block) return { unit, block };
    }
    const unit = available[available.length - 1];
    return { unit, block: unit.blocks[unit.blocks.length - 1] };
  }


  // ---- Reset (storage-agnostic: takes anything with the localStorage interface) ----
  const STORAGE_KEY = "tutor-ia.course-progress.v2";
  const THEME_KEY = "curso.theme";
  const COURSE_PREFIXES = ["curso.", "tutor-ia."];

  function storageKeys(storage) {
    const keys = [];
    for (let i = 0; i < storage.length; i += 1) {
      const key = storage.key(i);
      if (typeof key === "string") keys.push(key);
    }
    return keys;
  }

  // Removes every course key (progress, checklists, quiz/order answers) and keeps the theme.
  function resetAll(storage) {
    let removed = 0;
    try {
      for (const key of storageKeys(storage)) {
        if (key === THEME_KEY || !COURSE_PREFIXES.some((p) => key.startsWith(p))) continue;
        storage.removeItem(key);
        removed += 1;
      }
    } catch (e) { /* sem armazenamento */ }
    return removed;
  }

  // Clears one unit: read blocks, optional lab/checkpoint, last visit, and per-unit
  // checklist / quiz / order keys (curso.check.<CODE>-..., curso.quiz.<CODE>-..., curso.order.<CODE>-...).
  function resetUnit(storage, code) {
    let removed = 0;
    try {
      const raw = storage.getItem(STORAGE_KEY);
      if (raw) {
        const state = JSON.parse(raw);
        if (isPlainObject(state)) {
          if (isPlainObject(state.blocks)) {
            for (const id of Object.keys(state.blocks)) if (id.startsWith(code + ":")) { delete state.blocks[id]; removed += 1; }
          }
          if (isPlainObject(state.optional) && state.optional[code]) { delete state.optional[code]; removed += 1; }
          if (state.lastVisited && state.lastVisited.unit === code) state.lastVisited = null;
          state.updatedAt = new Date().toISOString();
          storage.setItem(STORAGE_KEY, JSON.stringify(state));
        }
      }
    } catch (e) { /* progresso ilegível: nada a limpar */ }
    try {
      const prefixes = ["check", "quiz", "order"].map((k) => `curso.${k}.${code}-`);
      for (const key of storageKeys(storage)) {
        if (prefixes.some((p) => key.startsWith(p))) { storage.removeItem(key); removed += 1; }
      }
    } catch (e) { /* sem armazenamento */ }
    return removed;
  }

  function serialize(state) {
    return JSON.stringify({ ...state, updatedAt: new Date().toISOString() }, null, 2) + "\n";
  }

  return {
    SCHEMA_VERSION,
    STATUSES,
    emptyState,
    migrateLegacy,
    sanitize,
    unitStatus,
    unitCounts,
    stats,
    nextBlock,
    serialize,
    resetAll,
    resetUnit,
    STORAGE_KEY,
    THEME_KEY,
  };
});
