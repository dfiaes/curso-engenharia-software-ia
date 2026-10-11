"""Backtracking: build a candidate step by step, undo the step when it leads nowhere."""

from collections.abc import Sequence


def n_queens_count(n: int) -> int:
    """Number of ways to place ``n`` non-attacking queens on an n x n board.

    One queen per row; ``cols``, ``diag`` (row - col) and ``anti`` (row + col) are the sets of
    attacked lines. Choosing a cell adds to the sets, returning from the recursion removes it.
    """
    if n < 0:
        raise ValueError("n must be non-negative")
    cols: set[int] = set()
    diag: set[int] = set()
    anti: set[int] = set()

    def place(row: int) -> int:
        if row == n:
            return 1
        total = 0
        for col in range(n):
            if col in cols or row - col in diag or row + col in anti:
                continue  # pruning: this branch is already invalid
            cols.add(col)
            diag.add(row - col)
            anti.add(row + col)
            total += place(row + 1)
            cols.remove(col)
            diag.remove(row - col)
            anti.remove(row + col)
        return total

    return place(0)


def subsets_with_sum(values: Sequence[int], target: int) -> list[list[int]]:
    """All subsets (as lists, in input order) of non-negative ``values`` that sum to ``target``.
    Prunes when the running sum already exceeds the target."""
    if any(v < 0 for v in values):
        raise ValueError("pruning by sum needs non-negative values")
    found: list[list[int]] = []
    chosen: list[int] = []

    def walk(index: int, remaining: int) -> None:
        if remaining == 0:
            found.append(list(chosen))
            # keep going: zeros later in the input create more subsets
        if index == len(values):
            return
        for i in range(index, len(values)):
            if values[i] > remaining:
                continue
            chosen.append(values[i])
            walk(i + 1, remaining - values[i])
            chosen.pop()

    walk(0, target)
    return found
