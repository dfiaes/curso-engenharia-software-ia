"""Oraculo AT-005 (+ guarda AT-006): broadcasting e forma esperada.

Segue o trecho conceitual do Bloco 2: a expansao silenciosa
(4,1)+(1,4)->(4,4) nao levanta erro; so o assert explicito de forma acusa.
"""

import pytest
import torch


def test_broadcast_expande_para_4x4() -> None:
    """AT-005: (4,1)+(1,4) devolve (4,4) sem erro."""
    a = torch.ones(4, 1)
    b = torch.ones(1, 4)
    c = a + b
    assert c.shape == torch.Size([4, 4])


def test_assert_acusa_expectativa_errada_de_vetor() -> None:
    """AT-005 mutante: quem esperava vetor de 4 recebe (4,4) e o assert falha."""
    a = torch.ones(4, 1)
    b = torch.ones(1, 4)
    c = a + b
    with pytest.raises(AssertionError):
        assert c.shape == torch.Size([4])


def test_guarda_de_forma_correta_passa() -> None:
    """Guarda AT-006: forma declarada (B,T,C) confere antes do treino."""
    b, t, c = 4, 16, 32
    x = torch.randn(b, t, c)
    assert x.shape == (b, t, c)
