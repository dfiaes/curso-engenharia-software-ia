"""Dynamic programming and greedy: edit distance (top-down and bottom-up) and coin change."""

from collections.abc import Sequence
from functools import cache


def edit_distance(a: str, b: str) -> int:
    """Levenshtein distance, bottom-up, O(len(a) * len(b)) time and O(min) memory.

    ``d[i][j]`` = cost to turn ``a[:i]`` into ``b[:j]``; only the previous row is kept because
    each cell reads the cell above, to the left and diagonally.
    """
    if len(a) < len(b):
        a, b = b, a
    prev = list(range(len(b) + 1))
    for i, ca in enumerate(a, 1):
        cur = [i] + [0] * len(b)
        for j, cb in enumerate(b, 1):
            cur[j] = min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (ca != cb))
        prev = cur
    return prev[-1]


def edit_distance_memo(a: str, b: str) -> int:
    """The same recurrence top-down: simpler to write, recursion depth up to len(a)+len(b)."""

    @cache
    def d(i: int, j: int) -> int:
        if i == 0:
            return j
        if j == 0:
            return i
        if a[i - 1] == b[j - 1]:
            return d(i - 1, j - 1)
        return 1 + min(d(i - 1, j), d(i, j - 1), d(i - 1, j - 1))

    return d(len(a), len(b))


def coin_change_min(coins: Sequence[int], amount: int) -> int | None:
    """Fewest coins that sum to ``amount`` (unlimited supply), or None. Bottom-up over amounts,
    O(amount * len(coins)). Correct for any coin system."""
    _check_coins(coins, amount)
    inf = amount + 1
    best = [0] + [inf] * amount
    for a in range(1, amount + 1):
        for c in coins:
            if c <= a and best[a - c] + 1 < best[a]:
                best[a] = best[a - c] + 1
    return best[amount] if best[amount] != inf else None


def coin_change_greedy(coins: Sequence[int], amount: int) -> int | None:
    """Always take the largest coin that fits. Optimal for canonical systems (like 1/5/10/25),
    wrong or even failing for others: with coins 1, 3, 4 and amount 6 it returns 3 coins
    (4+1+1) while 3+3 needs 2."""
    _check_coins(coins, amount)
    count = 0
    for c in sorted(coins, reverse=True):
        take, amount = divmod(amount, c)
        count += take
    return count if amount == 0 else None


def _check_coins(coins: Sequence[int], amount: int) -> None:
    if amount < 0 or any(c <= 0 for c in coins):
        raise ValueError("amount must be >= 0 and coins must be positive")
