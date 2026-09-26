"""Matriz API x local e ponto de equilibrio; sem servidor, sem rede.

Referencia executavel do Bloco 8.
Implementacao verbatim na folha B08-L. So STDLIB (dataclasses).
"""

from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True, slots=True)
class ConfigExec:
    provedor: str
    modelo: str
    quant: str | None


@dataclass(frozen=True, slots=True)
class ResultadoExec:
    config: ConfigExec
    aprov: int
    total: int
    p50: float
    p95: float
    custo: float

    @property
    def taxa(self) -> float:
        """Fracao de aprovados; 0.0 sem casos."""
        return self.aprov / self.total if self.total else 0.0


def tabela_markdown(resultados: list[ResultadoExec]) -> str:
    """Uma linha por configuracao: taxa, p50, p95 e custo."""
    linhas = [
        "| provedor | modelo | quant | taxa | p50 | p95 | custo |",
        "|---|---|---|---|---|---|---|",
    ]
    for r in resultados:
        linhas.append(
            f"| {r.config.provedor} | {r.config.modelo} | "
            f"{r.config.quant or '-'} | {r.taxa:.3f} | "
            f"{r.p50:.1f} | {r.p95:.1f} | {r.custo:.4f} |"
        )
    return "\n".join(linhas)


def break_even(
    relatorios_mes: int,
    tokens_relatorio: int,
    custo_api_mtok: float,
    custo_local_mtok: float,
    fixo_mensal: float,
) -> tuple[float, float, str]:
    """(custo_api, custo_local, veredito) no volume declarado."""
    mtok = relatorios_mes * tokens_relatorio / 1_000_000
    api = mtok * custo_api_mtok
    local = fixo_mensal + mtok * custo_local_mtok
    veredito = "local" if local < api else "api"
    return api, local, veredito
