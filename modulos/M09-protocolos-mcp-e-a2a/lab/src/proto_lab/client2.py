"""Cliente independente: segunda implementação do mesmo contrato (lote M09).

Não reutiliza `mcp_client`: monta JSON-RPC à mão sobre qualquer
transporte com `roundtrip(method, params)`. Se os dois clientes passam
na mesma suíte contra o mesmo servidor, o que vale é o contrato — não
o código compartilhado.
"""

from __future__ import annotations

import itertools
from typing import Any


class ClienteIndependente:
    """Implementação própria, só com a stdlib e o formato do protocolo."""

    def __init__(self, transporte: Any) -> None:
        self._transporte = transporte
        self._ids = itertools.count(1000)

    def _pedido(self, method: str, params: dict[str, Any]) -> dict[str, Any]:
        mid = next(self._ids)
        if hasattr(self._transporte, "server"):
            mensagem = {"jsonrpc": "2.0", "id": mid, "method": method, "params": params}
            resposta = self._transporte.roundtrip(mensagem)
        else:
            resposta = self._transporte.roundtrip(method, params)
        if not isinstance(resposta, dict):
            raise RuntimeError(f"resposta inválida: {resposta!r}")
        if "error" in resposta:
            erro = resposta["error"]
            raise RuntimeError(f"{erro.get('code')}: {erro.get('message')}")
        return resposta

    def ferramentas(self) -> list[str]:
        """Nomes descobertos via `tools/list`."""
        resposta = self._pedido("tools/list", {})
        return [t["name"] for t in resposta.get("result", {}).get("tools", []) if "name" in t]

    def chamar(self, nome: str, argumentos: dict[str, Any]) -> dict[str, Any]:
        """Chama e devolve o `result` bruto."""
        resposta = self._pedido("tools/call", {"name": nome, "arguments": argumentos})
        resultado = resposta.get("result", {})
        assert isinstance(resultado, dict)
        return resultado
