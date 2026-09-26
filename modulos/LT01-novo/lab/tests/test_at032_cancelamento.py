"""Oraculo LT01-AT-032: trabalho e recursos liberados apos cancelar.

Sinal manual e idempotente; o trabalho decide onde parar — verificacao
nos limites, nunca interrupcao forcada. Cancelar no meio interrompe o
trabalho no limite seguinte e libera slot, resposta e thread servidora.
Numeros: exemplo variavel (medicao local, relogio monotonico com margem
larga, sem assert de tempo exato). So 127.0.0.1 com porta efemera, sem
rede externa. Servidor de teste em thread com shutdown, join e cleanup;
resposta urllib sempre fechada em finally.
"""

from __future__ import annotations

import http.server
import threading
import time
import urllib.request
from collections.abc import Iterator
from types import TracebackType

import pytest

import cancelamento_cooperativo as cc
import pool_local as pl

PRAZO_SERVIDOR = 5.0
PRAZO_CURTO = 0.05
PRAZO_LONGO = 60.0
INTERVALO_BLOCO = 0.04
TETO_BYTES = 1_000_000

# Cliente direto a 127.0.0.1: ProxyHandler vazio dispensa a consulta de
# proxy do SO (macOS SystemConfiguration trava ~18 s em transiente).
ABRIDOR = urllib.request.build_opener(urllib.request.ProxyHandler({}))


class ServidorLongo:
    """HTTP local que entrega blocos com intervalo em 127.0.0.1, efemera.

    Thread com shutdown: evento de parada + shutdown + join no __exit__
    e escuta sempre fechada; o manipulador sai cedo quando parado.
    """

    def __init__(self, intervalo: float) -> None:
        pausa = intervalo
        parar = threading.Event()
        self._parar = parar

        class _Manipulador(http.server.BaseHTTPRequestHandler):
            def do_GET(self) -> None:
                self.send_response(200)
                self.end_headers()
                try:
                    i = 0
                    while not parar.is_set():
                        self.wfile.write(f"bloco-{i}\n".encode())
                        self.wfile.flush()
                        i += 1
                        time.sleep(pausa)
                except OSError:
                    pass

            def log_message(self, formato: str, *args: object) -> None:
                return

        self._servidor = http.server.ThreadingHTTPServer(("127.0.0.1", 0), _Manipulador)
        self.porta: int = int(self._servidor.server_address[1])
        self._fio = threading.Thread(target=self._servidor.serve_forever, daemon=True)

    def __enter__(self) -> ServidorLongo:
        self._fio.start()
        return self

    def __exit__(
        self,
        exc_type: type[BaseException] | None,
        exc: BaseException | None,
        tb: TracebackType | None,
    ) -> None:
        self._parar.set()
        self._servidor.shutdown()
        self._fio.join(timeout=PRAZO_SERVIDOR)
        self._servidor.server_close()


def test_hierarquia_cancelado_e_exception() -> None:
    assert issubclass(cc.Cancelado, Exception)


def test_sinal_comeca_falso_e_cancelar_e_idempotente() -> None:
    sinal = cc.SinalCancelamento()
    assert sinal.cancelado is False
    sinal.cancelar()
    assert sinal.cancelado is True
    sinal.cancelar()
    assert sinal.cancelado is True


def test_verificar_so_levanta_depois_de_cancelar() -> None:
    sinal = cc.SinalCancelamento()
    sinal.verificar()
    sinal.cancelar()
    with pytest.raises(cc.Cancelado):
        sinal.verificar()


def test_aguardar_devolve_estado_no_prazo() -> None:
    sinal = cc.SinalCancelamento()
    sinal.cancelar()
    inicio = time.monotonic()
    assert sinal.aguardar(prazo=PRAZO_SERVIDOR) is True
    assert time.monotonic() - inicio < PRAZO_SERVIDOR
    outro = cc.SinalCancelamento()
    inicio = time.monotonic()
    assert outro.aguardar(prazo=PRAZO_CURTO) is False
    assert time.monotonic() - inicio < PRAZO_SERVIDOR


def test_executar_cancelavel_devolve_saida_sem_sinal() -> None:
    sinal = cc.SinalCancelamento()
    assert cc.executar_cancelavel(sinal, lambda: 42) == 42


