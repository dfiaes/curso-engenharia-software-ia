"""Degradacao simulada e runbook em ordem fixa.

Referencia executavel do Bloco 6.
Implementacao verbatim na folha B06-L. So STDLIB (dataclasses).
Semente reproduz a combinacao; invariantes nunca mudam com a semente.
"""

from __future__ import annotations

from dataclasses import dataclass, field


class OrdemViolada(RuntimeError):
    """Passo fora da ordem do runbook: conter, reconciliar, drenar."""


@dataclass
class DegradacaoSimulada:
    """As tres falhas do incidente, ligadas por semente declarada."""

    semente: int
    confirm_perdido: bool = False
    ponto_morte: str = ""
    upstream_ambiguo: bool = False
    ligada: bool = True

    def sortear(self) -> None:
        """Deriva a combinacao da semente, sem aleatoriedade de parede."""
        resto = self.semente % 3
        self.confirm_perdido = resto != 1
        self.upstream_ambiguo = resto != 0
        self.ponto_morte = ("antes-do-ack", "apos-efeito", "antes-do-efeito")[resto]

    def desligar(self) -> None:
        """Restauracao exige faults desligados antes do smoke."""
        self.confirm_perdido = False
        self.ponto_morte = ""
        self.upstream_ambiguo = False
        self.ligada = False


@dataclass
class Runbook:
    """Passos ordenados; cada um publica a verificacao que o libera."""

    contido: bool = False
    reconciliado: bool = False
    drenado: bool = False
    passos: list[str] = field(default_factory=list)

    def conter(self, verificacao: str) -> None:
        """Congela a amplificacao; primeiro passo obrigatorio."""
        self.contido = True
        self.passos.append(f"conter: {verificacao}")

    def reconciliar(self, verificacao: str) -> None:
        """Fecha unknowns por identidade; exige conter antes."""
        if not self.contido:
            raise OrdemViolada("reconcilie somente apos conter")
        self.reconciliado = True
        self.passos.append(f"reconciliar: {verificacao}")

    def drenar(self, verificacao: str) -> None:
        """Drena com limite; exige reconciliar antes."""
        if not self.reconciliado:
            raise OrdemViolada("drene somente apos reconciliar")
        self.drenado = True
        self.passos.append(f"drenar: {verificacao}")
