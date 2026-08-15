"""Seleção auditável de contexto sob orçamento."""

from dataclasses import dataclass


@dataclass(frozen=True, slots=True)
class ContextItem:
    name: str
    token_estimate: int
    relevance: float
    trust: float
    required: bool = False

    def __post_init__(self) -> None:
        if self.token_estimate <= 0:
            raise ValueError("token_estimate deve ser positivo")
        if not 0 <= self.relevance <= 1 or not 0 <= self.trust <= 1:
            raise ValueError("relevance e trust devem estar entre 0 e 1")

    @property
    def score(self) -> float:
        return (self.relevance * self.trust) / self.token_estimate


@dataclass(frozen=True, slots=True)
class ContextSelection:
    included: tuple[ContextItem, ...]
    omitted: tuple[ContextItem, ...]
    used_tokens: int
    budget: int


def select_context(items: list[ContextItem], budget: int) -> ContextSelection:
    if budget <= 0:
        raise ValueError("budget deve ser positivo")

    required = sorted((item for item in items if item.required), key=lambda item: item.name)
    required_cost = sum(item.token_estimate for item in required)
    if required_cost > budget:
        message = f"itens obrigatórios requerem {required_cost} tokens; orçamento é {budget}"
        raise ValueError(message)

    included = list(required)
    used = required_cost
    candidates = sorted(
        (item for item in items if not item.required),
        key=lambda item: (-item.score, item.name),
    )
    for item in candidates:
        if used + item.token_estimate <= budget:
            included.append(item)
            used += item.token_estimate

    included_names = {item.name for item in included}
    omitted = tuple(item for item in items if item.name not in included_names)
    return ContextSelection(tuple(included), omitted, used, budget)
