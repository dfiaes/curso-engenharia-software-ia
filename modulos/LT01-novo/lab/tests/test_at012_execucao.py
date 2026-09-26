"""Oraculo LT01-AT-012: non-root, escrita confinada e segredo fora do codigo.

Root so POSIX: geteuid ausente rende falso honesto, sem simular plataforma
(a suite nunca finge POSIX onde nao ha). /proc nao usado aqui. Sem rede,
sem Docker; arquivos temporarios em tmp_path com cleanup do pytest.
Numeros: exemplo variavel; amostra fixa sem tempo. Segredo jamais
persistido nem exibido: so ambiente no boot, ausencia rende erro explicito.
"""

from __future__ import annotations

import os
from pathlib import Path

import pytest

import execucao_confinada as ec

VAR = "LT01_B02_SEGREDO_PROVA"


def test_root_honesto_sem_simular() -> None:
    resultado = ec.rodando_como_root()
    assert isinstance(resultado, bool)
    geteuid = getattr(os, "geteuid", None)
    if geteuid is None:
        assert resultado is False
    else:
        assert resultado == bool(geteuid() == 0)


def test_exige_non_root_conforme_plataforma() -> None:
    if ec.rodando_como_root():
        with pytest.raises(PermissionError, match="sem privilegio"):
            ec.exige_non_root()
    else:
        ec.exige_non_root()


def test_exige_non_root_recusa_uid_zero(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setattr(os, "geteuid", lambda: 0, raising=False)
    assert ec.rodando_como_root() is True
    with pytest.raises(PermissionError, match="sem privilegio"):
        ec.exige_non_root()


def test_exige_non_root_permite_uid_comum(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setattr(os, "geteuid", lambda: 1000, raising=False)
    assert ec.rodando_como_root() is False
    ec.exige_non_root()


def test_carregar_segredo_so_do_ambiente(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv(VAR, "  valor-prova  ")
    assert ec.carregar_segredo(VAR) == "valor-prova"
    monkeypatch.delenv(VAR, raising=False)
    with pytest.raises(ec.SegredoAusente, match=VAR):
        ec.carregar_segredo(VAR)
    monkeypatch.setenv(VAR, "   ")
    with pytest.raises(ec.SegredoAusente):
        ec.carregar_segredo(VAR)


def test_escrita_confinada_permite_dentro_nega_fora(tmp_path: Path) -> None:
    dados = tmp_path / "dados"
    dados.mkdir()
    destino = ec.destino_escrita_permitido(str(dados), "saida.txt")
    assert destino.startswith(str(dados.resolve()))
    with pytest.raises(ec.EscritaNaoPermitida):
        ec.destino_escrita_permitido(str(dados), "../fora.txt")
    with pytest.raises(ec.EscritaNaoPermitida):
        ec.destino_escrita_permitido(str(dados), "/etc/hostname")


def test_symlink_de_escrita_para_fora_negado(tmp_path: Path) -> None:
    dados = tmp_path / "dados"
    dados.mkdir()
    externo = tmp_path / "externo.txt"
    externo.write_bytes(b"fora")
    elo = dados / "elo"
    elo.symlink_to(externo)
    with pytest.raises(ec.EscritaNaoPermitida):
        ec.destino_escrita_permitido(str(dados), "elo/../fora.txt")
    assert externo.read_bytes() == b"fora"


def test_escrita_temporario_mais_rename_confinada(tmp_path: Path) -> None:
    dados = tmp_path / "dados"
    dados.mkdir()
    destino = Path(ec.destino_escrita_permitido(str(dados), "final.txt"))
    temporario = destino.with_name(destino.name + ".tmp")
    temporario.write_bytes(b"conteudo")
    os.replace(temporario, destino)
    assert destino.read_bytes() == b"conteudo"
    assert not temporario.exists()


def test_relatar_contexto_jamais_expoe_valor(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv(VAR, "super-secreto-xyz")
    contexto = ec.relatar_contexto(VAR)
    assert contexto == {"root": str(ec.rodando_como_root()), "segredo_presente": "sim"}
    assert "super-secreto-xyz" not in str(contexto)
    assert "super-secreto-xyz" not in "".join(contexto.values())
    monkeypatch.delenv(VAR, raising=False)
    assert ec.relatar_contexto(VAR)["segredo_presente"] == "nao"
