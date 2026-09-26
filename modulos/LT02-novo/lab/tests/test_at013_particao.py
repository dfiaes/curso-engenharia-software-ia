"""Oráculo LT02-AT-013: ordem preservada dentro da chave, livre entre chaves.

Amostra com N_PARTICOES=4, 6 mensagens de tenant-a intercaladas com outras
chaves em agenda embaralhada por random.Random(SEED_B02) no harness. A
mesma chave cai sempre na mesma partição (hash estável); cada partição é
FIFO sob o próprio prefetch. Duas threads drenam partições disjuntas e
encerram com join; ordem global entre chaves jamais é presumida, só
igualdade de conjuntos. Sem relógio de parede, sem rede.
"""

from __future__ import annotations

import random
import threading

from fila_limitada import MensagemFila
from particao_por_chave import ParticaoPorChave

SEED_B02 = 20260815
N_PARTICOES = 4
CAPACIDADE_PARTICAO = 16
INFLIGHT_PARTICAO = 4
N_CHAVE_ALVO = 6
SCHEMA_VERSAO = 1


def nova_mensagem(indice: int, chave: str) -> MensagemFila:
    """Envelope do bloco; sequência lógica viaja no payload."""
    return MensagemFila(
        message_id=f"m-{indice:03d}",
        chave=chave,
        schema_versao=SCHEMA_VERSAO,
        payload=f"seq-{indice:03d}",
    )


def agenda_intercalada() -> list[MensagemFila]:
    """Seis de tenant-a intercaladas com outras chaves, ordem embaralhada."""
    mensagens = [nova_mensagem(i, "tenant-a") for i in range(N_CHAVE_ALVO)]
    outras = [f"tenant-{letra}" for letra in ("b", "c", "d", "e", "f", "g")]
    for i, chave in enumerate(outras):
        mensagens.append(nova_mensagem(N_CHAVE_ALVO + i, chave))
    rng = random.Random(SEED_B02)
    rng.shuffle(mensagens)
    return mensagens


def test_mesma_chave_sempre_na_mesma_particao() -> None:
    roteador = ParticaoPorChave(N_PARTICOES, CAPACIDADE_PARTICAO, INFLIGHT_PARTICAO)
    particoes = {roteador.publicar(nova_mensagem(i, "tenant-a"))[0] for i in range(N_CHAVE_ALVO)}
    assert len(particoes) == 1
    assert roteador.indice_para("tenant-a") == roteador.indice_para("tenant-a")


def test_ordem_preservada_dentro_da_chave() -> None:
    roteador = ParticaoPorChave(N_PARTICOES, CAPACIDADE_PARTICAO, INFLIGHT_PARTICAO)
    agenda = agenda_intercalada()
    for mensagem in agenda:
        roteador.publicar(mensagem)
    ordem_publicacao_alvo = [m.message_id for m in agenda if m.chave == "tenant-a"]
    alvo = roteador.indice_para("tenant-a")
    consumidas: list[str] = []
    while True:
        recebida = roteador.consumir_da_particao(alvo)
        if recebida is None:
            break
        if recebida.chave == "tenant-a":
            consumidas.append(recebida.message_id)
        roteador.confirmar(alvo, recebida.message_id)
    assert consumidas == ordem_publicacao_alvo


def test_duas_threads_drenam_particoes_sem_presumir_ordem_global() -> None:
    roteador = ParticaoPorChave(N_PARTICOES, CAPACIDADE_PARTICAO, INFLIGHT_PARTICAO)
    mensagens = agenda_intercalada()
    for mensagem in mensagens:
        roteador.publicar(mensagem)
    total = len(mensagens)
    processadas: dict[str, int] = {}
    por_chave: dict[str, list[str]] = {}
    trava = threading.Lock()

    def drenar(particoes: list[int]) -> None:
        while True:
            with trava:
                pronto = len(processadas) >= total
            if pronto:
                return
            for particao in particoes:
                mensagem = roteador.consumir_da_particao(particao)
                if mensagem is None:
                    continue
                with trava:
                    processadas[mensagem.message_id] = processadas.get(mensagem.message_id, 0) + 1
                    por_chave.setdefault(mensagem.chave, []).append(mensagem.message_id)
                roteador.confirmar(particao, mensagem.message_id)

    workers = [
        threading.Thread(target=drenar, args=([0, 1],), name="worker-0"),
        threading.Thread(target=drenar, args=([2, 3],), name="worker-1"),
    ]
    for worker in workers:
        worker.start()
    for worker in workers:
        worker.join(timeout=10.0)
        assert not worker.is_alive()
    assert sorted(processadas) == sorted(m.message_id for m in mensagens)
    assert set(processadas.values()) == {1}
    ordem_publicacao_alvo = [m.message_id for m in mensagens if m.chave == "tenant-a"]
    assert por_chave["tenant-a"] == ordem_publicacao_alvo


def test_crash_de_particao_nao_toca_as_demais() -> None:
    roteador = ParticaoPorChave(N_PARTICOES, CAPACIDADE_PARTICAO, INFLIGHT_PARTICAO)
    for mensagem in agenda_intercalada():
        roteador.publicar(mensagem)
    alvo = roteador.indice_para("tenant-a")
    outra = (alvo + 1) % N_PARTICOES
    profundidade_outra_antes = roteador.particoes[outra].profundidade()
    assert roteador.redeliverar_apos_crash(outra) == 0
    assert roteador.particoes[outra].profundidade() == profundidade_outra_antes
    consumidas = 0
    while roteador.consumir_da_particao(alvo) is not None:
        consumidas += 1
        if consumidas == 2:
            break
    assert roteador.particoes[alvo].em_voo() == 2
    assert roteador.redeliverar_apos_crash(alvo) == 2
    assert roteador.particoes[alvo].em_voo() == 0
    assert roteador.particoes[outra].profundidade() == profundidade_outra_antes
