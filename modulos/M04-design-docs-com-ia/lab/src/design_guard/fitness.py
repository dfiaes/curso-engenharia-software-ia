"""Fitness function de cobertura de decisão (lote M04).

Responde: existe alguma área do código sobre a qual nenhuma decisão foi
registrada? Toda pasta de primeiro nível de `src/` deve ser mencionada
em pelo menos um ADR ou no `architecture.md` — ou constar na allowlist
explícita (nem toda pasta merece ADR; o critério é o custo de reversão
do bloco 3). Retorna violações; vazia significa cobertura.
"""

from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path


@dataclass(frozen=True, slots=True)
class FaltaCobertura:
    area: str
    detalhe: str

    def __str__(self) -> str:
        return f"{self.area}: [cobertura-decisao] {self.detalhe}"


def areas_sem_decisao(
    src: Path,
    docs: Path,
    allowlist: frozenset[str] = frozenset(),
) -> list[FaltaCobertura]:
    """Lista áreas de `src/` sem menção em ADRs ou architecture."""
    areas = sorted(p.name for p in src.iterdir() if p.is_dir() and p.name != "__pycache__")
    textos: list[str] = []
    for base in (docs / "adr",):
        if base.is_dir():
            textos += [p.read_text(encoding="utf-8") for p in base.glob("*.md")]
    arch = docs / "architecture.md"
    if arch.exists():
        textos.append(arch.read_text(encoding="utf-8"))
    corpus = "\n".join(textos)
    faltas: list[FaltaCobertura] = []
    for area in areas:
        if area in allowlist:
            continue
        if area not in corpus:
            faltas.append(FaltaCobertura(area, "nenhum ADR ou architecture menciona esta área"))
    return faltas
