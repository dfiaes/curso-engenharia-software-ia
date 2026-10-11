from __future__ import annotations

import pytest

from web_http_lab import cli
from web_http_lab.api import LabServer


def test_dns_demo_prints_records(capsys: pytest.CaptureFixture[str]) -> None:
    assert cli.main(["dns-demo"]) == 0
    out = capsys.readouterr().out
    assert "example.com  3600  IN  MX  10 mail.example.com" in out
    assert "id=0x1234 resposta=True rcode=0" in out


def test_dns_query_prints_hex(capsys: pytest.CaptureFixture[str]) -> None:
    assert cli.main(["dns-query", "example.com", "A"]) == 0
    out = capsys.readouterr().out
    assert out.startswith("29 bytes")
    assert "12 34 01 00 00 01" in out


def test_request_shows_both_directions(
    server: LabServer, capsys: pytest.CaptureFixture[str]
) -> None:
    code = cli.main(["request", "GET", f"http://127.0.0.1:{server.port}/health"])
    out = capsys.readouterr().out
    assert code == 0
    assert "> GET /health HTTP/1.1" in out
    assert "< HTTP/1.1 200 OK" in out
    assert '{"status":"ok"}' in out


def test_request_returns_1_on_http_error(server: LabServer) -> None:
    assert cli.main(["request", "GET", f"http://127.0.0.1:{server.port}/nada"]) == 1


def test_request_rejects_header_without_colon(server: LabServer) -> None:
    assert cli.main(["request", "GET", f"http://127.0.0.1:{server.port}/", "-H", "sem-dois"]) == 2
