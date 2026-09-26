"""Grafo de entidades/relações com proveniência e update incremental (M13 B7).

Invariantes:
- Toda aresta carrega proveniência (arquivo+linha de origem) e origem
  ``extracted`` (fato do parser) ou ``inferred`` (inferência, rotulada).
- Update incremental: re-processar um arquivo substitui apenas as arestas
  emitidas por esse arquivo; o restante do grafo é preservado.
- As consultas estruturais (quem chama, quem importa, métricas de grau)
  respondem o que busca textual isolada não responde.
"""

from __future__ import annotations

import json
from collections import Counter
from dataclasses import asdict, dataclass
from pathlib import Path
from typing import Any

from capstone_lab.parsers import ParseResult


@dataclass(frozen=True)
class Provenance:
    source: str  # "extracted" (fato do parser) | "inferred" (inferência rotulada)
    path: str
    line: int


@dataclass(frozen=True)
class Edge:
    src: str
    dst: str
    kind: str  # "calls" | "imports" | ...
    provenance: Provenance


class CodeGraph:
    def __init__(self) -> None:
        self._edges: list[Edge] = []

    def add_file(self, result: ParseResult, source: str = "extracted") -> None:
        """Update incremental: arestas do arquivo são substituídas, não duplicadas."""
        self._edges = [e for e in self._edges if e.provenance.path != result.path]
        for rel in result.relations:
            self._edges.append(
                Edge(result.path, rel.target, rel.kind, Provenance(source, result.path, rel.line))
            )

    def add_inferred(self, src: str, dst: str, kind: str, path: str, line: int) -> None:
        self._edges.append(Edge(src, dst, kind, Provenance("inferred", path, line)))

    def callers_of(self, name: str) -> list[Edge]:
        return sorted(
            (e for e in self._edges if e.kind == "calls" and e.dst == name),
            key=lambda e: (e.provenance.path, e.provenance.line),
        )

    def imports_of(self, path: str) -> list[Edge]:
        return [e for e in self._edges if e.kind == "imports" and e.src == path]

    def in_degree(self, name: str) -> int:
        return sum(1 for e in self._edges if e.dst == name)

    def top_by_in_degree(self, top: int) -> list[tuple[str, int]]:
        return Counter(e.dst for e in self._edges).most_common(top)

    def facts_vs_inferred(self) -> dict[str, int]:
        out = {"extracted": 0, "inferred": 0}
        for e in self._edges:
            out[e.provenance.source] += 1
        return out

    def without_provenance(self) -> list[Edge]:
        return [
            e
            for e in self._edges
            if not e.provenance.path or e.provenance.line <= 0 or not e.provenance.source
        ]

    def golden_diff(self, golden_path: Path) -> list[str]:
        """Compara o grafo com o corpus dourado; lista vazia = conformidade total."""
        expected = json.loads(golden_path.read_text(encoding="utf-8"))
        actual: dict[str, Any] = {
            "callers": {
                name: [{"path": e.src, "line": e.provenance.line} for e in self.callers_of(name)]
                for name in expected.get("callers", {})
            },
            "facts_vs_inferred": self.facts_vs_inferred(),
        }
        diffs: list[str] = []
        for key, want in expected.items():
            if key not in actual:
                continue  # metadados do golden (ex.: description)
            if actual[key] != want:
                diffs.append(f"campo '{key}' diverge do corpus dourado")
        return diffs


def edges_as_dicts(graph: CodeGraph) -> list[dict[str, Any]]:
    return [asdict(e) for e in graph._edges]
