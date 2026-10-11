"""CLI do lab: request (cliente cru), serve (API), dns-query e dns-demo."""

from __future__ import annotations

import argparse
import sys
from collections.abc import Sequence
from urllib.parse import urlsplit

from web_http_lab import dnswire
from web_http_lab.api import LabServer
from web_http_lab.httpclient import build_request, fetch_url


def _show(prefix: str, raw: bytes) -> None:
    for line in raw.decode("latin-1").split("\r\n"):
        print(f"{prefix} {line}" if line else prefix)


def cmd_request(args: argparse.Namespace) -> int:
    headers: dict[str, str] = {}
    for item in args.header:
        name, sep, value = item.partition(":")
        if not sep:
            print(f"cabeçalho sem ':': {item}", file=sys.stderr)
            return 2
        headers[name.strip()] = value.strip()
    body = args.data.encode("utf-8") if args.data is not None else b""
    parts = urlsplit(args.url)
    port = parts.port or 80
    authority = (parts.hostname or "") if port == 80 else f"{parts.hostname}:{port}"
    target = (parts.path or "/") + (f"?{parts.query}" if parts.query else "")
    head = build_request(args.method, target, authority, headers, body).split(b"\r\n\r\n", 1)[0]
    _show(">", head)
    response = fetch_url(args.method, args.url, headers, body)
    print("<", f"{response.version} {response.status} {response.reason}")
    for name, value in response.headers:
        print("<", f"{name}: {value}")
    print("<")
    if response.body:
        print(response.body.decode("utf-8", "replace"))
    return 0 if response.status < 400 else 1


def cmd_serve(args: argparse.Namespace) -> int:
    server = LabServer(("127.0.0.1", args.port), verbose=args.verbose)
    print(f"ouvindo em http://127.0.0.1:{server.port}", flush=True)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("encerrando", file=sys.stderr)
    finally:
        server.server_close()
    return 0


def _hexdump(data: bytes) -> str:
    return "\n".join(f"{i:04x}  {data[i : i + 16].hex(' ')}" for i in range(0, len(data), 16))


def cmd_dns_query(args: argparse.Namespace) -> int:
    packet = dnswire.build_query(args.name, args.qtype, txid=0x1234)
    print(f"{len(packet)} bytes")
    print(_hexdump(packet))
    return 0


def cmd_dns_demo(_args: argparse.Namespace) -> int:
    answers = [
        (dnswire.TYPES["MX"], 3600, dnswire.rdata_mx(10, "mail.example.com")),
        (dnswire.TYPES["MX"], 3600, dnswire.rdata_mx(20, "backup.example.com")),
    ]
    packet = dnswire.build_response(0x1234, "example.com", "MX", answers)
    print(f"resposta: {len(packet)} bytes")
    print(_hexdump(packet))
    message = dnswire.parse_message(packet)
    print(f"id=0x{message.txid:04x} resposta={message.is_response} rcode={message.rcode}")
    for record in message.answers:
        print(f"{record.name}  {record.ttl}  IN  {record.type_name}  {record.data}")
    return 0


def main(argv: Sequence[str] | None = None) -> int:
    parser = argparse.ArgumentParser(prog="web_http_lab.cli")
    sub = parser.add_subparsers(dest="command", required=True)

    req = sub.add_parser("request", help="requisição HTTP/1.1 montada à mão")
    req.add_argument("method")
    req.add_argument("url")
    req.add_argument("-H", "--header", action="append", default=[])
    req.add_argument("--data")
    req.set_defaults(func=cmd_request)

    serve = sub.add_parser("serve", help="sobe a API em 127.0.0.1")
    serve.add_argument("--port", type=int, default=8765)
    serve.add_argument("--verbose", action="store_true")
    serve.set_defaults(func=cmd_serve)

    dq = sub.add_parser("dns-query", help="mostra os bytes de uma consulta DNS")
    dq.add_argument("name")
    dq.add_argument("qtype", nargs="?", default="A", choices=sorted(dnswire.TYPES))
    dq.set_defaults(func=cmd_dns_query)

    sub.add_parser("dns-demo", help="monta e decodifica uma resposta MX").set_defaults(
        func=cmd_dns_demo
    )

    args = parser.parse_args(argv)
    return int(args.func(args))


if __name__ == "__main__":
    raise SystemExit(main())
