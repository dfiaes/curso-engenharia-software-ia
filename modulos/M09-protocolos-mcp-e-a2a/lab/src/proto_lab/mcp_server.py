"""Núcleo MCP: registros, despacho, escopo e capabilities (lote M09).

O servidor expõe tools, resources e prompts; o despacho valida versão,
escopo e capability ANTES de executar. Escopo vem do contexto (runtime),
nunca de argumento. Capability não declarada nunca é acionada — pedir é
violação, não fallback silencioso.
"""

from __future__ import annotations

import hashlib
import hmac
import time
from collections.abc import Callable
from dataclasses import dataclass, field
from typing import Any

from proto_lab import jsonrpc

PROTOCOL_VERSION = "2026-07-28"
STATE_TTL_S = 300.0
_STATE_SECRET = b"segredo-somente-local-do-lab"


@dataclass(frozen=True, slots=True)
class RequestContext:
    scopes: frozenset[str] = frozenset()
    capabilities: frozenset[str] = frozenset()
    principal: str = "local"
    cancelled: bool = False


@dataclass(frozen=True, slots=True)
class ToolDefinition:
    name: str
    description: str
    input_schema: dict[str, Any]
    required_scopes: frozenset[str] = frozenset()
    needs_capability: str | None = None
    needs_input: bool = False
    fn: Callable[[dict[str, Any], RequestContext], Any] | None = None


@dataclass(frozen=True, slots=True)
class ResourceDefinition:
    uri: str
    description: str
    fn: Callable[[RequestContext], str] | None = None


@dataclass(frozen=True, slots=True)
class PromptDefinition:
    name: str
    description: str
    template: str = ""


def _validar_args(schema: dict[str, Any], args: Any) -> str | None:
    """Validação mínima de schema: objeto, obrigatórios e tipos básicos."""
    if not isinstance(args, dict):
        return "argumentos devem ser objeto"
    props = schema.get("properties", {})
    for campo in schema.get("required", []):
        if campo not in args:
            return f"campo obrigatório ausente: {campo!r}"
    for campo, valor in args.items():
        esperado = props.get(campo, {}).get("type")
        if esperado == "string" and not isinstance(valor, str):
            return f"campo {campo!r} deve ser string"
        if esperado == "integer" and not isinstance(valor, int):
            return f"campo {campo!r} deve ser integer"
        if esperado == "number" and not isinstance(valor, (int, float)):
            return f"campo {campo!r} deve ser number"
        if esperado == "boolean" and not isinstance(valor, bool):
            return f"campo {campo!r} deve ser boolean"
    return None


def assinar_estado(payload: str) -> str:
    """MAC + timestamp: estado que volta pelas mãos do cliente."""
    ts = str(int(time.time()))
    mac = hmac.new(_STATE_SECRET, f"{ts}:{payload}".encode(), hashlib.sha256).hexdigest()
    return f"{ts}:{mac}:{payload}"


def verificar_estado(token: str) -> str | None:
    """Devolve o payload se íntegro e no TTL; senão None (rejeita)."""
    try:
        ts, mac, payload = token.split(":", 2)
    except ValueError:
        return None
    if abs(int(time.time()) - int(ts)) > STATE_TTL_S:
        return None
    esperado = hmac.new(_STATE_SECRET, f"{ts}:{payload}".encode(), hashlib.sha256).hexdigest()
    if not hmac.compare_digest(esperado, mac):
        return None
    return payload


class _ProtocolFail(Exception):
    """Falha mapeada para erro JSON-RPC (nunca exceção crua ao cliente)."""

    def __init__(self, code: int, message: str) -> None:
        super().__init__(message)
        self.code = code
        self.message = message


