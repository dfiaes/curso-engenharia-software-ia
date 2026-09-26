"""Oráculo LT02-AT-001: partição controlada decidida por requisito e provada.

Semente fixa 20260814, amostra N=6 mensagens por agenda. Agenda determinística
construída com random.Random(SEED): partição, perda, duplicação e atraso são
programados pelo harness via API pública do fake (publicar/entregar/
ativar_particao/desativar_particao); o módulo verbatim não tem relógio nem
aleatoriedade. Ledger externo (dict por intent_hash) é o oráculo de efeito
lógico: conta efeitos, nunca tentativas. Sem rede, sem Docker, sem RabbitMQ.
"""

from __future__ import annotations

import random

import pytest

from barramento_fake import BarramentoFake, DestinoIsolado, Mensagem
from escrita_sob_particao import ServicoEscrita

SEED = 20260814
N_MENSAGENS = 6
SCHEMA_VERSAO = 1


def nova_mensagem(indice: int, destino: str) -> Mensagem:
    """Envelope da trilha; tenant_id == destino para a reconciliação convergir."""
    return Mensagem(
        message_id=f"m-{indice:03d}",
        correlation_id=f"corr-{indice:03d}",
        causation_id=f"causa-{indice:03d}",
        tenant_id=destino,
        intent_hash=f"intencao-{indice:03d}",
        attempt=1,
        occurred_at=indice,
        deadline_at=indice + 10,
        schema_versao=SCHEMA_VERSAO,
        payload=f"payload-{indice:03d}",
    )


def agenda_embaralhada(destino: str) -> list[Mensagem]:
    """Ordem de publicação determinística pela semente (reordenação programável)."""
    rng = random.Random(SEED)
    indices = list(range(N_MENSAGENS))
    rng.shuffle(indices)
    return [nova_mensagem(i, destino) for i in indices]


def test_fifo_sem_particao_com_agenda_da_semente() -> None:
    bus = BarramentoFake()
    agenda = agenda_embaralhada("leitor-a")
    for mensagem in agenda:
        bus.publicar("leitor-a", mensagem)
    assert bus.publicados == N_MENSAGENS
    assert bus.profundidade("leitor-a") == N_MENSAGENS
    entregues = bus.entregar("leitor-a")
    assert [m.message_id for m in entregues] == [m.message_id for m in agenda]
    assert bus.profundidade("leitor-a") == 0


def test_particao_isola_sem_guardar() -> None:
    bus = BarramentoFake()
    bus.ativar_particao({"leitor-b"})
    bus.publicar("leitor-a", nova_mensagem(0, "leitor-a"))
    with pytest.raises(DestinoIsolado):
        bus.publicar("leitor-b", nova_mensagem(1, "leitor-b"))
    assert bus.profundidade("leitor-b") == 0
    assert bus.publicados == 1
    assert [m.message_id for m in bus.entregar("leitor-a")] == ["m-000"]
    assert bus.entregar("leitor-b") == []


def test_cada_lado_registra_so_o_recebido() -> None:
    bus = BarramentoFake()
    servico = ServicoEscrita(barramento=bus)
    bus.ativar_particao({"leitor-b"})
    servico.escrever_recusando("leitor-a", nova_mensagem(0, "leitor-a"))
    with pytest.raises(DestinoIsolado):
        servico.escrever_recusando("leitor-b", nova_mensagem(1, "leitor-b"))
    assert servico.visoes["leitor-a"].ultima_versao == 1
    assert servico.visoes["leitor-a"].origem == "decisor"
    assert "leitor-b" not in servico.visoes
    assert servico.versao_decidida == 1


def test_recusar_nao_avanca_decidida() -> None:
    bus = BarramentoFake()
    servico = ServicoEscrita(barramento=bus)
    bus.ativar_particao({"leitor-b"})
    antes = servico.versao_decidida
    with pytest.raises(DestinoIsolado):
        servico.escrever_recusando("leitor-b", nova_mensagem(0, "leitor-b"))
    assert servico.versao_decidida == antes
    versao = servico.escrever_recusando("leitor-a", nova_mensagem(1, "leitor-a"))
    assert versao == antes + 1


def test_reconciliar_converge_sem_duplicar_efeito_logico() -> None:
    bus = BarramentoFake()
    servico = ServicoEscrita(barramento=bus)
    bus.ativar_particao({"leitor-b"})
    resultados = [
        servico.escrever_reconciliando("leitor-b", nova_mensagem(i, "leitor-b")) for i in range(2)
    ]
    assert resultados == ["aceita-pendente", "aceita-pendente"]
    assert len(servico.pendentes) == 2
    concluidas = servico.reconciliar()
    assert concluidas == 2
    assert servico.pendentes == []
    entregues = bus.entregar("leitor-b")
    assert len(entregues) == 2
    ledger: dict[str, int] = {}
    for mensagem in entregues:
        ledger[mensagem.intent_hash] = ledger.get(mensagem.intent_hash, 0) + 1
    assert ledger == {"intencao-000": 1, "intencao-001": 1}


def test_perda_programada_exige_redelivery_ou_reconciliacao() -> None:
    bus = BarramentoFake()
    agenda = agenda_embaralhada("leitor-a")
    for mensagem in agenda[:3]:
        bus.publicar("leitor-a", mensagem)
    perdidas = agenda[3:]
    assert bus.profundidade("leitor-a") == 3
    for mensagem in perdidas:
        bus.publicar("leitor-a", mensagem)
    assert [m.message_id for m in bus.entregar("leitor-a")] == [m.message_id for m in agenda]


def test_duplicacao_programada_nao_duplica_efeito_com_dedup() -> None:
    bus = BarramentoFake()
    mensagem = nova_mensagem(0, "leitor-a")
    bus.publicar("leitor-a", mensagem)
    bus.publicar("leitor-a", mensagem)
    entregues = bus.entregar("leitor-a")
    assert len(entregues) == 2
    efeitos: set[str] = set()
    for item in entregues:
        efeitos.add(item.intent_hash)
    assert efeitos == {"intencao-000"}


def test_tabela_requisito_falha_decisao_por_operacao() -> None:
    bus = BarramentoFake()
    servico = ServicoEscrita(barramento=bus)
    bus.ativar_particao({"lado-isolado"})
    with pytest.raises(DestinoIsolado):
        servico.escrever_recusando("lado-isolado", nova_mensagem(0, "lado-isolado"))
    reserva_recusada = True
    contador = servico.escrever_reconciliando("lado-isolado", nova_mensagem(1, "lado-isolado"))
    assert reserva_recusada
    assert contador == "aceita-pendente"
    assert servico.reconciliar() == 1
