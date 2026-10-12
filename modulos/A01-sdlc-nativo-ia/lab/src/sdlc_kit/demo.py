"""Reproducible synthetic metric series (Box-Muller on ``random.Random(seed)``)."""

from __future__ import annotations

import math
import random


def _noise(rng: random.Random) -> float:
    u1 = 1.0 - rng.random()
    return math.sqrt(-2.0 * math.log(u1)) * math.cos(2.0 * math.pi * rng.random())


def synthetic_series(kind: str, seed: int = 7, n_base: int = 38, n_after: int = 14) -> list[float]:
    """``flat`` | ``spike`` | ``drift`` | ``step``, centred on 100 with sigma about 5."""
    rng = random.Random(seed)
    base = [100.0 + 5.0 * _noise(rng) for _ in range(n_base)]
    after = [100.0 + 5.0 * _noise(rng) for _ in range(n_after)]
    if kind == "flat":
        pass
    elif kind == "spike":
        after[-1] += 40.0
    elif kind == "drift":
        after = [v + 0.5 * (i + 1) for i, v in enumerate(after)]
    elif kind == "step":
        after = [v + 12.0 for v in after]
    else:
        raise ValueError(f"unknown kind: {kind!r}")
    return base + after


def to_csv(series: list[float]) -> str:
    rows = ["t,value", *(f"{i},{v:.2f}" for i, v in enumerate(series))]
    return "\n".join(rows) + "\n"
