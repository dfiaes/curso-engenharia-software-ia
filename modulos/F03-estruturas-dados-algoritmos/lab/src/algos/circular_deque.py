"""Double-ended queue on a circular array (ring buffer).

All four end operations are O(1) amortized: the buffer doubles when full and halves when a
quarter full, so a long run of pushes and pops never pays O(n) per call.
"""

from collections.abc import Iterable, Iterator
from typing import Any

_MIN_CAPACITY = 4


class CircularDeque[T]:
    """Deque backed by a power-of-two array; ``head`` moves, items never shift."""

    __slots__ = ("_buf", "_head", "_size")

    def __init__(self, items: Iterable[T] = ()) -> None:
        self._buf: list[Any] = [None] * _MIN_CAPACITY
        self._head = 0
        self._size = 0
        for item in items:
            self.append(item)

    def __len__(self) -> int:
        return self._size

    def __repr__(self) -> str:
        return f"CircularDeque({list(self)!r})"

    @property
    def capacity(self) -> int:
        return len(self._buf)

    def _slot(self, offset: int) -> int:
        # capacity is a power of two, so "% capacity" is a bit mask
        return (self._head + offset) & (len(self._buf) - 1)

    def _resize(self, capacity: int) -> None:
        new_buf: list[Any] = [None] * capacity
        for i in range(self._size):
            new_buf[i] = self._buf[self._slot(i)]
        self._buf = new_buf
        self._head = 0

    def append(self, item: T) -> None:
        if self._size == len(self._buf):
            self._resize(2 * len(self._buf))
        self._buf[self._slot(self._size)] = item
        self._size += 1

    def appendleft(self, item: T) -> None:
        if self._size == len(self._buf):
            self._resize(2 * len(self._buf))
        self._head = (self._head - 1) & (len(self._buf) - 1)
        self._buf[self._head] = item
        self._size += 1

    def pop(self) -> T:
        if self._size == 0:
            raise IndexError("pop from an empty deque")
        idx = self._slot(self._size - 1)
        item: T = self._buf[idx]
        self._buf[idx] = None  # drop the reference so the object can be collected
        self._size -= 1
        self._shrink_if_sparse()
        return item

    def popleft(self) -> T:
        if self._size == 0:
            raise IndexError("pop from an empty deque")
        item: T = self._buf[self._head]
        self._buf[self._head] = None
        self._head = (self._head + 1) & (len(self._buf) - 1)
        self._size -= 1
        self._shrink_if_sparse()
        return item

    def _shrink_if_sparse(self) -> None:
        cap = len(self._buf)
        if cap > _MIN_CAPACITY and self._size * 4 <= cap:
            self._resize(cap // 2)

    def __getitem__(self, index: int) -> T:
        if index < 0:
            index += self._size
        if not 0 <= index < self._size:
            raise IndexError("deque index out of range")
        item: T = self._buf[self._slot(index)]
        return item

    def __iter__(self) -> Iterator[T]:
        for i in range(self._size):
            item: T = self._buf[self._slot(i)]
            yield item
