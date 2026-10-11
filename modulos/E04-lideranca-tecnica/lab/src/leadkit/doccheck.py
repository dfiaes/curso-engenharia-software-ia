"""Structural linting of lead documents: RFC, SBI feedback and postmortem."""

from __future__ import annotations

import re
import unicodedata
from dataclasses import dataclass


@dataclass(frozen=True, slots=True)
class Finding:
    line: int
    code: str
    message: str


@dataclass(frozen=True, slots=True)
class Spec:
    required: tuple[str, ...]
    # (section prefix or "*" for the whole document, pattern, message)
    forbidden: tuple[tuple[str, str, str], ...] = ()
    min_list_items: tuple[tuple[str, int], ...] = ()
    needs_owner_and_date: tuple[str, ...] = ()


SPECS: dict[str, Spec] = {
    "sbi": Spec(
        required=("situacao", "comportamento", "impacto", "pedido"),
        forbidden=(
            (
                "comportamento",
                r"\b(sempre|nunca|preguic\w*|desleix\w*|descuid\w*|relaxad\w*|imaturo|"
                r"problematic\w*|atitude)\b|voce e\b",
                "julgamento ou generalização no Comportamento; descreva o que foi visto/ouvido",
            ),
        ),
    ),
    "rfc": Spec(
        required=(
            "contexto",
            "proposta",
            "alternativas",
            "riscos",
            "perguntas em aberto",
            "decisao",
        ),
        min_list_items=(("alternativas", 2),),
    ),
    "postmortem": Spec(
        required=("resumo", "impacto", "linha do tempo", "causas contribuintes", "acoes"),
        forbidden=(
            (
                "*",
                r"erro humano|human error|\bculpa\b|negligenc\w*|descuido|falta de atencao",
                "causa atribuída a pessoa; descreva a condição do sistema que permitiu o erro",
            ),
        ),
        needs_owner_and_date=("acoes",),
    ),
}

_HEADING = re.compile(r"^##\s+(.*?)\s*$")
_COMMENT = re.compile(r"<!--.*?-->", re.DOTALL)
_PLACEHOLDER = re.compile(r"\bTODO\b")
_LIST_ITEM = re.compile(r"^\s*(?:[-*]|\d+[.)])\s+\S")
_ISO_DATE = re.compile(r"\b\d{4}-\d{2}-\d{2}\b")
_OWNER = re.compile(r"(?<!\w)@[\w.-]+")


def normalize(text: str) -> str:
    """Lowercase and strip accents so 'Situação' matches 'situacao'."""
    decomposed = unicodedata.normalize("NFKD", text.lower())
    return "".join(c for c in decomposed if not unicodedata.combining(c))


@dataclass(frozen=True, slots=True)
class _Section:
    name: str
    start: int  # 1-based line of the heading
    body: tuple[tuple[int, str], ...]  # (line number, text)


def _strip_comments(text: str) -> str:
    # keep line count: replace each comment with the same number of newlines
    return _COMMENT.sub(lambda m: "\n" * m.group(0).count("\n"), text)


def _sections(text: str) -> list[_Section]:
    sections: list[_Section] = []
    name: str | None = None
    start = 0
    body: list[tuple[int, str]] = []
    for number, line in enumerate(text.splitlines(), start=1):
        match = _HEADING.match(line)
        if match:
            if name is not None:
                sections.append(_Section(name, start, tuple(body)))
            name, start, body = normalize(match.group(1)), number, []
        elif name is not None:
            body.append((number, line))
    if name is not None:
        sections.append(_Section(name, start, tuple(body)))
    return sections


def _find(sections: list[_Section], prefix: str) -> _Section | None:
    return next((s for s in sections if s.name.startswith(prefix)), None)


def check(kind: str, text: str) -> list[Finding]:
    """Return findings for ``text`` against the spec named ``kind`` (empty list = pass)."""
    spec = SPECS[kind]
    clean = _strip_comments(text)
    sections = _sections(clean)
    findings: list[Finding] = []

    for number, line in enumerate(clean.splitlines(), start=1):
        if _PLACEHOLDER.search(line):
            findings.append(Finding(number, "placeholder", "TODO ainda no documento"))

    for prefix in spec.required:
        section = _find(sections, prefix)
        if section is None:
            findings.append(Finding(1, "secao-ausente", f"falta a seção '{prefix}'"))
        elif not any(t.strip() and not _PLACEHOLDER.search(t) for _, t in section.body):
            findings.append(Finding(section.start, "secao-vazia", f"seção '{prefix}' sem conteúdo"))

    for target, pattern, message in spec.forbidden:
        regex = re.compile(pattern)
        if target == "*":
            lines = list(enumerate(clean.splitlines(), start=1))
        else:
            section = _find(sections, target)
            lines = list(section.body) if section else []
        for number, line in lines:
            if regex.search(normalize(line)):
                findings.append(Finding(number, "julgamento", message))

    for prefix, minimum in spec.min_list_items:
        section = _find(sections, prefix)
        if section is not None:
            items = sum(1 for _, t in section.body if _LIST_ITEM.match(t))
            if items < minimum:
                findings.append(
                    Finding(
                        section.start, "poucos-itens", f"'{prefix}' precisa de {minimum}+ itens"
                    )
                )

    for prefix in spec.needs_owner_and_date:
        section = _find(sections, prefix)
        if section is None:
            continue
        for number, line in section.body:
            if _LIST_ITEM.match(line) and not (_OWNER.search(line) and _ISO_DATE.search(line)):
                findings.append(
                    Finding(
                        number, "acao-sem-dono-ou-prazo", "ação precisa de @dono e data AAAA-MM-DD"
                    )
                )

    return sorted(findings, key=lambda f: (f.line, f.code))
