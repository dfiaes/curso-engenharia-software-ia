"""Resolução local: nome vira endereço sem rede externa.

Referencia executavel do Bloco 3.
Implementacao verbatim na folha B03-L. So STDLIB (socket, time).
Opera sobre localhost e nomes .invalid; nenhum DNS externo.
"""

from __future__ import annotations

import socket
import time


class NomeInexistente(ValueError):
    """Hostname sem registro: equivalente local de NXDOMAIN."""


class ResolucaoExpirada(TimeoutError):
    """Resposta local mais lenta que o prazo contratado."""


def resolver_local(hostname: str, prazo: float) -> list[str]:
    """Resolve usando só recursos locais e publica os endereços.

    "localhost" resolve via getaddrinfo sem sair da máquina.
    Qualquer outro nome fora do contrato rende NomeInexistente
    sem tocar na rede. O prazo é validado na entrada.
    """
    if not prazo > 0:
        raise ValueError("prazo precisa ser positivo")
    nome = hostname.strip().lower()
    if not nome:
        raise ValueError("hostname vazio não resolve")
    if nome != "localhost" and not nome.endswith(".localhost"):
        raise NomeInexistente(f"sem registro: {hostname!r}")
    try:
        infos = socket.getaddrinfo(nome, None, type=socket.SOCK_STREAM)
    except socket.gaierror as erro:
        raise NomeInexistente(f"sem registro: {hostname!r}") from erro
    enderecos: list[str] = []
    for _, _, _, _, sockaddr in infos:
        ip = str(sockaddr[0])
        if ip not in enderecos:
            enderecos.append(ip)
    return enderecos


def resolver_com_atraso(hostname: str, prazo: float, atraso: float) -> list[str]:
    """Lado do timeout: atraso local excede o prazo e vira ResolucaoExpirada.

    O atraso acontece na máquina, nunca na rede: prova que o
    chamador respeita o prazo antes de qualquer resposta.
    """
    if not prazo > 0 or atraso < 0:
        raise ValueError("prazo positivo e atraso não negativo")
    inicio = time.monotonic()
    time.sleep(atraso)
    if time.monotonic() - inicio > prazo:
        raise ResolucaoExpirada(f"{hostname!r} excedeu {prazo}s")
    return resolver_local(hostname, prazo)
