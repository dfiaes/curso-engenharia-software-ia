"""JSON-RPC 2.0: o envelope do protocolo (lote M09).

Objeto com `jsonrpc: "2.0"`, `method`, `params` e `id` para correlacionar
pedido e resposta. Sem `id` é notificação (sem resposta). Erros via
objeto `error` com `code`/`message`; faixas reservadas abaixo.
"""

from __future__ import annotations

import json
from typing import Any

METHOD_NOT_FOUND = -32601
INVALID_PARAMS = -32602
PROTOCOL_VERSION_MISMATCH = -32000
FORBIDDEN = -32001
CAPABILITY_DENIED = -32002
HEADER_MISMATCH = -32020


def encode_request(method: str, params: dict[str, Any], id: int | str) -> str:
    """Uma linha JSON-RPC pronta para o transporte."""
    return json.dumps({"jsonrpc": "2.0", "id": id, "method": method, "params": params})


def encode_response(id: int | str, result: Any) -> str:
    """Resposta de sucesso correlacionada pelo `id`."""
    return json.dumps({"jsonrpc": "2.0", "id": id, "result": result})


def encode_error(id: object, code: int, message: str) -> str:
    """Erro correlacionado (`id` pode ser nulo em parse falho)."""
    return json.dumps({"jsonrpc": "2.0", "id": id, "error": {"code": code, "message": message}})


def decode(line: str) -> dict[str, Any]:
    """Parseia uma linha; objeto inválido vira `ValueError`."""
    try:
        payload = json.loads(line)
    except json.JSONDecodeError as exc:
        raise ValueError(f"JSON inválido: {exc}") from exc
    if not isinstance(payload, dict):
        raise ValueError("mensagem JSON-RPC deve ser objeto")
    return payload
