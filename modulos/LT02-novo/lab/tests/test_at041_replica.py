"""Oraculo LT02-AT-041: stale read tratada por requisito.

Replica com atraso_versoes=2 sobre 4 publicacoes (SEED_B05=20260818):
tolerante serve o velho dentro da idade (v2); exigente com versao minima
nova levanta StaleRead com as versoes em vez de servir calado; caminho
do primario serve sempre a mais nova. Lag em versoes, nunca em segundos.
"""

from __future__ import annotations

import pytest

from replica_atrasada import ReplicaAtrasada, StaleRead

SEED_B05 = 20260818
ATRASO = 2


def _replica() -> ReplicaAtrasada:
    replica = ReplicaAtrasada(atraso_versoes=ATRASO)
    for i in range(1, 5):
        replica.publicar(f"payload-v{i}")
    return replica


def test_replica_serve_velho_dentro_da_idade() -> None:
    replica = _replica()
    vista = replica.ler_replica()
    assert (vista.versao, vista.payload) == (2, "payload-v2")
    assert replica.ler_primaria().versao == 4


def test_exigente_detecta_velho_e_levanta() -> None:
    replica = _replica()
    with pytest.raises(StaleRead, match="replica em v2 exige ao menos v4"):
        replica.exigir_nova(4)


def test_exigente_na_fronteira_serve_e_primario_e_novo() -> None:
    replica = _replica()
    servida = replica.exigir_nova(2)  # idade exata tolerada
    assert servida.versao == 2
    assert replica.ler_primaria().payload == "payload-v4"
