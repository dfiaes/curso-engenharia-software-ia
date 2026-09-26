"""Oraculo LT02-AT-050: trace por mensagem sem dado sensivel.

Exemplo variavel (SEED_B06=20260820, amostra de 1 mensagem): o mesmo
envelope atravessa producer, broker e consumer com IDs intactos e so a
tentativa derivada; atributo com dado sensivel levanta antes de
registrar; sinais de fila sao contadores logicos. Sem rede.
"""

from __future__ import annotations

import pytest

from rastro_mensagem import ContextoRastro, DadoSensivel, SinaisFila

SEED_B06 = 20260820


def _origem() -> ContextoRastro:
    return ContextoRastro(
        trace_id="trace-b06",
        mensagem_id="m-50",
        correlacao_id="corr-50",
        tenant_id="t-50",
        tentativa=0,
    )


def test_tres_saltos_correlacionados_pelos_mesmos_ids() -> None:
    produtor = _origem()
    broker = produtor.propagar(1)
    consumidor = broker.propagar(2)
    for salto in (produtor, broker, consumidor):
        assert salto.trace_id == "trace-b06"
        assert salto.mensagem_id == "m-50"
        assert salto.correlacao_id == "corr-50"
        assert salto.tenant_id == "t-50"
    assert (produtor.tentativa, broker.tentativa, consumidor.tentativa) == (0, 1, 2)
    assert produtor is not broker is not consumidor


@pytest.mark.parametrize(
    "atributo",
    ["senha_hash", "SEGREDO", " documento ", "cartao-numero", "x-senha-y"],
)
def test_dado_sensivel_vetado_antes_de_registrar(atributo: str) -> None:
    with pytest.raises(DadoSensivel, match="fora do rastro"):
        _origem().anotar(atributo)


def test_atributo_operacional_nao_vetado() -> None:
    _origem().anotar("tentativa")
    _origem().anotar("trace_id")


def test_sinais_fila_por_contador() -> None:
    sinais = SinaisFila()
    sinais.publicar(7)
    sinais.publicar(3)
    assert sinais.idade_maxima == 7
    sinais.marcar_voo(4)
    assert sinais.em_voo == 4
    assert sinais.marcar_redelivery("m-50") == 1
    assert sinais.marcar_redelivery("m-50") == 2
    sinais.quarentenar("m-50", "veneno-apos-3")
    assert sinais.quarentena == {"m-50": "veneno-apos-3"}
