"""Guarda contra SSRF: só segue URLs cujo host resolve apenas para endereços públicos."""

from __future__ import annotations

import ipaddress
import socket
from collections.abc import Callable, Sequence
from urllib.parse import urlsplit

Resolver = Callable[[str], Sequence[str]]


class UnsafeUrl(ValueError):
    """A URL aponta (ou pode apontar) para dentro da rede."""


def system_resolver(host: str) -> list[str]:
    infos = socket.getaddrinfo(host, None, type=socket.SOCK_STREAM)
    return sorted({str(info[4][0]) for info in infos})


def check_public_url(
    url: str,
    resolver: Resolver = system_resolver,
    *,
    allowed_schemes: Sequence[str] = ("https",),
) -> list[str]:
    """Devolve os IPs validados; o chamador deve conectar neles, não resolver de novo."""
    parts = urlsplit(url)
    if parts.scheme not in allowed_schemes:
        raise UnsafeUrl(f"esquema não permitido: {parts.scheme!r}")
    if parts.username is not None or parts.password is not None:
        raise UnsafeUrl("credenciais na URL (userinfo) não são aceitas")
    host = parts.hostname
    if not host:
        raise UnsafeUrl("URL sem host")
    try:
        _ = parts.port  # acessar a propriedade valida a porta
    except ValueError as exc:
        raise UnsafeUrl("porta inválida") from exc
    try:
        ipaddress.ip_address(host)
        addresses: Sequence[str] = [host]
    except ValueError:
        addresses = resolver(host)
    if not addresses:
        raise UnsafeUrl(f"{host} não resolve")
    checked: list[str] = []
    for raw in addresses:
        ip = ipaddress.ip_address(raw.split("%", 1)[0])
        if isinstance(ip, ipaddress.IPv6Address) and ip.ipv4_mapped is not None:
            ip = ip.ipv4_mapped
        if not ip.is_global or ip.is_multicast:
            raise UnsafeUrl(f"{host} resolve para endereço não público: {ip}")
        checked.append(raw)
    return checked
