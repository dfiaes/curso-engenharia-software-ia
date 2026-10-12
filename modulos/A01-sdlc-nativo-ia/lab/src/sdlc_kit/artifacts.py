"""Validators for the versioned artifacts that connect SDLC stages.

``intent.md`` -> ``spec.md`` -> ``plan.md``: each file has a small front matter
(``key: value`` lines between ``---``) and required ``##`` sections. Requirements,
acceptance criteria and plan steps carry ids so the chain can be traced mechanically.
"""

from __future__ import annotations

import re
from dataclasses import dataclass, field
from pathlib import Path

from sdlc_kit.findings import Finding

INTENT_SECTIONS = (
    "problema",
    "resultado esperado",
    "usuários e sistemas",
    "restrições",
    "questões em aberto",
)
SPEC_SECTIONS = ("requisitos", "critérios de aceite", "políticas aplicadas", "fora de escopo")
PLAN_SECTIONS = ("passos", "riscos", "testes que provam")

_REQ = re.compile(r"^- (R\d+): \S.*$")
_AC = re.compile(r"^- (AC\d+) \((R\d+(?:, R\d+)*)\): \S.*$")
_STEP = re.compile(r"^- (S\d+) \((R\d+(?:, R\d+)*)\): \S.*$")
_RID = re.compile(r"\bR\d+\b")
_EMPTY_MARKERS = {"nenhuma", "nenhum", "n/a", "-"}


@dataclass(frozen=True, slots=True)
class Document:
    """A parsed markdown artifact."""

    path: str
    meta: dict[str, str]
    sections: dict[str, str]
    duplicate_sections: tuple[str, ...] = field(default=())


def parse_document(text: str, path: str = "") -> Document:
    """Split front matter and ``## sections``. Never raises: problems become findings later."""
    lines = text.splitlines()
    meta: dict[str, str] = {}
    start = 0
    if lines and lines[0].strip() == "---":
        for i in range(1, len(lines)):
            if lines[i].strip() == "---":
                start = i + 1
                break
            key, sep, value = lines[i].partition(":")
            if sep and key.strip():
                meta[key.strip()] = value.strip()
    sections: dict[str, list[str]] = {}
    duplicates: list[str] = []
    current: str | None = None
    for line in lines[start:]:
        if line.startswith("## "):
            current = line[3:].strip().casefold()
            if current in sections:
                duplicates.append(current)
            sections.setdefault(current, [])
        elif current is not None:
            sections[current].append(line)
    joined = {name: "\n".join(body).strip() for name, body in sections.items()}
    return Document(path, meta, joined, tuple(duplicates))


def _front_matter(doc: Document, id_pattern: str, extra: dict[str, str]) -> list[Finding]:
    out: list[Finding] = []
    doc_id = doc.meta.get("id", "")
    if not re.fullmatch(id_pattern, doc_id):
        out.append(Finding("FM_ID", f"id ausente ou fora do padrão {id_pattern!r}", doc.path))
    if doc.meta.get("status") not in {"draft", "accepted"}:
        out.append(Finding("FM_STATUS", "status deve ser 'draft' ou 'accepted'", doc.path))
    for key, pattern in extra.items():
        if not re.fullmatch(pattern, doc.meta.get(key, "")):
            out.append(
                Finding("FM_REF", f"'{key}' ausente ou fora do padrão {pattern!r}", doc.path)
            )
    return out


def _required_sections(doc: Document, names: tuple[str, ...], prefix: str) -> list[Finding]:
    out: list[Finding] = []
    for name in doc.duplicate_sections:
        out.append(Finding(f"{prefix}_DUPLICATE_SECTION", f"seção repetida: '{name}'", doc.path))
    for name in names:
        if name not in doc.sections:
            out.append(Finding(f"{prefix}_MISSING_SECTION", f"falta a seção '## {name}'", doc.path))
        elif not doc.sections[name]:
            out.append(Finding(f"{prefix}_EMPTY_SECTION", f"a seção '{name}' está vazia", doc.path))
    return out


def _items(doc: Document, section: str, pattern: re.Pattern[str]) -> list[re.Match[str]]:
    body = doc.sections.get(section, "")
    return [m for line in body.splitlines() if (m := pattern.match(line.strip()))]


def validate_intent(doc: Document) -> list[Finding]:
    out = _front_matter(doc, r"INT-\d{3,}", {})
    out += _required_sections(doc, INTENT_SECTIONS, "INTENT")
    open_q = doc.sections.get("questões em aberto", "").strip().casefold()
    if doc.meta.get("status") == "accepted" and open_q and open_q.rstrip(".") not in _EMPTY_MARKERS:
        out.append(
            Finding(
                "INTENT_OPEN_QUESTIONS", "intent aceito não pode ter questões em aberto", doc.path
            )
        )
    return out


