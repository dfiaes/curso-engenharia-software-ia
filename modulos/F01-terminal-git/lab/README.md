# Lab F01 — shell_git_lab

Terminal, processes and Git internals in three small pieces. Python 3.14,
managed with `uv`. No network, no services; tests that need `git` skip with a
clear message when it is not installed.

## Quality gates

    uv sync --frozen
    uv run pytest -q
    uv run ruff check .
    uv run ruff format --check .
    uv run mypy --strict src tests

## What each part covers

| Piece | File | Shows |
|---|---|---|
| `pgrep` | `src/shell_git_lab/pgrep.py` | stdin/stdout/stderr, exit codes 0/1/2, SIGINT (130), closed pipe (141) |
| object reader | `src/shell_git_lab/gitobjects.py` | loose objects: zlib, blob/tree/commit, refs, HEAD, hash check |
| scenarios | `src/shell_git_lab/scenarios.py` | reflog recovery and `git bisect run`, with a deterministic clock |
| CLI | `python -m shell_git_lab.cli` | `cat-object`, `log`, `scenario reflog|bisect` |

The reference copy is read-only. Run `python3 create_working_copy.py` and work
in the printed directory.
