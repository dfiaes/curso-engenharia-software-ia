from __future__ import annotations

import pytest

from sdlc_kit.anomaly import DetectionError, baseline_of, evaluate, scan
from sdlc_kit.demo import synthetic_series, to_csv

# 30 points: mean 100, sample std about 5.08. One sigma is roughly 5.08.
BASE = [95.0, 105.0] * 15
QUIET = [99.0, 101.0, 99.0, 101.0, 99.0, 101.0, 99.0]  # seven calm points, alternating sides


def rules_of(tail: list[float]) -> set[str]:
    return {b.rule for b in evaluate(BASE + tail)}


def test_baseline_values() -> None:
    b = baseline_of(BASE)
    assert b.mean == pytest.approx(100.0)
    assert b.std == pytest.approx(5.085, abs=0.01)


def test_we1_fires_beyond_three_sigma_both_directions() -> None:
    assert "WE1" in rules_of([*QUIET, 116.0])
    low = evaluate(BASE + QUIET + [84.0])
    assert [(b.rule, b.direction) for b in low] == [("WE1", "low")]


def test_we1_does_not_fire_below_three_sigma() -> None:
    assert rules_of([*QUIET, 114.0]) == set()  # z about 2.75: neither WE1 nor anything else


def test_we2_two_of_three_beyond_two_sigma_same_side() -> None:
    assert rules_of([*QUIET[:5], 111.0, 100.0, 111.0]) >= {"WE2"}


def test_we2_negative_controls() -> None:
    assert "WE2" not in rules_of([*QUIET[:5], 111.0, 100.0, 109.0])  # second hit is under 2 sigma
    assert "WE2" not in rules_of([*QUIET[:5], 111.0, 100.0, 89.0])  # opposite sides
    assert "WE2" not in rules_of([*QUIET[:5], 111.0, 111.0, 100.0])  # newest point must be a hit


def test_we3_four_of_five_beyond_one_sigma_same_side() -> None:
    assert "WE3" in rules_of([*QUIET[:3], 106.0, 106.0, 100.0, 106.0, 106.0])
    low = evaluate(BASE + QUIET[:3] + [94.0, 94.0, 100.0, 94.0, 94.0])
    assert [b.direction for b in low if b.rule == "WE3"] == ["low"]


def test_we3_negative_controls() -> None:
    assert "WE3" not in rules_of([*QUIET[:3], 106.0, 106.0, 100.0, 100.0, 106.0])  # only 3 of 5
    assert "WE3" not in rules_of(
        [*QUIET[:3], 106.0, 106.0, 106.0, 106.0, 100.0]
    )  # newest not a hit


def test_we4_eight_on_one_side() -> None:
    assert rules_of([101.0] * 8) == {"WE4"}
    assert [b.direction for b in evaluate(BASE + [99.0] * 8)] == ["low"]


def test_we4_negative_control_one_point_on_the_other_side() -> None:
    assert rules_of([101.0] * 7 + [99.0]) == set()
    assert rules_of([99.0] + [101.0] * 7) == set()  # the 8-point window is exactly the last 8


def test_rules_argument_restricts_what_is_reported() -> None:
    got = evaluate(BASE + QUIET + [116.0], rules=("WE4",))
    assert got == []


def test_unknown_rule_short_series_and_short_lookback_are_errors() -> None:
    with pytest.raises(DetectionError, match="unknown rules"):
        evaluate(BASE + QUIET + [100.0], rules=("WE9",))
    with pytest.raises(DetectionError, match="need 38 points"):
        evaluate(BASE)
    with pytest.raises(DetectionError, match="lookback"):
        evaluate(BASE + QUIET + [100.0], lookback=5)


def test_flat_baseline_is_an_error_unless_a_floor_is_given() -> None:
    flat = [100.0] * 38
    with pytest.raises(DetectionError, match="flat baseline"):
        evaluate(flat)
    got = evaluate([100.0] * 37 + [110.0], min_std=2.0)
    assert [b.rule for b in got] == ["WE1"]


def test_baseline_needs_two_points() -> None:
    with pytest.raises(DetectionError):
        baseline_of([1.0])


def test_scan_refuses_a_series_that_is_too_short() -> None:
    with pytest.raises(DetectionError, match="need 38 points"):
        scan([1.0] * 10)


def test_scan_quiet_series_has_no_breach() -> None:
    assert scan(synthetic_series("flat"), min_std=0.5) == []


def test_scan_spike_is_we1_at_the_last_point() -> None:
    series = synthetic_series("spike")
    got = scan(series, min_std=0.5)
    assert [(b.rule, b.index) for b in got][:1] == [("WE1", len(series) - 1)]


def test_scan_slow_drift_is_caught_before_three_sigma() -> None:
    got = {b.rule: b.index for b in scan(synthetic_series("drift"), min_std=0.5)}
    assert got["WE4"] < got["WE1"]


def test_scan_step_trips_the_two_sigma_rule_first() -> None:
    got = scan(synthetic_series("step"), min_std=0.5)
    assert got[0].rule == "WE2"


def test_synthetic_series_is_reproducible_and_validates_kind() -> None:
    assert synthetic_series("step", seed=3) == synthetic_series("step", seed=3)
    assert synthetic_series("step", seed=3) != synthetic_series("step", seed=4)
    with pytest.raises(ValueError, match="unknown kind"):
        synthetic_series("wave")
    assert to_csv([1.0, 2.5]).splitlines() == ["t,value", "0,1.00", "1,2.50"]
