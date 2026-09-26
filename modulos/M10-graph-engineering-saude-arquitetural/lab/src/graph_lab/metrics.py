"""Saúde arquitetural: Ca/Ce, I/A/D, zonas e ciclos (lote M10).

Métrica é instrumento, não veredito: declara a fronteira, mostra a
tendência, respeita o julgamento. E honestidade mecânica: A sem dado é
reportada como indefinida, nunca inventada.
"""

from __future__ import annotations

from dataclasses import dataclass

from graph_lab.digraph import DiGraph

ARESTAS_DEPENDENCIA = frozenset({"CHAMA", "DEPENDE_DE", "IMPLEMENTA", "HERDA"})


@dataclass(frozen=True, slots=True)
class MetricasComponente:
    componente: str
    ca: int
    ce: int
    tipos: int
    abstratos: int
    a_indefinido: bool = False

    @property
    def instabilidade(self) -> float:
        """Ce/(Ca+Ce): facilidade de mudança, não defeito."""
        total = self.ca + self.ce
        return self.ce / total if total else 0.0

    @property
    def abstratividade(self) -> float | None:
        """Fração abstrata; None quando o parser não distingue."""
        if self.a_indefinido or self.tipos == 0:
            return None
        return self.abstratos / self.tipos

    @property
    def distancia(self) -> float | None:
        """|A+I-1|: None sem A honesto."""
        a = self.abstratividade
        return abs(a + self.instabilidade - 1) if a is not None else None

    @property
    def zona(self) -> str:
        """saudavel/dor/inutilidade/indefinida."""
        d = self.distancia
        if d is None:
            return "indefinida"
        if d < 0.2:
            return "saudavel"
        i, a = self.instabilidade, self.abstratividade or 0.0
        return "dor" if (i + a) < 1 else "inutilidade"


def calcular(
    g: DiGraph, componente_de: dict[str, str], sem_abstrato: frozenset[str] = frozenset()
) -> list[MetricasComponente]:
    """Agrega Ca/Ce; componentes em `sem_abstrato` têm A indefinido (honesto)."""
    tipos = [n for n in g.nos() if g.attrs(n).get("tipo") == "Tipo"]
    ca: dict[str, set[str]] = {}
    ce: dict[str, set[str]] = {}
    total: dict[str, int] = {}
    abstratos: dict[str, int] = {}
    for t in tipos:
        c = componente_de.get(t, "?")
        total[c] = total.get(c, 0) + 1
        if g.attrs(t).get("abstrato"):
            abstratos[c] = abstratos.get(c, 0) + 1
    for origem in g.nos():
        for destino, chave, _ in g.arestas_de(origem):
            if chave not in ARESTAS_DEPENDENCIA:
                continue
            co, cd = componente_de.get(origem), componente_de.get(destino)
            if not co or not cd or co == cd:
                continue
            ce.setdefault(co, set()).add(destino)
            ca.setdefault(cd, set()).add(origem)
    saida = [
        MetricasComponente(
            componente=c,
            ca=len(ca.get(c, ())),
            ce=len(ce.get(c, ())),
            tipos=total.get(c, 0),
            abstratos=abstratos.get(c, 0),
            a_indefinido=c in sem_abstrato,
        )
        for c in total
    ]
    return sorted(saida, key=lambda m: (m.distancia is None, -(m.distancia or 0.0)))


def ciclos_entre_componentes(g: DiGraph, componente_de: dict[str, str]) -> list[list[str]]:
    """Ciclos no grafo quociente + aresta sugerida para quebrar."""
    quociente = DiGraph()
    for origem in g.nos():
        for destino, chave, _ in g.arestas_de(origem):
            if chave not in ARESTAS_DEPENDENCIA:
                continue
            co, cd = componente_de.get(origem), componente_de.get(destino)
            if co and cd and co != cd:
                quociente.add_aresta(co, cd, chave)
    return quociente.ciclos()
