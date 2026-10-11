"""Pure functions for order-of-magnitude capacity and cost estimates.

Every function validates its inputs and raises ``CapacityError``: an estimate
built on a negative rate or a hit rate of 140% is worse than no estimate.
Money is USD, rates are per second unless the name says otherwise.
"""

from __future__ import annotations

import math
from dataclasses import dataclass

SECONDS_PER_HOUR = 3600
SECONDS_PER_MINUTE = 60
TOKENS_PER_MTOK = 1_000_000


class CapacityError(ValueError):
    """Raised when an input makes the estimate meaningless."""


def _positive(name: str, value: float) -> None:
    if not value > 0:
        raise CapacityError(f"{name} must be > 0, got {value}")


def _non_negative(name: str, value: float) -> None:
    if value < 0:
        raise CapacityError(f"{name} must be >= 0, got {value}")


def _fraction(name: str, value: float) -> None:
    if not 0.0 <= value <= 1.0:
        raise CapacityError(f"{name} must be between 0 and 1, got {value}")


@dataclass(frozen=True)
class Traffic:
    """Usage pattern: how many requests, concentrated in how many hours, with what peak."""

    active_users: int
    requests_per_user_day: float
    active_hours: float
    peak_factor: float

    def __post_init__(self) -> None:
        _positive("active_users", self.active_users)
        _positive("requests_per_user_day", self.requests_per_user_day)
        _positive("active_hours", self.active_hours)
        if self.active_hours > 24:
            raise CapacityError(f"active_hours must be <= 24, got {self.active_hours}")
        if self.peak_factor < 1:
            raise CapacityError(f"peak_factor must be >= 1, got {self.peak_factor}")

    @property
    def requests_per_day(self) -> float:
        return self.active_users * self.requests_per_user_day

    @property
    def average_qps(self) -> float:
        """Average rate inside the active window (not over 24 h)."""
        return self.requests_per_day / (self.active_hours * SECONDS_PER_HOUR)

    @property
    def peak_qps(self) -> float:
        return self.average_qps * self.peak_factor


@dataclass(frozen=True)
class Tokens:
    """Tokens of one request."""

    input: int
    output: int

    def __post_init__(self) -> None:
        _non_negative("input tokens", self.input)
        _non_negative("output tokens", self.output)

    @property
    def total(self) -> int:
        return self.input + self.output


@dataclass(frozen=True)
class Price:
    """Hypothetical price per million tokens (USD)."""

    input_per_mtok: float
    output_per_mtok: float

    def __post_init__(self) -> None:
        _non_negative("input price", self.input_per_mtok)
        _non_negative("output price", self.output_per_mtok)


@dataclass(frozen=True)
class Quota:
    """Provider quota the system must be granted to survive the peak."""

    rpm: int
    tpm: int


def littles_law(arrival_rate: float, time_in_system_s: float) -> float:
    """Little's law: L = lambda * W. Average number of requests in flight."""
    _non_negative("arrival_rate", arrival_rate)
    _non_negative("time_in_system_s", time_in_system_s)
    return arrival_rate * time_in_system_s


def workers_needed(concurrency: float, target_utilization: float) -> int:
    """Workers to carry ``concurrency`` without running them at 100%."""
    _non_negative("concurrency", concurrency)
    if not 0 < target_utilization <= 1:
        raise CapacityError(f"target_utilization must be in (0, 1], got {target_utilization}")
    return math.ceil(concurrency / target_utilization)


def generation_latency(ttft_s: float, output_tokens: int, tokens_per_s: float) -> float:
    """Time to the last token: time to first token plus decode time."""
    _non_negative("ttft_s", ttft_s)
    _non_negative("output_tokens", output_tokens)
    _positive("tokens_per_s", tokens_per_s)
    return ttft_s + output_tokens / tokens_per_s


def quota_needed(peak_qps: float, tokens: Tokens, headroom: float = 0.3) -> Quota:
    """RPM and TPM to request from the provider, with ``headroom`` above the peak."""
    _non_negative("peak_qps", peak_qps)
    _non_negative("headroom", headroom)
    factor = 1 + headroom
    rpm = math.ceil(peak_qps * SECONDS_PER_MINUTE * factor)
    tpm = math.ceil(peak_qps * SECONDS_PER_MINUTE * tokens.total * factor)
    return Quota(rpm=rpm, tpm=tpm)


