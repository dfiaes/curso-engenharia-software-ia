"""Subagente como ferramenta: contexto próprio, resumo de volta (lote M08).

Para o coordenador, o subagente é só mais uma ferramenta com contrato:
entrada estruturada, orçamento próprio MENOR que o da operação, saída
resumida (nunca o conteúdo lido). Sem orçamento próprio, um subagente
consome a operação inteira.
"""

from __future__ import annotations

from collections.abc import Awaitable, Callable

from agent_lab.loop import Execucao, Orcamento, investigar
from agent_lab.policy import Final, ScriptedPolicy, ToolCall
from agent_lab.tools import ToolDefinition

InvestigateFn = Callable[
    [str, ScriptedPolicy, dict[str, ToolDefinition], Orcamento | None], Awaitable[Execucao]
]


async def investigar_simbolo(
    simbolo: str,
    objetivo: str,
    investigar_fn: InvestigateFn,
    tools: dict[str, ToolDefinition],
    orc: Orcamento | None = None,
) -> str:
    """Roda investigação aninhada e devolve só o resumo (≤1500 chars)."""
    budget = orc or Orcamento(max_passos=8, max_custo_usd=0.20, max_segundos=60.0)
    roteiro = ScriptedPolicy(
        steps=[
            ToolCall(name="buscar_simbolo", arguments={"simbolo": simbolo, "limite": 20}),
            Final(f"resumo: {simbolo} — {objetivo} (fatos com arquivo:linha)"),
        ]
    )
    execucao = await investigar_fn(
        f"Investigue {simbolo}. Objetivo: {objetivo}.", roteiro, tools, budget
    )
    prefixo = "" if not execucao.parcial else f"[PARCIAL: {execucao.parada}] "
    return (prefixo + execucao.resposta)[:1500]


async def investigar_padrao(
    pergunta: str,
    roteiro: ScriptedPolicy,
    tools: dict[str, ToolDefinition],
    orc: Orcamento | None = None,
) -> Execucao:
    """Atalho tipado para o loop real (usado nos testes)."""
    return await investigar(pergunta, roteiro, tools, orc)
