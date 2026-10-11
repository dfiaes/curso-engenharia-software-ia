from __future__ import annotations

import io

import pytest

from web_http_lab.httpclient import ProtocolError, Response, build_request, parse_response


def parse(raw: bytes, method: str = "GET") -> Response:
    return parse_response(io.BytesIO(raw), method)


def test_build_request_get_has_host_and_close() -> None:
    raw = build_request("GET", "/notes?limit=2", "example.test")
    assert raw == (
        b"GET /notes?limit=2 HTTP/1.1\r\nHost: example.test\r\nConnection: close\r\n\r\n"
    )


def test_build_request_post_computes_content_length() -> None:
    raw = build_request("POST", "/x", "h", {"Content-Type": "application/json"}, b'{"a":1}')
    head, body = raw.split(b"\r\n\r\n", 1)
    assert b"Content-Length: 7" in head
    assert body == b'{"a":1}'


def test_build_request_post_without_body_still_sends_zero_length() -> None:
    assert b"Content-Length: 0" in build_request("POST", "/x", "h")


@pytest.mark.parametrize(
    "kwargs",
    [
        {"method": "GET", "target": "/a b", "host": "h"},
        {"method": "GET", "target": "/a\r\nX: y", "host": "h"},
        {"method": "GE T", "target": "/", "host": "h"},
        {"method": "GET", "target": "/", "host": "h", "headers": {"X-A": "1\r\nX-B: 2"}},
        {"method": "GET", "target": "/", "host": "h", "headers": {"Bad Name": "1"}},
        {"method": "GET", "target": "/", "host": "h", "headers": {"Content-Length": "5"}},
        {"method": "GET", "target": "/", "host": "h", "headers": {"X-A": "açúcar"}},
    ],
)
def test_build_request_rejects_header_injection(kwargs: dict[str, object]) -> None:
    with pytest.raises(ValueError):
        build_request(**kwargs)  # type: ignore[arg-type]


def test_parse_content_length_body() -> None:
    response = parse(b"HTTP/1.1 200 OK\r\nContent-Length: 5\r\nX-A: 1\r\n\r\nhelloEXTRA")
    assert (response.status, response.reason, response.body) == (200, "OK", b"hello")
    assert response.header("content-length") == "5"
    assert response.header("x-a") == "1"
    assert response.header("missing") is None


def test_parse_chunked_with_extension_and_trailer() -> None:
    raw = (
        b"HTTP/1.1 200 OK\r\nTransfer-Encoding: chunked\r\n\r\n"
        b"4;ext=1\r\nWiki\r\n5\r\npedia\r\n0\r\nTrailer-X: 1\r\n\r\n"
    )
    assert parse(raw).body == b"Wikipedia"


def test_parse_until_close_without_framing() -> None:
    assert parse(b"HTTP/1.0 200 OK\r\n\r\nall of it").body == b"all of it"


def test_parse_no_body_for_head_204_304() -> None:
    assert parse(b"HTTP/1.1 200 OK\r\nContent-Length: 9\r\n\r\n", "HEAD").body == b""
    assert parse(b"HTTP/1.1 204 No Content\r\n\r\n").body == b""
    assert parse(b'HTTP/1.1 304 Not Modified\r\nETag: "a"\r\n\r\n').body == b""


def test_parse_empty_reason_and_repeated_headers() -> None:
    response = parse(
        b"HTTP/1.1 200\r\nSet-Cookie: a=1\r\nSet-Cookie: b=2\r\nContent-Length: 0\r\n\r\n"
    )
    assert response.reason == ""
    assert response.header_values("set-cookie") == ["a=1", "b=2"]


@pytest.mark.parametrize(
    "raw",
    [
        b"HTTP/1.1 200 OK\r\nContent-Length: 10\r\n\r\nshort",  # truncado
        b"HTTP/1.1 200 OK\r\nContent-Length: 1\r\nTransfer-Encoding: chunked\r\n\r\n0\r\n\r\n",
        b"HTTP/1.1 200 OK\r\nContent-Length: 1\r\nContent-Length: 2\r\n\r\nab",
        b"HTTP/1.1 200 OK\r\nContent-Length: +1\r\n\r\na",
        b"HTTP/1.1 200 OK\r\nTransfer-Encoding: gzip, chunked\r\n\r\n0\r\n\r\n",
        b"HTTP/1.1 200 OK\r\nTransfer-Encoding: chunked\r\n\r\nZZ\r\n",
        b"HTTP/1.1 200 OK\r\nTransfer-Encoding: chunked\r\n\r\n4\r\nWikiXX0\r\n\r\n",
        b"HTTP/1.1 200 OK\r\nX: a\r\n b\r\n\r\n",  # obs-fold
        b"HTTP/1.1 200 OK\r\nBad Header : x\r\n\r\n",
        b"HTTP/1.1 200 OK\r\nSem-dois-pontos\r\n\r\n",
        b"HTTP/1.1 200 OK\nContent-Length: 0\n\n",  # LF sem CR
        b"HTTP/2 200\r\n\r\n",
        b"200 OK\r\n\r\n",
        b"",
    ],
)
def test_parse_rejects_malformed(raw: bytes) -> None:
    with pytest.raises(ProtocolError):
        parse(raw)


def test_parse_duplicate_equal_content_length_is_accepted() -> None:
    raw = b"HTTP/1.1 200 OK\r\nContent-Length: 2\r\nContent-Length: 2\r\n\r\nab"
    assert parse(raw).body == b"ab"
