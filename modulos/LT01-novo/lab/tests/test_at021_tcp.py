"""Oraculo LT01-AT-021: refused/reset — estados distinguidos por evidencia.

Recusa nasce no connect (porta sem escuta, sem bytes trocados); reset nasce
na leitura (abort pos-aceite, RST em vez de EOF); fim negociado rende EOF
limpo (retorno, sem erro). Cada um com a chamada que falhou registrada.
Numeros: exemplo variavel (medicao local). So 127.0.0.1 com porta efemera,
sem rede externa. Servidores de teste em thread com shutdown, join e
cleanup; sockets do chamador sempre fechados em finally.
"""

from __future__ import annotations

import socket
import threading
from types import TracebackType

import pytest

import conexao_tcp as ct

PRAZO = 5.0


class ServidorFimLimpo:
    """Teste: aceita uma conexao em 127.0.0.1, envia a carga e fecha limpo.

    O FIN negociado rende EOF na leitura (bytes e depois fim, sem erro).
    Thread com shutdown: join no __exit__ e escuta sempre fechada.
    """

    def __init__(self, carga: bytes) -> None:
        self._carga = carga
        self._escuta = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        self._escuta.bind(("127.0.0.1", 0))
        self._escuta.listen(1)
        self._escuta.settimeout(PRAZO)
        self.porta: int = int(self._escuta.getsockname()[1])
        self._fio = threading.Thread(target=self._atender, daemon=True)

    def __enter__(self) -> ServidorFimLimpo:
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
                    conn.sendall(self._carga)
                    conn.shutdown(socket.SHUT_WR)
                except OSError:
                    pass


def test_recusa_no_connect_porta_sem_escuta() -> None:
    porta = ct.porta_livre_fechada()
    assert 0 < porta < 65536
    with pytest.raises(ct.ConexaoRecusada):
        ct.conectar("127.0.0.1", porta, PRAZO)
    assert issubclass(ct.ConexaoRecusada, ConnectionError)


def test_reset_no_leitura_nao_no_connect() -> None:
    porta = ct.servir_reset_uma_vez()
    conexao = ct.conectar("127.0.0.1", porta, PRAZO)
    try:
        with pytest.raises(ct.ConexaoResetada):
            ct.ler_ate_reset(conexao, PRAZO)
    finally:
        conexao.close()
    assert issubclass(ct.ConexaoResetada, ConnectionError)


def test_fim_negociado_rende_eof_sem_erro() -> None:
    with ServidorFimLimpo(b"oi") as servidor:
        conexao = ct.conectar("127.0.0.1", servidor.porta, PRAZO)
        try:
            ct.ler_ate_reset(conexao, PRAZO)  # EOF limpo: retorna sem erro
        finally:
            conexao.close()


def test_conectar_devolve_socket_do_chamador() -> None:
    with ServidorFimLimpo(b"x") as servidor:
        conexao = ct.conectar("127.0.0.1", servidor.porta, PRAZO)
        try:
            assert isinstance(conexao, socket.socket)
            assert conexao.recv(4096) == b"x"
        finally:
            conexao.close()
