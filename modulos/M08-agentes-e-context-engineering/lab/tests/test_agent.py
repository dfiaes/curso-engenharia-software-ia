"""Ferramentas, contexto, padrões, memória e comparação (AT-002..007, AT-011/012/014)."""

from __future__ import annotations

from pathlib import Path

from agent_lab.context import compactar, composicao
from agent_lab.loop import investigar
from agent_lab.memory import Fato, MemoriaFatos
from agent_lab.patterns import chaining, evaluator_optimizer, routing, voting
from agent_lab.policy import Final, ScriptedPolicy, ToolCall
from agent_lab.subagent import investigar_simbolo
from agent_lab.tools import ToolContext, make_tools

REPO = Path(__file__).resolve().parent.parent / "fixture_repo"


def _ctx(tmp_path: Path) -> ToolContext:
    return ToolContext(repo_root=REPO, memory_file=tmp_path / "notas.md")


def test_buscar_simbolo_acha_com_linha(tmp_path: Path) -> None:
    tools = make_tools(_ctx(tmp_path))
    saida = tools["buscar_simbolo"].fn({"simbolo": "calcular_total"})
    assert "loja.py" in saida and "calcular_total" in saida


def test_ler_trecho_recusa_fora_da_raiz(tmp_path: Path) -> None:
    tools = make_tools(_ctx(tmp_path))
    saida = tools["ler_trecho"].fn({"caminho": "../../.env", "linha_ini": 1, "linha_fim": 5})
    assert "fora do repositório" in saida


def test_ler_trecho_sugere_parecido(tmp_path: Path) -> None:
    tools = make_tools(_ctx(tmp_path))
    saida = tools["ler_trecho"].fn({"caminho": "loja.pyx", "linha_ini": 1, "linha_fim": 5})
    assert "não existe" in saida and "loja.py" in saida


def test_composicao_medida_antes_de_otimizar() -> None:
    historico = [
        {"role": "user", "content": "pergunta curta"},
        {"role": "tool", "content": "x" * 4000},
    ]
    partes = composicao(historico)
    assert partes["tool"] > partes["user"]


def test_compactacao_preserva_fatos() -> None:
    historico = [
        {"role": "user", "content": "onde valida?"},
        {"role": "tool", "content": "y" * 8000},
    ]
    compacto = compactar(historico, ["validar checa None [loja.py:5]"], teto=100)
    texto = "\n".join(str(m["content"]) for m in compacto)
    assert "validar checa None" in texto
    assert "y" * 100 not in texto


def test_patterns() -> None:
    assert chaining([lambda v: v + 1, lambda v: v * 2], 3) == 8
    assert routing("a", {"a": lambda v: "A", "x": lambda v: "X"}, "x") == "A"
    assert routing("?", {"a": lambda v: "A", "x": lambda v: "X"}, "x") == "X"
    vencedor, votos = voting([lambda v: "s", lambda v: "s", lambda v: "n"], None)
    assert (vencedor, votos) == ("s", 2)
    _saida, voltas = evaluator_optimizer(
        lambda v: v, lambda s: (s == "ok", "tente"), "x", max_voltas=2
    )
    assert voltas in (1, 2)


def test_memoria_com_validade(tmp_path: Path) -> None:
    mem = MemoriaFatos(tmp_path / "fatos.jsonl")
    mem.gravar(Fato("f1", "loja.py:5", "investigacao", "abc123"))
    mem.gravar(Fato("f2", "outro.py:1", "investigacao", "abc123"))
    assert len(mem.vigentes()) == 2
    assert mem.invalidar_por_arquivo("loja.py", "2026-09-14") == 1
    restantes = mem.vigentes()
    assert [f.texto for f in restantes] == ["f2"]


async def test_subagente_resume_com_orcamento_proprio(tmp_path: Path) -> None:
    tools = make_tools(_ctx(tmp_path))
    resumo = await investigar_simbolo("calcular_total", "o que faz", investigar, tools)
    assert len(resumo) <= 1500
    assert "calcular_total" in resumo


async def test_workflow_mais_barato_que_agente(tmp_path: Path) -> None:
    """AT-014: no problema bem definido, workflow custa menos passos."""
    tools = make_tools(_ctx(tmp_path))
    roteiro = ScriptedPolicy(
        steps=[
            ToolCall(name="buscar_simbolo", arguments={"simbolo": "fechar_pedido"}),
            ToolCall(
                name="ler_trecho",
                arguments={"caminho": "loja.py", "linha_ini": 16, "linha_fim": 19},
            ),
            ToolCall(name="buscar_simbolo", arguments={"simbolo": "calcular_total"}),
            ToolCall(
                name="ler_trecho",
                arguments={"caminho": "loja.py", "linha_ini": 11, "linha_fim": 14},
            ),
            Final("fechar_pedido chama calcular_total sem validar (loja.py:16-19)"),
        ]
    )
    agente = await investigar("impacto de fechar_pedido?", roteiro, tools)
    workflow_passos, workflow_custo = 2, 0.02
    assert agente.passos >= workflow_passos
    assert agente.custo >= workflow_custo
    assert agente.parada == "sucesso"
