"""Regressao linear y = 3x + 2 com ruido.

Referencia executavel do Bloco 2.
Implementacao verbatim na folha B02-L.
CPU-only: sem `.to(cuda)`; GPU opcional.
"""

import torch
from torch import nn

SEMENTE: int = 1337
N_AMOSTRAS: int = 200
PASSOS: int = 500
IMPRIMIR_A_CADA: int = 100
TAXA: float = 0.1


def gerar_dados(n: int) -> tuple[torch.Tensor, torch.Tensor]:
    """Gera X e y = 3x + 2 + ruido gaussiano."""
    x = torch.randn(n, 1)
    ruido = 0.1 * torch.randn(n, 1)
    y = 3.0 * x + 2.0 + ruido
    return x, y


def construir_modelo() -> nn.Linear:
    """Modelo y = wx + b com um neuronio."""
    return nn.Linear(in_features=1, out_features=1)


def treinar(
    modelo: nn.Linear,
    x: torch.Tensor,
    alvo: torch.Tensor,
    limpar_grad: bool = True,
) -> nn.Linear:
    """Loop de 5 passos; retorna o modelo treinado."""
    criterio = nn.MSELoss()
    otimizador = torch.optim.SGD(modelo.parameters(), lr=TAXA)
    otimizador.zero_grad()
    for passo in range(PASSOS + 1):
        pred = modelo(x)  # 1. forward
        perda = criterio(pred, alvo)  # 2. loss
        perda.backward()  # 3. backward
        otimizador.step()  # 4. step
        if limpar_grad:  # 5. zero_grad
            otimizador.zero_grad()
        if passo % IMPRIMIR_A_CADA == 0:
            w = modelo.weight.item()
            b = modelo.bias.item()
            print(f"passo {passo:3d} | perda {perda.item():.4f}")
            print(f"  w={w:.2f} b={b:.2f}")
    return modelo


def main() -> None:
    """Caminho feliz: semente fixa e limpeza ligada."""
    torch.manual_seed(SEMENTE)
    x, alvo = gerar_dados(N_AMOSTRAS)
    modelo = construir_modelo()
    treinar(modelo, x, alvo, limpar_grad=True)


if __name__ == "__main__":
    main()
