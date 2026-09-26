"""Oraculo LT02-AT-043: backup invalido falha visivel.

Origem semeada via JournalPitr (SEED_B05=20260818, 2 escritas): gerar
publica manifesto com linhas e checksum; restore valido reconstrói em alvo
isolado; base corrompida (linha extra) ou manifesto divergente aborta com
BackupInvalido sem tocar o alvo (arquivo ausente). Sem evidencia parcial.
"""

from __future__ import annotations

import sqlite3
from pathlib import Path

import pytest

from backup_verificado import BackupInvalido, BackupVerificado
from pitr_journal import JournalPitr

SEED_B05 = 20260818


def _origem(tmp_path: Path) -> str:
    caminho = str(tmp_path / "origem.db")
    base = JournalPitr(caminho)
    base.abrir()
    base.escrever("job-9", "reserva-confirmada-v1")
    base.escrever("job-10", "outro-v1")
    return caminho


def test_restore_valido_reconstroi_com_checksum(tmp_path: Path) -> None:
    origem = _origem(tmp_path)
    copia = str(tmp_path / "backup.db")
    alvo = str(tmp_path / "alvo.db")
    backup = BackupVerificado()
    manifesto = backup.gerar(origem, copia, 2)
    assert manifesto.linhas == 2
    assert len(manifesto.checksum) == 64
    backup.verificar(copia, manifesto)
    reconstruidas = backup.restaurar(copia, manifesto, alvo)
    assert reconstruidas == 2
    final = sqlite3.connect(alvo, check_same_thread=False)
    try:
        linha = final.execute("SELECT valor FROM recuperado WHERE chave = 'job-9'").fetchone()
    finally:
        final.close()
    assert linha is not None and linha[0] == "reserva-confirmada-v1"


def test_base_corrompida_aborta_sem_tocar_alvo(tmp_path: Path) -> None:
    origem = _origem(tmp_path)
    copia = str(tmp_path / "backup-ruim.db")
    alvo = str(tmp_path / "alvo-intocado.db")
    backup = BackupVerificado()
    manifesto = backup.gerar(origem, copia, 2)
    suja = sqlite3.connect(copia, check_same_thread=False)
    try:
        with suja:
            suja.execute("INSERT INTO journal VALUES (99, 'escrever', 'job-99', 'x')")
    finally:
        suja.close()
    with pytest.raises(BackupInvalido, match="diverge do manifesto"):
        backup.verificar(copia, manifesto)
    with pytest.raises(BackupInvalido, match="diverge do manifesto"):
        backup.restaurar(copia, manifesto, alvo)
    assert not Path(alvo).exists()


def test_manifesto_divergente_aborta(tmp_path: Path) -> None:
    origem = _origem(tmp_path)
    copia = str(tmp_path / "backup2.db")
    backup = BackupVerificado()
    manifesto = backup.gerar(origem, copia, 2)
    adulterado = manifesto.__class__(manifesto.origem, manifesto.seq_ate, 99, "0" * 64)
    with pytest.raises(BackupInvalido, match="diverge do manifesto"):
        backup.verificar(copia, adulterado)
