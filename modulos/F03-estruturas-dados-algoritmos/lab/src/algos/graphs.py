"""Adjacency-list graph, BFS, DFS, topological order and Dijkstra."""

import heapq
from collections import deque
from collections.abc import Hashable, Iterable, Mapping


class CycleError(ValueError):
    """The dependency graph has a cycle; ``cycle`` lists one of them (first node repeated)."""

    def __init__(self, cycle: list[object]) -> None:
        super().__init__("dependency cycle: " + " -> ".join(map(str, cycle)))
        self.cycle = cycle


class Graph[N: Hashable]:
    """Adjacency list: ``dict`` from node to a list of ``(neighbor, weight)``. O(V + E) memory."""

    def __init__(self, *, directed: bool = False) -> None:
        self.directed = directed
        self._adj: dict[N, list[tuple[N, float]]] = {}

    def add_node(self, node: N) -> None:
        self._adj.setdefault(node, [])

    def add_edge(self, u: N, v: N, weight: float = 1.0) -> None:
        self.add_node(u)
        self.add_node(v)
        self._adj[u].append((v, weight))
        if not self.directed:
            self._adj[v].append((u, weight))

    def nodes(self) -> list[N]:
        return list(self._adj)

    def edges_from(self, node: N) -> list[tuple[N, float]]:
        return self._adj[node]

    def neighbors(self, node: N) -> list[N]:
        return [v for v, _ in self._adj[node]]


def bfs_order[N: Hashable](g: Graph[N], start: N) -> list[N]:
    """Nodes in the order BFS reaches them: by distance (edge count) from ``start``."""
    seen = {start}
    order: list[N] = []
    queue = deque([start])
    while queue:
        node = queue.popleft()
        order.append(node)
        for nxt in g.neighbors(node):
            if nxt not in seen:  # mark when enqueued, not when dequeued, or nodes repeat
                seen.add(nxt)
                queue.append(nxt)
    return order


def shortest_path_unweighted[N: Hashable](g: Graph[N], start: N, goal: N) -> list[N] | None:
    """Fewest-edges path, by BFS with parent pointers."""
    parent: dict[N, N | None] = {start: None}
    queue = deque([start])
    while queue:
        node = queue.popleft()
        if node == goal:
            path: list[N] = []
            cursor: N | None = node
            while cursor is not None:
                path.append(cursor)
                cursor = parent[cursor]
            path.reverse()
            return path
        for nxt in g.neighbors(node):
            if nxt not in parent:
                parent[nxt] = node
                queue.append(nxt)
    return None


def dfs_order[N: Hashable](g: Graph[N], start: N) -> list[N]:
    """Pre-order DFS with an explicit stack (no recursion limit)."""
    seen: set[N] = set()
    order: list[N] = []
    stack = [start]
    while stack:
        node = stack.pop()
        if node in seen:
            continue
        seen.add(node)
        order.append(node)
        # reversed, so the first neighbor is popped first (same order as the recursive form)
        stack.extend(reversed(g.neighbors(node)))
    return order


def dfs_order_recursive[N: Hashable](g: Graph[N], start: N) -> list[N]:
    """The textbook recursive DFS. Depth equals the longest path: it hits ``RecursionError``
    on a path graph of a few thousand nodes."""
    seen: set[N] = set()
    order: list[N] = []

    def visit(node: N) -> None:
        seen.add(node)
        order.append(node)
        for nxt in g.neighbors(node):
            if nxt not in seen:
                visit(nxt)

    visit(start)
    return order


def topological_order[N: Hashable](deps: Mapping[N, Iterable[N]]) -> list[N]:
    """Kahn's algorithm. ``deps[x]`` are the prerequisites of ``x`` (they come first).

    Nodes that appear only as prerequisites are included. Raises ``CycleError`` with an actual
    cycle when no order exists.
    """
    prereqs: dict[N, list[N]] = {}
    for node, required in deps.items():
        prereqs.setdefault(node, [])
        for r in required:
            prereqs[node].append(r)
            prereqs.setdefault(r, [])
    dependents: dict[N, list[N]] = {n: [] for n in prereqs}
    pending = {n: len(set(p)) for n, p in prereqs.items()}
    for node, required in prereqs.items():
        for r in set(required):
            dependents[r].append(node)
    ready = deque(n for n, count in pending.items() if count == 0)
    order: list[N] = []
    while ready:
        node = ready.popleft()
        order.append(node)
        for dep in dependents[node]:
            pending[dep] -= 1
            if pending[dep] == 0:
                ready.append(dep)
    if len(order) < len(prereqs):
        raise CycleError(_find_cycle({n for n, c in pending.items() if c > 0}, prereqs))
    return order


def _find_cycle[N: Hashable](stuck: set[N], prereqs: Mapping[N, list[N]]) -> list[object]:
    """Every stuck node has a stuck prerequisite; walking those links must repeat a node."""
    node = next(n for n in prereqs if n in stuck)
    walk: list[N] = []
    position: dict[N, int] = {}
    while node not in position:
        position[node] = len(walk)
        walk.append(node)
        node = next(p for p in prereqs[node] if p in stuck)
    cycle = walk[position[node] :]
    cycle.append(node)
    cycle.reverse()  # follow the arrows "prerequisite -> dependent"
    return list(cycle)


def dijkstra[N: Hashable](g: Graph[N], source: N) -> tuple[dict[N, float], dict[N, N]]:
    """Shortest distances from ``source`` and the predecessor map, O((V + E) log V).

    Uses ``heapq`` with lazy deletion: a node can be pushed several times, and stale entries
    are skipped when popped. Rejects negative weights, for which the algorithm is wrong.
    """
    for u in g.nodes():
        for _, w in g.edges_from(u):
            if w < 0:
                raise ValueError("Dijkstra requires non-negative weights")
    dist: dict[N, float] = {source: 0.0}
    prev: dict[N, N] = {}
    counter = 0  # tie-breaker so the heap never compares two nodes
    heap: list[tuple[float, int, N]] = [(0.0, counter, source)]
    done: set[N] = set()
    while heap:
        d, _, node = heapq.heappop(heap)
        if node in done:
            continue  # stale entry: a shorter one was already settled
        done.add(node)
        for nxt, w in g.edges_from(node):
            nd = d + w
            if nd < dist.get(nxt, float("inf")):
                dist[nxt] = nd
                prev[nxt] = node
                counter += 1
                heapq.heappush(heap, (nd, counter, nxt))
    return dist, prev


def path_from[N: Hashable](prev: Mapping[N, N], source: N, target: N) -> list[N] | None:
    if target != source and target not in prev:
        return None
    path = [target]
    while path[-1] != source:
        path.append(prev[path[-1]])
    path.reverse()
    return path
