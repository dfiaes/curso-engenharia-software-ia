"""Mini harness de avaliação: compara base e adaptado e age como gate de regressão."""

from __future__ import annotations

import math
from dataclasses import dataclass
from typing import Literal

from .mlp import MLP, Array, mse

Role = Literal["target", "guard"]


@dataclass(frozen=True)
class Suite:
    """Um conjunto de teste. `target` deve melhorar; `guard` não pode piorar além da tolerância."""

    name: str
    x: Array
    y: Array
    role: Role


@dataclass(frozen=True)
class Verdict:
    base: dict[str, float]
    new: dict[str, float]
    gains: dict[str, float]
    regressions: tuple[str, ...]
    target_failures: tuple[str, ...]

    @property
    def passed(self) -> bool:
        return not self.regressions and not self.target_failures


def evaluate(model: MLP, suites: list[Suite]) -> dict[str, float]:
    return {s.name: mse(model.forward(s.x), s.y) for s in suites}


def compare(
    base: MLP,
    new: MLP,
    suites: list[Suite],
    *,
    min_gain: float = 0.2,
    max_regression: float = 0.1,
) -> Verdict:
    """Gate: cada alvo precisa reduzir o erro em pelo menos `min_gain` (relativo) e cada guarda
    pode subir no máximo `max_regression` (relativo). Erro não finito reprova."""
    if min_gain < 0 or max_regression < 0:
        raise ValueError("limites devem ser >= 0")
    names = [s.name for s in suites]
    if len(set(names)) != len(names):
        raise ValueError("nomes de suíte duplicados")
    if not any(s.role == "target" for s in suites):
        raise ValueError("é preciso pelo menos uma suíte target")
    before, after = evaluate(base, suites), evaluate(new, suites)
    gains: dict[str, float] = {}
    regressions: list[str] = []
    target_failures: list[str] = []
    for s in suites:
        b, a = before[s.name], after[s.name]
        if not math.isfinite(a):
            gains[s.name] = float("-inf")
            (target_failures if s.role == "target" else regressions).append(s.name)
            continue
        gain = (b - a) / max(b, 1e-12)
        gains[s.name] = gain
        if s.role == "target" and gain < min_gain:
            target_failures.append(s.name)
        if s.role == "guard" and -gain > max_regression:
            regressions.append(s.name)
    return Verdict(before, after, gains, tuple(regressions), tuple(target_failures))


def format_verdict(v: Verdict) -> str:
    lines = [f"{'suite':<10}{'base':>10}{'novo':>10}{'ganho':>10}  estado"]
    for name, b in v.base.items():
        flag = (
            "REGRIDE" if name in v.regressions else "FALHA" if name in v.target_failures else "ok"
        )
        lines.append(f"{name:<10}{b:>10.4f}{v.new[name]:>10.4f}{v.gains[name]:>+10.1%}  {flag}")
    lines.append("GATE: " + ("APROVADO" if v.passed else "REPROVADO"))
    return "\n".join(lines)
