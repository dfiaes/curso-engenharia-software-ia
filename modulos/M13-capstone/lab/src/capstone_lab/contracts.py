"""Contratos OpenAPI, servidor MCP local e fluxo A2A mínimo (M13 B10).

Invariantes:
- A especificação OpenAPI é dado versionado congelado em
  ``fixtures/contracts/openapi.v1.golden.json``; qualquer breaking change
  é detectada por comparação estrutural (falha de teste, não convenção).
- Problem Details (RFC 9457) padroniza erros; o validador interno checa os
  campos obrigatórios sem dependência externa.
- MCP local: JSON-RPC 2.0 com framing ``Content-Length`` (LSP-style) sobre
  bytes, servidor em processo — sem rede real. A2A mínimo: Agent Card +
  ciclo de vida de task (submitted → working → completed/failed).
"""

from __future__ import annotations

import json
import uuid
from collections.abc import Callable
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

OPENAPI_SPEC: dict[str, Any] = {
    "openapi": "3.1.0",
    "info": {"title": "Cartógrafo API", "version": "1.0.0"},
    "paths": {
        "/v1/search": {
            "get": {
                "summary": "busca com ACL e abstenção",
                "parameters": [
                    {"name": "q", "in": "query", "required": True, "schema": {"type": "string"}},
                    {"name": "cursor", "in": "query", "schema": {"type": "string"}},
                    {"name": "limit", "in": "query", "schema": {"type": "integer", "maximum": 100}},
                ],
                "responses": {
                    "200": {
                        "description": "página de hits",
                        "content": {
                            "application/json": {
                                "schema": {"$ref": "#/components/schemas/SearchPage"}
                            }
                        },
                    },
                    "404": {
                        "description": "abstenção",
                        "content": {
                            "application/problem+json": {
                                "schema": {"$ref": "#/components/schemas/ProblemDetails"}
                            }
                        },
                    },
                },
            }
        },
        "/v1/jobs": {
            "post": {
                "summary": "cria job idempotente",
                "responses": {
                    "202": {"description": "job aceito"},
                    "422": {
                        "description": "payload inválido",
                        "content": {
                            "application/problem+json": {
                                "schema": {"$ref": "#/components/schemas/ProblemDetails"}
                            }
                        },
                    },
                },
            }
        },
    },
    "components": {
        "schemas": {
            "SearchPage": {
                "type": "object",
                "required": ["items", "next_cursor"],
                "properties": {
                    "items": {"type": "array"},
                    "next_cursor": {"type": ["string", "null"]},
                },
            },
            "ProblemDetails": {
                "type": "object",
                "required": ["type", "title", "status", "detail", "instance"],
                "properties": {
                    "type": {"type": "string"},
                    "title": {"type": "string"},
                    "status": {"type": "integer"},
                    "detail": {"type": "string"},
                    "instance": {"type": "string"},
                },
            },
        }
    },
}


def make_problem(status: int, title: str, detail: str, instance: str) -> dict[str, Any]:
    return {
        "type": "about:blank",
        "title": title,
        "status": status,
        "detail": detail,
        "instance": instance,
    }


def validate_problem_details(body: dict[str, Any]) -> list[str]:
    """Validação mínima RFC 9457 sem dependência externa; retorna violações."""
    missing = [k for k in ("type", "title", "status", "detail", "instance") if k not in body]
    errors = [f"campo ausente: {k}" for k in missing]
    if "status" in body and not isinstance(body["status"], int):
        errors.append("status deve ser inteiro")
    return errors


def openapi_breaking_diffs(current: dict[str, Any], golden_path: Path) -> list[str]:
    """Compara com a spec congelada; diferença = breaking change detectada."""
    golden = json.loads(golden_path.read_text(encoding="utf-8"))
    diffs: list[str] = []
    if current != golden:
        diffs.append("OPENAPI_SPEC diverge de openapi.v1.golden.json (breaking change)")
    return diffs


# ------------------------------ MCP local (JSON-RPC 2.0, sem rede) ----------


def encode_frame(message: dict[str, Any]) -> bytes:
    body = json.dumps(message, ensure_ascii=False).encode("utf-8")
    return f"Content-Length: {len(body)}\r\n\r\n".encode() + body


def decode_frames(buffer: bytes) -> tuple[list[dict[str, Any]], bytes]:
    """Extrai mensagens completas; devolve também o restante não processado."""
    messages: list[dict[str, Any]] = []
    while (sep := buffer.find(b"\r\n\r\n")) != -1:
        header, rest = buffer[:sep].decode(), buffer[sep + 4 :]
        length = int(header.split(":", 1)[1].strip())
        if len(rest) < length:
            break
        messages.append(json.loads(rest[:length]))
        buffer = rest[length:]
    return messages, buffer


class McpServer:
    """Servidor MCP mínimo em processo: initialize, tools/list, tools/call."""

    def __init__(self, tools: dict[str, Callable[[dict[str, Any]], Any]]) -> None:
        self._tools = tools
        self.initialized = False

    def handle(self, request: dict[str, Any]) -> dict[str, Any]:
        rid = request.get("id")
        if request.get("jsonrpc") != "2.0":
            return {
                "jsonrpc": "2.0",
                "id": rid,
                "error": {"code": -32600, "message": "Invalid Request"},
            }
        method = request.get("method")
        if method == "initialize":
            self.initialized = True
            return {
                "jsonrpc": "2.0",
                "id": rid,
                "result": {"protocolVersion": "2025-06-18", "capabilities": {"tools": {}}},
            }
        if method == "tools/list":
            return {
                "jsonrpc": "2.0",
                "id": rid,
                "result": {"tools": [{"name": n} for n in sorted(self._tools)]},
            }
        if method == "tools/call":
            params = request.get("params") or {}
            fn = self._tools.get(params.get("name", ""))
            if fn is None:
                return {
                    "jsonrpc": "2.0",
                    "id": rid,
                    "error": {"code": -32601, "message": "ferramenta não encontrada"},
                }
            result = fn(params.get("arguments", {}))
            return {
                "jsonrpc": "2.0",
                "id": rid,
                "result": {"content": [{"type": "text", "text": json.dumps(result)}]},
            }
        return {
            "jsonrpc": "2.0",
            "id": rid,
            "error": {"code": -32601, "message": "method not found"},
        }


# ------------------------------ A2A mínimo (local) --------------------------


@dataclass
class A2aTask:
    id: str
    status: str  # submitted | working | completed | failed
    message: dict[str, Any]
    artifacts: list[dict[str, Any]] = field(default_factory=list)


class A2aHost:
    """Fluxo A2A mínimo: Agent Card + tasks com ciclo de vida explícito."""

    def agent_card(self) -> dict[str, Any]:
        return {
            "name": "cartografo",
            "version": "1.0.0",
            "capabilities": {"streaming": False},
            "skills": [{"id": "search"}, {"id": "callers"}],
        }

    def submit(self, message: dict[str, Any]) -> A2aTask:
        return A2aTask(id=str(uuid.uuid4()), status="submitted", message=message)

    def run(self, task: A2aTask, handler: Callable[[dict[str, Any]], Any]) -> A2aTask:
        if task.status != "submitted":
            raise ValueError(f"task já processada: {task.status}")
        task.status = "working"
        try:
            result = handler(task.message)
        except Exception as exc:
            task.status = "failed"
            task.artifacts.append({"type": "error", "detail": str(exc)})
            return task
        task.status = "completed"
        task.artifacts.append({"type": "result", "data": result})
        return task
