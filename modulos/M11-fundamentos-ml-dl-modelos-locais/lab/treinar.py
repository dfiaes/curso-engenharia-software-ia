"""Treino curto CPU do GPT mínimo sobre corpus local.

Referencia executavel do Bloco 4.
Implementacao verbatim na folha B04-L.
CPU-only: sem `.to(cuda)`; GPU opcional.
Default offline: char-level local. Tiktoken/HF só em trilha
opcional com cache declarado, nunca como caminho único.
"""

from pathlib import Path

import torch

from gpt import Config, GPTMinusculo

CORPUS: Path = Path(__file__).with_name("fixtures") / "corpus.txt"
SEMENTE: int = 1337
CONTEXTO: int = 64
LOTE: int = 16
PASSOS: int = 600
TAXA: float = 3e-4


def carregar_texto(caminho: Path = CORPUS) -> str:
    return caminho.read_text(encoding="utf-8")


def construir_vocab(texto: str) -> tuple[dict[str, int], dict[int, str]]:
    chars = sorted(set(texto))
    stoi = {c: i for i, c in enumerate(chars)}
    return stoi, {i: c for c, i in stoi.items()}


def codificar(texto: str, stoi: dict[str, int]) -> torch.Tensor:
    return torch.tensor([stoi[c] for c in texto], dtype=torch.long)


def dividir(dados: torch.Tensor, fracao: float = 0.9) -> tuple[torch.Tensor, torch.Tensor]:
    corte = int(fracao * len(dados))
    return dados[:corte], dados[corte:]


def fazer_lote(
    origem: torch.Tensor, contexto: int, tamanho: int
) -> tuple[torch.Tensor, torch.Tensor]:
    ix = torch.randint(len(origem) - contexto - 1, (tamanho,))
    x = torch.stack([origem[i : i + contexto] for i in ix])
    y = torch.stack([origem[i + 1 : i + 1 + contexto] for i in ix])
    return x, y


def avaliar(modelo: GPTMinusculo, origem: torch.Tensor) -> float:
    modelo.eval()
    with torch.no_grad():
        _, perda = modelo(*fazer_lote(origem, modelo.cfg.contexto, LOTE))
    modelo.train()
    assert perda is not None
    valor: float = perda.item()
    return valor


def treinar(passos: int = PASSOS, demo_overfitting: bool = False) -> tuple[float, float]:
    torch.manual_seed(SEMENTE)
    texto = carregar_texto()
    if demo_overfitting:
        texto = texto[:2000]
        passos = passos * 4
    stoi, _ = construir_vocab(texto)
    treino, valid = dividir(codificar(texto, stoi))
    modelo = GPTMinusculo(Config(vocab=len(stoi), contexto=CONTEXTO))
    otim = torch.optim.AdamW(modelo.parameters(), lr=TAXA)
    final_treino = 0.0
    for passo in range(passos + 1):
        x, y = fazer_lote(treino, CONTEXTO, LOTE)
        _, perda = modelo(x, y)
        assert perda is not None
        otim.zero_grad()
        perda.backward()
        otim.step()
        final_treino = perda.item()
        if passo % 200 == 0:
            print(f"passo {passo} | treino {final_treino:.3f} | valid {avaliar(modelo, valid):.3f}")
    return final_treino, avaliar(modelo, valid)


def main() -> None:
    treinar()


if __name__ == "__main__":
    main()
