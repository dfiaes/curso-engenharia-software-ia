"""Oraculos LT03-AT-022/023: drain respeita PDB e spread; shutdown sem truncar.

Numeros: exemplo variavel (3 replicas, minimo 2; prazos em segundos logicos).
Sem cluster, sem relogio: disrupcao e conclusao como aritmetica deterministica.
"""

from __future__ import annotations

import sinais_escala as s


def test_drain_com_pdb_viavel_e_permitido() -> None:
    assert s.disrupcao_permitida(3, 1, 2) is True


def test_drain_com_pdb_impossivel_e_negado() -> None:
    assert s.disrupcao_permitida(2, 2, 2) is False


def test_replicas_no_mesmo_no_nao_e_alta_disponibilidade() -> None:
    assert s.espalhadas_ok([3, 0]) is False
    assert s.espalhadas_ok([2, 1]) is True


def test_shutdown_sob_carga_conclui_ou_cancela_sem_truncar() -> None:
    veredito = s.concluir_no_prazo([0.05, 0.2, 30.0], 0.5)
    assert veredito == {"concluidas": 2, "canceladas": 1}
