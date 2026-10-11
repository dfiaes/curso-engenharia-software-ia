"""Micro-benchmarks for module F03: ``uv run python -m algos.bench [--quick]``.

Method: ``timeit.Timer`` runs the statement many times per sample (the loop grows until a
sample lasts 20 ms), takes 5 samples and keeps the *minimum*: the minimum is the run least
disturbed by the rest of the machine, so it estimates the cost of the code itself. ``timeit``
also switches the garbage collector off while timing. Absolute numbers depend on the machine;
the *growth* from one row to the next is what the tables are for.
"""

import argparse
import bisect
import platform
import random
import sys
import timeit
from collections import deque
from collections.abc import Callable
from typing import Any

from algos.circular_deque import CircularDeque
from algos.searching import lower_bound
from algos.sorting import merge_sort, quicksort

type Table = tuple[str, list[str], list[list[str]]]

_SAMPLES = 5


def per_call(stmt: str, setup: str, ns: dict[str, Any]) -> float:
    """Seconds per execution of ``stmt`` (best of several samples)."""
    timer = timeit.Timer(stmt, setup, globals=ns)
    number = 1
    while timer.timeit(number) < 0.02:  # grow the loop until one sample lasts 20 ms or more
        number *= 4
    return min(timer.repeat(repeat=_SAMPLES, number=number)) / number


def once(stmt: str, setup: str, ns: dict[str, Any]) -> float:
    """Seconds for a single execution, setup excluded, best of several fresh runs."""
    return min(timeit.Timer(stmt, setup, globals=ns).repeat(repeat=_SAMPLES, number=1))


def _ms(seconds: float) -> str:
    return f"{seconds * 1e3:,.2f}"


def _us(seconds: float) -> str:
    return f"{seconds * 1e6:,.2f}"


def list_growth_points(limit: int = 100) -> list[tuple[int, int]]:
    """(length, bytes) each time ``list.append`` makes CPython reallocate the list."""
    points: list[tuple[int, int]] = []
    items: list[int] = []
    last = sys.getsizeof(items)
    points.append((0, last))
    for n in range(1, limit + 1):
        items.append(n)
        size = sys.getsizeof(items)
        if size != last:
            points.append((n, size))
            last = size
    return points


def drain_table(sizes: list[int]) -> Table:
    rows: list[list[str]] = []
    for n in sizes:
        ns: dict[str, Any] = {"n": n, "deque": deque, "CircularDeque": CircularDeque}
        t_list = once("while d: d.pop(0)", "d = list(range(n))", ns)
        t_deque = once("while d: d.popleft()", "d = deque(range(n))", ns)
        t_ring = once("while d: d.popleft()", "d = CircularDeque(range(n))", ns)
        rows.append([f"{n:,}", _ms(t_list), _ms(t_deque), _ms(t_ring), f"{t_list / t_deque:,.0f}x"])
    return (
        "Drain a container from the front (total ms)",
        ["n", "list.pop(0)", "deque.popleft", "CircularDeque.popleft", "list / deque"],
        rows,
    )


def lookup_table(sizes: list[int]) -> Table:
    rows: list[list[str]] = []
    for n in sizes:
        ns: dict[str, Any] = {
            "n": n,
            "bisect_left": bisect.bisect_left,
            "lower_bound": lower_bound,
        }
        setup = "a = list(range(n)); s = set(a); x = n - 2"
        t_list = per_call("x in a", setup, ns)
        t_own = per_call("lower_bound(a, x)", setup, ns)
        t_bis = per_call("bisect_left(a, x)", setup, ns)
        t_set = per_call("x in s", setup, ns)
        rows.append([f"{n:,}", _us(t_list), _us(t_own), _us(t_bis), _us(t_set)])
    return (
        "Find a key near the end (microseconds per lookup)",
        ["n", "x in list", "lower_bound (py)", "bisect_left (C)", "x in set"],
        rows,
    )


class _SameHash:
    __slots__ = ("value",)

    def __init__(self, value: int) -> None:
        self.value = value

    def __hash__(self) -> int:
        return 7

    def __eq__(self, other: object) -> bool:
        return isinstance(other, _SameHash) and self.value == other.value


def collision_table(sizes: list[int]) -> Table:
    rows: list[list[str]] = []
    for n in sizes:
        ns: dict[str, Any] = {"n": n, "SameHash": _SameHash}
        t_good = once("d = {i: i for i in keys}", "keys = list(range(n))", ns)
        t_bad = once("d = {k: 1 for k in keys}", "keys = [SameHash(i) for i in range(n)]", ns)
        rows.append([f"{n:,}", _ms(t_good), _ms(t_bad), f"{t_bad / t_good:,.0f}x"])
    return (
        "Build a dict with n keys (total ms): distinct hashes vs one hash for all",
        ["n", "distinct hashes", "same hash", "slowdown"],
        rows,
    )


