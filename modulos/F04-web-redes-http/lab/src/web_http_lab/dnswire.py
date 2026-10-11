"""DNS no fio (RFC 1035): monta consultas, decodifica respostas e consulta por UDP."""

from __future__ import annotations

import ipaddress
import secrets
import socket
import struct
import time
from collections.abc import Sequence
from dataclasses import dataclass

TYPES = {"A": 1, "NS": 2, "CNAME": 5, "MX": 15, "TXT": 16, "AAAA": 28}
TYPE_NAMES = {value: name for name, value in TYPES.items()}
CLASS_IN = 1
HEADER = struct.Struct("!HHHHHH")


class DnsError(Exception):
    """Mensagem DNS malformada, inconsistente ou que não responde à consulta."""


class DnsTruncated(DnsError):
    """Bit TC ligado: a resposta não coube no datagrama UDP; refazer por TCP."""


@dataclass(frozen=True, slots=True)
class Question:
    name: str
    qtype: int


@dataclass(frozen=True, slots=True)
class Record:
    name: str
    rtype: int
    ttl: int
    data: str

    @property
    def type_name(self) -> str:
        return TYPE_NAMES.get(self.rtype, str(self.rtype))


@dataclass(frozen=True, slots=True)
class Message:
    txid: int
    is_response: bool
    truncated: bool
    rcode: int
    questions: tuple[Question, ...]
    answers: tuple[Record, ...]


def encode_name(name: str) -> bytes:
    name = name.rstrip(".")
    if not name:
        return b"\x00"
    out = bytearray()
    for label in name.split("."):
        try:
            raw = label.encode("idna") if label else b""
        except UnicodeError as exc:
            raise DnsError(f"rótulo inválido: {label!r}") from exc
        if not 1 <= len(raw) <= 63:
            raise DnsError(f"rótulo inválido (1 a 63 bytes): {label!r}")
        out.append(len(raw))
        out += raw
    out.append(0)
    if len(out) > 255:
        raise DnsError("nome com mais de 255 bytes")
    return bytes(out)


def build_query(name: str, qtype: int | str, txid: int, recursion_desired: bool = True) -> bytes:
    code = TYPES[qtype] if isinstance(qtype, str) else qtype
    flags = 0x0100 if recursion_desired else 0
    return HEADER.pack(txid, flags, 1, 0, 0, 0) + encode_name(name) + struct.pack("!HH", code, 1)


def decode_name(msg: bytes, offset: int) -> tuple[str, int]:
    """Decodifica um nome (com compressão). Devolve (nome, offset depois do nome no fluxo)."""
    labels: list[str] = []
    pos = offset
    end = -1
    while True:
        if pos >= len(msg):
            raise DnsError("nome fora da mensagem")
        length = msg[pos]
        if length & 0xC0 == 0xC0:
            if pos + 1 >= len(msg):
                raise DnsError("ponteiro truncado")
            pointer = ((length & 0x3F) << 8) | msg[pos + 1]
            if pointer >= pos:
                raise DnsError("ponteiro de compressão não aponta para trás (laço?)")
            if end < 0:
                end = pos + 2
            pos = pointer
        elif length & 0xC0:
            raise DnsError("tipo de rótulo reservado")
        elif length == 0:
            if end < 0:
                end = pos + 1
            return ".".join(labels) or ".", end
        else:
            if pos + 1 + length > len(msg):
                raise DnsError("rótulo ultrapassa a mensagem")
            labels.append(msg[pos + 1 : pos + 1 + length].decode("ascii", "backslashreplace"))
            pos += 1 + length


def _rdata(msg: bytes, rtype: int, start: int, size: int) -> str:
    raw = msg[start : start + size]
    if rtype == TYPES["A"]:
        if size != 4:
            raise DnsError("registro A deve ter 4 bytes")
        return str(ipaddress.IPv4Address(raw))
    if rtype == TYPES["AAAA"]:
        if size != 16:
            raise DnsError("registro AAAA deve ter 16 bytes")
        return str(ipaddress.IPv6Address(raw))
    if rtype in (TYPES["NS"], TYPES["CNAME"]):
        return decode_name(msg, start)[0]
    if rtype == TYPES["MX"]:
        if size < 3:
            raise DnsError("registro MX curto demais")
        (preference,) = struct.unpack_from("!H", msg, start)
        return f"{preference} {decode_name(msg, start + 2)[0]}"
    if rtype == TYPES["TXT"]:
        parts: list[str] = []
        pos = 0
        while pos < size:
            length = raw[pos]
            if pos + 1 + length > size:
                raise DnsError("character-string ultrapassa o registro")
            parts.append(raw[pos + 1 : pos + 1 + length].decode("utf-8", "replace"))
            pos += 1 + length
        return "".join(parts)
    return raw.hex()