@dataclass(slots=True)
class MCPServer:
    """Servidor: núcleo puro, transporte fora (casca)."""

    name: str = "demo"
    tools: dict[str, ToolDefinition] = field(default_factory=dict)
    resources: dict[str, ResourceDefinition] = field(default_factory=dict)
    prompts: dict[str, PromptDefinition] = field(default_factory=dict)

    def registrar_tool(self, tool: ToolDefinition) -> None:
        self.tools[tool.name] = tool

    def registrar_resource(self, resource: ResourceDefinition) -> None:
        self.resources[resource.uri] = resource

    def registrar_prompt(self, prompt: PromptDefinition) -> None:
        self.prompts[prompt.name] = prompt

    def dispatch(self, mensagem: dict[str, Any], ctx: RequestContext) -> dict[str, Any]:
        """Despacha um método; resposta sempre correlacionada pelo `id`."""
        mid = mensagem.get("id")
        method = mensagem.get("method", "")
        params = mensagem.get("params", {})
        meta = params.get("_meta", {}) if isinstance(params, dict) else {}
        if meta.get("protocolVersion", PROTOCOL_VERSION) != PROTOCOL_VERSION:
            return self._erro(mid, jsonrpc.PROTOCOL_VERSION_MISMATCH, "versão inválida")
        handler = {
            "tools/list": self._tools_list,
            "tools/call": self._tools_call,
            "resources/list": self._resources_list,
            "resources/read": self._resources_read,
            "prompts/list": self._prompts_list,
            "prompts/get": self._prompts_get,
        }.get(method)
        if handler is None:
            return self._erro(mid, jsonrpc.METHOD_NOT_FOUND, f"método desconhecido: {method}")
        try:
            return {"jsonrpc": "2.0", "id": mid, "result": handler(params, ctx)}
        except _ProtocolFail as exc:
            return self._erro(mid, exc.code, exc.message)

    @staticmethod
    def _erro(mid: object, code: int, message: str) -> dict[str, Any]:
        return {"jsonrpc": "2.0", "id": mid, "error": {"code": code, "message": message}}

    def _tools_list(self, _params: dict[str, Any], _ctx: RequestContext) -> dict[str, Any]:
        return {
            "tools": [
                {
                    "name": t.name,
                    "description": t.description,
                    "inputSchema": t.input_schema,
                }
                for t in self.tools.values()
            ]
        }

    def _tools_call(self, params: dict[str, Any], ctx: RequestContext) -> dict[str, Any]:
        nome = params.get("name", "")
        args = params.get("arguments", {})
        tool = self.tools.get(nome)
        if tool is None:
            raise _ProtocolFail(jsonrpc.METHOD_NOT_FOUND, f"tool desconhecida: {nome}")
        if erro := _validar_args(tool.input_schema, args):
            raise _ProtocolFail(jsonrpc.INVALID_PARAMS, erro)
        if not tool.required_scopes <= set(ctx.scopes):
            raise _ProtocolFail(jsonrpc.FORBIDDEN, f"escopo insuficiente para {nome}")
        if tool.needs_capability is not None and tool.needs_capability not in ctx.capabilities:
            raise _ProtocolFail(
                jsonrpc.CAPABILITY_DENIED, f"capability ausente: {tool.needs_capability}"
            )
        if ctx.cancelled:
            raise _ProtocolFail(-32003, "chamada cancelada antes de executar")
        if tool.needs_input and "input_responses" not in params:
            estado = assinar_estado(f"{nome}:{sorted(map(str, args.items()))}")
            return {
                "resultType": "input_required",
                "state": estado,
                "pedido": f"informe o complemento para {nome}",
            }
        if tool.needs_input:
            estado = params.get("state", "")
            if verificar_estado(str(estado)) is None:
                raise _ProtocolFail(jsonrpc.FORBIDDEN, "estado retomado inválido ou expirado")
        assert tool.fn is not None
        return {"content": [{"type": "text", "text": str(tool.fn(dict(args), ctx))}]}

    def _resources_list(self, _params: dict[str, Any], _ctx: RequestContext) -> dict[str, Any]:
        return {
            "resources": [
                {"uri": r.uri, "description": r.description} for r in self.resources.values()
            ]
        }

    def _resources_read(self, params: dict[str, Any], ctx: RequestContext) -> dict[str, Any]:
        uri = params.get("uri", "")
        resource = self.resources.get(uri)
        if resource is None or resource.fn is None:
            raise _ProtocolFail(jsonrpc.METHOD_NOT_FOUND, f"resource desconhecido: {uri}")
        return {"contents": [{"uri": uri, "text": resource.fn(ctx)}]}

    def _prompts_list(self, _params: dict[str, Any], _ctx: RequestContext) -> dict[str, Any]:
        return {
            "prompts": [
                {"name": p.name, "description": p.description} for p in self.prompts.values()
            ]
        }

    def _prompts_get(self, params: dict[str, Any], _ctx: RequestContext) -> dict[str, Any]:
        nome = params.get("name", "")
        prompt = self.prompts.get(nome)
        if prompt is None:
            raise _ProtocolFail(jsonrpc.METHOD_NOT_FOUND, f"prompt desconhecido: {nome}")
        texto = prompt.template
        for chave, valor in params.get("arguments", {}).items():
            texto = texto.replace("{{" + chave + "}}", str(valor))
        return {"messages": [{"role": "user", "content": texto}]}
