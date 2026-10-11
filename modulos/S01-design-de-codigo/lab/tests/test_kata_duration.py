"""TDD kata: tests written one at a time, in this order. Each block is one red-green turn."""

import random

import pytest

from design_lab.kata.duration import parse_duration


# turn 1 - the simplest thing that can fail
def test_segundos_puros() -> None:
    assert parse_duration("90s") == 90


# turn 2 - generalize the unit
@pytest.mark.parametrize(("texto", "esperado"), [("5m", 300), ("2h", 7200), ("1d", 86400)])
def test_cada_unidade(texto: str, esperado: int) -> None:
    assert parse_duration(texto) == esperado


# turn 3 - combine
def test_unidades_combinadas() -> None:
    assert parse_duration("1h30m") == 5400
    assert parse_duration("1d2h3m4s") == 86400 + 7200 + 180 + 4


# turn 4 - a decision: whitespace is allowed between parts, and order is free
def test_espacos_e_ordem_livre() -> None:
    assert parse_duration(" 1h  30m ") == 5400
    assert parse_duration("30m1h") == 5400


# turn 5 - empty is an error with its own message
def test_vazio_e_erro() -> None:
    with pytest.raises(ValueError, match="vazia"):
        parse_duration("   ")


# turn 6 - malformed input
@pytest.mark.parametrize("texto", ["abc", "10", "1x", "h", "-5m", "1.5h", "1h30"])
def test_formato_invalido(texto: str) -> None:
    with pytest.raises(ValueError, match="inválida"):
        parse_duration(texto)


# turn 7 - repeated unit is ambiguous, so refuse it
def test_unidade_repetida() -> None:
    with pytest.raises(ValueError, match="repetida: h"):
        parse_duration("1h1h")


# boundary
def test_zero_e_valido() -> None:
    assert parse_duration("0s") == 0


# turn 8 - after the refactor step: a property that survives any rewrite
def test_roundtrip_aleatorio_com_semente() -> None:
    rng = random.Random(2026)
    for _ in range(300):
        d, h, m, s = (rng.randint(0, 99) for _ in range(4))
        texto = f"{d}d{h}h{m}m{s}s"
        assert parse_duration(texto) == d * 86400 + h * 3600 + m * 60 + s
