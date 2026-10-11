"""Monte Carlo forecast of total effort from three-point task estimates."""

from __future__ import annotations

import csv
import math
import random
import statistics
from collections.abc import Sequence
from dataclasses import dataclass
from enum import StrEnum
from pathlib import Path

from leadkit.errors import InputError
from leadkit.stats import percentile


class Distribution(StrEnum):
    TRIANGULAR = "triangular"
    PERT = "pert"


@dataclass(frozen=True, slots=True)
class Task:
    """A task with a range: ``low <= likely <= high`` (any consistent unit, e.g. person-days)."""

    name: str
    low: float
    likely: float
    high: float

    def __post_init__(self) -> None:
        values = (self.low, self.likely, self.high)
        if not all(math.isfinite(v) for v in values):
            raise InputError(f"{self.name}: estimativas precisam ser números finitos")
        if self.low < 0:
            raise InputError(f"{self.name}: mínimo negativo ({self.low})")
        if not self.low <= self.likely <= self.high:
            raise InputError(
                f"{self.name}: esperado mín <= provável <= máx, recebido "
                f"{self.low} / {self.likely} / {self.high}"
            )


@dataclass(frozen=True, slots=True)
class Risk:
    """A discrete event: with ``probability`` it adds ``impact`` to the total."""

    name: str
    probability: float
    impact: float

    def __post_init__(self) -> None:
        if not 0 <= self.probability <= 1:
            raise InputError(f"{self.name}: probabilidade fora de [0, 1] ({self.probability})")
        if not math.isfinite(self.impact) or self.impact < 0:
            raise InputError(f"{self.name}: impacto inválido ({self.impact})")


@dataclass(frozen=True, slots=True)
class Forecast:
    runs: int
    seed: int
    distribution: Distribution
    naive_sum: float
    mean: float
    minimum: float
    p50: float
    p85: float
    p95: float
    maximum: float


def sample_task(task: Task, dist: Distribution, rng: random.Random) -> float:
    """Draw one duration for ``task``."""
    if task.high == task.low:
        return task.low
    if dist is Distribution.TRIANGULAR:
        return rng.triangular(task.low, task.high, task.likely)
    span = task.high - task.low
    alpha = 1 + 4 * (task.likely - task.low) / span
    beta = 1 + 4 * (task.high - task.likely) / span
    return task.low + span * rng.betavariate(alpha, beta)


def simulate(
    tasks: Sequence[Task],
    risks: Sequence[Risk] = (),
    *,
    runs: int = 10_000,
    seed: int = 42,
    dist: Distribution = Distribution.PERT,
) -> list[float]:
    """Return the sorted totals of ``runs`` simulated projects.

    Tasks are summed (one sequential stream of work) and are independent of each
    other. Both are modelling choices, discussed in the module text.
    """
    if not tasks:
        raise InputError("nenhuma tarefa informada")
    if runs < 1:
        raise InputError(f"runs precisa ser >= 1, recebido {runs}")
    rng = random.Random(seed)
    totals: list[float] = []
    for _ in range(runs):
        total = sum(sample_task(t, dist, rng) for t in tasks)
        total += sum(r.impact for r in risks if rng.random() < r.probability)
        totals.append(total)
    totals.sort()
    return totals


def forecast(
    tasks: Sequence[Task],
    risks: Sequence[Risk] = (),
    *,
    runs: int = 10_000,
    seed: int = 42,
    dist: Distribution = Distribution.PERT,
) -> Forecast:
    totals = simulate(tasks, risks, runs=runs, seed=seed, dist=dist)
    return Forecast(
        runs=runs,
        seed=seed,
        distribution=dist,
        naive_sum=sum(t.likely for t in tasks),
        mean=statistics.fmean(totals),
        minimum=totals[0],
        p50=percentile(totals, 50),
        p85=percentile(totals, 85),
        p95=percentile(totals, 95),
        maximum=totals[-1],
    )


def _number(raw: str, where: str) -> float:
    try:
        return float(raw)
    except ValueError:
        raise InputError(f"{where}: '{raw}' não é número") from None


def read_tasks(path: Path) -> list[Task]:
    """Read ``name,low,likely,high`` rows."""
    rows = _read_rows(path, ("name", "low", "likely", "high"))
    return [
        Task(
            r["name"],
            _number(r["low"], f"{path.name}:{n}"),
            _number(r["likely"], f"{path.name}:{n}"),
            _number(r["high"], f"{path.name}:{n}"),
        )
        for n, r in rows
    ]


def read_risks(path: Path) -> list[Risk]:
    """Read ``name,probability,impact`` rows."""
    rows = _read_rows(path, ("name", "probability", "impact"))
    return [
        Risk(
            r["name"],
            _number(r["probability"], f"{path.name}:{n}"),
            _number(r["impact"], f"{path.name}:{n}"),
        )
        for n, r in rows
    ]


def _read_rows(path: Path, columns: tuple[str, ...]) -> list[tuple[int, dict[str, str]]]:
    try:
        handle = path.open(encoding="utf-8", newline="")
    except OSError as exc:
        raise InputError(f"{path}: {exc.strerror}") from exc
    with handle:
        reader = csv.DictReader(handle)
        missing = [c for c in columns if c not in (reader.fieldnames or [])]
        if missing:
            raise InputError(f"{path.name}: faltam colunas {', '.join(missing)}")
        rows = [
            (n, {k: (v or "").strip() for k, v in row.items() if k})
            for n, row in enumerate(reader, start=2)
        ]
    if not rows:
        raise InputError(f"{path.name}: arquivo sem linhas de dados")
    return rows
