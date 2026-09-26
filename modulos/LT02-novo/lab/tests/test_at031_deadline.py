"""Oraculo LT02-AT-031: tentativa fora do deadline jamais comeca.

Agenda logica (deadline_em=100): autorizada dentro do saldo devolve
o restante; barrada fora dele nao consome orcamento e a primeira
tentativa tardia vai a quarentena com causa deadline-excedido.
Sem relogio de parede. Sem rede.
"""

from __future__ import annotations

from dlq_replay import DlqSegura, MensagemDlq
from guarda_deadline import GuardaDeadline
from orcamento_retry import OrcamentoRetry

DEADLINE_EM = 100


def test_autorizada_dentro_do_saldo_barrada_fora() -> None:
    guarda = GuardaDeadline(deadline_em=DEADLINE_EM)
    assert guarda.cabe(90, 10) is True
    assert guarda.autorizar("job-1", 90, 10) == "autorizada:job-1:restam-10"
    assert guarda.cabe(100, 0) is True  # fronteira exata ainda cabe
    assert guarda.cabe(95, 10) is False
    assert guarda.autorizar("job-1", 95, 10) == "barrada-deadline:job-1"


def test_barrada_nao_consome_orcamento_e_tardia_vai_a_quarentena() -> None:
    guarda = GuardaDeadline(deadline_em=DEADLINE_EM)
    orcamento = OrcamentoRetry(max_tentativas=3, orcamento_total=5)
    dlq = DlqSegura()
    veredito = guarda.autorizar("job-tardia", 95, 10)
    assert veredito == "barrada-deadline:job-tardia"
    assert orcamento.usados == 0  # barrada antes de consumir orcamento
    assert orcamento.pode_tentar("job-tardia") is True
    causa = dlq.quarentenar(
        MensagemDlq(
            message_id="m-tardia",
            correlation_id="c-tardia",
            causation_id="m-tardia",
            chave="job-tardia",
            intent_hash="h-tardia",
            attempt=0,
            causa="deadline-excedido",
        )
    )
    assert causa == "quarentena:deadline-excedido"
    assert dlq.tamanho() == 1
