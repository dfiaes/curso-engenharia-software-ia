"""Oraculos AT-001/AT-002/AT-006: regressao y = 3x + 2.

Limiares numericos MEDIDOS neste ambiente (CPU, torch 2.9.1, semente 1337):
caminho feliz (limpar_grad=True) termina em perda 0.0127, w = 2.9987,
b = 2.0058; caminho quebrado (limpar_grad=False) termina em 3.0697
(oscila, sem nan). Os limiares fixam margem folgada em torno do medido.
"""

import math

import pytest
import torch
from torch import nn

from regressao import N_AMOSTRAS, SEMENTE, construir_modelo, gerar_dados, treinar


def test_mesma_semente_reproduz_dados() -> None:
    """AT-001: mesma semente gera X e y identicos."""
    torch.manual_seed(SEMENTE)
    x1, y1 = gerar_dados(N_AMOSTRAS)
    torch.manual_seed(SEMENTE)
    x2, y2 = gerar_dados(N_AMOSTRAS)
    assert torch.equal(x1, x2)
    assert torch.equal(y1, y2)


def test_semente_solta_diverge() -> None:
    """AT-001 negativo: sem re-semeadura, a sequencia avancou e difere."""
    torch.manual_seed(SEMENTE)
    x1, y1 = gerar_dados(N_AMOSTRAS)
    x2, y2 = gerar_dados(N_AMOSTRAS)
    assert not torch.equal(x1, x2)
    assert not torch.equal(y1, y2)


def test_limpar_grad_converge_para_pesos_reais() -> None:
    """AT-002 positivo: com limpeza, perda 8.7459 -> 0.0127 (medido)."""
    torch.manual_seed(SEMENTE)
    x, alvo = gerar_dados(N_AMOSTRAS)
    modelo = construir_modelo()
    criterio = nn.MSELoss()
    perda_inicial = criterio(modelo(x), alvo).item()
    treinar(modelo, x, alvo, limpar_grad=True)
    perda_final = criterio(modelo(x), alvo).item()
    assert perda_final < perda_inicial
    assert perda_final < 0.05  # medido 0.0127 neste ambiente
    assert modelo.weight.item() == pytest.approx(3.0, abs=0.1)  # medido 2.9987
    assert modelo.bias.item() == pytest.approx(2.0, abs=0.1)  # medido 2.0058


def test_sem_limpar_grad_diverge() -> None:
    """AT-002 negativo: sem limpeza, perda final 3.0697 (medido), sem nan."""
    torch.manual_seed(SEMENTE)
    x, alvo = gerar_dados(N_AMOSTRAS)
    modelo = construir_modelo()
    treinar(modelo, x, alvo, limpar_grad=False)
    perda_final = nn.MSELoss()(modelo(x), alvo).item()
    assert math.isnan(perda_final) or perda_final > 0.5  # medido 3.0697


def test_alvo_com_linhas_a_mais_falha_com_erro_de_forma() -> None:
    """AT-006: juncao (200,1) contra (201,1) levanta antes de treinar calado."""
    torch.manual_seed(SEMENTE)
    x, _ = gerar_dados(N_AMOSTRAS)
    alvo_errado = torch.randn(N_AMOSTRAS + 1, 1)
    modelo = construir_modelo()
    with pytest.raises(RuntimeError, match="must match"):
        treinar(modelo, x, alvo_errado, limpar_grad=True)
