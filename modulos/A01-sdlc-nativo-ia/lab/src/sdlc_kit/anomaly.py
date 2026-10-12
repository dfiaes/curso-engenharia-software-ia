"""Deterministic detection with Western Electric rules against a baseline.

No model is involved. The baseline is the ``window`` points that precede the last ``lookback``
points, so a slow drift is judged against what was normal *before* it started instead of being
absorbed by a moving average.

Rules (z = distance from the baseline mean in baseline standard deviations):

* WE1: the newest point is beyond 3 sigma.
* WE2: 2 of the last 3 points are beyond 2 sigma on the same side (newest included).
* WE3: 4 of the last 5 points are beyond 1 sigma on the same side (newest included).
* WE4: the last 8 points are all on the same side of the mean.
"""

from __future__ import annotations

import statistics
from dataclasses import dataclass

RULE_SIGMA = {"WE1": 3, "WE2": 2, "WE3": 1, "WE4": 1}
MIN_LOOKBACK = 8


class DetectionError(ValueError):
    """Raised when the data cannot support a verdict (too short, flat baseline)."""


@dataclass(frozen=True, slots=True)
class Baseline:
    mean: float
    std: float


@dataclass(frozen=True, slots=True)
class Breach:
    rule: str
    sigma: int
    index: int
    direction: str  # "high" or "low"
    z: float


def baseline_of(points: list[float], min_std: float = 0.0) -> Baseline:
    if len(points) < 2:
        raise DetectionError("baseline needs at least 2 points")
    std = max(statistics.stdev(points), min_std)
    if std <= 0.0:
        raise DetectionError("flat baseline (std = 0): set min_std in bands.yaml")
    return Baseline(statistics.fmean(points), std)


def _same_side(zs: list[float], threshold: float, need: int) -> str | None:
    """Direction if at least ``need`` of ``zs`` exceed ``threshold`` and the last one does."""
    for sign, name in ((1, "high"), (-1, "low")):
        hits = [sign * z > threshold for z in zs]
        if hits[-1] and sum(hits) >= need:
            return name
    return None


def evaluate(
    series: list[float],
    window: int = 30,
    lookback: int = MIN_LOOKBACK,
    min_std: float = 0.0,
    rules: tuple[str, ...] = tuple(RULE_SIGMA),
) -> list[Breach]:
    """Rules triggered by the newest point of ``series``."""
    if lookback < MIN_LOOKBACK:
        raise DetectionError(f"lookback must be >= {MIN_LOOKBACK} (WE4 needs 8 points)")
    if len(series) < window + lookback:
        raise DetectionError(f"need {window + lookback} points, got {len(series)}")
    unknown = set(rules) - set(RULE_SIGMA)
    if unknown:
        raise DetectionError(f"unknown rules: {sorted(unknown)}")
    base = baseline_of(series[-(window + lookback) : -lookback], min_std)
    recent = [(x - base.mean) / base.std for x in series[-lookback:]]
    last_index = len(series) - 1
    out: list[Breach] = []

    def add(rule: str, direction: str | None) -> None:
        if rule in rules and direction is not None:
            out.append(Breach(rule, RULE_SIGMA[rule], last_index, direction, recent[-1]))

    add("WE1", "high" if recent[-1] > 3 else "low" if recent[-1] < -3 else None)
    add("WE2", _same_side(recent[-3:], 2, 2))
    add("WE3", _same_side(recent[-5:], 1, 4))
    tail = recent[-8:]
    if all(z > 0 for z in tail):
        add("WE4", "high")
    elif all(z < 0 for z in tail):
        add("WE4", "low")
    return out


def scan(
    series: list[float],
    window: int = 30,
    lookback: int = MIN_LOOKBACK,
    min_std: float = 0.0,
    rules: tuple[str, ...] = tuple(RULE_SIGMA),
) -> list[Breach]:
    """Evaluate every prefix (as if each point had just arrived) and keep the first hit per rule."""
    if len(series) < window + lookback:
        raise DetectionError(f"need {window + lookback} points, got {len(series)}")
    first: dict[str, Breach] = {}
    for end in range(window + lookback, len(series) + 1):
        for breach in evaluate(series[:end], window, lookback, min_std, rules):
            first.setdefault(breach.rule, breach)
    return sorted(first.values(), key=lambda b: (b.index, b.rule))
