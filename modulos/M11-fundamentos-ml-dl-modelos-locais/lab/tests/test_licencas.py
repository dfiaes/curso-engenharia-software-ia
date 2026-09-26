"""Oraculo AT-023: NC e destilado bloqueiam; propria exige leitura.

Limite honesto: o classificador decide pela STRING da licenca (sinal do
cartao), nao pelo texto juridico integral - a leitura da clausula e ato
humano registrado no ADR. AT-021/AT-022 (quant por tarefa, perplexidade
vs raciocinio) exigem pesos reais e evals por categoria: sem download de
5 GB no caminho obrigatorio (rede), ficam em construcao local +
quarentena SRC-M11-20, com prova por matriz no B08.
"""

from licencas import BLOQUEIA_COMERCIAL, Faixa, classificar, veredito_comercial


def test_oss_real_libera() -> None:
    assert classificar("Apache-2.0") is Faixa.OSS_REAL
    assert classificar("MIT License") is Faixa.OSS_REAL
    assert veredito_comercial(Faixa.OSS_REAL) == "liberado"


def test_nc_bloqueia() -> None:
    """AT-023 positivo: nao-comercial veta produto pago sem excecao."""
    assert classificar("CC-BY-NC 4.0") is Faixa.NAO_COMERCIAL
    assert classificar("apenas non-commercial use") is Faixa.NAO_COMERCIAL
    assert veredito_comercial(Faixa.NAO_COMERCIAL) == "bloqueado"
    assert Faixa.NAO_COMERCIAL in BLOQUEIA_COMERCIAL


def test_destilado_bloqueia() -> None:
    """AT-023 positivo: destilado de fechado veta sem parecer."""
    assert classificar("distilled from closed-model outputs") is Faixa.DESTILADO_CINZENTO
    assert veredito_comercial(Faixa.DESTILADO_CINZENTO) == "bloqueado"
    assert Faixa.DESTILADO_CINZENTO in BLOQUEIA_COMERCIAL


def test_propria_exige_leitura() -> None:
    """AT-023: licenca propria nao e liberacao automatica."""
    faixa = classificar("Custom Research License v2, attribution required")
    assert faixa is Faixa.PESOS_PROPRIA
    assert veredito_comercial(faixa) == "ler-licenca"
    assert Faixa.PESOS_PROPRIA not in BLOQUEIA_COMERCIAL
    assert Faixa.OSS_REAL not in BLOQUEIA_COMERCIAL