def validate_spec(doc: Document) -> list[Finding]:
    out = _front_matter(doc, r"SPEC-\d{3,}", {"intent": r"INT-\d{3,}"})
    out += _required_sections(doc, SPEC_SECTIONS, "SPEC")
    reqs = {m.group(1) for m in _items(doc, "requisitos", _REQ)}
    if "requisitos" in doc.sections and doc.sections["requisitos"] and not reqs:
        out.append(
            Finding("SPEC_NO_REQUIREMENTS", "nenhum requisito no formato '- R1: texto'", doc.path)
        )
    covered: set[str] = set()
    for m in _items(doc, "critérios de aceite", _AC):
        for ref in _RID.findall(m.group(2)):
            covered.add(ref)
            if ref not in reqs:
                out.append(
                    Finding(
                        "SPEC_AC_UNKNOWN_REQ", f"{m.group(1)} cita {ref}, que não existe", doc.path
                    )
                )
    for req in sorted(reqs - covered, key=_num):
        out.append(Finding("SPEC_REQ_WITHOUT_AC", f"{req} não tem critério de aceite", doc.path))
    return out


def validate_plan(doc: Document) -> list[Finding]:
    out = _front_matter(doc, r"PLAN-\d{3,}", {"spec": r"SPEC-\d{3,}"})
    out += _required_sections(doc, PLAN_SECTIONS, "PLAN")
    steps = _items(doc, "passos", _STEP)
    if doc.sections.get("passos") and not steps:
        out.append(Finding("PLAN_NO_STEPS", "nenhum passo no formato '- S1 (R1): texto'", doc.path))
    return out


def _num(ref: str) -> int:
    return int(ref[1:])


def check_chain(intent: Document, spec: Document, plan: Document) -> list[Finding]:
    """Trace intent -> spec -> plan. Assumes each document passed its own validator."""
    out: list[Finding] = []
    if spec.meta.get("intent") != intent.meta.get("id"):
        out.append(
            Finding(
                "CHAIN_SPEC_INTENT",
                f"spec aponta para {spec.meta.get('intent')!r}, não para {intent.meta.get('id')!r}",
                spec.path,
            )
        )
    if intent.meta.get("status") != "accepted":
        out.append(
            Finding(
                "CHAIN_INTENT_NOT_ACCEPTED", "spec escrita a partir de intent não aceito", spec.path
            )
        )
    if plan.meta.get("spec") != spec.meta.get("id"):
        out.append(
            Finding(
                "CHAIN_PLAN_SPEC",
                f"plano aponta para {plan.meta.get('spec')!r}, não para {spec.meta.get('id')!r}",
                plan.path,
            )
        )
    reqs = {m.group(1) for m in _items(spec, "requisitos", _REQ)}
    step_refs: set[str] = set()
    for m in _items(plan, "passos", _STEP):
        for ref in _RID.findall(m.group(2)):
            step_refs.add(ref)
            if ref not in reqs:
                out.append(
                    Finding(
                        "CHAIN_STEP_UNKNOWN_REQ",
                        f"{m.group(1)} cita {ref}, ausente da spec",
                        plan.path,
                    )
                )
    proven = set(_RID.findall(plan.sections.get("testes que provam", "")))
    for req in sorted(reqs, key=_num):
        if req not in step_refs:
            out.append(
                Finding(
                    "CHAIN_REQ_WITHOUT_STEP", f"{req} não é coberto por nenhum passo", plan.path
                )
            )
        if req not in proven:
            out.append(
                Finding("PLAN_UNPROVEN_REQUIREMENT", f"{req} não tem teste que prove", plan.path)
            )
    return out


def _load(path: Path, root: Path) -> Document:
    return parse_document(path.read_text(encoding="utf-8"), path.relative_to(root).as_posix())


def validate_tree(root: Path) -> list[Finding]:
    """Validate ``docs/intent``, ``docs/specs`` and ``docs/plans`` and every link between them."""
    intents = {p: _load(p, root) for p in sorted((root / "docs/intent").glob("*.md"))}
    specs = {p: _load(p, root) for p in sorted((root / "docs/specs").glob("*.md"))}
    plans = {p: _load(p, root) for p in sorted((root / "docs/plans").glob("*.md"))}
    out: list[Finding] = []
    for doc in intents.values():
        out += validate_intent(doc)
    for doc in specs.values():
        out += validate_spec(doc)
    for doc in plans.values():
        out += validate_plan(doc)
    by_intent = {d.meta.get("id", ""): d for d in intents.values()}
    by_spec = {d.meta.get("id", ""): d for d in specs.values()}
    for spec in specs.values():
        if spec.meta.get("intent", "") not in by_intent:
            out.append(Finding("CHAIN_ORPHAN_SPEC", "spec sem intent correspondente", spec.path))
    for plan in plans.values():
        parent = by_spec.get(plan.meta.get("spec", ""))
        if parent is None:
            out.append(Finding("CHAIN_ORPHAN_PLAN", "plano sem spec correspondente", plan.path))
            continue
        root_intent = by_intent.get(parent.meta.get("intent", ""))
        if root_intent is not None:
            out += check_chain(root_intent, parent, plan)
    return out
