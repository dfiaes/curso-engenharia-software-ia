"""Transportes: memória, stdio (subprocesso) e HTTP localhost (lote M09).

Mesmo núcleo, três cascas. Memória é fila em processo; stdio inicia o
servidor real como subprocesso (isolamento de processo de verdade, logs
em stderr); HTTP serve em 127.0.0.1 com porta efêmera, checa `Origin` e
deriva escopo do `Authorization`. Tudo local, sem rede pública.
"""

from __future__ import annotations

import json
import queue
import subprocess
import sys
import threading
import urllib.error
import urllib.request
from dataclasses import dataclass
from http.server import BaseHTTPRequestHandler, HTTPServer
from pathlib import Path
from typing import Any, ClassVar, cast

from proto_lab import jsonrpc
from proto_lab.mcp_server import MCPServer, RequestContext

LAB = Path(__file__).resolve().parent.parent.parent


class TransportTimeout(TimeoutError):
    """Resposta não chegou no prazo: observável, sem travar."""


@dataclass(slots=True)
class MemoryChannel:
    """Par de filas ligando cliente e núcleo em processo."""

    server: MCPServer
    ctx: RequestContext

    def roundtrip(self, mensagem: dict[str, Any], timeout_s: float = 5.0) -> dict[str, Any]:
        """Despacha direto; timeout aqui é orçamento, não rede."""
        _ = timeout_s
        return self.server.dispatch(mensagem, self.ctx)


@dataclass(slots=True)
class StdioProcess:
    """Servidor real em subprocesso: stdin JSON por linha, logs em stderr."""

    proc: subprocess.Popen[bytes]
    next_id: int = 0

    @classmethod
    def iniciar(cls, modulo: str = "proto_lab.stdio_server") -> StdioProcess:
        """Inicia `python -m <modulo>` com o lab no path."""
        env_path = str(LAB / "src")
        import os

        env = dict(os.environ)
        env["PYTHONPATH"] = env_path + os.pathsep + env.get("PYTHONPATH", "")
        proc = subprocess.Popen(
            [sys.executable, "-m", modulo],
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            cwd=str(LAB),
            env=env,
        )
        return cls(proc)

    def roundtrip(
        self, method: str, params: dict[str, Any], timeout_s: float = 5.0
    ) -> dict[str, Any]:
        """Escreve uma linha, lê uma linha; stdout estranho vira erro claro."""
        self.next_id += 1
        assert self.proc.stdin is not None and self.proc.stdout is not None
        self.proc.stdin.write(
            (jsonrpc.encode_request(method, params, self.next_id) + "\n").encode()
        )
        self.proc.stdin.flush()
        import concurrent.futures

        with concurrent.futures.ThreadPoolExecutor(max_workers=1) as pool:
            futuro = pool.submit(self.proc.stdout.readline)
            try:
                linha = futuro.result(timeout=timeout_s)
            except concurrent.futures.TimeoutError as exc:
                raise TransportTimeout(f"sem resposta em {timeout_s}s") from exc
        if not linha:
            raise TransportTimeout("servidor encerrou o stdout")
        try:
            return jsonrpc.decode(linha.decode().strip())
        except ValueError as exc:
            raise TransportTimeout(f"stdout corrompido (log em stdout?): {exc}") from exc

    def encerrar(self) -> str:
        """Fecha stdin e devolve o stderr (logs do servidor)."""
        assert self.proc.stdin is not None
        self.proc.stdin.close()
        _, antierros = self.proc.communicate(timeout=5.0)
        return antierros.decode(errors="replace")


class _MCPHandler(BaseHTTPRequestHandler):
    server_instance: ClassVar[MCPServer | None] = None
    token_scopes: ClassVar[dict[str, frozenset[str]]] = {}

    def log_message(self, *args: object) -> None:
        pass

    def _responder(self, codigo: int, corpo: str, tipo: str = "application/json") -> None:
        dados = corpo.encode()
        self.send_response(codigo)
        self.send_header("Content-Type", tipo)
        self.send_header("Content-Length", str(len(dados)))
        self.end_headers()
        self.wfile.write(dados)

    def do_POST(self) -> None:
        assert _MCPHandler.server_instance is not None
        porta = cast(tuple[str, int], self.server.server_address)[1]
        permitidas = {"", f"http://127.0.0.1:{porta}"}
        if self.headers.get("Origin", "") not in permitidas:
            self._responder(403, jsonrpc.encode_error(None, -32000, "Origin inválida"))
            return
        tamanho = int(self.headers.get("Content-Length", "0"))
        try:
            mensagem = jsonrpc.decode(self.rfile.read(tamanho).decode())
        except ValueError:
            self._responder(400, jsonrpc.encode_error(None, -32700, "JSON inválido"))
            return
        if (
            mensagem.get("method") == "tools/call"
            and self.headers.get("Mcp-Method") != "tools/call"
        ):
            self._responder(
                400,
                jsonrpc.encode_error(
                    mensagem.get("id"), jsonrpc.HEADER_MISMATCH, "header Mcp-Method diverge"
                ),
            )
            return
        token = self.headers.get("Authorization", "").removeprefix("Bearer ").strip()
        scopes = _MCPHandler.token_scopes.get(token, frozenset())
        ctx = RequestContext(scopes=scopes, principal=token or "anonimo")
        resposta = _MCPHandler.server_instance.dispatch(mensagem, ctx)
        self._responder(200, json.dumps(resposta))


@dataclass(slots=True)
class HttpLocal:
    """HTTP em 127.0.0.1 com porta efêmera; fecha no teardown."""

    server: MCPServer
    token_scopes: dict[str, frozenset[str]]
    _httpd: HTTPServer | None = None
    _thread: threading.Thread | None = None

    def __post_init__(self) -> None:
        _MCPHandler.server_instance = self.server
        _MCPHandler.token_scopes = self.token_scopes
        self._httpd = HTTPServer(("127.0.0.1", 0), _MCPHandler)
        self._thread = threading.Thread(target=self._httpd.serve_forever, daemon=True)
        self._thread.start()

    @property
    def url(self) -> str:
        assert self._httpd is not None
        return f"http://127.0.0.1:{self._httpd.server_port}/mcp"

    def roundtrip(
        self, method: str, params: dict[str, Any], timeout_s: float = 5.0, token: str = ""
    ) -> dict[str, Any]:
        """POST com headers espelhando o corpo (Mcp-Method)."""
        corpo = jsonrpc.encode_request(method, params, 1).encode()
        pedido = urllib.request.Request(
            self.url,
            data=corpo,
            headers={
                "Content-Type": "application/json",
                "Mcp-Method": method,
                "Authorization": f"Bearer {token}" if token else "",
            },
            method="POST",
        )
        try:
            with urllib.request.urlopen(pedido, timeout=timeout_s) as resp:
                payload: dict[str, Any] = json.loads(resp.read().decode())
        except urllib.error.HTTPError as exc:
            if exc.code == 403:
                raise PermissionError("Origin inválida") from exc
            raise TransportTimeout(f"HTTP {exc.code}") from exc
        except OSError as exc:
            raise TransportTimeout(f"HTTP falhou: {exc}") from exc
        return payload

    def encerrar(self) -> None:
        """Para o servidor local."""
        if self._httpd is not None:
            self._httpd.shutdown()
            self._httpd.server_close()


def esvaziar_fila(fila: queue.Queue[str]) -> list[str]:
    """Drena sem bloquear (util de teste)."""
    itens: list[str] = []
    try:
        while True:
            itens.append(fila.get_nowait())
    except queue.Empty:
        pass
    return itens
