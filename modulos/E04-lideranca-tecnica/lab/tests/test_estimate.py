from __future__ import annotations

from pathlib import Path

import pytest

from leadkit.errors import InputError
from leadkit.estimate import (
    Distribution,
    Risk,
    Task,
    forecast,
    read_risks,
    read_tasks,
    simulate,
)

SKEWED = [Task("a", 2, 3, 12), Task("b", 3, 5, 15), Task("c", 1, 2, 9)]
DATA = Path(__file__).resolve().parent.parent / "data"


def test_percentiles_are_ordered_and_inside_the_range() -> None:
    result = forecast(SKEWED, runs=5_000, seed=1)
    assert result.minimum <= result.p50 <= result.p85 <= result.p95 <= result.maximum
    assert sum(t.low for t in SKEWED) <= result.minimum
    assert result.maximum <= sum(t.high for t in SKEWED)


def test_same_seed_is_reproducible_and_other_seed_differs() -> None:
    first = simulate(SKEWED, runs=500, seed=7)
    assert first == simulate(SKEWED, runs=500, seed=7)
    assert first != simulate(SKEWED, runs=500, seed=8)


@pytest.mark.parametrize("dist", list(Distribution))
def test_mean_matches_the_closed_form(dist: Distribution) -> None:
    task = Task("x", 2, 4, 12)
    expected = (2 + 4 + 12) / 3 if dist is Distribution.TRIANGULAR else (2 + 4 * 4 + 12) / 6
    result = forecast([task], runs=40_000, seed=3, dist=dist)
    assert result.mean == pytest.approx(expected, rel=0.02)


def test_degenerate_task_has_no_uncertainty() -> None:
    result = forecast([Task("fixed", 5, 5, 5)], runs=50)
    assert result.p50 == result.p85 == result.p95 == 5


def test_single_run_is_allowed() -> None:
    result = forecast([Task("a", 1, 2, 3)], runs=1)
    assert result.p50 == result.p95 == result.minimum


def test_risk_with_probability_one_always_adds_its_impact() -> None:
    base = forecast([Task("fixed", 4, 4, 4)], runs=20)
    with_risk = forecast([Task("fixed", 4, 4, 4)], [Risk("r", 1.0, 3)], runs=20)
    assert with_risk.p50 == base.p50 + 3


def test_risk_with_probability_zero_never_fires() -> None:
    totals = simulate(SKEWED, [Risk("r", 0.0, 99)], runs=2_000, seed=2)
    assert totals[-1] <= sum(t.high for t in SKEWED)


def test_negative_control_point_estimate_underestimates_a_skewed_project() -> None:
    # Sum of "likely" is a single number that ignores the long right tail.
    result = forecast(SKEWED, runs=10_000, seed=42)
    assert result.naive_sum < result.p50 < result.p85


@pytest.mark.parametrize(
    ("low", "likely", "high"),
    [(5, 3, 8), (1, 9, 8), (-1, 2, 3), (1, float("nan"), 3), (1, 2, float("inf"))],
)
def test_invalid_range_is_rejected(low: float, likely: float, high: float) -> None:
    with pytest.raises(InputError):
        Task("bad", low, likely, high)


def test_invalid_risk_and_empty_inputs_are_rejected() -> None:
    with pytest.raises(InputError):
        Risk("r", 1.5, 1)
    with pytest.raises(InputError):
        simulate([])
    with pytest.raises(InputError):
        simulate(SKEWED, runs=0)


def test_read_tasks_reports_file_and_line(tmp_path: Path) -> None:
    bad = tmp_path / "t.csv"
    bad.write_text("name,low,likely,high\nok,1,2,3\nbroken,1,dois,3\n", encoding="utf-8")
    with pytest.raises(InputError, match=r"t\.csv:3"):
        read_tasks(bad)


def test_read_tasks_rejects_missing_column_and_empty_file(tmp_path: Path) -> None:
    no_col = tmp_path / "a.csv"
    no_col.write_text("name,low,likely\nx,1,2\n", encoding="utf-8")
    with pytest.raises(InputError, match="high"):
        read_tasks(no_col)
    empty = tmp_path / "b.csv"
    empty.write_text("name,low,likely,high\n", encoding="utf-8")
    with pytest.raises(InputError, match="sem linhas"):
        read_tasks(empty)
    with pytest.raises(InputError):
        read_tasks(tmp_path / "missing.csv")


def test_shipped_sample_project_loads() -> None:
    tasks = read_tasks(DATA / "projeto-conciliacao.csv")
    risks = read_risks(DATA / "projeto-conciliacao-riscos.csv")
    assert len(tasks) == 8
    assert len(risks) == 2
