"""Servidor HTTP local e controlável para diagnosticar starvation do event loop."""

from __future__ import annotations

import asyncio
import threading
from contextlib import suppress
from dataclasses import dataclass


@dataclass(frozen=True, slots=True)
class LocalResponse:
    status_code: int
    body: bytes


@dataclass(frozen=True, slots=True)
class StarvationDiagnostic:
    """Compara progresso do loop enquanto dois handlers aguardam liberação."""

    blocking_heartbeat_while_waiting: bool
    cooperative_heartbeat_while_waiting: bool

    @property
    def starvation_observed(self) -> bool:
        return (
            not self.blocking_heartbeat_while_waiting and self.cooperative_heartbeat_while_waiting
        )


class DisposableLocalServer:
    """Servidor efêmero stdlib com esperas bloqueante e cooperativa controladas.

    O endpoint ``/blocking`` contém, de propósito, uma espera de ``threading.Event``
    na thread do event loop. Uma thread observadora precisa liberar essa espera.
    ``/cooperative`` aguarda um ``asyncio.Event`` e portanto devolve o controle ao loop.
    """

    host = "127.0.0.1"

    def __init__(self) -> None:
        self.blocking_started = threading.Event()
        self._blocking_release = threading.Event()
        self.cooperative_started = asyncio.Event()
        self._cooperative_release = asyncio.Event()
        self._server: asyncio.Server | None = None

    async def __aenter__(self) -> DisposableLocalServer:
        if self._server is not None:
            raise RuntimeError("servidor já iniciado")
        self._server = await asyncio.start_server(self._handle, self.host, 0)
        return self

    async def __aexit__(
        self,
        exc_type: type[BaseException] | None,
        exc: BaseException | None,
        traceback: object | None,
    ) -> None:
        del exc_type, exc, traceback
        self._blocking_release.set()
        self._cooperative_release.set()
        if self._server is not None:
            self._server.close()
            await self._server.wait_closed()
            self._server = None

    @property
    def port(self) -> int:
        if self._server is None or not self._server.sockets:
            raise RuntimeError("servidor não iniciado")
        address = self._server.sockets[0].getsockname()
        if not isinstance(address, tuple) or len(address) < 2 or not isinstance(address[1], int):
            raise RuntimeError("endereço TCP inesperado")
        return address[1]

    def release_blocking(self) -> None:
        self._blocking_release.set()

    def release_cooperative(self) -> None:
        self._cooperative_release.set()

    async def request(self, path: str) -> LocalResponse:
        if not path.startswith("/"):
            raise ValueError("path deve começar com /")
        reader, writer = await asyncio.open_connection(self.host, self.port)
        try:
            writer.write(
                f"GET {path} HTTP/1.1\r\nHost: {self.host}\r\nConnection: close\r\n\r\n".encode(
                    "ascii"
                )
            )
            await writer.drain()
            raw_response = await reader.read()
        finally:
            writer.close()
            with suppress(ConnectionError):
                await writer.wait_closed()

        head, separator, body = raw_response.partition(b"\r\n\r\n")
        if not separator:
            raise RuntimeError("resposta HTTP sem separador de headers")
        status_line = head.splitlines()[0].decode("ascii")
        parts = status_line.split(" ", 2)
        if len(parts) < 2 or not parts[1].isdigit():
            raise RuntimeError("status HTTP inválido")
        return LocalResponse(status_code=int(parts[1]), body=body)

    async def _handle(self, reader: asyncio.StreamReader, writer: asyncio.StreamWriter) -> None:
        try:
            request_line = await reader.readline()
            parts = request_line.decode("ascii", errors="replace").split()
            path = parts[1] if len(parts) >= 2 else ""
            await self._discard_headers(reader)

            if path == "/blocking":
                self.blocking_started.set()
                # Falha semeada AT-021: bloqueia deliberadamente a thread do event loop.
                self._blocking_release.wait()
                await self._respond(writer, 200, b"blocking released")
            elif path == "/cooperative":
                self.cooperative_started.set()
                await self._cooperative_release.wait()
                await self._respond(writer, 200, b"cooperative released")
            else:
                await self._respond(writer, 404, b"not found")
        finally:
            writer.close()
            with suppress(ConnectionError):
                await writer.wait_closed()

    @staticmethod
    async def _discard_headers(reader: asyncio.StreamReader) -> None:
        while True:
            line = await reader.readline()
            if line in {b"", b"\n", b"\r\n"}:
                return

    @staticmethod
    async def _respond(writer: asyncio.StreamWriter, status: int, body: bytes) -> None:
        reason = "OK" if status == 200 else "Not Found"
        writer.write(
            (
                f"HTTP/1.1 {status} {reason}\r\n"
                f"Content-Length: {len(body)}\r\n"
                "Content-Type: text/plain; charset=utf-8\r\n"
                "Connection: close\r\n\r\n"
            ).encode("ascii")
            + body
        )
        await writer.drain()
