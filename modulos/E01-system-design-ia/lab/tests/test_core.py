from __future__ import annotations

import math

import pytest

from capacity import (
    CapacityError,
    Price,
    Tokens,
    Traffic,
    agent_task_tokens,
    cascade_cost,
    drain_minutes,
    generation_latency,
    littles_law,
    monthly_cost,
    quota_needed,
    request_cost,
    routed_cost,
    sample_size,
    vector_storage_bytes,
    workers_needed,
)

PRICE = Price(input_per_mtok=3.0, output_per_mtok=15.0)
TOKENS = Tokens(input=3_500, output=350)


def test_traffic_peak_from_active_users() -> None:
    t = Traffic(active_users=10_000, requests_per_user_day=5, active_hours=10, peak_factor=3)
    assert t.requests_per_day == 50_000
    assert t.average_qps == pytest.approx(50_000 / 36_000)
    assert t.peak_qps == pytest.approx(3 * 50_000 / 36_000)


def test_littles_law_and_workers() -> None:
    assert littles_law(4.0, 7.5) == pytest.approx(30.0)
    assert workers_needed(30.0, 0.7) == 43  # ceil(42.86)
    assert workers_needed(0, 0.7) == 0


def test_generation_latency_is_ttft_plus_decode() -> None:
    assert generation_latency(0.8, 300, 60) == pytest.approx(5.8)
    assert generation_latency(0.8, 0, 60) == pytest.approx(0.8)


def test_quota_has_headroom_and_counts_input_plus_output() -> None:
    q = quota_needed(2.0, Tokens(1_000, 500), headroom=0.5)
    assert q.rpm == 180
    assert q.tpm == 270_000


def test_request_cost_exact_arithmetic() -> None:
    assert request_cost(TOKENS, PRICE) == pytest.approx((3_500 * 3 + 350 * 15) / 1e6)


def test_prefix_cache_discounts_only_the_input() -> None:
    plain = request_cost(TOKENS, PRICE)
    cached = request_cost(TOKENS, PRICE, cached_input_fraction=1.0, cached_input_multiplier=0.1)
    assert cached == pytest.approx((3_500 * 3 * 0.1 + 350 * 15) / 1e6)
    assert cached < plain


def test_cache_hit_rate_scales_cost_linearly() -> None:
    base = monthly_cost(1_000, 0.01)
    assert base == pytest.approx(300.0)
    assert monthly_cost(1_000, 0.01, cache_hit_rate=0.25) == pytest.approx(225.0)
    assert monthly_cost(1_000, 0.01, cache_hit_rate=1.0) == 0.0
    # a hit that is not free (lookup cost) is accounted for
    assert monthly_cost(1_000, 0.01, cache_hit_rate=1.0, cache_hit_cost=0.001) == pytest.approx(
        30.0
    )


def test_batch_discount_applies_only_to_batch_share() -> None:
    assert monthly_cost(1_000, 0.01, batch_share=1.0, batch_discount=0.5) == pytest.approx(150.0)
    assert monthly_cost(1_000, 0.01, batch_share=0.5, batch_discount=0.5) == pytest.approx(225.0)


def test_routing_and_cascade() -> None:
    assert routed_cost(1.0, 10.0, 0.5) == pytest.approx(5.5)
    assert routed_cost(1.0, 10.0, 0.0) == 10.0
    assert cascade_cost(1.0, 10.0, 0.1) == pytest.approx(2.0)
    assert cascade_cost(1.0, 10.0, 0.0) == 1.0


def test_agent_context_grows_quadratically() -> None:
    t = agent_task_tokens(steps=10, base_context=3_000, growth_per_step=800, output_per_step=300)
    assert t.input == 10 * 3_000 + 800 * 45
    assert t.output == 3_000
    one = agent_task_tokens(steps=1, base_context=3_000, growth_per_step=800, output_per_step=300)
    assert one.input == 3_000
    doubled = agent_task_tokens(
        steps=20, base_context=0, growth_per_step=100, output_per_step=0
    ).input
    single = agent_task_tokens(
        steps=10, base_context=0, growth_per_step=100, output_per_step=0
    ).input
    assert doubled > 3 * single


def test_sample_size_and_drain_and_storage() -> None:
    assert sample_size(0.05, 0.01) == math.ceil(1.96**2 * 0.05 * 0.95 / 0.01**2) == 1_825
    assert sample_size(0.5, 0.05) == 385
    assert sample_size(0.0, 0.01) == 0
    assert drain_minutes(6_000_000, 2_000_000) == pytest.approx(3.0)
    assert vector_storage_bytes(1_000, 1_024, index_overhead=1.0) == 4_096_000


@pytest.mark.parametrize(
    "call",
    [
        lambda: Traffic(0, 1, 1, 1),
        lambda: Traffic(10, 1, 25, 1),
        lambda: Traffic(10, 1, 10, 0.5),
        lambda: Tokens(-1, 0),
        lambda: Price(-1, 0),
        lambda: littles_law(-1, 1),
        lambda: workers_needed(10, 0),
        lambda: workers_needed(10, 1.5),
        lambda: generation_latency(0.5, 100, 0),
        lambda: request_cost(TOKENS, PRICE, cached_input_fraction=1.2),
        lambda: monthly_cost(10, 1, cache_hit_rate=1.4),
        lambda: monthly_cost(10, 1, days=0),
        lambda: cascade_cost(1, 2, -0.1),
        lambda: sample_size(0.05, 0),
        lambda: vector_storage_bytes(10, 8, index_overhead=0.5),
        lambda: drain_minutes(100, 0),
    ],
)
def test_invalid_inputs_are_rejected(call: object) -> None:
    assert callable(call)
    with pytest.raises(CapacityError):
        call()


def test_negative_control_no_optimization_means_no_saving() -> None:
    """Zero hit rate, zero batch share and zero routing must not change the baseline."""
    base = monthly_cost(10_000, request_cost(TOKENS, PRICE))
    same = monthly_cost(
        10_000,
        routed_cost(0.001, request_cost(TOKENS, PRICE), 0.0),
        cache_hit_rate=0.0,
        batch_share=0.0,
    )
    assert same == pytest.approx(base)
    assert request_cost(TOKENS, PRICE, cached_input_fraction=0.0) == request_cost(TOKENS, PRICE)
