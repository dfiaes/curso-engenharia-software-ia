"""Oraculo LT01-AT-022: TLS hostname/expiry — falha validada, sem desligar.

Hostname divergente, expirado e cadeia desconhecida falham com a verificacao
sempre ligada; nenhuma variante desliga a checagem como "correcao". O
verificador de hostname/validade e testado contra estrutura (dict do
certificado), nunca contra rede. Handshake real com cadeia completa e
BLOCKED honesto: exige material de certificado (openssl externo, fora da
stdlib); aqui o handshake e provado por falha validada contra 127.0.0.1.
QUIC sem oraculo de execucao (stdlib nao implementa). Numeros: exemplo
variavel (medicao local). So 127.0.0.1 com porta efemera, sem rede externa.
"""

from __future__ import annotations

import inspect
import socket
import ssl
import threading
import time
from types import TracebackType

import pytest

import tls_local as tl

PRAZO = 5.0


def _cert_san(*nomes: str) -> dict[str, object]:
    san: tuple[tuple[str, str], ...] = tuple(("DNS", nome) for nome in nomes)
    cert: dict[str, object] = {"subjectAltName": san}
    return cert


def _cert_cn(nome: str) -> dict[str, object]:
    sujeito: tuple[tuple[tuple[str, str], ...], ...] = ((("commonName", nome),),)
    cert: dict[str, object] = {"subject": sujeito}
    return cert


def _cert_janela(inicio_s: float, fim_s: float) -> dict[str, object]:
    formato = "%b %d %H:%M:%S %Y GMT"
    cert: dict[str, object] = {
        "notBefore": time.strftime(formato, time.gmtime(inicio_s)),
        "notAfter": time.strftime(formato, time.gmtime(fim_s)),
    }
    return cert


def test_hostname_san_exato_passa() -> None:
    tl.verificar_hostname(_cert_san("localhost"), "localhost")


def test_hostname_maiusculas_passam() -> None:
    tl.verificar_hostname(_cert_san("LocalHost"), "localhost")


def test_hostname_curinga_restrito_passa() -> None:
    tl.verificar_hostname(_cert_san("*.localhost"), "a.b.localhost")


def test_hostname_divergente_falha() -> None:
    with pytest.raises(tl.HostnameInvalido):
        tl.verificar_hostname(_cert_san("outro.localhost"), "localhost")
    assert issubclass(tl.HostnameInvalido, ValueError)


def test_san_presente_ignora_cn() -> None:
    cert = _cert_san("outro.localhost")
    cert["subject"] = ((("commonName", "localhost"),),)
    with pytest.raises(tl.HostnameInvalido):
        tl.verificar_hostname(cert, "localhost")


def test_cn_legado_sem_san_passa() -> None:
    tl.verificar_hostname(_cert_cn("localhost"), "localhost")


def test_cert_sem_nomes_falha() -> None:
    with pytest.raises(tl.HostnameInvalido):
        tl.verificar_hostname({}, "localhost")


def test_hostname_vazio_e_erro() -> None:
    with pytest.raises(ValueError, match="vazio"):
        tl.verificar_hostname(_cert_san("localhost"), "   ")


def test_validade_dentro_da_janela_passa() -> None:
    agora = time.time()
    tl.verificar_validade(_cert_janela(agora - 3600.0, agora + 3600.0), agora)


def test_expirado_falha() -> None:
    agora = time.time()
    with pytest.raises(tl.CertificadoExpirado, match="expirado"):
        tl.verificar_validade(_cert_janela(agora - 7200.0, agora - 3600.0), agora)
    assert issubclass(tl.CertificadoExpirado, ValueError)


def test_ainda_nao_valido_falha_relogio_primeiro() -> None:
    agora = time.time()
    with pytest.raises(tl.CertificadoExpirado, match="ainda não válido"):
        tl.verificar_validade(_cert_janela(agora + 3600.0, agora + 7200.0), agora)


def test_janela_ilegivel_e_erro() -> None:
    with pytest.raises(ValueError, match="janela"):
        tl.verificar_validade({}, time.time())


def test_verificacao_nunca_desligada_no_fonte() -> None:
    fonte = inspect.getsource(tl.apertar_mao)
    assert "check_hostname = True" in fonte
    assert "CERT_REQUIRED" in fonte
    assert "CERT_NONE" not in fonte
    assert "unverified" not in fonte.lower()
    assert "check_hostname = False" not in fonte


class ServidorTcpCru:
    """Teste: aceita uma conexao TLS em 127.0.0.1 sem falar TLS.

    O handshake contra par nao-TLS falha validado (SSLError/OSError):
    a conversa nunca segue adiante. Thread com shutdown e cleanup.
    """

    def __init__(self) -> None:
        self._escuta = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        self._escuta.bind(("127.0.0.1", 0))
        self._escuta.listen(1)
        self._escuta.settimeout(PRAZO)
        self.porta: int = int(self._escuta.getsockname()[1])
        self._fio = threading.Thread(target=self._atender, daemon=True)

    def __enter__(self) -> ServidorTcpCru:
        self._fio.start()
        return self

    def __exit__(
        self,
        exc_type: type[BaseException] | None,
        exc: BaseException | None,
        tb: TracebackType | None,
    ) -> None:
        self._fio.join(timeout=PRAZO)
        self._escuta.close()

    def _atender(self) -> None:
        with self._escuta:
            try:
                conn, _ = self._escuta.accept()
            except OSError:
                return
            with conn:
                try:
                    conn.settimeout(PRAZO)
                    conn.recv(4096)
                except OSError:
                    pass


def test_handshake_contra_par_nao_tls_falha_validado() -> None:
    with ServidorTcpCru() as servidor, pytest.raises(OSError):
        tl.apertar_mao("127.0.0.1", servidor.porta, "", "localhost", PRAZO)


def test_handshake_contra_porta_fechada_falha_sem_seguir() -> None:
    import conexao_tcp as ct

    porta = ct.porta_livre_fechada()
    with pytest.raises(OSError):
        tl.apertar_mao("127.0.0.1", porta, "", "localhost", PRAZO)


def test_handshake_com_cadeia_real_blocked_sem_material() -> None:
    pytest.skip(
        "BLOCKED: handshake com hostname divergente/expirado/cadeia "
        "desconhecida exige material de certificado (openssl externo, "
        "fora da stdlib); verificadores cobertos contra estrutura acima."
    )


def test_ssl_modulo_sem_quic() -> None:
    assert not hasattr(ssl, "QUIC"), "stdlib nao implementa QUIC (RFC 9000)"
