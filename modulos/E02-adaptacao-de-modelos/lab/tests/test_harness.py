from __future__ import annotations

import copy

import numpy as np
import pytest

from adapt_lab import experiment
from adapt_lab.harness import Suite, compare, evaluate, format_verdict
from adapt_lab.mlp import MLP, init_mlp


def make_suites() -> tuple[MLP, list[Suite]]:
    rng = np.random.default_rng(0)
    base = init_mlp(rng, (5, 8, 3))
    x_a, x_b = rng.normal(size=(40, 5)), rng.normal(size=(40, 5))
    shifted = copy.deepcopy(base)
    shifted.layers[1].bias[...] = 1.0
    suites = [
        Suite("alvo", x_b, shifted.forward(x_b), "target"),
        Suite("guarda", x_a, base.forward(x_a), "guard"),
    ]
    return base, suites


def test_gate_passes_when_target_improves_and_guard_holds() -> None:
    rng = np.random.default_rng(1)
    base = init_mlp(rng, (5, 8, 3))
    new = copy.deepcopy(base)
    new.layers[1].bias[...] = 0.01  # correção pequena que acerta o alvo deslocado
    x = rng.normal(size=(40, 5))
    noisy = base.forward(x) + 0.5 * rng.normal(size=(40, 3))  # guarda com erro de base > 0
    suites = [
        Suite("alvo", x, base.forward(x) + 0.01, "target"),
        Suite("guarda", x, noisy, "guard"),
    ]
    verdict = compare(base, new, suites, min_gain=0.2, max_regression=0.1)
    assert verdict.target_failures == ()
    assert verdict.gains["alvo"] > 0.99
    assert verdict.regressions == ()
    assert verdict.passed


def test_forgetting_is_detected_as_regression() -> None:
    base, suites = make_suites()
    broken = copy.deepcopy(base)
    broken.layers[0].w *= 3.0  # destrói o comportamento antigo
    verdict = compare(base, broken, suites)
    assert "guarda" in verdict.regressions
    assert not verdict.passed
    assert "REGRIDE" in format_verdict(verdict)


def test_negative_control_identical_model_fails_the_gain_requirement() -> None:
    base, suites = make_suites()
    verdict = compare(base, copy.deepcopy(base), suites)
    assert verdict.regressions == ()
    assert verdict.target_failures == ("alvo",)
    assert not verdict.passed


def test_non_finite_output_fails_the_gate() -> None:
    base, suites = make_suites()
    poisoned = copy.deepcopy(base)
    poisoned.layers[1].w[0, 0] = np.nan
    verdict = compare(base, poisoned, suites)
    assert not verdict.passed
    assert np.isnan(evaluate(poisoned, suites)["guarda"])


def test_invalid_configuration_is_rejected() -> None:
    base, suites = make_suites()
    with pytest.raises(ValueError, match="duplicados"):
        compare(base, base, [suites[0], suites[0]])
    with pytest.raises(ValueError, match="target"):
        compare(base, base, [suites[1]])
    with pytest.raises(ValueError, match="limites"):
        compare(base, base, suites, min_gain=-1.0)


@pytest.fixture(scope="module")
def result() -> experiment.Result:
    tasks, base = experiment.build(7)
    return experiment.run(tasks, base)


def test_end_to_end_lora_improves_target_with_fewer_parameters(result: experiment.Result) -> None:
    assert result.lora_params < result.full_params
    assert result.verdict_lora.gains["tarefa_B"] > 0.5
    assert result.verdict_full.gains["tarefa_B"] > 0.0


def test_end_to_end_gate_catches_forgetting_in_both_methods(result: experiment.Result) -> None:
    assert "tarefa_A" in result.verdict_lora.regressions
    assert "tarefa_A" in result.verdict_full.regressions
    assert not result.verdict_lora.passed


def test_end_to_end_merge_matches_adapter_and_is_deterministic(result: experiment.Result) -> None:
    tasks, base = experiment.build(7)
    again = experiment.run(tasks, base)
    x = tasks.test_b_x
    np.testing.assert_allclose(result.merged.forward(x), result.lora.forward(x), atol=1e-12)
    np.testing.assert_array_equal(again.lora.forward(x), result.lora.forward(x))
