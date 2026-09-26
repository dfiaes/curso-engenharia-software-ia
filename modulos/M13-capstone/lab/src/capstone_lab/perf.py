"""Performance, capacidade e modo local: benchmark real, percentis e estimativa (M13 B16).

Invariantes:
- Benchmark é **medição real**: ``time.perf_counter`` sobre amostras reais; os
  números publicados vêm da execução registrada em evidência, nunca digitados.
- Percentis (p50/p95/p99) são função pura das amostras — mesma entrada, mesma
  saída; saturação e capacity estimate são derivados por regra declarativa.
- A conclusão é válida **apenas** para o ambiente registrado (CPU/OS/Python);
  o relatório carrega o ambiente e proíbe extrapolação além da amostra.
- Modo local vs. cloud: aqui só existe o local; comparação real em cloud é
  BLOCKED ambiental. A regra de previsão de custo é modelada, não medida.
"""

from __future__ import annotations

import math
import platform
import statistics
import sys
import time
from collections.abc import Callable
from dataclasses import dataclass
from typing import Any


def percentil(samples: list[float], p: float) -> float:
    """Percentil por interpolação linear (método 'inclusive', tipo R-7)."""
    if not samples:
        raise ValueError("sem amostras")
    if not 0.0 < p <= 100.0:
        raise ValueError("p fora de (0, 100]")
    ordered = sorted(samples)
    if len(ordered) == 1:
        return ordered[0]
    rank = (p / 100.0) * (len(ordered) - 1)
    lo, hi = math.floor(rank), math.ceil(rank)
    if lo == hi:
        return ordered[lo]
    return ordered[lo] + (ordered[hi] - ordered[lo]) * (rank - lo)


@dataclass(frozen=True)
class Ambiente:
    python: str
    platform: str
    machine: str


def ambient_atual() -> Ambiente:
    """Ambiente real da execução — obrigatório em todo relatório de benchmark."""
    return Ambiente(
        python=sys.version.split()[0],
        platform=platform.platform(),
        machine=platform.machine(),
    )


@dataclass(frozen=True)
class BenchmarkReport:
    name: str
    samples_ms: tuple[float, ...]
    ambiente: Ambiente
    rotulo: str = "medicao-real"  # nunca "simulado"; rótulo deixa explícito

    @property
    def p50(self) -> float:
        return percentil(list(self.samples_ms), 50.0)

    @property
    def p95(self) -> float:
        return percentil(list(self.samples_ms), 95.0)

    @property
    def p99(self) -> float:
        return percentil(list(self.samples_ms), 99.0)


def benchmark(fn: Callable[[], Any], *, samples: int = 15) -> BenchmarkReport:
    """Mede ``fn`` `samples` vezes com warm-up; mede de verdade, sem sleep fixo."""
    if samples < 5:
        raise ValueError("samples mínimo: 5")
    fn()  # warm-up, descartado
    medidas: list[float] = []
    for _ in range(samples):
        t0 = time.perf_counter()
        fn()
        medidas.append((time.perf_counter() - t0) * 1000.0)
    return BenchmarkReport(getattr(fn, "__name__", "fn"), tuple(medidas), ambient_atual())


def saturacao(throughputs: list[float], *, tolerancia: float = 0.05) -> int | None:
    """Índice da primeira amostra de saturação: ganho relativo < tolerância.

    Recebe throughput crescente de carga (ex.: ops/s por nível de concorrência);
    devolve o índice onde o sistema para de escalar, ou None se não saturou.
    """
    for i in range(1, len(throughputs)):
        base = throughputs[i - 1]
        if base <= 0:
            raise ValueError("throughput deve ser positivo")
        if (throughputs[i] - base) / base < tolerancia:
            return i
    return None


@dataclass(frozen=True)
class CapacityEstimate:
    """Previsão declarada: modelo + premissas explícitas, não medida de cloud."""

    headroom_reqs_s: float  # demanda observada no pico medido
    margem_seguranca: float  # ex.: 2.0 => dobro do pico
    capacidade_observada_s: float  # throughput na saturação (medido)

    def decisao(self) -> str:
        alvo = self.headroom_reqs_s * self.margem_seguranca
        return "OK" if self.capacidade_observada_s >= alvo else "CAPACIDADE-INSUFICIENTE"

    def relatorio(self) -> dict[str, Any]:
        return {
            "headroom_reqs_s": self.headroom_reqs_s,
            "margem_seguranca": self.margem_seguranca,
            "capacidade_observada_s": self.capacidade_observada_s,
            "decisao": self.decisao(),
            "limite": "valida somente para o ambiente registrado; cloud não medida (BLOCKED)",
        }


def resumo_relatorio(reports: list[BenchmarkReport]) -> dict[str, Any]:
    """Resumo determinístico: medianas e dispersão por benchmark, sem esconder nada."""
    if not reports:
        raise ValueError("sem benchmarks")
    envs = {r.ambiente for r in reports}
    if len(envs) != 1:
        raise ValueError("relatórios de ambientes distintos não se misturam")
    out: dict[str, Any] = {"ambiente": envs.pop().__dict__, "benchmarks": {}}
    for r in reports:
        out["benchmarks"][r.name] = {
            "n": len(r.samples_ms),
            "p50_ms": round(r.p50, 4),
            "p95_ms": round(r.p95, 4),
            "p99_ms": round(r.p99, 4),
            "stdev_ms": round(statistics.stdev(r.samples_ms), 4) if len(r.samples_ms) > 1 else 0.0,
            "rotulo": r.rotulo,
        }
    return out


def throughput_curve(levels: list[int], fn: Callable[[], Any], *, samples: int = 5) -> list[float]:
    """Throughput medido por nível de "concorrência lógica" (lotes sequenciais)."""
    curva: list[float] = []
    for n in levels:
        ops = n
        t0 = time.perf_counter()
        for _ in range(samples):
            for _ in range(n):
                fn()
        dur = time.perf_counter() - t0
        curva.append((ops * samples) / dur if dur > 0 else math.inf)
    return curva


@dataclass(frozen=True)
class SloBudget:
    """Orçamento do B1: percentil, alvo em ms e veredito derivado."""

    nome: str
    percentil: float
    alvo_ms: float

    def veredito(self, report: BenchmarkReport) -> dict[str, Any]:
        medido = percentil(list(report.samples_ms), self.percentil)
        return {
            "slo": f"{self.nome} p{self.percentil:g} <= {self.alvo_ms}ms",
            "medido_ms": round(medido, 4),
            "passou": medido <= self.alvo_ms,
        }


DEFAULT_SLO_BUDGETS: tuple[SloBudget, ...] = (
    SloBudget("retrieval-local", 95.0, 50.0),
    SloBudget("graph-neighborhood", 95.0, 50.0),
)
