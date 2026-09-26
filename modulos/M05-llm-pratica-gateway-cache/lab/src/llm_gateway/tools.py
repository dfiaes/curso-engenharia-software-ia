"""Tool loop com orçamento (lote M05).

O modelo emite JSON pedindo execução; SEU código executa, devolve o
resultado como mensagem e continua. O loop termina em resposta final ou
no teto de passos — sem teto, um modelo confuso itera para sempre à sua
custa. Erro de ferramenta é acionável: diz o que faltou, não só "falhou".
"""

from __future__ import annotations

from collections.abc import Callable
from dataclasses import dataclass

from llm_gateway.contract import ChatMessage, ChatRequest, Provider

ToolFn = Callable[[dict[str, object]], str]


@dataclass(frozen=True, slots=True)
class ToolDefinition:
    name: str
    description: str
    fn: ToolFn


class ToolBudgetExceeded(RuntimeError):
    """O loop atingiu o teto de passos sem resposta final."""


class ToolExecutionError(RuntimeError):
    """Ferramenta inexistente ou argumento inválido — com o motivo."""


def _run_tool(tools: dict[str, ToolDefinition], name: str, args: dict[str, object]) -> str:
    tool = tools.get(name)
    if tool is None:
        raise ToolExecutionError(
            f"ferramenta desconhecida: {name!r} (disponíveis: {sorted(tools)})"
        )
    if not isinstance(args, dict):
        raise ToolExecutionError(
            f"argumentos de {name!r} devem ser objeto, veio {type(args).__name__}"
        )
    try:
        return tool.fn(args)
    except (KeyError, TypeError, ValueError) as exc:
        raise ToolExecutionError(f"argumentos inválidos para {name!r}: {exc}") from exc


async def tool_loop(
    provider: Provider,
    request: ChatRequest,
    tools: tuple[ToolDefinition, ...],
    max_steps: int = 5,
) -> str:
    """Pede → executa → devolve, até `end_turn` ou o teto (AT-007/008)."""
    by_name = {tool.name: tool for tool in tools}
    messages = list(request.messages)
    for _step in range(max_steps):
        response = await provider.complete(
            ChatRequest(
                messages=tuple(messages),
                temperature=request.temperature,
                top_p=request.top_p,
                max_tokens=request.max_tokens,
                stop=request.stop,
                seed=request.seed,
            )
        )
        if response.finish_reason != "tool_use" or not response.tool_calls:
            return response.content
        for call in response.tool_calls:
            result = _run_tool(by_name, call.name, dict(call.arguments))
            messages.append(ChatMessage(role="assistant", content=""))
            messages.append(
                ChatMessage(role="tool", content=result, name=call.name, tool_call_id=call.id)
            )
    raise ToolBudgetExceeded(f"sem resposta final após {max_steps} passos")
