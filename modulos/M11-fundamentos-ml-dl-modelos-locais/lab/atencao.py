"""Cabeca de atencao causal manual + prova contra SDPA.

Referencia executavel do Bloco 3.
Implementacao verbatim na folha B03-L.
CPU-only: sem `.to(cuda)`; GPU opcional.
"""

import math

import torch
from torch import nn
from torch.nn.functional import scaled_dot_product_attention as sdpa

SEMENTE: int = 1337
LOTE: int = 2
TOKENS: int = 8
DIM_ENTRADA: int = 32
DIM_CABECA: int = 16
CONTEXTO_MAX: int = 64
ATOL: float = 1e-5


class CabecaAtencao(nn.Module):
    """Uma cabeca de self-attention causal, passo a passo."""

    mascara: torch.Tensor

    def __init__(self, dim_entrada: int, dim_cabeca: int, contexto_max: int) -> None:
        super().__init__()
        self.dim_cabeca = dim_cabeca
        self.para_query = nn.Linear(dim_entrada, dim_cabeca, bias=False)
        self.para_key = nn.Linear(dim_entrada, dim_cabeca, bias=False)
        self.para_value = nn.Linear(dim_entrada, dim_cabeca, bias=False)
        self.register_buffer("mascara", torch.tril(torch.ones(contexto_max, contexto_max)))

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        _, t, _ = x.shape
        q = self.para_query(x)
        k = self.para_key(x)
        v = self.para_value(x)
        escores = q @ k.transpose(-2, -1) / math.sqrt(self.dim_cabeca)
        escores = escores.masked_fill(self.mascara[:t, :t] == 0, float("-inf"))
        pesos = torch.softmax(escores, dim=-1)
        saida: torch.Tensor = pesos @ v
        return saida


def comparar_com_sdpa() -> float:
    """Roda a cabeca manual e SDPA sobre a mesma entrada; devolve o erro maximo."""
    torch.manual_seed(SEMENTE)
    x = torch.randn(LOTE, TOKENS, DIM_ENTRADA)
    cabeca = CabecaAtencao(DIM_ENTRADA, DIM_CABECA, CONTEXTO_MAX)
    manual = cabeca(x)
    q = cabeca.para_query(x)
    k = cabeca.para_key(x)
    v = cabeca.para_value(x)
    oficial = sdpa(q, k, v, is_causal=True)
    assert manual.shape == oficial.shape
    assert torch.allclose(manual, oficial, atol=ATOL)
    erro: float = (manual - oficial).abs().max().item()
    return erro


def main() -> None:
    """Prova AT-009: manual equivale a SDPA dentro da tolerancia."""
    erro = comparar_com_sdpa()
    print(f"formas iguais; erro maximo = {erro:.2e}")


if __name__ == "__main__":
    main()
