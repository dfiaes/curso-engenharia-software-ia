"""Oráculo LT02-AT-011: redelivery sem perda após crash antes do ack.

O crash é flag do harness (crash_simulado=True) seguida de
redeliverar_apos_crash; nenhum kill real, nenhum processo morto. O voo
inteiro volta à fila com tentativa incrementada; perda zero no transporte
é provada por igualdade de conjuntos. A duplicata possível no efeito
(ledger externo conta 2 para o id com efeito pré-crash) declara por que
dedup é papel do Bloco 3. Sem relógio de parede, sem rede.
"""

from __future__ import annotations

from fila_limitada import FilaLimitada, MensagemFila

CAPACIDADE = 8
MAX_INFLIGHT = 4
N_MENSAGENS = 6
SCHEMA_VERSAO = 1


def nova_mensagem(indice: int) -> MensagemFila:
    """Envelope do bloco com identidade estável por índice."""
    return MensagemFila(
        message_id=f"m-{indice:03d}",
        chave="tenant-a",
        schema_versao=SCHEMA_VERSAO,
        payload=f"payload-{indice:03d}",
    )


def test_crash_antes_do_ack_redelivera_voo_sem_perda() -> None:
    fila = FilaLimitada(CAPACIDADE, MAX_INFLIGHT)
    originais = [nova_mensagem(i) for i in range(N_MENSAGENS)]
    for mensagem in originais:
        fila.publicar(mensagem)
    em_voo = [fila.consumir() for _ in range(3)]
    assert fila.em_voo() == 3
    assert fila.profundidade() == N_MENSAGENS - 3
    ledger_externo: dict[str, int] = {}
    assert em_voo[1] is not None
    ledger_externo[em_voo[1].message_id] = 1
    crash_simulado = True
    assert crash_simulado
    voltaram = fila.redeliverar_apos_crash()
    assert voltaram == 3
    assert fila.em_voo() == 0
    assert fila.profundidade() == N_MENSAGENS
    tentativas: dict[str, int] = {}
    drenadas: list[str] = []
    while True:
        recebida = fila.consumir()
        if recebida is None:
            break
        drenadas.append(recebida.message_id)
        tentativas[recebida.message_id] = recebida.attempt
        ledger_externo[recebida.message_id] = ledger_externo.get(recebida.message_id, 0) + 1
        fila.confirmar(recebida.message_id)
    assert sorted(drenadas) == sorted(m.message_id for m in originais)
    assert tentativas["m-000"] == 1
    assert tentativas["m-001"] == 1
    assert tentativas["m-002"] == 1
    assert tentativas["m-003"] == 0
    assert fila.efeitos() == N_MENSAGENS
    assert ledger_externo["m-001"] == 2
    assert fila.profundidade() == 0
    assert fila.em_voo() == 0


def test_crash_incrementa_tentativa_a_cada_queda() -> None:
    fila = FilaLimitada(CAPACIDADE, MAX_INFLIGHT)
    fila.publicar(nova_mensagem(0))
    for _ in range(2):
        mensagem = fila.consumir()
        assert mensagem is not None
        assert fila.redeliverar_apos_crash() == 1
    terceira = fila.consumir()
    assert terceira is not None
    assert terceira.attempt == 2
    fila.confirmar(terceira.message_id)
    assert fila.efeitos() == 1


def test_prefetch_limita_voo() -> None:
    fila = FilaLimitada(CAPACIDADE, MAX_INFLIGHT)
    for i in range(MAX_INFLIGHT + 1):
        fila.publicar(nova_mensagem(i))
    for _ in range(MAX_INFLIGHT):
        assert fila.consumir() is not None
    assert fila.consumir() is None
    assert fila.em_voo() == MAX_INFLIGHT


def test_crash_sem_voo_devolve_zero() -> None:
    fila = FilaLimitada(CAPACIDADE, MAX_INFLIGHT)
    fila.publicar(nova_mensagem(0))
    assert fila.redeliverar_apos_crash() == 0
    assert fila.profundidade() == 1
