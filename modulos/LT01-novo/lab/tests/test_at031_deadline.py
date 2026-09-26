"""Oraculo LT01-AT-031: orcamento respeitado e sem tempestade de retry.

Orcamento divide o deadline de cima para baixo e fecha no total; cada
fase recebe o menor entre orcamento e restante; estouro vira
PrazoEstourado com registro. Retry exige as tres condicoes juntas —
metodo idempotente, tentativa abaixo do teto, restante acima de zero.
Relogio controlado (fake agora) no deterministico; relogio monotonico
com margem larga no trecho localhost, sem assert de tempo exato fragil.
Numeros: exemplo variavel (medicao local, amostra fixa de 4 fases). So
127.0.0.1 com porta efemera, sem rede externa. Servidor de teste em
thread com shutdown, join e cleanup; resposta urllib fechada em with.
"""

from __future__ import annotations

import http.server
import math
import threading
import time
import urllib.request
from contextlib import suppress
from types import TracebackType

import pytest

import deadline_fases as df

PRAZO_TOTAL = 5.0
PRAZO_SERVIDOR = 5.0
ATRASO_LENTO = 0.2
PESOS = {"conectar": 1.0, "enviar": 1.0, "aguardar": 2.0, "ler": 1.0}

# Cliente direto a 127.0.0.1: ProxyHandler vazio dispensa a consulta de
# proxy do SO (macOS SystemConfiguration trava ~18 s em transiente).
ABRIDOR = urllib.request.build_opener(urllib.request.ProxyHandler({}))


class RelogioControlado:
    """Relogio fake: agora() deterministico, avanco explicito."""

    def __init__(self, inicio: float = 1000.0) -> None:
        self._agora = inicio

    def agora(self) -> float:
        return self._agora

    def avancar(self, segundos: float) -> None:
        self._agora += segundos


class ServidorLento:
    """HTTP local com atraso fixo em 127.0.0.1, porta efemera.

    Thread com shutdown: join no __exit__ e escuta sempre fechada.
    """

    def __init__(self, atraso: float) -> None:
        demora = atraso

        class _Manipulador(http.server.BaseHTTPRequestHandler):
            def do_GET(self) -> None:
                time.sleep(demora)
                corpo = b"lento-ok"
                self.send_response(200)
                self.send_header("Content-Length", str(len(corpo)))
                self.end_headers()
                with suppress(OSError):
                    self.wfile.write(corpo)

            def log_message(self, formato: str, *args: object) -> None:
                return

        self._servidor = http.server.ThreadingHTTPServer(("127.0.0.1", 0), _Manipulador)
        self.porta: int = int(self._servidor.server_address[1])
        self._fio = threading.Thread(target=self._servidor.serve_forever, daemon=True)

    def __enter__(self) -> ServidorLento:
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


def test_hierarquia_prazo_estourado_e_timeout() -> None:
    assert issubclass(df.PrazoEstourado, TimeoutError)


def test_orcamento_proporcional_fecha_no_total() -> None:
    orcamento = df.orcamento_por_fase(5.0, PESOS)
    assert orcamento == {"conectar": 1.0, "enviar": 1.0, "aguardar": 2.0, "ler": 1.0}
    assert math.isclose(sum(orcamento.values()), 5.0)


def test_orcamento_rejeita_total_e_pesos_invalidos() -> None:
    with pytest.raises(ValueError, match="prazo_total"):
        df.orcamento_por_fase(0.0, PESOS)
    with pytest.raises(ValueError, match="prazo_total"):
        df.orcamento_por_fase(-1.0, PESOS)
    with pytest.raises(ValueError, match="pesos vazio"):
        df.orcamento_por_fase(4.0, {})
    with pytest.raises(ValueError, match="peso"):
        df.orcamento_por_fase(4.0, {"a": 1.0, "b": 0.0})
    with pytest.raises(ValueError, match="peso"):
        df.orcamento_por_fase(4.0, {"a": -2.0})


def test_restante_nunca_negativo() -> None:
    assert df.restante(1000.0, 10.0, 1003.0) == pytest.approx(7.0)
    assert df.restante(1000.0, 10.0, 1010.0) == 0.0
    assert df.restante(1000.0, 10.0, 1025.0) == 0.0


