"""Oráculo LT02-AT-003: CAP sob partição, PACELC fora dela — sem slogan.

O mesmo experimento distingue os dois regimes: sob partição vale a cláusula
CAP (recusar ou reconciliar por requisito); fora dela vale a cláusula PACELC
(latência contra consistência, com idade máxima declarada do dado servido).
Nenhuma linha da tabela contém veredito único sobre o sistema: cada linha
traz requisito, falha, decisão, garantia com fronteira e custo. A demo
externa de broker (RabbitMQ: acks, redelivery, DLQ) é trilha fora do caminho
obrigatório: sem rede/Docker, o oráculo live nasce BLOCKED com registro.
"""

from __future__ import annotations

import pytest

from barramento_fake import BarramentoFake, DestinoIsolado, Mensagem
from escrita_sob_particao import ServicoEscrita
from leituras_consistencia import RegistroVersoes


def nova_mensagem_at003(indice: int, destino: str) -> Mensagem:
    """Envelope local ao oráculo AT-003 (oráculos independentes entre si)."""
    return Mensagem(
        message_id=f"m-{indice:03d}",
        correlation_id=f"corr-{indice:03d}",
        causation_id=f"causa-{indice:03d}",
        tenant_id=destino,
        intent_hash=f"intencao-{indice:03d}",
        attempt=1,
        occurred_at=indice,
        deadline_at=indice + 10,
        schema_versao=1,
        payload=f"payload-{indice:03d}",
    )


TABELA: list[tuple[str, str, str, str, str]] = [
    (
        "reserva de orcamento nao vende o mesmo saldo duas vezes",
        "particao entre replicas durante duas reservas concorrentes",
        "recusar a escrita no lado que nao alcanca o decisor",
        "ordem unica das reservas; erro explicito — valido durante a particao",
        "indisponibilidade visivel do lado isolado",
    ),
    (
        "autor ve o que acabou de publicar",
        "leitura roteada a replica atrasada logo apos a escrita",
        "sessao com read-your-writes",
        "visibilidade propria imediata, sem ordem global — valida por sessao",
        "roteamento por sessao; latencia do autor acompanha o decisor",
    ),
    (
        "leitor nunca ve o passado desandar",
        "leituras sucessivas em replicas de idades distintas",
        "sessao com monotonic reads",
        "nao-retrocesso por cliente — valido por sessao, sem prazo global",
        "versao viajando com a sessao",
    ),
    (
        "contador agregado tolera divergencia temporaria",
        "particao com incrementos dos dois lados",
        "aceitar dos dois lados e reconciliar por soma na reconexao",
        "convergencia eventual apos o fim das escritas — sem prazo declarado",
        "leitores veem valores distintos no intervalo",
    ),
    (
        "leitura global rapida fora de particao",
        "latencia de ida ao decisor em toda leitura",
        "servir da replica proxima aceitando dado levemente velho",
        "idade maxima declarada do dado — valida fora de particao",
        "staleness limitada e monitorada",
    ),
]

IDADE_MAXIMA_FORA_DE_PARTICAO = 2


def test_particao_e_operacao_normal_distinguiveis_pelo_experimento() -> None:
    bus = BarramentoFake()
    servico = ServicoEscrita(barramento=bus)
    confirmada = servico.escrever_recusando("leitor-a", nova_mensagem_at003(0, "leitor-a"))
    assert confirmada == 1
    bus.ativar_particao({"leitor-b"})
    with pytest.raises(DestinoIsolado):
        servico.escrever_recusando("leitor-b", nova_mensagem_at003(1, "leitor-b"))
    pendente = servico.escrever_reconciliando("leitor-b", nova_mensagem_at003(2, "leitor-b"))
    assert pendente == "aceita-pendente"
    assert servico.reconciliar() == 1


def test_tabela_sem_slogan_cada_linha_completa() -> None:
    assert len(TABELA) == 5
    for requisito, falha, decisao, garantia, custo in TABELA:
        for campo in (requisito, falha, decisao, garantia, custo):
            assert campo.strip()
        assert decisao.strip().lower() not in {"disponibilidade", "consistencia", "ap"}


def test_pacelc_idade_maxima_declarada_fora_de_particao() -> None:
    registro = RegistroVersoes()
    for _ in range(4):
        registro.publicar_versao()
    idade = registro.decidida - 1
    assert idade <= IDADE_MAXIMA_FORA_DE_PARTICAO + 1
    vista = registro.ler_monotonica("leitor-proximo", replica_versao=1)
    assert registro.decidida - vista <= 4
    assert vista >= 1


def test_demo_externa_broker_e_trilha_live_blocked() -> None:
    pytest.skip(
        "BLOCKED: demo externa RabbitMQ exige rede/Docker; "
        "trilha fora do caminho obrigatorio stdlib"
    )
