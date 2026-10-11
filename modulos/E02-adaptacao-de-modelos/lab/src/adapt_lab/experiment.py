"""Experimento completo: base, full fine-tuning, LoRA, merge e veredito do harness."""

from __future__ import annotations

import copy
from dataclasses import dataclass

import numpy as np

from .harness import Suite, Verdict, compare
from .mlp import MLP, add_lora, count_params, merge, total_base_params
from .tasks import Tasks, make_tasks, pretrain
from .train import fit


def suites_for(tasks: Tasks) -> list[Suite]:
    return [
        Suite("tarefa_B", tasks.test_b_x, tasks.test_b_y, "target"),
        Suite("tarefa_A", tasks.test_a_x, tasks.test_a_y, "guard"),
    ]


@dataclass(frozen=True)
class Result:
    base: MLP
    full: MLP
    lora: MLP
    merged: MLP
    full_params: int
    lora_params: int
    total_params: int
    verdict_full: Verdict
    verdict_lora: Verdict


def run(
    tasks: Tasks,
    base: MLP,
    *,
    rank: int = 2,
    steps: int = 2000,
    lr_full: float = 3e-4,
    lr_lora: float = 3e-3,
    seed: int = 1,
) -> Result:
    val = (tasks.val_x, tasks.val_y)
    full = copy.deepcopy(base)
    fit(full, tasks.adapt_x, tasks.adapt_y, mode="full", steps=steps, lr=lr_full, val=val)
    lora = add_lora(base, np.random.default_rng(seed), rank=rank, alpha=2.0 * rank)
    fit(lora, tasks.adapt_x, tasks.adapt_y, mode="lora", steps=steps, lr=lr_lora, val=val)
    suites = suites_for(tasks)
    return Result(
        base=base,
        full=full,
        lora=lora,
        merged=merge(lora),
        full_params=count_params(full, "full"),
        lora_params=count_params(lora, "lora"),
        total_params=total_base_params(base),
        verdict_full=compare(base, full, suites),
        verdict_lora=compare(base, lora, suites),
    )


def build(seed: int = 7) -> tuple[Tasks, MLP]:
    tasks = make_tasks(seed)
    return tasks, pretrain(tasks, seed)
