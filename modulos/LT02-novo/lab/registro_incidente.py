"""Registro de incidente com hipotese antes de qualquer toque.

Referencia executavel do Bloco 6.
Implementacao verbatim na folha B06-L. So STDLIB (dataclasses).
Degradacao simulada; broker real e trilha BLOCKED.
"""

from __future__ import annotations

from dataclasses import dataclass, field


class HipoteseAusente(RuntimeError):
    """Observacao sem hipotese previa: toque sem pergunta declarada."""


@dataclass(frozen=True)
class Hipotese:
    """Suspeita com os dois sinais: o que confirma e o que refuta."""

    descricao: str
    sinal_esperado: str
    sinal_contrario: str


@dataclass(frozen=True)
class Observacao:
    """Um passo da eliminacao: o que viu e o que decidiu."""

    passo: str
    viu: str
    decide: str


@dataclass
class RegistroIncidente:
    """Invariantes, matriz, hipotese, timeline e vereditos."""

    invariantes: list[str]
    matriz_falhas: list[str]
    hipotese: Hipotese | None = None
    observacoes: list[Observacao] = field(default_factory=list)

    def declarar_hipotese(self, hipotese: Hipotese) -> None:
        """Fixa a pergunta antes de qualquer comando."""
        self.hipotese = hipotese

    def registrar_observacao(self, observacao: Observacao) -> None:
        """Acrescenta a timeline; sem hipotese levanta HipoteseAusente."""
        if self.hipotese is None:
            raise HipoteseAusente("declare a hipotese antes de observar")
        self.observacoes.append(observacao)

    def gerar_incident(self, causa: str, patch: str, residual: str) -> str:
        """Devolve o postmortem curto sem culpa, com os campos do bloco."""
        linhas = ["# incident", f"causa: {causa}", f"patch: {patch}", f"residual: {residual}"]
        assert self.hipotese is not None
        linhas.append(f"hipotese: {self.hipotese.descricao}")
        for observacao in self.observacoes:
            linhas.append(f"- {observacao.passo}: {observacao.viu} => {observacao.decide}")
        return "\n".join(linhas)
