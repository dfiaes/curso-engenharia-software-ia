"""Juiz por regras: um critério binário com acordo observado (lote M06).

O juiz roteirizado decide por regras explícitas — o mecanismo é o mesmo
do juiz LLM (binário, um critério, evidência antes do veredito), sem
custo nem chamada externa. `calibrar` mede o acordo contra rótulos de
referência cuja origem deve ser documentada pelo chamador; abaixo do
limiar explícito, o juiz é rejeitado antes de qualquer uso.
"""

from __future__ import annotations

from collections.abc import Callable
from dataclasses import dataclass
from typing import Protocol


@dataclass(frozen=True, slots=True)
class Rotulo:
    """Caso com rótulo de referência; a origem é responsabilidade do chamador."""

    codigo: str
    justificativa: str
    rotulo_referencia: bool


class Judge(Protocol):
    """Juiz binário de um critério: evidência antes do veredito."""

    def julgar(self, codigo: str, justificativa: str) -> bool:
        """True = sustentada pelo código."""
        ...


class JuizDesalinhado(RuntimeError):
    """Acordo abaixo do limiar: este juiz não pode ser usado."""


Rule = Callable[[str, str], bool]


class JuizRoteirizado:
    """Juiz por regras: sustentada se alguma regra casa (código, just)."""

    def __init__(self, regras: tuple[Rule, ...], nome: str = "juiz-roteiro-1") -> None:
        self._regras = regras
        self.nome = nome

    def julgar(self, codigo: str, justificativa: str) -> bool:
        """Veredito binário com a regra que decidiu (evidência primeiro)."""
        return any(regra(codigo, justificativa) for regra in self._regras)


class JuizSempreSim:
    """Pior juiz possível: aprova tudo. Existe para ser rejeitado."""

    nome = "juiz-sempre-sim"

    def julgar(self, codigo: str, justificativa: str) -> bool:
        return True


def medir_acordo(juiz: Judge, rotulos: list[Rotulo], *, limiar: float) -> float:
    """Mede acordo agregado com rótulos de referência; não infere sua origem."""
    if not 0.0 <= limiar <= 1.0:
        raise ValueError("limiar deve estar entre 0 e 1")
    if not rotulos:
        raise ValueError("medir acordo exige ao menos um rótulo de referência")
    acertos = sum(
        1 for r in rotulos if juiz.julgar(r.codigo, r.justificativa) == r.rotulo_referencia
    )
    acordo = acertos / len(rotulos)
    if acordo < limiar:
        raise JuizDesalinhado(f"acordo {acordo:.0%} < limiar {limiar:.0%} — rubrica antes de uso")
    return acordo
