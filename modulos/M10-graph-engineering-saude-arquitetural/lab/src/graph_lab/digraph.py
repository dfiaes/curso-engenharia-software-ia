"""Digrafo rotulado com travessias (lote M10).

Nós com atributos, arestas dirigidas com chave (CHAMA, DECLARA, ...).
BFS para vizinhança, alcançáveis para impacto/mortos, Tarjan para
componentes fortemente conexos (ciclos). O(V+E) em tudo.
"""

from __future__ import annotations

from collections import deque
from typing import Any


class DiGraph:
    """Grafo dirigido multirrotulado em memória."""

    def __init__(self) -> None:
        self._nos: dict[str, dict[str, Any]] = {}
        self._saem: dict[str, list[tuple[str, str, dict[str, Any]]]] = {}
        self._entram: dict[str, list[tuple[str, str, dict[str, Any]]]] = {}

    def add_no(self, nome: str, **attrs: Any) -> None:
        """Cria o nó (ou atualiza atributos se existir)."""
        self._nos.setdefault(nome, {}).update(attrs)
        self._saem.setdefault(nome, [])
        self._entram.setdefault(nome, [])

    def add_aresta(self, origem: str, destino: str, chave: str, **attrs: Any) -> None:
        """Aresta dirigida com chave e propriedades (ex.: linha)."""
        self.add_no(origem)
        self.add_no(destino)
        self._saem[origem].append((destino, chave, attrs))
        self._entram[destino].append((origem, chave, attrs))

    def nos(self) -> list[str]:
        """Nomes de todos os nós."""
        return list(self._nos)

    def attrs(self, nome: str) -> dict[str, Any]:
        """Atributos de um nó."""
        return dict(self._nos[nome])

    def arestas_de(self, nome: str) -> list[tuple[str, str, dict[str, Any]]]:
        """(destino, chave, attrs) das arestas que saem do nó."""
        return list(self._saem[nome])

    def vizinhos(self, nome: str, chave: str | None = None) -> list[str]:
        """Destinos das arestas que saem (opcionalmente filtradas)."""
        return [d for d, k, _ in self._saem[nome] if chave is None or k == chave]

    def antecessores(self, nome: str, chave: str | None = None) -> list[str]:
        """Origens das arestas que entram (opcionalmente filtradas)."""
        return [o for o, k, _ in self._entram[nome] if chave is None or k == chave]

    def alcancaveis(
        self, origem: str, chave: str | None = None, max_saltos: int = 10
    ) -> dict[str, int]:
        """Fecho transitivo com distância (BFS reversa se `reverso`)."""
        dist: dict[str, int] = {}
        fila: deque[tuple[str, int]] = deque([(origem, 0)])
        while fila:
            atual, d = fila.popleft()
            if atual in dist or d > max_saltos:
                continue
            dist[atual] = d
            for prox in self.vizinhos(atual, chave):
                fila.append((prox, d + 1))
        dist.pop(origem, None)
        return dist

    def alcancado_por(
        self, alvo: str, chave: str | None = None, max_saltos: int = 10
    ) -> dict[str, int]:
        """Quem alcança o alvo: BFS no grafo reverso (impacto)."""
        dist: dict[str, int] = {}
        fila: deque[tuple[str, int]] = deque([(alvo, 0)])
        while fila:
            atual, d = fila.popleft()
            if atual in dist or d > max_saltos:
                continue
            dist[atual] = d
            for prox in self.antecessores(atual, chave):
                fila.append((prox, d + 1))
        dist.pop(alvo, None)
        return dist

    def rota(self, origem: str, alvo: str, chave: str | None = None) -> list[str]:
        """Um caminho origem→alvo (BFS); vazio se inalcançável."""
        anterior: dict[str, str] = {}
        fila: deque[str] = deque([origem])
        vistos = {origem}
        while fila:
            atual = fila.popleft()
            if atual == alvo:
                caminho = [alvo]
                while caminho[-1] != origem:
                    caminho.append(anterior[caminho[-1]])
                return list(reversed(caminho))
            for prox in self.vizinhos(atual, chave):
                if prox not in vistos:
                    vistos.add(prox)
                    anterior[prox] = atual
                    fila.append(prox)
        return []

    def componentes_fortes(self) -> list[list[str]]:
        """Componentes fortemente conexos (Tarjan); tamanho>1 ou self-loop = ciclo."""
        indice: dict[str, int] = {}
        menor: dict[str, int] = {}
        pilha: list[str] = []
        no_pilha: set[str] = set()
        contador = [0]
        saida: list[list[str]] = []

        def forte(no: str) -> None:
            indice[no] = menor[no] = contador[0]
            contador[0] += 1
            pilha.append(no)
            no_pilha.add(no)
            for prox, _k, _a in self._saem[no]:
                if prox not in indice:
                    forte(prox)
                    menor[no] = min(menor[no], menor[prox])
                elif prox in no_pilha:
                    menor[no] = min(menor[no], indice[prox])
            if menor[no] == indice[no]:
                componente: list[str] = []
                while True:
                    topo = pilha.pop()
                    no_pilha.discard(topo)
                    componente.append(topo)
                    if topo == no:
                        break
                saida.append(componente)

        for no in self._nos:
            if no not in indice:
                forte(no)
        return saida

    def ciclos(self) -> list[list[str]]:
        """Componentes cíclicos: tamanho>1 ou auto-aresta."""
        resultado = []
        for comp in self.componentes_fortes():
            if len(comp) > 1:
                resultado.append(sorted(comp))
            elif comp and any(d == comp[0] for d, _k, _a in self._saem[comp[0]]):
                resultado.append(comp)
        return resultado
