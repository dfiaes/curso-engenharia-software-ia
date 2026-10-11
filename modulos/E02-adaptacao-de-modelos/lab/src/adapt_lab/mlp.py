"""MLP minúsculo com adapter LoRA opcional por camada, com backprop escrito à mão."""

from __future__ import annotations

import copy
import itertools
from dataclasses import dataclass, field
from typing import Literal

import numpy as np
from numpy.typing import NDArray

Array = NDArray[np.float64]
Mode = Literal["full", "lora"]


@dataclass
class Adapter:
    """Par de baixo posto: delta = (alpha / r) * B @ A, com A (r, in) e B (out, r)."""

    a: Array
    b: Array
    alpha: float

    @property
    def rank(self) -> int:
        return int(self.a.shape[0])

    @property
    def scale(self) -> float:
        return self.alpha / self.rank

    def delta(self) -> Array:
        return self.scale * (self.b @ self.a)


@dataclass
class Linear:
    w: Array
    bias: Array
    adapter: Adapter | None = None

    def effective_weight(self) -> Array:
        if self.adapter is None:
            return self.w
        return self.w + self.adapter.delta()


@dataclass
class MLP:
    layers: list[Linear] = field(default_factory=list)

    def forward(self, x: Array) -> Array:
        return _forward(self, x)[0]


def _forward(model: MLP, x: Array) -> tuple[Array, list[Array]]:
    """Devolve a saída e as entradas de cada camada (necessárias ao backprop)."""
    inputs: list[Array] = []
    h = x
    last = len(model.layers) - 1
    for i, layer in enumerate(model.layers):
        inputs.append(h)
        z = h @ layer.effective_weight().T + layer.bias
        h = z if i == last else np.maximum(z, 0.0)
    return h, inputs


def forward_decomposed(model: MLP, x: Array) -> Array:
    """Forward como num servidor com adapter separado: W·x + (alpha/r)·B·(A·x), sem somar em W."""
    h = x
    last = len(model.layers) - 1
    for i, layer in enumerate(model.layers):
        z = h @ layer.w.T + layer.bias
        if layer.adapter is not None:
            ad = layer.adapter
            z = z + ad.scale * ((h @ ad.a.T) @ ad.b.T)
        h = z if i == last else np.maximum(z, 0.0)
    return h


def init_mlp(rng: np.random.Generator, sizes: tuple[int, ...]) -> MLP:
    layers = [
        Linear(
            w=rng.normal(0.0, 1.0 / np.sqrt(n_in), size=(n_out, n_in)),
            bias=np.zeros(n_out),
        )
        for n_in, n_out in itertools.pairwise(sizes)
    ]
    return MLP(layers)


def mse(pred: Array, y: Array) -> float:
    return float(np.mean((pred - y) ** 2))


def loss_and_grads(model: MLP, x: Array, y: Array) -> tuple[float, dict[str, Array]]:
    """MSE e gradientes de todos os parâmetros, incluindo A e B dos adapters."""
    pred, inputs = _forward(model, x)
    loss = mse(pred, y)
    grad = 2.0 * (pred - y) / pred.size
    grads: dict[str, Array] = {}
    for i in range(len(model.layers) - 1, -1, -1):
        layer = model.layers[i]
        h_in = inputs[i]
        d_w_eff = grad.T @ h_in
        grads[f"{i}.bias"] = grad.sum(axis=0)
        grads[f"{i}.w"] = d_w_eff
        if layer.adapter is not None:
            ad = layer.adapter
            grads[f"{i}.b"] = ad.scale * (d_w_eff @ ad.a.T)
            grads[f"{i}.a"] = ad.scale * (ad.b.T @ d_w_eff)
        if i > 0:
            grad = (grad @ layer.effective_weight()) * (inputs[i] > 0.0)
    return loss, grads


def add_lora(
    model: MLP,
    rng: np.random.Generator,
    rank: int,
    alpha: float,
    targets: tuple[int, ...] | None = None,
) -> MLP:
    """Cópia do modelo com adapters: A aleatório pequeno, B zero (delta inicial nulo)."""
    if rank < 1:
        raise ValueError("rank deve ser >= 1")
    if alpha <= 0:
        raise ValueError("alpha deve ser > 0")
    out = copy.deepcopy(model)
    chosen = range(len(out.layers)) if targets is None else targets
    for i in chosen:
        layer = out.layers[i]
        n_out, n_in = layer.w.shape
        if rank > min(n_in, n_out):
            raise ValueError(f"rank {rank} excede min(in, out) = {min(n_in, n_out)} na camada {i}")
        layer.adapter = Adapter(
            a=rng.normal(0.0, 1.0 / np.sqrt(n_in), size=(rank, n_in)),
            b=np.zeros((n_out, rank)),
            alpha=alpha,
        )
    return out


def merge(model: MLP) -> MLP:
    """Funde cada adapter em W: W' = W + (alpha/r) B A. O resultado não tem adapters."""
    out = copy.deepcopy(model)
    for layer in out.layers:
        if layer.adapter is not None:
            layer.w = layer.effective_weight()
            layer.adapter = None
    return out


def trainable_params(model: MLP, mode: Mode) -> dict[str, Array]:
    """Referências (não cópias) aos arrays que o modo treina; o resto fica congelado."""
    params: dict[str, Array] = {}
    for i, layer in enumerate(model.layers):
        if mode == "full":
            params[f"{i}.w"] = layer.w
            params[f"{i}.bias"] = layer.bias
        elif layer.adapter is not None:
            params[f"{i}.a"] = layer.adapter.a
            params[f"{i}.b"] = layer.adapter.b
    if not params:
        raise ValueError(f"nenhum parâmetro treinável no modo {mode!r}")
    return params


def count_params(model: MLP, mode: Mode) -> int:
    return sum(int(p.size) for p in trainable_params(model, mode).values())


def total_base_params(model: MLP) -> int:
    return sum(int(layer.w.size + layer.bias.size) for layer in model.layers)
