"""Replica com lag declarado em versoes e stale read por requisito.

Referencia executavel do Bloco 5.
Implementacao verbatim na folha B05-L. So STDLIB (dataclasses).
Lag em versoes, nunca em segundos de parede.
"""

from __future__ import annotations

from dataclasses import dataclass, field


class StaleRead(RuntimeError):
    """Replica atrasada para a versao exigida: tratar, nunca servir calado."""


@dataclass(frozen=True)
class VersaoDado:
    """Valor com a versao do primario que o confirmou."""

    versao: int
    payload: str


@dataclass
class ReplicaAtrasada:
    """Primario avanca; replica segue N versoes atras."""

    atraso_versoes: int
    historico: list[VersaoDado] = field(default_factory=list)

    def publicar(self, payload: str) -> int:
        """Confirma nova versao no primario; devolve o numero."""
        versao = len(self.historico) + 1
        self.historico.append(VersaoDado(versao, payload))
        return versao

    def ler_primaria(self) -> VersaoDado:
        """Leitura do primario: sempre a versao mais nova confirmada."""
        return self.historico[-1]

    def ler_replica(self) -> VersaoDado:
        """Leitura da replica: N versoes atras, ou a mais antiga disponivel."""
        indice = max(len(self.historico) - self.atraso_versoes - 1, 0)
        return self.historico[indice]

    def exigir_nova(self, versao_minima: int) -> VersaoDado:
        """Caminho exigente: replica velha levanta StaleRead com as versoes."""
        vista = self.ler_replica()
        if vista.versao < versao_minima:
            raise StaleRead(f"replica em v{vista.versao} exige ao menos v{versao_minima}")
        return vista
