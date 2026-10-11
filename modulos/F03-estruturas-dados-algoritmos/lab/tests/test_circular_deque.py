import random
from collections import deque

import pytest

from algos.circular_deque import CircularDeque


def test_fifo_and_lifo_order() -> None:
    d = CircularDeque([1, 2, 3])
    d.appendleft(0)
    assert list(d) == [0, 1, 2, 3]
    assert d.popleft() == 0
    assert d.pop() == 3
    assert list(d) == [1, 2]


def test_wraps_around_without_moving_items() -> None:
    d: CircularDeque[int] = CircularDeque()
    for i in range(4):
        d.append(i)
    d.popleft()
    d.popleft()
    d.append(4)
    d.append(5)  # now the logical end sits before the physical start
    assert d.capacity == 4
    assert list(d) == [2, 3, 4, 5]
    assert d[0] == 2 and d[-1] == 5


def test_grows_by_doubling_and_shrinks_when_sparse() -> None:
    d: CircularDeque[int] = CircularDeque(range(100))
    assert d.capacity == 128
    for _ in range(95):
        d.popleft()
    assert len(d) == 5
    assert d.capacity < 128
    assert list(d) == [95, 96, 97, 98, 99]


def test_empty_pops_and_bad_index_raise_index_error() -> None:
    d: CircularDeque[int] = CircularDeque()
    with pytest.raises(IndexError):
        d.pop()
    with pytest.raises(IndexError):
        d.popleft()
    d.append(1)
    with pytest.raises(IndexError):
        d[1]
    with pytest.raises(IndexError):
        d[-2]


def test_stores_none_as_a_real_value() -> None:
    d: CircularDeque[int | None] = CircularDeque([None, 1, None])
    assert list(d) == [None, 1, None]
    assert d.popleft() is None
    assert len(d) == 2


def test_random_operations_match_collections_deque() -> None:
    rng = random.Random(7)
    mine: CircularDeque[int] = CircularDeque()
    ref: deque[int] = deque()
    for step in range(5_000):
        op = rng.choice(["append", "appendleft", "pop", "popleft"])
        if op in {"pop", "popleft"} and not ref:
            continue
        if op == "append":
            mine.append(step)
            ref.append(step)
        elif op == "appendleft":
            mine.appendleft(step)
            ref.appendleft(step)
        else:
            assert getattr(mine, op)() == getattr(ref, op)()
        assert len(mine) == len(ref)
    assert list(mine) == list(ref)
