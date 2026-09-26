"""TLS local: hostname e validade verificados, verificação nunca desligada.

Referencia executavel do Bloco 3.
Implementacao verbatim na folha B03-L. So STDLIB (socket, ssl, time).
Handshake só contra 127.0.0.1 com material da folha L; sem rede externa.
"""

from __future__ import annotations

import socket
import ssl
import time


class HostnameInvalido(ValueError):
    """Certificado não cobre o hostname pedido."""


class CertificadoExpirado(ValueError):
    """Certificado fora da janela notBefore/notAfter."""


def _casa(padrao: str, nome: str) -> bool:
    """Curinga só no rótulo mais à esquerda; o resto é igualdade exata."""
    texto = padrao.strip().lower()
    alvo = nome.strip().lower()
    if texto.startswith("*."):
        sufixo = texto[1:]
        return alvo.endswith(sufixo) and "." in alvo[: -len(sufixo)]
    return texto == alvo


def verificar_hostname(cert: dict[str, object], hostname: str) -> None:
    """Confere SAN dNSName e recorre ao CN; divergência vira HostnameInvalido.

    Subconjunto contratado da verificação: SAN primeiro, CN como
    recurso legado, curinga restrito. Nada aqui toca na rede.
    """
    if not hostname.strip():
        raise ValueError("hostname vazio não verifica")
    nomes: list[str] = []
    alternativa = cert.get("subjectAltName", ())
    if isinstance(alternativa, tuple):
        for tipo, valor in alternativa:
            if tipo == "DNS" and isinstance(valor, str):
                nomes.append(valor)
    if not nomes:
        sujeito = cert.get("subject", ())
        if isinstance(sujeito, tuple):
            for bloco in sujeito:
                if not isinstance(bloco, tuple):
                    continue
                for chave, valor in bloco:
                    if chave == "commonName" and isinstance(valor, str):
                        nomes.append(valor)
    for candidato in nomes:
        if _casa(candidato, hostname):
            return
    raise HostnameInvalido(f"certificado não cobre {hostname!r}")


def verificar_validade(cert: dict[str, object], agora: float) -> None:
    """Confere notBefore/notAfter contra o relógio dado.

    Fora da janela vira CertificadoExpirado; relógio errado reprova
    certificado certo, e o diagnóstico confere o relógio primeiro.
    """
    antes = cert.get("notBefore")
    depois = cert.get("notAfter")
    if not isinstance(antes, str) or not isinstance(depois, str):
        raise ValueError("certificado sem janela de validade legível")
    inicio = ssl.cert_time_to_seconds(antes)
    fim = ssl.cert_time_to_seconds(depois)
    _ = time.gmtime(0)
    if agora < inicio:
        raise CertificadoExpirado("certificado ainda não válido para este relógio")
    if agora > fim:
        raise CertificadoExpirado("certificado expirado para este relógio")


def apertar_mao(
    host: str, porta: int, cafile: str, hostname: str, prazo: float
) -> dict[str, object]:
    """Executa o handshake TLS e publica o certificado do par.

    Contexto com check_hostname ligado e âncora da folha L: hostname
    divergente, expirado ou cadeia desconhecida falha aqui via
    ssl.CertificateError/SSLError e a conversa nunca segue adiante.
    """
    contexto = ssl.create_default_context(cafile=cafile)
    contexto.check_hostname = True
    contexto.verify_mode = ssl.CERT_REQUIRED
    with (
        socket.create_connection((host, porta), timeout=prazo) as bruto,
        contexto.wrap_socket(bruto, server_hostname=hostname) as tunel,
    ):
        tunel.settimeout(prazo)
        par = tunel.getpeercert()
        if not isinstance(par, dict):
            return {}
        return dict(par)
