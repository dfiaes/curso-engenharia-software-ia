# Software and AI Engineering with Python

A course for learners from different software backgrounds. Python 3.14 is the canonical language; no knowledge of another stack is required. Lessons explain new concepts before using them.

**Main course: 15 modules + 4 transversal labs, 152 content blocks. Optional ML appendix: 7 planned units, 48 blocks.** The appendix covers tabular data, training, validation and MLOps; it never blocks the main course or the learner. The former 304-hour estimate applies to the original scope only. Blocks organize topics, not study sessions. Teaching material is in Portuguese; there is no mandatory schedule.

## Find your material

- [Course portal](index.html): the official entry point for instructions, curriculum, all 19 units, the 152-block study path and browser-local progress.
- [Course map](CURRICULO.md): modules, prerequisites and intended outcomes.
- [Implementation status](docs/STATUS-IMPLEMENTACAO-CURSO.md): what is ready, incomplete or blocked. Existing HTML does not imply verified material.
- [M00](modulos/M00-ferramental/M00.html): entry module; visual review remains open.
- [Concept map](docs/mapa-conceitual.md): vocabulary reference when useful.
- [Capstone](docs/projeto-final.md): the product connecting the modules.

Use the contents and section links to read, consult an example or resume where you stopped. Guided labs are collected at the end of each module and can span several sessions. Assessments are separate; they demonstrate competence without locking access to reading. Notes and the [personal study log](PROGRESSO.md) are optional aids.

The portal stores reading progress only in the current browser and can export or import it as JSON. This personal state is separate from editorial readiness: completing a block does not promote a technical gate, and an unverified lab does not block reading the preview.

## Contribute to the course

Read [AGENTS.md](AGENTS.md) before changing a module. Each document has one maintained responsibility:

| Responsibility | Canonical location |
|---|---|
| Permanent authoring and tutoring rules | [CLAUDE.md](CLAUDE.md) |
| Technical and teaching quality; authoring workflow | [Quality standard](docs/PADRAO-QUALIDADE-TECNICA-DIDATICA.md) |
| Sources, versions and neutrality | [Source policy](docs/POLITICA-FONTES-E-AGNOSTICISMO.md) |
| Curriculum and boundaries | [CURRICULO.md](CURRICULO.md) |
| Active work, blockers, migration backlog and decisions | [Implementation status](docs/STATUS-IMPLEMENTACAO-CURSO.md) |
| Competency-to-evidence map | [Traceability matrix](docs/MATRIZ-RASTREABILIDADE.md) |
| Detailed module scope | `docs/especificacoes/` |
| Module evidence and gate decisions | `modulos/*/RASTREABILIDADE.md`, `docs/auditorias/` and lab evidence |
| Actual learning history | [PROGRESSO.md](PROGRESSO.md); never update during editorial work |

## Work on one bounded task

Read the active task in the status, then obtain its packet:

```text
python3 tools/backlog_tasks.py --task FIX-01 --prompt
python3 tools/backlog_tasks.py --task ML03-B05-L --bundle
python3 tools/validate_backlog.py
```

The [backlog](docs/BACKLOG-OPERACIONAL-V4.md) and [depth specification](docs/especificacoes/FORMACAO-SOFTWARE-IA-ML-ESPECIFICACAO.md) define detailed instructions, examples, failure cases and review criteria. Main-course and optional-appendix release graphs are separate. Prefer a small lab that proves the concept; do not equate infrastructure size with depth.

Historical reports are in [the archive](docs/historico/README.md). Do not load that directory or the entire task catalog as default context; retrieve only a cited record when needed. Current curriculum, status and traceability documents supersede the archived snapshots.

Keep curriculum, evidence and learner history separate. Consolidate new decisions into the relevant canonical document instead of creating another overlapping plan. Retain audit records that support gate decisions, executable fixtures, and personal work.

## Editorial checks

Run `python3 tools/build_course_portal.py --check` to verify that the embedded portal manifest matches the 19 units and 152 block anchors. Run `python3 tools/check_course.py` from the repository root (or `python tools/check_course.py` on Windows) for active Markdown/HTML links, anchors and structural errors. Use `--include-history` to inspect the archive too. These checks do not execute module labs, validate external sources, or certify accessibility and teaching quality.
