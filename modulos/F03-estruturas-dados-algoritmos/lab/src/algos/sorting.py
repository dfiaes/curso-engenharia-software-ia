"""Comparison sorts written from scratch: a stable merge sort and an in-place quicksort."""

import random
from collections.abc import Callable, Iterable
from typing import Any, Literal

from algos._types import SupportsLessThan


def merge_sort[T](items: Iterable[T], *, key: Callable[[T], Any] | None = None) -> list[T]:
    """Stable O(n log n) sort that returns a new list. Uses only ``<`` on the keys.

    Stability comes from one detail in ``_merge``: on a tie the item from the *left* run wins.
    """
    keyf: Callable[[T], Any] = key if key is not None else (lambda x: x)
    pairs = [(keyf(x), x) for x in items]
    return [x for _, x in _sort_pairs(pairs)]


def _sort_pairs[T](pairs: list[tuple[Any, T]]) -> list[tuple[Any, T]]:
    if len(pairs) <= 1:
        return pairs
    mid = len(pairs) // 2
    return _merge(_sort_pairs(pairs[:mid]), _sort_pairs(pairs[mid:]))


def _merge[T](left: list[tuple[Any, T]], right: list[tuple[Any, T]]) -> list[tuple[Any, T]]:
    out: list[tuple[Any, T]] = []
    i = j = 0
    while i < len(left) and j < len(right):
        if right[j][0] < left[i][0]:  # strict: equal keys keep the left one first
            out.append(right[j])
            j += 1
        else:
            out.append(left[i])
            i += 1
    out.extend(left[i:])
    out.extend(right[j:])
    return out


def quicksort[T: SupportsLessThan](
    a: list[T],
    *,
    pivot: Literal["last", "random"] = "random",
    rng: random.Random | None = None,
) -> None:
    """In-place, not stable. Three-way partition (Dijkstra's Dutch national flag) makes runs of
    equal keys cost O(n). The explicit stack always defers the *larger* side, so it never holds
    more than O(log n) ranges even when the pivot choice is terrible (``pivot="last"`` on
    sorted input is O(n^2) time but still safe on memory)."""
    chooser = rng if rng is not None else random.Random(0)
    stack: list[tuple[int, int]] = [(0, len(a) - 1)]
    while stack:
        lo, hi = stack.pop()
        while lo < hi:
            p = a[hi] if pivot == "last" else a[chooser.randint(lo, hi)]
            lt, i, gt = lo, lo, hi
            while i <= gt:
                if a[i] < p:
                    a[lt], a[i] = a[i], a[lt]
                    lt += 1
                    i += 1
                elif p < a[i]:
                    a[i], a[gt] = a[gt], a[i]
                    gt -= 1
                else:
                    i += 1
            # a[lo:lt] < p, a[lt:gt+1] == p, a[gt+1:hi+1] > p
            if lt - lo < hi - gt:
                stack.append((gt + 1, hi))
                hi = lt - 1
            else:
                stack.append((lo, lt - 1))
                lo = gt + 1
