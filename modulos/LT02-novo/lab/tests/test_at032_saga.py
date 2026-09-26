"""Oraculo LT02-AT-032: saga falha apos reserva compensa sem duplicar.

Cenario reservar -> executar-externa -> confirmar (pivot sem desfazer):
falha na confirmacao compensa em ordem inversa com identidade do passo;
repeticao devolve o mesmo rastro sem novo efeito; timeout ambiguo sem
consulta possivel abre caso humano em vez de retry cego. Sem rede.
"""

from __future__ import annotations

from saga_compensavel import SagaCompensavel


def _saga_executada() -> SagaCompensavel:
    saga = SagaCompensavel()
    saga.registrar_passo("reservar", "liberar-reserva")
    saga.registrar_passo("executar-externa", "desfazer-externa")
    saga.registrar_passo("confirmar", None)  # pivot: sem desfazer
    saga.marcar_executado("reservar")
    saga.marcar_executado("executar-externa")
    saga.marcar_executado("reservar")  # repeticao nao duplica o rastro
    return saga


def test_falha_apos_reserva_compensa_em_ordem_inversa_sem_duplicar() -> None:
    saga = _saga_executada()
    assert saga.executados == ["reservar", "executar-externa"]
    aplicadas = saga.compensar("confirmar")
    assert aplicadas == ["desfazer-externa", "liberar-reserva"]
    assert saga.compensados == ["desfazer-externa", "liberar-reserva"]
    repetidas = saga.compensar("confirmar")
    assert repetidas == aplicadas  # mesmo rastro devolvido
    assert saga.compensados == ["desfazer-externa", "liberar-reserva"]  # sem reefeito


def test_ambiguo_irreconciliavel_abre_caso_humano_em_vez_de_retry() -> None:
    saga = _saga_executada()
    caso = saga.abrir_caso_humano("res-9", "timeout-confirmacao-sem-consulta")
    assert caso == "caso-humano:res-9:timeout-confirmacao-sem-consulta"
    assert saga.abrir_caso_humano("res-9", "timeout-confirmacao-sem-consulta") == caso
    assert saga.casos_humanos == [caso]  # sem retry cego, sem duplicata
    assert saga.compensados == []  # compensacao as cegas tambem recusada
