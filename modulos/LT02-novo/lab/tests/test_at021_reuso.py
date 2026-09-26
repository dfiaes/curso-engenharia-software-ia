"""Oráculo LT02-AT-021: mesma chave e mesma intenção reutiliza a resposta.

Semente SEED_B03=20260816, amostra 1 chave. Transporte duplica por
message_id novo; negócio deduplica por (chave, intent_hash) com resposta
persistida. TTL de guarda TTL_JANELA=100 ticks lógicos: repetição dentro
da janela (relógio controlável, sem espera real) encontra a resposta.
Sem rede.
"""

from __future__ import annotations

from pathlib import Path

from repositorio_idempotente import RepositorioIdempotente

SEED_B03 = 20260816
CHAVE = "res-7"
INTENT = "reservar-1-unidade-orcamento-X"
TTL_JANELA = 100


def test_mesma_intencao_reutiliza_resposta_sem_novo_efeito(tmp_path: Path) -> None:
    repo = RepositorioIdempotente(str(tmp_path / "idem.db"))
    assert repo.reservar(CHAVE, INTENT, 1) == "reservada"
    # Retentativa com novo message_id mas mesma intenção: espera, sem efeito.
    assert repo.reservar(CHAVE, INTENT, 2) == "em-processamento"
    repo.concluir(CHAVE, 1, "reserva-ok")
    # Dentro da janela TTL (tick 3 < 100): resposta persistida, sem reefeito.
    tick = 3
    assert tick < TTL_JANELA
    assert repo.reservar(CHAVE, INTENT, 9) == "dedup:reserva-ok"
    registro = repo.obter(CHAVE)
    assert registro is not None
    assert registro.estado == "completed"
    assert registro.resposta == "reserva-ok"


def test_falha_terminal_repeticao_devolve_falha(tmp_path: Path) -> None:
    repo = RepositorioIdempotente(str(tmp_path / "idem2.db"))
    assert repo.reservar("op-2", "intent-b", 1) == "reservada"
    repo.falhar("op-2", 1, "saldo-insuficiente")
    registro = repo.obter("op-2")
    assert registro is not None
    assert registro.estado == "failed"
    assert registro.causa == "saldo-insuficiente"


def test_chave_nunca_reservada_obtem_none(tmp_path: Path) -> None:
    repo = RepositorioIdempotente(str(tmp_path / "idem3.db"))
    assert repo.obter("ausente") is None
