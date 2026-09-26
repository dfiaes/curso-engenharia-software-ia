"""Exercita a cópia de trabalho descartável dentro de tmp_path."""

import sys
from pathlib import Path

import pytest

import create_working_copy


def test_cria_copia_dentro_de_tmp_path(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> None:
    destino = tmp_path / "copia"
    monkeypatch.setattr(sys, "argv", ["create_working_copy.py", "--dest", str(destino)])
    assert create_working_copy.main() == 0
    assert (destino / "metrics.py").is_file()
    assert (destino / "pct_incerto.sql").is_file()
    assert (destino / ".working-copy").is_file()
