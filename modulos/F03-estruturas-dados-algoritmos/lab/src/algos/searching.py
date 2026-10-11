"""Binary search with explicit invariants, plus the two-pointer and sliding-window patterns."""

from collections.abc import Callable, Sequence

from algos._types import SupportsLessThan


def lower_bound[T: SupportsLessThan](a: Sequence[T], x: T) -> int:
    """Smallest ``i`` such that ``not a[i] < x`` (``len(a)`` if none): the insertion point to
    the left of equal keys. Invariant: ``a[:lo] < x`` and ``a[hi:] >= x`` on every iteration."""
    lo, hi = 0, len(a)
    while lo < hi:
        mid = (lo + hi) // 2  # Python ints do not overflow; in C use lo + (hi - lo) // 2
        if a[mid] < x:
            lo = mid + 1
        else:
            hi = mid
    return lo


def upper_bound[T: SupportsLessThan](a: Sequence[T], x: T) -> int:
    """Smallest ``i`` such that ``x < a[i]``: the insertion point to the right of equal keys.
    Invariant: ``a[:lo] <= x`` and ``a[hi:] > x``."""
    lo, hi = 0, len(a)
    while lo < hi:
        mid = (lo + hi) // 2
        if x < a[mid]:
            hi = mid
        else:
            lo = mid + 1
    return lo


def binary_search[T: SupportsLessThan](a: Sequence[T], x: T) -> int | None:
    i = lower_bound(a, x)
    if i < len(a) and not x < a[i]:
        return i
    return None


def first_true(lo: int, hi: int, predicate: Callable[[int], bool]) -> int:
    """Smallest ``i`` in ``[lo, hi)`` with ``predicate(i)`` true, assuming the predicate is
    monotone (false...false true...true). Returns ``hi`` when it is never true. This is binary
    search on the *answer*: no array is needed, only a yes/no question."""
    while lo < hi:
        mid = (lo + hi) // 2
        if predicate(mid):
            hi = mid
        else:
            lo = mid + 1
    return lo


def two_sum_sorted(a: Sequence[int], target: int) -> tuple[int, int] | None:
    """Indexes ``i < j`` with ``a[i] + a[j] == target`` in a sorted sequence, O(n) time and
    O(1) space. Each step discards one element that cannot be part of any answer."""
    i, j = 0, len(a) - 1
    while i < j:
        total = a[i] + a[j]
        if total == target:
            return i, j
        if total < target:
            i += 1  # a[i] is too small even with the largest remaining partner
        else:
            j -= 1  # a[j] is too large even with the smallest remaining partner
    return None


def two_sum_hash(a: Sequence[int], target: int) -> tuple[int, int] | None:
    """Same question on unsorted input: O(n) time, O(n) space, one pass over a dict."""
    seen: dict[int, int] = {}
    for j, value in enumerate(a):
        i = seen.get(target - value)
        if i is not None:
            return i, j
        seen.setdefault(value, j)
    return None


def max_window_sum(a: Sequence[int], k: int) -> int:
    """Largest sum of ``k`` consecutive items, O(n): slide by adding one, removing one."""
    if k <= 0 or k > len(a):
        raise ValueError("k must satisfy 1 <= k <= len(a)")
    window = sum(a[:k])
    best = window
    for i in range(k, len(a)):
        window += a[i] - a[i - k]
        best = max(best, window)
    return best


def longest_unique_substring(text: str) -> int:
    """Length of the longest substring without repeated characters, O(n) with a dict of the
    last index of each character (variable-size sliding window)."""
    last: dict[str, int] = {}
    start = 0
    best = 0
    for i, ch in enumerate(text):
        if ch in last and last[ch] >= start:
            start = last[ch] + 1
        last[ch] = i
        best = max(best, i - start + 1)
    return best