def sort_table(sizes: list[int]) -> Table:
    rows: list[list[str]] = []
    for n in sizes:
        rng = random.Random(42)
        data = [rng.randrange(n * 10) for _ in range(n)]
        ns: dict[str, Any] = {
            "data": data,
            "merge_sort": merge_sort,
            "quicksort": quicksort,
        }
        t_builtin = once("sorted(data)", "", ns)
        t_merge = once("merge_sort(data)", "", ns)
        t_quick = once("quicksort(c)", "c = list(data)", ns)
        rows.append([f"{n:,}", _ms(t_builtin), _ms(t_merge), _ms(t_quick)])
    return (
        "Sort n random ints (total ms)",
        ["n", "sorted() (Timsort, C)", "merge_sort (py)", "quicksort random pivot (py)"],
        rows,
    )


def pivot_table(sizes: list[int]) -> Table:
    rows: list[list[str]] = []
    for n in sizes:
        ns: dict[str, Any] = {"n": n, "quicksort": quicksort}
        t_rand = once("quicksort(c, pivot='random')", "c = list(range(n))", ns)
        t_last = once("quicksort(c, pivot='last')", "c = list(range(n))", ns)
        t_builtin = once("sorted(c)", "c = list(range(n))", ns)
        rows.append([f"{n:,}", _ms(t_rand), _ms(t_last), _ms(t_builtin)])
    return (
        "Sort already-sorted input (total ms)",
        ["n", "quicksort random pivot", "quicksort last pivot", "sorted() (Timsort)"],
        rows,
    )


def locality_table(sizes: list[int]) -> Table:
    rows: list[list[str]] = []
    for n in sizes:
        rng = random.Random(1)
        order = list(range(n))
        shuffled = order[:]
        rng.shuffle(shuffled)
        ns: dict[str, Any] = {"a": list(range(n)), "seq": order, "rnd": shuffled}
        stmt = "t = 0\nfor i in IDX:\n    t += a[i]"
        t_seq = once(stmt.replace("IDX", "seq"), "", ns)
        t_rnd = once(stmt.replace("IDX", "rnd"), "", ns)
        rows.append([f"{n:,}", _ms(t_seq), _ms(t_rnd), f"{t_rnd / t_seq:.2f}x"])
    return (
        "Read every element once through an index list (total ms)",
        ["n", "sequential order", "shuffled order", "shuffled / sequential"],
        rows,
    )


def render(table: Table) -> str:
    title, header, rows = table
    widths = [max(len(header[c]), *(len(r[c]) for r in rows)) for c in range(len(header))]

    def line(cells: list[str]) -> str:
        return "  ".join(cell.rjust(widths[c]) for c, cell in enumerate(cells))

    out = [title, line(header), line(["-" * w for w in widths])]
    out.extend(line(r) for r in rows)
    return "\n".join(out)


def run_all(quick: bool = False) -> list[Table]:
    if quick:
        plans: list[Callable[[], Table]] = [
            lambda: drain_table([1_000, 2_000]),
            lambda: lookup_table([100, 1_000]),
            lambda: collision_table([100, 200]),
            lambda: sort_table([1_000, 2_000]),
            lambda: pivot_table([200, 400]),
            lambda: locality_table([10_000, 20_000]),
        ]
    else:
        plans = [
            lambda: drain_table([10_000, 20_000, 40_000, 80_000]),
            lambda: lookup_table([1_000, 10_000, 100_000, 1_000_000]),
            lambda: collision_table([500, 1_000, 2_000, 4_000]),
            lambda: sort_table([10_000, 20_000, 40_000]),
            lambda: pivot_table([1_000, 2_000, 4_000]),
            lambda: locality_table([250_000, 1_000_000, 4_000_000]),
        ]
    return [plan() for plan in plans]


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="F03 micro-benchmarks")
    parser.add_argument("--quick", action="store_true", help="tiny sizes, for smoke tests")
    parser.add_argument("--growth", action="store_true", help="print list over-allocation points")
    args = parser.parse_args(argv)
    if args.growth:
        print("len  bytes (sys.getsizeof) at each reallocation of a list built by append")
        for n, size in list_growth_points():
            print(f"{n:>3}  {size}")
        return 0
    print(f"python {platform.python_version()} on {platform.machine()} ({platform.system()})")
    for table in run_all(args.quick):
        print()
        print(render(table))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
