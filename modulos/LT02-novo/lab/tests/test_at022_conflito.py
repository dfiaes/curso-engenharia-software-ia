"""Oráculo LT02-AT-022: mesma chave com intenção distinta é conflito.

Semente SEED_B03=20260816, amostra 1 chave e 2 intenções. Hash divergente
levanta ChaveConflito auditado: nunca executa nem devolve resposta alheia.
O registro original permanece intacto. Sem rede.
"""

from __future__ import annotations

from pathlib import Path

import pytest

from repositorio_idempotente import ChaveConflito, RepositorioIdempotente

SEED_B03 = 20260816
CHAVE = "res-7"
INTENT_A = "reservar-1-unidade-orcamento-X"
INTENT_B = "reservar-50-unidades-orcamento-X"


def test_intencao_distinta_levanta_conflito_auditado(tmp_path: Path) -> None:
    repo = RepositorioIdempotente(str(tmp_path / "idem.db"))
    assert repo.reservar(CHAVE, INTENT_A, 1) == "reservada"
    with pytest.raises(ChaveConflito, match="res-7"):
        repo.reservar(CHAVE, INTENT_B, 2)
    registro = repo.obter(CHAVE)
    assert registro is not None
    assert registro.intent_hash == INTENT_A
    assert registro.estado == "started"


def test_conflito_apos_conclusao_nao_devolve_resposta_alheia(tmp_path: Path) -> None:
    repo = RepositorioIdempotente(str(tmp_path / "idem2.db"))
    assert repo.reservar(CHAVE, INTENT_A, 1) == "reservada"
    repo.concluir(CHAVE, 1, "reserva-ok")
    with pytest.raises(ChaveConflito, match="intencao distinta"):
        repo.reservar(CHAVE, INTENT_B, 3)
    registro = repo.obter(CHAVE)
    assert registro is not None
    assert registro.resposta == "reserva-ok"
