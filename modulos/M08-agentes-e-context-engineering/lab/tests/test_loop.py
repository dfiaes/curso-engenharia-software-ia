"""Loop: 7 paradas, parcial honesta e HITL (AT-008/009/010)."""

from __future__ import annotations

from pathlib import Path

from agent_lab.loop import Orcamento, investigar
from agent_lab.policy import Final, ScriptedPolicy, ToolCall
from agent_lab.tools import ToolContext, ToolDefinition, make_tools

REPO = Path(__file__).resolve().parent.parent / "fixture_repo"


def _tools(tmp_path: Path) -> dict[str, ToolDefinition]:
    ctx = ToolContext(repo_root=REPO, memory_file=tmp_path / "notas.md")
    return make_tools(ctx)


async def test_sucesso_com_ferramentas(tmp_path: Path) -> None:
    tools = _tools(tmp_path)
    roteiro = ScriptedPolicy(
        steps=[
            ToolCall(name="buscar_simbolo", arguments={"simbolo": "calcular_total"}),
            ToolCall(
                name="notas_registrar",
                arguments={"fato": "calcular_total soma com desconto", "evidencia": "loja.py:12"},
            ),
            Final("calcular_total soma itens com desconto (loja.py:12)"),
        ]
    )
    ex = await investigar("o que faz calcular_total?", roteiro, tools)
    assert ex.parada == "sucesso"
    assert "loja.py:12" in ex.resposta
    assert ex.fatos == ["calcular_total soma com desconto"]
    assert ex.passos == 2


async def test_orcamento_passos_devolve_parcial(tmp_path: Path) -> None:
    tools = _tools(tmp_path)
    roteiro = ScriptedPolicy(
        steps=[
            ToolCall(
                name="notas_registrar",
                arguments={"fato": "validar checa None", "evidencia": "loja.py:5"},
            ),
            ToolCall(name="buscar_simbolo", arguments={"simbolo": "x"}),
            ToolCall(name="buscar_simbolo", arguments={"simbolo": "y"}),
        ]
    )
    ex = await investigar("q?", roteiro, tools, Orcamento(max_passos=2))
    assert ex.parada == "orcamento_passos"
    assert "RESPOSTA PARCIAL" in ex.resposta and "validar checa None" in ex.resposta


async def test_orcamento_custo(tmp_path: Path) -> None:
    tools = _tools(tmp_path)
    roteiro = ScriptedPolicy(steps=[ToolCall(name="buscar_simbolo", arguments={"simbolo": "x"})])
    ex = await investigar("q?", roteiro, tools, Orcamento(max_passos=10, max_custo_usd=0.005))
    assert ex.parada == "orcamento_custo"


async def test_loop_esteril_detectado(tmp_path: Path) -> None:
    tools = _tools(tmp_path)
    chamada = ToolCall(name="buscar_simbolo", arguments={"simbolo": "x"})
    roteiro = ScriptedPolicy(steps=[chamada, chamada, chamada, chamada])
    ex = await investigar("q?", roteiro, tools, Orcamento(max_passos=10, max_repeticoes=3))
    assert ex.parada == "loop_esteril"
    assert "buscar_simbolo" in ex.resposta


async def test_ferramenta_inexistente_e_irrecuperavel(tmp_path: Path) -> None:
    tools = _tools(tmp_path)
    chamada = ToolCall(name="nao_existe", arguments={})
    roteiro = ScriptedPolicy(steps=[chamada, chamada])
    ex = await investigar("q?", roteiro, tools)
    assert ex.parada == "erro_irrecuperavel"


async def test_hitl_pausa_escrita(tmp_path: Path) -> None:
    tools = _tools(tmp_path)
    roteiro = ScriptedPolicy(
        steps=[ToolCall(name="notas_registrar", arguments={"fato": "f", "evidencia": "e"})]
    )
    ex = await investigar(
        "q?", roteiro, tools, exige_aprovacao=lambda nome: nome == "notas_registrar"
    )
    assert ex.parada == "requer_humano"
    assert "notas_registrar" in ex.resposta
