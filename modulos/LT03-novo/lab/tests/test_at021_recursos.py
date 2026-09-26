"""Oraculo LT03-AT-021: causa de throttle/OOM identificada; request por medida.

Numeros: exemplo variavel (medicao 200m CPU, margem 25% -> pedido 250m).
Sem cluster: QoS e pedido recalculado como dados; throttle/OOM reais na
trilha externa.
"""

from __future__ import annotations

import sinais_escala as s


def test_qos_garantida_quando_pedido_igual_teto() -> None:
    pedido = {"cpu": True, "memoria": True}
    assert s.classificar_qos(pedido, dict(pedido)) == "garantida"


def test_qos_intermediaria_com_pedido_parcial() -> None:
    assert s.classificar_qos({"cpu": True, "memoria": False}, {}) == "intermediaria"


def test_qos_oportunista_sem_nada_declarado() -> None:
    assert s.classificar_qos({}, {}) == "oportunista"


def test_pedido_recalculado_por_medida_com_margem() -> None:
    assert s.pedido_por_medicao(200.0, 0.25) == 250.0


def test_limite_arbitrario_nao_vem_de_medicao() -> None:
    assert s.pedido_por_medicao(200.0, 0.0) != s.pedido_por_medicao(800.0, 0.0)
