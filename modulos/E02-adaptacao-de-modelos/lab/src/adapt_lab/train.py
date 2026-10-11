"""Adam e laço de treino em lote completo, com seleção do melhor ponto pela validação."""

from __future__ import annotations

from dataclasses import dataclass

import numpy as np

from .mlp import MLP, Array, Mode, loss_and_grads, mse, trainable_params


class Adam:
    def __init__(self, params: dict[str, Array], lr: float) -> None:
        self.params = params
        self.lr = lr
        self.t = 0
        self.m = {k: np.zeros_like(v) for k, v in params.items()}
        self.v = {k: np.zeros_like(v) for k, v in params.items()}

    def step(self, grads: dict[str, Array]) -> None:
        self.t += 1
        b1, b2, eps = 0.9, 0.999, 1e-8
        for name, p in self.params.items():
            g = grads[name]
            self.m[name] = b1 * self.m[name] + (1 - b1) * g
            self.v[name] = b2 * self.v[name] + (1 - b2) * g * g
            m_hat = self.m[name] / (1 - b1**self.t)
            v_hat = self.v[name] / (1 - b2**self.t)
            p -= self.lr * m_hat / (np.sqrt(v_hat) + eps)


@dataclass(frozen=True)
class FitResult:
    train_losses: tuple[float, ...]
    val_losses: tuple[float, ...]
    best_step: int


def fit(
    model: MLP,
    x: Array,
    y: Array,
    *,
    mode: Mode,
    steps: int,
    lr: float,
    val: tuple[Array, Array] | None = None,
    keep_best: bool = True,
) -> FitResult:
    """Treina `model` no lugar. Em `lora`, só A e B se movem; W e bias ficam bit a bit iguais."""
    if steps < 1:
        raise ValueError("steps deve ser >= 1")
    params = trainable_params(model, mode)
    opt = Adam(params, lr)
    train_losses: list[float] = []
    val_losses: list[float] = []
    best_val = np.inf
    best_step = 0
    snapshot = {k: v.copy() for k, v in params.items()}
    for step in range(1, steps + 1):
        loss, grads = loss_and_grads(model, x, y)
        train_losses.append(loss)
        opt.step({k: grads[k] for k in params})
        if val is not None:
            v = mse(model.forward(val[0]), val[1])
            val_losses.append(v)
            if v < best_val:
                best_val, best_step = v, step
                snapshot = {k: p.copy() for k, p in params.items()}
    if val is not None and keep_best:
        for k, p in params.items():
            p[...] = snapshot[k]
    else:
        best_step = steps
    return FitResult(tuple(train_losses), tuple(val_losses), best_step)
