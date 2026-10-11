"""CLI do laboratório: `demo` (full vs LoRA + gate), `sweep` (rank) e `seeds` (variância)."""

from __future__ import annotations

import argparse
import sys

import numpy as np

from . import experiment
from .harness import format_verdict
from .mlp import add_lora, count_params, forward_decomposed, mse
from .train import fit


def cmd_demo(seed: int, rank: int) -> int:
    tasks, base = experiment.build(seed)
    res = experiment.run(tasks, base, rank=rank)
    print(f"parametros do modelo base: {res.total_params}")
    print(f"treinaveis  full: {res.full_params} ({res.full_params / res.total_params:.1%})")
    print(
        f"treinaveis  lora: {res.lora_params} ({res.lora_params / res.total_params:.1%})  r={rank}"
    )
    unmerged = forward_decomposed(res.lora, tasks.test_b_x)
    gap = float(np.max(np.abs(unmerged - res.merged.forward(tasks.test_b_x))))
    print(f"max |adapter separado - merge| na tarefa B: {gap:.2e}")
    print("\n== full fine-tuning vs base ==")
    print(format_verdict(res.verdict_full))
    print("\n== LoRA vs base ==")
    print(format_verdict(res.verdict_lora))
    return 0 if res.verdict_lora.passed else 1


def cmd_sweep(seed: int, n_adapt: int) -> int:
    from .tasks import make_tasks, pretrain

    tasks = make_tasks(seed, n_adapt=n_adapt)
    base = pretrain(tasks, seed)
    print(f"n_adapt={n_adapt}  (a mudanca verdadeira tem posto {tasks.shift_rank})")
    print(f"{'rank':>4}{'treinaveis':>12}{'erro B':>10}{'erro A':>10}")
    for rank in (1, 2, 4, 8):
        m = add_lora(base, np.random.default_rng(1), rank=rank, alpha=2.0 * rank)
        fit(
            m,
            tasks.adapt_x,
            tasks.adapt_y,
            mode="lora",
            steps=2000,
            lr=3e-3,
            val=(tasks.val_x, tasks.val_y),
        )
        eb = mse(m.forward(tasks.test_b_x), tasks.test_b_y)
        ea = mse(m.forward(tasks.test_a_x), tasks.test_a_y)
        print(f"{rank:>4}{count_params(m, 'lora'):>12}{eb:>10.4f}{ea:>10.4f}")
    return 0


def cmd_seeds(seeds: list[int]) -> int:
    print(f"{'seed':>5}{'B base':>9}{'B full':>9}{'B lora':>9}{'A full':>9}{'A lora':>9}")
    for seed in seeds:
        tasks, base = experiment.build(seed)
        res = experiment.run(tasks, base)
        f, lo = res.verdict_full.new, res.verdict_lora.new
        print(
            f"{seed:>5}{res.verdict_lora.base['tarefa_B']:>9.4f}{f['tarefa_B']:>9.4f}"
            f"{lo['tarefa_B']:>9.4f}{f['tarefa_A']:>9.4f}{lo['tarefa_A']:>9.4f}"
        )
    return 0


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(prog="adapt_lab")
    sub = parser.add_subparsers(dest="cmd", required=True)
    d = sub.add_parser("demo")
    d.add_argument("--seed", type=int, default=7)
    d.add_argument("--rank", type=int, default=2)
    s = sub.add_parser("sweep")
    s.add_argument("--seed", type=int, default=7)
    s.add_argument("--n-adapt", type=int, default=48)
    m = sub.add_parser("seeds")
    m.add_argument("--seeds", type=int, nargs="+", default=[3, 7, 11, 21])
    args = parser.parse_args(argv)
    if args.cmd == "demo":
        return cmd_demo(args.seed, args.rank)
    if args.cmd == "seeds":
        return cmd_seeds(list(args.seeds))
    return cmd_sweep(args.seed, args.n_adapt)


if __name__ == "__main__":
    sys.exit(main())
