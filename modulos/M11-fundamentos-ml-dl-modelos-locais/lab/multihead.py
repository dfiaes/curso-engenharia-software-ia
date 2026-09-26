"""Atencao multi-cabeca causal sem loop por cabeca.

Referencia executavel do Bloco 3.
Implementacao verbatim na folha B03-L.
CPU-only: sem `.to(cuda)`; GPU opcional.
"""

import torch
from torch import nn
from torch.nn.functional import scaled_dot_product_attention as sdpa

N_EMBD: int = 128
N_CABECAS: int = 8


class AtencaoMultiCabeca(nn.Module):
    """Multi-head causal; a cabeca vira dimensao de lote."""

    def __init__(self, n_embd: int, n_cabecas: int, dropout: float = 0.0) -> None:
        super().__init__()
        if n_embd % n_cabecas != 0:
            raise ValueError("n_embd precisa ser divisivel por n_cabecas")
        self.n_cabecas = n_cabecas
        self.dim_cabeca = n_embd // n_cabecas
        self.dropout = dropout
        self.qkv = nn.Linear(n_embd, 3 * n_embd, bias=False)
        self.saida = nn.Linear(n_embd, n_embd, bias=False)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        b, t, c = x.shape
        q, k, v = self.qkv(x).split(c, dim=2)

        def por_cabeca(tensor: torch.Tensor) -> torch.Tensor:
            return tensor.view(b, t, self.n_cabecas, self.dim_cabeca).transpose(1, 2)

        qh, kh, vh = por_cabeca(q), por_cabeca(k), por_cabeca(v)
        y = sdpa(qh, kh, vh, dropout_p=self.dropout if self.training else 0.0, is_causal=True)
        y = y.transpose(1, 2).contiguous().view(b, t, c)
        saida: torch.Tensor = self.saida(y)
        return saida


def main() -> None:
    """Forma preservada e contagem de parametros (exemplo variavel)."""
    torch.manual_seed(1337)
    bloco = AtencaoMultiCabeca(n_embd=N_EMBD, n_cabecas=N_CABECAS)
    x = torch.randn(4, 32, N_EMBD)
    total = sum(p.numel() for p in bloco.parameters())
    print(f"saida: {tuple(bloco(x).shape)}")
    print(f"parametros: {total}")


if __name__ == "__main__":
    main()
