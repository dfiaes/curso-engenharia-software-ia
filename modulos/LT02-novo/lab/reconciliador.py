"""Reconciliador: unknown pergunta ao executor antes de tentar de novo.

Referencia executavel do Bloco 3.
Implementacao verbatim na folha B03-L. So STDLIB (dataclasses).
"""

from __future__ import annotations

from dataclasses import dataclass

from repositorio_idempotente import RepositorioIdempotente


@dataclass(frozen=True)
class LedgerExterno:
    """Efeitos reais observaveis: operation ID contra resposta executada."""

    efeitos: dict[str, str]

    def consultar_por_operation(self, operation_id: str) -> str | None:
        """Resposta executada para o operation ID; None quando nada executou."""
        return self.efeitos.get(operation_id)


@dataclass
class Reconciliador:
    """Fecha unknown sem repetir efeito: presente conclui, ausente retenta."""

    repositorio: RepositorioIdempotente
    ledger: LedgerExterno

    def reconciliar_unknown(self, chave: str, operation_id: str, dono_token: int) -> str:
        """Efeito presente conclui com resposta observada; ausente libera retentativa."""
        observada = self.ledger.consultar_por_operation(operation_id)
        if observada is not None:
            self.repositorio.concluir(chave, dono_token, observada)
            return f"reconciliada-sem-reefeito:{observada}"
        return "ausente-liberar-retentativa"
