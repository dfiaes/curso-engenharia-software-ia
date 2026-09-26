"""Oráculo LT02-AT-012: republish após confirm perdido sem segundo efeito.

Duas histórias que o broker distingue por message_id: publicada-e-confirmada
(duplicata vira dedup, sem republicar e sem reefeito) contra nunca-chegou
(enfileira normal). O ledger de efeitos do módulo conta um efeito lógico
por identidade mesmo quando duas cópias da mesma mensagem são confirmadas.
Sem relógio de parede, sem rede.
"""

from __future__ import annotations

from fila_limitada import FilaLimitada, MensagemFila

CAPACIDADE = 8
MAX_INFLIGHT = 4
SCHEMA_VERSAO = 1


def nova_mensagem(indice: int) -> MensagemFila:
    """Envelope do bloco com identidade estável por índice."""
    return MensagemFila(
        message_id=f"m-{indice:03d}",
        chave="tenant-a",
        schema_versao=SCHEMA_VERSAO,
        payload=f"payload-{indice:03d}",
    )


def test_confirm_perdido_republica_sem_segundo_efeito() -> None:
    fila = FilaLimitada(CAPACIDADE, MAX_INFLIGHT)
    mensagem = nova_mensagem(0)
    fila.publicar(mensagem)
    consumida = fila.consumir()
    assert consumida is not None
    fila.confirmar(consumida.message_id)
    assert fila.efeitos() == 1
    resultado = fila.republicar_apos_confirm_perdido(mensagem)
    assert resultado == "confirmada-duplicata-dedup"
    assert fila.efeitos() == 1
    assert fila.profundidade() == 0
    assert fila.em_voo() == 0


def test_republicar_sem_confirm_anterior_enfileira_normal() -> None:
    fila = FilaLimitada(CAPACIDADE, MAX_INFLIGHT)
    mensagem = nova_mensagem(7)
    resultado = fila.republicar_apos_confirm_perdido(mensagem)
    assert resultado == mensagem.message_id
    assert fila.profundidade() == 1
    consumida = fila.consumir()
    assert consumida is not None
    assert consumida.message_id == mensagem.message_id
    fila.confirmar(consumida.message_id)
    assert fila.efeitos() == 1


def test_duas_copias_confirmadas_contam_um_efeito_logico() -> None:
    fila = FilaLimitada(CAPACIDADE, MAX_INFLIGHT)
    mensagem = nova_mensagem(3)
    fila.publicar(mensagem)
    original = fila.consumir()
    assert original is not None
    resultado = fila.republicar_apos_confirm_perdido(mensagem)
    assert resultado == mensagem.message_id
    fila.confirmar(original.message_id)
    copia = fila.consumir()
    assert copia is not None
    assert copia.message_id == mensagem.message_id
    fila.confirmar(copia.message_id)
    assert fila.efeitos() == 1
    assert fila.profundidade() == 0
    assert fila.em_voo() == 0
