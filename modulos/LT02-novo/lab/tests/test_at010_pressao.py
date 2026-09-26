"""Oráculo LT02-AT-010: memória limitada, pressão e fila observáveis.

Semente fixa SEED_B02, amostra TOTAL=60 (triplo de CAPACIDADE=20) drenada
por 2 workers (MAX_INFLIGHT=4). A agenda é embaralhada com
random.Random(SEED_B02) no harness; o módulo não tem relógio nem
aleatoriedade. Idade é relógio lógico do harness (índice de publicação),
nunca medição de parede. Threads do harness encerram com Event + join.
Sem rede, sem Docker, sem RabbitMQ.
"""

from __future__ import annotations

import random
import threading

import pytest

from fila_limitada import ConfirmDesconhecido, FilaCheia, FilaLimitada, MensagemFila

SEED_B02 = 20260815
CAPACIDADE = 20
MAX_INFLIGHT = 4
TOTAL = 60
N_WORKERS = 2
SCHEMA_VERSAO = 1


def nova_mensagem(indice: int) -> MensagemFila:
    """Envelope do bloco; chave rotativa só para distribuir, sem rede."""
    return MensagemFila(
        message_id=f"job-{indice:03d}",
        chave=f"tenant-{indice % 5}",
        schema_versao=SCHEMA_VERSAO,
        payload=f"payload-{indice:03d}",
    )


def agenda() -> list[MensagemFila]:
    """Ordem de publicação determinística pela semente."""
    rng = random.Random(SEED_B02)
    indices = list(range(TOTAL))
    rng.shuffle(indices)
    return [nova_mensagem(i) for i in indices]


def test_publicar_acima_da_capacidade_recusa_com_profundidade_observavel() -> None:
    fila = FilaLimitada(CAPACIDADE, MAX_INFLIGHT)
    ordem: dict[str, int] = {}
    aceitas = 0
    recusas = 0
    for posicao, mensagem in enumerate(agenda()):
        try:
            fila.publicar(mensagem)
        except FilaCheia:
            recusas += 1
        else:
            ordem[mensagem.message_id] = posicao
            aceitas += 1
    assert aceitas == CAPACIDADE
    assert recusas == TOTAL - CAPACIDADE
    assert fila.profundidade() == CAPACIDADE
    assert fila.em_voo() == 0
    memoria = fila.profundidade() + fila.em_voo()
    assert memoria <= CAPACIDADE + MAX_INFLIGHT
    idade_logica_mais_velha = max(ordem.values()) - min(ordem.values())
    assert idade_logica_mais_velha == CAPACIDADE - 1


def test_dois_workers_drenam_com_shutdown_e_join_sem_perda() -> None:
    fila = FilaLimitada(CAPACIDADE, MAX_INFLIGHT)
    publicados = agenda()[:CAPACIDADE]
    for mensagem in publicados:
        fila.publicar(mensagem)
    efeitos: dict[str, int] = {}
    trava = threading.Lock()
    paragem = threading.Event()

    def trabalhar() -> None:
        while not paragem.is_set():
            mensagem = fila.consumir()
            if mensagem is None:
                with trava:
                    concluido = len(efeitos) >= CAPACIDADE
                if concluido:
                    return
                continue
            with trava:
                efeitos[mensagem.message_id] = efeitos.get(mensagem.message_id, 0) + 1
            fila.confirmar(mensagem.message_id)

    workers = [threading.Thread(target=trabalhar, name=f"worker-{i}") for i in range(N_WORKERS)]
    for worker in workers:
        worker.start()
    for worker in workers:
        worker.join(timeout=10.0)
        assert not worker.is_alive()
    paragem.set()
    assert fila.efeitos() == CAPACIDADE
    assert sorted(efeitos) == sorted(m.message_id for m in publicados)
    assert set(efeitos.values()) == {1}
    assert fila.profundidade() == 0
    assert fila.em_voo() == 0


def test_pressao_concorrente_nao_perde_nem_estoura_memoria() -> None:
    fila = FilaLimitada(CAPACIDADE, MAX_INFLIGHT)
    publicacao_encerrada = threading.Event()
    pico: list[int] = [0]
    recusas: list[int] = [0]
    efeitos: dict[str, int] = {}
    trava = threading.Lock()
    mensagens = agenda()[:40]

    def publicar_tudo() -> None:
        for mensagem in mensagens:
            try:
                fila.publicar(mensagem)
            except FilaCheia:
                with trava:
                    recusas[0] += 1
            with trava:
                visto = fila.profundidade() + fila.em_voo()
                pico[0] = max(pico[0], visto)
        publicacao_encerrada.set()

    def trabalhar() -> None:
        while True:
            mensagem = fila.consumir()
            if mensagem is None:
                if publicacao_encerrada.is_set():
                    return
                continue
            with trava:
                efeitos[mensagem.message_id] = efeitos.get(mensagem.message_id, 0) + 1
            fila.confirmar(mensagem.message_id)

    produtor = threading.Thread(target=publicar_tudo, name="produtor")
    workers = [threading.Thread(target=trabalhar, name=f"worker-{i}") for i in range(N_WORKERS)]
    produtor.start()
    for worker in workers:
        worker.start()
    produtor.join(timeout=10.0)
    for worker in workers:
        worker.join(timeout=10.0)
    assert not produtor.is_alive()
    assert all(not worker.is_alive() for worker in workers)
    assert pico[0] <= CAPACIDADE + MAX_INFLIGHT
    assert len(efeitos) + recusas[0] == len(mensagens)
    assert set(efeitos.values()) == {1}
    assert fila.profundidade() == 0
    assert fila.em_voo() == 0


def test_confirm_desconhecido_e_reack_idempotente() -> None:
    fila = FilaLimitada(4, 2)
    fila.publicar(nova_mensagem(0))
    mensagem = fila.consumir()
    assert mensagem is not None
    fila.confirmar(mensagem.message_id)
    fila.confirmar(mensagem.message_id)
    assert fila.efeitos() == 1
    with pytest.raises(ConfirmDesconhecido, match="sem voo"):
        fila.confirmar("job-inexistente")
