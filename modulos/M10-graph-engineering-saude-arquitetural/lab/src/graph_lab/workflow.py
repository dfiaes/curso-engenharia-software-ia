"""Workflow durável: checkpoint por passo, resume e HITL (lote M10).

Nós são funções puras-ish (estado → patch); arestas fixas ou
condicionais; fan-out com reducers explícitos. O checkpointer grava um
snapshot JSON por passo, indexado por `thread_id` estável — nova
instância sobre o mesmo arquivo retoma de onde parou. Efeito repetido
após kill denuncia nó não idempotente (o teste conta).
"""

from __future__ import annotations

import json
from collections.abc import Callable
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Literal

Reducer = Literal["overwrite", "add"]
Patch = dict[str, Any]


@dataclass(frozen=True, slots=True)
class Pausa:
    payload: dict[str, Any]


NoFn = Callable[[dict[str, Any]], Patch | Pausa]


@dataclass(slots=True)
class Workflow:
    """Grafo de execução com persistência em arquivo."""

    nos: dict[str, NoFn] = field(default_factory=dict)
    arestas: dict[str, str | Callable[[dict[str, Any]], str]] = field(default_factory=dict)
    reducers: dict[str, Reducer] = field(default_factory=dict)
    inicio: str = "inicio"
    arquivo: Path = Path("checkpoints.jsonl")

    def add_no(self, nome: str, fn: NoFn) -> None:
        """Registra um nó (função testável isoladamente)."""
        self.nos[nome] = fn

    def add_aresta(self, origem: str, destino: str | Callable[[dict[str, Any]], str]) -> None:
        """Liga origem ao próximo (fixo ou função que decide pelo estado)."""
        self.arestas[origem] = destino

    def set_reducer(self, campo: str, modo: Reducer) -> None:
        """Reducer explícito; default é sobrescrever (perigoso em fan-out)."""
        self.reducers[campo] = modo

    def _fundir(self, estado: dict[str, Any], patch: Patch) -> dict[str, Any]:
        novo = dict(estado)
        for campo, valor in patch.items():
            if campo == "__fanout__":
                for sub in valor:
                    novo = self._fundir(novo, sub)
            elif self.reducers.get(campo, "overwrite") == "add" and isinstance(
                novo.get(campo), list
            ):
                novo[campo] = [*novo[campo], *(valor if isinstance(valor, list) else [valor])]
            else:
                novo[campo] = valor
        return novo

    def _gravar(
        self, thread_id: str, no: str, estado: dict[str, Any], pausado: bool = False
    ) -> None:
        with self.arquivo.open("a", encoding="utf-8") as fh:
            fh.write(
                json.dumps({"thread": thread_id, "no": no, "estado": estado, "pausado": pausado})
                + "\n"
            )

    def _historico(self, thread_id: str) -> list[dict[str, Any]]:
        if not self.arquivo.exists():
            return []
        feitos = []
        for linha in self.arquivo.read_text(encoding="utf-8").splitlines():
            if not linha.strip():
                continue
            registro = json.loads(linha)
            if registro["thread"] == thread_id:
                feitos.append(registro)
        return feitos

    def _proximo(self, no: str, estado: dict[str, Any]) -> str | None:
        destino = self.arestas.get(no)
        if destino is None:
            return None
        return destino(estado) if callable(destino) else destino

    def run(self, thread_id: str, entrada: dict[str, Any]) -> dict[str, Any]:
        """Executa do início (thread nova) com o estado de entrada."""
        return self._continuar(thread_id, self.inicio, dict(entrada))

    def continuar_de(self, thread_id: str, entrada: dict[str, Any] | None = None) -> dict[str, Any]:
        """Continua do último checkpoint após queda (outra instância, mesmo arquivo).

        Queda no meio do nó não deixa checkpoint dele: sem histórico,
        recomeça do início com a `entrada` (o chamador a possui).
        """
        feitos = self._historico(thread_id)
        if not feitos:
            return self._continuar(thread_id, self.inicio, dict(entrada or {}))
        ultimo = feitos[-1]
        return self._continuar(thread_id, ultimo.get("no_proximo"), dict(ultimo["estado"]))

    def resume(self, thread_id: str, valor: Any = None) -> dict[str, Any]:
        """Retoma thread pausada com valor externo (HITL), em qualquer instância."""
        feitos = self._historico(thread_id)
        if not feitos or feitos[-1].get("pausado") is not True:
            raise KeyError(f"thread sem pausa para retomar: {thread_id}")
        ultimo = feitos[-1]
        estado = dict(ultimo["estado"])
        estado["__retomada__"] = valor
        return self._continuar(thread_id, ultimo["no"], estado)

    def _continuar(self, thread_id: str, no: str | None, estado: dict[str, Any]) -> dict[str, Any]:
        atual = no
        while atual is not None:
            patch = self.nos[atual](dict(estado))
            if isinstance(patch, Pausa):
                self._gravar(thread_id, atual, estado, pausado=True)
                return {"__pausado__": patch.payload, "estado": estado}
            estado = self._fundir(estado, patch)
            proximo = self._proximo(atual, estado)
            self._gravar(thread_id, atual, {**estado, "no_proximo": proximo})
            atual = proximo
        return estado
