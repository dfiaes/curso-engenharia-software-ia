"""Custo por 1M de tokens de saida rodando local; sem servidor, sem rede.

Referencia executavel do Bloco 8.
Implementacao verbatim na folha B08-L. So STDLIB (argparse, dataclasses).
"""

from __future__ import annotations

import argparse
from dataclasses import dataclass


@dataclass(frozen=True, slots=True)
class CustoLocal:
    preco_hw: float
    vida_meses: int
    watts: float
    kwh: float
    tok_s: float
    util: float = 0.25

    @property
    def horas_por_mtok(self) -> float:
        """Horas de geracao para emitir um milhao de tokens."""
        return 1_000_000 / self.tok_s / 3600

    def custo_por_mtok(self) -> tuple[float, float, float]:
        """(energia, hardware, total) em USD por milhao de tokens."""
        horas = self.horas_por_mtok
        energia = horas * (self.watts / 1000) * self.kwh
        horas_uteis = self.vida_meses * 30 * 24 * self.util
        hardware = horas * (self.preco_hw / horas_uteis)
        return energia, hardware, energia + hardware


def main() -> None:
    """CLI: --preco-hw USD --vida-meses N --watts W --kwh USD --tok-s T [--util F]."""
    ap = argparse.ArgumentParser()
    ap.add_argument("--preco-hw", type=float, required=True)
    ap.add_argument("--vida-meses", type=int, required=True)
    ap.add_argument("--watts", type=float, required=True)
    ap.add_argument("--kwh", type=float, required=True)
    ap.add_argument("--tok-s", type=float, required=True)
    ap.add_argument("--util", type=float, default=0.25)
    a = ap.parse_args()
    c = CustoLocal(a.preco_hw, a.vida_meses, a.watts, a.kwh, a.tok_s, a.util)
    energia, hardware, total = c.custo_por_mtok()
    print(f"energia    US$ {energia:7.2f} / Mtok")
    print(f"hardware   US$ {hardware:7.2f} / Mtok")
    print(f"TOTAL      US$ {total:7.2f} / Mtok")


if __name__ == "__main__":
    main()