def request_cost(
    tokens: Tokens,
    price: Price,
    *,
    cached_input_fraction: float = 0.0,
    cached_input_multiplier: float = 0.1,
) -> float:
    """Cost of one request. The cached share of the input is billed at a discount."""
    _fraction("cached_input_fraction", cached_input_fraction)
    _non_negative("cached_input_multiplier", cached_input_multiplier)
    input_factor = (1 - cached_input_fraction) + cached_input_fraction * cached_input_multiplier
    input_cost = tokens.input * price.input_per_mtok * input_factor
    output_cost = tokens.output * price.output_per_mtok
    return (input_cost + output_cost) / TOKENS_PER_MTOK


def routed_cost(cost_small: float, cost_large: float, small_share: float) -> float:
    """Average cost when ``small_share`` of the requests go to the cheaper model."""
    _non_negative("cost_small", cost_small)
    _non_negative("cost_large", cost_large)
    _fraction("small_share", small_share)
    return small_share * cost_small + (1 - small_share) * cost_large


def cascade_cost(first_pass: float, second_pass: float, escalation_rate: float) -> float:
    """Average cost when every item takes the first pass and some repeat on the second."""
    _non_negative("first_pass", first_pass)
    _non_negative("second_pass", second_pass)
    _fraction("escalation_rate", escalation_rate)
    return first_pass + escalation_rate * second_pass


def monthly_cost(
    requests_per_day: float,
    cost_per_request: float,
    *,
    cache_hit_rate: float = 0.0,
    cache_hit_cost: float = 0.0,
    batch_share: float = 0.0,
    batch_discount: float = 0.5,
    days: int = 30,
) -> float:
    """Monthly LLM spend.

    A cache hit costs ``cache_hit_cost`` (lookup, usually ~0) instead of a model call.
    Of the misses, ``batch_share`` runs on a batch endpoint billed at
    ``(1 - batch_discount)`` of the synchronous price.
    """
    _non_negative("requests_per_day", requests_per_day)
    _non_negative("cost_per_request", cost_per_request)
    _fraction("cache_hit_rate", cache_hit_rate)
    _non_negative("cache_hit_cost", cache_hit_cost)
    _fraction("batch_share", batch_share)
    _fraction("batch_discount", batch_discount)
    _positive("days", days)
    misses = requests_per_day * (1 - cache_hit_rate)
    hits = requests_per_day * cache_hit_rate
    batch_factor = (1 - batch_share) + batch_share * (1 - batch_discount)
    daily = misses * cost_per_request * batch_factor + hits * cache_hit_cost
    return daily * days


def agent_task_tokens(
    steps: int, base_context: int, growth_per_step: int, output_per_step: int
) -> Tokens:
    """Tokens of one agent task whose context grows at every step.

    Step ``i`` (0-based) re-sends ``base_context + i * growth_per_step`` input tokens, so the
    input total grows quadratically with the number of steps.
    """
    _positive("steps", steps)
    _non_negative("base_context", base_context)
    _non_negative("growth_per_step", growth_per_step)
    _non_negative("output_per_step", output_per_step)
    total_input = steps * base_context + growth_per_step * (steps * (steps - 1) // 2)
    return Tokens(input=total_input, output=steps * output_per_step)


def drain_minutes(total_tokens: float, tpm: float) -> float:
    """Minutes to push ``total_tokens`` through a quota of ``tpm`` tokens per minute."""
    _non_negative("total_tokens", total_tokens)
    _positive("tpm", tpm)
    return total_tokens / tpm


def sample_size(expected_rate: float, margin: float, z: float = 1.96) -> int:
    """Items to inspect to estimate a defect rate within +/- ``margin`` (normal approximation)."""
    _fraction("expected_rate", expected_rate)
    _positive("margin", margin)
    _positive("z", z)
    return math.ceil(z * z * expected_rate * (1 - expected_rate) / (margin * margin))


def vector_storage_bytes(
    vectors: int, dimensions: int, *, bytes_per_value: int = 4, index_overhead: float = 1.5
) -> int:
    """Memory for a vector index: raw floats times an overhead for the graph/index."""
    _non_negative("vectors", vectors)
    _positive("dimensions", dimensions)
    _positive("bytes_per_value", bytes_per_value)
    if index_overhead < 1:
        raise CapacityError(f"index_overhead must be >= 1, got {index_overhead}")
    return math.ceil(vectors * dimensions * bytes_per_value * index_overhead)
