# Lab F04 — web_http_lab

HTTP/1.1, REST, DNS on the wire and auth primitives, standard library only.
Python 3.14, managed with `uv`. No external network: servers bind to `127.0.0.1`
on ephemeral ports and the DNS tests use a fake UDP server on loopback.

## Quality gates

    uv sync --frozen
    uv run pytest -q
    uv run ruff check .
    uv run ruff format --check .
    uv run mypy --strict src tests

## What each part covers

| Piece | File | Shows |
|---|---|---|
| raw HTTP client | `src/web_http_lab/httpclient.py` | request building, status/header/body parsing, Content-Length vs chunked, smuggling guards |
| REST API | `src/web_http_lab/api.py` | resources, Problem Details (RFC 9457), ETag/If-None-Match/If-Match, cursor pagination, Idempotency-Key |
| DNS wire format | `src/web_http_lab/dnswire.py` | query/response packets, name compression, UDP stub resolver |
| auth | `src/web_http_lab/authn.py` | scrypt hashing, pinned-algorithm JWT, PKCE S256 |
| SSRF guard | `src/web_http_lab/ssrf.py` | public-address check on resolved IPs |
| CLI | `python -m web_http_lab.cli` | `request`, `serve`, `dns-query`, `dns-demo` |

The reference copy is read-only. Run `python3 create_working_copy.py` and work
in the printed directory.