def parse_message(data: bytes) -> Message:
    if len(data) < HEADER.size:
        raise DnsError("mensagem menor que o cabeçalho de 12 bytes")
    txid, flags, qdcount, ancount, _ns, _ar = HEADER.unpack_from(data)
    pos = HEADER.size
    questions: list[Question] = []
    for _ in range(qdcount):
        name, pos = decode_name(data, pos)
        if pos + 4 > len(data):
            raise DnsError("pergunta truncada")
        qtype, _qclass = struct.unpack_from("!HH", data, pos)
        pos += 4
        questions.append(Question(name, qtype))
    answers: list[Record] = []
    for _ in range(ancount):
        name, pos = decode_name(data, pos)
        if pos + 10 > len(data):
            raise DnsError("registro truncado")
        rtype, _rclass, ttl, rdlength = struct.unpack_from("!HHIH", data, pos)
        pos += 10
        if pos + rdlength > len(data):
            raise DnsError("rdata ultrapassa a mensagem")
        answers.append(Record(name, rtype, ttl, _rdata(data, rtype, pos, rdlength)))
        pos += rdlength
    return Message(
        txid,
        bool(flags & 0x8000),
        bool(flags & 0x0200),
        flags & 0xF,
        tuple(questions),
        tuple(answers),
    )


def rdata_a(ip: str) -> bytes:
    return ipaddress.IPv4Address(ip).packed


def rdata_aaaa(ip: str) -> bytes:
    return ipaddress.IPv6Address(ip).packed


def rdata_name(name: str) -> bytes:
    return encode_name(name)


def rdata_mx(preference: int, name: str) -> bytes:
    return struct.pack("!H", preference) + encode_name(name)


def rdata_txt(text: str) -> bytes:
    raw = text.encode("utf-8")
    if len(raw) > 255:
        raise DnsError("character-string tem no máximo 255 bytes")
    return bytes([len(raw)]) + raw


def build_response(
    txid: int,
    qname: str,
    qtype: int | str,
    answers: Sequence[tuple[int, int, bytes]],
    *,
    rcode: int = 0,
    truncated: bool = False,
) -> bytes:
    """Resposta com a pergunta repetida; cada dono de registro aponta para ela (0xC00C)."""
    code = TYPES[qtype] if isinstance(qtype, str) else qtype
    flags = 0x8180 | (0x0200 if truncated else 0) | rcode
    out = bytearray(HEADER.pack(txid, flags, 1, len(answers), 0, 0))
    out += encode_name(qname) + struct.pack("!HH", code, CLASS_IN)
    for rtype, ttl, rdata in answers:
        out += b"\xc0\x0c" + struct.pack("!HHIH", rtype, CLASS_IN, ttl, len(rdata)) + rdata
    return bytes(out)


def query_udp(
    server: str,
    port: int,
    name: str,
    qtype: int | str = "A",
    *,
    timeout: float = 2.0,
    txid: int | None = None,
) -> Message:
    """Stub resolver: um datagrama, ID aleatório, respostas que não casam são ignoradas."""
    code = TYPES[qtype] if isinstance(qtype, str) else qtype
    ident = secrets.randbelow(65536) if txid is None else txid
    packet = build_query(name, code, ident)
    expected = name.rstrip(".").lower() or "."
    deadline = time.monotonic() + timeout
    with socket.socket(socket.AF_INET, socket.SOCK_DGRAM) as sock:
        sock.sendto(packet, (server, port))
        while True:
            remaining = deadline - time.monotonic()
            if remaining <= 0:
                raise TimeoutError("sem resposta válida dentro do prazo")
            sock.settimeout(remaining)
            data, (host, _port) = sock.recvfrom(4096)
            if host != server:
                continue
            try:
                message = parse_message(data)
            except DnsError:
                continue
            question = message.questions[0] if message.questions else None
            if (
                not message.is_response
                or message.txid != ident
                or question is None
                or question.qtype != code
                or question.name.lower() != expected
            ):
                continue
            if message.truncated:
                raise DnsTruncated("resposta truncada (TC): repetir por TCP")
            return message
