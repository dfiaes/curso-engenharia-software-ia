"use strict";

const assert = require("node:assert/strict");
const Progress = require("../portal/progress.js");

const manifest = {
  courseVersion: "fases-v2",
  units: [
    { code: "F01", blocks: [{ id: "F01:b01" }, { id: "F01:b02" }] },
    { code: "F02", blocks: [] },
    { code: "M00", blocks: [{ id: "M00:b01" }] },
  ],
};

const empty = Progress.emptyState(manifest.courseVersion);
assert.equal(empty.schemaVersion, 2);
assert.deepEqual(Progress.stats(manifest, empty), { completedBlocks: 0, inProgressBlocks: 0, completedUnits: 0, totalBlocks: 3, percent: 0 });
assert.equal(Progress.unitStatus(manifest.units[0], empty), "not_started");
assert.equal(Progress.unitStatus(manifest.units[1], empty), "writing");
assert.equal(Progress.nextBlock(manifest, empty).block.id, "F01:b01");

const partial = { ...empty, blocks: { "F01:b01": "completed", "F01:b02": "in_progress" } };
assert.deepEqual(Progress.stats(manifest, partial), { completedBlocks: 1, inProgressBlocks: 1, completedUnits: 0, totalBlocks: 3, percent: 33 });
assert.equal(Progress.unitStatus(manifest.units[0], partial), "in_progress");
assert.deepEqual(Progress.unitCounts(manifest.units[0], partial), { done: 1, total: 2, percent: 50 });
assert.equal(Progress.nextBlock(manifest, partial).block.id, "F01:b02");

const complete = { ...empty, blocks: { "F01:b01": "completed", "F01:b02": "completed", "M00:b01": "completed" } };
assert.equal(Progress.stats(manifest, complete).completedUnits, 2);
assert.equal(Progress.stats(manifest, complete).percent, 100);
assert.equal(Progress.nextBlock(manifest, complete).block.id, "M00:b01");

const current = { schemaVersion: 2, courseVersion: "fases-v2" };
const imported = Progress.sanitize({ ...current, blocks: partial.blocks, lastVisited: { unit: "F01", block: "F01:b02" }, optional: { F01: { lab: true, checkpoint: false } } }, manifest);
assert.equal(imported.blocks["F01:b01"], "completed");
assert.equal(imported.optional.F01.lab, true);
assert.deepEqual(JSON.parse(Progress.serialize(imported)).blocks, partial.blocks);

// Progress saved before the five-phase restructuring keeps the blocks that still exist.
const legacy = Progress.sanitize({
  schemaVersion: 1,
  courseVersion: "preview-v1",
  blocks: { "F01:b01": "completed", "M00:b01": "in_progress", "M13:b20": "completed", "M00:b02": "completed" },
  optional: { M00: { lab: true, checkpoint: true }, LT09: { lab: true } },
  lastVisited: { unit: "M13", block: "M13:b20" },
  studyRoute: { version: "curated-v1", completed: { agentes: true } },
  externalRoute: { "1": true },
}, manifest);
assert.deepEqual(legacy.blocks, { "F01:b01": "completed", "M00:b01": "in_progress" });
assert.deepEqual(legacy.optional, { M00: { lab: true, checkpoint: true } });
assert.equal(legacy.lastVisited, null);
assert.equal(legacy.schemaVersion, 2);
assert.equal(legacy.courseVersion, "fases-v2");
assert.equal("studyRoute" in legacy, false);

assert.throws(() => Progress.sanitize({ ...current, blocks: { "BAD:b01": "completed" } }, manifest), /desconhecido/);
assert.throws(() => Progress.sanitize({ ...current, courseVersion: "outro" }, manifest), /outra versão/);
assert.throws(() => Progress.sanitize({ ...current, blocks: { "F01:b01": "green" } }, manifest), /inválido/);
assert.throws(() => Progress.sanitize({ ...current, lastVisited: { unit: "F01", block: "F01:b09" } }, manifest), /último ponto/);
assert.throws(() => Progress.sanitize({ ...current, optional: { F01: "sim" } }, manifest), /opcional inválido/);
assert.throws(() => Progress.sanitize({ schemaVersion: 9 }, manifest), /não é compatível/);
assert.throws(() => Progress.sanitize([], manifest), /objeto de progresso/);

console.log("Portal progress: assertions passed.");
