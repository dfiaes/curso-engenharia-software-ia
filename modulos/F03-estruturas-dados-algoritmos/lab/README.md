# Lab F03 — algos

Data structures, algorithms and complexity written from scratch and measured.
Python 3.14, managed with `uv`. No network, no services, no runtime dependencies.

## Quality gates

    uv sync --frozen
    uv run pytest -q
    uv run ruff check .
    uv run ruff format --check .
    uv run mypy --strict src tests

## Benchmarks

    uv run python -m algos.bench          # full tables (about a minute)
    uv run python -m algos.bench --quick  # tiny sizes
    uv run python -m algos.bench --growth # list over-allocation points

## Modules

| Module | Shows |
|---|---|
| `circular_deque` | ring buffer, power-of-two mask, doubling and halving |
| `hash_table` | open addressing with CPython's probe recurrence, tombstones, rebuild |
| `heap` | binary min-heap with exception-safe push/pop, `top_k` |
| `bst` / `trie` | unbalanced BST (iterative), prefix tree |
| `sorting` | stable merge sort, in-place 3-way quicksort |
| `searching` | `lower_bound`/`upper_bound`, `first_true`, two pointers, sliding window |
| `graphs` | BFS, DFS, Kahn topological order with cycle report, Dijkstra |
| `dp` / `backtracking` / `recursion` | edit distance, coin change, N-queens, recursion limit |

The reference copy is read-only. Run `python3 create_working_copy.py` and work in the
printed directory.
