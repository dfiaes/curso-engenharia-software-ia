"""Oraculo LT01-AT-030: fila/timeout observados e dimensionamento defendido.

Esgotamento falha na fila ate o prazo (PoolEsgotado), antes de qualquer
byte viajar; destino ocioso responde a sonda direta enquanto a aquisicao
contendida falha — a evidencia bilateral separa fila de lentidao do
destino. Estatisticas tamanho/livres/em_uso defendem o dimensionamento.
Numeros: exemplo variavel (medicao local, relogio monotonico com margem
larga, sem assert de tempo exato). So 127.0.0.1 com porta efemera, sem
rede externa. Servidor de teste em thread com shutdown, join e cleanup;
respostas urllib sempre fechadas em finally.
"""

from __future__ import annotations

import http.server
import threading
import time
import urllib.request
from types import TracebackType

import pytest

import pool_local as pl

PRAZO_AQUISICAO = 0.2
PRAZO_SERVIDOR = 5.0
FATOR_TOLERANCIA = 10.0
AMOSTRA = 8

# Cliente direto a 127.0.0.1: ProxyHandler vazio dispensa a consulta de
# proxy do SO (macOS SystemConfiguration trava ~18 s em transiente).
ABRIDOR = urllib.request.build_opener(urllib.request.ProxyHandler({}))


class ServidorRapido:
    """HTTP local que responde de imediato em 127.0.0.1, porta efemera.

    Thread com shutdown: join no __exit__ e escuta sempre fechada.
    """

    def __init__(self) -> None:
        class _Manipulador(http.server.BaseHTTPRequestHandler):
            def do_GET(self) -> None:
                corpo = b"ok"
                self.send_response(200)
                self.send_header("Content-Length", str(len(corpo)))
                self.end_headers()
                self.wfile.write(corpo)

            def log_message(self, formato: str, *args: object) -> None:
                return

        self._servidor = http.server.ThreadingHTTPServer(("127.0.0.1", 0), _Manipulador)
        self.porta: int = int(self._servidor.server_address[1])
        self._fio = threading.Thread(target=self._servidor.serve_forever, daemon=True)

    def __enter__(self) -> ServidorRapido:
        self._fio.start()
        return self

    def __exit__(
        self,
        exc_type: type[BaseException] | None,
        exc: BaseException | None,
        tb: TracebackType | None,
    ) -> None:
        self._servidor.shutdown()
        self._fio.join(timeout=PRAZO_SERVIDOR)
        self._servidor.server_close()


def _contar() -> tuple[pl.PoolLocal, list[int]]:
    criadas: list[int] = []

    def fabrica() -> object:
        criadas.append(1)
        return object()

    return pl.PoolLocal(fabrica, 2, PRAZO_AQUISICAO), criadas


def test_parametros_invalidos() -> None:
    with pytest.raises(ValueError, match="tamanho"):
        pl.PoolLocal(object, 0, PRAZO_AQUISICAO)
    with pytest.raises(ValueError, match="tamanho"):
        pl.PoolLocal(object, -1, PRAZO_AQUISICAO)
    with pytest.raises(ValueError, match="prazo_aquisicao"):
        pl.PoolLocal(object, 1, 0.0)
    with pytest.raises(ValueError, match="prazo_aquisicao"):
        pl.PoolLocal(object, 1, -0.5)


def test_hierarquia_pool_esgotado_e_timeout() -> None:
    assert issubclass(pl.PoolEsgotado, TimeoutError)


def test_adquirir_ate_teto_e_estatisticas() -> None:
    pool, criadas = _contar()
    try:
        primeiro = pool.adquirir()
        segundo = pool.adquirir()
        assert primeiro is not segundo
        assert len(criadas) == 2
        assert pool.estatisticas() == {"tamanho": 2, "livres": 0, "em_uso": 2}
        pool.liberar(primeiro)
        assert pool.estatisticas() == {"tamanho": 2, "livres": 1, "em_uso": 1}
        pool.liberar(segundo)
    finally:
        pool.fechar()
    assert pool.estatisticas()["livres"] == 0


