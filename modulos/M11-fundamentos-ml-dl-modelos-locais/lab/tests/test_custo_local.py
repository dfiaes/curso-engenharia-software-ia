"""Oraculo AT-033 + AT-035: custo local honesto perde da API em baixo volume.

Numeros DERIVADOS da formula (medido na execucao, nao herdado), com
parametros declarados como exemplo:
  HW US$ 4000, 36 meses, 350 W, US$ 0.20/kWh, 45 tok/s, util 0.25.
  horas/Mtok = 6.1728; energia ~0.43; hardware ~3.81; total ~4.24,
  acima da API de referencia (US$ 3.00/Mtok, M05).
Sem rede, sem servidor, sem pesos: so aritmetica sobre a formula.
"""

import pytest

from custo_local import CustoLocal, main
from matriz_local import break_even


def _exemplo() -> CustoLocal:
    """Parametros declarados como exemplo; util 0.25 default do contrato."""
    return CustoLocal(4000.0, 36, 350.0, 0.20, 45.0)


def test_horas_por_mtok_exato() -> None:
    """AT-033: 1M tokens a 45 tok/s levam 6.1728 h (aritmetica exata)."""
    c = _exemplo()
    assert c.horas_por_mtok == pytest.approx(1_000_000 / 45.0 / 3600)
    assert c.horas_por_mtok == pytest.approx(6.1728, abs=0.001)


def test_energia_centavos_hardware_dolares() -> None:
    """AT-033: energia sai em centavos, hardware em dolares (medido)."""
    energia, hardware, total = _exemplo().custo_por_mtok()
    assert energia == pytest.approx(0.43, abs=0.05)
    assert hardware == pytest.approx(3.81, abs=0.1)
    assert total == pytest.approx(energia + hardware)
    assert energia < 1.0 < hardware  # ordens de grandeza do Bloco 8


def test_baixo_volume_local_perde_da_api() -> None:
    """AT-033: em baixo volume, local (HW amortizado) > API de referencia."""
    _, _, total = _exemplo().custo_por_mtok()
    assert total > 3.00  # preco API de referencia do M05, declarado


def test_util_maior_dilui_hardware() -> None:
    """AT-033: dobrar a utilizacao quase divide o hardware por dois."""
    base = _exemplo().custo_por_mtok()[1]
    cheia = CustoLocal(4000.0, 36, 350.0, 0.20, 45.0, 0.50).custo_por_mtok()[1]
    assert cheia == pytest.approx(base / 2)


def test_break_even_baixo_volume_veredito_api() -> None:
    """AT-035: poucos relatorios/mes -> veredito 'api' (aritmetica exata)."""
    _, _, total = _exemplo().custo_por_mtok()
    fixo = 4000.0 / 36  # amortizacao mensal do exemplo, declarada
    api, local, veredito = break_even(100, 8000, 3.00, total, fixo)
    assert api == pytest.approx(0.8 * 3.00)
    assert local == pytest.approx(fixo + 0.8 * total)
    assert veredito == "api"


def test_break_even_alto_volume_veredito_local() -> None:
    """AT-035: vazao alta + util alta diluem o fixo -> 'local' (exato).

    Segundo cenario declarado como exemplo (120 tok/s, util 0.50):
    variavel ~0.88 < 3.00 da API, logo existe crossover em alto volume.
    """
    rapido = CustoLocal(4000.0, 36, 350.0, 0.20, 120.0, 0.50)
    _, _, total = rapido.custo_por_mtok()
    assert total < 3.00
    fixo = 4000.0 / 36
    api, local, veredito = break_even(100_000, 8000, 3.00, total, fixo)
    assert api == pytest.approx(800 * 3.00)
    assert local == pytest.approx(fixo + 800 * total)
    assert veredito == "local"


def test_cli_imprime_energia_hardware_total(
    capsys: pytest.CaptureFixture[str], monkeypatch: pytest.MonkeyPatch
) -> None:
    """CLI publica as 3 linhas em US$/Mtok com os parametros dados."""
    import sys

    argv = [
        "custo_local.py",
        "--preco-hw",
        "4000",
        "--vida-meses",
        "36",
        "--watts",
        "350",
        "--kwh",
        "0.20",
        "--tok-s",
        "45",
    ]
    monkeypatch.setattr(sys, "argv", argv)
    main()
    saida = capsys.readouterr().out
    assert "energia" in saida and "hardware" in saida and "TOTAL" in saida
    assert "/ Mtok" in saida
