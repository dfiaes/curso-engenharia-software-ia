"""Servidor stdio executável: lê JSON por linha, escreve resposta (lote M09).

Logs em stderr — stdout é do protocolo. Ponto de entrada do transporte
stdio real (subprocesso).
"""

from __future__ import annotations

import json
import sys

from proto_lab import jsonrpc
from proto_lab.demo import montar_servidor
from proto_lab.mcp_server import RequestContext


def main() -> None:
    servidor = montar_servidor()
    ctx = RequestContext(scopes=frozenset({"repo:ler"}))
    for linha in sys.stdin:
        linha = linha.strip()
        if not linha:
            continue
        try:
            mensagem = jsonrpc.decode(linha)
        except ValueError:
            sys.stdout.write(jsonrpc.encode_error(None, -32700, "JSON inválido") + "\n")
            sys.stdout.flush()
            continue
        resposta = servidor.dispatch(mensagem, ctx)
        sys.stdout.write(json.dumps(resposta) + "\n")
        sys.stdout.flush()


if __name__ == "__main__":
    main()
