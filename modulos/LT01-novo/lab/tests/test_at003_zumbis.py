"""Oraculo LT01-AT-003: child/zombie — processo coletado e explicado.

POSIX EXCLUSIVO. Fora de POSIX (Windows sem os.fork), cada teste faz skip
com BLOCKED registrado — nunca simula. Filhos: so possuidos, sempre
recolhidos por waitpid em finally. Sem rede, sem Docker, sem subprocess.
"""

from __future__ import annotations

import os
import time
from types import ModuleType

import pytest


def _modulo() -> ModuleType:
    if not hasattr(os, "fork"):
        pytest.skip("BLOCKED: coleta_zumbis exige POSIX (os.fork ausente nesta plataforma)")
    import coleta_zumbis as cz

    return cz


def test_demonstra_recolhe_exit_code_3() -> None:
    cz = _modulo()
    demonstra = cz.demonstra
    assert callable(demonstra)
    resultado = demonstra()
    assert resultado["exit_code_coletado"] == 3
    assert resultado["pid_filho"] > 0


def test_filho_e_coleta_com_outro_codigo() -> None:
    cz = _modulo()
    pid: int = cz.filho_que_termina(7)
    assert pid > 0
    try:
        codigo: int = cz.coletar(pid)
    finally:
        # Cleanup provado: se coletar() falhar, nao resta zombie possuido.
        # Filho chama os._exit de imediato, entao WNOHANG recolhe sem bloquear;
        # apos coleta normal, a entrada ja sumiu (ChildProcessError esperado).
        import contextlib

        with contextlib.suppress(ChildProcessError):
            os.waitpid(pid, os.WNOHANG)
    assert codigo == 7


def test_filho_nao_coletado_mantem_entrada_ate_o_wait() -> None:
    if not hasattr(os, "fork"):
        pytest.skip("BLOCKED: coleta_zumbis exige POSIX (os.fork ausente nesta plataforma)")
    pid = os.fork()
    if pid == 0:
        os._exit(0)
    try:
        time.sleep(0.5)  # filho ja terminou; sem wait, a entrada (zombie) permanece
        os.kill(pid, 0)  # nao levanta: a entrada ainda existe aguardando leitura
    finally:
        _, estado = os.waitpid(pid, 0)  # cleanup provado do filho possuido
    assert os.waitstatus_to_exitcode(estado) == 0
