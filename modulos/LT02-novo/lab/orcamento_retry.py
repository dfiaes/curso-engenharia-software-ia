"""Orcamento finito de retries com backoff e jitter deterministico.

Referencia executavel do Bloco 4.
Implementacao verbatim na folha B04-L. So STDLIB (dataclasses).
Sem relogio de parede e sem rede: tempos sao inteiros da agenda.
"""

from __future__ import annotations

from dataclasses import dataclass, field


@dataclass
class OrcamentoRetry:
    """Teto por mensagem e teto global; jitter espalha concorrentes."""

    max_tentativas: int
    orcamento_total: int
    usados: int = 0
    tentativas_por_chave: dict[str, int] = field(default_factory=dict)

    def pode_tentar(self, chave: str) -> bool:
        """Verdadeiro quando a chave e o orcamento global ainda tem saldo."""
        return (
            self.tentativas_por_chave.get(chave, 0) < self.max_tentativas
            and self.usados < self.orcamento_total
        )

    def registrar_tentativa(self, chave: str) -> str:
        """Consome uma unidade do orcamento ou devolve o motivo da recusa."""
        if self.tentativas_por_chave.get(chave, 0) >= self.max_tentativas:
            return "recusada:max-tentativas"
        if self.usados >= self.orcamento_total:
            return "recusada:orcamento-esgotado"
        self.tentativas_por_chave[chave] = self.tentativas_por_chave.get(chave, 0) + 1
        self.usados += 1
        return "tentar"

    def atraso_ms(self, tentativa: int, base_ms: int, teto_ms: int, semente: int) -> int:
        """Backoff exponencial com teto e jitter deterministico por semente."""
        espera: int = base_ms * (2 ** max(tentativa - 1, 0))
        espera = min(espera, teto_ms)
        mistura = (semente * 2654435761) % 1000
        jitter = mistura % (base_ms + 1)
        return espera + jitter
