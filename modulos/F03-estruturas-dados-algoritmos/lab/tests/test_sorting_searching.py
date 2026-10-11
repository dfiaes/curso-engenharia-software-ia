import bisect
import random

import pytest

from algos.searching import (
    binary_search,
    first_true,
    longest_unique_substring,
    lower_bound,
    max_window_sum,
    two_sum_hash,
    two_sum_sorted,
    upper_bound,
)
from algos.sorting import merge_sort, quicksort


def test_sorts_match_sorted_on_random_inputs() -> None:
    rng = random.Random(0)
    for n in (0, 1, 2, 3, 10, 257):
        data = [rng.randrange(20) for _ in range(n)]
        expected = sorted(data)
        assert merge_sort(data) == expected
        for pivot in ("random", "last"):
            copy = list(data)
            quicksort(copy, pivot=pivot)
            assert copy == expected


def test_merge_sort_is_stable() -> None:
    records = [("b", 1), ("a", 1), ("c", 0), ("d", 1), ("e", 0)]
    assert merge_sort(records, key=lambda r: r[1]) == sorted(records, key=lambda r: r[1])
    assert [r[0] for r in merge_sort(records, key=lambda r: r[1])] == ["c", "e", "b", "a", "d"]


def test_quicksort_handles_all_equal_and_sorted_without_deep_stack() -> None:
    same = [4] * 5_000
    quicksort(same)
    assert same == [4] * 5_000
    ordered = list(range(3_000))
    quicksort(ordered, pivot="last")  # O(n^2) time, but no RecursionError
    assert ordered == list(range(3_000))


def test_lower_and_upper_bound_match_bisect() -> None:
    rng = random.Random(4)
    a = sorted(rng.randrange(50) for _ in range(200))
    for x in range(-2, 53):
        assert lower_bound(a, x) == bisect.bisect_left(a, x)
        assert upper_bound(a, x) == bisect.bisect_right(a, x)


def test_binary_search_edges() -> None:
    assert binary_search([], 1) is None
    assert binary_search([1], 1) == 0
    assert binary_search([1, 3, 5], 4) is None
    assert binary_search([1, 3, 3, 3, 5], 3) == 1


def test_first_true_finds_integer_square_root_ceiling() -> None:
    assert first_true(0, 1_000, lambda i: i * i >= 500) == 23
    assert first_true(0, 10, lambda _: False) == 10  # never true: returns hi


def test_two_sum_variants_agree() -> None:
    rng = random.Random(8)
    for _ in range(200):
        a = sorted(rng.randrange(-20, 20) for _ in range(rng.randrange(0, 12)))
        target = rng.randrange(-30, 30)
        brute = any(a[i] + a[j] == target for i in range(len(a)) for j in range(i + 1, len(a)))
        s = two_sum_sorted(a, target)
        h = two_sum_hash(a, target)
        assert (s is not None) == brute and (h is not None) == brute
        if s is not None:
            assert a[s[0]] + a[s[1]] == target and s[0] < s[1]
        if h is not None:
            assert a[h[0]] + a[h[1]] == target and h[0] < h[1]


def test_two_sum_hash_uses_two_distinct_positions() -> None:
    assert two_sum_hash([3], 6) is None  # one 3 is not two 3s
    assert two_sum_hash([3, 3], 6) == (0, 1)


def test_sliding_window_helpers() -> None:
    assert max_window_sum([1, 4, 2, 10, 2, 3, 1, 0, 20], 4) == 24
    with pytest.raises(ValueError):
        max_window_sum([1, 2], 3)
    assert longest_unique_substring("abcabcbb") == 3
    assert longest_unique_substring("") == 0
    assert longest_unique_substring("abba") == 2  # stale index must not move the window back
