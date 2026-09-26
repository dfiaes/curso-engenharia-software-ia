"""B9: agente com estado tipado, budget, stop, checkpoint e retomada.

Sem LLM real: o ``ScriptedPlanner`` é explicitamente rotulado como simulado
localmente; o que está sob prova é o MECANISMO (estado, budget, trace,
checkpoint, idempotência), com tools reais do pacote.
"""

from pathlib import Path

import pytest

from capstone_lab.agent import AgentRunner, AgentState, ScriptedPlanner, ToolFn, default_tools
from capstone_lab.graph import CodeGraph
from capstone_lab.parsers import ParseResult, Relation
from capstone_lab.retrieval import Chunk, HybridIndex


def make_env() -> tuple[dict[str, ToolFn], HybridIndex, CodeGraph]:
    index = HybridIndex()
    index.add(Chunk("c1", "t1", "retrieval.py", 30, "busca hibrida bm25 ranking"))
    graph = CodeGraph()
    r = ParseResult(language="python", path="a.py")
    r.relations = [Relation("calls", "a.py", "helper", 4)]
    graph.add_file(r)
    tools = default_tools(index, graph, "t1")
    return tools, index, graph


def new_state() -> AgentState:
    return AgentState(goal="mapear helper", planner_label=ScriptedPlanner([]).label)


def test_full_run_records_real_trace_and_finishes() -> None:
    tools, _, _ = make_env()
    runner = AgentRunner(tools, max_steps=5)
    planner = ScriptedPlanner(["search:bm25 ranking", "callers:helper"])
    state = runner.run(new_state(), planner)
    assert state.status == "done"
    assert state.done == 2
    assert len(state.trace) == 2
    assert state.trace[0]["output"] == '["c1"]'  # resultado real da tool de busca
    assert state.trace[1]["output"] == '["a.py:4"]'
    assert all(e["planner"] == "scripted-simulated (sem LLM real)" for e in state.trace)


def test_step_budget_stops_execution() -> None:
    tools, _, _ = make_env()
    runner = AgentRunner(tools, max_steps=1)
    planner = ScriptedPlanner(["search:x", "callers:y", "callers:z"])
    state = runner.run(new_state(), planner)
    assert state.status == "budget_exceeded"
    assert state.done == 1  # o budget, não o plano, manda


def test_kill_and_resume_does_not_repeat_completed_steps(tmp_path: Path) -> None:
    tools, _, _ = make_env()
    steps = ["search:bm25 ranking", "callers:helper"]
    runner1 = AgentRunner(tools, max_steps=1)  # "morre" por budget após o 1º passo
    planner = ScriptedPlanner(steps)
    state = runner1.run(new_state(), planner)
    assert state.status == "budget_exceeded"
    ck = tmp_path / "ckpt.json"
    runner1.checkpoint(state, ck)

    # processo novo, budget novo: retoma do passo 2 sem repetir o 1º
    runner2 = AgentRunner(tools, max_steps=5)
    resumed = runner2.resume(ck, ScriptedPlanner(steps))
    assert resumed.status == "done"
    assert resumed.done == 2
    assert runner2.tool_invocations == 1  # nenhum efeito repetido
    assert resumed.results["search:bm25 ranking"] == '["c1"]'  # sobreviveu ao kill
    assert resumed.trace[1]["output"] == '["a.py:4"]'


def test_checkpoint_file_is_json_typed_state(tmp_path: Path) -> None:
    tools, _, _ = make_env()
    runner = AgentRunner(tools, max_steps=5)
    state = runner.run(new_state(), ScriptedPlanner(["search:bm25 ranking"]))
    ck = tmp_path / "ckpt.json"
    runner.checkpoint(state, ck)
    import json

    data = json.loads(ck.read_text(encoding="utf-8"))
    assert data["goal"] == "mapear helper"
    assert data["done"] == 1 and data["status"] == "done"


def test_unknown_tool_fails_loudly() -> None:
    tools, _, _ = make_env()
    runner = AgentRunner(tools, max_steps=3)
    with pytest.raises(KeyError, match="tool desconhecida"):
        runner.run(new_state(), ScriptedPlanner(["hack:agora"]))


def test_zero_budget_is_rejected() -> None:
    tools, _, _ = make_env()
    with pytest.raises(ValueError):
        AgentRunner(tools, max_steps=0)


def test_idempotent_resume_is_safe_to_replay(tmp_path: Path) -> None:
    tools, _, _ = make_env()
    runner = AgentRunner(tools, max_steps=5)
    state = runner.run(new_state(), ScriptedPlanner(["callers:helper"]))
    ck = tmp_path / "ck.json"
    runner.checkpoint(state, ck)
    before = runner.tool_invocations
    replayed = runner.resume(ck, ScriptedPlanner(["callers:helper"]))
    assert replayed.done == 1
    assert runner.tool_invocations == before  # replay de estado concluído: 0 chamadas
