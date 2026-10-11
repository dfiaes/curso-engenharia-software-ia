"""Cliente HTTP/1.1 mínimo sobre socket: monta a requisição à mão e parseia a resposta."""

from __future__ import annotations

import json
import re
import socket
from collections.abc import Mapping
from dataclasses import dataclass
from typing import BinaryIO
from urllib.parse import urlsplit

MAX_LINE = 8192
MAX_HEADERS = 100
MAX_BODY = 8 * 1024 * 1024

_TOKEN = re.compile(r"[!#$%&'*+\-.^_`|~0-9A-Za-z]+")
_STATUS_LINE = re.compile(r"(HTTP/1\.[01]) ([0-9]{3})(?: (.*))?")
_DIGITS = re.compile(r"[0-9]+")
_HEX = re.compile(rb"[0-9A-Fa-f]+")
_BODY_METHODS = frozenset({"POST", "PUT", "PATCH"})


class ProtocolError(Exception):
    """A resposta viola o formato HTTP/1.1 (RFC 9112)."""


@dataclass(frozen=True, slots=True)
class Response:
    version: str
    status: int
    reason: str
    headers: tuple[tuple[str, str], ...]
    body: bytes

    def header(self, name: str) -> str | None:
        """Primeiro valor do campo; nomes de campo não diferenciam maiúsculas."""
        wanted = name.lower()
        for key, value in self.headers:
            if key.lower() == wanted:
                return value
        return None

    def header_values(self, name: str) -> list[str]:
        wanted = name.lower()
        return [value for key, value in self.headers if key.lower() == wanted]

    def json(self) -> object:
        return json.loads(self.body)


def _check_field(name: str, value: str) -> None:
    if not _TOKEN.fullmatch(name):
        raise ValueError(f"nome de campo inválido: {name!r}")
    if not value.isascii() or any(c in value for c in "\r\n\0"):
        raise ValueError(f"valor de campo inválido para {name}: {value!r}")


def build_request(
    method: str,
    target: str,
    host: str,
    headers: Mapping[str, str] | None = None,
    body: bytes = b"",
) -> bytes:
    """Serializa uma requisição HTTP/1.1.

    Recusa CR, LF e espaço onde eles abririam uma segunda linha (injeção de cabeçalho).
    Content-Length é sempre calculado aqui: quem o informa à mão erra o enquadramento.
    """
    for label, text in (("método", method), ("alvo", target), ("host", host)):
        if not text or any(c in text for c in "\r\n \t\0") or not text.isascii():
            raise ValueError(f"{label} inválido: {text!r}")
    if not _TOKEN.fullmatch(method):
        raise ValueError(f"método inválido: {method!r}")
    given: dict[str, tuple[str, str]] = {}
    for name, value in (headers or {}).items():
        _check_field(name, value)
        if name.lower() == "content-length":
            raise ValueError("Content-Length é calculado pela biblioteca")
        given[name.lower()] = (name, value)
    lines = [f"{method} {target} HTTP/1.1"]
    if "host" not in given:
        lines.append(f"Host: {host}")
    if "connection" not in given:
        lines.append("Connection: close")
    lines.extend(f"{name}: {value}" for name, value in given.values())
    if body or method.upper() in _BODY_METHODS:
        lines.append(f"Content-Length: {len(body)}")
    return ("\r\n".join(lines) + "\r\n\r\n").encode("ascii") + body


def _read_line(rfile: BinaryIO) -> bytes:
    line = rfile.readline(MAX_LINE + 1)
    if len(line) > MAX_LINE:
        raise ProtocolError("linha longa demais")
    if not line.endswith(b"\r\n"):
        raise ProtocolError("linha sem CRLF (conexão fechada no meio?)")
    return line[:-2]


def _read_exact(rfile: BinaryIO, size: int) -> bytes:
    if size > MAX_BODY:
        raise ProtocolError("corpo maior que o limite do cliente")
    data = rfile.read(size)
    if len(data) < size:
        raise ProtocolError(f"corpo truncado: esperava {size} bytes, recebeu {len(data)}")
    return data


