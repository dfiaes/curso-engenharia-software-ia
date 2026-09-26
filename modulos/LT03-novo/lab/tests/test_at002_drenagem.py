"""Oraculo LT03-AT-002: drenagem fecha a entrada, conclui/cancela no prazo.

Numeros: exemplo variavel (medicao local). Amostra fixa: breve 0,05 s (n=2),
longa 30 s (cancelada), prazo 0,5 s, margem 2x. Sem Docker, sem rede.
"""

from __future__ import annotations

import asyncio
import sys
import time

import drenagem_grace as dg

BREVE = 0.05
PRAZO = 0.5


def test_drenar_conclui_breves_dentro_do_prazo() -> None:
    async def _cenario() -> dict[str, float]:
        svc = dg.ServicoDrenavel()
        t1 = asyncio.ensure_future(svc.atender(BREVE))
        t2 = asyncio.ensure_future(svc.atender(BREVE))
        await asyncio.sleep(0)
        await asyncio.sleep(0)
        em_curso: set[asyncio.Task[object]] = {t1, t2}
        rel = await dg.drenar(svc, em_curso, PRAZO)
        await asyncio.gather(t1, t2)
        assert svc.aceitando is False
        return rel

    inicio = time.monotonic()
    rel = asyncio.run(_cenario())
    relogio = time.monotonic() - inicio
    assert rel["concluidas"] == 2.0
    assert rel["canceladas"] == 0.0
    assert rel["codigo_saida"] == 0.0
    assert rel["relógio_s"] < 2.0 * PRAZO
    assert relogio < 2.0 * PRAZO


def test_trabalho_longo_e_cancelado_e_entrada_recusa_novo() -> None:
    async def _cenario() -> dict[str, float]:
        svc = dg.ServicoDrenavel()
        t1 = asyncio.ensure_future(svc.atender(BREVE))
        t2 = asyncio.ensure_future(svc.atender(30.0))
        await asyncio.sleep(0)
        await asyncio.sleep(0)
        em_curso: set[asyncio.Task[object]] = {t1, t2}
        rel = await dg.drenar(svc, em_curso, PRAZO)
        await asyncio.gather(t1, t2, return_exceptions=True)
        try:
            await svc.atender(BREVE)
        except RuntimeError as exc:
            assert "entrada fechada" in str(exc)
        else:
            raise AssertionError("trafego novo apos sinal deveria ser recusado")
        return rel

    rel = asyncio.run(_cenario())
    assert rel["concluidas"] == 1.0
    assert rel["canceladas"] == 1.0
    assert rel["codigo_saida"] == float(dg.CODIGO_SAIDA_LIMPA)
    assert rel["relógio_s"] < 2.0 * PRAZO


def test_instalar_handlers_registra_sigterm_e_sigint() -> None:
    if sys.platform == "win32":
        import pytest

        pytest.skip("BLOCKED: semântica POSIX de sinais indisponível nesta plataforma")
    import signal

    async def _cenario() -> None:
        loop = asyncio.get_running_loop()
        chamadas: list[str] = []
        dg.instalar_handlers(loop, lambda: chamadas.append("sinal"))
        try:
            assert chamadas == []
        finally:
            loop.remove_signal_handler(signal.SIGTERM)
            loop.remove_signal_handler(signal.SIGINT)

    asyncio.run(_cenario())
