"""Portfolio checklist: does the project README tell the story a reviewer looks for?"""

from __future__ import annotations

import re
import unicodedata
from dataclasses import dataclass
from enum import StrEnum

MIN_WORDS = 8


class Status(StrEnum):
    OK = "ok"
    WEAK = "weak"
    MISSING = "missing"


@dataclass(frozen=True)
class Requirement:
    key: str
    label: str
    keywords: tuple[str, ...]
    needs_number: bool = False


REQUIREMENTS: tuple[Requirement, ...] = (
    Requirement("problema", "Problema e contexto", ("problema", "problem", "contexto")),
    Requirement("arquitetura", "Arquitetura", ("arquitetura", "architecture")),
    Requirement("decisoes", "Decisões e trade-offs", ("decis", "trade-off", "tradeoff", "adr")),
    Requirement(
        "avaliacao",
        "Avaliação com números",
        ("avalia", "eval", "metric", "benchmark", "resultado"),
        needs_number=True,
    ),
    Requirement(
        "custo", "Custo e latência", ("custo", "cost", "latenc", "orcamento"), needs_number=True
    ),
    Requirement(
        "falhas",
        "Falhas e o que faria diferente",
        ("falha", "failure", "limita", "licoes", "faria diferente", "known issues"),
    ),
    Requirement(
        "rodar",
        "Como rodar",
        ("como rodar", "quickstart", "getting started", "instala", "how to run", "reproduz"),
    ),
    Requirement("demo", "Demo", ("demo", "screencast", "video", "exemplo de uso", "usage")),
)

_HEADING = re.compile(r"^(#{1,6})\s+(.*?)\s*#*\s*$")
_DIGIT = re.compile(r"\d")


@dataclass(frozen=True)
class Section:
    level: int
    title: str
    body: str


@dataclass(frozen=True)
class Finding:
    requirement: Requirement
    status: Status
    detail: str


@dataclass(frozen=True)
class Report:
    findings: tuple[Finding, ...]

    @property
    def passed(self) -> bool:
        return all(f.status is Status.OK for f in self.findings)

    def render(self) -> str:
        lines = []
        for f in self.findings:
            mark = "x" if f.status is Status.OK else " "
            lines.append(f"- [{mark}] {f.requirement.label}: {f.status.value} - {f.detail}")
        done = sum(f.status is Status.OK for f in self.findings)
        lines.append(f"\n{done}/{len(self.findings)} itens ok")
        return "\n".join(lines)


def _normalize(text: str) -> str:
    decomposed = unicodedata.normalize("NFKD", text.lower())
    return "".join(ch for ch in decomposed if not unicodedata.combining(ch))


def parse_sections(markdown: str) -> list[Section]:
    """Split by ATX headings, ignoring ``#`` lines inside fenced code blocks.

    A section's body includes its sub-sections.
    """
    heads: list[tuple[int, str, int]] = []
    lines = markdown.splitlines()
    in_fence = False
    for index, line in enumerate(lines):
        if line.lstrip().startswith(("```", "~~~")):
            in_fence = not in_fence
            continue
        match = None if in_fence else _HEADING.match(line)
        if match:
            heads.append((len(match.group(1)), match.group(2), index))
    sections: list[Section] = []
    for pos, (level, title, start) in enumerate(heads):
        end = len(lines)
        for next_level, _, next_start in heads[pos + 1 :]:
            if next_level <= level:
                end = next_start
                break
        sections.append(Section(level, title, "\n".join(lines[start + 1 : end])))
    return sections


def _judge(req: Requirement, sections: list[Section]) -> Finding:
    matching = [s for s in sections if any(k in _normalize(s.title) for k in req.keywords)]
    if not matching:
        return Finding(req, Status.MISSING, "nenhuma seção com este tema")
    section = matching[0]
    words = len(section.body.split())
    if words < MIN_WORDS:
        return Finding(req, Status.WEAK, f"seção '{section.title}' tem só {words} palavras")
    if req.needs_number and not _DIGIT.search(section.body):
        return Finding(req, Status.WEAK, f"seção '{section.title}' não traz nenhum número")
    return Finding(req, Status.OK, f"seção '{section.title}'")


def check_readme(markdown: str) -> Report:
    sections = parse_sections(markdown)
    return Report(tuple(_judge(req, sections) for req in REQUIREMENTS))
