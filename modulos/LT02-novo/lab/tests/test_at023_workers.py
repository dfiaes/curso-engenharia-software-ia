"""Oráculo LT02-AT-023: dois workers disputam a intenção, um efeito vence.

Semente SEED_B03=20260816, amostra 1 chave e N_WORKERS=2 threads. Reserva
sob unique constraint com token por geração; efeito carrega chave,
intent_hash e token vigente; token vencido conclui False sem efeito. O
ledger externo (dict por operation ID) é o oráculo: 1 efeito lógico.
Threads encerram com join(timeout=10.0) e assert de não-viva. Sem rede.
"""

from __future__ import annotations

import threading
from pathlib import Path

from coordenador_workers import Coordenador
from repositorio_idempotente import RepositorioIdempotente

SEED_B03 = 20260816
CHAVE = "res-7"
INTENT = "reservar-1-unidade-orcamento-X"
OPERATION = "op-res-7"
N_WORKERS = 2


def test_dois_workers_um_efeito_logico(tmp_path: Path) -> None:
    repo = RepositorioIdempotente(str(tmp_path / "idem.db"))
    coordenador = Coordenador(repo)
    efeitos: dict[str, str] = {}
    conclusoes: list[bool] = []
    observacoes: list[str] = []
    trava = threading.Lock()

    def trabalhar() -> None:
        # A decisão de executar lê o estado durável (started + dono == token);
        # a geração em memória pode correr à frente da reserva sob corrida,
        # então só o repositório autoriza o efeito. Perdedor observa, sem efeito.
        token = coordenador.tentar_assumir(CHAVE, INTENT)
        with trava:
            if token is None or token == -1:
                observacoes.append("dedup-ou-conflito")
                return
            registro = repo.obter(CHAVE)
            if registro is None or registro.estado != "started" or registro.dono_token != token:
                observacoes.append("obsoleto-ou-concluido")
                return
            efeitos[OPERATION] = "reserva-ok"
            conclusoes.append(coordenador.concluir_como_dono(CHAVE, token, "reserva-ok"))

    workers = [threading.Thread(target=trabalhar, name=f"worker-{i}") for i in range(N_WORKERS)]
    for worker in workers:
        worker.start()
    for worker in workers:
        worker.join(timeout=10.0)
        assert not worker.is_alive()
    assert len(efeitos) == 1
    assert efeitos[OPERATION] == "reserva-ok"
    assert conclusoes == [True]
    assert len(conclusoes) + len(observacoes) == N_WORKERS
    registro = repo.obter(CHAVE)
    assert registro is not None
    assert registro.estado == "completed"
    assert registro.resposta == "reserva-ok"


def test_dono_vencido_nao_conclui_e_repeticao_deduplica(tmp_path: Path) -> None:
    repo = RepositorioIdempotente(str(tmp_path / "idem2.db"))
    coordenador = Coordenador(repo)
    token = coordenador.tentar_assumir(CHAVE, INTENT)
    assert token is not None and token > 0
    assert coordenador.dono_vigente(CHAVE) == token
    assert coordenador.concluir_como_dono(CHAVE, token, "reserva-ok") is True
    assert coordenador.concluir_como_dono(CHAVE, token + 99, "tardio") is False
    assert coordenador.tentar_assumir(CHAVE, INTENT) == -1
    assert coordenador.tentar_assumir(CHAVE, "intencao-outra") is None
