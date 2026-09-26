"""Oráculo LT02-AT-024: crash após efeito reconcilia sem repetir.

Semente SEED_B03=20260816, amostra 2 chaves (presente e ausente). Worker
morre após o efeito e antes de persistir a conclusão: repositório marca
started, ledger externo contém o operation ID. Reconciliar consulta o
executor primeiro: presente conclui com a resposta observada sem novo
efeito; ausente libera retentativa. Ledger é o oráculo. Sem rede.
"""

from __future__ import annotations

from pathlib import Path

from reconciliador import LedgerExterno, Reconciliador
from repositorio_idempotente import RepositorioIdempotente

SEED_B03 = 20260816
CHAVE = "res-7"
INTENT = "reservar-1-unidade-orcamento-X"
OPERATION = "op-res-7"


def test_crash_apos_efeito_reconcilia_sem_reefeito(tmp_path: Path) -> None:
    repo = RepositorioIdempotente(str(tmp_path / "idem.db"))
    assert repo.reservar(CHAVE, INTENT, 1) == "reservada"
    # Efeito real aconteceu; worker morreu antes de concluir.
    ledger = LedgerExterno(efeitos={OPERATION: "reserva-ok"})
    reconciliador = Reconciliador(repo, ledger)
    resultado = reconciliador.reconciliar_unknown(CHAVE, OPERATION, 1)
    assert resultado == "reconciliada-sem-reefeito:reserva-ok"
    assert len(ledger.efeitos) == 1  # nenhum efeito novo
    registro = repo.obter(CHAVE)
    assert registro is not None
    assert registro.estado == "completed"
    assert registro.resposta == "reserva-ok"
    # Repetição posterior deduplica, sem tocar o externo.
    assert repo.reservar(CHAVE, INTENT, 5) == "dedup:reserva-ok"
    assert len(ledger.efeitos) == 1


def test_efeito_ausente_libera_retentativa_sem_concluir(tmp_path: Path) -> None:
    repo = RepositorioIdempotente(str(tmp_path / "idem2.db"))
    assert repo.reservar("op-nova", "intent-nova", 1) == "reservada"
    reconciliador = Reconciliador(repo, LedgerExterno(efeitos={}))
    assert reconciliador.reconciliar_unknown("op-nova", "op-inexistente", 1) == (
        "ausente-liberar-retentativa"
    )
    registro = repo.obter("op-nova")
    assert registro is not None
    assert registro.estado == "started"
