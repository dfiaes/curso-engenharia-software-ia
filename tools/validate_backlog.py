"""Validate task contracts, scenario coverage and separation of the optional ML track."""

from __future__ import annotations

import sys
from pathlib import Path

from backlog_tasks import MODULES, Task, build_tasks

ROOT = Path(__file__).resolve().parents[1]
BACKLOG = ROOT / "docs/BACKLOG-OPERACIONAL-V4.md"
EXPECTED_BLOCKS = {
    "M00": 5,
    "M01": 5,
    "M02": 8,
    "M02A": 15,
    "M03": 8,
    "M04": 4,
    "M05": 7,
    "M06": 6,
    "M07": 8,
    "M08": 8,
    "M09": 7,
    "M10": 10,
    "M11": 8,
    "M12": 9,
    "M13": 20,
    "LT01": 6,
    "LT02": 6,
    "LT03": 6,
    "LT04": 6,
    "ML01": 6,
    "ML02": 6,
    "ML03": 8,
    "ML04": 6,
    "ML05": 8,
    "ML06": 8,
    "ML07": 6,
}


def validate(tasks: list[Task], backlog: str) -> list[str]:
    errors: list[str] = []
    by_id = {t.id: t for t in tasks}
    if set(MODULES) != set(EXPECTED_BLOCKS):
        errors.append("catalog differs from the 19 core and 7 optional units")
    if len(by_id) != len(tasks):
        errors.append("duplicate atomic task ID")
    for task in tasks:
        for dep in task.depends_on:
            if dep not in by_id:
                errors.append(f"dangling dependency {task.id}->{dep}")
            elif task.track == "core" and by_id[dep].track == "appendix":
                errors.append(f"optional appendix blocks core: {task.id}->{dep}")
        if not all(
            (
                task.topic,
                task.inputs,
                task.outputs,
                task.acceptance,
                task.steps,
                task.limits,
                task.evidence,
            )
        ):
            errors.append("incomplete task packet: " + task.id)
        if task.track == "appendix" and task.release_blocking:
            errors.append("optional task marked main release blocking: " + task.id)
        if task.owner != "GPT-6-Luna-high":
            errors.append("non-Luna owner in continuous workflow: " + task.id)
    visiting: set[str] = set()
    done: set[str] = set()

    def visit(identifier: str) -> None:
        if identifier in visiting:
            errors.append("cycle in expanded DAG at " + identifier)
            return
        if identifier in done:
            return
        visiting.add(identifier)
        for dep in by_id[identifier].depends_on:
            if dep in by_id:
                visit(dep)
        visiting.remove(identifier)
        done.add(identifier)

    for identifier in by_id:
        visit(identifier)

    def ancestors(identifier: str) -> set[str]:
        result: set[str] = set()
        pending = [identifier]
        while pending:
            current = pending.pop()
            if current not in by_id:
                continue
            for dep in by_id[current].depends_on:
                if dep not in result:
                    result.add(dep)
                    pending.append(dep)
        return result

    for item, m in MODULES.items():
        expected = EXPECTED_BLOCKS.get(item, 0)
        if [b["number"] for b in m["blocks"]] != list(range(1, expected + 1)):
            errors.append("missing or unordered curriculum block: " + item)
        if item not in backlog:
            errors.append("missing curriculum item: " + item)
        for suffix in ("S", "R", "E"):
            if f"{item}-{suffix}" not in by_id:
                errors.append(f"missing module stage {item}-{suffix}")
        declared = {a["id"] for a in m["requirements"]}
        if len(declared) != len(m["requirements"]):
            errors.append("duplicate scenario ID: " + item)
        covered: set[str] = set()
        for b in m["blocks"]:
            for suffix in ("C", "L", "D"):
                identifier = f"{item}-B{b['number']:02}-{suffix}"
                leaf = by_id.get(identifier)
                if leaf is None:
                    errors.append("missing atomic leaf " + identifier)
                    continue
                if set(leaf.scenario_ids) - declared:
                    errors.append("unknown scenario in " + identifier)
                covered.update(leaf.scenario_ids)
            if not b["brief"] or not b["minimum_experiment"]:
                errors.append("missing block briefing: " + item)
        if declared - covered:
            errors.append(
                "missing acceptance coverage "
                + item
                + ": "
                + ", ".join(sorted(declared - covered))
            )
        if m.get("unassigned"):
            errors.append("unassigned source scenarios: " + item)
        if not (ROOT / m["spec"]).is_file():
            errors.append("missing source specification: " + item)
        if m["track"] == "core" and any(p.startswith("ML") for p in m["prerequisites"]):
            errors.append("ML prerequisite in main curriculum: " + item)
    terminal = by_id.get("REL-06")
    if (
        terminal is None
        or terminal.owner != "GPT-6-Luna-high"
        or terminal.depends_on != ("REL-05",)
    ):
        errors.append("REL-06 must be an independent Luna terminal task after REL-05")
    required = {
        t.id for t in tasks if t.release_blocking and t.id not in {"REL-05", "REL-06"}
    }
    missing = required - ancestors("REL-05")
    if missing:
        errors.append(
            "REL-05 does not depend on all release-blocking work: "
            + ", ".join(sorted(missing))
        )
    optional = {t.id for t in tasks if t.track == "appendix"}
    if optional & ancestors("REL-06"):
        errors.append("optional appendix is ancestor of main release")
    optional_required = optional - {"ML-REL-02"}
    if optional_required - ancestors("ML-REL-02"):
        errors.append("appendix review does not cover its own tasks")
    if (
        "Bloqueados impedem release" not in backlog
        or "não equivale a conclusão" not in backlog
    ):
        errors.append("backlog must distinguish BLOCKED from completion")
    return errors


def main() -> int:
    tasks = build_tasks()
    errors = validate(tasks, BACKLOG.read_text(encoding="utf-8"))
    for error in errors:
        print("ERROR " + error)
    core = sum(t.track == "core" for t in tasks)
    print(
        f"{len(tasks)} tasks: {core} core + {len(tasks) - core} optional ML; 26 units / 200 planned blocks; {len(errors)} errors."
    )
    print(
        "Planning validation only: no source, lab, learning outcome or release certified."
    )
    return bool(errors)


if __name__ == "__main__":
    sys.exit(main())
