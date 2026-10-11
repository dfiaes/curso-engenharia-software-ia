"""Duas tarefas sintéticas: a A (pré-treino) e a B, deslocada por uma atualização de baixo posto."""

from __future__ import annotations

from dataclasses import dataclass

import numpy as np

from .mlp import MLP, Array, add_lora, init_mlp
from .train import fit

D_IN, D_HIDDEN, D_OUT = 32, 64, 8


@dataclass(frozen=True)
class Tasks:
    pre_x: Array
    pre_y: Array
    adapt_x: Array
    adapt_y: Array
    val_x: Array
    val_y: Array
    test_a_x: Array
    test_a_y: Array
    test_b_x: Array
    test_b_y: Array
    shift_rank: int


def _teacher_b(teacher_a: MLP, rng: np.random.Generator, shift_rank: int, frac: float) -> MLP:
    """Professor B = professor A com W1 deslocado por uma matriz de posto `shift_rank`."""
    teacher_b = add_lora(teacher_a, rng, rank=1, alpha=1.0, targets=())  # cópia profunda
    w1 = teacher_b.layers[0].w
    u = rng.normal(size=(w1.shape[0], shift_rank))
    v = rng.normal(size=(shift_rank, w1.shape[1]))
    delta = u @ v
    delta *= frac * np.linalg.norm(w1) / np.linalg.norm(delta)
    teacher_b.layers[0].w = w1 + delta
    return teacher_b


def make_tasks(
    seed: int = 7,
    *,
    n_pre: int = 20000,
    n_adapt: int = 48,
    n_val: int = 200,
    n_test: int = 1000,
    noise: float = 0.05,
    shift_rank: int = 2,
    shift_frac: float = 0.6,
) -> Tasks:
    rng = np.random.default_rng(seed)
    teacher_a = init_mlp(rng, (D_IN, D_HIDDEN, D_OUT))
    teacher_b = _teacher_b(teacher_a, rng, shift_rank, shift_frac)

    def draw(n: int) -> Array:
        return rng.normal(size=(n, D_IN))

    pre_x, adapt_x, val_x = draw(n_pre), draw(n_adapt), draw(n_val)
    test_a_x, test_b_x = draw(n_test), draw(n_test)
    return Tasks(
        pre_x=pre_x,
        pre_y=teacher_a.forward(pre_x),
        adapt_x=adapt_x,
        adapt_y=teacher_b.forward(adapt_x) + noise * rng.normal(size=(n_adapt, D_OUT)),
        val_x=val_x,
        val_y=teacher_b.forward(val_x) + noise * rng.normal(size=(n_val, D_OUT)),
        test_a_x=test_a_x,
        test_a_y=teacher_a.forward(test_a_x),
        test_b_x=test_b_x,
        test_b_y=teacher_b.forward(test_b_x),
        shift_rank=shift_rank,
    )


def pretrain(tasks: Tasks, seed: int = 7, steps: int = 1500, lr: float = 3e-3) -> MLP:
    """Pré-treina um aluno com a mesma arquitetura na tarefa A (o 'modelo base')."""
    rng = np.random.default_rng(seed + 1000)
    student = init_mlp(rng, (D_IN, D_HIDDEN, D_OUT))
    fit(student, tasks.pre_x, tasks.pre_y, mode="full", steps=steps, lr=lr)
    return student
