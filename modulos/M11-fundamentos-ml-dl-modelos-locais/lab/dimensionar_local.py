"""Dimensiona (quant, ctx, parallel) a partir da VRAM; sem servidor.

Referencia executavel do Bloco 7.
Implementacao verbatim na folha B07-L. So STDLIB + orcamento_vram.
"""

from __future__ import annotations

import argparse

from orcamento_vram import estimar

QUANTS_ORDEM = ("Q8_0", "Q6_K", "Q5_K_M", "Q4_K_M", "Q4_K_S", "Q3_K_S")


def factivel(vram_gb: float, quant: str, ctx: int, parallel: int) -> bool:
    """Verdadeiro quando pesos + KV + overhead cabem na VRAM."""
    o = estimar(8.0, quant, ctx, parallel)
    return o.total_gb <= vram_gb


def recomendar(vram_gb: float, ctx_max: int, parallel: int) -> str:
    """Maior quant que cabe; ctx/parallel pedidos ou 'API'."""
    for quant in QUANTS_ORDEM:
        if factivel(vram_gb, quant, ctx_max, parallel):
            return f"{quant} ctx={ctx_max} parallel={parallel}"
        for ctx in (ctx_max // 2, 4096, 2048):
            if ctx >= 2048 and factivel(vram_gb, quant, ctx, parallel):
                return f"{quant} ctx={ctx} parallel={parallel} (reduzido)"
    return "API"


def main() -> None:
    """CLI: --vram GB --ctx-max N --parallel P."""
    ap = argparse.ArgumentParser()
    ap.add_argument("--vram", type=float, required=True)
    ap.add_argument("--ctx-max", type=int, default=8192)
    ap.add_argument("--parallel", type=int, default=1)
    a = ap.parse_args()
    print(recomendar(a.vram, a.ctx_max, a.parallel))


if __name__ == "__main__":
    main()
