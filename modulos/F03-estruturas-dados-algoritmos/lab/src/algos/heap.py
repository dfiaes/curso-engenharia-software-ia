"""Binary min-heap stored in a list, with exception-safe push and pop.

Index arithmetic: children of ``i`` are ``2i+1`` and ``2i+2``; the parent is ``(i-1)//2``.
Every operation first *reads* to find where the moving item ends up (the only part that calls
``<``, which may raise) and only then *writes*. A comparison that fails leaves the heap intact.
"""

from collections.abc import Iterable

from algos._types import SupportsLessThan


class BinaryHeap[T: SupportsLessThan]:
    def __init__(self, items: Iterable[T] = ()) -> None:
        self._data: list[T] = list(items)
        self._heapify()

    def __len__(self) -> int:
        return len(self._data)

    def peek(self) -> T:
        if not self._data:
            raise IndexError("peek at an empty heap")
        return self._data[0]

    def snapshot(self) -> list[T]:
        """Copy of the internal array (heap order, not sorted)."""
        return list(self._data)

    def _down_path(self, start: int, end: int, item: T) -> list[int]:
        """Indexes of the children that must move up when ``item`` sinks from ``start``
        inside ``data[:end]``. Reads only."""
        data = self._data
        path: list[int] = []
        i = start
        while True:
            child = 2 * i + 1
            if child >= end:
                break
            if child + 1 < end and data[child + 1] < data[child]:
                child += 1
            if data[child] < item:
                path.append(child)
                i = child
            else:
                break
        return path

    def _heapify(self) -> None:
        data = self._data
        n = len(data)
        for start in range(n // 2 - 1, -1, -1):
            item = data[start]
            hole = start
            for child in self._down_path(start, n, item):
                data[hole] = data[child]
                hole = child
            data[hole] = item

    def push(self, item: T) -> None:
        data = self._data
        pos = len(data)
        while pos > 0:
            parent = (pos - 1) // 2
            if item < data[parent]:
                pos = parent
            else:
                break
        # reads done: nothing was modified, so any exception above left the heap untouched
        data.append(item)
        hole = len(data) - 1
        while hole != pos:
            parent = (hole - 1) // 2
            data[hole] = data[parent]
            hole = parent
        data[pos] = item

    def pop(self) -> T:
        data = self._data
        if not data:
            raise IndexError("pop from an empty heap")
        if len(data) == 1:
            return data.pop()
        last = data[-1]
        path = self._down_path(0, len(data) - 1, last)
        smallest = data[0]
        hole = 0
        for child in path:
            data[hole] = data[child]
            hole = child
        data[hole] = last
        data.pop()
        return smallest


def top_k[T: SupportsLessThan](items: Iterable[T], k: int) -> list[T]:
    """The ``k`` largest items, descending, in O(n log k) time and O(k) memory.

    A min-heap of size k holds the best k seen so far; its root is the entry to beat.
    """
    if k < 0:
        raise ValueError("k must be non-negative")
    if k == 0:
        return []
    heap: BinaryHeap[T] = BinaryHeap()
    for item in items:
        if len(heap) < k:
            heap.push(item)
        elif heap.peek() < item:
            heap.pop()
            heap.push(item)
    result: list[T] = []
    while len(heap):
        result.append(heap.pop())
    result.reverse()
    return result
