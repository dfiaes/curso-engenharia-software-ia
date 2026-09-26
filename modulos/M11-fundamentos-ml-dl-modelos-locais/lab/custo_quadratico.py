"""Varredura do custo quadratico da atencao.

Referencia executavel do Bloco 3.
Implementacao verbatim na folha B03-L.
CPU-only: mede na maquina local; GPU opcional.
"""

import time

import torch
from torch.nn.functional import scaled_dot_product_attention as sdpa

SEMENTE: int = 1337
REPETICOES: int = 5
CONTEXTOS: tuple[int, ...] = (128, 256, 512, 1024)
CABECAS: int = 4
DIM_CABECA: int = 32


def medir_ms(tokens: int) -> float:
    """Tempo medio em ms de uma chamada causal para o contexto dado."""
    q = torch.randn(1, CABECAS, tokens, DIM_CABECA)
    k = torch.randn(1, CABECAS, tokens, DIM_CABECA)
    v = torch.randn(1, CABECAS, tokens, DIM_CABECA)
    sdpa(q, k, v, is_causal=True)
    inicio = time.perf_counter()
    for _ in range(REPETICOES):
        sdpa(q, k, v, is_causal=True)
    return (time.perf_counter() - inicio) / REPETICOES * 1000.0


def varrer_contextos() -> list[tuple[int, float, int, str]]:
    """Varre CONTEXTOS; devolve (tokens, ms, celulas, razao)."""
    linhas: list[tuple[int, float, int, str]] = []
    anterior = 0.0
    for tokens in CONTEXTOS:
        ms = medir_ms(tokens)
        razao = f"{ms / anterior:.2f}x" if anterior > 0.0 else "--"
        linhas.append((tokens, ms, tokens * tokens, razao))
        anterior = ms
    return linhas


def main() -> None:
    """Imprime a tabela tokens | tempo | celulas | razao (AT-010)."""
    torch.manual_seed(SEMENTE)
    print(f"{'tokens':>7} | {'tempo(ms)':>10} | {'celulas T*T':>12} | {'razao':>6}")
    for tokens, ms, celulas, razao in varrer_contextos():
        print(f"{tokens:7d} | {ms:10.2f} | {celulas:12d} | {razao:>6}")


if __name__ == "__main__":
    main()
