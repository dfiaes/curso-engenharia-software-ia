"""Seno: reta contra MLP com ativacao.

Referencia executavel do Bloco 2.
Implementacao verbatim na folha B02-L.
CPU-only: sem `.to(cuda)`; GPU opcional.
"""

import torch
from torch import nn

SEMENTE: int = 1337
N_PONTOS: int = 400
OCULTOS: int = 64
PASSOS: int = 2000
TAXA: float = 0.02


def gerar_seno(n: int) -> tuple[torch.Tensor, torch.Tensor]:
    """X em [-3, 3]; y = sin(x) + ruido."""
    x = torch.linspace(-3.0, 3.0, n).unsqueeze(1)
    y = torch.sin(x) + 0.05 * torch.randn_like(x)
    return x, y


def criar_linear() -> nn.Linear:
    """Baseline: uma reta y = wx + b."""
    return nn.Linear(1, 1)


def criar_mlp(ocultos: int = OCULTOS) -> nn.Sequential:
    """Linear -> Tanh -> Linear; a ativacao impede o colapso."""
    return nn.Sequential(
        nn.Linear(1, ocultos),
        nn.Tanh(),
        nn.Linear(ocultos, 1),
    )


def treinar(modelo: nn.Module, x: torch.Tensor, alvo: torch.Tensor) -> float:
    """Treina com Adam e devolve a perda final."""
    criterio = nn.MSELoss()
    otimizador = torch.optim.Adam(modelo.parameters(), lr=TAXA)
    perda_final = 0.0
    for _ in range(PASSOS):
        pred = modelo(x)
        perda = criterio(pred, alvo)
        otimizador.zero_grad()
        perda.backward()
        otimizador.step()
        perda_final = perda.item()
    return perda_final


def main() -> None:
    """Treina os dois e imprime as perdas finais."""
    torch.manual_seed(SEMENTE)
    x, alvo = gerar_seno(N_PONTOS)
    perda_linear = treinar(criar_linear(), x, alvo)
    perda_mlp = treinar(criar_mlp(), x, alvo)
    print(f"linear perda final = {perda_linear:.4f}")
    print(f"mlp perda final = {perda_mlp:.4f}")


if __name__ == "__main__":
    main()
