"""Oráculo LT02-AT-014: quarentena finita com causa e replay com identidade.

MAX_TENTATIVAS=3: a mensagem que sempre falha recebe repetir, repetir e
quarentena com causa registrada; a fila saudável drena sem bloquear.
Sucesso limpa a contagem (veneno separa-se de falha transitória) e o
replay devolve a identidade com tentativa zerada — quarentena nunca é
descarte silencioso. Sem relógio de parede, sem rede.
"""

from __future__ import annotations

from fila_limitada import FilaLimitada, MensagemFila
from quarentena_schema import GateSchema, QuarentenaPoison

MAX_TENTATIVAS = 3
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


def test_veneno_vai_a_quarentena_com_causa_no_teto() -> None:
    quarentena = QuarentenaPoison(MAX_TENTATIVAS, GateSchema({SCHEMA_VERSAO}))
    veneno = nova_mensagem(0)
    assert quarentena.registrar_falha(veneno, "payload-invalido") == "repetir"
    assert quarentena.registrar_falha(veneno, "payload-invalido") == "repetir"
    assert quarentena.tamanho_quarentena() == 0
    destino = quarentena.registrar_falha(veneno, "payload-invalido")
    assert destino == "quarentena:payload-invalido"
    assert quarentena.tamanho_quarentena() == 1
    assert quarentena.causas[veneno.message_id] == "payload-invalido"
    assert quarentena.falhas[veneno.message_id] == MAX_TENTATIVAS


def test_fila_saudavel_drena_sem_bloquear_no_veneno() -> None:
    fila = FilaLimitada(CAPACIDADE, MAX_INFLIGHT)
    quarentena = QuarentenaPoison(MAX_TENTATIVAS, GateSchema({SCHEMA_VERSAO}))
    for i in range(1, 4):
        fila.publicar(nova_mensagem(i))
    while True:
        mensagem = fila.consumir()
        if mensagem is None:
            break
        fila.confirmar(mensagem.message_id)
        quarentena.registrar_sucesso(mensagem.message_id)
    assert fila.efeitos() == 3
    assert fila.profundidade() == 0
    assert quarentena.tamanho_quarentena() == 0


def test_sucesso_limpa_falha_transitoria() -> None:
    quarentena = QuarentenaPoison(MAX_TENTATIVAS, GateSchema({SCHEMA_VERSAO}))
    mensagem = nova_mensagem(5)
    assert quarentena.registrar_falha(mensagem, "timeout") == "repetir"
    assert quarentena.registrar_falha(mensagem, "timeout") == "repetir"
    quarentena.registrar_sucesso(mensagem.message_id)
    assert mensagem.message_id not in quarentena.falhas
    assert quarentena.tamanho_quarentena() == 0
    assert quarentena.registrar_falha(mensagem, "timeout") == "repetir"
    assert quarentena.falhas[mensagem.message_id] == 1


def test_replay_preserva_identidade_com_tentativa_zerada() -> None:
    fila = FilaLimitada(CAPACIDADE, MAX_INFLIGHT)
    quarentena = QuarentenaPoison(MAX_TENTATIVAS, GateSchema({SCHEMA_VERSAO}))
    veneno = nova_mensagem(9)
    for _ in range(MAX_TENTATIVAS):
        quarentena.registrar_falha(veneno, "payload-invalido")
    repetida = quarentena.replay_seguro(veneno.message_id)
    assert repetida is not None
    assert repetida.message_id == veneno.message_id
    assert repetida.chave == veneno.chave
    assert repetida.schema_versao == veneno.schema_versao
    assert repetida.payload == veneno.payload
    assert repetida.attempt == 0
    assert quarentena.replay_seguro("m-inexistente") is None
    fila.publicar(repetida)
    consumida = fila.consumir()
    assert consumida is not None
    fila.confirmar(consumida.message_id)
    quarentena.registrar_sucesso(consumida.message_id)
    assert fila.efeitos() == 1
    assert consumida.message_id not in quarentena.falhas
