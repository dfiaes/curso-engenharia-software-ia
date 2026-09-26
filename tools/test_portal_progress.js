"use strict";

const assert = require("node:assert/strict");
const Progress = require("../portal/progress.js");

const manifest = {
  courseVersion: "preview-v1",
  totalBlocks: 3,
  units: [
    { code: "M00", blocks: [{ id: "M00:b01" }, { id: "M00:b02" }] },
    { code: "M01", blocks: [{ id: "M01:b01" }] },
  ],
};

const empty = Progress.emptyState(manifest.courseVersion);
assert.equal(Progress.stats(manifest, empty).percent, 0);
assert.equal(Progress.unitStatus(manifest.units[0], empty), "not_started");

const partial = { ...empty, blocks: { "M00:b01": "completed", "M00:b02": "in_progress" } };
assert.deepEqual(Progress.stats(manifest, partial), { completedBlocks: 1, inProgressBlocks: 1, completedUnits: 0, percent: 33 });
assert.equal(Progress.unitStatus(manifest.units[0], partial), "in_progress");
assert.equal(Progress.nextBlock(manifest, partial).block.id, "M00:b02");

const complete = { ...empty, blocks: { "M00:b01": "completed", "M00:b02": "completed", "M01:b01": "completed" } };
assert.equal(Progress.stats(manifest, complete).completedUnits, 2);
assert.equal(Progress.stats(manifest, complete).percent, 100);

const imported = Progress.sanitize({ ...partial, schemaVersion: 1, courseVersion: "preview-v1", lastVisited: { unit: "M00", block: "M00:b02" }, optional: { M00: { lab: true, checkpoint: false } } }, manifest);
assert.equal(imported.blocks["M00:b01"], "completed");
assert.equal(imported.optional.M00.lab, true);
assert.throws(() => Progress.sanitize({ ...partial, schemaVersion: 1, courseVersion: "preview-v1", blocks: { "BAD:b01": "completed" } }, manifest), /desconhecido/);
assert.throws(() => Progress.sanitize({ ...partial, schemaVersion: 1, courseVersion: "preview-v2" }, manifest), /outra versão/);
assert.throws(() => Progress.sanitize({ ...partial, schemaVersion: 1, courseVersion: "preview-v1", blocks: { "M00:b01": "green" } }, manifest), /inválido/);

console.log("Portal progress: 11 assertions passed.");