def test_executar_cancelavel_antes_nao_roda_trabalho() -> None:
    sinal = cc.SinalCancelamento()
    sinal.cancelar()
    chamado: list[bool] = []

    def trabalho() -> str:
        chamado.append(True)
        return "feito"

    with pytest.raises(cc.Cancelado):
        cc.executar_cancelavel(sinal, trabalho)
    assert chamado == []


def test_executar_cancelavel_durante_aparece_no_limite_seguinte() -> None:
    sinal = cc.SinalCancelamento()

    def trabalho() -> str:
        sinal.cancelar()
        return "feito"

    with pytest.raises(cc.Cancelado):
        cc.executar_cancelavel(sinal, trabalho)


def test_iterar_cancelavel_entrega_tudo_sem_sinal() -> None:
    sinal = cc.SinalCancelamento()
    assert list(cc.iterar_cancelavel(sinal, [1, 2, 3])) == [1, 2, 3]


def test_iterar_cancelavel_para_no_limite_seguinte() -> None:
    sinal = cc.SinalCancelamento()
    itens: Iterator[int] = cc.iterar_cancelavel(sinal, range(10))
    assert next(itens) == 0
    assert next(itens) == 1
    sinal.cancelar()
    with pytest.raises(cc.Cancelado):
        next(itens)


def test_cooperativo_thread_para_sozinha_sem_matar() -> None:
    sinal = cc.SinalCancelamento()
    passos: list[int] = []
    interrompido: list[bool] = []

    def trabalhar() -> None:
        try:
            for i in range(1000):
                sinal.verificar()
                passos.append(i)
                time.sleep(0.01)
        except cc.Cancelado:
            interrompido.append(True)

    fio = threading.Thread(target=trabalhar, daemon=True)
    fio.start()
    time.sleep(0.1)
    sinal.cancelar()
    fio.join(timeout=PRAZO_SERVIDOR)
    assert not fio.is_alive()
    assert interrompido == [True]
    assert 0 < len(passos) < 1000


def test_recursos_liberados_apos_cancelar() -> None:
    sinal = cc.SinalCancelamento()
    pool = pl.PoolLocal(object, 1, PRAZO_SERVIDOR)
    slot = pool.adquirir()
    assert pool.estatisticas() == {"tamanho": 1, "livres": 0, "em_uso": 1}
    interrompido: list[bool] = []

    def trabalhar() -> None:
        try:
            for _ in cc.iterar_cancelavel(sinal, range(1000)):
                time.sleep(0.01)
        except cc.Cancelado:
            interrompido.append(True)
        finally:
            pool.liberar(slot)

    fio = threading.Thread(target=trabalhar, daemon=True)
    try:
        fio.start()
        time.sleep(0.1)
        sinal.cancelar()
        fio.join(timeout=PRAZO_SERVIDOR)
        assert not fio.is_alive()
        assert interrompido == [True]
        assert pool.estatisticas() == {"tamanho": 1, "livres": 1, "em_uso": 0}
    finally:
        fio.join(timeout=PRAZO_SERVIDOR)
        pool.fechar()


def test_cancelar_leitura_localhost_libera_resposta_e_servidor() -> None:
    with ServidorLongo(INTERVALO_BLOCO) as servidor:
        url = f"http://127.0.0.1:{servidor.porta}/"
        sinal = cc.SinalCancelamento()
        lidos: list[bytes] = []
        erros: list[BaseException] = []
        primeiro = threading.Event()

        def ler() -> None:
            try:
                resposta = ABRIDOR.open(url, timeout=PRAZO_SERVIDOR)
                try:
                    while True:
                        sinal.verificar()
                        parte = resposta.read(4096)
                        if not parte:
                            return
                        lidos.append(parte)
                        primeiro.set()
                finally:
                    resposta.close()
            except BaseException as erro:
                erros.append(erro)

        fio = threading.Thread(target=ler, daemon=True)
        fio.start()
        primeiro.wait(timeout=PRAZO_LONGO)
        sinal.cancelar()
        fio.join(timeout=PRAZO_LONGO)
        assert not fio.is_alive()
        total_bytes = sum(len(parte) for parte in lidos)
        assert total_bytes < TETO_BYTES
        assert any(isinstance(erro, cc.Cancelado) for erro in erros)
