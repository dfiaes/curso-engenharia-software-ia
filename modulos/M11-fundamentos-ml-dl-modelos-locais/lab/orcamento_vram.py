"""Estimador de VRAM para servir modelo local; sem rede, sem pesos.

Referencia executavel do Bloco 6.
Implementacao verbatim na folha B06-L. So STDLIB (argparse, dataclasses).
"""

import argparse
from dataclasses import dataclass

BYTES_POR_PARAM: dict[str, float] = {
    "FP16": 2.00,
    "Q8_0": 1.06,
    "Q6_K": 0.82,
    "Q5_K_M": 0.70,
    "Q4_K_M": 0.58,
    "Q4_K_S": 0.55,
    "Q3_K_S": 0.44,
}
"""Bytes por parametro por esquema; valor de consulta, nao medida."""


@dataclass(frozen=True, slots=True)
class Orcamento:
    pesos_gb: float
    kv_gb: float
    overhead_gb: float

    @property
    def total_gb(self) -> float:
        """Soma das tres parcelas."""
        return self.pesos_gb + self.kv_gb + self.overhead_gb


def estimar(
    bilhoes: float,
    quant: str,
    ctx: int,
    batch: int = 1,
    n_camadas: int = 32,
    n_kv: int = 8,
    dim_cabeca: int = 128,
    bytes_valor: int = 2,
    overhead_gb: float = 1.5,
) -> Orcamento:
    """Aplica pesos + KV + overhead; levanta KeyError em quant desconhecido."""
    pesos = bilhoes * 1e9 * BYTES_POR_PARAM[quant] / 1024**3
    kv = (2 * n_camadas * n_kv * dim_cabeca * ctx * batch * bytes_valor) / 1024**3
    return Orcamento(pesos_gb=pesos, kv_gb=kv, overhead_gb=overhead_gb)


def main() -> None:
    """CLI: bilhoes posicionais; flags --quant, --ctx, --batch."""
    ap = argparse.ArgumentParser()
    ap.add_argument("bilhoes", type=float)
    ap.add_argument("--quant", default="Q4_K_M", choices=sorted(BYTES_POR_PARAM))
    ap.add_argument("--ctx", type=int, default=8192)
    ap.add_argument("--batch", type=int, default=1)
    a = ap.parse_args()
    o = estimar(a.bilhoes, a.quant, a.ctx, a.batch)
    print(f"pesos      {o.pesos_gb:6.2f} GB")
    print(f"cache KV   {o.kv_gb:6.2f} GB   (ctx={a.ctx}, batch={a.batch})")
    print(f"overhead   {o.overhead_gb:6.2f} GB")
    print(f"{'TOTAL':10s} {o.total_gb:6.2f} GB")


if __name__ == "__main__":
    main()
