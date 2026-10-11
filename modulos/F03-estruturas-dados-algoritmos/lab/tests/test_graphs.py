import random

import pytest

from algos.graphs import (
    CycleError,
    Graph,
    bfs_order,
    dfs_order,
    dfs_order_recursive,
    dijkstra,
    path_from,
    shortest_path_unweighted,
    topological_order,
)


def sample() -> Graph[str]:
    g: Graph[str] = Graph()
    for u, v in [("a", "b"), ("a", "c"), ("b", "d"), ("c", "d"), ("d", "e")]:
        g.add_edge(u, v)
    g.add_node("lonely")
    return g


def test_bfs_visits_by_distance_and_skips_unreachable() -> None:
    assert bfs_order(sample(), "a") == ["a", "b", "c", "d", "e"]


def test_shortest_path_unweighted() -> None:
    assert shortest_path_unweighted(sample(), "a", "e") == ["a", "b", "d", "e"]
    assert shortest_path_unweighted(sample(), "a", "a") == ["a"]
    assert shortest_path_unweighted(sample(), "a", "lonely") is None


def test_dfs_iterative_matches_recursive() -> None:
    assert (
        dfs_order(sample(), "a")
        == dfs_order_recursive(sample(), "a")
        == [
            "a",
            "b",
            "d",
            "c",
            "e",
        ]
    )
    rng = random.Random(6)
    for _ in range(50):
        g: Graph[int] = Graph(directed=rng.random() < 0.5)
        for _ in range(30):
            g.add_edge(rng.randrange(12), rng.randrange(12))
        assert dfs_order(g, g.nodes()[0]) == dfs_order_recursive(g, g.nodes()[0])


def test_control_recursive_dfs_fails_on_a_long_path_iterative_does_not() -> None:
    g: Graph[int] = Graph(directed=True)
    for i in range(20_000):
        g.add_edge(i, i + 1)
    with pytest.raises(RecursionError):
        dfs_order_recursive(g, 0)
    assert len(dfs_order(g, 0)) == 20_001


def test_topological_order_respects_every_dependency() -> None:
    deps = {"app": ["lib", "util"], "lib": ["core"], "util": ["core"], "test": ["app"]}
    order = topological_order(deps)
    assert set(order) == {"app", "lib", "util", "core", "test"}
    for node, required in deps.items():
        assert all(order.index(r) < order.index(node) for r in required)


def test_topological_order_edge_cases() -> None:
    assert topological_order({}) == []
    assert topological_order({"x": []}) == ["x"]
    assert topological_order({"x": ["y", "y"]}) == ["y", "x"]  # repeated edge counted once


def test_cycle_is_reported_with_an_actual_cycle() -> None:
    deps = {"a": ["b"], "b": ["c"], "c": ["a"], "free": []}
    with pytest.raises(CycleError) as info:
        topological_order(deps)
    cycle = info.value.cycle
    assert cycle[0] == cycle[-1] and set(cycle) == {"a", "b", "c"}
    with pytest.raises(CycleError):
        topological_order({"self": ["self"]})


def test_dijkstra_small_case_and_path() -> None:
    g: Graph[str] = Graph(directed=True)
    g.add_edge("s", "a", 7)
    g.add_edge("s", "b", 2)
    g.add_edge("b", "a", 3)
    g.add_edge("a", "t", 1)
    g.add_edge("b", "t", 9)
    dist, prev = dijkstra(g, "s")
    assert dist["t"] == 6.0
    assert path_from(prev, "s", "t") == ["s", "b", "a", "t"]
    assert path_from(prev, "s", "s") == ["s"]
    g.add_node("island")
    assert "island" not in dijkstra(g, "s")[0]
    assert path_from(prev, "s", "island") is None


def bellman_ford(g: Graph[int], source: int) -> dict[int, float]:
    dist = {n: float("inf") for n in g.nodes()}
    dist[source] = 0.0
    for _ in range(len(dist)):
        for u in g.nodes():
            for v, w in g.edges_from(u):
                dist[v] = min(dist[v], dist[u] + w)
    return {n: d for n, d in dist.items() if d != float("inf")}


def test_dijkstra_matches_bellman_ford_on_random_graphs() -> None:
    rng = random.Random(12)
    for _ in range(100):
        g: Graph[int] = Graph(directed=True)
        g.add_node(0)
        for _ in range(rng.randrange(0, 40)):
            g.add_edge(rng.randrange(10), rng.randrange(10), rng.randrange(0, 10))
        assert dijkstra(g, 0)[0] == bellman_ford(g, 0)


def test_control_dijkstra_rejects_negative_weights() -> None:
    g: Graph[int] = Graph(directed=True)
    g.add_edge(0, 1, 4)
    g.add_edge(0, 2, 5)
    g.add_edge(2, 1, -3)  # the true distance to 1 is 2, a greedy settle-once gets 4
    with pytest.raises(ValueError):
        dijkstra(g, 0)
