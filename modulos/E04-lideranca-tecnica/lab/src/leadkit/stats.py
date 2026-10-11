"""Percentile helper shared by the forecast and the DORA calculator."""

from __future__ import annotations

import math
from collections.abc import Sequence


def percentile(sorted_values: Sequence[float], p: float) -> float:
    """Nearest-rank percentile of an already sorted, non-empty sequence.

    ``p`` is in (0, 100]. Nearest-rank always returns an observed value, which is
    what you want when a stakeholder asks "which run was the P85?".
    """
    if not sorted_values:
        raise ValueError("percentile of an empty sequence")
    if not 0 < p <= 100:
        raise ValueError(f"p must be in (0, 100], got {p}")
    rank = math.ceil(p / 100 * len(sorted_values))
    return sorted_values[max(rank, 1) - 1]
