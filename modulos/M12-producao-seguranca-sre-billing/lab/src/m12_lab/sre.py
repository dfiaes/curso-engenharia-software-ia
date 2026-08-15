"""Small, auditable SRE calculations used by the lab."""

from __future__ import annotations

from dataclasses import dataclass
from math import isclose

from m12_lab.security import ContentPolicy


def burn_rate(*, bad_events: int, total_events: int, objective: float) -> float:
    if total_events <= 0 or not 0 < objective < 1:
        raise ValueError("invalid SLO inputs")
    observed_bad = bad_events / total_events
    allowed_bad = 1.0 - objective
    return observed_bad / allowed_bad


@dataclass(frozen=True, slots=True)
class MultiWindowBurnAlert:
    short_threshold: float
    long_threshold: float

    def should_page(
        self,
        *,
        short_bad: int,
        short_total: int,
        long_bad: int,
        long_total: int,
        objective: float,
    ) -> bool:
        short_rate = burn_rate(bad_events=short_bad, total_events=short_total, objective=objective)
        long_rate = burn_rate(bad_events=long_bad, total_events=long_total, objective=objective)
        short_exceeded = short_rate >= self.short_threshold or isclose(
            short_rate, self.short_threshold, rel_tol=1e-9
        )
        long_exceeded = long_rate >= self.long_threshold or isclose(
            long_rate, self.long_threshold, rel_tol=1e-9
        )
        return short_exceeded and long_exceeded


@dataclass(frozen=True, slots=True)
class ReadOnlyIncidentCopilot:
    content_policy: ContentPolicy

    def summarize(self, log_line: str) -> str:
        safe = self.content_policy.redact(log_line).text
        return f"Untrusted operational evidence; no action executed: {safe}"
