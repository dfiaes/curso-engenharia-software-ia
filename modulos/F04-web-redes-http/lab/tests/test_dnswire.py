from __future__ import annotations

import socket
import struct
import threading

import pytest

from web_http_lab import dnswire
from web_http_lab.dnswire import DnsError, DnsTruncated

T = dnswire.TYPES


def test_query_bytes_are_exact() -> None:
    packet = dnswire.build_query("www.example.com", "A", txid=0x1234)
    assert packet == (
        bytes.fromhex("1234 0100 0001 0000 0000 0000")
        + b"\x03www\x07example\x03com\x00"
        + bytes.fromhex("0001 0001")
    )


def test_response_round_trip_with_compression_pointer() -> None:
    answers = [
        (T["A"], 300, dnswire.rdata_a("192.0.2.10")),
        (T["A"], 300, dnswire.rdata_a("192.0.2.11")),
    ]
    message = dnswire.parse_message(dnswire.build_response(7, "example.com", "A", answers))
    assert message.is_response and message.rcode == 0 and message.txid == 7
    assert [(r.name, r.ttl, r.data) for r in message.answers] == [
        ("example.com", 300, "192.0.2.10"),
        ("example.com", 300, "192.0.2.11"),
    ]


def test_record_types_decode() -> None:
    answers = [
        (T["AAAA"], 60, dnswire.rdata_aaaa("2001:db8::1")),
        (T["MX"], 60, dnswire.rdata_mx(10, "mail.example.com")),
        (T["TXT"], 60, dnswire.rdata_txt("v=spf1 -all")),
        (T["CNAME"], 60, dnswire.rdata_name("edge.example.net")),
        (99, 60, b"\x01\x02"),
    ]
    got = dnswire.parse_message(dnswire.build_response(1, "example.com", 255, answers))
    assert [r.data for r in got.answers] == [
        "2001:db8::1",
        "10 mail.example.com",
        "v=spf1 -all",
        "edge.example.net",
        "0102",
    ]
    assert got.answers[0].type_name == "AAAA" and got.answers[4].type_name == "99"


def test_compression_pointer_inside_rdata() -> None:
    header = bytes.fromhex("0001 8180 0001 0001 0000 0000")
    question = b"\x03www\x07example\x03com\x00" + bytes.fromhex("0005 0001")
    rdata = b"\x03cdn\xc0\x10"  # "cdn" + ponteiro para "example.com" no offset 16
    answer = b"\xc0\x0c" + struct.pack("!HHIH", 5, 1, 30, len(rdata)) + rdata
    message = dnswire.parse_message(header + question + answer)
    assert message.answers[0].data == "cdn.example.com"


def test_pointer_loop_and_forward_pointer_are_rejected() -> None:
    header = bytes.fromhex("0001 8180 0001 0000 0000 0000")
    with pytest.raises(DnsError):
        dnswire.parse_message(header + b"\xc0\x0c" + bytes.fromhex("0001 0001"))  # aponta p/ si
    with pytest.raises(DnsError):
        dnswire.parse_message(header + b"\xc0\xff" + bytes.fromhex("0001 0001"))  # para frente


@pytest.mark.parametrize(
    "data",
    [
        b"\x00" * 5,
        bytes.fromhex("0001 8180 0001 0000 0000 0000") + b"\x05abc",  # rótulo passa do fim
        bytes.fromhex("0001 8180 0001 0000 0000 0000")
        + b"\x80\x00\x00\x01\x00\x01",  # tipo reservado
    ],
)
def test_malformed_messages(data: bytes) -> None:
    with pytest.raises(DnsError):
        dnswire.parse_message(data)


def test_a_record_with_wrong_length_is_rejected() -> None:
    packet = dnswire.build_response(1, "a.test", "A", [(T["A"], 1, b"\x01\x02\x03")])
    with pytest.raises(DnsError):
        dnswire.parse_message(packet)


def test_encode_name_limits() -> None:
    assert dnswire.encode_name("example.com.") == dnswire.encode_name("example.com")
    assert dnswire.encode_name("") == b"\x00"
    with pytest.raises(DnsError):
        dnswire.encode_name("a" * 64 + ".com")
    with pytest.raises(DnsError):
        dnswire.encode_name("a..com")
    with pytest.raises(DnsError):
        dnswire.encode_name(".".join(["a" * 60] * 5))


# ---- UDP real em loopback, com um servidor falso ----
def fake_dns(replies: list[bytes | None]) -> tuple[socket.socket, int, threading.Thread]:
    """Responde à primeira consulta com cada item de `replies`, em sequência."""
    sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    sock.bind(("127.0.0.1", 0))
    sock.settimeout(3)

    def run() -> None:
        try:
            _data, addr = sock.recvfrom(512)
        except OSError:
            return
        for reply in replies:
            if reply is not None:
                sock.sendto(reply, addr)

    thread = threading.Thread(target=run)
    thread.start()
    return sock, int(sock.getsockname()[1]), thread


def test_query_udp_ignores_wrong_txid_then_accepts_right_one() -> None:
    answer = [(T["A"], 5, dnswire.rdata_a("192.0.2.1"))]
    spoof = dnswire.build_response(
        0x0BAD, "example.com", "A", [(T["A"], 5, dnswire.rdata_a("6.6.6.6"))]
    )
    good = dnswire.build_response(0x4242, "example.com", "A", answer)
    sock, port, thread = fake_dns([spoof, good])
    try:
        message = dnswire.query_udp("127.0.0.1", port, "example.com", "A", txid=0x4242)
    finally:
        thread.join()
        sock.close()
    assert [r.data for r in message.answers] == ["192.0.2.1"]


def test_query_udp_times_out_when_only_spoofed_answers_arrive() -> None:
    spoof = dnswire.build_response(
        0x0BAD, "example.com", "A", [(T["A"], 5, dnswire.rdata_a("6.6.6.6"))]
    )
    sock, port, thread = fake_dns([spoof])
    try:
        with pytest.raises(TimeoutError):
            dnswire.query_udp("127.0.0.1", port, "example.com", "A", txid=0x4242, timeout=0.3)
    finally:
        thread.join()
        sock.close()


def test_query_udp_reports_truncation() -> None:
    reply = dnswire.build_response(0x4242, "example.com", "A", [], truncated=True)
    sock, port, thread = fake_dns([reply])
    try:
        with pytest.raises(DnsTruncated):
            dnswire.query_udp("127.0.0.1", port, "example.com", "A", txid=0x4242)
    finally:
        thread.join()
        sock.close()


def test_query_udp_rejects_answer_for_another_name() -> None:
    other = dnswire.build_response(
        0x4242, "evil.test", "A", [(T["A"], 5, dnswire.rdata_a("6.6.6.6"))]
    )
    sock, port, thread = fake_dns([other])
    try:
        with pytest.raises(TimeoutError):
            dnswire.query_udp("127.0.0.1", port, "example.com", "A", txid=0x4242, timeout=0.3)
    finally:
        thread.join()
        sock.close()
