"""B16: percentis puros, benchmark real documentado, saturação e capacidade."""

import json
from pathlib import Path

import pytest

from capstone_lab.perf import (
    DEFAULT_SLO_BUDGETS,
    CapacityEstimate,
    ambient_atual,
    benchmark,
    percentil,
    resumo_relatorio,
    saturacao,
    throughput_curve,
)


def test_percentil_puro_e_monotono() -> None:
    amostras = [10.0, 20.0, 30.0, 40.0]
    assert percentil(amostras, 50.0) == 25.0  # interpolação R-7
    assert percentil(amostras, 100.0) == 40.0
    assert percentil([7.0], 95.0) == 7.0
    assert percentil(amostras, 50.0) <= percentil(amostras, 95.0)
    with pytest.raises(ValueError, match="sem amostras"):
        percentil([], 50.0)
    with pytest.raises(ValueError, match="fora de"):
        percentil(amostras, 0.0)


def test_ambiente_registrado_real() -> None:
    env = ambient_atual()
    assert env.python.count(".") >= 1
    assert env.machine and env.platform


def test_benchmark_medicao_real_ordem_percentis() -> None:
    def trabalho() -> int:
        total = 0
        for i in range(2000):
            total += i * i
        return total

    report = benchmark(trabalho, samples=11)
    assert len(report.samples_ms) == 11
    assert all(s >= 0 for s in report.samples_ms)
    assert report.p50 <= report.p95 <= report.p99
    assert ".py" not in report.name or report.name == "trabalho"


def test_saturacao_detecta_platô() -> None:
    assert saturacao([100.0, 190.0, 280.0, 284.0, 285.0]) == 3
    assert saturacao([100.0, 200.0, 400.0]) is None  # nunca satura
    with pytest.raises(ValueError, match="positivo"):
        saturacao([0.0, 10.0])


def test_throughput_curve_medida_real() -> None:
    def op() -> int:
        return sum(range(50))

    curva = throughput_curve([1, 2, 4], op, samples=3)
    assert len(curva) == 3
    assert all(c > 0 for c in curva)  # throughput real, > 0 ops/s


def test_capacity_estimate_e_slo_budget() -> None:
    suficiente = CapacityEstimate(
        headroom_reqs_s=40.0, margem_seguranca=2.0, capacidade_observada_s=100.0
    )
    assert suficiente.decisao() == "OK"
    insuficiente = CapacityEstimate(40.0, 2.0, 50.0)
    assert insuficiente.decisao() == "CAPACIDADE-INSUFICIENTE"
    rel = insuficiente.relatorio()
    assert "BLOCKED" in rel["limite"]  # cloud não medida, declarado

    def rapido() -> int:
        return 1 + 1

    report = benchmark(rapido, samples=7)
    for slo in DEFAULT_SLO_BUDGETS:
        veredito = slo.veredito(report)
        assert set(veredito) == {"slo", "medido_ms", "passou"}


def test_resumo_relatorio_exige_mesmo_ambiente(tmp_path: Path) -> None:
    def f() -> int:
        return 42

    r = benchmark(f, samples=5)
    out = resumo_relatorio([r])
    assert out["benchmarks"]["f"]["n"] == 5
    destino = tmp_path / "capacity-report.json"
    destino.write_text(json.dumps(out), encoding="utf-8")
    assert json.loads(destino.read_text())["ambiente"]["python"]
