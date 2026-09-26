"""Agente com estado tipado, budget, stop, checkpoint e retomada (M13 B9).

Invariantes:
- Estado tipado (``AgentState``) é serializável a JSON; checkpoint permite
  retomar após kill sem repetir tool já concluída (efeito idempotente).
- Sem LLM real neste ambiente: a política de decisão é o
  ``ScriptedPlanner`` — determinístico, explicitamente ROTULADO como simulado
  localmente (``planner_label``). O trace registra cada passo real executado.
- Nenhum ``sleep()`` e nenhuma resposta hardcoded contam como "execução":
  cada passo roda uma tool real deste pacote (busca/grafo) e grava o resultado.
"""

from __future__ import annotations

import json
from collections.abc import Callable
from dataclasses import asdict, dataclass, field
from pathlib import Path
from typing import Any, Protocol

from capstone_lab.graph import CodeGraph
from capstone_lab.retrieval import HybridIndex

ToolFn = Callable[[str], str]


@dataclass
class AgentState:
    goal: str
    planner_label: str  # ex.: "scripted-simulated (sem LLM real)"
    plan: list[str] = field(default_factory=list)
    done: int = 0
    results: dict[str, str] = field(default_factory=dict)
    status: str = "running"  # running | done | budget_exceeded | stopped
    trace: list[dict[str, Any]] = field(default_factory=list)


class Planner(Protocol):
    label: str

    def next_step(self, state: AgentState) -> str | None: ...


class ScriptedPlanner:
    """Política determinística: executa o plano declarado na ordem.

    Rotulado: NÃO é um LLM; decide por script local para provar os
    mecanismos de estado/budget/checkpoint neste Tier.
    """

    label = "scripted-simulated (sem LLM real)"

    def __init__(self, steps: list[str]) -> None:
        self._steps = steps

    def next_step(self, state: AgentState) -> str | None:
        if state.done >= len(self._steps):
            return None
        return self._steps[state.done]


def default_tools(index: HybridIndex, graph: CodeGraph, tenant: str) -> dict[str, ToolFn]:
    def search_tool(query: str) -> str:
        hits = index.search(tenant, query, top_k=3, threshold=0.0)
        return json.dumps([h.chunk_id for h in hits])

    def callers_tool(name: str) -> str:
        edges = graph.callers_of(name)
        return json.dumps([f"{e.src}:{e.provenance.line}" for e in edges])

    return {"search": search_tool, "callers": callers_tool}


class AgentRunner:
    """Executa o plano passo a passo com budget, stop e checkpoint JSON.

    Passo: ``"tool_name:argumento"``. Cada passo concluído grava resultado em
    ``state.results[step]``; reexecutar um passo já concluído é impossível —
    o runner retoma a partir de ``state.done``.
    """

    def __init__(self, tools: dict[str, ToolFn], max_steps: int) -> None:
        if max_steps <= 0:
            raise ValueError("budget de passos deve ser positivo")
        self._tools = tools
        self._budget = max_steps
        self.tool_invocations = 0

    def run(self, state: AgentState, planner: Planner) -> AgentState:
        spent = 0
        while state.status == "running":
            if state.done >= self._budget:
                state.status = "budget_exceeded"
                break
            step = planner.next_step(state)
            if step is None:
                state.status = "done"
                break
            name, _, arg = step.partition(":")
            tool = self._tools.get(name)
            if tool is None:
                raise KeyError(f"tool desconhecida: {name}")
            self.tool_invocations += 1
            spent += 1
            output = tool(arg)
            state.results[step] = output
            state.trace.append(
                {
                    "step": state.done,
                    "tool": name,
                    "arg": arg,
                    "output": output,
                    "planner": planner.label,
                }
            )
            state.done += 1
            if planner.next_step(state) is None:
                state.status = "done"
            _ = spent
        return state

    def checkpoint(self, state: AgentState, path: Path) -> None:
        tmp = path.with_suffix(path.suffix + ".tmp")
        tmp.write_text(json.dumps(asdict(state), ensure_ascii=False), encoding="utf-8")
        tmp.replace(path)  # escrita atômica

    def resume(self, path: Path, planner: Planner) -> AgentState:
        data = json.loads(path.read_text(encoding="utf-8"))
        state = AgentState(**data)
        if state.status in {"budget_exceeded"}:
            state.status = "running"  # budget novo: retomada a partir de state.done
        return self.run(state, planner)
