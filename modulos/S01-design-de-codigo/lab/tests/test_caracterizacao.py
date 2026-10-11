"""Characterization suite: one frozen set of answers, two implementations."""

from collections.abc import Callable
from pathlib import Path
from unittest import mock

import pytest

from design_lab import golden
from design_lab.golden import CASOS, Caso, Saida, rodar_legado, rodar_refatorado
from design_lab.pedidos import precificacao

GOLDEN = Path(__file__).parent / "golden" / "saidas.json"
Executor = Callable[[Caso], Saida]


@pytest.fixture(scope="module")
def congelado() -> dict[str, Saida]:
    return golden.carregar(GOLDEN)


def test_golden_cobre_exatamente_os_casos(congelado: dict[str, Saida]) -> None:
    assert sorted(congelado) == sorted(c.nome for c in CASOS)


@pytest.mark.parametrize("caso", CASOS, ids=lambda c: c.nome)
def test_legado_continua_igual_ao_golden(caso: Caso, congelado: dict[str, Saida]) -> None:
    assert rodar_legado(caso) == congelado[caso.nome]


@pytest.mark.parametrize("caso", CASOS, ids=lambda c: c.nome)
def test_refatorado_responde_como_o_legado(caso: Caso, congelado: dict[str, Saida]) -> None:
    assert rodar_refatorado(caso) == congelado[caso.nome]


def test_golden_contem_sucessos_e_erros(congelado: dict[str, Saida]) -> None:
    erros = [n for n, s in congelado.items() if "erro" in s]
    assert sorted(erros) == [
        "pedido_vazio",
        "perecivel_fora_do_alcance",
        "quantidade_zero",
        "tipo_desconhecido",
    ]


def test_valores_conhecidos_dos_casos_de_borda(congelado: dict[str, Saida]) -> None:
    assert congelado["frete_gratis_exato_30000"]["ok"]["frete"] == 0
    assert congelado["frete_pago_29999"]["ok"]["frete"] == 1500
    assert congelado["cupom_fixo20_exato_10000"]["ok"]["desconto"] == 2000
    assert congelado["teto_20pct"]["ok"]["avisos"] == ["desconto limitado a 20%"]


def test_relogio_e_uma_costura_substituivel() -> None:
    caso = next(c for c in CASOS if c.nome == "black_friday")
    saida = rodar_legado(caso)
    assert saida["ok"]["avisos"] == ["black friday"]


def test_diferencial_2000_casos_sem_divergencia() -> None:
    assert golden.divergencias(2000, seed=2026) == []


def test_diferencial_exercita_sucessos_e_erros() -> None:
    import random

    rng = random.Random(2026)
    saidas = [rodar_legado(golden.caso_aleatorio(rng, i)) for i in range(2000)]
    erros = sum("erro" in s for s in saidas)
    assert 40 < erros < 300
    assert any(s.get("ok", {}).get("avisos") for s in saidas)


def test_controle_negativo_refatoracao_com_teto_errado_e_detectada(
    congelado: dict[str, Saida],
) -> None:
    with mock.patch.object(precificacao, "TETO_PERCENTUAL", 25):
        quebrados = [c.nome for c in CASOS if rodar_refatorado(c) != congelado[c.nome]]
        achadas = golden.divergencias(500, seed=7)
    assert "teto_20pct" in quebrados
    assert achadas, "a diferencial deveria ter pego o teto alterado"
