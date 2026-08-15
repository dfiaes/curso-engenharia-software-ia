# Release contract — Cartógrafo reference product

**Contract version:** 0.1 · **Frozen before release-candidate evaluation:** yes

## Persona and problem

Primary persona: a tech lead or senior engineer who has explicit authorization to inspect a
legacy repository and must understand change risk before maintenance, incident response,
audit, or modernization.

Problem: structural facts, relevant code, dependencies, and architectural risk are expensive
to reconstruct manually. Existing search alone does not join deterministic structure,
provenance, controlled investigation, and reusable documentation.

## Three critical journeys

1. Register an authorized source snapshot, observe asynchronous progress, and inspect parsing
   coverage without exposing secrets.
2. Ask a scoped architectural question and receive cited evidence or an explicit abstention.
3. Run a bounded investigation, resume after interruption, and export an auditable report.

## Non-goals

- unrestricted code execution, refactoring, or automatic pull requests;
- universal language support;
- replacement for SAST, human review, or migration tools;
- storage of employer code without formal authorization;
- public productivity, accuracy, or revenue claims before measured evidence.

## Supported reference corpus

- Python 3.14 fixtures;
- modern C# fixtures used only as analyzed domain data;
- malformed and partially parseable files for failure measurement.

Grammar versions and corpus digests are recorded in evidence manifests when B04 executes.

## Pre-registered release budgets

These are engineering targets, not claims of achieved performance:

- zero cross-tenant object in every tested data plane;
- zero open P0/P1 security finding;
- zero public claim without an evidence ID;
- restore and rollback must be executed before GO;
- retrieval/quality thresholds must be frozen with the B06/B11 dataset before evaluating a
  release candidate;
- cost ceiling is loaded from typed configuration and frozen in the evidence manifest before
  the run; the `1.00` value in tests is fixture data, not a price or market promise.

## Preliminary user-facing SLIs

- eligible ingest jobs reaching a terminal, reconciled state;
- valid answers with citations or correct abstention;
- end-to-end latency by journey and repository size;
- cost per valid analysis;
- successful first journey for an authorized pilot.

Objectives are frozen only after the reference dataset and environment manifest exist. A
missing target produces `BLOCKED`, not a relaxed target after results are seen.

## Go/no-go ownership

The release owner reviews the generated dossier. Security, data recovery, tenant isolation,
quality, cost, operation, and pilot stop conditions are independent vetoes. `NO-GO` with
evidence is an acceptable engineering outcome.
