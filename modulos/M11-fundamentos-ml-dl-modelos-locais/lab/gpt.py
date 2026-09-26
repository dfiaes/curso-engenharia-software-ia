"""GPT mínimo Pre-LN sobre a atenção do Bloco 3.

Referencia executavel do Bloco 4.
Implementacao verbatim na folha B04-L.
CPU-only: sem `.to(cuda)`; GPU opcional.
"""

from dataclasses import dataclass

import torch
from torch import nn
from torch.nn import functional as F

from multihead import AtencaoMultiCabeca


@dataclass(frozen=True)
class Config:
    vocab: int
    contexto: int = 64
    n_embd: int = 128
    n_cabecas: int = 4
    n_camadas: int = 4
    dropout: float = 0.0


class MLP(nn.Module):
    def __init__(self, cfg: Config) -> None:
        super().__init__()
        self.rede = nn.Sequential(
            nn.Linear(cfg.n_embd, 4 * cfg.n_embd),
            nn.GELU(),
            nn.Linear(4 * cfg.n_embd, cfg.n_embd),
            nn.Dropout(cfg.dropout),
        )

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        saida: torch.Tensor = self.rede(x)
        return saida


class Bloco(nn.Module):
    def __init__(self, cfg: Config) -> None:
        super().__init__()
        self.ln1 = nn.LayerNorm(cfg.n_embd)
        self.atencao = AtencaoMultiCabeca(cfg.n_embd, cfg.n_cabecas, cfg.dropout)
        self.ln2 = nn.LayerNorm(cfg.n_embd)
        self.mlp = MLP(cfg)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        x = x + self.atencao(self.ln1(x))
        x = x + self.mlp(self.ln2(x))
        return x


class GPTMinusculo(nn.Module):
    def __init__(self, cfg: Config) -> None:
        super().__init__()
        self.cfg = cfg
        self.emb_token = nn.Embedding(cfg.vocab, cfg.n_embd)
        self.emb_posicao = nn.Embedding(cfg.contexto, cfg.n_embd)
        self.blocos = nn.ModuleList([Bloco(cfg) for _ in range(cfg.n_camadas)])
        self.ln_final = nn.LayerNorm(cfg.n_embd)
        self.cabeca = nn.Linear(cfg.n_embd, cfg.vocab, bias=False)

    def forward(
        self, idx: torch.Tensor, alvos: torch.Tensor | None = None
    ) -> tuple[torch.Tensor, torch.Tensor | None]:
        b, t = idx.shape
        pos = torch.arange(t, device=idx.device)
        x = self.emb_token(idx) + self.emb_posicao(pos)
        for bloco in self.blocos:
            x = bloco(x)
        logits = self.cabeca(self.ln_final(x))
        perda: torch.Tensor | None = None
        if alvos is not None:
            perda = F.cross_entropy(logits.view(b * t, self.cfg.vocab), alvos.view(b * t))
        return logits, perda

    @torch.no_grad()
    def gerar(self, idx: torch.Tensor, n: int, temperatura: float = 1.0) -> torch.Tensor:
        for _ in range(n):
            recorte = idx[:, -self.cfg.contexto :]
            logits, _ = self(recorte)
            passo = logits[:, -1, :] / temperatura
            probs = F.softmax(passo, dim=-1)
            prox = torch.multinomial(probs, num_samples=1)
            idx = torch.cat([idx, prox], dim=1)
        return idx


def main() -> None:
    torch.manual_seed(1337)
    cfg = Config(vocab=64)
    modelo = GPTMinusculo(cfg)
    x = torch.zeros((2, 8), dtype=torch.long)
    logits, perda = modelo(x, x)
    print(tuple(logits.shape), perda.item() if perda is not None else None)


if __name__ == "__main__":
    main()
