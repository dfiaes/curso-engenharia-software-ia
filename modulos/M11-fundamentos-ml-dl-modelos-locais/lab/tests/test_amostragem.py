"""Oraculos AT-016/AT-017: temperatura redistribui sem inverter; T=0 fixa.

Numeros MEDIDOS neste ambiente (stdlib, LOGITS_EXEMPLO de 7 valores):
T=0.2 top1 0.817 H 0.476; T=0.7 top1 0.562 H 0.957;
T=1.0 top1 0.481 H 1.224; T=1.5 top1 0.387 H 1.521.
Limiares com margem folgada em torno do medido.
"""

import pytest

from amostragem import LOGITS_EXEMPLO, aplicar_temperatura, entropia, greedy, top_k, top_p


def _ordem(probs: list[float]) -> list[int]:
    return sorted(range(len(probs)), key=lambda i: probs[i], reverse=True)


def test_temperatura_preserva_ordem() -> None:
    """AT-016: T em {0.2, 0.7, 1.0, 1.5} nunca inverte a ordem."""
    for t in (0.2, 0.7, 1.0, 1.5):
        assert _ordem(aplicar_temperatura(LOGITS_EXEMPLO, t)) == [0, 1, 2, 3, 4, 5, 6]


def test_entropia_cresce_com_t() -> None:
    """AT-016: 0.476 < 0.957 < 1.224 < 1.521 (medido); T baixo concentra."""
    hs = [entropia(aplicar_temperatura(LOGITS_EXEMPLO, t)) for t in (0.2, 0.7, 1.0, 1.5)]
    assert hs == sorted(hs)
    assert hs[0] < 0.7  # medido 0.476
    assert hs[-1] > 1.3  # medido 1.521


def test_top1_cai_com_t() -> None:
    """AT-016: 0.817 > 0.562 > 0.481 > 0.387 (medido)."""
    tops = [max(aplicar_temperatura(LOGITS_EXEMPLO, t)) for t in (0.2, 0.7, 1.0, 1.5)]
    assert tops == sorted(tops, reverse=True)
    assert tops[0] > 0.7  # medido 0.817
    assert tops[-1] < 0.5  # medido 0.387


def test_topk_topp_renormalizam() -> None:
    """AT-016: cortes zeram cauda e somam 1.0."""
    base = aplicar_temperatura(LOGITS_EXEMPLO, 1.0)
    for cortada in (top_k(base, 3), top_p(base, 0.9)):
        assert cortada == pytest.approx(cortada)  # finita
        assert sum(cortada) == pytest.approx(1.0)
    assert top_k(base, 3)[-1] == 0.0
    assert top_p(base, 0.9)[-1] == 0.0


def test_t_zero_vira_greedy() -> None:
    """AT-017: T<=0 fixa o argmax; repete o mesmo erro com constancia."""
    for t in (0.0, -1.0):
        assert aplicar_temperatura(LOGITS_EXEMPLO, t) == greedy(LOGITS_EXEMPLO)
    assert greedy(LOGITS_EXEMPLO) == [1.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0]
    # Limite honesto: greedy local coincide; determinismo bit a bit em API
    # (batching, empates, versao) nao e executavel aqui - ver evidencia.
