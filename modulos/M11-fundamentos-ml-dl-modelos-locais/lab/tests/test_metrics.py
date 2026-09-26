"""Oráculo AT-003: contrato de metrics.resumir."""

from math import exp

import pytest

from metrics import LIMIAR_INCERTEZA, ConfiancaGeracao, resumir


def test_resumir_lista_conhecida() -> None:
    logprobs = [-0.1, -0.2, -1.5, -0.4]
    resultado = resumir(logprobs)
    assert isinstance(resultado, ConfiancaGeracao)
    assert resultado.medio == pytest.approx(-0.55)
    assert resultado.minimo == pytest.approx(-1.5)
    assert resultado.incertos == 1
    assert resultado.total == 4
    assert resultado.perplexidade == pytest.approx(exp(0.55))
    assert resultado.fracao_incerta == pytest.approx(0.25)


def test_resumir_lista_vazia_rende_none() -> None:
    assert resumir([]) is None


def test_fronteira_exata_menos_um_nao_conta() -> None:
    """Limiar é estrito (<): -1.0 exato NÃO é incerto; mata mutante <=."""
    assert LIMIAR_INCERTEZA == -1.0
    resultado = resumir([-1.0, -1.0])
    assert resultado is not None
    assert resultado.incertos == 0
    assert resultado.fracao_incerta == pytest.approx(0.0)


def test_valores_acima_de_zero_sao_fronteira_sem_validacao() -> None:
    """Logprob > 0.0 é probabilidade impossível.

    O contrato NÃO valida domínio: documenta-se o comportamento observado
    (média aritmética pura, sem ValueError) como fronteira, sem inventar
    validação que o contrato não tem.
    """
    resultado = resumir([0.5, 0.2])
    assert resultado is not None
    assert resultado.medio == pytest.approx(0.35)
    assert resultado.minimo == pytest.approx(0.2)
    assert resultado.incertos == 0
    assert resultado.total == 2


def test_minimo_difere_da_media_mata_troca_min_mean() -> None:
    """Mínimo (-2.0) ≠ média (-2.2/3): mata mutante que troca min por mean."""
    resultado = resumir([-0.1, -0.1, -2.0])
    assert resultado is not None
    assert resultado.medio == pytest.approx(-2.2 / 3)
    assert resultado.minimo == pytest.approx(-2.0)
    assert abs(resultado.medio - resultado.minimo) > 0.5


def test_inversao_de_sinal_mata_troca_menor_por_maior() -> None:
    """Com '<', só 1 token conta; com '>' seriam 2."""
    resultado = resumir([-0.2, -0.3, -1.5])
    assert resultado is not None
    assert resultado.incertos == 1


def test_fracao_incerta_com_total_zero() -> None:
    vazia = ConfiancaGeracao(medio=0.0, minimo=0.0, incertos=0, total=0)
    assert vazia.fracao_incerta == 0.0
