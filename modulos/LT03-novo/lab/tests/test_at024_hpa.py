"""Oraculos LT03-AT-024/025: HPA estabiliza no alvo; upstream saturado nega escala.

Numeros: exemplo variavel (3 replicas a 80% contra alvo 50% -> 5, preso ao
maximo 4). Sem cluster: control loop como aritmetica; metrica real na trilha
externa.
"""

from __future__ import annotations

import sinais_escala as s


def test_hpa_sobe_por_degrau_sobre_o_alvo() -> None:
    assert s.replicas_desejadas(3, 80.0, 50.0) == 5


def test_hpa_estabiliza_sem_thrash_fora_da_faixa() -> None:
    assert s.estabilizar(5, 2, 4) == 4
    assert s.estabilizar(1, 2, 4) == 2
    assert s.estabilizar(3, 2, 4) == 3


def test_mesma_entrada_mesma_saida_sem_oscilacao() -> None:
    primeira = s.estabilizar(s.replicas_desejadas(3, 80.0, 50.0), 2, 6)
    segunda = s.estabilizar(s.replicas_desejadas(3, 80.0, 50.0), 2, 6)
    assert primeira == segunda == 5


def test_upstream_saturado_nega_escala() -> None:
    assert s.escala_permitida(False) is True
    assert s.escala_permitida(True) is False
