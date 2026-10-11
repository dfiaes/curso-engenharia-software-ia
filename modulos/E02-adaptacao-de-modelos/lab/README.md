# Lab E02 - adapt_lab

LoRA from scratch in numpy: a tiny MLP with hand-written backprop, low-rank
adapters (`W' = W + (alpha/r) B A`), a full fine-tuning baseline, merge, and a
regression-gate harness that detects catastrophic forgetting. Python 3.14,
managed with `uv`. No network, no GPU, no accounts.

## Quality gates

    uv sync --frozen
    uv run pytest -q
    uv run ruff check .
    uv run ruff format --check .
    uv run mypy --strict src tests

## What each part covers

| Piece | File | Shows |
|---|---|---|
| MLP + adapters | `src/adapt_lab/mlp.py` | forward, manual gradients (checked by finite differences), `add_lora`, `merge`, parameter counts |
| training | `src/adapt_lab/train.py` | Adam, full-batch loop, best-validation checkpoint, frozen base in LoRA mode |
| tasks | `src/adapt_lab/tasks.py` | task A (pre-training) and task B (a rank-2 shift of the first layer) |
| harness | `src/adapt_lab/harness.py` | target/guard suites, relative gain and regression limits, non-finite output fails |
| experiment | `src/adapt_lab/experiment.py` | base vs full vs LoRA vs merged, one verdict each |
| CLI | `python -m adapt_lab.cli` | `demo`, `sweep` (rank), `seeds` (variance) |

The reference copy is read-only. Run `python3 create_working_copy.py` and work
in the printed directory.
