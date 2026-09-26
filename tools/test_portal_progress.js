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
const routeManifest = {
  version: "curated-v1",
  stages: [
    { id: "agentes", title: "Agentes" },
    { id: "apps-llm", title: "Apps com LLM" },
  ],
};

const empty = Progress.emptyState(manifest.courseVersion, routeManifest);
assert.equal(Progress.stats(manifest, empty).percent, 0);
assert.equal(Progress.unitStatus(manifest.units[0], empty), "not_started");
assert.deepEqual(Progress.studyRouteStats(routeManifest, empty), { completedStages: 0, totalStages: 2, percent: 0 });
assert.equal(Progress.nextStudyStage(routeManifest, empty).id, "agentes");

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
const oldRouteImported = Progress.sanitize({ ...partial, schemaVersion: 1, courseVersion: "preview-v1", externalRoute: { "1": true, "9": true } }, manifest, routeManifest);
assert.deepEqual(oldRouteImported.legacyExternalRoute, { "1": true, "9": true });
assert.deepEqual(oldRouteImported.studyRoute.completed, {});
assert.deepEqual(JSON.parse(Progress.serialize(oldRouteImported)).legacyExternalRoute, { "1": true, "9": true });
const mergedLegacyRoutes = Progress.sanitize({ ...partial, schemaVersion: 1, courseVersion: "preview-v1", legacyExternalRoute: { "2": true }, externalRoute: { "1": true, "2": false } }, manifest, routeManifest);
assert.deepEqual(mergedLegacyRoutes.legacyExternalRoute, { "1": true, "2": true });
const routeImported = Progress.sanitize({ ...partial, schemaVersion: 1, courseVersion: "preview-v1", studyRoute: { version: "curated-v1", completed: { "agentes": true }, lastVisited: "apps-llm" } }, manifest, routeManifest);
assert.deepEqual(routeImported.studyRoute.completed, { agentes: true });
assert.equal(routeImported.studyRoute.lastVisited, "apps-llm");
assert.equal(Progress.studyRouteStats(routeManifest, routeImported).percent, 50);
assert.equal(Progress.nextStudyStage(routeManifest, routeImported).id, "apps-llm");
assert.deepEqual(JSON.parse(Progress.serialize(routeImported)).studyRoute, routeImported.studyRoute);
assert.throws(() => Progress.sanitize({ ...partial, schemaVersion: 1, courseVersion: "preview-v1", blocks: { "BAD:b01": "completed" } }, manifest), /desconhecido/);
assert.throws(() => Progress.sanitize({ ...partial, schemaVersion: 1, courseVersion: "preview-v2" }, manifest), /outra versão/);
assert.throws(() => Progress.sanitize({ ...partial, schemaVersion: 1, courseVersion: "preview-v1", blocks: { "M00:b01": "green" } }, manifest), /inválido/);
assert.throws(() => Progress.sanitize({ ...partial, schemaVersion: 1, courseVersion: "preview-v1", externalRoute: { "10": true } }, manifest, routeManifest), /desconhecida/);
assert.throws(() => Progress.sanitize({ ...partial, schemaVersion: 1, courseVersion: "preview-v1", externalRoute: { "1": "done" } }, manifest, routeManifest), /inválido/);
assert.throws(() => Progress.sanitize({ ...partial, schemaVersion: 1, courseVersion: "preview-v1", externalRoute: false }, manifest, routeManifest), /roteiro anterior é inválido/);
assert.throws(() => Progress.sanitize({ ...partial, schemaVersion: 1, courseVersion: "preview-v1", studyRoute: { version: "curated-v2", completed: {} } }, manifest, routeManifest), /outra versão da trilha/);
assert.throws(() => Progress.sanitize({ ...partial, schemaVersion: 1, courseVersion: "preview-v1", studyRoute: { version: "curated-v1", completed: { "unknown": true } } }, manifest, routeManifest), /Etapa desconhecida/);

console.log("Portal progress: assertions passed.");
