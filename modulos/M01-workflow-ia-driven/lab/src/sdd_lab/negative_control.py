"""Controle negativo: um gate só é útil se rejeitar um defeito conhecido."""

from collections.abc import Callable, Iterable
from dataclasses import dataclass


@dataclass(frozen=True)
class NegativeControlResult:
    baseline_passes: bool
    mutant_rejected: bool

    @property
    def strong(self) -> bool:
        return self.baseline_passes and self.mutant_rejected


def evaluate_negative_control(
    baseline: Callable[[int], int],
    mutant: Callable[[int], int],
    cases: Iterable[tuple[int, int]],
) -> NegativeControlResult:
    samples = tuple(cases)
    if not samples:
        raise ValueError("controle negativo exige ao menos um caso")
    baseline_passes = all(baseline(value) == expected for value, expected in samples)
    mutant_rejected = any(mutant(value) != expected for value, expected in samples)
    return NegativeControlResult(baseline_passes, mutant_rejected)
