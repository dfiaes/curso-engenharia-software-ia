"""Small deterministic demos used by the guided lab: ``uv run python -m algos.demo <topic>``."""

import argparse
import random
import sys

from algos.backtracking import n_queens_count
from algos.bst import BST
from algos.circular_deque import CircularDeque
from algos.dp import coin_change_greedy, coin_change_min, edit_distance
from algos.graphs import CycleError, Graph, dijkstra, path_from, topological_order
from algos.hash_table import OpenAddressingTable
from algos.heap import BinaryHeap, top_k
from algos.recursion import fast_power, reachable_depth, sum_to_recursive


class SameHash:
    def __init__(self, value: int) -> None:
        self.value = value

    def __hash__(self) -> int:
        return 7

    def __eq__(self, other: object) -> bool:
        return isinstance(other, SameHash) and self.value == other.value


def demo_deque() -> None:
    d: CircularDeque[int] = CircularDeque()
    for i in range(1, 6):
        d.append(i)
        print(f"append {i}: len={len(d)} capacity={d.capacity}")
    for _ in range(3):
        print(f"popleft -> {d.popleft()}: len={len(d)} capacity={d.capacity}")
    d.appendleft(0)
    print("after appendleft(0):", list(d))


def demo_table() -> None:
    t: OpenAddressingTable[int, int] = OpenAddressingTable()
    print(f"start: capacity={t.capacity}")
    for i in range(1, 25):
        before = t.capacity
        t[i] = i
        if t.capacity != before:
            print(f"insert #{i}: capacity {before} -> {t.capacity} (rebuild)")
    print(f"24 keys: capacity={t.capacity} load={t.load_factor:.3f}")
    for i in range(1, 11):
        del t[i]
    print(f"deleted 10: live={len(t)} tombstones={t.tombstones}")
    t[100] = 100
    print(f"after one insert: live={len(t)} tombstones={t.tombstones}")
    good: OpenAddressingTable[int, int] = OpenAddressingTable()
    bad: OpenAddressingTable[SameHash, int] = OpenAddressingTable()
    keys = [SameHash(i) for i in range(300)]
    for i, k in enumerate(keys):
        good[i] = i
        bad[k] = i
    print("300 distinct hashes: worst lookup inspects", max(good.probes(i) for i in range(300)))
    print("300 equal hashes:    last key inspects   ", bad.probes(keys[-1]))


def demo_heap() -> None:
    h: BinaryHeap[int] = BinaryHeap()
    for x in (5, 3, 8, 1, 9, 2):
        h.push(x)
        print(f"push {x}: {h.snapshot()}")
    print("pops:", [h.pop() for _ in range(len(h))])
    data = [31, 4, 15, 92, 6, 53, 58, 97, 93, 23]
    print("top_k(data, 3):", top_k(data, 3))
    ordered: BST[int] = BST()
    shuffled: BST[int] = BST()
    values = list(range(1000))
    random.Random(1).shuffle(values)
    for x in range(1000):
        ordered.add(x)
    for x in values:
        shuffled.add(x)
    print("BST height, 1000 keys inserted in order:   ", ordered.height())
    print("BST height, 1000 keys inserted shuffled:   ", shuffled.height())


def demo_graph() -> None:
    deps = {
        "app": ["lib", "util"],
        "lib": ["core"],
        "util": ["core"],
        "tests": ["app"],
    }
    print("build order:", topological_order(deps))
    deps["core"] = ["tests"]  # closes a loop: core -> tests -> app -> lib -> core
    try:
        topological_order(deps)
    except CycleError as err:
        print("error:", err)
    roads: Graph[str] = Graph()
    for u, v, w in [("A", "B", 4), ("A", "C", 2), ("C", "B", 1), ("B", "D", 5), ("C", "D", 8)]:
        roads.add_edge(u, v, w)
    dist, prev = dijkstra(roads, "A")
    print("distances from A:", dict(sorted(dist.items())))
    print("path A -> D:", path_from(prev, "A", "D"))


def demo_dp() -> None:
    print("edit_distance('kitten', 'sitting') =", edit_distance("kitten", "sitting"))
    for coins, amount in (([1, 5, 10, 25], 63), ([1, 3, 4], 6), ([4, 3], 6)):
        print(
            f"coins={coins} amount={amount}: greedy={coin_change_greedy(coins, amount)} "
            f"dp={coin_change_min(coins, amount)}"
        )
    print("n_queens_count(8) =", n_queens_count(8))
    print("fast_power(7, 2026, 1000) =", fast_power(7, 2026, 1000), "| pow:", pow(7, 2026, 1000))


def demo_recursion() -> None:
    print("recursion limit:", sys.getrecursionlimit())
    print("depth reached by a trivial function (varies by interpreter state):", reachable_depth())
    try:
        sum_to_recursive(5_000)
    except RecursionError as err:
        print("RecursionError:", err)


TOPICS = {
    "deque": demo_deque,
    "table": demo_table,
    "heap": demo_heap,
    "graph": demo_graph,
    "dp": demo_dp,
    "recursion": demo_recursion,
}


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="F03 demos")
    parser.add_argument("topic", choices=sorted(TOPICS))
    args = parser.parse_args(argv)
    TOPICS[args.topic]()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
