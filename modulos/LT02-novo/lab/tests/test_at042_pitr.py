"""Oraculo LT02-AT-042: PITR recupera em instancia isolada.

Exclusao valida de job-9 (seq 3) apos duas escritas (SEED_B05=20260818):
restore ate a sequencia anterior em destino isolado devolve job-9 com o
valor anterior e a query de validacao confirma; a origem segue sem o dado
(ler_em na ponta devolve None). Ponto e sequencia, nunca relogio.
"""

from __future__ import annotations

import sqlite3
from pathlib import Path

from pitr_journal import JournalPitr

SEED_B05 = 20260818
CHAVE_JOB = "job-9"
VALOR_JOB = "reserva-confirmada-v1"


def test_exclusao_valida_restaura_ponto_anterior_em_isolado(tmp_path: Path) -> None:
    origem = str(tmp_path / "origem.db")
    destino = str(tmp_path / "restaura.db")
    base = JournalPitr(origem)
    base.abrir()
    s1 = base.escrever(CHAVE_JOB, VALOR_JOB)
    s2 = base.escrever("job-10", "outro-v1")
    s_exclui = base.excluir(CHAVE_JOB)
    assert (s1, s2, s_exclui) == (1, 2, 3)

    voltaram = base.restaurar_ate(s_exclui - 1, destino)
    assert voltaram == 2

    consulta = sqlite3.connect(destino, check_same_thread=False)
    try:
        linha = consulta.execute(
            "SELECT valor FROM recuperado WHERE chave = ?", (CHAVE_JOB,)
        ).fetchone()
    finally:
        consulta.close()
    assert linha is not None and linha[0] == VALOR_JOB

    # Origem intacta para nova tentativa: segue sem o dado na ponta.
    assert base.ler_em(CHAVE_JOB, s_exclui) is None
    assert base.ler_em(CHAVE_JOB, s_exclui - 1) == VALOR_JOB
