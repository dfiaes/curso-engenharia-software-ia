"""Oraculo AT-011: multi-head preserva forma; erros classicos levantam.

Numeros MEDIDOS neste ambiente (CPU, torch 2.9.1, semente 1337):
saida (4, 32, 128) == entrada; parametros 65536 (qkv 128x384 = 49152 +
saida 128x128 = 16384, sem vies); saida finita.
"""

import pytest
import torch

from multihead import N_CABECAS, N_EMBD, AtencaoMultiCabeca


def test_forma_preservada_4_32_128() -> None:
    """AT-011 positivo: (4,32,128) entra, (4,32,128) sai, finita."""
    torch.manual_seed(1337)
    bloco = AtencaoMultiCabeca(n_embd=N_EMBD, n_cabecas=N_CABECAS)
    bloco.eval()
    x = torch.randn(4, 32, N_EMBD)
    with torch.no_grad():
        y = bloco(x)
    assert y.shape == x.shape
    assert y.shape == torch.Size([4, 32, 128])
    assert bool(torch.isfinite(y).all())


def test_parametros_contados_maiores_que_zero() -> None:
    """AT-011 positivo: 65536 parametros treinaveis (medido)."""
    bloco = AtencaoMultiCabeca(n_embd=N_EMBD, n_cabecas=N_CABECAS)
    total = sum(p.numel() for p in bloco.parameters())
    assert total > 0
    assert total == 65536  # medido: 49152 (qkv) + 16384 (saida)


def test_view_sem_contiguous_levanta() -> None:
    """AT-011 negativo: view apos transpose sem contiguous levanta."""
    b, t, h, d = 2, 8, 4, 16
    por_cabeca = torch.randn(b, t, h * d).view(b, t, h, d).transpose(1, 2)
    assert por_cabeca.shape == torch.Size([b, h, t, d])
    with pytest.raises(RuntimeError, match="not compatible"):
        por_cabeca.view(b, t, h * d)
    # O reparo canonico: contiguous entre transpose e view funciona.
    assert por_cabeca.contiguous().view(b, t, h * d).shape == torch.Size([b, t, h * d])


def test_n_embd_indivisivel_levanta() -> None:
    """AT-011 negativo: n_embd=100 com 8 cabecas levanta ValueError."""
    with pytest.raises(ValueError, match="divisivel"):
        AtencaoMultiCabeca(n_embd=100, n_cabecas=8)
