import random
import sys

import pytest

from algos.backtracking import n_queens_count, subsets_with_sum
from algos.bench import list_growth_points, main, run_all
from algos.dp import coin_change_greedy, coin_change_min, edit_distance, edit_distance_memo
from algos.recursion import fast_power, reachable_depth, sum_to_iterative, sum_to_recursive


def test_edit_distance_known_values() -> None:
    assert edit_distance("kitten", "sitting") == 3
    assert edit_distance("", "abc") == 3
    assert edit_distance("abc", "") == 3
    assert edit_distance("", "") == 0
    assert edit_distance("same", "same") == 0


def test_edit_distance_variants_agree_and_are_symmetric() -> None:
    rng = random.Random(21)
    for _ in range(200):
        a = "".join(rng.choice("abc") for _ in range(rng.randrange(0, 9)))
        b = "".join(rng.choice("abc") for _ in range(rng.randrange(0, 9)))
        d = edit_distance(a, b)
        assert d == edit_distance_memo(a, b) == edit_distance(b, a)
        assert abs(len(a) - len(b)) <= d <= max(len(a), len(b))


def test_control_top_down_hits_the_recursion_limit_bottom_up_does_not() -> None:
    a, b = "a" * 1_200, "b" * 1_200
    with pytest.raises(RecursionError):
        edit_distance_memo(a, b)
    assert edit_distance(a, b) == 1_200


def test_coin_change_dp_is_optimal_and_handles_impossible() -> None:
    assert coin_change_min([1, 3, 4], 6) == 2
    assert coin_change_min([2], 3) is None
    assert coin_change_min([5, 7], 0) == 0
    with pytest.raises(ValueError):
        coin_change_min([0, 1], 3)


def test_control_greedy_is_wrong_for_non_canonical_coins() -> None:
    assert coin_change_greedy([1, 5, 10, 25], 63) == coin_change_min([1, 5, 10, 25], 63) == 6
    assert coin_change_greedy([1, 3, 4], 6) == 3  # 4+1+1
    assert coin_change_min([1, 3, 4], 6) == 2  # 3+3
    assert coin_change_greedy([4, 3], 6) is None  # greedy gets stuck, 3+3 exists
    assert coin_change_min([4, 3], 6) == 2


def test_n_queens_known_counts() -> None:
    assert [n_queens_count(n) for n in range(0, 9)] == [1, 1, 0, 0, 2, 10, 4, 40, 92]
    with pytest.raises(ValueError):
        n_queens_count(-1)


def test_subsets_with_sum() -> None:
    assert subsets_with_sum([2, 3, 5, 7], 10) == [[2, 3, 5], [3, 7]]
    assert subsets_with_sum([1, 2], 0) == [[]]
    assert subsets_with_sum([], 5) == []
    with pytest.raises(ValueError):
        subsets_with_sum([1, -1], 0)


def test_recursion_sum_and_depth() -> None:
    assert sum_to_recursive(100) == sum_to_iterative(100) == 5_050
    with pytest.raises(RecursionError):
        sum_to_recursive(sys.getrecursionlimit() + 10)
    assert sum_to_iterative(1_000_000) == 500_000_500_000
    assert 0 < reachable_depth() <= sys.getrecursionlimit()


def test_fast_power_matches_builtin() -> None:
    rng = random.Random(1)
    for _ in range(200):
        b, e, m = rng.randrange(-9, 50), rng.randrange(0, 60), rng.randrange(1, 1_000)
        assert fast_power(b, e) == b**e
        assert fast_power(b, e, m) == pow(b, e, m)
    with pytest.raises(ValueError):
        fast_power(2, -1)


def test_bench_quick_runs_and_deque_beats_list_front_pop() -> None:
    tables = run_all(quick=True)
    assert len(tables) == 6
    assert all(rows and all(len(r) == len(header) for r in rows) for _, header, rows in tables)
    # control with a huge margin (the real ratio is in the hundreds): list.pop(0) is O(n)
    from algos.bench import drain_table

    _, _, rows = drain_table([30_000])
    assert float(rows[0][4].rstrip("x").replace(",", "")) > 3


def test_bench_cli_and_list_growth(capsys: pytest.CaptureFixture[str]) -> None:
    points = list_growth_points(40)
    assert points[0] == (0, sys.getsizeof([])) and len(points) > 3
    assert points == sorted(points)
    assert main(["--growth"]) == 0
    assert "reallocation" in capsys.readouterr().out
