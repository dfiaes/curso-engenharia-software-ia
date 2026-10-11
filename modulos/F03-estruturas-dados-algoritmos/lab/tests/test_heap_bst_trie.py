import heapq
import random

import pytest

from algos.bst import BST
from algos.heap import BinaryHeap, top_k
from algos.trie import Trie


class Flaky:
    """Fault injection: raises when compared after ``armed`` is set."""

    armed = False

    def __init__(self, n: int) -> None:
        self.n = n

    def __lt__(self, other: Flaky) -> bool:
        if Flaky.armed:
            raise RuntimeError("comparison failed")
        return self.n < other.n


def test_heap_pops_in_ascending_order() -> None:
    h = BinaryHeap([5, 1, 4, 2, 3])
    assert [h.pop() for _ in range(len(h))] == [1, 2, 3, 4, 5]


def test_heap_empty_and_single() -> None:
    h: BinaryHeap[int] = BinaryHeap()
    with pytest.raises(IndexError):
        h.pop()
    with pytest.raises(IndexError):
        h.peek()
    h.push(9)
    assert h.peek() == 9 and h.pop() == 9 and len(h) == 0


def test_heap_matches_heapq_on_random_workload() -> None:
    rng = random.Random(11)
    mine: BinaryHeap[int] = BinaryHeap()
    ref: list[int] = []
    for _ in range(5_000):
        if ref and rng.random() < 0.4:
            assert mine.pop() == heapq.heappop(ref)
        else:
            x = rng.randrange(1_000)
            mine.push(x)
            heapq.heappush(ref, x)
        assert len(mine) == len(ref)
    assert sorted(mine.snapshot()) == sorted(ref)


def test_heapify_builds_valid_heap() -> None:
    rng = random.Random(5)
    data = [rng.randrange(100) for _ in range(500)]
    h = BinaryHeap(data)
    assert [h.pop() for _ in range(len(h))] == sorted(data)


def test_failed_comparison_leaves_heap_unchanged() -> None:
    Flaky.armed = False
    h = BinaryHeap([Flaky(n) for n in (5, 3, 8, 1, 9, 2)])
    before = [x.n for x in h.snapshot()]
    Flaky.armed = True
    try:
        with pytest.raises(RuntimeError):
            h.push(Flaky(0))
        with pytest.raises(RuntimeError):
            h.pop()
    finally:
        Flaky.armed = False
    assert [x.n for x in h.snapshot()] == before
    assert h.pop().n == 1


def test_incomparable_item_is_rejected_without_growing_the_heap() -> None:
    h: BinaryHeap[int] = BinaryHeap([3, 1, 2])
    with pytest.raises(TypeError):
        h.push("x")  # type: ignore[arg-type]
    assert len(h) == 3


def test_top_k_matches_heapq_nlargest() -> None:
    rng = random.Random(2)
    data = [rng.randrange(10_000) for _ in range(2_000)]
    assert top_k(data, 10) == heapq.nlargest(10, data)
    assert top_k(data, 0) == []
    assert top_k([3, 1], 5) == [3, 1]
    with pytest.raises(ValueError):
        top_k(data, -1)


def test_bst_basic_and_inorder_is_sorted() -> None:
    t: BST[int] = BST()
    for x in (5, 2, 8, 1, 9, 3):
        assert t.add(x)
    assert not t.add(5)
    assert list(t) == [1, 2, 3, 5, 8, 9]
    assert 8 in t and 7 not in t
    assert len(t) == 6


def test_bst_remove_all_three_cases_matches_set() -> None:
    rng = random.Random(9)
    t: BST[int] = BST()
    ref: set[int] = set()
    for _ in range(3_000):
        x = rng.randrange(300)
        if rng.random() < 0.55:
            assert t.add(x) == (x not in ref)
            ref.add(x)
        else:
            assert t.remove(x) == (x in ref)
            ref.discard(x)
        assert len(t) == len(ref)
    assert list(t) == sorted(ref)


def test_bst_height_depends_on_insertion_order() -> None:
    """Control: sorted insertion degenerates into a list; the iterative code still works."""
    ordered: BST[int] = BST()
    for x in range(3_000):
        ordered.add(x)
    assert ordered.height() == 3_000
    assert 2_999 in ordered and list(ordered)[-1] == 2_999

    shuffled: BST[int] = BST()
    values = list(range(3_000))
    random.Random(1).shuffle(values)
    for x in values:
        shuffled.add(x)
    assert shuffled.height() < 60


def test_trie_prefix_search_is_alphabetical() -> None:
    t = Trie()
    for w in ("car", "card", "care", "cat", "dog", ""):
        assert t.add(w)
    assert not t.add("car")
    assert len(t) == 6
    assert t.with_prefix("car") == ["car", "card", "care"]
    assert t.with_prefix("x") == []
    assert "ca" not in t and "cat" in t and "" in t
