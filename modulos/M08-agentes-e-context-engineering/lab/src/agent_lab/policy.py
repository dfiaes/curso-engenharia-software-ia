"""Política roteirizada: finge o modelo com determinismo (lote M08).

A política decide a próxima ação por roteiro — uma lista de passos que o
teste declara. O loop, os orçamentos, as ferramentas e a memória são
código real; só a "escolha semântica" é simulada. Trocar esta política
por um modelo real não muda nenhuma linha do loop.
"""

from __future__ import annotations

from dataclasses import dataclass, field


@dataclass(frozen=True, slots=True)
class ToolCall:
    name: str
    arguments: dict[str, object]
    id: str = "call-1"


@dataclass(frozen=True, slots=True)
class Final:
    text: str


Action = ToolCall | Final


@dataclass(slots=True)
class ScriptedPolicy:
    """Roteiro de ações: cada `proximo()` consome um passo do roteiro."""

    steps: list[Action] = field(default_factory=list)
    calls: int = 0

    def proximo(self, _historico: list[dict[str, object]]) -> Action:
        """Devolve a próxima ação roteirizada (ou Final padrão ao esgotar)."""
        self.calls += 1
        if self.steps:
            return self.steps.pop(0)
        return Final("concluído sem mais passos roteirizados")
