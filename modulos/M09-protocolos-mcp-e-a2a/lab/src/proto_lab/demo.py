"""Servidor de demonstração: índice falso com escopo do runtime (lote M09).

Três tools (buscar, ler, impacto), um resource e um prompt. O escopo
(tenant) vem do contexto — nunca de argumento — e a tool sensível exige
escopo de escrita mais capability declarada.
"""

from __future__ import annotations

from proto_lab.mcp_server import (
    MCPServer,
    PromptDefinition,
    RequestContext,
    ResourceDefinition,
    ToolDefinition,
)

SIMBOLOS = {
    "calcular_total": [("loja.py", 11, "def calcular_total")],
    "fechar_pedido": [("loja.py", 16, "def fechar_pedido")],
}


def _buscar(args: dict[str, object], _ctx: RequestContext) -> object:
    simbolo = str(args.get("simbolo", ""))
    achados = SIMBOLOS.get(simbolo, [])
    if not achados:
        return {"erro_acionavel": f"nenhuma ocorrência de {simbolo!r}; verifique a grafia"}
    return [
        {"caminho": caminho, "linha_ini": linha, "simbolo": simbolo, "trecho": trecho}
        for caminho, linha, trecho in achados
    ]


def _ler(args: dict[str, object], _ctx: RequestContext) -> object:
    return {"caminho": args.get("caminho", ""), "linhas": "1-20", "texto": "# trecho"}


def _impacto(args: dict[str, object], ctx: RequestContext) -> object:
    return {"simbolo": args.get("simbolo", ""), "tenant": sorted(ctx.scopes), "risco": "medio"}


def montar_servidor() -> MCPServer:
    """Monta o servidor demo com 3 tools, 1 resource e 1 prompt."""
    servidor = MCPServer(name="demo-indice")
    servidor.registrar_tool(
        ToolDefinition(
            name="repo_buscar_simbolo",
            description="Localiza símbolo. Use com nome exato.",
            input_schema={
                "type": "object",
                "properties": {"simbolo": {"type": "string"}, "limite": {"type": "integer"}},
                "required": ["simbolo"],
            },
            fn=_buscar,
        )
    )
    servidor.registrar_tool(
        ToolDefinition(
            name="repo_ler_trecho",
            description="Lê trecho de arquivo.",
            input_schema={
                "type": "object",
                "properties": {"caminho": {"type": "string"}},
                "required": ["caminho"],
            },
            fn=_ler,
        )
    )
    servidor.registrar_tool(
        ToolDefinition(
            name="repo_impacto",
            description="Impacto de mudança. Exige escopo de escrita.",
            input_schema={
                "type": "object",
                "properties": {"simbolo": {"type": "string"}},
                "required": ["simbolo"],
            },
            required_scopes=frozenset({"repo:escrever"}),
            fn=_impacto,
        )
    )
    servidor.registrar_tool(
        ToolDefinition(
            name="repo_perguntar_usuario",
            description="Pede complemento ao usuário (capability interativa).",
            input_schema={"type": "object", "properties": {}},
            needs_capability="interacao",
            needs_input=True,
            fn=lambda args, ctx: {"ok": True},
        )
    )
    servidor.registrar_resource(
        ResourceDefinition(
            uri="repo://demo/arquitetura",
            description="Mapa de arquitetura.",
            fn=lambda _ctx: "# Arquitetura demo",
        )
    )
    servidor.registrar_prompt(
        PromptDefinition(
            name="analisar-impacto",
            description="Fluxo de análise de impacto.",
            template="Analise o impacto de {{simbolo}} citando arquivo e linhas.",
        )
    )
    return servidor