def test_fila_fifo_reaproveita_na_ordem() -> None:
    itens = ["c1", "c2"]

    def fabrica() -> object:
        return itens.pop(0)

    pool = pl.PoolLocal(fabrica, 2, PRAZO_AQUISICAO)
    try:
        primeiro = pool.adquirir()
        segundo = pool.adquirir()
        pool.liberar(primeiro)
        pool.liberar(segundo)
        assert pool.adquirir() == "c1"
        assert pool.adquirir() == "c2"
    finally:
        pool.fechar()


def test_excedente_espera_ate_prazo_e_desiste_sem_rede() -> None:
    pool = pl.PoolLocal(object, 1, PRAZO_AQUISICAO)
    ocupado = pool.adquirir()
    inicio = time.monotonic()
    try:
        with pytest.raises(pl.PoolEsgotado):
            pool.adquirir()
        decorrido = time.monotonic() - inicio
        assert decorrido >= PRAZO_AQUISICAO
        assert decorrido < PRAZO_AQUISICAO * FATOR_TOLERANCIA
    finally:
        pool.liberar(ocupado)
        pool.fechar()


def test_liberar_desbloqueia_quem_espera_na_fila() -> None:
    pool = pl.PoolLocal(object, 1, PRAZO_SERVIDOR)
    ocupado = pool.adquirir()
    recebido: list[object] = []
    pronto = threading.Event()

    def esperar() -> None:
        recebido.append(pool.adquirir())
        pronto.set()

    espera = threading.Thread(target=esperar, daemon=True)
    try:
        espera.start()
        time.sleep(0.05)
        assert not pronto.is_set()
        pool.liberar(ocupado)
        assert pronto.wait(timeout=PRAZO_SERVIDOR)
        assert recebido == [ocupado]
    finally:
        espera.join(timeout=PRAZO_SERVIDOR)
        for item in recebido:
            pool.liberar(item)
        pool.fechar()


def test_fechar_esvazia_livres_e_item_devolvido_volta() -> None:
    pool, _ = _contar()
    primeiro = pool.adquirir()
    segundo = pool.adquirir()
    pool.liberar(primeiro)
    pool.liberar(segundo)
    pool.fechar()
    assert pool.estatisticas()["livres"] == 0
    pool.liberar(primeiro)
    try:
        assert pool.adquirir() is primeiro
    finally:
        pool.fechar()


def test_esgotamento_distinguido_de_destino_lento() -> None:
    with ServidorRapido() as servidor:
        url = f"http://127.0.0.1:{servidor.porta}/"
        pool = pl.PoolLocal(object, 1, PRAZO_AQUISICAO)
        ocupado = pool.adquirir()
        try:
            inicio = time.monotonic()
            with ABRIDOR.open(url, timeout=PRAZO_SERVIDOR) as resposta:
                corpo = resposta.read()
            sonda_ms = (time.monotonic() - inicio) * 1000.0
            assert corpo == b"ok"
            assert sonda_ms < PRAZO_SERVIDOR * 1000.0
            with pytest.raises(pl.PoolEsgotado):
                pool.adquirir()
            stats = pool.estatisticas()
            assert stats == {"tamanho": 1, "livres": 0, "em_uso": 1}
        finally:
            pool.liberar(ocupado)
            pool.fechar()
        assert pool.estatisticas()["em_uso"] == 1  # fechar descarta livres


def test_waterfall_aquisicao_contendida_custa_mais_que_livre() -> None:
    pool, _ = _contar()
    livres_ms: list[float] = []
    try:
        for _ in range(AMOSTRA):
            inicio = time.monotonic()
            item = pool.adquirir()
            livres_ms.append((time.monotonic() - inicio) * 1000.0)
            pool.liberar(item)
        ocupado = pool.adquirir()
        extra = pool.adquirir()
        inicio = time.monotonic()
        reservado: list[object] = []

        def esperar() -> None:
            reservado.append(pool.adquirir())

        espera = threading.Thread(target=esperar, daemon=True)
        try:
            espera.start()
            time.sleep(0.05)
            pool.liberar(ocupado)
            espera.join(timeout=PRAZO_SERVIDOR)
            contendida_ms = (time.monotonic() - inicio) * 1000.0
            assert not espera.is_alive()
            assert reservado == [ocupado]
        finally:
            espera.join(timeout=PRAZO_SERVIDOR)
            for item in reservado:
                pool.liberar(item)
        media_livre = sum(livres_ms) / len(livres_ms)
        assert contendida_ms >= media_livre
        pool.liberar(extra)
    finally:
        pool.fechar()