def test_checar_prazo_so_levanta_no_limite() -> None:
    df.checar_prazo(1000.0, 10.0, 1009.999)
    with pytest.raises(df.PrazoEstourado):
        df.checar_prazo(1000.0, 10.0, 1010.0)
    with pytest.raises(df.PrazoEstourado):
        df.checar_prazo(1000.0, 10.0, 1011.0)


def test_executar_fase_entrega_menor_entre_orcamento_e_restante() -> None:
    relogio = RelogioControlado()
    recebidos: list[float] = []

    def trabalho(teto: float) -> str:
        recebidos.append(teto)
        return "ok"

    saida = df.executar_fase(4.0, 1000.0, 10.0, relogio.agora, trabalho)
    assert saida == "ok"
    assert recebidos == [4.0]
    relogio.avancar(8.0)
    df.executar_fase(4.0, 1000.0, 10.0, relogio.agora, trabalho)
    assert recebidos[-1] == pytest.approx(2.0)


def test_executar_fase_nao_chama_trabalho_com_deadline_passado() -> None:
    relogio = RelogioControlado()
    relogio.avancar(11.0)
    chamado: list[bool] = []

    def trabalho(teto: float) -> str:
        chamado.append(True)
        return f"{teto}"

    with pytest.raises(df.PrazoEstourado):
        df.executar_fase(4.0, 1000.0, 10.0, relogio.agora, trabalho)
    assert chamado == []


def test_executar_fase_registra_estouro_durante_trabalho() -> None:
    relogio = RelogioControlado()

    def trabalho(teto: float) -> str:
        relogio.avancar(20.0)
        return f"{teto}"

    with pytest.raises(df.PrazoEstourado):
        df.executar_fase(4.0, 1000.0, 10.0, relogio.agora, trabalho)


@pytest.mark.parametrize(
    ("metodo", "tentativa", "maximo", "restante_seg", "esperado"),
    [
        ("GET", 0, 3, 1.0, True),
        ("HEAD", 1, 3, 1.0, True),
        ("OPTIONS", 0, 1, 0.5, True),
        ("PUT", 2, 3, 1.0, True),
        ("DELETE", 0, 3, 1.0, True),
        ("get", 0, 3, 1.0, True),
        ("  GET  ", 0, 3, 1.0, True),
        ("POST", 0, 3, 1.0, False),
        ("PATCH", 0, 3, 1.0, False),
        ("", 0, 3, 1.0, False),
        ("DESCONHECIDO", 0, 3, 1.0, False),
        ("GET", 3, 3, 1.0, False),
        ("GET", 4, 3, 1.0, False),
        ("GET", 0, 3, 0.0, False),
        ("GET", 0, 3, -1.0, False),
        ("PUT", 1, 3, 0.0, False),
    ],
)
def test_pode_repetir_exige_tripla_junta(
    metodo: str, tentativa: int, maximo: int, restante_seg: float, esperado: bool
) -> None:
    assert df.pode_repetir(metodo, tentativa, maximo, restante_seg) is esperado


def test_regra_tripla_decide_casos_do_checkpoint() -> None:
    assert df.pode_repetir("POST", 0, 3, 5.0) is False
    assert df.pode_repetir("GET", 1, 3, 2.0) is True
    assert df.pode_repetir("PUT", 0, 3, 0.0) is False


def test_sem_tempestade_tentativas_param_no_teto() -> None:
    tentativas = 0
    for tentativa in range(10):
        if not df.pode_repetir("GET", tentativa, 3, 1.0):
            break
        tentativas += 1
    assert tentativas == 3


def test_fase_localhost_cabe_no_orcamento() -> None:
    with ServidorLento(ATRASO_LENTO) as servidor:
        url = f"http://127.0.0.1:{servidor.porta}/"
        orcamento = df.orcamento_por_fase(PRAZO_TOTAL, PESOS)
        inicio = time.monotonic()
        recebidos: list[float] = []

        def trabalho(teto: float) -> bytes:
            recebidos.append(teto)
            with ABRIDOR.open(url, timeout=teto) as resposta:
                corpo: bytes = resposta.read()
                return corpo

        corpo = df.executar_fase(
            orcamento["aguardar"], inicio, PRAZO_TOTAL, time.monotonic, trabalho
        )
        decorrido = time.monotonic() - inicio
        assert corpo == b"lento-ok"
        assert recebidos and recebidos[0] <= orcamento["aguardar"]
        assert decorrido < PRAZO_TOTAL
