"""Oraculo LT01-AT-010: FD leak — crescimento detectado, baseline restaurado.

Numeros: exemplo variavel (medicao local). Amostra fixa: N=8 aberturas de um
arquivo possuido em tmp_path; sem margem de tempo, so contagem exata do
rastreador. Sem rede, sem Docker, qualquer plataforma. /proc com fallback:
listar_fd_visiveis() rende [] onde nao ha proc. Cleanup provado: todo fd
aberto pelo rastreador e fechado em finally.
"""

from __future__ import annotations

import os
from pathlib import Path

import pytest

import vazamento_fd as vf

AMOSTRA = 8


def _arquivo_possuido(tmp_path: Path) -> str:
    alvo = tmp_path / "dado.txt"
    alvo.write_bytes(b"fd-prova")
    return str(alvo)


def _fechar_tudo(rastreador: vf.RastreadorFD) -> None:
    for fd in list(rastreador._abertos):
        rastreador.fechar(fd)


def test_falha_acumula_e_correcao_restaura_baseline(tmp_path: Path) -> None:
    caminho = _arquivo_possuido(tmp_path)
    rastreador = vf.RastreadorFD()
    try:
        assert rastreador.em_aberto() == 0
        acumulado = vf.servir_sem_fechar(rastreador, caminho, AMOSTRA)
        assert acumulado == AMOSTRA
        assert rastreador.em_aberto() == AMOSTRA
    finally:
        _fechar_tudo(rastreador)
    assert rastreador.em_aberto() == 0
    restante = vf.servir_fechando(rastreador, caminho, AMOSTRA)
    assert restante == 0
    assert rastreador.em_aberto() == 0


def test_ondas_sucessivas_falha_fixa_patamar_correcao_desce(tmp_path: Path) -> None:
    caminho = _arquivo_possuido(tmp_path)
    rastreador = vf.RastreadorFD()
    try:
        vf.servir_sem_fechar(rastreador, caminho, 3)
        assert rastreador.em_aberto() == 3
        vf.servir_sem_fechar(rastreador, caminho, 2)
        assert rastreador.em_aberto() == 5
    finally:
        _fechar_tudo(rastreador)
    assert rastreador.em_aberto() == 0
    assert vf.servir_fechando(rastreador, caminho, 5) == 0


def test_fechar_fora_do_registro_e_erro() -> None:
    rastreador = vf.RastreadorFD()
    with pytest.raises(ValueError, match="fora do registro"):
        rastreador.fechar(999999)


def test_listar_fd_visiveis_fallback_sem_proc(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    def _falha(_caminho: str) -> list[str]:
        raise OSError("sem proc")

    monkeypatch.setattr(os, "listdir", _falha)
    assert vf.listar_fd_visiveis() == []


def test_listar_fd_visiveis_publica_ordenado() -> None:
    visiveis = vf.listar_fd_visiveis()
    assert isinstance(visiveis, list)
    assert visiveis == sorted(visiveis)
