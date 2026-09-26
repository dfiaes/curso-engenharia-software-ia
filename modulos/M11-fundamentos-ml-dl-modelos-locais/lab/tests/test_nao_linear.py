"""Oraculo AT-007: sem ativacao, profundidade colapsa numa reta.

Numeros MEDIDOS neste ambiente (CPU, torch 2.9.1, ordem do main()):
reta 0.1657, MLP com Tanh 0.0045, mutante Linear-Linear 0.1657
(igual a reta ate 1.5e-08 em 5 sementes de inicializacao).
"""

import pytest
import torch
from torch import nn

from nao_linear import N_PONTOS, OCULTOS, SEMENTE, criar_linear, criar_mlp, gerar_seno, treinar


def test_mlp_com_tanh_supera_reta_com_margem() -> None:
    """AT-007 positivo: MLP 0.0045 << reta 0.1657 (medido)."""
    torch.manual_seed(SEMENTE)
    x, alvo = gerar_seno(N_PONTOS)
    perda_linear = treinar(criar_linear(), x, alvo)
    perda_mlp = treinar(criar_mlp(), x, alvo)
    assert perda_linear > 0.05  # medido 0.1657 neste ambiente
    assert perda_mlp < 0.02  # medido 0.0045 neste ambiente
    assert perda_mlp < perda_linear / 10


def test_mutante_sem_ativacao_colapsa_na_reta() -> None:
    """AT-007 negativo: Linear-Linear equivale a reta (dif medido 0.0)."""
    torch.manual_seed(SEMENTE)
    x, alvo = gerar_seno(N_PONTOS)
    perda_linear = treinar(criar_linear(), x, alvo)
    torch.manual_seed(7)
    mutante = nn.Sequential(nn.Linear(1, OCULTOS), nn.Linear(OCULTOS, 1))
    assert not any(isinstance(modulo, nn.Tanh) for modulo in mutante.modules())
    perda_mutante = treinar(mutante, x, alvo)
    assert perda_mutante == pytest.approx(perda_linear, abs=0.01)
    assert perda_mutante > 0.05  # longe do regime do MLP (< 0.02)
