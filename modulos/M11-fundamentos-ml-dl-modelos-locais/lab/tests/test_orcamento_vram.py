"""Oraculo AT-020: VRAM 8B Q4 cabe em ctx curto, estoura em ctx longo.

Numeros CALCULADOS pela formula (medido na execucao, nao herdado):
8B Q4_K_M ctx 8192 batch 1: pesos 4.32, KV 1.00, total 6.82;
8B Q4_K_M ctx 131072 batch 4: KV 64.00, total 69.82.
Margens folgadas em torno do calculado.
"""

import pytest

from orcamento_vram import BYTES_POR_PARAM, Orcamento, estimar, main


def test_oito_b_q4_ctx_curto_cabe() -> None:
    """AT-020 positivo: 8B Q4 8k batch 1 soma um digito de GB."""
    o = estimar(8, "Q4_K_M", 8192, 1)
    assert isinstance(o, Orcamento)
    assert o.pesos_gb == pytest.approx(4.32, abs=0.05)
    assert o.kv_gb == pytest.approx(1.00, abs=0.05)
    assert o.total_gb == pytest.approx(6.82, abs=0.1)
    assert o.total_gb < 10.0


def test_mesmo_modelo_ctx_longo_estoura() -> None:
    """AT-020 negativo: 8B Q4 131k batch 4 passa de 60 GB de KV."""
    o = estimar(8, "Q4_K_M", 131072, 4)
    assert o.pesos_gb == pytest.approx(4.32, abs=0.05)  # pesos nao se movem
    assert o.kv_gb == pytest.approx(64.00, abs=0.5)
    assert o.total_gb > 60.0  # medido 69.82


def test_kv_dobra_com_ctx_e_batch() -> None:
    """AT-020: KV multiplica; pesos ficam."""
    base = estimar(8, "Q4_K_M", 8192, 1)
    dobro_ctx = estimar(8, "Q4_K_M", 16384, 1)
    dobro_batch = estimar(8, "Q4_K_M", 8192, 2)
    assert dobro_ctx.kv_gb == pytest.approx(2 * base.kv_gb)
    assert dobro_batch.kv_gb == pytest.approx(2 * base.kv_gb)
    assert dobro_ctx.pesos_gb == pytest.approx(base.pesos_gb)


def test_quant_desconhecido_levanta() -> None:
    """AT-020 negativo: esquema fora da tabela levanta KeyError."""
    with pytest.raises(KeyError):
        estimar(8, "Q2_XS", 8192, 1)
    assert set(BYTES_POR_PARAM) >= {"FP16", "Q8_0", "Q4_K_M", "Q3_K_S"}


def test_cli_imprime_pesos_kv_total(
    capsys: pytest.CaptureFixture[str], monkeypatch: pytest.MonkeyPatch
) -> None:
    """CLI publica as 4 linhas com ctx e batch declarados."""
    import sys

    argv = ["orcamento_vram.py", "8", "--quant", "Q4_K_M", "--ctx", "8192", "--batch", "1"]
    monkeypatch.setattr(sys, "argv", argv)
    main()
    saida = capsys.readouterr().out
    assert "pesos" in saida and "cache KV" in saida and "TOTAL" in saida
    assert "ctx=8192" in saida and "batch=1" in saida
