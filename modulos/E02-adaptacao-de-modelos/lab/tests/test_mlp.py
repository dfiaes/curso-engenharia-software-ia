from __future__ import annotations

import copy

import numpy as np
import pytest

from adapt_lab.mlp import (
    MLP,
    Array,
    add_lora,
    count_params,
    forward_decomposed,
    init_mlp,
    loss_and_grads,
    merge,
    mse,
    total_base_params,
    trainable_params,
)
from adapt_lab.train import fit

SIZES = (6, 10, 4)


def small(seed: int = 0) -> tuple[MLP, Array, Array]:
    rng = np.random.default_rng(seed)
    return init_mlp(rng, SIZES), rng.normal(size=(20, 6)), rng.normal(size=(20, 4))


def param(model: MLP, name: str) -> Array:
    layer = model.layers[int(name[0])]
    kind = name.split(".")[1]
    if kind == "w":
        return layer.w
    if kind == "bias":
        return layer.bias
    assert layer.adapter is not None
    return layer.adapter.a if kind == "a" else layer.adapter.b


def test_b_zero_at_init_does_not_change_output() -> None:
    model, x, _ = small()
    adapted = add_lora(model, np.random.default_rng(1), rank=3, alpha=6.0)
    assert np.array_equal(adapted.forward(x), model.forward(x))


def test_gradient_matches_finite_differences_for_full_and_lora() -> None:
    model, x, y = small()
    adapted = add_lora(model, np.random.default_rng(1), rank=2, alpha=4.0)
    for layer in adapted.layers:  # B != 0 para que dA também seja exercitado
        assert layer.adapter is not None
        layer.adapter.b[...] = np.random.default_rng(5).normal(size=layer.adapter.b.shape)
    _, grads = loss_and_grads(adapted, x, y)
    for name in ("0.w", "0.bias", "1.w", "0.a", "0.b", "1.a", "1.b"):
        arr = param(adapted, name)
        idx = tuple(0 for _ in arr.shape)
        eps = 1e-6
        old = arr[idx]
        arr[idx] = old + eps
        up = mse(adapted.forward(x), y)
        arr[idx] = old - eps
        down = mse(adapted.forward(x), y)
        arr[idx] = old
        numeric = (up - down) / (2 * eps)
        assert grads[name][idx] == pytest.approx(numeric, rel=1e-4, abs=1e-8)


def test_merge_equals_separate_adapter_forward() -> None:
    model, x, y = small()
    adapted = add_lora(model, np.random.default_rng(1), rank=2, alpha=8.0)
    fit(adapted, x, y, mode="lora", steps=50, lr=1e-2)
    merged = merge(adapted)
    assert all(layer.adapter is None for layer in merged.layers)
    np.testing.assert_allclose(merged.forward(x), forward_decomposed(adapted, x), atol=1e-12)
    assert not np.allclose(merged.forward(x), model.forward(x))  # controle: treino mudou algo


def test_lora_training_leaves_base_bit_identical_but_full_does_not() -> None:
    model, x, y = small()
    adapted = add_lora(model, np.random.default_rng(1), rank=2, alpha=4.0)
    fit(adapted, x, y, mode="lora", steps=30, lr=1e-2)
    for before, after in zip(model.layers, adapted.layers, strict=True):
        assert np.array_equal(before.w, after.w)
        assert np.array_equal(before.bias, after.bias)
    full = copy.deepcopy(model)
    fit(full, x, y, mode="full", steps=30, lr=1e-2)
    assert not np.array_equal(model.layers[0].w, full.layers[0].w)


def test_parameter_counts_follow_formula() -> None:
    model, _, _ = small()
    r = 2
    adapted = add_lora(model, np.random.default_rng(1), rank=r, alpha=4.0)
    expected = r * (6 + 10) + r * (10 + 4)
    assert count_params(adapted, "lora") == expected
    assert count_params(adapted, "full") == total_base_params(model)
    only_first = add_lora(model, np.random.default_rng(1), rank=r, alpha=4.0, targets=(0,))
    assert count_params(only_first, "lora") == r * (6 + 10)


def test_scale_is_alpha_over_rank() -> None:
    model, x, _ = small()
    a1 = add_lora(model, np.random.default_rng(1), rank=2, alpha=2.0, targets=(0,))
    a2 = copy.deepcopy(a1)
    ad1, ad2 = a1.layers[0].adapter, a2.layers[0].adapter
    assert ad1 is not None
    assert ad2 is not None
    ad1.b[...] = 0.3
    ad2.b[...] = 0.3
    ad2.alpha = 4.0
    np.testing.assert_allclose(ad2.delta(), 2 * ad1.delta())
    assert a1.forward(x).shape == a2.forward(x).shape


@pytest.mark.parametrize("rank", [0, -1, 5])
def test_invalid_rank_is_rejected(rank: int) -> None:
    model, _, _ = small()
    with pytest.raises(ValueError, match="rank"):
        add_lora(model, np.random.default_rng(1), rank=rank, alpha=1.0, targets=(1,))


def test_invalid_alpha_and_missing_adapter_are_rejected() -> None:
    model, _, _ = small()
    with pytest.raises(ValueError, match="alpha"):
        add_lora(model, np.random.default_rng(1), rank=1, alpha=0.0)
    with pytest.raises(ValueError, match="treinável"):
        trainable_params(model, "lora")


def test_fit_rejects_zero_steps_and_keeps_best_validation_point() -> None:
    model, x, y = small()
    with pytest.raises(ValueError, match="steps"):
        fit(model, x, y, mode="full", steps=0, lr=1e-2)
    rng = np.random.default_rng(9)
    vx, vy = (
        rng.normal(size=(20, 6)),
        rng.normal(size=(20, 4)),
    )  # validação sem relação: sobreajuste
    res = fit(model, x, y, mode="full", steps=300, lr=5e-2, val=(vx, vy))
    assert res.best_step < 300
    assert mse(model.forward(vx), vy) == pytest.approx(min(res.val_losses))
