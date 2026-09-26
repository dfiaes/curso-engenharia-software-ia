"""Oráculo LT02-AT-020: crash do producer após commit publica o pendente.

Semente SEED_B03=20260816, amostra N=3 outbox. Crash simulado por
reabertura do mesmo arquivo SQLite (nova instância, sem relay antes).
Relay reexecutável roda em thread com Event + join. Ordem inegociável:
commit (gravar) → publish (fake) → marcar só após confirm. SQLite é
padrão local; PG real é trilha BLOCKED. Sem rede, sem relógio de parede.
"""

from __future__ import annotations

import threading
from pathlib import Path

from outbox_sqlite import OutboxSqlite, RegistroOutbox

SEED_B03 = 20260816
CHAVE = "res-7"
INTENT = "reservar-1-unidade-orcamento-X"
TOPICO = "jobs"


def novo_registro(indice: int) -> RegistroOutbox:
    """Linha de outbox com identidade estável por índice."""
    return RegistroOutbox(
        outbox_id=f"out-{indice:03d}",
        chave=CHAVE,
        intent_hash=INTENT,
        topico=TOPICO,
        payload=f"payload-{indice:03d}",
    )


def test_crash_apos_commit_deixa_pendente_para_relay(tmp_path: Path) -> None:
    caminho = str(tmp_path / "outbox.db")
    produtor = OutboxSqlite(caminho)
    for i in range(3):
        produtor.gravar_job_com_outbox(novo_registro(i))
    assert produtor.contar_pendentes() == 3
    # Crash simulado: processo morre sem publicar; relay reabre o arquivo.
    relay = OutboxSqlite(caminho)
    pendentes = relay.listar_pendentes(10)
    assert len(pendentes) == 3
    assert [p.outbox_id for p in pendentes] == ["out-000", "out-001", "out-002"]
    publicados: list[str] = []
    paragem = threading.Event()

    def executar_relay() -> None:
        while not paragem.is_set():
            lote = relay.listar_pendentes(10)
            if not lote:
                return
            for item in lote:
                publicados.append(item.outbox_id)  # publish fake = confirm
                relay.marcar_publicada(item.outbox_id)  # só após confirm

    fio = threading.Thread(target=executar_relay, name="relay")
    fio.start()
    fio.join(timeout=10.0)
    assert not fio.is_alive()
    paragem.set()
    assert sorted(publicados) == ["out-000", "out-001", "out-002"]
    assert relay.contar_pendentes() == 0


def test_marcacao_somente_apos_confirm_preserva_pendente(tmp_path: Path) -> None:
    caminho = str(tmp_path / "outbox2.db")
    outbox = OutboxSqlite(caminho)
    outbox.gravar_job_com_outbox(novo_registro(0))
    # Publicar sem marcar (confirm perdido) mantém o pendente: redelivery futura.
    assert outbox.contar_pendentes() == 1
    pendentes = outbox.listar_pendentes(1)
    assert len(pendentes) == 1
    assert outbox.contar_pendentes() == 1
    outbox.marcar_publicada(pendentes[0].outbox_id)
    assert outbox.contar_pendentes() == 0
