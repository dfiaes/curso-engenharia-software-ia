"""Oráculo LT02-AT-015: schema compatível entra, desconhecido recusa.

Gate com versões {1, 2} declaradas: validar passa para suportada e levanta
SchemaIncompativel com causa legível (versão + identidade) para
desconhecida. O gate roda antes do efeito — nenhuma mensagem recusada
gera efeito lógico — e a recusa alimenta a quarentena com causa schema
após tentativas finitas. Sem relógio de parede, sem rede.
"""

from __future__ import annotations

import pytest

from fila_limitada import FilaLimitada, MensagemFila
from quarentena_schema import GateSchema, QuarentenaPoison, SchemaIncompativel

VERSOES_SUPORTADAS = {1, 2}
MAX_TENTATIVAS = 3
CAPACIDADE = 8
MAX_INFLIGHT = 4


def nova_mensagem(indice: int, schema_versao: int) -> MensagemFila:
    """Envelope do bloco; a versão viaja como dado do teste."""
    return MensagemFila(
        message_id=f"m-{indice:03d}",
        chave="tenant-a",
        schema_versao=schema_versao,
        payload=f"payload-{indice:03d}",
    )


def test_versao_suportada_entra() -> None:
    gate = GateSchema(set(VERSOES_SUPORTADAS))
    assert gate.aceitar(1)
    assert gate.aceitar(2)
    gate.validar(nova_mensagem(0, 1))
    gate.validar(nova_mensagem(1, 2))


def test_versao_desconhecida_recusa_com_clareza() -> None:
    gate = GateSchema(set(VERSOES_SUPORTADAS))
    assert not gate.aceitar(9)
    with pytest.raises(SchemaIncompativel, match="v9"):
        gate.validar(nova_mensagem(2, 9))
    with pytest.raises(SchemaIncompativel, match="m-002"):
        gate.validar(nova_mensagem(2, 9))


def test_gate_antes_do_efeito_sem_execucao_as_cegas() -> None:
    fila = FilaLimitada(CAPACIDADE, MAX_INFLIGHT)
    gate = GateSchema(set(VERSOES_SUPORTADAS))
    lote = [nova_mensagem(0, 1), nova_mensagem(1, 9), nova_mensagem(2, 2)]
    for mensagem in lote:
        fila.publicar(mensagem)
    recusadas: list[str] = []
    while True:
        recebida = fila.consumir()
        if recebida is None:
            break
        try:
            gate.validar(recebida)
        except SchemaIncompativel:
            recusadas.append(recebida.message_id)
            continue
        fila.confirmar(recebida.message_id)
    assert recusadas == ["m-001"]
    assert fila.efeitos() == 2
    assert fila.em_voo() == 1


def test_recusa_por_schema_vira_quarentena_com_causa() -> None:
    gate = GateSchema(set(VERSOES_SUPORTADAS))
    quarentena = QuarentenaPoison(MAX_TENTATIVAS, gate)
    mensagem = nova_mensagem(4, 9)
    for _ in range(MAX_TENTATIVAS - 1):
        try:
            quarentena.validar_antes_de_processar(mensagem)
        except SchemaIncompativel as erro:
            assert quarentena.registrar_falha(mensagem, f"schema:{erro}") == "repetir"
    try:
        quarentena.validar_antes_de_processar(mensagem)
    except SchemaIncompativel as erro:
        destino = quarentena.registrar_falha(mensagem, f"schema:{erro}")
        assert destino.startswith("quarentena:schema:")
    assert quarentena.tamanho_quarentena() == 1
    assert "schema" in quarentena.causas[mensagem.message_id]
