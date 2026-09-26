"""Cliente MCP completo: discovery, chamada, timeout (lote M09)."""

from __future__ import annotations

from typing import Any

from proto_lab.transports import HttpLocal, MemoryChannel, StdioProcess


class ClienteMCP:
    """Cliente sobre qualquer transporte com `roundtrip`."""

    def __init__(self, transporte: MemoryChannel | StdioProcess | HttpLocal) -> None:
        self._transporte = transporte
        self._ids = 0

    def _chamar(self, method: str, params: dict[str, Any], timeout_s: float = 5.0) -> Any:
        transporte = self._transporte
        if isinstance(transporte, MemoryChannel):
            self._ids += 1
            resposta = transporte.roundtrip(
                {"jsonrpc": "2.0", "id": self._ids, "method": method, "params": params},
                timeout_s,
            )
        else:
            resposta = transporte.roundtrip(method, params, timeout_s)
        if isinstance(resposta, dict) and "error" in resposta:
            erro = resposta["error"]
            raise RuntimeError(f"{erro.get('code')}: {erro.get('message')}")
        return resposta.get("result")

    def listar_tools(self) -> Any:
        """Descoberta: o cliente aprende as tools em runtime."""
        return self._chamar("tools/list", {})

    def chamar_tool(self, nome: str, argumentos: dict[str, Any]) -> Any:
        """Executa e devolve o resultado estruturado."""
        return self._chamar("tools/call", {"name": nome, "arguments": argumentos})

    def ler_resource(self, uri: str) -> Any:
        """Lê um resource endereçável."""
        return self._chamar("resources/read", {"uri": uri})