def _read_chunked(rfile: BinaryIO) -> bytes:
    chunks: list[bytes] = []
    total = 0
    while True:
        size_text = _read_line(rfile).split(b";", 1)[0].strip()
        if not _HEX.fullmatch(size_text):
            raise ProtocolError(f"tamanho de chunk inválido: {size_text!r}")
        size = int(size_text, 16)
        if size == 0:
            break
        total += size
        chunks.append(_read_exact(rfile, size))
        if total > MAX_BODY:
            raise ProtocolError("corpo maior que o limite do cliente")
        if _read_line(rfile) != b"":
            raise ProtocolError("faltou CRLF depois do chunk")
    while _read_line(rfile) != b"":  # trailers: lidos e descartados
        pass
    return b"".join(chunks)


def _read_body(rfile: BinaryIO, status: int, method: str, headers: list[tuple[str, str]]) -> bytes:
    if method.upper() == "HEAD" or 100 <= status < 200 or status in (204, 304):
        return b""
    encodings = [v for k, v in headers if k.lower() == "transfer-encoding"]
    lengths = [v for k, v in headers if k.lower() == "content-length"]
    if encodings and lengths:
        raise ProtocolError("Transfer-Encoding e Content-Length juntos (risco de smuggling)")
    if encodings:
        codings = [c.strip().lower() for c in ",".join(encodings).split(",")]
        if codings != ["chunked"]:
            raise ProtocolError(f"transfer-coding não suportado: {codings}")
        return _read_chunked(rfile)
    if lengths:
        values = {part.strip() for value in lengths for part in value.split(",")}
        if len(values) != 1 or not _DIGITS.fullmatch(next(iter(values))):
            raise ProtocolError(f"Content-Length inválido ou conflitante: {lengths}")
        return _read_exact(rfile, int(next(iter(values))))
    data = rfile.read(MAX_BODY + 1)  # sem enquadramento: o fim do corpo é o fim da conexão
    if len(data) > MAX_BODY:
        raise ProtocolError("corpo maior que o limite do cliente")
    return data


def parse_response(rfile: BinaryIO, method: str = "GET") -> Response:
    """Lê status, campos e corpo de uma resposta HTTP/1.x."""
    match = _STATUS_LINE.fullmatch(_read_line(rfile).decode("latin-1"))
    if match is None:
        raise ProtocolError("linha de status inválida")
    version, status_text, reason = match.groups()
    status = int(status_text)
    headers: list[tuple[str, str]] = []
    while True:
        line = _read_line(rfile)
        if line == b"":
            break
        if len(headers) >= MAX_HEADERS:
            raise ProtocolError("campos demais")
        if line[:1] in (b" ", b"\t"):
            raise ProtocolError("obs-fold (continuação de linha) é proibido")
        name, sep, value = line.decode("latin-1").partition(":")
        if not sep or not _TOKEN.fullmatch(name):
            raise ProtocolError(f"campo malformado: {line!r}")
        headers.append((name, value.strip(" \t")))
    body = _read_body(rfile, status, method, headers)
    return Response(version, status, reason or "", tuple(headers), body)


def fetch(
    host: str,
    port: int,
    method: str = "GET",
    target: str = "/",
    headers: Mapping[str, str] | None = None,
    body: bytes = b"",
    timeout: float = 5.0,
) -> Response:
    """Uma requisição por conexão (Connection: close)."""
    authority = host if port == 80 else f"{host}:{port}"
    request = build_request(method, target, authority, headers, body)
    with socket.create_connection((host, port), timeout=timeout) as sock:
        sock.sendall(request)
        with sock.makefile("rb") as rfile:
            return parse_response(rfile, method)


def fetch_url(
    method: str,
    url: str,
    headers: Mapping[str, str] | None = None,
    body: bytes = b"",
    timeout: float = 5.0,
) -> Response:
    parts = urlsplit(url)
    if parts.scheme != "http" or not parts.hostname:
        raise ValueError("este cliente fala só http:// (TLS está fora do escopo do lab)")
    target = parts.path or "/"
    if parts.query:
        target += "?" + parts.query
    return fetch(parts.hostname, parts.port or 80, method, target, headers, body, timeout)


def send_raw(host: str, port: int, data: bytes, timeout: float = 5.0) -> bytes:
    """Envia bytes crus e devolve tudo até o servidor fechar a conexão."""
    with socket.create_connection((host, port), timeout=timeout) as sock:
        sock.sendall(data)
        received = bytearray()
        while chunk := sock.recv(4096):
            received.extend(chunk)
    return bytes(received)
